import Link from "next/link";
import { requireHousehold } from "@/lib/session";
import { UserMenu } from "./user-menu";

const nav = [
  { href: "/", label: "Panel" },
  { href: "/ingresos", label: "Ingresos" },
  { href: "/gastos", label: "Gastos" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/iglesia", label: "Diezmo y ayuno" },
  { href: "/deudas", label: "Deudas" },
  { href: "/actividad", label: "Actividad" },
  { href: "/hogar", label: "Hogar" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await requireHousehold();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/80 py-6 dark:border-zinc-800 dark:bg-zinc-950/50 md:flex">
        <div className="px-4 pb-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Cuentas del hogar
          </Link>
          <p tabIndex={0} className="mt-1 truncate text-xs text-zinc-500" title={ctx.displayName}>
            {ctx.displayName}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pt-4">
          <UserMenu label={ctx.displayName} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-200 md:hidden dark:border-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-sm font-semibold">
              Cuentas
            </Link>
            <UserMenu label={ctx.displayName} />
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-2 text-xs">
            {nav.slice(0, 6).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
