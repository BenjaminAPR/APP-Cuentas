"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function IncomeForm({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [income_date, setIncomeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const amt = Number(amount.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(amt) || amt < 0) {
      setError("Monto no válido");
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.from("incomes").insert({
      household_id: householdId,
      amount: amt,
      income_date,
      source: source.trim(),
      notes: notes.trim() || null,
      created_by: user.id,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setAmount("");
    setSource("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-zinc-800">
      {error ? <p className="sm:col-span-2 lg:col-span-5 text-sm text-red-600">{error}</p> : null}
      <input
        type="text"
        inputMode="decimal"
        placeholder="Monto"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        type="date"
        required
        value={income_date}
        onChange={(e) => setIncomeDate(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        type="text"
        placeholder="Origen (ej. sueldo, Uber)"
        required
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm sm:col-span-2 lg:col-span-1 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        type="text"
        placeholder="Notas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm sm:col-span-2 lg:col-span-1 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-foreground py-2 text-sm font-medium text-background disabled:opacity-50 sm:col-span-2 lg:col-span-1"
      >
        {loading ? "Guardando…" : "Agregar"}
      </button>
    </form>
  );
}
