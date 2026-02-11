import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { getApiUrl } from "@/lib/query-client";
import MapViewWrapper from "@/components/MapViewWrapper";
import Colors from "@/constants/colors";
import { fetch } from "expo/fetch";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: donations, refetch } = useQuery({
    queryKey: ["/api/donations"],
    queryFn: async () => {
      const baseUrl = getApiUrl();
      const url = new URL("/api/donations", baseUrl);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    requestLocation();
  }, []);

  async function requestLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc);
      }
    } catch {}
  }

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  function handleDownloadZip() {
    const baseUrl = getApiUrl();
    const url = new URL("/api/download-zip", baseUrl);
    if (Platform.OS === "web") {
      window.open(url.toString(), "_blank");
    } else {
      import("expo-web-browser").then((WebBrowser) => {
        WebBrowser.openBrowserAsync(url.toString());
      });
    }
  }

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const foodCount = donations?.filter((d: any) => d.category === "food").length || 0;
  const clothesCount = donations?.filter((d: any) => d.category === "clothes").length || 0;

  const mapMarkers = (donations || [])
    .filter((d: any) => d.latitude && d.longitude)
    .map((d: any) => ({
      id: d.id,
      latitude: d.latitude,
      longitude: d.longitude,
      title: d.title,
      description: `${d.category} - ${d.donorName}`,
      pinColor: d.category === "food" ? Colors.primary : Colors.accent,
    }));

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.username || "Friend"}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={handleDownloadZip} style={styles.iconButton}>
              <Feather name="download" size={22} color={Colors.white} />
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.iconButton}>
              <Ionicons name="log-out-outline" size={22} color={Colors.white} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.headerMicrocopy}>
          Helping hands, stronger communities
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.cardsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/donate");
            }}
          >
            <LinearGradient
              colors={["#E8F5E9", "#C8E6C9"]}
              style={styles.cardGradient}
            >
              <View style={[styles.cardIconBg, { backgroundColor: Colors.primary }]}>
                <MaterialCommunityIcons name="gift-outline" size={28} color={Colors.white} />
              </View>
              <Text style={styles.cardTitle}>Donate</Text>
              <Text style={styles.cardDesc}>Share food or clothes with those in need</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/receive");
            }}
          >
            <LinearGradient
              colors={["#E3F2FD", "#BBDEFB"]}
              style={styles.cardGradient}
            >
              <View style={[styles.cardIconBg, { backgroundColor: Colors.accent }]}>
                <MaterialCommunityIcons name="hand-heart-outline" size={28} color={Colors.white} />
              </View>
              <Text style={styles.cardTitle}>Receive Help</Text>
              <Text style={styles.cardDesc}>Find nearby donors and reserve items</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="fast-food-outline" size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{foodCount}</Text>
            <Text style={styles.statLabel}>Food Available</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="shirt-outline" size={24} color={Colors.accent} />
            <Text style={styles.statNumber}>{clothesCount}</Text>
            <Text style={styles.statLabel}>Clothes Available</Text>
          </View>
        </View>

        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Live Donors Near You</Text>
          <View style={styles.mapContainer}>
            <MapViewWrapper
              initialRegion={{
                latitude: location?.coords.latitude || 37.78,
                longitude: location?.coords.longitude || -122.43,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              markers={mapMarkers}
            />
          </View>
        </View>

        <View style={styles.quoteCard}>
          <MaterialCommunityIcons name="format-quote-open" size={24} color={Colors.primaryLight} />
          <Text style={styles.quoteText}>
            "No one has ever become poor by giving." - Anne Frank
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  userName: {
    fontSize: 24,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
  },
  headerMicrocopy: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  cardGradient: {
    padding: 18,
    minHeight: 160,
    justifyContent: "center",
    gap: 10,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
  },
  mapSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    marginBottom: 12,
  },
  mapContainer: {
    borderRadius: 20,
    overflow: "hidden",
    height: 220,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    fontStyle: "italic" as const,
    lineHeight: 22,
  },
});
