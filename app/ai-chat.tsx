import { useColor } from "@/hooks/useColor";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  // FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetch as expoFetch } from "expo/fetch";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FRONTEND_URL } from "@/config/.env";
import SubscriptionGate from "@/components/SubscriptionGate";
import { useSubscription } from "@/hooks/useSubscription";
import { useFreeTrialStatus } from "@/hooks/useFreeTrialStatus";
import { router } from "expo-router";

const marketingTopics = [
  {
    id: "1",
    title: "How do I rank #1 on Google for my local business?",
    icon: "search-outline",
    color: "#2563eb",
  },
  {
    id: "2",
    title: "Best Google Ads strategy for ₹20,000/month budget",
    icon: "logo-google",
    color: "#ea4335",
  },
  {
    id: "3",
    title: "How to get more Google reviews quickly?",
    icon: "star-outline",
    color: "#facc15",
  },
  {
    id: "4",
    title: "Instagram growth strategy for 10K followers",
    icon: "logo-instagram",
    color: "#e1306c",
  },
  {
    id: "5",
    title: "Improve my Google Business Profile score",
    icon: "business-outline",
    color: "#16a34a",
  },
  {
    id: "6",
    title: "Facebook Ads vs Google Ads — which is better?",
    icon: "logo-facebook",
    color: "#1877f2",
  },
  {
    id: "7",
    title: "SEO basics for a beginner small business owner",
    icon: "book-outline",
    color: "#9333ea",
  },
  {
    id: "8",
    title: "Set up Meta retargeting for website visitors",
    icon: "repeat-outline",
    color: "#f97316",
  },
];

const SYSTEM_PROMPT = `You are Croissix AI — an elite SEO and Digital Marketing expert with 10+ years of hands-on experience helping businesses grow online.

Your deep expertise covers:
- Google Business Profile optimisation and Local SEO ranking
- Google Ads: Search, Display, Shopping, YouTube, Performance Max
- Facebook and Instagram Ads (Meta Ads Manager, pixel setup, retargeting)
- SEO: technical SEO, on-page optimisation, link building, keyword research
- Content marketing, copywriting, and conversion-focused landing pages
- Social media growth: Instagram, Facebook, LinkedIn, YouTube
- Google Analytics 4, Search Console, Meta Pixel, tag management
- E-commerce growth, Shopify/WooCommerce optimisation, CRO
- Brand building, online reputation management, review strategies
- Email marketing, automation, and customer retention

Your style:
- Confident, direct, results-focused with specific numbers and tactics
- Concrete step-by-step advice with clear action items
- Reference real tools: Semrush, Ahrefs, Google Ads, Meta Ads Manager etc
- Format responses with headers, bullets, and bold for scannability
- Always end with a follow-up question or next step`;

export default function AIChat() {
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // const flatListRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const genId = () => Math.random().toString(36).slice(2);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const uid = genId(),
        aiId = genId();
      const userMsg = {
        id: uid,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };
      const aiMsg = {
        id: aiId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setInput("");
      setLoading(true);

      try {
        abortRef.current = new AbortController();
        console.log("Inside send...");

        // 2. Use the expoFetch
        const res = await expoFetch(`${FRONTEND_URL}/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: text.trim() },
            ],
          }),
        });
        console.log("Response: ", res);

        if (!res.ok) throw new Error("API error");

        if (!res.body) {
          throw new Error(
            "No response body found. Check if your server is sending a stream.",
          );
        }

        // 3. Expo's fetch body is a ReadableStream!
        const reader = res.body.getReader();
        const decoder = new TextDecoder(); // Now built into Expo 54 globally
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          console.log("Chunk: ", chunk);

          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                full += delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiId ? { ...m, content: full } : m,
                  ),
                );
              }
            } catch (e) {
              /* partial chunk */
            }
          }
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId
                ? { ...m, content: "Error: Could not reach the AI." }
                : m,
            ),
          );
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, isStreaming: false } : m)),
        );
        setLoading(false);
      }
    },
    [loading, messages],
  );

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const { isActive, isLoading: subLoading, isExpired } = useSubscription();
  const { trialExpired } = useFreeTrialStatus();

  // useEffect(() => {
  //   if (subLoading) return;
  // }, [isActive, isExpired, trialExpired, subLoading]);
  if (subLoading) {
    return <ActivityIndicator color={link} />;
  }
  const hasValidSubscription = isActive && !isExpired;
  const canAccess = hasValidSubscription || !trialExpired;
  if (!canAccess)
    return (
      <View className="flex-1 justify-center">
        <Pressable
          className="absolute top-20 left-10 p-3 rounded-full"
          style={{ backgroundColor: textMuted + "30" }}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" color="white" size={18} />
        </Pressable>
        <SubscriptionGate />
      </View>
    );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 180, paddingTop: 20 }}
        >
          {/* Header Section */}
          <View className="flex-row items-center justify-between px-7 mt-12">
            <View className="flex-row items-center gap-5">
              <Pressable
                className="p-3 rounded-full"
                style={{ backgroundColor: textMuted + "30" }}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={18} color={textMuted} />
              </Pressable>
              <Ionicons name="sparkles" size={18} color={link} />
              <View>
                <Text className="text-md font-bold" style={{ color: text }}>
                  Croissix AI
                </Text>
                <Text className="text-sm" style={{ color: textMuted }}>
                  SEO & Marketing Expert
                </Text>
              </View>
            </View>
            {messages.length !== 0 && (
              <Pressable
                className="flex-row gap-2 rounded-xl items-center px-3 py-2"
                style={{ backgroundColor: textMuted + "30" }}
                onPress={() => {
                  setMessages([]);
                }}
              >
                <Ionicons name="add" size={18} color={textMuted} />
                <Text className="" style={{ color: textMuted }}>
                  New Chat
                </Text>
              </Pressable>
            )}
          </View>

          {messages.length === 0 ? (
            <>
              {/* Welcome Section */}
              <View className="mt-16 justify-center items-center px-7 gap-3">
                <Ionicons name="sparkles" size={30} color={link} />
                <Text className="font-bold text-lg" style={{ color: text }}>
                  How can I help you?
                </Text>
                <Text className="text-center px-5" style={{ color: textMuted }}>
                  Ask me anything about SEO, Google Ads, Meta Ads, or growing
                  your business online.
                </Text>
              </View>

              {/* Topics List */}
              <View className="gap-2 px-10 mt-10">
                {marketingTopics.map((topic) => (
                  <Pressable
                    key={topic.id}
                    onPress={() => send(topic.title)}
                    className="rounded-xl border flex-row items-center justify-between px-5 py-3 w-full"
                    style={{ borderColor: link, backgroundColor: `${link}15` }}
                  >
                    <View
                      style={{ backgroundColor: `${topic.color}20` }}
                      className="w-10 h-10 justify-center items-center rounded-full"
                    >
                      <Ionicons
                        name={topic.icon as any}
                        size={18}
                        color={topic.color}
                      />
                    </View>
                    <Text className="text-sm w-3/4" style={{ color: text }}>
                      {topic.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <View className="px-5 mt-10 gap-6">
              {messages.map((m) => (
                <>
                  <View
                    key={m}
                    className="flex-row gap-2"
                    style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                    }}
                  >
                    <View
                      className="justify-center items-center rounded-full p-2"
                      style={{ backgroundColor: link }}
                    >
                      <Ionicons
                        name="sparkles-outline"
                        color="white"
                        size={15}
                      />
                    </View>
                    <Text className="font-bold" style={{ color: text }}>
                      {m.role === "user" ? "You" : "Croissix AI"}
                    </Text>
                    {m.role === "assistant" && (
                      <View
                        className="px-2 justify-center rounded-2xl border"
                        style={{
                          backgroundColor: textMuted + "30",
                          borderColor: text + "30",
                        }}
                      >
                        <Text className="text-xs" style={{ color: text }}>
                          SEO Expert
                        </Text>
                      </View>
                    )}
                  </View>
                  <View
                    key={m.id}
                    style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                    }}
                  >
                    <View
                      className="px-4 py-3 rounded-2xl"
                      style={{
                        backgroundColor:
                          m.role === "user" ? link : `${textMuted}20`,
                        borderBottomRightRadius: m.role === "user" ? 4 : 20,
                        borderBottomLeftRadius: m.role === "assistant" ? 4 : 20,
                      }}
                    >
                      <Text
                        style={{
                          color: m.role === "user" ? "white" : text,
                          fontSize: 15,
                          lineHeight: 22,
                        }}
                      >
                        {m.content || (m.isStreaming ? "..." : "")}
                      </Text>
                    </View>
                  </View>
                </>
              ))}
            </View>
          )}
        </ScrollView>

        <View
          className="mx-7 pb-8 pt-4 absolute bottom-8 left-0 right-0 rounded-2xl border px-4 items-start"
          style={{ backgroundColor: primaryForeground, borderColor: link }}
        >
          <View className="py-2 w-full" style={{ minHeight: 50 }}>
            <TextInput
              multiline
              placeholder="Ask Croissix AI..."
              placeholderTextColor={textMuted}
              style={{ color: text, textAlignVertical: "top" }}
              onChangeText={setInput}
              value={input}
              cursorColor={link}
              editable={!loading}
            />
          </View>
          <View className="flex-row justify-between items-center w-full">
            <View
              className="flex-row gap-2 rounded-2xl px-3 py-1 items-center border"
              style={{
                backgroundColor: `${textMuted}30`,
                borderColor: textMuted,
              }}
            >
              <Ionicons name="sparkles" size={10} color={text} />
              <Text className="text-sm font-semibold" style={{ color: text }}>
                SEO Expert
              </Text>
            </View>

            <Pressable
              onPress={() => send(input)}
              disabled={loading}
              className="p-2 rounded-full"
              style={{ backgroundColor: loading ? textMuted : link }}
            >
              <Ionicons
                name={loading ? "hourglass-outline" : "send"}
                size={18}
                color="white"
              />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
