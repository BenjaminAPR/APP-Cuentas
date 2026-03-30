import { createClient } from "@/lib/supabase/server";
import { loadMemberNames } from "@/lib/members";
import { requireHousehold } from "@/lib/session";
import { AccountForm } from "./ui";

export default async function CuentasPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("accounts")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  const names = await loadMemberNames(supabase, householdId);

  const typeLabel: Record<string, string> = {
    corriente: "Corriente",
    ahorro: "Ahorro",
    efectivo: "Efectivo",
    inversion: "Inversión",
    otro: "Otro",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
        <p className="mt-1 text-sm text-zinc-500">Referencia de cuentas bancarias y efectivo (sin sincronización automática).</p>
      </div>
      <AccountForm householdId={householdId} />
      <ul className="space-y-3">
        {(rows ?? []).map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-zinc-500">
                  {typeLabel[r.account_type] ?? r.account_type}
                  {r.institution ? ` · ${r.institution}` : ""}
                </p>
                {r.notes ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{r.notes}</p> : null}
              </div>
              <span className="text-xs text-zinc-400">Alta: {names[r.created_by] ?? "—"}</span>
            </div>
          </li>
        ))}
      </ul>
      {rows?.length === 0 ? <p className="text-sm text-zinc-500">No hay cuentas cargadas.</p> : null}
    </div>
  );
}
