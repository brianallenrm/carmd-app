"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Table, 
  ClipboardList, 
  Calendar, 
  Car, 
  Search,
  LayoutDashboard,
  History,
  Radio
} from 'lucide-react';
import DashboardCard from '@/components/os/DashboardCard';
import VehicleHistoryTool from '@/components/os/VehicleHistoryTool';
import RecentVehiclesFeed from '@/components/os/RecentVehiclesFeed';
import AppointmentsInbox from '@/components/os/AppointmentsInbox';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export default function ControlCenter() {
  const [activeTab, setActiveTab] = React.useState<'ingresos' | 'citas'>('ingresos');
  const masterSheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.MASTER.ID}`;
  const inventorySheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.INVENTORY.ID}`;

  // Ref to the VehicleHistoryTool search input so the feed can trigger a search
  const expedienteSectionRef = useRef<HTMLDivElement>(null);

  const handleExpedienteSearch = (plates: string) => {
    // Scroll smoothly to the Expediente section
    expedienteSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Trigger the search (we'll use a custom event since VehicleHistoryTool is a separate component)
    window.dispatchEvent(new CustomEvent('carmd:expediente-search', { detail: { query: plates } }));
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-[#f16315] p-2 md:p-2.5 rounded-xl text-white shadow-lg shadow-orange-500/30">
              <LayoutDashboard size={18} className="md:w-[22px] md:h-[22px]" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">CENTRO DE CONTROL</h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em] md:tracking-[0.2em]">CarMD OS • Staff</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500">
              SISTEMA ACTIVO
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-10 md:space-y-16">

        {/* ── Section 0: Live Feeds (Ingresos & Citas) ── */}
        <section className="space-y-6">
          {/* Tabs Selector */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
              <button 
                onClick={() => setActiveTab('ingresos')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'ingresos' 
                    ? "bg-[#f16315] text-white shadow-lg shadow-orange-500/20" 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Radio size={14} className={activeTab === 'ingresos' ? "animate-pulse" : ""} />
                Últimos Ingresos
              </button>
              <button 
                onClick={() => setActiveTab('citas')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'citas' 
                    ? "bg-[#f16315] text-white shadow-lg shadow-orange-500/20" 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Calendar size={14} />
                Bandeja de Citas
              </button>
            </div>
            <div className="h-px bg-gray-100 flex-grow" />
          </div>

          {/* Conditional Views */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-10 min-h-[400px]">
            {activeTab === 'ingresos' ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-black text-gray-900 uppercase">Vehículos en Piso</h3>
                  <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium">
                    Consulta el estado de los <strong className="text-gray-600">ingresos recientes</strong> al taller.
                  </p>
                </div>
                <RecentVehiclesFeed onExpedienteSearch={handleExpedienteSearch} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-black text-gray-900 uppercase">Solicitudes de Citas</h3>
                  <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium">
                    Atención rápida a clientes que solicitaron informes vía <span className="text-[#25D366] font-bold">WhatsApp</span>.
                  </p>
                </div>
                <div className="w-full">
                  <AppointmentsInbox />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 1: Expediente del Vehículo ── */}
        <section ref={expedienteSectionRef}>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[11px] font-black text-[#f16315] uppercase tracking-[0.3em] bg-orange-50 px-3 py-1 rounded-md flex items-center gap-1.5">
              <History size={11} />
              Expediente del Vehículo
            </h2>
            <div className="h-px bg-gray-100 flex-grow" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed mb-5">
              Consulta el historial completo de cualquier vehículo por{" "}
              <strong className="text-gray-700">placa</strong> o{" "}
              <strong className="text-gray-700">nombre</strong>.
            </p>
            <VehicleHistoryTool />
          </div>
        </section>

        {/* ── Section 2: Gestión Operativa ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] bg-gray-100 px-3 py-1 rounded-md">
              Gestión Operativa
            </h2>
            <div className="h-px bg-gray-100 flex-grow" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Crear Nuevo Inventario"
              description="Inspección visual de daños físicos, fotos de ingreso y registro de pertenencias."
              href="/os/inventario"
              icon={ClipboardList}
            />
            <DashboardCard
              title="Agenda de Citas"
              description="Gestión del calendario de servicios programados y disponibilidad del taller."
              href="/os/admin/citas"
              icon={Calendar}
            />
            <DashboardCard
              title="Ver Inventarios"
              description="Control técnico e historial del flujo de entrada de vehículos en tiempo real."
              href="/os/admin/receptions"
              icon={Car}
            />
          </div>
        </section>

        {/* ── Section 3: Herramientas de Alto Uso & Catálogos (Compacto) ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[11px] font-black text-[#f16315] uppercase tracking-[0.3em] bg-orange-50 px-3 py-1 rounded-md">
              Herramientas de Alto Uso & Bases de Datos
            </h2>
            <div className="h-px bg-gray-100 flex-grow" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Generar Nota */}
            <Link href="/os" target="_blank" className="flex items-center gap-3 p-3.5 bg-white hover:bg-orange-50/40 border border-gray-100 hover:border-orange-200 rounded-xl shadow-sm transition-all group">
              <div className="p-2 bg-orange-50 text-[#f16315] group-hover:bg-[#f16315] group-hover:text-white rounded-lg transition-colors flex-shrink-0">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 group-hover:text-[#f16315] transition-colors truncate">Generar Nota de Servicio</p>
                <p className="text-[10px] text-gray-400 truncate">Crear orden de trabajo</p>
              </div>
            </Link>

            {/* Catálogo Refacciones */}
            <Link href="/os/catalog" target="_blank" className="flex items-center gap-3 p-3.5 bg-white hover:bg-orange-50/40 border border-gray-100 hover:border-orange-200 rounded-xl shadow-sm transition-all group">
              <div className="p-2 bg-orange-50 text-[#f16315] group-hover:bg-[#f16315] group-hover:text-white rounded-lg transition-colors flex-shrink-0">
                <Search size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 group-hover:text-[#f16315] transition-colors truncate">Catálogo Refacciones</p>
                <p className="text-[10px] text-gray-400 truncate">Consultar números de parte</p>
              </div>
            </Link>

            {/* BD Maestra */}
            <a href={masterSheetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 bg-emerald-50/30 hover:bg-emerald-50 border border-emerald-100/60 hover:border-emerald-200 rounded-xl shadow-sm transition-all group">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg flex-shrink-0">
                <Table size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-950 truncate">B.D. Maestra (Folios)</p>
                <p className="text-[10px] text-emerald-600/80 truncate">Google Sheets externo</p>
              </div>
            </a>

            {/* BD Inventarios */}
            <a href={inventorySheetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 bg-emerald-50/30 hover:bg-emerald-50 border border-emerald-100/60 hover:border-emerald-200 rounded-xl shadow-sm transition-all group">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg flex-shrink-0">
                <Table size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-950 truncate">B.D. Inventarios</p>
                <p className="text-[10px] text-emerald-600/80 truncate">Google Sheets externo</p>
              </div>
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[11px] text-gray-400 font-medium tracking-wide">
            POWERED BY CARMD OS • VERSIÓN 2.6.0 • 2026
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">Servidor CDMX</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">DB Conectada</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
