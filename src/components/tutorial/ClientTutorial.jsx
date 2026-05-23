import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const STORAGE_PREFIX = 'fizzia-client-tour-done:'

const tours = {
  '/cliente': [
    {
      selector: '[data-tour="client-welcome"]',
      title: 'Bienvenido a tu inicio',
      body: 'Aquí verás un resumen de todo. Es lo primero que ves al entrar.',
    },
    {
      selector: '[data-tour="client-new-project"]',
      title: 'Empezar algo nuevo',
      body: 'Si tienes una idea, toca aquí. Te haremos unas simples preguntas para comenzar.',
    },
    {
      selector: '[data-tour="client-projects"]',
      title: 'Tus proyectos',
      body: 'En esta parte te mostraremos en qué estamos trabajando y lo que ya hemos terminado.',
    },
    {
      selector: '[data-tour="client-chat"]',
      title: 'Habla con nosotros',
      body: 'Toca este botón si tienes una duda rápida o quieres mandarnos un mensaje.',
    },
  ],
  '/cliente/finanzas': [
    {
      selector: '[data-tour="finance-summary"]',
      title: 'Tus pagos',
      body: 'Un resumen muy sencillo de lo que has pagado y si hay algo pendiente.',
    },
    {
      selector: '[data-tour="finance-pending"]',
      title: 'Por pagar',
      body: 'Si te falta pagar algo, te aparecerá aquí para que lo veas fácil.',
    },
    {
      selector: '[data-tour="finance-history"]',
      title: 'Historial',
      body: 'Aquí guardamos todos tus recibos y comprobantes de lo que ya pagaste.',
    },
    {
      selector: '[data-tour="finance-ask"]',
      title: 'Preguntas sobre dinero',
      body: '¿Dudas con un cobro? Toca aquí y te ayudamos rapidito.',
    },
  ],
  '/cliente/nuevo-proyecto': [
    {
      selector: '[data-tour="new-project-title"]',
      title: 'Crea tu proyecto',
      body: 'Solo vamos a hacerte 4 preguntas súper sencillas para entender qué necesitas.',
    },
    {
      selector: '[data-tour="new-project-form"]',
      title: 'Tus respuestas',
      body: 'No uses palabras raras. Cuéntanos qué quieres como si estuvieras hablando con un amigo.',
    },
  ],
  '/cliente/perfil': [
    {
      selector: '[data-tour="profile-form"]',
      title: 'Tus datos personales',
      body: 'Revisa que tu nombre y teléfono estén correctos para poder llamarte o escribirte.',
    },
    {
      selector: '[data-tour="profile-password"]',
      title: 'Tu contraseña',
      body: 'Si alguna vez sientes que debes cambiar tu contraseña, aquí es el lugar.',
    }
  ],
  '/cliente/configuracion': [
    {
      selector: '[data-tour="settings-tabs"]',
      title: 'Opciones de tu cuenta',
      body: 'Usa estas pestañas para cambiar tu foto, tu contraseña o los colores de la pantalla.',
    },
    {
      selector: '[data-tour="settings-avatar"]',
      title: 'Tu foto o avatar',
      body: 'Toca aquí para elegir una imagen que te guste para que te reconozcamos mejor.',
    }
  ],
}

function getRect(selector) {
  const element = document.querySelector(selector)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  const isMobile = window.innerWidth < 640
  return {
    top: Math.max(rect.top - 8, 12),
    left: Math.max(rect.left - 8, 12),
    width: Math.min(rect.width + 16, window.innerWidth - 24),
    height: Math.min(rect.height + 16, window.innerHeight - 24),
  }
}

function getCardPosition(rect) {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  const isMobile = window.innerWidth < 640
  const cardWidth = Math.min(312, window.innerWidth - 36)

  if (isMobile) {
    const topBelow = rect.bottom + 18
    const fitsBelow = topBelow + 220 < window.innerHeight
    return {
      top: fitsBelow ? Math.max(12, rect.bottom + 14) : Math.max(12, rect.top - 210),
      left: '50%',
      transform: 'translateX(-50%)',
      width: cardWidth,
    }
  }

  const top = rect.bottom + 18 > window.innerHeight - 170
    ? Math.max(18, rect.top - 190)
    : rect.bottom + 18
  const left = Math.min(Math.max(18, rect.left), window.innerWidth - 360)
  return { top, left }
}

export function ClientTutorial() {
  const location = useLocation()
  const navigate = useNavigate()
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)

  const steps = useMemo(() => tours[location.pathname] || [], [location.pathname])
  const current = steps[step]

  const startTour = useCallback((targetPath = location.pathname) => {
    if (targetPath !== location.pathname) {
      navigate(targetPath)
      requestAnimationFrame(() => {
        setStep(0)
        setActive(true)
      })
      return
    }
    setStep(0)
    setActive(true)
  }, [location.pathname, navigate])

  useEffect(() => {
    const handler = (event) => {
      const requestedPath = event.detail?.path || location.pathname
      const path = tours[requestedPath] ? requestedPath : '/cliente'
      startTour(path)
    }
    window.addEventListener('fizzia-start-client-tour', handler)
    return () => window.removeEventListener('fizzia-start-client-tour', handler)
  }, [location.pathname, startTour])

  useEffect(() => {
    if (!tours[location.pathname]) return
    if (localStorage.getItem(`${STORAGE_PREFIX}${location.pathname}`) === 'true') return
    if (document.querySelector('.terms-gate-screen')) return
    const id = window.setTimeout(() => startTour(location.pathname), 650)
    return () => window.clearTimeout(id)
  }, [location.pathname, startTour])

  useEffect(() => {
    if (!active || !current) return
    const el = document.querySelector(current.selector)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const update = () => setRect(getRect(current.selector))
    const id = window.setTimeout(update, 120)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.clearTimeout(id)
    }
  }, [active, current])

  if (!active || !current) return null

  const finish = () => {
    localStorage.setItem(`${STORAGE_PREFIX}${location.pathname}`, 'true')
    setActive(false)
    setStep(0)
  }

  const next = () => {
    if (step >= steps.length - 1) {
      finish()
      return
    }
    setStep(prev => prev + 1)
  }

  const cardStyle = getCardPosition(rect)

  return (
    <div className="client-tour-layer" aria-live="polite">
      <div className="client-tour-dim" />
      {rect && (
        <div
          className="client-tour-highlight"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}
      <div className="client-tour-card" style={cardStyle}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fizzia-400">
          Guia {step + 1} de {steps.length}
        </p>
        <h3 className="mt-2 text-lg font-bold text-white">{current.title}</h3>
        <p className="mt-2 text-sm leading-6 text-dark-300">{current.body}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-dark-400 transition-colors hover:text-white"
          >
            Saltar
          </button>
          <button
            type="button"
            onClick={next}
            className="cursor-pointer rounded-xl bg-fizzia-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-fizzia-400 active:scale-[0.98]"
          >
            {step >= steps.length - 1 ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
