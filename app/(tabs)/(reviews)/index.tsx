import { GoogleG } from "@/components/ui/icons";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useColor } from "@/hooks/useColor";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import MetricCard from "@/components/ui/metricCard";
import {
  Brain,
  Building2,
  CheckCircle2,
  Clock,
  Feather,
  LucideStar,
  RefreshCw,
  RotateCw,
  Search,
  Star,
  WifiOff,
  X,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "@/services/(user)/user.service";
import { getAuthHeader } from "@/libs/token";
import { FRONTEND_URL } from "@/config/.env";
import { getToken } from "@/services/auth.util";
import InitialSkeleton from "@/components/ui/initialSkeleton";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import React from "react";
import { useFreeTrialStatus } from "@/hooks/useFreeTrialStatus";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionGate from "@/components/SubscriptionGate";

const categories = [
  { label: "All", active: true },
  { label: "Unreplied", active: false },
  { label: "Replied", active: false },
  { label: "Positive", active: false },
  { label: "Negative", active: false },
];

const ratings = [
  { stars: 5, count: 32 },
  { stars: 4, count: 6 },
  { stars: 3, count: 4 },
  { stars: 2, count: 2 },
  { stars: 1, count: 6 },
];

const totalLoaded = ratings.reduce((acc, curr) => acc + curr.count, 0);

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface GoogleReview {
  name: string;
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}
interface Review {
  name: string;
  id: string;
  author: string;
  initials: string;
  rating: number;
  date: string;
  text: string;
  replied: boolean;
  reply?: string;
  helpful: number;
  sentiment: "positive" | "neutral" | "negative";
  flagged: boolean;
}
type FilterType = "all" | "replied" | "unreplied" | "positive" | "negative";
type SortType = "newest" | "oldest" | "rating_high" | "rating_low";
interface AIItem {
  reviewId: string;
  author: string;
  rating: number;
  text: string;
  status: "pending" | "thinking" | "writing" | "posting" | "done" | "failed";
  reply?: string;
}

function sentimentCls(s: Review["sentiment"], isDark: boolean) {
  if (s === "positive")
    return isDark
      ? "bg-green-500/15 text-green-400 border-green-500/20"
      : "bg-green-50 text-green-700 border-green-200";
  if (s === "negative")
    return isDark
      ? "bg-red-500/15 text-red-400 border-red-500/20"
      : "bg-red-50 text-red-600 border-red-200";
  return isDark
    ? "bg-slate-500/15 text-slate-400 border-slate-500/20"
    : "bg-slate-50 text-slate-500 border-slate-200";
}

const StarRow = ({ rating, size = 12 }: any) => {
  return (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ marginRight: 2 }}>
          <Ionicons
            name="star"
            size={size}
            color={i <= rating ? "#FBBF24" : "#374151"}
          />
        </View>
      ))}
    </View>
  );
};

/* ══════════════════════════════════════════════════════════
   AI REPLY MODAL
══════════════════════════════════════════════════════════ */
const SEO_PHASES = [
  "Analysing review sentiment…",
  "Identifying SEO keywords…",
  "Crafting authentic tone…",
  "Optimising for local search…",
  "Personalising response…",
  "Adding trust signals…",
  "Reviewing for compliance…",
  "Finalising reply…",
];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const STAR: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};
const toSentiment = (r: number): Review["sentiment"] =>
  r >= 4 ? "positive" : r === 3 ? "neutral" : "negative";
const mkInitials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const normalise = (g: GoogleReview): Review => {
  const rating = STAR[g.starRating] ?? 3;
  return {
    name: g.name,
    id: g.reviewId,
    author: g.reviewer.displayName,
    initials: mkInitials(g.reviewer.displayName),
    rating,
    date: new Date(g.createTime).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    text: g.comment ?? "",
    replied: !!g.reviewReply,
    reply: g.reviewReply?.comment,
    helpful: 0,
    sentiment: toSentiment(rating),
    flagged: false,
  };
};

function AIReplyModal({
  items = [],
  isDark = true,
  onClose,
  isComplete,
}: {
  items: AIItem[];
  isDark: boolean;
  onClose: () => void;
  isComplete: boolean;
}) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const progressShared = useSharedValue(0);
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const yellow = useColor("yellow");
  const red = useColor("red");
  const green = useColor("green");

  // Stats
  const done = items.filter((i: any) => i.status === "done").length;
  const failed = items.filter((i: any) => i.status === "failed").length;
  const total = items.length;
  const active = items.find((i: any) =>
    ["thinking", "writing", "posting"].includes(i.status),
  );
  const pending = items.filter((i: any) => i.status === "pending");
  const completed = items.filter(
    (i: any) => i.status === "done" || i.status === "failed",
  );

  const targetPct = total > 0 ? ((done + failed) / total) * 100 : 0;

  // Sync Progress Bar
  useEffect(() => {
    progressShared.value = withTiming(isComplete ? 100 : targetPct, {
      duration: 1000,
    });
  }, [targetPct, isComplete]);

  // Phase Rotation
  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(
      () => setPhaseIdx((p) => (p + 1) % SEO_PHASES.length),
      2500,
    );
    return () => clearInterval(id);
  }, [isComplete]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressShared.value}%`,
  }));

  return (
    <Modal transparent animationType="slide" visible={true}>
      <View className="flex-1 justify-end md:justify-center bg-black/80">
        {/* Background Particles (Simplified for Mobile Performance) */}
        <View className="absolute inset-0 pointer-events-none">
          {/* In RN, we usually skip complex CSS keyframes for performance, 
               but we can place static decorative blurs here */}
        </View>

        {/* Main Panel */}
        <View
          style={{ backgroundColor: primary }}
          className="w-full md:max-w-lg self-center rounded-t-[32px] md:rounded-[32px] overflow-hidden h-[90%]"
        >
          {/* Top Accent Line */}
          <LinearGradient
            colors={["transparent", link, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 2, width: "100%" }}
          />

          {/* Grab Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-white/20" />
          </View>

          {/* Header */}
          <View className="px-6 pt-2 pb-4 flex-row items-center">
            <View
              className="relative items-center justify-center mr-4"
              style={{ width: 60, height: 60 }}
            >
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isComplete ? green : link,
                  shadowColor: link,
                  shadowOpacity: 0.5,
                  shadowRadius: 15,
                  elevation: 10,
                }}
              >
                {isComplete ? (
                  <CheckCircle2 color="white" size={28} />
                ) : (
                  <Brain color="white" size={28} />
                )}
              </View>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center">
                <Text
                  style={{ color: text }}
                  className="text-lg font-extrabold mr-2"
                >
                  {isComplete ? "All Done!" : "SEO AI Agent"}
                </Text>
                {!isComplete && (
                  <View className="px-2 py-0.5 rounded-full border border-blue-400/30 bg-blue-400/10 flex-row items-center">
                    <View className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1" />
                    <Text className="text-[8px] font-black text-blue-400 uppercase">
                      Live
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{ color: textMuted }}
                className="text-[11px] font-bold uppercase tracking-tight"
              >
                {isComplete
                  ? `${done} posted · ${failed} failed`
                  : `Crafting SEO Replies · ${done}/${total} Done`}
              </Text>
            </View>

            {isComplete && (
              <TouchableOpacity
                onPress={onClose}
                className="bg-white/10 p-2 rounded-full"
              >
                <X color={textMuted} size={18} />
              </TouchableOpacity>
            )}
          </View>

          {/* Progress Section */}
          <View className="px-6 mb-4">
            <View className="flex-row justify-between items-end mb-2">
              <Text
                style={{ color: textMuted }}
                className="text-[10px] font-black uppercase tracking-widest"
              >
                Progress
              </Text>
              <Text style={{ color: text }} className="text-xs font-black">
                {isComplete ? "Completed" : "Updating..."}
              </Text>
            </View>
            <View className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <Animated.View
                style={[
                  styles.progressBar,
                  animatedProgressStyle,
                  {
                    backgroundColor: isComplete ? green : link,
                  },
                ]}
              />
            </View>

            {/* Stats Grid */}
            <View className="flex-row mt-3 gap-4">
              {[
                { label: "Total", val: total, col: link },
                { label: "Done", val: done, col: green },
                { label: "Pending", val: pending.length, col: yellow },
              ].map((s, i) => (
                <View key={i} className="flex-row items-center">
                  <Text
                    style={{ color: s.col }}
                    className="text-md font-black mr-1"
                  >
                    {s.val}
                  </Text>
                  <Text
                    style={{ color: textMuted }}
                    className="text-xs font-bold uppercase"
                  >
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Phase Badge */}
            {!isComplete && (
              <View
                style={{
                  backgroundColor: `${link}15`,
                  borderColor: `${link}30`,
                }}
                className="border rounded-2xl p-3 flex-row items-center mb-4 gap-2"
              >
                <Zap size={14} color={link} className="mr-2" />
                <Text
                  style={{ color: link }}
                  className="text-[12px] font-bold flex-1"
                >
                  {SEO_PHASES[phaseIdx]}
                </Text>
              </View>
            )}

            {/* Currently Processing */}
            {active && (
              <View className="mb-6">
                <Text
                  style={{ color: textMuted }}
                  className="text-[10px] font-black uppercase mb-2 tracking-widest"
                >
                  Currently Processing
                </Text>
                <View
                  style={{
                    backgroundColor: primary,
                    borderColor: `${link}40`,
                  }}
                  className="border-2 rounded-3xl p-4"
                >
                  <View className="flex-row items-start mb-3">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center  mr-3"
                      style={{ backgroundColor: link }}
                    >
                      <Text className="text-white font-black">
                        {active.author[0]}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        style={{ color: text }}
                        className="font-bold text-sm"
                      >
                        {active.author}
                      </Text>
                      <View className="flex-row mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={10}
                            fill={s <= active.rating ? "#fbbf24" : "#334155"}
                            strokeWidth={0}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text
                    style={{ color: textMuted }}
                    className="text-xs leading-5 italic"
                  >
                    &quot;{active.text}&quot;
                  </Text>

                  <View className="mt-3 bg-white/5 rounded-xl p-3 flex-row items-center gap-2">
                    <Clock size={12} color={link} className="mr-2" />
                    <Text
                      style={{ color: link }}
                      className="text-[11px] font-bold"
                    >
                      {active.status === "thinking"
                        ? "Analyzing Review..."
                        : "Generating SEO Content..."}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Completed List (Limited for UI) */}
            {completed.length > 0 && (
              <View className="mb-6">
                <Text
                  style={{ color: textMuted }}
                  className="text-[10px] font-black uppercase mb-3 tracking-widest"
                >
                  Recent Activity
                </Text>
                {completed
                  .slice(-3)
                  .reverse()
                  .map((item: any, idx: number) => (
                    <View
                      key={idx}
                      className="bg-white/5 rounded-2xl p-3 flex-row items-center mb-2 border border-white/5 gap-4"
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: link }}
                      >
                        <Text className="text-white text-lg font-bold">
                          {item.author[0]}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          style={{ color: text }}
                          className="text-md font-bold"
                        >
                          {item.author}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{ color: textMuted }}
                          className="text-sm"
                        >
                          {item.reply}
                        </Text>
                      </View>
                      {item.status === "done" ? (
                        <CheckCircle2 size={16} color={green} />
                      ) : (
                        <X size={16} color={red} />
                      )}
                    </View>
                  ))}
              </View>
            )}

            {/* Bottom Success Message */}
            {isComplete && (
              <View
                style={{
                  backgroundColor: `${green}10`,
                  borderColor: `${green}20`,
                }}
                className="border rounded-3xl p-6 items-center mb-10"
              >
                <CheckCircle2 size={40} color={green} className="mb-3" />
                <Text
                  style={{ color: text }}
                  className="text-lg font-black text-center mb-1"
                >
                  Batch Complete
                </Text>
                <Text
                  style={{ color: textMuted }}
                  className="text-center text-xs leading-5 mb-5"
                >
                  Your replies have been optimized with industry keywords and
                  posted to your profile.
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={{ backgroundColor: green }}
                  className="w-full rounded-2xl overflow-hidden"
                >
                  <LinearGradient
                    colors={["#16a34a", "#22c55e"]}
                    className="py-4 rounded-2xl items-center overflow-hidden"
                    style={{
                      backgroundColor: green,
                      // shadowColor: green,
                      // shadowOpacity: 0.4,
                      // shadowRadius: 10,
                      // elevation: 5,
                    }}
                  >
                    <Text className="text-white font-black">
                      View All Results
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ReviewsScreen() {
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const yellow = useColor("yellow");
  const red = useColor("red");
  const user = useSelector((s: RootState) => s.auth.user);
  const [active, setActive] = useState("All");

  // const { data: user, isLoading: userLoading } = useUser();
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [search, setSearch] = useState("");
  const [showSort, setShowSort] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);

  const [aiItems, setAiItems] = useState<AIItem[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiComplete, setAiComplete] = useState(false);

  const hasMore = !!nextToken;
  const googleStats = useSelector((state: RootState) => state.google.stats);
  const totalReviewsFromAnalytics = googleStats?.totalReviews ?? totalCount;

  const fetchReviews = useCallback(
    async (tokenParam?: string, append = false) => {
      if (!user?.googleLocationId) return;
      if (append) {
        setLoadingMore(true);
      } else setFetching(true);
      if (!append) setFetchErr("");
      try {
        const token = await getToken();
        let url = `${FRONTEND_URL}/api/google/reviews?location=accounts/me/locations/${user.googleLocationId}`;
        if (tokenParam) url += `&pageToken=${tokenParam}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed");
        const mapped = json.reviews.map(normalise);
        setReviews((prev) => (append ? [...prev, ...mapped] : mapped));
        setNextToken(json.nextPageToken);
        setTotalCount(json.totalReviewCount || 0);
      } catch (e: any) {
        setFetchErr(e.message ?? "Error");
      } finally {
        if (append) {
          setLoadingMore(false);
        } else setFetching(false);
      }
    },
    [user?.googleLocationId],
  );

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const loadMore = () => {
    if (!loadingMore && nextToken) fetchReviews(nextToken, true);
  };
  const refresh = () => {
    setFetching(true);
    setNextToken(null);
    fetchReviews();
  };

  const postReply = async (reviewName: string, comment: string) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) throw new Error("User not authenticated");
    const res = await fetch(`${FRONTEND_URL}/api/google/reply`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ reviewName, comment }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Reply failed");
    setReviews((prev) =>
      prev.map((r) =>
        r.name === reviewName ? { ...r, replied: true, reply: comment } : r,
      ),
    );
  };

  const bulkAI = async () => {
    const unreplied = reviews.filter((r) => !r.replied);
    if (unreplied.length === 0) return;
    const initial: AIItem[] = unreplied.map((r) => ({
      reviewId: r.id,
      author: r.author,
      rating: r.rating,
      text: r.text,
      status: "pending",
    }));
    setAiItems(initial);
    setAiComplete(false);
    setShowAIModal(true);

    for (let i = 0; i < unreplied.length; i++) {
      const r = unreplied[i];
      setAiItems((prev) =>
        prev.map((item) =>
          item.reviewId === r.id ? { ...item, status: "thinking" } : item,
        ),
      );
      await new Promise((res) => setTimeout(res, 600));
      let replyText = "";
      try {
        if (!r.text || r.text.trim() === "") {
          replyText =
            `Hi ${r.author.split(" ")[0]},\n\nThank you for taking the time to leave a rating for ${user?.googleLocationName}. We truly appreciate your support and are glad you chose us.\n\nWe look forward to welcoming you again.\n\nBest Regards,\n${user?.googleLocationName} Team`.trim();
        } else {
          setAiItems((prev) =>
            prev.map((item) =>
              item.reviewId === r.id ? { ...item, status: "writing" } : item,
            ),
          );
          const aiRes = await fetch(`${FRONTEND_URL}/api/ai/reply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              review: r.text,
              rating: r.rating,
              reviewerName: r.author,
              businessName: user?.googleLocationName,
              tone: "Professional",
            }),
          });
          const aiJson = await aiRes.json();
          if (!aiJson.success) throw new Error(aiJson.error ?? "AI failed");
          replyText = aiJson.reply;
          setAiItems((prev) =>
            prev.map((item) =>
              item.reviewId === r.id ? { ...item, reply: replyText } : item,
            ),
          );
          await new Promise((res) => setTimeout(res, 400));
        }
        setAiItems((prev) =>
          prev.map((item) =>
            item.reviewId === r.id
              ? { ...item, status: "posting", reply: replyText }
              : item,
          ),
        );
        await postReply(r.name, replyText);
        await new Promise((res) => setTimeout(res, 800));
        setAiItems((prev) =>
          prev.map((item) =>
            item.reviewId === r.id
              ? { ...item, status: "done", reply: replyText }
              : item,
          ),
        );
      } catch {
        setAiItems((prev) =>
          prev.map((item) =>
            item.reviewId === r.id ? { ...item, status: "failed" } : item,
          ),
        );
      }
      await new Promise((res) => setTimeout(res, 1200));
    }
    setAiComplete(true);
  };

  const handleFlag = (id: string) =>
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, flagged: !r.flagged } : r)),
    );
  const handleHelpful = (id: string) =>
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r)),
    );

  const loaded = reviews.length;
  const avg = loaded
    ? (reviews.reduce((s, r) => s + r.rating, 0) / loaded).toFixed(1)
    : "—";
  const replied = reviews.filter((r) => r.replied).length;
  const positive = reviews.filter((r) => r.sentiment === "positive").length;
  const unreplied = reviews.filter((r) => !r.replied).length;
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const visible = reviews
    .filter((r) => {
      if (filter === "replied") return r.replied;
      if (filter === "unreplied") return !r.replied;
      if (filter === "positive") return r.sentiment === "positive";
      if (filter === "negative") return r.sentiment === "negative";
      return true;
    })
    .filter(
      (r) =>
        !search ||
        r.author.toLowerCase().includes(search.toLowerCase()) ||
        r.text.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "rating_high") return b.rating - a.rating;
      if (sort === "rating_low") return a.rating - b.rating;
      return 0;
    });

  const SORT_LABELS: Record<SortType, string> = {
    newest: "Newest",
    oldest: "Oldest",
    rating_high: "Rating ↑",
    rating_low: "Rating ↓",
  };
  const isInitialLoad = fetching && reviews.length === 0;

  const reviewMetrics = [
    {
      id: "1",
      title: "Avg Rating",
      value: avg,
      desc: `${totalReviewsFromAnalytics} total reviews`,
      icon: "star",
      color: "#FBBF24",
    },
    {
      id: "2",
      title: "Response Rate",
      value: `${Math.round((replied / loaded) * 100)}%`,
      desc: `${replied} of ${loaded} replied`,
      icon: "chatbubble-ellipses",
      color: "#3b82f6",
    },
    {
      id: "3",
      title: "Positive",
      value: positive,
      desc: "4–5 star reviews",
      icon: "trending-up",
      color: "#22c55e",
    },
    {
      id: "4",
      title: "Needs Reply",
      value: unreplied,
      desc: "awaiting response",
      icon: "time",
      color: "#f97316",
    },
  ];

  const { isActive, isLoading: loading, isExpired } = useSubscription();
  const { trialExpired } = useFreeTrialStatus();

  // useEffect(() => {
  //   if (loading) return;
  // }, [isActive, isExpired, trialExpired, loading]);
  // if (!isActive && trialExpired) return <SubscriptionGate />;
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
      style={{ flex: 1 }}
      contentContainerStyle={{
        gap: 18,
        backgroundColor: primary,
      }}
    >
      {showAIModal && (
        <AIReplyModal
          items={aiItems}
          isDark={isDark}
          isComplete={aiComplete}
          onClose={() => {
            setShowAIModal(false);
            setAiItems([]);
            setAiComplete(false);
          }}
        />
      )}

      <View className="flex flex-row mt-5 px-7">
        <View className="gap-3">
          <View className="flex-row w-full">
            <View className="w-full flex-row justify-between">
              <View className="flex-row gap-2 items-start">
                <View
                  className="border rounded-lg flex justify-center p-2 flex-2"
                  style={{
                    borderColor: textMuted,
                    backgroundColor: textMuted + "30",
                  }}
                >
                  <GoogleG />
                </View>
                <Text className="text-2xl font-bold" style={{ color: text }}>
                  Google Reviews
                </Text>
                <View
                  className="font-bold px-2 flex justify-center rounded-lg"
                  style={{ backgroundColor: link }}
                >
                  <Text className="text-white text-xs">
                    {totalReviewsFromAnalytics ?? 0}
                  </Text>
                </View>
              </View>
              {user?.googleLocationId && (
                <Pressable
                  className="w-10 h-10 rounded-xl items-center justify-center shadow-sm disabled:opacity-50"
                  style={{ backgroundColor: textMuted + "30" }}
                  onPress={refresh}
                  disabled={fetching}
                >
                  <RotateCw
                    size={18}
                    color={text}
                    className={fetching ? "animate-spin" : ""}
                  />
                </Pressable>
              )}
            </View>
          </View>
          <View className="flex items-start">
            {user?.googleLocationName && (
              <Text className="text-sm font-bold" style={{ color: textMuted }}>
                {user?.googleLocationName}
              </Text>
            )}
          </View>
        </View>
      </View>

      {(isInitialLoad || fetching) && (
        <View className="px-7">
          <InitialSkeleton isInitial={fetching} isDark={isDark} />
        </View>
      )}

      {!user?.googleLocationName && (
        <View
          className="rounded-2xl p-8 items-center border gap-1 mx-7"
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

      {fetchErr && (
        <View
          className="rounded-2xl p-4 mx-7 flex-row items-start gap-3 border mb-4"
          style={{
            backgroundColor: red + "30",
            borderColor: red + "30",
          }}
        >
          <View className="flex-1">
            {/* <WifiOff size={16} className="mt-0.5 shrink-0" color={red} /> */}
            <Text
              className="text-md font-semibold mb-0.5"
              style={{ color: red }}
            >
              Failed to load reviews
            </Text>

            <Text className="text-sm" style={{ color: red }}>
              {fetchErr}
            </Text>

            <TouchableOpacity onPress={refresh} className="mt-2">
              <Text className="text-sm font-semibold" style={{ color: red }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isInitialLoad && reviews.length > 0 && (
        <>
          <View className="flex-row px-7 flex-wrap justify-between">
            {reviewMetrics.map((metric) => (
              <MetricCard key={metric.title} item={metric} />
            ))}
          </View>
          {/* Rating Breakdown */}
          <View
            className="p-6 rounded-3xl border shadow-sm mx-7"
            style={{ backgroundColor: primaryForeground }}
          >
            {/* Header Section */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <Text
                  className="font-bold tracking-widest text-sm uppercase"
                  style={{ color: link }}
                >
                  RATING BREAKDOWN
                </Text>
                <Text className="text-xs ml-2" style={{ color: textMuted }}>
                  ({loaded} of {totalReviewsFromAnalytics} loaded)
                </Text>
              </View>

              <View className="flex-row items-center">
                <Text className="text-lg mr-1" style={{ color: yellow }}>
                  ★
                </Text>
                <Text className="text-xl font-bold" style={{ color: text }}>
                  {avg}
                </Text>
              </View>
            </View>

            {/* Bars Section */}
            <View>
              {ratingDist.map(({ star, count }) => (
                <RatingBar
                  key={star}
                  label={star}
                  count={count}
                  color={text}
                  percentage={(count / loaded) * 100}
                />
              ))}
            </View>
          </View>

          {unreplied > 0 && (
            <View className="px-3 rounded-3xl">
              <TouchableOpacity
                activeOpacity={0.8}
                className="px-4 py-2 rounded-3xl overflow-hidden"
                onPress={bulkAI}
                disabled={showAIModal}
              >
                <LinearGradient
                  colors={["#2a0e45", "#9f57f5"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ borderRadius: 24 }}
                  className="flex-row items-center justify-center py-3 rounded-3xl"
                >
                  <View className="bg-white/20 p-1.5 rounded-full mr-3">
                    <MaterialCommunityIcons
                      name="brain"
                      size={20}
                      color="white"
                    />
                  </View>

                  <Text className="text-white font-bold text-md mr-3">
                    AI Auto-Reply {unreplied} Reviews
                  </Text>
                  <View className="flex-row items-center bg-white/30 px-2 py-0.5 rounded-full">
                    <Ionicons name="sparkles" size={12} color="white" />
                    <Text className="text-white text-xs font-black ml-1 uppercase">
                      SEO
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View
            className="flex-row items-center border rounded-full py-1 mb-2 px-4 my-1 mx-7"
            style={{ borderColor: link }}
          >
            <Search size={20} color={link} />
            <TextInput
              className="flex-1 ml-2 text-md"
              placeholder="Search reviews..."
              value={search}
              placeholderTextColor={link}
              onChangeText={setSearch}
              style={{ color: link }}
              cursorColor={link}
            />
            {search && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close" color={link} size={20} />
              </Pressable>
            )}
          </View>

          {/* Categories Scroller */}
          <View className="pl-7 flex-row">
            <ScrollView
              className="flex-row"
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {(
                [
                  "all",
                  "unreplied",
                  "replied",
                  "positive",
                  "negative",
                ] as FilterType[]
              ).map((f) => (
                <Pressable
                  key={f}
                  className="px-5 py-1.5 rounded-2xl mr-2"
                  style={{
                    backgroundColor: filter === f ? link : textMuted + "30",
                  }}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    className="font-bold text-md capitalize"
                    style={{ color: text }}
                  >
                    {f === "unreplied" ? `Unreplied (${unreplied})` : f}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {visible.length === 0 ? (
            <View className="p-8 items-center justify-center">
              <LucideStar
                size={26}
                color={textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text
                className="text-sm text-center"
                style={{ color: textMuted }}
              >
                No reviews match your filter
              </Text>
            </View>
          ) : (
            <View className="items-center">
              {visible.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onReply={postReply}
                  onFlag={handleFlag}
                  onHelpful={handleHelpful}
                />
              ))}
            </View>
          )}

          <View className="mb-7 mx-7">
            {!loadingMore && hasMore && (
              <Pressable
                className="w-full border rounded-xl py-4"
                style={{ borderColor: link, backgroundColor: link }}
                onPress={loadMore}
              >
                <Text className="text-center text-md" style={{ color: text }}>
                  Load More
                </Text>
              </Pressable>
            )}
            {!loadingMore && !hasMore && loaded > 0 && (
              <View className="flex items-center gap-3 py-2">
                <View
                  className="flex-1 h-[1px]"
                  style={{ backgroundColor: textMuted + "50" }}
                ></View>
                <Text
                  style={{ color: textMuted }}
                  className="text-sm font-medium text-center"
                >
                  All {totalReviewsFromAnalytics} reviews loaded
                </Text>
                <View
                  className="flex-1 h-[1px]"
                  style={{ backgroundColor: textMuted + "50" }}
                ></View>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const RatingBar = ({
  label,
  count,
  percentage,
  color,
}: {
  label: number;
  count: number;
  percentage: number;
  color: string;
}) => (
  <View className="flex-row items-center my-1">
    {/* Star Label */}
    <View className="flex-row items-center w-8">
      <Text className="font-medium mr-1" style={{ color: color }}>
        {label}
      </Text>
      <Text className="text-yellow-500 text-xs">★</Text>
    </View>

    {/* Progress Track */}
    <View
      className="flex-1 h-2 rounded-full mx-2 overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <View
        className="h-full bg-yellow-500 rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </View>

    {/* Count */}
    <Text className=" w-6 text-right text-sm" style={{ color: color }}>
      {count}
    </Text>
  </View>
);

const ReviewCard = ({
  review,
  onReply,
  onFlag,
  onHelpful,
}: {
  review: Review;
  onReply: (name: string, text: string) => Promise<void>;
  onFlag: (id: string) => void;
  onHelpful: (id: string) => void;
}) => {
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const yellow = useColor("yellow");
  const red = useColor("red");

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const needsTrunc = (review.text?.length ?? 0) > 120;
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";
  return (
    <View className="flex-1 px-7 mb-5 w-full">
      <View
        className="p-5 rounded-3xl border shadow-lg"
        style={{
          backgroundColor: primary,
          borderColor: link + "60",
          shadowColor: link,
        }}
      >
        {/* Header: Avatar, Name, Rating, and Status Badge */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row items-start flex-1">
            {/* Avatar */}
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: link }}
            >
              <Text className="text-white font-bold text-lg">
                {review.initials}
              </Text>
            </View>

            {/* Name and Date/Stars */}
            <View className="flex-1">
              <View className="flex-row gap-3">
                <View className="flex-shrink">
                  <Text
                    className="font-bold text-md"
                    style={{ color: text }}
                    numberOfLines={1}
                  >
                    {review.author}
                  </Text>
                </View>
                <View className="flex-row mx-2 items-center">
                  {review.flagged && (
                    <Text
                      className="text-xs font-semibold capitalize text-center px-2 py-1 rounded-2xl"
                      style={{
                        color: red,
                        backgroundColor: red + "20",
                        borderColor: red,
                      }}
                    >
                      Flagged
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-row items-center">
                <StarRow rating={review.rating} />
                <Text
                  className="text-xs font-medium"
                  style={{ color: textMuted }}
                >
                  {review.date}
                </Text>
              </View>
            </View>
          </View>
          <Text
            className={`text-xs font-semibold px-3 rounded-3xl py-1 capitalize text-center ${sentimentCls(review.sentiment, isDark)}`}
          >
            {review.sentiment}
          </Text>
        </View>

        {/* User Review Text */}
        {review.text ? (
          <View className="mb-4 flex-row">
            <Text className="leading-6 text-sm" style={{ color: text }}>
              {needsTrunc && !expanded
                ? review.text.slice(0, 120) + "…"
                : review.text}
              {needsTrunc && (
                <Text
                  className="text-sm mx-2"
                  style={{ color: link }}
                  onPress={() => setExpanded((v) => !v)}
                >
                  {expanded ? "Less" : "More"}
                </Text>
              )}
            </Text>
          </View>
        ) : (
          <Text className="text-sm pt-1 pb-3 italic" style={{ color: text }}>
            No written comment.
          </Text>
        )}

        {/* Owner Reply Section */}
        {review.replied && review.reply && (
          <View
            className="rounded-2xl border-l-4 border p-4 mb-4"
            style={{ borderColor: link, backgroundColor: link + "30" }}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={link}
              />
              <Text
                className="font-bold text-[11px] tracking-widest ml-2"
                style={{ color: link }}
              >
                OWNER REPLY
              </Text>
            </View>
            <Text className="leading-6 text-sm" style={{ color: textMuted }}>
              {review.reply}
            </Text>
          </View>
        )}

        {/* Divider Line */}
        <View
          className="h-[1px] w-full mb-4"
          style={{ backgroundColor: link + "30" }}
        />

        {/* Footer Actions */}
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            className="flex-row items-center px-4 py-2 rounded-xl border"
            style={{ backgroundColor: link }}
            onPress={() => setOpen((v) => !v)}
          >
            <Ionicons name="create-outline" size={18} color="white" />
            <Text className="font-semibold ml-2 text-sm text-white">
              {review.replied ? "Edit Reply" : "Reply"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <TouchableOpacity
              className="flex-row items-center mr-6"
              onPress={() => onHelpful(review.id)}
            >
              <Ionicons name="thumbs-up-outline" size={18} color={textMuted} />
              <Text className="ml-1.5 font-medium" style={{ color: textMuted }}>
                {review.helpful}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => onFlag(review.id)}
            >
              <Ionicons name="flag-outline" size={18} color={textMuted} />
              <Text
                className="ml-1.5 text-sm font-medium"
                style={{ color: textMuted }}
              >
                {review.flagged ? "Unflag" : "Flag"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {open && (
          <View className="pt-5">
            <ReplyComposer
              review={review}
              onSend={async (text) => {
                await onReply(review.name, text);
                setOpen(false);
              }}
              onClose={() => setOpen(false)}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const ReplyComposer = ({
  review,
  onSend,
  onClose,
}: {
  review: Review;
  onSend: (text: string) => Promise<void>;
  onClose: () => void;
}) => {
  const primary = useColor("primary");
  const link = useColor("link");
  const textMuted = useColor("textMuted");
  const textColor = useColor("text");
  const green = useColor("green");
  const red = useColor("red");
  const orange = useColor("orange");

  const tones = ["Professional", "Friendly", "Empathetic"];

  const [text, setText] = useState(review.reply ?? "");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState("");
  const MAX = 4096;
  const taRef = useRef<TextInput>(null);
  const { data: user } = useUser();
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";

  const generateAI = async (tone?: string) => {
    try {
      setGenerating(true);
      setApiError("");
      const res = await fetch(`${FRONTEND_URL}/api/ai/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review: review.text ?? "",
          rating: review.rating,
          reviewerName: review.author,
          businessName: user?.googleLocationName,
          tone: tone || "Professional",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "AI generation failed");
      setText(json.reply);
      taRef.current?.focus();
    } catch (e: any) {
      setApiError(e.message || "Failed to generate AI reply");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    setApiError("");
    if (!text.trim() || text.length > MAX) return;
    setPosting(true);
    try {
      await onSend(text.trim());
    } catch (e: any) {
      setApiError(e.message ?? "Failed to post reply.");
    } finally {
      setPosting(false);
    }
  };
  const copyText = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const remaining = MAX - text.length;
  const overLimit = remaining < 0;

  return (
    <View
      style={{ backgroundColor: primary, borderColor: link + "40" }}
      className="p-4 rounded-3xl border"
    >
      <View className="flex-row flex-wrap gap-2 mb-4">
        <TouchableOpacity
          className="flex-row items-center px-3 py-1 rounded-xl border "
          style={{ backgroundColor: link + "30", borderColor: link }}
          onPress={() => generateAI()}
          disabled={generating}
        >
          {generating ? (
            <>
              <RefreshCw size={12} className="animate-spin" color={link} />
              <Text
                className="ml-1 text-sm font-bold"
                style={{ color: link }}
                numberOfLines={1}
              >
                Generating...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={12} color={link} />
              <Text
                className="ml-1 text-sm font-bold"
                style={{ color: link }}
                numberOfLines={1}
              >
                AI Reply
              </Text>
            </>
          )}
        </TouchableOpacity>

        {tones.map((tone) => (
          <TouchableOpacity
            key={tone}
            className="px-3 py-1 rounded-xl"
            style={{ backgroundColor: textMuted + "30" }}
            onPress={() => generateAI(tone)}
            disabled={generating}
          >
            <Text style={{ color: textMuted }} className="text-sm font-medium">
              {tone}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Text Input Area */}
      <View
        className="border rounded-2xl p-2 min-h-[150px] relative"
        style={{ backgroundColor: link + "30", borderColor: link }}
      >
        <TextInput
          ref={taRef}
          multiline
          value={text}
          onChangeText={(t) => {
            setText(t);
            setApiError("");
          }}
          className={`text-sm leading-6 `}
          textAlignVertical="top"
          style={{
            color: textMuted,
            borderColor: overLimit
              ? red
              : isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.1)",
          }}
          cursorColor={link}
          placeholder="Write your reply… or tap AI Reply to generate one."
          placeholderTextColor={textMuted}
        />
        {text.length > 0 &&
          (copied ? (
            <Ionicons
              name="checkmark-done-outline"
              className="absolute right-3 top-2 p-2 rounded-full"
              style={{ backgroundColor: green + "30" }}
              size={20}
              color={green}
            />
          ) : (
            <TouchableOpacity
              className="absolute top-4 right-4"
              onPress={() => copyText(text)}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={20}
                color={textMuted}
              />
            </TouchableOpacity>
          ))}
      </View>

      {/* 3. Footer Actions */}
      <View>
        <View className="min-h-[20px] justify-center">
          {apiError && (
            <View className="flex-row items-center">
              <Ionicons name="alert-circle-outline" size={12} color="#f87171" />
              <Text className="text-sm font-medium ml-1" style={{ color: red }}>
                {apiError}
              </Text>
            </View>
          )}
          {!apiError && overLimit && (
            <Text className="text-sm font-medium" style={{ color: red }}>
              {Math.abs(remaining)} over limit
            </Text>
          )}
          {!apiError && !overLimit && remaining < 200 && text.length > 0 && (
            <Text className="text-sm font-medium" style={{ color: orange }}>
              {remaining} chars left
            </Text>
          )}
        </View>
        <View className="flex-row items-center justify-end mt-6 gap-3">
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ backgroundColor: textMuted + "30" }}
            className="flex-row flex-1 justify-center items-center px-6 py-3 rounded-2xl"
            onPress={onClose}
          >
            <Text
              style={{ color: textMuted }}
              className="font-bold text-sm text-center"
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={{ backgroundColor: link }}
            className="flex-row items-center px-6 py-3 rounded-2xl"
            onPress={handleSend}
            disabled={!text.trim() || overLimit || posting}
          >
            {posting ? (
              <RefreshCw size={15} />
            ) : (
              <>
                <Ionicons name="send" size={15} color="white" />
                <Text className="text-white font-bold text-sm ml-2">
                  Post Reply
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={{ color: textMuted }}
        className="text-xs text-center mt-6 leading-4"
      >
        Replies are public on Google. Keep responses professional and avoid
        sharing personal information.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    height: "100%",
    borderRadius: 10,
  },
});
