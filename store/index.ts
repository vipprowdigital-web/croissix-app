// store/index.ts

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import googleReducer from "./slices/google.slice";
import themeReducer from "./slices/theme.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    google: googleReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
