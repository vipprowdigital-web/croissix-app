import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColor } from "@/hooks/useColor";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { FRONTEND_URL } from "@/config/.env";
import { getToken } from "@/services/auth.util";
import * as ImagePicker from "expo-image-picker";
import { useSelector } from "react-redux";
import { RootState } from "@/store";



const categories = [
  {
    label: "Cover Photo",
    dim: "1080 × 608px",
    desc: "Banner shown at top of your profile",
    icon: "star-outline",
    color: "#3B82F6",
    id: "COVER_PHOTO",
  },
  {
    label: "Logo",
    dim: "720 × 720px",
    desc: "Square logo for Knowledge Panel (min 250 × 250px)",
    icon: "shield-outline",
    color: "#8B5CF6",
    id: "LOGO",
  },
  {
    label: "Exterior",
    dim: "720 × 540px",
    desc: "Outside your building & signage",
    icon: "location-outline",
    color: "#06B6D4",
    id: "EXTERIOR",
  },
  {
    label: "Interior",
    dim: "720 × 540px",
    desc: "Inside your business & ambiance",
    icon: "grid-outline",
    color: "#A855F7",
    id: "INTERIOR",
  },
  {
    label: "Product",
    dim: "720 × 720px",
    desc: "Products you sell",
    icon: "cube-outline",
    color: "#0EA5E9",
    id: "PRODUCT",
  },
  {
    label: "At Work",
    dim: "720 × 540px",
    desc: "Your team in action",
    icon: "people-outline",
    color: "#10B981",
    id: "AT_WORK",
  },
];

const photoCategories = [
  ...categories,
  {
    label: "Additional",
    dim: "1080 × 608px",
    desc: "Other photos",
    icon: "camera-outline",
    color: "#c4c4c8",
    id: "ADDITIONAL",
  },
];

const uploadMedia = async (
  asset: ImagePicker.ImagePickerAsset,
  category: string,
  locationId: string,
  accountId: string,
) => {
  const formData = new FormData();

  // React Native FormData accepts this shape directly — no File constructor needed
  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName ?? `photo_${Date.now()}.jpg`,
    type: asset.mimeType ?? "image/jpeg",
  } as any);

  formData.append("category", category.toUpperCase());

  const locationName = `accounts/${accountId}/locations/${locationId}`;
  formData.append("locationName", locationName);

  const res = await fetch(`${FRONTEND_URL}/api/google/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      // Do NOT set Content-Type here — fetch sets it automatically with the correct boundary
    },
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error ?? `Upload failed: ${res.statusText}`);
  }

  return res.json();
};

export default function AddPhotosScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%"], []);
  const [selectedCategory, setSelectedCategory] = useState("Exterior");
  const router = useRouter();

  // Picked assets waiting to be uploaded
  const [pickedAssets, setPickedAssets] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

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

  const textColor = useColor("text");
  const textMuted = useColor("textMuted");
  const linkColor = useColor("link");
  const primaryForeground = useColor("primaryForeground");

  const user = useSelector((state: RootState) => state.auth.user);
  const locationId = user?.googleLocationId ?? "";
  const accountId = user?.googleId ?? "";

  // Step 1 — just pick, don't upload yet
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need access to your photos to upload them.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) return;

    // Append to any already-picked assets
    setPickedAssets((prev) => [...prev, ...result.assets]);
  };

  const removeAsset = (index: number) => {
    setPickedAssets((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 2 — upload all picked images when Upload button is pressed
  const handleUpload = async () => {
    if (pickedAssets.length === 0) {
      Alert.alert("No photos", "Please pick at least one photo first.");
      return;
    }

    setUploading(true);
    setUploadProgress({ done: 0, total: pickedAssets.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pickedAssets.length; i++) {
      try {
        await uploadMedia(
          pickedAssets[i],
          selectedCategory,
          locationId,
          accountId,
        );
        successCount++;
      } catch (err: any) {
        console.error(`Failed to upload image ${i + 1}:`, err);
        failCount++;
      }
      setUploadProgress({ done: i + 1, total: pickedAssets.length });
    }

    setUploading(false);
    setUploadProgress(null);

    if (failCount === 0) {
      Alert.alert(
        "Success 🎉",
        `${successCount} photo(s) uploaded to Google Business Profile!`,
      );
      setPickedAssets([]); // clear after success
    } else {
      Alert.alert(
        "Partial Upload",
        `${successCount} succeeded, ${failCount} failed. Failed photos are still in the list.`,
      );
      // Remove only the successful ones — keep failed for retry
      // (for simplicity here we clear all; add per-image status tracking if needed)
    }
  };

  return (
    <GestureHandlerRootView>
      <View className="flex-1">
        <ScrollView className="flex-1 px-6 pt-5">
          {/* HEADER */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              className="p-2.5 shadow-sm mr-4"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={linkColor} />
            </TouchableOpacity>
            <View>
              <Text
                className="text-2xl font-extrabold"
                style={{ color: textColor }}
              >
                Add Photos
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: linkColor }}
              >
                Google Business Profile ·{" "}
                <Text style={{ color: textMuted }}>Media API</Text>
              </Text>
            </View>
          </View>

          {/* CATEGORY SELECTOR */}
          <View
            className="rounded-2xl p-5 flex-row items-center justify-between border shadow-sm mb-6"
            style={{
              borderColor: linkColor + "30",
              backgroundColor: linkColor + "30",
            }}
          >
            <View>
              <Text
                className="text-sm font-bold uppercase tracking-widest mb-1"
                style={{ color: textMuted }}
              >
                Default Category
              </Text>
              <Text className="text-sm" style={{ color: textMuted }}>
                AI will auto-detect per photo
              </Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center px-4 py-2.5 rounded-2xl border"
              style={{ borderColor: linkColor }}
              onPress={() => sheetRef.current?.expand()}
            >
              <Ionicons name="location-outline" size={16} color={linkColor} />
              <Text
                numberOfLines={1}
                className="font-bold text-sm mx-2"
                style={{ color: linkColor }}
              >
                {selectedCategory}
              </Text>
              <Feather name="chevron-down" size={14} color={linkColor} />
            </TouchableOpacity>
          </View>

          {/* UPLOAD AREA — tap to pick */}
          <TouchableOpacity
            className="rounded-[40px] border-2 border-dashed items-center justify-center py-10 px-10 mb-6"
            style={{ borderColor: linkColor + "80" }}
            onPress={pickImages}
            disabled={uploading}
          >
            <View className="pt-10 rounded-3xl">
              <Feather name="upload" size={32} color={linkColor} />
            </View>
            <Text
              className="text-xl font-extrabold text-center mb-2"
              style={{ color: textColor }}
            >
              Tap to choose photos
            </Text>
            <Text
              className="text-sm text-center mb-8"
              style={{ color: textMuted }}
            >
              or drag & drop · JPG, PNG, WebP · Max 75MB
            </Text>
            {/* <View
              className="flex-row items-center px-5 py-1.5 mb-5 rounded-2xl border"
              style={{
                backgroundColor: linkColor + "20",
                borderColor: linkColor,
              }}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={linkColor}
              />
              <Text
                className="font-bold text-xs mx-2"
                style={{ color: linkColor }}
              >
                AI auto-detects category
              </Text>
              <Ionicons name="sparkles-outline" size={14} color={linkColor} />
            </View> */}
          </TouchableOpacity>

          {/* PICKED IMAGES PREVIEW */}
          {pickedAssets.length > 0 && (
            <View className="mb-6">
              <Text
                className="text-sm font-extrabold uppercase mb-3 mx-1"
                style={{ color: textMuted }}
              >
                Selected · {pickedAssets.length} photo
                {pickedAssets.length > 1 ? "s" : ""}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {pickedAssets.map((asset, index) => (
                  <View key={index} className="relative">
                    <Image
                      source={{ uri: asset.uri }}
                      style={{ width: 90, height: 90, borderRadius: 16 }}
                    />
                    {/* Remove button */}
                    <TouchableOpacity
                      onPress={() => removeAsset(index)}
                      disabled={uploading}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        backgroundColor: "#ef4444",
                        borderRadius: 99,
                        width: 22,
                        height: 22,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="close" size={13} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* UPLOAD BUTTON */}
              <TouchableOpacity
                onPress={handleUpload}
                disabled={uploading}
                className="mt-5 rounded-2xl py-4 items-center justify-center flex-row"
                style={{
                  backgroundColor: uploading ? linkColor + "60" : linkColor,
                }}
              >
                {uploading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-bold text-base ml-3">
                      Uploading {uploadProgress?.done}/{uploadProgress?.total}
                      ...
                    </Text>
                  </>
                ) : (
                  <>
                    <Feather name="upload-cloud" size={18} color="#fff" />
                    <Text className="text-white font-bold text-base ml-2">
                      Upload {pickedAssets.length} photo
                      {pickedAssets.length > 1 ? "s" : ""} to Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* AI PHOTO TIPS */}
          <View
            className="rounded-3xl p-6 shadow-sm mb-10"
            style={{ backgroundColor: linkColor + "20" }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color={linkColor}
                />
                <Text
                  className="text-xs font-black uppercase tracking-widest ml-2"
                  style={{ color: linkColor }}
                >
                  AI Photo Tips
                </Text>
              </View>
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={linkColor}
                className="opacity-40"
              />
            </View>
            <TipRow text="Shoot from street-level approach" />
            <TipRow text="Include daytime + evening shots" />
            <TipRow text="Make signage clearly visible" />
          </View>

          <Text
            className="text-sm mx-2 font-extrabold mb-5 uppercase"
            style={{ color: textMuted }}
          >
            Photo Categories
          </Text>

          {categories.map((item, index) => (
            <View
              key={index}
              className="p-5 mb-4 flex-row items-center shadow-sm"
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: `${item.color}10` }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={item.color}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text
                    numberOfLines={1}
                    className="text-base font-bold mr-2"
                    style={{ color: textColor }}
                  >
                    {item.label}
                  </Text>
                  <View
                    className="px-2 py-0.5 rounded-lg border"
                    style={{ backgroundColor: linkColor + "30" }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: linkColor }}
                    >
                      {item.dim}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-[11px] leading-4"
                  style={{ color: textMuted }}
                >
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}

          <View className="mb-20 mt-5 items-center">
            <Text
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: textMuted }}
            >
              Recommended Formats: JPG, PNG, WebP, MP4
            </Text>
          </View>
        </ScrollView>

        {/* BOTTOM SHEET — category picker */}
        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ backgroundColor: textMuted, width: 40 }}
          backgroundStyle={{
            borderRadius: 40,
            backgroundColor: primaryForeground,
          }}
        >
          <BottomSheetView>
            <Text
              style={{ color: textColor }}
              className="font-bold text-md px-7 mb-5 pt-5"
            >
              Select Category
            </Text>
            <View className="mx-4">
              {photoCategories.map((item, index) => (
                <Pressable
                  key={index}
                  className="py-3 px-5 rounded-2xl mb-2 flex-row items-center shadow-sm border"
                  onPress={() => {
                    setSelectedCategory(item.id);
                    sheetRef.current?.close();
                  }}
                  style={{
                    borderColor:
                      selectedCategory === item.label
                        ? linkColor
                        : "transparent",
                    backgroundColor: primaryForeground,
                  }}
                >
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${item.color}10` }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={item.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-base font-bold mr-2 mb-1"
                      style={{ color: textColor }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      className="text-xs leading-4"
                      style={{ color: textMuted }}
                    >
                      {item.desc}
                    </Text>
                  </View>
                  {selectedCategory === item.label && (
                    <Ionicons
                      name="checkmark-done-outline"
                      size={25}
                      color={linkColor}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const TipRow = ({ text }: any) => {
  const linkColor = useColor("link");
  const textColor = useColor("textMuted");
  return (
    <View className="flex-row items-center mt-4">
      <View
        className="h-1.5 w-1.5 rounded-full mr-3"
        style={{ backgroundColor: textColor }}
      />
      <Text className="text-xs font-medium" style={{ color: textColor }}>
        {text}
      </Text>
    </View>
  );
};

// import React, { useCallback, useMemo, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   Pressable,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useColor } from "@/hooks/useColor";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import BottomSheet, {
//   BottomSheetBackdrop,
//   BottomSheetView,
// } from "@gorhom/bottom-sheet";
// import { useRouter } from "expo-router";
// import { FRONTEND_URL } from "@/config/.env";
// import { getToken } from "@/services/auth.util";
// import * as ImagePicker from "expo-image-picker";
// import { useSelector } from "react-redux";
// import { RootState } from "@/store";

// const categories = [
//   {
//     label: "Cover Photo",
//     dim: "1080 × 608px",
//     desc: "Banner shown at top of your profile",
//     icon: "star-outline",
//     color: "#3B82F6",
//   },
//   {
//     label: "Logo",
//     dim: "720 × 720px",
//     desc: "Square logo for Knowledge Panel (min 250 × 250px)",
//     icon: "shield-outline",
//     color: "#8B5CF6",
//   },
//   {
//     label: "Exterior",
//     dim: "720 × 540px",
//     desc: "Outside your building & signage",
//     icon: "location-outline",
//     color: "#06B6D4",
//   },
//   {
//     label: "Interior",
//     dim: "720 × 540px",
//     desc: "Inside your business & ambiance",
//     icon: "grid-outline",
//     color: "#A855F7",
//   },
//   {
//     label: "Product",
//     dim: "720 × 720px",
//     desc: "Products you sell",
//     icon: "cube-outline",
//     color: "#0EA5E9",
//   },
//   {
//     label: "At Work",
//     dim: "720 × 540px",
//     desc: "Your team in action",
//     icon: "people-outline",
//     color: "#10B981",
//   },
// ];

// const photoCategories = [
//   ...categories,
//   {
//     label: "Additional",
//     dim: "1080 × 608px",
//     desc: "Other photos",
//     icon: "camera-outline",
//     color: "#c4c4c8",
//   },
// ];

// const uploadMedia = async (
//   file: File,
//   category: string,
//   locationId: string,
//   accountId: string,
// ) => {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("category", category);
//   const locationName = `accounts/${accountId}/locations/${locationId}`;
//   formData.append("locationName", locationName);

//   const res = await fetch(`${FRONTEND_URL}/api/google/media`, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${await getToken()}`,
//     },
//     body: formData,
//   });

//   if (!res.ok) {
//     throw new Error(`Upload failed: ${res.statusText}`);
//   }

//   console.log("Response from uploadMedia: ", res);

//   return res.json();
// };

// export default function AddPhotosScreen() {
//   const sheetRef = useRef<BottomSheet>(null);
//   const snapPoints = useMemo(() => ["45%"], []);
//   const [selectedCategory, setSelectedCategory] = useState("Exterior");
//   const router = useRouter();
//   const [images, setImages] = useState<string[]>([]);

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

//   const textColor = useColor("text");
//   const textMuted = useColor("textMuted");
//   const linkColor = useColor("link");
//   const primaryForeground = useColor("primaryForeground");

//   const user = useSelector((state: RootState) => state.auth.user);
//   const locationId = user?.googleLocationId ?? "";
//   const accountId = user?.googleId ?? "";

//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState<{
//     done: number;
//     total: number;
//   } | null>(null);

//   const pickAndUpload = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert(
//         "Permission Denied",
//         "We need access to your photos to upload them.",
//       );
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//       selectionLimit: 10,
//       quality: 0.85,
//       base64: false,
//     });

//     if (result.canceled || result.assets.length === 0) return;

//     setUploading(true);
//     setUploadProgress({ done: 0, total: result.assets.length });

//     let successCount = 0;
//     let failCount = 0;

//     for (let i = 0; i < result.assets.length; i++) {
//       const asset = result.assets[i];
//       try {
//         // Convert URI to a File-like blob for FormData
//         const response = await fetch(asset.uri);
//         const blob = await response.blob();
//         const file = new File([blob], asset.fileName ?? `photo_${i}.jpg`, {
//           type: asset.mimeType ?? "image/jpeg",
//         });

//         await uploadMedia(
//           file,
//           selectedCategory.toUpperCase(),
//           locationId,
//           accountId,
//         );
//         successCount++;
//       } catch (err) {
//         console.error(`Failed to upload image ${i + 1}:`, err);
//         failCount++;
//       }

//       setUploadProgress({ done: i + 1, total: result.assets.length });
//     }

//     setUploading(false);
//     setUploadProgress(null);

//     if (failCount === 0) {
//       Alert.alert("Success", `${successCount} photo(s) uploaded successfully!`);
//     } else {
//       Alert.alert(
//         "Partial Upload",
//         `${successCount} succeeded, ${failCount} failed.`,
//       );
//     }
//   };

//   return (
//     <GestureHandlerRootView>
//       <View className="flex-1">
//         <ScrollView className="flex-1 px-6 pt-5">
//           {/* --- HEADER --- */}
//           <View className="flex-row items-center mb-8">
//             <TouchableOpacity
//               className="p-2.5 shadow-sm mr-4"
//               onPress={() => router.back()}
//             >
//               <Ionicons name="arrow-back" size={20} color={linkColor} />
//             </TouchableOpacity>
//             <View>
//               <Text
//                 className="text-2xl font-extrabold"
//                 style={{ color: textColor }}
//               >
//                 Add Photos
//               </Text>
//               <Text
//                 className="text-sm font-semibold"
//                 style={{ color: linkColor }}
//               >
//                 Google Business Profile ·{" "}
//                 <Text style={{ color: textMuted }}>Media API</Text>
//               </Text>
//             </View>
//           </View>

//           {/* --- DEFAULT CATEGORY CARD --- */}
//           <View
//             className="rounded-2xl p-5 flex-row items-center justify-between border shadow-sm mb-6"
//             style={{
//               borderColor: linkColor + "30",
//               backgroundColor: linkColor + "30",
//             }}
//           >
//             <View className="">
//               <Text
//                 className="text-sm font-bold uppercase tracking-widest mb-1"
//                 style={{ color: textMuted }}
//               >
//                 Default Category
//               </Text>
//               <Text className="text-sm" style={{ color: textMuted }}>
//                 AI will auto-detect per photo
//               </Text>
//             </View>

//             <TouchableOpacity
//               className="flex-row items-center px-4 py-2.5 rounded-2xl border"
//               style={{ borderColor: linkColor }}
//               onPress={() => sheetRef.current?.expand()}
//             >
//               <Ionicons name="location-outline" size={16} color={linkColor} />
//               <Text
//                 numberOfLines={1}
//                 className="font-bold text-sm mx-2"
//                 style={{ color: linkColor }}
//               >
//                 {selectedCategory}
//               </Text>
//               <Feather name="chevron-down" size={14} color={linkColor} />
//             </TouchableOpacity>
//           </View>

//           {/* --- UPLOAD AREA --- */}
//           <TouchableOpacity
//             className="rounded-[40px] border-2 border-dashed items-center justify-center py-16 px-10 mb-6"
//             style={{ borderColor: linkColor + "80" }}
//             onPress={pickAndUpload}
//             disabled={uploading}
//           >
//             {uploading ? (
//               <>
//                 <ActivityIndicator color={linkColor} size="large" />
//                 <Text
//                   className="text-base font-bold mt-4"
//                   style={{ color: textColor }}
//                 >
//                   Uploading {uploadProgress?.done}/{uploadProgress?.total}...
//                 </Text>
//               </>
//             ) : (
//               <>
//                 <View className="pt-10 rounded-3xl">
//                   <Feather name="upload" size={32} color={linkColor} />
//                 </View>

//                 <Text
//                   className="text-xl font-extrabold text-center mb-2"
//                   style={{ color: textColor }}
//                 >
//                   Tap to choose photos
//                 </Text>
//                 <Text
//                   className="text-sm text-center mb-8"
//                   style={{ color: textMuted }}
//                 >
//                   or drag & drop · JPG, PNG, WebP, MP4 · Max 75MB
//                 </Text>

//                 <View
//                   className="flex-row items-center px-5 py-1.5 mb-5 rounded-2xl border"
//                   style={{
//                     backgroundColor: linkColor + "20",
//                     borderColor: linkColor,
//                   }}
//                 >
//                   <MaterialCommunityIcons
//                     name="information-outline"
//                     size={16}
//                     color={linkColor}
//                   />
//                   <Text
//                     className="font-bold text-xs mx-2"
//                     style={{ color: linkColor }}
//                   >
//                     AI auto-detects category
//                   </Text>
//                   <Ionicons
//                     name="sparkles-outline"
//                     size={14}
//                     color={linkColor}
//                   />
//                 </View>
//               </>
//             )}
//           </TouchableOpacity>

//           {/* --- AI PHOTO TIPS --- */}
//           <View
//             className="rounded-3xl p-6 shadow-sm mb-10"
//             style={{ backgroundColor: linkColor + "20" }}
//           >
//             <View className="flex-row items-center justify-between mb-2">
//               <View className="flex-row items-center">
//                 <MaterialCommunityIcons
//                   name="information-outline"
//                   size={18}
//                   color={linkColor}
//                 />
//                 <Text
//                   className="text-xs font-black uppercase tracking-widest ml-2"
//                   style={{ color: linkColor }}
//                 >
//                   AI Photo Tips
//                 </Text>
//               </View>
//               <Ionicons
//                 name="sparkles-outline"
//                 size={16}
//                 color={linkColor}
//                 className="opacity-40"
//               />
//             </View>

//             <TipRow text="Shoot from street-level approach" />
//             <TipRow text="Include daytime + evening shots" />
//             <TipRow text="Make signage clearly visible" />
//           </View>

//           <Text
//             className="text-sm mx-2 font-extrabold mb-5 uppercase"
//             style={{ color: textMuted }}
//           >
//             Photo Categories
//           </Text>

//           {/* Categories List */}
//           {categories.map((item, index) => (
//             <View
//               key={index}
//               className="p-5 mb-4 flex-row items-center shadow-sm"
//             >
//               {/* Icon with soft background */}
//               <View
//                 className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
//                 style={{ backgroundColor: `${item.color}10` }}
//               >
//                 <Ionicons
//                   name={item.icon as any}
//                   size={22}
//                   color={item.color}
//                 />
//               </View>

//               {/* Content */}
//               <View className="flex-1">
//                 <View className="flex-row items-center mb-1">
//                   <Text
//                     numberOfLines={1}
//                     className="text-base font-bold mr-2"
//                     style={{ color: textColor }}
//                   >
//                     {item.label}
//                   </Text>
//                   {/* Dimension Badge */}
//                   <View
//                     className="px-2 py-0.5 rounded-lg border"
//                     style={{ backgroundColor: linkColor + "30" }}
//                   >
//                     <Text
//                       className="text-xs font-bold"
//                       style={{ color: linkColor }}
//                     >
//                       {item.dim}
//                     </Text>
//                   </View>
//                 </View>
//                 <Text
//                   className="text-[11px] leading-4"
//                   style={{ color: textMuted }}
//                 >
//                   {item.desc}
//                 </Text>
//               </View>
//             </View>
//           ))}

//           {/* Info Footer */}
//           <View className="mb-20 mt-5 items-center">
//             <Text
//               className="text-xs font-bold uppercase tracking-widest"
//               style={{ color: textMuted }}
//             >
//               Recommended Formats: JPG, PNG, WebP, MP4
//             </Text>
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
//             backgroundColor: primaryForeground,
//           }}
//         >
//           <BottomSheetView>
//             <Text
//               style={{ color: textColor }}
//               className="font-bold text-md px-7 mb-5 pt-5"
//             >
//               Select Category
//             </Text>
//             <View className="mx-4">
//               {photoCategories.map((item, index) => (
//                 <Pressable
//                   key={index}
//                   className="py-3 px-5 rounded-2xl mb-2 flex-row items-center shadow-sm border"
//                   onPress={() => setSelectedCategory(item.label)}
//                   style={{
//                     borderColor:
//                       selectedCategory === item.label
//                         ? linkColor
//                         : "transparent",
//                     backgroundColor: primaryForeground,
//                   }}
//                 >
//                   {/* Icon with soft background */}
//                   <View
//                     className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
//                     style={{ backgroundColor: `${item.color}10` }}
//                   >
//                     <Ionicons
//                       name={item.icon as any}
//                       size={22}
//                       color={item.color}
//                     />
//                   </View>

//                   {/* Content */}
//                   <View className="flex-1">
//                     <View className="flex-row items-center mb-1">
//                       <Text
//                         numberOfLines={1}
//                         className="text-base font-bold mr-2"
//                         style={{ color: textColor }}
//                       >
//                         {item.label}
//                       </Text>
//                     </View>
//                     <Text
//                       className="text-xs leading-4"
//                       style={{ color: textMuted }}
//                     >
//                       {item.desc}
//                     </Text>
//                   </View>
//                   {selectedCategory === item.label && (
//                     <Ionicons
//                       name="checkmark-done-outline"
//                       size={25}
//                       color={linkColor}
//                     />
//                   )}
//                 </Pressable>
//               ))}
//             </View>
//           </BottomSheetView>
//         </BottomSheet>
//       </View>
//     </GestureHandlerRootView>
//   );
// }

// // Sub-component for Tip Rows
// const TipRow = ({ text }: any) => {
//   const linkColor = useColor("link");
//   const textColor = useColor("textMuted");

//   return (
//     <View className="flex-row items-center mt-4">
//       <View
//         className="h-1.5 w-1.5 rounded-full mr-3"
//         style={{ backgroundColor: textColor }}
//       />
//       <Text className="text-xs font-medium" style={{ color: textColor }}>
//         {text}
//       </Text>
//     </View>
//   );
// };
