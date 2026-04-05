import { NextRequest, NextResponse } from 'next/server';
import { getInventoryDoc } from '@/lib/google-sheets';
import { resend } from '@/lib/resend';
import { readFileSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plate, name, email, phone, vehicle, year, km, vin, date, time, problem } = body;

    // 1. Save to Google Sheets
    const doc = await getInventoryDoc();
    let sheet = doc.sheetsByTitle["CITAS_2025"];
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: "CITAS_2025", 
        headerValues: ["Fecha_Registro", "Placa", "Nombre", "WhatsApp", "Email", "Vehiculo", "Año", "KM", "VIN", "Fecha_Cita", "Hora_Cita", "Problema", "Estatus"] 
      });
    }

    await sheet.addRow({
      Fecha_Registro: new Date().toLocaleString('es-MX'),
      Placa: plate,
      Nombre: name,
      WhatsApp: phone,
      Email: email || "N/A",
      Vehiculo: vehicle,
      Año: year,
      KM: km,
      VIN: vin || "N/A",
      Fecha_Cita: date,
      Hora_Cita: time,
      Problema: problem,
      Estatus: "Pendiente"
    });

    // 2. Send Email Notifications (Resend)
    // -------------------------------------------------------------------------
    if (process.env.RESEND_API_KEY) {
      
      // Load logo as base64 to avoid email hotlink blocking by Siteground
      let base64Logo = "";
      try {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        const logoBuffer = readFileSync(logoPath);
        base64Logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch (e) {
        console.error("Could not load logo for email", e);
      }

      const emailContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; padding: 40px 20px; background-color: #ffffff;">
            ${base64Logo ? `<img src="${base64Logo}" alt="CarMD Logo" style="max-width: 180px; height: auto;" />` : `<h1 style="color:#f16315; margin:0;">CarMD</h1>`}
          </div>
          <div style="padding: 0 40px 40px 40px; text-align: left;">
            <p style="font-size: 18px; font-weight: bold; color: #1a202c; margin-bottom: 16px;">¡Hola ${name}!</p>
            <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 24px;">
              Muchas gracias por generar una cita en <strong style="color: #f16315;">CarMD Diagnóstico Mecánico Automotriz</strong>. Nuestro equipo técnico ya ha sido notificado y en breve nos comunicaremos contigo para confirmar los detalles finales. 😊
            </p>
            
            <div style="background-color: #f7fafc; padding: 30px; border-radius: 12px; border: 1px solid #edf2f7; margin-bottom: 24px;">
              <h3 style="margin-top: 0; color: #2d3748; font-size: 14px; text-transform: uppercase; tracking: 0.05em; border-bottom: 2px solid #f16315; padding-bottom: 8px; display: inline-block; margin-bottom: 20px;">Resumen de tu Cita</h3>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #4a5568;">
                <tr><td style="padding: 6px 0; font-weight: bold; width: 35%;">Nombre:</td><td style="padding: 6px 0; color: #1a202c;">${name}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Vehículo:</td><td style="padding: 6px 0; color: #1a202c;">${vehicle} ${year}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Kilometraje:</td><td style="padding: 6px 0; color: #1a202c;">${km ? `${km} KM` : 'No especificado'}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Placa / VIN:</td><td style="padding: 6px 0; color: #1a202c;">${plate}${vin && vin !== "N/A" ? ` / ${vin}` : ""}</td></tr>
                <tr style="border-top: 1px solid #e2e8f0;"><td style="padding: 12px 0 6px 0; font-weight: bold; color: #f16315;">Fecha:</td><td style="padding: 12px 0 6px 0; font-weight: bold; color: #1a202c;">${date}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold; color: #f16315;">Hora:</td><td style="padding: 6px 0; font-weight: bold; color: #1a202c;">${time}</td></tr>
              </table>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-weight: bold; color: #2d3748; font-size: 14px; text-transform: uppercase;">Servicio solicitado:</p>
                <p style="margin: 8px 0 0 0; color: #4a5568; line-height: 1.5; font-style: italic; background-color: #ffffff; padding: 15px; border-radius: 8px; border-left: 4px solid #f16315;">"${problem}"</p>
              </div>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <p style="font-size: 15px; color: #718096; margin-bottom: 16px;">¿Necesitas agilizar la confirmación?</p>
              <a href="https://wa.me/525611904066" style="display: inline-block; background-color: #f16315; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(241, 99, 21, 0.2);">Escríbenos por WhatsApp</a>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #718096; text-align: center; border-top: 1px solid #edf2f7; padding-top: 24px; margin-top: 40px;">
              ¡Estamos aquí para ayudarte! Si tienes alguna duda o necesitas hacer algún cambio, no dudes en contactarnos. 😊<br><br>
              <strong>Atentamente,</strong><br>
              El equipo de CarMD Diagnóstico Mecánico Automotriz 🚘
            </p>
          </div>
          <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7;">
            © ${new Date().getFullYear()} CarMD. Palacio de Iturbide 233, Evolución, Cd. Nezahualcóyotl.
          </div>
        </div>
      `;

      // A. Send to Client
      if (email && email !== "N/A") {
        await resend.emails.send({
          from: 'CarMD Citas <citas@carmd.com.mx>', 
          to: email,
          subject: `Confirmación de Cita: ${vehicle} - ${date}`,
          html: emailContent,
        });
      }

      // B. Send to Admin (Detailed with Green Buttons)
      const whatsappClientText = encodeURIComponent(`Hola ${name}! 👋\n\nGracias por confiar en CarMD para el cuidado de tu vehículo.\n\n- 🚗 Vehículo: ${vehicle} ${year}\n- 📅 Fecha: ${date}\n- 🕐 Hora: ${time}\n- 🔧 Servicio: ${problem}\n\nEn breve nos comunicaremos contigo para confirmar tu cita. Si tienes alguna duda, escríbenos. 😊\n\nAtentamente, El equipo de *CarMD*`);
      const whatsappClientLink = `https://wa.me/52${phone.replace(/\D/g, '')}?text=${whatsappClientText}`;
      
      const whatsappRafaText = encodeURIComponent(`👤 *NUEVA CITA GENERADA*\n\nSe ha recibido una nueva solicitud de inspección:\n\n- 👤 *Nombre:* ${name}\n- 📞 *Teléfono:* ${phone}\n- 🚗 *Vehículo:* ${vehicle} ${year}\n- 🛞 *Kilometraje:* ${km || 'N/A'} KM\n- 📅 *Fecha:* ${date}\n- 🕐 *Hora:* ${time}\n- 🔧 *Problema:* ${problem}\n\nPor favor confirma con el cliente lo antes posible.`);
      const whatsappRafaLink = `https://wa.me/525516473084?text=${whatsappRafaText}`;

      const adminMessage = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; padding: 30px 20px; background-color: #f8fafc; border-bottom: 4px solid #10b981;">
            ${base64Logo ? `<img src="${base64Logo}" alt="CarMD Logo" style="max-width: 160px; height: auto;" />` : `<h1 style="color:#10b981; margin:0;">CarMD</h1>`}
          </div>
          <div style="padding: 30px 40px; text-align: left;">
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #dcfce7; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0; color: #166534; font-weight: bold; font-size: 16px;">🚨 NUEVA CITA REGISTRADA EN LÍNEA</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">
              Se ha generado una nueva cita desde el sistema <strong>Vision 2.0</strong>. Atiende al cliente para asegurar su visita.
            </p>
            
            <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #166534; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #dcfce7; padding-bottom: 8px; margin-bottom: 16px;">Datos del Cliente y Vehículo</h3>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #4a5568;">
                <tr><td style="padding: 6px 0; font-weight: bold; width: 35%;">Nombre:</td><td style="padding: 6px 0; color: #1a202c;">${name}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">WhatsApp:</td><td style="padding: 6px 0;"><a href="https://wa.me/52${phone.replace(/\D/g, '')}" style="color: #10b981; text-decoration: none;">${phone}</a></td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td style="padding: 6px 0; color: #1a202c;">${email || 'N/A'}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Vehículo:</td><td style="padding: 6px 0; color: #1a202c;">${vehicle} ${year}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Kilometraje:</td><td style="padding: 6px 0; color: #1a202c;">${km || 'No provisto'} KM</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Placa/VIN:</td><td style="padding: 6px 0; color: #1a202c;">${plate} ${vin && vin !== "N/A" ? `/ ${vin}` : ""}</td></tr>
                <tr style="border-top: 1px solid #f1f5f9;"><td style="padding: 12px 0 6px 0; font-weight: bold; color: #10b981;">Fecha Cita:</td><td style="padding: 12px 0 6px 0; font-weight: bold; color: #1a202c;">${date}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold; color: #10b981;">Hora Cita:</td><td style="padding: 6px 0; font-weight: bold; color: #1a202c;">${time}</td></tr>
              </table>

              <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
                <p style="margin: 0; font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase;">Diagnóstico/Motivo:</p>
                <p style="margin: 8px 0 0 0; color: #334155; line-height: 1.5;">"${problem}"</p>
              </div>
            </div>

            <div style="margin-top: 32px; text-align: center;">
              <a href="${whatsappClientLink}" style="display: block; background-color: #25D366; color: white; padding: 16px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(37, 211, 102, 0.2);">📲 Notificar CLIENTE</a>
              <a href="${whatsappRafaLink}" style="display: block; border: 2px solid #25D366; color: #25D366; padding: 14px; text-decoration: none; border-radius: 8px; font-weight: bold;">📲 Notificar a RAFAEL</a>
            </div>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'Sistema CarMD <citas@carmd.com.mx>',
        to: ['contacto@carmd.com.mx', 'car.md.mx@hotmail.com'],
        subject: `Nueva cita generada | CarMD`,
        html: adminMessage,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reserving appointment:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
