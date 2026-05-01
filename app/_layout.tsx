// app/_layout.tsx
import { Colors } from "@/theme/colors";
import { ThemeProvider } from "@/theme/theme-provider";
import * as NavigationBar from "expo-navigation-bar";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { setBackgroundColorAsync } from "expo-system-ui";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";
import { Provider, useSelector } from "react-redux";
import { RootState, store } from "@/store";
import { ToastProvider } from "@/components/ui/toast";
import AuthGuard from "@/components/AuthGuard";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { clearToken, getToken } from "@/services/auth.util";
import { logout } from "@/services/auth.service";
import { refreshAccessToken } from "@/services/(auth)/refreshToken.service";
import { queryClient } from "@/providers/queryClient";

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

function RootLayoutNav() {
  // Now this works because it's a child of the Provider!
  const colorScheme = useSelector((state: RootState) => state.theme.mode);
  // const router = useRouter();
  // const queryClient = new QueryClient();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync(
        colorScheme === "light" ? "dark" : "light",
      );
    }
    setBackgroundColorAsync(
      colorScheme === "dark" ? Colors.dark.background : Colors.light.background,
    );
  }, [colorScheme]);

  // Move the rest of your useEffects (Google OAuth, etc.) here too

  return (
    <ThemeProvider>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} animated />
      <Stack
        screenOptions={{
          headerShown: false,
          statusBarStyle: colorScheme === "light" ? "dark" : "light",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(splash)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await getToken();
        if (token) {
          const result = await refreshAccessToken(store.dispatch);
          if (!result) {
            store.dispatch(logout);
            await clearToken();
          }
        }
      } catch {
        store.dispatch(logout);
        await clearToken();
      }
    }

    bootstrap();
  }, []);
  // const colorScheme = useColorScheme() || "dark";
  // const colorScheme = useSelector((state: RootState) => state.theme.mode);
  // const router = useRouter();

  // useEffect(() => {
  //   if (Platform.OS === "android") {
  //     NavigationBar.setButtonStyleAsync(
  //       colorScheme === "light" ? "dark" : "light",
  //     );
  //   }
  //   setBackgroundColorAsync(
  //     colorScheme === "dark" ? Colors.dark.background : Colors.light.background,
  //   );
  // }, [colorScheme]);

  // Keep the root view background color in sync with the current theme
  // useEffect(() => {
  //   setBackgroundColorAsync(
  //     colorScheme === "dark" ? Colors.dark.background : Colors.light.background,
  //   );
  // }, [colorScheme]);

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const data = Linking.parse(url);

      if (data.hostname === "oauth-success" || data.path === "oauth-success") {
        console.log("✅ Google OAuth completed");

        console.log("Now you can fetch the user details from backend.");
        router.push("/(tabs)/(profile)");
      }
      // Add this
      if (data.hostname === "subscription" && data.path === "success") {
        console.log("✅ Subscription completed");
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        router.replace("/(tabs)/(home)");
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthGuard>
            <ToastProvider>
              {/* <SubscriptionGuard> */}
              <RootLayoutNav />
              {/* </SubscriptionGuard> */}
            </ToastProvider>
          </AuthGuard>
        </QueryClientProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

{
  /* <ThemeProvider>
                <StatusBar
                  style={colorScheme === "dark" ? "light" : "dark"}
                  animated
                />
                <Stack
                  screenOptions={{ headerShown: false }}
                  // initialRouteName="(splash)/index"
                >
                  <Stack.Screen
                    name="(splash)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  /> */
}
{
  /* <Stack.Screen
                    name="sheet"
                    options={{
                      headerShown: false,
                      sheetGrabberVisible: true,
                      sheetAllowedDetents: [0.4, 0.7, 1],
                      contentStyle: {
                        backgroundColor: isLiquidGlassAvailable()
                          ? "transparent"
                          : colorScheme === "dark"
                            ? Colors.dark.card
                            : Colors.light.card,
                      },
                      headerTransparent: Platform.OS === "ios" ? true : false,
                      headerLargeTitle: false,
                      title: "",
                      presentation:
                        Platform.OS === "ios"
                          ? isLiquidGlassAvailable() && osName !== "iPadOS"
                            ? "formSheet"
                            : "modal"
                          : "modal",
                      sheetInitialDetentIndex: 0,
                      headerStyle: {
                        backgroundColor:
                          Platform.OS === "ios"
                            ? "transparent"
                            : colorScheme === "dark"
                              ? Colors.dark.card
                              : Colors.light.card,
                      },
                      headerBlurEffect: isLiquidGlassAvailable()
                        ? undefined
                        : colorScheme === "dark"
                          ? "dark"
                          : "light",
                    }}
                  /> */
}
{
  /* <Stack.Screen name="+not-found" />
                </Stack>
              </ThemeProvider> */
}
