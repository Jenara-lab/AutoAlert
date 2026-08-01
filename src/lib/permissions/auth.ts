"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
};

export async function requireAuth(): Promise<SessionUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile?.role ?? "owner",
  };
}

export async function requireOwner(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "owner") redirect("/dashboard");
  return user;
}

export async function requireMechanic(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "mechanic") redirect("/dashboard");
  return user;
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role ?? "owner";
}
