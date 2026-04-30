import PaymentWebView from "@/components/PaymentWebView";
import { useColor } from "@/hooks/useColor";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { RefreshCw } from "lucide-react-native";
import React, { useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";

export default function SubscriptionGate() {
  const text = useColor("text");
  const link = useColor("link");
  const textMuted = useColor("textMuted");
  const [showPayment, setShowPayment] = useState(false);
  const router = useRouter();
  // const primaryForeground = useColor("primaryForeground");
  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    console.log("✅ Payment success called");
    // Wait for refetch then check
    setTimeout(async () => {
      console.log("⏰ Navigating to home...");
      router.replace("/(tabs)/(home)");
    }, 1500);
  };
  return (
    <View className="px-7">
      <View className="items-center mt-6 mb-4">
        <View
          className="px-4 py-1.5 rounded-3xl flex-row items-center border"
          style={{ backgroundColor: link + "30", borderColor: link + "40" }}
        >
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={14}
            color={link}
          />
          <Text
            className="font-bold text-xs ml-1 uppercase tracking-tighter"
            style={{ color: link }}
          >
            3-Day Free Trial
          </Text>
        </View>
      </View>

      <View className="items-center mb-8">
        <Text
          className="text-3xl font-black text-center leading-tight"
          style={{ color: text }}
        >
          Grow your Google
        </Text>
        <Text
          className="text-3xl font-black text-center leading-tight"
          style={{ color: link }}
        >
          Business ranking
        </Text>
        <Text className="text-sm mt-3 font-medium" style={{ color: textMuted }}>
          AI-powered GBP analytics — one simple plan
        </Text>
      </View>

      <View
        className="border-2 rounded-[32px] p-6 mb-6"
        style={{ backgroundColor: link + "30", borderColor: link + "30" }}
      >
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <View
              className="p-3 rounded-2xl mr-3"
              style={{ backgroundColor: link + "30" }}
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={28}
                color="white"
              />
            </View>
            <View>
              <View className="flex-row items-center">
                <Text
                  className="text-xl font-bold mr-2"
                  style={{ color: text }}
                >
                  Croissix
                </Text>
                <View
                  className="px-3 py-1 rounded-2xl"
                  style={{ backgroundColor: link }}
                >
                  <Text className="text-xs font-bold uppercase text-white">
                    Popular
                  </Text>
                </View>
              </View>
              {/* <Text className="text-xs mt-1" style={{ color: textMuted }}>
                1 location · 5 posts/mo · 30-day data
              </Text> */}
            </View>
          </View>
          <View className="items-end">
            <View className="flex-row items-start gap-1">
              <Text className="font-bold text-sm mt-1" style={{ color: link }}>
                ₹
              </Text>
              <Text className="text-3xl font-black" style={{ color: text }}>
                599
              </Text>
            </View>
            <Text className="text-xs font-bold" style={{ color: textMuted }}>
              per month
            </Text>
          </View>
        </View>

        <View
          className="h-[1px] mb-6"
          style={{ backgroundColor: link + "30" }}
        />

        <View className="flex-row flex-wrap justify-between items-start">
          <FeatureItem
            label="1 Google Business Profile"
            active
            activeColor={link}
            textColor={text}
          />
          <FeatureItem
            label="Analytics dashboard"
            active
            activeColor={link}
            textColor={text}
          />
          <FeatureItem
            label="Review monitoring"
            active
            activeColor={link}
            textColor={text}
          />
          <FeatureItem
            label="AI auto-review replies"
            active
            activeColor={link}
            textColor={text}
          />
          <FeatureItem
            label="AI insights"
            active
            activeColor={link}
            textColor={text}
          />
          <FeatureItem
            label="Google Photos Management"
            active
            activeColor={link}
            textColor={text}
          />
        </View>
      </View>

      <View
        className="rounded-2xl p-4 flex-row items-center justify-center mb-4 border"
        style={{ backgroundColor: link + "30", borderColor: link + "30" }}
      >
        <Ionicons name="shield-checkmark-outline" size={18} color={link} />
        <Text className="font-bold text-xs ml-2" style={{ color: link }}>
          3-day free trial{" "}
          <Text className="font-normal">· Cancel anytime · No setup fees</Text>
        </Text>
      </View>

      {/* Already subscribed — button disabled */}
      <TouchableOpacity
        activeOpacity={0.8}
        className="rounded-3xl py-5 flex-row items-center justify-center"
        style={{ backgroundColor: link }}
        onPress={() => setShowPayment(true)}
        // disabled={loading}
      >
        {/* {loading ? (
          <RefreshCw size={20} className="animate-spin" />
        ) : (
            )} */}
        <MaterialCommunityIcons name="lightning-bolt" size={20} color="white" />
        <Text className="font-black text-lg ml-2 text-white">
          Subscribe now · ₹599/month
        </Text>
      </TouchableOpacity>

      <PaymentWebView
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />
    </View>
  );
}

function FeatureItem({
  label,
  active,
  activeColor,
  textColor,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  textColor: string;
}) {
  return (
    <View className="flex-row items-start w-[48%] mb-3">
      <View
        className="rounded-full p-0.5"
        style={{ backgroundColor: active ? activeColor : activeColor + "30" }}
      >
        <Ionicons
          name="checkmark"
          size={12}
          color={active ? textColor : activeColor}
        />
      </View>
      <Text
        className="ml-3 text-sm flex-1"
        style={{ color: active ? activeColor : textColor }}
      >
        {label}
      </Text>
    </View>
  );
}
