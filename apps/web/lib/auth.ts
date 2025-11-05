import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export function hasRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

export function requireRole(userRoles: string[] | undefined, requiredRoles: string[]): void {
  if (!userRoles || !hasRole(userRoles, requiredRoles)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }
}
