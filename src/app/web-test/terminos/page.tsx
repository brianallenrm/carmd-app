"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#f16315]">
      <nav className="fixed top-0 w-full z-50 p-8 border-b border-white/5 bg-black/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/web-test" className="flex items-center gap-2">
            <BrandLogo size="md" />
          </Link>
          <Link href="/web-test" className="text-white/50 hover:text-white transition-colors text-sm font-bold flex items-center gap-2 group">
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
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <FileText size={32} />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              Términos <br />
              <span className="text-white/20">Condiciones.</span>
            </h1>
          </div>

          <div className="space-y-12 text-white/60 font-medium leading-relaxed">
            <section className="bg-white/[0.02] border border-white/5 p-10 rounded-[40px] space-y-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">1. Generalidades</h2>
              <p>
                Al acceder y utilizar los servicios de **CarMD**, el cliente acepta cumplir con los siguientes términos y condiciones. 
                CarMD se reserva el derecho de modificar estos términos en cualquier momento.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">2. Política de Garantía</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-[#f16315]/5 border border-[#f16315]/20 flex items-start gap-4">
                  <ShieldCheck className="text-[#f16315] shrink-0" />
                  <div>
                    <h4 className="text-white font-black uppercase text-xs mb-2">Mano de Obra</h4>
                    <p className="text-sm">Garantía real de **1 año o 10,000 km** (lo que ocurra primero) en cada intervención técnica realizada.</p>
                  </div>
                </div>
                <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-4">
                  <CheckCircle2 className="text-blue-500 shrink-0" />
                  <div>
                    <h4 className="text-white font-black uppercase text-xs mb-2">Mantenimiento</h4>
                    <p className="text-sm">Todas las reparaciones incluyen **dos mantenimientos preventivos gratuitos** según lo especificado al entregar la unidad.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm italic text-white/40">
                Nota: La garantía es nula si se detecta negligencia del cliente, reparaciones por terceros o accidentes posteriores a la entrega.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">3. Citas y Recepción</h2>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="text-[#f16315] font-black">01</div>
                  <p>Tolerancia máxima de 15 minutos. Después de este tiempo, se podría reprogramar la cita según disponibilidad.</p>
                </li>
                <li className="flex gap-4">
                  <div className="text-[#f16315] font-black">02</div>
                  <p>El cliente debe proporcionar información fidedigna sobre fallas previas e historial de mantenimiento del vehículo.</p>
                </li>
              </ul>
            </section>

            <section className="bg-red-500/5 border border-red-500/20 p-10 rounded-[40px] space-y-6">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle size={24} />
                <h2 className="text-2xl font-black uppercase tracking-tight">4. Limitación de Responsabilidad</h2>
              </div>
              <p>
                El servicio de valuación vehicular no incluye la revisión de números de serie ni verificación legal ante autoridades. 
                CarMD no se hace responsable por objetos de valor dejados en el vehículo, salvo aquellos inventariados formalmente en la hoja de recepción digital.
              </p>
            </section>

            <section className="bg-orange-500/5 border border-orange-500/20 p-10 rounded-[40px] space-y-6">
              <div className="flex items-center gap-3 text-orange-500">
                <ShieldCheck size={24} />
                <h2 className="text-2xl font-black uppercase tracking-tight">5. Fallas Internas y Vicios Ocultos</h2>
              </div>
              <p>
                CarMD no asume responsabilidad alguna por incendios, cortocircuitos o daños mecánicos que ocurran de manera espontánea debido a condiciones preexistentes del vehículo, cableado degradado o vicios ocultos, mientras la unidad se encuentre en nuestras instalaciones y antes de que se inicie cualquier intervención técnica. 
              </p>
              <p className="border-t border-white/5 pt-4">
                Asimismo, el propietario del vehículo acepta ser el **responsable civil** por cualquier daño que su unidad pudiera causar a las instalaciones de CarMD, a nuestro personal o a terceros, derivado de una falla interna de su vehículo no imputable a nuestra operación.
              </p>
            </section>

            <div className="pt-12 text-center opacity-30 text-xs font-black uppercase tracking-widest">
              Nezahualcóyotl, Estado de México | CarMD Engineering Legality
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
