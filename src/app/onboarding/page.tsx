import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { OnboardingClient } from "./ui";

export default async function OnboardingPage() {
  const { user, profile } = await requireUser();
  if (profile.household_id) redirect("/");

  return (
    <div className="ui-shell flex flex-1 items-center justify-center px-4 py-16">
      <OnboardingClient email={user.email ?? ""} />
    </div>
  );
}
