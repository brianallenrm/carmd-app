"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, MessageCircle, Calendar, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getWhatsAppLink } from "@/lib/constants";

export default function AttentionBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("carmd_attention_banner_dismissed");
    if (!isDismissed) {
      // Delay appearance slightly for a smooth intro after the page loads
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissBanner = () => {
    localStorage.setItem("carmd_attention_banner_dismissed", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissBanner}
            className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative bg-zinc-950/95 border border-white/10 p-6 md:p-8 rounded-[36px] shadow-[0_25px_60px_rgba(0,0,0,0.9)] max-w-xl w-full z-10 overflow-hidden pointer-events-auto"
          >
            {/* Ambient Orange Glow */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#f16315]/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Close Button */}
            <button 
              onClick={dismissBanner}
              className="absolute top-6 right-6 p-2 text-white/30 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <X size={18} />
            </button>

            {/* Header: Shield + Title centered */}
            <div className="flex flex-col items-center text-center border-b border-white/5 pb-5 mb-5">
              <div className="p-3.5 bg-[#f16315]/10 rounded-2xl text-[#f16315] w-fit mb-3 flex items-center justify-center">
                <ShieldCheck size={26} className="drop-shadow-[0_0_8px_rgba(241,99,21,0.4)]" />
              </div>
              <div className="flex flex-col items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#f16315]/10 text-[#f16315] mb-2">
                  <AlertTriangle size={10} /> Compromiso de Calidad
                </span>
                <h4 className="text-white font-black uppercase text-base md:text-lg tracking-wider leading-none">Atención 100% Personalizada</h4>
              </div>
            </div>

            {/* Body Content: Takes 100% width and aligns correctly */}
            <div className="space-y-5">
              <div className="space-y-4 text-white/60 text-[13px] leading-relaxed font-medium text-justify">
                <p>
                  Para brindarte la <strong className="text-white">experiencia</strong>, el <strong className="text-white">rigor técnico</strong> y el <strong className="text-white">servicio humano</strong> que nos caracterizan, respetamos estrictamente el turno de cada cliente en el taller. Por respeto a los vehículos en proceso, no sobresaturamos nuestras instalaciones.
                </p>
                
                <p>
                  <span className="text-[#f16315] font-black uppercase tracking-wide block text-[10px] mb-1 text-left">¿Por qué te solicitamos datos esenciales?</span>
                  Conocer tu nombre y los detalles de tu vehículo nos permite agilizar tu recepción y brindarte un seguimiento <strong className="text-white">cercano, personal y directo</strong>.
                </p>

                <p className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-white/70 text-left">
                  <strong className="text-white">Recomendación:</strong> Utilizar nuestro sistema de citas en línea <strong className="text-white">garantiza tu lugar en la agenda</strong> y agiliza tu tiempo de atención.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/citas" className="flex-1" onClick={dismissBanner}>
                  <button className="w-full flex items-center justify-center gap-2 bg-[#f16315] hover:bg-[#d95300] text-white py-3.5 px-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-orange-500/10 cursor-pointer">
                    <Calendar size={14} /> Agendar Mi Cita (Recomendado)
                  </button>
                </Link>
                <a 
                  href={getWhatsAppLink("Hola, me gustaría agendar una cita. Mi nombre es: ")}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismissBanner}
                  className="flex-1"
                >
                  <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 px-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 cursor-pointer">
                    <MessageCircle size={14} /> WhatsApp Directo
                  </button>
                </a>
              </div>

              <p className="text-[10px] text-white/30 italic border-t border-t-white/5 pt-4 leading-normal text-left">
                * Nota: Atendemos tu primer mensaje de inmediato. Respondemos la mayoría de las solicitudes el mismo día; sin embargo, el tiempo de confirmación técnica o cotización detallada puede prolongarse dependiendo de la ocupación del taller.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
