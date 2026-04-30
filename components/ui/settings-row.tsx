import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColor } from "@/hooks/useColor";
import { Href, useRouter } from "expo-router";

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  trailing?: React.ReactNode;
  onPress?: Href | (() => void);
}

export default function SettingsRow({
  icon,
  iconColor,
  label,
  trailing,
  onPress,
}: SettingsRowProps) {
  const textMuted = useColor("textMuted");
  const text = useColor("text");
  const router = useRouter();
  const handlePress = () => {
    if (typeof onPress === "function") {
      onPress();
    } else if (onPress) {
      router.push(onPress);
    }
  };
  return (
    <Pressable style={styles.row} onPress={handlePress}>
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: useColor("link"),
          padding: 7,
          borderRadius: 6,
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={20} color="white" />
      </View>
      <Text style={{ color: text }} className="flex-1 text-md">
        {label}
      </Text>
      {trailing && (
        <View style={styles.trailing}>
          <Text className="capitalize" style={{ color: textMuted }}>
            {trailing}
          </Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
  },

  trailing: {
    marginLeft: 8,
  },
});
