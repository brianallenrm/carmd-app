"use client";

import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  Car, 
  User, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Search,
  RefreshCw,
  Mail,
  MoreVertical
} from "lucide-react";
import Image from "next/image";

interface Cita {
  id: number;
  timestamp: string;
  plate: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  year: string;
  km: string;
  date: string;
  time: string;
  problem: string;
  status: string;
}

export default function AdminCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchCitas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/citas');
      const data = await res.json();
      setCitas(data.citas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCitas(); }, []);

  const sendToRafael = (cita: Cita) => {
    const RAFAEL_PHONE = "525516473084";
    const msg = `Hola Rafael, se generó una nueva cita:
👤 Cliente: ${cita.name}
🚗 Vehículo: ${cita.vehicle} (${cita.year})
📅 Fecha: ${cita.date}
⏰ Hora: ${cita.time}
📋 Placa: ${cita.plate}
⚠️ Problema: ${cita.problem}
📱 WhatsApp Cliente: wa.me/${cita.phone.replace(/[^0-9]/g, '')}`;
    
    window.open(`https://wa.me/${RAFAEL_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendToClient = (cita: Cita) => {
    const msg = `Hola ${cita.name}, confirmamos la recepción de tu solicitud de cita en CarMD para tu ${cita.vehicle}.
Agendado para: ${cita.date} a las ${cita.time}.
¡Te esperamos!`;
    
    window.open(`https://wa.me/${cita.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredCitas = citas.filter(c => 
    c.name.toLowerCase().includes(filter.toLowerCase()) || 
    c.plate.toLowerCase().includes(filter.toLowerCase()) ||
    c.vehicle.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#f16315]">
      {/* Sidebar/Header */}
      <div className="flex">
        <aside className="w-64 h-screen border-r border-white/5 bg-black/50 p-6 hidden lg:block sticky top-0">
           <div className="mb-12">
              <Image src="/logo.png" alt="Logo" width={100} height={30} className="brightness-0 invert opacity-50" />
           </div>
           <nav className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 ml-2">Módulos</div>
              <a href="/os/admin/receptions" className="flex items-center gap-3 p-3 rounded-xl text-white/40 hover:bg-white/5 transition-all">
                 <Car size={18} /> Recepciones
              </a>
              <a href="/os/admin/citas" className="flex items-center gap-3 p-3 rounded-xl bg-[#f16315]/10 text-[#f16315] font-bold">
                 <Calendar size={18} /> Citas Vision 2.0
              </a>
           </nav>
        </aside>

        <main className="flex-1 p-4 md:p-12 overflow-x-hidden">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                 <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">BANDEJA DE CITAS</h1>
                 <p className="text-white/40 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                   <Clock size={12} className="text-[#f16315]" /> {citas.length} Citas Pendientes de Gestión
                 </p>
              </div>
              <div className="flex gap-3">
                 <button onClick={fetchCitas} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <RefreshCw size={20} className={loading ? "animate-spin text-[#f16315]" : ""} />
                 </button>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por placa, nombre o vehículo..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:border-[#f16315] outline-none w-[300px] transition-all"
                    />
                 </div>
              </div>
           </div>

           {/* Table */}
           <div className="bg-white/5 border border-white/10 rounded-[35px] overflow-hidden backdrop-blur-3xl">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                          <th className="p-6">Vehículo / Placa</th>
                          <th className="p-6">Propietario</th>
                          <th className="p-6">Fecha Cita</th>
                          <th className="p-6">Problema</th>
                          <th className="p-6 text-right">Gestión</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {filteredCitas.map((cita) => (
                          <tr key={cita.id} className="hover:bg-white/[0.03] transition-colors group">
                             <td className="p-6">
                                <div className="font-black text-white group-hover:text-[#f16315] transition-colors uppercase">{cita.vehicle} ({cita.year})</div>
                                <div className="text-xs font-bold text-white/30 tracking-widest">{cita.plate}</div>
                             </td>
                             <td className="p-6">
                                <div className="font-bold flex items-center gap-2 text-sm">{cita.name} <AlertCircle size={14} className="text-[#f16315] opacity-50" /></div>
                                <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{cita.phone}</div>
                             </td>
                             <td className="p-6">
                                <div className="flex items-center gap-2 text-[#f16315] font-black uppercase text-sm">
                                   <Calendar size={14} /> {cita.date}
                                </div>
                                <div className="flex items-center gap-2 text-white/30 font-bold text-xs uppercase tracking-tighter">
                                   <Clock size={12} /> {cita.time}
                                </div>
                             </td>
                             <td className="p-6">
                                <p className="text-xs text-white/60 line-clamp-2 max-w-[200px] italic">"{cita.problem}"</p>
                             </td>
                             <td className="p-6 text-right">
                                <div className="flex justify-end gap-2">
                                   <button 
                                      onClick={() => sendToRafael(cita)}
                                      className="flex items-center gap-2 px-4 py-2 bg-[#f16315] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                                   >
                                      Enviara Rafael <MessageCircle size={14} />
                                   </button>
                                   <button 
                                      onClick={() => sendToClient(cita)}
                                      className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f16315] hover:text-white transition-all shadow-lg"
                                   >
                                      Cliente <ExternalLink size={14} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                       ))}
                       {filteredCitas.length === 0 && (
                          <tr>
                             <td colSpan={5} className="p-20 text-center text-white/10 italic uppercase font-black tracking-[0.3em]">No se encontraron registros</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}
