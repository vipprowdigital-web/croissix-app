// store/notificationSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Notification = {
  id: string;
  title: string;
  message: string;
};

type NotificationState = {
  notifications: Notification[];
  subscriptions: Record<string, boolean>;
};

const initialState: NotificationState = {
  notifications: [],
  subscriptions: {},
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(
      state,
      action: PayloadAction<{ title: string; message: string }>,
    ) {
      state.notifications.push({
        id: Date.now().toString(),
        ...action.payload,
      });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload,
      );
    },
    subscribe(state, action: PayloadAction<string>) {
      state.subscriptions[action.payload] = true;
    },
    unsubscribe(state, action: PayloadAction<string>) {
      state.subscriptions[action.payload] = false;
    },
  },
});

export const { addNotification, removeNotification, subscribe, unsubscribe } =
  notificationSlice.actions;

export default notificationSlice.reducer;
