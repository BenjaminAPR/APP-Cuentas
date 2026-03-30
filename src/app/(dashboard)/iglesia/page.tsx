import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { loadMemberNames } from "@/lib/members";
import { requireHousehold } from "@/lib/session";
import { ChurchForm } from "./ui";

export default async function IglesiaPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("church_payments")
    .select("*")
    .eq("household_id", householdId)
    .order("payment_date", { ascending: false })
    .limit(80);
  const names = await loadMemberNames(supabase, householdId);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Diezmo y ofrenda de ayuno</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Registro privado del hogar. El panel sugiere el 10% de los ingresos del mes solo como referencia.
        </p>
      </div>
      <ChurchForm householdId={householdId} />
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3">Quién</th>
              <th className="px-4 py-3">Notas</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800/80">
                <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{r.payment_date}</td>
                <td className="px-4 py-3">{r.payment_type === "diezmo" ? "Diezmo" : "Ofrenda de ayuno"}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(Number(r.amount))}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{names[r.created_by] ?? "—"}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-zinc-500">{r.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows?.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-500">Sin registros.</p>
        ) : null}
      </div>
    </div>
  );
}
