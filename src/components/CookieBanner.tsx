"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("carmd_cookie_consent");
    if (!consent) {
      // Delay appearance for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("carmd_cookie_consent", "accepted");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[100]"
        >
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-2xl shadow-black/50">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-[#f16315]/10 rounded-2xl text-[#f16315] shrink-0">
                <Cookie size={24} />
              </div>
              <div className="space-y-3">
                <h4 className="text-white font-black uppercase text-xs tracking-widest">Control de Privacidad</h4>
                <p className="text-white/50 text-[11px] leading-relaxed font-medium">
                  Utilizamos cookies técnicas para asegurar la mejor experiencia en tu reserva y diagnóstico. 
                  Al continuar, aceptas nuestra <Link href="/cookies" className="text-[#f16315] border-b border-[#f16315]/20 hover:border-[#f16315]">Política de Cookies</Link>.
                </p>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={acceptCookies}
                    className="flex-1 bg-white text-black py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#f16315] hover:text-white transition-all active:scale-95"
                  >
                    Aceptar Todo
                  </button>
                  <button 
                    onClick={() => setIsVisible(false)}
                    className="p-3 text-white/30 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
