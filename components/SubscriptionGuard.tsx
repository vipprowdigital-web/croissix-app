import React, { useEffect, useState } from "react";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { getToken } from "@/services/auth.util";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Linking, View, Text, TouchableOpacity } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSubscription } from "@/hooks/useSubscription";
import { useUser } from "@/services/(user)/user.service";
import { FRONTEND_URL } from "@/config/.env";
import PaymentWebView from "./PaymentWebView";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RefreshCw } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";

const EXEMPT = ["/(auth)/login", "/(tabs)/profile"];

function AppSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <View className="flex-1 min-h-screen p-6 flex-col gap-4">
      {[...Array(5)].map((_, i) => (
        <View
          key={i}
          className="h-14 rounded-2xl animate-pulse"
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.06)",
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </View>
  );
}

function YourPaywallUI({
  onSubscribe,
  isDark,
}: {
  onSubscribe: () => void;
  isDark: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        backgroundColor: isDark ? "#050d1a" : "#eef4ff",
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "900",
          color: isDark ? "#f1f5f9" : "#0f172a",
          marginBottom: 8,
          letterSpacing: -0.5,
        }}
      >
        Unlock Croissix
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: isDark ? "#64748b" : "#94a3b8",
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        Start your 7-day free trial to access all features.
      </Text>
      <TouchableOpacity
        onPress={onSubscribe}
        style={{
          backgroundColor: "#f59e0b",
          paddingVertical: 16,
          paddingHorizontal: 40,
          borderRadius: 18,
          width: "100%",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
          View Plans →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function SubscriptionGate({ link, text, textMuted, loading }: any) {
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
        style={{ backgroundColor: link, opacity: 0.5 }}
        onPress={() => setShowPayment(true)}
        disabled={loading}
      >
        {loading ? (
          <RefreshCw size={20} className="animate-spin" />
        ) : (
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={20}
            color="white"
          />
        )}
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

// _________________________________________
// -----------------------------------------
// SUBSCRIPTION GUARD
// -----------------------------------------
// _________________________________________
export default function SubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const { isActive, isLoading: subLoading, refetch } = useSubscription();
  const text = useColor("text");
  const link = useColor("link");
  const textMuted = useColor("textMuted");

  const pathName = usePathname();

  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }
      setAuthed(true);
    };

    checkAuth();
  }, [router]);

  // ── Deep link listener — fires when app is open & link arrives ──
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url.includes("subscription/success")) {
        refetch();
      }
    };

    const sub = Linking.addEventListener("url", handleDeepLink);

    // Also handle case where app was closed and opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url?.includes("subscription/success")) {
        refetch();
      }
    });

    return () => sub.remove();
  }, [refetch]);

  // ── Open web subscription page with callback URL ─────────────────
  // const openSubscriptionPage = () => {
  //   const callback = encodeURIComponent("croissix://subscription/success");
  //   Linking.openURL(`${FRONTEND_URL}/?callback=${callback}`);
  // };

  // Check if current screen is in the exempt list
  const isExempt = EXEMPT.some(
    (p) => pathName === p || pathName?.startsWith(`${p}/`),
  );

  // 1. Not authed? Render nothing while redirecting
  if (!authed) return null;

  // 2. Checking subscription status?
  if (subLoading) return <AppSkeleton isDark={isDark} />;

  // 3. Subscribed or on an exempt screen?
  if (isActive || isExempt) {
    return <>{children}</>;
  }

  // 4. Show the paywall
  return (
    <SubscriptionGate
      dark={isDark}
      loading={subLoading}
      text={text}
      link={link}
      textMuted={textMuted}
    />
  );
  // ── Paywall — redirect to web ────────────────────────────────────
  // return <YourPaywallUI onSubscribe={openSubscriptionPage} isDark={isDark} />;
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
