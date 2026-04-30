import { Text as BNAText } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import "@/global.css";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import {
  Lightbulb,
  BrainCircuit,
  RotateCw,
  PersonStanding,
  User,
  ArrowUp,
  ArrowDown,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/services/auth.util";
import { FRONTEND_URL } from "@/config/.env";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { useUser } from "@/services/(user)/user.service";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  useDerivedValue,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface GaugeProps {
  score: number;
  maxScore?: number;
  change?: number;
  isDark?: boolean;
}

const MetricRow = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => (
  <View style={styles.metricRow}>
    <Text style={[styles.metricLabel, { color: "#c4c4c8" }]}>{label}</Text>
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${(value / total) * 100}%`, backgroundColor: color },
        ]}
      />
    </View>
    <Text style={[styles.metricValue, { color: "white" }]}>
      {value}/{total}
    </Text>
  </View>
);

const StatBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) => (
  <View
    style={{ backgroundColor: color }}
    className="w-[31%] px-3 py-1.5 rounded-xl items-center"
  >
    <Text className="text-white font-bold text-lg">{value}</Text>
    <Text className="text-white text-sm">{label}</Text>
  </View>
);

/* ══════════════════════════════════════════════════════════
   BAND LABELS  (0–1000 scale)
══════════════════════════════════════════════════════════ */
const BANDS = [
  { label: "Poor", from: 0, to: 299 },
  { label: "Fair", from: 300, to: 499 },
  { label: "Good", from: 500, to: 649 },
  { label: "Very Good", from: 650, to: 799 },
  { label: "Excellent", from: 800, to: 1000 },
];

/* ══════════════════════════════════════════════════════════
   COLOR INTERPOLATION
══════════════════════════════════════════════════════════ */
const STOPS = [
  { p: 0, hex: "#ef4444" },
  { p: 0.25, hex: "#f97316" },
  { p: 0.5, hex: "#eab308" },
  { p: 0.75, hex: "#84cc16" },
  { p: 1.0, hex: "#22c55e" },
];

/* ══════════════════════════════════════════════════════════
   SCORE LABEL
══════════════════════════════════════════════════════════ */
function getMeta(score: number, max = 1000) {
  const p = score / max;
  if (p < 0.3)
    return { label: "Poor", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  if (p < 0.5)
    return { label: "Fair", color: "#f97316", bg: "rgba(249,115,22,0.1)" };
  if (p < 0.65)
    return { label: "Good", color: "#eab308", bg: "rgba(234,179,8,0.1)" };
  if (p < 0.8)
    return { label: "Very Good", color: "#84cc16", bg: "rgba(132,204,22,0.1)" };
  return { label: "Excellent", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
}
interface ScoreBreakdown {
  completeness: {
    score: number;
    max: number;
    items: Record<string, { score: number; max: number; has: boolean }>;
  };
  reputation: {
    score: number;
    max: number;
    items: Record<string, { score: number; max: number }>;
  };
  activity: {
    score: number;
    max: number;
    items: Record<string, { score: number; max: number }>;
  };
}

function computeScore(
  location: any,
  totalReviews: number,
  avgRating: number,
  replyRate: number,
  postsLast30d: number,
  recentRepliedPct: number,
  isVerified: boolean,
): { total: number; breakdown: ScoreBreakdown } {
  /* ── COMPLETENESS (400 pts) ── */
  const hasTitle = !!location?.title;
  const hasPrimaryCat = !!location?.categories?.primaryCategory;
  const hasAddlCat =
    (location?.categories?.additionalCategories ?? []).length > 0;
  const hasDescription = (location?.profile?.description ?? "").length >= 50;
  const hasPhone = !!location?.phoneNumbers?.primaryPhone;
  const hasWebsite = !!location?.websiteUri;
  const addr = location?.storefrontAddress;
  const hasAddress = !!(
    addr?.addressLines?.length &&
    addr?.locality &&
    addr?.regionCode
  );
  const hasHours = (location?.regularHours?.periods ?? []).length > 0;
  const hasSpecialHours =
    (location?.specialHours?.specialHourPeriods ?? []).length > 0;
  const hasCoverPhoto = !!location?.metadata?.hasCoverPhoto;

  const completenessItems = {
    title: { score: hasTitle ? 50 : 0, max: 50, has: hasTitle },
    primaryCategory: {
      score: hasPrimaryCat ? 60 : 0,
      max: 60,
      has: hasPrimaryCat,
    },
    additionalCat: { score: hasAddlCat ? 30 : 0, max: 30, has: hasAddlCat },
    description: {
      score: hasDescription ? 60 : 0,
      max: 60,
      has: hasDescription,
    },
    primaryPhone: { score: hasPhone ? 50 : 0, max: 50, has: hasPhone },
    websiteUri: { score: hasWebsite ? 50 : 0, max: 50, has: hasWebsite },
    storefrontAddress: { score: hasAddress ? 60 : 0, max: 60, has: hasAddress },
    regularHours: { score: hasHours ? 40 : 0, max: 40, has: hasHours },
    specialHours: {
      score: hasSpecialHours ? 10 : 0,
      max: 10,
      has: hasSpecialHours,
    },
    coverPhoto: { score: hasCoverPhoto ? 40 : 0, max: 40, has: hasCoverPhoto },
  };

  const completenessScore = Object.values(completenessItems).reduce(
    (a, v) => a + v.score,
    0,
  );

  /* ── REPUTATION (350 pts) ── */
  const ratingScore = Math.round(clamp(avgRating / 5) * 60);
  const reviewLogScore =
    totalReviews === 0
      ? 0
      : Math.round(clamp(Math.log(totalReviews + 1) / Math.log(201)) * 60);
  const replyRateScore = Math.round(clamp(replyRate / 100) * 80);
  const reviewTierScore =
    totalReviews === 0
      ? 0
      : totalReviews <= 5
        ? 30
        : totalReviews <= 20
          ? 70
          : totalReviews <= 50
            ? 110
            : 150;

  const reputationItems = {
    avgRating: { score: ratingScore, max: 60 },
    reviewVolume: { score: reviewLogScore, max: 60 },
    replyRate: { score: replyRateScore, max: 80 },
    reviewTier: { score: reviewTierScore, max: 150 },
  };

  const reputationScore = Object.values(reputationItems).reduce(
    (a, v) => a + v.score,
    0,
  );

  /* ── ACTIVITY (250 pts) ── */
  const postScore = Math.round(clamp(postsLast30d / 4) * 100);
  const recentReplyScore = Math.round(clamp(recentRepliedPct) * 100);
  const verifiedScore = isVerified ? 50 : 0;

  const activityItems = {
    postsLast30d: { score: postScore, max: 100 },
    repliedRecent: { score: recentReplyScore, max: 100 },
    verified: { score: verifiedScore, max: 50 },
  };

  const activityScore = Object.values(activityItems).reduce(
    (a, v) => a + v.score,
    0,
  );

  const total = completenessScore + reputationScore + activityScore;

  return {
    total,
    breakdown: {
      completeness: {
        score: completenessScore,
        max: 400,
        items: completenessItems,
      },
      reputation: { score: reputationScore, max: 350, items: reputationItems },
      activity: { score: activityScore, max: 250, items: activityItems },
    },
  };
}

function clamp(v: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

interface ProfileScoreData {
  success: boolean;
  score: number;
  maxScore: number;
  change: number;
  meta: {
    locationName: string;
    avgRating: number;
    totalReviews: number;
    replyRate: number;
    postsLast30d: number;
    isVerified: boolean;
    isOpen: boolean;
  };
  missing: string[];
  breakdown: {
    completeness: { score: number; max: number };
    reputation: { score: number; max: number };
    activity: { score: number; max: number };
  };
}

export interface ProfileScoreResponse extends Partial<ProfileScoreData> {
  success: boolean;
  error?: string;
}

function AnimatedGauge({ score, maxScore = 100, change = 0 }: GaugeProps) {
  const size = 340;
  const radius = 110;
  const strokeWidth = 20;
  const cx = size / 2;
  const cy = 160;

  const circumference = radius * Math.PI;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / maxScore, {
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [score, maxScore, progress]);

  // Animated Props for the progress stroke
  const animatedPathProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - circumference * progress.value,
  }));

  // Calculate the tip (needle) position based on current progress
  const tipX = useDerivedValue(() => {
    const angle = interpolate(progress.value, [0, 1], [Math.PI, 0]);
    return cx + radius * Math.cos(angle);
  });

  const tipY = useDerivedValue(() => {
    const angle = interpolate(progress.value, [0, 1], [Math.PI, 0]);
    return cy - radius * Math.sin(angle);
  });

  const animatedCircleProps = useAnimatedProps(() => ({
    cx: tipX.value,
    cy: tipY.value,
  }));

  const activeClr =
    score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const trackBg = useColor("textMuted");

  return (
    <View className="items-center justify-center relative">
      <Svg width={size} height={150} viewBox={`0 0 ${size} 200`}>
        {/* Background Track */}
        <Path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={trackBg}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Animated Progress Fill */}
        <AnimatedPath
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={activeClr}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedPathProps}
        />

        {/* The Needle/Tip Indicator */}
        <AnimatedCircle
          animatedProps={animatedCircleProps}
          r={strokeWidth / 2 + 12}
          fill={activeClr}
          opacity={0.15}
        />
        <AnimatedCircle
          animatedProps={animatedCircleProps}
          r={strokeWidth / 2 + 4}
          fill={useColor("text")}
          stroke={activeClr}
          strokeWidth={2.5}
        />
        <AnimatedCircle
          animatedProps={animatedCircleProps}
          r={4}
          fill={activeClr}
        />
      </Svg>

      {/* Center Overlay Content */}
      <View className="absolute bottom-4 items-center" style={{ bottom: 20 }}>
        {change !== 0 && (
          <View
            className="flex-row items-center px-2 py-0.5 rounded-full mb-1 border"
            style={{
              backgroundColor:
                change > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              borderColor:
                change > 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
            }}
          >
            {change > 0 ? (
              <ArrowUp size={10} color="#22c55e" strokeWidth={3} />
            ) : (
              <ArrowDown size={10} color="#ef4444" strokeWidth={3} />
            )}
            <Text
              className="text-sm font-bold ml-1"
              style={{ color: change > 0 ? "#22c55e" : "#ef4444" }}
            >
              {change > 0 ? "+" : ""}
              {change} pts
            </Text>
          </View>
        )}

        <Text
          className="text-5xl font-bold"
          style={{ color: useColor("text"), letterSpacing: -2 }}
        >
          {score}
        </Text>

        <Text
          className="text-md font-medium opacity-50"
          style={{ color: useColor("text") }}
        >
          out of {maxScore}
        </Text>
      </View>
    </View>
  );
}

function Skeleton({ isDark }: { isDark: boolean }) {
  const pulse = isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0";
  const bg = isDark ? "#0f1624" : "#fff";
  const borderColor = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(37,99,235,0.07)";
  const shadowColor = isDark ? "rgba(0,0,0,.6)" : "rgba(37,99,235,.12)";

  return (
    <View
      className="w-[340px] rounded-[28px] flex-col gap-4"
      style={{
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor,
        shadowColor,
        shadowOpacity: 1,
        shadowRadius: isDark ? 30 : 24,
        shadowOffset: { width: 0, height: isDark ? 24 : 16 },
        elevation: 4,
      }}
    >
      {/* Header row */}
      <View className="flex-row justify-between items-center">
        <View>
          <View
            className="rounded-md mb-1.5"
            style={{ width: 80, height: 10, backgroundColor: pulse }}
          />
          <View
            className="rounded-md"
            style={{ width: 140, height: 14, backgroundColor: pulse }}
          />
        </View>
        <View
          className="rounded-xl"
          style={{ width: 72, height: 28, backgroundColor: pulse }}
        />
      </View>

      {/* Image placeholder */}
      <View
        className="w-full items-center justify-center rounded-xl"
        style={{ height: 200, backgroundColor: pulse }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            borderWidth: 3,
            borderColor: isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0",
          }}
        />
      </View>

      {/* Footer row */}
      <View className="flex-row gap-1">
        {[...Array(5)].map((_, i) => (
          <View
            key={i}
            className="flex-1 rounded-md"
            style={{ height: 36, backgroundColor: pulse }}
          />
        ))}
      </View>
    </View>
  );
}

// const getStatusColor = (s: string): string => {
//   if (s === "Very Good") return "#7CB342";
//   if (s === "Excellent") return "#C8E6C9";
//   return "#fff";
// };

const ScoreCard = () => {
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");
  const green = useColor("green");
  const yellow = useColor("yellow");

  const [mounted, setMounted] = useState(false);
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";

  useEffect(() => setMounted(true), []);

  const { data: user, isLoading: userLoading } = useUser();

  const { data, isLoading } = useQuery<ProfileScoreData>({
    queryKey: ["profile-score", user?.googleLocationId],
    queryFn: async () => {
      const res = await fetch(
        `${FRONTEND_URL}/api/google/accounts/profile-score?locationId=${user!.googleLocationId}`,
        { headers: { Authorization: `Bearer ${await getToken()}` } },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      return json;
    },
    enabled: !!user?.googleLocationId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const score = data?.score ?? 0;
  const maxScore = data?.maxScore ?? 1000;
  const change = data?.change ?? 0;

  /* ── early returns ── */
  // if (userLoading) return <Skeleton isDark={false} />;
  // if (!user?.googleLocationId) return <NotConnected isDark={isDark} />;
  // if (isLoading) return <Skeleton isDark={isDark} />;

  const meta = getMeta(score, maxScore);

  const subScores = data?.breakdown
    ? [
        {
          label: "Profile",
          score: data.breakdown.completeness.score,
          max: data.breakdown.completeness.max,
          color: "#3b82f6",
        },
        {
          label: "Reputation",
          score: data.breakdown.reputation.score,
          max: data.breakdown.reputation.max,
          color: "#f59e0b",
        },
        {
          label: "Activity",
          score: data.breakdown.activity.score,
          max: data.breakdown.activity.max,
          color: "#22c55e",
        },
      ]
    : [];

  return (
    <View className="pt-5 px-6">
      <View
        className="shadow-md p-5 border rounded-3xl"
        style={{
          backgroundColor: primary,
          shadowColor: link,
          borderColor: link,
        }}
      >
        {/* Header Section */}
        <View className="flex-row items-start justify-between">
          <View>
            <Text style={[styles.labelTitle, { color: textMuted }]}>
              PROFILE SCORE
            </Text>
            <Text style={[styles.userName, { color: text }]} numberOfLines={1}>
              {data?.meta.locationName ?? "Google Business Profile"}
            </Text>
          </View>
          <View
            className="flex-row items-center px-3 py-1 rounded-3xl border"
            style={{
              borderColor: meta.color + "80",
              backgroundColor: meta.color + "20",
            }}
          >
            <View style={[styles.dot, { backgroundColor: meta.color }]} />
            <Text
              style={{ color: meta.color }}
              className="text-sm font-semibold"
            >
              {meta.label}
            </Text>
          </View>
        </View>

        {/* Gauge Chart Section */}
        <AnimatedGauge score={score} maxScore={maxScore} change={change} />

        {/* Status Toggles */}
        <View style={styles.statusRow}>
          {BANDS.map((b, i) => {
            const active = score >= b.from && score <= b.to;
            const c = STOPS[i].hex;
            return (
              <View
                key={b.label}
                className="border px-2 py-1 rounded-lg justify-center flex items-center"
                style={{
                  backgroundColor: active ? `${c}20` : primary,
                  borderColor: active ? `${c}50` : "transparent",
                }}
              >
                <View style={{ backgroundColor: c }} className="w-5 h-1 mb-2" />
                <Text
                  style={{
                    color: active ? c : text,
                  }}
                  className="text-xs"
                >
                  {b.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Progress Metrics */}
        {subScores.length > 0 && (
          <View style={styles.metricsContainer}>
            {subScores.map((s) => {
              return (
                <MetricRow
                  key={s.label}
                  label={s.label}
                  value={s.score}
                  total={s.max}
                  color={s.color}
                />
              );
            })}
          </View>
        )}

        {/* Stats Grid */}
        {data?.meta && (
          <View style={styles.statsGrid}>
            <StatBox
              label="Rating"
              value={data.meta.avgRating > 0 ? `${data.meta.avgRating}★` : "—"}
              color={link}
            />
            <StatBox
              label="Reviews"
              value={String(data.meta.totalReviews)}
              color={link}
            />
            <StatBox
              label="Posts/mo"
              value={String(data.meta.postsLast30d)}
              color={link}
            />
          </View>
        )}

        {data?.missing && data.missing.length > 0 && (
          <Pressable
            className="flex-row items-center px-3 py-5  rounded-2xl border gap-3 mb-5"
            style={{
              backgroundColor: primary,
              borderColor: yellow,
            }}
            onPress={() => {}}
          >
            <Lightbulb color={yellow} size={20} />

            {/* Message Text */}
            <View className="flex-1">
              <Text
                className="text-md font-semibold leading-[16px]"
                style={{
                  color: yellow,
                }}
              >
                {data.missing[0]}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Footer Button */}
        <TouchableOpacity
          style={[
            styles.improveButton,
            { backgroundColor: useColor("indigo") },
          ]}
          onPress={() => router.push("/(tabs)/(home)/GBPScreen")}
        >
          <View style={styles.improveContent}>
            <BrainCircuit color="white" size={20} />
            <Text style={[styles.improveText, { color: "white" }]}>
              Improve Google Score
            </Text>
          </View>
          <View style={styles.aiBadge}>
            <Text style={styles.aiText}>✨ AI</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 16 },
  labelTitle: { fontSize: 12, fontWeight: "bold" },
  userName: { fontSize: 16, fontWeight: "bold", width: 180 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: { fontWeight: "bold", fontSize: 12 },
  gaugeContainer: { alignItems: "center", marginVertical: 10 },
  scoreTextContainer: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
  },
  scoreValue: { fontSize: 45, fontWeight: "bold" },
  scoreSubtext: { fontSize: 12 },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statusItem: { alignItems: "center", flex: 1, padding: 4 },
  statusActive: {
    backgroundColor: "#175928",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#34C759",
  },
  statusText: { fontSize: 10 },
  statusTextActive: { fontWeight: "bold" },
  metricsContainer: { marginBottom: 20 },
  metricRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  metricLabel: { width: 80, fontSize: 13, fontWeight: "600" },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    marginHorizontal: 10,
  },
  progressFill: { height: 6, borderRadius: 3 },
  metricValue: {
    width: 60,
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "right",
  },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statValue: { fontSize: 16, fontWeight: "bold" },
  statLabel: { fontSize: 11 },
  suggestionBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  suggestionText: {
    marginLeft: 12,
    fontWeight: "600",
    fontSize: 14,
  },
  improveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  improveContent: { flexDirection: "row", alignItems: "center" },
  improveText: { fontWeight: "bold", marginLeft: 10 },
  aiBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiText: { color: "white", fontSize: 10, fontWeight: "bold" },
});

export default ScoreCard;
