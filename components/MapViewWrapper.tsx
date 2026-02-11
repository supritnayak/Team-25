import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

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

export default function MapViewWrapper({
  initialRegion,
  markers,
  showsUserLocation = true,
  style,
}: MapViewWrapperProps) {
  return (
    <MapView
      style={[styles.map, style]}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title={m.title}
          description={m.description}
          pinColor={m.pinColor}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
