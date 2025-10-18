"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { User } from "@/interfaces/user.interface";
import { getUserData } from "@/lib/auth";
import { getCurrentUserRoles } from "@/lib/team";

export function useUserData(teamId: string) {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  async function fetchUser() {
    setLoading(true);

    const data = await getUserData();
    const roles = await getCurrentUserRoles(teamId);

    if (!data.success) {
      toast.error(data.message);
    }

    if (!roles.success) {
      toast.error(roles.message);
    }

    if (data?.data) {
      setUser(data.data);
    }

    if (roles?.data) {
      setRoles(roles.data);
    }

    setLoading(false);
  }

  const refetchUser = () => {
    fetchUser();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUser();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    roles,
    loading,
    refetchUser,
  };
}
