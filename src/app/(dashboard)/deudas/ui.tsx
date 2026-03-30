"use client";

import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/money";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Debt = {
  id: string;
  name: string;
  debt_type: string;
  total_amount: number | null;
  balance_remaining: number | string;
  installment_amount: number | string | null;
  installments_total: number | null;
  installments_paid: number | null;
  due_day: number | null;
  creditor: string | null;
  notes: string | null;
  created_by: string;
};

function parseAmt(s: string) {
  return Number(s.replace(/\./g, "").replace(",", "."));
}

export function DebtForms({
  householdId,
  debts,
  memberNames,
}: {
  householdId: string;
  debts: Debt[];
  memberNames: Record<string, string>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingNew, setLoadingNew] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const [nName, setNName] = useState("");
  const [nType, setNType] = useState<"tarjeta" | "otro">("tarjeta");
  const [nBalance, setNBalance] = useState("");
  const [nTotal, setNTotal] = useState("");
  const [nInstallment, setNInstallment] = useState("");
  const [nInstallTotal, setNInstallTotal] = useState("");
  const [nInstallPaid, setNInstallPaid] = useState("0");
  const [nDue, setNDue] = useState("");
  const [nCreditor, setNCreditor] = useState("");
  const [nNotes, setNNotes] = useState("");

  async function addDebt(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoadingNew(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoadingNew(false);
      return;
    }
    const bal = parseAmt(nBalance);
    if (!Number.isFinite(bal) || bal < 0) {
      setError("Saldo no válido");
      setLoadingNew(false);
      return;
    }
    const totalAmt = nTotal.trim() ? parseAmt(nTotal) : null;
    const inst = nInstallment.trim() ? parseAmt(nInstallment) : null;
    const instTot = nInstallTotal.trim() ? parseInt(nInstallTotal, 10) : null;
    const instPaid = nInstallPaid.trim() ? parseInt(nInstallPaid, 10) : 0;
    const due = nDue.trim() ? parseInt(nDue, 10) : null;
    const { error: err } = await supabase.from("debts").insert({
      household_id: householdId,
      name: nName.trim(),
      debt_type: nType,
      balance_remaining: bal,
      total_amount: totalAmt != null && Number.isFinite(totalAmt) ? totalAmt : null,
      installment_amount: inst != null && Number.isFinite(inst) ? inst : null,
      installments_total: instTot != null && !Number.isNaN(instTot) ? instTot : null,
      installments_paid: Number.isNaN(instPaid) ? 0 : Math.max(0, instPaid),
      due_day: due != null && due >= 1 && due <= 31 ? due : null,
      creditor: nCreditor.trim() || null,
      notes: nNotes.trim() || null,
      created_by: user.id,
    });
    setLoadingNew(false);
    if (err) {
      setError(err.message);
      return;
    }
    setNName("");
    setNBalance("");
    setNTotal("");
    setNInstallment("");
    setNInstallTotal("");
    setNInstallPaid("0");
    setNDue("");
    setNCreditor("");
    setNNotes("");
    router.refresh();
  }

  async function payDebt(
    e: React.FormEvent<HTMLFormElement>,
    debt: Debt,
  ) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const amountRaw = String(fd.get("amount") ?? "");
    const date = String(fd.get("payment_date") ?? "");
    const covRaw = String(fd.get("installments_covered") ?? "1");
    const note = String(fd.get("notes") ?? "");
    const amt = parseAmt(amountRaw);
    const covered = parseInt(covRaw, 10);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Monto de pago no válido");
      return;
    }
    setPayingId(debt.id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPayingId(null);
      return;
    }
    const balance = Number(debt.balance_remaining);
    const newBal = Math.max(0, balance - amt);
    const paid = Number(debt.installments_paid ?? 0);
    const addCovered = Number.isNaN(covered) ? 1 : Math.max(0, covered);

    const { error: errPay } = await supabase.from("debt_payments").insert({
      household_id: householdId,
      debt_id: debt.id,
      amount: amt,
      payment_date: date || new Date().toISOString().slice(0, 10),
      installments_covered: addCovered,
      notes: note.trim() || null,
      created_by: user.id,
    });
    if (errPay) {
      setError(errPay.message);
      setPayingId(null);
      return;
    }
    const { error: errUp } = await supabase
      .from("debts")
      .update({
        balance_remaining: newBal,
        installments_paid: paid + addCovered,
        updated_by: user.id,
      })
      .eq("id", debt.id);
    setPayingId(null);
    if (errUp) {
      setError(errUp.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {error ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <form onSubmit={addDebt} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-800">
        <h2 className="sm:col-span-2 lg:col-span-3 text-sm font-semibold">Nueva deuda</h2>
        <input
          placeholder="Nombre (ej. TC Banco X)"
          required
          value={nName}
          onChange={(e) => setNName(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          value={nType}
          onChange={(e) => setNType(e.target.value as "tarjeta" | "otro")}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="tarjeta">Tarjeta</option>
          <option value="otro">Otra</option>
        </select>
        <input
          placeholder="Saldo pendiente *"
          required
          value={nBalance}
          onChange={(e) => setNBalance(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Monto original total (opcional)"
          value={nTotal}
          onChange={(e) => setNTotal(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Valor cuota típica (opcional)"
          value={nInstallment}
          onChange={(e) => setNInstallment(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Nº cuotas totales (opcional)"
          value={nInstallTotal}
          onChange={(e) => setNInstallTotal(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Cuotas ya pagadas (default 0)"
          value={nInstallPaid}
          onChange={(e) => setNInstallPaid(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Día vencimiento 1–31 (opcional)"
          value={nDue}
          onChange={(e) => setNDue(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Acreedor (opcional)"
          value={nCreditor}
          onChange={(e) => setNCreditor(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm sm:col-span-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Notas"
          value={nNotes}
          onChange={(e) => setNNotes(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm sm:col-span-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loadingNew}
          className="rounded-lg bg-foreground py-2 text-sm font-medium text-background disabled:opacity-50 sm:col-span-2 lg:col-span-1"
        >
          {loadingNew ? "Guardando…" : "Agregar deuda"}
        </button>
      </form>

      <div className="space-y-6">
        <h2 className="text-sm font-semibold">Estado y pagos</h2>
        {debts.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay deudas registradas.</p>
        ) : (
          <ul className="space-y-6">
            {debts.map((d) => {
              const total = d.installments_total;
              const paid = Number(d.installments_paid ?? 0);
              const remaining =
                total != null && total > 0 ? Math.max(0, total - paid) : null;
              return (
                <li
                  key={d.id}
                  className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-zinc-500">
                        {d.debt_type === "tarjeta" ? "Tarjeta" : "Otra"} · Alta:{" "}
                        {memberNames[d.created_by] ?? "—"}
                        {d.due_day ? ` · Vence día ${d.due_day}` : ""}
                      </p>
                      <p className="mt-2 text-lg font-semibold tabular-nums">
                        Saldo: {formatMoney(Number(d.balance_remaining))}
                      </p>
                      {remaining != null ? (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Cuotas restantes (aprox.): {remaining} de {total}
                        </p>
                      ) : null}
                      {d.notes ? (
                        <p className="mt-2 text-sm text-zinc-500">{d.notes}</p>
                      ) : null}
                    </div>
                  </div>
                  <form
                    onSubmit={(ev) => payDebt(ev, d)}
                    className="mt-4 flex flex-wrap items-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500">Monto pago</label>
                      <input
                        name="amount"
                        required
                        placeholder="Monto"
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500">Fecha</label>
                      <input
                        name="payment_date"
                        type="date"
                        defaultValue={new Date().toISOString().slice(0, 10)}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500">Cuotas cubiertas</label>
                      <input
                        name="installments_covered"
                        type="number"
                        min={0}
                        defaultValue={1}
                        className="w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                    <input
                      name="notes"
                      placeholder="Notas"
                      className="min-w-[120px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <button
                      type="submit"
                      disabled={payingId === d.id}
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
                    >
                      {payingId === d.id ? "…" : "Registrar pago"}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
