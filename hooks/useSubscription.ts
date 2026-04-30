// mobile_app\features\subscription\hook\useSubscription.ts

import { fetchMySubscription } from "@/api/subscription.api";
import { useQuery } from "@tanstack/react-query";

export const useSubscription = () => {
  const query = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchMySubscription,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: false,
  });

  const subscription = query.data;
  console.log("Subscription Details: ", subscription);

  const isActive =
    subscription?.status === "active" &&
    (!subscription?.currentEnd ||
      new Date(subscription.currentEnd) > new Date());
  console.log("Subscription is active? - ", isActive);

  const isExpired =
    subscription?.currentEnd && new Date(subscription.currentEnd) < new Date();
  console.log("Subscription expired? -  ", isExpired);

  return {
    ...query,
    subscription,
    isActive,
    isExpired,
  };
};
