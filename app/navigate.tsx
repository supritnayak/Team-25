import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { getApiUrl } from "@/lib/query-client";
import NavigationMap from "@/components/NavigationMap";
import Colors from "@/constants/colors";
import { fetch } from "expo/fetch";

export default function NavigateScreen() {
  const insets = useSafeAreaInsets();
  const { donationId } = useLocalSearchParams<{ donationId: string }>();
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiverLocation, setReceiverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eta, setEta] = useState<string>("Calculating...");
  const [distance, setDistance] = useState<string>("--");

  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  useEffect(() => {
    loadData();
  }, [donationId]);

  async function loadData() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setReceiverLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } else {
        setReceiverLocation({ latitude: 37.775, longitude: -122.418 });
      }

      if (donationId) {
        const baseUrl = getApiUrl();
        const url = new URL(`/api/donations/${donationId}/details`, baseUrl);
        const res = await fetch(url.toString(), { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setDonation(data);

          if (data.latitude && data.longitude) {
            const dist = calculateDistance(
              receiverLocation?.latitude || 37.775,
              receiverLocation?.longitude || -122.418,
              data.latitude,
              data.longitude
            );
            setDistance(dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`);
            const etaMin = Math.max(2, Math.round(dist * 3));
            setEta(`${etaMin} min`);
          }
        }
      }
    } catch (e) {
      console.log("Error loading navigation data:", e);
    }
    setLoading(false);
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function openExternalNavigation() {
    if (!donation?.latitude || !donation?.longitude) return;
    const lat = donation.latitude;
    const lng = donation.longitude;
    const label = encodeURIComponent(donation.title || "Donor");

    if (Platform.OS === "ios") {
      Linking.openURL(`maps:0,0?q=${label}@${lat},${lng}`);
    } else if (Platform.OS === "android") {
      Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${label})`);
    } else {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    }
  }

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Setting up navigation...</Text>
      </View>
    );
  }

  const donorLoc = donation?.latitude && donation?.longitude
    ? { latitude: donation.latitude, longitude: donation.longitude }
    : { latitude: 37.785, longitude: -122.41 };

  const recLoc = receiverLocation || { latitude: 37.775, longitude: -122.418 };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.topTitle}>Live Navigation</Text>
        <Pressable onPress={openExternalNavigation} style={styles.externalButton}>
          <Ionicons name="open-outline" size={22} color={Colors.white} />
        </Pressable>
      </View>

      <View style={styles.mapContainer}>
        <NavigationMap
          donorLocation={donorLoc}
          receiverLocation={recLoc}
          donorName={donation?.donorName || "Donor"}
        />
      </View>

      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + webBottomInset + 16 }]}>
        <View style={styles.handleBar} />

        <View style={styles.tripInfo}>
          <Animated.View style={[styles.liveDot, pulseStyle]}>
            <View style={styles.liveDotInner} />
          </Animated.View>
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Ionicons name="time-outline" size={22} color={Colors.primary} />
            <Text style={styles.infoValue}>{eta}</Text>
            <Text style={styles.infoLabel}>ETA</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoBlock}>
            <Ionicons name="navigate-outline" size={22} color={Colors.accent} />
            <Text style={styles.infoValue}>{distance}</Text>
            <Text style={styles.infoLabel}>Distance</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoBlock}>
            <Ionicons name={donation?.category === "food" ? "fast-food-outline" : "shirt-outline"} size={22} color={Colors.warm} />
            <Text style={styles.infoValue}>{donation?.category === "food" ? "Food" : "Clothes"}</Text>
            <Text style={styles.infoLabel}>Type</Text>
          </View>
        </View>

        <View style={styles.donorCard}>
          <View style={styles.donorAvatar}>
            <Ionicons name="person" size={24} color={Colors.white} />
          </View>
          <View style={styles.donorInfo}>
            <Text style={styles.donorName}>{donation?.donorName || "Donor"}</Text>
            <Text style={styles.donorDetail}>{donation?.title || "Donation"}</Text>
            {donation?.availabilityStart && donation?.availabilityEnd && (
              <Text style={styles.donorTime}>
                Available: {donation.availabilityStart} - {donation.availabilityEnd}
              </Text>
            )}
          </View>
          <View style={styles.donorActions}>
            <Pressable
              style={styles.callButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="call" size={20} color={Colors.white} />
            </Pressable>
            <Pressable
              style={styles.chatButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="chatbubble" size={20} color={Colors.accent} />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.directionsButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            openExternalNavigation();
          }}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.directionsGradient}
          >
            <Ionicons name="navigate" size={20} color={Colors.white} />
            <Text style={styles.directionsText}>Open in Maps</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  externalButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  tripInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  liveDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  liveDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.success,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  infoBlock: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  infoValue: {
    fontSize: 18,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
  },
  donorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  donorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  donorInfo: {
    flex: 1,
    gap: 2,
  },
  donorName: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  donorDetail: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  donorTime: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
  },
  donorActions: {
    flexDirection: "row",
    gap: 8,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  directionsButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  directionsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
    borderRadius: 14,
  },
  directionsText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
});
