import { createClient } from "@/lib/supabase/server";
import { formatMoney, monthBounds } from "@/lib/money";
import { loadMemberNames } from "@/lib/members";
import { requireHousehold } from "@/lib/session";
import { ExpenseForm } from "./ui";
import { GastosClient } from "./ui-client";

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
  const { start, end, label: monthLabel } = monthBounds();

  const categoryMap = Object.fromEntries(categories.map((c) => [c.value, c.label]));

  const [
    expensesRes,
    debtPaymentsRes,
    debtsRes,
    expensesMonthRes,
    debtPaymentsMonthRes,
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, amount, expense_date, category, notes, created_by")
      .eq("household_id", householdId)
      .order("expense_date", { ascending: false })
      .limit(40),
    supabase
      .from("debt_payments")
      .select("id, amount, payment_date, notes, created_by, debt_id")
      .eq("household_id", householdId)
      .order("payment_date", { ascending: false })
      .limit(40),
    supabase
      .from("debts")
      .select("id, name")
      .eq("household_id", householdId),
    supabase
      .from("expenses")
      .select("amount")
      .eq("household_id", householdId)
      .gte("expense_date", start)
      .lte("expense_date", end),
    supabase
      .from("debt_payments")
      .select("amount")
      .eq("household_id", householdId)
      .gte("payment_date", start)
      .lte("payment_date", end),
  ]);

  const names = await loadMemberNames(supabase, householdId);

  const debtNameById = Object.fromEntries(
    (debtsRes.data ?? []).map((d: { id: string; name: string }) => [d.id, d.name]),
  );

  const sum = (rows: { amount: number | string | null }[] | null | undefined) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.amount ?? 0), 0);

  const expensesMonth = sum(expensesMonthRes.data);
  const debtPaidMonth = sum(debtPaymentsMonthRes.data);
  const outflowMonth = expensesMonth + debtPaidMonth;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gastos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí ves gastos normales y también los pagos de deudas como “Pago de deuda”.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="ui-card p-5 ring-1 ring-stone-900/[0.04] shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Gastos del mes
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatMoney(expensesMonth)}
          </p>
          <p className="mt-1 text-xs capitalize text-muted-foreground">{monthLabel}</p>
        </div>
        <div className="ui-card p-5 ring-1 ring-stone-900/[0.04] shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pagos a deudas (mes)
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatMoney(debtPaidMonth)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Se registran en “Deudas”, pero cuentan como salida.
          </p>
        </div>
        <div className="ui-card p-5 ring-1 ring-stone-900/[0.04] shadow-sm border-l-[3px] border-l-primary/55">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Salida total (mes)
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatMoney(outflowMonth)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Gastos + pagos de deudas.
          </p>
        </div>
      </section>

      <ExpenseForm householdId={householdId} categories={categories} />
      <GastosClient
        householdId={householdId}
        initialExpenses={(expensesRes.data ?? []) as Array<{
          id: string;
          amount: number | string;
          expense_date: string;
          category: string;
          notes: string | null;
          created_by: string;
        }>}
        initialDebtPayments={(debtPaymentsRes.data ?? []) as Array<{
          id: string;
          amount: number | string;
          payment_date: string;
          notes: string | null;
          created_by: string;
          debt_id: string;
        }>}
        debtNameById={debtNameById}
        memberNames={names}
        categoryMap={categoryMap}
      />
    </div>
  );
}
