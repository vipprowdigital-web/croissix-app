import { useColor } from "@/hooks/useColor";
import { View, ScrollView, Text, Pressable, Linking } from "react-native";
import { privacyPolicies, termsAndConditions } from "../(home)/seed";
import { AccordionItem } from "@/components/ui/accordian-item";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

export default function Policies() {
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const { type } = useLocalSearchParams();
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy Policies" : "Terms & Conditions";
  return (
    <View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header Section */}
        <View className="flex-row gap-4">
          <Pressable onPress={() => router.back()}>
            <View
              className="p-2 rounded-xl border"
              style={{ backgroundColor: link + "20", borderColor: link + "40" }}
            >
              <Ionicons name="chevron-back" size={20} color={link} />
            </View>
          </Pressable>
          <View className="mb-6">
            <Text className="text-xl font-bold" style={{ color: text }}>
              {title || "Policies"}
            </Text>
            <Text className="text-sm" style={{ color: textMuted }}>
              Updated March 1, 2026
            </Text>
          </View>
        </View>

        {/* Highlighted Banner */}
        <View
          className="p-4 rounded-2xl flex-row items-center mb-6 border"
          style={{
            backgroundColor: primaryForeground,
            borderColor: link + "50",
          }}
        >
          <View
            className="p-3 rounded-2xl mr-4"
            style={{ backgroundColor: link + "50" }}
          >
            <Ionicons name="shield" size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-lg" style={{ color: text }}>
              Your data is yours
            </Text>
            <Text className="opacity-70" style={{ color: textMuted }}>
              We never sell or share your personal information
            </Text>
          </View>
        </View>

        {/* Dynamic List */}
        {isPrivacy
          ? privacyPolicies.map((item) => (
              <AccordionItem
                key={item.id}
                title={item.title}
                icon={item.icon}
                desc={item.desc}
                color={item.color}
              />
            ))
          : termsAndConditions.map((item) => (
              <AccordionItem
                key={item.id}
                title={item.title}
                icon={item.icon}
                desc={item.desc}
                color={item.color}
              />
            ))}

        <View
          className="p-4 rounded-2xl flex-row items-center mb-6 border"
          style={{
            backgroundColor: primaryForeground,
            borderColor: link + "50",
          }}
        >
          <View className="flex-1">
            <Text className="font-bold text-lg" style={{ color: text }}>
              Questions about privacy?
            </Text>
            <Text className="opacity-70 text-sm" style={{ color: textMuted }}>
              Contact our Data Protection Office at any time.
            </Text>
            <Pressable
              onPress={() => Linking.openURL("mailto:privacy@vipprow.com")}
              className="mt-2"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="open-outline" color={link} size={20} />
                <Text className="font-bold" style={{ color: link }}>
                  privacy@vipprow.com
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
