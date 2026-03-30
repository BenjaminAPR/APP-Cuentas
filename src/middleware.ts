import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Solo las rutas del panel: así la navegación entre pestañas evita
    // trabajo extra del middleware en páginas públicas (login/register).
    "/",
    "/ingresos",
    "/gastos",
    "/cuentas",
    "/iglesia",
    "/deudas",
    "/actividad",
    "/hogar",
  ],
};
