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
    <div className="flex min-h-full flex-1 bg-gradient-to-br from-background via-[#f7f1ea] to-muted/60">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 py-7 backdrop-blur-sm md:flex">
        <div className="px-4 pb-6">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-primary/80">
            Nuestro espacio
          </p>
          <Link href="/" className="mt-1 block text-[0.95rem] font-semibold leading-snug tracking-tight text-foreground">
            Cuentas del hogar
          </Link>
          <p tabIndex={0} className="mt-2 truncate text-xs text-muted-foreground" title={ctx.displayName}>
            Hola, {ctx.displayName}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm text-foreground/90 transition-colors hover:bg-card hover:text-foreground hover:shadow-sm"
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
        <header className="border-b border-border md:hidden">
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
                className="shrink-0 rounded-full bg-card px-3 py-1.5 shadow-sm ring-1 ring-stone-900/[0.05]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
