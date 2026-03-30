"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserMenu({ label }: { label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs shadow-sm ring-1 ring-stone-900/[0.04]"
      >
        <span className="truncate">{label}</span>
        <span className="text-muted-foreground/75">{open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 right-0 z-10 mb-1 rounded-lg border border-border bg-card py-1 shadow-md md:bottom-auto md:top-full md:mt-1">
          <Link
            href="/hogar"
            className="block px-3 py-2 text-xs hover:bg-muted md:hidden"
            onClick={() => setOpen(false)}
          >
            Hogar
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-muted"
          >
            Salir
          </button>
        </div>
      ) : null}
    </div>
  );
}
