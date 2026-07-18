import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  // Securing the cron endpoint using Vercel's authorization header (if CRON_SECRET is configured)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const message = `🔔 Recordatorio del Sistema: Para poder recibir estas notificaciones administrativas, recuerda que debes mantener activa la conversación con Mariana enviando un mensaje al menos cada 24 horas. Si la sesión muere, dejarás de recibirlas temporalmente.`;
  
  console.log("[Cron] Sending WhatsApp 24h window reminder to admin...");
  const result = await sendWhatsAppMessage('5547015312', message);
  
  return NextResponse.json({ success: true, result });
}
