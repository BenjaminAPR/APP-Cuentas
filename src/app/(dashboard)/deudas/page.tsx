import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { loadMemberNames } from "@/lib/members";
import { requireHousehold } from "@/lib/session";
import { DebtForms } from "./ui";

export default async function DeudasPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .eq("household_id", householdId)
    .order("balance_remaining", { ascending: false });
  const names = await loadMemberNames(supabase, householdId);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deudas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tarjetas u otras deudas: saldo actual, cuotas totales/pagadas y día de vencimiento opcional.
        </p>
      </div>
      <DebtForms
        householdId={householdId}
        debts={debts ?? []}
        memberNames={names}
      />
    </div>
  );
}
