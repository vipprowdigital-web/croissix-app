import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColor } from "@/hooks/useColor";
import { useFreeTrialStatus } from "@/hooks/useFreeTrialStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { useUser } from "@/services/(user)/user.service";
import { FRONTEND_URL } from "@/config/.env";
import { router, useRouter } from "expo-router";
import PaymentWebView from "@/components/PaymentWebView";
import { useSubscriptionActions } from "@/hooks/useSubscriptionActions";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  XOctagon,
  Octagon,
  RefreshCw,
} from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";

/* ══════════════════════════════════════════════════
   STATUS CONFIG (for details view)
══════════════════════════════════════════════════ */
const STATUS_CFG: Record<string, any> = {
  active: {
    label: "Active",
    color: "#22c55e",
    bg: "rgba(220,252,231,0.7)",
    darkBg: "rgba(34,197,94,0.1)",
    icon: <CheckCircle2 size={13} />,
  },
  created: {
    label: "Pending",
    color: "#f59e0b",
    bg: "rgba(254,243,199,0.7)",
    darkBg: "rgba(245,158,11,0.1)",
    icon: <Clock size={13} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "rgba(254,226,226,0.7)",
    darkBg: "rgba(239,68,68,0.1)",
    icon: <XOctagon size={13} />,
  },
  failed: {
    label: "Failed",
    color: "#ef4444",
    bg: "rgba(254,226,226,0.7)",
    darkBg: "rgba(239,68,68,0.1)",
    icon: <AlertTriangle size={13} />,
  },
  expired: {
    label: "Expired",
    color: "#94a3b8",
    bg: "rgba(241,245,249,0.7)",
    darkBg: "rgba(148,163,184,0.1)",
    icon: <XCircle size={13} />,
  },
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d?: string | Date) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const daysLeft = (end?: string | Date) => {
  if (!end) return null;
  const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return d > 0 ? d : 0;
};

export default function SubscriptionScreen() {
  const [activeTab, setActiveTab] = useState("My Subscription");
  const link = useColor("link");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const green = useColor("green");
  const red = useColor("red");

  // ── Subscription & trial state ──────────────────────────────────
  const { isActive, isLoading: subLoading, subscription } = useSubscription();
  const { trialExpired, loading: trialLoading } = useFreeTrialStatus();
  const { data: user } = useUser();
  const { cancelSubscription, loading } = useSubscriptionActions();

  console.log("Subscription: ", subscription);

  // ── Calculate trial days remaining ─────────────────────────────
  const trialDaysRemaining = (() => {
    if (!user?.createdAt) return 0;
    const diff =
      3 -
      (new Date().getTime() - new Date(user.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(diff));
  })();

  async function handleCancel() {
    if (!subscription?.razorpaySubscriptionId) return;
    try {
      await cancelSubscription(subscription.razorpaySubscriptionId);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Cancel failed. Please try again.");
    }
  }

  // ── Loading state ───────────────────────────────────────────────
  if (subLoading || trialLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text style={{ color: textMuted }}>Loading...</Text>
      </View>
    );
  }

  // ── STATE 1: Active paid subscription ───────────────────────────
  if (isActive) {
    return (
      <ActiveSubscriptionView
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        subscription={subscription}
        link={link}
        text={text}
        textMuted={textMuted}
        primaryForeground={primaryForeground}
        green={green}
        red={red}
        onCancel={handleCancel}
        cancelLoading={loading}
      />
    );
  }

  // ── STATE 2: Trial still active ─────────────────────────────────
  if (!trialExpired) {
    return (
      <TrialActiveView
        daysRemaining={trialDaysRemaining}
        link={link}
        text={text}
        textMuted={textMuted}
        primaryForeground={primaryForeground}
        green={green}
      />
    );
  }

  // ── STATE 3: Trial expired, not subscribed ──────────────────────
  return (
    <TrialExpiredView
      link={link}
      text={text}
      textMuted={textMuted}
      primaryForeground={primaryForeground}
      red={red}
    />
  );
}

const CancelConfirmation = ({
  dark,
  subscription,
  fmtDate,
  setShowConfirm,
  onCancel,
  cancelLoading,
}: any) => {
  // Animation Values
  const progress = useSharedValue(0);

  const primary = useColor("primary");
  const link = useColor("link");
  const text = useColor("text");
  const red = useColor("red");
  const textMuted = useColor("textMuted");

  useEffect(() => {
    progress.value = withTiming(1, { duration: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [{ translateY: interpolate(progress.value, [0, 1], [6, 0]) }],
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          backgroundColor: textMuted + "30",
        },
      ]}
      className="rounded-2xl p-4 mx-7 my-2"
    >
      <Text className="text-lg font-bold mb-1" style={{ color: textMuted }}>
        Cancel your subscription?
      </Text>

      <Text className="text-sm mb-3" style={{ color: text }}>
        Access continues until {fmtDate(subscription?.currentEnd)}. This cannot
        be undone.
      </Text>

      <View className="flex-row gap-2">
        {/* Keep Plan Button */}
        <TouchableOpacity
          onPress={() => setShowConfirm(false)}
          activeOpacity={0.7}
          className="flex-1 py-2.5 rounded-xl items-center justify-center"
          style={{
            backgroundColor: textMuted + "30",
          }}
        >
          <Text className="text-sm font-semibold text-white">Keep plan</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => {
            onCancel();
            setShowConfirm(false);
          }}
          disabled={cancelLoading}
          activeOpacity={0.8}
          className="flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
          style={{
            backgroundColor: red,
            opacity: cancelLoading ? 0.6 : 1,
          }}
        >
          {cancelLoading ? (
            <RefreshCw size={12} color="white" />
          ) : (
            <Octagon size={12} color="white" />
          )}
          <Text className="text-sm font-bold text-white">
            {cancelLoading ? "Cancelling…" : "Yes, cancel"}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// _________________________________________
// STATE 1: ACTIVE SUBSCRIPTION VIEW
// (same as your current My Subscription + Plan Info tabs)
// _________________________________________
function ActiveSubscriptionView({
  activeTab,
  setActiveTab,
  subscription,
  link,
  text,
  textMuted,
  primaryForeground,
  green,
  red,
  onCancel,
  cancelLoading,
}: any) {
  const [showConfirm, setShowConfirm] = useState(false);
  const status = subscription?.status ?? "created";
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.created;
  const days = daysLeft(subscription?.currentEnd);
  const prog =
    subscription?.paidCount && subscription?.totalCount
      ? Math.round((subscription.paidCount / subscription.totalCount) * 100)
      : 0;
  const isActive = status === "active";
  const isCancelled = status === "cancelled";
  const isExpired = status === "expired";
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(days || 1, 30) / 30;
  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <View className="flex-row space-x-2 gap-2">
            <View
              className="w-6 h-1.5 rounded-full"
              style={{ backgroundColor: link }}
            />
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: textMuted }}
            />
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: textMuted }}
            />
          </View>
          <View className="flex-row items-center">
            <Ionicons name="lock-closed" size={12} color={textMuted} />
            <Text
              className="text-[10px] font-semibold ml-1"
              style={{ color: textMuted }}
            >
              Secured by Razorpay
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View
          className="mx-7 py-1 mb-6 w-3/4 rounded-2xl border"
          style={{
            backgroundColor: primaryForeground,
            borderColor: link + "20",
          }}
        >
          <View className="flex-row p-1.5 rounded-2xl">
            {["My Subscription", "Plan Info"].map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="flex-1 py-3 rounded-xl"
                style={{
                  backgroundColor:
                    activeTab === tab ? link + "40" : "transparent",
                }}
              >
                <Text
                  className="text-center font-bold"
                  style={{ color: activeTab === tab ? text : textMuted }}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {activeTab === "My Subscription" ? (
          <View>
            {/* Main Plan Card */}
            <View className="px-7">
              <View
                className="rounded-[32px] p-6 shadow-md border-t-4"
                style={{
                  backgroundColor: primaryForeground,
                  borderColor: link,
                  shadowColor: link,
                }}
              >
                <View className="flex-row justify-between items-start mb-6">
                  <View className="flex-row items-center">
                    <View
                      className="p-3 rounded-2xl mr-4"
                      style={{ backgroundColor: link }}
                    >
                      <MaterialCommunityIcons
                        name="lightning-bolt"
                        size={32}
                        color="white"
                      />
                    </View>
                    <View>
                      <Text
                        className="text-xl font-bold"
                        style={{ color: text }}
                      >
                        Croissix Plan
                      </Text>
                      <Text className="text-xs" style={{ color: textMuted }}>
                        ₹599/month · INR
                      </Text>
                    </View>
                  </View>
                  {/* Active badge */}
                  <View
                    className="px-3 py-1.5 rounded-full flex-row items-center"
                    style={{ backgroundColor: cfg.darkBg }}
                  >
                    <View
                      className="p-0.5 rounded-3xl flex-row items-center"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {cfg.icon}
                    </View>
                    <Text
                      className="text-xs font-bold ml-1"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </Text>
                  </View>
                </View>

                {/* Remaining Days */}
                {isActive && days != null && (
                  <View
                    className="rounded-xl p-4 flex-row items-center mb-6"
                    style={{ backgroundColor: green + "40" }}
                  >
                    <View className="w-12 h-12 items-center justify-center mr-4">
                      {/* Circle with progress */}
                      <View className="absolute w-12 h-12 -rotate-90">
                        <Svg viewBox="0 0 48 48" className="w-12 h-12">
                          {/* Background circle */}
                          <Circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="none"
                            stroke={link}
                            strokeWidth={4}
                          />
                          {/* Progress circle */}
                          <Circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={4}
                            strokeDasharray={circumference}
                            strokeDashoffset={
                              circumference - circumference * progress
                            }
                            strokeLinecap="round"
                          />
                        </Svg>
                      </View>

                      {/* Number centered inside */}
                      <Text className="font-bold text-green-500">{days}</Text>
                    </View>
                    <View>
                      <Text className="font-bold" style={{ color: text }}>
                        {days} day{days !== 1 ? "s" : ""} remaining
                      </Text>
                      <Text className="text-xs" style={{ color: textMuted }}>
                        Renews on {fmtDate(subscription?.currentEnd)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Billing Cycle Progress */}
                {subscription.totalCount > 0 && (
                  <View>
                    <View className="flex-row justify-between mb-2">
                      <Text
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: text }}
                      >
                        Billing cycles
                      </Text>
                      <Text
                        className="text-[11px] font-bold"
                        style={{ color: textMuted }}
                      >
                        {subscription.paidCount} / {subscription.totalCount}{" "}
                        paid
                      </Text>
                    </View>
                    <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <View
                        className={`h-full`}
                        style={{ backgroundColor: link, width: `${prog}%` }}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Subscription Info */}
            <View className="px-7 mt-6">
              <View
                className="rounded-[32px] p-6 shadow-md"
                style={{
                  backgroundColor: primaryForeground,
                  shadowColor: link,
                }}
              >
                <Text
                  className="text-sm font-bold uppercase tracking-widest mb-6"
                  style={{ color: text }}
                >
                  Subscription Info
                </Text>
                <InfoRow
                  label="Plan ID"
                  value="Croissix"
                  isCode
                  textColor={text}
                  valueColor={textMuted}
                />
                <InfoRow
                  label="Status"
                  value={cfg.label}
                  isBold
                  textColor={text}
                  valueColor={textMuted}
                />
                <InfoRow
                  label="Amount"
                  value={`₹${(subscription?.amount ?? 599).toLocaleString("en-IN")} / month`}
                  isBold
                  textColor={text}
                  valueColor={textMuted}
                />
                <InfoRow
                  label="Currency"
                  value={subscription?.currency ?? "INR"}
                  isBold
                  textColor={text}
                  valueColor={textMuted}
                />
                <InfoRow
                  label="Razorpay Sub ID"
                  value={subscription?.razorpaySubscriptionId ?? "—"}
                  valueColor={link}
                  isLast
                  textColor={text}
                />
              </View>
            </View>

            {/* Billing Dates */}
            <View className="px-7 mt-6">
              <View
                className="rounded-[32px] p-6 shadow-md"
                style={{
                  backgroundColor: primaryForeground,
                  shadowColor: link,
                }}
              >
                <Text
                  className="text-sm font-bold uppercase tracking-widest mb-6"
                  style={{ color: text }}
                >
                  Billing Dates
                </Text>
                <InfoRow
                  label="Current period start"
                  value={fmtDate(subscription?.currentStart)}
                  isCode
                  textColor={text}
                  valueColor={textMuted}
                />
                <InfoRow
                  label="Current period end"
                  value={fmtDate(subscription?.currentEnd)}
                  isBold
                  textColor={text}
                  valueColor={textMuted}
                />
                <InfoRow
                  label="Paid Cycles"
                  value={String(subscription?.paidCount ?? 0)}
                  isBold
                  textColor={text}
                  valueColor={textMuted}
                />
                <InfoRow
                  label="Total cycles"
                  value={String(subscription?.totalCount ?? 12)}
                  isBold
                  textColor={text}
                  valueColor={textMuted}
                />
                <InfoRow
                  label="Submitted on"
                  value={fmtDate(subscription?.createdAt)}
                  valueColor={text}
                  isLast
                  textColor={text}
                />
              </View>
            </View>

            {/* Last Payment */}
            {subscription.razorpayPaymentId && (
              <View
                className="rounded-2xl p-6 mx-7 mt-5 shadow-md mb-5"
                style={{
                  backgroundColor: primaryForeground,
                  shadowColor: link,
                }}
              >
                <Text
                  className="text-sm font-bold uppercase tracking-widest mb-4"
                  style={{ color: text }}
                >
                  Last Payment
                </Text>
                <View
                  className="rounded-2xl p-4 flex-row items-center"
                  style={{ backgroundColor: link + "50" }}
                >
                  <View className="p-2 rounded-lg mr-3">
                    <Feather name="credit-card" size={18} color={link} />
                  </View>
                  <View>
                    <Text
                      className="text-sm font-bold uppercase"
                      style={{ color: textMuted }}
                    >
                      Payment ID
                    </Text>
                    <Text className="font-bold text-sm" style={{ color: text }}>
                      {subscription.razorpayPaymentId}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* What's Included */}
            <View
              className="rounded-3xl p-6 shadow-md mx-7 mb-5"
              style={{ backgroundColor: primaryForeground, shadowColor: link }}
            >
              <Text
                className="text-sm font-bold uppercase tracking-widest mb-6"
                style={{ color: text }}
              >
                What&apos;s Included
              </Text>
              <View className="flex-row flex-wrap justify-between items-start">
                <FeatureItem
                  label="1 Google Business Profile"
                  active
                  textColor={text}
                  activeColor={link}
                />
                <FeatureItem
                  label="Analytics dashboard"
                  active
                  textColor={text}
                  activeColor={link}
                />
                <FeatureItem
                  label="Review monitoring"
                  active
                  textColor={text}
                  activeColor={link}
                />
                <FeatureItem
                  label="AI auto-review replies"
                  active
                  textColor={text}
                  activeColor={link}
                />
                <FeatureItem
                  label="AI insights"
                  active
                  textColor={text}
                  activeColor={link}
                />
                <FeatureItem
                  label="Google Photos Management"
                  active
                  textColor={text}
                  activeColor={link}
                />
              </View>
            </View>

            {/* Cancel */}
            {isActive &&
              !isCancelled &&
              (!showConfirm ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  className="rounded-2xl py-4 mx-7 flex-row justify-center items-center mb-4 border"
                  style={{
                    backgroundColor: red + "20",
                    borderColor: red + "50",
                  }}
                  onPress={() => setShowConfirm(true)}
                >
                  <Ionicons name="close-circle-outline" size={20} color={red} />
                  <Text
                    className="font-bold ml-2 text-base"
                    style={{ color: red }}
                  >
                    Cancel Subscription
                  </Text>
                </TouchableOpacity>
              ) : (
                <CancelConfirmation
                  fmtDate={fmtDate}
                  subscription={subscription}
                  setShowConfirm={setShowConfirm}
                  onCancel={onCancel}
                  cancelLoading={cancelLoading}
                />
              ))}

            {(isExpired || isCancelled) && (
              <View
                className="rounded-2xl p-4 items-center mx-7"
                style={{
                  backgroundColor: red + "30",
                  borderWidth: 1,
                  borderColor: red,
                }}
              >
                <Text
                  className="text-md font-bold mb-1 text-center"
                  style={{ color: red }}
                >
                  {isCancelled
                    ? "Subscription cancelled"
                    : "Subscription expired"}
                </Text>

                <Text className="text-sm text-center" style={{ color: red }}>
                  Contact support to reactivate your Croissix plan.
                </Text>
              </View>
            )}

            {/* Support */}
            <View className="rounded-3xl py-4 flex-row justify-center items-center">
              <Feather name="bell" size={18} color={link} />
              <View className="ml-2 flex-row items-center">
                <Text className="text-sm" style={{ color: textMuted }}>
                  Questions? Email{" "}
                </Text>
                <Pressable
                  onPress={() => Linking.openURL("mailto:support@vipprow.com")}
                >
                  <Text className="font-bold text-sm" style={{ color: text }}>
                    support@vipprow.com
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <PlanInfoTab
            link={link}
            text={text}
            textMuted={textMuted}
            subscription={subscription}
            loading={cancelLoading}
            alreadyActive={isActive}
          />
        )}
      </ScrollView>
    </View>
  );
}

// _________________________________________
// STATE 2: TRIAL ACTIVE VIEW
// Shows trial countdown and nudge to subscribe
// _________________________________________
function TrialActiveView({
  daysRemaining,
  link,
  text,
  textMuted,
  primaryForeground,
  green,
}: any) {
  const [showPayment, setShowPayment] = useState(false);
  const router = useRouter();

  const openSubscriptionPage = () => {
    const callback = encodeURIComponent("croissix://subscription/success");
    Linking.openURL(`${FRONTEND_URL}/?callback=${callback}`);
  };

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
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <View className="flex-row space-x-2 gap-2">
          <View
            className="w-6 h-1.5 rounded-full"
            style={{ backgroundColor: link }}
          />
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: textMuted }}
          />
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: textMuted }}
          />
        </View>
        <View className="flex-row items-center">
          <Ionicons name="lock-closed" size={12} color={textMuted} />
          <Text
            className="text-[10px] font-semibold ml-1"
            style={{ color: textMuted }}
          >
            Secured by Razorpay
          </Text>
        </View>
      </View>

      <View className="px-7 mt-4">
        {/* Trial badge */}
        <View className="items-center mb-6">
          <View
            className="px-4 py-1.5 rounded-3xl flex-row items-center border"
            style={{ backgroundColor: green + "20", borderColor: green + "40" }}
          >
            <Ionicons name="time-outline" size={14} color={green} />
            <Text
              className="font-bold text-xs ml-1 uppercase tracking-tighter"
              style={{ color: green }}
            >
              Free Trial Active
            </Text>
          </View>
        </View>

        {/* Title */}
        <View className="items-center mb-8">
          <Text
            className="text-3xl font-black text-center leading-tight"
            style={{ color: text }}
          >
            You&apos;re on your
          </Text>
          <Text
            className="text-3xl font-black text-center leading-tight"
            style={{ color: link }}
          >
            Free Trial
          </Text>
          <Text
            className="text-sm mt-3 font-medium text-center"
            style={{ color: textMuted }}
          >
            Enjoying Croissix? Subscribe before your trial ends to keep access.
          </Text>
        </View>

        {/* Days remaining card */}
        <View
          className="rounded-[32px] p-6 mb-6 border-t-4"
          style={{
            backgroundColor: primaryForeground,
            borderColor: green,
            shadowColor: green,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: text }}
            >
              Trial Status
            </Text>
            {/* Active badge */}
            <View
              className="px-3 py-1.5 rounded-full flex-row items-center"
              style={{ backgroundColor: green + "30" }}
            >
              <Ionicons name="checkmark-circle" size={14} color={green} />
              <Text className="text-xs font-bold ml-1" style={{ color: green }}>
                Active
              </Text>
            </View>
          </View>

          {/* Big countdown */}
          <View className="items-center py-6">
            <Text className="text-7xl font-black" style={{ color: link }}>
              {daysRemaining}
            </Text>
            <Text
              className="text-base font-bold mt-1"
              style={{ color: textMuted }}
            >
              {daysRemaining === 1 ? "day remaining" : "days remaining"}
            </Text>
          </View>

          {/* Progress bar — trial days used */}
          <View>
            <View className="flex-row justify-between mb-2">
              <Text
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: text }}
              >
                Trial period
              </Text>
              <Text
                className="text-[11px] font-bold"
                style={{ color: textMuted }}
              >
                {3 - daysRemaining} / 3 days used
              </Text>
            </View>
            <View
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: link + "20" }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: green,
                  // fill based on days remaining
                  width: `${(daysRemaining / 3) * 100}%`,
                }}
              />
            </View>
          </View>
        </View>

        {/* What's included during trial */}
        {/* <View
          className="rounded-3xl p-6 shadow-md mb-6"
          style={{ backgroundColor: primaryForeground, shadowColor: link }}
        >
          <Text
            className="text-sm font-bold uppercase tracking-widest mb-6"
            style={{ color: text }}
          >
            What&apos;s Included in Trial */}
        {/* </Text> */}
        {/* <View className="flex-row flex-wrap justify-between"> */}
        {/* <FeatureItem
              label="1 Google Business Profile"
              active
              textColor={text}
              activeColor={link}
            /> */}
        {/* <FeatureItem
              label="Analytics dashboard"
              active
              textColor={text}
              activeColor={link}
            /> */}
        {/* <FeatureItem
              label="Review monitoring"
              active={false}
              textColor={text}
              activeColor={link}
            /> */}
        {/* <FeatureItem
              label="5 posts / month"
              active={false}
              textColor={text}
              activeColor={link}
            /> */}
        {/* <FeatureItem
              label="AI insights"
              active
              textColor={text}
              activeColor={link}
            /> */}
        {/* <FeatureItem
              label="Email support"
              active={false}
              textColor={text}
              activeColor={link}
            />
          </View> */}
        {/* </View> */}

        {/* Pricing nudge */}
        <View
          className="rounded-2xl p-4 flex-row items-center justify-center mb-6 border"
          style={{ backgroundColor: link + "15", borderColor: link + "30" }}
        >
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={16}
            color={link}
          />
          <Text className="font-bold text-sm ml-2" style={{ color: link }}>
            Only <Text className="font-black">₹599/month</Text> after trial ends
          </Text>
        </View>

        {/* Subscribe CTA */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="rounded-3xl py-5 flex-row items-center justify-center mb-3"
          style={{ backgroundColor: link }}
          onPress={() => setShowPayment(true)}
        >
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={20}
            color="white"
          />
          <Text className="font-black text-lg ml-2 text-white">
            Subscribe Now · ₹599/mo
          </Text>
        </TouchableOpacity>

        {/* Support */}
        <View className="rounded-3xl py-4 flex-row justify-center items-center">
          <Feather name="bell" size={18} color={link} />
          <View className="ml-2 flex-row items-center">
            <Text className="text-sm" style={{ color: textMuted }}>
              Questions? Email{" "}
            </Text>
            <Pressable
              onPress={() => Linking.openURL("mailto:support@vipprow.com")}
            >
              <Text className="font-bold text-sm" style={{ color: text }}>
                support@vipprow.com
              </Text>
            </Pressable>
          </View>
        </View>

        <PaymentWebView
          visible={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      </View>
    </ScrollView>
  );
}

// _________________________________________
// STATE 3: TRIAL EXPIRED VIEW
// Shows paywall — trial over, must subscribe
// _________________________________________
function TrialExpiredView({
  link,
  text,
  textMuted,
  primaryForeground,
  red,
}: any) {
  const [showPayment, setShowPayment] = useState(false);
  const router = useRouter();

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    console.log("✅ Payment success called");

    // Wait for refetch then check
    setTimeout(async () => {
      console.log("⏰ Navigating to home...");
      router.replace("/(tabs)/(home)");
    }, 1500);
  };
  const openSubscriptionPage = () => {
    const callback = encodeURIComponent("croissix://subscription/success");
    Linking.openURL(`${FRONTEND_URL}/?callback=${callback}`);
    // Linking.openURL(
    // `https://c8c7-2405-201-3025-d0bc-acd1-6452-e62f-9747.ngrok-free.app/?callback=${callback}`,
    // );
  };
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <View className="flex-row space-x-2 gap-2">
          <View
            className="w-6 h-1.5 rounded-full"
            style={{ backgroundColor: link }}
          />
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: textMuted }}
          />
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: textMuted }}
          />
        </View>
        <View className="flex-row items-center">
          <Ionicons name="lock-closed" size={12} color={textMuted} />
          <Text
            className="text-[10px] font-semibold ml-1"
            style={{ color: textMuted }}
          >
            Secured by Razorpay
          </Text>
        </View>
      </View>

      <View className="px-7 mt-4">
        {/* Expired badge */}
        <View className="items-center mb-6">
          <View
            className="px-4 py-1.5 rounded-3xl flex-row items-center border"
            style={{ backgroundColor: red + "20", borderColor: red + "40" }}
          >
            <Ionicons name="time-outline" size={14} color={red} />
            <Text
              className="font-bold text-xs ml-1 uppercase tracking-tighter"
              style={{ color: red }}
            >
              Trial Expired
            </Text>
          </View>
        </View>

        {/* Title */}
        <View className="items-center mb-8">
          <Text
            className="text-3xl font-black text-center leading-tight"
            style={{ color: text }}
          >
            Your free trial
          </Text>
          <Text
            className="text-3xl font-black text-center leading-tight"
            style={{ color: red }}
          >
            has ended
          </Text>
          <Text
            className="text-sm mt-3 font-medium text-center"
            style={{ color: textMuted }}
          >
            Subscribe to keep growing your Google Business ranking.
          </Text>
        </View>

        {/* Plan card */}
        <View
          className="border-2 rounded-[32px] p-6 mb-6"
          style={{ backgroundColor: link + "15", borderColor: link + "30" }}
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
                <Text className="text-xs mt-1" style={{ color: textMuted }}>
                  1 Google Business Profile
                </Text>
              </View>
            </View>
            <View className="items-end">
              <View className="flex-row items-start gap-1">
                <Text className="font-bold text-md" style={{ color: link }}>
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

        {/* Trust badges */}
        <View
          className="rounded-2xl p-4 flex-row items-center justify-center mb-4 border"
          style={{ backgroundColor: link + "15", borderColor: link + "30" }}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={link} />
          <Text className="font-bold text-xs ml-2" style={{ color: link }}>
            No setup fees{" "}
            <Text className="font-normal">
              · Cancel anytime · Secured by Razorpay
            </Text>
          </Text>
        </View>

        <View className="flex-row space-x-4 mb-8 gap-2 px-1">
          <View
            className="rounded-xl py-3 px-2 w-1/2 gap-2 flex-row items-center justify-center"
            style={{ backgroundColor: link + "20" }}
          >
            <Ionicons name="lock-closed" size={14} color="#f59e0b" />
            <Text
              className="font-bold text-sm capitalize"
              style={{ color: textMuted }}
            >
              Secured by Razorpay
            </Text>
          </View>
          <View
            className="rounded-xl py-3 px-2 w-1/2 gap-2 flex-row items-center justify-center"
            style={{ backgroundColor: link + "20" }}
          >
            <Ionicons name="refresh" size={14} color="#3b82f6" />
            <Text
              className="font-bold text-sm capitalize"
              style={{ color: textMuted }}
            >
              Cancel anytime
            </Text>
          </View>
        </View>

        {/* Subscribe CTA */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="rounded-3xl py-5 flex-row items-center justify-center mb-3"
          style={{ backgroundColor: link }}
          // onPress={openSubscriptionPage}
          onPress={() => setShowPayment(true)}
        >
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={20}
            color="white"
          />
          <Text className="font-black text-lg ml-2 text-white">
            Subscribe Now · ₹599/mo
          </Text>
        </TouchableOpacity>

        {/* Support */}
        <View className="rounded-3xl py-4 flex-row justify-center items-center">
          <Feather name="bell" size={18} color={link} />
          <View className="ml-2 flex-row items-center">
            <Text className="text-sm" style={{ color: textMuted }}>
              Questions? Email{" "}
            </Text>
            <Pressable
              onPress={() => Linking.openURL("mailto:support@vipprow.com")}
            >
              <Text className="font-bold text-sm" style={{ color: text }}>
                support@vipprow.com
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <PaymentWebView
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />
    </ScrollView>
  );
}

// _________________________________________
// PLAN INFO TAB
// (extracted from your existing Plan Info tab)
// _________________________________________
function PlanInfoTab({
  link,
  text,
  textMuted,
  subscription,
  loading,
  alreadyActive,
}: any) {
  const [showPayment, setShowPayment] = useState(false);
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
                {subscription.amount}
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
        disabled={alreadyActive || loading || !subscription.planId}
        onPress={() => setShowPayment(true)}
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
          {alreadyActive
            ? "Plan Active ✓"
            : loading
              ? "Loading…"
              : `Subscribe now · ${fmt(subscription.amount)}/mo`}
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
// REUSABLE COMPONENTS
// _________________________________________
function InfoRow({
  label,
  value,
  isCode,
  isBold,
  isLast,
  textColor,
  valueColor,
}: any) {
  return (
    <View
      className={`flex-row justify-between py-4 ${!isLast ? "border-b border-slate-50" : ""}`}
    >
      <Text className="text-sm capitalize" style={{ color: textColor }}>
        {label}
      </Text>
      <Text
        className={`text-sm font-bold ${isCode ? "font-mono" : ""} ${isBold ? "font-bold" : ""}`}
        style={{ color: valueColor }}
      >
        {value}
      </Text>
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

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   Pressable,
//   TouchableOpacity,
//   Linking,
// } from "react-native";
// import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useColor } from "@/hooks/useColor";
// import { useFreeTrialStatus } from "@/hooks/useFreeTrialStatus";

// export default function SubscriptionScreen() {
//   const [activeTab, setActiveTab] = useState("My Subscription");
//   const link = useColor("link");
//   const text = useColor("text");
//   const textMuted = useColor("textMuted");
//   const primaryForeground = useColor("primaryForeground");
//   const green = useColor("green");
//   const red = useColor("red");
//   const [isDisabled, setIsDisabled] = useState(true);

//   const { trialExpired: isExpired, loading: isLoading } = useFreeTrialStatus();
//   console.log("Is Expired: ", isExpired);

//   return (
//     <View className="flex-1">
//       <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
//         {/* Header Section */}
//         <View className="flex-row justify-between items-center px-6 py-4">
//           <View className="flex-row space-x-2 gap-2">
//             <View
//               className="w-6 h-1.5 rounded-full"
//               style={{ backgroundColor: link }}
//             />
//             <View
//               className="w-1.5 h-1.5 rounded-full"
//               style={{ backgroundColor: textMuted }}
//             />
//             <View
//               className="w-1.5 h-1.5 rounded-full"
//               style={{ backgroundColor: textMuted }}
//             />
//           </View>
//           <View className="flex-row items-center">
//             <Ionicons name="lock-closed" size={12} color={textMuted} />
//             <Text
//               className="text-[10px] font-semibold ml-1"
//               style={{ color: textMuted }}
//             >
//               Secured by Razorpay
//             </Text>
//           </View>
//         </View>

//         {/* Custom Tab Switcher */}
//         <View
//           className="mx-7 py-1 mb-6 w-3/4 rounded-2xl border"
//           style={{
//             backgroundColor: primaryForeground,
//             borderColor: link + "20",
//           }}
//         >
//           <View className="flex-row p-1.5 rounded-2xl">
//             {["My Subscription", "Plan Info"].map((tab) => (
//               <Pressable
//                 key={tab}
//                 onPress={() => setActiveTab(tab)}
//                 className={`flex-1 py-3 rounded-xl`}
//                 style={{
//                   backgroundColor:
//                     activeTab === tab ? link + "40" : "transparent",
//                 }}
//               >
//                 <Text
//                   className="text-center font-bold"
//                   style={{ color: activeTab === tab ? text : textMuted }}
//                 >
//                   {tab}
//                 </Text>
//               </Pressable>
//             ))}
//           </View>
//         </View>

//         {activeTab === "My Subscription" ? (
//           <View>
//             {/* Main Plan Card */}
//             <View className="px-7">
//               <View
//                 className="rounded-[32px] p-6 shadow-md border-t-4 "
//                 style={{
//                   backgroundColor: primaryForeground,
//                   borderColor: link,
//                   shadowColor: link,
//                 }}
//               >
//                 <View className="flex-row justify-between items-start mb-6">
//                   <View className="flex-row items-center">
//                     <View
//                       className="p-3 rounded-2xl mr-4"
//                       style={{ backgroundColor: link }}
//                     >
//                       <MaterialCommunityIcons
//                         name="lightning-bolt"
//                         size={32}
//                         color="white"
//                       />
//                     </View>
//                     <View>
//                       <Text
//                         className="text-xl font-bold"
//                         style={{ color: text }}
//                       >
//                         Starter Plan
//                       </Text>
//                       <Text className="text-xs" style={{ color: textMuted }}>
//                         ₹499/month · INR
//                       </Text>
//                     </View>
//                   </View>
//                   <View
//                     className="px-3 py-1.5 rounded-full flex-row items-center"
//                     style={{ backgroundColor: green + "30" }}
//                   >
//                     <Ionicons name="checkmark-circle" size={14} color={green} />
//                     <Text
//                       className="text-xs font-bold ml-1"
//                       style={{ color: green }}
//                     >
//                       Active
//                     </Text>
//                   </View>
//                 </View>

//                 {/* Remaining Days Progress */}
//                 <View
//                   className="rounded-xl p-4 flex-row items-center mb-6"
//                   style={{ backgroundColor: green + "40" }}
//                 >
//                   <View
//                     className="w-12 h-12 rounded-full border-4 items-center justify-center mr-4"
//                     style={{ borderColor: text }}
//                   >
//                     {/* This represents the circular progress "7" */}
//                     <View
//                       className="absolute w-full h-full rounded-full border-t-4"
//                       style={{ borderColor: green }}
//                     />
//                     <Text className="font-bold " style={{ color: green }}>
//                       7
//                     </Text>
//                   </View>
//                   <View>
//                     <Text className="font-bold" style={{ color: text }}>
//                       7 days remaining
//                     </Text>
//                     <Text className="text-xs" style={{ color: textMuted }}>
//                       Renews on 20 Apr 2026
//                     </Text>
//                   </View>
//                 </View>

//                 {/* Billing Cycle Progress */}
//                 <View>
//                   <View className="flex-row justify-between mb-2">
//                     <Text
//                       className="text-[11px] font-bold uppercase tracking-wider"
//                       style={{ color: text }}
//                     >
//                       Billing cycles
//                     </Text>
//                     <Text
//                       className="text-[11px] font-bold"
//                       style={{ color: textMuted }}
//                     >
//                       1 / 12 paid
//                     </Text>
//                   </View>
//                   <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
//                     <View
//                       className="h-full w-[8.3%]"
//                       style={{ backgroundColor: link }}
//                     />
//                   </View>
//                 </View>
//               </View>
//             </View>

//             {/* Subscription Info List */}
//             <View className="px-7 mt-6">
//               <View
//                 className="rounded-[32px] p-6 shadow-md"
//                 style={{
//                   backgroundColor: primaryForeground,
//                   shadowColor: link,
//                 }}
//               >
//                 <Text
//                   className="text-sm font-bold uppercase tracking-widest mb-6"
//                   style={{ color: text }}
//                 >
//                   Subscription Info
//                 </Text>

//                 <InfoRow
//                   label="Plan ID"
//                   value="plan_SR7GH5Kj45UJsP"
//                   isCode
//                   textColor={text}
//                   valueColor={textMuted}
//                 />
//                 <InfoRow
//                   label="Status"
//                   value="Active"
//                   isBold
//                   textColor={text}
//                   valueColor={textMuted}
//                 />
//                 <InfoRow
//                   label="Amount"
//                   value="₹499 / month"
//                   isBold
//                   textColor={text}
//                   valueColor={textMuted}
//                 />
//                 <InfoRow
//                   label="Currency"
//                   value="INR"
//                   isBold
//                   textColor={text}
//                   valueColor={textMuted}
//                 />
//                 <InfoRow
//                   label="Razorpay Sub ID"
//                   value="sub_STr9WRVkf1Ru3q"
//                   valueColor={link}
//                   isLast
//                   textColor={text}
//                 />
//               </View>
//             </View>

//             {/* Billing Dates */}
//             <View className="px-7 mt-6">
//               <View
//                 className="rounded-[32px] p-6 shadow-md"
//                 style={{
//                   backgroundColor: primaryForeground,
//                   shadowColor: link,
//                 }}
//               >
//                 <Text
//                   className="text-sm font-bold uppercase tracking-widest mb-6"
//                   style={{ color: text }}
//                 >
//                   Billing Dates
//                 </Text>

//                 <InfoRow
//                   label="Current period start"
//                   value="21 Mar 2026"
//                   isCode
//                   textColor={text}
//                   valueColor={textMuted}
//                 />
//                 <InfoRow
//                   label="Current period end"
//                   value="20 Apr 2026"
//                   isBold
//                   textColor={text}
//                   valueColor={textMuted}
//                 />
//                 <InfoRow
//                   label="Paid Cycles"
//                   value="1"
//                   isBold
//                   textColor={text}
//                   valueColor={textMuted}
//                 />
//                 <InfoRow
//                   label="Total cycles"
//                   value="12"
//                   isBold
//                   textColor={text}
//                   valueColor={textMuted}
//                 />
//                 <InfoRow
//                   label="Submitted on"
//                   value="21 Mar 2026"
//                   valueColor={text}
//                   isLast
//                   textColor={text}
//                 />
//               </View>
//             </View>

//             <View
//               className="rounded-2xl p-6 mx-7 mt-5 shadow-md mb-5"
//               style={{ backgroundColor: primaryForeground, shadowColor: link }}
//             >
//               <Text
//                 className="text-sm font-bold uppercase tracking-widest mb-4"
//                 style={{ color: text }}
//               >
//                 Last Payment
//               </Text>
//               <View
//                 className="rounded-2xl p-4 flex-row items-center"
//                 style={{ backgroundColor: link + "50" }}
//               >
//                 <View className="p-2 rounded-lg mr-3">
//                   <Feather name="credit-card" size={18} color={link} />
//                 </View>
//                 <View>
//                   <Text
//                     className="text-sm font-bold uppercase"
//                     style={{ color: textMuted }}
//                   >
//                     Payment ID
//                   </Text>
//                   <Text className="font-bold text-sm" style={{ color: text }}>
//                     pay_STrccsZGM6HBUX
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             {/* WHAT'S INCLUDED CARD */}
//             <View
//               className="rounded-3xl p-6 shadow-md mx-7 mb-5"
//               style={{ backgroundColor: primaryForeground, shadowColor: link }}
//             >
//               <Text
//                 className="text-sm font-bold uppercase tracking-widest mb-6"
//                 style={{ color: text }}
//               >
//                 What&apos;s Included
//               </Text>

//               <View className="flex-row flex-wrap justify-between">
//                 <FeatureItem
//                   label="1 Google Business Profile"
//                   active
//                   textColor={text}
//                   activeColor={link}
//                 />
//                 <FeatureItem
//                   label="Analytics dashboard"
//                   active
//                   textColor={text}
//                   activeColor={link}
//                 />
//                 <FeatureItem
//                   label="Review monitoring"
//                   active={false}
//                   textColor={text}
//                   activeColor={link}
//                 />
//                 <FeatureItem
//                   label="5 posts / month"
//                   active={false}
//                   textColor={text}
//                   activeColor={link}
//                 />
//                 <FeatureItem
//                   label="AI insights"
//                   active
//                   textColor={text}
//                   activeColor={link}
//                 />
//                 <FeatureItem
//                   label="Email support"
//                   active={false}
//                   textColor={text}
//                   activeColor={link}
//                 />
//               </View>
//             </View>

//             {/* ACTION BUTTONS */}
//             <TouchableOpacity
//               activeOpacity={0.7}
//               className="rounded-2xl py-4 mx-7 flex-row justify-center items-center mb-4 border"
//               style={{ backgroundColor: red + "20", borderColor: red + "50" }}
//             >
//               <Ionicons name="close-circle-outline" size={20} color={red} />
//               <Text className="font-bold ml-2 text-base" style={{ color: red }}>
//                 Cancel Subscription
//               </Text>
//             </TouchableOpacity>

//             <View className="rounded-3xl py-4 flex-row justify-center items-center">
//               <Feather name="bell" size={18} color={link} />
//               <View className="ml-2 flex-row items-center">
//                 <Text className="text-sm" style={{ color: textMuted }}>
//                   Questions? Email{" "}
//                 </Text>
//                 <Pressable
//                   onPress={() => Linking.openURL("mailto:support@vipprow.com")}
//                 >
//                   <Text className="font-bold text-sm" style={{ color: text }}>
//                     support@vipprow.com
//                   </Text>
//                 </Pressable>
//               </View>
//             </View>
//           </View>
//         ) : (
//           <View className="px-7">
//             <View className="items-center mt-6 mb-4">
//               <View
//                 className="px-4 py-1.5 rounded-3xl flex-row items-center border"
//                 style={{
//                   backgroundColor: link + "30",
//                   borderColor: link + "40",
//                 }}
//               >
//                 <MaterialCommunityIcons
//                   name="lightning-bolt"
//                   size={14}
//                   color={link}
//                 />
//                 <Text
//                   className="font-bold text-xs ml-1 uppercase tracking-tighter"
//                   style={{ color: link }}
//                 >
//                   7-Day Free Trial
//                 </Text>
//               </View>
//             </View>

//             {/* Main Title */}
//             <View className="items-center mb-8">
//               <Text
//                 className="text-3xl font-black text-center leading-tight"
//                 style={{ color: text }}
//               >
//                 Grow your Google
//               </Text>
//               <Text
//                 className="text-3xl font-black text-center leading-tight"
//                 style={{ color: link }}
//               >
//                 Business ranking
//               </Text>
//               <Text
//                 className="text-sm mt-3 font-medium"
//                 style={{ color: textMuted }}
//               >
//                 AI-powered GBP analytics — one simple plan
//               </Text>
//             </View>

//             {/* Plan Pricing Card */}
//             <View
//               className="border-2 rounded-[32px] p-6 mb-6"
//               style={{ backgroundColor: link + "30", borderColor: link + "30" }}
//             >
//               <View className="flex-row justify-between items-center mb-6">
//                 <View className="flex-row items-center">
//                   <View
//                     className="p-3 rounded-2xl mr-3"
//                     style={{ backgroundColor: link + "30" }}
//                   >
//                     <MaterialCommunityIcons
//                       name="lightning-bolt"
//                       size={28}
//                       color="white"
//                     />
//                   </View>
//                   <View>
//                     <View className="flex-row items-center">
//                       <Text
//                         className="text-xl font-bold mr-2"
//                         style={{ color: text }}
//                       >
//                         Starter
//                       </Text>
//                       <View
//                         className="px-3 py-1 rounded-2xl"
//                         style={{
//                           backgroundColor: link,
//                         }}
//                       >
//                         <Text className="text-xs font-bold uppercase text-white">
//                           Popular
//                         </Text>
//                       </View>
//                     </View>
//                     <Text className="text-xs mt-1" style={{ color: textMuted }}>
//                       1 location · 5 posts/mo · 30-day data
//                     </Text>
//                   </View>
//                 </View>
//                 <View className="items-end">
//                   <View className="flex-row items-start gap-1">
//                     <Text
//                       className="font-bold text-sm mt-1"
//                       style={{ color: link }}
//                     >
//                       ₹
//                     </Text>
//                     <Text
//                       className="text-3xl font-black"
//                       style={{ color: text }}
//                     >
//                       499
//                     </Text>
//                   </View>
//                   <Text
//                     className="text-xs font-bold"
//                     style={{ color: textMuted }}
//                   >
//                     per month
//                   </Text>
//                 </View>
//               </View>

//               <View
//                 className="h-[1px] mb-6"
//                 style={{ backgroundColor: link + "30" }}
//               />

//               {/* Features Grid */}
//               <View className="flex-row flex-wrap justify-between">
//                 <FeatureItem
//                   label="1 Google Business Profile"
//                   active
//                   activeColor={link}
//                   textColor={text}
//                 />
//                 <FeatureItem
//                   label="Analytics dashboard"
//                   active
//                   activeColor={link}
//                   textColor={text}
//                 />
//                 <FeatureItem
//                   label="Review monitoring"
//                   active={false}
//                   activeColor={link}
//                   textColor={text}
//                 />
//                 <FeatureItem
//                   label="5 posts / month"
//                   active={false}
//                   activeColor={link}
//                   textColor={text}
//                 />
//                 <FeatureItem
//                   label="AI insights"
//                   active
//                   activeColor={link}
//                   textColor={text}
//                 />
//                 <FeatureItem
//                   label="Email support"
//                   active={false}
//                   activeColor={link}
//                   textColor={text}
//                 />
//               </View>
//             </View>

//             {/* Trust Badges */}
//             <View
//               className="rounded-2xl p-4 flex-row items-center justify-center mb-4 border"
//               style={{ backgroundColor: link + "30", borderColor: link + "30" }}
//             >
//               <Ionicons
//                 name="shield-checkmark-outline"
//                 size={18}
//                 color={link}
//               />
//               <Text className="font-bold text-xs ml-2" style={{ color: link }}>
//                 7-day free trial{" "}
//                 <Text className="font-normal">
//                   · Cancel anytime · No setup fees
//                 </Text>
//               </Text>
//             </View>

//             <View className="flex-row space-x-4 mb-8 gap-2 px-1">
//               <View
//                 className="rounded-xl py-3 px-2 w-1/2 gap-2 flex-row items-center justify-center"
//                 style={{ backgroundColor: link + "30" }}
//               >
//                 <Ionicons name="lock-closed" size={14} color="#f59e0b" />
//                 <Text
//                   className="font-bold text-sm capitalize"
//                   style={{ color: textMuted }}
//                 >
//                   Secured by Razorpay
//                 </Text>
//               </View>

//               <View
//                 className="rounded-xl py-3 px-2 w-1/2 gap-2 flex-row items-center justify-center"
//                 style={{ backgroundColor: link + "30" }}
//               >
//                 <Ionicons name="refresh" size={14} color="#3b82f6" />
//                 <Text
//                   className="font-bold text-sm capitalize"
//                   style={{ color: textMuted }}
//                 >
//                   Cancel anytime
//                 </Text>
//               </View>
//             </View>

//             {/* CTA Button */}
//             <TouchableOpacity
//               activeOpacity={0.8}
//               className="rounded-3xl py-5 flex-row items-center justify-center"
//               style={{ backgroundColor: link, opacity: isDisabled ? 0.5 : 1 }}
//               disabled={isDisabled}
//             >
//               <MaterialCommunityIcons
//                 name="lightning-bolt"
//                 size={20}
//                 color="white"
//               />
//               <Text className="font-black text-lg ml-2 text-white">
//                 Plan Active ✓
//               </Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </ScrollView>
//     </View>
//   );
// }

// // Reusable Component for the Info List
// function InfoRow({
//   label,
//   value,
//   isCode,
//   isBold,
//   isLast,
//   textColor,
//   valueColor,
// }: any) {
//   return (
//     <View
//       className={`flex-row justify-between py-4 ${!isLast ? "border-b border-slate-50" : ""}`}
//     >
//       <Text className="text-sm capitalize" style={{ color: textColor }}>
//         {label}
//       </Text>
//       <Text
//         className={`text-sm font-bold ${isCode ? "font-mono" : ""} ${isBold ? "font-bold" : ""}`}
//         style={{ color: valueColor }}
//       >
//         {value}
//       </Text>
//     </View>
//   );
// }

// // Sub-component for individual feature items
// function FeatureItem({
//   label,
//   active,
//   activeColor,
//   textColor,
// }: {
//   label: string;
//   active: boolean;
//   activeColor: string;
//   textColor: string;
// }) {
//   return (
//     <View className="flex-row items-center w-[48%] mb-5">
//       <View
//         className="rounded-full p-0.5"
//         style={{ backgroundColor: active ? activeColor : activeColor + "30" }}
//       >
//         <Ionicons
//           name="checkmark"
//           size={12}
//           color={active ? textColor : activeColor}
//         />
//       </View>
//       <Text
//         className={`ml-3 text-sm flex-1`}
//         style={{ color: active ? activeColor : textColor }}
//       >
//         {label}
//       </Text>
//     </View>
//   );
// }
