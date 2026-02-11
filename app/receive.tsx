import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getApiUrl, queryClient } from "@/lib/query-client";
import MapViewWrapper from "@/components/MapViewWrapper";
import Colors from "@/constants/colors";
import { fetch } from "expo/fetch";

interface DonationItem {
  id: string;
  userId: string;
  category: "food" | "clothes";
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  availabilityStart: string | null;
  availabilityEnd: string | null;
  status: string;
  donorName: string;
  createdAt: string;
}

function DonationCard({
  item,
  onReserve,
  reserving,
}: {
  item: DonationItem;
  onReserve: (id: string) => void;
  reserving: boolean;
}) {
  const isFood = item.category === "food";

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardTop}>
        <View style={[cardStyles.categoryBadge, { backgroundColor: isFood ? "#E8F5E9" : "#E3F2FD" }]}>
          <Ionicons
            name={isFood ? "fast-food-outline" : "shirt-outline"}
            size={16}
            color={isFood ? Colors.primary : Colors.accent}
          />
          <Text style={[cardStyles.categoryText, { color: isFood ? Colors.primary : Colors.accent }]}>
            {isFood ? "Food" : "Clothes"}
          </Text>
        </View>
        <View style={cardStyles.donorRow}>
          <Ionicons name="person-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={cardStyles.donorName}>{item.donorName}</Text>
        </View>
      </View>

      <Text style={cardStyles.title}>{item.title}</Text>
      {item.description ? (
        <Text style={cardStyles.description} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={cardStyles.infoRow}>
        {item.availabilityStart && item.availabilityEnd && (
          <View style={cardStyles.infoChip}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={cardStyles.infoText}>
              {item.availabilityStart} - {item.availabilityEnd}
            </Text>
          </View>
        )}
        {item.latitude && item.longitude && (
          <View style={cardStyles.infoChip}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={cardStyles.infoText}>Nearby</Text>
          </View>
        )}
      </View>

      <View style={cardStyles.actionsRow}>
        <Pressable
          style={({ pressed }) => [cardStyles.reserveButton, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onReserve(item.id);
          }}
          disabled={reserving}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={cardStyles.reserveGradient}
          >
            {reserving ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="hand-heart" size={18} color={Colors.white} />
                <Text style={cardStyles.reserveText}>Reserve</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable style={cardStyles.contactButton}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.accent} />
        </Pressable>
        <Pressable style={cardStyles.contactButton}>
          <Ionicons name="call-outline" size={20} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<"all" | "food" | "clothes">("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [reservingId, setReservingId] = useState<string | null>(null);

  const { data: donations, isLoading, refetch } = useQuery<DonationItem[]>({
    queryKey: ["/api/donations"],
    queryFn: async () => {
      const baseUrl = getApiUrl();
      const url = new URL("/api/donations", baseUrl);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const reserveMutation = useMutation({
    mutationFn: async (donationId: string) => {
      setReservingId(donationId);
      await apiRequest("POST", "/api/reservations", { donationId });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
      Alert.alert("Reserved!", "You have successfully reserved this item. The donor will be notified.");
      setReservingId(null);
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to reserve");
      setReservingId(null);
    },
  });

  useEffect(() => {
    getLocation();
  }, []);

  async function getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch {}
  }

  const filtered = donations?.filter((d) => filter === "all" || d.category === filter) || [];

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const mapMarkers = filtered
    .filter((d) => d.latitude && d.longitude)
    .map((d) => ({
      id: d.id,
      latitude: d.latitude!,
      longitude: d.longitude!,
      title: d.title,
      description: `${d.donorName} | ${d.availabilityStart || ""} - ${d.availabilityEnd || ""}`,
      pinColor: d.category === "food" ? Colors.primary : Colors.accent,
    }));

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Find Help</Text>
        <Pressable
          onPress={() => {
            setViewMode(viewMode === "list" ? "map" : "list");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.viewToggle}
        >
          <Ionicons name={viewMode === "list" ? "map-outline" : "list-outline"} size={22} color={Colors.text} />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {(["all", "food", "clothes"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            {f === "food" && <Ionicons name="fast-food-outline" size={16} color={filter === f ? Colors.white : Colors.textSecondary} />}
            {f === "clothes" && <Ionicons name="shirt-outline" size={16} color={filter === f ? Colors.white : Colors.textSecondary} />}
            {f === "all" && <Ionicons name="apps-outline" size={16} color={filter === f ? Colors.white : Colors.textSecondary} />}
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "All" : f === "food" ? "Food" : "Clothes"}
            </Text>
          </Pressable>
        ))}
      </View>

      {viewMode === "map" ? (
        <View style={styles.mapContainer}>
          <MapViewWrapper
            initialRegion={{
              latitude: location?.latitude || 37.78,
              longitude: location?.longitude || -122.43,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            markers={mapMarkers}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DonationCard
              item={item}
              onReserve={(id) => reserveMutation.mutate(id)}
              reserving={reservingId === item.id}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + webBottomInset + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filtered.length > 0}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="hand-heart-outline" size={56} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No donations available</Text>
                <Text style={styles.emptySubtext}>
                  Check back later. Generous hearts are always at work.
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
  },
  donorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  donorName: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
  },
  title: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  reserveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  reserveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderRadius: 12,
  },
  reserveText: {
    fontSize: 14,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 22,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
});
