import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  pinColor?: string;
}

interface MapViewWrapperProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers: MarkerData[];
  showsUserLocation?: boolean;
  style?: any;
}

export default function MapViewWrapper({ style }: MapViewWrapperProps) {
  return (
    <View style={[styles.placeholder, style]}>
      <Ionicons name="map-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.placeholderText}>Map available on mobile devices</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.white,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
  },
});
