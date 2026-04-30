import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  TouchableOpacity,
  Linking,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  FontAwesome,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useColor } from "@/hooks/useColor";
import * as WebBrowser from "expo-web-browser";

export default function InviteFriendScreen() {
  const router = useRouter();
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");

  const REFERRAL_CODE = "VIPPROW-XJ9K2";
  const REFERRAL_LINK = `https://vipprow.com/join?ref=${REFERRAL_CODE}`;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(REFERRAL_CODE);
  };

  const onShare = async () => {
    try {
      const shareMessage = `Join me on Vipprow! Use my code ${REFERRAL_CODE} to get 20% off: ${REFERRAL_LINK}`;
      await Share.share({
        message: shareMessage,
        url: REFERRAL_LINK,
      });
    } catch (error: any) {
      console.log("Share Error:", error.message);
    }
  };

  const onEmailShare = () => {
    const subject = encodeURIComponent("Join me on Vipprow");
    const body = encodeURIComponent(
      `Hey! Use my referral link to get 20% off your first 3 months: ${REFERRAL_LINK}`,
    );
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  };

  const onWhatsAppShare = async () => {
    const message = encodeURIComponent(
      `Join Vipprow and get 20% off! ${REFERRAL_LINK}`,
    );
    const whatsappUrl = `whatsapp://send?text=${message}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await WebBrowser.openBrowserAsync(`https://wa.me/?text=${message}`);
      }
    } catch (error) {
      console.log("WhatsApp Error:", error);
    }
  };

  const copyLink = async () => {
    await Clipboard.setStringAsync(REFERRAL_LINK);
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
      {/* Header */}
      <View className="flex-row items-center mb-8">
        <Pressable
          onPress={() => router.back()}
          className="p-2 rounded-xl mr-4"
        >
          <Ionicons name="arrow-back" size={20} color={link} />
        </Pressable>
        <Text className="text-2xl font-black " style={{ color: text }}>
          Invite a Friend
        </Text>
      </View>

      {/* Hero Card */}
      <View className="p-8 items-center mb-6">
        <View>
          <View className="p-6 rounded-full">
            <MaterialCommunityIcons name="gift" size={64} color="#f59e0b" />
          </View>
        </View>
        <Text
          className="text-2xl font-black text-center mb-3"
          style={{ color: text }}
        >
          Share & earn free months
        </Text>
        <Text
          className="text-center leading-5 px-4 font-medium"
          style={{ color: textMuted }}
        >
          Every friend who subscribes gives you a free month — and them a head
          start.
        </Text>
      </View>

      {/* Rewards Info Card */}
      <View
        className="rounded-[32px] p-6 mx-4 mb-8"
        style={{ backgroundColor: primaryForeground }}
      >
        <RewardRow
          icon="gift"
          iconColor="#f59e0b"
          title="You get 1 month free"
          subtitle="Added to your plan when they subscribe"
          titleColor={text}
          descColor={textMuted}
        />
        <View className="h-[1px] my-2" />
        <RewardRow
          icon="lightning-bolt"
          iconColor="#f97316"
          title="They get 20% off"
          subtitle="On their first 3 months"
          titleColor={text}
          descColor={textMuted}
        />
        <View className="h-[1px] my-2" />
        <RewardRow
          icon="infinity"
          iconColor="#3b82f6"
          title="No limit"
          subtitle="Invite as many as you want"
          titleColor={text}
          descColor={textMuted}
          isLast
        />
      </View>

      {/* Referral Code Section */}
      <Text
        className="text-[11px] font-bold uppercase tracking-widest mb-3 mx-4 pl-2"
        style={{ color: textMuted }}
      >
        Your Referral Code
      </Text>
      <View className="flex-row gap-3 mx-4">
        <View
          className="flex-1 border rounded-2xl py-4 items-center justify-center"
          style={{
            borderColor: link + "30",
            backgroundColor: primaryForeground,
          }}
        >
          <Text
            className="font-black text-lg tracking-widest"
            style={{ color: link }}
          >
            {REFERRAL_CODE}
          </Text>
        </View>
        <Pressable
          onPress={copyToClipboard}
          className="border p-4 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: primaryForeground,
            borderColor: link + "30",
          }}
        >
          <Ionicons name="copy-outline" size={22} color={link} />
        </Pressable>
      </View>

      <View className="mt-8 mx-4">
        <Text
          className="text-[11px] font-bold uppercase tracking-widest mb-3 pl-2"
          style={{ color: textMuted }}
        >
          Or share your link
        </Text>

        <View className="flex-row gap-3 mb-6">
          <View
            className="flex-1 border rounded-2xl px-4 py-5 justify-center"
            style={{ backgroundColor: link + "20", borderColor: link + "30" }}
          >
            <Text className="text-sm" numberOfLines={1} style={{ color: text }}>
              {REFERRAL_LINK}
            </Text>
          </View>
          <Pressable
            onPress={copyLink}
            className="p-4 rounded-2xl items-center justify-center border"
            style={{ backgroundColor: link + "20", borderColor: link + "30" }}
          >
            <Ionicons name="copy-outline" size={20} color={link} />
          </Pressable>
        </View>

        {/* SOCIAL ACTION BUTTONS */}
        <View className="flex-row justify-between mb-8">
          <SocialButton
            label="Share"
            icon="share-social"
            color="bg-blue-600"
            IconLib={Ionicons}
            onPress={onShare}
          />
          <SocialButton
            label="Email"
            icon="email"
            color="bg-purple-500"
            IconLib={MaterialCommunityIcons}
            onPress={onEmailShare}
          />
          <SocialButton
            label="WhatsApp"
            icon="whatsapp"
            color="bg-green-500"
            IconLib={FontAwesome}
            onPress={onWhatsAppShare}
          />
        </View>

        {/* YOUR REFERRALS STATS CARD */}
        <View
          className="rounded-[32px] p-6 shadow-sm border"
          style={{ backgroundColor: primaryForeground }}
        >
          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-4"
            style={{ color: textMuted }}
          >
            Your Referrals
          </Text>

          <View className="flex-row justify-between">
            <StatBox
              value="0"
              label="Invited"
              textColor={text}
              textMuted={textMuted}
            />
            <StatBox
              value="0"
              label="Joined"
              textColor={text}
              textMuted={textMuted}
            />
            <StatBox
              value="0 mo"
              label="Earned"
              textColor={text}
              textMuted={textMuted}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Sub-component for reward items
function RewardRow({
  icon,
  iconColor,
  title,
  subtitle,
  titleColor,
  descColor,
}: any) {
  return (
    <View className="flex-row items-center py-4">
      <View
        className="p-2 rounded-xl mr-4"
        style={{ backgroundColor: iconColor + "15" }}
      >
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-base" style={{ color: titleColor }}>
          {title}
        </Text>
        <Text className="text-xs font-medium" style={{ color: descColor }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

// Sub-component for Stat Boxes
function StatBox({
  value,
  label,
  textColor,
  textMuted,
}: {
  value: string;
  label: string;
  textColor: string;
  textMuted: string;
}) {
  return (
    <View className="rounded-2xl py-4 items-center w-[31%]">
      <Text className="text-2xl font-black " style={{ color: textColor }}>
        {value}
      </Text>
      <Text
        className="text-[10px] font-bold mt-1 capitalize"
        style={{ color: textMuted }}
      >
        {label}
      </Text>
    </View>
  );
}

// Sub-component for Social Buttons
function SocialButton({ label, icon, color, IconLib, onPress }: any) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={`${color} rounded-3xl py-6 items-center justify-center w-[31%] shadow-sm`}
      onPress={onPress}
    >
      <IconLib name={icon} size={24} color="white" />
      <Text className="text-white font-bold text-xs mt-2">{label}</Text>
    </TouchableOpacity>
  );
}
