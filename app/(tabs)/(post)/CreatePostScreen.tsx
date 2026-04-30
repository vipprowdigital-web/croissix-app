import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  Alert,
  Platform,
  Modal,
  StatusBar,
} from "react-native";
import {
  Zap,
  Calendar,
  ShoppingBag,
  Type,
  Tag,
  Sparkles,
  Brain,
  Wand,
  Info,
  X,
  ChevronDown,
  Eye,
  Send,
  ChevronLeft,
  AlertCircle,
  Trash2,
  RefreshCw,
  Wand2,
  ImageIcon,
  CheckCircle2,
  Plus,
  Link2,
  Phone,
  Clock,
  ChevronRight,
  ChevronUp,
  Upload,
} from "lucide-react-native";

import { GoogleG } from "@/components/ui/icons";
import { useColor } from "@/hooks/useColor";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import SEOSection, { KeywordPanel } from "./SEOSection";
import { FRONTEND_URL } from "@/config/.env";
import { useUser } from "@/services/(user)/user.service";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getToken } from "@/services/auth.util";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useSubscription } from "@/hooks/useSubscription";
import { useFreeTrialStatus } from "@/hooks/useFreeTrialStatus";
import SubscriptionGate from "@/components/SubscriptionGate";

const link = "#9f57f5";
const text = "#fff";
const primaryForeground = "#2a0e45";
const textMuted = "#c4c4c8";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type PostType = "STANDARD" | "EVENT" | "OFFER";
type CTA =
  | "BOOK"
  | "ORDER"
  | "SHOP"
  | "LEARN_MORE"
  | "SIGN_UP"
  | "CALL"
  | "NONE";
type Tone = "Professional" | "Friendly" | "Enthusiastic";
type ImgStyle =
  | "photorealistic"
  | "illustration"
  | "minimalist"
  | "cinematic"
  | "warm";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MAX_CHARS = 1500;
const CTA_OPTIONS: { id: CTA; label: string; icon: React.ReactNode }[] = [
  { id: "NONE", label: "No Button", icon: <X size={15} color={text} /> },
  {
    id: "LEARN_MORE",
    label: "Learn More",
    icon: <Info size={15} color={text} />,
  },
  { id: "BOOK", label: "Book", icon: <Calendar size={15} color={text} /> },
  {
    id: "ORDER",
    label: "Order Online",
    icon: <ShoppingBag size={15} color={text} />,
  },
  { id: "SHOP", label: "Shop", icon: <Tag size={15} color={text} /> },
  { id: "SIGN_UP", label: "Sign Up", icon: <Link2 size={15} color={text} /> },
  { id: "CALL", label: "Call Now", icon: <Phone size={15} color={text} /> },
];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const getDaysInMonth = (y: number, m: number) =>
  new Date(y, m + 1, 0).getDate();
const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
const pad = (n: number) => String(n).padStart(2, "0");
const formatSchedule = (s: ScheduleDate) =>
  `${MONTHS[s.month].slice(0, 3)} ${s.day}, ${s.year} at ${pad(s.hour)}:${pad(s.minute)}`;

interface ScheduleDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}
interface PostPayload {
  payload: Record<string, any>;
  scheduleTime: ScheduleDate | null;
}
interface AIResult {
  content: string;
  seoScore: number;
  tips: string[];
  hashtags: string[];
  suggestedKeywords: string[];
  wordCount: number;
  charCount: number;
}
interface ImageResult {
  imageUrl: string;
  prompt: string;
  provider: string;
  seed: number;
}

const POST_TYPES: {
  id: PostType;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  desc: string;
}[] = [
  {
    id: "STANDARD",
    label: "Update",
    icon: Zap,
    desc: "Share news or updates",
  },
  {
    id: "EVENT",
    label: "Event",
    icon: Calendar,
    desc: "Promote an upcoming event",
  },
  {
    id: "OFFER",
    label: "Offer",
    icon: ShoppingBag,
    desc: "Share a deal or discount",
  },
];

const TONES: { id: Tone; emoji: string; label: string }[] = [
  { id: "Professional", emoji: "🎯", label: "Professional" },
  { id: "Friendly", emoji: "😊", label: "Friendly" },
  { id: "Enthusiastic", emoji: "🚀", label: "Enthusiastic" },
];

const IMG_STYLES: { id: ImgStyle; emoji: string; label: string }[] = [
  { id: "photorealistic", emoji: "📸", label: "Photo" },
  { id: "illustration", emoji: "🎨", label: "Illustration" },
  { id: "minimalist", emoji: "⬜", label: "Minimal" },
  { id: "cinematic", emoji: "🎬", label: "Cinematic" },
  { id: "warm", emoji: "🌅", label: "Warm" },
];

function Skeleton({
  isDark,
  className = "",
}: {
  isDark: boolean;
  className?: string;
}) {
  return (
    <View
      className={`animate-pulse rounded-xl 
        ${isDark ? "bg-white/10" : "bg-slate-100"} 
        ${className}`}
    />
  );
}

function now(): ScheduleDate {
  const d = new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hour: d.getHours(),
    minute: Math.ceil(d.getMinutes() / 15) * 15,
  };
}

// Simple hash to detect when image-relevant inputs changed
function makeImageKey(title: string, postType: string, bizName: string) {
  return `${title.trim().toLowerCase()}|${postType}|${bizName.toLowerCase()}`;
}

/* ══════════════════════════════════════════════════════════
   API FUNCTIONS
══════════════════════════════════════════════════════════ */
async function uploadImage(base64: string): Promise<string> {
  console.log("Inside uploadImage");

  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  const mimeType = base64.includes("data:")
    ? base64.split(";")[0].split(":")[1]
    : "image/jpeg";

  // console.log("mimeType: ", mimeType);

  const form = new FormData();
  form.append("file", {
    uri: base64,
    name: "image.jpg",
    type: mimeType,
  } as any);

  console.log("Sending form...");

  const r = await fetch(`${FRONTEND_URL}/api/upload`, {
    method: "POST",
    body: form,
  });
  console.log("Response from uploadImage: ", r);
  const data = await r.json();
  if (!data.secure_url) throw new Error("Image upload failed");
  return data.secure_url as string;
}

async function callGenerateContent(params: {
  title: string;
  postType: string;
  businessName: string;
  businessCategory: string;
  keywords: string[];
  existingPosts: string[];
  tone: string;
}): Promise<AIResult> {
  const res = await fetch(`${FRONTEND_URL}/api/ai/post-content`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "AI generation failed");
  return json as AIResult;
}

async function callGenerateImage(params: {
  title: string;
  content?: string;
  postType: string;
  businessName: string;
  businessCategory: string;
  style: string;
  seed?: number;
}): Promise<ImageResult> {
  const res = await fetch(`${FRONTEND_URL}/api/ai/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Image generation failed");
  return json as ImageResult;
}

async function publishPost(
  body: PostPayload & { token: string },
): Promise<void> {
  console.log("Inside Publish Post....");
  const { token, ...rest } = body;
  const res = await fetch(`${FRONTEND_URL}/api/google/posts/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rest),
  });
  console.log("Res...", res);
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Post failed");
}

function AIImageCard({
  title,
  postType,
  bizName,
  bizCat,
  imgStyle,
  setImgStyle,
  aiImage,
  setAiImage,
  onImageAccepted,
  disabled,
}: {
  title: string;
  postType: string;
  bizName: string;
  bizCat: string;
  imgStyle: ImgStyle;
  setImgStyle: (s: ImgStyle) => void;
  aiImage: ImageResult | null;
  setAiImage: (r: ImageResult | null) => void;
  onImageAccepted: (dataUrl: string) => void;
  disabled: boolean;
}) {
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const green = useColor("green");

  const [generating, setGenerating] = useState(false);
  const [imgError, setImgError] = useState("");
  const lastKeyRef = useRef("");

  const dark = useSelector((state: RootState) => state.theme.mode) === "dark";

  // The "image key" — only regenerates when these change
  const imageKey = makeImageKey(title, postType, bizName);

  const generate = useCallback(
    async (forceNewSeed = false) => {
      if (!title.trim() || generating || disabled) return;
      setGenerating(true);
      setImgError("");
      try {
        const seed = forceNewSeed
          ? Math.floor(Math.random() * 999999)
          : (aiImage?.seed ?? undefined);
        const result = await callGenerateImage({
          title,
          content: "",
          postType,
          businessName: bizName,
          businessCategory: bizCat,
          style: imgStyle,
          seed,
        });
        setAiImage(result);
        lastKeyRef.current = imageKey;
      } catch (e: any) {
        setImgError(e.message ?? "Image generation failed");
      } finally {
        setGenerating(false);
      }
    },
    [
      title,
      postType,
      bizName,
      bizCat,
      imgStyle,
      generating,
      disabled,
      aiImage?.seed,
      imageKey,
      setAiImage,
    ],
  );

  // Style change → regenerate with same seed (different style, same content)
  const handleStyleChange = (s: ImgStyle) => {
    setImgStyle(s);
  };
  // After style changes, user taps Regenerate → will use new style
  const handleStyleRegen = useCallback(
    async (s: ImgStyle) => {
      if (!title.trim() || generating || disabled) return;
      setGenerating(true);
      setImgError("");
      try {
        const result = await callGenerateImage({
          title,
          content: "",
          postType,
          businessName: bizName,
          businessCategory: bizCat,
          style: s,
          seed: aiImage?.seed,
        });
        setAiImage(result);
      } catch (e: any) {
        setImgError(e.message ?? "Failed");
      } finally {
        setGenerating(false);
      }
    },
    [
      title,
      postType,
      bizName,
      bizCat,
      aiImage?.seed,
      generating,
      disabled,
      setAiImage,
    ],
  );

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get("window");

  useEffect(() => {
    const animatePulse = (val: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };
    animatePulse(pulse1, 0);
    animatePulse(pulse2, 300);

    // shimmer loop
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: width * 2,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [width]);

  return (
    <View
      className="rounded-3xl border shadow-sm p-6 mt-10"
      style={{ backgroundColor: primaryForeground, borderColor: link }}
    >
      {/* Title Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center">
          <View
            className="p-2 rounded-xl mr-3"
            style={{ backgroundColor: link + "30" }}
          >
            <Wand size={18} color={link} />
          </View>
          <Text
            className="text-lg font-black "
            style={{ color: text }}
            numberOfLines={1}
          >
            AI Image
          </Text>
          {aiImage && (
            <Text
              className="border ml-3 px-2 py-0.5 rounded-full text-sm"
              style={{
                color: green,
                backgroundColor: green + "30",
                borderColor: green,
              }}
            >
              Generated
            </Text>
          )}
          {aiImage && (
            <Text
              className="px-2 py-0.5 ml-1 font-bold text-sm"
              style={{
                color: textMuted,
              }}
            >
              via {aiImage.provider}
            </Text>
          )}
        </View>
      </View>

      {/* Tone Selection */}
      <Text
        className="uppercase font-bold text-sm pb-3"
        style={{ color: textMuted }}
      >
        Image Style
      </Text>
      <View className="mb-5 flex-row flex-wrap gap-2">
        {IMG_STYLES.map((s) => (
          <View key={s.id} className="w-[30%]">
            <TonePill
              label={s.label}
              emoji={s.emoji}
              active={imgStyle === s.id}
              onPress={() => handleStyleChange(s.id)}
            />
          </View>
        ))}
      </View>

      {generating ? (
        <View
          className={`w-full rounded-2xl overflow-hidden relative`}
          style={{ aspectRatio: 16 / 9, backgroundColor: textMuted + "30" }}
        >
          {/* Center content */}
          <View className="absolute inset-0 flex-col items-center justify-center gap-3">
            {/* Pulsing orb */}
            <View
              className="relative items-center justify-center"
              style={{ width: 52, height: 52 }}
            >
              {[pulse1, pulse2].map((anim, i) => (
                <Animated.View
                  key={i}
                  className="absolute inset-0 rounded-full border border-purple-500/40"
                  style={{
                    transform: [
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.7],
                        }),
                      },
                    ],
                    opacity: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 0],
                    }),
                  }}
                />
              ))}
              <View
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#7c3aed",
                  shadowColor: "#a855f7",
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                }}
              >
                <Wand2 size={20} color="white" />
              </View>
            </View>

            {/* Bouncing dots */}
            <View className="flex-row gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400"
                  style={{
                    transform: [
                      {
                        translateY: pulse1.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, -5, 0],
                        }),
                      },
                    ],
                  }}
                />
              ))}
            </View>

            <Text
              className={`text-sm font-semibold ${
                dark ? "text-purple-300" : "text-purple-600"
              }`}
            >
              Generating image…
            </Text>
            <Text className={`text-xs`} style={{ color: textMuted }}>
              Using FLUX AI model
            </Text>
          </View>

          {/* Shimmer overlay */}
          <Animated.View
            className="absolute inset-0"
            style={{
              transform: [{ translateX: shimmerAnim }],
            }}
          >
            <LinearGradient
              colors={[
                "transparent",
                dark ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.04)",
                "transparent",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
      ) : aiImage ? (
        <View
          className="relative rounded-2xl overflow-hidden"
          style={{ aspectRatio: 16 / 9 }}
        >
          <Image
            source={{ uri: aiImage.imageUrl }}
            className="w-full h-full object-cover"
            style={{ width: "100%", height: "100%" }}
          />
          <View className="absolute inset-0 bg-black/30 flex-row items-center justify-center gap-3 opacity-0">
            <TouchableOpacity
              onPress={() => onImageAccepted(aiImage.imageUrl)}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-2xl"
              style={{
                backgroundColor: "rgba(34,197,94,0.9)",
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <CheckCircle2 size={12} color="white" />
              <Text className="text-white text-[11px] font-black">
                Use Image
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom bar */}
          <View
            className="absolute bottom-0 left-0 right-0 px-3 py-2 flex-row items-center gap-2"
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
            }}
          >
            <Text
              className="text-white text-[10px] font-medium flex-1 opacity-70"
              numberOfLines={1}
            >
              {aiImage.prompt.slice(0, 60)}…
            </Text>
            <TouchableOpacity
              onPress={() => generate(true)}
              disabled={generating}
              className="flex-row items-center gap-1 px-2 py-1 rounded-xl"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            >
              <RefreshCw size={12} color="white" />
              <Text className="text-white text-[10px] font-black">New</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Pressable
          className="h-[150px] w-full p-4 rounded-2xl border border-dashed flex justify-center items-center flex-col disabled:opacity-40"
          style={{
            borderColor: link,
            backgroundColor: link + "60",
          }}
          onPress={() => generate(true)}
          disabled={!title.trim() || generating || disabled}
        >
          <View
            style={{ backgroundColor: primary + "30" }}
            className="flex justify-center items-center rounded-xl p-2 mb-2"
          >
            <Wand size={35} color={link} />
          </View>
          <Text style={{ color: textMuted }}>Generate AI Image</Text>
          <Text style={{ color: textMuted }}>
            {title.trim() ? "FLUX AI · Free · 1200×675" : "Enter a title first"}
          </Text>
        </Pressable>
      )}

      {imgError && (
        <View
          className={`flex-row items-start gap-2 px-3 py-2.5 rounded-xl border
      ${dark ? "bg-red-500/10 border-red-900/40" : "bg-red-50 border-red-200/60"}`}
        >
          <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
          <View className="flex-1 min-w-0">
            <Text
              className={`text-[10.5px] ${dark ? "text-red-400" : "text-red-600"}`}
            >
              {imgError}
            </Text>
            <Text
              className={`text-[9.5px] mt-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}
            >
              Add <Text className="font-mono">TOGETHER_API_KEY</Text> to .env
              for reliable generation.
            </Text>
          </View>
        </View>
      )}

      {/* ACTION BUTTONS */}
      {aiImage && !generating && (
        <View className="py-3 flex flex-row justify-center items-center gap-2">
          <Pressable
            className="flex-1 flex-row justify-center items-center gap-1.5 rounded-lg"
            style={{ backgroundColor: link }}
            onPress={() => onImageAccepted(aiImage.imageUrl)}
            disabled={generating}
          >
            <CheckCircle2 size={13} color="white" />
            <Text className="text-white  py-2 text-sm text-center">
              Add to Post
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row justify-center items-center gap-1.5 rounded-lg border"
            style={{ borderColor: link }}
            disabled={generating}
            onPress={() => handleStyleRegen(imgStyle)}
          >
            <RefreshCw size={12} color={link} />
            <Text
              className="text-white  py-2 text-sm text-center"
              style={{ color: link }}
            >
              Regen Style
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row justify-center items-center gap-1.5 rounded-lg border"
            style={{
              borderColor: textMuted,
              backgroundColor: textMuted + "30",
            }}
            onPress={() => generate(true)}
            disabled={generating}
          >
            <RefreshCw size={12} color={textMuted} />
            <Text
              className="py-2 text-sm text-center"
              style={{ color: textMuted }}
            >
              New seed
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ImageUpload({
  images,
  onChange,
  disabled,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  disabled?: boolean;
}) {
  const pickImage = async () => {
    if (disabled) return;

    // Request permissions
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
      selectionLimit: 10 - images.length,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      onChange([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <View className={`${disabled ? "opacity-50" : ""} w-full`}>
      {images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row pb-2"
        >
          {images.map((uri, i) => (
            <View
              key={i}
              className="relative mr-2 w-20 h-20 rounded-2xl overflow-hidden bg-gray-600"
            >
              <Image
                source={{ uri }}
                className="w-full h-full object-cover"
                style={{ width: "100%", height: "100%" }}
              />

              <TouchableOpacity
                onPress={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full items-center justify-center"
              >
                <X size={12} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < 10 && (
            <TouchableOpacity
              onPress={pickImage}
              className={`w-20 h-20 rounded-2xl border-2 border-dashed items-center justify-center`}
              style={{
                borderColor: textMuted + "80",
                backgroundColor: textMuted + "30",
              }}
            >
              <Plus size={24} color={textMuted} />
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.7}
          className={`w-full h-[150px] rounded-2xl border border-dashed flex-col items-center justify-center`}
          style={{ backgroundColor: link + "30", borderColor: link }}
        >
          <ImageIcon size={25} color={textMuted} />
          <Text
            className={`text-sm font-bold mt-2 `}
            style={{ color: textMuted }}
          >
            Upload from device
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CalendarPicker({
  value,
  onChange,
  onClose,
}: {
  value: ScheduleDate;
  onChange: (d: ScheduleDate) => void;
  onClose: () => void;
}) {
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const green = useColor("green");
  const isDark = useSelector((state: RootState) => state.theme.mode) === "dark";
  const [view, setView] = useState({ year: value.year, month: value.month });
  const today = new Date();

  const days = getDaysInMonth(view.year, view.month);
  const first = getFirstDay(view.year, view.month);
  const cells: (number | null)[] = Array(first)
    .fill(null)
    .concat(Array.from({ length: days }, (_, i) => i + 1));

  const isToday = (d: number) =>
    d === today.getDate() &&
    view.month === today.getMonth() &&
    view.year === today.getFullYear();

  const isSelected = (d: number) =>
    d === value.day && view.month === value.month && view.year === value.year;

  // ✅ After — compares two Dates, returns a proper boolean
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const isPast = (d: number) =>
    new Date(view.year, view.month, d) < todayMidnight;
  // const isPast = (d: number) => new Date(view.year, view.month, d);
  // new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const prev = () =>
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    );

  const next = () =>
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    );

  // Split cells into rows of 7
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  // ── Time picker state ──────────────────────────────────────────────────────
  const [hour, setHour] = useState(value.hour ?? 12);
  const [minute, setMinute] = useState(value.minute ?? 0);
  const [isPM, setIsPM] = useState((value.hour ?? 12) >= 12);
  // ── Time helpers ───────────────────────────────────────────────────────────
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  const adjustHour = (delta: number) => {
    const next12 = ((displayHour - 1 + delta + 12) % 12) + 1; // stays 1–12
    const next24 = isPM
      ? next12 === 12
        ? 12
        : next12 + 12
      : next12 === 12
        ? 0
        : next12;
    setHour(next24);
  };

  const adjustMinute = (delta: number) => {
    setMinute((m) => (m + delta + 60) % 60);
  };

  const toggleAmPm = () => {
    setIsPM((prev) => {
      const next = !prev;
      setHour((h) => {
        const h12 = h % 12;
        return next ? (h12 === 0 ? 12 : h12 + 12) : h12;
      });
      return next;
    });
  };

  const handleConfirm = () => {
    onChange({
      ...value,
      day: value.day,
      month: view.month,
      year: view.year,
      hour,
      minute,
    });
    onClose();
  };

  return (
    <View
      className={`rounded-2xl overflow-hidden border mt-5`}
      style={{ backgroundColor: primary, borderColor: link }}
    >
      {/* ── Header ── */}
      <View
        className={`flex-row items-center justify-between px-4 py-3 border-b`}
        style={{ borderColor: link + "30" }}
      >
        <TouchableOpacity
          onPress={prev}
          className="w-7 h-7 items-center justify-center rounded-lg"
        >
          <ChevronLeft size={18} color={link} />
        </TouchableOpacity>

        <Text className={`text-md font-bold`} style={{ color: text }}>
          {MONTHS[view.month]} {view.year}
        </Text>

        <TouchableOpacity
          onPress={next}
          className="w-7 h-7 items-center justify-center rounded-lg"
        >
          <ChevronRight size={18} color={link} />
        </TouchableOpacity>
      </View>

      {/* ── Calendar Body ── */}
      <View className="p-3">
        {/* Day Labels */}
        <View className="flex-row mb-1">
          {DAYS.map((d) => (
            <View key={d} className="flex-1 items-center py-1">
              <Text className={`text-sm font-bold`} style={{ color: text }}>
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* Date Rows */}
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row mb-0.5">
            {row.map((d, colIndex) => (
              <View key={colIndex} className="flex-1 items-center">
                {d === null ? (
                  <View className="w-9 h-9" />
                ) : (
                  <TouchableOpacity
                    disabled={isPast(d)}
                    onPress={() =>
                      onChange({
                        ...value,
                        day: d,
                        month: view.month,
                        year: view.year,
                      })
                    }
                    className={`w-9 h-9 items-center justify-center rounded-xl
                      ${
                        isSelected(d)
                          ? "bg-purple-500"
                          : isToday(d)
                            ? isDark
                              ? "bg-gray-500/20"
                              : "bg-blue-50"
                            : "bg-transparent"
                      }
                          ${isPast(d) ? "opacity-50" : "opacity-100"}
                    `}
                  >
                    <Text
                      className={`text-sm font-medium
                        ${
                          isSelected(d)
                            ? "text-white"
                            : isToday(d)
                              ? isDark
                                ? "text-white"
                                : "text-blue-600"
                              : isDark
                                ? "text-slate-300"
                                : "text-slate-700"
                        }
                      `}
                      style={{
                        color: isToday(d) && !isSelected(d) ? link : textMuted,
                      }}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* ── Time Picker ──────────────────────────────────────────────────── */}
      <View
        className="mx-3 mb-3 rounded-xl overflow-hidden border"
        style={{ borderColor: link + "30" }}
      >
        {/* Label row */}
        <View
          className="px-4 py-2 border-b"
          style={{ borderColor: link + "20", backgroundColor: link + "10" }}
        >
          <Text
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            Time
          </Text>
        </View>

        <View className="flex-row items-center justify-center gap-3 py-3 px-4">
          {/* ── Hour ── */}
          <View className="items-center gap-1">
            <TouchableOpacity
              onPress={() => adjustHour(1)}
              className="w-8 h-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: link + "20" }}
            >
              <ChevronUp size={16} color={link} />
            </TouchableOpacity>

            <Text
              className="text-2xl font-bold w-12 text-center"
              style={{ color: text }}
            >
              {String(displayHour).padStart(2, "0")}
            </Text>

            <TouchableOpacity
              onPress={() => adjustHour(-1)}
              className="w-8 h-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: link + "20" }}
            >
              <ChevronDown size={16} color={link} />
            </TouchableOpacity>
          </View>

          {/* Colon separator */}
          <Text
            className="text-2xl font-bold mb-0.5"
            style={{ color: textMuted }}
          >
            :
          </Text>

          {/* ── Minute ── */}
          <View className="items-center gap-1">
            <TouchableOpacity
              onPress={() => adjustMinute(1)}
              className="w-8 h-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: link + "20" }}
            >
              <ChevronUp size={16} color={link} />
            </TouchableOpacity>

            <Text
              className="text-2xl font-bold w-12 text-center"
              style={{ color: text }}
            >
              {String(minute).padStart(2, "0")}
            </Text>

            <TouchableOpacity
              onPress={() => adjustMinute(-1)}
              className="w-8 h-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: link + "20" }}
            >
              <ChevronDown size={16} color={link} />
            </TouchableOpacity>
          </View>

          {/* ── AM / PM toggle ── */}
          <View
            className="rounded-xl overflow-hidden ml-1"
            style={{ backgroundColor: link + "15" }}
          >
            <TouchableOpacity
              onPress={() => !isPM && toggleAmPm()}
              className={`px-3 py-2 items-center justify-center`}
              style={{ backgroundColor: !isPM ? link : "transparent" }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: !isPM ? "#fff" : textMuted }}
              >
                AM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => isPM && toggleAmPm()}
              className={`px-3 py-2 items-center justify-center`}
              style={{ backgroundColor: isPM ? link : "transparent" }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: isPM ? "#fff" : textMuted }}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Footer Buttons ── */}
      <View className="flex-row px-4 pb-3 pt-1 gap-2">
        <TouchableOpacity
          onPress={onClose}
          className={`flex-1 h-10 rounded-xl items-center justify-center`}
          style={{ backgroundColor: textMuted + "30" }}
        >
          <Text className={`text-sm font-semibold`} style={{ color: text }}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          className="flex-1 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: link }}
        >
          <Text className="text-sm font-bold text-white">Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PreviewModal({
  text,
  images,
  cta,
  schedule,
  onClose,
}: {
  text: string;
  images: string[];
  cta: CTA;
  schedule: ScheduleDate | null;
  onClose: () => void;
}) {
  const isDark = useSelector((state: RootState) => state.theme.mode);
  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="transparent" translucent />

      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <View
        className="flex-1 items-center justify-end px-4"
        style={{
          backgroundColor: "rgba(0,0,0,0.65)",
          paddingBottom: Platform.OS === "ios" ? 50 : 50,
        }}
      >
        {/* Blur sits absolutely behind everything */}
        {/* <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          className="absolute inset-0"
        /> */}

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <View
          className={`w-full max-w-sm rounded-3xl overflow-hidden ${
            isDark ? "bg-[#131c2d]" : "bg-white"
          }`}
          style={Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
            },
            android: { elevation: 12 },
          })}
        >
          {/* ── Body padding ────────────────────────────────────────────── */}
          <View className="p-4">
            {/* ── Header ──────────────────────────────────────────────── */}
            <View className="flex-row items-center gap-2.5 mb-3">
              <View
                className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center"
                style={{ backgroundColor: link }}
              >
                <Text className="text-white text-xs font-bold">B</Text>
              </View>

              <View className="flex-1">
                <Text
                  className={`text-md font-bold ${isDark ? "text-white" : "text-black"}`}
                  // style={{ color: text }}
                >
                  Your Business
                </Text>
                <Text className={`text-sm`} style={{ color: textMuted }}>
                  Google Business ·{" "}
                  {schedule ? formatSchedule(schedule) : "Now"}
                </Text>
              </View>
            </View>

            {/* ── Body Text ───────────────────────────────────────────── */}
            <ScrollView
              className={`${!text ? "max-h-20" : "max-h-80"} mb-3`}
              showsVerticalScrollIndicator={false}
            >
              {/* ── Image ───────────────────────────────────────────────── */}
              <View
                style={{ aspectRatio: 3 / 2 }}
                className="flex-1 justify-center items-center rounded-3xl mb-3"
              >
                {images.length > 0 && (
                  <Image
                    source={{ uri: images[0] }}
                    className="w-full h-full rounded-2xl object-cover"
                    // resizeMode="cover"
                    style={{ width: "100%", height: "100%" }}
                  />
                )}
              </View>
              <Text
                className={`text-md leading-relaxed ${
                  text
                    ? isDark
                      ? "text-slate-300"
                      : "text-slate-700"
                    : isDark
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {text || "Your post content will appear here…"}
              </Text>
            </ScrollView>

            {/* ── CTA Chip ────────────────────────────────────────────── */}
            {cta !== null && (
              <View
                className={`self-start flex-row items-center gap-2 h-8 px-3 rounded-3xl`}
                style={{ backgroundColor: link + "40" }}
              >
                <Text className="text-sm" style={{ color: link }}>
                  {CTA_OPTIONS.find((c) => c.id === cta)?.icon}
                </Text>
                <Text
                  className={`text-[12px] font-semibold `}
                  style={{ color: isDark ? "white" : text }}
                >
                  {CTA_OPTIONS.find((c) => c.id === cta)?.label}
                </Text>
              </View>
            )}
          </View>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <View
            className={`px-4 pb-4 pt-2 border-t ${
              isDark ? "border-white/[0.06]" : "border-slate-100"
            }`}
          >
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.75}
              className={`h-10 rounded-2xl items-center justify-center ${
                isDark ? "bg-white/[0.07]" : "bg-slate-100"
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Close Preview
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CreatePostScreen = () => {
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const red = useColor("red");
  const orange = useColor("orange");
  const green = useColor("green");
  const router = useRouter();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const { data: user, isLoading: userLoading } = useUser();
  const businessName = user?.googleLocationName ?? "";
  const businessCategory = user?.businessCategory ?? "";
  // const { subscription, isLoading: loading, isActive } = useSubscription();

  // ---- FormState ----
  const [textT, setTextT] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [postTitle, setPostTitle] = useState("");
  const [postType, setPostType] = useState<PostType>("STANDARD");
  // const [selectedType, setSelectedType] = useState("update");
  const [tone, setTone] = useState("professional");
  const [cta, setCta] = useState<CTA>("LEARN_MORE");
  const [ctaUrl, setCtaUrl] = useState("");
  const [schedule, setSchedule] = useState<ScheduleDate | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [calDraft, setCalDraft] = useState<ScheduleDate>(now());
  const [showPreview, setShowPreview] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [showCtaUrl, setShowCtaUrl] = useState(false);
  const [validErr, setValidErr] = useState("");

  /* ── AI text state ── */
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [extraKeywords, setExtraKeywords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [duplicateOpener, setDuplicateOpener] = useState("");

  /* ── AI image state ── */
  const [imgStyle, setImgStyle] = useState<ImgStyle>("photorealistic");
  const [aiImage, setAiImage] = useState<ImageResult | null>(null);

  /* ── upload progress ── */
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const submittingRef = useRef(false);

  const charCount = textT.length;
  const remaining = MAX_CHARS - charCount;
  const overLimit = remaining < 0;

  /* ── recent posts (for duplicate detection) ── */
  const { data: recentPostsData } = useQuery({
    queryKey: ["recent-posts", user?.googleLocationId],
    queryFn: async () => {
      if (!user?.googleLocationId) return { posts: [] };
      const token = await getToken();
      const res = await fetch(
        `${FRONTEND_URL}/api/google/posts?location=accounts/me/locations/${user.googleLocationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.json();
    },
    enabled: !!user?.googleLocationId,
    staleTime: 5 * 60_000,
  });
  const recentPosts: string[] = (recentPostsData?.posts ?? [])
    .slice(0, 10)
    .map((p: any) => p.summary ?? "")
    .filter(Boolean);

  // Generate Text
  const generateText = useCallback(async () => {
    if (!postTitle.trim() || isGenerating) return;
    setIsGenerating(true);
    setAiError("");
    setDuplicateOpener("");
    try {
      const result = await callGenerateContent({
        title: postTitle,
        postType,
        businessName: user?.googleLocationName ?? "our business",
        businessCategory: user?.businessCategory ?? "",
        keywords: extraKeywords,
        existingPosts: recentPosts,
        tone,
      });
      // typewriter
      const final = result.content;
      let i = 0;
      setTextT("");
      const interval = setInterval(() => {
        i++;
        setTextT(final.slice(0, i));
        if (i >= final.length) {
          clearInterval(interval);
          setAiResult(result);
          setIsGenerating(false);
          const newOpening = final
            .split(/\s+/)
            .slice(0, 5)
            .join(" ")
            .toLowerCase();
          const matched = recentPosts.find(
            (p) =>
              p.split(/\s+/).slice(0, 5).join(" ").toLowerCase() === newOpening,
          );
          if (matched)
            setDuplicateOpener(final.split(/\s+/).slice(0, 5).join(" "));
        }
      }, 16);
    } catch (e: any) {
      setAiError(e.message ?? "AI generation failed");
      setIsGenerating(false);
    }
  }, [
    postTitle,
    postType,
    tone,
    user,
    extraKeywords,
    recentPosts,
    isGenerating,
  ]);

  const generateBoth = useCallback(async () => {
    if (!postTitle.trim() || isGenerating) return;
    // Fire text (handles its own state) and image in parallel
    generateText(); // starts typewriter, manages isGenerating
    // Image: fire independently — doesn't block text
    try {
      const imgResult = await callGenerateImage({
        title: postTitle,
        content: textT,
        postType,
        businessName: user?.googleLocationName ?? "",
        businessCategory: user?.businessCategory ?? "",
        style: imgStyle,
      });
      setAiImage(imgResult);
    } catch {
      // image failure is non-fatal — AIImageCard shows its own error if user retries
    }
  }, [postTitle, postType, user, imgStyle, generateText, isGenerating, textT]);

  /* ── keyword helpers ── */
  const addKeyword = (kw: string) => {
    if (!extraKeywords.includes(kw)) setExtraKeywords((p) => [...p, kw]);
  };
  const removeKeyword = (kw: string) =>
    setExtraKeywords((p) => p.filter((k) => k !== kw));

  const allKeywords = [
    ...(user?.googleLocationName ?? "").split(/\s+/),
    postTitle,
    ...(aiResult?.hashtags?.map((h) => h.replace("#", "")) ?? []),
    ...extraKeywords,
  ]
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length > 3);
  const embeddedKeywords = [
    ...new Set(allKeywords.filter((k) => text.toLowerCase().includes(k))),
  ].slice(0, 8);

  // Style change → regenerate with same seed (different style, same content)
  const handleStyleChange = (s: ImgStyle) => {
    setImgStyle(s);
  };

  /* ── mutations ── */
  const postMutation = useMutation({
    mutationFn: publishPost,
    onSuccess: () => {
      submittingRef.current = false;
      alert("✅ Post created successfully!");
      router.push("/");
    },
    onError: (e) => {
      console.log("Error while publishing post....");
      console.log("Error:", e);

      submittingRef.current = false;
    },
  });

  const uploadPhase =
    postMutation.isPending &&
    uploadProgress.total > 0 &&
    uploadProgress.current < uploadProgress.total;

  /* ── validation ── */
  const validate = (): boolean => {
    if (!postTitle.trim()) {
      setValidErr("Post title is required.");
      return false;
    }
    if (!text.trim()) {
      setValidErr("Post content is required.");
      return false;
    }
    if (text.length > MAX_CHARS) {
      setValidErr(`Content exceeds ${MAX_CHARS} chars.`);
      return false;
    }
    if (postType === "EVENT" && !eventTitle.trim()) {
      setValidErr("Event title is required.");
      return false;
    }
    if (postType === "OFFER" && !offerTitle.trim()) {
      setValidErr("Offer title is required.");
      return false;
    }
    if (cta !== "NONE" && cta !== "CALL" && showCtaUrl && !ctaUrl.trim()) {
      setValidErr("CTA URL is required.");
      return false;
    }
    return true;
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    // console.log("Inside Handle Submit");

    setValidErr("");
    if (submittingRef.current || postMutation.isPending) return;
    // console.log("After submittingRef.current");
    if (!validate()) return;
    // console.log("After validate()");
    const token = await getToken();
    if (!token) {
      // console.log("Not Authenticated");
      setValidErr("Not authenticated.");
      return;
    }
    submittingRef.current = true;
    // console.log("submittingRed.current: ", submittingRef);

    const payload: Record<string, any> = {
      languageCode: "en-US",
      summary: textT,
      topicType: postType,
    };
    // console.log("Payload: ", payload);
    if (cta !== "NONE") {
      payload.callToAction = { actionType: cta };
      if (cta !== "CALL" && ctaUrl) payload.callToAction.url = ctaUrl;
    }
    // console.log("CTA: ", cta);

    let uploadedUrls: string[] = [];
    if (images.length) {
      setUploadProgress({ current: 0, total: images.length });

      try {
        for (let idx = 0; idx < images.length; idx++) {
          // console.log("Uploading image: ", idx + 1);
          // console.log("images[idx]: ", images[idx]);

          uploadedUrls.push(await uploadImage(images[idx]));
          // console.log(
          //   "Uploaded..",
          //   idx + 1,
          //   " image progress: ",
          //   uploadProgress,
          // );
          setUploadProgress({ current: idx + 1, total: images.length });
        }
        // console.log("Images uploaded successfully.....");
      } catch (e: any) {
        setValidErr(e.message ?? "Image upload failed.");
        // console.log("e: ", e, " e.message: ", e.message);
        // console.log("Images upload failed...");
        submittingRef.current = false;
        setUploadProgress({ current: 0, total: 0 });
        return;
      }
    }
    if (uploadedUrls.length)
      payload.media = uploadedUrls.map((url) => ({
        mediaFormat: "PHOTO",
        sourceUrl: url,
      }));
    if (postType === "EVENT") payload.event = { title: eventTitle };
    if (postType === "OFFER") {
      payload.offer = {
        couponCode,
        redeemOnlineUrl: ctaUrl,
        termsConditions: "",
      };
      payload.event = { title: offerTitle };
    }
    // console.log("Payload....\n\n", payload);

    postMutation.mutate({ payload, scheduleTime: schedule, token });
  };

  const isSubmitting = postMutation.isPending;
  const displayError = validErr || (postMutation.error?.message ?? "");

  const { isActive, isLoading: loading, isExpired } = useSubscription();
  const { trialExpired } = useFreeTrialStatus();

  useEffect(() => {
    if (loading) return;
  }, [isActive, isExpired, trialExpired, loading]);
  if (!isActive) return <SubscriptionGate />;

  return (
    <ScrollView className="flex-1 px-7" style={{ backgroundColor: primary }}>
      {/* Header Section */}
      <View className="flex-row justify-center items-center mb-10 mt-4">
        <View className="flex-2">
          <Pressable
            className="p-3 rounded-full"
            style={{ backgroundColor: textMuted + "30" }}
            onPress={() => router.back()}
          >
            <ChevronLeft size={20} color={text} />
          </Pressable>
        </View>
        <View className="flex-1 justify-center ml-2">
          <View className="flex flex-row gap-1 items-center px-2">
            <GoogleG />
            <Text className="text-2xl font-black" style={{ color: text }}>
              Create Post
            </Text>
          </View>
          {businessName && (
            <Text
              className="text-sm font-bold px-2"
              style={{ color: textMuted }}
            >
              {businessName}
            </Text>
          )}
        </View>
      </View>

      {/* Post Type Selection */}
      <View className="flex-row justify-between mb-8">
        {POST_TYPES.map((type) => (
          <PostTypeCard
            key={type.id}
            label={type.label}
            desc={type.desc}
            Icon={type.icon}
            active={postType === type.id}
            onPress={() => setPostType(type.id)}
          />
        ))}
      </View>

      {/* Step 1 */}
      {/* Main Content Area */}
      <View className="rounded-3xl border p-6" style={{ borderColor: link }}>
        {/* Title Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <View
              className="p-2 rounded-xl mr-3"
              style={{ backgroundColor: link + "30" }}
            >
              <Type size={18} color={link} />
            </View>
            <Text className="text-lg font-black " style={{ color: text }}>
              Post Title
            </Text>
          </View>
          <Text
            className="text-sm font-black uppercase tracking-widest"
            style={{ color: textMuted }}
          >
            Step 1 of 2
          </Text>
        </View>

        {/* Input Field */}
        <View
          className="border rounded-2xl flex-row items-center px-5 py-3 mb-6"
          style={{ backgroundColor: link + "60", borderColor: link }}
        >
          <Tag size={18} color={text} />
          <TextInput
            value={postTitle}
            onChangeText={(text) => {
              setPostTitle(text);
              setAiError("");
            }}
            style={{ color: text }}
            className="flex-1 ml-3 font-medium"
            placeholder="e.g. Summer Sale 50% Off - New Menu"
            placeholderTextColor={textMuted}
            returnKeyType="done"
            cursorColor={link}
            onSubmitEditing={() => {
              if (postTitle.trim()) {
                generateBoth();
              }
            }}
          />
          {postTitle.length > 0 && !isSubmitting && (
            <TouchableOpacity
              onPress={() => {
                setPostTitle("");
                setAiResult(null);
                setTextT("");
                setAiImage(null);
              }}
              style={{ flexShrink: 0 }}
            >
              <X size={18} color={textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tone Selection */}
        <View className="flex-row justify-between mb-8 gap-1.5">
          {TONES.map((t) => (
            <View className="flex-1" key={t.id}>
              <TonePill
                label={t.label}
                emoji={t.emoji}
                active={tone === t.id}
                onPress={() => setTone(t.id)}
              />
            </View>
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-5 rounded-3xl"
          disabled={!postTitle.trim() || isGenerating || isSubmitting}
          onPress={generateBoth}
          style={{
            opacity:
              !postTitle.trim() || isGenerating || isSubmitting ? 0.5 : 1,
          }}
        >
          <LinearGradient
            colors={["#2a0e45", "#9f57f5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              paddingVertical: 16,
              paddingHorizontal: 20,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 15,
              flexDirection: "row",
              gap: 10,
            }}
          >
            <Sparkles size={20} color="white" className="mr-3" />
            {isGenerating ? (
              <Text className="font-black text-md text-white">
                Generate post + Image....
              </Text>
            ) : (
              <Text className="font-black text-md text-white">
                Generate SEO Post + Image
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {aiError && (
          <View
            className={`mt-2.5 flex-row items-center gap-2 px-3 py-2 rounded-xl border`}
          >
            <AlertCircle size={12} className="text-red-400 shrink-0" />
            <Text className={`text-sm`}>{aiError}</Text>
          </View>
        )}
      </View>

      {/* Step 2 */}
      <View
        className="rounded-3xl border shadow-sm mt-5"
        style={{ backgroundColor: primaryForeground, borderColor: link }}
      >
        {/* Title Header */}
        <View
          className="flex-row justify-between items-center mb-3 border-b px-6 py-4"
          style={{ borderColor: link }}
        >
          <View className="flex-row items-center">
            <View
              className="p-2 rounded-xl mr-3"
              style={{ backgroundColor: link + "30" }}
            >
              <Brain size={18} color={link} />
            </View>
            <Text className="text-lg font-black " style={{ color: text }}>
              Post Content
            </Text>
          </View>
          <Text
            className="text-sm font-black uppercase tracking-widest"
            style={{ color: textMuted }}
          >
            Step 2 of 2
          </Text>
          {textT.length > 0 && !isSubmitting && (
            <TouchableOpacity
              onPress={() => {
                setTextT("");
                setAiResult(null);
              }}
              className={`flex-row items-center gap-1 h-6 px-2 rounded-lg border`}
              style={{ backgroundColor: red + "20", borderColor: red }}
            >
              <Trash2 size={12} color={red} />
              <Text className={`text-xs font-medium`} style={{ color: red }}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isGenerating && text.length === 0 && (
          <View className="p-4 flex-col gap-2.5">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                isDark={theme === "dark"}
                className={`h-3 ${i === 3 ? "w-2/3" : "w-full"}`}
              />
            ))}
          </View>
        )}

        {/* Input Field */}
        <View
          className={`px-5 py-3 mb-6 ${isGenerating && text.length === 0 ? "hidden" : ""}`}
          style={{
            minHeight: 200,
          }}
        >
          <TextInput
            value={textT}
            onChangeText={(e) => {
              setTextT(e);
              setValidErr("");
            }}
            className="flex-1 font-medium"
            placeholder="Your AI-generated post will appear here… or type manually ✍️"
            numberOfLines={10}
            placeholderTextColor={textMuted}
            cursorColor={link}
            multiline={true}
            style={{ color: text }}
            textAlignVertical="top"
            editable={isSubmitting}
          />
        </View>
        <View
          className="border-t rounded-2xl py-4"
          style={{ borderColor: link }}
        >
          <Text
            className="px-7"
            style={{
              color: overLimit ? red : remaining < 100 ? orange : textMuted,
            }}
          >
            {overLimit
              ? `${Math.abs(remaining)} over limit`
              : remaining < 200
                ? `${remaining} chars left`
                : `${charCount} / ${MAX_CHARS}`}
          </Text>
          {textT.length > 0 && !isGenerating && !isSubmitting && (
            <Pressable
              onPress={generateText}
              disabled={!postTitle.trim()}
              className={`flex-row justify-center items-center gap-2 h-12 mx-3 mt-2 px-2.5 rounded-xl  transition-all active:scale-95 disabled:opacity-40`}
              style={{ backgroundColor: link }}
            >
              <RefreshCw size={12} color={text} />
              <Text className="text-sm font-medium" style={{ color: text }}>
                Regenerate text only
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {duplicateOpener && !isGenerating && (
        <View
          className={`mb-4 flex-row items-start gap-2.5 px-3.5 py-3 rounded-2xl border
      ${theme === "dark" ? "bg-amber-500/10 border-amber-900/40" : "bg-amber-50 border-amber-200/60"}`}
        >
          <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
          <Text
            className={`text-sm leading-relaxed
        ${theme === "dark" ? "text-amber-400/80" : "text-amber-700"}`}
          >
            <Text className="text-sm" style={{ color: text }}>
              Similar opening detected.{" "}
            </Text>
            Your recent posts also start with &quot;{duplicateOpener}&quot; —
            consider editing the first sentence.
          </Text>
        </View>
      )}

      {aiResult && !isGenerating && textT.length > 0 && (
        <SEOSection score={aiResult.seoScore} tips={aiResult.tips} />
      )}

      {(aiResult || extraKeywords.length > 0) && !isGenerating && (
        <View className="mt-5">
          <KeywordPanel
            onRemove={removeKeyword}
            extras={extraKeywords}
            embedded={embeddedKeywords}
            suggested={
              aiResult?.suggestedKeywords?.filter(
                (k) => !extraKeywords.includes(k),
              ) ?? []
            }
            onAdd={(kw) => {
              addKeyword(kw);
              if (!text.toLowerCase().includes(kw.toLowerCase()))
                setTextT((prev) => prev + " " + kw);
            }}
          />
        </View>
      )}

      {postType === "EVENT" && (
        <View className="mb-5 mt-3 gap-3">
          <Text
            className="text-sm uppercase font-bold"
            style={{ color: textMuted }}
          >
            Event Details
          </Text>
          <TextInput
            value={eventTitle}
            onChangeText={setEventTitle}
            style={{
              color: text,
              borderColor: link,
              backgroundColor: link + "30",
            }}
            className="flex-1 font-medium px-3 py-4 rounded-xl border"
            placeholder="Event Title*"
            placeholderTextColor={textMuted}
            editable={!isSubmitting}
          />
        </View>
      )}

      {postType === "OFFER" && (
        <View className="mt-4 mb-4 gap-3">
          <Text
            className="text-sm uppercase font-bold"
            style={{ color: textMuted }}
          >
            Offer Details
          </Text>
          <TextInput
            value={offerTitle}
            onChangeText={setOfferTitle}
            style={{
              color: text,
              borderColor: link,
              backgroundColor: link + "30",
            }}
            className="flex-1 font-medium rounded-xl px-3 border"
            placeholder="Offer Title*"
            placeholderTextColor={textMuted}
            editable={!isSubmitting}
            cursorColor={link}
          />
          <TextInput
            value={couponCode}
            onChangeText={setCouponCode}
            style={{
              color: text,
              borderColor: link,
              backgroundColor: link + "30",
            }}
            className="flex-1 font-medium rounded-xl px-3 border"
            placeholder="Coupon Code (Optional)"
            placeholderTextColor={textMuted}
            editable={!isSubmitting}
            cursorColor={link}
          />
        </View>
      )}

      {/* AI Generated Image */}
      <AIImageCard
        title={postTitle}
        postType={postType}
        bizName={businessName}
        bizCat={businessCategory}
        imgStyle={imgStyle}
        setImgStyle={setImgStyle}
        aiImage={aiImage}
        setAiImage={setAiImage}
        onImageAccepted={(dataUrl) =>
          setImages((prev) =>
            prev.includes(dataUrl)
              ? prev
              : [dataUrl, ...prev.filter((i) => i !== dataUrl)],
          )
        }
        disabled={isSubmitting}
      />

      <View
        className="rounded-3xl border shadow-sm p-6 mt-5"
        style={{ backgroundColor: primaryForeground, borderColor: link }}
      >
        {/* Title Header */}
        <View className="flex justify-center items-start">
          <View className="gap-1 mb-2">
            <Text
              className="uppercase font-bold text-md pb-3 mb-3"
              style={{ color: textMuted }}
            >
              Photos
            </Text>
            {images.length > 0 && (
              <Text
                className={`text-sm font-medium `}
                style={{ color: textMuted }}
              >
                {images.length}/10
              </Text>
            )}
          </View>
          <ImageUpload
            images={images}
            onChange={setImages}
            disabled={isSubmitting}
          />
          {images.length > 0 && (
            <Text className={`text-[10px] mt-2`} style={{ color: textMuted }}>
              First image is used as the post cover. Tap × to remove.
            </Text>
          )}
        </View>
      </View>

      <View
        className="rounded-3xl border shadow-sm p-6 mt-5"
        style={{ backgroundColor: primaryForeground, borderColor: link }}
      >
        {/* Title Header */}
        <Text
          className="uppercase font-bold text-md pb-3 mb-3"
          style={{ color: textMuted }}
        >
          Call to action
        </Text>
        <ScrollView
          className="flex-row gap-2"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {CTA_OPTIONS.map((c) => (
            <View key={c.id} className="flex-1 mr-2">
              <TonePill
                label={c.label}
                emoji={c.icon}
                active={cta === c.id}
                onPress={() => {
                  if (!isSubmitting) {
                    setCta(c.id);
                    setShowCtaUrl(c.id !== "NONE" && c.id !== "CALL");
                  }
                }}
              />
            </View>
          ))}
        </ScrollView>
        {showCtaUrl && cta !== "NONE" && cta !== "CALL" && (
          <View
            className={`mt-4 flex-row items-center h-15 px-3 gap-3 rounded-xl border`}
            style={{
              backgroundColor: textMuted + "30",
              borderColor: textMuted,
            }}
          >
            <Link2 size={15} color={textMuted} />
            <TextInput
              value={ctaUrl}
              onChangeText={setCtaUrl}
              editable={!isSubmitting}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className={`flex-1 text-sm ${
                isSubmitting ? "opacity-50" : "opacity-100"
              }`}
              style={{ color: textMuted }}
            />
          </View>
        )}
      </View>

      {/* Schedule Later */}
      {/* <Pressable
        className="rounded-3xl border shadow-sm p-6 mt-5 flex justify-start items-center flex-row gap-3 disabled:opacity-50"
        style={{ backgroundColor: primaryForeground, borderColor: link }}
        disabled={isSubmitting}
        onPress={() => !isSubmitting && setShowCal(!showCal)}
      >
        <View
          className="rounded-2xl p-3 flex-2"
          style={{ backgroundColor: link + "40" }}
        >
          <Calendar color={textMuted} size={13} />
        </View>
        <View className="flex-1">
          <Text
            className="font-bold text-lg capitalize"
            style={{ color: text }}
          >
            {schedule ? "Scheduled" : "Schedule for Later"}
          </Text>
          <Text
            className="font-bold text-sm capitalize"
            style={{ color: textMuted }}
          >
            {schedule
              ? formatSchedule(schedule)
              : "Post immediately when published"}
          </Text>
        </View>
        <View className="flex-2 flex-row items-center">
          {schedule && (
            <Pressable
              onPress={() => {
                if (!isSubmitting) setSchedule(null);
              }}
              className={`w-6 h-6 flex items-center justify-center rounded-lg`}
            >
              <X size={18} color={textMuted} />
            </Pressable>
          )}
          {showCal ? (
            <ChevronUp color={textMuted} />
          ) : (
            <ChevronDown color={textMuted} />
          )}
        </View>
      </Pressable>
      {showCal && (
        <View>
          <CalendarPicker
            value={calDraft}
            onChange={(v) => {
              setCalDraft(v);
              setSchedule(v);
            }}
            onClose={() => setShowCal(false)}
          />
        </View>
      )} */}

      {displayError && (
        <View
          className={`flex-row items-center gap-2.5 p-3.5 mt-4 rounded-2xl mb-4 border`}
          style={{ backgroundColor: red + "20", borderColor: red }}
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" color={red} />
          <View className="flex-1">
            <Text className="text-[13px] font-medium" style={{ color: red }}>
              {displayError}
            </Text>
            {postMutation.isError && (
              <TouchableOpacity
                onPress={() => {
                  postMutation.reset();
                  setValidErr("");
                  submittingRef.current = false;
                }}
              >
                <Text
                  className="text-sm font-semibold mt-1"
                  style={{ color: red }}
                >
                  Dismiss
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View className="py-5 flex flex-row gap-3">
        <Pressable
          className="py-4 border rounded-2xl flex-1 justify-center items-center flex-row gap-3"
          style={{ borderColor: textMuted, backgroundColor: textMuted + "30" }}
          onPress={() => setShowPreview(true)}
          disabled={isSubmitting}
        >
          <Eye size={20} color={textMuted} />
          <Text className="text-center" style={{ color: textMuted }}>
            Preview
          </Text>
        </Pressable>
        <Pressable
          className="rounded-2xl flex-1"
          onPress={handleSubmit}
          disabled={isSubmitting || isGenerating || overLimit}
          // style={{ backgroundColor: link }}
        >
          <LinearGradient
            colors={["#2a0e45", "#9f57f5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              paddingVertical: 16,
              paddingHorizontal: 20,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 15,
              flexDirection: "row",
              gap: 10,
            }}
            className="flex justify-center items-center flex-row gap-3"
          >
            {isSubmitting ? (
              uploadPhase ? (
                <>
                  <Upload size={20} className="animate-bounce" color={text} />
                  Uploading
                  <Text className="text-center" style={{ color: text }}>
                    {uploadProgress.current}/{uploadProgress.total}…
                  </Text>
                </>
              ) : (
                <>
                  <RefreshCw size={20} color={text} />
                  <Text className="text-center" style={{ color: text }}>
                    {schedule ? "Scheduling…" : "Publishing…"}
                  </Text>
                </>
              )
            ) : (
              <View className="flex-row gap-2">
                <Send size={20} color={text} />
                <Text className="text-center" style={{ color: text }}>
                  {schedule ? "Schedule Post" : "Publish Now"}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      <View className="mt-5">
        <Text className="text-sm text-center" style={{ color: textMuted }}>
          Posts may take a few minutes to appear on Google. Content must comply
          with{" "}
          <Text style={{ color: link }}>Google&apos;s content policies</Text>.
          Posts expire after 7 days unless Event or Offer posts.
        </Text>
      </View>

      {showPreview && (
        <PreviewModal
          text={textT}
          images={images}
          cta={cta}
          schedule={schedule}
          onClose={() => setShowPreview(false)}
        />
      )}

      <View className=" mb-20"></View>
    </ScrollView>
  );
};

// --- Sub-Components ---

const PostTypeCard = ({ label, desc, Icon, active, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className={`w-[31%] px-2 py-3 rounded-3xl border items-center justify-center`}
    style={{ backgroundColor: active ? link : textMuted + "30" }}
  >
    <Icon size={20} color={active ? text : textMuted} className="mb-2" />
    <Text
      className="font-black text-sm mt-2"
      style={{ color: active ? text : textMuted }}
    >
      {label}
    </Text>
    <Text
      className="text-xs text-center font-bold leading-3"
      style={{ color: active ? text : textMuted }}
    >
      {desc}
    </Text>
  </TouchableOpacity>
);

const TonePill = ({ label, emoji, active, onPress, type, Icon }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center justify-center px-2 py-2.5 rounded-xl border gap-1.5`}
    style={{
      backgroundColor: active ? link : textMuted + "30",
      borderColor: active ? link : textMuted,
    }}
  >
    {type === "icon" ? <Icon /> : <Text className="">{emoji}</Text>}
    <Text className={`font-black text-xs text-center`} style={{ color: text }}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default CreatePostScreen;
