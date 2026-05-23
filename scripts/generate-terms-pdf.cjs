const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.resolve(__dirname, '..', 'public', 'legal', 'terminos-fizzia.pdf');

const legalLastUpdated = '22 de mayo de 2026';

const termsSections = [
  {
    id: 'definiciones',
    title: '1. Definiciones',
    body: [
      'Para los efectos del presente documento, se entenderá por:',
      'Fizzia: la plataforma digital operada por Fizzia.dev, dedicada a la prestación de servicios tecnológicos, diseño, desarrollo web, aplicaciones, automatizaciones, integraciones, soporte técnico y consultoría.',
      'Cliente: la persona natural o jurídica que solicita, contrata o utiliza los servicios ofrecidos a través de la plataforma Fizzia.',
      'Developer: el profesional independiente o miembro del equipo de Fizzia asignado para ejecutar las tareas técnicas del proyecto.',
      'Proyecto: el conjunto de actividades, entregables y servicios acordados entre Fizzia y el Cliente, descritos en el alcance aprobado.',
      'Plataforma: el sitio web, aplicación o sistema provisto por Fizzia para la gestión de proyectos, comunicación, pagos y seguimiento.',
      'Partes: Fizzia y el Cliente, en conjunto.',
    ],
  },
  {
    id: 'objeto',
    title: '2. Objeto del servicio',
    body: [
      'El objeto del presente documento es establecer los términos y condiciones generales bajo los cuales Fizzia presta servicios digitales a medida a sus Clientes, incluyendo diseño, desarrollo web, aplicaciones móviles y web, sistemas a medida, automatizaciones, integraciones con terceros, soporte técnico, consultoría y cualquier otro servicio afín que se ofrezca a través de la Plataforma.',
      'La solicitud de un servicio, el envío de un formulario de contacto, la creación de una cuenta o la comunicación a través de cualquier canal oficial no constituye, por sí sola, una aceptación del proyecto por parte de Fizzia. La aceptación definitiva está sujeta a la evaluación de alcance, viabilidad técnica, disponibilidad de recursos, presupuesto y aprobación expresa de las Partes.',
      'Cada proyecto se regirá por el alcance aprobado, los mensajes registrados en la Plataforma, las propuestas aceptadas, los pagos acordados y cualquier contrato específico firmado entre las Partes.',
    ],
  },
  {
    id: 'solicitud',
    title: '3. Proceso de solicitud y evaluación',
    body: [
      'El Cliente podrá solicitar un proyecto completando el formulario dispuesto en la Plataforma, enviando un mensaje a través de los canales de contacto o comunicándose directamente con el equipo de Fizzia.',
      'Una vez recibida la solicitud, Fizzia evaluará el alcance, los requerimientos, la viabilidad técnica, los materiales necesarios, los tiempos estimados y el presupuesto preliminar.',
      'Fizzia se reserva el derecho de aceptar o rechazar cualquier solicitud sin necesidad de justificación. En caso de rechazo, se comunicará al Cliente por los canales habituales.',
      'La aceptación del proyecto se formaliza mediante la aprobación del presupuesto, la firma del alcance y el pago del anticipo o primera cuota, según lo acordado entre las Partes.',
    ],
  },
  {
    id: 'alcance',
    title: '4. Alcance y entregables',
    body: [
      'El alcance del proyecto será definido y aprobado por ambas Partes antes del inicio de los trabajos. Dicho alcance incluirá las funcionalidades, pantallas, integraciones, contenidos, revisiones, entregables y fechas estimadas.',
      'Cualquier modificación, adición o cambio sustancial al alcance aprobado podrá generar una nueva cotización, extensión de los plazos o ambas. Estas modificaciones deberán ser documentadas y aprobadas por ambas Partes.',
      'Los entregables serán puestos a disposición del Cliente a través de la Plataforma, repositorios, enlaces, archivos o cualquier otro medio acordado.',
      'El Cliente dispondrá de un plazo para revisar y aprobar los entregables. Las observaciones realizadas fuera de dicho plazo podrán ser tratadas como trabajo adicional o mantenimiento.',
    ],
  },
  {
    id: 'pagos',
    title: '5. Condiciones de pago',
    body: [
      'Los pagos podrán realizarse mediante transferencia bancaria, pasarelas de pago habilitadas en la Plataforma u otros métodos expresamente aprobados por Fizzia.',
      'Los montos, plazos y condiciones de pago serán establecidos en la propuesta aprobada por el Cliente. Podrán incluir pagos únicos, parciales, recurrentes o bajo modalidad de tiempo y materiales.',
      'Todo comprobante de pago estará sujeto a verificación administrativa. Fizzia se reserva el derecho de rechazar pagos que no puedan ser validados satisfactoriamente.',
      'Los impuestos, comisiones bancarias, costos de conversión de moneda, cargos por contracargo y cualquier otro costo asociado al método de pago serán responsabilidad del Cliente, salvo acuerdo expreso en contrario.',
      'Los registros internos de pago en la Plataforma tienen fines informativos y no constituyen factura tributaria, recibo fiscal ni documento contable formal, salvo que se emita el documento correspondiente según la legislación aplicable.',
    ],
  },
  {
    id: 'propiedad-intelectual',
    title: '6. Propiedad intelectual',
    body: [
      'Una vez que el proyecto haya sido pagado en su totalidad, Fizzia transfiere al Cliente los derechos de propiedad intelectual sobre el código fuente, diseños y activos digitales creados específicamente para el proyecto, salvo que se acuerde lo contrario por escrito.',
      'Fizzia se reserva el derecho de utilizar librerías, frameworks, componentes de código abierto y herramientas de terceros, los cuales mantendrán sus licencias originales.',
      'Fizzia se reserva el derecho de incluir el proyecto en su portafolio, salvo que el Cliente solicite expresamente la exclusión por razones de confidencialidad.',
      'El Cliente no podrá revender, redistribuir o licenciar el código o diseños del proyecto como un producto genérico sin el consentimiento previo y por escrito de Fizzia.',
    ],
  },
  {
    id: 'confidencialidad',
    title: '7. Confidencialidad',
    body: [
      'Ambas Partes se comprometen a mantener la confidencialidad de toda la información intercambiada en el marco del proyecto, incluyendo datos técnicos, financieros, comerciales, estrategias, credenciales de acceso y cualquier otra información que no sea de conocimiento público.',
      'La obligación de confidencialidad se mantendrá vigente durante la ejecución del proyecto y por un período de dos (2) años posteriores a su finalización.',
      'Quedan exceptuadas de esta obligación aquellas informaciones que: (a) sean de dominio público al momento de la divulgación; (b) sean requeridas por autoridad competente; (c) hayan sido desarrolladas de forma independiente por la Parte receptora.',
      'El Cliente se compromete a no compartir credenciales de acceso a la Plataforma con terceros no autorizados y a notificar inmediatamente a Fizzia ante cualquier uso no autorizado.',
    ],
  },
  {
    id: 'responsabilidades-cliente',
    title: '8. Responsabilidades del Cliente',
    body: [
      'El Cliente se obliga a:',
      '(a) Proporcionar información completa, veraz y oportuna sobre los requerimientos del proyecto.',
      '(b) Entregar los materiales, contenidos, accesos, credenciales y aprobaciones necesarias en los plazos acordados.',
      '(c) Participar activamente en las reuniones de seguimiento, revisiones y demos programadas.',
      '(d) Realizar los pagos en las fechas y montos acordados.',
      '(e) Notificar cualquier cambio en sus datos de contacto o información relevante para el proyecto.',
      '(f) Abstenerse de realizar conductas abusivas, discriminatorias o contrarias a la ley hacia el equipo de Fizzia.',
      'El incumplimiento de estas obligaciones podrá resultar en retrasos del proyecto, suspensión del servicio o cancelación, sin que ello constituya incumplimiento por parte de Fizzia.',
    ],
  },
  {
    id: 'responsabilidades-developer',
    title: '9. Responsabilidades del Developer',
    body: [
      'Fizzia se obliga a:',
      '(a) Asignar profesionales calificados para la ejecución del proyecto.',
      '(b) Ejecutar los trabajos conforme al alcance aprobado y los estándares profesionales de la industria.',
      '(c) Comunicar de forma clara y oportuna cualquier desviación, retraso o impedimento en el proyecto.',
      '(d) Mantener la confidencialidad de la información del Cliente.',
      '(e) Entregar los productos y servicios acordados en los plazos establecidos, sujeto a la cooperación del Cliente.',
      '(f) Proveer los canales de comunicación necesarios para la correcta coordinación del proyecto.',
    ],
  },
  {
    id: 'soporte',
    title: '10. Soporte y mantenimiento',
    body: [
      'El período de soporte posterior a la entrega será definido en el alcance del proyecto. Durante este período, Fizzia corregirá errores de funcionamiento (bugs) que afecten el correcto desempeño del proyecto conforme a lo especificado.',
      'No se consideran parte del soporte: (a) cambios en el diseño o funcionalidades no contempladas en el alcance; (b) actualizaciones de plataformas de terceros; (c) correcciones derivadas de modificaciones realizadas por el Cliente o terceros no autorizados; (d) tareas de mantenimiento preventivo no acordadas.',
      'Los servicios de mantenimiento continuo, soporte extendido o actualizaciones periódicas podrán ser contratados por separado mediante un plan de mantenimiento.',
    ],
  },
  {
    id: 'limitacion-responsabilidad',
    title: '11. Limitación de responsabilidad',
    body: [
      'En la máxima medida permitida por la ley aplicable, Fizzia no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos derivados del uso o la imposibilidad de uso de los servicios prestados.',
      'La responsabilidad total de Fizzia en relación con cualquier proyecto no excederá el monto total pagado por el Cliente por el servicio específico que haya dado origen a la reclamación.',
      'Fizzia no será responsable por: (a) pérdida de datos, a menos que sea causada directamente por negligencia comprobada de Fizzia; (b) daños causados por modificaciones no autorizadas al proyecto; (c) fallos en servicios de terceros integrados al proyecto; (d) incidentes de seguridad causados por credenciales comprometidas por parte del Cliente.',
    ],
  },
  {
    id: 'uso-indebido',
    title: '12. Uso indebido de la plataforma',
    body: [
      'El Cliente se compromete a utilizar la Plataforma únicamente para los fines previstos y de conformidad con la ley.',
      'Queda prohibido: (a) realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la Plataforma; (b) utilizar la Plataforma para enviar mensajes no solicitados, publicidad no autorizada o contenido ilícito; (c) intentar acceder a cuentas de otros usuarios o a áreas no autorizadas del sistema; (d) realizar actividades que puedan dañar, sobrecargar o deteriorar el funcionamiento de la Plataforma.',
      'Fizzia se reserva el derecho de suspender o cancelar el acceso de cualquier usuario que incurra en uso indebido de la Plataforma, sin perjuicio de las acciones legales que correspondan.',
    ],
  },
  {
    id: 'cancelaciones',
    title: '13. Cancelaciones y reembolsos',
    body: [
      'Cuando un proyecto inicia con un anticipo, este reserva agenda, cubre planificación, análisis, diseño inicial, comunicación y horas de trabajo aplicadas al proyecto.',
      'Si el Cliente cancela un proyecto bajo modalidad tiempo y materiales, Fizzia calculará el trabajo efectivamente realizado hasta la fecha de cancelación. Se descontará el valor correspondiente a las horas trabajadas, reuniones, análisis, gestión y producción técnica ejecutada.',
      'La devolución, si corresponde, será únicamente del saldo no consumido por trabajo real, costos no recuperables, comisiones externas, licencias, servicios de terceros o materiales ya contratados para el proyecto.',
      'No se garantiza la devolución de montos ya utilizados para horas trabajadas, investigación, diseño, desarrollo, gestión, reuniones, configuración, administración, comisiones o costos externos ya ejecutados.',
      'Las cancelaciones deberán ser comunicadas por escrito a través de los canales oficiales de la Plataforma.',
    ],
  },
  {
    id: 'proteccion-datos',
    title: '14. Protección de datos personales',
    body: [
      'Fizzia recopila y trata los datos personales del Cliente necesarios para la prestación de los servicios, incluyendo nombre, correo electrónico, teléfono, empresa, país, ciudad, información del proyecto, mensajes, archivos, comprobantes de pago y actividad dentro de la Plataforma.',
      'Los datos serán utilizados para: (a) operar la cuenta del Cliente; (b) gestionar proyectos; (c) validar pagos; (d) coordinar reuniones y comunicación; (e) prestar soporte técnico; (f) mejorar los servicios; (g) cumplir obligaciones administrativas, fiscales o legales.',
      'Fizzia no vende datos personales a terceros. Podrá compartir información únicamente con proveedores necesarios para la operación del servicio, como servicios de hosting, base de datos, almacenamiento, comunicación, pagos o herramientas técnicas, quienes estarán sujetos a obligaciones de confidencialidad.',
      'El Cliente podrá ejercer sus derechos de acceso, rectificación, cancelación y oposición (derechos ARCO) comunicándose a través de los canales oficiales de Fizzia.',
      'Fizzia implementa medidas de seguridad técnicas y organizativas adecuadas para proteger los datos personales contra acceso no autorizado, pérdida o destrucción.',
    ],
  },
  {
    id: 'modificaciones',
    title: '15. Modificaciones del servicio',
    body: [
      'Fizzia se reserva el derecho de modificar, actualizar o suspender temporal o permanentemente cualquier funcionalidad de la Plataforma o de los servicios ofrecidos, en cualquier momento y sin previo aviso, cuando existan razones técnicas, operativas, de seguridad o legales que lo justifiquen.',
      'Fizzia notificará a los Clientes sobre cambios sustanciales en los términos y condiciones a través de la Plataforma o por correo electrónico.',
      'El uso continuado de la Plataforma después de la publicación de modificaciones constituye la aceptación de dichos cambios por parte del Cliente.',
    ],
  },
  {
    id: 'jurisdiccion',
    title: '16. Jurisdicción y legislación aplicable',
    body: [
      'Estos términos y condiciones se rigen por las leyes de la República del Ecuador. Cualquier controversia que derive de su interpretación, aplicación o ejecución será sometida a la jurisdicción de los tribunales de la ciudad de Quito, Ecuador.',
      'En caso de que el Cliente tenga domicilio en un país distinto a Ecuador, Fizzia podrá optar por someter la controversia a arbitraje en línea conforme a las reglas de la Cámara de Comercio Internacional (CCI), en lugar de la jurisdicción ordinaria.',
      'Si alguna disposición de estos términos fuera declarada inválida o inejecutable, las disposiciones restantes continuarán en pleno vigor y efecto.',
    ],
  },
  {
    id: 'firma-digital',
    title: '17. Firma digital y aceptación',
    body: [
      'La aceptación de estos términos y condiciones se realiza mediante la acción de hacer clic en el botón "Aceptar términos" dentro de la Plataforma, después de haber leído el documento completo.',
      'La acción de aceptar constituye una manifestación de voluntad válida y vinculante.',
      'La aceptación digital así obtenida tiene plena validez legal y constituye prueba de la aceptación de estos términos por parte del Cliente.',
      'Fizzia se reserva el derecho de actualizar estos términos en cualquier momento. La versión vigente será la publicada en la Plataforma en la fecha de la aceptación.',
      'Si existe un contrato particular firmado entre las Partes, dicho contrato prevalecerá sobre estos términos únicamente en las cláusulas que entren en conflicto directo.',
    ],
  },
];

function buildHtml() {
  const sectionsHtml = termsSections.map(s => `
    <section>
      <h2>${s.title}</h2>
      ${s.body.map(p => `<p>${p}</p>`).join('\n      ')}
    </section>
  `).join('\n    ');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 9.5pt;
    line-height: 1.55;
    color: #1a1a1a;
    widows: 2;
    orphans: 2;
  }

  @page {
    size: A4;
    margin: 2.2cm 2.5cm 2.2cm 2.5cm;
  }

  @page :first {
    margin: 0;
  }

  /* ── cover ── */
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    text-align: center;
    page-break-after: always;
    padding: 2cm;
  }
  .cover .logo-text {
    font-size: 36pt;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: #0f3b1a;
    margin-bottom: 0.3cm;
  }
  .cover .divider {
    width: 4cm;
    height: 2.5px;
    background: #32a852;
    margin: 0.8cm auto;
    border-radius: 2px;
  }
  .cover h1 {
    font-size: 24pt;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0f3b1a;
    margin-bottom: 0.5cm;
    line-height: 1.15;
  }
  .cover .sub {
    font-size: 11pt;
    color: #2d6b3d;
    font-weight: 500;
    max-width: 12cm;
    margin-bottom: 1.5cm;
    line-height: 1.4;
  }
  .cover .meta {
    font-size: 8.5pt;
    color: #777;
  }

  /* ── sections ── */
  section {
    margin-bottom: 0.9em;
  }

  section h2 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #0f3b1a;
    margin-bottom: 0.35em;
    padding-bottom: 0.12em;
    border-bottom: 1.5px solid #c8e6d0;
  }

  p {
    margin-bottom: 0.45em;
    text-align: justify;
  }

  .footer-note {
    margin-top: 1.2em;
    padding-top: 0.6em;
    border-top: 1px solid #d0d0d0;
    font-size: 7pt;
    color: #999;
    text-align: center;
  }

  .page-break {
    page-break-after: always;
  }
</style>
</head>
<body>

<div class="cover">
  <div class="logo-text">Fizzia</div>
  <div class="divider"></div>
  <h1>Términos y Condiciones Generales</h1>
  <p class="sub">Servicios de diseño, desarrollo web, aplicaciones, automatizaciones, integraciones, soporte técnico y consultoría</p>
  <p class="meta">Versión 2.0 &mdash; ${legalLastUpdated}<br>Fizzia.dev</p>
</div>

${sectionsHtml}

<p class="footer-note">Este documento constituye los Términos y Condiciones Generales de Fizzia.dev. Al aceptar estos términos mediante la plataforma, el Cliente reconoce haber leído, entendido y aceptado todas las disposiciones aquí contenidas.</p>

</body>
</html>`;
}

(async () => {
  const html = buildHtml();
  const tmp = path.resolve(__dirname, '..', 'public', 'legal', '__terms_temp.html');
  fs.writeFileSync(tmp, html, 'utf-8');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('file://' + tmp, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: OUTPUT,
    format: 'A4',
    printBackground: true,
    margin: { top: '2.2cm', bottom: '2.2cm', left: '2.5cm', right: '2.5cm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="width:100%;font-size:7.5pt;font-family:Inter,sans-serif;color:#999;text-align:center;padding:0 2.5cm;">
        <span style="float:left">Fizzia &mdash; Términos y Condiciones</span>
        <span style="float:right">P\xe1gina <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  fs.unlinkSync(tmp);

  const size = fs.statSync(OUTPUT).size;
  console.log('PDF generado:', OUTPUT, `(${(size / 1024).toFixed(0)} KB)`);
})();
