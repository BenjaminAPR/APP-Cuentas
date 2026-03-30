import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { loadMemberNames } from "@/lib/members";
import { requireHousehold } from "@/lib/session";
import { ExpenseForm } from "./ui";

const categories = [
  { value: "arriendo", label: "Arriendo" },
  { value: "supermercado", label: "Supermercado" },
  { value: "servicios", label: "Servicios básicos" },
  { value: "transporte", label: "Transporte" },
  { value: "salud", label: "Salud" },
  { value: "educacion", label: "Educación" },
  { value: "entretenimiento", label: "Entretenimiento" },
  { value: "otro", label: "Otro" },
];

export default async function GastosPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const [expensesRes, debtPaymentsRes, debtsRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, amount, expense_date, category, notes, created_by")
      .eq("household_id", householdId)
      .order("expense_date", { ascending: false })
      .limit(120),
    supabase
      .from("debt_payments")
      .select("id, amount, payment_date, notes, created_by, debt_id")
      .eq("household_id", householdId)
      .order("payment_date", { ascending: false })
      .limit(120),
    supabase
      .from("debts")
      .select("id, name")
      .eq("household_id", householdId),
  ]);

  const names = await loadMemberNames(supabase, householdId);

  const label = (c: string) => categories.find((x) => x.value === c)?.label ?? c;

  const debtNameById = Object.fromEntries(
    (debtsRes.data ?? []).map((d: { id: string; name: string }) => [d.id, d.name]),
  );

  type ListItem = {
    id: string;
    kind: "expense" | "debt_payment";
    date: string;
    categoryText: string;
    amount: number;
    createdBy: string;
    notes: string | null;
  };

  const items: ListItem[] = [
    ...((expensesRes.data ?? []) as any[]).map((r) => ({
      id: r.id,
      kind: "expense" as const,
      date: r.expense_date,
      categoryText: label(r.category),
      amount: Number(r.amount),
      createdBy: r.created_by,
      notes: r.notes ?? null,
    })),
    ...((debtPaymentsRes.data ?? []) as any[]).map((p) => ({
      id: p.id,
      kind: "debt_payment" as const,
      date: p.payment_date,
      categoryText: `Pago de deuda: ${debtNameById[p.debt_id] ?? "Deuda"}`,
      amount: Number(p.amount),
      createdBy: p.created_by,
      notes: p.notes ?? null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gastos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí ves gastos normales y también los pagos de deudas como “Pago de deuda”.
        </p>
      </div>
      <ExpenseForm householdId={householdId} categories={categories} />
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted/45 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3">Quién</th>
              <th className="px-4 py-3">Notas</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={`${r.kind}-${r.id}`} className="border-b border-border/50">
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.date}</td>
                <td className="px-4 py-3">
                  {r.kind === "debt_payment" ? (
                    <span className="text-foreground font-medium">{r.categoryText}</span>
                  ) : (
                    <span>{r.categoryText}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatMoney(r.amount)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{names[r.createdBy] ?? "—"}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                  {r.notes ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Sin registros de gastos ni pagos de deudas.
          </p>
        ) : null}
      </div>
    </div>
  );
}
