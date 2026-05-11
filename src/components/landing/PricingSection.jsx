import { useState, useEffect, useRef } from 'react'
import { Icon } from '../ui/Icon'
import { useLanguage } from '../../contexts/LanguageContext'

export function PricingSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  const { t } = useLanguage()

  const heading = t('pricing.heading')
  const tiers = t('pricing.tiers')

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="precios" ref={ref} className="relative py-24 bg-dark-950 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-fizzia-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fizzia-600/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
            {heading[0]}{' '}
            <span className="text-fizzia-400">{heading[1]}</span>
          </h2>
          <p className="text-dark-300 text-base md:text-lg max-w-2xl mx-auto">{t('pricing.description')}</p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {tiers.map((tier, i) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-6 md:p-8 transition-all duration-300 ${
                tier.highlight
                  ? 'border-fizzia-500/40 bg-fizzia-500/5 shadow-lg shadow-fizzia-500/10'
                  : 'border-dark-800 bg-dark-900/50 hover:border-dark-700'
              }`}
              style={{ animationDelay: visible ? `${i * 0.1}s` : '0s' }}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-fizzia-500 text-white text-xs font-bold rounded-full">
                  Más popular
                </span>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  tier.highlight ? 'bg-fizzia-500/20 text-fizzia-400' : 'bg-dark-800 text-dark-200'
                }`}>
                  <Icon name={tier.icon} size={20} />
                </div>
                <h3 className="text-white font-bold text-lg">{tier.name}</h3>
              </div>

              <p className="text-2xl md:text-3xl font-black text-white mb-4">{tier.price}</p>

              <ul className="space-y-2 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-dark-300 text-sm">
                    <span className="text-fizzia-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="flex items-center justify-center gap-2 text-dark-400 text-sm mt-10">
          <Icon name="calendar_month" size={16} />
          {t('pricing.monthlyNote')}
        </p>
      </div>
    </section>
  )
}
