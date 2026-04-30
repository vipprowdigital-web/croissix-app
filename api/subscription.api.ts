// mobile_app\features\subscription\services\subscription.api.ts

import { getAuthHeader } from "@/libs/token";
import { API } from "./client";

/* =========================================
   GET MY SUBSCRIPTION
========================================= */
export const fetchMySubscription = async () => {
  const res = await API.get("/subscription/me", {
    headers: { Authorization: await getAuthHeader() },
  });
  return res.data;
};

/* =========================================
   CREATE SUBSCRIPTION
========================================= */
export const createSubscriptionApi = async (planId: string) => {
  const res = await API.post(
    "/subscription/create",
    { planId },
    {
      headers: { Authorization: await getAuthHeader() },
    },
  );
  return res.data;
};

/* =========================================
   VERIFY SUBSCRIPTION
========================================= */
export const verifySubscriptionApi = async (payload: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  planId: string;
}) => {
  const res = await API.post("/subscription/verify", payload, {
    headers: { Authorization: await getAuthHeader() },
  });
  return res.data;
};

/* =========================================
   CANCEL SUBSCRIPTION
========================================= */
export const cancelSubscriptionApi = async (subscriptionId: string) => {
  const res = await API.post(
    `/subscription/cancel/${subscriptionId}`,
    {},
    {
      headers: { Authorization: await getAuthHeader() },
    },
  );
  return res.data;
};
