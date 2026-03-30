import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionOptional } from "@/lib/session";
import { LoginForm } from "./ui";

export default async function LoginPage() {
  const { user, profile } = await getSessionOptional();
  if (user && profile?.household_id) redirect("/");
  if (user && !profile?.household_id) redirect("/onboarding");

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cuentas del hogar
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Inicia sesión para ver ingresos, gastos y deudas.
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿Sin cuenta?{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
