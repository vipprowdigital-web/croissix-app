import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ImageBackground,
  ScrollView,
} from "react-native";
import { MessageCircle } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React from "react";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 50;

const services = [
  {
    id: "1",
    title: "Software Development",
    subHeading: "Built to scale. Built to last.",
    badge: "ENTERPRISE",
    bgColor: "bg-blue-600",
    color: "#2563eb",
    category: "Software",
    textColor: "text-blue-600",
    icon: "code-slash-outline",
    desc: "Custom web apps, APIs, and platforms engineered for performance and growth.",
    features: [
      "Custom Web Applications",
      "REST & GraphQL APIs",
      "Cloud Architecture",
      "DevOps & CI/CD",
    ],
    waMessage:
      "Hi! I'm interested in Software Development services from Croissix.",
  },
  {
    id: "2",
    title: "Website Development",
    subHeading: "Websites that work as hard as you.",
    badge: "MOST REQUESTED",
    bgColor: "bg-purple-600",
    color: "#9333ea",
    category: "Website",
    textColor: "text-purple-600",
    icon: "globe-outline",
    desc: "Fast, beautiful, responsive websites that turn visitors into loyal customers.",
    features: [
      "Landing Pages & Portfolios",
      "E-Commerce Stores",
      "CMS Integration",
      "Performance Optimised",
    ],
    waMessage:
      "Hi! I'm interested in Website Development services from Croissix.",
  },
  {
    id: "3",
    title: "SEO & Local SEO",
    subHeading: "Rank #1. Stay there.",
    badge: "HIGH ROI",
    bgColor: "bg-green-600",
    color: "#16a34a",
    category: "SEO",
    textColor: "text-green-600",
    icon: "search-outline",
    desc: "Technical SEO, content strategy, and Google Business optimisation to dominate search.",
    features: [
      "Google Business Profile",
      "On-Page & Technical SEO",
      "Link Building",
      "Local Search Ranking",
    ],
    waMessage: "Hi! I'm interested in SEO services from Croissix.",
  },
  {
    id: "4",
    title: "Mobile App Development",
    subHeading: "Apps your users will love",
    badge: "CROSS-PLATFORM",
    bgColor: "bg-blue-600",
    color: "#2563eb",
    category: "Mobile",
    textColor: "text-blue-600",
    icon: "phone-portrait-outline",
    desc: "Cross-platform iOS & Android apps with polished UX and robust backends.",
    features: [
      "React Native & Flutter",
      "iOS & Android",
      "Push Notifications",
      "App Store Optimisation",
    ],
    waMessage: "Hi! I'm interested in Mobile App Development from Croissix.",
  },
  {
    id: "5",
    title: "Branding & Design",
    subHeading: "Identity that commands attention.",
    badge: "CREATIVE",
    bgColor: "bg-pink-600",
    color: "#db2777",
    category: "Branding",
    textColor: "text-pink-600",
    icon: "color-palette-outline",
    desc: "Logo, brand guidelines, social kits, and visuals that make your brand unforgettable.",
    features: [
      "Logo & Identity Design",
      "Brand Guidelines",
      "Social Media Creatives",
      "Print & Packaging",
    ],
    waMessage:
      "Hi! I'm interested in Branding & Design services from Croissix.",
  },
  {
    id: "6",
    title: "E-Commerce Solutions",
    subHeading: "Sell more. Sell smarter.",
    badge: "REVENUE DRIVER",
    bgColor: "bg-orange-600",
    color: "#ea580c",
    category: "E-Commerce",
    textColor: "text-orange-600",
    icon: "cart-outline",
    desc: "End-to-end e-commerce platforms with payment gateways, inventory, and automation.",
    features: [
      "Shopify & WooCommerce",
      "Payment Integration",
      "Inventory Management",
      "Abandoned Cart Recovery",
    ],
    waMessage: "Hi! I'm interested in E-Commerce solutions from Croissix.",
  },
  {
    id: "7",
    title: "Analytics & Insights",
    subHeading: "Data that tells the whole story.",
    badge: "DATA-DRIVEN",
    bgColor: "bg-sky-600",
    color: "#0284c7",
    category: "Analytics",
    textColor: "text-sky-600",
    icon: "bar-chart-outline",
    desc: "Custom dashboards, Google Analytics setup, and actionable reporting that drives decisions.",
    features: [
      "Google Analytics 4",
      "Custom Dashboards",
      "Competitor Analysis",
      "Monthly Reports",
    ],
    waMessage: "Hi! I'm interested in Analytics services from Croissix.",
  },
  {
    id: "8",
    title: "Digital Marketing",
    subHeading: "Reach millions. Convert them.",
    badge: "MOST POPULAR",
    bgColor: "bg-orange-500",
    color: "#f97316",
    category: "Digital",
    textColor: "text-orange-500",
    icon: "megaphone-outline",
    desc: "Full-funnel campaigns across Google, Meta, and more — built to drive real ROI.",
    features: [
      "Google Ads Management",
      "Meta & Instagram Ads",
      "Email Campaigns",
      "Conversion Optimisation",
    ],
    waMessage:
      "Hi! I'm interested in Digital Marketing services from Croissix.",
  },
];

const categories = [
  "Digital",
  "Software",
  "Website",
  "Mobile",
  "SEO",
  "Branding",
  "E-Commerce",
  "Analytics",
];

const FeatureItem = ({ label, color }: { label: string; color: string }) => (
  <View className="flex-row items-center w-1/2 mb-4">
    <View
      className={`w-2 h-2 rounded-full mr-2`}
      style={{ backgroundColor: color }}
    />
    <Text className=" text-[11px] font-medium" style={{ color: "#c4c4c8" }}>
      {label}
    </Text>
  </View>
);

const AutoSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const primaryForeground = useColor("primaryForeground");
  const link = useColor("link");
  const textMuted = useColor("textMuted");
  const text = useColor("text");
  const green = useColor("green");
  const indigo = useColor("indigo");
  const yellow = useColor("yellow");

  // Automatic Sliding Logic
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex === services.length - 1 ? 0 : activeIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const DEFAULT_WA = "919669932121";

  const renderItem = ({ item }: { item: (typeof services)[0] }) => (
    <LinearGradient
      colors={[item.color, primaryForeground]} // gradient from white to item.color
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ width: CARD_WIDTH }}
      className="ml-5 rounded-3xl overflow-hidden border shadow-sm"
    >
      {/* <View
        style={{ width: CARD_WIDTH, backgroundColor: primaryForeground }}
        className="ml-4 rounded-3xl overflow-hidden border shadow-sm"
      > */}
      <ImageBackground
        source={{
          uri: "https://www.toptal.com/designers/subtlepatterns/patterns/double-bubble-outline.png",
        }}
        imageStyle={{ opacity: 0.05 }}
        className="p-6"
      >
        <View>
          <View className="flex-row justify-between items-start mb-4">
            <View
              className={`w-14 h-14 rounded-2xl items-center justify-center ${item.bgColor}`}
            >
              {/* <Smartphone size={30} color="white" /> */}
              <Ionicons name={item.icon as any} size={30} color="white" />
            </View>

            <View className={`px-3 py-1 rounded-full border border-white`}>
              <Text className={`text-[10px]  font-black uppercase text-white`}>
                {item.badge}
              </Text>
            </View>
          </View>

          <View className="flex-col">
            <Text className="text-xl font-bold " style={{ color: text }}>
              {item.title}
            </Text>
            <Text className={`${item.textColor} font-medium text-xs mb-3`}>
              {item.subHeading}
            </Text>
          </View>
        </View>
        <Text className="text-sm mt-2 mb-6" style={{ color: text }}>
          {item.desc}
        </Text>

        <View className="flex-row flex-wrap mb-8">
          {item.features.map((feature) => (
            <FeatureItem key={feature} label={feature} color={item.color} />
          ))}
        </View>

        <TouchableOpacity
          className={`flex-row items-center justify-center gap-4 py-4 rounded-2xl shadow-mg ${item.bgColor}`}
          onPress={async () =>
            await WebBrowser.openBrowserAsync(
              `https://wa.me/${DEFAULT_WA}?text=${encodeURIComponent(item.waMessage)}`,
            )
          }
        >
          <MessageCircle size={20} color="white" />
          <Text className="text-white font-bold">Get a Free Quote</Text>
        </TouchableOpacity>
      </ImageBackground>
      {/* </View> */}
    </LinearGradient>
  );

  return (
    <View className="pt-10">
      <View className="flex-row justify-between items-end mb-6 px-7">
        <View>
          <Text className="text-2xl font-bold" style={{ color: text }}>
            Our Services
          </Text>
          <Text className="text-sm" style={{ color: textMuted }}>
            {services.length} services · Swipe to explore
          </Text>
        </View>
        {/* Pagination Dots */}
        <View className="flex-row gap-x-1 mb-2">
          {services.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${activeIndex === i ? "w-6" : "w-2"}`}
              style={{
                backgroundColor: activeIndex === i ? link : text,
              }}
            />
          ))}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={services}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + 16,
          offset: (CARD_WIDTH + 16) * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / CARD_WIDTH,
          );
          setActiveIndex(newIndex);
        }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-8 ml-7"
      >
        {categories.map((cat) => {
          const activeCategory = services[activeIndex].category;
          const isActive = cat === activeCategory;

          return (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                const targetIndex = services.findIndex(
                  (service) => service.category === cat,
                );
                if (targetIndex !== -1) {
                  flatListRef.current?.scrollToIndex({
                    index: targetIndex,
                    animated: true,
                  });
                  setActiveIndex(targetIndex);
                }
              }}
              className="px-6 py-2 rounded-full border mr-2"
              style={{
                borderColor: isActive ? services[activeIndex].color : "#cbd5e1",
                backgroundColor: isActive
                  ? services[activeIndex].color + "20"
                  : "transparent",
              }}
            >
              <Text
                className="font-bold text-xs"
                style={{
                  color: isActive ? services[activeIndex].color : "#94a3b8",
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default AutoSlider;
