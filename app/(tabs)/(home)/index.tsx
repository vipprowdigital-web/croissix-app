import { useColor } from "@/hooks/useColor";
import "@/global.css";
import ScoreCard from "./score-card";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import Reanimated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withDelay,
  Easing as ReanimatedEasing,
} from "react-native-reanimated";

import {
  Phone,
  Globe,
  Navigation,
  FileText,
  ArrowUpRight,
  MessageCircle,
  MessageCircle as ChatBubbleIcon,
  FileText as DocumentIcon,
  ChevronRight,
  BarChart2,
  Star,
  Zap,
  RotateCw,
  AlertCircle,
  WifiOff,
  MessageSquare,
} from "lucide-react-native";
import HorizontalList from "./horizontal-list";
import { useUser } from "@/services/(user)/user.service";
import { useQuery } from "@tanstack/react-query";
import Svg, { Circle, Path } from "react-native-svg";
import AutoSlider from "./auto-slider";
import SocialMediaCard from "./social-media-card";
import { facebookDetails, instagramCardDetails } from "./seed";
import { Footer } from "@/components/ui/footer";
import { Href, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { FRONTEND_URL } from "@/config/.env";
import { getToken } from "@/services/auth.util";
import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import React from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useFreeTrialStatus } from "@/hooks/useFreeTrialStatus";
import SubscriptionGate from "@/components/SubscriptionGate";

export const platforms = [
  {
    id: "1",
    name: "Google",
    status: "Live",
    statusColor: "text-green-500",
    dotColor: "bg-green-500",
    icon: "logo-google",
    color: "#4285F4",
    bgColor: "bg-blue-50",
  },
  {
    id: "2",
    name: "Facebook",
    status: "Soon",
    statusColor: "text-orange-500",
    dotColor: "bg-orange-500",
    icon: "logo-facebook",
    color: "#1877F2",
    bgColor: "bg-blue-50",
  },
  {
    id: "3",
    name: "Instagram",
    status: "Soon",
    statusColor: "text-orange-500",
    dotColor: "bg-orange-500",
    icon: "logo-instagram",
    color: "#E4405F",
    bgColor: "bg-pink-50",
  },
];

const ActionItem = ({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ color: string; size: number }>;
  label: string;
  value: string;
}) => (
  <View className="flex-1 items-center border-r border-blue-400/20 last:border-r-0">
    <Icon color="white" size={15} />
    <Text className="text-white font-bold text-lg">{value}</Text>
    <Text className="text-blue-100 text-xs font-bold">{label}</Text>
  </View>
);

const HighlightBox = ({
  label,
  value,
  color,
  bgColor,
  textColor,
}: {
  label: string;
  value: string;
  color: string;
  bgColor: string;
  textColor: string;
}) => (
  <View
    className="border p-2 rounded-2xl w-[31%] items-center"
    style={{ backgroundColor: bgColor + "30", borderColor: bgColor }}
  >
    <Text className="font-black text-lg" style={{ color: color }}>
      {value}
    </Text>
    <Text
      className="text-xs text-center font-bold"
      style={{ color: textColor }}
    >
      {label}
    </Text>
  </View>
);

export const quickActions = [
  {
    id: "new-post",
    name: "New Post",
    icon: "add-outline",
    color: "#10B981",
    redirectTo: "/CreatePostScreen",
  },
  {
    id: "reviews",
    name: "Reviews",
    icon: "chatbubble-outline",
    color: "#F59E0B",
    redirectTo: "/(reviews)",
  },
  {
    id: "photos",
    name: "Photos",
    icon: "image-outline",
    color: "#3B82F6",
    redirectTo: "/GooglePhotosScreen",
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: "bar-chart-outline",
    color: "#6366F1",
    redirectTo: "/(analytics)",
  },
  {
    id: "my-posts",
    name: "My Posts",
    icon: "document-text-outline",
    color: "#EF4444",
    redirectTo: "/(post)",
  },
];

interface AnalysisSummary {
  totalImpressions: number;
  totalCalls: number;
  totalWebsite: number;
  totalDirections: number;
  totalConversations: number;
  totalReviews: number;
  avgRating: number;
  replyRate: number;
  totalPosts: number;
}
interface AnalysisData {
  success: boolean;
  summary: AnalysisSummary;
  charts: {
    impressionsByDay: { date: string; desktop: number; mobile: number }[];
  };
  recentReviews: {
    author: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
  }[];
}
interface MetricCardData {
  name: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  sparkData?: number[];
}
interface Competitor {
  name: string;
  rating: number;
  reviews: number;
  position: number;
}

const reviews = [
  {
    id: "1",
    name: "Vikas Sahu",
    initial: "V",
    color: "bg-emerald-500",
    date: "15 Jan",
    comment: "No comment",
  },
  {
    id: "2",
    name: "Rashi Singh",
    initial: "R",
    color: "bg-indigo-600",
    date: "29 Dec",
    comment: "Very satisfied with the support from Vip prow. Our...",
  },
  {
    id: "3",
    name: "Gaurav Yadav",
    initial: "G",
    color: "bg-emerald-500",
    date: "23 Dec",
    comment: "Vipin Sir’s mentorship at Vipprow helped me start m...",
  },
];
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n ?? 0);
}

function greet() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}
async function fetchHomeAnalysis(locationId: string): Promise<AnalysisData> {
  const res = await fetch(
    `${FRONTEND_URL}/api/google/analysis?locationId=${locationId}&range=30d`,
    {
      headers: { Authorization: `Bearer ${await getToken()}` },
    },
  );
  const json = await res.json();
  console.log("Response from home analysis: ", res);

  if (!json.success) throw new Error(json.error ?? "Failed");
  return json;
}

function generateCompetitors(r: number): Competitor[] {
  return [
    {
      name: "DigiEdge Pro",
      rating: Math.min(5, +(r + 0.3).toFixed(1)),
      reviews: 312,
      position: 1,
    },
    {
      name: "LocalBoost Co",
      rating: Math.min(5, +(r + 0.1).toFixed(1)),
      reviews: 198,
      position: 2,
    },
    { name: "Your Business", rating: r, reviews: 0, position: 3 },
    {
      name: "CityMarket",
      rating: Math.max(1, +(r - 0.2).toFixed(1)),
      reviews: 145,
      position: 4,
    },
    {
      name: "NearShop Plus",
      rating: Math.max(1, +(r - 0.5).toFixed(1)),
      reviews: 89,
      position: 5,
    },
  ];
}

function Sk({
  isDark,
  className = "",
}: {
  isDark: boolean;
  className?: string;
}) {
  return (
    <View
      className={`animate-pulse rounded-xl ${
        isDark ? "bg-white/10" : "bg-slate-200/80"
      } ${className}`}
    />
  );
}
function HomeSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <View className="flex flex-col md:flex-row gap-5 mx-7 mt-5">
      {/* Left column */}
      <View className="flex flex-col gap-5 flex-1">
        {[0, 1, 2].map((i) => (
          <Sk
            key={i}
            isDark={isDark}
            className={`${i === 1 ? "h-44" : "h-28"} w-full rounded-3xl`}
          />
        ))}
      </View>

      {/* Right column */}
      <View className="flex flex-col gap-5 flex-1">
        {[0, 1, 2].map((i) => (
          <Sk key={i} isDark={isDark} className="h-28 w-full rounded-3xl" />
        ))}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOT CONNECTED BANNER
═══════════════════════════════════════════════════════════════ */
function NotConnectedBanner({
  isDark,
  onGo,
}: {
  isDark: boolean;
  onGo: () => void;
}) {
  return (
    <Pressable
      onPress={onGo}
      className={`rounded-2xl border p-4 my-3 flex-row items-center gap-3 mx-7
        ${isDark ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"}`}
    >
      <View
        className={`w-10 h-10 rounded-2xl items-center justify-center shrink-0`}
      >
        <AlertCircle size={18} color={useColor("yellow")} />
      </View>

      <View className="flex-1">
        <Text
          className={`text-md font-bold `}
          style={{ color: useColor("text") }}
        >
          Connect Google Business
        </Text>
        <Text className="text-sm" style={{ color: useColor("textMuted") }}>
          Link your profile to unlock live analytics
        </Text>
      </View>

      <View>
        <ChevronRight size={15} color={useColor("textMuted")} />
      </View>
    </Pressable>
  );
}

const RatingRing = ({
  summary,
  text,
  textMuted,
}: {
  summary: AnalysisSummary;
  text: string;
  textMuted: string;
}) => {
  const size = 64;
  const strokeWidth = 6;
  const radius = 26;
  const circumference = radius * 2 * Math.PI;

  // 1. Calculate the health score (Same formula as your web version)
  const score = Math.round(
    (summary.avgRating / 5) * 40 +
      (summary.replyRate / 100) * 30 +
      Math.min(summary.totalReviews / 100, 1) * 30,
  );

  // 2. Determine color and label based on score
  const sc = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Great" : score >= 50 ? "Good" : "Low";

  // 3. Static calculation for the ring fill
  const fillPercentage = score / 100;
  const strokeDashoffset = circumference - circumference * fillPercentage;

  return (
    <View
      className="items-center justify-center relative"
      style={{ width: size, height: size }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* Background Track Circle */}
        <Circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={textMuted ? `${textMuted}20` : "rgba(0,0,0,0.06)"}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <Circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={sc}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>

      {/* Centered Text Overlay */}
      <View className="absolute inset-0 items-center justify-center">
        <Text
          className="text-[16px] font-black leading-none"
          style={{ color: text || "#000" }}
        >
          {score}
        </Text>
        <Text className="text-[8px] font-bold mt-0.5" style={{ color: sc }}>
          {label}
        </Text>
      </View>
    </View>
  );
};

function InsightTip({
  summary,
  onAction,
  link,
  text,
  textMuted,
}: {
  summary: AnalysisSummary;
  onAction: (r: Href) => void;
  link: string;
  text: string;
  textMuted: string;
}) {
  const tip = useMemo(() => {
    const tips = [
      ...(summary.replyRate < 50
        ? [
            {
              icon: <MessageSquare size={18} color="#06b6d4" />,
              color: "#06b6d4",
              title: "Low Reply Rate",
              desc: `Only ${summary.replyRate}% of reviews have been replied. Boost trust by responding.`,
              cta: "Reply Now",
              route: "/(tabs)/(reviews)" as Href,
            },
          ]
        : []),
      ...(summary.totalPosts === 0
        ? [
            {
              icon: <FileText size={18} color="#8b5cf6" />,
              color: "#8b5cf6",
              title: "No Posts This Month",
              desc: "Businesses that post regularly get 4× more views.",
              cta: "Create Post",
              route: "/(post)/CreatePostScreen" as Href,
            },
          ]
        : []),
      {
        icon: <BarChart2 size={18} color="#3b82f6" />,
        color: "#3b82f6",
        title: "Analytics Available",
        desc: `${fmt(summary.totalImpressions)} impressions in 30 days. See the full breakdown.`,
        cta: "View Analytics",
        route: "/(tabs)/(analytics)" as Href,
      },
    ];
    return tips[0];
  }, [summary]);

  if (!tip) return null;

  return (
    <View
      className={`rounded-2xl border p-4 flex-row items-center
       mx-7`}
      style={{ backgroundColor: "transparent", borderColor: link }}
    >
      {/* Icon Wrapper */}
      <View
        className="w-9 h-9 rounded-xl flex items-center justify-center mr-3"
        style={{ backgroundColor: `${tip.color}18` }}
      >
        {tip.icon}
      </View>

      <View className="flex-1">
        <Text className={`text-md font-bold mb-0.5`} style={{ color: text }}>
          {tip.title}
        </Text>

        <Text className={`text-xs leading-4 `} style={{ color: textMuted }}>
          {tip.desc}
        </Text>

        <TouchableOpacity
          onPress={() => onAction(tip.route)}
          activeOpacity={0.7}
          className="mt-2 w-full flex-row items-center gap-2"
        >
          <Text className="text-sm" style={{ color: link }}>
            {tip.cta}
          </Text>
          <ChevronRight size={18} color={link} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const StarRating = ({
  rating,
  textMuted,
}: {
  rating: number;
  textMuted: string;
}) => {
  const rc: Record<number, string> = {
    5: "#22c55e",
    4: "#84cc16",
    3: "#f59e0b",
    2: "#f97316",
    1: "#ef4444",
  };

  const activeColor = rc[rating] || "#f59e0b";
  const inactiveColor = textMuted + "20";

  return (
    <View className="flex-row gap-1">
      {[...Array(5)].map((_, j) => (
        <View key={j}>
          <Star
            size={9}
            fill={j < rating ? activeColor : inactiveColor}
            color={j < rating ? activeColor : inactiveColor}
          />
        </View>
      ))}
    </View>
  );
};

const DEFAULT_WA_NUMBER = "919669932121";
const WA_MESSAGE = encodeURIComponent(
  "Hi Croissix! I'd like to learn more about growing my business with your platform.",
);

export default function HomeScreen() {
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const textMuted = useColor("textMuted");
  const text = useColor("text");
  const green = useColor("green");
  const indigo = useColor("indigo");
  const yellow = useColor("yellow");
  const orange = useColor("orange");
  const primary = useColor("primary");
  const red = useColor("red");

  const router = useRouter();

  const scrollRef = useRef<ScrollView | null>(null);
  const fbRef = useRef<View | null>(null);
  const igRef = useRef<View | null>(null);
  const { data: user, isLoading: userLoading } = useUser();
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";
  const { isActive, isLoading: loading, isExpired } = useSubscription();
  const { trialExpired } = useFreeTrialStatus();

  // useEffect(() => {
  //   if (loading) return;
  // }, [isActive, isExpired, trialExpired, loading]);

  const categories = ["Digital", "Software", "Website", "SEO", "Branding"];

  const waUrl = `https://wa.me/${DEFAULT_WA_NUMBER}?text=${WA_MESSAGE}`;

  const handleClick = async () => {
    await WebBrowser.openBrowserAsync(waUrl);
  };

  // const scrollTo = (id: "facebook" | "instagram" | "google") => {
  //   const m: Record<string, React.RefObject<View | null>> = {
  //     facebook: fbRef,
  //     instagram: igRef,
  //   };

  //   if (id === "google") {
  //     scrollRef.current?.scrollTo({ y: 0, animated: true });
  //     return;
  //   }

  //   m[id]?.current?.measureLayout(
  //     scrollRef.current!.getInnerViewNode(),
  //     (x, y) => {
  //       scrollRef.current?.scrollTo({ y, animated: true });
  //     },
  //     () => {},
  //   );
  // };
  const scrollTo = (id: string) => {
    if (id === "facebook") {
      fbRef.current?.measureLayout(
        scrollRef.current!.getInnerViewNode(),
        (x, y) => scrollRef.current?.scrollTo({ y, animated: true }),
        () => {},
      );
    } else if (id === "instagram") {
      igRef.current?.measureLayout(
        scrollRef.current!.getInnerViewNode(),
        (x, y) => scrollRef.current?.scrollTo({ y, animated: true }),
        () => {},
      );
    } else if (id === "google") {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError,
    refetch,
  } = useQuery<AnalysisData>({
    queryKey: ["home-analytics", user?.googleLocationId],
    queryFn: () => fetchHomeAnalysis(user!.googleLocationId!),
    enabled: !!user?.googleLocationId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const isLoading = userLoading || (analyticsLoading && !analytics);
  const sparkData = useMemo(() => {
    return (
      analytics?.charts?.impressionsByDay?.map((d) => d.desktop + d.mobile) ??
      []
    );
  }, [analytics?.charts?.impressionsByDay]);
  const s = analytics?.summary;
  const competitors = s ? generateCompetitors(s.avgRating) : [];
  // console.log("Spark Data: ", sparkData);
  // console.log("Analytics: ", s);

  const metrics = s
    ? [
        {
          id: "1",
          name: "Views",
          value: fmt(s.totalImpressions),
          desc: "Impressions",
          icon: "eye-outline",
          color: "#3b82f6",
        },
        {
          id: "2",
          name: "Calls",
          value: fmt(s.totalCalls),
          desc: "Call clicks",
          icon: "call-outline",
          color: "#22c55e",
        },
        {
          id: "3",
          name: "Website",
          value: fmt(s.totalWebsite),
          desc: "Link clicks",
          icon: "globe-outline",
          color: "#8b5cf6",
        },
        {
          id: "4",
          name: "Directions",
          value: fmt(s.totalDirections),
          desc: "Map requests",
          icon: "paper-plane-outline",
          color: "#f97316",
        },
        {
          id: "5",
          name: "Leads",
          value: fmt(s.totalCalls + s.totalDirections + s.totalConversations),
          desc: "Total leads",
          icon: "disc-outline",
          color: "#06b6d4",
        },
        {
          id: "6",
          name: "Reviews",
          value: s.totalReviews,
          desc: `${s.avgRating}★ avg`,
          icon: "star-outline",
          color: "#f59e0b",
        },
      ]
    : [];

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isLoading, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // if (!isActive && trialExpired) return <SubscriptionGate />;
  if (loading) {
    return <ActivityIndicator color={link} />;
  }
  if (userLoading) {
    return <ActivityIndicator color={link} />;
  }
  const hasValidSubscription = isActive && !isExpired;
  const canAccess = hasValidSubscription || !trialExpired;

  if (!canAccess) {
    return <SubscriptionGate />;
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        paddingTop: 10,
        backgroundColor: primary,
      }}
    >
      <View className="flex-row px-7">
        <View className="flex-1">
          <Text
            style={{
              color: text,
              fontSize: 20,
              opacity: 0.8,
            }}
          >
            {greet()} 👋,
          </Text>
          <Text style={{ color: text, fontSize: 24, fontWeight: "bold" }}>
            {user?.name?.split(" ")[0] ?? "Welcome"}
          </Text>
          <Text
            className="text-sm flex-shrink"
            style={{
              color: text,
              fontWeight: "bold",
              marginTop: 2,
            }}
          >
            {user?.googleLocationName ?? ""}
          </Text>
        </View>
        <View className="flex-row gap-2">
          {analytics && (
            <Pressable
              className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
              style={{ backgroundColor: textMuted + "30" }}
              onPress={() => refetch()}
              disabled={isLoading}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <RotateCw size={18} color={text} />
              </Animated.View>
            </Pressable>
          )}
          {user?.name && (
            <Pressable
              className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
              style={{ backgroundColor: link }}
              onPress={() => router.push("/(tabs)/(profile)")}
            >
              <Text className="text-md font-bold text-white">
                {user?.name[0]}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {isLoading && <HomeSkeleton isDark={isDark} />}

      {!isLoading && (
        <>
          {/* ─── NOT CONNECTED / ERROR (full width) ─── */}
          {!user?.googleLocationName && (
            <NotConnectedBanner
              isDark={isDark}
              onGo={() => router.push("/(tabs)/(profile)")}
            />
          )}
          {isError && user?.googleLocationId && (
            <View
              className={`rounded-2xl border p-4 my-3 flex-row items-center gap-3 mx-7`}
              style={{ backgroundColor: red + "20", borderColor: red }}
            >
              <WifiOff size={16} color={red} />
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: red }}>
                  Failed to load analytics
                </Text>
                <Pressable
                  onPress={() => {
                    refetch();
                    router.push("/(auth)/login");
                  }}
                >
                  <Text
                    className="text-sm font-semibold  mt-0.5"
                    style={{ color: red }}
                  >
                    Tap to retry
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          {/* SCORE CARD */}
          {user?.googleLocationId && !isLoading && <ScoreCard />}

          <HorizontalList
            list={platforms}
            heading="Your Platforms"
            subHeading="All channels in one place"
            headerRequired={true}
            redirect={false}
            onScrollTo={scrollTo}
          />

          {/* SECTION 1: TOP STATS CARD */}
          {s && (
            <Pressable onPress={() => router.push("/(tabs)/(analytics)")}>
              <View className="mb-4 my-10 px-7">
                <View className="flex-row justify-between items-center mb-4 px-1">
                  <View>
                    <Text className="text-xl font-bold" style={{ color: text }}>
                      Google Business
                    </Text>
                    <Text className="text-xs" style={{ color: textMuted }}>
                      Live · Last 30 days
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => router.push("/(tabs)/(analytics)")}
                  >
                    <Text
                      className=" font-semibold mr-1"
                      style={{ color: link }}
                    >
                      Full report
                    </Text>
                    <ArrowUpRight size={16} color={link} />
                  </TouchableOpacity>
                </View>

                <View
                  className="rounded-[32px] overflow-hidden shadow-xl"
                  style={{ backgroundColor: link }}
                >
                  {/* Blueprint Grid Background Effect */}
                  <View className="p-6">
                    {/* Header Row */}
                    <View className="flex-row justify-between items-start">
                      <View className="flex-row items-center">
                        <View
                          className="p-2 rounded-full mr-3"
                          style={{ backgroundColor: text }}
                        >
                          <View className="w-6 h-6 items-center justify-center">
                            <Text
                              className="font-black text-xl"
                              style={{ color: indigo }}
                            >
                              G
                            </Text>
                          </View>
                        </View>
                        <View>
                          <Text className="text-white font-bold tracking-widest text-xs">
                            GOOGLE BUSINESS
                          </Text>
                          <Text className="text-blue-100 text-xs">
                            Last 30 days
                          </Text>
                        </View>
                      </View>
                      <View className="bg-blue-400/30 px-3 py-1 rounded-full flex-row items-center">
                        <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                        <Text className="text-green-300 text-[10px] font-bold">
                          Live
                        </Text>
                      </View>
                    </View>

                    {/* Main Stats Row */}
                    <View className="flex-row justify-between items-end mt-6">
                      <View>
                        <View className="flex-row items-baseline">
                          <Text className="text-white text-5xl font-black">
                            {fmt(s.totalImpressions)}
                          </Text>
                          <Text className="text-blue-100 ml-2 mb-1">views</Text>
                        </View>
                        <View className="flex-row mt-1 items-center">
                          <Text className="font-bold" style={{ color: green }}>
                            {fmt(
                              s.totalCalls +
                                s.totalDirections +
                                s.totalConversations,
                            ) + " "}
                            <Text className="text-blue-100 font-normal">
                              leads
                            </Text>
                          </Text>
                          <Text
                            className="font-bold ml-3"
                            style={{ color: yellow }}
                          >
                            {s.avgRating}★{" "}
                            <Text className="text-blue-100 font-normal">
                              {s.totalReviews} reviews
                            </Text>
                          </Text>
                        </View>
                      </View>

                      {/* Sparkline Chart */}
                      <View className="items-end">
                        <Svg width="80" height="40" viewBox="0 0 80 40">
                          <Path
                            d="M0 35 L10 20 L20 30 L30 10 L40 25 L50 5 L60 30 L70 15 L80 20"
                            fill="none"
                            stroke="rgba(255,255,255,0.6)"
                            strokeWidth="2"
                          />
                        </Svg>
                        <Text
                          className="text-[10px] font-bold mt-1"
                          style={{ color: green }}
                        >
                          ↗ View details
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Grid Actions */}
                    <View className="flex-row mt-8 pt-4 border-t border-white/20">
                      <ActionItem
                        Icon={Phone}
                        label="CALLS"
                        value={fmt(s.totalCalls)}
                      />
                      <ActionItem
                        Icon={Globe}
                        label="WEBSITE"
                        value={fmt(s.totalWebsite)}
                      />
                      <ActionItem
                        Icon={Navigation}
                        label="DIRECTIONS"
                        value={fmt(s.totalDirections)}
                      />
                      <ActionItem
                        Icon={FileText}
                        label="POSTS"
                        value={fmt(s.totalPosts)}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          )}

          {/* SECTION 2: DARK GROWTH CARD */}
          <View
            className="rounded-[32px] p-5 mx-7 border border-slate-800 shadow-2xl mt-5"
            style={{ backgroundColor: primaryForeground }}
          >
            <View className="flex-row mb-6">
              <View
                className=" border  px-3 py-1 rounded-full mr-2"
                style={{ backgroundColor: green + "30", borderColor: green }}
              >
                <Text
                  className=" text-[10px] font-bold"
                  style={{ color: green }}
                >
                  ● LIVE · CROISSIX
                </Text>
              </View>
              <View
                className="border px-3 py-1 rounded-full"
                style={{ borderColor: yellow, backgroundColor: yellow + "30" }}
              >
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: yellow }}
                >
                  ✨ AI-POWERED
                </Text>
              </View>
            </View>

            <Text className="text-white text-3xl font-bold">
              Grow. Scale. <Text style={{ color: link }}>Dominate.</Text>
            </Text>
            <Text
              className=" text-sm leading-5 mb-8"
              style={{ color: textMuted }}
            >
              Improve your business — focus on growth, scale your profile, and
              outrank competitors with AI.
            </Text>

            {/* Small Highlight Cards */}
            <View className="flex-row justify-between mb-8">
              <HighlightBox
                label="More Reviews"
                value="3x"
                color={green}
                textColor={textMuted}
                bgColor={link}
              />
              <HighlightBox
                label="SEO Boost"
                value="47%"
                color={indigo}
                textColor={textMuted}
                bgColor={link}
              />
              <HighlightBox
                label="Avg Time Saved"
                value="5h/wk"
                color={yellow}
                textColor={textMuted}
                bgColor={link}
              />
            </View>

            {/* Tags */}
            <View className="flex-row flex-wrap gap-2 mb-10">
              {[
                "Google Reviews",
                "AI Replies",
                "Post Scheduler",
                "Analytics",
                "Profile Score",
              ].map((tag) => (
                <View
                  key={tag}
                  className="px-4 py-1.5 rounded-full border "
                  style={{ backgroundColor: link }}
                >
                  <Text className="text-xs font-semibold text-white">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              className=" flex-row items-center justify-center p-4 rounded-2xl shadow-lg shadow-green-500/50"
              style={{ backgroundColor: green }}
              onPress={handleClick}
            >
              <MessageCircle color="white" size={24} />
              <Text className="text-white font-bold text-lg ml-3">
                Chat with Us on WhatsApp
              </Text>
              <ArrowUpRight color="white" size={18} style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <Text
              className=" text-center text-xs mt-4"
              style={{ color: textMuted }}
            >
              {`Free consultation · No commitment · Reply in < 5 min`}
            </Text>
          </View>

          {/* Quick Actions */}
          <HorizontalList
            list={quickActions}
            heading="Quick Actions"
            headerRequired={true}
          />

          {metrics.length > 0 && (
            <>
              <View className="flex-row justify-between items-center mt-10 px-7">
                <View>
                  <Text className="text-xl font-bold" style={{ color: text }}>
                    Google Performance
                  </Text>
                  <Text className="text-xs" style={{ color: textMuted }}>
                    Last 30 days
                  </Text>
                </View>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => router.push("/(tabs)/(analytics)")}
                >
                  <Text className=" font-semibold mr-1" style={{ color: link }}>
                    Full report
                  </Text>
                  <ChevronRight size={16} color={link} />
                </TouchableOpacity>
              </View>

              <HorizontalList list={metrics} headerRequired={false} />
            </>
          )}

          {s && (
            <Text
              className="text-xl font-bold mb-4 px-7 mt-10"
              style={{ color: text }}
            >
              Review Health
            </Text>
          )}

          {/* Review Health Card */}
          {s && (
            <Pressable onPress={() => router.push("/(tabs)/(reviews)")}>
              <View
                className="rounded-3xl shadow-lg border mb-6 mx-7 p-6"
                style={{
                  backgroundColor: primaryForeground,
                  borderColor: link,
                  shadowColor: link,
                }}
              >
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-lg font-bold" style={{ color: text }}>
                    Review Health
                  </Text>
                  <ChevronRight size={20} color={textMuted} />
                </View>

                <View className="flex-row items-center gap-4">
                  {/* Progress Ring */}
                  <RatingRing summary={s} text={text} textMuted={textMuted} />

                  {/* Stats List */}
                  <View className="flex-1 gap-y-2">
                    <StatRow
                      label="Avg Rating"
                      value={`${s.avgRating}/5.0`}
                      progress={(s.avgRating / 5) * 100}
                      color="bg-orange-500"
                    />
                    <StatRow
                      label="Reply Rate"
                      value={`${s.replyRate}%`}
                      progress={s.replyRate}
                      color="bg-cyan-500"
                    />
                    <StatRow
                      label="Reviews"
                      value={String(s.totalReviews)}
                      progress={Math.min(s.totalReviews, 100)}
                      color="bg-purple-500"
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          )}

          {s && (
            <>
              <Text
                className="text-xl font-bold mb-1 px-7 mt-5"
                style={{ color: text }}
              >
                Smart Insights
              </Text>
              <Text className="text-xs mb-4 px-7" style={{ color: text }}>
                AI-powered recommendations
              </Text>
              {/* Smart Insights Card */}

              <InsightTip
                summary={s}
                onAction={(r) => router.push(r)}
                text={text}
                link={link}
                textMuted={textMuted}
              />
            </>
          )}

          {/* Recent Reviews */}
          {(analytics?.recentReviews?.length ?? 0) > 0 && (
            <View className="px-7 mt-10">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold" style={{ color: text }}>
                  Recent Reviews
                </Text>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => router.push("/(tabs)/(reviews)")}
                >
                  <Text className="font-medium mr-1" style={{ color: link }}>
                    All reviews
                  </Text>
                  <ChevronRight size={16} color={link} />
                </TouchableOpacity>
              </View>

              {/* Reviews Card Section */}
              <View
                className="rounded-3xl border p-4 mb-6"
                style={{
                  backgroundColor: primaryForeground,
                  borderColor: link,
                  shadowColor: primaryForeground,
                }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <Star size={18} color={yellow} fill="#f59e0b" />
                    <Text className="ml-2 font-bold" style={{ color: text }}>
                      Recent Reviews
                    </Text>
                  </View>
                  <View className="rounded-full px-2 py-0.5 bg-white">
                    <Text className="text-xs font-bold" style={{ color: link }}>
                      {analytics?.recentReviews.length}
                    </Text>
                  </View>
                </View>

                {analytics?.recentReviews.slice(0, 3).map((item, index) => (
                  <View
                    key={index}
                    className={`py-4 ${index !== reviews.length - 1 ? "border-b" : ""} mb-1`}
                    style={{ borderColor: textMuted }}
                  >
                    <View className="flex-row justify-between  items-start">
                      <View className="flex-row flex-1">
                        <View
                          className={`w-10 h-10 rounded-full items-center justify-center`}
                          style={{ backgroundColor: link }}
                        >
                          <Text className="text-white font-bold">
                            {item.author[0]?.toUpperCase()}
                          </Text>
                        </View>
                        <View className="ml-3 flex-1">
                          <Text
                            className="font-bold text-md"
                            style={{ color: text }}
                            numberOfLines={1}
                          >
                            {item.author}
                          </Text>
                          <Text
                            className="text-sm mt-0.5"
                            style={{ color: textMuted }}
                            numberOfLines={2}
                          >
                            {item.comment || "No Comment"}
                          </Text>
                        </View>
                      </View>
                      <View>
                        <StarRating
                          key={index}
                          rating={item.rating}
                          textMuted={textMuted}
                        />
                      </View>
                    </View>

                    <View
                      className="flex-row items-center mt-1"
                      style={{ marginLeft: 45 }}
                    >
                      <Text
                        className=" text-[10px] mr-3"
                        style={{ color: text }}
                      >
                        {new Date(item.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                      {item.replied && (
                        <View
                          className="px-2 py-0.5 rounded-md border"
                          style={{
                            backgroundColor: green + "40",
                            borderColor: green,
                          }}
                        >
                          <Text
                            className="text-[10px] font-bold"
                            style={{ color: green }}
                          >
                            Replied
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats Grid Section */}
          {s && (
            <View
              className="flex-row rounded-3xl border  shadow-sm overflow-hidden mx-7"
              style={{ backgroundColor: "transparent", borderColor: link }}
            >
              <StatItem
                value={fmt(s.totalConversations)}
                label="Conversations"
                color="text-cyan-500"
                showBorder
              />
              <StatItem
                value={String(s.totalPosts)}
                label="Posts Live"
                color="text-yellow-500"
                showBorder
              />
              <StatItem
                value={`${s.replyRate}%`}
                label="Reply Rate"
                color="text-emerald-500"
              />
            </View>
          )}

          <AutoSlider />

          <View className="flex-row items-center justify-center px-7 mt-10">
            <View
              className="h-[1px] flex-1"
              style={{ backgroundColor: link }}
            />
            <View
              className="mx-4 flex-row items-center px-4 py-1.5 rounded-full border"
              style={{ borderColor: link }}
            >
              <Zap size={14} color={link} fill={link} />
              <Text
                className="font-bold text-[10px] ml-1 tracking-widest uppercase"
                style={{ color: link }}
              >
                Social Media{" "}
                <Text
                  className="rounded-full px-2 py-1"
                  style={{ color: link }}
                >
                  SOON
                </Text>
              </Text>
            </View>
            <View
              className="h-[1px] flex-1"
              style={{ backgroundColor: link }}
            />
          </View>
          <ScrollView ref={scrollRef} className="flex-1">
            <View ref={fbRef}>
              <SocialMediaCard
                details={facebookDetails}
                heading="Facebook"
                subHeading="Pages • Ads • Messenger Analytics"
              />
            </View>
            <View ref={igRef}>
              <SocialMediaCard
                details={instagramCardDetails}
                heading="Instagram"
                subHeading="Feed • Reels • Stories Analytics"
              />
            </View>
          </ScrollView>

          <Footer />

          <View className="mb-10"></View>
        </>
      )}
    </ScrollView>
  );
}

// const FeatureItem = ({ label }: { label: string }) => (
//   <View className="flex-row items-center w-1/2 mb-4">
//     <View className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
//     <Text className="text-slate-600 text-[11px] font-medium">{label}</Text>
//   </View>
// );

const StatRow = ({
  label,
  value,
  progress,
  color,
}: {
  label: string;
  value: string;
  progress: number;
  color: string;
}) => {
  const displayWidth = progress <= 1 ? progress * 100 : progress;
  return (
    <View className="flex flex-col w-full">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs" style={{ color: "white" }}>
          {label}
        </Text>
        <Text className="text-xs font-bold " style={{ color: "white" }}>
          {value}
        </Text>
      </View>
      <View
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: "white" }}
      >
        <View
          className={`h-full rounded-full ${color}`}
          // style={{ width: `${progress * 100}%` }}
          style={{ width: `${Math.min(displayWidth, 100)}%` }}
        />
      </View>
    </View>
  );
};

const StatItem = ({ value, label, color, showBorder, showPercent }: any) => (
  <View
    className={`flex-1 items-center justify-center py-6 ${showBorder ? "border-r border-gray-200" : ""}`}
  >
    <Text className={`text-2xl font-black ${color}`}>{value}</Text>
    <Text className="text-white text-[10px] font-medium mt-1">{label}</Text>
  </View>
);
