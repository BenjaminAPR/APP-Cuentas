import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { OnboardingClient } from "./ui";

export default async function OnboardingPage() {
  const { supabase, user, profile } = await requireUser();
  if (profile.household_id) redirect("/");

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <OnboardingClient email={user.email ?? ""} />
    </div>
  );
}
