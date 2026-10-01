const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const artifactDir = '/Users/BrianAllen/.gemini/antigravity/brain/5bd55497-5481-4500-ab55-f3372b42661f';
const uploadedDir = path.join(artifactDir, '.user_uploaded');
const publicDir = path.join(__dirname, '../public');

// 1. Read and base64 encode all 5 real screenshots
function getBase64Image(filename) {
    const filePath = path.join(uploadedDir, filename);
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${data.toString('base64')}`;
}

const imgPisoFeed = getBase64Image('media_1790803752886.png');
const imgMecanicos = getBase64Image('media_1790803752884.png');
const imgFases = getBase64Image('media_1790803752883.png');
const imgRefacciones = getBase64Image('media_1790803752880.jpg');
const imgDesglose = getBase64Image('media_1790803752881.png');

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual Visual de Control de Piso - CarMD (Alejandra)</title>
  <style>
    @page {
      size: letter portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.4;
      font-size: 12.5px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .page {
      page-break-after: always;
      position: relative;
      height: 980px;
      max-height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .page:last-child {
      page-break-after: avoid;
    }

    .page-content {
      flex: 1;
    }

    /* Header Bar */
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #f16315;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-badge {
      background: #f16315;
      color: white;
      font-size: 10px;
      font-weight: 900;
      padding: 3px 7px;
      border-radius: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .brand-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
    }
    .doc-meta {
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Main Titles */
    h1 {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 3px;
      line-height: 1.2;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 10px;
      font-weight: 500;
    }

    /* Callout Note */
    .important-banner {
      background: #fff7ed;
      border-left: 4px solid #f16315;
      border-radius: 0 8px 8px 0;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .important-banner .icon {
      font-size: 16px;
      line-height: 1;
    }
    .important-banner p {
      font-size: 11.5px;
      color: #9a3412;
      line-height: 1.35;
    }
    .important-banner strong {
      color: #c2410c;
    }

    /* Step Sections */
    .step-section {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .phone-frame {
      width: 140px;
      flex-shrink: 0;
      background: #0f172a;
      border-radius: 16px;
      padding: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1.5px solid #334155;
    }
    .phone-screen {
      width: 100%;
      border-radius: 12px;
      display: block;
      overflow: hidden;
    }

    .step-content {
      flex: 1;
    }

    .step-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #0f172a;
      color: white;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .step-badge.orange { background: #f16315; }
    .step-badge.green { background: #10b981; }
    .step-badge.blue { background: #2563eb; }

    .step-title {
      font-size: 14.5px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      line-height: 1.25;
    }

    /* Bullet cards */
    .bullet-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
    }
    .bullet-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 11.5px;
      line-height: 1.35;
      color: #334155;
    }
    .bullet-item strong {
      color: #0f172a;
      font-weight: 700;
    }
    .bullet-item .tag {
      display: inline-block;
      background: #fed7aa;
      color: #9a3412;
      font-size: 9.5px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
      margin-right: 3px;
    }

    /* Phase table */
    .phase-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-top: 4px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .phase-table th, .phase-table td {
      padding: 3.5px 6px;
      border-bottom: 1px solid #f1f5f9;
      text-align: left;
    }
    .phase-table th {
      background: #f1f5f9;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      font-size: 9.5px;
    }
    .phase-table tr:last-child td {
      border-bottom: none;
    }

    /* Pocket Accordion (Rules) */
    .rules-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 14px;
      border: 1px solid #334155;
    }
    .rules-card h3 {
      font-size: 14px;
      font-weight: 900;
      color: #fed7aa;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rules-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    .rule-box {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 12px;
    }
    .rule-num {
      font-size: 22px;
      font-weight: 900;
      color: #f16315;
      line-height: 1;
      margin-bottom: 4px;
    }
    .rule-title {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .rule-desc {
      font-size: 11px;
      color: #cbd5e1;
      line-height: 1.35;
    }

    .footer-bar {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #94a3b8;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <!-- ==================== PÁGINA 1: PORTADA Y PASO 1 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="header-bar">
        <div class="brand-title">
          <span class="brand-badge">CarMD OS</span>
          <span class="brand-name">Taller en Operación</span>
        </div>
        <div class="doc-meta">Control de Piso • Manual para Alejandra</div>
      </div>

      <h1>Guía Visual de Control de Piso (/os/piso)</h1>
      <div class="subtitle">Manual ilustrado con pantalla real para la operación diaria en taller desde el celular.</div>

      <div class="important-banner">
        <div class="icon">💡</div>
        <div>
          <p><strong>Tu función principal en el taller:</strong> Eres el enlace del taller físico con el sistema. <strong>Tú no tienes que hacer notas ni cobrar.</strong> Tu trabajo es mantener la rampa actualizada (asignar mecánicos, mover etapas y tomarle foto a los tickets). Con eso, Administración puede generar notas en 1 segundo sin errores.</p>
        </div>
      </div>

      <!-- PASO 1 -->
      <div class="step-section">
        <div class="phone-frame" style="width: 175px;">
          <img class="phone-screen" src="${imgPisoFeed}" alt="Pantalla Principal">
        </div>
        <div class="step-content">
          <span class="step-badge orange">Paso 1</span>
          <h2 class="step-title">La Pantalla Principal (/os/piso)</h2>
          <p style="font-size: 11.5px; color: #475569; margin-bottom: 6px;">Al entrar en tu celular, verás el tablero en vivo con todos los autos que están hoy en CarMD.</p>

          <div class="bullet-list">
            <div class="bullet-item">
              <span class="tag">Pestaña</span> <strong>SOLO EN TALLER:</strong> Te muestra el número exacto de autos que están físicamente en rampa o patio hoy (en la foto: 7 autos).
            </div>
            <div class="bullet-item">
              <span class="tag">Tarjetas</span> <strong>Identificación al instante:</strong>
              <br>• <strong>Modelo y Año grandes:</strong> (ej. <em>Jeep Grand Cherokee 2014</em>, <em>Mazda 3 2011</em>).
              <br>• <strong>Placas:</strong> Para no confundir coches del mismo modelo.
              <br>• <strong>Cliente y Motivo:</strong> Por qué vino (ej. <em>inspección y diagnóstico</em>).
              <br>• <strong>Gasolina, KM y Hora:</strong> Datos registrados a su llegada.
            </div>
            <div class="bullet-item">
              <span class="tag">Botón Naranja</span> <strong>[ 🔧 Ver Ficha ]:</strong> Da un toque aquí para entrar a asignarle mecánicos, mover su fase o cargar refacciones.
            </div>
            <div class="bullet-item">
              <span class="tag">Botón [ ⋮ ]</span> <strong>Cambio Rápido:</strong> Si tienes prisa, puedes cambiar el estatus del auto desde afuera sin entrar a la ficha.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>CarMD • Manual Operativo Interno</span>
      <span>Página 1 de 4</span>
    </div>
  </div>

  <!-- ==================== PÁGINA 2: PASO 2 Y PASO 3 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="header-bar">
        <div class="brand-title">
          <span class="brand-badge">CarMD OS</span>
          <span class="brand-name">Ficha del Auto</span>
        </div>
        <div class="doc-meta">Mecánicos y Etapas del Servicio</div>
      </div>

      <!-- PASO 2 -->
      <div class="step-section">
        <div class="phone-frame">
          <img class="phone-screen" src="${imgMecanicos}" alt="Asignar Mecánicos">
        </div>
        <div class="step-content">
          <span class="step-badge orange">Paso 2</span>
          <h2 class="step-title">Asignar a los Mecánicos Responsables</h2>
          <p style="font-size: 11.5px; color: #475569; margin-bottom: 4px;">Al tocar <strong>"Ver Ficha"</strong>, verás los datos del cliente y los botones con los nombres del equipo de mecánicos.</p>

          <div class="bullet-list">
            <div class="bullet-item">
              <strong>¿Cómo asignarlos?</strong> Solo da un toque sobre el nombre del mecánico que va a trabajar el auto (ej: <strong>Jesús</strong>, <strong>Israel</strong>).
              <br>El botón se pondrá en color naranja con una palomita <span style="color:#f16315; font-weight:800;">✓</span>.
            </div>
            <div class="bullet-item">
              <strong>¿Trabajan en pareja?</strong> Puedes seleccionar 2 o más mecánicos (en la foto: <em>Jesús + Israel</em>).
            </div>
            <div class="bullet-item">
              <strong>Botón [+ Otro]:</strong> Si apoya un técnico externo o nuevo que no esté en la barra rápida.
            </div>
          </div>
        </div>
      </div>

      <!-- PASO 3 -->
      <div class="step-section">
        <div class="phone-frame">
          <img class="phone-screen" src="${imgFases}" alt="Fases del Car Tracker">
        </div>
        <div class="step-content">
          <span class="step-badge orange">Paso 3</span>
          <h2 class="step-title">Avanzar la Etapa del Auto (Car Tracker)</h2>
          <p style="font-size: 11px; color: #475569; margin-bottom: 3px;">Conforme los muchachos avanzan en el auto, tú solo das un toque en la etapa que corresponda:</p>

          <table class="phase-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Etapa</th>
                <th>¿Cuándo se marca?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1</strong></td>
                <td>🔍 <strong>Diagnóstico</strong></td>
                <td>Apenas llegó el coche y lo están revisando para cotizar.</td>
              </tr>
              <tr>
                <td><strong>2</strong></td>
                <td>📦 <strong>Esperando Refacciones</strong></td>
                <td>Presupuesto aceptado; esperando que el proveedor traiga piezas.</td>
              </tr>
              <tr>
                <td><strong>3</strong></td>
                <td>🔧 <strong>En Rampa / Trabajo</strong></td>
                <td>Mecánicos desarmando, reparando o montando en rampa.</td>
              </tr>
              <tr>
                <td><strong>4</strong></td>
                <td>⚙️ <strong>En rectificación</strong></td>
                <td>Discos, tambores o piezas mandadas al torno.</td>
              </tr>
              <tr>
                <td><strong>5</strong></td>
                <td>🧪 <strong>Pruebas / Calidad</strong></td>
                <td>Reparación terminada; salieron a probarlo a la calle.</td>
              </tr>
              <tr>
                <td><strong>6</strong></td>
                <td>🧼 <strong>En Lavado y Detallado</strong></td>
                <td>Mecánica lista; auto en estética y limpieza.</td>
              </tr>
              <tr>
                <td><strong>7</strong></td>
                <td>🏁 <strong>Listo para Entrega</strong></td>
                <td>Limpio y 100% terminado para que el cliente pase por él.</td>
              </tr>
            </tbody>
          </table>

          <div class="bullet-item" style="margin-top: 6px; background: #eff6ff; border-color: #bfdbfe; color: #1e40af; font-size: 11px;">
            <strong>¿Y la etapa 8 "✅ Entregado"?</strong> ¡No la toques tú! Cuando Administración le genere su nota de salida al cliente, <strong>el sistema la cambia a Entregado en automático</strong>.
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>CarMD • Manual Operativo Interno</span>
      <span>Página 2 de 4</span>
    </div>
  </div>

  <!-- ==================== PÁGINA 3: PASO 4 Y PASO 5 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="header-bar">
        <div class="brand-title">
          <span class="brand-badge">CarMD OS</span>
          <span class="brand-name">Refacciones y Tickets</span>
        </div>
        <div class="doc-meta">Escaneo con IA y Desglose Inteligente</div>
      </div>

      <!-- PASO 4 -->
      <div class="step-section">
        <div class="phone-frame">
          <img class="phone-screen" src="${imgRefacciones}" alt="Subir Ticket con Cámara">
        </div>
        <div class="step-content">
          <span class="step-badge green">Paso 4</span>
          <h2 class="step-title">Subir Tickets con la Cámara (¡IA en 3 seg!)</h2>
          <p style="font-size: 11.5px; color: #475569; margin-bottom: 4px;">Cada vez que el repartidor o un mecánico traiga un comprobante físico:</p>

          <div class="bullet-list">
            <div class="bullet-item">
              <strong>1.</strong> Entra a la pestaña <strong>"Refacciones"</strong> (o <strong>"Rectif."</strong> si es de torno).
            </div>
            <div class="bullet-item">
              <strong>2.</strong> Toca el botón naranja <strong>"+ Agregar refacción"</strong>.
            </div>
            <div class="bullet-item">
              <strong>3.</strong> Toca el botón amarillo de la cámara: <strong>[ 📷 Tomar Foto ]</strong>.
            </div>
            <div class="bullet-item">
              <strong>4.</strong> Apunta al ticket con tu celular y toma la foto clarita.
              <br><strong>¡La Inteligencia Artificial hace la magia!:</strong>
              <br>• Escribe el Proveedor (ej. <em>AutoZone</em>, <em>California</em>, <em>Rolcar</em>).
              <br>• Escribe la refacción en la Descripción.
              <br>• Pone el Costo exacto pagado en pesos.
              <br>• Vincula la foto del ticket para cualquier duda o garantía futura.
            </div>
            <div class="bullet-item">
              <strong>5.</strong> Revisa que los números se vean bien y pulsa <strong>"Guardar Pieza"</strong>.
            </div>
          </div>
        </div>
      </div>

      <!-- PASO 5 -->
      <div class="step-section">
        <div class="phone-frame">
          <img class="phone-screen" src="${imgDesglose}" alt="Desglose de Ticket">
        </div>
        <div class="step-content">
          <span class="step-badge orange">Paso 5</span>
          <h2 class="step-title">¿Y si el ticket trae VARIAS compras?</h2>
          <p style="font-size: 11.5px; color: #475569; margin-bottom: 4px;">Si el ticket trae 2 o más partidas (ej. piezas de dos coches, o un refresco / compra personal), se abre esta ventanita:</p>

          <div class="bullet-list">
            <div class="bullet-item">
              <strong>1. Desmarca lo que NO sea del auto:</strong> Solo toca la casilla azul para desmarcarla. El total se descuenta solo y esa pieza no se le cargará al cliente.
            </div>
            <div class="bullet-item">
              <strong>2. Clic al botón verde:</strong> Toca <strong>[ ✓ CARGAR PARTIDAS INDIVIDUALES ]</strong>. Se crean las partidas por separado con su costo exacto y ambas comparten la misma foto del comprobante.
            </div>
            <div class="bullet-item">
              <strong>Tip Girar 90°:</strong> Si la foto del ticket salió de lado, tócala para abrirla en grande y usa el botón <strong>"Girar 90°"</strong> para rotarla y leerla derechita.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>CarMD • Manual Operativo Interno</span>
      <span>Página 3 de 4</span>
    </div>
  </div>

  <!-- ==================== PÁGINA 4: BITÁCORA Y REGLAS DE ORO ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="header-bar">
        <div class="brand-title">
          <span class="brand-badge">CarMD OS</span>
          <span class="brand-name">Bitácora y Casos Especiales</span>
        </div>
        <div class="doc-meta">Notas del Día y Reglas de Oro</div>
      </div>

      <div style="margin-bottom: 14px;">
        <span class="step-badge blue">Paso 6</span>
        <h2 class="step-title" style="font-size: 16px; margin-bottom: 6px;">La Bitácora del Auto (Tus notas rápidas)</h2>
        <p style="font-size: 12px; color: #475569; margin-bottom: 8px;">En la pestaña <strong>"Bitácora"</strong> dentro de la Ficha, escribe cualquier recado importante que deba saber el taller con fecha y hora:</p>

        <div class="bullet-list">
          <div class="bullet-item">
            <strong>Llamadas con clientes:</strong> <em>"Cliente autorizó por teléfono a las 11:30 am cambiar también la banda."</em>
          </div>
          <div class="bullet-item">
            <strong>Horas de proveedores:</strong> <em>"California confirmó que las balatas llegan a las 2:30 pm con el repartidor."</em>
          </div>
          <div class="bullet-item">
            <strong>Detalles del coche:</strong> <em>"Se le avisó al cliente que su llanta de refacción no trae aire para próxima visita."</em>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 14px;">
        <h2 class="step-title" style="font-size: 15px; margin-bottom: 6px;">Casos Especiales de Salida (Sin Nota)</h2>
        <div class="bullet-list">
          <div class="bullet-item">
            <strong>📋 Diagnóstico sin nota:</strong> Si la unidad solo vino a revisión técnica o diagnóstico inicial sin generar nota de cobro en taller.
          </div>
          <div class="bullet-item">
            <strong>🛠️ Garantía / Mantenimiento Preventivo:</strong> Si el auto vino por una revisión de cortesía o ajuste sin cobro, márcalo así para que salga de la rampa activa sin exigir nota.
          </div>
          <div class="bullet-item">
            <strong>🚪 Salida sin reparación:</strong> Si el cliente no autorizó el presupuesto y se retira con su coche.
          </div>
        </div>
      </div>

      <!-- REGLAS DE ORO EN GRANDE -->
      <div class="rules-card">
        <h3>⭐ El Acordeón de Alejandra (Resumen en 3 Reglas de Oro)</h3>
        <div class="rules-grid">
          <div class="rule-box">
            <div class="rule-num">1</div>
            <div class="rule-title">Auto que llega</div>
            <div class="rule-desc">Abres su ficha y tocas el nombre de los mecánicos asignados (Jesús, Israel, etc.).</div>
          </div>
          <div class="rule-box">
            <div class="rule-num">2</div>
            <div class="rule-title">Auto en rampa</div>
            <div class="rule-desc">Vas actualizando su fase con un tap (esperando piezas, en rampa, calidad, lavado).</div>
          </div>
          <div class="rule-box">
            <div class="rule-num">3</div>
            <div class="rule-title">Ticket que llega</div>
            <div class="rule-desc">Le tomas foto desde Refacciones para que la IA capture el gasto y proveedor sola.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>CarMD • Manual Operativo Interno</span>
      <span>Página 4 de 4</span>
    </div>
  </div>

</body>
</html>
`;

// Save HTML to public and artifacts directory
const publicHtmlPath = path.join(publicDir, 'guia-alejandra.html');
const artifactHtmlPath = path.join(artifactDir, 'guia_control_de_piso_alejandra.html');
fs.writeFileSync(publicHtmlPath, htmlContent);
fs.writeFileSync(artifactHtmlPath, htmlContent);
console.log('HTML files created successfully!');

// Generate PDF using Google Chrome via Puppeteer
async function generatePdf() {
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(artifactDir, 'Manual_Control_de_Piso_Alejandra_CarMD.pdf');
    const publicPdfPath = path.join(publicDir, 'Manual_Control_de_Piso_Alejandra_CarMD.pdf');

    await page.pdf({
        path: pdfPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' }
    });

    fs.copyFileSync(pdfPath, publicPdfPath);
    await browser.close();

    console.log('PDF generated successfully at:', pdfPath);
    console.log('Public PDF copied to:', publicPdfPath);
}

generatePdf().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
});
