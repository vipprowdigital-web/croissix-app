// services/auth.util.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode as atob } from "base-64"; // ✅ install: npm i base-64
import * as SecureStore from "expo-secure-store";

// KEY NAME (consistent + easy to change)
// const TOKEN_KEY = "authToken";
const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Save JWT
export async function saveToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error("Error saving token:", err);
  }
}

// Get JWT
export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error("Error getting token:", err);
    return null;
  }
}

// Remove JWT
export async function clearToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error("Error clearing token:", err);
  }
}

// ✅ Proper JWT decode in RN (handles base64url)
export function decodeToken(token: string | null) {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const decoded = JSON.parse(jsonPayload);

    return decoded;
  } catch (e) {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp > currentTime;
}

// ─── REFRESH TOKEN (SecureStore) ──────────────────────────────────────────────

export async function saveRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (err) {
    console.error("Error saving refresh token:", err);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.error("Error getting refresh token:", err);
    return null;
  }
}

export async function clearRefreshToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.error("Error clearing refresh token:", err);
  }
}

// ─── CLEAR BOTH (on logout) ───────────────────────────────────────────────────

export async function clearAllTokens(): Promise<void> {
  await Promise.all([clearToken(), clearRefreshToken()]);
}
