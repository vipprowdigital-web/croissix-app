// mobile_app\features\user\services\user.api.ts

import { API } from "@/api/client";
import { User } from "@/types/user";

export const fetchUserProfile = async (): Promise<User> => {
  const res = await API.get("/users/profile/view");
  return res.data.user;
};
