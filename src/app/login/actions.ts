"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "carmd2026";

export async function login(prevState: any, formData: FormData) {
  const password = formData.get("password");
  const callbackUrl = formData.get("callbackUrl") as string || "/os";

  if (password === MASTER_PASSWORD) {
    const cookieStore = await cookies();
    
    // Establecer la cookie de sesión por 30 días
    cookieStore.set("carmd_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: "/",
    });

    redirect(callbackUrl);
  }

  return { error: "Contraseña incorrecta" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("carmd_session");
  redirect("/login");
}
