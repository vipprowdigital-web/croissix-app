import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useColor } from "@/hooks/useColor";
import { router, useLocalSearchParams } from "expo-router";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { getToken } from "@/services/auth.util";
import { FRONTEND_URL } from "@/config/.env";

const { width } = Dimensions.get("window");

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

const allCategories = [
  { label: "Cover", apiKey: "COVER", color: "#3B82F6", icon: "star-outline" },
  { label: "Logo", apiKey: "LOGO", color: "#8B5CF6", icon: "shield-outline" },
  {
    label: "Exterior",
    apiKey: "EXTERIOR",
    color: "#06B6D4",
    icon: "location-outline",
  },
  {
    label: "Interior",
    apiKey: "INTERIOR",
    color: "#A855F7",
    icon: "grid-outline",
  },
  {
    label: "Product",
    apiKey: "PRODUCT",
    color: "#0EA5E9",
    icon: "cube-outline",
  },
  {
    label: "At Work",
    apiKey: "AT_WORK",
    color: "#10B981",
    icon: "people-outline",
  },
  {
    label: "Additional",
    apiKey: "ADDITIONAL",
    color: "#c4c4c8",
    icon: "camera-outline",
  },
];

const getCategoryMeta = (category?: MediaCategory) => {
  if (!category) return { icon: "camera-outline", color: "#c4c4c8" };
  const match = allCategories.find((c) => c.apiKey === category);
  return {
    icon: match?.icon ?? "camera-outline",
    color: match?.color ?? "#c4c4c8",
  };
};

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

export default function PhotoViewer() {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%"], []);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const { photos, id } = useLocalSearchParams();
  const photosStr = Array.isArray(photos) ? photos[0] : photos;
  const idStr = Array.isArray(id) ? id[0] : id;

  // Local mutable list — so we can remove deleted items without re-fetching
  const [localPhotos, setLocalPhotos] = useState<GBPMedia[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<GBPMedia | null>(null);

  const parsedPhotos: GBPMedia[] = useMemo(() => {
    return photosStr ? (JSON.parse(photosStr) as GBPMedia[]) : [];
  }, [photosStr]);

  useEffect(() => {
    setLocalPhotos(parsedPhotos);
  }, [photosStr]);

  useEffect(() => {
    if (localPhotos.length > 0 && !selectedPhoto) {
      const initial = localPhotos.find((p) => p.name === idStr);
      setSelectedPhoto(initial || localPhotos[0]);
    }
  }, [localPhotos]);

  const currentIndex = useMemo(() => {
    if (!selectedPhoto) return 0;
    return localPhotos.findIndex((p) => p.name === selectedPhoto.name);
  }, [selectedPhoto, localPhotos]);

  const text = useColor("text");
  const red = useColor("red");
  const primary = useColor("primary");
  const textMuted = useColor("textMuted");
  const link = useColor("link");

  const handleDelete = async () => {
    if (!selectedPhoto?.name) return;
    setIsDeleting(true);
    try {
      await deleteMedia(selectedPhoto.name);

      const newPhotos = localPhotos.filter(
        (p) => p.name !== selectedPhoto.name,
      );
      setLocalPhotos(newPhotos);
      sheetRef.current?.close();

      if (newPhotos.length === 0) {
        // No photos left — go back
        router.back();
      } else {
        // Go to next photo, or previous if we were at the end
        const nextIndex = Math.min(currentIndex, newPhotos.length - 1);
        setSelectedPhoto(newPhotos[nextIndex]);
      }
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1" style={{ backgroundColor: primary }}>
        <SafeAreaView className="flex-1">
          {/* HEADER */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <View className="flex-row items-center">
              <View
                className="flex-row items-center px-4 py-1.5 rounded-full border"
                style={{
                  backgroundColor:
                    getCategoryMeta(
                      selectedPhoto?.locationAssociation?.category,
                    ).color + "20",
                }}
              >
                <Ionicons
                  name={
                    getCategoryMeta(
                      selectedPhoto?.locationAssociation?.category,
                    ).icon as any
                  }
                  size={14}
                  color={
                    getCategoryMeta(
                      selectedPhoto?.locationAssociation?.category,
                    ).color
                  }
                />
                <Text
                  className="font-bold ml-2 text-xs"
                  numberOfLines={1}
                  style={{
                    color: getCategoryMeta(
                      selectedPhoto?.locationAssociation?.category,
                    ).color,
                  }}
                >
                  {selectedPhoto?.locationAssociation?.category}
                </Text>
              </View>
              <Text
                className="ml-4 font-medium text-sm"
                style={{ color: textMuted }}
              >
                {currentIndex + 1} / {localPhotos.length}
              </Text>
            </View>

            <View className="flex-row items-center">
              {/* <TouchableOpacity
                className="p-2.5 rounded-xl mr-3"
                style={{ backgroundColor: textMuted + "20" }}
              >
                <Feather name="download" size={20} color="white" />
              </TouchableOpacity> */}
              <TouchableOpacity
                className="p-2.5 rounded-xl mr-3"
                style={{ backgroundColor: red + "20" }}
                onPress={() => sheetRef.current?.expand()}
              >
                <Ionicons name="trash-outline" size={20} color="#F87171" />
              </TouchableOpacity>
              <TouchableOpacity
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: textMuted + "20" }}
                onPress={() => router.back()}
              >
                <Ionicons name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* MAIN IMAGE */}
          <View className="flex-1 justify-center items-center relative">
            <TouchableOpacity
              className="absolute left-4 z-10 p-3 rounded-full"
              onPress={() =>
                currentIndex > 0 &&
                setSelectedPhoto(localPhotos[currentIndex - 1])
              }
              style={{ backgroundColor: textMuted + "50" }}
            >
              <Ionicons name="chevron-back" size={24} color={text} />
            </TouchableOpacity>

            <View className="rounded-[40px] overflow-hidden shadow-2xl">
              <Image
                source={{ uri: selectedPhoto?.googleUrl }}
                style={{ width: width * 0.85, height: width * 0.7 }}
                resizeMode="cover"
              />
            </View>

            <TouchableOpacity
              className="absolute right-4 z-10 p-3 rounded-full"
              onPress={() =>
                currentIndex < localPhotos.length - 1 &&
                setSelectedPhoto(localPhotos[currentIndex + 1])
              }
              style={{ backgroundColor: textMuted + "50" }}
            >
              <Ionicons name="chevron-forward" size={24} color={text} />
            </TouchableOpacity>
          </View>

          {/* METADATA & THUMBNAILS */}
          <View className="px-6">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                {selectedPhoto?.dimensions?.widthPixels && (
                  <Text
                    className="text-xs font-bold mr-4"
                    style={{ color: textMuted }}
                  >
                    {selectedPhoto.dimensions.widthPixels} ×{" "}
                    {selectedPhoto.dimensions.heightPixels}
                  </Text>
                )}
                {selectedPhoto?.createTime && (
                  <Text
                    className="text-xs font-bold mr-4"
                    style={{ color: textMuted }}
                  >
                    {new Date(selectedPhoto.createTime)
                      .getDate()
                      .toString()
                      .padStart(2, "0")}
                    /
                    {(new Date(selectedPhoto.createTime).getMonth() + 1)
                      .toString()
                      .padStart(2, "0")}
                    /{new Date(selectedPhoto.createTime).getFullYear()}
                  </Text>
                )}
                {!!selectedPhoto?.viewCount && (
                  <View className="flex-row items-center">
                    <Ionicons name="eye-outline" size={14} color={textMuted} />
                    <Text
                      className="text-xs font-bold ml-1"
                      style={{ color: textMuted }}
                    >
                      {selectedPhoto.viewCount} views
                    </Text>
                  </View>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {localPhotos.map((p) => (
                  <TouchableOpacity
                    key={p.name}
                    onPress={() => setSelectedPhoto(p)}
                    className={`ml-2 rounded-xl overflow-hidden border-2 ${
                      p.name === selectedPhoto?.name
                        ? "border-purple-500"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      source={{ uri: p.thumbnailUrl }}
                      style={{ width: 40, height: 40, opacity: 0.6 }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>

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
          <BottomSheetView className="flex-1 z-20">
            <View
              className="flex-1 justify-center items-center px-6"
              style={{ backgroundColor: primary }}
            >
              <View
                className="w-full rounded-3xl p-6 items-center"
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
                    {selectedPhoto?.dimensions?.widthPixels && (
                      <Text
                        className="text-xs font-bold"
                        style={{ color: text }}
                      >
                        {selectedPhoto.dimensions.widthPixels} ×{" "}
                        {selectedPhoto.dimensions.heightPixels}
                      </Text>
                    )}
                    {selectedPhoto?.createTime && (
                      <Text
                        className="text-[10px]"
                        style={{ color: textMuted }}
                      >
                        {new Date(selectedPhoto.createTime)
                          .getDate()
                          .toString()
                          .padStart(2, "0")}
                        /
                        {(new Date(selectedPhoto.createTime).getMonth() + 1)
                          .toString()
                          .padStart(2, "0")}
                        /{new Date(selectedPhoto.createTime).getFullYear()} ·{" "}
                        {selectedPhoto.viewCount ?? 0} views
                      </Text>
                    )}
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
//   Image,
//   TouchableOpacity,
//   SafeAreaView,
//   Dimensions,
//   ScrollView,
// } from "react-native";
// import { Ionicons, Feather } from "@expo/vector-icons";
// import { useColor } from "@/hooks/useColor";
// import { router, useLocalSearchParams } from "expo-router";
// import BottomSheet, {
//   BottomSheetBackdrop,
//   BottomSheetView,
// } from "@gorhom/bottom-sheet";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { getToken } from "@/services/auth.util";
// import { FRONTEND_URL } from "@/config/.env";

// const { width } = Dimensions.get("window");

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

// export default function PhotoViewer() {
//   const sheetRef = useRef<BottomSheet>(null);
//   const snapPoints = useMemo(() => ["45%"], []);

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
//   const { photos, id } = useLocalSearchParams();
//   const photosStr = Array.isArray(photos) ? photos[0] : photos;
//   const idStr = Array.isArray(id) ? id[0] : id;

//   // const parsedPhotos = useMemo(() => {
//   //   return photosStr ? JSON.parse(photosStr) : [];
//   // }, [photosStr]);
//   // const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
//   // selected photo
//   const [selectedPhoto, setSelectedPhoto] = useState<GBPMedia | null>(null);

//   // parsed photos
//   const parsedPhotos: GBPMedia[] = useMemo(() => {
//     return photosStr ? (JSON.parse(photosStr) as GBPMedia[]) : [];
//   }, [photosStr]);

//   // useEffect(() => {
//   //   if (parsedPhotos.length > 0) {
//   //     const initial = parsedPhotos.find((p: any) => p.id === idStr);
//   //     setSelectedPhoto(initial || parsedPhotos[0]);
//   //   }
//   // }, [idStr, photosStr, parsedPhotos]);
//   // Inside your PhotoViewer component
//   const currentIndex = useMemo(() => {
//     if (!selectedPhoto || parsedPhotos.length === 0) return 0;
//     return parsedPhotos.findIndex((p) => p.name === selectedPhoto.name);
//   }, [selectedPhoto, parsedPhotos]);
//   useEffect(() => {
//     if (parsedPhotos.length > 0) {
//       const initial = parsedPhotos.find((p) => p.name === idStr);
//       setSelectedPhoto(initial || parsedPhotos[0]);
//     }
//   }, [idStr, photosStr, parsedPhotos]);

//   const text = useColor("text");
//   const red = useColor("red");
//   const primary = useColor("primary");
//   const textMuted = useColor("textMuted");
//   const link = useColor("link");
//   const primaryForeground = useColor("primaryForeground");

//   return (
//     <GestureHandlerRootView className="flex-1">
//       <View className="flex-1" style={{ backgroundColor: primary }}>
//         <SafeAreaView className="flex-1">
//           <View className="flex-row items-center justify-between px-6 py-4">
//             <View className="flex-row items-center">
//               <View
//                 className="flex-row items-center px-4 py-1.5 rounded-full border"
//                 style={{
//                   backgroundColor:
//                     getCategoryMeta(
//                       selectedPhoto?.locationAssociation?.category,
//                     ).color + "20",
//                 }}
//               >
//                 <Ionicons
//                   name={
//                     (getCategoryMeta(
//                       selectedPhoto?.locationAssociation?.category,
//                     ).icon || "image") as any
//                   }
//                   size={14}
//                   color={
//                     getCategoryMeta(
//                       selectedPhoto?.locationAssociation?.category,
//                     ).color || "#60A5FA"
//                   }
//                 />
//                 <Text
//                   className="font-bold ml-2 text-xs"
//                   numberOfLines={1}
//                   style={{
//                     color: getCategoryMeta(
//                       selectedPhoto?.locationAssociation?.category,
//                     ).color,
//                   }}
//                 >
//                   {selectedPhoto?.locationAssociation?.category}
//                 </Text>
//               </View>
//               <Text
//                 className="ml-4 font-medium text-sm"
//                 style={{ color: textMuted }}
//               >
//                 {currentIndex + 1} / {parsedPhotos.length}
//               </Text>
//             </View>

//             <View className="flex-row items-center">
//               <TouchableOpacity
//                 className="p-2.5 rounded-xl mr-3"
//                 style={{ backgroundColor: textMuted + "20" }}
//               >
//                 <Feather name="download" size={20} color="white" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 className="p-2.5 rounded-xl mr-3"
//                 style={{ backgroundColor: red + "20" }}
//                 onPress={() => sheetRef.current?.expand()}
//               >
//                 <Ionicons name="trash-outline" size={20} color="#F87171" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 className="p-2.5 rounded-xl"
//                 style={{ backgroundColor: textMuted + "20" }}
//                 onPress={() => router.back()}
//               >
//                 <Ionicons name="close" size={22} color="white" />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* --- MAIN IMAGE PREVIEW --- */}
//           <View className="flex-1 justify-center items-center relative">
//             {/* Left Arrow */}
//             <TouchableOpacity
//               className="absolute left-4 z-10 p-3 rounded-full"
//               // onPress={() => {
//               //   if (!selectedPhoto) return;
//               //   const currentIndex = parsedPhotos.findIndex(
//               //     (p) => p.name === selectedPhoto.name,
//               //   );
//               //   if (currentIndex > 0) {
//               //     setSelectedPhoto(parsedPhotos[currentIndex - 1]);
//               //   }
//               // }}
//               onPress={() => {
//                 if (currentIndex > 0) {
//                   setSelectedPhoto(parsedPhotos[currentIndex - 1]);
//                 }
//               }}
//               style={{ backgroundColor: textMuted + "50" }}
//             >
//               <Ionicons name="chevron-back" size={24} color={text} />
//             </TouchableOpacity>

//             <View className="rounded-[40px] overflow-hidden shadow-2xl">
//               <Image
//                 source={{ uri: selectedPhoto?.googleUrl }}
//                 style={{ width: width * 0.85, height: width * 0.7, zIndex: -5 }}
//                 resizeMode="cover"
//               />
//             </View>

//             {/* Right Arrow */}
//             <TouchableOpacity
//               className="absolute right-4 z-1 p-3 rounded-full"
//               // onPress={() => {
//               //   if (!selectedPhoto) return;
//               //   const currentIndex = parsedPhotos.findIndex(
//               //     (p) => p.name === selectedPhoto.name,
//               //   );
//               //   if (currentIndex < parsedPhotos.length - 1) {
//               //     setSelectedPhoto(parsedPhotos[currentIndex + 1]);
//               //   }
//               // }}
//               onPress={() => {
//                 if (currentIndex < parsedPhotos.length - 1) {
//                   setSelectedPhoto(parsedPhotos[currentIndex + 1]);
//                 }
//               }}
//               style={{ backgroundColor: textMuted + "50" }}
//             >
//               <Ionicons name="chevron-forward" size={24} color={text} />
//             </TouchableOpacity>
//           </View>

//           {/* --- BOTTOM METADATA & THUMBNAILS --- */}
//           <View className="px-6">
//             <View className="flex-row items-center justify-between mb-6">
//               <View className="flex-row items-center">
//                 {selectedPhoto?.dimensions?.widthPixels && (
//                   <Text
//                     className="text-xs font-bold mr-4"
//                     style={{ color: textMuted }}
//                   >
//                     {selectedPhoto?.dimensions.widthPixels} X
//                     {selectedPhoto?.dimensions.heightPixels}
//                   </Text>
//                 )}
//                 {selectedPhoto?.createTime && (
//                   <Text
//                     className="text-xs font-bold mr-4"
//                     style={{ color: textMuted }}
//                   >
//                     {new Date(selectedPhoto?.createTime)
//                       .getDate()
//                       .toString()
//                       .padStart(2, "0")}
//                     /
//                     {(new Date(selectedPhoto?.createTime).getMonth() + 1)
//                       .toString()
//                       .padStart(2, "0")}
//                     /{new Date(selectedPhoto?.createTime).getFullYear()}
//                   </Text>
//                 )}
//                 {selectedPhoto?.viewCount !== null ||
//                   (selectedPhoto.viewCount !== 0 && (
//                     <View className="flex-row items-center">
//                       <Ionicons
//                         name="eye-outline"
//                         size={14}
//                         color={textMuted}
//                       />
//                       <Text
//                         className="text-xs font-bold ml-1"
//                         style={{ color: textMuted }}
//                       >
//                         {selectedPhoto?.viewCount} views
//                       </Text>
//                     </View>
//                   ))}
//               </View>

//               {/* Thumbnail Strip */}
//               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                 {parsedPhotos.map((p: GBPMedia) => (
//                   <TouchableOpacity
//                     key={p.name}
//                     onPress={() => setSelectedPhoto(p)}
//                     className={`ml-2 rounded-xl overflow-hidden border-2 ${
//                       p.name === selectedPhoto?.name
//                         ? "border-purple-500"
//                         : "border-transparent"
//                     }`}
//                   >
//                     <Image
//                       source={{ uri: p.thumbnailUrl }}
//                       className="w-10 h-10 opacity-60"
//                     />
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>
//             </View>
//           </View>
//         </SafeAreaView>
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
//           <BottomSheetView className="flex-1 z-20">
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
//                     {selectedPhoto?.dimensions?.widthPixels && (
//                       <Text
//                         className="text-xs font-bold"
//                         style={{ color: text }}
//                       >
//                         {selectedPhoto?.dimensions.widthPixels} X{" "}
//                         {selectedPhoto.dimensions.heightPixels}
//                       </Text>
//                     )}
//                     {selectedPhoto?.createTime && (
//                       <Text
//                         className="text-[10px]"
//                         style={{ color: textMuted }}
//                       >
//                         {new Date(selectedPhoto?.createTime)
//                           .getDate()
//                           .toString()
//                           .padStart(2, "0")}
//                         /
//                         {(new Date(selectedPhoto?.createTime).getMonth() + 1)
//                           .toString()
//                           .padStart(2, "0")}
//                         /{new Date(selectedPhoto?.createTime).getFullYear()} ·{" "}
//                         {selectedPhoto?.viewCount} views
//                       </Text>
//                     )}
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
//                         deleteMedia(selectedPhoto.name);
//                         setSelectedPhoto(parsedPhotos[currentIndex + 1]);
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
