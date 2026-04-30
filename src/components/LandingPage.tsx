"use client";

import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { 
  ChevronRight, 
  Clock, 
  Settings, 
  ShieldCheck, 
  Star, 
  MessageCircle, 
  FileText,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  TrendingUp,
  Award,
  Quote,
  Calendar,
  Camera
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import reviewsData from '@/data/reviews.json';
import BrandLogo from "./BrandLogo";
import { COMPANY_DEFAULTS, getWhatsAppLink } from "@/lib/constants";

// --- Design Tokens ---
const COLORS = {
  primary: "#f16315", // CarMD Orange
  black: "#000000",
  dark: "#0a0a0a",
  card: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.1)",
  glass: "rgba(10, 10, 10, 0.7)",
};

const STATS = [
  { label: "Años de Experiencia", value: 38, prefix: "", suffix: "+", isFloat: false },
  { label: "Servicios al Año", value: 600, prefix: "+", suffix: "", isFloat: false },
  { label: "Afinaciones", value: 200, prefix: "+", suffix: "", isFloat: false },
  { label: "Google Rating", value: 4.9, prefix: "", suffix: "/5", isFloat: true },
];

function AnimatedStat({ value, prefix, suffix, isFloat }: { value: number, prefix: string, suffix: string, isFloat: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const displayValue = useTransform(count, (latest) => 
    isFloat ? latest.toFixed(1) : Math.round(latest).toString()
  );

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration: 2, ease: "easeOut" });
    }
  }, [count, inView, value]);

  return (
    <span ref={ref} className="text-4xl md:text-6xl font-black text-[#f16315] mb-2 flex justify-center">
      {prefix}<motion.span>{displayValue}</motion.span>{suffix}
    </span>
  );
}

const SERVICES = [
  { 
    title: "Restauración de Motor", 
    desc: "Ingeniería de precisión para devolver el alma a tu vehículo desde el monoblock hasta la puesta a punto.",
    icon: Settings,
    image: "/service-motor.png",
    size: "large" 
  },
  { 
    title: "Diagnóstico Avanzado", 
    desc: "Capa digital de interpretación de fallas mediante interfaces de grado industrial y análisis de datos vivos.",
    icon: ShieldCheck,
    image: "/service-diagnostico.png",
    size: "medium" 
  },
  { 
    title: "Sistemas de Frenado", 
    desc: "Certificación técnica en sistemas ABS y convencionales. Seguridad sin concesiones.",
    icon: ShieldCheck,
    image: "/service-frenos.png",
    size: "small" 
  },
  { 
    title: "Afinación Maestro", 
    desc: "Sincronización perfecta de ignición y lubricación para eficiencia máxima y longevidad térmica.",
    icon: Clock,
    image: "/service-afinacion.png",
    size: "small" 
  },
];

export default function LandingPage() {
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
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-black/80 backdrop-blur-lg border-b border-white/10 py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="md" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <Link href="/#inicio" className="hover:text-white transition-colors">Inicio</Link>
            <Link href="/#servicios" className="hover:text-white transition-colors">Servicios</Link>
            <Link href="/nosotros" className="hover:text-white transition-colors">Nosotros</Link>
            <Link href="/#contacto" className="hover:text-white transition-colors">Contacto</Link>
            <Link href="/citas">
              <button className="bg-[#f16315] hover:bg-[#d95300] text-white px-5 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 font-bold">
                Agendar Cita
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Placeholder for Video Background */}
        {/* Cinematic Overlays to mask resolution */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black z-10" />
        
        {/* Subtle Noise/Grain Overlay */}
        <div className="absolute inset-0 z-10 opacity-[0.15] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Subtle Dot Pattern */}
        <div className="absolute inset-0 z-10 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="absolute inset-0 opacity-40 transition-all duration-1000 group">
           <div className="w-full h-full bg-[url('/hero-bg-real.png')] bg-cover bg-center" />
           {/* Technical Layer with higher visibility */}
           <div className="absolute inset-0 bg-[url('/mechanical_detail_abstract_1774906515059.png')] bg-cover bg-center opacity-40 mix-blend-screen group-hover:scale-105 transition-transform duration-[3000ms]" />
        </div>

        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8">
              LA EXCELENCIA SE VIVE<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f16315] to-[#f16315]/60">
                EN CADA DETALLE.
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-white/60 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
              38 años redefiniendo la perfección mecánica con tecnología de vanguardia y un trato obsesivo por la calidad.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/citas" className="w-full sm:w-auto">
                <button className="w-full bg-[#f16315] hover:bg-[#d95300] text-white px-10 py-5 rounded-full text-lg font-bold transition-all shadow-2xl shadow-orange-500/20">
                  Reserva tu inspección
                </button>
              </Link>
              <Link href="/nosotros" className="w-full sm:w-auto">
                <button className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white px-10 py-5 rounded-full text-lg font-bold transition-all">
                  Conoce nuestra historia
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 opacity-30"
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* --- Trust Stats --- */}
      <section className="py-24 relative z-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {STATS.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <AnimatedStat 
                  value={stat.value} 
                  prefix={stat.prefix} 
                  suffix={stat.suffix} 
                  isFloat={stat.isFloat} 
                />
                <div className="text-sm uppercase tracking-widest text-white/40 font-bold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Experiencia Comprobada (Reviews) --- */}
      <section className="py-32 relative z-20 bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-6">
                EXPERIENCIA <br />
                <span className="text-[#f16315]">COMPROBADA.</span>
              </h2>
              <p className="text-xl text-white/50 max-w-xl">
                La confianza se gana con resultados. Esto es lo que opinan 
                quienes ya han puesto su seguridad en nuestras manos.
              </p>
            </div>
            
            <div className="flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[30px] backdrop-blur-xl">
              <div className="text-right">
                <div className="text-3xl font-black text-white">4.9 / 5</div>
                <div className="text-xs uppercase tracking-widest text-[#f16315] font-bold">Google Rating</div>
              </div>
              <div className="flex gap-1 text-[#f16315]">
                {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="#f16315" />)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviewsData.map((review, i) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group p-8 rounded-[40px] bg-white/5 border border-white/10 hover:border-[#f16315]/30 hover:bg-white/[0.07] transition-all duration-500 relative flex flex-col justify-between"
              >
                <Quote className="absolute top-6 right-8 text-white/5 group-hover:text-[#f16315]/20 transition-colors" size={60} />
                
                <div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(review.stars)].map((_, i) => (
                      <Star key={i} size={14} fill="#f16315" className="text-[#f16315]" />
                    ))}
                  </div>
                  <p className="text-lg text-white/80 leading-relaxed mb-8 italic">
                    "{review.text}"
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f16315] to-orange-400 flex items-center justify-center text-black font-bold text-xl">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {review.name}
                      {review.verified && (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-white/30 uppercase tracking-tighter">{review.date} • Verificada en Google</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <a 
              href="https://maps.app.goo.gl/EHV9HVbhVHRv5Zwm6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-white/40 hover:text-[#f16315] transition-colors font-bold uppercase tracking-widest text-sm"
            >
              Ver las más de 200 reseñas en Google Maps <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* --- Protocolo de Excelencia --- */}
      <section className="py-32 bg-zinc-950/50 relative z-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black mb-8 leading-tight">
              EL PROTOCOLO <br />
              <span className="text-[#f16315]">DE EXCELENCIA.</span>
            </h2>
            <p className="text-xl text-white/40 max-w-2xl mx-auto">
              No somos un taller convencional. Seguimos un estándar de ingeniería 
              que garantiza transparencia y perfección en cada intervención.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop Only) - Centered behind icons */}
            <div className="hidden md:block absolute top-[40px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#f16315]/30 to-transparent z-0 transition-all duration-700" />
            
            {[
              { 
                step: "01",
                title: "Recepción Elite", 
                desc: "Registro técnico fotográfico, protección de interiores y primer escaneo de ingreso.",
                icon: () => (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9">
                    <path d="M4 4h16v16H4zM4 8h16M4 12h16M4 16h16M8 4v16M12 4v16M16 4v16" strokeOpacity="0.2" />
                    <path d="M7 6h10M7 10h10M7 14h5" strokeLinecap="round" />
                    <rect x="14" y="13" width="4" height="5" rx="1" strokeWidth="2" />
                  </svg>
                )
              },
              { 
                step: "02",
                title: "Diagnóstico Quirúrgico", 
                desc: "Uso de tecnología computarizada avanzada para detectar fallas invisibles al ojo humano.",
                icon: () => (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9">
                    <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
                    <path d="M12 3v18M3 12h18M7.5 7.5l9 9M16.5 7.5l-9 9" strokeOpacity="0.2" />
                    <circle cx="12" cy="12" r="4" strokeWidth="2" />
                    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
                  </svg>
                )
              },
              { 
                step: "03",
                title: "Ejecución Maestra", 
                desc: "Procesos de ingeniería limpia, refacciones certificadas y herramientas de precisión.",
                icon: () => (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeOpacity="0.3" />
                    <path d="M12 22V12" strokeDasharray="2 2" />
                    <circle cx="12" cy="12" r="3" strokeWidth="2" />
                  </svg>
                )
              },
              { 
                step: "04",
                title: "Certificación Total", 
                desc: "Prueba de ruta final, reporte digital enviado a tu móvil y garantía por escrito.",
                icon: () => (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeOpacity="0.2" />
                    <circle cx="12" cy="12" r="8" strokeWidth="2" />
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                )
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                className="relative z-10 group"
              >
                <div className="mb-8 relative inline-block">
                  <div className="w-20 h-20 rounded-[30px] bg-white/5 border border-white/10 flex items-center justify-center text-[#f16315] group-hover:bg-[#f16315] group-hover:text-white transition-all duration-500 transform group-hover:-rotate-6 shadow-xl">
                    <item.icon />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center text-xs font-black text-white/40 group-hover:text-[#f16315] transition-colors">
                    {item.step}
                  </div>
                </div>
                
                <h4 className="text-2xl font-black mb-4 group-hover:text-[#f16315] transition-colors">{item.title}</h4>
                <p className="text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 p-12 rounded-[40px] bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h3 className="text-3xl font-black mb-4">MÁXIMA TRANSPARENCIA</h3>
              <p className="text-white/50 text-lg">
                Recibe evidencias reales de cada paso en tu proceso. Documentamos 
                el 'antes y después' para que tengas la tranquilidad que mereces.
              </p>
            </div>
            <a 
              href={getWhatsAppLink("Hola, quisiera solicitar un presupuesto para mi vehículo.")}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-[#f16315] hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
            >
              Solicitar Presupuesto
            </a>
          </div>
        </div>
      </section>

      {/* --- Garantía CarMD Section --- */}
      <section className="py-32 relative overflow-hidden bg-black border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f1631508,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            
            {/* Left: Interactive Warranty Stamp */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group cursor-default"
            >
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-dashed border-[#f16315]/30 flex items-center justify-center relative animate-[spin_30s_linear_infinite] group-hover:animate-none transition-all">
                <div className="absolute inset-4 rounded-full border border-[#f16315]/10" />
                <div className="text-[10px] font-black uppercase tracking-[1em] text-[#f16315]/20 absolute w-full h-full flex items-center justify-center">
                  <span className="rotate-0 absolute -translate-y-28 md:-translate-y-36">Calidad Certificada</span>
                  <span className="rotate-90 absolute translate-x-28 md:translate-x-36">Ingeniería CarMD</span>
                  <span className="rotate-180 absolute translate-y-28 md:translate-y-36">Garantía Total</span>
                  <span className="-rotate-90 absolute -translate-x-28 md:-translate-x-36">Rigor Técnico</span>
                </div>
              </div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <ShieldCheck size={80} className="text-[#f16315] mb-4 drop-shadow-[0_0_30px_rgba(241,99,21,0.6)]" />
                <div className="text-4xl md:text-5xl font-black italic leading-none mb-1">1 AÑO</div>
                <div className="text-sm font-bold uppercase tracking-widest text-white/40">Garantía Real</div>
              </div>
            </motion.div>

            {/* Right: Warranty Details */}
            <div className="flex-1 space-y-12">
              <div>
                <h2 className="text-[#f16315] font-black tracking-[0.4em] uppercase text-xs mb-4">El Respaldo de la Maestría</h2>
                <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6 leading-tight">
                  TÚ CONDUCES, <br />
                  <span className="text-white/20">NOSOTROS RESPONDEMOS.</span>
                </h3>
                <p className="text-xl text-white/50 leading-relaxed font-light">
                  Nuestra infraestructura técnica no solo repara, certifica. Cada servicio en CarMD es una promesa de longevidad para tu motor.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 hover:border-[#f16315]/30 hover:bg-white/[0.05] transition-all group">
                  <div className="text-3xl font-black text-[#f16315] mb-2 uppercase italic tracking-tighter">10,000 KM</div>
                  <div className="text-lg font-black uppercase mb-4">Garantía en Mano de Obra</div>
                  <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/60">
                    Respaldo técnico por un año o diez mil kilómetros (lo que ocurra primero) en cada intervención realizada por nuestros expertos.
                  </p>
                </div>

                <div className="p-8 rounded-[40px] bg-white/[0.03] border border-[#f16315]/20 hover:bg-[#f16315]/5 transition-all group relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#f16315] opacity-20 rounded-full blur-xl" />
                  <div className="text-3xl font-black text-[#f16315] mb-2 uppercase italic tracking-tighter shadow-orange-500/20 shadow-2xl">2 MANTENIMIENTOS GRATIS</div>
                  <div className="text-lg font-black uppercase mb-4">Compromiso CarMD</div>
                  <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/60">
                    Todas las reparaciones incluyen <strong className="text-white">dos mantenimientos preventivos gratuitos</strong> para asegurar que tu vehículo opere siempre al 100%.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- Services (Bento Grid) --- */}
      <section id="servicios" className="py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black mb-6">SERVICIOS DE ÉLITE</h2>
              <p className="text-xl text-white/50">
                Combinamos ingeniería avanzada con un trato obsesivo por el detalle. 
                Si tu auto lo siente, nosotros lo solucionamos.
              </p>
            </div>
            <Link href="/servicios">
              <button className="flex items-center gap-2 text-[#f16315] font-bold text-lg group bg-white/5 px-6 py-3 rounded-full border border-[#f16315]/20 hover:bg-[#f16315]/10 transition-all">
                Explorar Catálogo Completo <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[300px]"
          >
            {SERVICES.map((service, i) => (
              <motion.div
                layout
                key={i}
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  show: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
                }}
                whileHover={{ y: -8 }}
                className={`group relative overflow-hidden rounded-[40px] border border-white/10 bg-zinc-900 flex flex-col justify-end transition-all ${
                  service.size === "large" ? "md:col-span-2 md:row-span-2" : 
                  service.size === "medium" ? "md:col-span-2 md:row-span-1" : 
                  "md:col-span-1 md:row-span-1"
                }`}
              >
                {/* Background Image - Cinematic Filter */}
                <div className="absolute inset-0 z-0">
                  <Image 
                    src={service.image} 
                    alt={service.title}
                    fill
                    className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-1000 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 group-hover:opacity-60 transition-opacity" />
                </div>

                <div className="absolute top-8 left-8 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-[#f16315] group-hover:bg-[#f16315] group-hover:text-white group-hover:scale-110 transition-all duration-500 z-10">
                  <service.icon size={24} />
                </div>
                
                <div className="relative z-10 p-10">
                  <h3 className="text-2xl font-black mb-2 text-white uppercase tracking-tight leading-none">{service.title}</h3>
                  <p className="text-white/40 text-xs font-medium leading-relaxed group-hover:text-white/80 transition-colors line-clamp-2">
                    {service.desc}
                  </p>
                </div>

                <Link href="/servicios" className="absolute inset-0 z-20" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- Transparencia Digital 360 --- */}
      <section className="py-32 relative overflow-hidden bg-black border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            {/* Left Side: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div>
                <h2 className="text-[#f16315] font-black tracking-[0.3em] uppercase text-sm mb-4">Honestidad Técnica</h2>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-6">
                  TRANSPARENCIA <br />
                  <span className="text-white/20">QUE SE SIENTE.</span>
                </h1>
                <p className="text-xl text-white/50 max-w-xl leading-relaxed">
                  En CarMD, la confianza no es una promesa, es un proceso. Vive una reparación 100% transparente desde tu smartphone.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: FileText,
                    title: "Inventario Electrónico",
                    desc: "Registro técnico y fotográfico minucioso al recibir tu unidad. Nada queda al azar."
                  },
                  {
                    icon: Camera,
                    title: "Reporte 360 Multimedia",
                    desc: "Recibe fotos y videos reales vía WhatsApp de cada intervención en tiempo real."
                  },
                  {
                    icon: MessageCircle,
                    title: "Asesoría por Videollamada",
                    desc: "Seguimiento personalizado para explicarte paso a paso el estado de tu vehículo."
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex-none w-14 h-14 rounded-2xl bg-[#f16315]/10 flex items-center justify-center text-[#f16315] group-hover:scale-110 transition-transform">
                      <item.icon size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight mb-1">{item.title}</h4>
                      <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/60 transition-colors">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side: Smartphone Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative z-10 aspect-[4/5] rounded-[60px] overflow-hidden border-[12px] border-zinc-900 shadow-2xl shadow-orange-500/10">
                <Image 
                  src="/transparency.png" 
                  alt="CarMD Digital Report Mockup" 
                  fill 
                  className="object-cover"
                />
              </div>
              
              {/* Floating Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#f16315]/20 rounded-full blur-[100px] z-0" />
              <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-orange-500/10 rounded-full blur-[120px] z-0" />
              
              {/* Trust Badge */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -right-6 p-6 bg-white text-black rounded-3xl z-20 shadow-2xl hidden md:block"
              >
                <div className="text-xs font-black uppercase tracking-tighter text-[#f16315] mb-1">Estatus Actual</div>
                <div className="text-2xl font-black uppercase leading-tight italic">100% <br />Transparente</div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- History / Timeline --- */}
      <section id="historia" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-[#f16315] font-black tracking-[0.3em] uppercase text-sm mb-4">Nuestro Origen</h2>
              <h1 className="text-4xl md:text-5xl font-black mb-10 leading-tight tracking-tighter uppercase">
                DONDE EL RIGOR TÉCNICO <br />
                <span className="text-white/20">ENCUENTRA LA PASIÓN POR EL DETALLE.</span>
              </h1>
              
              <div className="space-y-8">
                <div className="flex gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                  <div className="flex-none w-16 h-16 rounded-2xl bg-[#f16315]/10 flex items-center justify-center text-[#f16315]">
                    <Award size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 uppercase tracking-tight">38 Años de Maestría</h4>
                    <p className="text-white/40 leading-relaxed">Fundado en 1988, hemos evolucionado de la mecánica de precisión tradicional a la tecnología de diagnóstico más avanzada de México.</p>
                  </div>
                </div>

                <div className="flex gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                  <div className="flex-none w-16 h-16 rounded-2xl bg-[#f16315]/10 flex items-center justify-center text-[#f16315]">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 uppercase tracking-tight">Un Estándar Forjado bajo Presión</h4>
                    <p className="text-white/40 leading-relaxed">Durante más de una década, fuimos responsables del mantenimiento de flotas críticas como las del <strong>AICM</strong> y <strong>Yakult</strong>, forjando el rigor técnico que aplicamos hoy a tu vehículo.</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Link href="/nosotros">
                    <button className="group flex items-center gap-3 text-white font-bold uppercase tracking-widest text-xs hover:text-[#f16315] transition-colors">
                      Conoce nuestra historia completa <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[60px] overflow-hidden border border-white/10 group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#f16315]/20 to-transparent z-10 group-hover:opacity-0 transition-opacity duration-700" />
              <div className="w-full h-full bg-[url('/gallery-2.png')] bg-cover bg-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
              
              {/* Floating Stat Card */}
              <div className="absolute bottom-8 left-8 right-8 p-8 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[40px] z-20">
                <div className="flex items-center gap-6">
                  <div className="text-5xl font-black text-[#f16315]">1988</div>
                  <div className="h-10 w-[1px] bg-white/20" />
                  <div className="text-sm font-bold text-white uppercase tracking-tighter leading-tight">
                    El inicio de una<br />nueva era mecánica
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Anatomía de la Excelencia (Visual Bento) --- */}
      <section className="py-32 relative bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-[#f16315] font-black tracking-[0.4em] uppercase text-xs mb-4">El Cerebro del Auto</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
              ANATOMÍA DE LA <br />
              <span className="text-white/20">EXCELENCIA.</span>
            </h3>
            <p className="text-xl text-white/40 max-w-2xl mx-auto font-medium">
              Capturamos la esencia de la precisión digital. Donde la mecánica tradicional se rinde ante la exactitud de los datos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[800px] md:h-[600px]">
            {/* Main Tech Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:col-span-7 relative rounded-[40px] overflow-hidden border border-white/10 group bg-zinc-900"
            >
              <Image 
                src="/tech_diagnostic_tablet_1774906500694.png" 
                alt="Control Total" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8">
                <div className="text-2xl font-black uppercase tracking-tighter mb-1">CONTROL TOTAL</div>
                <div className="text-xs font-bold text-[#f16315] uppercase tracking-widest">Interface de Grado Industrial</div>
              </div>
            </motion.div>

            {/* Circuit Detail */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-5 relative rounded-[40px] overflow-hidden border border-white/10 group bg-zinc-900"
            >
              <Image 
                src="/diagnostic_circuit_precision_1774906472294.png" 
                alt="El Pulso Digital" 
                fill 
                className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700" />
              <div className="absolute top-8 right-8 text-right">
                <div className="text-xl font-black uppercase tracking-tighter mb-1">EL PULSO DIGITAL</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Precisión a Nivel Componente</div>
              </div>
            </motion.div>

            {/* Bottom Grid x3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-4 relative rounded-[40px] overflow-hidden border border-white/10 group bg-zinc-900"
            >
              <Image 
                src="/engine_sensor_digital_1774906483875.png" 
                alt="Diagnóstico Vivo" 
                fill 
                className="object-cover group-hover:scale-110 transition-transform duration-[3000ms]"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#f16315]/10 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="text-lg font-black uppercase tracking-tighter">DIAGNÓSTICO VIVO</div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="md:col-span-8 relative rounded-[40px] overflow-hidden border border-white/10 group bg-zinc-900"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
              <Image 
                src="/mechanical_detail_abstract_1774906515059.png" 
                alt="Rigor Mecánico" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-y-0 left-10 flex flex-col justify-center z-20 max-w-sm">
                <div className="text-3xl font-black uppercase tracking-tighter mb-4 leading-none">EL CÓDIGO DE LA <span className="text-[#f16315]">MECÁNICA.</span></div>
                <p className="text-sm font-medium text-white/50 leading-relaxed uppercase">Cada engranaje y sensor es auditado bajo estándares de aviación.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Contact & Location --- */}
      <section id="contacto" className="py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-8">ENCUÉNTRANOS</h2>
              <p className="text-xl text-white/50 mb-12">
                Atención personalizada y honesta. Estamos listos para recibirte.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="p-4 rounded-2xl bg-[#f16315]/10 text-[#f16315]">
                    <Phone size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/30 uppercase">WhatsApp / Teléfono</div>
                    <a href={getWhatsAppLink()} className="text-xl font-bold hover:text-[#f16315] transition-colors">{COMPANY_DEFAULTS.whatsapp}</a>
                  </div>
                </div>

                <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="p-4 rounded-2xl bg-[#f16315]/10 text-[#f16315]">
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/30 uppercase">Horarios de Atención</div>
                    <div className="text-xl font-bold italic">Lun - Vie: 7:45 - 17:00 | Sab: 7:45 - 14:00</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="p-4 rounded-2xl bg-[#f16315]/10 text-[#f16315]">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/30 uppercase">Ubicación</div>
                    <div className="text-md font-bold leading-tight">Palacio de Iturbide 233, Evolución,<br />Cd. Nezahualcóyotl, Estado de México.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-[40px] overflow-hidden border border-white/10 bg-black h-[500px] md:h-auto shadow-2xl shadow-black">
              {/* Inner Glow / Stroke */}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-[40px] z-20 pointer-events-none" />
              
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3763.4253874714823!2d-99.024018!3d19.3940179!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1fd6cce70cee9%3A0x1ce3fd10d93e2c24!2sCarMD%20Diagn%C3%B3stico%20Mec%C3%A1nico%20Automotriz!5e0!3m2!1ses!2smx!4v1774726252439!5m2!1ses!2smx" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full opacity-100 transition-opacity duration-1000"
              />
              
              <div className="absolute inset-x-0 bottom-0 p-8 pt-32 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10 pointer-events-none flex items-end">
                <span className="text-[#f16315] font-black tracking-widest uppercase text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#f16315] animate-pulse" /> Localización Confirmada
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <Link href="/">
              <BrandLogo size="lg" className="opacity-40 hover:opacity-100 transition-opacity" />
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-12">
            {[
              { name: 'Citas', url: '/citas' },
              { name: 'Ubicación', url: 'https://maps.app.goo.gl/EHV9HVbhVHRv5Zwm6' },
              { name: 'Privacidad', url: '/privacidad' },
              { name: 'Términos', url: '/terminos' },
              { name: 'Cookies', url: '/cookies' },
              { name: 'Email', url: 'mailto:contacto@carmd.com.mx' }
            ].map((link) => (
              <a key={link.name} href={link.url} className="text-sm font-black uppercase tracking-widest text-white/30 hover:text-[#f16315] transition-colors">
                {link.name}
              </a>
            ))}
          </div>
          <p className="text-white/20 text-xs font-medium uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} CarMD. Todos los derechos reservados. <br />
            Tecnología y Transparencia Automotriz.
          </p>
        </div>
      </footer>

      {/* --- CTA Floating Button --- */}
      <div className="fixed bottom-8 right-8 z-50">
        <a 
          href={getWhatsAppLink("Hola, quisiera solicitar un servicio de mantenimiento para mi auto.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-green-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative group"
          >
            <MessageCircle size={32} />
            <span className="absolute right-full mr-4 bg-white text-black px-3 py-1.5 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
               ¿Hablamos por WhatsApp?
            </span>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black" />
          </motion.button>
        </a>
      </div>
    </div>
  );
}
