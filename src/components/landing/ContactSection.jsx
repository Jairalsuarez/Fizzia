import { useState } from 'react'
import { createLead } from '../../services/landingData'
import { useLanguage } from '../../contexts/LanguageContext'

const COOLDOWN_KEY = 'fizzia_contact_cooldown'
const COOLDOWN_MS = 24 * 60 * 60 * 1000

async function handleStartProject() {
  try {
    await createLead({
      full_name: 'Visitante landing',
      status: 'new',
      source: 'landing_cta',
      metadata: { event: 'cta_click', page: 'home' },
    })
  } catch (error) {
    console.warn(error)
  }
}

export function ContactSection() {
  const { t } = useLanguage()
  const [cooldown, setCooldown] = useState(() => {
    const last = localStorage.getItem(COOLDOWN_KEY)
    if (!last) return null
    const elapsed = Date.now() - Number(last)
    return elapsed < COOLDOWN_MS ? Math.ceil((COOLDOWN_MS - elapsed) / 3600000) : null
  })

  const handleClick = () => {
    if (cooldown) return
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
    setCooldown(24)
    handleStartProject()
  }

  return (
    <section id="contacto" className="pt-8 pb-16 md:pt-10 md:pb-20 bg-dark-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-fizzia-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-fizzia-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fizzia-700 via-fizzia-600 to-fizzia-500 p-7 md:p-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  {t('contact.heading')}
                </h2>
                <p className="mt-3 text-white/80 text-lg font-medium">
                  {t('contact.description')}
                </p>
              </div>
              <button
                onClick={handleClick}
                disabled={!!cooldown}
                className="cursor-pointer shrink-0 px-8 py-4 bg-white text-fizzia-700 font-black rounded-xl hover:bg-fizzia-50 hover:shadow-lg transition-all duration-200 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cooldown ? t('contact.cooldown') : t('contact.ctaStart')}
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900 via-dark-900/95 to-fizzia-950/20 border border-dark-800 p-7 md:p-10 flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-fizzia-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative">
              <h3 className="text-xl font-bold text-white mb-3">
                {t('contact.secondaryHeading')}
              </h3>
              <p className="text-dark-400 text-sm leading-relaxed mb-6">
                {t('contact.secondaryDescription')}
              </p>
              <a
                href="/register"
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-fizzia-500 text-white font-semibold rounded-xl hover:bg-fizzia-400 transition-all duration-200 shadow-lg shadow-fizzia-500/25"
              >
                {t('contact.ctaAccount')}
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
