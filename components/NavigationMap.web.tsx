import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface NavigationMapProps {
  donorLocation: { latitude: number; longitude: number };
  receiverLocation: { latitude: number; longitude: number };
  donorName: string;
  style?: any;
}

export default function NavigationMap({ donorName, style }: NavigationMapProps) {
  return (
    <View style={[styles.placeholder, style]}>
      <Ionicons name="navigate-outline" size={56} color={Colors.primary} />
      <Text style={styles.title}>Live Navigation</Text>
      <Text style={styles.subtitle}>Navigating to {donorName}</Text>
      <Text style={styles.note}>Full map navigation is available on mobile devices</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0F9F4",
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  note: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 250,
  },
});
