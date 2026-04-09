"use client";

import { useActionState, Suspense } from "react";
import { login } from "./actions";
import BrandLogo from "@/components/BrandLogo";
import { motion } from "framer-motion";
import { Lock, ArrowRight, ShieldAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/os";
  const [state, action, isPending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-10 text-center">
            <BrandLogo size="lg" className="mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Acceso a CarMD OS</h1>
            <p className="text-gray-400 text-sm">
              Ingresa la contraseña maestra para acceder a las herramientas operativas.
            </p>
          </div>

          <form action={action} className="space-y-6">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1"
              >
                Contraseña Administrativa
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-brand transition-colors" />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-4 bg-white/[0.02] border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-lg"
                />
              </div>
            </div>

            {state?.error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm"
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <p>{state.error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 disabled:bg-brand/50 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-brand/20 active:scale-[0.98]"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verificar Acceso
                  <ArrowRight className="h-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} CarMD Engineering. Todos los derechos reservados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
