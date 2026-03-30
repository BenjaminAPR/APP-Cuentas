import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/session";

export default async function HogarPage() {
  const { householdId, userId } = await requireHousehold();
  const supabase = await createClient();
  const { data: household } = await supabase
    .from("households")
    .select("name, join_code, created_at")
    .eq("id", householdId)
    .single();

  const { data: members } = await supabase
    .from("profiles")
    .select("display_name, id")
    .eq("household_id", householdId);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hogar</h1>
        <p className="mt-1 text-sm text-zinc-500">Código para invitar a tu pareja y miembros actuales.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Nombre del hogar</p>
        <p className="mt-1 text-lg font-medium">{household?.name ?? "—"}</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-foreground/15 p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Código de invitación</p>
        <p className="mt-3 font-mono text-4xl font-bold tracking-[0.2em]">{household?.join_code ?? "—"}</p>
        <p className="mt-4 text-xs text-zinc-500">
          La otra persona crea su usuario en Registrarse y en Configurar hogar elige «Unirme» con este código.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Integrantes</p>
        <ul className="mt-3 space-y-2">
          {(members ?? []).map((m) => (
            <li key={m.id} className="flex justify-between text-sm">
              <span>{m.display_name}</span>
              {m.id === userId ? <span className="text-xs text-zinc-400">vos</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
