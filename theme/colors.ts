import { Platform } from "react-native";

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const darkColors = {
  // Base colors
  // background: "#180322",
  background: "#101015",
  foreground: "#000000",

  // Card colors
  card: "#F2F2F7",
  cardForeground: "#000000",

  // Popover colors
  popover: "#F2F2F7",
  popoverForeground: "#000000",

  // Primary colors
  // primary: "#18181b",
  // primaryForeground: "#FFFFFF",
  primary: "#101015",
  // primaryForeground: "#2B033D",
  primaryForeground: "#2a0e45",

  // Secondary colors
  secondary: "#2a0e45",
  // secondaryForeground: "#18181b",

  // Muted colors
  muted: "#78788033",
  mutedForeground: "#71717a",

  // Accent colors
  accent: "#F2F2F7",
  accentForeground: "#18181b",

  // Destructive colors
  destructive: "#ef4444",
  destructiveForeground: "#FFFFFF",

  // Border and input
  // border: "#C6C6C8",
  border: "#3F045B",
  input: "#e4e4e7",
  ring: "#a1a1aa",

  // For links
  link: "#9f57f5",

  // Text colors
  text: "#fff",
  // textMuted: "#71717a",
  textMuted: "#c4c4c8",

  // Legacy support for existing components
  tint: "#18181b",
  icon: "#71717a",
  // tabIconDefault: "#71717a",
  tabIconDefault: "#530677",
  tabIconSelected: "#18181b",

  // For checkbox
  strokeColor: "#a4a4ab",

  // Default buttons, links, Send button, selected tabs
  blue: "#007AFF",

  // Success states, FaceTime buttons, completed tasks
  green: "#34C759",

  // Delete buttons, error states, critical alerts
  // red: "#FF3B30",
  red: "#b00000",

  // VoiceOver highlights, warning states
  orange: "#FF9500",

  // Notes app accent, Reminders highlights
  yellow: "#FFCC00",

  // Pink accent color for various UI elements
  pink: "#FF2D92",

  // Purple accent for creative apps and features
  purple: "#AF52DE",

  // Teal accent for communication features
  teal: "#5AC8FA",

  // Indigo accent for system features
  indigo: "#5856D6",
};

export const lightColors = {
  // Base colors
  background: "#fff",
  foreground: "#101015",

  // Card colors
  card: "#1C1C1E",
  cardForeground: "#FFFFFF",

  // Popover colors
  popover: "#18181b",
  popoverForeground: "#FFFFFF",

  // Primary colors
  primary: "#fff",
  primaryForeground: "#fff",

  // Secondary colors
  secondary: "#1C1C1E",
  secondaryForeground: "#FFFFFF",

  // For links
  link: "#9f57f5",

  // Muted colors
  muted: "#78788033",
  mutedForeground: "#a1a1aa",

  // Accent colors
  accent: "#1C1C1E",
  accentForeground: "#FFFFFF",

  // Destructive colors
  destructive: "#dc2626",
  destructiveForeground: "#FFFFFF",

  // Border and input - using alpha values for better blending
  // border: "#38383A",
  border: "#a1a1aa",
  input: "rgba(255, 255, 255, 0.15)",
  ring: "#71717a",

  // Text colors
  text: "#000",
  textMuted: "#8a8a92",
  // text: "#000000",
  // textMuted: "#c4c4c8",

  // For checkbox
  strokeColor: "#000",

  // Legacy support for existing components
  tint: "#FFFFFF",
  icon: "#a1a1aa",
  tabIconDefault: "#a1a1aa",
  tabIconSelected: "#FFFFFF",

  // Default buttons, links, Send button, selected tabs
  blue: "#0A84FF",

  // Success states, FaceTime buttons, completed tasks
  green: "#30D158",

  // Delete buttons, error states, critical alerts
  // red: "#FF453A",
  red: "#b00000",

  // VoiceOver highlights, warning states
  orange: "#FF9F0A",

  // Notes app accent, Reminders highlights
  yellow: "#FFD60A",

  // Pink accent color for various UI elements
  pink: "#FF375F",

  // Purple accent for creative apps and features
  purple: "#BF5AF2",

  // Teal accent for communication features
  teal: "#64D2FF",

  // Indigo accent for system features
  indigo: "#5E5CE6",
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};
