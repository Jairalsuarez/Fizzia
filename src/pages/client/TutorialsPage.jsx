import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui'
import { useTheme } from '../../theme/ThemeContext'

const tutorialSections = [
  {
    path: '/cliente',
    icon: 'dashboard',
    title: 'Tu inicio',
    description: 'La pantalla principal es tu punto de control. Ahí ves tus proyectos, estados y próximos pasos sin tener que buscar demasiado.',
    tips: [
      'Si un proyecto aparece en revisión, significa que estamos ordenando la información antes de trabajarlo.',
      'Cuando tengas proyectos activos, el botón de mensajes abre una conversación directa con el equipo.',
      'El resumen está pensado para mirar rápido qué está pasando, no para perderte entre detalles técnicos.',
    ],
  },
  {
    path: '/cliente/nuevo-proyecto',
    icon: 'add_circle',
    title: 'Pedir un proyecto',
    description: 'No necesitas escribir como programador. Cuéntanos qué quieres lograr, para quién es y qué cosas no pueden faltar.',
    tips: [
      'Una buena descripción responde: qué necesitas, quién lo va a usar y qué resultado esperas.',
      'Si no sabes el presupuesto exacto, usa un rango aproximado. Eso nos ayuda a proponerte algo realista.',
      'Mientras más contexto nos des al inicio, menos vueltas damos después.',
    ],
  },
  {
    path: '/cliente/finanzas',
    icon: 'payments',
    title: 'Pagos y comprobantes',
    description: 'La sección de finanzas te muestra pagos pendientes, historial y comprobantes para que todo quede claro.',
    tips: [
      'Antes de pagar, revisa que el monto coincida con el proyecto o factura.',
      'Si subes un comprobante, espera la validación del equipo antes de asumir que quedó aprobado.',
      'El historial te sirve como respaldo cuando quieras revisar pagos anteriores.',
    ],
  },
  {
    path: '/cliente/archivos',
    icon: 'folder_open',
    title: 'Archivos del proyecto',
    description: 'Aquí se guardan materiales, entregables y documentos importantes relacionados con tus proyectos.',
    tips: [
      'Usa nombres claros para archivos: logo-final.png ayuda más que imagen1.png.',
      'Si el equipo te pide un archivo, súbelo desde el proyecto correcto para evitar confusiones.',
      'Los documentos importantes quedan mejor en PDF cuando ya no deben editarse.',
    ],
  },
  {
    path: '/cliente/configuracion',
    icon: 'tune',
    title: 'Opciones avanzadas',
    description: 'En configuración puedes ajustar avatar, tema, datos personales y seguridad de la cuenta.',
    tips: [
      'Cambia tu contraseña si compartiste tu cuenta o usaste una clave demasiado simple.',
      'El tema solo cambia cómo se ve tu panel, no afecta tus proyectos ni tus pagos.',
      'Mantén tu teléfono actualizado para que podamos contactarte si algo necesita confirmación rápida.',
    ],
  },
]

function startTour(path) {
  window.dispatchEvent(new CustomEvent('fizzia-start-client-tour', { detail: { path } }))
}

export function TutorialsPage() {
  const navigate = useNavigate()
  const { palette } = useTheme()

  const openTour = (path) => {
    navigate(path)
    window.setTimeout(() => startTour(path), 350)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <section className="rounded-2xl border border-dark-800 bg-dark-900/70 p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${palette.badgeText}`}>Centro de ayuda</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">
              Tutoriales para usar Fizzia sin complicarte
            </h1>
            <p className="mt-4 text-sm leading-6 text-dark-300 md:text-base">
              Una guía breve, en palabras humanas, para entender qué hace cada parte del panel y cuándo usarla.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openTour('/cliente')}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all active:scale-[0.98] ${palette.activeButton}`}
          >
            <span className="material-symbols-rounded text-lg">play_circle</span>
            Empezar tour básico
          </button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {tutorialSections.map((section) => (
          <Card key={section.path} className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${palette.badgeBg} ${palette.badgeText}`}>
                <span className="material-symbols-rounded text-xl">{section.icon}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                <p className="mt-1 text-sm leading-6 text-dark-400">{section.description}</p>
              </div>
            </div>

            <ul className="space-y-2">
              {section.tips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm leading-6 text-dark-300">
                  <span className={`material-symbols-rounded mt-0.5 text-base ${palette.badgeText}`}>check_circle</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => openTour(section.path)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-700 px-4 py-2 text-sm font-semibold text-dark-200 transition-colors hover:border-dark-600 hover:bg-dark-800 hover:text-white"
            >
              Ver recorrido
              <span className="material-symbols-rounded text-base">arrow_forward</span>
            </button>
          </Card>
        ))}
      </div>

      <Card className="border-dark-700 bg-dark-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Consejo avanzado</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-400">
              Si algo es urgente, escribe por mensajes dentro del proyecto. Si es una idea nueva, crea un proyecto separado.
              Así el equipo mantiene cada conversación en su lugar y nada se mezcla.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('fizzia-open-chat'))}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-dark-800 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-dark-700"
          >
            <span className="material-symbols-rounded text-lg">forum</span>
            Abrir mensajes
          </button>
        </div>
      </Card>
    </div>
  )
}
