"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const types = [
  { value: "corriente", label: "Corriente" },
  { value: "ahorro", label: "Ahorro" },
  { value: "efectivo", label: "Efectivo" },
  { value: "inversion", label: "Inversión" },
  { value: "otro", label: "Otro" },
];

export function AccountForm({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [account_type, setAccountType] = useState("corriente");
  const [institution, setInstitution] = useState("");
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
    const { error: err } = await supabase.from("accounts").insert({
      household_id: householdId,
      name: name.trim(),
      account_type,
      institution: institution.trim() || null,
      notes: notes.trim() || null,
      created_by: user.id,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setName("");
    setInstitution("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-5">
      {error ? <p className="sm:col-span-2 lg:col-span-5 text-sm text-red-600">{error}</p> : null}
      <input
        placeholder="Nombre (ej. Banco Estado — corriente)"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm sm:col-span-2"
      />
      <select
        value={account_type}
        onChange={(e) => setAccountType(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
      >
        {types.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        placeholder="Institución (opcional)"
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />
      <input
        placeholder="Notas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50 sm:col-span-2 lg:col-span-1"
      >
        {loading ? "Guardando…" : "Agregar cuenta"}
      </button>
    </form>
  );
}
