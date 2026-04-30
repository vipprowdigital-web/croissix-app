import { useUser } from "@/services/(user)/user.service";

export function useFreeTrialStatus() {
  const { data: user, isLoading } = useUser();

  if (!user?.createdAt) return { trialExpired: false, loading: isLoading };

  const diffDays =
    (new Date().getTime() - new Date(user.createdAt).getTime()) /
    (1000 * 60 * 60 * 24);

  return {
    trialExpired: diffDays > 3,
    loading: isLoading,
  };
}
