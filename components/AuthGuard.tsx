// components/AuthGuard.tsx

// components/AuthGuard.tsx
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState, store } from "@/store";
import { clearToken, getToken, decodeToken } from "@/services/auth.util";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import { logout as logoutAction, setAuth } from "@/store/slices/auth.slice";
import { refreshAccessToken } from "@/services/(auth)/refreshToken.service";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useDispatch();
  const navigationState = useRootNavigationState();

  const [checking, setChecking] = useState(true);
  const hasRedirected = useRef(false);

  console.log("Inside AuthGuard");
  // const hasAttemptedHydration = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function verify() {
      console.log("Inside Verify");

      // 1. Wait for Expo Router to be ready
      if (!navigationState?.key) return;

      // ✅ Don't run again if we already handled it
      if (hasRedirected.current) return;

      // const token = await getToken();
      let token = await getToken();
      console.log("Token: ", token);

      const currentSegment = segments[0];
      const inAuthGroup = currentSegment === "(auth)";

      // CASE 1: NO TOKEN
      if (!token) {
        console.log("No Token");
        if (!inAuthGroup) {
          console.log("!inAuthGroup");
          hasRedirected.current = true;
          router.replace("/(auth)/login");
        }
        if (mounted) setChecking(false);
        console.log("Mounted false..");
        return;
      }

      console.log("Token Found");
      // CASE 2: TOKEN EXISTS - CHECK EXPIRY
      const decoded: any = decodeToken(token);
      const isExpired = !decoded || decoded.exp * 1000 < Date.now();

      if (isExpired) {
        // ✅ Try refreshing before giving up
        try {
          console.log("AuthGuard: Token expired, attempting refresh...");
          token = await refreshAccessToken(dispatch);
          console.log("AuthGuard: Refresh succeeded.");
        } catch {
          // ✅ Refresh failed — refreshAccessToken already cleared tokens + dispatched logout
          console.log("AuthGuard: Refresh failed, redirecting to login.");
          if (!inAuthGroup) {
            hasRedirected.current = true;
            router.replace("/(auth)/login");
          }
          if (mounted) setChecking(false);
          return;
        }
      }

      // try {
      // console.log("AuthGuard: Attempting Token Refresh...");
      // const refreshResult = await refreshAccessToken(token, dispatch);
      // console.log("Refresh result:", refreshResult);

      // if (refreshResult?.accessToken) {
      //   token = refreshResult.accessToken;
      // } else {
      //   throw new Error("Refresh returned null");
      // }
      // } catch (e) {
      // if (isExpired) {
      // console.log("AuthGuard: Refresh failed, logging out.");
      // await clearToken();
      // dispatch(logoutAction());
      // if (!inAuthGroup) {
      //   hasRedirected.current = true;
      //   router.replace("/(auth)/login");
      // }
      // if (mounted) setChecking(false);
      // return;
      // }
      // }

      // if (isExpired) {
      //   console.log("AuthGuard: Refresh failed, logging out.");
      //   await clearToken();
      //   dispatch(logoutAction());
      //   if (!inAuthGroup) {
      //     hasRedirected.current = true;
      //     router.replace("/(auth)/login");
      //   }
      //   if (mounted) setChecking(false);
      //   return;
      // }

      // CASE 3: VALID TOKEN BUT REDUX IS EMPTY (The "Empty Data" Fix)
      // If we have a token but Redux doesn't have the user, sync them.
      // const decoded: any = decodeToken(token);
      if (token && (!isAuthenticated || !user)) {
        console.log("AuthGuard: Syncing token to Redux...");
        const freshDecoded: any = decodeToken(token);
        dispatch(
          setAuth({
            token,
            // user: decoded.user || decoded,
            user: freshDecoded.user || freshDecoded,
          }),
        );
        return;
      }

      // CASE 4: REDIRECT LOGGED-IN USERS AWAY FROM LOGIN/SIGNUP
      if (inAuthGroup) {
        hasRedirected.current = true;
        router.replace("/(tabs)/(home)");
        // if (mounted) setChecking(false);
        return;
      }

      // If we passed all checks, stop the loading spinner
      if (mounted) setChecking(false);
    }

    verify();

    return () => {
      mounted = false;
    };
  }, [segments, isAuthenticated, navigationState]);
  // useEffect(() => {
  //   let mounted = true;
  //   console.log("Inside use effect");

  //   async function verify() {
  //     console.log("Inside verify");
  //     // ⛔ Don’t run until router is hydrated
  //     if (!navigationState?.key) return;
  //     console.log("Router is hydrated");

  //     const current = segments.join("/") || "";

  //     const token = await getToken();
  //     console.log("token", token);

  //     // ------------------ CASE 1: NO TOKEN -------------------
  //     if (!token) {
  //       const inAuth = current.startsWith("(auth)");
  //       if (!inAuth) router.replace("/(auth)/login");

  //       mounted && setChecking(false);
  //       return;
  //     }

  //     // ---------------- CASE 2: TOKEN EXISTS ------------------
  //     const decoded: any = decodeToken(token);
  //     const expired = !decoded || decoded.exp * 1000 < Date.now();
  //     console.log("decoded: ", decoded);
  //     console.log("expired: ", expired);

  //     if (expired) {
  //       console.log("token expired.");

  //       await clearToken();
  //       store.dispatch(logoutAction());

  //       const inAuth = current.startsWith("(auth)");
  //       if (!inAuth) router.replace("/(auth)/login");

  //       mounted && setChecking(false);
  //       return;
  //     }

  //     // --------- CASE 3: LOGGED IN BUT IN AUTH ROUTE ---------
  //     if (current.startsWith("(auth)")) {
  //       console.log("current in auth..");

  //       router.replace("/(tabs)/(home)");
  //     }

  //     console.log("mounted");

  //     mounted && setChecking(false);
  //   }

  //   verify();

  //   return () => {
  //     console.log("mounted false");

  //     mounted = false;
  //   };
  // }, [segments, isAuthenticated, navigationState, router]);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return <>{children}</>;
}
