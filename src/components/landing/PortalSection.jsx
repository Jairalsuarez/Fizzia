import { useState, useEffect, useRef } from 'react'
import { Icon } from '../ui/Icon'
import { useLanguage } from '../../contexts/LanguageContext'

export function PortalSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  const { t } = useLanguage()

  const features = t('portal.features')
  const heading = t('portal.heading')

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 bg-dark-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-fizzia-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-fizzia-600/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
            {heading[0]} <span className="text-fizzia-400">{heading[1]}</span>
          </h2>
          <p className="text-dark-400 text-lg max-w-2xl mx-auto">
            {t('portal.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`group p-6 bg-dark-900/50 border border-dark-800 rounded-xl hover:border-fizzia-500/30 hover:bg-dark-900 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: visible ? `${i * 100}ms` : '0ms', transitionProperty: 'opacity, transform, border-color, background-color' }}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-fizzia-500/10 text-fizzia-400 mb-4 group-hover:bg-fizzia-500/20 transition-colors">
                <Icon name={feature.icon} size={24} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-dark-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className={`mt-12 text-center transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-fizzia-500 text-white font-semibold rounded-xl hover:bg-fizzia-400 transition-all shadow-lg shadow-fizzia-500/25 hover:shadow-fizzia-500/40 text-lg cursor-pointer"
          >
            {t('portal.cta')}
            <Icon name="arrow_forward" size={20} />
          </a>
          <p className="text-dark-500 text-sm mt-3">{t('portal.disclaimer')}</p>
        </div>
      </div>
    </section>
  )
}
