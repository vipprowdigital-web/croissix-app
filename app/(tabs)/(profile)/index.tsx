// app/(tabs)/(profile)/index.tsx

// import { SearchBarSuggestions } from "@/components/search/searchbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollView } from "@/components/ui/scroll-view";
// import { Text as BNAText } from "@/components/ui/text";
// import { View as BNAView } from "@/components/ui/view";
import { Button } from "@/components/ui/button";
import { useColor } from "@/hooks/useColor";
import { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SettingsRow from "@/components/ui/settings-row";
import { logout } from "@/services/auth.service";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { API_URL, FRONTEND_URL } from "@/config/.env";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Check, Link as LinkIcon } from "lucide-react-native";
import { GoogleG } from "@/components/ui/icons";
import { Href, useRouter } from "expo-router";
import { Footer } from "@/components/ui/footer";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Clipboard from "expo-clipboard";
import Svg, { Rect } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { updateUser } from "@/store/slices/auth.slice";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/services/(user)/user.service";
import { queryClient } from "@/providers/queryClient";
import QRCode from "react-native-qrcode-svg";

type SettingItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  trailing: string;
  onPress?: Href;
  action?: () => void;
};

function LocationRow({
  location,
  onRefresh,
}: {
  location: any;
  onRefresh: () => void;
}) {
  const dispatch = useDispatch();
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const user = useSelector((s: RootState) => s.auth.user);
  // const user = useUser();
  const token = useSelector((s: RootState) => s.auth.token);

  const locationId = location.name.split("/").pop();
  // console.log("Comparing:", user?.googleLocationId, "===", locationId);
  const isConnected = user?.googleLocationId === locationId;
  // console.log("user: ", user);
  // console.log("googleLocationId: ", user?.googleLocationId);
  // console.log("locationId: ", locationId);
  // console.log("isConnected: ", isConnected);

  const link = useColor("link");
  const text = useColor("text");
  const green = useColor("green");
  const textMuted = useColor("textMuted");
  // const queryClient = useQueryClient();

  const handleLink = async () => {
    // console.log("Inside handle link");
    if (user?.googleLocationId) {
      Alert.alert(
        "Already Linked",
        "You can only connect one Google Business location. Please contact support to change it.",
      );
      return;
    }

    try {
      // console.log("Token: ", token);
      if (!token) return;

      setLinkingId(locationId);

      const response = await fetch(`${API_URL}/users/google-location`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ locationId, locationName: location.title }),
      });

      // if (!response.ok) throw new Error("Failed to link location");
      // Added for safer parse
      // Read as text first
      const text = await response.text();

      if (!response.ok) {
        console.error("Bad response:", response.status, text);

        // Try to extract a message from JSON error body if available
        let errorMessage = "Failed to link location";
        if (text) {
          try {
            const errData = JSON.parse(text);
            errorMessage = errData.message || errData.error || errorMessage;
          } catch {
            errorMessage = text; // plain text error from server
          }
        }

        Alert.alert("Error", errorMessage);
        return;
      }

      // Safe parse success response
      if (text) {
        try {
          JSON.parse(text); // parse if you need response data, otherwise just ignore
        } catch {
          console.warn("Response was not JSON:", text);
        }
      }
      // Added for safer parse

      if (!user) return;

      dispatch(
        updateUser({
          googleLocationId: locationId,
          googleLocationName: location.title,
        }),
      );

      // ✅ Invalidate the cache so useUser refetches fresh data on all pages
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });

      // call the refresh to re fetch the locs
      onRefresh();

      Alert.alert("Success", `${location.title} linked successfully`);
    } catch (e) {
      // console.log("Error: ", e);

      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Something went wrong",
      );
    } finally {
      setLinkingId(null);
      // console.log("Linking id to null.");
    }
  };

  return (
    <View className="flex-row items-center py-2.5">
      {/* Icon Box */}
      <View
        className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3`}
      >
        <GoogleG />
      </View>

      {/* Info Section */}
      <View className="flex-1">
        <Text className="font-medium text-[13.5px]" style={{ color: text }}>
          {location.title}
        </Text>
        <Text className="text-[11px]" style={{ color: textMuted }}>
          {location.phoneNumbers?.primaryPhone || "No phone"}
        </Text>
      </View>

      {/* Action Section */}
      {isConnected ? (
        <View
          className="flex-row items-center border rounded-full px-2 py-1"
          style={{ borderColor: green }}
        >
          <Check size={12} color={green} />
          <Text className="text-xs font-semibold" style={{ color: green }}>
            {" "}
            Connected
          </Text>
        </View>
      ) : user?.googleId ? null : (
        <TouchableOpacity
          onPress={handleLink}
          disabled={linkingId === locationId}
          activeOpacity={0.7}
          className={`flex-row items-center space-x-1 px-3 py-1.5 border rounded-full ${
            linkingId === locationId ? "opacity-60" : ""
          }`}
          style={{ borderColor: link }}
        >
          {linkingId === locationId ? (
            <ActivityIndicator size="small" color={link} />
          ) : (
            <>
              <Text
                className="text-white text-xs font-semibold mr-1"
                style={{ color: link }}
              >
                Link
              </Text>
              <LinkIcon size={12} color={link} />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

type QRPatternProps = {
  url: string;
  size?: number;
};

// function QRPattern({ url, size = 180 }: QRPatternProps) {
//   const seed = url.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
//   const cells = 21;
//   const cell = size / cells;

//   const grid = Array.from({ length: cells }, (_, r) =>
//     Array.from({ length: cells }, (_, c) => {
//       const inTL = r < 7 && c < 7;
//       const inTR = r < 7 && c >= cells - 7;
//       const inBL = r >= cells - 7 && c < 7;

//       if (inTL || inTR || inBL) {
//         const lr = inTL ? r : inTR ? r : r - (cells - 7);
//         const lc = inTL ? c : inTR ? c - (cells - 7) : c;
//         if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
//         if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
//         return false;
//       }
//       return (seed * (r * 31 + c * 17) + r + c) % 3 !== 0;
//     }),
//   );

//   return (
//     <View style={styles.container}>
//       <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
//         {grid.map((row, r) =>
//           row.map(
//             (on, c) =>
//               on && (
//                 <Rect
//                   key={`${r}-${c}`}
//                   x={c * cell}
//                   y={r * cell}
//                   width={cell}
//                   height={cell}
//                   fill="#0f172a"
//                   rx={0.5}
//                 />
//               ),
//           ),
//         )}
//       </Svg>
//     </View>
//   );
// }
function QRPattern({ url, size = 180 }: QRPatternProps) {
  return (
    <View style={styles.container}>
      <QRCode
        value={url || "https://example.com"}
        size={size}
        color="#0f172a"
        backgroundColor="white"
      />
    </View>
  );
}

export default function ProfileScreen() {
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");
  const user = useSelector((s: RootState) => s.auth.user);
  // const { data: user, isLoading: userLoding } = useUser();
  const token = useSelector((s: RootState) => s.auth.token);
  // const dispatch = useDispatch();
  const colorScheme = useSelector((state: RootState) => state.theme.mode);
  // const location = useSelector((g: RootState) => g.google.location);
  const link = useColor("link");
  const text = useColor("text");
  const green = useColor("green");
  // const yellow = useColor("yellow");
  const indigo = useColor("indigo");
  const textMuted = useColor("textMuted");
  const shadowColor = "#9f57f5";
  const red = useColor("red");

  const [isOpen, setIsOpen] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Review QR");
  const [linkCopied, setLinkCopied] = useState(false);
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%"], []);

  const locationId = user?.googleLocationId;
  const locationName = user?.googleLocationName;

  const base = "https://ai.croissix.com";

  const visibleLocations = useMemo(() => {
    if (user?.googleLocationId) {
      // Only show the connected one
      return locations.filter(
        (loc) => loc.name.split("/").pop() === user.googleLocationId,
      );
    }
    return locations; // Show all if none connected yet
  }, [locations, user?.googleLocationId]);

  const tabs = useMemo(
    () => [
      // {
      //   name: "Review QR",
      //   color: "#F59E0B",
      //   icon: "star-outline",
      //   link: locationId
      //     ? `https://search.google.com/local/writereview?placeid=${locationId}`
      //     : `${base}/review`,
      //   bottomText:
      //     "Display this on receipts, tables, or counters to collect more reviews.",
      //   heading: "Let customers leave a Google review instantly.",
      // },
      {
        name: "Profile QR",
        color: indigo,
        icon: "location-outline",
        link: locationId
          ? `https://www.google.com/maps/search/?api=1&query=${user.googleLocationName}`
          : // ? `https://www.google.com/maps/place/?q=place_id:${locationId}`
            `${base}/profile`,
        bottomText:
          "Share on social media, email signatures, or print materials.",
        heading: "Share your full Google Business listing.",
      },
      {
        name: "Directions QR",
        color: green,
        icon: "globe-outline",
        link: locationId
          ? `https://www.google.com/maps/search/?api=1&query=${user.googleLocationName}`
          : `${base}/directions`,
        // ? `https://www.google.com/maps/dir/?api=1&destination_place_id=${locationId}`
        bottomText:
          "Print near your entrance or parking area for easy navigation.",
        heading: "Help customers navigate directly to you.",
      },
    ],
    [indigo, green, locationId],
  );

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.name === activeTab),
    [activeTab, tabs],
  );

  // Backdrop for the bottom sheet
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

  const settings: SettingItem[] = [
    // {
    //   icon: "notifications-outline",
    //   label: "Notifications",
    //   trailing: "",
    //   onPress: "/",
    // },
    {
      icon: "lock-closed-outline",
      label: "Privacy",
      trailing: "",
      onPress: {
        pathname: "/policies",
        params: { type: "privacy" },
      },
    },
    {
      icon: "document-text-outline",
      label: "Terms & Conditions",
      trailing: "",
      onPress: {
        pathname: "/policies",
        params: { type: "terms" },
      },
    },
    {
      icon: "shield-outline",
      label: "My Plan",
      trailing: "View",
      onPress: "/SubscriptionScreen",
    },
    // {
    //   icon: "chatbubble-outline",
    //   label: "Chats",
    //   trailing: "",
    //   onPress: "/",
    // },
    // {
    //   icon: "server-outline",
    //   label: "Storage and Data",
    //   trailing: "1.2 GB",
    //   onPress: "/",
    // },
    {
      icon: "help-circle-outline",
      label: "Help",
      trailing: "",
      onPress: "/HelpSupport",
    },
    // {
    //   icon: "share-outline",
    //   label: "Invite a Friend",
    //   trailing: "",
    //   onPress: "/InviteFriendScreen",
    // },
    // {
    //   icon: "sunny-outline",
    //   label: "Theme",
    //   trailing: colorScheme === "light" ? "Light" : "Dark",
    //   action: () => dispatch(toggleTheme()),
    // },
  ];

  useEffect(() => {
    if (!token) {
      router.replace("/(auth)/login");
    }
  }, [token, router]);

  // ------------------------------------------------------
  // GOOGLE OAUTH FLOW
  const handleGoogleLink = async (jwt: string) => {
    console.log("Opening Auth Session...");
    const redirectUri = Linking.createURL("oauth-success");
    const authUrl = `${FRONTEND_URL}/api/auth/google?token=${jwt}&platform=mobile`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    fetchLocs();

    console.log("Auth Result Type:", result.type);

    if (result.type === "success") {
      console.log("Full Redirect URL:", result.url);
      const data = Linking.parse(result.url);

      if (data.queryParams?.linked === "true") {
        console.log("✅ Google linked successfully");
      }
    } else if (result.type === "cancel") {
      console.log("User cancelled the login.");
    }
  };
  // GOOGLE OAUTH FLOW
  // ------------------------------------------------------

  // useEffect(() => {
  //   if (!isOpen) return;
  //   if (locations.length === 0 && user?.googleId) fetchLocs();
  // }, [isOpen]);

  const fetchLocs = async () => {
    console.log("Inside fetch locations: ", user?.googleId);

    if (!user?.googleId) {
      setLocations([]);
      return;
    }
    // console.log("Inside fetchLocs: ", locations);
    try {
      setLoading(true);
      const res = await fetch(`${FRONTEND_URL}/api/google/locations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // const data = await res.json();
      // console.log("Data from API: ", data);
      // setLocations(data.locations || []);
      // if (data.locations.length !== 0) {
      //   setGoogleLocation(data.locations);
      // }
      // Guard before parsing
      // Added for safe parsing
      if (!res.ok) {
        // console.error("Bad response:", res.status, await res.text());
        setError(`Bad Request: ${await res.text()}`);
        setLocations([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setLocations([]);
        return;
      }
      const data = JSON.parse(text);
      setLocations(data.locations || []);
      setLoading(false);
      // Added for safe parsing
    } catch (e) {
      setLoading(false);
      setError(`Error while fetching location.`);
      // console.error(e);
    } finally {
      setLoading(false);
    }
  };
  // console.log("Locations: ", locations[0]);

  // For QR Section

  const copyLink = async (link: string) => {
    await Clipboard.setStringAsync(link);
  };

  const shareLink = async () => {
    const link = currentTab?.link || "";
    try {
      const result = await Share.share({
        title: `${locationName || "Business"} — ${currentTab?.name}`,
        message: `${locationName || "Business"} — ${currentTab?.name}\n${link}`,
        url: link,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared with activity:", result.activityType);
        } else {
          console.log("Shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error(error);
      copyLink(link);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setLinkCopied(false);
    }, 3000);
  }, [linkCopied]);

  if (!token || !user) {
    return <ActivityIndicator color={link} style={{ flex: 1 }} />;
  }
  // if (userLoding) {
  //   return <ActivityIndicator color={link} />;
  // }

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1">
        {error && (
          <View
            className={`rounded-2xl p-4 mt-5 flex-row items-start border mb-4 mx-7`}
            style={{ backgroundColor: red + "30", borderColor: red }}
          >
            <View className="flex-1">
              <Text
                className="text-md font-semibold mb-0.5"
                style={{ color: red }}
              >
                Error
              </Text>
              <Text className="text-sm" style={{ color: red }}>
                {error}
              </Text>
            </View>
          </View>
        )}
        {/* <View className="flex-1"> */}
        <LinearGradient
          colors={[
            colorScheme === "dark" ? "#2a0e45" : "white",
            colorScheme === "dark" ? "#101015" : "#2a0e45",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          // style={{ flex: 1 }}
        >
          {/* <View style={styles.bgContainer}>
              <StartBg
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
                // style={{ opacity: 0.9 }}
              />
            </View> */}
        </LinearGradient>
        {/* </View> */}
        <ScrollView style={{ flex: 1, backgroundColor: primary }}>
          <View className="px-5 py-5">
            {/* // ------------------ PROFILE CARD ------------------ */}

            <Card
              style={{
                backgroundColor: primaryForeground,
                borderRadius: 15,
                shadowColor: shadowColor,
              }}
            >
              <CardContent style={{ gap: 16 }}>
                <View className="flex flex-row items-start gap-5">
                  <Avatar
                    size={56}
                    style={{
                      borderWidth: 3,
                      borderColor: link,
                      backgroundColor: link,
                    }}
                  >
                    <AvatarFallback style={{ backgroundColor: link }}>
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 24,
                        }}
                        className="text-white"
                      >
                        {user?.name?.[0] || "N/A"}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                  {user?.name && (
                    <View className="flex justify-end">
                      <Text
                        style={{
                          color: text,
                          fontSize: 20,
                          fontWeight: "bold",
                        }}
                      >
                        {user?.name}
                      </Text>
                      <Text style={{ color: text, fontSize: 16, opacity: 0.8 }}>
                        {user?.phone}
                      </Text>
                    </View>
                  )}
                </View>
                {user?.googleLocationName && (
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="checkmark-done-circle-outline"
                      color={green}
                      size={15}
                    />
                    <Text
                      style={{ color: green }}
                      className="text-sm font-semibold"
                    >
                      {user?.googleLocationName} · Connected
                    </Text>
                  </View>
                )}
                {!user?.googleLocationName && (
                  <Pressable
                    style={{
                      backgroundColor: link + "30",
                      borderColor: link + "30",
                    }}
                    className="rounded-2xl border"
                    onPress={() => {
                      // if (user?.googleLocationName) {
                      //   router.push("/EditBusinessScreen");
                      // } else {
                      handleGoogleLink(token!);
                      // }
                    }}
                  >
                    <View className="flex flex-row items-center justify-between p-3 py-4">
                      <View className="flex flex-row items-center justify-start gap-3">
                        <View className="p-2">
                          <GoogleG />
                        </View>
                        {/* {user?.googleLocationName ? (
                        <View>
                          <Text style={{ color: text }} className="font-bold">
                            Edit Google Business Profile
                          </Text>
                          <Text
                            style={{ color: textMuted }}
                            className="text-sm"
                          >
                            Update info, hours, photos & more
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ color: text }} className="font-bold">
                          Connect Google Profile
                        </Text>
                      )} */}
                        <Text style={{ color: text }} className="font-bold">
                          Connect Google Profile
                        </Text>
                      </View>
                      <View className="">
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={text}
                        />
                      </View>
                    </View>
                  </Pressable>
                )}
                {user.googleLocationId && (
                  <Pressable
                    className="py-3 px-5 rounded-xl flex-row justify-between border"
                    style={{
                      backgroundColor: link + "30",
                      borderColor: link + "30",
                    }}
                    onPress={() => sheetRef.current?.expand()}
                  >
                    <View className="flex-row gap-5">
                      <Ionicons name="grid-outline" size={20} color={link} />
                      <Text style={{ color: link }} className="font-bold">
                        View QR Code
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={link} />
                  </Pressable>
                )}
              </CardContent>
            </Card>
            {/* // ------------------ GOOGLE PROFILE MANAGER CARD ------------------ */}

            <Card
              style={{
                backgroundColor: primaryForeground,
                marginTop: 20,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 10,
              }}
            >
              <CardContent
                style={{ backgroundColor: primaryForeground, gap: 10 }}
              >
                <Pressable
                  style={{ backgroundColor: primaryForeground }}
                  onPress={() => {
                    setIsOpen(!isOpen);
                    fetchLocs();
                  }}
                >
                  <View className="flex flex-row justify-between gap-7 items-center w-full">
                    <View
                      className="flex-row gap-4"
                      style={{
                        alignItems:
                          isOpen || (user?.googleId && locations?.length > 0)
                            ? "flex-start"
                            : "center",
                      }}
                    >
                      <View
                        className="p-3"
                        style={{
                          backgroundColor: textMuted + "30",
                          borderRadius: 10,
                        }}
                      >
                        <GoogleG />
                      </View>
                      <View>
                        <Text style={{ color: text }} className="font-bold">
                          Google Profile Manager
                        </Text>
                        {(isOpen ||
                          (user?.googleId && locations?.length > 0)) && (
                          <Text style={{ color: text, fontSize: 12 }}>
                            {user?.googleId ? locations?.length : 0} profiles
                          </Text>
                        )}
                      </View>
                    </View>
                    {loading ? (
                      <ActivityIndicator size="small" color={link} />
                    ) : (
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={text}
                      />
                    )}
                  </View>
                </Pressable>
                {isOpen && (
                  <View>
                    {!user?.googleLocationName && (
                      <Button
                        style={{ backgroundColor: link + "30" }}
                        onPress={() => handleGoogleLink(token!)}
                      >
                        <Text style={{ color: link }} className="font-bold">
                          Link your Google Profile
                        </Text>
                      </Button>
                    )}
                    {visibleLocations.map((item, index) => (
                      <View key={item.name || index}>
                        <LocationRow
                          location={item}
                          onRefresh={fetchLocs}
                          key={`${item.name}-${user?.googleLocationId}`}
                        />
                        {index < locations.length - 1 && (
                          <View className="h-[0.5px] bg-white/10" />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>

            <Card
              style={{
                backgroundColor: primaryForeground,
                marginTop: 20,
              }}
            >
              <CardContent style={{ backgroundColor: primaryForeground }}>
                {settings.map((s, i) => (
                  <View
                    key={s.label}
                    className="gap-3"
                    // style={{ backgroundColor: primaryForeground }}
                  >
                    <SettingsRow
                      icon={s.icon}
                      iconColor={primaryForeground}
                      trailing={s.trailing}
                      label={s.label}
                      onPress={s.action ? s.action : s.onPress}
                    />
                    <View
                      className="h-0.5 mb-2"
                      style={{ backgroundColor: link + "30" }}
                    ></View>
                  </View>
                ))}
              </CardContent>
            </Card>
            <Pressable
              onPress={() => {
                logout();
              }}
            >
              <View
                style={{
                  backgroundColor: red + "20",
                  paddingLeft: 15,
                  paddingVertical: 10,
                  borderRadius: 15,
                  marginTop: 20,
                }}
                className="flex flex-row justify-start items-center gap-5"
              >
                <View
                  // style={{ backgroundColor: red + "20" }}
                  className="p-2 rounded-xl"
                >
                  <Ionicons name="log-out-outline" size={25} color={red} />
                </View>
                <Text
                  style={{
                    color: red,
                    fontSize: 16,
                  }}
                >
                  Log Out
                </Text>
              </View>
            </Pressable>
            <Footer />
          </View>
        </ScrollView>
        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ backgroundColor: "#D1D5DB", width: 40 }}
          backgroundStyle={{
            borderRadius: 40,
            backgroundColor: primaryForeground,
          }}
        >
          <BottomSheetView className="flex-1 p-6">
            {/* --- HEADER --- */}
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1 pr-4">
                <Text
                  className="text-2xl font-extrabold"
                  style={{ color: text }}
                >
                  Share & QR Codes
                </Text>
                <Text className="text-sm mt-1" style={{ color: textMuted }}>
                  {user?.googleLocationName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => sheetRef.current?.close()}
                className="p-2 rounded-full"
                style={{ backgroundColor: textMuted + "30" }}
              >
                <Ionicons name="close" size={20} color={text} />
              </TouchableOpacity>
            </View>

            {/* --- QR TABS --- */}
            <View className="flex-row space-x-2 my-6 gap-3">
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.name}
                  className="flex-1 flex-row items-center justify-center py-2 rounded-2xl shadow-sm border"
                  style={{
                    backgroundColor:
                      activeTab === tab.name ? tab.color : link + "30",
                    borderColor: activeTab === tab.name ? "" : link + "30",
                  }}
                  onPress={() => setActiveTab(tab.name)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={activeTab === tab.name ? "white" : tab.color}
                  />
                  <Text className="text-white font-bold ml-2 text-sm">
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* <View> */}
            <View>
              <Text
                className="text-center text-sm mb-6"
                style={{ color: textMuted }}
              >
                {currentTab?.heading}
              </Text>

              {/* --- QR CODE CARD --- */}
              <View
                className="items-center justify-center p-8 rounded-[40px] shadow-2xl mb-8 self-center"
                style={{
                  backgroundColor: primaryForeground,
                  shadowColor: link,
                }}
              >
                <QRPattern url={currentTab?.link || ""} size={186} />
              </View>

              {/* --- URL BOX --- */}
              <View
                className="flex-row items-center rounded-2xl p-3 px-4 mb-4 border"
                style={{
                  backgroundColor: textMuted + "50",
                  borderColor: textMuted + "50",
                }}
              >
                <Text
                  className="flex-1 text-sm"
                  numberOfLines={1}
                  style={{ color: textMuted }}
                >
                  {currentTab?.link}
                </Text>
              </View>

              {/* --- ACTIONS --- */}
              <View className="flex-row space-x-4 mb-4 gap-3">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center py-3 rounded-2xl border"
                  style={{
                    backgroundColor: linkCopied
                      ? green + "30"
                      : textMuted + "50",
                    borderColor: linkCopied ? green : textMuted + "50",
                  }}
                  onPress={() => {
                    copyLink(currentTab?.link || "");
                    setLinkCopied(true);
                  }}
                >
                  <Ionicons
                    name={linkCopied ? "checkmark" : "copy-outline"}
                    size={18}
                    color={linkCopied ? green : currentTab?.color}
                  />
                  <Text
                    className="font-bold ml-2"
                    style={{ color: linkCopied ? green : text }}
                  >
                    {linkCopied ? "Copied" : "Copy Link"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center py-3 rounded-2xl shadow-lg"
                  style={{
                    backgroundColor: currentTab?.color,
                    shadowColor: currentTab?.color,
                  }}
                  onPress={shareLink}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color="white"
                  />
                  <Text className="text-white font-bold ml-2">Share QR</Text>
                </TouchableOpacity>
              </View>

              <Text
                className="text-center text-sm"
                style={{ color: textMuted }}
              >
                {currentTab?.bottomText}
              </Text>
            </View>
            {/* </View> */}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
});
