import { useColor } from "@/hooks/useColor";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  // Dimensions,
  TextInput,
  FlatList,
  Image,
  // ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  Clock,
  Edit2,
  MoreVertical,
  Plus,
  RotateCw,
  Search,
  Trash2,
  Zap,
} from "lucide-react-native";
import { GoogleG } from "@/components/ui/icons";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/services/auth.util";
import { FRONTEND_URL } from "@/config/.env";
import { useUser } from "@/services/(user)/user.service";
import InitialSkeleton from "@/components/ui/initialSkeleton";
import MetricCard from "@/components/ui/metricCard";
import { useFreeTrialStatus } from "@/hooks/useFreeTrialStatus";
import SubscriptionGate from "@/components/SubscriptionGate";
import { useSubscription } from "@/hooks/useSubscription";
import { queryClient } from "@/providers/queryClient";
import { NotConnectedBanner } from "@/components/ui/NotConnectedBanner";

const myPostsMetrics = [
  {
    id: "1",
    title: "Total Posts",
    value: "35",
    subHeading: "All posts created",
    icon: "documents-outline",
    color: "#2563eb",
  },
  {
    id: "2",
    title: "Live",
    value: "33",
    subHeading: "Currently active",
    icon: "radio-outline",
    color: "#16a34a",
  },
  {
    id: "3",
    title: "Events",
    value: "1",
    subHeading: "Scheduled events",
    icon: "calendar-outline",
    color: "#9333ea",
  },
  {
    id: "4",
    title: "Offers",
    value: "2",
    subHeading: "Active promotions",
    icon: "pricetag-outline",
    color: "#f97316",
  },
];
const categories = [
  { id: "all", label: "All (35)", active: true },
  { id: "live", label: "Live (33)", active: false },
  { id: "updates", label: "Updates (32)", active: false },
  { id: "events", label: "Events (1)", active: false },
];
const dummyPosts = [
  {
    id: "1",
    status: "Live",
    date: "19 Mar 2026",
    title:
      "Unlock exclusive savings with our Offer 90% deal, designed to propel your business forward through the...",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
    type: "STANDARD",
    cta: "CALL",
  },
];

type PostTopicType = "STANDARD" | "EVENT" | "OFFER";
type PostState = "LIVE" | "REJECTED" | "PROCESSING" | "DRAFT";
type FilterType = "ALL" | "STANDARD" | "EVENT" | "OFFER" | "LIVE" | "REJECTED";

interface GMBPost {
  name: string;
  languageCode: string;
  summary: string;
  topicType: PostTopicType;
  state: PostState;
  createTime: string;
  updateTime: string;
  searchUrl?: string;
  callToAction?: { actionType: string; url?: string };
  media?: { sourceUrl: string; mediaFormat: string }[];
  event?: { title: string; schedule?: any };
  offer?: { couponCode?: string };
}

interface Post {
  name: string;
  id: string;
  summary: string;
  topicType: PostTopicType;
  state: PostState;
  date: string;
  updateDate: string;
  cta?: string;
  ctaUrl?: string;
  imageUrl?: string;
  eventTitle?: string;
  couponCode?: string;
}
interface PostsResponse {
  success: boolean;
  posts: GMBPost[];
  nextPageToken?: string;
  total?: number;
  error?: string;
}

function normalisePost(g: GMBPost): Post {
  return {
    name: g.name,
    id: g.name.split("/").pop() ?? g.name,
    summary: g.summary ?? "",
    topicType: g.topicType ?? "STANDARD",
    state: g.state ?? "LIVE",
    date: new Date(g.createTime).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    updateDate: new Date(g.updateTime).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    cta: g.callToAction?.actionType,
    ctaUrl: g.callToAction?.url,
    imageUrl: g.media?.[0]?.sourceUrl,
    eventTitle: g.event?.title,
    couponCode: g.offer?.couponCode,
  };
}

function stateBadge(s: PostState, isDark: boolean) {
  if (s === "LIVE")
    return {
      cls: isDark
        ? "bg-green-500/15 text-green-400"
        : "bg-green-50 text-green-600",
      label: "Live",
    };
  if (s === "REJECTED")
    return {
      cls: isDark ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-600",
      label: "Rejected",
    };
  if (s === "PROCESSING")
    return {
      cls: isDark
        ? "bg-yellow-500/15 text-yellow-400"
        : "bg-yellow-50 text-yellow-600",
      label: "Processing",
    };
  return {
    cls: isDark
      ? "bg-slate-500/15 text-slate-400"
      : "bg-slate-50 text-slate-500",
    label: "Draft",
  };
}

async function fetchPosts(
  locationId: string,
  pageToken?: string,
): Promise<PostsResponse> {
  const params = new URLSearchParams({
    location: `accounts/me/locations/${locationId}`,
  });
  if (pageToken) params.set("pageToken", pageToken);
  const res = await fetch(`${FRONTEND_URL}/api/google/posts?${params}`, {
    headers: { Authorization: `Bearer ${await getToken()}` },
  });
  const json = await res.json();
  // console.log("Data from fetchPosts: ", json);

  if (!json.success) throw new Error(json.error ?? "Failed to fetch posts");
  return json;
}

async function fetchAnalysis(locationId: string) {
  const res = await fetch(
    `${FRONTEND_URL}/api/google/analysis?locationId=${locationId}`,
    {
      headers: { Authorization: `Bearer ${await getToken()}` },
    },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch analysis");
  return json;
}

async function deletePost(postName: string) {
  const res = await fetch(`${FRONTEND_URL}/api/google/posts/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getToken()}`,
    },
    body: JSON.stringify({ postName }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Delete failed");
}

const link = "#9f57f5";
const text = "#fff";
// const primaryForeground = "#2a0e45";
const green = "#34C759";
const red = "#b00000";
const textMuted = "#c4c4c8";

export default function ProfileScreen() {
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  // const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  // const qc = useQueryClient();
  const user = useSelector((s: RootState) => s.auth.user);
  // const { data: user, isLoading: userLoading } = useUser();
  // const screenWidth = Dimensions.get("window").width;
  // const cardWidth = screenWidth / 2 - 33;
  const theme = useSelector((state: RootState) => state.theme.mode);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  // const [toastMsg, setToastMsg] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["google-posts", user?.googleLocationId],
    queryFn: () => fetchPosts(user!.googleLocationId!),
    enabled: !!user?.googleLocationId,
    // staleTime: 60_000,
    staleTime: Infinity,
    refetchOnWindowFocus: false, // don't refetch when tab regains focus
    refetchOnReconnect: false, // don't refetch on network reconnect
    refetchOnMount: false,
  });
  // console.log("Data from post request: ", data);

  useEffect(() => {
    if (data) {
      setPosts((data.posts ?? []).map(normalisePost));
      setNextToken(data.nextPageToken);
      setHasMore(!!data.nextPageToken);
    }
  }, [data]);

  const loadMore = async () => {
    if (!nextToken || loadingMore || !user?.googleLocationId) return;
    setLoadingMore(true);
    try {
      const more = await fetchPosts(user.googleLocationId, nextToken);
      setPosts((prev) => [...prev, ...(more.posts ?? []).map(normalisePost)]);
      setNextToken(more.nextPageToken);
      setHasMore(!!more.nextPageToken);
    } catch {
      /* silent */
    } finally {
      setLoadingMore(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: (_, postName) => {
      setPosts((prev) => prev.filter((p) => p.name !== postName));
      setDeleteTarget(null);
      // showToast("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["google-posts"] });
    },
    onError: (e: any) => {
      // showToast(e.message ?? "Delete failed");
      setDeleteTarget(null);
    },
  });

  const { data: analysisData } = useQuery({
    queryKey: ["google-analysis", user?.googleLocationId],
    queryFn: () => fetchAnalysis(user!.googleLocationId!),
    enabled: !!user?.googleLocationId,
    // staleTime: 60_000,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // console.log("Analysis data: ", analysisData);

  const stats = analysisData?.stats;
  const total = stats?.totalPosts ?? posts.length;
  const liveCount = stats?.livePosts ?? 0;
  const evtCount = stats?.eventPosts ?? 0;
  const ofrCount = stats?.offerPosts ?? 0;
  const updCount = stats?.updatePosts ?? 0;
  const rejectedCount = posts.filter((p) => p.state === "REJECTED").length;

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "ALL", label: `All (${total})` },
    { id: "LIVE", label: `Live (${liveCount})` },
    { id: "STANDARD", label: `Updates (${updCount})` },
    { id: "EVENT", label: `Events (${evtCount})` },
    { id: "OFFER", label: `Offers (${ofrCount})` },
    { id: "REJECTED", label: `Rejected (${rejectedCount})` },
  ];

  const visible = posts.filter((p) => {
    const matchFilter =
      filter === "ALL"
        ? true
        : filter === "LIVE"
          ? p.state === "LIVE"
          : filter === "REJECTED"
            ? p.state === "REJECTED"
            : p.topicType === filter;
    const matchSearch =
      !search ||
      p.summary.toLowerCase().includes(search.toLowerCase()) ||
      p.eventTitle?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const isInitial = isLoading && posts.length === 0;

  const myPostsMetrics = [
    {
      id: "1",
      title: "Total Posts",
      value: total,
      subHeading: "All posts created",
      icon: "documents-outline",
      color: "#2563eb",
    },
    {
      id: "2",
      title: "Live",
      value: liveCount,
      subHeading: "Currently active",
      icon: "radio-outline",
      color: "#16a34a",
    },
    {
      id: "3",
      title: "Events",
      value: evtCount,
      subHeading: "Scheduled events",
      icon: "calendar-outline",
      color: "#9333ea",
    },
    {
      id: "4",
      title: "Offers",
      value: ofrCount,
      subHeading: "Active promotions",
      icon: "pricetag-outline",
      color: "#f97316",
    },
  ];

  const { isActive, isLoading: loading, isExpired } = useSubscription();
  const { trialExpired } = useFreeTrialStatus();

  // useEffect(() => {
  //   if (loading) return;
  // }, [isActive, isExpired, trialExpired, loading]);
  // if (!isActive) return <SubscriptionGate />;
  // if (!user) {
  //   router.replace("/(auth)/login");
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

  if (user?.googleLocationId) {
    return <NotConnectedBanner isDark={theme === "dark"} />;
  }

  const renderHeader = () => (
    <>
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <GoogleG />
            <Text className="text-2xl font-black ml-2" style={{ color: text }}>
              My Posts
            </Text>
          </View>
          {user?.googleLocationName && (
            <Text
              className="text-[11px] leading-4 pr-4"
              style={{ color: textMuted }}
            >
              {user.googleLocationName}
            </Text>
          )}
        </View>

        {user?.googleLocationId && (
          <View className="flex-row items-center gap-x-2">
            <Pressable
              className="w-10 h-10 rounded-xl items-center justify-center shadow-sm"
              style={{ backgroundColor: textMuted + "30" }}
              onPress={() => refetch()}
              disabled={isLoading}
            >
              <RotateCw size={18} color={text} />
            </Pressable>

            <Pressable
              className="flex-row items-center px-4 py-2.5 rounded-xl shadow-lg gap-2"
              style={{ backgroundColor: link }}
              onPress={() => router.push("/CreatePostScreen")}
            >
              <Plus size={18} color="white" />
              <View>
                <Text className="font-bold text-sm text-white">New Post</Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>

      {!user?.googleLocationId && (
        <NotConnectedBanner isDark={theme === "dark"} />
      )}

      {isInitial && (
        <InitialSkeleton isInitial={isInitial} isDark={theme === "dark"} />
      )}

      {isError && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            backgroundColor:
              theme === "dark" ? "rgba(239,68,68,0.08)" : "#FEE2E2",
            borderColor: theme === "dark" ? "rgba(239,68,68,0.2)" : "#FECACA",
          }}
        >
          <Ionicons
            name="wifi-outline"
            size={16}
            color="rgba(239,68,68,0.7)"
            style={{ marginTop: 2, marginRight: 8 }}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "rgba(239,68,68,0.7)",
                marginBottom: 2,
              }}
            >
              Failed to load posts
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme === "dark" ? "rgba(239,68,68,0.7)" : "#F87171",
              }}
            >
              {error?.message}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (!user) {
                  router.push("/(auth)/login");
                } else {
                  refetch();
                }
              }}
              style={{ marginTop: 6 }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "rgba(239,68,68,0.7)",
                }}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="flex-row flex-wrap justify-between mt-3">
        {myPostsMetrics.map((item, index) => (
          <MetricCard item={item} key={item.title + index} />
        ))}
      </View>

      <View
        className="flex-row items-center border rounded-full py-0.5 mb-4 px-4 my-3"
        style={{ borderColor: textMuted }}
      >
        <Search size={20} color={textMuted} />
        <TextInput
          className="flex-1 ml-2 text-md"
          placeholder="Search posts..."
          value={search}
          placeholderTextColor={textMuted}
          onChangeText={setSearch}
          style={{ color: textMuted }}
          cursorColor={link}
        />
        {search && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-outline" size={18} color={textMuted} />
          </Pressable>
        )}
      </View>
      {/* Categories Scroller */}
      <View className="">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              className="px-5 py-1.5 rounded-2xl mr-2"
              style={{
                backgroundColor: filter === item.id ? link : textMuted + "30",
              }}
              onPress={() => setFilter(item.id)}
            >
              <Text
                className="font-medium text-md"
                style={{ color: filter === item.id ? "white" : text }}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
          className="mb-6"
        />
      </View>
      {posts.length > 0 && visible.length === 0 && (
        <View
          className={`rounded-2xl p-8 border items-center justify-center
      `}
        >
          <Ionicons
            name="search-outline"
            size={24}
            color={textMuted}
            style={{ marginBottom: 8 }}
          />
          <Text
            className="text-sm text-center
        "
            style={{ color: textMuted }}
          >
            No posts match your filter
          </Text>
        </View>
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: primary, paddingTop: 24 }}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            onDelete={setDeleteTarget}
            // onEdit={(p) =>
            //   router.push(
            //     `${FRONTEND_URL}/post/edit/${encodeURIComponent(p.name)}`,
            //   )
            // }
            isDeleting={
              deleteMutation.isPending && deleteMutation.variables === item.name
            }
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={
          !loadingMore && hasMore ? <LoadMore onClick={loadMore} /> : <></>
        }
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 25 }}
      />
      {deleteTarget && (
        <DeleteModal
          post={deleteTarget}
          isDeleting={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.name)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}

function PostCard({
  item,
  // setPosts,
  onDelete,
  // onEdit,
  isDeleting,
}: {
  item: Post;
  // setPosts: Dispatch<SetStateAction<Post[]>>;
  onDelete: (p: Post) => void;
  // onEdit: (p: Post) => void;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState<Post | null>(null);
  const needsTrunc = item.summary.length > 100;
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";
  const { cls, label } = stateBadge(item.state, isDark);
  return (
    <View
      className={`mb-6 rounded-3xl border overflow-hidden"
       ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
      style={{ borderColor: link + "40" }}
    >
      {/* Post Image & Badge */}
      {item.imageUrl && (
        <View className="relative h-56 w-full">
          <Image
            source={{ uri: item.imageUrl }}
            className="h-full w-full object-cover rounded-3xl"
            resizeMode="cover"
          />
          <View
            className="absolute top-3 right-3 px-3 py-1 rounded-full flex-row items-center border"
            style={{ backgroundColor: text, borderColor: link }}
          >
            <Zap size={12} color={link} fill={link} />
            <Text
              className="font-black text-[10px] ml-1 tracking-widest"
              style={{ color: link }}
            >
              {item.topicType}
            </Text>
          </View>
        </View>
      )}

      {/* Post Content */}
      <View className="p-5">
        <View className="flex-row justify-between items-center mb-4">
          <View
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: green + "40", borderColor: green }}
          >
            <Text className="font-bold text-xs" style={{ color: green }}>
              {label}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text
              className="text-xs mr-2"
              style={{ color: isDark ? textMuted : "black" }}
            >
              {item.date}
            </Text>
            <MoreVertical size={18} color={isDark ? textMuted : "black"} />
          </View>
        </View>

        <Text className="flex-row items-center">
          <Text
            className="text-base leading-6 mb-2"
            style={{ color: isDark ? textMuted : "black" }}
          >
            {needsTrunc && !expanded
              ? item.summary.slice(0, 100) + "…"
              : item.summary}
          </Text>
          {needsTrunc && (
            <Pressable onPress={() => setExpanded((v) => !v)}>
              <Text className="font-bold" style={{ color: link }}>
                {expanded ? "Less" : "More"}
              </Text>
            </Pressable>
          )}
        </Text>

        {/* <View className="self-start py-1 rounded-lg mb-6">
          <Text
            className="font-bold text-xs tracking-widest border rounded-md px-2 py-1"
            style={{ color: link, borderColor: link }}
          >
            {item.cta}
          </Text>
        </View> */}

        {item.couponCode && (
          <View
            className={`mt-2 flex-row items-center px-2.5 py-1 rounded-lg self-start
      ${isDark ? "bg-orange-500/15" : "bg-orange-50"}`}
          >
            <Text
              className={`text-[11px] font-bold
        ${isDark ? "text-orange-400" : "text-orange-600"}`}
            >
              🏷️ {item.couponCode}
            </Text>
          </View>
        )}

        {/* CTA */}
        {item.cta && item.cta !== "NONE" && (
          <View
            className={`mt-2 flex-row items-center px-2.5 py-1 rounded-lg self-start
      ${isDark ? "bg-blue-500/15" : "bg-blue-50"}`}
          >
            <Text
              className={`text-[11px] font-semibold
        ${isDark ? "text-blue-400" : "text-blue-600"}`}
            >
              {item.cta.replace(/_/g, " ")}
            </Text>
          </View>
        )}

        {/* Footer Actions */}
        <View className="h-[1px] w-full mb-4" />
        <View className="flex-row justify-between items-center">
          <View className="flex-row gap-x-2">
            {/* <Pressable
              className="flex-row items-center px-4 py-2 rounded-lg"
              style={{ backgroundColor: link }}
              onPress={() => onEdit(item)}
            >
              <Edit2 size={16} color="#fff" />
              <Text className="font-bold ml-2 text-xs text-white">Edit</Text>
            </Pressable> */}
            <Pressable
              className="flex-row items-center px-2 py-2 rounded-lg"
              style={{ backgroundColor: link }}
              onPress={() => onDelete(item)}
            >
              <Trash2 size={16} color="#fff" />
              <Text className="font-bold ml-2 text-xs text-white">Delete</Text>
            </Pressable>
          </View>
          <View className="flex-row items-center">
            <Clock size={14} color={text} />
            <Text className="text-[10px] ml-1" style={{ color: text }}>
              {item.updateDate}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function DeleteModal({
  post,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  post: Post;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";
  const primary = useColor("primary");
  const text = useColor("text");
  const red = useColor("red");
  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isDeleting) onCancel();
      }}
    >
      {/* Backdrop */}
      <View
        className="flex-1 justify-center items-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      >
        {/* Card */}
        <View
          className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl
            `}
          style={{ backgroundColor: primary }}
        >
          {/* Content */}
          <View className="p-6 items-center">
            <View
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4
                `}
              style={{ backgroundColor: red + "30", borderColor: red }}
            >
              <Trash2 size={22} color={red} />
            </View>

            <Text
              className={`text-[17px] font-black mb-1.5`}
              style={{ letterSpacing: -0.03, color: text }}
            >
              Delete Post?
            </Text>

            <Text
              className={`text-sm text-center leading-relaxed mb-1
                `}
              style={{ color: textMuted }}
            >
              This will permanently remove the post from your Google Business
              Profile.
            </Text>

            <Text
              className={`text-sm font-medium
                `}
              style={{ color: text }}
              numberOfLines={1}
            >
              &quot;{post.summary.slice(0, 60)}
              {post.summary.length > 60 ? "…" : ""}&quot;
            </Text>
          </View>

          {/* Buttons */}
          <View
            className={`px-4 pb-5 pt-4 flex-row gap-2.5 border-t
              `}
            style={{ borderColor: textMuted + "40" }}
          >
            <TouchableOpacity
              onPress={onCancel}
              disabled={isDeleting}
              className={`flex-1 h-11 rounded-2xl items-center justify-center`}
              style={{
                backgroundColor: textMuted + "30",
                borderColor: textMuted,
              }}
            >
              <Text
                className={`text-sm font-semibold`}
                style={{ color: textMuted }}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isDeleting}
              className="flex-1 h-11 rounded-2xl flex-row items-center justify-center gap-2 border"
              style={{ backgroundColor: red + "30", borderColor: red + "60" }}
            >
              {isDeleting ? (
                <>
                  <ActivityIndicator size="small" color={red} />
                  <Text className="text-sm font-bold" style={{ color: red }}>
                    Deleting…
                  </Text>
                </>
              ) : (
                <>
                  <Trash2 size={14} color={red} />
                  <Text className="text-sm font-bold" style={{ color: red }}>
                    Delete
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LoadMore({ onClick }: { onClick: () => void }) {
  return (
    <View className="my-2">
      <Pressable
        className="w-full border rounded-xl py-4"
        style={{ borderColor: link, backgroundColor: link }}
        onPress={onClick}
      >
        <Text className="text-center text-md" style={{ color: text }}>
          Load More
        </Text>
      </Pressable>
    </View>
  );
}
