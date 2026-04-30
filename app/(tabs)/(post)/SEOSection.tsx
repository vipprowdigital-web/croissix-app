import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import {
  ChevronDown,
  Hash,
  CheckCircle2,
  Plus,
  Lightbulb,
  X,
} from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import Svg, { Circle } from "react-native-svg";

function seoGrade(score: number): { label: string; color: string; bg: string } {
  if (score >= 85)
    return { label: "Excellent", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  if (score >= 70)
    return { label: "Good", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" };
  if (score >= 50)
    return {
      label: "Needs Work",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    };
  return { label: "Poor", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
}

const keywords = [
  "hotel",
  "vaishali",
  "jungle saffari",
  "junglesaffariadventures",
  "wildlifeexplorers",
  "luxurygetaways",
  "saffarilovers",
];

const SEOSection = ({ score, tips }: { score: number; tips: string[] }) => {
  const text = useColor("text");
  const primary = useColor("primary");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const green = useColor("green");

  const { label, color, bg } = seoGrade(score);
  const [open, setOpen] = useState(false);

  const circumference = 2 * Math.PI * 18;

  return (
    <View className="flex-1 mt-5">
      {/* SEO Score Card */}
      <Pressable
        className="rounded-3xl p-5 border flex-row items-center gap-4 shadow-sm"
        style={{ backgroundColor: primaryForeground, borderColor: link }}
        onPress={() => tips.length > 0 && setOpen(!open)}
      >
        <View className="flex-row items-center">
          <Svg width={50} height={50} viewBox="0 0 44 44">
            <Circle
              cx={22}
              cy={22}
              r={18}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={4}
            />
            <Circle
              cx={22}
              cy={22}
              r={18}
              fill="none"
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
            />
          </Svg>
          <View className="absolute inset-0 flex items-center justify-center">
            <Text className="text-md" style={{ color: color }}>
              {score}
            </Text>
          </View>
        </View>
        <View>
          <View className="flex-row items-center mb-1">
            <Text className="font-black text-lg mr-2" style={{ color: text }}>
              SEO Score
            </Text>
            <View
              className="px-3 py-0.5 rounded-full"
              style={{ backgroundColor: link + "30" }}
            >
              <Text className="font-bold text-sm" style={{ color: link }}>
                {label}
              </Text>
            </View>
          </View>
          <Text className="text-xs font-medium" style={{ color: textMuted }}>
            {tips.length === 0
              ? "Your post is fully optimised! 🎉"
              : `${tips.length} improvement${tips.length > 1 ? "s" : ""} available`}
          </Text>
        </View>
        {tips.length > 0 && (
          <ChevronDown
            size={20}
            color={textMuted}
            className={`transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          />
        )}
      </Pressable>

      {open && tips.length > 0 && (
        <View className="py-3 flex-col gap-2">
          {tips.map((tip, i) => (
            <View key={i} className="flex-row items-center gap-2 mb-2">
              <View className="bg-yellow-100/30 p-2 rounded-full">
                <Lightbulb
                  size={15}
                  className="text-amber-400 shrink-0 mt-0.5"
                  color="yellow"
                />
              </View>
              <Text className="text-sm" style={{ color: text }}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export const KeywordPanel = ({
  embedded,
  suggested,
  extras,
  onAdd,
  onRemove,
}: {
  embedded: string[];
  suggested: string[];
  extras: string[];
  onAdd: (k: string) => void;
  onRemove: (k: string) => void;
}) => {
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const green = useColor("green");
  const [custom, setCustom] = useState("");
  return (
    <View
      className="rounded-3xl p-6 border shadow-sm"
      style={{ backgroundColor: link + "80" }}
    >
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center">
          <Hash size={18} color={link} className="mr-2" />
          <Text className="text-xl font-black" style={{ color: text }}>
            {" "}
            Keywords
          </Text>
        </View>
        <Text
          className="text-sm font-black uppercase tracking-widest"
          style={{ color: textMuted }}
        >
          {embedded.length} embedded
        </Text>
      </View>

      {/* Keywords Pill Grid */}
      <View className="flex-col gap-2.5">
        {embedded.length > 0 && (
          <View>
            <Text
              className="font-black text-sm tracking-widest uppercase mb-4"
              style={{ color: textMuted }}
            >
              IN YOUR POST
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {embedded.map((keyword, index) => (
                <View
                  key={index}
                  className="flex-row items-center  border px-3 py-1.5 rounded-2xl"
                  style={{ backgroundColor: green + "20", borderColor: green }}
                >
                  <CheckCircle2 size={12} color={green} />
                  <Text
                    className="ml-1.5 font-bold text-xs"
                    style={{ color: green }}
                  >
                    {keyword}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {extras.length > 0 && (
          <View>
            <Text
              className="font-black text-sm tracking-widest uppercase mb-4"
              style={{ color: textMuted }}
            >
              Your Keywords
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {extras.map((keyword, index) => (
                <Pressable
                  key={index}
                  onPress={() => onRemove(keyword)}
                  className="flex-row items-center  border px-3 py-1.5 rounded-2xl"
                  style={{ backgroundColor: link + "20", borderColor: link }}
                >
                  <X size={12} color={link} />
                  <Text
                    className="ml-1.5 font-bold text-xs"
                    style={{ color: link }}
                  >
                    {keyword}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {suggested.length > 0 && (
          <View>
            <Text
              className="font-black text-sm tracking-widest uppercase mb-4"
              style={{ color: textMuted }}
            >
              Suggested
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {suggested.map((keyword, index) => (
                <Pressable
                  key={index}
                  onPress={() => onAdd(keyword)}
                  className="flex-row items-center  border px-3 py-1.5 rounded-2xl"
                  style={{
                    backgroundColor: textMuted + "20",
                    borderColor: textMuted,
                  }}
                >
                  <Plus size={12} color={textMuted} />
                  <Text
                    className="ml-1.5 font-bold text-xs"
                    style={{ color: textMuted }}
                  >
                    {keyword}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Add Keyword Input */}
      <View
        className="rounded-2xl flex-row items-center px-4 py-2"
        style={{ backgroundColor: primaryForeground }}
      >
        <Plus size={20} color={textMuted} />
        <TextInput
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={() => {
            if (custom.trim()) {
              onAdd(custom.trim());
              setCustom("");
            }
          }}
          className="flex-1 ml-2 font-bold text-md"
          placeholder="Add keyword..."
          placeholderTextColor={textMuted}
          style={{ color: text }}
        />
        {custom.trim() && (
          <Pressable
            onPress={() => {
              onAdd(custom.trim());
              setCustom("");
            }}
            className="p-3 rounded-2xl"
            style={{ backgroundColor: link }}
          >
            <Text className="text-sm" style={{ color: text }}>
              Add
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default SEOSection;
