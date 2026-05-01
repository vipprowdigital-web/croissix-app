import { useColor } from "@/hooks/useColor";
import { AlertCircle, ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

export function NotConnectedBanner({ isDark }: { isDark: boolean }) {
  const router = useRouter();

  const onGo = () => {
    router.push("/(tabs)/(profile)");
  };

  return (
    <Pressable
      onPress={onGo}
      className={`mx-7 my-3 p-4 rounded-2xl border flex-row items-center justify-between
        ${isDark ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"}`}
    >
      {/* Left side */}
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3">
          <AlertCircle size={18} color={useColor("yellow")} />
        </View>

        <Text
          className="text-base font-bold"
          style={{ color: useColor("text") }}
        >
          Connect Google Business
        </Text>
      </View>

      {/* Right arrow */}
      <ChevronRight size={16} color={useColor("textMuted")} />
    </Pressable>
  );
}
