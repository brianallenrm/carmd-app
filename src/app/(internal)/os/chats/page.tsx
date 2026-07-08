"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
    MessageSquare, 
    ArrowLeft, 
    Bot, 
    User, 
    Send, 
    Loader2, 
    AlertCircle, 
    Check, 
    Smartphone,
    UserCheck,
    RefreshCw
} from 'lucide-react';

interface ChatSession {
    phone: string;
    state: string;
    lastUpdate: string;
    vehicleProblem: string;
}

interface ChatMessage {
    phone: string;
    sender: 'client' | 'assistant' | 'admin';
    text: string;
    timestamp: string;
}

export default function ChatsPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [togglingState, setTogglingState] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'chat'>('list'); // Para responsivo

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Cargar todas las sesiones de chat
    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/chats');
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (error) {
            console.error("Error loading chat sessions:", error);
        } finally {
            setLoadingSessions(false);
        }
    };

    // Cargar historial de mensajes de un chat específico
    const fetchHistory = async (phone: string) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/chats/${phone}/history`);
            const data = await res.json();
            setMessages(data.messages || []);
        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 15000); // Auto-update list
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedSession) {
            fetchHistory(selectedSession.phone);
            const interval = setInterval(() => fetchHistory(selectedSession.phone), 5000); // Polling chat de 5s
            return () => clearInterval(interval);
        }
    }, [selectedSession]);

    // Scroll al final del chat cada que cargan mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectSession = (session: ChatSession) => {
        setSelectedSession(session);
        setViewMode('chat');
    };

    // Enviar un mensaje manual
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSession || !inputText.trim() || sending) return;

        const textToSend = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            const res = await fetch(`/api/chats/${selectedSession.phone}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToSend })
            });

            if (res.ok) {
                // Agregar localmente para feedback inmediato
                const newMsg: ChatMessage = {
                    phone: selectedSession.phone,
                    sender: 'admin',
                    text: textToSend,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, newMsg]);
                
                // Actualizar localmente el estado a HUMAN_REQUIRED
                setSelectedSession(prev => prev ? { ...prev, state: 'HUMAN_REQUIRED' } : null);
                setSessions(prev => prev.map(s => s.phone === selectedSession.phone ? { ...s, state: 'HUMAN_REQUIRED' } : s));
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    // Alternar modo IA vs Humano
    const handleToggleState = async () => {
        if (!selectedSession || togglingState) return;

        const isCurrentlyIA = selectedSession.state.endsWith('_IA') || selectedSession.state === 'START';
        const targetState = isCurrentlyIA ? 'HUMAN_REQUIRED' : 'WAITING_PROBLEM_IA';

        setTogglingState(true);
        try {
            const res = await fetch(`/api/chats/${selectedSession.phone}/state`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: targetState })
            });

            if (res.ok) {
                setSelectedSession(prev => prev ? { ...prev, state: targetState } : null);
                setSessions(prev => prev.map(s => s.phone === selectedSession.phone ? { ...s, state: targetState } : s));
            }
        } catch (error) {
            console.error("Error updating state:", error);
        } finally {
            setTogglingState(false);
        }
    };

    // Parsear el JSON temporal de la cita para mostrar su progreso
    const getAccumulatedData = (vehicleProblem: string) => {
        try {
            if (vehicleProblem && vehicleProblem.startsWith('{')) {
                return JSON.parse(vehicleProblem);
            }
        } catch (e) {}
        return null;
    };

    const getChatName = (session: ChatSession) => {
        const acc = getAccumulatedData(session.vehicleProblem);
        return acc?.name || `Cliente (${session.phone.slice(-10)})`;
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
            {/* Header General */}
            <header className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Link href="/os/centrodecontrol" className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 rounded-xl transition-all border border-slate-800">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-sm font-black tracking-widest uppercase text-orange-500">Chats de WhatsApp</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monitoreo del Asistente Virtual</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchSessions}
                        className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 rounded-xl border border-slate-800 transition-all"
                    >
                        <RefreshCw size={14} className={loadingSessions ? "animate-spin" : ""} />
                    </button>
                    <span className="hidden md:inline-flex px-3 py-1 bg-[#25D366]/10 text-[#25D366] text-[10px] font-black tracking-widest uppercase rounded-full border border-[#25D366]/20">
                        Conectado a Meta
                    </span>
                </div>
            </header>

            {/* Panel Principal */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* 1. Lista de Chats (Sidebar Izquierdo) */}
                <div className={`w-full md:w-80 bg-slate-950/40 border-r border-slate-800 flex flex-col flex-shrink-0 ${viewMode === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Conversaciones Activas</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                        {loadingSessions && sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                                <Loader2 className="animate-spin" size={24} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Cargando Chats...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-2 text-center px-4">
                                <MessageSquare size={32} />
                                <span className="text-xs font-bold uppercase">No hay chats registrados</span>
                                <span className="text-[10px] text-slate-500 uppercase">Las pláticas de WhatsApp aparecerán aquí</span>
                            </div>
                        ) : (
                            sessions.map(s => {
                                const isIA = s.state.endsWith('_IA') || s.state === 'START';
                                const isSelected = selectedSession?.phone === s.phone;
                                return (
                                    <button
                                        key={s.phone}
                                        onClick={() => handleSelectSession(s)}
                                        className={`w-full text-left p-4 hover:bg-slate-900/60 transition-all flex items-center justify-between gap-3 ${isSelected ? 'bg-slate-900 border-l-4 border-orange-500' : ''}`}
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-xs text-slate-200 truncate">{getChatName(s)}</p>
                                            <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1">{s.phone}</p>
                                        </div>
                                        <div>
                                            {isIA ? (
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-black tracking-widest uppercase rounded border border-blue-500/20 flex items-center gap-1">
                                                    <Bot size={8} /> IA
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[8px] font-black tracking-widest uppercase rounded border border-orange-500/20 flex items-center gap-1">
                                                    <User size={8} /> Humano
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. Ventana de Conversación Central */}
                <div className={`flex-1 flex flex-col bg-slate-900/40 relative ${viewMode === 'list' ? 'hidden md:flex' : 'flex'}`}>
                    {selectedSession ? (
                        <>
                            {/* Cabecera del Chat */}
                            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className="p-1.5 md:hidden text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800"
                                    >
                                        <ArrowLeft size={14} />
                                    </button>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-100">{getChatName(selectedSession)}</h4>
                                        <p className="text-[9px] font-bold text-slate-500 tracking-widest mt-0.5 uppercase">{selectedSession.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Alternancia de Estado */}
                                    <button
                                        onClick={handleToggleState}
                                        disabled={togglingState}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${
                                            selectedSession.state.endsWith('_IA') || selectedSession.state === 'START'
                                                ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                                : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20"
                                        }`}
                                    >
                                        {togglingState ? (
                                            <Loader2 className="animate-spin" size={10} />
                                        ) : selectedSession.state.endsWith('_IA') || selectedSession.state === 'START' ? (
                                            <>
                                                <Bot size={10} /> MODO IA (ACTIVO)
                                            </>
                                        ) : (
                                            <>
                                                <User size={10} /> INTERVENIDO (MUTE)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Contenedor de Burbujas */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {loadingMessages && messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                                        <Loader2 className="animate-spin" size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Cargando historial...</span>
                                    </div>
                                ) : (
                                    messages.map((m, idx) => {
                                        const isMe = m.sender === 'admin';
                                        const isAI = m.sender === 'assistant';
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`flex flex-col max-w-[80%] ${
                                                    isMe ? 'ml-auto items-end' : isAI ? 'mr-auto items-start' : 'mr-auto items-start'
                                                }`}
                                            >
                                                {/* Etiqueta del remitente */}
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">
                                                    {isMe ? 'Tú (Admin)' : isAI ? 'Mariana (IA)' : 'Cliente'}
                                                </span>
                                                {/* Burbuja física */}
                                                <div 
                                                    className={`px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                                                        isMe 
                                                            ? 'bg-orange-500 text-white rounded-tr-none' 
                                                            : isAI 
                                                                ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60' 
                                                                : 'bg-[#25D366]/10 text-emerald-300 rounded-tl-none border border-[#25D366]/20'
                                                    }`}
                                                >
                                                    {m.text}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Entrada de Texto */}
                            <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2 items-center flex-shrink-0">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Escribe un mensaje manual (Silenciará a la IA)..."
                                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-orange-500 focus:outline-none rounded-xl text-xs font-semibold placeholder-slate-500 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || sending}
                                    className="p-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 text-white disabled:text-slate-600 rounded-xl transition-all flex items-center justify-center flex-shrink-0"
                                >
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                            <Smartphone size={40} className="stroke-slate-700" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-600">Ningún chat seleccionado</span>
                            <span className="text-[10px] text-slate-600 uppercase">Selecciona una conversación del menú para comenzar</span>
                        </div>
                    )}
                </div>

                {/* 3. Panel de Progreso de Cita (Sidebar Derecho) - Solo Escritorio */}
                {selectedSession && (
                    <div className="hidden lg:flex w-72 bg-slate-950/40 border-l border-slate-800 flex-col flex-shrink-0 p-6 overflow-y-auto">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-6 pb-2 border-b border-slate-800 flex items-center gap-2">
                            <UserCheck size={14} /> Ficha de Registro IA
                        </h3>
                        
                        {(() => {
                            const data = getAccumulatedData(selectedSession.vehicleProblem);
                            if (!data) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-600 text-center gap-2">
                                        <AlertCircle size={24} />
                                        <p className="text-[10px] font-black uppercase">Sin registro de cita activo</p>
                                        <p className="text-[8px] text-slate-500 uppercase leading-relaxed">El cliente aún no inicia el flujo de citas interactivo.</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Nombre Completo</span>
                                        <span className="text-xs font-bold text-slate-200 mt-1 block">{data.name || 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Correo</span>
                                        <span className="text-xs font-bold text-slate-200 mt-1 block truncate">{data.email || 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Vehículo</span>
                                        <span className="text-xs font-bold text-slate-200 mt-1 block">{data.vehicle ? `${data.vehicle} ${data.year || ''}` : 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Kilometraje</span>
                                        <span className="text-xs font-bold text-slate-200 mt-1 block">{data.km ? `${data.km} KM` : 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Placas</span>
                                        <span className="text-xs font-bold text-slate-200 mt-1 block">{data.plate || 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Fecha y Hora</span>
                                        <span className="text-xs font-bold text-slate-200 mt-1 block">{data.date ? `${data.date} a las ${data.time || ''}` : 'Falta dato...'}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Falla Reportada</span>
                                        <span className="text-xs font-bold italic text-orange-400 mt-1 block leading-relaxed">"{data.problem || 'Falta registrar...'}"</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
