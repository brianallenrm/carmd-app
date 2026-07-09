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
    Smartphone,
    UserCheck,
    RefreshCw,
    Plus,
    Minus,
    Type,
    Bold,
    Italic,
    Sparkles,
    ArrowDown
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
    const [viewMode, setViewMode] = useState<'list' | 'chat'>('list'); // Responsivo
    const [completedBooking, setCompletedBooking] = useState<any | null>(null);
    
    // Control de Notificación de Mensajes Nuevos y Scroll
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);

    // Configuración de tamaño de letra (accesibilidad)
    const fontSizeClasses = ['text-[11px]', 'text-xs', 'text-sm', 'text-base', 'text-lg'];
    const [fontSizeIndex, setFontSizeIndex] = useState(2); // Inicia en text-sm (14px)

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    const fetchHistory = async (phone: string, isSilentUpdate = false) => {
        if (!isSilentUpdate) setLoadingMessages(true);
        try {
            const res = await fetch(`/api/chats/${phone}/history`);
            const data = await res.json();
            const newMessages: ChatMessage[] = data.messages || [];

            setMessages(prev => {
                // Si la longitud cambió o hay mensajes nuevos
                if (newMessages.length > prev.length) {
                    // Si el usuario no está al final del scroll, activamos el aviso de mensajes nuevos
                    if (!isAtBottom && isSilentUpdate) {
                        setHasNewMessages(true);
                    }
                    return newMessages;
                }
                return prev;
            });
        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            if (!isSilentUpdate) setLoadingMessages(false);
        }
    };

    // Cargar reserva definitiva en caso de estado COMPLETED
    const fetchCompletedBooking = async (phone: string) => {
        try {
            const res = await fetch(`/api/chats/${phone}/booking`);
            const data = await res.json();
            setCompletedBooking(data.cita || null);
        } catch (e) {
            console.error("Error fetching completed booking:", e);
            setCompletedBooking(null);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 15000); // Auto-update list
        return () => clearInterval(interval);
    }, []);

    // Polling inteligente de mensajes
    useEffect(() => {
        if (selectedSession) {
            setCompletedBooking(null);
            setHasNewMessages(false);
            
            // Primera carga: sí queremos loading spinner
            fetchHistory(selectedSession.phone, false).then(() => {
                // Hacer scroll al fondo en la primera carga del chat
                setTimeout(scrollToBottomDirect, 100);
            });
            
            if (selectedSession.state === 'COMPLETED') {
                fetchCompletedBooking(selectedSession.phone);
            }

            const interval = setInterval(() => {
                // Cargas en segundo plano: silenciosas (isSilentUpdate = true)
                fetchHistory(selectedSession.phone, true);
                if (selectedSession.state === 'COMPLETED') {
                    fetchCompletedBooking(selectedSession.phone);
                }
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedSession]);

    // Escuchar scroll del contenedor para saber si el usuario está leyendo arriba
    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Tolerancia de 80px del fondo
        const threshold = 80;
        const currentIsAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
        
        setIsAtBottom(currentIsAtBottom);
        if (currentIsAtBottom) {
            setHasNewMessages(false); // Si ya bajó, quitamos el aviso
        }
    };

    const scrollToBottomDirect = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setHasNewMessages(false);
        setIsAtBottom(true);
    };

    const handleSelectSession = (session: ChatSession) => {
        setSelectedSession(session);
        setViewMode('chat');
    };

    // Enviar un mensaje manual
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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
                const newMsg: ChatMessage = {
                    phone: selectedSession.phone,
                    sender: 'admin',
                    text: textToSend,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, newMsg]);
                setSelectedSession(prev => prev ? { ...prev, state: 'HUMAN_REQUIRED' } : null);
                setSessions(prev => prev.map(s => s.phone === selectedSession.phone ? { ...s, state: 'HUMAN_REQUIRED' } : s));
                
                // Forzar scroll al final porque el administrador mandó el mensaje
                setTimeout(scrollToBottomDirect, 50);
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

    // Parsear el JSON temporal de la cita
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

    // Formateadores rápidos de WhatsApp
    const insertFormatting = (wrapper: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        
        const replacement = `${wrapper}${selected}${wrapper}`;
        setInputText(text.substring(0, start) + replacement + text.substring(end));
        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + wrapper.length, start + wrapper.length + selected.length);
        }, 50);
    };

    // Controles de accesibilidad (tamaño de fuente)
    const zoomIn = () => {
        if (fontSizeIndex < fontSizeClasses.length - 1) {
            setFontSizeIndex(prev => prev + 1);
        }
    };

    const zoomOut = () => {
        if (fontSizeIndex > 0) {
            setFontSizeIndex(prev => prev - 1);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
            {/* Header General */}
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <Link href="/os/centrodecontrol" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-sm font-black tracking-widest uppercase text-[#f16315]">Chats de WhatsApp</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Monitoreo de Asistente Virtual</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Botones de tamaño de letra */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
                        <button onClick={zoomOut} className="p-1.5 hover:bg-white hover:text-slate-800 text-slate-400 rounded-lg transition-all" title="Reducir letra">
                            <Minus size={13} />
                        </button>
                        <span className="text-[9px] font-black text-slate-400 px-1 select-none flex items-center gap-1 uppercase">
                            <Type size={11} /> Letra
                        </span>
                        <button onClick={zoomIn} className="p-1.5 hover:bg-white hover:text-slate-800 text-slate-400 rounded-lg transition-all" title="Aumentar letra">
                            <Plus size={13} />
                        </button>
                    </div>

                    <button 
                        onClick={fetchSessions}
                        className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
                    >
                        <RefreshCw size={14} className={loadingSessions ? "animate-spin" : ""} />
                    </button>
                    <span className="hidden md:inline-flex px-3 py-1.5 bg-[#25D366]/10 text-[#25d366] text-[10px] font-black tracking-widest uppercase rounded-full border border-[#25D366]/20">
                        Conectado
                    </span>
                </div>
            </header>

            {/* Panel Principal */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* 1. Lista de Chats (Sidebar Izquierdo) */}
                <div className={`w-full md:w-80 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 ${viewMode === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-100/80 bg-slate-50/50">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Conversaciones Activas</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {loadingSessions && sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <Loader2 className="animate-spin text-[#f16315]" size={24} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Cargando Chats...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2 text-center px-4">
                                <MessageSquare size={32} className="stroke-slate-300" />
                                <span className="text-xs font-bold uppercase text-slate-500">No hay chats registrados</span>
                                <span className="text-[10px] text-slate-400 uppercase">Las pláticas de WhatsApp aparecerán aquí</span>
                            </div>
                        ) : (
                            sessions.map(s => {
                                const isIA = s.state.endsWith('_IA') || s.state === 'START';
                                const isSelected = selectedSession?.phone === s.phone;
                                return (
                                    <button
                                        key={s.phone}
                                        onClick={() => handleSelectSession(s)}
                                        className={`w-full text-left p-4 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3 ${isSelected ? 'bg-orange-50/40 border-l-4 border-[#f16315]' : ''}`}
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-xs text-slate-800 truncate">{getChatName(s)}</p>
                                            <p className="text-[9px] font-black text-slate-400 tracking-wider mt-1">{s.phone}</p>
                                        </div>
                                        <div>
                                            {isIA ? (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black tracking-widest uppercase rounded border border-blue-150 flex items-center gap-1">
                                                    <Bot size={8} /> IA
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-orange-50 text-[#f16315] text-[8px] font-black tracking-widest uppercase rounded border border-orange-100 flex items-center gap-1">
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
                <div className={`flex-1 flex flex-col bg-slate-50/30 relative ${viewMode === 'list' ? 'hidden md:flex' : 'flex'}`}>
                    {selectedSession ? (
                        <>
                            {/* Cabecera del Chat */}
                            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 z-10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className="p-1.5 md:hidden text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                                    >
                                        <ArrowLeft size={14} />
                                    </button>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-800">{getChatName(selectedSession)}</h4>
                                        <p className="text-[9px] font-black text-slate-400 tracking-wider mt-0.5 uppercase">{selectedSession.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleToggleState}
                                        disabled={togglingState}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${
                                            selectedSession.state.endsWith('_IA') || selectedSession.state === 'START'
                                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250"
                                                : "bg-orange-50 hover:bg-orange-100 text-[#f16315] border border-orange-150"
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
                            <div 
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto p-6 space-y-4 relative"
                            >
                                {loadingMessages && messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                        <Loader2 className="animate-spin text-[#f16315]" size={24} />
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
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
                                                    {isMe ? 'Tú (Admin)' : isAI ? 'Mariana (IA)' : 'Cliente'}
                                                </span>
                                                <div 
                                                    className={`px-4 py-3 rounded-2xl ${fontSizeClasses[fontSizeIndex]} font-bold leading-relaxed whitespace-pre-wrap ${
                                                        isMe 
                                                            ? 'bg-[#f16315] text-white rounded-tr-none shadow-md shadow-orange-500/10' 
                                                            : isAI 
                                                                ? 'bg-white text-slate-700 rounded-tl-none border border-slate-200/80 shadow-sm' 
                                                                : 'bg-emerald-50 text-emerald-800 rounded-tl-none border border-emerald-100 shadow-sm'
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

                            {/* Alerta flotante de mensajes nuevos arriba del campo de texto */}
                            {hasNewMessages && (
                                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20">
                                    <button 
                                        onClick={scrollToBottomDirect}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#f16315] hover:bg-orange-600 text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg transition-all animate-bounce border border-white/20"
                                    >
                                        <ArrowDown size={12} /> Mensajes nuevos ↓
                                    </button>
                                </div>
                            )}

                            {/* Área de Entrada enriquecida de Texto */}
                            <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2 flex-shrink-0 shadow-lg z-10">
                                {/* Toolbar de formato WhatsApp */}
                                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
                                    <button 
                                        type="button" 
                                        onClick={() => insertFormatting('*')}
                                        className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded-lg transition-all"
                                        title="Negrita (*)"
                                    >
                                        <Bold size={13} />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => insertFormatting('_')}
                                        className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded-lg transition-all"
                                        title="Cursiva (_)"
                                    >
                                        <Italic size={13} />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => insertFormatting('~')}
                                        className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded-lg transition-all"
                                        title="Tachado (~)"
                                    >
                                        <span className="text-[11px] font-black line-through">ab</span>
                                    </button>
                                    <div className="h-4 w-px bg-slate-200 mx-1" />
                                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                        <Sparkles size={9} /> Corrector activo
                                    </span>
                                </div>

                                <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 items-end">
                                    <textarea
                                        ref={textareaRef}
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        placeholder="Escribe un mensaje manual (Silenciará a la IA)..."
                                        rows={1}
                                        autoCorrect="on"
                                        spellCheck={true}
                                        autoCapitalize="sentences"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 focus:border-[#f16315] focus:bg-white focus:outline-none rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 transition-all resize-none max-h-32 min-h-[38px] leading-relaxed"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputText.trim() || sending}
                                        className="p-2.5 bg-[#f16315] hover:bg-orange-600 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl transition-all flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/10"
                                    >
                                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <Smartphone size={40} className="stroke-slate-200" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ningún chat seleccionado</span>
                            <span className="text-[10px] text-slate-400 uppercase">Selecciona una conversación del menú para comenzar</span>
                        </div>
                    )}
                </div>

                {/* 3. Panel de Cita (Sidebar Derecho) - Solo Escritorio */}
                {selectedSession && (
                    <div className="hidden lg:flex w-72 bg-white border-l border-slate-100 flex-col flex-shrink-0 p-6 overflow-y-auto">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-6 pb-2 border-b border-slate-100 flex items-center gap-2">
                            <UserCheck size={14} className="text-[#f16315]" /> Ficha de Registro IA
                        </h3>
                        
                        {(() => {
                            const isCompleted = selectedSession.state === 'COMPLETED';
                            const data = isCompleted ? completedBooking : getAccumulatedData(selectedSession.vehicleProblem);
                            
                            if (!data) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center gap-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <AlertCircle size={24} className="stroke-slate-350" />
                                        <p className="text-[10px] font-black uppercase text-slate-500">Sin registro activo</p>
                                        <p className="text-[8px] text-slate-450 uppercase leading-relaxed px-4">El cliente aún no inicia el flujo de citas interactivo.</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-4">
                                    {isCompleted && (
                                        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[8px] font-black tracking-widest uppercase rounded border border-emerald-150 text-center mb-2">
                                            Cita Agendada Exitosamente
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nombre Completo</span>
                                        <span className="text-xs font-bold text-slate-800 mt-1 block">{data.name || 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Correo</span>
                                        <span className="text-xs font-bold text-slate-800 mt-1 block truncate">{data.email || 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Vehículo</span>
                                        <span className="text-xs font-bold text-slate-800 mt-1 block">{data.vehicle ? `${data.vehicle} ${data.year && data.year !== 'N/A' ? data.year : ''}` : 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Kilometraje</span>
                                        <span className="text-xs font-bold text-slate-800 mt-1 block">{data.km ? `${data.km} KM` : 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Placas</span>
                                        <span className="text-xs font-bold text-slate-800 mt-1 block">{data.plate || 'Falta dato...'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha y Hora</span>
                                        <span className="text-xs font-bold text-slate-800 mt-1 block">{data.date ? `${data.date} a las ${data.time || ''}` : 'Falta dato...'}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Falla Reportada</span>
                                        <span className="text-xs font-bold italic text-[#f16315] mt-1.5 block leading-relaxed bg-orange-50/50 p-3 rounded-xl border border-orange-100/50">"{data.problem || 'Falta registrar...'}"</span>
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
