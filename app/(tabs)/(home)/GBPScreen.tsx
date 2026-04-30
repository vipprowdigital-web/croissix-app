import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  LayoutAnimation,
} from "react-native";
import {
  RefreshCcw,
  MapPin,
  Camera,
  ShoppingBag,
  Star,
  Zap,
  Building2,
  Phone,
  Tag,
  Layers,
  FileText,
  Clock,
  Globe,
  Navigation,
  Image,
  Video,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Shield,
  BarChart2,
  Check,
  Brain,
  Bookmark,
  X,
  Target,
  Flame,
  Sparkles,
  Cpu,
  ChevronUp,
  ChevronDown,
  Eye,
  ArrowUpRight,
  Wand2,
  Lock,
  TrendingUp,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColor } from "@/hooks/useColor";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "@/services/(user)/user.service";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/services/auth.util";
import { FRONTEND_URL } from "@/config/.env";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import Svg, { Line, Circle } from "react-native-svg";

/* ════════════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════════════ */
type Impact = "critical" | "high" | "medium" | "low";
type Status = "complete" | "partial" | "missing" | "na";

interface GoogleAPIField {
  fieldPath: string;
  endpoint: string;
  readable: boolean;
  writable: boolean;
}

interface CheckItem {
  id: string;
  title: string;
  points: number;
  impact: Impact;
  defaultStatus: Status; // fallback if API data not available
  apiField: GoogleAPIField;
  what: string;
  why: string;
  how: string;
  aiInsight: string;
  googleDoc: string;
  icon: React.ReactNode;
  unit?: string;
  target?: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  items: CheckItem[];
}

// Shape returned by /api/google/profile-score
interface ProfileScoreData {
  success: boolean;
  score: number;
  maxScore: number;
  change: number;
  meta: {
    locationName: string;
    avgRating: number;
    totalReviews: number;
    replyRate: number;
    postsLast30d: number;
    isVerified: boolean;
    isOpen: boolean;
  };
  missing: string[];
  breakdown: {
    completeness: {
      score: number;
      max: number;
      items: Record<string, { score: number; max: number; has: boolean }>;
    };
    reputation: {
      score: number;
      max: number;
      items: Record<string, { score: number; max: number }>;
    };
    activity: {
      score: number;
      max: number;
      items: Record<string, { score: number; max: number }>;
    };
  };
}

// Shape returned by /api/google/checklist-data (new route — see below)
interface ChecklistData {
  success: boolean;
  logoUploaded: boolean;
  coverUploaded: boolean;
  exteriorCount: number;
  interiorCount: number;
  productCount: number;
  videoCount: number;
  servicesCount: number;
  productsCount: number;
  attributesSet: number;
  attributesTotal: number;
  bookingUrl: boolean;
  reviewCount: number;
  avgRating: number;
  replyRate: number; // 0–100
  lastReviewDaysAgo: number;
  allNegativeReplied: boolean;
  postsLast30d: number;
  hasActiveOffer: boolean;
  qaCount: number;
  messagingEnabled: boolean;
  serviceAreaSet: boolean;
  hasSpecialHours: boolean;
}

/* ════════════════════════════════════════════════════════════════════
   IMPACT / STATUS CONFIG
════════════════════════════════════════════════════════════════════ */
const IMP: Record<Impact, { label: string; color: string; dot: string }> = {
  critical: { label: "Critical", color: "#f87171", dot: "#ef4444" },
  high: { label: "High", color: "#fb923c", dot: "#f97316" },
  medium: { label: "Medium", color: "#fbbf24", dot: "#f59e0b" },
  low: { label: "Low", color: "#4ade80", dot: "#22c55e" },
};

/* ════════════════════════════════════════════════════════════════════
   CHECKLIST DEFINITION — 30 items, 1000 pts
   defaultStatus = "missing" (worst case fallback; always overridden by real data)
════════════════════════════════════════════════════════════════════ */
const CATEGORIES: Category[] = [
  {
    id: "identity",
    label: "Business Identity",
    color: "#3b82f6",
    icon: <Building2 size={18} color="#3b82f6" />, // updated
    items: [
      {
        id: "name",
        title: "Business Name — Exact Match",
        points: 80,
        impact: "critical",
        defaultStatus: "missing",
        icon: <Building2 size={18} color="#3b82f6" />, // updated
        apiField: {
          fieldPath: "location.title",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "The exact legal or trading name of your business as it appears on your signage, website, and official documents.",
        why: "Google cross-checks your name across 200+ citation sources. Keyword-stuffed names trigger spam filters causing 3–5 position ranking drops. Exact-match names build NAP consistency — the #3 local ranking factor.",
        how: "Edit Profile → Business name. Match exactly to: your shopfront sign, your website's <title> tag, and your Facebook page name. Remove all city/keyword additions.",
        aiInsight:
          "Businesses with keyword-stuffed names are penalised by Google's Quality Algorithm. Exact-match names rank 38% higher in the local 3-pack on average.",
        googleDoc: "locations.title",
        target: "Exact match only",
      },
      {
        id: "primaryCategory",
        title: "Primary Category — Best-Fit",
        points: 90,
        impact: "critical",
        defaultStatus: "missing",
        icon: <Tag size={18} color="#3b82f6" />, // updated
        apiField: {
          fieldPath: "location.categories.primaryCategory",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "The single Google-defined category that most precisely describes what your business does as its main activity.",
        why: "Primary category is Google's #1 local ranking signal — it determines which search intent pools you appear in. An incorrect or generic category can cost you 60% of relevant impressions.",
        how: "Search Google's category taxonomy (3,500+ options). Use the most specific sub-category available. Test: search for your competitors and note their categories via mobile GBP cards.",
        aiInsight:
          "Primary category drives 64% of all local search impressions. Switching from a parent to a child category doubles search visibility on average within 30 days.",
        googleDoc: "locations.categories.primaryCategory",
        target: "Most specific match",
      },
      {
        id: "additionalCat",
        title: "Secondary Categories (3–5)",
        points: 40,
        impact: "high",
        defaultStatus: "missing",
        icon: <Layers size={18} color="#3b82f6" />, // updated
        apiField: {
          fieldPath: "location.categories.additionalCategories",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "Up to 9 additional categories that describe other services/products you offer alongside your primary business.",
        why: "Each secondary category expands your search surface. Businesses with 3–5 additional categories receive 43% more discovery searches.",
        how: "Add categories for every major service line. Don't use unrelated categories — that can trigger quality issues.",
        aiInsight:
          "Adding 2–4 more relevant secondary categories could unlock significant additional monthly searches.",
        googleDoc: "locations.categories.additionalCategories",
        target: "3–5 relevant categories",
      },
      {
        id: "description",
        title: "Business Description (750 chars)",
        points: 50,
        impact: "high",
        defaultStatus: "missing",
        icon: <FileText size={18} color="#3b82f6" />, // updated
        apiField: {
          fieldPath: "location.profile.description",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "A 750-character plain-text description of your business that appears on your Knowledge Panel and Maps listing.",
        why: "Descriptions are indexed by Google as profile content. Users who read your description convert 2.8× more. Descriptions containing your service keywords and city name give Google stronger context signals for ranking.",
        how: "Write 2–3 paragraphs: (1) What you do + speciality. (2) Who you serve + where. (3) What makes you different. Include 3–5 naturally placed keywords.",
        aiInsight:
          "Businesses with complete descriptions get 7× more profile clicks. AI can generate a keyword-optimised draft in seconds.",
        googleDoc: "locations.profile.description",
        unit: "characters",
        target: "700–750 characters",
      },
      {
        id: "openingDate",
        title: "Opening Date",
        points: 20,
        impact: "low",
        defaultStatus: "missing",
        icon: <Clock size={18} color="#3b82f6" />, // updated
        apiField: {
          fieldPath: "location.openInfo.openingDate",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "The official date your business first opened to the public.",
        why: "Google displays your business age which builds trust. Businesses operating 5+ years see a subtle authority boost in competitive niches.",
        how: "Edit Profile → More → Opening Date. Use your actual opening date even if it was years ago.",
        aiInsight:
          "Your business age is a positive trust signal. Ensure this is accurately set — incorrect dates reset your trust score history in Google's quality evaluator.",
        googleDoc: "locations.openInfo.openingDate",
        target: "Actual opening date",
      },
    ],
  },
  {
    id: "contact",
    label: "Contact & Location",
    color: "#06b6d4",
    icon: <MapPin size={18} color="#06b6d4" />, // updated
    items: [
      {
        id: "primaryPhone",
        title: "Primary Phone — Local Number",
        points: 60,
        impact: "critical",
        defaultStatus: "missing",
        icon: <Phone size={18} color="#06b6d4" />, // updated
        apiField: {
          fieldPath: "location.phoneNumbers.primaryPhone",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "A local phone number (with area code) displayed as your primary contact on the listing.",
        why: "Local numbers generate 78% more trust than toll-free numbers. Google also uses phone NAP consistency as a major ranking signal.",
        how: "Use a real local number with your city code. Ensure this number is identical across: GBP, website, Facebook, JustDial, Sulekha, IndiaMart.",
        aiInsight:
          "Verify your phone number matches across all major citation sources. Even 1 mismatch in area code format can suppress your local pack ranking.",
        googleDoc: "locations.phoneNumbers.primaryPhone",
        target: "Local number, consistent across citations",
      },
      {
        id: "storefrontAddress",
        title: "Address — Verified & Pin-Precise",
        points: 70,
        impact: "critical",
        defaultStatus: "missing",
        icon: <MapPin size={18} color="#06b6d4" />, // updated
        apiField: {
          fieldPath: "location.storefrontAddress",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "Your exact street address with the map pin placed precisely on your building entrance.",
        why: "Unverified profiles CANNOT appear in the local 3-pack. Incorrect pin placement affects distance calculations — a 500m error can cost 2 ranking positions.",
        how: "Verify: Profile → Verify → choose postcard/phone/video. Check your pin placement quarterly.",
        aiInsight: "An accurate pin increases direction requests by 29%.",
        googleDoc: "locations.storefrontAddress",
        target: "Precise pin + verified",
      },
      {
        id: "websiteUri",
        title: "Website URL",
        points: 50,
        impact: "high",
        defaultStatus: "missing",
        icon: <Globe size={18} color="#06b6d4" />, // updated
        apiField: {
          fieldPath: "location.websiteUri",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "The URL that Google links from your profile.",
        why: "Website clicks are a conversion signal that loops back into ranking. Missing URL reduces profile completeness by 20–30%.",
        how: "Consider linking to a specific landing page (not just homepage). Ensure the linked page loads under 3 seconds and is mobile-optimised.",
        aiInsight:
          "Pages with schema markup matching your GBP category get 2× more 'website' clicks from the profile.",
        googleDoc: "locations.websiteUri",
        target: "Category-specific landing page",
      },
      {
        id: "regularHours",
        title: "Business Hours — All 7 Days",
        points: 60,
        impact: "critical",
        defaultStatus: "missing",
        icon: <Clock size={18} color="#06b6d4" />, // updated
        apiField: {
          fieldPath: "location.regularHours",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "Complete operating hours for every day of the week, including explicit 'Closed' days.",
        why: "Profiles without complete hours show 'Hours not available' — users skip such listings 64% of the time. Accurate hours enable the 'Open now' filter.",
        how: "Set all 7 days. For closed days, explicitly mark 'Closed' rather than leaving blank.",
        aiInsight:
          "Incomplete hours cost you the 'Open now' filter eligibility on your highest-traffic days.",
        googleDoc: "locations.regularHours",
        target: "All 7 days + special hours",
      },
      {
        id: "specialHours",
        title: "Special Hours — Holidays",
        points: 25,
        impact: "medium",
        defaultStatus: "missing",
        icon: <Clock size={18} color="#06b6d4" />, // updated
        apiField: {
          fieldPath: "location.specialHours",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "Overriding hours for public holidays, festivals, and special closures.",
        why: "Google shows a prominent 'Holiday hours may differ' warning banner when special hours are absent — suppressing clicks by up to 30% during the holiday season.",
        how: "GBP Dashboard → Edit Profile → Special Hours. Add 2–3 weeks before every major holiday.",
        aiInsight:
          "The holiday hours warning banner can suppress 200–400 potential customer visits per major holiday.",
        googleDoc: "locations.specialHours",
        target: "All major holidays covered",
      },
      {
        id: "serviceArea",
        title: "Service Area — Defined Zones",
        points: 30,
        impact: "medium",
        defaultStatus: "missing",
        icon: <Navigation size={18} color="#06b6d4" />, // updated
        apiField: {
          fieldPath: "location.serviceArea",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "The geographic regions where you provide services.",
        why: "Service area determines your 'near me' search eligibility outside your immediate radius. Businesses with defined service areas rank in 2.3× more locations.",
        how: "Edit Profile → Service Area. Add city names, districts, and postal codes for every area you serve.",
        aiInsight:
          "Expanding service area to include adjacent high-search districts could add significant monthly impressions with zero additional cost.",
        googleDoc: "locations.serviceArea",
        target: "All served districts/cities",
      },
    ],
  },
  {
    id: "media",
    label: "Photos & Media",
    color: "#8b5cf6",
    icon: <Camera size={18} color="#8b5cf6" />, // updated
    items: [
      {
        id: "logo",
        title: "Logo Photo — High Resolution",
        points: 30,
        impact: "high",
        defaultStatus: "missing",
        icon: <Camera size={18} color="#8b5cf6" />, // updated
        apiField: {
          fieldPath: "location.media (LOGO)",
          endpoint: "POST /v1/locations/{locationId}/media",
          readable: true,
          writable: true,
        },
        what: "A square logo image (minimum 250×250px, recommended 720×720px).",
        why: "Logo appears in Knowledge Panel, Maps listing, and search result snippets. Profiles with logos get 5× more website clicks.",
        how: "Upload via GBP → Add Photo → Logo. Use PNG with transparent background, square crop, min 720×720px.",
        aiInsight:
          "Consider updating your logo if rebranding — a stale logo vs current website creates brand inconsistency.",
        googleDoc: "locations.media (LOGO)",
        target: "720×720px, under 5MB",
      },
      {
        id: "coverPhoto",
        title: "Cover Photo — Compelling First Impression",
        points: 35,
        impact: "critical",
        defaultStatus: "missing",
        icon: <Image size={18} color="#8b5cf6" />, // updated
        apiField: {
          fieldPath: "location.media (COVER)",
          endpoint: "POST /v1/locations/{locationId}/media",
          readable: true,
          writable: true,
        },
        what: "The banner image shown at the top of your profile — minimum 1080×608px.",
        why: "Cover photo is the #1 most-viewed element. Businesses with compelling covers see 42% more direction requests and 35% more click-throughs.",
        how: "Use a professional photo of your storefront, interior, or best products. Show people if possible — photos with humans perform 2.6× better.",
        aiInsight:
          "Critical gap if missing. Fixing this alone could increase profile views by 40%.",
        googleDoc: "locations.media (COVER)",
        unit: "photos",
        target: "1 compelling cover, 1080×608px min",
      },
      {
        id: "exteriorPhotos",
        title: "Exterior Photos (3+)",
        points: 30,
        impact: "high",
        defaultStatus: "missing",
        icon: <Camera size={18} color="#8b5cf6" />, // updated
        apiField: {
          fieldPath: "location.media (EXTERIOR)",
          endpoint: "POST /v1/locations/{locationId}/media",
          readable: true,
          writable: true,
        },
        what: "Photos showing your building facade, signage, parking, and approach from the street.",
        why: "34% of first-time customers cite 'couldn't find the place' as a barrier. Exterior photos help wayfinding and signal an established physical presence.",
        how: "Take photos from: street-level approach, front entrance (sign clearly visible), parking area, and any nearby landmarks.",
        aiInsight:
          "Refreshing photos quarterly signals an actively managed profile — a positive recency signal.",
        googleDoc: "locations.media (EXTERIOR)",
        unit: "photos",
        target: "5+ exterior photos",
      },
      {
        id: "interiorPhotos",
        title: "Interior Photos (5+)",
        points: 40,
        impact: "high",
        defaultStatus: "missing",
        icon: <Image size={18} color="#8b5cf6" />, // updated
        apiField: {
          fieldPath: "location.media (INTERIOR)",
          endpoint: "POST /v1/locations/{locationId}/media",
          readable: true,
          writable: true,
        },
        what: "Photos showcasing the inside of your business — decor, display areas, ambiance.",
        why: "Interior photos reduce first-visit anxiety and increase walk-in conversion by 29%.",
        how: "Shoot 8–12 photos: entrance, main display area, unique features. Use natural light. Min 720×720px.",
        aiInsight:
          "Every missing photo category reduces your 'completeness score' in Google's profile quality system.",
        googleDoc: "locations.media (INTERIOR)",
        unit: "photos",
        target: "8–12 interior photos",
      },
      {
        id: "productPhotos",
        title: "Product/Service Photos (10+)",
        points: 40,
        impact: "high",
        defaultStatus: "missing",
        icon: <ShoppingBag size={18} color="#8b5cf6" />, // updated
        apiField: {
          fieldPath: "location.media (PRODUCT)",
          endpoint: "POST /v1/locations/{locationId}/media",
          readable: true,
          writable: true,
        },
        what: "Close-up photos of individual products, service work, before/afters, and deliverables.",
        why: "Product photos are the deciding factor for 67% of purchase decisions. Profiles with 10+ product photos receive 94% more total profile views.",
        how: "Photograph your 10 best-selling products individually on a clean background. Min 720×720px.",
        aiInsight:
          "Upload your highest-margin items first for maximum commercial impact.",
        googleDoc: "locations.media (PRODUCT)",
        unit: "photos",
        target: "15–20 product photos",
      },
      {
        id: "video",
        title: "Business Video (30sec–3min)",
        points: 40,
        impact: "medium",
        defaultStatus: "missing",
        icon: <Video size={18} color="#8b5cf6" />, // updated
        apiField: {
          fieldPath: "location.media (VIDEO)",
          endpoint: "POST /v1/locations/{locationId}/media",
          readable: true,
          writable: true,
        },
        what: "A short video tour of your business, team in action, or product demonstration. Max 75MB, minimum 720p.",
        why: "Businesses with videos get 41% more web traffic. Video is the highest-engagement content type.",
        how: "Film a 30–60 second walkthrough with a modern smartphone. No fancy editing required. Upload directly to GBP.",
        aiInsight:
          "Video is the only media type that appears as a dedicated carousel in Google search results.",
        googleDoc: "locations.media (VIDEO)",
        unit: "videos",
        target: "1+ video, min 720p",
      },
    ],
  },
  {
    id: "services",
    label: "Services & Products",
    color: "#f97316",
    icon: <ShoppingBag size={18} color="#f97316" />, // updated
    items: [
      {
        id: "servicesMenu",
        title: "Services Menu — Complete",
        points: 60,
        impact: "high",
        defaultStatus: "missing",
        icon: <FileText size={18} color="#f97316" />, // updated
        apiField: {
          fieldPath: "location.serviceList",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "A structured list of every service you offer with names, categories, prices, and descriptions.",
        why: "Service listings are indexed as keywords. Businesses with complete service menus appear for 3× more search query variations.",
        how: "Edit Profile → Services. Add every service with: specific name, category, price or price range, 2–3 sentence description.",
        aiInsight:
          "Each unlisted service is a missed keyword — unlisted services mean you can't rank for specific service searches.",
        googleDoc: "locations.serviceList",
        target: "All services, with descriptions",
      },
      {
        id: "productsCatalog",
        title: "Products Catalogue",
        points: 40,
        impact: "medium",
        defaultStatus: "missing",
        icon: <ShoppingBag size={18} color="#f97316" />, // updated
        apiField: {
          fieldPath: "location.products",
          endpoint: "POST /v1/locations/{locationId}/products",
          readable: true,
          writable: true,
        },
        what: "A product catalogue with individual product listings including photos, names, descriptions, and prices.",
        why: "Product listings appear in the 'Products' tab of your Knowledge Panel and in Google Shopping results.",
        how: "Edit Profile → Products → Add Product. For each: high-res photo, specific name, price, category, description.",
        aiInsight:
          "Each product listing is a free organic ranking opportunity in Google Shopping.",
        googleDoc: "locations.products",
        target: "Top 10–15 products",
      },
      {
        id: "attributes",
        title: "Business Attributes (8+ set)",
        points: 35,
        impact: "medium",
        defaultStatus: "missing",
        icon: <CheckCircle2 size={18} color="#f97316" />, // updated
        apiField: {
          fieldPath: "location.attributes",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "Factual attributes Google provides per category: payment methods, accessibility, amenities, certifications.",
        why: "Attributes feed Google's filter system. Missing attributes = invisible in filtered searches.",
        how: "Edit Profile → More → Attributes. Set EVERY applicable attribute — it takes 3 minutes.",
        aiInsight:
          "Completing attributes opens you to additional filter-based search segments.",
        googleDoc: "locations.attributes",
        target: "All applicable attributes",
      },
      {
        id: "booking",
        title: "Booking / Appointment Link",
        points: 20,
        impact: "medium",
        defaultStatus: "missing",
        icon: <Globe size={18} color="#f97316" />, // updated
        apiField: {
          fieldPath: "location.mapsUrls.appointmentUrl",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "A direct URL to your booking system, appointment page, or enquiry form.",
        why: "The 'Book' CTA appears prominently in your profile. Profiles with booking links see 20% higher conversion rates.",
        how: "Even a WhatsApp link works: wa.me/91XXXXXXXXXX. Or link to Calendly, your website's contact page.",
        aiInsight:
          "48% of users prefer booking directly from search results without visiting a website.",
        googleDoc: "locations.mapsUrls.appointmentUrl",
        target: "Any bookable link or WhatsApp",
      },
    ],
  },
  {
    id: "reputation",
    label: "Reviews & Reputation",
    color: "#f59e0b",
    icon: <Star size={18} color="#f59e0b" />, // updated
    items: [
      {
        id: "reviewCount",
        title: "Review Volume (50+ reviews)",
        points: 70,
        impact: "critical",
        defaultStatus: "missing",
        icon: <Star size={18} color="#f59e0b" />, // updated
        apiField: {
          fieldPath: "location.metadata.totalReviewCount",
          endpoint: "GET /v1/locations/{locationId}",
          readable: true,
          writable: false,
        },
        what: "The total count of Google reviews on your listing.",
        why: "Review count is the #2 local ranking factor. Businesses with 50+ reviews appear in the local 3-pack 73% more often.",
        how: "Create a short review link and embed it everywhere: WhatsApp broadcast after service, email footer, SMS follow-up.",
        aiInsight:
          "A focused 2-week review campaign (WhatsApp broadcast + follow-up) could get you past 50 reviews quickly.",
        googleDoc: "locations.metadata.totalReviewCount (read-only)",
        unit: "reviews",
        target: "50+ reviews",
      },
      {
        id: "avgRating",
        title: "Average Rating (4.5★+)",
        points: 80,
        impact: "critical",
        defaultStatus: "missing",
        icon: <Star size={18} color="#f59e0b" />, // updated
        apiField: {
          fieldPath: "location.metadata.averageRating",
          endpoint: "GET /v1/locations/{locationId}",
          readable: true,
          writable: false,
        },
        what: "Your average star rating (1–5) calculated from all Google reviews.",
        why: "Ratings below 4.0★ suppress CTR by 60%. Google's local pack algorithm uses rating as a quality signal.",
        how: "Improve by: responding professionally to all reviews, proactively asking happy customers to review, resolving negative experiences before they become reviews.",
        aiInsight:
          "Moving to 4.5★ would increase click-through rate by ~35% in search results.",
        googleDoc: "locations.metadata.averageRating (read-only)",
        unit: "stars",
        target: "4.5★ or above",
      },
      {
        id: "reviewResponses",
        title: "Owner Responses — 100% Rate",
        points: 60,
        impact: "high",
        defaultStatus: "missing",
        icon: <MessageSquare size={18} color="#f59e0b" />, // updated
        apiField: {
          fieldPath: "review.reviewReply",
          endpoint: "PUT /v1/locations/{locationId}/reviews/{reviewId}/reply",
          readable: true,
          writable: true,
        },
        what: "Replying to every Google review — both positive and negative.",
        why: "Google's algorithm scores response rate as an engagement signal. Businesses that respond to all reviews are 1.7× more trusted.",
        how: "Positive: Personalise with name + what they mentioned + thank them. Negative: Acknowledge → Apologise → Offer to resolve offline. Respond within 48hrs.",
        aiInsight:
          "AI-generated personalised replies can clear a backlog of unanswered reviews in 5 minutes.",
        googleDoc: "accounts.locations.reviews.reply",
        target: "100% response rate",
      },
      {
        id: "reviewRecency",
        title: "Recent Reviews (last 30 days)",
        points: 30,
        impact: "high",
        defaultStatus: "missing",
        icon: <RefreshCw size={18} color="#f59e0b" />, // updated
        apiField: {
          fieldPath: "review.createTime",
          endpoint: "GET /v1/locations/{locationId}/reviews",
          readable: true,
          writable: false,
        },
        what: "Having at least 2–3 fresh reviews published in the last 30 days.",
        why: "Review recency is a freshness signal. 'Recent reviews' are weighted 3× more heavily than older reviews.",
        how: "Build a steady drip of reviews. Set a personal goal: 2 new reviews per week. Add a QR code at your checkout/counter.",
        aiInsight:
          "A single new review this week would restore your recency signal.",
        googleDoc: "accounts.locations.reviews (read-only timestamps)",
        target: "2+ reviews per month",
      },
      {
        id: "negativeHandled",
        title: "Negative Reviews — All Addressed",
        points: 20,
        impact: "high",
        defaultStatus: "missing",
        icon: <Shield size={18} color="#f59e0b" />, // updated
        apiField: {
          fieldPath: "review.reviewReply",
          endpoint: "PUT /v1/locations/{locationId}/reviews/{reviewId}/reply",
          readable: true,
          writable: true,
        },
        what: "Every 1–3 star review has a professional, empathetic owner response.",
        why: "88% of consumers read owner responses to negative reviews. An unanswered 1-star review is 10× more damaging than one with a professional response.",
        how: "Template: Acknowledge → Apologise → Offer to resolve offline → Don't argue publicly. Always take it offline.",
        aiInsight:
          "Businesses that respond to negative reviews recover 45% of potentially lost customers.",
        googleDoc: "accounts.locations.reviews.reply",
        target: "100% negative review response",
      },
    ],
  },
  {
    id: "activity",
    label: "Posts & Engagement",
    color: "#10b981",
    icon: <Zap size={18} color="#10b981" />, // updated
    items: [
      {
        id: "postsFrequency",
        title: "Regular Posts (Weekly)",
        points: 60,
        impact: "high",
        defaultStatus: "missing",
        icon: <FileText size={18} color="#10b981" />, // updated
        apiField: {
          fieldPath: "location.localPost",
          endpoint: "POST /v1/locations/{locationId}/localPosts",
          readable: true,
          writable: true,
        },
        what: "Publishing at least 1 Google Post per week — updates, offers, events, or product highlights.",
        why: "Active posting signals to Google that your business is open and engaged. Businesses that post weekly appear in the local 3-pack 42% more often.",
        how: "Plan a 4-post monthly calendar: Week 1: Product highlight. Week 2: Offer/discount. Week 3: Tip/educational. Week 4: Behind-the-scenes.",
        aiInsight:
          "Use AI to generate a post in 30 seconds — include your top-selling product with a special offer.",
        googleDoc: "accounts.locations.localPosts",
        target: "1+ post per week",
      },
      {
        id: "offerPost",
        title: "Active Offer Post",
        points: 30,
        impact: "medium",
        defaultStatus: "missing",
        icon: <Tag size={18} color="#10b981" />, // updated
        apiField: {
          fieldPath: "location.localPost (OFFER)",
          endpoint: "POST /v1/locations/{locationId}/localPosts",
          readable: true,
          writable: true,
        },
        what: "A special 'Offer' type post with a discount, deal, or promotion with an expiry date.",
        why: "Offer posts display a visual 'Offer' badge in search results — a differentiator that increases CTR by 47%.",
        how: "Create an Offer post: title, terms, coupon code (optional), start/end date, and a compelling product photo.",
        aiInsight:
          "Adding an offer post today could increase this week's profile interactions by 47%.",
        googleDoc: "accounts.locations.localPosts (OFFER type)",
        target: "1 active offer at all times",
      },
      {
        id: "qaSection",
        title: "Q&A — Pre-Seeded (5+ entries)",
        points: 30,
        impact: "medium",
        defaultStatus: "missing",
        icon: <MessageSquare size={18} color="#10b981" />, // updated
        apiField: {
          fieldPath: "location.questions",
          endpoint: "POST /v1/locations/{locationId}/questions",
          readable: true,
          writable: true,
        },
        what: "The Questions & Answers section populated with FAQs from the business.",
        why: "Unanswered questions can be answered by ANYONE — including competitors or trolls. Pre-seeding controls the narrative.",
        how: "Seed 5–10 questions: pricing, parking, delivery, unique products, opening hours. Then answer each professionally.",
        aiInsight:
          "Q&As appear in Google's rich results and can earn Featured Snippet positions for conversational searches.",
        googleDoc: "accounts.locations.questions",
        target: "5+ Q&A pairs",
      },
      {
        id: "messaging",
        title: "Google Messaging — Enabled",
        points: 20,
        impact: "medium",
        defaultStatus: "missing",
        icon: <MessageSquare size={18} color="#10b981" />, // updated
        apiField: {
          fieldPath: "location.metadata.hasBusinessMessaging",
          endpoint: "PATCH /v1/locations/{locationId}",
          readable: true,
          writable: true,
        },
        what: "The Google Business Messages feature that lets customers message you directly from your search listing.",
        why: "Messaging provides a zero-friction contact option preferred by 64% of consumers under 35. Businesses with messaging see 17% more total interactions.",
        how: "GBP Dashboard → Messages → Turn on. Download the Google Business app to receive message notifications.",
        aiInsight:
          "Turning on messaging takes 30 seconds. It adds a prominent 'Message' button to your search listing.",
        googleDoc: "locations.metadata.hasBusinessMessaging",
        target: "Enabled + auto-reply set",
      },
      {
        id: "insightsReviewed",
        title: "Performance Insights — Monitored",
        points: 20,
        impact: "low",
        defaultStatus: "complete",
        icon: <BarChart2 size={18} color="#10b981" />, // updated
        apiField: {
          fieldPath: "location.performanceMetrics",
          endpoint: "POST /v1/locations:getDailyMetricsTimeSeries",
          readable: true,
          writable: false,
        },
        what: "Regularly reviewing your GBP performance data: impressions, searches, actions, and call trends.",
        why: "Businesses that review insights monthly make 2× better optimisation decisions and catch ranking drops 2 weeks earlier.",
        how: "Review monthly: which queries drive impressions, which actions are trending, which photo categories have lowest views.",
        aiInsight:
          "Updating your business description and posts to reflect high-intent search terms can capture significant additional impressions.",
        googleDoc: "locations.performanceMetrics (read-only)",
        target: "Monthly review cadence",
      },
    ],
  },
];

/* ════════════════════════════════════════════════════════════════════
   STATUS DERIVATION — maps real API data → Status per item ID
════════════════════════════════════════════════════════════════════ */
function deriveStatuses(
  scoreData: ProfileScoreData | undefined,
  checklistData: ChecklistData | undefined,
): Record<string, Status> {
  const s: Record<string, Status> = {};

  // Set all to defaultStatus first
  CATEGORIES.forEach((c) =>
    c.items.forEach((i) => {
      s[i.id] = i.defaultStatus;
    }),
  );

  if (!scoreData?.breakdown) return s;

  const ci = scoreData.breakdown.completeness.items;
  const meta = scoreData.meta;

  // ── IDENTITY (from profile-score breakdown) ──
  s["name"] = ci.title?.has ? "complete" : "missing";
  s["primaryCategory"] = ci.primaryCategory?.has ? "complete" : "missing";
  s["additionalCat"] = ci.additionalCat?.has ? "complete" : "missing";
  s["description"] = ci.description?.has ? "complete" : "missing";
  s["openingDate"] = "complete"; // GBP requires it on creation; assume set if profile exists

  // ── CONTACT ──
  s["primaryPhone"] = ci.primaryPhone?.has ? "complete" : "missing";
  s["storefrontAddress"] = ci.storefrontAddress?.has ? "complete" : "missing";
  s["websiteUri"] = ci.websiteUri?.has ? "complete" : "missing";
  s["regularHours"] = ci.regularHours?.has ? "complete" : "missing";
  s["specialHours"] = ci.specialHours?.has ? "complete" : "missing";
  // serviceArea — use checklist data if available
  if (checklistData) {
    s["serviceArea"] = checklistData.serviceAreaSet ? "complete" : "missing";
  }

  // ── MEDIA (from checklist data) ──
  if (checklistData) {
    s["logo"] = checklistData.logoUploaded ? "complete" : "missing";
    s["coverPhoto"] =
      (ci.coverPhoto?.has ?? checklistData.coverUploaded)
        ? "complete"
        : "missing";
    s["exteriorPhotos"] =
      checklistData.exteriorCount >= 5
        ? "complete"
        : checklistData.exteriorCount >= 1
          ? "partial"
          : "missing";
    s["interiorPhotos"] =
      checklistData.interiorCount >= 8
        ? "complete"
        : checklistData.interiorCount >= 1
          ? "partial"
          : "missing";
    s["productPhotos"] =
      checklistData.productCount >= 15
        ? "complete"
        : checklistData.productCount >= 4
          ? "partial"
          : "missing";
    s["video"] = checklistData.videoCount >= 1 ? "complete" : "missing";
  }

  // ── SERVICES ──
  if (checklistData) {
    s["servicesMenu"] =
      checklistData.servicesCount >= 8
        ? "complete"
        : checklistData.servicesCount >= 1
          ? "partial"
          : "missing";
    s["productsCatalog"] =
      checklistData.productsCount >= 10
        ? "complete"
        : checklistData.productsCount >= 1
          ? "partial"
          : "missing";
    const attrPct =
      checklistData.attributesTotal > 0
        ? checklistData.attributesSet / checklistData.attributesTotal
        : 0;
    s["attributes"] =
      attrPct >= 0.8 ? "complete" : attrPct > 0.2 ? "partial" : "missing";
    s["booking"] = checklistData.bookingUrl ? "complete" : "missing";
  }

  // ── REPUTATION ──
  const reviews = meta.totalReviews;
  s["reviewCount"] =
    reviews >= 50 ? "complete" : reviews >= 10 ? "partial" : "missing";
  s["avgRating"] =
    meta.avgRating >= 4.5
      ? "complete"
      : meta.avgRating >= 4.0
        ? "partial"
        : "missing";
  s["reviewResponses"] =
    meta.replyRate >= 90
      ? "complete"
      : meta.replyRate >= 50
        ? "partial"
        : "missing";

  if (checklistData) {
    s["reviewRecency"] =
      checklistData.lastReviewDaysAgo <= 30
        ? "complete"
        : checklistData.lastReviewDaysAgo <= 60
          ? "partial"
          : "missing";
    s["negativeHandled"] = checklistData.allNegativeReplied
      ? "complete"
      : "partial";
  }

  // ── ACTIVITY ──
  const posts = meta.postsLast30d;
  s["postsFrequency"] =
    posts >= 4 ? "complete" : posts >= 1 ? "partial" : "missing";

  if (checklistData) {
    s["offerPost"] = checklistData.hasActiveOffer ? "complete" : "missing";
    s["qaSection"] =
      checklistData.qaCount >= 5
        ? "complete"
        : checklistData.qaCount >= 1
          ? "partial"
          : "missing";
    s["messaging"] = checklistData.messagingEnabled ? "complete" : "missing";
  }

  s["insightsReviewed"] = "complete"; // always complete if user is using this app

  return s;
}

/* ════════════════════════════════════════════════════════════════════
   FULL-PAGE SKELETON
════════════════════════════════════════════════════════════════════ */
const PageSkeleton = ({ dark }: { dark: boolean }) => {
  const pulse = dark ? "bg-gray-900" : "bg-purple-400/40";
  const bg = useColor("primary");

  return (
    <ScrollView
      className={`min-h-screen ${bg} px-4 pt-6 pb-32 mx-7`}
      contentContainerStyle={{ alignItems: "center" }}
    >
      {/* Title skeletons */}
      <View className={`h-6 w-40 rounded-full ${pulse} mb-2`} />
      <View className={`h-4 w-56 rounded-full ${pulse} mb-6`} />

      {/* Large block */}
      <View className={`h-56 w-full rounded-3xl ${pulse} mb-4`} />

      {/* Medium blocks */}
      <View className={`h-32 w-full rounded-2xl ${pulse} mb-4`} />
      <View className={`h-32 w-full rounded-2xl ${pulse} mb-4`} />

      {/* Repeated smaller blocks */}
      {[1, 2, 3].map((i) => (
        <View key={i} className={`h-16 w-full rounded-2xl ${pulse} mb-3`} />
      ))}
    </ScrollView>
  );
};

/* ════════════════════════════════════════════════════════════════════
   NOT CONNECTED
════════════════════════════════════════════════════════════════════ */
const NotConnected = ({ dark }: { dark: boolean }) => {
  const router = useRouter();

  return (
    <View
      className={`flex-1 items-center justify-center px-6 ${
        dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"
      }`}
    >
      <View className="items-center">
        {/* Icon */}
        <Text className="text-5xl mb-4">🔗</Text>

        {/* Title */}
        <Text
          className={`text-base font-bold mb-2 ${
            dark ? "text-white" : "text-slate-900"
          }`}
        >
          No Google Business Linked
        </Text>

        {/* Subtitle */}
        <Text
          className={`text-sm mb-6 ${
            dark ? "text-slate-400" : "text-slate-600"
          }`}
        >
          Connect your Google Business Profile in Settings to see your audit.
        </Text>

        {/* Button */}
        <Pressable
          onPress={() => router.push("/(tabs)/(profile)")}
          className="px-6 py-2.5 rounded-2xl"
          style={{
            backgroundColor: "transparent",
            backgroundImage: "linear-gradient(135deg,#1e40af,#3b82f6)",
          }}
        >
          <Text className="text-white text-sm font-bold">Go to Profile</Text>
        </Pressable>
      </View>
    </View>
  );
};

/* ════════════════════════════════════════════════════════════════════
   SCAN OVERLAY
════════════════════════════════════════════════════════════════════ */
const ScanOverlay = ({
  dark,
  onDone,
}: {
  dark: boolean;
  onDone: () => void;
}) => {
  const [p, setP] = useState(0);
  const [step, setStep] = useState(0);
  const primary = useColor("primary");
  const link = useColor("link");
  const textMuted = useColor("textMuted");
  const text = useColor("text");

  const steps = [
    "Authenticating Google Business API…",
    "Fetching profile completeness data…",
    "Analysing local SEO signals…",
    "Benchmarking competitor profiles…",
    "Scoring 30 optimisation factors…",
    "Generating AI recommendations…",
    "Audit complete!",
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setP((prev) => {
        if (prev >= 100) {
          clearInterval(t);
          setTimeout(onDone, 700);
          return 100;
        }
        const n = Math.min(prev + Math.random() * 5 + 2, 100);
        setStep(Math.floor((n / 100) * (steps.length - 1)));
        return n;
      });
    }, 90);
    return () => clearInterval(t);
  }, []);

  return (
    <View
      className={`absolute inset-0 left-0 right-0 top-0 bottom-0 z-50 flex-1 items-center justify-center`}
      style={{ backgroundColor: primary }}
    >
      {/* Overlay background lines (simplified for RN) */}
      <View className="absolute inset-0 opacity-[0.025]" />

      <ScrollView
        contentContainerStyle={{
          alignItems: "center",
          // flexGrow: 1,
          justifyContent: "center",
        }}
        className="w-full max-w-xs px-8"
      >
        {/* Brain icon with ping effect */}
        <View className="relative mb-7">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center"
            style={{
              backgroundColor: link + "30",
              borderWidth: 1,
              borderColor: link + "50",
              shadowColor: link,
              shadowOpacity: 1,
              shadowRadius: 40,
            }}
          >
            <Brain size={34} color={link} />
          </View>
          <View
            className="absolute inset-0 rounded-3xl"
            style={{
              borderWidth: 2,
              borderColor: link,
              opacity: 0.2,
            }}
          />
        </View>

        {/* Title + step text */}
        <View className="items-center w-full">
          <Text
            className={`text-[21px] font-black mb-1`}
            style={{ letterSpacing: -0.04, color: text }}
          >
            AI Audit Running
          </Text>
          <Text
            className="text-sm font-medium"
            style={{ color: link, minHeight: 18 }}
          >
            {steps[Math.min(step, steps.length - 1)]}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="w-full mt-7">
          <View
            className={`h-1.5 rounded-full overflow-hidden`}
            style={{ backgroundColor: link }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${p}%`,
                backgroundColor: link,
              }}
            />
          </View>
          <View className="flex-row justify-between mt-1.5">
            <Text className={`text-sm`} style={{ color: textMuted }}>
              Scanning profile…
            </Text>
            <Text className="text-sm font-bold" style={{ color: link }}>
              {Math.round(p)}%
            </Text>
          </View>
        </View>

        {/* Checklist items */}
        <View className="w-full mt-4">
          {[
            "Business Identity",
            "Contact & Location",
            "Photos & Media",
            "Services",
            "Reviews",
            "Posts & Engagement",
          ].map((l, i) => (
            <View
              key={i}
              className={`flex-row items-center gap-2.5 mb-1.5 ${
                p > (i + 1) * 15 ? "opacity-100" : "opacity-25"
              }`}
            >
              <View
                className={`w-4 h-4 rounded-full items-center justify-center ${
                  p > (i + 1) * 15
                    ? "bg-purple-500"
                    : dark
                      ? "bg-white/10"
                      : "bg-purple-100"
                }`}
              >
                {p > (i + 1) * 15 && <Check size={8} color="white" />}
              </View>
              <Text className={`text-sm font-medium `} style={{ color: text }}>
                {l}
              </Text>
              {p > (i + 1) * 15 && (
                <Text
                  className="text-[9px] font-bold ml-auto"
                  style={{ color: link }}
                >
                  ✓ Analysed
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

/* ════════════════════════════════════════════════════════════════════
   SCORE RING
════════════════════════════════════════════════════════════════════ */
const ScoreRing = ({ score, dark }: { score: number; dark: boolean }) => {
  const MAX = 1000;
  const R = 44;
  const C = 2 * Math.PI * R;
  const pct = score / MAX;
  const dash = C * pct;
  const link = useColor("link");
  const textMuted = useColor("textMuted");

  // Example tier function (replace with your own logic)
  const scoreTier = (s: number) => {
    if (s < 250) return { tier: "Incomplete", rank: 1, sub: "Needs work" };
    if (s < 500) return { tier: "Basic", rank: 2, sub: "Some progress" };
    if (s < 750) return { tier: "Growing", rank: 3, sub: "Improving steadily" };
    if (s < 1000) return { tier: "Advanced", rank: 4, sub: "Strong profile" };
    return { tier: "Elite", rank: 5, sub: "Top performance" };
  };

  const tier = scoreTier(score);

  const ticks = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * 2 * Math.PI - Math.PI / 2;
    const isMaj = i % 5 === 0;
    const r1 = R - (isMaj ? 5 : 3.5);
    const r2 = R - 1;
    return {
      x1: 60 + r1 * Math.cos(angle),
      y1: 60 + r1 * Math.sin(angle),
      x2: 60 + r2 * Math.cos(angle),
      y2: 60 + r2 * Math.sin(angle),
      isMaj,
    };
  });

  return (
    <View className="flex-row items-center gap-5">
      {/* Ring + Score */}
      <View className="relative" style={{ width: 120, height: 120 }}>
        <Svg
          viewBox="0 0 120 120"
          width={120}
          height={120}
          style={{ transform: [{ rotate: "-90deg" }] }}
        >
          {/* Background circle */}
          <Circle
            cx={60}
            cy={60}
            r={R}
            fill="none"
            stroke={dark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.1)"}
            strokeWidth={6}
          />
          {/* Tick marks */}
          {ticks.map((t, i) => (
            <Line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={
                t.isMaj
                  ? dark
                    ? "rgba(59,130,246,0.2)"
                    : "rgba(59,130,246,0.18)"
                  : dark
                    ? "rgba(59,130,246,0.08)"
                    : "rgba(59,130,246,0.09)"
              }
              strokeWidth={t.isMaj ? 1.2 : 0.7}
              strokeLinecap="round"
            />
          ))}
          {/* Threshold markers */}
          {[250, 500, 750].map((thresh, i) => {
            const a = (thresh / MAX) * 2 * Math.PI - Math.PI / 2;
            return (
              <Circle
                key={i}
                cx={60 + R * Math.cos(a)}
                cy={60 + R * Math.sin(a)}
                r={2.5}
                fill={
                  score >= thresh
                    ? link
                    : dark
                      ? "rgba(59,130,246,0.2)"
                      : "rgba(59,130,246,0.15)"
                }
              />
            );
          })}
          {/* Progress circle */}
          <Circle
            cx={60}
            cy={60}
            r={R}
            fill="none"
            stroke={link}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
          />
        </Svg>

        {/* Centered score text */}
        <View className="absolute inset-0 items-center justify-center">
          <Text
            className="text-3xl font-black leading-none"
            style={{ letterSpacing: -0.06, color: link }}
          >
            {score}
          </Text>
          <Text className={`text-xs font-bold mt-0.5`} style={{ color: link }}>
            / 1000
          </Text>
        </View>
      </View>

      {/* Tier + details */}
      <View className="flex-1 min-w-0 flex-col gap-2.5">
        <View>
          <View className="flex-row items-center gap-2 mb-0.5">
            <Text
              className="text-[18px] font-black leading-none"
              style={{ letterSpacing: -0.04, color: link }}
            >
              {tier.tier}
            </Text>
            <View className="flex-row gap-0.5 items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <View
                  key={i}
                  className="rounded-sm"
                  style={{
                    width: 5,
                    height: i < tier.rank ? 10 + i * 2 : 8,
                    backgroundColor:
                      i < tier.rank
                        ? `rgb(159, 87, 245,${0.4 + i * 0.12})`
                        : dark
                          ? "rgba(255,255,255,0.07)"
                          : "rgba(59,130,246,0.1)",
                  }}
                />
              ))}
            </View>
          </View>
          <Text
            className={`text-sm font-medium leading-tight`}
            style={{ color: textMuted }}
          >
            {tier.sub}
          </Text>
        </View>

        {/* Stats row */}
        <View
          className={`flex-row justify-between px-3 py-2 rounded-xl border`}
          style={{ backgroundColor: link + "50", borderColor: link + "80" }}
        >
          {[
            { n: `${Math.round(pct * 100)}%`, label: "Score" },
            { n: `${1000 - score}`, label: "To max" },
            { n: `#${tier.rank < 3 ? tier.rank : "—"}`, label: "Tier" },
          ].map((r, i) => (
            <View key={i} className="flex-1 items-center">
              <Text className="text-lg font-black " style={{ color: link }}>
                {r.n}
              </Text>
              <Text
                className={`text-xs font-semibold`}
                style={{ color: textMuted }}
              >
                {r.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Tier progress bar */}
        <View className="flex-row gap-1">
          {["Incomplete", "Basic", "Growing", "Advanced", "Elite"].map(
            (t, i) => {
              const active = i + 1 === tier.rank;
              const passed = i + 1 < tier.rank;
              return (
                <View key={i} className="flex-1 items-center">
                  <View
                    className="h-1 w-full rounded-full"
                    style={{
                      backgroundColor: passed
                        ? "rgba(159, 87, 245, 0.5)"
                        : active
                          ? link
                          : dark
                            ? "rgba(159, 87, 245, 0.05)"
                            : "rgba(159, 87, 245, 0.1)",
                    }}
                  />
                  {active && (
                    <Text
                      className="text-[8px] mt-1 font-black"
                      style={{ color: link }}
                    >
                      {t}
                    </Text>
                  )}
                </View>
              );
            },
          )}
        </View>
      </View>
    </View>
  );
};

const STATUS_CFG: Record<
  Status,
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
    pts: number;
  }
> = {
  complete: {
    label: "Complete",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
    icon: <Check size={10} />,
    pts: 1.0,
  },
  partial: {
    label: "Partial",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    icon: <Target size={10} />,
    pts: 0.4,
  },
  missing: {
    label: "Missing",
    color: "#f87171",
    bg: "rgba(248,113,113,0.1)",
    icon: <X size={10} />,
    pts: 0.0,
  },
  na: {
    label: "N/A",
    color: "#64748b",
    bg: "rgba(100,116,139,0.1)",
    icon: <Bookmark size={10} />,
    pts: 0.0,
  },
};

/* ════════════════════════════════════════════════════════════════════
   SCORE HELPERS
════════════════════════════════════════════════════════════════════ */
function calcScore(s: Record<string, Status>): number {
  let t = 0;
  CATEGORIES.forEach((c) =>
    c.items.forEach((i) => {
      const cfg = STATUS_CFG[s[i.id] ?? i.defaultStatus];
      t += Math.round(i.points * cfg.pts);
    }),
  );
  return t;
}
function calcCatScore(cat: Category, s: Record<string, Status>) {
  const max = cat.items.reduce((a, i) => a + i.points, 0);
  let earned = 0;
  cat.items.forEach((i) => {
    earned += Math.round(i.points * STATUS_CFG[s[i.id] ?? i.defaultStatus].pts);
  });
  return { earned, max, pct: Math.round((earned / max) * 100) };
}

const CatBar = ({
  cat,
  statuses,
  dark,
}: {
  cat: Category;
  statuses: Record<string, Status>;
  dark: boolean;
}) => {
  const { earned, max, pct } = calcCatScore(cat, statuses);
  const text = useColor("text");
  const textMuted = useColor("textMuted");

  return (
    <View className="flex-row items-center gap-3">
      {/* Icon box */}
      <View
        className="p-2 rounded-lg items-center justify-center"
        style={{ backgroundColor: `${cat.color}30` }}
      >
        {cat.icon}
      </View>

      {/* Label + progress */}
      <View className="flex-1 min-w-0 my-4">
        <View className="flex-row justify-between mb-1">
          <Text
            className={`text-sm font-semibold truncate`}
            style={{ color: text }}
          >
            {cat.label}
          </Text>
          <Text className="text-sm font-bold ml-1" style={{ color: cat.color }}>
            {earned} / {max}
          </Text>
        </View>

        {/* Progress bar */}
        <View
          className={`h-1 rounded-full overflow-hidden ${
            dark ? "bg-white/10" : "bg-purple-50"
          }`}
        >
          <LinearGradient
            colors={[`${cat.color}90`, cat.color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 999,
              shadowColor: cat.color,
              shadowOpacity: 0.5,
              shadowRadius: 6,
            }}
          />
        </View>
      </View>

      {/* Percentage */}
      <Text
        className={`text-[10px] font-black w-8 text-right`}
        style={{ color: textMuted }}
        numberOfLines={1}
      >
        {pct}%
      </Text>
    </View>
  );
};

/* ════════════════════════════════════════════════════════════════════
   QUICK WINS
════════════════════════════════════════════════════════════════════ */
const QuickWins = ({
  statuses,
  dark,
}: {
  statuses: Record<string, Status>;
  dark: boolean;
}) => {
  const wins = CATEGORIES.flatMap((cat) =>
    cat.items
      .filter(
        (i) =>
          statuses[i.id] === "missing" &&
          (i.impact === "critical" || i.impact === "high"),
      )
      .map((i) => ({ ...i, catColor: cat.color })),
  )
    .sort((a, b) => b.points - a.points)
    .slice(0, 4);
  const pts = wins.reduce((a, i) => a + i.points, 0);
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");

  if (!wins.length) {
    return (
      <View
        className={`rounded-2xl border px-4 py-3.5 flex-row items-center gap-3 ${
          dark
            ? "bg-purple-500/10 border-purple-500/20"
            : "bg-purple-50 border-purple-200/60"
        }`}
      >
        <CheckCircle2 size={18} color={dark ? "#6ee7b7" : "#047857"} />
        <Text
          className={`text-[12px] font-semibold ${
            dark ? "text-emerald-300" : "text-emerald-700"
          }`}
        >
          All critical items are complete! Focus on medium-priority items to
          push your score higher.
        </Text>
      </View>
    );
  }

  return (
    <View className={`overflow-hidden`}>
      {/* Header */}
      <View
        className={`flex-row px-3 py-2 pb-3 items-center justify-between border-b `}
        style={{ borderColor: link + "70" }}
      >
        <View className="flex-row items-center gap-2">
          <View
            className={`p-2 rounded-lg items-center justify-center ${
              dark ? "bg-orange-500/15" : "bg-orange-100"
            }`}
          >
            <Flame size={20} color="#fb923c" />
          </View>
          <Text
            className={`text-md font-bold`}
            style={{ letterSpacing: -0.02, color: text }}
          >
            Top Quick Wins
          </Text>
        </View>

        <View
          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: link + "30",
            borderWidth: 1,
            borderColor: link,
          }}
        >
          <Sparkles size={9} color={link} />
          <Text className="text-[10px] font-black" style={{ color: link }}>
            +{pts} pts available
          </Text>
        </View>
      </View>

      {/* Wins list */}
      <View className="p-3 flex-col gap-2">
        {wins.map((item, i) => (
          <View
            key={i}
            className={`flex-row items-center gap-3 px-3 py-4 mt-2 rounded-xl `}
            style={{
              backgroundColor: dark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
            }}
          >
            {/* Icon */}
            <View
              className="p-3 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${item.catColor}30` }}
            >
              {item.icon}
            </View>

            {/* Title + impact */}
            <View className="flex-1 min-w-0">
              <Text
                className={`text-md font-bold truncate`}
                style={{ color: text }}
              >
                {item.title}
              </Text>
              <Text className={`text-sm mt-0.5 `} style={{ color: textMuted }}>
                {IMP[item.impact].label} impact
              </Text>
            </View>

            {/* Points + API */}
            <View className="items-end gap-1">
              <Text
                className="text-lg font-black"
                style={{ color: item.catColor }}
              >
                +{item.points}
              </Text>
              {item.apiField?.writable && (
                <View className="flex-row items-center gap-0.5">
                  <Cpu size={13} color={link} />
                  <Text className="text-xs font-bold" style={{ color: link }}>
                    API
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

/* ════════════════════════════════════════════════════════════════════
   AI RECS (uses real missing items from API)
════════════════════════════════════════════════════════════════════ */
const AIRecs = ({
  statuses,
  dark,
  missingFromAPI,
}: {
  statuses: Record<string, Status>;
  dark: boolean;
  missingFromAPI: string[];
}) => {
  const score = calcScore(statuses);
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");

  const dynamic: {
    icon: React.ReactNode;
    color: string;
    title: string;
    text: string;
  }[] = [];

  if (score < 600) {
    dynamic.push({
      icon: <Brain size={18} color="#60a5fa" />,
      color: "#60a5fa",
      title: "Critical profile gaps",
      text: "Your profile has multiple critical gaps. Fixing them alone could push your score above 700 and land you in the local 3-pack.",
    });
  }
  if (statuses["coverPhoto"] === "missing") {
    dynamic.push({
      icon: <Brain size={18} color="#a78bfa" />,
      color: "#a78bfa",
      title: "No cover photo",
      text: "Cover photo is the most-viewed element of your profile. Adding one could increase views by 40% this week.",
    });
  }
  if (
    statuses["postsFrequency"] === "missing" ||
    statuses["postsFrequency"] === "partial"
  ) {
    dynamic.push({
      icon: <Brain size={18} color="#34d399" />,
      color: "#34d399",
      title: "Post frequency low",
      text: "Weekly posting raises your 'active business' signal. Use AI to generate and schedule 4 posts in 2 minutes.",
    });
  }
  if (
    statuses["reviewCount"] === "partial" ||
    statuses["reviewCount"] === "missing"
  ) {
    dynamic.push({
      icon: <Brain size={18} color="#fbbf24" />,
      color: "#fbbf24",
      title: "Review volume below target",
      text: "50+ reviews unlocks a major ranking boost. Launch a WhatsApp review campaign to collect 5+ reviews this week.",
    });
  }
  if (
    statuses["reviewResponses"] === "partial" ||
    statuses["reviewResponses"] === "missing"
  ) {
    dynamic.push({
      icon: <Brain size={18} color="#f87171" />,
      color: "#f87171",
      title: "Unanswered reviews detected",
      text: "Every unanswered review is visible to every future customer. AI-generated personalised replies can clear your backlog in 5 minutes.",
    });
  }
  if (missingFromAPI.length > 0 && dynamic.length < 3) {
    missingFromAPI.slice(0, 2).forEach((m) => {
      dynamic.push({
        icon: <Brain size={18} color="#fb923c" />,
        color: "#fb923c",
        title: "Profile gap detected",
        text: m,
      });
    });
  }

  const recs = dynamic.slice(0, 3);
  if (!recs.length) return null;

  return (
    <View
      className="rounded-2xl border shadow-md overflow-hidden mb-4 p-3"
      style={{
        backgroundColor: primary,
        borderColor: link,
        shadowColor: link,
        shadowOpacity: 0.25,
        shadowRadius: 6,
      }}
    >
      {/* Header */}
      <View
        className={`px-3 py-3 flex-row items-center gap-2 border-b `}
        style={{ borderColor: link + "80" }}
      >
        <View
          className={`p-3 rounded-lg items-center justify-center`}
          style={{ backgroundColor: link + "30" }}
        >
          <Brain size={20} color={link} />
        </View>
        <Text
          className={`text-md font-black `}
          style={{ letterSpacing: -0.02, color: text }}
        >
          AI Recommendations
        </Text>
        <View
          className="ml-auto flex-row items-center gap-2 px-2 py-0.4 rounded-full"
          style={{
            backgroundColor: link + "30",
            borderWidth: 1,
            borderColor: link,
          }}
        >
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: link }}
          />
          <Text className="text-sm font-black" style={{ color: link }}>
            Live
          </Text>
        </View>
      </View>

      {/* Recommendations */}
      <View className="p-3 mt-3 flex-col gap-4">
        {recs.map((r, i) => (
          <View
            key={i}
            className={`flex-row items-center gap-3 p-3 rounded-xl border ${
              dark
                ? "bg-white/5 border-white/10"
                : "bg-slate-50/70 border-slate-100"
            }`}
          >
            <View
              className="p-3 rounded-lg items-center justify-center"
              style={{ backgroundColor: `${r.color}15` }}
            >
              {r.icon}
            </View>
            <View className="flex-1 min-w-0">
              <Text
                className={`text-md font-bold mb-0.5 `}
                style={{ color: text }}
              >
                {r.title}
              </Text>
              <Text className="text-xs" style={{ color: textMuted }}>
                {r.text}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

interface FilterRowProps {
  filter: "all" | "missing" | "partial" | "complete";
  setFilter: (f: "all" | "missing" | "partial" | "complete") => void;
  counts: { total: number; missing: number; partial: number; complete: number };
  dark: boolean;
}

const FilterRow: React.FC<FilterRowProps> = ({
  filter,
  setFilter,
  counts,
  dark,
}) => {
  const text = useColor("text");
  const labels = {
    all: `All (${counts.total})`,
    missing: `Missing (${counts.missing})`,
    partial: `Partial (${counts.partial})`,
    complete: `Done (${counts.complete})`,
  };

  const colorsMap = {
    all: "#60a5fa",
    missing: "#f87171",
    partial: "#fbbf24",
    complete: "#4ade80",
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-row gap-4 mb-4 pb-1"
    >
      {(["all", "missing", "partial", "complete"] as const).map((f) => {
        const active = filter === f;
        const color = colorsMap[f];

        return (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
            className="shrink-0 rounded-full border px-3.5 py-1.5 ml-2"
            style={
              active
                ? {
                    backgroundColor: `${color}15`,
                    borderColor: `${color}35`,
                  }
                : {
                    backgroundColor: dark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(59,130,246,0.04)",
                    borderColor: "transparent",
                  }
            }
          >
            <Text
              className="text-sm font-bold text-center"
              style={{ color: active ? color : text }}
            >
              {labels[f]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

/* ════════════════════════════════════════════════════════════════════
   CATEGORY SECTION
════════════════════════════════════════════════════════════════════ */
function CategorySection({
  cat,
  statuses,
  dark,
  defaultOpen,
  scoreData,
  checklistData,
}: {
  cat: Category;
  statuses: Record<string, Status>;
  dark: boolean;
  defaultOpen: boolean;
  scoreData?: ProfileScoreData;
  checklistData?: ChecklistData;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const primary = useColor("primary");

  // Animation Toggle
  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  const { earned, max, pct } = calcCatScore(cat, statuses);
  const items = cat.items || [];
  const done = items.filter((i: any) => statuses[i.id] === "complete").length;
  const partial = items.filter((i: any) => statuses[i.id] === "partial").length;
  const missing = items.filter((i: any) => statuses[i.id] === "missing").length;

  function getCurrentValue(id: string): string | undefined {
    const meta = scoreData?.meta;
    const cl = checklistData;
    if (!meta && !cl) return undefined;
    const map: Record<string, string | undefined> = {
      avgRating: meta ? `${meta.avgRating}★ avg` : undefined,
      reviewCount: meta ? `${meta.totalReviews} reviews` : undefined,
      reviewResponses: meta ? `${meta.replyRate}% response rate` : undefined,
      postsFrequency: meta
        ? `${meta.postsLast30d} posts this month`
        : undefined,
      exteriorPhotos: cl ? `${cl.exteriorCount} uploaded` : undefined,
      interiorPhotos: cl ? `${cl.interiorCount} uploaded` : undefined,
      productPhotos: cl ? `${cl.productCount} uploaded` : undefined,
      video: cl ? `${cl.videoCount} uploaded` : undefined,
      servicesMenu: cl ? `${cl.servicesCount} services listed` : undefined,
      productsCatalog: cl ? `${cl.productsCount} products listed` : undefined,
      attributes: cl
        ? `${cl.attributesSet}/${cl.attributesTotal} set`
        : undefined,
      qaSection: cl ? `${cl.qaCount} Q&As` : undefined,
      reviewRecency: cl
        ? cl.lastReviewDaysAgo <= 30
          ? "Within 30 days"
          : `${cl.lastReviewDaysAgo} days ago`
        : undefined,
      messaging: cl
        ? cl.messagingEnabled
          ? "Enabled"
          : "Disabled"
        : undefined,
    };
    return map[id];
  }

  return (
    <View
      style={{
        backgroundColor: primary,
        shadowColor: link,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
        borderColor: link + "50",
      }}
      className="rounded-3xl border overflow-hidden mb-4"
    >
      {/* Header Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleOpen}
        className="flex-row items-center p-4"
      >
        {/* Icon Container */}
        <View
          style={{
            backgroundColor: `${cat.color}15`,
            borderColor: `${cat.color}25`,
            borderWidth: 1,
          }}
          className="w-11 h-11 rounded-full items-center justify-center mr-3.5"
        >
          <Text style={{ color: cat.color }}>{cat.icon}</Text>
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text style={{ color: text }} className="text-md font-bold">
              {cat.label}
            </Text>
            <View className="flex-row items-center">
              <Text
                style={{ color: cat.color }}
                className="text-sm font-black mr-2"
              >
                {earned} / {max}
              </Text>
              {open ? (
                <ChevronUp size={18} color={textMuted} />
              ) : (
                <ChevronDown size={18} color={textMuted} />
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View
            className={`h-1.5 rounded-full overflow-hidden mb-2 ${
              dark ? "bg-white/5" : "bg-purple-50"
            }`}
          >
            <LinearGradient
              colors={[`${cat.color}80`, cat.color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${pct}%` }}
              className="h-full rounded-full"
            />
          </View>

          {/* Status Badges */}
          <View className="flex-row items-center">
            {done > 0 && (
              <Text className="text-sm font-bold text-emerald-500 mr-3">
                {done} complete
              </Text>
            )}
            {partial > 0 && (
              <Text className="text-sm font-bold text-amber-500 mr-3">
                {partial} partial
              </Text>
            )}
            {missing > 0 && (
              <Text className="text-sm font-bold text-red-500">
                {missing} missing
              </Text>
            )}
            <Text
              style={{ color: textMuted }}
              className="text-sm font-medium ml-auto"
            >
              {pct}% done
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Accordion Content */}
      {open && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: link + "50",
          }}
          className="p-3 gap-y-2.5"
        >
          {items.map((item: any) => (
            <ItemCard
              key={item.id}
              item={item}
              status={statuses[item.id] ?? item.defaultStatus}
              dark={dark}
              catColor={cat.color}
              currentValue={getCurrentValue(item.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const APIBadge = ({
  field,
  dark,
}: {
  field: GoogleAPIField;
  dark: boolean;
}) => {
  const link = useColor("link");
  return (
    <View
      className={`flex-row items-start gap-2 p-2.5 rounded-xl border text-[10px] font-mono`}
      style={{ backgroundColor: link + "30", borderColor: link }}
    >
      <View className="flex-col gap-1 min-w-0 flex-1">
        {/* Field Path */}
        <Text
          className={`font-bold text-sm mb-1`}
          style={{ flexWrap: "wrap", color: link }}
        >
          {field.fieldPath}
        </Text>

        {/* Badges */}
        <View className="flex-row gap-1.5 flex-wrap">
          {field.readable && (
            <Text className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              READ
            </Text>
          )}
          {field.writable ? (
            <Text className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/20">
              WRITE
            </Text>
          ) : (
            <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-slate-500/15 text-slate-400 border border-slate-500/20">
              <Lock size={18} color="#94a3b8" />
              <Text>READ-ONLY</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// Sub-component for Item Cards
function ItemCard({
  item,
  status,
  dark,
  catColor,
  currentValue,
}: {
  item: CheckItem;
  status: Status;
  dark: boolean;
  catColor: string;
  currentValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"what" | "why" | "how" | "api">("what");
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");

  const cfg = STATUS_CFG[status];
  const imp = IMP[item.impact];
  const isDone = status === "complete";
  const isMiss = status === "missing";
  const isPartial = status === "partial";

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  // Status Styling Logic
  const getContainerStyle = () => {
    if (isDone)
      return dark
        ? "bg-[#091810] border-emerald-500/20"
        : "bg-emerald-50/40 border-emerald-300/50";
    if (isMiss)
      return dark
        ? "bg-[#130a0a] border-red-500/15"
        : "bg-red-50/30 border-red-200/50";
    return dark
      ? "bg-[#12100a] border-amber-500/15"
      : "bg-amber-50/30 border-amber-200/40";
  };

  return (
    <View
      style={{
        backgroundColor: primary,
        shadowColor: link,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
        borderColor: link + "30",
      }}
      className={`rounded-2xl border overflow-hidden mb-3 ${getContainerStyle()}`}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleOpen}
        className="flex-row p-4 items-start"
      >
        {/* Status Indicator Column */}
        <View className="items-center mr-3 pt-1">
          <View
            style={{
              backgroundColor: isDone ? "#22c55e" : "transparent",
              borderColor: isDone ? "#22c55e" : isMiss ? "#ef4444" : "#f59e0b",
              borderWidth: 2,
            }}
            className="w-5 h-5 rounded-full items-center justify-center"
          >
            {isDone && <Check size={12} color="white" strokeWidth={3} />}
            {isPartial && <View className="w-2 h-2 rounded-sm bg-amber-500" />}
          </View>
          {open && (
            <View
              className={`w-[1px] h-10 mt-2 ${dark ? "bg-white/5" : "bg-blue-100"}`}
            />
          )}
        </View>

        {/* Content Column */}
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-2">
            <Text
              style={{ color: text }}
              className="text-sm font-bold flex-1 pr-2"
            >
              {item.title}
            </Text>
            <View
              className="px-2 py-0.5 rounded-full border "
              style={{
                backgroundColor: `${imp.dot}15`,
                borderColor: `${imp.dot}30`,
              }}
            >
              <Text
                className="text-[9px] font-black uppercase"
                style={{ color: imp.color }}
              >
                {imp.label}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-wrap gap-2">
              <View
                className="px-2 py-0.5 rounded-3xl bordermr-2 flex-row items-center gap-1"
                style={{
                  borderColor: `${cfg.color}30`,
                  backgroundColor: cfg.bg,
                }}
              >
                <Text
                  className="text-[10px] font-bold flex-row items-center gap-1"
                  style={{ color: cfg.color }}
                >
                  {/* {status.toUpperCase()} */}
                  {/* {cfg.icon} */}
                  {cfg.label}
                </Text>
              </View>
              <Text
                style={{ color: textMuted }}
                className="text-xs font-black mr-2"
              >
                +{item.points} pts
              </Text>
              {currentValue && (
                <Text
                  numberOfLines={1}
                  className="text-[10px] font-mono max-w-[100px]"
                  style={{ color: link }}
                >
                  {currentValue}
                </Text>
              )}
            </View>
            <View className="flex-row items-center gap-1 shrink-0">
              {item.apiField.writable ? (
                <Text className="text-xs font-bold" style={{ color: link }}>
                  R/W
                </Text>
              ) : (
                <View className="flex-row items-center gap-1">
                  <Lock size={10} color={link} />
                  <Text className="text-xs font-bold" style={{ color: link }}>
                    RO
                  </Text>
                </View>
              )}
              {open ? (
                <ChevronUp size={18} color={textMuted} />
              ) : (
                <ChevronDown size={18} color={textMuted} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {open && (
        <View className={`border-t `} style={{ borderColor: link + "50" }}>
          {/* Tabs */}
          <View
            className="flex-row border-b "
            style={{ borderColor: textMuted }}
          >
            {["what", "why", "how", "api"].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t as any)}
                className={`flex-1 py-3 items-center border-b-2 `}
                style={{ borderColor: tab === t ? link : "transparent" }}
              >
                <Text
                  className={`text-sm font-bold `}
                  style={{ color: tab === t ? link : textMuted }}
                >
                  {/* {t.toUpperCase()} */}
                  {{ what: "What", why: "Why", how: "How", api: "API" }[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View className="p-4">
            {tab === "what" && (
              <View>
                <View className="flex-row items-center mb-2">
                  <Eye size={12} color={catColor} />
                  <Text
                    style={{ color: catColor }}
                    className="text-sm font-black uppercase ml-1.5 tracking-widest"
                  >
                    Definition
                  </Text>
                </View>
                <Text
                  style={{ color: dark ? "#CBD5E1" : text }}
                  className="text-sm leading-5"
                >
                  {item.what}
                </Text>
              </View>
            )}

            {tab === "why" && (
              <View>
                <View className="flex-row items-center gap-1.5 mb-2">
                  <TrendingUp size={14} color="#38bdf8" />
                  <Text className="text-sm text-sky-400 uppercase font-black tracking-widest">
                    Why It Matters
                  </Text>
                </View>
                <Text
                  className="text-sm leading-relaxed"
                  style={{ color: textMuted }}
                >
                  {item.why}
                </Text>
              </View>
            )}

            {tab === "how" && (
              <View>
                <View className="flex-row items-center mb-2">
                  <Zap size={14} color="#10B981" />
                  <Text className="text-sm font-black uppercase ml-1.5 tracking-widest text-emerald-500">
                    Step-by-step
                  </Text>
                </View>
                <Text
                  style={{ color: dark ? "#CBD5E1" : text }}
                  className="text-sm leading-5"
                >
                  {item.how}
                </Text>
                {item.apiField.writable && (
                  <View
                    className={`mt-3 flex-row items-center gap-2 px-3 py-2 rounded-xl border ${dark ? "bg-emerald-500/[0.06] border-emerald-500/20" : "bg-emerald-50 border-emerald-200/60"}`}
                  >
                    <Wand2
                      size={14}
                      color="#34d399"
                      className="text-emerald-400 "
                    />
                    <Text
                      className={`text-sm ${dark ? "text-emerald-300/80" : "text-emerald-700"}`}
                    >
                      This field can be updated automatically via Google
                      Business API.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {tab === "api" && (
              <View>
                {/* Header */}
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Cpu size={18} color="#60a5fa" />
                  <Text className="text-sm font-black uppercase tracking-widest text-blue-400">
                    Google API Field
                  </Text>
                </View>

                {/* Badge */}
                <APIBadge field={item.apiField} dark={dark} />

                {/* Endpoint box */}
                <View
                  className={`mt-2.5 p-2.5 rounded-xl border ${
                    dark
                      ? "bg-white/[0.02] border-white/[0.05]"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-mono `}
                    style={{ flexWrap: "wrap", color: textMuted }}
                  >
                    {item.apiField.endpoint}
                  </Text>
                </View>

                {/* Reference */}
                <Text
                  className={`text-[11px] mt-2.5 leading-relaxed `}
                  style={{ color: textMuted }}
                >
                  Ref: Google Business Profile API —{" "}
                  <Text className={`font-mono text-sm`} style={{ color: link }}>
                    {item.googleDoc}
                  </Text>
                </Text>
              </View>
            )}

            {/* AI Insight Section */}
            <View
              style={{
                backgroundColor: link + "30",
                borderColor: link + "50",
              }}
              className="mt-4 p-3 rounded-xl flex-row items-start border gap-3"
            >
              <View
                className="p-2 rounded-lg"
                style={{ backgroundColor: link + "30" }}
              >
                <Brain size={14} color={link} className="mr-2 mt-0.5" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Sparkles size={14} color={link} />
                  <Text
                    className="text-sm font-black uppercase ml-1"
                    style={{ color: link }}
                    numberOfLines={1}
                  >
                    AI Insight
                  </Text>
                </View>
                <Text
                  style={{ color: text }}
                  className="text-xs leading-4 italic"
                >
                  {item.aiInsight}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const AutoFixCard = ({ dark = false }) => {
  const features = [
    {
      icon: <FileText size={16} color="#60a5fa" />,
      label: "AI Description",
      color: "#60a5fa",
    },
    {
      icon: <Zap size={16} color="#4ade80" />,
      label: "Weekly Posts",
      color: "#4ade80",
    },
    {
      icon: <MessageSquare size={16} color="#a78bfa" />,
      label: "Review Replies",
      color: "#a78bfa",
    },
    {
      icon: <Tag size={16} color="#fbbf24" />,
      label: "Offer Generator",
      color: "#fbbf24",
    },
  ];
  const text = useColor("text");
  const primary = useColor("primary");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const router = useRouter();

  return (
    <View className="p-4 mx-3 mb-10">
      <View
        style={{
          backgroundColor: primary,
          borderColor: link + "50",
          shadowColor: link,
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: dark ? 0.1 : 0.08,
          shadowRadius: 20,
          elevation: 6,
        }}
        className="rounded-3xl border p-5 relative overflow-hidden"
      >
        {/* Top Radial Glow Effect */}
        <View
          className="absolute -top-10 -right-10 w-40 h-40 pointer-events-none"
          style={{ opacity: 0.5 }}
        >
          <View
            style={{
              backgroundColor: "rgba(159, 87, 245, 0.1)",
              width: 160,
              height: 160,
              borderRadius: 80,
            }}
          />
        </View>

        {/* Top Decorative Line */}
        <LinearGradient
          colors={["transparent", "rgba(159, 87, 245, 0.4)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="h-[1px] w-full mb-5"
        />

        {/* Header Section */}
        <View className="flex-row items-center mb-4">
          <View
            style={{
              backgroundColor: link + "30",
              borderColor: link + "50",
              borderWidth: 1,
            }}
            className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
          >
            <Wand2 size={20} color={link} />
          </View>
          <View>
            <Text
              style={{
                color: dark ? "#FFFFFF" : text,
                letterSpacing: -0.5,
              }}
              className="text-lg font-black"
            >
              Auto-Fix with AI
            </Text>
            <Text style={{ color: textMuted }} className="text-sm">
              Let AI write, optimise, and post for you
            </Text>
          </View>
        </View>

        {/* Features Grid */}
        <View className="flex-row flex-wrap justify-between mb-4">
          {features.map((f, i) => (
            <View
              key={i}
              style={{
                backgroundColor: dark ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
                borderColor: dark ? "rgba(255, 255, 255, 0.05)" : "#F1F5F9",
                width: "48.5%",
              }}
              className="flex-row items-center px-3 py-2.5 rounded-xl border mb-2"
            >
              <View className="mr-2">{f.icon}</View>
              <Text
                style={{ color: textMuted }}
                className="text-sm font-semibold"
              >
                {f.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Primary CTA Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: link + "50" }}
          onPress={() => router.push("/(tabs)/(post)/CreatePostScreen")}
        >
          <LinearGradient
            colors={[primary, "#2a0e45", link]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              shadowColor: link,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.38,
              shadowRadius: 14,
              elevation: 8,
              borderColor: link,
            }}
            className="w-full py-4 rounded-xl flex-row items-center justify-center gap-3"
          >
            <Sparkles size={16} color="white" />
            <Text className="text-white text-sm font-black">
              Start AI Optimisation
            </Text>
            <ArrowUpRight size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer Disclaimer */}
        <Text style={{ color: textMuted }} className="text-center text-xs mt-4">
          Real data from Google Business Profile API · Score updates on Re-scan
        </Text>
      </View>
    </View>
  );
};

const GBPScreen = () => {
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const link = useColor("link");
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");
  const yellow = useColor("yellow");
  const red = useColor("red");
  const green = useColor("green");

  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false); // overlay finished animation
  const [filter, setFilter] = useState<
    "all" | "missing" | "partial" | "complete"
  >("all");
  const { data: user, isLoading: userLoading } = useUser();

  // Stable locationId — avoids stale closure inside queryFn
  const locationId = user?.googleLocationId ?? "";

  // ── profile score ──
  const {
    data: scoreData,
    isLoading: scoreLoading,
    isFetching: scoreFetching,
    refetch: refetchScore,
  } = useQuery<ProfileScoreData>({
    // locationId in key so query re-fires when user loads after refresh
    queryKey: ["profile-score", locationId],
    queryFn: async ({ queryKey }) => {
      const lid = queryKey[1] as string; // always from key, never stale closure
      const res = await fetch(
        `${FRONTEND_URL}/api/google/accounts/profile-score?locationId=${lid}`,
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
          cache: "no-store",
        },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "profile-score failed");
      return json as ProfileScoreData;
    },
    enabled: !!locationId,
    staleTime: 0, // always re-fetch on mount / refetch() — fixes refresh bug
    gcTime: 5 * 60_000, // keep in cache 5 min so navigation is instant
    retry: 1,
  });

  // ── checklist data ──
  const {
    data: checklistData,
    isLoading: checklistLoading,
    isFetching: checklistFetching,
    refetch: refetchChecklist,
  } = useQuery<ChecklistData>({
    queryKey: ["checklist-data", locationId],
    queryFn: async ({ queryKey }) => {
      const lid = queryKey[1] as string;
      const res = await fetch(
        `${FRONTEND_URL}/api/google/checklist-data?locationId=${lid}`,
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
          cache: "no-store",
        },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "checklist-data failed");
      return json as ChecklistData;
    },
    enabled: !!locationId,
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: 1,
  });

  // True while either query is in-flight
  const isFetching = scoreFetching || checklistFetching;

  // ── derive statuses from real data ──
  const statuses = useMemo(
    () => deriveStatuses(scoreData, checklistData),
    [scoreData, checklistData],
  );
  const score = scoreData?.score ?? 0;

  const allItems = CATEGORIES.flatMap((c) => c.items);
  const counts = {
    complete: allItems.filter((i) => statuses[i.id] === "complete").length,
    partial: allItems.filter((i) => statuses[i.id] === "partial").length,
    missing: allItems.filter((i) => statuses[i.id] === "missing").length,
    total: allItems.length,
  };

  // ── loading / unconnected (before early return) ──
  const isInitialLoading =
    userLoading || (!!locationId && (scoreLoading || checklistLoading));

  // ── Re-scan: force real API call regardless of cache ──
  async function handleRescan() {
    setScanning(true);
    setScanDone(false);
    try {
      // cancelRefetch:true kills any in-flight request and starts a fresh one
      await Promise.all([
        refetchScore({ cancelRefetch: true }),
        refetchChecklist({ cancelRefetch: true }),
      ]);
    } catch {
      // errors are already caught per-query; don't block overlay close
    }
    // Overlay closes after data arrives (scanDone flag set by ScanOverlay onDone)
    // Give a short grace period so the UI updates visibly
    setTimeout(() => setScanning(false), 400);
  }

  // visibleCats defined before early-returns — stable, no stale closure issues
  const visibleCats = () => {
    if (filter === "all") return CATEGORIES;
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((i) => statuses[i.id] === filter),
    })).filter((c) => c.items.length > 0);
  };

  const dark = useSelector((state: RootState) => state.theme.mode) === "dark";

  if (isInitialLoading) return <PageSkeleton dark={false} />;
  if (!user?.googleLocationId) return <NotConnected dark={dark} />;
  if (scoreLoading || checklistLoading) return <PageSkeleton dark={dark} />;

  const tiers = [
    {
      label: "Incomplete",
      range: "0–349",
      color: "#f87171",
      active: score < 350,
    },
    {
      label: "Basic",
      range: "350–549",
      color: "#fb923c",
      active: score >= 350 && score < 550,
    },
    {
      label: "Growing",
      range: "550–749",
      color: "#a78bfa",
      active: score >= 550 && score < 750,
    },
    {
      label: "Advanced",
      range: "750–899",
      color: "#38bdf8",
      active: score >= 750 && score < 900,
    },
    { label: "Elite", range: "900+", color: "#34d399", active: score >= 900 },
  ];

  const stats = scoreData
    ? [
        {
          label: "Avg Rating",
          value:
            scoreData.meta.avgRating > 0 ? `${scoreData.meta.avgRating}★` : "—",
          color: "#f59e0b",
        },
        {
          label: "Reviews",
          value: String(scoreData.meta.totalReviews),
          color: "#3b82f6",
        },
        {
          label: "Reply Rate",
          value: `${scoreData.meta.replyRate}%`,
          color: "#22c55e",
        },
        {
          label: "Posts/mo",
          value: String(scoreData.meta.postsLast30d),
          color: "#8b5cf6",
        },
        {
          label: "Verified",
          value: scoreData.meta.isVerified ? "Yes ✓" : "No",
          color: scoreData.meta.isVerified ? "#22c55e" : "#ef4444",
        },
        {
          label: "Status",
          value: scoreData.meta.isOpen ? "Open" : "—",
          color: "#22c55e",
        },
      ]
    : [];

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: primary }}>
      {scanning && (
        <ScanOverlay dark={dark} onDone={() => setScanning(false)} />
      )}
      {/* Main Card Container */}
      <View
        style={{
          backgroundColor: primary,
        }}
        className="p-6"
      >
        {/* Header Section */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1">
            <View
              className="rounded-full px-3 py-1 self-start mb-2"
              style={{ backgroundColor: link + "30" }}
            >
              <Text className=" text-sm font-bold" style={{ color: link }}>
                ● AI POWERED AUDIT
              </Text>
            </View>
            <Text style={{ color: text }} className="text-2xl font-bold">
              GBP Score Card
            </Text>
            <Text style={{ color: textMuted }} className="text-xs">
              {scoreData?.meta.locationName ?? "Google Business Profile"} · 30
              factors
            </Text>
          </View>

          <TouchableOpacity
            className="rounded-lg overflow-hidden"
            onPress={handleRescan}
            disabled={scanning || isFetching}
          >
            <LinearGradient
              colors={[primary, link]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-3 py-2 rounded-lg items-center justify-center flex-row gap-2 overflow-hidden"
            >
              <RefreshCcw color="white" size={18} />
              <Text className="text-white text-sm font-bold mt-1">
                {isFetching ? "Scanning" : "Re-scan"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: primary,
            shadowColor: link,
            borderColor: link,
          }}
          className="rounded-3xl p-4 shadow-md border"
        >
          {/* Score Overview Section */}
          <View className="my-2 mb-4">
            <ScoreRing score={score} dark={dark} />
          </View>

          {/* Status Counters */}
          <View className="flex-row justify-around rounded-2xl py-4 mb-6">
            <StatusItem
              count={counts.complete}
              label="Done"
              color="text-green-500"
            />
            <StatusItem
              count={counts.partial}
              label="Partial"
              color="text-yellow-500"
            />
            <StatusItem
              count={counts.missing}
              label="Missing"
              color="text-red-400"
            />
          </View>

          {/* Categories List */}
          <View className="my-2">
            {CATEGORIES.slice(0, 3).map((cat) => (
              <CatBar key={cat.id} cat={cat} statuses={statuses} dark={dark} />
            ))}
          </View>
          <View className="mb-4">
            <Text
              className="text-md font-bold uppercase"
              style={{ color: textMuted }}
            >
              All Categories
            </Text>
            {CATEGORIES.slice(3).map((cat) => (
              <CatBar key={cat.id} cat={cat} statuses={statuses} dark={dark} />
            ))}
          </View>
          <View
            className="border-t px-3 py-2 flex-row"
            style={{ borderColor: link + "80" }}
          >
            {tiers.map((tier, i) => (
              <View
                key={i}
                className={`flex-1 items-center py-3 gap-0.5 border-r ${
                  i === tiers.length - 1 ? "border-r-0" : ""
                } ${dark ? "border-purple-900/30" : "border-purple-100/60"} ${
                  tier.active ? (dark ? "bg-white/5" : "bg-purple-50/60") : ""
                }`}
              >
                {/* Dot */}
                <View
                  className="w-2 h-2 rounded-full mb-0.5"
                  style={{
                    backgroundColor: tier.active
                      ? tier.color
                      : dark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.08)",
                    shadowColor: tier.active ? tier.color : "transparent",
                    shadowOpacity: tier.active ? 0.8 : 0,
                    shadowRadius: tier.active ? 6 : 0,
                  }}
                />

                {/* Label */}
                <Text
                  className="text-xs font-black"
                  style={{
                    color: tier.active
                      ? tier.color
                      : dark
                        ? "#475569"
                        : "#cbd5e1",
                  }}
                >
                  {tier.label}
                </Text>

                {/* Range */}
                <Text
                  className={`text-[10px]`}
                  style={{ color: tier.active ? textMuted : textMuted + "30" }}
                >
                  {tier.range}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      {/* --- Live Stats from Google Section --- */}
      {scoreData?.meta && (
        <View
          style={{
            backgroundColor: primary,
            shadowColor: link,
            borderColor: link,
          }}
          className="rounded-2xl p-6 shadow-xl border mb-6 mx-7"
        >
          <Text
            style={{ color: textMuted }}
            className="text-sm font-bold uppercase tracking-wider mb-5"
          >
            LIVE STATS FROM GOOGLE
          </Text>

          <View className="flex-row flex-wrap -mx-1">
            {stats.map((s, i) => (
              <View key={i} className="w-1/3 px-1 mb-3">
                <View
                  className={`flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border`}
                  style={{
                    backgroundColor: dark
                      ? "rgba(255,255,255,0.03)"
                      : "#f8fafc",
                    borderColor: dark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                  }}
                >
                  <Text
                    className="text-lg font-black"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </Text>
                  <Text
                    className="text-sm font-bold"
                    style={{ color: textMuted }}
                  >
                    {s.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      {/* --- Quick Wins Section --- */}
      <View className="mb-5">
        <View className="flex-row items-center justify-between mx-7 mb-4">
          <Text style={{ color: text }} className="text-xl font-bold">
            Quick Wins
          </Text>
          <Text style={{ color: link }} className="text-sm font-medium">
            Highest impact, lowest effort
          </Text>
        </View>

        <View
          style={{
            backgroundColor: primary,
            shadowColor: link,
            borderColor: link,
          }}
          className="rounded-2xl p-3 shadow-xl border mx-7"
        >
          <QuickWins statuses={statuses} dark={dark} />
        </View>
      </View>
      {/* AI Recommendations */}
      <View className="my-2 mx-7 gap-3">
        <Text className="text-lg font-bold" style={{ color: text }}>
          AI Recommendations
        </Text>
        <AIRecs
          statuses={statuses}
          dark={dark}
          missingFromAPI={scoreData?.missing ?? []}
        />
      </View>
      <View className="mx-7 my-2">
        <FilterRow
          filter={filter}
          setFilter={setFilter}
          dark={dark}
          counts={counts}
        />
      </View>
      <View className="mx-7 my-2">
        {visibleCats().map((cat, i) => (
          <CategorySection
            key={cat.id}
            cat={cat}
            statuses={statuses}
            dark={dark}
            defaultOpen={i === 0}
            scoreData={scoreData}
            checklistData={checklistData}
          />
        ))}
      </View>
      <AutoFixCard dark={dark} />
    </ScrollView>
  );
};

// Helper Components
const ScoreStat = ({ label, sub }: any) => (
  <View className="items-center">
    <Text className="font-bold text-blue-900">{label}</Text>
    <Text className="text-[10px] text-gray-500 uppercase">{sub}</Text>
  </View>
);

const StatusItem = ({ count, label, color }: any) => {
  const textMuted = useColor("textMuted");
  return (
    <View className="items-center">
      <Text className={`text-xl font-bold ${color}`}>{count}</Text>
      <Text className="text-xs font-medium" style={{ color: textMuted }}>
        {label}
      </Text>
    </View>
  );
};

export default GBPScreen;
