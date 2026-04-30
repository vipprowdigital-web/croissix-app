import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import StartBg from "@/assets/images/bg/auth/star_bg.svg";
import { useColor } from "@/hooks/useColor";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

const features = [
  {
    title: "Lightning fast performance",
    icon: "flash",
    color: "#FFD700",
  },
  {
    title: "Enterprise-grade security",
    icon: "lock-closed",
    color: "#4CAF50",
  },
  {
    title: "Real-time analytics",
    icon: "bar-chart",
    color: "#00BFFF",
  },
];

const FeatureItem = ({ icon, text, color }: any) => (
  <View className="flex-row items-center mb-6">
    <View
      className={`rounded-lg items-center justify-center mr-4 p-3`}
      style={{ backgroundColor: color + "30" }}
    >
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text className="text-gray-200 text-lg font-medium">{text}</Text>
  </View>
);

export default function Page() {
  const fadeAnim = new Animated.Value(0);
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1000);
    });
  }, []);
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  return (
    <View style={{ flex: 1 }} className="justify-center items-center p-12">
      {/* <View style={[styles.bgContainer, StyleSheet.absoluteFill]}>
        <StartBg
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
        />
        <LinearGradient
          colors={["#101015", "#2a0e45"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            paddingVertical: 14,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 15,
          }}
        ></LinearGradient>
      </View> */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["#2a0e45", "#101015"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.bgContainer}>
            <StartBg
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
              // style={{ opacity: 0.9 }}
            />
          </View>
        </LinearGradient>
      </View>
      <Animated.Text
        style={{ color: "white", opacity: fadeAnim }}
        className="text-5xl font-bold mb-4"
      >
        Croissix AI
      </Animated.Text>
      <Animated.Text
        style={[
          {
            opacity: fadeAnim,
            color: textMuted,
          },
        ]}
        className="text-center mb-10"
      >
        The fastest way to manage your workflow. Trusted by thousands of teams
        worldwide.
      </Animated.Text>
      <View className="p-3">
        {features.map((feature) => (
          <FeatureItem
            key={feature.title}
            text={feature.title}
            color={feature.color}
            icon={feature.icon}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   backgroundColor: "#530677",
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
