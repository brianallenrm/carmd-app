"use client";

import { motion } from "framer-motion";
import { 
  Settings, 
  Cpu, 
  Disc, 
  Zap, 
  CircleDot, 
  TrendingUp, 
  RefreshCw, 
  Droplets, 
  Navigation,
  ArrowRight,
  ChevronLeft,
  Calendar
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import BrandLogo from "@/components/BrandLogo";

const ALL_SERVICES = [
  {
    id: "motor",
    title: "Restauración en Motor",
    desc: "Rectificación y restauración de bloque de motor (monoblock), cigüeñal y cabezas de motor. Distribución, mantenimiento y restauración profunda.",
    icon: Settings,
    image: "/service-motor.png"
  },
  {
    id: "diagnostico",
    title: "Diagnóstico Automotriz",
    desc: "Capacidad de diagnosticar, interpretar y eliminar todos los códigos de falla de los módulos electrónicos. Análisis de datos en tiempo real.",
    icon: Cpu,
    image: "/service-diagnostico.png"
  },
  {
    id: "clutch",
    title: "Embragues (Clutch)",
    desc: "Inspección visual, pruebas de funcionamiento y mantenimiento en sistema de embrague, bombas manuales y electrónicas con certificación técnica.",
    icon: Disc,
    image: "/service-clutch.png"
  },
  {
    id: "afinacion",
    title: "Afinación Maestro",
    desc: "Mantenimiento a sistema de ignición, inyección, enfriamiento y lubricación. Reemplazo de filtros críticos y reset de intervalos de mantenimiento.",
    icon: Zap,
    image: "/service-afinacion.png"
  },
  {
    id: "frenos",
    title: "Frenos ABS & Convencional",
    desc: "Inspección detallada y restauración en sistemas de frenos ABS y convencionales. Rectificación de discos y cambio de componentes de seguridad.",
    icon: CircleDot,
    image: "/service-frenos.png"
  },
  {
    id: "suspension",
    title: "Suspensión de Precisión",
    desc: "Diagnóstico y restauración de amortiguadores y componentes. Especialistas en suspensiones convencionales y electrónicas inteligentes.",
    icon: TrendingUp,
    image: "/service-suspension.png"
  },
  {
    id: "transmision",
    title: "Restauración Transmisión",
    desc: "Mantenimiento y afinación en transmisiones automáticas, convencionales, electrónicas y sistemas CVT de última generación.",
    icon: RefreshCw,
    image: "/service-transmision.png"
  },
  {
    id: "lubricacion",
    title: "Lubricación Industrial",
    desc: "Lavado interno de motor, reemplazo de filtros y lubricantes de alta viscosidad específica. Reset de luz de servicio en panel digital.",
    icon: Droplets,
    image: "/service-lubricacion.png"
  },
  {
    id: "direccion",
    title: "Dirección Certificada",
    desc: "Inspección y mantenimiento de sistemas de dirección convencional o electrónica. Alineación y balanceo de componentes de control.",
    icon: Navigation,
    image: "/service-direccion.png"
  }
];

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#f16315] pt-32 pb-40 relative overflow-hidden">
      
      {/* --- Ambient Background Effects --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#f16315]/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#f16315]/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* --- Header --- */}
        <div className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-10">
              <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-[#f16315] transition-colors uppercase font-black text-xs tracking-widest group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Inicio
              </Link>
              <Link href="/" className="md:hidden">
                <BrandLogo size="sm" />
              </Link>
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] mb-8">
              CATÁLOGO DE <br />
              <span className="text-[#f16315]">INGENIERÍA.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/50 font-medium leading-relaxed uppercase">
              Procesos de auditoría técnica y precisión mecánica <br /> 
              forjados durante más de 38 años de rigor.
            </p>
          </div>
          <div className="flex flex-col items-end gap-6 leading-none">
            <Link href="/" className="hidden md:block">
              <BrandLogo size="md" />
            </Link>
            <div className="hidden lg:block rotate-90 origin-right translate-y-[-20%]">
                <span className="text-[10px] font-black tracking-[1em] uppercase text-white/20 whitespace-nowrap">
                  CARMD PRECISION SYSTEMS (1988-2026)
                </span>
            </div>
          </div>
        </div>

        {/* --- Services Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ALL_SERVICES.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              viewport={{ once: true }}
              className="group relative h-[450px] rounded-[40px] overflow-hidden bg-white/5 border border-white/10 hover:border-[#f16315]/50 transition-all duration-700"
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image 
                  src={service.image} 
                  alt={service.title} 
                  fill 
                  className="object-cover opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000 ease-out grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95 group-hover:opacity-80 transition-opacity" />
              </div>

              {/* Icon Badge */}
              <div className="absolute top-10 left-10 w-16 h-16 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-[#f16315] group-hover:bg-[#f16315] group-hover:text-white transition-all duration-500 z-20">
                <service.icon size={32} />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-10 z-20 transition-transform duration-500">
                <h3 className="text-3xl font-black uppercase tracking-tight mb-4 leading-none group-hover:text-[#f16315] transition-colors">
                  {service.title}
                </h3>
                
                {/* Description - Animated reveal */}
                <div className="h-0 group-hover:h-auto overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="text-white/60 text-sm leading-relaxed mb-8 uppercase font-medium">
                    {service.desc}
                  </p>
                  <Link href="/citas">
                    <button className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-[#f16315] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 group/btn">
                      Agendar Cita <Calendar size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Static CTA (visible when NOT hovered) */}
              <div className="absolute bottom-10 right-10 group-hover:opacity-0 transition-opacity z-10">
                 <ArrowRight className="text-white/20 group-hover:text-[#f16315]" size={24} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- Footer Note --- */}
        <div className="mt-32 text-center pb-20">
            <p className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px] mb-12">
               Protocolos estandarizados bajo normas de calidad internacional
            </p>
            <Link href="/citas">
                <button className="px-16 py-8 bg-[#f16315] text-white font-black uppercase tracking-[0.4em] text-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/20">
                    Solicitar Diagnóstico Especializado
                </button>
            </Link>

            {/* Legal Links */}
            <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
               <Link href="/">
                 <BrandLogo size="sm" className="opacity-40 hover:opacity-100 transition-opacity" />
               </Link>
               <div className="text-[10px] uppercase font-black tracking-widest">© 2026 CarMD Diagnóstico Mecánico Automotriz</div>
               <div className="flex gap-6 text-[10px] uppercase font-black tracking-widest">
                  <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
                  <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
                  <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
               </div>
            </div>
        </div>

      </div>
    </div>
  );
}
