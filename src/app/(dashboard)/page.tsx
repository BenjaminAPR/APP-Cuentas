import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, monthBounds } from "@/lib/money";
import { requireHousehold } from "@/lib/session";

function sumAmount(rows: { amount: number | string | null }[] | null) {
  return (rows ?? []).reduce((a, r) => a + Number(r.amount ?? 0), 0);
}

export default async function DashboardPage() {
  const { householdId, userId } = await requireHousehold();
  const supabase = await createClient();
  const { start, end, label } = monthBounds();

  const [incomes, expenses, church, debts, rentRows, profiles] = await Promise.all([
    supabase.from("incomes").select("amount").eq("household_id", householdId).gte("income_date", start).lte("income_date", end),
    supabase.from("expenses").select("amount, category").eq("household_id", householdId).gte("expense_date", start).lte("expense_date", end),
    supabase
      .from("church_payments")
      .select("amount, payment_type")
      .eq("household_id", householdId)
      .gte("payment_date", start)
      .lte("payment_date", end),
    supabase.from("debts").select("*").eq("household_id", householdId).order("balance_remaining", { ascending: false }),
    supabase
      .from("expenses")
      .select("amount")
      .eq("household_id", householdId)
      .eq("category", "arriendo")
      .gte("expense_date", start)
      .lte("expense_date", end),
    supabase.from("profiles").select("id, display_name").eq("household_id", householdId),
  ]);

  const incomeTotal = sumAmount(incomes.data);
  const expenseTotal = sumAmount(expenses.data);
  const rentTotal = sumAmount(rentRows.data);
  const diezmo = sumAmount(church.data?.filter((c) => c.payment_type === "diezmo") ?? null);
  const ayuno = sumAmount(church.data?.filter((c) => c.payment_type === "ayuno") ?? null);
  const suggestedTithe = incomeTotal * 0.1;

  const nameById = Object.fromEntries((profiles.data ?? []).map((p) => [p.id, p.display_name]));

  const debtRows = (debts.data ?? []).map((d) => {
    const total = d.installments_total as number | null;
    const paid = Number(d.installments_paid ?? 0);
    const remaining =
      total != null && total > 0 ? Math.max(0, total - paid) : null;
    return {
      ...d,
      remaining_installments: remaining,
      balance_remaining: Number(d.balance_remaining),
    };
  });

  const statCard =
    "rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-stone-900/[0.04]";

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-primary/85">Resumen</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Panel</h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">{label}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${statCard} border-l-[3px] border-l-primary/55`}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ingresos del mes</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(incomeTotal)}</p>
          <Link href="/ingresos" className="mt-3 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline">
            Ver ingresos
          </Link>
        </div>
        <div className={statCard}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gastos del mes</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(expenseTotal)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Balance aprox.: {formatMoney(incomeTotal - expenseTotal)}
          </p>
          <Link href="/gastos" className="mt-2 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline">
            Ver gastos
          </Link>
        </div>
        <div className={`${statCard} sm:col-span-2 lg:col-span-1`}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Arriendo (este mes)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(rentTotal)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Suma de gastos con categoría «arriendo».</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-stone-900/[0.04]">
        <h2 className="text-sm font-semibold text-foreground">Diezmo y ofrenda de ayuno</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Referencia diezmo (10% de ingresos del mes): <strong className="tabular-nums">{formatMoney(suggestedTithe)}</strong>
          {" · "}No sustituye el consejo de los líderes eclesiásticos.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Diezmo registrado</p>
            <p className="text-xl font-semibold tabular-nums">{formatMoney(diezmo)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ofrendas de ayuno</p>
            <p className="text-xl font-semibold tabular-nums">{formatMoney(ayuno)}</p>
          </div>
        </div>
        <Link href="/iglesia" className="mt-4 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline">
          Registrar pagos
        </Link>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-stone-900/[0.04]">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-semibold">Deudas y cuotas</h2>
          <Link href="/deudas" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
            Gestionar
          </Link>
        </div>
        {debtRows.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No hay deudas cargadas.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/50">
            {debtRows.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.debt_type === "tarjeta" ? "Tarjeta" : "Otra"} · Saldo {formatMoney(d.balance_remaining)}
                    {d.remaining_installments != null
                      ? ` · ~${d.remaining_installments} cuota(s) restantes`
                      : null}
                  </p>
                </div>
                {d.due_day ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    Vence día {d.due_day}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5 text-sm text-muted-foreground">
        <p>
          Tu actividad queda asociada a <strong>{nameById[userId] ?? "tu usuario"}</strong>. Todos los cambios importantes aparecen en{" "}
          <Link href="/actividad" className="font-medium text-foreground underline-offset-4 hover:underline">
            Actividad
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
