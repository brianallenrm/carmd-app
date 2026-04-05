"use client";

import { motion } from "framer-motion";
import { 
  Award, 
  ShieldCheck, 
  Settings, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Target,
  FileText,
  MessageCircle,
  Camera,
  ChevronRight,
  ChevronLeft,
  Menu,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import BrandLogo from "@/components/BrandLogo";

// --- Design Tokens (Consistent with Vision 2.0) ---
const COLORS = {
  primary: "#f16315", // CarMD Orange
  black: "#000000",
  dark: "#0a0a0a",
  card: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.1)",
  glass: "rgba(10, 10, 10, 0.7)",
};

const STATS = [
  { label: "Años de Maestría", value: 38 },
  { label: "Clientes Satisfechos", value: 15000 },
  { label: "Proyectos Corporativos", value: 25 },
  { label: "Pasión Mecánica", value: 100, suffix: "%" },
];

export default function NosotrosPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#f16315] selection:text-white">
      {/* --- Navigation --- */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10 py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/web-test">
            <BrandLogo size="md" />
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-xs font-black uppercase tracking-widest text-white/50">
            <Link href="/web-test" className="hover:text-white transition-colors">Inicio</Link>
            <Link href="/web-test#servicios" className="hover:text-white transition-colors">Servicios</Link>
            <span className="text-[#f16315]">Trayectoria</span>
            <Link href="/web-test/citas">
              <button className="bg-[#f16315] text-white hover:bg-white hover:text-[#f16315] px-6 py-2.5 rounded-full transition-all text-[11px] font-black">
                Agendar Cita
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero: The Lema --- */}
      <section className="relative h-[85vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#f16315]/10 rounded-full blur-[160px] z-0" />
        
        {/* Cinematic Background Layer */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/diagnostic_circuit_precision_1774906472294.png" 
            alt="Fondo Tech" 
            fill 
            className="object-cover opacity-10 grayscale mix-blend-screen"
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-[#f16315] font-black tracking-[.4em] uppercase text-xs mb-8">Nuestra Identidad</h2>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-10">
              DONDE EL RIGOR TÉCNICO <br />
              <span className="text-white/20">SE ENCUENTRA CON LA</span> <br />
              PASIÓN POR EL DETALLE.
            </h1>
            <p className="text-xl md:text-3xl text-white/50 max-w-3xl mx-auto font-medium leading-relaxed italic">
              "Redefiniendo el cuidado automotriz desde 1988."
            </p>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20">
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent mx-auto" />
        </div>
      </section>

      {/* --- Section: The Pillars --- */}
      <section className="py-32 bg-zinc-950/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 font-black uppercase tracking-tighter">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div>
              <h3 className="text-[#f16315] text-5xl mb-4">38</h3>
              <p className="text-white/30 text-lg">Años de Maestría Evolutiva</p>
            </div>
            <div>
              <h3 className="text-white text-5xl mb-4">Precisión</h3>
              <p className="text-white/30 text-lg">Un Estándar Forjado en Flotas Críticas</p>
            </div>
            <div>
              <h3 className="text-white text-5xl mb-4">Pasión</h3>
              <p className="text-white/30 text-lg">Mecánica Real sin Secretos</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section: Legacy Timeline --- */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-24">
            <h2 className="text-[#f16315] font-black tracking-[.4em] uppercase text-xs mb-6 text-center">Nuestra Jornada</h2>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-center">LÍNEA DE TIEMPO <br /><span className="text-white/20">DE EXCELENCIA.</span></h2>
          </div>

          <div className="space-y-40">
            {/* 1988: The Birth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="text-8xl font-black text-[#f16315] mb-6 opacity-40">1988</div>
                <h3 className="text-4xl font-black mb-6 uppercase">El Nacimiento de un Ideal</h3>
                <p className="text-xl text-white/50 leading-relaxed mb-8">
                  CarMD nace con la visión de profesionalizar la mecánica en México. En una comunidad que buscaba alternativas sólidas y honestas, presentamos un equipo humano capacitado con la mejor herramienta en materia de mecánica automotriz.
                </p>
                <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-white/30">
                  <Clock size={20} className="text-[#f16315]" /> Iniciando una era de confianza
                </div>
              </motion.div>
              <div className="relative aspect-video rounded-[40px] overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-700 bg-zinc-900">
                <Image src="/gallery-1.png" alt="Historia 1988" fill className="object-cover" />
              </div>
            </div>

            {/* Elite Flotas (Legacy) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center lg:flex-row-reverse relative">
              {/* Decorative Background Image - More visible */}
              <div className="absolute -right-20 top-0 w-96 h-96 bg-[url('/engine_sensor_digital_1774906483875.png')] bg-cover opacity-10 blur-2xl rounded-full mix-blend-screen pointer-events-none animate-pulse" />

              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:order-2">
                <h2 className="text-[#f16315] font-black tracking-[.4em] uppercase text-xs mb-6">Era Corporativa</h2>
                <h3 className="text-4xl font-black mb-6 uppercase">Un Estándar Forjado <br /> bajo Máxima Presión</h3>
                <p className="text-xl text-white/50 leading-relaxed mb-8">
                  Durante más de una década, nuestra ingeniería fue la responsable oficial del mantenimiento de flotas críticas. Obtuvimos la responsabilidad del equipo terrestre del <strong>AICM (Aeropuerto de la CDMX)</strong> y de la flota nacional de <strong>Yakult</strong>.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                    <div className="text-[#f16315] font-black text-2xl mb-1">AICM</div>
                    <div className="text-[10px] text-white/30 uppercase font-black">Equipo Terrestre</div>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                    <div className="text-[#f16315] font-black text-2xl mb-1">YAKULT</div>
                    <div className="text-[10px] text-white/30 uppercase font-black">Flota Nacional</div>
                  </div>
                </div>
              </motion.div>
              <div className="relative aspect-video rounded-[40px] overflow-hidden border border-white/10 bg-zinc-900 flex items-center justify-center lg:order-1">
                 {/* This would be a gallery of past works if available */}
                 <div className="text-center p-10">
                    <Award size={80} className="text-[#f16315] mx-auto mb-6 opacity-20" />
                    <div className="text-white/20 font-black uppercase text-xl">Disciplina de Ingeniería Corporativa</div>
                 </div>
              </div>
            </div>

            {/* Present: Digital Era */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="text-8xl font-black text-[#f16315] mb-6 opacity-40">2026</div>
                <h3 className="text-4xl font-black mb-6 uppercase">La Nueva Era Mecánica</h3>
                <p className="text-xl text-white/50 leading-relaxed mb-8">
                  Hoy, esa maestría acumulada se conjuga con la tecnología de diagnóstico digital más avanzada. Hemos evolucionado para ofrecerte **Transparencia Radical**, donde tu seguridad se respalda con evidencia real enviada a tu smartphone.
                </p>
                <div className="flex gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-[#f16315] flex items-center justify-center text-white"><Settings size={24} /></div>
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><ArrowRight size={24} /></div>
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><Camera size={24} /></div>
                </div>
              </motion.div>
              <div className="relative aspect-[4/5] rounded-[60px] overflow-hidden border-[12px] border-zinc-900 shadow-2xl">
                 <Image src="/transparency.png" alt="CarMD Modern Era" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section: The Team Culture --- */}
      <section className="py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-black mb-8 uppercase tracking-tighter">INGENIERÍA <span className="text-[#f16315]">A PASO SEÑALADO.</span></h2>
              <p className="text-xl text-white/50 leading-relaxed">
                Nuestra filosofía es clara: brindar servicios personalizados a través de citas programadas. Esto nos permite dedicarle a cada vehículo el tiempo de diagnóstico y restauración que exige la perfección.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
              {[
                { title: "Honestidad", icon: ShieldCheck, color: "bg-blue-500/10 text-blue-400" },
                { title: "Disciplina", icon: Target, color: "bg-orange-500/10 text-orange-400" },
                { title: "Maestría", icon: Award, color: "bg-purple-500/10 text-purple-400" },
                { title: "Tecnología", icon: Settings, color: "bg-green-500/10 text-green-400" }
              ].map((item, i) => (
                <div key={i} className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.04] transition-colors">
                  <div className={`p-4 rounded-2xl ${item.color}`}><item.icon size={32} /></div>
                  <div className="font-black uppercase tracking-widest text-xs">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Final CTA --- */}
      <section className="py-40 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f16315]/20 rounded-full blur-[140px]" />
         <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter uppercase leading-none">
               SI TU AUTO LO SIENTE, <br />
               <span className="text-white/20">NOSOTROS LO SOLUCIONAMOS.</span>
            </h2>
            <Link href="/web-test/citas">
              <button className="bg-[#f16315] hover:bg-white hover:text-[#f16315] text-white px-12 py-6 rounded-full text-xl font-black uppercase tracking-[.2em] transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-orange-500/20">
                Agendar Cita Ahora
              </button>
            </Link>
         </div>
      </section>

      {/* --- Simple Footer --- */}
      <footer className="py-20 border-t border-white/5 opacity-40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
           <Link href="/web-test">
             <BrandLogo size="sm" className="opacity-40 hover:opacity-100 transition-opacity" />
           </Link>
           <div className="text-[10px] uppercase font-black tracking-widest">© 2026 CarMD Diagnóstico Mecánico Automotriz</div>
           <div className="flex gap-6 text-[10px] uppercase font-black tracking-widest">
              <Link href="/web-test/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="/web-test/terminos" className="hover:text-white transition-colors">Términos</Link>
              <Link href="/web-test/cookies" className="hover:text-white transition-colors">Cookies</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}
