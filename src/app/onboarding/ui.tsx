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
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-primary/85">
          Último paso
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Configurar hogar</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Conectado como <span className="font-medium text-foreground/90">{email}</span>. Creá el hogar nuevo o unite con el código que te compartieron.
        </p>
      </div>

      {message ? (
        <p className="rounded-xl border border-border bg-muted/45 px-4 py-3 text-sm">
          {message}
        </p>
      ) : null}

      {createdCode ? (
        <div className="rounded-2xl border-2 border-dashed border-primary/35 bg-primary/[0.06] p-7 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Código para tu pareja</p>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[0.2em] text-foreground">{createdCode}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Ir al panel
          </button>
        </div>
      ) : null}

      <form onSubmit={createHouse} className="ui-card space-y-3 p-6">
        <h2 className="text-sm font-semibold text-foreground">Crear hogar nuevo</h2>
        <input
          value={houseName}
          onChange={(e) => setHouseName(e.target.value)}
          placeholder="Nombre del hogar"
          className="ui-input"
        />
        <button type="submit" disabled={loading !== null} className="ui-btn">
          {loading === "create" ? "Creando…" : "Crear y obtener código"}
        </button>
      </form>

      <form onSubmit={joinHouse} className="ui-card space-y-3 p-6">
        <h2 className="text-sm font-semibold text-foreground">Unirme a un hogar</h2>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Código (ej. ABC12D)"
          maxLength={12}
          className="ui-input font-mono uppercase tracking-wider"
        />
        <button
          type="submit"
          disabled={loading !== null || joinCode.trim().length < 4}
          className="ui-btn-secondary"
        >
          {loading === "join" ? "Uniendo…" : "Unirme"}
        </button>
      </form>
    </div>
  );
}
