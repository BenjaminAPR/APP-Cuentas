import { createClient } from "@/lib/supabase/server";
import { loadMemberNames } from "@/lib/members";
import { requireHousehold } from "@/lib/session";

const labels: Record<string, string> = {
  incomes: "Ingresos",
  expenses: "Gastos",
  accounts: "Cuentas",
  church_payments: "Diezmo / ayuno",
  debts: "Deudas",
  debt_payments: "Pagos de deuda",
};

export default async function ActividadPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("audit_log")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(150);
  const names = await loadMemberNames(supabase, householdId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Actividad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de altas, bajas y cambios en ingresos, gastos, iglesia y deudas.
        </p>
      </div>
      <ul className="space-y-2">
        {(rows ?? []).map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-border px-4 py-3 text-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">
                {labels[r.table_name] ?? r.table_name} ·{" "}
                <span className="uppercase text-muted-foreground">{r.action}</span>
              </span>
              <time className="text-xs tabular-nums text-muted-foreground/75">
                {new Date(r.created_at).toLocaleString("es-CL")}
              </time>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Usuario: {r.user_id ? names[r.user_id] ?? r.user_id.slice(0, 8) : "—"}
            </p>
          </li>
        ))}
      </ul>
      {rows?.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay eventos registrados.</p>
      ) : null}
    </div>
  );
}
