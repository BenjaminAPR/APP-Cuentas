import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";

export type SessionContext = {
  userId: string;
  email: string | undefined;
  displayName: string;
  householdId: string;
};

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("household_id, display_name")
    .eq("id", user.id)
    .single();
  if (error || !profile) redirect("/login");
  return { supabase, user, profile };
}

const requireUserCached = cache(async () => {
  return requireUser();
});

export async function requireHousehold(): Promise<SessionContext> {
  const { supabase, user, profile } = await requireUserCached();
  if (!profile.household_id) redirect("/onboarding");
  return {
    userId: user.id,
    email: user.email,
    displayName: profile.display_name,
    householdId: profile.household_id,
  };
}

export async function getSessionOptional() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null, profile: null as null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, display_name")
    .eq("id", user.id)
    .single();
  return { supabase, user, profile };
}
