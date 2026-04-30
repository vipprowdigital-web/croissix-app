// app/(tabs)/_layout.tsx

import { Tabs, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import type { ComponentProps } from "react";
import { useColor } from "@/hooks/useColor";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import React from "react";
import { Image } from "expo-image";
type FeatherIconName = ComponentProps<typeof Feather>["name"];

interface TabConfig {
  name: string; // route name (must match your file/folder)
  label: string; // label shown under the icon
  icon: FeatherIconName; // Feather icon name
  badge?: string | number; // optional badge text (e.g. "9+" or 3)
}

const TAB_CONFIG: TabConfig[] = [
  { name: "(home)", label: "Home", icon: "home" },
  { name: "(analytics)", label: "Analytics", icon: "bar-chart-2", badge: "9+" },
  { name: "(post)", label: "Posts", icon: "plus-square" },
  { name: "(reviews)", label: "Reviews", icon: "star", badge: 1 },
  { name: "(profile)", label: "Profile", icon: "user" },
];

// ─────────────────────────────────────────────
// ✏️  CUSTOMIZE YOUR STYLES HERE
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Badge component
// ─────────────────────────────────────────────

function TabBadge({ value }: { value: string | number }) {
  return (
    <View style={[styles.badge, { backgroundColor: "#ff3b30" }]}>
      <Text
        style={[
          styles.badgeText,
          {
            color: "#ffffff",
            fontSize: 9,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Custom tab icon with optional badge
// ─────────────────────────────────────────────

function TabIcon({
  icon,
  color,
  badge,
}: {
  icon: FeatherIconName;
  color: string;
  badge?: string | number;
}) {
  return (
    <View style={styles.iconWrapper}>
      <Feather name={icon} size={22} color={color} />
      {badge !== undefined && <TabBadge value={badge} />}
    </View>
  );
}

// ─────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────

export default function TabsLayout() {
  const text = useColor("text");
  const link = useColor("link");
  const textMuted = useColor("textMuted");
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");
  const router = useRouter();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const TAB_STYLE = {
    // Tab bar container
    backgroundColor: theme === "light" ? primary : primaryForeground,
    borderTopWidth: 0,
    height: Platform.OS === "ios" ? 80 : 90,
    paddingBottom: Platform.OS === "ios" ? 20 : 15,
    paddingTop: 2,
    // Colors
    activeColor: "#9f57f5",
    inactiveColor: theme === "light" ? "black" : "white",
    // Label
    labelFontSize: 11,
  };
  return (
    <Tabs
      screenOptions={{
        // headerShown: false,
        tabBarActiveTintColor: TAB_STYLE.activeColor,
        tabBarInactiveTintColor: TAB_STYLE.inactiveColor,
        tabBarStyle: {
          backgroundColor: TAB_STYLE.backgroundColor,
          borderTopWidth: TAB_STYLE.borderTopWidth,
          height: TAB_STYLE.height,
          paddingBottom: TAB_STYLE.paddingBottom,
          paddingTop: TAB_STYLE.paddingTop,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          // borderRadius: 30,
          // marginBottom: 25,
          // marginLeft: 10,
          // marginRight: 10,
          // shadowColor: link,
        },
        tabBarLabelStyle: {
          fontSize: TAB_STYLE.labelFontSize,
        },
        header: () => (
          <View
            className="flex-row justify-between items-center px-5 pt-11 pb-2"
            style={{ backgroundColor: primary }}
          >
            <View className="flex-row gap-3 items-center">
              <View className="w-14 h-14 rounded-full overflow-hidden">
                <Image
                  source={require("@/assets/images/logo/croissix-logo-1.png")}
                  className="w-full h-full object-contain"
                  contentFit="contain"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </View>
              <View className="justify-center items-start">
                <Text className="text-lg font-bold" style={{ color: text }}>
                  Croissix
                </Text>
                <Text
                  className="text-sm uppercase font-semibold"
                  style={{ color: textMuted }}
                >
                  AI - Powered • &#91;Beta&#93;
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: "" }}>
              <Pressable
                onPress={() => router.push("/ai-chat")}
                className="flex-row p-2 gap-2 items-center"
              >
                <LinearGradient
                  colors={["#2a0e45", "#9f57f5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 15,
                    borderRadius: 7,
                  }}
                  className="flex-row p-2 gap-2 items-center"
                >
                  <View>
                    <Ionicons name="sparkles" size={18} color="white" />
                  </View>
                  <Text className="text-white text-md">Ask AI</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ),
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color }) => (
              <TabIcon icon={tab.icon} color={color} />
              // <TabIcon icon={tab.icon} color={color} badge={tab.badge} />
            ),
            // headerTitle: () => (
            //   <View className="flex-row justify-between items-center">
            //     <View className="justify-center items-start">
            //       <Text className="text-lg" style={{ color: text }}>
            //         Croissix
            //       </Text>
            //       <Text
            //         className="text-sm uppercase"
            //         style={{ color: textMuted }}
            //       >
            //         AI - Powered • &#91;Beta&#93;
            //       </Text>
            //     </View>
            //     <View style={{ backgroundColor: "" }}>
            //       <Pressable
            //         onPress={() => {}}
            //         className="flex-row p-2 gap-2 items-center"
            //       >
            //         <LinearGradient
            //           colors={["#4A5EB2", "#8b0ac8"]}
            //           start={{ x: 0, y: 0 }}
            //           end={{ x: 1, y: 0 }}
            //           style={{
            //             paddingVertical: 8,
            //             paddingHorizontal: 15,
            //             borderRadius: 7,
            //           }}
            //           className="flex-row p-2 gap-2 items-center"
            //         >
            //           <View>
            //             <Ionicons name="sparkles" size={18} color="#4B91F7" />
            //           </View>
            //           <Text className="text-white text-md">Ask AI</Text>
            //         </LinearGradient>
            //       </Pressable>
            //     </View>
            //   </View>
            // ),
          }}
        />
      ))}
    </Tabs>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontWeight: "700",
    lineHeight: 12,
  },
});

// // app/(tabs)/_layout.tsx

// import { Platform } from "react-native";
// import { useColor } from "@/hooks/useColor";
// import MaterialIcons from "@expo/vector-icons/Feather";
// import {
//   Badge,
//   Icon,
//   Label,
//   NativeTabs,
//   VectorIcon,
// } from "expo-router/unstable-native-tabs";

// import { Ionicons } from "@expo/vector-icons";

// export default function TabsLayout() {
//   const red = useColor("red");
//   const primary = useColor("primary");
//   const foreground = useColor("foreground");
//   const primaryForeground = useColor("primaryForeground");

//   return (
//     <NativeTabs
//       minimizeBehavior="onScrollDown"
//       labelStyle={{
//         default: { color: primary },
//         selected: { color: primaryForeground },
//       }}
//       iconColor={{
//         default: primary,
//         selected: primaryForeground,
//       }}
//       badgeBackgroundColor={primaryForeground}
//       labelVisibilityMode="labeled"
//       disableTransparentOnScrollEdge={true}
//     >
//       <NativeTabs.Trigger name="(home)">
//         {Platform.select({
//           ios: <Icon sf="house.fill" />,
//           android: (
//             <Icon src={<VectorIcon family={MaterialIcons} name="home" />} />
//           ),
//         })}
//         <Label>Home</Label>
//       </NativeTabs.Trigger>

//       <NativeTabs.Trigger name="(post)">
//         {Platform.select({
//           ios: <Icon sf="square.3.layers.3d.down.forward" />,
//           android: (
//             <Icon src={<VectorIcon family={MaterialIcons} name="power" />} />
//           ),
//         })}
//         <Label>Posts</Label>
//       </NativeTabs.Trigger>

//       <NativeTabs.Trigger name="(insides)">
//         {Platform.select({
//           ios: <Icon sf="chart.xyaxis.line" />,
//           android: (
//             <Icon src={<VectorIcon family={MaterialIcons} name="power" />} />
//           ),
//         })}
//         <Badge>9+</Badge>
//         <Label>Insides</Label>
//       </NativeTabs.Trigger>

//       <NativeTabs.Trigger name="settings">
//         {Platform.select({
//           ios: <Icon sf="book.pages" />,
//           android: (
//             <Icon src={<VectorIcon family={MaterialIcons} name="settings" />} />
//           ),
//         })}
//         <Label>Docs</Label>
//         <Badge>1</Badge>
//       </NativeTabs.Trigger>

//       <NativeTabs.Trigger name="(profile)">
//         {Platform.select({
//           ios: <Icon sf="person.crop.circle" />,
//           android: (
//             <Icon src={<VectorIcon family={MaterialIcons} name="user" />} />
//           ),
//         })}
//         <Label>Profile</Label>
//       </NativeTabs.Trigger>
//     </NativeTabs>
//   );
// }

// import { Tabs } from "expo-router";
// import { Feather } from "@expo/vector-icons";
// import { useColor } from "@/hooks/useColor";

// export default function TabsLayout() {
//   const primary = useColor("primary");
//   const foreground = useColor("foreground");

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,

//         tabBarActiveTintColor: primary,
//         tabBarInactiveTintColor: "#888",

//         tabBarStyle: {
//           backgroundColor: "#0f0f0f",
//           borderTopWidth: 0,
//           height: 60,
//         },

//         tabBarLabelStyle: {
//           fontSize: 12,
//           marginBottom: 5,
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="(home)"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color, size }) => (
//             <Feather name="home" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="(post)"
//         options={{
//           title: "Posts",
//           tabBarIcon: ({ color, size }) => (
//             <Feather name="grid" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="(insides)"
//         options={{
//           title: "Insights",
//           tabBarIcon: ({ color, size }) => (
//             <Feather name="bar-chart-2" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="settings"
//         options={{
//           title: "Docs",
//           tabBarIcon: ({ color, size }) => (
//             <Feather name="settings" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="(profile)"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({ color, size }) => (
//             <Feather name="user" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }
