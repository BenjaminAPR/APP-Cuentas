"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChurchForm({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [payment_date, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payment_type, setPaymentType] = useState<"diezmo" | "ayuno">("diezmo");
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
    const { error: err } = await supabase.from("church_payments").insert({
      household_id: householdId,
      payment_type,
      amount: amt,
      payment_date,
      notes: notes.trim() || null,
      created_by: user.id,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setAmount("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-zinc-800">
      {error ? <p className="sm:col-span-2 lg:col-span-5 text-sm text-red-600">{error}</p> : null}
      <select
        value={payment_type}
        onChange={(e) => setPaymentType(e.target.value as "diezmo" | "ayuno")}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="diezmo">Diezmo</option>
        <option value="ayuno">Ofrenda de ayuno</option>
      </select>
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
        value={payment_date}
        onChange={(e) => setPaymentDate(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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
        className="rounded-lg bg-foreground py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {loading ? "Guardando…" : "Registrar"}
      </button>
    </form>
  );
}
