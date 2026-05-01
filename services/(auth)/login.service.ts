// services/(auth)/login.service.ts

import { loginApi } from "@/api/auth.api";
import { saveRefreshToken, saveToken } from "@/services/auth.util";
import { setAuth, updateUser } from "@/store/slices/auth.slice";
import { AppDispatch } from "@/store";
import { queryClient } from "@/providers/queryClient";

export async function handleLogin(
  email: string,
  password: string,
  dispatch: AppDispatch,
) {
  try {
    const payload = {
      email: email.trim().toLowerCase(),
      password: password.trim(),
    };

    const response = await loginApi(payload);
    // console.log("Response from login api: ", response);

    const data = response.data;
    console.log("Response from login api: ", data);

    // Save token in Storage
    await saveToken(data.accessToken);
    await saveRefreshToken(data.refreshToken);

    // Save in Redux
    dispatch(
      setAuth({
        user: data.user,
        token: data.accessToken,
      }),
    );
    dispatch(updateUser(data.user));
    // queryClient.removeQueries({ queryKey: ["user-profile"] });
    return { success: true, message: data.message };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Something went wrong. Try again.",
    };
  }
}
