import { useNavigate } from 'react-router-dom'

const tutorialSections = [
  { path: '/cliente', icon: 'dashboard', title: 'Tu inicio' },
  { path: '/cliente/nuevo-proyecto', icon: 'add_circle', title: 'Pedir un proyecto' },
  { path: '/cliente/finanzas', icon: 'payments', title: 'Pagos y comprobantes' },
  { path: '/cliente/archivos', icon: 'folder_open', title: 'Archivos del proyecto' },
  { path: '/cliente/configuracion', icon: 'tune', title: 'Opciones avanzadas' },
]

function startTour(path) {
  window.dispatchEvent(new CustomEvent('fizzia-start-client-tour', { detail: { path } }))
}

export function TutorialsPage() {
  const navigate = useNavigate()

  const openTour = (path) => {
    navigate(path)
    window.setTimeout(() => startTour(path), 350)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Tutoriales</h1>
        <p className="mt-1 text-sm text-dark-400">Reproduce el tutorial de cada seccion para recordar como funciona.</p>
      </div>

      <div className="space-y-2">
        {tutorialSections.map((section) => (
          <button
            key={section.path}
            type="button"
            onClick={() => openTour(section.path)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-dark-800 bg-dark-900/60 px-4 py-3.5 text-left transition-colors hover:border-dark-600 hover:bg-dark-800/80"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-rounded text-fizzia-400 text-xl shrink-0">{section.icon}</span>
              <span className="text-sm font-semibold text-white truncate">{section.title}</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-dark-400 shrink-0">
              Repetir tutorial
              <span className="material-symbols-rounded text-base">play_circle</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
