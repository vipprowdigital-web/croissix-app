import { Stack } from "expo-router";
import { useColor } from "@/hooks/useColor";
import { useColorScheme } from "react-native";
// import { Text } from "@/components/ui/text";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React from "react";

export default function ReviewsLayout() {
  const theme = useColorScheme();
  const text = useColor("text");
  const background = useColor("background");

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
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
        // options={{
        //   title: "Settings",
        //   headerTitle: () =>
        //     Platform.OS === "android" ? (
        //       <Text variant="heading">Settings</Text>
        //     ) : undefined,
        // }}
      />
    </Stack>
  );
}
