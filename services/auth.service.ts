// services/auth.service.ts

import { queryClient } from "@/providers/queryClient";
import { clearRefreshToken, clearToken } from "@/services/auth.util";
import { store } from "@/store";
import {
  logout as logoutAction,
  setAuth,
  updateUser,
} from "@/store/slices/auth.slice";
import { User } from "@/types/user";
import { QueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

export async function logout() {
  // await clearToken();
  // store.dispatch(logoutAction());
  // router.replace("/(auth)/login");
  await clearToken();
  await clearRefreshToken();
  store.dispatch(logoutAction());
  // const queryClient = new QueryClient();
  queryClient.clear();
  router.replace("/(auth)/login");
}
