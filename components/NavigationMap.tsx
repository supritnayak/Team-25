import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface NavigationMapProps {
  donorLocation: { latitude: number; longitude: number };
  receiverLocation: { latitude: number; longitude: number };
  donorName: string;
  style?: any;
}

export default function NavigationMap({
  donorLocation,
  receiverLocation,
  donorName,
  style,
}: NavigationMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [donorLocation, receiverLocation],
        {
          edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
          animated: true,
        }
      );
    }
  }, [donorLocation, receiverLocation]);

  const midLat = (donorLocation.latitude + receiverLocation.latitude) / 2;
  const midLng = (donorLocation.longitude + receiverLocation.longitude) / 2;
  const latDelta = Math.abs(donorLocation.latitude - receiverLocation.latitude) * 1.8 || 0.02;
  const lngDelta = Math.abs(donorLocation.longitude - receiverLocation.longitude) * 1.8 || 0.02;

  const routePoints = generateCurvedRoute(donorLocation, receiverLocation);

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={{
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      }}
      showsUserLocation
    >
      <Marker
        coordinate={donorLocation}
        title={donorName}
        description="Donor Location"
        pinColor={Colors.primary}
      />

      <Marker
        coordinate={receiverLocation}
        title="Your Location"
        description="Receiver"
        pinColor={Colors.accent}
      />

      <Polyline
        coordinates={routePoints}
        strokeColor={Colors.primary}
        strokeWidth={4}
        lineDashPattern={[0]}
      />
    </MapView>
  );
}

function generateCurvedRoute(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
) {
  const points: { latitude: number; longitude: number }[] = [];
  const steps = 30;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = start.latitude + (end.latitude - start.latitude) * t;
    const lng = start.longitude + (end.longitude - start.longitude) * t;

    const offset = Math.sin(t * Math.PI) * 0.002;
    points.push({
      latitude: lat + offset * 0.5,
      longitude: lng + offset,
    });
  }

  return points;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
