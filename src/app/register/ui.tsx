"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    }
    router.refresh();
    router.push("/onboarding");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {error ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre (cómo aparecerá en los registros)
        </label>
        <input
          id="name"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-foreground/20 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Correo
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-foreground/20 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-foreground/20 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition-opacity disabled:opacity-50"
      >
        {loading ? "Creando…" : "Registrarse"}
      </button>
    </form>
  );
}
