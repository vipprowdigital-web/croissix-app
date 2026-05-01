import { Stack } from "expo-router";
import { Platform, useColorScheme } from "react-native";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useColor } from "@/hooks/useColor";
import { Text } from "@/components/ui/text";
import React from "react";

export default function AnalyticsLayout() {
  const theme = useColorScheme();
  const text = useColor("text");
  const background = useColor("background");

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerTransparent: true,
        headerTintColor: text,
        headerBlurEffect: isLiquidGlassAvailable()
          ? undefined
          : theme === "dark"
            ? "systemMaterialDark"
            : "systemMaterialLight",
        headerStyle: {
          backgroundColor: isLiquidGlassAvailable()
            ? "transparent"
            : background,
        },
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        // options={
        // {
        // title: "Analytics",
        // headerTitle: () =>
        //   Platform.OS === "android" ? (
        //     <Text variant="heading">Analytics</Text>
        //   ) : undefined,
        // }
        // }
      />
    </Stack>
  );
}
