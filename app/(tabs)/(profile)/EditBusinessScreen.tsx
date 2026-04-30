import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Linking,
  Switch,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  AntDesign,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useColor } from "@/hooks/useColor";
import { GoogleG } from "@/components/ui/icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import * as Clipboard from "expo-clipboard";
import { fetchGoogleLocation } from "@/services/(google)/googleLocation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useUser } from "@/services/(user)/user.service";
import { getToken } from "@/services/auth.util";
import { FRONTEND_URL } from "@/config/.env";
import MapView, { Marker } from "react-native-maps";
// import MapView, { Marker } from "@components/Map";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

const tabs = [
  { label: "About", icon: "information-circle-outline" },
  { label: "Contact", icon: "call-outline" },
  { label: "Location", icon: "location-outline" },
  { label: "Hours", icon: "time-outline" },
  { label: "Attributes", icon: "list-outline" },
  { label: "Advanced", icon: "settings-outline" },
];

// const initialHoursData = [
//   { day: "Mon", open: false, start: "9:00 AM", end: "6:00 PM" },
//   { day: "Tue", open: true, start: "9:00 AM", end: "6:00 PM" },
//   { day: "Wed", open: true, start: "9:00 AM", end: "6:00 PM" },
//   { day: "Thu", open: true, start: "7:30 AM", end: "11:00 PM" },
//   { day: "Fri", open: true, start: "7:30 AM", end: "11:00 PM" },
//   { day: "Sat", open: true, start: "7:30 AM", end: "11:00 PM" },
//   { day: "Sun", open: true, start: "7:30 AM", end: "11:00 PM" },
// ];

const moreHours = [
  "Drive-through",
  "Happy Hour",
  "Delivery",
  "Takeout",
  "Kitchen",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Brunch",
  "Pickup",
  "Senior hours",
];

interface TimePeriod {
  openDay: string;
  openTime: string;
  closeDay: string;
  closeTime: string;
}
interface SpecialHourPeriod {
  startDate: { year: number; month: number; day: number };
  endDate: { year: number; month: number; day: number };
  openTime?: string;
  closeTime?: string;
  closed?: boolean;
}
interface ServiceAreaPlace {
  placeId: string;
  name: string;
}
interface ServiceItem {
  freeFormServiceItem?: {
    category: string;
    label: { displayName: string; description?: string };
  };
  structuredServiceItem?: { serviceTypeId: string; description?: string };
}
interface LocationDraft {
  title: string;
  storeCode: string;
  languageCode: string;
  categories: {
    primaryCategory: { displayName: string; name: string };
    additionalCategories: { displayName: string; name: string }[];
  };
  profile: { description: string };
  phoneNumbers: { primaryPhone: string; additionalPhones: string[] };
  websiteUri: string;
  storefrontAddress: {
    regionCode: string;
    languageCode: string;
    postalCode: string;
    administrativeArea: string;
    locality: string;
    addressLines: string[];
  };
  latlng: { latitude: number; longitude: number };
  regularHours: { periods: TimePeriod[] };
  specialHours: { specialHourPeriods: SpecialHourPeriod[] };
  moreHours: { hoursTypeId: string; periods: TimePeriod[] }[];
  openInfo: {
    status: "OPEN" | "CLOSED_PERMANENTLY" | "CLOSED_TEMPORARILY";
    openingDate?: { year: number; month: number; day: number };
  };
  serviceArea: {
    businessType: "CUSTOMER_LOCATION_ONLY" | "CUSTOMER_AND_BUSINESS_LOCATION";
    places?: { placeInfos: ServiceAreaPlace[] };
  };
  serviceItems: ServiceItem[];
  adWordsLocationExtensions: { adPhone: string };
  labels: string[];
  relationshipData: { parentChain?: string };
}

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DSHRT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};
const MORE_HOURS_TYPES = [
  { id: "DRIVE_THROUGH", l: "Drive-through" },
  { id: "HAPPY_HOUR", l: "Happy hour" },
  { id: "DELIVERY", l: "Delivery" },
  { id: "TAKEOUT", l: "Takeout" },
  { id: "KITCHEN", l: "Kitchen" },
  { id: "BREAKFAST", l: "Breakfast" },
  { id: "LUNCH", l: "Lunch" },
  { id: "DINNER", l: "Dinner" },
  { id: "BRUNCH", l: "Brunch" },
  { id: "PICKUP", l: "Pickup" },
  { id: "SENIOR_HOURS", l: "Senior hours" },
];

const EMPTY_DRAFT: LocationDraft = {
  title: "",
  storeCode: "",
  languageCode: "en",
  categories: {
    primaryCategory: { displayName: "", name: "" },
    additionalCategories: [],
  },
  profile: { description: "" },
  phoneNumbers: { primaryPhone: "", additionalPhones: [] },
  websiteUri: "",
  storefrontAddress: {
    regionCode: "IN",
    languageCode: "en",
    postalCode: "",
    administrativeArea: "",
    locality: "",
    addressLines: [""],
  },
  latlng: { latitude: 0, longitude: 0 },
  regularHours: { periods: [] },
  specialHours: { specialHourPeriods: [] },
  moreHours: [],
  openInfo: { status: "OPEN" },
  serviceArea: {
    businessType: "CUSTOMER_AND_BUSINESS_LOCATION",
    places: { placeInfos: [] },
  },
  serviceItems: [],
  adWordsLocationExtensions: { adPhone: "" },
  labels: [],
  relationshipData: {},
};

function toTimeStr(t: any): string {
  if (!t) return "00:00";
  if (typeof t === "string") return t;
  const h = String(t.hours ?? 0).padStart(2, "0");
  const m = String(t.minutes ?? 0).padStart(2, "0");
  return `${h}:${m}`;
}

function normalizePeriods(periods: any[]): TimePeriod[] {
  return (periods ?? []).map((p: any) => ({
    openDay: p.openDay ?? "MONDAY",
    closeDay: p.closeDay ?? p.openDay ?? "MONDAY",
    openTime: toTimeStr(p.openTime),
    closeTime: toTimeStr(p.closeTime),
  }));
}

function stripCatPrefix(name: string) {
  return name?.replace(/^categories\//, "") ?? "";
}

function mapApiToDraft(d: any, prev: LocationDraft): LocationDraft {
  return {
    title: d.title || prev.title,
    storeCode: d.storeCode || prev.storeCode,
    languageCode: d.languageCode || prev.languageCode,
    profile: { description: d.profile?.description || "" },
    phoneNumbers: {
      primaryPhone: d.phoneNumbers?.primaryPhone || "",
      additionalPhones: d.phoneNumbers?.additionalPhones || [],
    },
    websiteUri: d.websiteUri || prev.websiteUri,
    storefrontAddress: d.storefrontAddress
      ? {
          regionCode: d.storefrontAddress.regionCode || "IN",
          languageCode: d.storefrontAddress.languageCode || "en",
          postalCode: d.storefrontAddress.postalCode || "",
          administrativeArea: d.storefrontAddress.administrativeArea || "",
          locality: d.storefrontAddress.locality || "",
          addressLines: d.storefrontAddress.addressLines?.length
            ? d.storefrontAddress.addressLines
            : [""],
        }
      : prev.storefrontAddress,
    latlng: d.latlng || prev.latlng,
    openInfo: d.openInfo
      ? { status: d.openInfo.status || "OPEN" }
      : prev.openInfo,
    // AFTER (normalizes time format):
    regularHours: {
      periods: normalizePeriods(d.regularHours?.periods ?? []),
    },
    specialHours: {
      specialHourPeriods: (d.specialHours?.specialHourPeriods ?? []).map(
        (sp: any) => ({
          startDate: sp.startDate,
          endDate: sp.endDate ?? sp.startDate,
          closed: !!sp.closed,
          openTime: sp.closed ? undefined : toTimeStr(sp.openTime),
          closeTime: sp.closed ? undefined : toTimeStr(sp.closeTime),
        }),
      ),
    },
    moreHours: (d.moreHours ?? []).map((mh: any) => ({
      hoursTypeId: mh.hoursTypeId,
      periods: normalizePeriods(mh.periods ?? []),
    })),
    serviceArea: d.serviceArea
      ? {
          businessType:
            d.serviceArea.businessType || "CUSTOMER_AND_BUSINESS_LOCATION",
          places: {
            placeInfos: (d.serviceArea.places?.placeInfos ?? []).map(
              (p: any) => ({
                placeId: p.placeId ?? p.name ?? "",
                name: p.displayName ?? p.name ?? p.placeId ?? "",
              }),
            ),
          },
        }
      : prev.serviceArea,
    serviceItems: d.serviceItems || [],
    adWordsLocationExtensions: d.adWordsLocationExtensions || { adPhone: "" },
    labels: d.labels || [],
    relationshipData: d.relationshipData || {},
    categories: d.categories
      ? {
          primaryCategory: {
            name: stripCatPrefix(d.categories.primaryCategory?.name || ""),
            displayName: d.categories.primaryCategory?.displayName || "",
          },
          additionalCategories: (d.categories.additionalCategories || []).map(
            (c: any) => ({
              name: stripCatPrefix(c.name || ""),
              displayName: c.displayName || "",
            }),
          ),
        }
      : prev.categories,
  };
}

const getDaysInMonth = (y: number, m: number) =>
  new Date(y, m + 1, 0).getDate();
const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
const pad = (n: number) => String(n).padStart(2, "0");
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

function CalendarPicker({
  value,

  onChange,
  onClose,
}: {
  value: { day: number; month: number; year: number };
  onChange: (d: string) => void; // returns dd/mm/yyyy string
  onClose: () => void;
}) {
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
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

  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const isPast = (d: number) =>
    new Date(view.year, view.month, d) < todayMidnight;

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

  // Format helper
  const formatDate = (day: number, month: number, year: number) =>
    `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;

  const handleConfirm = () => {
    const formatted = formatDate(value.day, view.month, view.year);
    onChange(formatted);
    onClose();
  };

  return (
    <View
      className="rounded-2xl overflow-hidden border mt-5"
      style={{ backgroundColor: primary, borderColor: link }}
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: link + "30" }}
      >
        <TouchableOpacity
          onPress={prev}
          className="w-7 h-7 items-center justify-center rounded-lg"
        >
          <ChevronLeft size={18} color={link} />
        </TouchableOpacity>

        <Text className="text-md font-bold" style={{ color: text }}>
          {MONTHS[view.month]} {view.year}
        </Text>

        <TouchableOpacity
          onPress={next}
          className="w-7 h-7 items-center justify-center rounded-lg"
        >
          <ChevronRight size={18} color={link} />
        </TouchableOpacity>
      </View>

      {/* Calendar Body */}
      <View className="p-3">
        <View className="flex-row mb-1">
          {DAYS.map((d) => (
            <View key={d} className="flex-1 items-center py-1">
              <Text className="text-sm font-bold" style={{ color: text }}>
                {d}
              </Text>
            </View>
          ))}
        </View>

        {cells.map((d, i) => (
          <View key={i} className="flex-row mb-0.5">
            {d === null ? (
              <View className="w-9 h-9" />
            ) : (
              <TouchableOpacity
                disabled={isPast(d)}
                onPress={() => {
                  const formatted = formatDate(d, view.month, view.year);
                  onChange(formatted);
                }}
                className={`w-9 h-9 items-center justify-center rounded-xl
                  ${isSelected(d) ? "bg-purple-500" : isToday(d) ? (isDark ? "bg-gray-500/20" : "bg-blue-50") : "bg-transparent"}
                  ${isPast(d) ? "opacity-50" : "opacity-100"}
                `}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: isSelected(d)
                      ? "#fff"
                      : isToday(d)
                        ? link
                        : textMuted,
                  }}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Footer */}
      <View className="flex-row px-4 pb-3 pt-1 gap-2">
        <TouchableOpacity
          onPress={onClose}
          className="flex-1 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: textMuted + "30" }}
        >
          <Text className="text-sm font-semibold" style={{ color: text }}>
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

function AboutTab({
  draft,
  upd,
}: {
  draft: LocationDraft;

  upd: (p: Partial<LocationDraft>, f: string[]) => void;
}) {
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const text = useColor("text");
  const green = useColor("green");
  const textMuted = useColor("textMuted");
  const [newCat, setNewCat] = useState("");
  const [oDate, setODate] = useState("");
  const [open, setOpen] = useState(false);
  const addCategory = () => {
    const trimmed = newCat.trim();
    if (trimmed && !formState.cats.includes(trimmed)) {
      setFormState({
        ...formState,
        cats: [...formState.cats, trimmed],
      });
      setNewCat("");
    }
  };

  const removeCategory = (index: number) => {
    setFormState({
      ...formState,

      cats: formState.cats.filter((_, i) => i !== index),
    });
  };

  // console.log("Draft from AboutTab: ", draft);

  function formatStatus(s: string) {
    return s
      .split("_")
      .map(
        (word: string) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join(" ");
  }

  const [formState, setFormState] = useState({
    name: "",
    code: "",
    desc: "",
    primary: "",
    cats: [] as string[],
    status: "OPEN" as "OPEN" | "CLOSED_PERMANENTLY" | "CLOSED_TEMPORARILY",
  });

  useEffect(() => {
    if (draft) {
      setFormState({
        name: draft.title,
        code: draft.storeCode,
        desc: draft.profile?.description ?? "",
        primary: draft.categories?.primaryCategory?.displayName ?? "",
        cats:
          draft.categories?.additionalCategories?.map((c) => c.displayName) ??
          [],
        status: draft.openInfo?.status ?? "",
      });
    }
  }, [draft]);

  const commit = () =>
    upd(
      {
        title: formState.name,
        storeCode: formState.code,
        profile: { description: formState.desc },
        categories: {
          primaryCategory: {
            displayName: formState.primary,
            name: draft.categories?.primaryCategory?.name || "",
          },
          additionalCategories: formState.cats.map((c, i) => ({
            displayName: c,
            name: draft.categories?.additionalCategories?.[i]?.name || "",
          })),
        },
        openInfo: {
          status: formState.status,
          ...(oDate
            ? {
                openingDate: {
                  year: parseInt(oDate.split("-")[0]),
                  month: parseInt(oDate.split("-")[1]),
                  day: parseInt(oDate.split("-")[2]),
                },
              }
            : {}),
        },
      },
      [
        "title",
        "storeCode",
        "profile.description",
        "categories",
        "openInfo.status",
        "openInfo.openingDate",
      ],
    );

  return (
    <View onBlur={commit}>
      {/* Main Content Card */}
      <View
        className="rounded-[32px] p-6 shadow-sm border"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center mb-6">
          <MaterialCommunityIcons
            name="office-building-outline"
            size={22}
            color={link}
          />
          <Text className="text-lg font-bold ml-2" style={{ color: text }}>
            Business Name
          </Text>
        </View>

        <View className="mb-6">
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            BUSINESS NAME <Text style={{ color: link }}>*</Text>
          </Text>

          <View
            className="border rounded-2xl p-4 min-h-[100px] bg-transparent"
            style={{ borderColor: textMuted }}
          >
            <TextInput
              value={formState.name}
              className="text-base"
              placeholder="Your business name…"
              onChangeText={(val) => setFormState({ ...formState, name: val })}
              style={{ color: text }}
              multiline
            />
          </View>

          <Text
            className="text-right text-xs mt-2"
            style={{ color: textMuted }}
          >
            {formState.name.length} / 750
          </Text>

          <Text className="text-sm mt-1" style={{ color: textMuted }}>
            Use your real-world name — as customers know it.
          </Text>
        </View>

        <View className="mb-4">
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            STORE CODE
          </Text>

          <View
            className="flex-row items-center border rounded-2xl p-4 bg-transparent"
            style={{ borderColor: textMuted }}
          >
            <Feather name="hash" size={16} color={link} />

            <TextInput
              value={formState.code}
              onChangeText={(val) => setFormState({ ...formState, code: val })}
              className="text-base ml-2 flex-1"
              placeholder="e.g. STORE-JBP-001"
              style={{ color: text }}
            />
          </View>

          <Text className="text-sm mt-2" style={{ color: textMuted }}>
            Internal identifier. Not shown publicly.
          </Text>
        </View>
      </View>

      <View
        className="rounded-[32px] p-6 shadow-sm mb-6 mt-5"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center mb-6">
          <MaterialCommunityIcons
            name="lightning-bolt-outline"
            size={20}
            color={link}
          />

          <Text className="text-lg font-bold ml-2" style={{ color: text }}>
            Open Status
          </Text>
        </View>

        <View className="mb-6">
          <Text
            className="font-bold text-sm mb-3 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            CURRENT STATUS <Text style={{ color: link }}>*</Text>
          </Text>

          <View className="space-y-3">
            {(
              ["OPEN", "CLOSED_TEMPORARILY", "CLOSED_PERMANENTLY"] as const
            ).map((s) => (
              <StatusOption
                key={s}
                label={formatStatus(s)}
                selected={formState.status === s}
                onPress={() => setFormState({ ...formState, status: s })}
                activeColor={green}
                text={textMuted}
              />
            ))}
          </View>

          <Text className="text-sm mt-3" style={{ color: textMuted }}>
            Controls what customers see on Google Search & Maps.
          </Text>
        </View>

        <View>
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            OPENING DATE
          </Text>

          {/* {open && (
            <CalendarPicker
              value={oDate}
              onChange={(v) => setODate(v)}
              onClose={() => setOpen(false)}
            />
          )} */}

          {/* <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              paddingHorizontal: 10,
            }}
          >
            <TextInput
              style={{ flex: 1, paddingVertical: 8 }}
              placeholder="Select date"
              value={date.toLocaleDateString()}
              editable={false} // prevent manual typing
            />
            <Pressable onPress={() => setShowPicker(true)}>
              <Ionicons name="calendar-outline" size={22} color="#555" />
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View> */}

          <Text className="text-sm mt-2" style={{ color: textMuted }}>
            When your business opened or will open.
          </Text>
        </View>
      </View>

      {/* CATEGORIES CARD */}
      <View
        className="rounded-[32px] p-6 shadow-sm mb-10"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Ionicons name="pricetag-outline" size={20} color={link} />

            <Text className="text-lg font-bold ml-2" style={{ color: text }}>
              Categories
            </Text>
          </View>

          <View
            className="px-3 py-1 rounded-full border"
            style={{
              backgroundColor: green + "30",
              borderColor: green,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: green }}>
              Affects ranking
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            PRIMARY CATEGORY <Text style={{ color: link }}>*</Text>
          </Text>

          <View
            className="border rounded-2xl py-2 px-4"
            style={{ borderColor: textMuted }}
          >
            <TextInput
              value={formState.primary}
              onChangeText={(val) =>
                setFormState({ ...formState, primary: val })
              }
              className="text-base"
              style={{ color: text }}
              placeholder="e.g. Advertising agency"
            />
          </View>

          {draft.categories.primaryCategory.name && (
            <Text
              className="font-mono text-sm mt-2"
              style={{ color: textMuted }}
            >
              gcid: {draft.categories.primaryCategory.name}
            </Text>
          )}

          <Text className="text-sm mt-1" style={{ color: textMuted }}>
            The single most important category.
          </Text>
        </View>

        <View>
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            ADDITIONAL CATEGORIES
          </Text>

          <View className="flex items-start space-x-3 gap-3">
            <View className="py-2">
              {formState.cats.map((c, i) => (
                <View
                  key={i}
                  className="flex-row items-center px-3 py-2 rounded-full border bg-transparent mt-2"
                  style={{ borderColor: link }}
                >
                  <View
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: link }}
                  />
                  <Text
                    className="text-sm font-medium mr-2"
                    style={{ color: text }}
                  >
                    {c}
                  </Text>

                  <TouchableOpacity onPress={() => removeCategory(i)}>
                    <Ionicons
                      name="close-circle-outline"
                      size={14}
                      color={textMuted}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View className="flex-row items-center gap-3">
              <View
                className="flex-1 border rounded-2xl  px-4"
                style={{ borderColor: textMuted }}
              >
                <TextInput
                  placeholder="Add category..."
                  placeholderTextColor={text}
                  className="text-base"
                  value={newCat}
                  onChangeText={setNewCat}
                  style={{ color: text }}
                />
              </View>

              <TouchableOpacity
                className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
                style={{ backgroundColor: link }}
                onPress={addCategory}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-sm mt-2" style={{ color: textMuted }}>
            Up to 9 more.
          </Text>
        </View>
      </View>

      <View className="flex-1 pb-10">
        {/* BUSINESS DESCRIPTION CARD */}

        <View
          className="rounded-[32px] p-6 shadow-sm border"
          style={{ backgroundColor: primaryForeground }}
        >
          {/* Card Header */}

          <View className="flex-row items-center mb-6">
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={link}
            />

            <Text className="text-lg font-bold ml-2" style={{ color: text }}>
              Business Description
            </Text>
          </View>

          {/* Input Section */}

          <View>
            <Text
              className="font-bold text-sm mb-2 tracking-widest uppercase"
              style={{ color: textMuted }}
            >
              DESCRIPTION
            </Text>

            <View
              className="border rounded-2xl p-4 min-h-[180px]"
              style={{ borderColor: textMuted }}
            >
              <TextInput
                multiline
                textAlignVertical="top"
                value={formState.desc}
                className="text-base leading-6"
                onChangeText={(val) =>
                  setFormState({ ...formState, desc: val })
                }
                style={{ paddingBottom: 20, color: textMuted }}
              />
            </View>

            <Text
              className="text-right font-bold text-[11px] mt-2 py-2"
              style={{ color: textMuted }}
            >
              684/750
            </Text>

            <Text className="text-sm mt-1" style={{ color: textMuted }}>
              Appears on your Google profile. Max 750 characters.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ContactTab({
  draft,
  upd,
}: {
  draft: LocationDraft;
  upd: (p: Partial<LocationDraft>, f: string[]) => void;
}) {
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const [phone, setPhone] = useState("");
  const [contactInfo, setContactInfo] = useState({
    primary: "",
    extra: [] as string[],
    website: "",
    adPhone: "",
  });

  useEffect(() => {
    if (draft) {
      setContactInfo({
        primary: draft.phoneNumbers?.primaryPhone ?? "",
        extra: draft.phoneNumbers?.additionalPhones ?? [],
        website: draft.websiteUri ?? "",
        adPhone: draft.adWordsLocationExtensions?.adPhone ?? "",
      });
    }
  }, [draft]);

  // const addPhone = () => {
  //   const trimmed = phone.trim();
  //   if (trimmed && !contactInfo.extra.includes(trimmed)) {
  //     setContactInfo({
  //       ...contactInfo,
  //       extra: [...contactInfo.extra, trimmed],
  //     });
  //     setPhone("");
  //   }
  // };

  // const removePhone = (index: number) => {
  //   setContactInfo({
  //     ...contactInfo,
  //     extra: contactInfo.extra.filter((_, i) => i !== index),
  //   });
  // };

  const removePhone = (index: number) => {
    setContactInfo((prev: any) => ({
      ...prev,
      extra: prev.extra.filter((_: string, i: number) => i !== index),
    }));
  };

  const updatePhone = (index: number, value: string) => {
    setContactInfo((prev: any) => ({
      ...prev,
      extra: prev.extra.map((p: string, i: number) =>
        i === index ? value : p,
      ),
    }));
  };

  const addPhone = () => {
    setContactInfo((prev: any) => ({
      ...prev,
      extra: [...prev.extra, ""],
    }));
  };

  const commit = () =>
    upd(
      {
        phoneNumbers: {
          primaryPhone: contactInfo.primary,
          additionalPhones: contactInfo.extra,
        },
        websiteUri: contactInfo.website,
        adWordsLocationExtensions: { adPhone: contactInfo.adPhone },
      },
      ["phoneNumbers", "websiteUri", "adWordsLocationExtensions"],
    );
  return (
    <View onBlur={commit}>
      <View
        className="rounded-[32px] p-6 shadow-sm border mb-6"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center mb-6">
          <Feather name="phone" size={20} color={link} />
          <Text className="text-lg font-bold ml-2" style={{ color: text }}>
            Phone Numbers
          </Text>
        </View>

        <View className="mb-6">
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            PRIMARY PHONE <Text style={{ color: link }}>*</Text>
          </Text>
          <View
            className="border rounded-2xl px-4 py-2"
            style={{ borderColor: textMuted }}
          >
            <TextInput
              value={contactInfo.primary}
              onChangeText={(val) =>
                setContactInfo({ ...contactInfo, primary: val })
              }
              keyboardType="phone-pad"
              className="text-base"
              placeholder="+91 00000 00000"
              style={{ color: text }}
            />
          </View>
          <Text className="text-sm mt-2" style={{ color: textMuted }}>
            International format: +91 XXXXX XXXXX.
          </Text>
        </View>

        {/* <View className="mb-6">
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            ADDITIONAL PHONES
          </Text>
          {contactInfo.extra.length !== 0 &&
            contactInfo.extra.map((v, i) => (
              <View
                key={i}
                className="flex-row items-center px-3 py-2 rounded-full border bg-transparent mt-2"
                style={{ borderColor: link }}
              >
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: link }}
                />
                <Text
                  className="text-sm font-medium mr-2"
                  style={{ color: text }}
                >
                  {v}
                </Text>

                <TouchableOpacity onPress={() => removePhone(i)}>
                  <Ionicons
                    name="close-circle-outline"
                    size={14}
                    color={textMuted}
                  />
                </TouchableOpacity>
              </View>
            ))}
          {contactInfo.extra.length < 2 && (
            <TouchableOpacity
              className="border border-dashed rounded-2xl p-4 flex-row items-center justify-center"
              style={{ backgroundColor: link }}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="font-bold ml-1 text-white">Add phone</Text>
            </TouchableOpacity>
          )}
          <Text className="text-sm mt-2" style={{ color: text }}>
            Up to 2 extra numbers.
          </Text>
        </View> */}

        <View className="mb-6">
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            ADDITIONAL PHONES
          </Text>

          {contactInfo.extra.map((v: string, i: number) => (
            <View
              key={i}
              className="flex-row items-center px-3 py-2 rounded-xl border mt-2"
              style={{ borderColor: link }}
            >
              <TextInput
                className="flex-1 text-md font-medium mr-2"
                style={{ color: text }}
                value={v}
                onChangeText={(val) => updatePhone(i, val)}
                placeholder="+91 00000 00000"
                placeholderTextColor={text}
                keyboardType="phone-pad"
              />
              <TouchableOpacity onPress={() => removePhone(i)}>
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={textMuted}
                />
              </TouchableOpacity>
            </View>
          ))}

          {contactInfo.extra.length < 2 && (
            <TouchableOpacity
              className="border border-dashed rounded-2xl p-4 flex-row items-center justify-center mt-3"
              onPress={addPhone}
              style={{ borderColor: link }}
            >
              <Ionicons name="add" size={18} color={link} />
              <Text className="font-bold ml-1" style={{ color: link }}>
                Add phone
              </Text>
            </TouchableOpacity>
          )}

          <Text className="text-sm mt-2" style={{ color: text }}>
            Up to 2 extra numbers.
          </Text>
        </View>

        <View>
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            ADWORDS CALL EXTENSION PHONE
          </Text>
          <View
            className="border rounded-2xl py-2 px-4"
            style={{ borderColor: textMuted }}
          >
            <TextInput
              value={contactInfo.adPhone}
              onChangeText={(val) =>
                setContactInfo({ ...contactInfo, adPhone: val })
              }
              placeholder="+91 00000 00000"
              placeholderTextColor={text}
              keyboardType="phone-pad"
              className="text-base"
              style={{ color: text }}
            />
          </View>
          <Text className="text-sm mt-2" style={{ color: textMuted }}>
            Shown in Google Ads.
          </Text>
        </View>
      </View>
      <View
        className="rounded-[32px] p-6 shadow-sm border"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center mb-6">
          <Ionicons name="globe-outline" size={20} color={link} />
          <Text className="text-lg font-bold ml-2" style={{ color: text }}>
            Website
          </Text>
        </View>

        <View>
          <Text
            className="font-bold text-sm mb-2 tracking-widest uppercase"
            style={{ color: textMuted }}
          >
            WEBSITE URL <Text style={{ color: link }}>*</Text>
          </Text>
          <View
            className="border rounded-2xl px-4 py-2"
            style={{ borderColor: textMuted }}
          >
            <TextInput
              value={contactInfo.website}
              onChangeText={(val) =>
                setContactInfo({ ...contactInfo, website: val })
              }
              autoCapitalize="none"
              keyboardType="url"
              className="text-base"
              placeholder="https://yourwebsite.com"
              style={{ color: text }}
            />
          </View>

          <TouchableOpacity
            className="flex-row items-center mt-3"
            onPress={() => Linking.openURL(contactInfo.website)}
          >
            <Feather name="external-link" size={14} color={link} />
            <Text className="font-bold ml-2 text-sm" style={{ color: link }}>
              Open website
            </Text>
          </TouchableOpacity>

          <Text className="text-sm mt-3" style={{ color: textMuted }}>
            Full URL with https://.
          </Text>
        </View>
      </View>
    </View>
  );
}

function LocationTab({
  draft,
  upd,
}: {
  draft: LocationDraft;
  upd: (p: Partial<LocationDraft>, f: string[]) => void;
}) {
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const green = useColor("green");
  const [area, setArea] = useState("");

  type StorefrontAddress = {
    regionCode: string;
    languageCode: string;
    postalCode: string;
    administrativeArea: string;
    locality: string;
    addressLines: string[];
  };

  type LocationInfo = {
    addr: StorefrontAddress | undefined;
    bizType: "CUSTOMER_LOCATION_ONLY" | "CUSTOMER_AND_BUSINESS_LOCATION" | "";
    areas: any[];
  };

  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    addr: undefined,
    bizType: "",
    areas: [],
  });

  useEffect(() => {
    if (draft) {
      setLocationInfo({
        addr: draft.storefrontAddress ?? undefined,
        bizType: draft.serviceArea?.businessType ?? "",
        areas: draft.serviceArea?.places?.placeInfos ?? [],
      });
    }
  }, [draft]);

  const commit = () =>
    upd(
      {
        storefrontAddress: locationInfo.addr,
        serviceArea: {
          businessType: locationInfo.bizType as
            | "CUSTOMER_LOCATION_ONLY"
            | "CUSTOMER_AND_BUSINESS_LOCATION",
          places: { placeInfos: locationInfo.areas },
        },
      },
      ["storefrontAddress", "serviceArea"],
    );

  return (
    <View onBlur={commit}>
      <View
        className="rounded-[32px] p-6 shadow-sm border mb-6"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center mb-6">
          <Ionicons name="location-outline" size={20} color={link} />
          <Text className="text-lg font-bold ml-2" style={{ color: text }}>
            Storefront Address
          </Text>
        </View>

        {/* Address Lines */}
        <View className="mb-5">
          <Label
            text="ADDRESS LINES"
            required
            txtColor={textMuted}
            link={link}
          />
          {locationInfo.addr?.addressLines.map((add, i) => (
            <View key={i} className="mt-2">
              <Input
                value={add}
                borderColor={textMuted}
                txtColor={text}
                onChange={(v: any) =>
                  setLocationInfo((prev) => ({
                    ...prev,
                    addr: prev.addr
                      ? {
                          ...prev.addr,
                          addressLines: prev.addr.addressLines.map((x, j) =>
                            j === i ? v : x,
                          ),
                        }
                      : undefined,
                  }))
                }
              />
            </View>
          ))}

          <HelperText
            text="Street address. Line 2 for suite/floor."
            txtColor={textMuted}
          />
        </View>

        {/* City & Pin Code Row */}
        <View className="flex-row space-x-4 gap-2 mb-5">
          <View className="flex-1">
            <Label text="CITY" required txtColor={textMuted} link={link} />
            <Input
              value={locationInfo.addr?.locality ?? ""}
              onChange={(val: any) =>
                setLocationInfo((prev) => ({
                  ...prev,
                  addr: prev.addr ? { ...prev.addr, locality: val } : undefined,
                }))
              }
              borderColor={textMuted}
              txtColor={text}
            />
          </View>
          <View className="flex-1">
            <Label text="PIN CODE" required txtColor={textMuted} link={link} />
            <Input
              value={locationInfo.addr?.postalCode}
              keyboardType="numeric"
              borderColor={textMuted}
              txtColor={text}
              onChange={(val: any) =>
                setLocationInfo((prev) => ({
                  ...prev,
                  addr: prev.addr
                    ? { ...prev.addr, postalCode: val }
                    : undefined,
                }))
              }
            />
          </View>
        </View>

        {/* State */}
        <View className="mb-5">
          <Label text="STATE" required txtColor={textMuted} link={link} />
          <Input
            value={locationInfo.addr?.administrativeArea}
            borderColor={textMuted}
            txtColor={text}
            onChange={(val: any) =>
              setLocationInfo((prev) => ({
                ...prev,
                addr: prev.addr
                  ? { ...prev.addr, administrativeArea: val }
                  : undefined,
              }))
            }
          />
        </View>

        {/* Country Code */}
        <View className="mb-2">
          <Label
            text="COUNTRY CODE"
            required
            txtColor={textMuted}
            link={link}
          />
          <Input
            value={locationInfo.addr?.regionCode}
            borderColor={textMuted}
            txtColor={text}
            onChange={(val: any) =>
              setLocationInfo((prev) => ({
                ...prev,
                addr: prev.addr ? { ...prev.addr, regionCode: val } : undefined,
              }))
            }
          />
          <HelperText
            text="ISO 3166-1 alpha-2 (e.g. IN, US, GB)."
            txtColor={textMuted}
          />
        </View>
      </View>

      {/* GPS COORDINATES CARD */}
      <View
        className="rounded-[32px] p-6 shadow-sm border mb-6"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Feather name="send" size={18} color={link} className="rotate-45" />
            <Text className="text-lg font-bold ml-3" style={{ color: text }}>
              GPS Coordinates
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full border"
            style={{
              backgroundColor: green + "30",
              borderColor: green,
            }}
          >
            <Text className="font-bold text-[10px]" style={{ color: green }}>
              Read-only
            </Text>
          </View>
        </View>

        {/* Lat/Long Row */}
        <View className="flex-row space-x-4 mb-5 gap-2">
          <View className="flex-1">
            <Label text="LATITUDE" txtColor={textMuted} link={link} />
            <Input
              value={draft.latlng.latitude.toString()}
              editable={false}
              borderColor={textMuted}
              txtColor={text}
            />
          </View>
          <View className="flex-1">
            <Label text="LONGITUDE" txtColor={textMuted} link={link} />
            <Input
              value={draft.latlng.longitude.toString()}
              editable={false}
              borderColor={textMuted}
              txtColor={text}
            />
          </View>
        </View>

        {/* Map Placeholder */}
        {draft?.latlng.latitude !== 0 && draft?.latlng.longitude !== 0 ? (
          <View
            className="rounded-3xl overflow-hidden border relative"
            style={{ backgroundColor: text }}
            // onTouchMove={}
          >
            <MapView
              style={{ height: 180, width: "100%" }}
              initialRegion={{
                latitude: draft.latlng.latitude,
                longitude: draft.latlng.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: draft.latlng.latitude,
                  longitude: draft.latlng.longitude,
                }}
                title="Business Location"
                description={`${locationInfo.addr?.locality}, ${locationInfo.addr?.administrativeArea}`}
              />
            </MapView>
            <Pressable
              className="absolute top-2 right-2 px-3 py-1 rounded-lg border flex-row items-center"
              style={{ backgroundColor: text, borderColor: link }}
              onPress={() =>
                Linking.openURL(
                  `https://maps.google.com/?q=${draft.latlng.latitude},${draft.latlng.longitude}`,
                )
              }
            >
              <Feather name="external-link" size={12} color={link} />
              <Text className="font-bold text-sm ml-1" style={{ color: link }}>
                Maps
              </Text>
            </Pressable>

            {/* Address pill */}
            <View className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-row items-center px-3 py-0.5 rounded-full border border-gray-400 bg-white shadow-md justify-center">
              <FontAwesome5 name="map-marker-alt" size={14} color="#EF4444" />
              <Text className="text-xs font-bold ml-2 text-black text-center">
                {locationInfo.addr?.locality}{" "}
                {locationInfo.addr?.administrativeArea}
              </Text>
            </View>
          </View>
        ) : (
          <HelperText text="Loading..." txtColor={textMuted} />
        )}

        <HelperText
          text="Coordinates are managed by Google. Use Maps to reposition the pin."
          txtColor={textMuted}
        />
      </View>

      {/* SERVICE AREA PLACES */}
      <View>
        <Text
          className="font-bold text-[11px] mb-4 tracking-widest uppercase px-2"
          style={{ color: textMuted }}
        >
          SERVICE AREA PLACES
        </Text>

        {/* Empty State */}
        {locationInfo.areas.length === 0 ? (
          <View
            className="border border-dashed rounded-2xl p-4 flex-row items-center mb-4"
            style={{
              backgroundColor: textMuted + "20",
              borderColor: textMuted,
            }}
          >
            <Ionicons name="globe-outline" size={18} color={textMuted} />
            <Text className="ml-3 text-sm" style={{ color: textMuted }}>
              No service areas added yet
            </Text>
          </View>
        ) : (
          locationInfo.areas.map((a, i) => {
            const label = (a.name || a.placeId || "").trim();
            if (!label) return null;
            return (
              <View
                key={i}
                className="flex-row items-center px-3 py-2 rounded-full border bg-transparent mb-4"
                style={{ borderColor: link }}
              >
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: link }}
                />
                <Text
                  className="text-sm font-medium mr-2"
                  style={{ color: text }}
                >
                  {label}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setLocationInfo((prev) => ({
                      ...prev,
                      areas: prev.areas.filter((_, j) => j !== i),
                    }))
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={14}
                    color={textMuted}
                  />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Add Field */}
        <View className="flex-row items-center space-x-3 gap-3">
          <View
            className="flex-1 border rounded-2xl px-4 py-1"
            style={{ backgroundColor: textMuted + "30" }}
          >
            <TextInput
              placeholder="Add city or region..."
              placeholderTextColor={textMuted}
              style={{ color: textMuted }}
              cursorColor={link}
              value={area}
              onChangeText={setArea}
            />
          </View>
          <TouchableOpacity
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{ backgroundColor: link }}
            onPress={() => {
              if (area.trim()) {
                setLocationInfo((prev) => ({
                  ...prev,
                  areas: [...prev.areas, { name: area.trim(), placeId: "" }],
                }));
                setArea("");
              }
            }}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
        <HelperText text="Cities or regions you serve." txtColor={textMuted} />
      </View>
    </View>
  );
}

function AdvancedTab({
  draft,
  locationId,
  upd,
}: {
  draft: LocationDraft;
  locationId: string;
  upd: (p: Partial<LocationDraft>, f: string[]) => void;
}) {
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const green = useColor("green");
  const [service, setService] = useState("");
  const [label, setLabel] = useState("");
  type ServiceInfo = {
    services: any[];
    labels: string[];
    chain: string;
    lang: string;
  };

  const [serviceInfo, setServiceInfo] = useState<ServiceInfo>({
    services: [],
    labels: [],
    chain: "",
    lang: "",
  });

  useEffect(() => {
    if (draft) {
      const dedupedSvcs = (draft.serviceItems ?? []).filter((svc, idx, arr) => {
        const key =
          svc.structuredServiceItem?.serviceTypeId ??
          svc.freeFormServiceItem?.label.displayName ??
          "";
        return (
          arr.findIndex(
            (x) =>
              (x.structuredServiceItem?.serviceTypeId ??
                x.freeFormServiceItem?.label.displayName ??
                "") === key,
          ) === idx
        );
      });
      setServiceInfo({
        services: dedupedSvcs,
        labels: draft.labels ?? [],
        chain: draft.relationshipData?.parentChain ?? "",
        lang: draft.languageCode ?? "",
      });
    }
  }, [draft]);

  const commit = () =>
    upd(
      {
        serviceItems: serviceInfo.services,
        labels: serviceInfo.labels,
        languageCode: serviceInfo.lang,
        relationshipData: serviceInfo.chain
          ? { parentChain: serviceInfo.chain }
          : {},
      },
      ["serviceItems", "labels", "languageCode", "relationshipData"],
    );

  function fmtServiceId(raw: string): string {
    if (!raw) return raw;
    const clean = raw
      .replace(/^job_type_id:/i, "")
      .replace(/^gcid:/i, "")
      .replace(/^service_type_id:/i, "");
    return clean
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return (
    <View onBlur={commit}>
      <View
        className="rounded-[32px] p-6 shadow-sm border"
        style={{ backgroundColor: primaryForeground }}
      >
        {/* Header Section */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="file-document-outline"
              size={20}
              style={{ color: link }}
            />
            <Text className="text-lg font-bold ml-2" style={{ color: text }}>
              Service Items
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full border"
            style={{
              borderColor: `${green}50`,
              backgroundColor: `${green}10`,
            }}
          >
            <Text className="font-bold text-[10px]" style={{ color: green }}>
              {serviceInfo.services.length} services
            </Text>
          </View>
        </View>

        <Text className="text-sm mb-6" style={{ color: textMuted }}>
          Services your business offers.
        </Text>

        {/* Tonepills Container */}
        <View className="flex-row flex-wrap gap-2 mb-6">
          {serviceInfo.services.map((item, index) => {
            const isStructured = !!item.structuredServiceItem;
            const rawId = item.structuredServiceItem?.serviceTypeId ?? "";
            const label = isStructured
              ? fmtServiceId(rawId)
              : (item.freeFormServiceItem?.label.displayName ?? "");
            const desc = item.freeFormServiceItem?.label.description ?? "";
            return (
              <View
                key={rawId || label + index}
                className="flex-row items-center px-3 py-2 rounded-full border bg-transparent"
                style={{ borderColor: link }}
              >
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: link }}
                />
                <Text
                  className="text-sm font-medium mr-2"
                  style={{ color: text }}
                >
                  {label}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setServiceInfo((prev) => ({
                      ...prev,
                      services: prev.services.filter((svc) => {
                        const k =
                          svc.structuredServiceItem?.serviceTypeId ??
                          svc.freeFormServiceItem?.label.displayName ??
                          "";
                        return k !== (rawId || label);
                      }),
                    }))
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={14}
                    color={textMuted}
                  />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Example of a muted/inactive style as seen in the mockup */}
          {/* <View
            className="flex-row items-center px-3 py-2 rounded-full"
            style={{ backgroundColor: text }}
          >
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: textMuted }}
            />
            <Text
              className="text-sm font-medium mr-2"
              style={{ color: textMuted }}
            >
              software development
            </Text>
            <Ionicons name="close-circle-outline" size={14} color="#D1D5DB" />
          </View> */}
        </View>

        {/* Input & Add Button */}
        <View className="flex-row items-center">
          <View
            className="flex-1 border rounded-2xl px-4 mr-3"
            style={{ borderColor: textMuted }}
          >
            <TextInput
              placeholder="Add free-form service..."
              placeholderTextColor={textMuted}
              value={service}
              onChangeText={setService}
              className="text-base"
              style={{ color: text }}
            />
          </View>

          <TouchableOpacity
            className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
            style={{ backgroundColor: link }}
            onPress={() => {
              const exists = serviceInfo.services.some(
                (x) =>
                  (x.freeFormServiceItem?.label.displayName ?? "") === service,
              );
              if (!exists) {
                setServiceInfo((prev) => ({
                  ...prev,
                  services: [
                    ...prev.services,
                    {
                      freeFormServiceItem: {
                        category: "",
                        label: { displayName: service },
                      },
                    },
                  ],
                }));
              }
            }}
          >
            <Ionicons name="add" size={20} style={{ color: "white" }} />
          </TouchableOpacity>
        </View>
      </View>

      <View
        className="rounded-[32px] p-6 shadow-sm mt-5 border"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="pound"
              size={20}
              style={{ color: link }}
            />
            <Text className="text-lg font-bold ml-2" style={{ color: text }}>
              Internal Labels
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full border"
            style={{
              borderColor: `${green}50`,
              backgroundColor: `${green}10`,
            }}
          >
            <Text className="font-bold text-[10px]" style={{ color: green }}>
              labels
            </Text>
          </View>
        </View>

        <Text className="text-sm mb-6 uppercase" style={{ color: textMuted }}>
          Labels
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {serviceInfo.labels.map((item, index) => (
            <View
              key={index}
              className="flex-row items-center px-3 py-2 rounded-full border bg-transparent"
              style={{ borderColor: link }}
            >
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: link }}
              />
              <Text
                className="text-sm font-medium mr-2"
                style={{ color: text }}
              >
                {item}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setServiceInfo((prev) => ({
                    ...prev,
                    labels: prev.labels.filter((lbl) => lbl !== item),
                  }))
                }
              >
                <Ionicons
                  name="close-circle-outline"
                  size={14}
                  color={textMuted}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View className="flex-row items-center">
          <View
            className="flex-1 border rounded-2xl px-4 mr-3"
            style={{ borderColor: textMuted }}
          >
            <TextInput
              placeholder="Add label..."
              placeholderTextColor={textMuted}
              value={label}
              onChangeText={setLabel}
              className="text-base"
              style={{ color: text }}
            />
          </View>

          <TouchableOpacity
            className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
            style={{ backgroundColor: link }}
            onPress={() => {
              const exists = serviceInfo.labels.includes(label);
              if (!exists) {
                setServiceInfo((prev) => ({
                  ...prev,
                  labels: [...prev.labels, label],
                }));
              }
            }}
          >
            <Ionicons name="add" size={20} style={{ color: "white" }} />
          </TouchableOpacity>
        </View>
        <Text className="text-sm mt-3" style={{ color: textMuted }}>
          Not shown to customers. For internal organization. Max 10.
        </Text>
      </View>

      {/* --- CHAIN AFFILIATION CARD --- */}
      <View className="mt-5"></View>
      <Card bgColor={primaryForeground}>
        <CardHeader
          icon="link-variant"
          title="Chain Affiliation"
          badge="relationshipData"
          badgeColor={green}
          titleColor={text}
          iconColor={link}
        />
        <Label text="PARENT CHAIN" txtColor={text} />
        <Input
          value={serviceInfo.chain}
          placeholder="chains/{chainId}"
          onChange={(val: any) =>
            setServiceInfo({ ...serviceInfo, chain: val })
          }
          txtColor={text}
          borderColor={textMuted}
        />
        <HelperText text="chains/{chainId} format." txtColor={textMuted} />
      </Card>

      {/* --- LANGUAGE CARD --- */}
      <Card bgColor={primaryForeground}>
        <CardHeader
          icon="earth"
          title="Language"
          badgeColor={green}
          titleColor={text}
          iconColor={link}
        />
        <Label text="LANGUAGE CODE" txtColor={text} required />
        <Input
          value={serviceInfo.lang}
          borderColor={textMuted}
          txtColor={text}
          onChange={(val: any) => setServiceInfo({ ...serviceInfo, lang: val })}
        />
        <HelperText
          text="BCP 47 tag (e.g. en, en-IN, hi)."
          txtColor={textMuted}
        />
      </Card>

      {/* --- PROFILE METADATA CARD --- */}
      <Card last bgColor={primaryForeground}>
        <CardHeader
          icon="chart-bar"
          title="Profile Metadata"
          badge="Read-only"
          badgeColor={green}
          titleColor={text}
          iconColor={link}
        />

        <MetadataRow
          label="LOCATION RESOURCE NAME"
          value={`locations/${locationId}`}
          linkColor={link}
          labelColor={text}
        />
        <MetadataRow
          label="MAPS URI"
          value={`https://maps.google.com/?cid=${locationId}`}
          isLink
          linkColor={link}
          labelColor={text}
        />
        <MetadataRow
          label="NEW REVIEW URI"
          value={`https://search.google.com/local/writereview?placeid=${locationId}`}
          isLink
          linkColor={link}
          labelColor={text}
        />
      </Card>
    </View>
  );
}

function HoursTab({
  draft,
  upd,
}: {
  draft: LocationDraft;
  upd: (p: Partial<LocationDraft>, f: string[]) => void;
}) {
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const green = useColor("green");
  const buildMap = (periods: TimePeriod[]) => {
    const m: Record<string, TimePeriod | null> = {};
    DAYS.forEach((d) => {
      m[d] = periods.find((p) => p.openDay === d) ?? null;
    });
    return m;
  };

  type HoursInfo = {
    dayMap: Record<string, TimePeriod | null>;
    special: any[];
    more: any[];
    morePanel: boolean;
  };
  const [hoursInfo, setHoursInfo] = useState<HoursInfo>({
    dayMap: buildMap(draft.regularHours?.periods ?? []),
    special: draft.specialHours?.specialHourPeriods ?? [],
    more: draft.moreHours ?? [],
    morePanel: false,
  });
  useEffect(() => {
    if (draft) {
      setHoursInfo({
        dayMap: buildMap(draft.regularHours?.periods ?? []),
        special: draft.specialHours?.specialHourPeriods ?? [],
        more: draft.moreHours ?? [],
        morePanel: false,
      });
    }
  }, [draft]);
  return (
    <View>
      {/* REGULAR HOURS CARD */}
      <View className="rounded-[32px] p-6">
        <View className="flex-row items-center mb-6">
          <Ionicons name="time-outline" size={18} color={link} />
          <Text className="text-lg font-bold ml-2" style={{ color: text }}>
            Regular Hours
          </Text>
        </View>

        {DAYS.map((day, index) => {
          const p = hoursInfo.dayMap[day];
          const open = p !== null;
          return (
            <View key={day} className={`${!open && "opacity-60"}`}>
              <View className="flex-row items-center justify-start">
                <Text
                  className="font-medium w-12 text-base"
                  style={{ color: open ? text : textMuted }}
                >
                  {DSHRT[day]}
                </Text>

                <Switch
                  value={open}
                  onValueChange={(v) =>
                    setHoursInfo((prev) => ({
                      ...prev,
                      dayMap: {
                        ...prev.dayMap,
                        [day]: v
                          ? {
                              openDay: day,
                              closeDay: day,
                              openTime: "09:00",
                              closeTime: "18:00",
                            }
                          : null,
                      },
                    }))
                  }
                  trackColor={{ false: "#D1D5DB", true: link }}
                  thumbColor={"#FFFFFF"}
                  ios_backgroundColor="#D1D5DB"
                />

                {!open && (
                  <Text
                    className="font-medium text-sm w-24 text-right"
                    style={{ color: textMuted }}
                  >
                    Closed
                  </Text>
                )}
              </View>

              {/* {day.open && ( */}
              <View className="flex-row items-center justify-start space-x-3 gap-5">
                <TimePickerButton
                  // label={day.start}
                  // disabled={!day.open}
                  color={link}
                  txtColor={text}
                />
                <Ionicons name="arrow-forward-outline" size={16} color={text} />
                <TimePickerButton
                  // label={day.end}
                  // disabled={!day.open}
                  color={link}
                  txtColor={text}
                />
              </View>
              {/* )} */}
              <View
                className="h-[0.6px] my-5"
                style={{ backgroundColor: textMuted + "40" }}
              ></View>
            </View>
          );
        })}
      </View>

      {/* MORE HOURS CARD */}
      <View
        className="rounded-[32px] p-6 shadow-sm border mb-6"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={18} color={link} />
            <Text className="text-lg font-bold ml-2" style={{ color: text }}>
              More Hours
            </Text>
          </View>
          <View
            className="px-3 py-0.5 rounded-full border"
            style={{
              backgroundColor: green + "30",
              borderColor: green,
            }}
          >
            <Text className="font-bold text-xs" style={{ color: green }}>
              0 types
            </Text>
          </View>
        </View>

        <Text className="text-[13px] mb-4" style={{ color: textMuted }}>
          Add separate hours for delivery, drive-through, etc.
        </Text>

        <DashedActionButton
          label="Add hours type"
          color={link}
          // onPress={() => setAddHoursOpen(!addHoursOpen)}
        />
        {/* {addHoursOpen && (
          <View className="my-2">
            {moreHours.map((hour) => (
              <TonePill key={hour} label={hour} />
            ))}
          </View>
        )} */}
      </View>

      {/* SPECIAL HOURS CARD */}
      <View
        className="rounded-[32px] p-6 shadow-sm border"
        style={{ backgroundColor: primaryForeground }}
      >
        <View className="flex-row items-center mb-6">
          <Feather name="star" size={18} color={link} />
          <Text className="text-lg font-bold ml-2" style={{ color: text }}>
            Special Hours
          </Text>
        </View>

        <Text className="text-[13px] mb-4" style={{ color: textMuted }}>
          Override hours for holidays or temporary closures.
        </Text>

        <DashedActionButton
          label="Add special date"
          color={link}
          onPress={() => {}}
        />
      </View>
    </View>
  );
}

function AttributesTab() {
  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const green = useColor("green");
  const [a, setA] = useState({
    wheelchair_accessible_entrance: false,
    wheelchair_accessible_seating: false,
    wheelchair_accessible_restroom: false,
    wheelchair_accessible_parking: false,
    assistive_hearing_loop: false,
    lgbtq_friendly: false,
    transgender_safe: false,
    women_led: false,
    accepts_cash: true,
    accepts_credit_cards: true,
    accepts_debit_cards: true,
    accepts_nfc_payment: false,
    has_online_care: false,
    appointment_required: true,
    online_appointments: true,
    onsite_services: true,
    parking_free_street: true,
    parking_free_lot: true,
    parking_paid_lot: false,
    parking_free_garage: false,
    parking_paid_garage: false,
    parking_valet: false,
    free_wifi: false,
    paid_wifi: false,
    no_wifi: false,
  });
  const t = (k: string) => setA((x) => ({ ...x, [k]: !(x as any)[k] }));

  const SECS = [
    {
      title: "Accessibility",
      icon: "people-outline",
      rows: [
        {
          k: "wheelchair_accessible_entrance",
          l: "Wheelchair-accessible entrance",
        },
        {
          k: "wheelchair_accessible_seating",
          l: "Wheelchair-accessible seating",
        },
        {
          k: "wheelchair_accessible_restroom",
          l: "Wheelchair-accessible restroom",
        },
        {
          k: "wheelchair_accessible_parking",
          l: "Wheelchair-accessible parking",
        },
        { k: "assistive_hearing_loop", l: "Assistive hearing loop" },
      ],
    },
    {
      title: "Inclusivity",
      icon: "star-outline",
      rows: [
        { k: "lgbtq_friendly", l: "LGBTQ+ friendly" },
        { k: "transgender_safe", l: "Transgender safe space" },
        { k: "women_led", l: "Women-led" },
      ],
    },
    {
      title: "Payments",
      icon: "card-outline",
      rows: [
        { k: "accepts_cash", l: "Cash" },
        { k: "accepts_credit_cards", l: "Credit cards" },
        { k: "accepts_debit_cards", l: "Debit cards" },
        { k: "accepts_nfc_payment", l: "Contactless / UPI" },
      ],
    },
    {
      title: "Service Options",
      icon: "settings-outline",
      rows: [
        { k: "onsite_services", l: "On-site services" },
        { k: "online_appointments", l: "Online appointments" },
        { k: "appointment_required", l: "Appointment required" },
        { k: "has_online_care", l: "Online care" },
      ],
    },
    {
      title: "Parking",
      icon: "car-outline",
      rows: [
        { k: "parking_free_street", l: "Free street" },
        { k: "parking_free_lot", l: "Free lot" },
        { k: "parking_paid_lot", l: "Paid lot" },
        { k: "parking_free_garage", l: "Free garage" },
        { k: "parking_paid_garage", l: "Paid garage" },
        { k: "parking_valet", l: "Valet" },
      ],
    },
    {
      title: "Wi-Fi",
      icon: "wifi",
      rows: [
        { k: "free_wifi", l: "Free Wi-Fi" },
        { k: "paid_wifi", l: "Paid Wi-Fi" },
        { k: "no_wifi", l: "No Wi-Fi" },
      ],
    },
  ];
  return (
    <View>
      {SECS.map((sec) => (
        <View
          key={sec.title}
          className="rounded-[32px] p-6 shadow-sm border mb-6"
          style={{ backgroundColor: primaryForeground }}
        >
          <SectionHeader
            iconName={sec.icon}
            title={sec.title}
            iconType="Ionicons"
            titleColor={text}
            iconColor={link}
          />
          {sec.rows.map((row) => (
            <ToggleRow
              key={row.k}
              label={row.l}
              inactiveColor={textMuted + "90"}
              textColor={text}
              color={link}
              active={(a as any)[row.k]}
              borderColor={textMuted + "30"}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

async function patchLocation(
  locationId: string,
  payload: any,
  fields: string[],
) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  console.log("opening Date missing: ", payload?.openInfo?.openingDate);

  // Strip empty openingDate
  const filteredFields = fields.filter((f) => {
    if (f === "openInfo.openingDate" && !payload?.openInfo?.openingDate)
      return false;
    if (f === "profile.description" && !payload?.profile?.description)
      return false;
    return true;
  });

  // Sanitize categories — Google only wants { name } not displayName
  if (payload.categories) {
    payload.categories = {
      primaryCategory: { name: payload.categories.primaryCategory?.name },
      additionalCategories: (payload.categories.additionalCategories || []).map(
        (c: any) => ({
          name: c.name,
        }),
      ),
    };
  }

  console.log(
    "locationId: ",
    locationId,
    " payload: ",
    payload,
    " fields: ",
    fields,
  );

  const res = await fetch(`${FRONTEND_URL}/api/google/locations/update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ locationId, payload, fields: filteredFields }),
  });
  const data = await res.json();
  console.log("Data from patchLocation: ", data);

  if (!res.ok) throw new Error(data.error || "Save failed");
  return data;
}

export default function EditBusinessScreen() {
  // const [status, setStatus] = useState("open");
  // const [date, setDate] = useState(new Date());
  // const [showPicker, setShowPicker] = useState(false);
  const [active, setActive] = useState("About");
  // const [addHoursOpen, setAddHoursOpen] = useState(false);
  const { data: userData, isLoading: userLoading } = useUser();
  const userFromRedux = useSelector((state: RootState) => state.auth.user);
  const user = userData ?? userFromRedux;
  // const [inputValue, setInputValue] = useState("");
  // const [labelValue, setLabelValue] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [draft, setDraft] = useState<LocationDraft>(EMPTY_DRAFT);
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%"], []);

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

  const link = useColor("link");
  const primaryForeground = useColor("primaryForeground");
  const text = useColor("text");
  const green = useColor("green");
  // const yellow = useColor("yellow");
  const red = useColor("red");
  const textMuted = useColor("textMuted");

  const router = useRouter();

  const pending = useRef<{ payload: Partial<LocationDraft>; fields: string[] }>(
    { payload: {}, fields: [] },
  );

  function accumulate(partial: Partial<LocationDraft>, fields: string[]) {
    pending.current.payload = { ...pending.current.payload, ...partial };
    pending.current.fields = [
      ...new Set([...pending.current.fields, ...fields]),
    ];
    setDraft((d) => ({ ...d, ...partial }));
  }

  const saveMut = useMutation({
    mutationFn: () =>
      patchLocation(locationId, { ...pending.current.payload }, [
        ...pending.current.fields,
      ]),
    onMutate: () => setSaveStatus("saving"),
    onSuccess: () => {
      setSaveStatus("saved");
      pending.current = { payload: {}, fields: [] };
      setTimeout(() => setSaveStatus("idle"), 2800);
    },
    onError: () => {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    },
  });

  const businessProfileId = user?.googleLocationId || "";
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(businessProfileId);
  };

  // const descriptionText =
  //   "Vaishali Hotel – Pure Veg Family Restaurant\n\nWelcome to Vaishali Hotel, a beloved pure vegetarian restaurant known for its delicious flavours, homely vibes, and warm hospitality. Located in the heart of the city...";

  const locationId = user?.googleLocationId || "";
  const locationName = user?.googleLocationName || "";
  // console.log("Location Id: ", locationId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["googleLocation", locationId],
    queryFn: () => fetchGoogleLocation(locationId),
    enabled: !!locationId,
  });

  useEffect(() => {
    if (data) {
      setDraft((prev) => mapApiToDraft(data.data, prev));
    }
  }, [data]);
  // console.log("Draft: ", draft);

  if (isLoading) return <ActivityIndicator size="large" className="mt-10" />;

  if (isError) router.replace("/(auth)/login");

  // return (
  //   <Text className="text-red-500">Error fetching location details</Text>
  // );

  // const locationData = data?.data;
  // console.log(
  //   "Data from the locations api to get the locationDetails: ",
  //   locationData,
  // );

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1">
        <ScrollView className="flex-1 px-6 py-8">
          {/* Header Section */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center flex-shrink">
              <TouchableOpacity
                className="rounded-xl mr-3"
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={20} color={link} />
              </TouchableOpacity>
              <View className="flex-shrink-0">
                <Text className="text-xl font-bold" style={{ color: text }}>
                  Business Information
                </Text>
                <Text
                  numberOfLines={2}
                  className="text-xs w-1/2"
                  style={{ color: textMuted }}
                >
                  {userLoading
                    ? "Loading..."
                    : locationName || "Google Business Profile"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center flex-shrink-0">
              <TouchableOpacity
                className="p-2 rounded-xl mr-2"
                style={{ backgroundColor: textMuted + "40" }}
                onPress={() => sheetRef.current?.expand()}
              >
                <Ionicons name="settings-outline" size={20} color="gray" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center px-4 py-2 rounded-xl shadow-sm"
                style={{ backgroundColor: link }}
                onPress={() => saveMut.mutate()}
                disabled={saveMut.isPending || isLoading || !locationId}
              >
                <Ionicons
                  name={
                    saveStatus === "idle"
                      ? "save-outline"
                      : saveStatus === "saving"
                        ? "time-outline"
                        : saveStatus === "saved"
                          ? "checkmark-circle-outline"
                          : "alert-circle-outline"
                  }
                  size={18}
                  color="white"
                />
                <Text className="text-white font-bold ml-2">
                  {saveStatus === "idle"
                    ? "Save"
                    : saveStatus === "saving"
                      ? "Saving..."
                      : saveStatus === "saved"
                        ? "Saved"
                        : "Error"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Connection Status Card */}
          {!userLoading && user && (
            <View
              className="border rounded-2xl p-4 flex-row items-center justify-between mb-6"
              style={{
                backgroundColor: primaryForeground,
                borderColor: link + "40",
              }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="p-2 rounded-full shadow-sm"
                  style={{ backgroundColor: textMuted + "30" }}
                >
                  <GoogleG />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className="font-bold w-3/4 text-sm"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ color: link, flexShrink: 1 }}
                  >
                    {user?.googleLocationName}
                  </Text>
                  <Text className="text-sm" style={{ color: textMuted }}>
                    ID: {user?.googleLocationId || "N/A"}
                  </Text>
                </View>
              </View>
              <View
                className="px-3 py-1 rounded-full border"
                style={{ backgroundColor: green + "30", borderColor: green }}
              >
                <Text className="font-bold text-xs" style={{ color: green }}>
                  Connected
                </Text>
              </View>
            </View>
          )}

          {/* Tabs */}
          <ScrollView
            horizontal
            contentContainerStyle={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 24,
            }}
            showsHorizontalScrollIndicator={false}
          >
            {tabs.map((cat) => (
              <TonePill
                key={cat.label}
                label={cat.label}
                activeColor={link}
                textColor={text}
                icon={cat.icon}
                active={cat.label === active}
                onPress={() => setActive(cat.label)}
              />
            ))}
          </ScrollView>

          {!isLoading && locationId && active === "About" && draft && (
            <AboutTab draft={draft} upd={accumulate} />
          )}

          {!isLoading && locationId && active === "Contact" && draft && (
            <ContactTab draft={draft} upd={accumulate} />
          )}

          {!isLoading && locationId && active === "Location" && (
            <LocationTab draft={draft} upd={accumulate} />
          )}

          {!isLoading && locationId && active === "Hours" && (
            <HoursTab draft={draft} upd={accumulate} />
          )}

          {!isLoading && locationId && active === "Attributes" && (
            <AttributesTab />
          )}

          {!isLoading && locationId && active === "Advanced" && (
            <AdvancedTab
              draft={draft}
              locationId={locationId}
              upd={accumulate}
            />
          )}

          {/* FOOTER SECTION */}
          <View className="mt-8 mb-5 py-10 px-2">
            <View
              className="h-[1.5px] w-full mb-6"
              style={{ backgroundColor: primaryForeground }}
            />

            <Text
              className="text-center text-[11px] leading-5"
              style={{ color: textMuted }}
            >
              Changes are sent to Google Business Profile via the Business
              Information API (v1). Updates may take a few minutes to reflect on
              Search & Maps.
            </Text>

            <TouchableOpacity
              className="flex-row items-center justify-center mt-4 py-2"
              onPress={() => Linking.openURL("https://business.google.com")}
            >
              <Feather name="external-link" size={16} color={link} />
              <Text className="font-bold ml-2 text-sm" style={{ color: link }}>
                Open Google Business Profile
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ backgroundColor: textMuted, width: 40 }}
          backgroundStyle={{
            borderRadius: 40,
            backgroundColor: primaryForeground,
          }}
        >
          <BottomSheetView className="flex-1 p-6">
            {/* Header */}
            <View className="mb-6">
              <Text className="text-2xl font-extrabold" style={{ color: text }}>
                Profile Settings
              </Text>
              <Text className="text-sm mt-1" style={{ color: textMuted }}>
                {user?.googleLocationName}
              </Text>
            </View>

            {/* Business Profile ID Card */}
            <View
              className="border rounded-3xl p-5 flex-row items-center justify-between mb-4"
              style={{ backgroundColor: link + "20", borderColor: link + "30" }}
            >
              <View>
                <Text
                  className="font-bold text-sm tracking-widest uppercase mb-1"
                  style={{ color: textMuted }}
                >
                  Business Profile ID
                </Text>
                <Text className="font-bold" style={{ color: link }}>
                  {user?.googleLocationId}
                </Text>
              </View>
              <TouchableOpacity
                className="p-2 rounded-2xl"
                style={{ backgroundColor: link + "30" }}
                onPress={copyToClipboard}
              >
                <Ionicons name="copy-outline" size={18} color={link} />
              </TouchableOpacity>
            </View>

            {/* Open in Google Card */}
            <Pressable
              className="border rounded-3xl p-5 flex-row items-center justify-between mb-6"
              style={{ backgroundColor: link + "20", borderColor: link + "30" }}
              onPress={() =>
                Linking.openURL(
                  `https://business.google.com/edit/l/${businessProfileId}`,
                )
              }
            >
              <View className="flex-row items-center">
                <View
                  className="p-2 rounded-2xl mr-3"
                  style={{ backgroundColor: link + "30" }}
                >
                  <Ionicons name="globe-outline" size={20} color={link} />
                </View>
                <View>
                  <Text className="font-bold" style={{ color: link }}>
                    Open in Google Business
                  </Text>
                  <Text className="text-sm" style={{ color: textMuted }}>
                    business.google.com
                  </Text>
                </View>
              </View>
              <Feather name="external-link" size={18} color={link} />
            </Pressable>

            {/* Settings Menu List */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <MenuOption
                icon="people-outline"
                title="People & Access"
                subtitle="Add or remove managers"
                txtColor={text}
                subColor={textMuted}
              />
              <MenuOption
                icon="settings-outline"
                title="Advanced Settings"
                subtitle="Profile ID, store codes"
                iconColor="#A855F7"
                iconBg="#F5F3FF"
                txtColor={text}
                subColor={textMuted}
              />
              <MenuOption
                icon="link-outline"
                title="Linked Accounts"
                subtitle="Google Ads, Merchant"
                iconColor="#22C55E"
                iconBg="#F0FDF4"
                txtColor={text}
                subColor={textMuted}
              />
              <MenuOption
                icon="chatbubble-outline"
                title="Manage Reviews"
                subtitle="Reply & flag reviews"
                iconColor="#F59E0B"
                iconBg="#FFFBEB"
                txtColor={text}
                subColor={textMuted}
              />
              <MenuOption
                icon="trash-outline"
                title="Remove Profile"
                subtitle="Mark closed or delete"
                iconColor={red}
                iconBg={red}
                isLast
                txtColor={text}
                subColor={textMuted}
                dangerColor={red}
              />
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const StatusOption = ({ label, selected, onPress, activeColor, text }: any) => {
  // Use a default gray if not selected
  const themeColor = selected ? activeColor : text;
  const textColor = selected ? activeColor : text;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center border rounded-2xl p-4 mt-3"
      style={{
        backgroundColor: selected ? `${activeColor}15` : "transparent",
        borderColor: selected ? activeColor : "#E5E7EB",
      }}
    >
      <View
        className="w-5 h-5 rounded-full border-2 items-center justify-center"
        style={{ borderColor: themeColor }}
      >
        {selected && (
          <View
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: activeColor }}
          />
        )}
      </View>
      <Text className="ml-3 text-base font-medium" style={{ color: textColor }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const TonePill = ({
  label,
  active,
  onPress,
  activeColor,
  textColor,
  icon,
}: any) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center justify-center px-2 py-1.5 rounded-lg border gap-2`}
    style={{
      backgroundColor: active ? activeColor : "transparent",
      borderColor: active ? activeColor : textColor,
    }}
  >
    {icon && <Ionicons name={icon} color={textColor} size={18} />}
    <Text
      className={`font-black text-xs text-center`}
      style={{ color: active ? "white" : textColor }}
    >
      {label}
    </Text>
  </Pressable>
);

const Label = ({ text, required, txtColor, link }: any) => (
  <Text
    className="font-bold text-sm mb-2 tracking-widest uppercase"
    style={{ color: txtColor }}
  >
    {text} {required && <Text style={{ color: link }}>*</Text>}
  </Text>
);

const Input = ({ borderColor, value, txtColor, onChange, ...props }: any) => (
  <View
    className="border rounded-2xl px-4 py-1"
    style={{ borderColor: borderColor }}
  >
    <TextInput
      className="text-base"
      value={value}
      onChangeText={onChange}
      {...props}
      style={{ color: txtColor }}
      cursorColor={txtColor}
      placeholderTextColor={txtColor}
    />
  </View>
);

const HelperText = ({ text, txtColor }: any) => (
  <Text className="text-sm mt-2 leading-4" style={{ color: txtColor }}>
    {text}
  </Text>
);

const TimePickerButton = ({
  label,
  disabled,
  color,
  txtColor,
  onChange,
}: any) => {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  return (
    <View>
      <TouchableOpacity
        className="border rounded-xl flex-row items-center px-4 py-2.5"
        disabled={disabled}
        style={{
          backgroundColor: !disabled ? color + "50" : "",
          borderColor: color,
        }}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="time-outline" size={14} color={txtColor} />
        <Text
          className="font-bold ml-2 text-sm"
          style={{ color: !disabled ? txtColor : "" }}
        >
          {label ||
            time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="slide">
        <View className="flex-1 justify-center bg-black/30">
          <View className="bg-white mx-5 rounded-xl p-4">
            {/* <DateTimePicker
              value={time}
              mode="time"
              display="spinner"
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  setTime(selectedDate);
                  onChange?.(selectedDate);
                }
              }}
            /> */}
            <TouchableOpacity
              className="mt-3 self-end"
              onPress={() => setOpen(false)}
            >
              <Text className="text-blue-600 font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DashedActionButton = ({ label, color, onPress }: any) => (
  <TouchableOpacity
    className="rounded-2xl p-4 border border-dashed flex-row items-center justify-center"
    style={{ borderColor: color }}
  >
    <Ionicons name="add" size={18} color={color} />
    <Text className="font-bold ml-1" style={{ color: color }}>
      {label}
    </Text>
  </TouchableOpacity>
);

const SectionHeader = ({
  iconName,
  iconType,
  title,
  iconColor,
  titleColor,
}: any) => (
  <View className="flex-row items-center justify-between mb-2">
    <View className="flex-row items-center">
      {iconType === "Ionicons" ? (
        <Ionicons name={iconName} size={20} color={iconColor} />
      ) : (
        <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
      )}
      <Text className="text-lg font-bold ml-2" style={{ color: titleColor }}>
        {title}
      </Text>
    </View>
  </View>
);

const ToggleRow = ({
  label,
  borderColor,
  textColor,
  color,
  inactiveColor,
  last = false,
  active = false,
}: any) => {
  const [isEnabled, setIsEnabled] = useState(active);
  return (
    <View
      className={`flex-row items-center justify-between py-1 ${!last ? "border-b" : ""}`}
      style={{ borderColor: borderColor }}
    >
      <Text className="text-md font-medium flex-1" style={{ color: textColor }}>
        {label}
      </Text>
      <Switch
        trackColor={{ false: inactiveColor, true: color }}
        thumbColor={inactiveColor}
        ios_backgroundColor={inactiveColor}
        onValueChange={() => setIsEnabled(!isEnabled)}
        value={isEnabled}
      />
    </View>
  );
};

const Card = ({ children, last, bgColor }: any) => (
  <View
    className={`rounded-[32px] p-6 shadow-sm ${last ? "mb-0" : "mb-6"}`}
    style={{ backgroundColor: bgColor }}
  >
    {children}
  </View>
);

const CardHeader = ({
  icon,
  title,
  badge,
  badgeColor,
  titleColor,
  iconColor,
}: any) => (
  <View className="flex-row items-center justify-between mb-6">
    <View className="flex-row items-center">
      <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      <Text className="text-lg font-bold ml-2" style={{ color: titleColor }}>
        {title}
      </Text>
    </View>
    {badge && (
      <View
        className={`px-3 py-1 rounded-full border`}
        style={{ backgroundColor: badgeColor + 20, borderColor: badgeColor }}
      >
        <Text
          className={`font-bold text-[10px] `}
          style={{ color: badgeColor }}
        >
          {badge}
        </Text>
      </View>
    )}
  </View>
);

const MetadataRow = ({ label, linkColor, value, isLink, labelColor }: any) => (
  <View className="mb-4">
    <Text
      className="font-bold text-[10px] mb-1 tracking-widest uppercase"
      style={{ color: labelColor }}
    >
      {label}
    </Text>
    <Text
      className={`text-sm font-medium `}
      numberOfLines={1}
      style={{ color: isLink ? linkColor : labelColor }}
    >
      {value}
    </Text>
  </View>
);

const MenuOption = ({
  icon,
  title,
  subtitle,
  iconColor = "#3B82F6",
  dangerColor,
  isLast,
  txtColor,
  subColor,
}: any) => (
  <TouchableOpacity className={`flex-row items-center justify-between py-4 `}>
    <View className="flex-row items-center">
      <View
        style={{ backgroundColor: iconColor + "20" }}
        className="p-3 rounded-2xl mr-4"
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View>
        <Text
          className={`text-base font-bold`}
          style={{ color: isLast ? dangerColor : txtColor }}
        >
          {title}
        </Text>
        <Text className="text-sm" style={{ color: subColor }}>
          {subtitle}
        </Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
  </TouchableOpacity>
);
