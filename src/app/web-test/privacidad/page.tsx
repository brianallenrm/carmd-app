"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ShieldCheck, Mail, MapPin, Phone } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#f16315]">
      {/* Navigation */}
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto pt-48 pb-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#f16315]/10 rounded-2xl text-[#f16315]">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              Aviso de <br />
              <span className="text-white/20">Privacidad.</span>
            </h1>
          </div>

          <div className="prose prose-invert prose-orange max-w-none space-y-12 text-white/70 font-medium leading-relaxed">
            <section className="bg-white/[0.02] border border-white/5 p-10 rounded-[40px] space-y-6">
              <p className="text-sm uppercase tracking-widest text-[#f16315] font-black">Identidad del Responsable</p>
              <p>
                En cumplimiento a lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de Particulares y su Reglamento, 
                <strong> Brian Allen Rivera Moya (carmd.com.mx)</strong>, con domicilio en Palacio de Iturbide, Colonia Metropolitana 2da Secc., 
                Nezahualcóyotl, Estado de México, CP 57730, como responsable de recabar sus datos personales, les informa lo siguiente:
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Finalidad del tratamiento</h2>
              <p>
                Su información personal será utilizada para informarle o proveerle sobre los servicios o productos que nos haya preguntado o solicitado, 
                almacenar registros sobre las ventas de productos que nos ha requerido o reparaciones realizadas a su (sus) vehículo (s) con el fin de 
                que usted y nosotros los podamos consultar.
              </p>
            </section>

            <section className="space-y-6 border-l-2 border-[#f16315]/20 pl-10 ml-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Datos personales recolectados</h2>
              <p>La información que requerimos para los fines antes mencionados incluye:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                {[
                  "Nombre completo o Razón Social",
                  "Dirección y RFC",
                  "Correo electrónico y WhatsApp",
                  "Datos de identificación del vehículo",
                  "Firma autógrafa",
                  "Información de personal autorizado"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="w-1.5 h-1.5 bg-[#f16315] rounded-full" />
                    <span className="text-xs font-bold uppercase tracking-wide">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Transferencia de datos</h2>
              <p>
                Sus datos personales serán transferidos exclusivamente al Servicio de Administración Tributaria (SAT) para fines fiscales, 
                a compañías transportistas para entregas logísticas, y a instituciones bancarias para procesar pagos.
              </p>
              <p>
                Asimismo, datos de localización comercial podrían compartirse con nuestros distribuidores o sucursales con la finalidad 
                de promover la comercialización de nuestros servicios, a menos que manifieste su oposición explícita.
              </p>
            </section>

            <section className="bg-[#f16315]/5 border border-[#f16315]/20 p-10 rounded-[40px] space-y-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Ejercicio de Derechos ARCO</h2>
              <p>
                Usted puede solicitar el acceso, rectificación, cancelación u oposición al envío de mensajes promocionales solicitándolo vía correo electrónico a:
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="mailto:contacto@carmd.com.mx" className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-black text-sm transition-all hover:bg-[#f16315] hover:text-white">
                  <Mail size={16} /> contacto@carmd.com.mx
                </a>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full font-black text-sm text-white/50">
                  <Phone size={16} /> (55) 5765-2839
                </div>
              </div>
            </section>

            <section className="space-y-6 opacity-40">
              <p className="text-xs uppercase tracking-[0.3em] font-black">Última actualización: Abril 2026</p>
              <p className="text-sm">
                Cualquier cambio a este aviso de privacidad será publicado en nuestro sitio web oficial o mediante avisos visibles en nuestra sucursal.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
