import { useState, useRef, useEffect } from 'react'
import { Icon } from '../ui/Icon'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCountry } from '../../contexts/CountryContext'

export function HeroSection() {
  const [visible, setVisible] = useState(false)
  const { country, countryCode } = useCountry()
  const ref = useRef(null)
  const { t } = useLanguage()

  const benefits = t('hero.benefits')
  const heading = t('hero.heading')
  const dashStats = t('hero.dashboard.stats')

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section id="inicio" ref={ref} className="relative flex min-h-[min(86dvh,820px)] items-center overflow-hidden bg-dark-950 pt-20 pb-10 md:pt-24 md:pb-12">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-dark-800/40 via-dark-900/20 to-transparent" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-dark-800/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-dark-800/20 rounded-full blur-3xl" />
      </div>

      <div className={`relative mx-auto w-full max-w-6xl px-4 sm:px-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-fizzia-500/10 border border-fizzia-500/20 rounded-full">
              {countryCode ? (
                <img src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} alt={country} className="w-4 h-3 rounded-sm object-cover" />
              ) : (
                <span className="w-2 h-2 bg-fizzia-400 rounded-full animate-pulse" />
              )}
              <span className="text-fizzia-400 text-xs font-semibold cursor-default">{t('hero.availableIn')} {country || t('hero.yourCountry')}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight text-balance">
              {heading[0]}{' '}
              <span className="text-fizzia-400">{heading[1]}</span>
            </h1>
            <p className="text-lg text-dark-300 max-w-lg leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <a
                href="/register"
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-fizzia-500 text-white font-semibold rounded-xl hover:bg-fizzia-400 transition-all duration-200 shadow-lg shadow-fizzia-500/25 hover:shadow-fizzia-500/40 text-base"
              >
                {t('hero.ctaStart')}
                <Icon name="arrow_forward" size={18} />
              </a>
              <a
                href="/quienes-somos"
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-dark-700 bg-dark-900/50 text-dark-100 font-semibold rounded-xl hover:border-fizzia-500/30 hover:bg-dark-800 transition-all duration-200 text-base"
              >
                {t('about.label')}
                <Icon name="arrow_forward" size={18} />
              </a>
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 sm:gap-5">
              {benefits.map((b) => (
                <div key={b.label} className="flex items-center gap-3 text-dark-300">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-fizzia-500/10 text-fizzia-400">
                    <Icon name={b.icon} size={16} />
                  </div>
                  <span className="text-sm font-semibold">{b.label}</span>
                </div>
              ))}
              <a href="#contacto" className="flex items-center gap-3 text-dark-400 hover:text-fizzia-400 transition-colors cursor-pointer group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-dark-800 text-dark-400 group-hover:bg-fizzia-500/10 group-hover:text-fizzia-400 transition-colors">
                  <Icon name="chat" size={16} />
                </div>
                <span className="text-sm font-semibold">{t('hero.ctaQuote')}</span>
              </a>
            </div>
          </div>

          <div className={`relative transition-all duration-500 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="relative bg-dark-900 border border-dark-700 rounded-2xl overflow-hidden shadow-2xl shadow-fizzia-500/5">
              <div className="flex">
                <div className="hidden w-24 bg-dark-950 border-r border-dark-700 p-4 space-y-4 sm:block">
                  <span className="text-fizzia-400 font-bold text-sm">Fizzia</span>
                  <div className="space-y-3">
                    {[
                      ['home', 'Inicio'],
                      ['receipt_long', 'Ventas'],
                      ['inventory_2', 'Inventario'],
                      ['groups', 'Clientes'],
                    ].map(([icon, label]) => (
                      <div key={icon} className="flex items-center gap-2 text-dark-500 text-xs">
                        <Icon name={icon} size={14} />
                        <span className="hidden lg:inline">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="min-w-0 flex-1 p-4 space-y-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{t('hero.dashboard.title')}</span>
                    <span className="px-3 py-1 bg-fizzia-500/10 text-fizzia-400 text-xs font-bold rounded-full">{t('hero.dashboard.today')}</span>
                  </div>
                  <div>
                    <p className="text-dark-400 text-sm">{t('hero.dashboard.sales')}</p>
                    <p className="text-2xl font-black text-white">$24,780.00</p>
                  </div>
                  <div className="h-24 bg-dark-950 rounded-lg border border-dark-700 flex items-center justify-center">
                    <svg viewBox="0 0 340 80" className="w-full h-16">
                      <path d="M6 60 C35 55 48 40 74 45 C102 50 111 20 138 30 C166 40 176 60 202 40 C228 20 236 10 264 25 C288 40 304 10 334 12" fill="none" stroke="#44a64a" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {dashStats.map((s) => (
                      <div key={s.l} className="bg-dark-950 rounded-lg p-3 border border-dark-700">
                        <p className="text-fizzia-400 font-bold text-sm">{s.v}</p>
                        <p className="text-dark-500 text-xs">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-fizzia-500/10 rounded-full blur-xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
