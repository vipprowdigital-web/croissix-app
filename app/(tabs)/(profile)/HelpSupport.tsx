import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColor } from "@/hooks/useColor";
import { helpSupport } from "../(home)/seed";
import { AccordionItem } from "@/components/ui/accordian-item";

export default function HelpSupport() {
  const router = useRouter();
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const [active, setActive] = useState("All");
  const faqs = helpSupport;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    return faqs
      .map((category) => {
        const matchedFaqs = category.faqs.filter(
          (faq) =>
            faq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.desc.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        return { ...category, faqs: matchedFaqs };
      })
      .filter((category) => {
        const matchesTab = active === "All" || category.title === active;
        const hasVisibleFaqs = category.faqs.length > 0;

        return matchesTab && hasVisibleFaqs;
      });
  }, [active, searchQuery, faqs]);

  return (
    <ScrollView className="flex-1 px-4">
      {/* Header */}
      <View className="flex-row items-center mb-6 mt-4">
        <Pressable
          onPress={() => router.back()}
          className="p-2 rounded-xl mr-4"
        >
          <Ionicons name="arrow-back" size={20} color={link} />
        </Pressable>
        <Text className="text-2xl font-black " style={{ color: text }}>
          Help & Support
        </Text>
      </View>

      {/* Search Bar */}
      <View className="rounded-2xl flex-row items-center px-4 mb-6">
        <Feather name="search" size={18} color={textMuted} />
        <TextInput
          placeholder="Search help articles..."
          className="ml-3 flex-1 py-2"
          placeholderTextColor={textMuted}
          cursorColor={link}
          style={{ color: text }}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={textMuted} />
          </Pressable>
        )}
      </View>

      {/* Contact Cards */}
      <View className="flex-row justify-between mb-8">
        <View className="rounded-3xl p-5 w-[48%] shadow-lg">
          <View
            className="w-10 h-10 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: link + "60" }}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={text} />
          </View>
          <Text className="font-bold text-lg" style={{ color: text }}>
            Live Chat
          </Text>
          <Text className="text-sm" style={{ color: textMuted }}>
            Avg. reply in 5 min
          </Text>
        </View>

        <Pressable
          className="rounded-3xl p-5 w-[48%]"
          onPress={() => Linking.openURL("mailto:support@vipprow.com")}
        >
          <View
            className="w-10 h-10 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: link + "60" }}
          >
            <Ionicons name="mail" size={20} color={text} />
          </View>
          <Text className="font-bold text-lg" style={{ color: text }}>
            Email Us
          </Text>
          <Text className="text-sm" style={{ color: textMuted }}>
            support@vipprow.com
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-6">
        {["All", "Getting Started", "Analytics", "Reviews"].map((cat) => (
          <Pressable
            key={cat}
            className="px-4 py-2 rounded-xl mr-1"
            style={{
              backgroundColor: active === cat ? link : "transparent",
            }}
            onPress={() => setActive(cat)}
          >
            <Text
              className="font-bold"
              style={{ color: active === cat ? "white" : textMuted }}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* FAQ Category */}
      {filteredFaqs.length > 0 ? (
        filteredFaqs.map((cat) => (
          <View
            key={cat.title}
            className="rounded-3xl mb-6 p-4 border"
            style={{ borderColor: link + "30" }}
          >
            <View className="flex-row gap-3 mb-3 pl-2">
              <Ionicons size={18} name={cat.icon as any} color={link} />
              <Text style={{ color: text }} className="font-bold">
                {cat.title}
              </Text>
            </View>
            <View>
              {cat.faqs.map((faq) => (
                <AccordionItem
                  key={faq.title}
                  title={faq.title}
                  desc={faq.desc}
                />
              ))}
            </View>
          </View>
        ))
      ) : (
        <View className="items-center mt-10">
          <Ionicons name="search-outline" size={48} color={textMuted} />
          <Text className="mt-4 font-bold" style={{ color: textMuted }}>
            No results found for &quot;{searchQuery}&quot;
          </Text>
        </View>
      )}

      <Pressable onPress={() => {}}></Pressable>
    </ScrollView>
  );
}
