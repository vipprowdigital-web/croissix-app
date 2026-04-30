// api/client.ts

import axios from "axios";
import { API_URL } from "@/config/.env";
import { clearToken, getToken } from "@/services/auth.util";
import { store } from "@/store";
import { logout } from "@/store/slices/auth.slice";
import { refreshAccessToken } from "@/services/(auth)/refreshToken.service";

// ----------------------------------
// Create Axios Instance
// ----------------------------------
export const API = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// ----------------------------------
// Attach Token to All Requests
// ----------------------------------
API.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 1. Variables to manage the "Refresh Lock"
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ----------------------------------
// Handle Global Response Errors
// ----------------------------------
// API.interceptors.response.use(

// (response) => response, // Pass successful responses through
// async (error) => {
//   const originalRequest = error.config;

//   // If error is 401 and it's not a retry
//   if (error.response?.status === 401 && !originalRequest._retry) {
//     if (isRefreshing) {
//       // If a refresh is ALREADY in progress, wait for it
//       return new Promise((resolve, reject) => {
//         failedQueue.push({ resolve, reject });
//       })
//         .then((token) => {
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return API(originalRequest);
//         })
//         .catch((err) => Promise.reject(err));
//     }

//     originalRequest._retry = true;
//     isRefreshing = true;

//     try {
//       const currentToken = await getToken();
//       // Add this check:
//       if (!currentToken) {
//         // If no token exists, we can't refresh. Force a logout or reject.
//         logout();
//         return Promise.reject(error);
//       }
//       const result = await refreshAccessToken(currentToken, store.dispatch);

//       const newToken = result?.accessToken;

//       if (newToken) {
//         isRefreshing = false;
//         processQueue(null, newToken); // Resolve all pending requests

//         // Retry the original request
//         originalRequest.headers.Authorization = `Bearer ${newToken}`;
//         return API(originalRequest);
//       }
//     } catch (refreshError) {
//       isRefreshing = false;
//       processQueue(refreshError, null); // Reject all pending requests
//       return Promise.reject(refreshError);
//     }
//   }

//   return Promise.reject(error);
// },
// );

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ✅ No longer passing token — service reads refreshToken from SecureStore
        const newToken = await refreshAccessToken(store.dispatch);

        isRefreshing = false;
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        // refreshAccessToken already called clearAllTokens + dispatch(logout)
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
