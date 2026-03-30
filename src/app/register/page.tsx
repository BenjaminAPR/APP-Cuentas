import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionOptional } from "@/lib/session";
import { RegisterForm } from "./ui";

export default async function RegisterPage() {
  const { user, profile } = await getSessionOptional();
  if (user && profile?.household_id) redirect("/");
  if (user && !profile?.household_id) redirect("/onboarding");

  return (
    <div className="ui-shell flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-primary/85">
            Empezar
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Crear cuenta</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Uno de ustedes se registra primero y crea el hogar; el otro entra con el mismo código de invitación.
          </p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
