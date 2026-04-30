// services/auth.service.ts

import { clearRefreshToken, clearToken } from "@/services/auth.util";
import { store } from "@/store";
import { logout as logoutAction } from "@/store/slices/auth.slice";
import { router } from "expo-router";

export async function logout() {
  // await clearToken();
  // store.dispatch(logoutAction());
  // router.replace("/(auth)/login");
  await clearToken();
  await clearRefreshToken();
  store.dispatch(logoutAction());
  router.replace("/(auth)/login");
}
