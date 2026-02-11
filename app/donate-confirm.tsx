import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Colors from "@/constants/colors";

export default function DonateConfirmScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset + 40 }]}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.iconContainer}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          style={styles.iconGradient}
        >
          <MaterialCommunityIcons name="check" size={56} color={Colors.white} />
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.textContainer}>
        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.subtitle}>Your donation has been posted successfully</Text>
        <Text style={styles.microcopy}>
          Your kindness matters. Someone in need will find your generous offer soon.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>You can update your availability anytime from the dashboard</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>Your location helps receivers find you nearby</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>You'll be notified when someone reserves your donation</Text>
        </View>
      </Animated.View>

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + webBottomInset + 16 }]}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace("/dashboard");
          }}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryGradient}
          >
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace("/donate");
          }}
        >
          <Text style={styles.secondaryButtonText}>Donate More</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 28,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  microcopy: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.accent,
  },
});
