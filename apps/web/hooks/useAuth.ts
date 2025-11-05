"use client";

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  const hasRole = (roles: string[]) => {
    if (!session?.user?.roles) return false;
    return roles.some((role) => session.user.roles.includes(role));
  };

  return {
    user: session?.user,
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    hasRole,
    isAdmin: hasRole(["admin"]),
    isOrganizer: hasRole(["organizer", "admin"]),
    isMentor: hasRole(["mentor", "organizer", "admin"]),
    isMentee: hasRole(["mentee", "admin"]),
  };
}
