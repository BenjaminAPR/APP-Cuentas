"use client";

import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/money";
import { useMemo, useState } from "react";

type ExpenseRow = {
  id: string;
  amount: number | string;
  expense_date: string;
  category: string;
  notes: string | null;
  created_by: string;
};

type DebtPaymentRow = {
  id: string;
  amount: number | string;
  payment_date: string;
  notes: string | null;
  created_by: string;
  debt_id: string;
};

type ListItem = {
  id: string;
  kind: "expense" | "debt_payment";
  date: string;
  categoryText: string;
  amount: number;
  createdBy: string;
  notes: string | null;
};

function mergeItems(
  expenses: ExpenseRow[],
  payments: DebtPaymentRow[],
  debtNameById: Record<string, string>,
  categoryMap: Record<string, string>,
) {
  const items: ListItem[] = [
    ...expenses.map((r) => ({
      id: r.id,
      kind: "expense" as const,
      date: r.expense_date,
      categoryText: categoryMap[r.category] ?? r.category,
      amount: Number(r.amount),
      createdBy: r.created_by,
      notes: r.notes ?? null,
    })),
    ...payments.map((p) => ({
      id: p.id,
      kind: "debt_payment" as const,
      date: p.payment_date,
      categoryText: `Pago de deuda: ${debtNameById[p.debt_id] ?? "Deuda"}`,
      amount: Number(p.amount),
      createdBy: p.created_by,
      notes: p.notes ?? null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return items;
}

export function GastosClient({
  householdId,
  initialExpenses,
  initialDebtPayments,
  debtNameById,
  memberNames,
  categoryMap,
}: {
  householdId: string;
  initialExpenses: ExpenseRow[];
  initialDebtPayments: DebtPaymentRow[];
  debtNameById: Record<string, string>;
  memberNames: Record<string, string>;
  categoryMap: Record<string, string>;
}) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses);
  const [payments, setPayments] = useState<DebtPaymentRow[]>(initialDebtPayments);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(
    () => mergeItems(expenses, payments, debtNameById, categoryMap),
    [expenses, payments, debtNameById, categoryMap],
  );

  const cursorDate = items.at(-1)?.date ?? null;

  async function loadMore() {
    if (loading || done) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const seen = new Set(items.map((x) => `${x.kind}-${x.id}`));

    const expQ = supabase
      .from("expenses")
      .select("id, amount, expense_date, category, notes, created_by")
      .eq("household_id", householdId)
      .order("expense_date", { ascending: false })
      .limit(40);

    const payQ = supabase
      .from("debt_payments")
      .select("id, amount, payment_date, notes, created_by, debt_id")
      .eq("household_id", householdId)
      .order("payment_date", { ascending: false })
      .limit(40);

    const [moreExp, morePay] = await Promise.all([
      cursorDate ? expQ.lte("expense_date", cursorDate) : expQ,
      cursorDate ? payQ.lte("payment_date", cursorDate) : payQ,
    ]);

    if (moreExp.error) {
      setError(moreExp.error.message);
      setLoading(false);
      return;
    }
    if (morePay.error) {
      setError(morePay.error.message);
      setLoading(false);
      return;
    }

    const newExp = (moreExp.data ?? []) as ExpenseRow[];
    const newPay = (morePay.data ?? []) as DebtPaymentRow[];

    // Evita duplicados (especialmente cuando hay varios items con la misma fecha del cursor)
    const expFiltered = newExp.filter((r) => !seen.has(`expense-${r.id}`));
    const payFiltered = newPay.filter((r) => !seen.has(`debt_payment-${r.id}`));

    setExpenses((prev) => [...prev, ...expFiltered]);
    setPayments((prev) => [...prev, ...payFiltered]);

    // Si ya no llegan nuevos, marcamos done
    if (expFiltered.length === 0 && payFiltered.length === 0) setDone(true);

    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl bg-red-500/[0.12] px-3 py-2.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[680px] text-left text-sm">
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
                    <span className="font-medium text-foreground">{r.categoryText}</span>
                  ) : (
                    <span>{r.categoryText}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatMoney(r.amount)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {memberNames[r.createdBy] ?? "—"}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
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

      <div className="flex justify-center">
        <button
          type="button"
          onClick={loadMore}
          disabled={loading || done}
          className="ui-btn-secondary w-auto px-5"
        >
          {done ? "No hay más" : loading ? "Cargando…" : "Cargar más"}
        </button>
      </div>
    </div>
  );
}

