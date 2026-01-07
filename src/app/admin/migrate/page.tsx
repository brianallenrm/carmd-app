'use client';

import { useState } from 'react';
import { Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function MigrationPage() {
    const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR'>('IDLE');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [totalItems, setTotalItems] = useState(0);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);

    const runMigration = async () => {
        setStatus('RUNNING');
        setLogs([]);
        setProgress(0);
        addLog("Iniciando migración...");

        const LIMIT = 50; // Items per batch
        let page = 0;
        let hasMore = true;
        let totalProcessed = 0;

        try {
            while (hasMore) {
                addLog(`Procesando lote ${page + 1}...`);
                const res = await fetch(`/api/admin/migrate-catalog?page=${page}&limit=${LIMIT}`);

                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

                const data = await res.json();

                if (data.totalItems && totalItems === 0) setTotalItems(data.totalItems);

                if (data.count === 0 || data.completed) {
                    hasMore = false;
                    addLog("Todos los registros han sido procesados.");
                } else {
                    totalProcessed += data.count;
                    const pct = data.totalItems ? Math.round((totalProcessed / data.totalItems) * 100) : 0;
                    setProgress(pct);
                    addLog(`✅ Lote ${page + 1} completado (${data.count} items). Total: ${totalProcessed}`);
                    page++;
                }

                // Small delay to be nice to API
                await new Promise(r => setTimeout(r, 200));
            }

            setStatus('COMPLETED');
            setProgress(100);
            addLog("🎉 ¡MIGRACIÓN EXITOSA! El catálogo ya vive en Google Sheets.");

        } catch (error) {
            console.error(error);
            setStatus('ERROR');
            addLog(`❌ Error Crítico: ${String(error)}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#111827] px-6 py-4 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-[#F37014]">///</span> Migrador de Catálogo CarMD
                    </h1>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-gray-600">
                        Esta herramienta moverá todos los productos del archivo JSON estático a tu Google Sheet.
                        Debido a la gran cantidad de datos (+4000 items), el proceso se hará por lotes.
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-[#F37014] h-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Progreso: {progress}%</span>
                        <span>{totalItems > 0 ? `${Math.round((progress / 100) * totalItems)} / ${totalItems}` : ''}</span>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center">
                        {status === 'IDLE' && (
                            <button
                                onClick={runMigration}
                                className="flex items-center gap-2 bg-[#F37014] hover:bg-[#d65f0e] text-white px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                            >
                                <Play size={20} /> Iniciar Migración
                            </button>
                        )}

                        {status === 'RUNNING' && (
                            <button disabled className="flex items-center gap-2 bg-gray-400 text-white px-8 py-3 rounded-lg font-bold cursor-not-allowed">
                                <Loader2 size={20} className="animate-spin" /> Procesando...
                            </button>
                        )}

                        {status === 'COMPLETED' && (
                            <div className="flex flex-col items-center gap-2 text-green-600 font-bold">
                                <CheckCircle size={32} />
                                <span>¡Completado!</span>
                            </div>
                        )}

                        {status === 'ERROR' && (
                            <div className="flex flex-col items-center gap-2 text-red-600 font-bold">
                                <AlertCircle size={32} />
                                <span>Hubo un error. Revisa el log.</span>
                                <button onClick={runMigration} className="mt-2 text-sm underline text-red-500">Reintentar</button>
                            </div>
                        )}
                    </div>

                    {/* Logs */}
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto border border-gray-800">
                        {logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-gray-300'}`}>
                                <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span> {log}
                            </div>
                        ))}
                        {logs.length === 0 && <span className="text-gray-600">Esperando inicio...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
