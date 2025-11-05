import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { type Context } from "./trpc";

export async function createContext(
  opts?: FetchCreateContextFnOptions
): Promise<Context> {
  const session = await getServerSession(authOptions);

  return {
    session,
    prisma,
  };
}
