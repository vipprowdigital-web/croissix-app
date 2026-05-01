import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Lock, Bell } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface Details {
  id: string;
  title: string;
  subHeading: string;
  bgColor: string;
  color: string;
  textColor: string;
  icon: string;
  eta?: string;
  logo: string;
  desc: string;
  features: {
    name: string;
    icon: string;
    color: string;
  }[];
  comingSoon?: {
    name: string;
    icon: string;
    color: string;
  }[];
  action?: string;
}

const SocialMediaCard = ({
  heading,
  subHeading,
  details,
}: {
  heading: string;
  subHeading: string;
  details: Details;
}) => {
  const primaryForeground = useColor("primaryForeground");
  const primary = useColor("primary");
  const textMuted = useColor("textMuted");
  const text = useColor("text");
  const green = useColor("green");
  const [isNotified, setIsNotified] = useState(false);
  const handleNotify = () => {
    setTimeout(() => {
      setIsNotified((prev) => !prev);
    }, 1500);
  };
  return (
    <View className="flex-1 p-5">
      <Text className="text-2xl font-black mb-1 px-2" style={{ color: text }}>
        {heading}
      </Text>
      <Text className="text-xs mb-4 px-2" style={{ color: textMuted }}>
        {subHeading}
      </Text>

      {/* Main Card */}
      <View
        className="rounded-[40px] border shadow-md overflow-hidden"
        style={{
          backgroundColor: primary,
          shadowColor: details.color,
          borderColor: details.color,
        }}
      >
        {/* Top Section with Blur Effect */}
        <View
          className="px-6 py-4"
          style={{ backgroundColor: details.color + "90" }}
        >
          <View className="flex-row justify-between items-start mb-6 ">
            <View className="flex-row items-center ">
              <View className="w-12 h-12 rounded-2xl items-center justify-center shadow-sm bg-white">
                <Ionicons
                  name={details.logo as any}
                  size={28}
                  color={details.color}
                />
              </View>
              <View className="ml-3">
                <View className="flex-row items-center">
                  <Text
                    className="text-xl font-bold mr-2"
                    style={{ color: text }}
                  >
                    {details.title}
                  </Text>
                  <View className="px-2 py-0.5 rounded-lg bg-white">
                    <Text
                      className="text-[10px] font-black uppercase"
                      style={{ color: details.color }}
                    >
                      Soon
                    </Text>
                  </View>
                </View>
                <Text className=" text-[10px]" style={{ color: textMuted }}>
                  {details.subHeading}
                </Text>
              </View>
            </View>

            <View
              className="px-3 py-1 rounded-2xl border items-center"
              style={{
                backgroundColor: details.color + "10",
                borderColor: details.color,
              }}
            >
              <Text
                className="text-sm font-bold uppercase"
                style={{ color: details.color }}
              >
                Eta
              </Text>
              <Text className="font-black text-xs text-white">
                {details.eta}
              </Text>
            </View>
          </View>

          {/* Locked Overlay UI */}
          <View className="items-center justify-center py-4">
            {/* Simulated Blur Text */}
            <Text
              className="text-3xl font-black absolute"
              style={{ color: text, opacity: 0.3 }}
            >
              ₹ 3,000.00
            </Text>
            <TouchableOpacity
              className="flex-row items-center px-5 py-2.5 rounded-full border"
              style={{
                backgroundColor: details.color + "80",
                borderColor: details.color,
              }}
            >
              <Lock size={18} color={text} className="mr-2" />
              <Text
                className="font-bold text-sm text-center"
                style={{ color: text }}
              >
                {" "}
                {details.desc}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row" style={{ backgroundColor: details.color }}>
          {details.features.map((feature) => (
            <StatItem
              key={feature.name}
              icon={feature.icon}
              label={feature.name}
              color={feature.color}
              border
            />
          ))}
        </View>

        {/* Features Coming Section */}
        <View className="p-6">
          <Text
            className="font-black text-[10px] tracking-widest mb-4 uppercase"
            style={{ color: text }}
          >
            Features Coming
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {details.comingSoon?.map((feature) => (
              <FeatureBadge
                key={feature.name}
                icon={feature.icon}
                label={feature.name}
                iconColor={feature.color}
                color={details.color}
              />
            ))}
          </View>

          {/* Notify Button */}
          {details.title.toLowerCase() === "facebook" ? (
            <TouchableOpacity
              className="flex-row items-center justify-center py-4 rounded-3xl mt-4 shadow-lg gap-2"
              style={{
                backgroundColor: isNotified ? green + "50" : details.color,
              }}
              onPress={() => {
                setIsNotified(true);
                setTimeout(() => {
                  setIsNotified(false);
                }, 1500);
              }}
            >
              <Bell
                size={20}
                color={isNotified ? green : "white"}
                className="mr-2"
              />
              <Text
                className="font-bold text-base"
                style={{ color: isNotified ? green : "white" }}
              >
                {isNotified ? "You'll be Notified" : details.action}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-row items-center justify-center py-4 rounded-3xl shadow-lg"
              onPress={() => {
                setIsNotified(true);
                setTimeout(() => {
                  setIsNotified(false);
                }, 1500);
              }}
            >
              <LinearGradient
                colors={
                  isNotified ? [green, green + "30"] : ["#9333ea", "#f97316"]
                }
                start={{ x: 0, y: 0.5 }} // left side
                end={{ x: 1, y: 0.5 }} // right side
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 24,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  width: "100%",
                }}
              >
                <Ionicons
                  name={isNotified ? "notifications" : "notifications-outline"}
                  size={20}
                  color={isNotified ? "white" : "white"}
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-base">
                  {isNotified ? "You'll be Notified" : details.action}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const StatItem = ({ icon, label, border, color }: any) => (
  <View
    className={`flex-1 items-center py-3 ${border && "border-r border-white/50"} bg-white/20`}
  >
    <View
      className="p-2 rounded-full"
      // style={{ backgroundColor: color + "30" }}
    >
      <Ionicons size={20} color="white" name={icon} />
    </View>
    <View className="h-0.5 w-4 my-1" style={{ backgroundColor: "white" }} />
    <Text
      className="font-black text-xs tracking-tighter uppercase text-center"
      style={{
        color: "white",
      }}
    >
      {label}
    </Text>
  </View>
);

const FeatureBadge = ({ icon, label, iconColor, color }: any) => (
  <View
    className="w-[48%] flex-row items-center p-3 rounded-2xl mb-3 border"
    style={{ backgroundColor: color + "30", borderColor: color }}
  >
    <Ionicons size={16} color={iconColor} name={icon} />
    <Text className=" text-[10px] font-bold ml-2" style={{ color: "white" }}>
      {label}
    </Text>
  </View>
);

export default SocialMediaCard;
