// app/(tabs)/(profile)/_layout.tsx

import { Stack } from "expo-router";
import { Platform, useColorScheme } from "react-native";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useColor } from "@/hooks/useColor";
import { Text } from "@/components/ui/text";

export default function ProfileLayout() {
  const theme = useColorScheme();
  const text = useColor("text");
  const background = useColor("background");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
        statusBarStyle: "light",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
          headerTitle: () =>
            Platform.OS === "android" ? (
              <Text variant="heading">Profile</Text>
            ) : undefined,
        }}
      />
    </Stack>
  );
}
