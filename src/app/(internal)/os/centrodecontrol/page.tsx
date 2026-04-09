"use client";

import React from 'react';
import { 
  FileText, 
  Table, 
  ClipboardList, 
  Calendar, 
  Car, 
  Search,
  LayoutDashboard
} from 'lucide-react';
import DashboardCard from '@/components/os/DashboardCard';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export default function ControlCenter() {
  const masterSheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.MASTER.ID}`;
  const inventorySheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.INVENTORY.ID}`;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Area */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">CENTRO DE CONTROL</h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">CarMD OS • Sistema Operativo Central</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        
        {/* Section 1: Herramientas Principales (Priority) */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] bg-blue-50 px-3 py-1 rounded-md">
              Herramientas de Alto Uso
            </h2>
            <div className="h-px bg-gray-100 flex-grow" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* Note generation is the most prominent */}
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
            {/* Database links are very important but secondary in size */}
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

        {/* Section 2: Operación & Gestión */}
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

        {/* Section 3: Soporte & Catálogo */}
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

      {/* Footer Status */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[11px] text-gray-400 font-medium tracking-wide">
            POWERED BY CARMD OS • VERSIÓN 2.4.0 • 2026
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
