// components/Map.web.tsx
import React from "react";
import { View, Text } from "react-native";

export default function MapView({ style, children }: any) {
  return (
    <View
      style={[
        {
          backgroundColor: "#e5e7eb",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ color: "#6b7280" }}>Map not available on web</Text>
    </View>
  );
}

export const Marker = ({ children }: any) => children ?? null;
