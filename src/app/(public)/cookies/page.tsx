"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Info, Settings, Eye } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function CookiesPolicy() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#f16315]">
      <nav className="fixed top-0 w-full z-50 p-8 border-b border-white/5 bg-black/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="md" />
          </Link>
          <Link href="/" className="text-white/50 hover:text-white transition-colors text-sm font-bold flex items-center gap-2 group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Inicio
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-48 pb-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-500">
              <Eye size={32} />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              Política de <br />
              <span className="text-white/20">Cookies.</span>
            </h1>
          </div>

          <div className="space-y-12 text-white/50 font-medium leading-relaxed">
            <section className="bg-white/[0.02] border border-white/5 p-10 rounded-[40px] space-y-6">
              <div className="flex items-center gap-3 text-white">
                <Info size={20} />
                <h2 className="text-xl font-black uppercase tracking-tight">¿Qué son las cookies?</h2>
              </div>
              <p>
                Las cookies son pequeños archivos de texto que los sitios web almacenan en su navegador para recordar preferencias y mejorar su experiencia de navegación. 
                En **CarMD**, las utilizamos para asegurar que nuestras herramientas de diagnóstico y reserva funcionen de manera óptima.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Cookies que utilizamos</h2>
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <h4 className="text-white font-bold uppercase text-xs mb-2 italic">Técnicas y Funcionales</h4>
                  <p className="text-sm">Necesarias para el correcto funcionamiento del sistema de citas y la autenticación administrativa.</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <h4 className="text-white font-bold uppercase text-xs mb-2 italic">Analíticas (Google Analytics)</h4>
                  <p className="text-sm">Nos ayudan a entender de forma anónima cómo interactúan los usuarios con nuestra plataforma para mejorar el servicio técnico.</p>
                </div>
              </div>
            </section>

            <section className="bg-[#f16315]/5 border border-[#f16315]/20 p-10 rounded-[40px] space-y-6">
              <div className="flex items-center gap-3 text-[#f16315]">
                <Settings size={20} />
                <h2 className="text-xl font-black uppercase tracking-tight">Gestión de Cookies</h2>
              </div>
              <p>
                Usted puede desactivar o eliminar las cookies en cualquier momento desde la configuración de su navegador. 
                Tenga en cuenta que esto podría afectar la funcionalidad de algunas partes del sitio CarMD.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
