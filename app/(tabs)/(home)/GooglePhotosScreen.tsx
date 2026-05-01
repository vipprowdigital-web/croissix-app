import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Pressable,
} from "react-native";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useColor } from "@/hooks/useColor";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { getToken } from "@/services/auth.util";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/services/(user)/user.service";
import { FRONTEND_URL } from "@/config/.env";
import { queryClient } from "@/providers/queryClient";
import { NotConnectedBanner } from "@/components/ui/NotConnectedBanner";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const { width } = Dimensions.get("window");
const columnWidth = (width - 65) / 3;

type MediaFormat = "PHOTO" | "VIDEO";
type MediaCategory =
  | "COVER"
  | "LOGO"
  | "EXTERIOR"
  | "INTERIOR"
  | "PRODUCT"
  | "AT_WORK"
  | "FOOD_AND_DRINK"
  | "MENU"
  | "COMMON_AREA"
  | "ROOMS"
  | "TEAMS"
  | "ADDITIONAL";

interface GBPMedia {
  name: string;
  mediaFormat: MediaFormat;
  locationAssociation?: { category: MediaCategory };
  googleUrl?: string;
  thumbnailUrl?: string;
  createTime: string;
  dimensions?: { widthPixels: number; heightPixels: number };
  viewCount?: number;
  description?: string;
  id: string;
}

interface MediaResponse {
  mediaItems: GBPMedia[];
  totalMediaItemCount: number;
  nextPageToken?: string;
}

const categoryMeta = [
  {
    label: "Cover",
    apiKey: "COVER",
    color: "#3B82F6",
    icon: "star-outline",
    type: "ion",
  },
  {
    label: "Logo",
    apiKey: "LOGO",
    color: "#8B5CF6",
    icon: "shield-outline",
    type: "ion",
  },
  {
    label: "Exterior",
    apiKey: "EXTERIOR",
    color: "#06B6D4",
    icon: "location-outline",
    type: "ion",
  },
  {
    label: "Interior",
    apiKey: "INTERIOR",
    color: "#A855F7",
    icon: "grid-outline",
    type: "ion",
  },
  {
    label: "Product",
    apiKey: "PRODUCT",
    color: "#0EA5E9",
    icon: "cube-outline",
    type: "ion",
  },
  {
    label: "At Work",
    apiKey: "AT_WORK",
    color: "#10B981",
    icon: "people-outline",
    type: "ion",
  },
  {
    label: "Additional",
    apiKey: "ADDITIONAL",
    color: "#c4c4c8",
    icon: "camera-outline",
    type: "ion",
  },
];

const getCategoryMeta = (category?: MediaCategory) => {
  if (!category) return { icon: "camera-outline", color: "#c4c4c8" };
  const match = categoryMeta.find((c) => c.apiKey === category);
  return {
    icon: match?.icon ?? "camera-outline",
    color: match?.color ?? "#c4c4c8",
  };
};

async function fetchMedia(locationId: string): Promise<MediaResponse> {
  const url = `${FRONTEND_URL}/api/google/media/list?location=locations/${encodeURIComponent(locationId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch media");
  }
  const data = await res.json();
  return {
    mediaItems: data.mediaItems || [],
    totalMediaItemCount:
      data.totalMediaItemCount || data.mediaItems?.length || 0,
    nextPageToken: data.nextPageToken || null,
  };
}

async function deleteMedia(mediaName: string) {
  const url = `${FRONTEND_URL}/api/google/media/delete`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mediaName }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete media");
  }
  return res.json();
}

export default function GooglePhotosScreen() {
  const [selectedPhoto, setSelectedPhoto] = useState<GBPMedia>();
  const [isDeleting, setIsDeleting] = useState(false);
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%"], []);

  const text = useColor("text");
  const red = useColor("red");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const primary = useColor("primary");

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const [layout, setLayout] = useState<"grid" | "card">("grid");
  const [filter, setFilter] = useState<MediaCategory | "ALL">("ALL");

  const { data: user } = useUser();
  const locationId = user?.googleLocationId ?? "";
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";

  const { data, isLoading, refetch, isFetching } = useQuery<MediaResponse>({
    queryKey: ["gbp-media", locationId],
    queryFn: () => fetchMedia(locationId),
    staleTime: 5 * 60 * 1000,
    enabled: !!locationId,
  });

  // ── Derived stats from real data ──────────────────────────
  const mediaItems = data?.mediaItems ?? [];

  const stats = useMemo(() => {
    const photos = mediaItems.filter((m) => m.mediaFormat === "PHOTO").length;
    const videos = mediaItems.filter((m) => m.mediaFormat === "VIDEO").length;
    const totalViews = mediaItems.reduce(
      (acc, m) => acc + (m.viewCount ?? 0),
      0,
    );
    const uniqueCats = new Set(
      mediaItems.map((m) => m.locationAssociation?.category).filter(Boolean),
    ).size;
    return { photos, videos, totalViews, uniqueCats };
  }, [mediaItems]);

  // ── Coverage counts per category ──────────────────────────
  const coverageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of mediaItems) {
      const cat = item.locationAssociation?.category ?? "ADDITIONAL";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [mediaItems]);

  // ── Filtered items ─────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (filter === "ALL") return mediaItems;
    return mediaItems.filter((m) => m.locationAssociation?.category === filter);
  }, [mediaItems, filter]);

  // ── Delete handler with optimistic removal ─────────────────
  const handleDelete = async () => {
    if (!selectedPhoto?.name) return;
    setIsDeleting(true);
    try {
      await deleteMedia(selectedPhoto.name);
      // Optimistic update — remove from cache immediately
      queryClient.setQueryData<MediaResponse>(
        ["gbp-media", locationId],
        (old) => {
          if (!old) return old;
          const mediaItems = old.mediaItems.filter(
            (m) => m.name !== selectedPhoto.name,
          );
          return { ...old, mediaItems, totalMediaItemCount: mediaItems.length };
        },
      );
      sheetRef.current?.close();
    } catch (e) {
      console.error("Delete failed:", e);
      // Refetch to restore correct state
      refetch();
    } finally {
      setIsDeleting(false);
    }
  };

  // if (!locationId) {
  //   return (
  //     <View className="flex-row justify-center items-center w-full">
  //       <NotConnectedBanner isDark={isDark} />
  //     </View>
  //   );
  // }

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1">
        <ScrollView className="flex-1 px-4 pt-5">
          {/* HEADER */}
          <View className="flex-row items-center justify-between mb-2">
            <View
              className="flex-row items-center px-4 py-1.5 rounded-full border"
              style={{ backgroundColor: primaryForeground }}
            >
              <View
                className="h-2 w-2 rounded-full mr-2"
                style={{ backgroundColor: link }}
              />
              <Text
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: link }}
              >
                Google Business
              </Text>
            </View>
            {locationId && (
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="p-2 rounded-full shadow-sm mr-3 border"
                  style={{ backgroundColor: textMuted + "30" }}
                  onPress={() => refetch()}
                >
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={isFetching ? link : text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center px-5 py-2.5 rounded-2xl shadow-lg"
                  style={{ backgroundColor: link }}
                  onPress={() => router.push("/AddPhotosScreen")}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text className="text-white font-bold ml-1">Add Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text
            className="text-3xl font-extrabold mb-1"
            style={{ color: text }}
          >
            Profile Photos
          </Text>
          <Text className="text-sm font-medium mb-6" style={{ color: link }}>
            {stats.photos + stats.videos} media{" "}
            <Text style={{ color: textMuted }}>
              · {data?.totalMediaItemCount ?? 0} total
            </Text>
          </Text>

          {/* STATS — dynamic */}
          <View className="flex-row justify-between mb-8">
            <StatCard
              icon="camera-outline"
              value={String(stats.photos)}
              label="Photos"
              color="#3B82F6"
            />
            <StatCard
              icon="videocam-outline"
              value={String(stats.videos)}
              label="Videos"
              color="#EF4444"
            />
            <StatCard
              icon="eye-outline"
              value={String(stats.totalViews)}
              label="Total Views"
              color="#10B981"
            />
            <StatCard
              icon="grid-outline"
              value={String(stats.uniqueCats)}
              label="Categories"
              color="#F59E0B"
            />
          </View>

          {/* FILTERS */}
          <View className="flex-row items-center justify-between mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row flex-1"
            >
              <FilterTab
                label={`All (${mediaItems.length})`}
                active={filter === "ALL"}
                onPress={() => setFilter("ALL")}
              />
              {categoryMeta.map((cat) => {
                const count = coverageCounts[cat.apiKey] ?? 0;
                if (count === 0) return null;
                return (
                  <FilterTab
                    key={cat.apiKey}
                    icon={cat.icon}
                    label={`${cat.label} (${count})`}
                    active={filter === cat.apiKey}
                    onPress={() => setFilter(cat.apiKey as MediaCategory)}
                    color={cat.color}
                  />
                );
              })}
            </ScrollView>
            <View
              className="flex-row rounded-xl p-1 border shadow-sm ml-2"
              style={{ backgroundColor: link + "40" }}
            >
              <TouchableOpacity
                className="p-1.5 rounded-lg"
                onPress={() => setLayout("grid")}
                style={
                  layout === "grid" ? { backgroundColor: link } : undefined
                }
              >
                <Ionicons name="grid" size={18} color={text} />
              </TouchableOpacity>
              <TouchableOpacity
                className="p-1.5 ml-1 rounded-xl"
                onPress={() => setLayout("card")}
                style={
                  layout === "card" ? { backgroundColor: link } : undefined
                }
              >
                <Ionicons name="list" size={18} color={text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* AI PROMO BANNER */}
          {locationId && (
            <TouchableOpacity
              className="mb-6 rounded-[32px] overflow-hidden"
              onPress={() => router.push("/AddPhotosScreen")}
            >
              <LinearGradient
                colors={["#2B033D", "#9f57f5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="brain"
                    size={28}
                    color="white"
                    style={{ opacity: 0.8 }}
                  />
                  <Text className="text-white text-md font-bold ml-3">
                    Add Photos
                    {/* Add Photos with AI */}
                  </Text>
                </View>
                <View
                  className="px-3 py-0.5 rounded-full border flex-row items-center"
                  style={{
                    backgroundColor: textMuted + "30",
                    borderColor: textMuted,
                  }}
                >
                  <FontAwesome5 name="bolt" size={10} color="white" />
                  <Text className="text-white text-xs font-bold ml-1">AI</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* PHOTO GRID / LIST */}
          {isLoading ? (
            <View className="items-center py-20">
              <Text style={{ color: textMuted }}>Loading photos...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View className="items-center py-20">
              <Ionicons name="images-outline" size={40} color={textMuted} />
              <Text className="mt-3 font-bold" style={{ color: textMuted }}>
                No photos in this category
              </Text>
            </View>
          ) : layout === "grid" ? (
            <View className="flex-row flex-wrap justify-between pb-5 mx-1">
              {filteredItems.map((photo) => {
                const { icon, color } = getCategoryMeta(
                  photo.locationAssociation?.category,
                );
                return (
                  <PhotoItem
                    key={photo.name}
                    category={photo.locationAssociation?.category}
                    icon={icon}
                    color={color}
                    img={photo.thumbnailUrl}
                    onPress={() =>
                      router.push({
                        pathname: "/PhotoViewer",
                        params: {
                          photos: JSON.stringify(filteredItems),
                          id: photo.name,
                        },
                      })
                    }
                  />
                );
              })}
            </View>
          ) : (
            <View className="w-full">
              {filteredItems.map((photo) => {
                const { icon, color } = getCategoryMeta(
                  photo.locationAssociation?.category,
                );
                return (
                  <ImageDetails
                    key={photo.name}
                    dimensions={photo.dimensions}
                    time={photo.createTime}
                    photoType={photo.locationAssociation?.category}
                    icon={icon}
                    color={color}
                    img={photo.thumbnailUrl}
                    onPress={() =>
                      router.push({
                        pathname: "/PhotoViewer",
                        params: {
                          photos: JSON.stringify(filteredItems),
                          id: photo.name,
                        },
                      })
                    }
                    onDelete={() => {
                      setSelectedPhoto(photo);
                      sheetRef.current?.expand();
                    }}
                  />
                );
              })}
            </View>
          )}

          {/* COVERAGE GUIDE — dynamic counts */}
          <View className="rounded-2xl mt-10 mb-20">
            <Text
              className="text-[10px] font-bold uppercase tracking-[2px] mb-4 ml-1"
              style={{ color: text }}
            >
              Coverage Guide
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {categoryMeta.slice(0, 6).map((item, index) => {
                const current = coverageCounts[item.apiKey] ?? 0;
                const recommended = 5; // recommended count per category
                const pct = Math.min((current / recommended) * 100, 100);
                return (
                  <View
                    key={index}
                    className="rounded-2xl px-4 py-2 mb-3 flex-row items-center border shadow-sm"
                    style={{
                      width: (width - 45) / 2,
                      borderColor: link + "40",
                      backgroundColor: primaryForeground + "10",
                    }}
                  >
                    <View className="w-7 h-7 rounded-xl items-center justify-center mr-3">
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={item.color}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row justify-between items-end mb-1.5">
                        <Text
                          numberOfLines={1}
                          className="text-xs font-bold"
                          style={{ color: text }}
                        >
                          {item.label}
                        </Text>
                        <Text
                          className="text-xs font-bold"
                          style={{ color: text }}
                        >
                          {current}/{recommended}
                        </Text>
                      </View>
                      <View className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: item.color,
                            width: `${pct}%`,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* DELETE BOTTOM SHEET */}
        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ backgroundColor: textMuted, width: 40 }}
          backgroundStyle={{ borderRadius: 40, backgroundColor: primary }}
        >
          <BottomSheetView className="flex-1">
            <View
              className="flex-1 justify-center items-center px-6"
              style={{ backgroundColor: primary }}
            >
              <View
                className="w-full rounded-3xl p-6 items-center shadow-xl"
                style={{ backgroundColor: primary }}
              >
                <View
                  className="p-5 rounded-2xl mb-2"
                  style={{ backgroundColor: red + "20" }}
                >
                  <Feather name="trash-2" size={28} color={red} />
                </View>
                <Text className="text-2xl font-black" style={{ color: text }}>
                  Delete Photo?
                </Text>
                <Text
                  className="text-center text-sm leading-5 mb-3"
                  style={{ color: textMuted }}
                >
                  This will permanently remove the photo from your Google
                  Business Profile.
                </Text>

                <View
                  className="w-full rounded-2xl p-4 flex-row items-center border mb-3"
                  style={{
                    backgroundColor: link + "30",
                    borderColor: link + "40",
                  }}
                >
                  <Image
                    source={{ uri: selectedPhoto?.thumbnailUrl }}
                    className="w-16 h-16 rounded-2xl"
                  />
                  <View className="ml-4 flex-1">
                    <View className="flex-row items-center mb-1">
                      <View
                        className="px-2 py-0.5 rounded-md flex-row items-center"
                        style={{ backgroundColor: link }}
                      >
                        <Ionicons
                          name={
                            getCategoryMeta(
                              selectedPhoto?.locationAssociation?.category,
                            ).icon as any
                          }
                          size={10}
                          color="white"
                        />
                        <Text className="text-[10px] font-bold ml-1 text-white">
                          {selectedPhoto?.locationAssociation?.category}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-bold" style={{ color: text }}>
                      {selectedPhoto?.dimensions?.widthPixels} x{" "}
                      {selectedPhoto?.dimensions?.heightPixels}
                    </Text>
                    <Text className="text-[10px]" style={{ color: textMuted }}>
                      · {selectedPhoto?.viewCount ?? 0} views
                    </Text>
                  </View>
                </View>

                <View
                  className="w-full rounded-2xl p-4 flex-row mb-8"
                  style={{ backgroundColor: red + "20" }}
                >
                  <Feather name="alert-triangle" size={16} color="#EF4444" />
                  <Text
                    className="text-[11px] leading-4 ml-3 flex-1 font-medium"
                    style={{ color: "#EF4444" }}
                  >
                    Google may take up to 24 hours to reflect this change across
                    all surfaces.
                  </Text>
                </View>

                <View className="flex-row w-full justify-between">
                  <TouchableOpacity
                    onPress={() => sheetRef.current?.close()}
                    className="flex-1 border py-4 rounded-2xl mr-3 items-center"
                    style={{
                      backgroundColor: textMuted + "40",
                      borderColor: textMuted + "50",
                    }}
                  >
                    <Text
                      className="font-bold text-base"
                      style={{ color: text }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 py-4 rounded-2xl flex-row items-center justify-center"
                    style={{ backgroundColor: isDeleting ? red + "80" : red }}
                    onPress={handleDelete}
                    disabled={isDeleting}
                  >
                    <Feather name="trash-2" size={18} color="white" />
                    <Text className="text-white font-bold text-base ml-2">
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

// ── Sub-components ─────────────────────────────────────────

const StatCard = ({ icon, value, label, color }: any) => {
  const textMuted = useColor("textMuted");
  return (
    <View
      className="rounded-3xl p-3 items-center justify-center border shadow-sm"
      style={{ width: (width - 48) / 4, backgroundColor: textMuted + "20" }}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-base font-bold" style={{ color }}>
        {value}
      </Text>
      <Text className="text-xs font-medium mt-1" style={{ color: textMuted }}>
        {label}
      </Text>
    </View>
  );
};

const FilterTab = ({ icon, label, active, onPress, color }: any) => {
  const link = useColor("link");
  const text = useColor("text");
  const activeColor = color ?? link;
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-2 rounded-2xl mr-2 border"
      style={{
        backgroundColor: active ? activeColor + "30" : "transparent",
        borderColor: active ? activeColor : "transparent",
      }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? activeColor : text}
          style={{ marginRight: 3 }}
        />
      )}
      <Text
        className={`text-sm font-bold ${active ? "" : "opacity-60"}`}
        style={{ color: active ? activeColor : text }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const PhotoItem = ({ category, icon, color, onPress, img }: any) => (
  <Pressable
    className="rounded-2xl overflow-hidden mb-4"
    style={{ width: columnWidth, height: columnWidth }}
    onPress={onPress}
  >
    <Image source={{ uri: img }} className="w-full h-full" />
    <View
      className="absolute top-2 left-2 flex-row items-center px-2 py-1 rounded-full shadow-sm"
      style={{ backgroundColor: color + "95" }}
    >
      <Ionicons name={icon} size={10} color="white" />
      <Text className="text-white text-[9px] font-bold ml-1">{category}</Text>
    </View>
  </Pressable>
);

const ImageDetails = ({
  photoType,
  img,
  dimensions,
  time,
  views = 0,
  icon,
  color,
  onPress,
  onDelete,
}: any) => {
  const link = useColor("link");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const red = useColor("red");
  return (
    <View
      className="w-full my-2 p-3 flex-row justify-between items-center border rounded-xl"
      style={{ borderColor: link + "30", backgroundColor: link + "10" }}
    >
      <View className="flex-row items-center">
        <Image
          source={{ uri: img }}
          style={{ width: 64, height: 64, borderRadius: 16 }}
        />
        <View className="ml-4">
          <View className="flex-row items-center mb-1">
            <View
              className="px-2 py-0.5 rounded-md flex-row items-center"
              style={{ backgroundColor: color + "30" }}
            >
              <Ionicons name={icon as any} size={10} color={color} />
              <Text
                numberOfLines={1}
                className="text-[10px] font-bold ml-1"
                style={{ color }}
              >
                {photoType}
              </Text>
            </View>
          </View>
          {dimensions?.widthPixels && (
            <Text className="text-xs font-bold" style={{ color: text }}>
              {dimensions.widthPixels} x {dimensions.heightPixels}
            </Text>
          )}
          <Text className="text-[10px]" style={{ color: textMuted }}>
            {new Date(time).getDate().toString().padStart(2, "0")}/
            {(new Date(time).getMonth() + 1).toString().padStart(2, "0")}/
            {new Date(time).getFullYear()} · {views} views
          </Text>
        </View>
      </View>
      <View className="flex-row gap-3 items-center">
        <Pressable onPress={onPress}>
          <View
            style={{ backgroundColor: link + "20" }}
            className="p-2 rounded-xl"
          >
            <MaterialCommunityIcons
              name="magnify-plus-outline"
              size={20}
              color={link}
            />
          </View>
        </Pressable>
        <Pressable onPress={onDelete}>
          <View
            style={{ backgroundColor: red + "20" }}
            className="p-2 rounded-xl"
          >
            <Ionicons name="trash-outline" size={20} color={red} />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   Dimensions,
//   Pressable,
// } from "react-native";
// import {
//   Ionicons,
//   Feather,
//   MaterialCommunityIcons,
//   FontAwesome5,
// } from "@expo/vector-icons";
// import { useColor } from "@/hooks/useColor";
// import { LinearGradient } from "expo-linear-gradient";
// import { router } from "expo-router";
// import BottomSheet, {
//   BottomSheetBackdrop,
//   BottomSheetView,
// } from "@gorhom/bottom-sheet";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { getToken } from "@/services/auth.util";
// import { useQuery } from "@tanstack/react-query";
// import { useUser } from "@/services/(user)/user.service";
// import { FRONTEND_URL } from "@/config/.env";

// const { width } = Dimensions.get("window");
// const columnWidth = (width - 65) / 3;

// /* ════════════════════════════════════════════════════════
//    TYPES
// ════════════════════════════════════════════════════════ */
// type MediaFormat = "PHOTO" | "VIDEO";
// type MediaCategory =
//   | "COVER"
//   | "LOGO"
//   | "EXTERIOR"
//   | "INTERIOR"
//   | "PRODUCT"
//   | "AT_WORK"
//   | "FOOD_AND_DRINK"
//   | "MENU"
//   | "COMMON_AREA"
//   | "ROOMS"
//   | "TEAMS"
//   | "ADDITIONAL";

// interface GBPMedia {
//   name: string; // e.g. accounts/{id}/locations/{id}/media/{id}
//   mediaFormat: MediaFormat;
//   locationAssociation?: { category: MediaCategory };
//   googleUrl?: string;
//   thumbnailUrl?: string;
//   createTime: string;
//   dimensions?: { widthPixels: number; heightPixels: number };
//   viewCount?: number;
//   description?: string;
//   // derived
//   id: string;
// }

// interface MediaResponse {
//   mediaItems: GBPMedia[];
//   totalMediaItemCount: number;
//   nextPageToken?: string;
// }

// const categories = [
//   {
//     label: "Cover",
//     current: 1,
//     total: 1,
//     color: "#3B82F6",
//     icon: "star-outline",
//     type: "ion",
//   },
//   {
//     label: "Logo",
//     current: 1,
//     total: 1,
//     color: "#8B5CF6",
//     icon: "shield-outline",
//     type: "ion",
//   },
//   {
//     label: "Exterior",
//     current: 4,
//     total: 5,
//     color: "#06B6D4",
//     icon: "location-outline",
//     type: "ion",
//   },
//   {
//     label: "Interior",
//     current: 4,
//     total: 8,
//     color: "#A855F7",
//     icon: "grid-outline",
//     type: "ion",
//   },
//   {
//     label: "Product",
//     current: 5,
//     total: 10,
//     color: "#0EA5E9",
//     icon: "cube-outline",
//     type: "ion",
//   },
//   {
//     label: "At Work",
//     current: 2,
//     total: 3,
//     color: "#10B981",
//     icon: "people-outline",
//     type: "ion",
//   },
// ];

// const allCategories = [
//   ...categories,
//   {
//     label: "Additional",
//     dim: "1080 × 608px",
//     desc: "Other photos",
//     icon: "camera-outline",
//     color: "#c4c4c8",
//   },
// ];

// // Add this after your allCategories array definition
// const categoryMap = Object.fromEntries(
//   allCategories.map((c) => [c.label.toUpperCase(), c]),
// );

// const getCategoryMeta = (category?: MediaCategory) => {
//   if (!category) return { icon: "camera-outline", color: "#c4c4c8" };
//   const match = allCategories.find(
//     (c) => c.label.toUpperCase().replace(/ /g, "_") === category,
//   );
//   return {
//     icon: match?.icon ?? "camera-outline",
//     color: match?.color ?? "#c4c4c8",
//   };
// };

// const photos = [
//   {
//     id: 1,
//     photoType: "Cover",
//     img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
//     dimensions: "1920 x 1080",
//     time: "1d ago",
//     views: 4021,
//     icon: "star-outline",
//     color: "#3B82F6",
//   },
//   {
//     id: 2,
//     photoType: "Logo",
//     img: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
//     dimensions: "800 x 900",
//     time: "3d ago",
//     views: 3344,
//     icon: "shield-outline",
//     color: "#8B5CF6",
//   },
//   {
//     id: 3,
//     photoType: "Exterior",
//     img: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
//     dimensions: "1920 x 1080",
//     time: "10h ago",
//     views: 2234,
//     icon: "location-outline",
//     color: "#06B6D4",
//   },
//   {
//     id: 4,
//     photoType: "Interior",
//     img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
//     dimensions: "1200 x 800",
//     time: "5d ago",
//     views: 2890,
//     icon: "grid-outline",
//     color: "#A855F7",
//   },
//   {
//     id: 5,
//     photoType: "Product",
//     img: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e",
//     dimensions: "1024 x 768",
//     time: "1d ago",
//     views: 1576,
//     icon: "cube-outline",
//     color: "#0EA5E9",
//   },
//   {
//     id: 6,
//     photoType: "At Work",
//     img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
//     dimensions: "1080 x 720",
//     time: "2w ago",
//     views: 4120,
//     icon: "people-outline",
//     color: "#10B981",
//   },
// ];

// /* ════════════════════════════════════════════════════════
//    API
// ════════════════════════════════════════════════════════ */
// async function fetchMedia(locationId: string): Promise<MediaResponse> {
//   // Construct the URL with the location parameter
//   // Example format: locationId = "locations/123456789"
//   const url = `${FRONTEND_URL}/api/google/media/list?location=locations/${encodeURIComponent(locationId)}`;
//   console.log("Url: ", url);

//   const res = await fetch(url, {
//     method: "GET",
//     headers: {
//       Authorization: `Bearer ${await getToken()}`,
//       "Content-Type": "application/json",
//     },
//   });
//   // console.log("Response from fetchMedia: ", res);

//   if (!res.ok) {
//     const errorData = await res.json().catch(() => ({}));
//     throw new Error(errorData.error || "Failed to fetch media");
//   }

//   const data = await res.json();
//   return {
//     mediaItems: data.mediaItems || [],
//     totalMediaItemCount:
//       data.totalMediaItemCount ||
//       (data.media.mediaItems ? data.mediaItems.length : 0),
//     nextPageToken: data.nextPageToken || null,
//   };
// }

// async function deleteMedia(mediaName: string) {
//   const url = `${FRONTEND_URL}/api/google/media/delete`;
//   console.log("Url: ", url);

//   const res = await fetch(url, {
//     method: "DELETE",
//     headers: {
//       Authorization: `Bearer ${await getToken()}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ mediaName }),
//   });
//   console.log("Response from deleteMedia: ", res);

//   if (!res.ok) {
//     const errorData = await res.json().catch(() => ({}));
//     throw new Error(errorData.error || "Failed to delete media");
//   }

//   const data = await res.json();
//   return data;
// }

// export default function GooglePhotosScreen() {
//   // const [selectedPhoto, setSelectedPhoto] = useState<(typeof photos)[0]>();
//   const [selectedPhoto, setSelectedPhoto] = useState<GBPMedia>();
//   const sheetRef = useRef<BottomSheet>(null);
//   const snapPoints = useMemo(() => ["45%"], []);
//   // Theme Colors
//   const text = useColor("text");
//   const red = useColor("red");
//   const textMuted = useColor("textMuted");
//   const link = useColor("link");
//   const primaryForeground = useColor("primaryForeground");
//   const primary = useColor("primary");
//   // Backdrop for the bottom sheet
//   const renderBackdrop = useCallback(
//     (props: any) => (
//       <BottomSheetBackdrop
//         {...props}
//         disappearsOnIndex={-1}
//         appearsOnIndex={0}
//       />
//     ),
//     [],
//   );
//   const [layout, setLayout] = useState("grid");
//   const [filter, setFilter] = useState<MediaCategory | "ALL">("ALL");
//   const [lightbox, setLightbox] = useState<{
//     photos: GBPMedia[];
//     index: number;
//   } | null>(null);
//   const { data: user, isLoading: loading } = useUser();
//   const locationId = user?.googleLocationId ?? "";
//   const { data, isLoading, isError, refetch, isFetching } =
//     useQuery<MediaResponse>({
//       queryKey: ["gbp-media", locationId],
//       queryFn: () => fetchMedia(locationId),
//       staleTime: 5 * 60 * 1000,
//       enabled: !!locationId,
//     });
//   console.log("Response from fetchMedia: ", data);

//   return (
//     <GestureHandlerRootView className="flex-1">
//       <View className="flex-1">
//         <ScrollView className="flex-1 px-4 pt-5">
//           {/* --- HEADER SECTION --- */}
//           <View className="flex-row items-center justify-between mb-2">
//             <View
//               className="flex-row items-center px-4 py-1.5 rounded-full border"
//               style={{ backgroundColor: primaryForeground }}
//             >
//               <View
//                 className="h-2 w-2 rounded-full mr-2"
//                 style={{ backgroundColor: link }}
//               />
//               <Text
//                 className="text-xs font-bold uppercase tracking-widest"
//                 style={{ color: link }}
//               >
//                 Google Business
//               </Text>
//             </View>
//             <View className="flex-row items-center">
//               <TouchableOpacity
//                 className="p-2 rounded-full shadow-sm mr-3 border"
//                 style={{ backgroundColor: textMuted + "30" }}
//               >
//                 <Ionicons name="refresh" size={20} color={text} />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 className="flex-row items-center px-5 py-2.5 rounded-2xl shadow-lg"
//                 style={{ backgroundColor: link }}
//                 onPress={() => router.push("/AddPhotosScreen")}
//               >
//                 <Ionicons name="add" size={20} color="white" />
//                 <Text className="text-white font-bold ml-1">Add Photo</Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           <Text
//             className="text-3xl font-extrabold mb-1"
//             style={{ color: text }}
//           >
//             Profile Photos
//           </Text>
//           {data?.mediaItems && (
//             <Text className="text-sm font-medium mb-6" style={{ color: link }}>
//               {data?.totalMediaItemCount} media{" "}
//               <Text style={{ color: textMuted }}>
//                 · {data.totalMediaItemCount} total
//               </Text>
//             </Text>
//           )}

//           {/* --- STATS GRID --- */}
//           <View className="flex-row justify-between mb-8">
//             <StatCard
//               icon="camera-outline"
//               value="18"
//               label="Photos"
//               color="#3B82F6"
//             />
//             <StatCard
//               icon="videocam-outline"
//               value="0"
//               label="Videos"
//               color="#EF4444"
//             />
//             <StatCard
//               icon="eye-outline"
//               value="0"
//               label="Total Views"
//               color="#10B981"
//             />
//             <StatCard
//               icon="grid-outline"
//               value="7"
//               label="Categories"
//               color="#F59E0B"
//             />
//           </View>

//           {/* --- FILTERS & VIEW TOGGLE --- */}
//           <View className="flex-row items-center justify-between mb-6">
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               className="flex-row"
//             >
//               <FilterTab label={`All ${data?.totalMediaItemCount}`} active />
//               <FilterTab icon="star-outline" label="Cover (1)" />
//               <FilterTab icon="shield-outline" label="Logo (1)" />
//             </ScrollView>
//             <View
//               className="flex-row rounded-xl p-1 border shadow-sm"
//               style={{ backgroundColor: link + "40" }}
//             >
//               <TouchableOpacity
//                 className="p-1.5 rounded-lg"
//                 onPress={() => setLayout("grid")}
//                 style={
//                   layout === "grid" ? { backgroundColor: link } : undefined
//                 }
//               >
//                 <Ionicons name="grid" size={18} color={text} />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 className="p-1.5 ml-1 rounded-xl"
//                 onPress={() => setLayout("card")}
//                 style={
//                   layout === "card" ? { backgroundColor: link } : undefined
//                 }
//               >
//                 <Ionicons name="list" size={18} color={text} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* --- AI PROMO BANNER --- */}
//           <TouchableOpacity
//             className="mb-6 rounded-[32px] overflow-hidden"
//             onPress={() => router.push("/AddPhotosScreen")}
//           >
//             <LinearGradient
//               colors={["#2B033D", "#9f57f5"]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={{
//                 paddingHorizontal: 24,
//                 paddingVertical: 12,
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <View className="flex-row items-center">
//                 <MaterialCommunityIcons
//                   name="brain"
//                   size={28}
//                   color="white"
//                   style={{ opacity: 0.8 }}
//                 />
//                 <Text className="text-white text-md font-bold ml-3">
//                   Add Photos with AI
//                 </Text>
//               </View>

//               <View
//                 className="px-3 py-0.5 rounded-full border flex-row items-center"
//                 style={{
//                   backgroundColor: textMuted + "30",
//                   borderColor: textMuted,
//                 }}
//               >
//                 <FontAwesome5 name="bolt" size={10} color="white" />
//                 <Text className="text-white text-xs font-bold ml-1">AI</Text>
//               </View>
//             </LinearGradient>
//           </TouchableOpacity>

//           {/* --- PHOTO GRID --- */}
//           {data?.mediaItems &&
//             (layout === "grid" ? (
//               <View className="flex-row flex-wrap justify-between pb-5 mx-1">
//                 {/* <PhotoItem
//                   category="Cover"
//                   icon="star"
//                   color="#3B82F6"
//                   onPress={() => router.push("/PhotoViewer")}
//                 /> */}
//                 {data.mediaItems.map((photo) => {
//                   const { icon, color } = getCategoryMeta(
//                     photo.locationAssociation?.category,
//                   );
//                   return (
//                     <PhotoItem
//                       key={photo.name}
//                       category={photo.locationAssociation?.category}
//                       icon={icon}
//                       color={color}
//                       img={photo.thumbnailUrl}
//                       onPress={() =>
//                         router.push({
//                           pathname: "/PhotoViewer",
//                           params: {
//                             photos: JSON.stringify(data.mediaItems),
//                             id: photo.name,
//                           },
//                         })
//                       }
//                     />
//                   );
//                 })}
//                 {/* {photos.map((photo) => (
//                   <PhotoItem
//                     key={photo.id}
//                     category={photo.photoType}
//                     icon={photo.icon}
//                     color={photo.color}
//                     img={photo.img}
//                     onPress={() =>
//                       router.push({
//                         pathname: "/PhotoViewer",
//                         params: {
//                           photos: JSON.stringify(photos),
//                           id: photo.id,
//                         },
//                       })
//                     }
//                   />
//                 ))} */}
//               </View>
//             ) : (
//               <View className="w-full bg-transparent">
//                 {data.mediaItems.map((photo) => {
//                   const { icon, color } = getCategoryMeta(
//                     photo.locationAssociation?.category,
//                   );
//                   return (
//                     <ImageDetails
//                       key={photo.name}
//                       dimensions={photo.dimensions}
//                       time={photo.createTime}
//                       photoType={photo.locationAssociation?.category}
//                       icon={icon}
//                       // views={photo.views}
//                       color={color}
//                       img={photo.thumbnailUrl}
//                       onPress={() =>
//                         router.push({
//                           pathname: "/PhotoViewer",
//                           params: {
//                             photos: JSON.stringify(data.mediaItems),
//                             id: photo.id,
//                           },
//                         })
//                       }
//                       onDelete={() => {
//                         setSelectedPhoto(photo);
//                         sheetRef.current?.expand();
//                       }}
//                     />
//                   );
//                 })}
//               </View>
//             ))}

//           <View className="rounded-2xl mt-10 mb-20">
//             {/* Section Heading */}
//             <Text
//               className="text-[10px] font-bold uppercase tracking-[2px] mb-4 ml-1"
//               style={{ color: text }}
//             >
//               Coverage Guide
//             </Text>

//             {/* Grid Layout */}
//             <View className="flex-row flex-wrap justify-between">
//               {categories.map((item, index) => (
//                 <View
//                   key={index}
//                   className="rounded-2xl px-4 py-2 mb-3 flex-row items-center border shadow-sm"
//                   style={{
//                     width: (width - 45) / 2,
//                     borderColor: link + "40",
//                     backgroundColor: primaryForeground + "10",
//                   }}
//                 >
//                   <View className="w-7 h-7 rounded-xl items-center justify-center mr-3">
//                     <Ionicons
//                       name={item.icon as any}
//                       size={18}
//                       color={item.color}
//                     />
//                   </View>

//                   {/* Info Container */}
//                   <View className="flex-1">
//                     <View className="flex-row justify-between items-end mb-1.5">
//                       <Text
//                         numberOfLines={1}
//                         className="text-xs font-bold"
//                         style={{ color: text }}
//                       >
//                         {item.label}
//                       </Text>
//                       <Text
//                         className="text-xs font-bold"
//                         style={{ color: text }}
//                       >
//                         {item.current}/{item.total}
//                       </Text>
//                     </View>

//                     {/* Progress Bar */}
//                     <View className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
//                       <View
//                         className="h-full rounded-full"
//                         style={{
//                           backgroundColor: item.color,
//                           width: `${(item.current / item.total) * 100}%`,
//                         }}
//                       />
//                     </View>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           </View>
//         </ScrollView>
//         <BottomSheet
//           ref={sheetRef}
//           index={-1}
//           snapPoints={snapPoints}
//           enablePanDownToClose
//           backdropComponent={renderBackdrop}
//           handleIndicatorStyle={{ backgroundColor: textMuted, width: 40 }}
//           backgroundStyle={{
//             borderRadius: 40,
//             backgroundColor: primary,
//           }}
//         >
//           <BottomSheetView className="flex-1">
//             <View
//               className="flex-1 justify-center items-center px-6"
//               style={{ backgroundColor: primary }}
//             >
//               <View
//                 className="w-full rounded-3xl p-6 items-center shadow-xl"
//                 style={{ backgroundColor: primary }}
//               >
//                 <View
//                   className="p-5 rounded-2xl mb-2"
//                   style={{ backgroundColor: red + "20" }}
//                 >
//                   <Feather name="trash-2" size={28} color={red} />
//                 </View>
//                 <Text className="text-2xl font-black" style={{ color: text }}>
//                   Delete Photo?
//                 </Text>
//                 <Text
//                   className="text-center text-sm leading-5 mb-3"
//                   style={{ color: textMuted }}
//                 >
//                   This will permanently remove the photo from your Google
//                   Business Profile. This action cannot be undone.
//                 </Text>

//                 <View
//                   className="w-full rounded-2xl p-4 flex-row items-center border mb-3"
//                   style={{
//                     backgroundColor: link + "30",
//                     borderColor: link + "40",
//                   }}
//                 >
//                   <Image
//                     source={{
//                       uri: selectedPhoto?.thumbnailUrl,
//                     }}
//                     className="w-16 h-16 rounded-2xl"
//                   />
//                   <View className="ml-4 flex-1">
//                     <View className="flex-row items-center mb-1">
//                       <View
//                         className="px-2 py-0.5 rounded-md flex-row items-center"
//                         style={{
//                           backgroundColor: link,
//                         }}
//                       >
//                         <Ionicons
//                           name={
//                             getCategoryMeta(
//                               selectedPhoto?.locationAssociation?.category,
//                             ).icon as any
//                           }
//                           size={10}
//                           color="white"
//                         />
//                         <Text className="text-[10px] font-bold ml-1 text-white">
//                           {selectedPhoto?.locationAssociation?.category}
//                         </Text>
//                       </View>
//                     </View>
//                     <Text className="text-xs font-bold" style={{ color: text }}>
//                       {selectedPhoto?.dimensions?.widthPixels} x{" "}
//                       {selectedPhoto?.dimensions?.heightPixels}
//                     </Text>
//                     <Text className="text-[10px]" style={{ color: textMuted }}>
//                       · {selectedPhoto?.viewCount ? selectedPhoto.viewCount : 0}{" "}
//                       views
//                     </Text>
//                   </View>
//                 </View>

//                 <View
//                   className="w-full rounded-2xl p-4 flex-row mb-8"
//                   style={{ backgroundColor: red + "20" }}
//                 >
//                   <Feather name="alert-triangle" size={16} color="#EF4444" />
//                   <Text
//                     className="text-[11px] leading-4 ml-3 flex-1 font-medium"
//                     style={{ color: "#EF4444" }}
//                   >
//                     Google may take up to 24 hours to reflect this change across
//                     all surfaces.
//                   </Text>
//                 </View>

//                 {/* Action Buttons */}
//                 <View className="flex-row w-full justify-between">
//                   <TouchableOpacity
//                     onPress={() => sheetRef.current?.close()}
//                     className="flex-1 border py-4 rounded-2xl mr-3 items-center"
//                     style={{
//                       backgroundColor: textMuted + "40",
//                       borderColor: textMuted + "50",
//                     }}
//                   >
//                     <Text
//                       className="font-bold text-base"
//                       style={{ color: text }}
//                     >
//                       Cancel
//                     </Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     className="flex-1 py-4 rounded-2xl flex-row items-center justify-center"
//                     style={{ backgroundColor: red }}
//                     onPress={() => {
//                       if (selectedPhoto?.name) {
//                         deleteMedia(selectedPhoto?.name);
//                         sheetRef.current?.close();
//                       }
//                     }}
//                   >
//                     <Feather name="trash-2" size={18} color="white" />
//                     <Text className="text-white font-bold text-base ml-2">
//                       Delete
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </View>
//           </BottomSheetView>
//         </BottomSheet>
//       </View>
//     </GestureHandlerRootView>
//   );
// }

// // Helper Components
// const StatCard = ({ icon, value, label, color }: any) => {
//   //   const text = useColor("text");
//   const textMuted = useColor("textMuted");
//   return (
//     <View
//       className="rounded-3xl p-3 items-center justify-center border shadow-sm"
//       style={{ width: (width - 48) / 4, backgroundColor: textMuted + "20" }}
//     >
//       <Ionicons name={icon} size={18} color={color} />
//       <Text className="text-base font-bold" style={{ color: color }}>
//         {value}
//       </Text>
//       <Text className="text-xs font-medium mt-1" style={{ color: textMuted }}>
//         {label}
//       </Text>
//     </View>
//   );
// };

// const FilterTab = ({ icon, label, active }: any) => {
//   const link = useColor("link");
//   const text = useColor("text");
//   return (
//     <TouchableOpacity
//       className="flex-row items-center px-4 py-2 rounded-2xl mr-2 border"
//       style={{
//         backgroundColor: active ? link + "30" : "transparent",
//         borderColor: active ? link : "transparent",
//       }}
//     >
//       {icon && (
//         <Ionicons
//           name={icon}
//           size={14}
//           color={active ? link : text}
//           style={{ marginRight: 3 }}
//         />
//       )}
//       <Text
//         className={`text-sm font-bold ${active ? "" : "opacity-60"}`}
//         style={{ color: active ? link : text }}
//       >
//         {label}
//       </Text>
//     </TouchableOpacity>
//   );
// };

// const PhotoItem = ({ category, icon, color, onPress, img }: any) => (
//   <Pressable
//     className="rounded-2xl overflow-hidden mb-4"
//     style={{ width: columnWidth, height: columnWidth }}
//     onPress={onPress}
//   >
//     <Image source={{ uri: img }} className="w-full h-full" />
//     <View
//       className="absolute top-2 left-2 flex-row items-center px-2 py-1 rounded-full shadow-sm"
//       style={{ backgroundColor: color + "95" }}
//     >
//       <Ionicons name={icon} size={10} color="white" />
//       <Text className="text-white text-[9px] font-bold ml-1">{category}</Text>
//     </View>
//   </Pressable>
// );

// const ImageDetails = ({
//   photoType,
//   img,
//   dimensions,
//   time,
//   views = 0,
//   icon,
//   color,
//   onPress,
//   onDelete,
// }: any) => {
//   const link = useColor("link");
//   const text = useColor("text");
//   const textMuted = useColor("textMuted");
//   return (
//     <View
//       className="w-full my-2 p-3 flex-row justify-between items-center border rounded-xl"
//       style={{ borderColor: link + "30", backgroundColor: link + "10" }}
//     >
//       <View className="flex-row items-center">
//         <View className="w-16 h-16">
//           <Image
//             source={{ uri: img }}
//             className="w-full h-full rounded-2xl object-cover"
//             style={{ width: "100%", height: "100%" }}
//           />
//         </View>

//         <View className="ml-4">
//           <View className="flex-row items-center mb-1">
//             <View
//               className="px-2 py-0.5 rounded-md flex-row items-center"
//               style={{ backgroundColor: color + "30" }}
//             >
//               <Ionicons name={icon as any} size={10} color={color} />
//               <Text
//                 numberOfLines={1}
//                 className="text-[10px] font-bold ml-1"
//                 style={{ color }}
//               >
//                 {photoType}
//               </Text>
//             </View>
//           </View>

//           {dimensions.widthPixels && (
//             <Text className="text-xs font-bold" style={{ color: text }}>
//               {dimensions.widthPixels} X {dimensions.heightPixels}
//             </Text>
//           )}
//           <Text className="text-[10px]" style={{ color: textMuted }}>
//             {new Date(time).getDate().toString().padStart(2, "0")}/
//             {(new Date(time).getMonth() + 1).toString().padStart(2, "0")}/
//             {new Date(time).getFullYear()} · {views} views
//           </Text>
//         </View>
//       </View>

//       <View className="flex-row gap-3 items-center">
//         <Pressable onPress={onPress}>
//           <View
//             style={{ backgroundColor: link + "20" }}
//             className="p-2 rounded-xl"
//           >
//             <MaterialCommunityIcons
//               name="magnify-plus-outline"
//               size={20}
//               color={link}
//             />
//           </View>
//         </Pressable>
//         <Pressable onPress={onDelete}>
//           <View
//             style={{ backgroundColor: useColor("red") + "20" }}
//             className="p-2 rounded-xl"
//           >
//             <Ionicons name="trash-outline" size={20} color={useColor("red")} />
//           </View>
//         </Pressable>
//       </View>
//     </View>
//   );
// };
