import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionOptional } from "@/lib/session";
import { RegisterForm } from "./ui";

export default async function RegisterPage() {
  const { user, profile } = await getSessionOptional();
  if (user && profile?.household_id) redirect("/");
  if (user && !profile?.household_id) redirect("/onboarding");

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Uno de ustedes se registra primero y crea el hogar; el otro se une con el código.
          </p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
