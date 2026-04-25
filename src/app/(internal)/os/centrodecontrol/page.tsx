"use client";

import React, { useRef } from 'react';
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
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export default function ControlCenter() {
  const masterSheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.MASTER.ID}`;
  const inventorySheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.INVENTORY.ID}`;

  // Ref to the VehicleHistoryTool search input so the feed can trigger a search
  const expedienteRef = useRef<{ triggerSearch: (plates: string) => void } | null>(null);
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

        {/* ── Section 0: Últimos Ingresos (Live Feed) ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[11px] font-black text-[#f16315] uppercase tracking-[0.3em] bg-orange-50 px-3 py-1 rounded-md flex items-center gap-1.5">
              <Radio size={11} className="animate-pulse" />
              Últimos Ingresos
            </h2>
            <div className="h-px bg-gray-100 flex-grow" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed mb-5">
              Los <strong className="text-gray-700">últimos 10 vehículos</strong> registrados. 
              Consulta su nota de servicio o el estado actual.
            </p>
            <RecentVehiclesFeed onExpedienteSearch={handleExpedienteSearch} />
          </div>
        </section>

        {/* ── Section 1: Herramientas de Alto Uso ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[11px] font-black text-[#f16315] uppercase tracking-[0.3em] bg-orange-50 px-3 py-1 rounded-md">
              Herramientas de Alto Uso
            </h2>
            <div className="h-px bg-gray-100 flex-grow" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-4">
              <DashboardCard
                title="Generación de Notas de Servicio"
                description="Motor principal de folios. Crea órdenes de trabajo, presupuestos y registros maestros con un solo clic."
                href="/os"
                icon={FileText}
                variant="primary"
                isLarge
              />
            </div>
            <div className="md:col-span-2 flex flex-col gap-6">
              <DashboardCard
                title="B.D. Maestra (Folios)"
                description="Consultar historial de notas."
                href={masterSheetUrl}
                icon={Table}
                variant="external"
              />
              <DashboardCard
                title="B.D. Inventarios"
                description="Historial de recepciones."
                href={inventorySheetUrl}
                icon={Table}
                variant="external"
              />
            </div>
          </div>
        </section>

        {/* ── Section 2: Expediente del Vehículo ── */}
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

        {/* ── Section 3: Gestión Operativa ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] bg-gray-100 px-3 py-1 rounded-md">
              Gestión Operativa
            </h2>
            <div className="h-px bg-gray-100 flex-grow" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Inventario & Recepción"
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
              title="Logística de Recepciones"
              description="Control técnico del flujo de entrada de vehículos en tiempo real."
              href="/os/admin/receptions"
              icon={Car}
            />
          </div>
        </section>

        {/* ── Section 4: Catálogos ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] bg-gray-100 px-3 py-1 rounded-md">
              Catálogos & Servicios
            </h2>
            <div className="h-px bg-gray-100 flex-grow" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <DashboardCard
              title="Catálogo Refacciones"
              description="Consulta rápida de números de parte."
              href="/os/catalog"
              icon={Search}
            />
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
