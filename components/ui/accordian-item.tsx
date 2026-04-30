import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColor } from "@/hooks/useColor";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const AccordionItem = ({
  title,
  icon,
  desc,
  color,
}: {
  title: string;
  icon?: string;
  desc: string;
  color?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primaryForeground = useColor("primaryForeground");
  const primary = useColor("primary");
  const link = useColor("link");

  return (
    <View
      className="mb-3 rounded-2xl border shadow-sm overflow-hidden"
      style={{
        borderColor: primaryForeground,
        backgroundColor: primary,
        shadowColor: link,
      }}
    >
      <TouchableOpacity
        onPress={toggleOpen}
        activeOpacity={0.7}
        className="flex-row items-center justify-between p-4"
      >
        {/* <View className="flex-row items-center gap-4">
          {icon && (
            <View
              style={{ backgroundColor: color + "30" }}
              className="p-2 rounded-2xl"
            >
              <Ionicons name={icon as any} size={20} color={color} />
            </View>
          )}
          <Text className="font-bold capitalize" style={{ color: text }}>
            {title}
          </Text>
        </View>
        {isOpen ? (
          <ChevronUp size={20} color={textMuted} />
        ) : (
          <ChevronDown size={20} color={textMuted} />
        )} */}
        {/* Added flex-1 here to wrap the text area and push chevron to the right */}
        <View className="flex-row items-center flex-1 mr-2">
          {icon && (
            <View
              style={{ backgroundColor: color + "30" }}
              className="p-2 rounded-xl mr-3"
            >
              <Ionicons name={icon as any} size={18} color={color} />
            </View>
          )}
          <Text
            className="font-bold text-[13px] flex-1"
            style={{ color: text }}
            numberOfLines={isOpen ? undefined : 2}
          >
            {title}
          </Text>
        </View>

        <View className="ml-auto">
          {isOpen ? (
            <ChevronUp size={18} color={textMuted} />
          ) : (
            <ChevronDown size={18} color={textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View className="px-4 pb-4">
          <View
            className="h-[0.5px] mb-3"
            style={{ backgroundColor: textMuted }}
          />
          <Text className="leading-6" style={{ color: textMuted }}>
            {desc}
          </Text>
        </View>
      )}
    </View>
  );
};
