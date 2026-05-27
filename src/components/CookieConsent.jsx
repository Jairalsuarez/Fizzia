import { useEffect, useState } from 'react'
import { getCookieValue, setCookieValue } from '../utils/cookieStorage'

const COOKIE_KEY = 'fizzia-cookie-consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!getCookieValue(COOKIE_KEY))
  }, [])

  const saveChoice = (choice) => {
    setCookieValue(COOKIE_KEY, JSON.stringify({
      choice,
      acceptedAt: new Date().toISOString(),
    }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[10000] px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-2xl border border-dark-800 bg-white/95 p-4 text-dark-950 shadow-2xl shadow-black/20 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-sm font-bold">Usamos cookies</p>
          <p className="mt-1 text-sm leading-relaxed text-dark-500">
            Guardamos cookies necesarias para mantener tu sesion, recordar preferencias y mejorar la experiencia de Fizzia.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => saveChoice('necessary')}
            className="cursor-pointer rounded-xl border border-dark-700 px-4 py-2.5 text-sm font-semibold text-dark-700 transition-all hover:bg-dark-100"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={() => saveChoice('accepted')}
            className="cursor-pointer rounded-xl bg-fizzia-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-fizzia-500/25 transition-all hover:bg-fizzia-400 active:scale-[0.98]"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
