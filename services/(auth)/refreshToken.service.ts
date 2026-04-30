import { AppDispatch } from "@/store";
import { logout as logoutAction, updateToken } from "@/store/slices/auth.slice";
import {
  clearAllTokens,
  getRefreshToken,
  saveToken,
  saveRefreshToken,
} from "@/services/auth.util";
import { API_URL } from "@/config/.env";

// ─── Refresh Lock (shared with api/client.ts queue) ──────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!),
  );
  refreshQueue = [];
}

export async function refreshAccessToken(
  dispatch: AppDispatch,
): Promise<string> {
  // If already refreshing, queue this call and wait
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) throw new Error("No refresh token in secure storage");

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw new Error(`Refresh failed: ${response.status}`);

    const data = await response.json();

    const newAccessToken: string = data.accessToken;
    const newRefreshToken: string | undefined = data.refreshToken;

    await saveToken(newAccessToken);
    if (newRefreshToken) await saveRefreshToken(newRefreshToken);

    dispatch(updateToken(newAccessToken));
    processQueue(null, newAccessToken);

    return newAccessToken;
  } catch (err) {
    processQueue(err, null);
    await clearAllTokens();
    dispatch(logoutAction());
    throw err;
  } finally {
    isRefreshing = false;
  }
}

// import { refreshAccessTokenApi } from "@/api/auth.api";
// import { saveToken } from "../auth.util";
// import { AppDispatch } from "@/store";
// import { updateToken } from "@/store/slices/auth.slice";
// import { API_URL } from "@/config/.env";

// export async function refreshAccessToken(token: string, dispatch: AppDispatch) {
//   try {
//     // const response = await refreshAccessTokenApi(token);
//     // console.log("Response from refreshAccessTokenApi: ", response);

//     // const accessToken = response.data.accessToken;
//     const res = await fetch(`${API_URL}/auth/refresh`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     console.log("Refresh response status:", res.status);

//     if (!res.ok) {
//       console.log("Refresh failed with status:", res.status);
//       return null; // ✅ Return null instead of throwing so catch in AuthGuard fires
//     }

//     const data = await res.json();
//     console.log("Refresh data:", data);

//     if (data?.accessToken) {
//       await saveToken(data.accessToken);
//       dispatch(updateToken(data.accessToken));
//       return data;
//     }

//     return null;

//     // if (!accessToken) {
//     //   console.log("Unable to get the new accessToken from backend.");
//     //   return;
//     // }

//     // await saveToken(accessToken);
//     // dispatch(updateToken(token));

//     // return { success: true, accessToken: accessToken };
//   } catch (e: any) {
//     return {
//       success: false,
//       message: e.response?.data?.message || "Unable to refresh the token.",
//     };
//   }
// }
