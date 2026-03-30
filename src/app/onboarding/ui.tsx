"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { email: string };

export function OnboardingClient({ email }: Props) {
  const router = useRouter();
  const [houseName, setHouseName] = useState("Nuestro hogar");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<"create" | "join" | null>(null);

  async function createHouse(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCreatedCode(null);
    setLoading("create");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_household", { house_name: houseName });
    setLoading(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    const hid = data as string;
    const { data: h } = await supabase.from("households").select("join_code").eq("id", hid).single();
    setCreatedCode(h?.join_code ?? null);
    router.refresh();
    if (h?.join_code) {
      setMessage(`Hogar listo. Comparte este código con tu pareja: ${h.join_code}`);
    }
  }

  async function joinHouse(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading("join");
    const supabase = createClient();
    const { error } = await supabase.rpc("join_household", { code: joinCode.trim() });
    setLoading(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.refresh();
    router.push("/");
  }

  return (
    <div className="w-full max-w-md space-y-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Configurar hogar</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Conectado como {email}. Creá el hogar o unite con el código de seis caracteres.
        </p>
      </div>

      {message ? (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {message}
        </p>
      ) : null}

      {createdCode ? (
        <div className="rounded-xl border-2 border-dashed border-foreground/20 p-6 text-center">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Código para tu pareja</p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-widest">{createdCode}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Ir al panel
          </button>
        </div>
      ) : null}

      <form onSubmit={createHouse} className="space-y-3 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Crear hogar nuevo</h2>
        <input
          value={houseName}
          onChange={(e) => setHouseName(e.target.value)}
          placeholder="Nombre del hogar"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loading !== null}
          className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading === "create" ? "Creando…" : "Crear y obtener código"}
        </button>
      </form>

      <form onSubmit={joinHouse} className="space-y-3 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Unirme a un hogar</h2>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Código (ej. ABC12D)"
          maxLength={12}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm uppercase dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loading !== null || joinCode.trim().length < 4}
          className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium dark:border-zinc-600 disabled:opacity-50"
        >
          {loading === "join" ? "Uniendo…" : "Unirme"}
        </button>
      </form>
    </div>
  );
}
