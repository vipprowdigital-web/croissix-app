// mobile_app\features\user\hook\useUser.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchUserProfile } from "../../api/user.api";
import { User } from "@/types/user";
import { getToken } from "@/libs/token";
import { setAuth, updateUser } from "@/store/slices/auth.slice";
import { RootState } from "@/store";

export const useUser = () => {
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);

  const query = useQuery<User>({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 5,
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    // if (query.data && token) {
    //   dispatch(setAuth({ user: query.data, token }));
    // }
    if (query.data) {
      dispatch(updateUser(query.data));
    }
  }, [query.data, dispatch, token]);

  return query;
};
