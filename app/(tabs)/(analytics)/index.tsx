import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { useColor } from "@/hooks/useColor";
import { GoogleG } from "@/components/ui/icons";
import {
  ChevronDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Feather,
  WifiOff,
  Building2,
  RefreshCw,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import MetricCard from "@/components/ui/metricCard";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/services/auth.util";
import { useUser } from "@/services/(user)/user.service";
import { FRONTEND_URL } from "@/config/.env";
import InitialSkeleton from "@/components/ui/initialSkeleton";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import Svg, { Circle } from "react-native-svg";
import React from "react";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { useFreeTrialStatus } from "@/hooks/useFreeTrialStatus";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionGate from "@/components/SubscriptionGate";

const screenWidth = Dimensions.get("window").width;

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type RangeKey = "7d" | "30d" | "90d";

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
interface ImpressionDay {
  date: string;
  desktop: number;
  mobile: number;
}
interface ActionDay {
  date: string;
  calls: number;
  website: number;
  directions: number;
}
interface SeriesPoint {
  date: string;
  value: number;
}
interface ImpressionBreak {
  desktopMaps: number;
  desktopSearch: number;
  mobileMaps: number;
  mobileSearch: number;
}

interface AnalysisData {
  success: boolean;
  range: string;
  startDate: string;
  endDate: string;
  summary: AnalysisSummary;
  charts: {
    impressionsByDay: ImpressionDay[];
    actionsByDay: ActionDay[];
    impressionBreakdown: ImpressionBreak;
    ratingDistribution: Record<number, number>;
    callSeries: SeriesPoint[];
    websiteSeries: SeriesPoint[];
    directionSeries: SeriesPoint[];
  };
  recentReviews: {
    author: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
  }[];
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const RANGES: { id: RangeKey; label: string }[] = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
];
const PIE_COLORS = ["#3b82f6", "#6366f1", "#06b6d4", "#8b5cf6"];

/* ══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
══════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.2, 0.64, 1] },
  },
};
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.26, 0.64, 1] },
  },
};
const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
async function fetchAnalysis(
  locationId: string,
  range: RangeKey,
): Promise<AnalysisData> {
  const res = await fetch(
    `${FRONTEND_URL}/api/google/analysis?locationId=${locationId}&range=${range}`,
    {
      headers: { Authorization: `Bearer ${await getToken()}` },
    },
  );
  console.log("Data from analytics: ", res);
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to load analysis");
  return json;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
function fmtDateShort(s: string): string {
  const d = new Date(s);
  return `${d.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]}`;
}
function pct(a: number, b: number) {
  if (!b) return "0%";
  return Math.round((a / b) * 100) + "%";
}
function trendIcon(val: number, isDark: boolean) {
  if (val > 0) return <TrendingUp size={12} className="text-green-400" />;
  if (val < 0) return <TrendingDown size={12} className="text-red-400" />;
  return (
    <Minus size={12} className={isDark ? "text-slate-500" : "text-slate-400"} />
  );
}
const RatingRing = ({ avgRating, text, textMuted }: any) => {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const fillPercentage = (avgRating / 5) * 100;
  const strokeDashoffset =
    circumference - (circumference * fillPercentage) / 100;

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={textMuted + "20"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="orange"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <View className="items-center">
        <Text className="text-3xl font-black" style={{ color: text }}>
          {avgRating}
        </Text>
        <Text className="text-sm font-bold" style={{ color: textMuted }}>
          / 5.0
        </Text>
      </View>
    </View>
  );
};
function ChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const primary = useColor("primary");
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";
  return (
    <View
      className="rounded-2xl border overflow-hidden mb-4"
      style={{
        backgroundColor: isDark ? primary : primaryForeground,
        borderColor: link + "50",
      }}
    >
      {/* Header Section */}
      <View
        className="flex-row items-start justify-between px-4 pt-4 pb-3 border-b"
        style={{
          borderBottomColor: link + "50",
        }}
      >
        <View className="flex-1">
          <Text className="text-md font-bold" style={{ color: text }}>
            {title}
          </Text>

          {subtitle && (
            <Text className="text-sm mt-0.5" style={{ color: textMuted }}>
              {subtitle}
            </Text>
          )}
        </View>

        {action && <View className="ml-2">{action}</View>}
      </View>

      <View className="p-4">{children}</View>
    </View>
  );
}

function RefreshButton({ refetch, isFetching, isDark }: any) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (isFetching) {
      animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
    } else {
      rotateAnim.setValue(0);
    }

    return () => animation?.stop();
  }, [isFetching]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <TouchableOpacity
      onPress={refetch}
      activeOpacity={0.7}
      disabled={isFetching}
      className={`w-9 h-9 items-center justify-center rounded-xl  ${isFetching ? "opacity-40" : ""}`}
      style={{ backgroundColor: useColor("textMuted") + "30" }}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <RefreshCw size={16} color={useColor("text")} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AnalyticsScreen() {
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const red = useColor("red");
  const [active, setActive] = useState("90 days");

  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const user = useSelector((state: RootState) => state.auth.user);
  // const { data: user, isLoading: userLoading } = useUser();

  const [range, setRange] = useState<RangeKey>("90d");
  const [activeChart, setActiveChart] = useState<"area" | "bar">("area");
  const [showDl, setShowDl] = useState(false);
  const dlRef = useRef<View>(null);

  // useEffect(() => {
  //   const handler = (e: MouseEvent) => {
  //     if (dlRef.current && !dlRef.current.contains(e.target as Node))
  //       setShowDl(false);
  //   };
  //   document.addEventListener("mousedown", handler);
  //   return () => document.removeEventListener("mousedown", handler);
  // }, []);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<AnalysisData>({
      queryKey: ["google-analysis", user?.googleLocationId, range],
      queryFn: () => fetchAnalysis(user!.googleLocationId!, range),
      enabled: !!user?.googleLocationId,
      staleTime: 5 * 60_000,
    });

  const impData = useMemo(
    () =>
      (data?.charts.impressionsByDay ?? []).map((d) => ({
        name: fmtDateShort(d.date),
        desktop: d.desktop,
        mobile: d.mobile,
        total: d.desktop + d.mobile,
      })),
    [data],
  );

  const labels = impData.map((d) => d.name);

  const desktopData = impData.map((d) => d.desktop);
  const mobileData = impData.map((d) => d.mobile);

  const actData = useMemo(
    () =>
      (data?.charts.actionsByDay ?? []).map((d) => ({
        name: fmtDateShort(d.date),
        Calls: d.calls,
        Website: d.website,
        Directions: d.directions,
      })),
    [data],
  );

  const actLabels = actData.map((d) => d.name);

  const callsData = actData.map((d) => d.Calls);
  const websiteData = actData.map((d) => d.Website);
  const directionsData = actData.map((d) => d.Directions);

  const pieData = useMemo(() => {
    const b = data?.charts.impressionBreakdown;
    if (!b) return [];
    return [
      { name: "Desktop Maps", value: b.desktopMaps },
      { name: "Desktop Search", value: b.desktopSearch },
      { name: "Mobile Maps", value: b.mobileMaps },
      { name: "Mobile Search", value: b.mobileSearch },
    ].filter((d) => d.value > 0);
  }, [data]);
  const pieChartData = pieData.map((item, index) => ({
    name: item.name,
    population: item.value,
    color: PIE_COLORS[index % PIE_COLORS.length],
    legendFontColor: "#9CA3AF",
    legendFontSize: 10,
  }));

  const ratingMax = useMemo(() => {
    if (!data) return 1;
    return Math.max(...Object.values(data.charts.ratingDistribution), 1);
  }, [data]);

  const s = data?.summary;
  const isInitial = isLoading && !data;
  const locationName =
    user?.googleLocationName ?? "Please connect your business.";

  const ratings = [
    {
      stars: 5,
      count: data?.charts.ratingDistribution[5] ?? 0,
      color: "#22C55E",
    },
    {
      stars: 4,
      count: data?.charts.ratingDistribution[4] ?? 0,
      color: "#A3E635",
    },
    {
      stars: 3,
      count: data?.charts.ratingDistribution[3] ?? 0,
      color: "#FACC15",
    },
    {
      stars: 2,
      count: data?.charts.ratingDistribution[2] ?? 0,
      color: "#FB923C",
    },
    {
      stars: 1,
      count: data?.charts.ratingDistribution[1] ?? 0,
      color: "#F87171",
    },
  ];

  const analytics = [
    {
      id: "1",
      title: "Impressions",
      value: s?.totalImpressions,
      subHeading: "Total views",
      icon: "eye-outline",
      color: "#9333ea",
    },
    {
      id: "2",
      title: "Calls",
      value: s?.totalCalls,
      subHeading: "Phone interactions",
      icon: "call-outline",
      color: "#16a34a",
    },
    {
      id: "3",
      title: "Website Clicks",
      value: s?.totalWebsite,
      subHeading: "Link visits",
      icon: "globe-outline",
      color: "#2563eb",
    },
    {
      id: "4",
      title: "Directions",
      value: s?.totalDirections,
      subHeading: "Map requests",
      icon: "navigate-outline",
      color: "#f97316",
    },
    {
      id: "5",
      title: "Avg Rating",
      value: `${s?.avgRating} ★`,
      subHeading: "2709 reviews",
      icon: "star-outline",
      color: "#facc15",
      desc: `${s?.totalReviews} reviews`,
    },
    {
      id: "6",
      title: "Reply Rate",
      value: `${s?.replyRate}%`,
      subHeading: "Reviews replied",
      icon: "chatbubble-outline",
      color: "#06b6d4",
      desc: "Reviews Replied",
    },
  ];

  const engagementData = [
    {
      label: "Phone Calls",
      value: s?.totalCalls ?? 0,
      percentage: s?.totalImpressions ?? 0,
      color: "#22C55E",
      icon: "call-outline",
      bg: "#F0FDF4",
    },
    {
      label: "Website Visits",
      value: s?.totalWebsite ?? 0,
      percentage: s?.totalImpressions ?? 0,
      color: "#8B5CF6",
      icon: "globe-outline",
      bg: "#F5F3FF",
    },
    {
      label: "Direction Requests",
      value: s?.totalDirections ?? 0,
      percentage: s?.totalImpressions ?? 0,
      color: "#F97316",
      icon: "paper-plane-outline",
      bg: "#FFF7ED",
    },
    {
      label: "Conversations",
      value: s?.totalConversations ?? 0,
      percentage: s?.totalImpressions ?? 0,
      color: "#06B6D4",
      icon: "chatbubble-outline",
      bg: "#ECFEFF",
    },
  ];

  const { isActive, isLoading: loading, isExpired } = useSubscription();
  const { trialExpired } = useFreeTrialStatus();

  // useEffect(() => {
  //   if (loading) return;
  // }, [isActive, isExpired, trialExpired, loading]);
  // if (!isActive) return <SubscriptionGate />;
  // if (userLoading) {
  //   return <ActivityIndicator color={link} />;
  // }
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text
          className="text-md font-bold text-center"
          style={{ color: textMuted }}
        >
          Loading...
        </Text>
      </View>
    );
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
        gap: 16,
        padding: 24,
        backgroundColor: primary,
      }}
    >
      <View className="flex flex-row my-2">
        <View className="gap-3">
          <View className="flex-row justify-between w-full">
            <View className="flex-row gap-4">
              <View
                className="border rounded-lg flex justify-center p-2 flex-2"
                style={{
                  borderColor: textMuted,
                  backgroundColor: textMuted + "30",
                }}
              >
                <GoogleG />
              </View>
              <Text className="text-2xl font-black" style={{ color: text }}>
                Google Analytics
              </Text>
            </View>
            {user?.googleLocationId && (
              <RefreshButton refetch={refetch} isFetching={isFetching} />
            )}
            {/* <Pressable
              className="rounded-lg px-3 flex-row items-center gap-3"
              style={{ backgroundColor: link }}
            >
              <Text className="text-center text-white">Report</Text>
              <ChevronDown size={20} color={text} />
            </Pressable> */}
          </View>
          <View className="flex items-start w-3/4">
            {user?.googleLocationName && (
              <Text className="text-sm font-bold" style={{ color: textMuted }}>
                {user?.googleLocationName}
              </Text>
            )}
          </View>
        </View>
      </View>
      <View className="flex-row gap-2">
        {RANGES.map((r) => (
          <View className="w-[25%]" key={r.id}>
            <TonePill
              label={r.label}
              active={range === r.id}
              onPress={() => setRange(r.id)}
              activeColor={link}
              color={text}
              bgColor={textMuted + "30"}
            />
          </View>
        ))}
      </View>

      {isError && (
        <View
          className={`rounded-2xl p-4 mt-5 flex-row items-start border mb-4`}
          style={{ backgroundColor: red + "30", borderColor: red }}
        >
          <View className="flex-1">
            <Text
              className="text-md font-semibold mb-0.5"
              style={{ color: red }}
            >
              Failed to load analytics
            </Text>

            <Text className="text-sm" style={{ color: red }}>
              {/* {error?.message || "Something went wrong"} */}
              Please login again.
            </Text>

            <TouchableOpacity
              onPress={() => refetch()}
              activeOpacity={0.7}
              className="mt-2"
            >
              <Text className="text-smfont-semibold" style={{ color: red }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isInitial && user?.googleLocationId && (
        <InitialSkeleton isInitial={isInitial} isDark={isDark} />
      )}

      {isFetching && <InitialSkeleton isInitial={isInitial} isDark={isDark} />}

      {!user?.googleLocationId && (
        <View
          className="rounded-2xl p-8 items-center border gap-1 mt-5"
          style={{
            backgroundColor: primaryForeground,
            borderColor: link + "30",
          }}
        >
          <Building2 size={32} className="mb-3" color={textMuted} />

          <Text className="text-md font-semibold mb-1" style={{ color: text }}>
            No Google Business Linked
          </Text>

          <Text className="text-sm text-center" style={{ color: textMuted }}>
            Go to your Profile page and link your GBP to start managing reviews.
          </Text>
        </View>
      )}

      {data && s && (
        <>
          <View
            className="px-3 py-1.5 my-3 w-[40%] rounded-2xl border flex-row gap-3 items-center justify-center"
            style={{ borderColor: link, backgroundColor: link + "20" }}
          >
            <Calendar size={15} color={link} />
            <Text style={{ color: link }} className="text-center text-sm">
              {fmtDate(data.startDate)} – {fmtDate(data.endDate)}
            </Text>
          </View>

          {/* Metrics */}
          <View className="flex-row flex-wrap justify-between">
            {analytics.map((metric) => (
              <MetricCard item={metric} key={metric.title} />
            ))}
          </View>

          <View className="">
            <ChartCard
              title="Impressions Over Time"
              subtitle={`Desktop + Mobile · ${range}`}
              action={
                <View className="flex-row gap-2">
                  {(["area", "bar"] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setActiveChart(t)}
                      activeOpacity={0.8}
                      className={`h-8 px-3 rounded-lg items-center justify-center`}
                      style={{
                        backgroundColor:
                          activeChart === t ? link : textMuted + "30",
                      }}
                    >
                      <Text
                        className={`text-sm font-bold capitalize`}
                        style={{ color: text }}
                      >
                        {t === "area" ? "Area" : "Bar"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              }
            >
              <View className="w-full">
                {/* ── CHART 1 — Impressions ── */}
                <View className="w-full">
                  {activeChart === "area" ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <LineChart
                        data={{
                          labels,
                          datasets: [
                            {
                              data: desktopData,
                              color: () => "#3b82f6",
                              strokeWidth: 2,
                            },
                            {
                              data: mobileData,
                              color: () => "#06b6d4",
                              strokeWidth: 2,
                            },
                          ],
                        }}
                        width={Math.max(labels.length * 60, screenWidth)} // ✅ dynamic width
                        height={220}
                        withDots={false}
                        withShadow
                        chartConfig={{
                          backgroundGradientFrom: primary,
                          backgroundGradientTo: primary,
                          decimalPlaces: 0,
                          color: (opacity = 1) =>
                            `rgba(255,255,255,${opacity})`,
                          labelColor: () => "#9CA3AF",
                          propsForBackgroundLines: {
                            strokeDasharray: "3 3",
                            stroke: "#374151",
                          },
                        }}
                        style={{ borderRadius: 16 }}
                      />
                    </ScrollView>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <BarChart
                        data={{
                          labels,
                          datasets: [
                            { data: desktopData },
                            { data: mobileData },
                          ],
                        }}
                        width={Math.max(labels.length * 60, screenWidth)}
                        height={220}
                        fromZero
                        chartConfig={{
                          backgroundGradientFrom: primary,
                          backgroundGradientTo: primary,
                          decimalPlaces: 0,
                          color: (opacity = 1) =>
                            `rgba(255,255,255,${opacity})`,
                          labelColor: () => "#9CA3AF",
                          propsForBackgroundLines: {
                            strokeDasharray: "3 3",
                            stroke: "#374151",
                          },
                        }}
                        style={{ borderRadius: 16 }}
                      />
                    </ScrollView>
                  )}
                </View>
              </View>
            </ChartCard>
            {/* Actions Chart */}
            <ChartCard
              title="Customer Actions"
              subtitle={`Calls · Website · Directions · ${range}`}
            >
              <View className="w-full">
                {/* ── CHART 1 — Impressions ── */}
                <View className="w-full">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <LineChart
                      data={{
                        labels: actLabels,
                        datasets: [
                          {
                            data: callsData,
                            color: () => "#22c55e",
                            strokeWidth: 2,
                          },
                          {
                            data: websiteData,
                            color: () => "#8b5cf6",
                            strokeWidth: 2,
                          },
                          {
                            data: directionsData,
                            color: () => "#f97316",
                            strokeWidth: 2,
                          },
                        ],
                      }}
                      width={Math.max(labels.length * 60, screenWidth)}
                      height={220}
                      withDots={false}
                      withShadow={false}
                      withInnerLines={true}
                      chartConfig={{
                        backgroundGradientFrom: primary,
                        backgroundGradientTo: primary,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                        labelColor: () => "#9CA3AF",
                        propsForBackgroundLines: {
                          strokeDasharray: "3 3",
                          stroke: "#374151",
                        },
                      }}
                      style={{
                        borderRadius: 16,
                      }}
                    />
                  </ScrollView>

                  {/* 🔥 Manual Legend (since chart-kit is limited) */}
                  <View className="flex-row flex-wrap gap-4 mt-3 px-2">
                    <View className="flex-row items-center gap-1">
                      <View className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      <Text className="text-xs text-gray-400">Calls</Text>
                    </View>

                    <View className="flex-row items-center gap-1">
                      <View className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <Text className="text-xs text-gray-400">Website</Text>
                    </View>

                    <View className="flex-row items-center gap-1">
                      <View className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <Text className="text-xs text-gray-400">Directions</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ChartCard>

            {pieChartData.length > 0 && (
              <ChartCard
                title="Impression Sources"
                subtitle="Where customers found you"
              >
                <View className="flex-row items-center gap-4 mx-4">
                  {/* ── PIE CHART ── */}
                  <View className="flex-1">
                    <PieChart
                      data={pieChartData}
                      width={screenWidth * 0.6}
                      height={160}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="10"
                      hasLegend={false}
                      chartConfig={{
                        color: () => "#fff",
                      }}
                      absolute // shows values instead of %
                    />
                  </View>

                  {/* ── SIDE LEGEND (like your web) ── */}
                  <View className="flex-col gap-2 shrink-0">
                    {pieData.map((d, i) => (
                      <View key={i} className="flex-row items-center gap-2">
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />

                        <View>
                          <Text
                            className="text-sm font-semibold"
                            style={{ color: textMuted }}
                          >
                            {d.name}
                          </Text>
                          <Text
                            className="text-[12px] font-bold"
                            style={{ color: text }}
                          >
                            {d.value}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </ChartCard>
            )}
          </View>

          <View className="rounded-3xl mt-3 mb-3">
            {/* Header Section */}
            <View className="mb-8">
              <Text className="text-xl font-black mb-1" style={{ color: text }}>
                Engagement Summary
              </Text>
              <Text
                className="text-sm font-medium"
                style={{ color: textMuted }}
              >
                Total actions this period
              </Text>
            </View>

            <View>
              {engagementData.map((item, index) => (
                <View
                  key={index}
                  className="rounded-3xl py-4 mb-4 flex-row items-center"
                >
                  <View
                    className={`${item.bg} p-3 rounded-3xl items-center justify-center`}
                    style={{ backgroundColor: item.color + "30" }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={item.color}
                    />
                  </View>

                  <View className="flex-1 ml-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text
                        className="font-bold text-[15px]"
                        style={{ color: text }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        className="font-black text-lg"
                        style={{ color: text }}
                      >
                        {item.value}
                      </Text>
                    </View>

                    <View
                      className="h-1.5 w-full rounded-full overflow-hidden mb-1.5"
                      style={{ backgroundColor: textMuted }}
                    >
                      <View
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: item.color,
                          width:
                            item.value === 0
                              ? 0
                              : (pct(item.value, item.percentage) as any),
                        }}
                      />
                    </View>

                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: textMuted }}
                    >
                      {pct(item.value, item.percentage)} of impressions
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View
            className="rounded-3xl p-6 border shadow-sm"
            style={{
              backgroundColor: primary,
              borderColor: link + "30",
              shadowColor: link,
            }}
          >
            <View className="mb-6">
              <Text className="text-xl font-black mb-1" style={{ color: text }}>
                Review Analysis
              </Text>
              <Text
                className="text-sm font-medium"
                style={{ color: textMuted }}
              >
                {s.totalReviews} total · {s.avgRating}★ avg
              </Text>
            </View>

            <View className="flex-row items-center justify-between mb-8">
              <RatingRing
                avgRating={s.avgRating}
                text={text}
                textMuted={textMuted}
              />

              <View className="flex-1 ml-8">
                {ratings.map((item) => (
                  <View
                    key={item.stars}
                    className="flex-row items-center mb-1.5"
                  >
                    <Text
                      className="text-[10px] font-bold w-3"
                      style={{ color: textMuted }}
                    >
                      {item.stars}
                    </Text>
                    <Ionicons
                      name="star"
                      size={10}
                      color={item.color}
                      className="mx-1"
                    />
                    <View className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-2">
                      <View
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: item.color,
                          width: `${(item.count / 19) * 100}%`,
                        }}
                      />
                    </View>
                    <Text
                      className="text-[10px] font-bold w-4 text-right"
                      style={{ color: textMuted }}
                    >
                      {item.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* --- REPLY RATE BANNER --- */}
            <View
              className="rounded-2xl py-4 flex-row items-center justify-between mb-5"
              // style={{ backgroundColor: link + "20" }}
            >
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={18}
                  color={link}
                />
                <Text
                  className="ml-2 font-bold text-sm"
                  style={{ color: text }}
                >
                  Reply Rate
                </Text>
              </View>
              <View className="flex-row items-center flex-1 justify-end">
                <View
                  className="h-2 w-24 rounded-full overflow-hidden mr-3"
                  style={{ backgroundColor: text }}
                >
                  <View
                    className="h-full"
                    style={{ backgroundColor: link, width: `${s.replyRate}%` }}
                  />
                </View>
                <Text className="font-black text-sm" style={{ color: text }}>
                  {s.replyRate}%
                </Text>
              </View>
            </View>

            {/* --- RECENT REVIEWS --- */}
            {data.recentReviews.length > 0 && (
              <>
                <Text
                  className="text-sm font-bold uppercase tracking-widest mb-4"
                  style={{ color: textMuted }}
                >
                  Recent Reviews
                </Text>

                <View>
                  {data.recentReviews.map((r, i) => (
                    <ReviewCard key={i} review={r} isDark={isDark} index={i} />
                  ))}
                </View>
              </>
            )}
          </View>

          {s.totalPosts > 0 && (
            <View
              className="flex-row items-center justify-between p-4 rounded-3xl border shadow-sm mt-5"
              style={{
                backgroundColor: primaryForeground + "30",
                borderColor: link + "50",
              }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="p-3 rounded-3xl mr-4"
                  style={{ backgroundColor: "#3B82F6" + "20" }}
                >
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={24}
                    color="#3B82F6"
                  />
                </View>

                <View>
                  <Text
                    className="text-lg font-black tracking-tight"
                    style={{ color: text }}
                  >
                    Active Posts
                  </Text>
                  <Text
                    className="text-sm font-medium"
                    style={{ color: textMuted }}
                  >
                    Published on Google Business
                  </Text>
                </View>
              </View>

              <Text className="text-3xl font-black" style={{ color: text }}>
                {s.totalPosts}
              </Text>
            </View>
          )}

          <Text
            className="text-sm text-center mt-5 mb-20"
            style={{ color: textMuted }}
          >
            Data sourced from Google Business Profile Performance API. Insights
            may have a 24–48 hour delay.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const TonePill = ({
  label,
  active,
  onPress,
  activeColor,
  color,
  bgColor,
}: any) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center justify-center px-2 py-2.5 rounded-lg gap-2`}
    style={{
      backgroundColor: active ? activeColor : bgColor,
    }}
  >
    <Text
      className={`font-black text-xs text-center`}
      style={{ color: active ? "white" : color }}
    >
      {label}
    </Text>
  </Pressable>
);

const ReviewCard = ({
  review,
  isDark,
  index,
}: {
  review: {
    author: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
  };
  isDark: boolean;
  index: number;
}) => {
  const textColor = useColor("text");
  const textMuted = useColor("textMuted");
  const linkColor = useColor("link");
  const green = useColor("green");

  const [exp, setExp] = useState(false);

  return (
    <View
      className="rounded-xl py-3 px-4 mb-3 border"
      style={{
        backgroundColor: linkColor + "30",
        borderColor: linkColor + "40",
      }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center">
          <View
            className={` w-10 h-10 rounded-full items-center justify-center`}
            style={{ backgroundColor: linkColor }}
          >
            <Text className="text-white font-bold">
              {review.author[0]?.toUpperCase()}
            </Text>
          </View>
          <View className="ml-3">
            <Text className="font-bold text-sm" style={{ color: textColor }}>
              {review.author}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View className="flex-row gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const activeColor = "#f59e0b";
                  const isFilled = i < review.rating;
                  return (
                    <View key={i}>
                      <Ionicons
                        name={isFilled ? "star" : "star"}
                        size={10}
                        color={isFilled ? activeColor : textMuted}
                      />
                    </View>
                  );
                })}
              </View>
              <Text className="ml-2 text-sm" style={{ color: textMuted }}>
                {fmtDate(review.date)}
              </Text>
            </View>
          </View>
        </View>
        {review.replied && (
          <Text className="text-sm font-bold" style={{ color: green }}>
            Replied
          </Text>
        )}
      </View>
      {review.comment && (
        <Text className="text-sm leading-5 mb-1" style={{ color: textColor }}>
          {exp || review.comment.length <= 80
            ? review.comment
            : review.comment.slice(0, 80) + "… "}
          {review.comment.length > 80 && (
            <Text
              style={{ color: linkColor }}
              className="font-bold text-sm"
              onPress={() => setExp((v) => !v)}
            >
              {exp ? "Less" : "More"}
            </Text>
          )}
        </Text>
      )}
    </View>
  );
};
