import React from "react";
import { Stack } from "expo-router";
import { Platform, Pressable, useColorScheme, View, Text } from "react-native";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useColor } from "@/hooks/useColor";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeLayout() {
  const theme = useColorScheme();
  const text = useColor("text");
  const link = useColor("link");
  const textMuted = useColor("textMuted");
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
          headerTitle: () =>
            Platform.OS === "android" ? (
              <View className="flex-row justify-between items-center">
                <View className="justify-center items-start">
                  <Text className="text-lg" style={{ color: text }}>
                    Croissix
                  </Text>
                  <Text
                    className="text-sm uppercase"
                    style={{ color: textMuted }}
                  >
                    AI - Powered • &#91;Beta&#93;
                  </Text>
                </View>
                <View style={{ backgroundColor: "" }}>
                  <Pressable
                    onPress={() => {}}
                    className="flex-row p-2 gap-2 items-center"
                  >
                    <LinearGradient
                      colors={["#4A5EB2", "#8b0ac8"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 15,
                        borderRadius: 7,
                      }}
                      className="flex-row p-2 gap-2 items-center"
                    >
                      <View>
                        <Ionicons name="sparkles" size={18} color="#4B91F7" />
                      </View>
                      <Text className="text-white text-md">Ask AI</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            ) : undefined,
        }}
      />
    </Stack>
  );
}

// 900ace
