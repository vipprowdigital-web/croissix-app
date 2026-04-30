import { useColor } from "@/hooks/useColor";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Dimensions, Animated } from "react-native";

interface Metric {
  title: string;
  color: string;
  icon: string;
  value: string | number | undefined;
  desc?: string;
}

export default function MetricCard({ item }: { item: Metric }) {
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth / 2 - 30;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(
    typeof item.value === "number" ? 0 : item.value,
  );

  useEffect(() => {
    if (typeof item.value === "number") {
      Animated.timing(animatedValue, {
        toValue: item.value,
        duration: 1200,
        useNativeDriver: false,
      }).start();

      const id = animatedValue.addListener(({ value }) => {
        setDisplayValue(Math.floor(value));
      });
      return () => {
        animatedValue.removeListener(id);
      };
    } else {
      setDisplayValue(item.value);
    }
  }, [item.value, animatedValue]);

  return (
    <View
      className="rounded-3xl px-5 py-3 mb-3 border shadow-sm"
      style={{
        width: cardWidth,
        elevation: 2,
        backgroundColor: primaryForeground,
        borderColor: link + "40",
      }}
    >
      <View className="flex-row justify-between items-start mb-3">
        <Text
          className="font-black text-sm tracking-tighter uppercase"
          style={{ color: textMuted }}
        >
          {item.title}
        </Text>
        <View
          className="p-2 rounded-xl"
          style={{ backgroundColor: item.color + "30" }}
        >
          <Ionicons name={item.icon as any} color={item.color} size={15} />
        </View>
      </View>

      {/* Value: animated if number, static if string */}
      <Text className="text-3xl font-black" style={{ color: text }}>
        {displayValue}
      </Text>

      {item?.desc && (
        <Text className="text-xs font-black" style={{ color: textMuted }}>
          {item.desc}
        </Text>
      )}
    </View>
  );
}
