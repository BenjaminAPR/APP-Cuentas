import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadMemberNames(supabase: SupabaseClient, householdId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("household_id", householdId);
  const map: Record<string, string> = {};
  (data ?? []).forEach((r: { id: string; display_name: string }) => {
    map[r.id] = r.display_name;
  });
  return map;
}
