"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  Car, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  ChevronDown,
  Mail,
  Gauge,
  MousePointerClick,
  Wrench,
  ClipboardList,
  MessageCircle,
  MapPin
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { VEHICLE_CATALOG } from "@/lib/constants";
import BrandLogo from "@/components/BrandLogo";

// --- Design Tokens ---
const COLORS = {
  primary: "#f16315",
  black: "#000000",
  dark: "#0a0a0a",
  card: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.1)",
};

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    plate: "",
    lastDigits: "",
    name: "",
    email: "",
    phone: "",
    brand: "",
    model: "",
    year: "",
    km: "",
    vin: "",
    date: "",
    time: "",
    problem: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Step 1: Secure Pre-fill Logic ---
  const handleVerifyPlate = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/citas/verify-plate?plate=${formData.plate}`);
      const data = await response.json();
      
      if (data.exists) {
        setStep(1.5); // Move to phone verification
      } else {
        setStep(2); // Move to manual data entry
      }
    } catch (err) {
      setStep(2); 
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch('/api/citas/unlock-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: formData.plate, lastDigits: formData.lastDigits }),
      });
      const data = await response.json();

      if (data.success) {
        // Map backend data to new fields
        const userData = data.userData;
        const brandMatch = Object.keys(VEHICLE_CATALOG).find(b => userData.vehicle?.toUpperCase().includes(b.toUpperCase()));
        
        setFormData({ 
          ...formData, 
          name: userData.name || "",
          phone: userData.phone || "",
          email: userData.email || "",
          brand: brandMatch || "",
          model: userData.vehicle?.replace(brandMatch || "", "").trim() || "",
          year: userData.year || "",
          vin: userData.vin || "",
          km: userData.km || ""
        });
        setStep(3); 
      } else {
        setError("Los últimos 4 dígitos no coinciden. Por favor completa los datos manualmente.");
        setTimeout(() => setStep(2), 2000);
      }
    } catch (err) {
      setError("Error de validación. Intenta completar manualmente.");
      setTimeout(() => setStep(2), 2000);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3 Helpers (Hours & Calendar) ---
  const getAvailableTimes = (dateString: string) => {
    if (!dateString) return [];
    const date = new Date(dateString + "T12:00:00");
    const isSaturday = date.getDay() === 6;
    
    const times = [];
    const start = 8;
    // Weekdays: 8am - 5pm (17:00). Sat: 8am - 2pm (14:00)
    const end = isSaturday ? 14 : 17; 

    for (let h = start; h <= end; h += 0.5) {
      if (isSaturday && h > 14) break;
      if (!isSaturday && h > 17) break;
      
      const hour = Math.floor(h);
      const minutes = (h % 1 === 0) ? "00" : "30";
      const ampm = hour >= 12 ? 'PM' : 'AM';
      let displayHour = hour > 12 ? hour - 12 : hour;
      if (displayHour === 0) displayHour = 12;
      
      times.push(`${displayHour}:${minutes} ${ampm}`);
    }
    return times;
  };

  const submitBooking = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/citas/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vehicle: `${formData.brand} ${formData.model}`.trim()
        }),
      });
      if (response.ok) setStep(5);
    } catch (err) {
      setError("Error al guardar la cita. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#f16315]">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 p-8 border-b border-white/5">
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
      <main className="max-w-7xl mx-auto pt-40 pb-20 px-6">
        
        {/* --- Process Steps (VISION 2.0) --- */}
        <section className="mb-24">
           <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center mb-16"
           >
              <h2 className="text-[#f16315] font-black tracking-[0.3em] uppercase text-xs mb-4">¿Cómo funciona?</h2>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none text-white">
                EL PROCESO CAR<span className="text-[#f16315]">MD</span>
              </h1>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { 
                  id: "01", 
                  title: "Genera tu cita", 
                  desc: "Completa el formulario en menos de 2 minutos con tus datos y los de tu auto.",
                  icon: (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-2 border-[0.5px] border-white/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:8px_8px] rounded-lg" />
                      <div className="absolute top-1 left-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute top-1 right-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute bottom-1 left-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute bottom-1 right-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <MousePointerClick size={28} strokeWidth={2} className="relative z-10 text-[#f16315]" />
                    </div>
                  )
                },
                { 
                  id: "02", 
                  title: "Confirmación", 
                  desc: "Recibirás un email automático y nos contactaremos vía WhatsApp para coordinar.",
                  icon: (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-2 border-[0.5px] border-white/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:8px_8px] rounded-lg" />
                      <div className="absolute top-1 left-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute top-1 right-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute bottom-1 left-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute bottom-1 right-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <Mail size={28} strokeWidth={2} className="relative z-10 text-[#f16315]" />
                    </div>
                  )
                },
                { 
                  id: "03", 
                  title: "Recepción", 
                  desc: "Trae tu vehículo a la clínica automotriz para una inspección física profesional.",
                  icon: (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-2 border-[0.5px] border-white/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:8px_8px] rounded-lg" />
                      <div className="absolute top-1 left-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute top-1 right-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute bottom-1 left-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute bottom-1 right-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <Wrench size={28} strokeWidth={2} className="relative z-10 text-[#f16315]" />
                    </div>
                  )
                },
                { 
                  id: "04", 
                  title: "Presupuesto", 
                  desc: "Recibe un diagnóstico detallado y el presupuesto necesario para tu reparación.",
                  icon: (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-2 border-[0.5px] border-white/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:8px_8px] rounded-lg" />
                      <div className="absolute top-1 left-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute top-1 right-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute bottom-1 left-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <div className="absolute bottom-1 right-1 text-[8px] opacity-20 font-mono select-none text-white">+</div>
                      <ClipboardList size={28} strokeWidth={2} className="relative z-10 text-[#f16315]" />
                    </div>
                  )
                }
              ].map((s, i) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 + 0.3 }}
                  className="relative group bg-white/[0.02] border border-white/5 p-10 rounded-[50px] hover:bg-white/[0.04] hover:border-[#f16315]/40 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute -top-4 -right-2 text-9xl font-black text-white/[0.02] group-hover:text-[#f16315]/5 transition-colors duration-700 pointer-events-none">
                    {s.id}
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-black border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:border-[#f16315]/20 transition-all duration-500">
                      {s.icon}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-black uppercase tracking-wider">{s.title}</h3>
                      <p className="text-white/40 text-[13px] leading-relaxed font-medium group-hover:text-white/60 transition-colors">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-[#f16315] group-hover:w-1/3 transition-all duration-700 rounded-full" />
                </motion.div>
              ))}
           </div>
        </section>

        <div className="max-w-3xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex justify-between mb-16 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -translate-y-1/2" />
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${
                  Math.floor(step) >= i ? "bg-[#f16315] border-[#f16315] text-white" : "bg-black border-white/10 text-white/30"
                }`}
              >
                {Math.floor(step) > i ? <CheckCircle2 size={20} /> : <span className="font-bold">{i}</span>}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* --- Step 1: Plate verification --- */}
            {step === 1 && (
              <motion.div 
                 key="step1" 
                 initial={{ opacity: 0, x: -20 }} 
                 animate={{ opacity: 1, x: 0 }} 
                 exit={{ opacity: 0, x: 20 }}
                 className="space-y-12"
               >
                 <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">AGENDA TU <span className="text-[#f16315]">CITA</span></h1>
                    <p className="text-white/40 text-lg font-bold uppercase tracking-[0.2em]">Ingresa tu placa para comenzar</p>
                 </div>
                <div className="bg-white/5 border border-white/10 p-12 rounded-[50px] space-y-8 backdrop-blur-xl">
                  <input 
                    type="text" 
                    placeholder="ABC-1234"
                    value={formData.plate}
                    onChange={(e) => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                    className="w-full bg-black border border-white/10 p-6 rounded-3xl text-4xl font-black tracking-widest text-center focus:border-[#f16315] outline-none"
                  />
                  <button 
                    onClick={handleVerifyPlate}
                    disabled={!formData.plate || loading}
                    className="w-full bg-[#f16315] py-6 rounded-3xl font-black uppercase text-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {loading ? "Buscando..." : <>Continuar <ArrowRight /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* --- Step 1.5: Secure Unlock --- */}
            {step === 1.5 && (
              <motion.div key="step1.5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="text-center">
                  <ShieldCheck size={60} className="mx-auto text-[#f16315] mb-6" />
                  <h1 className="text-4xl font-black mb-4">RECONOCIMIENTO</h1>
                  <p className="text-white/40 text-lg">Hemos detectado el vehículo en nuestro sistema.</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-12 rounded-[50px] space-y-8 text-center">
                  <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Ingresa los últimos 4 dígitos de tu celular registrado</p>
                  <input 
                    type="password" 
                    maxLength={4}
                    value={formData.lastDigits}
                    onChange={(e) => setFormData({...formData, lastDigits: e.target.value})}
                    placeholder="****"
                    className="w-32 mx-auto bg-black border border-white/10 p-6 rounded-3xl text-3xl font-black tracking-widest text-center focus:border-[#f16315] outline-none"
                  />
                  {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                  <button onClick={handleVerifyPhone} disabled={formData.lastDigits.length < 4 || loading} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase tracking-widest hover:bg-[#f16315] hover:text-white transition-all disabled:opacity-50">
                    {loading ? "Validando..." : "Verificar"}
                  </button>
                  <button onClick={() => setStep(2)} className="w-full text-white/20 text-xs font-bold uppercase hover:text-white">Lo llenaré manualmente</button>
                </div>
              </motion.div>
            )}

            {/* --- Step 2: Detailed Data Entry --- */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                 <div className="text-center mb-8">
                   <h1 className="text-4xl font-black mb-2 uppercase">DATOS DEL VEHÍCULO</h1>
                   <p className="text-white/40 font-bold">Verifica o completa la información.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-8 rounded-[40px] border border-white/10">
                    {/* Brand Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Marca</label>
                      <div className="relative">
                        <select 
                          value={formData.brand}
                          onChange={(e) => setFormData({...formData, brand: e.target.value, model: ""})}
                          className="w-full appearance-none bg-black border border-white/10 p-4 rounded-2xl focus:border-[#f16315] outline-none pr-10 font-bold"
                        >
                          <option value="">Selecciona Marca</option>
                          {Object.keys(VEHICLE_CATALOG).sort().map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                      </div>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Modelo / Sub-Marca</label>
                       <div className="relative">
                         <select 
                          value={formData.model}
                          disabled={!formData.brand}
                          onChange={(e) => setFormData({...formData, model: e.target.value})}
                          className="w-full appearance-none bg-black border border-white/10 p-4 rounded-2xl focus:border-[#f16315] outline-none pr-10 font-bold disabled:opacity-20"
                         >
                           <option value="">Selecciona Modelo</option>
                           {formData.brand && VEHICLE_CATALOG[formData.brand].map(m => <option key={m} value={m}>{m}</option>)}
                           <option value="OTRO">+ Otro modelo...</option>
                         </select>
                         <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                       </div>
                    </div>

                    {/* Year selection */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Año</label>
                       <input 
                        type="number" 
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                        placeholder="AAAA"
                        className="w-full bg-black border border-white/10 p-4 rounded-2xl focus:border-[#f16315] outline-none font-bold" 
                       />
                    </div>

                    {/* Kilometraje */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2 flex items-center gap-1"><Gauge size={10} /> Kilometraje</label>
                       <input 
                        type="number" 
                        value={formData.km}
                        onChange={(e) => setFormData({...formData, km: e.target.value})}
                        placeholder="Ej: 85000"
                        className="w-full bg-black border border-white/10 p-4 rounded-2xl focus:border-[#f16315] outline-none font-bold" 
                       />
                    </div>

                    {/* Client Info */}
                    <div className="space-y-2 md:col-span-2 pt-4 border-t border-white/5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Nombre del Propietario</label>
                       <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-black border border-white/10 p-4 rounded-2xl focus:border-[#f16315] outline-none font-bold" 
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">WhatsApp</label>
                       <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="55..."
                        className="w-full bg-black border border-white/10 p-4 rounded-2xl focus:border-[#f16315] outline-none font-bold" 
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2 flex items-center gap-1"><Mail size={10} /> Correo Electrónico</label>
                       <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="cliente@ejemplo.com"
                        className="w-full bg-black border border-white/10 p-4 rounded-2xl focus:border-[#f16315] outline-none font-bold" 
                       />
                    </div>
                 </div>

                 <button 
                  onClick={() => setStep(3)}
                  disabled={!formData.brand || !formData.model || !formData.phone || !formData.name}
                  className="w-full bg-[#f16315] py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-[#f16315]/20 disabled:opacity-20"
                 >
                   Agenda tu Cita
                 </button>
              </motion.div>
            )}

            {/* --- Step 3: Custom Calendar & Hours --- */}
            {step === 3 && (
               <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div className="text-center mb-8">
                     <h1 className="text-4xl font-black mb-2 uppercase">¿CUÁNDO TE RECIBIMOS?</h1>
                     <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
                       Lun-Vie 8AM-5PM | Sáb 8AM-2PM | Dom cerrado
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-8 rounded-[40px] border border-white/10">
                     <div className="space-y-4">
                        <label className="text-[#f16315] font-black uppercase tracking-widest text-xs flex items-center gap-2"><CalendarIcon size={14} /> Fecha</label>
                        <CalendarComponent 
                          selectedDate={formData.date} 
                          onSelect={(d) => setFormData({...formData, date: d, time: ""})} 
                        />
                     </div>

                     <div className="space-y-4">
                        <label className="text-[#f16315] font-black uppercase tracking-widest text-xs flex items-center gap-2"><Clock size={14} /> Horario</label>
                        <div className="grid grid-cols-2 gap-2 h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#f16315]/40">
                           {formData.date ? (
                             getAvailableTimes(formData.date).map(t => (
                               <button 
                                 key={t}
                                 onClick={() => setFormData({...formData, time: t})}
                                 className={`p-3 rounded-xl border text-xs font-black transition-all ${
                                   formData.time === t ? "bg-[#f16315] border-[#f16315] text-white" : "bg-black border-white/5 hover:border-white/20 text-white/50"
                                 }`}
                               >
                                 {t}
                               </button>
                             ))
                           ) : (
                             <div className="col-span-2 text-center py-20 text-white/10 italic text-xs uppercase font-black">Selecciona un día primero</div>
                           )}
                        </div>
                     </div>
                  </div>

                  <button 
                    disabled={!formData.date || !formData.time}
                    onClick={() => setStep(4)}
                    className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase tracking-widest hover:bg-[#f16315] hover:text-white transition-all disabled:opacity-20"
                  >
                    Siguiente: Motivo de Servicio
                  </button>
               </motion.div>
            )}

            {/* --- Step 4: Confirmation --- */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                 <div className="text-center">
                   <h1 className="text-4xl font-black mb-4 uppercase">DETALLES FINALES</h1>
                   <p className="text-white/40">Cuéntanos qué necesita tu {formData.brand}.</p>
                 </div>
                 <div className="bg-white/5 p-12 rounded-[50px] border border-white/10 space-y-6">
                    <textarea 
                      rows={4}
                      value={formData.problem}
                      onChange={(e) => setFormData({...formData, problem: e.target.value})}
                      className="w-full bg-black border border-white/10 p-6 rounded-3xl focus:border-[#f16315] outline-none text-lg"
                      placeholder="Ej: Hace un ruido al frenar, requiere afinación, etc."
                    />
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 grid grid-cols-2 gap-y-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                       <div>Cita:</div>
                       <div className="text-right text-[#f16315]">{formData.date} @ {formData.time}</div>
                       <div>Vehículo:</div>
                       <div className="text-right text-white">{formData.brand} {formData.model} ({formData.year})</div>
                       <div>KM:</div>
                       <div className="text-right text-white">{formData.km} KM</div>
                    </div>
                 </div>
                 <button onClick={submitBooking} disabled={!formData.problem || loading} className="w-full bg-[#f16315] py-8 rounded-[40px] font-black uppercase tracking-[0.3em] text-xl shadow-2xl shadow-[#f16315]/50">
                    {loading ? "Confirmando..." : "Confirmar Cita"}
                 </button>
              </motion.div>
            )}

            {/* --- Step 5: Success --- */}
            {step === 5 && (
              <motion.div 
                key="step5" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-10 space-y-12 max-w-2xl mx-auto"
              >
                 <div className="relative w-48 h-48 mx-auto">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-[#f16315]/20 rounded-full blur-3xl animate-pulse" />
                    
                    {/* Rotating Technical Ring */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dashed border-[#f16315]/30 rounded-full" 
                    />
                    
                    {/* Scanning Line Animation */}
                    <motion.div 
                      key="scanner"
                      initial={{ top: "-10%" }}
                      animate={{ top: "110%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f16315] to-transparent z-20"
                    />

                    <div className="absolute inset-4 bg-white/[0.03] border border-white/10 rounded-full flex items-center justify-center backdrop-blur-xl">
                       <motion.div
                         initial={{ scale: 0, rotate: -45 }}
                         animate={{ scale: 1, rotate: 0 }}
                         transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                       >
                          <CheckCircle2 size={80} className="text-[#f16315] drop-shadow-[0_0_20px_rgba(241,99,21,0.5)]" />
                       </motion.div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Cita Confirmada</h1>
                    <div className="h-1 w-20 bg-[#f16315] mx-auto rounded-full" />
                    <p className="text-white/40 text-lg font-medium max-w-md mx-auto leading-relaxed">
                      Tu espacio ha sido reservado con éxito. Hemos enviado los detalles a <span className="text-white font-bold">{formData.email}</span>.
                    </p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
                    <a 
                      href={`https://wa.me/525611904066?text=Hola,%20acabo%20de%20agendar%20una%20cita%20para%20mi%20${formData.brand}%20el%20día%20${formData.date}%20a%20las%20${formData.time}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white py-5 rounded-[30px] font-black uppercase tracking-widest text-xs transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-green-500/20"
                    >
                      <MessageCircle size={20} /> Contactar WhatsApp
                    </a>
                    <a 
                      href="https://maps.app.goo.gl/EHV9HVbhVHRv5Zwm6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 bg-white hover:bg-[#f16315] hover:text-white text-black py-5 rounded-[30px] font-black uppercase tracking-widest text-xs transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
                    >
                      <MapPin size={20} /> Ver en Maps
                    </a>
                 </div>

                 <div className="pt-8 opacity-20">
                    <Link href="/web-test" className="text-xs font-black uppercase tracking-[0.4em] hover:text-[#f16315] transition-colors">
                       Cerrar y volver al inicio
                    </Link>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Custom Calendar Component ---
function CalendarComponent({ selectedDate, onSelect }: { selectedDate: string, onSelect: (d: string) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + offset);
    setCurrentMonth(next);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="bg-black/50 rounded-3xl p-4 border border-white/5 select-none">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-black uppercase tracking-widest text-[10px] text-white/50">
          {currentMonth.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:text-[#f16315]"><ChevronLeft size={16} /></button>
          <button onClick={() => changeMonth(1)} className="p-1 hover:text-[#f16315]"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['D','L','M','M','J','V','S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-[10px] font-black text-white/20">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* Fillers for first day offset */}
        {Array(daysInMonth[0].getDay()).fill(0).map((_, i) => <div key={`empty-${i}`} />)}
        
        {daysInMonth.map((date) => {
          const isSelected = selectedDate === formatDate(date);
          const isSunday = date.getDay() === 0;
          const isToday = formatDate(date) === formatDate(new Date());
          const isPast = date < new Date(new Date().setHours(0,0,0,0));
          const isDisabled = isSunday || isPast || isToday;

          return (
            <button
              key={date.toISOString()}
              disabled={isDisabled}
              onClick={() => onSelect(formatDate(date))}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                isSelected ? "bg-[#f16315] text-white shadow-lg scale-110" : 
                isDisabled ? "text-white/10 cursor-not-allowed italic" : 
                "hover:bg-white/10 hover:text-[#f16315] text-white/60"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
