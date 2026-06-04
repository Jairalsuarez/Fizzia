import { useState, useRef, useEffect } from 'react'
import { Icon } from '../ui/Icon'
import { AnimatedHero } from '../ui/AnimatedHero'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCountry } from '../../contexts/CountryContext'
import { NEUTRAL_LOCATION } from '../../data/localSeo'

export function HeroSection({ seoContext }) {
  const [visible, setVisible] = useState(false)
  const { country, countryCode, city } = useCountry()
  const ref = useRef(null)
  const { t } = useLanguage()

  const activeCity = seoContext?.city || city || NEUTRAL_LOCATION
  const heading = seoContext?.heading || t('localSeo.intents.desarrollo.label')
  const animatedWords = seoContext?.intent
    ? t(`localSeo.intents.${seoContext.intent.key}.heroWords`)
    : t('hero.animated.defaultWords')
  const heroHeading = `${heading} ${t('hero.with')} Fizzia`
  const highlightTerms = [activeCity.name, 'Fizzia'].filter(Boolean)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section id="inicio" ref={ref} className="relative flex min-h-[min(78dvh,720px)] items-center overflow-hidden bg-dark-950 pt-20 pb-8 md:min-h-[min(70dvh,660px)] md:pt-20 md:pb-6 xl:min-h-[min(64dvh,600px)]">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-dark-800/40 via-dark-900/20 to-transparent" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-dark-800/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-dark-800/20 rounded-full blur-3xl" />
      </div>

      <div className={`relative mx-auto w-full max-w-6xl px-4 sm:px-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <AnimatedHero
          badge={
            <div className="inline-flex items-center gap-2 rounded-full border border-fizzia-500/20 bg-fizzia-500/10 px-4 py-1.5">
              {countryCode ? (
                <img src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} alt={country} className="w-4 h-3 rounded-sm object-cover" />
              ) : (
                <span className="w-2 h-2 bg-fizzia-400 rounded-full animate-pulse" />
              )}
              <span className="text-fizzia-400 text-xs font-semibold cursor-default">{t('hero.availableIn')} {country || t('hero.yourCountry')}</span>
            </div>
          }
          heading={heroHeading}
          animatedWords={animatedWords}
          description={t('hero.description')}
          highlightTerms={highlightTerms}
          primaryCta={
              <a
                href="/register"
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-fizzia-500 text-white font-semibold rounded-xl hover:bg-fizzia-400 transition-all duration-200 shadow-lg shadow-fizzia-500/25 hover:shadow-fizzia-500/40 text-base"
              >
                {t('hero.ctaStart')}
                <Icon name="arrow_forward" size={18} />
              </a>
          }
          secondaryCta={
              <a
                href="/quienes-somos"
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-dark-700 bg-dark-900/50 text-dark-100 font-semibold rounded-xl hover:border-fizzia-500/30 hover:bg-dark-800 transition-all duration-200 text-base"
              >
                {t('about.label')}
                <Icon name="arrow_forward" size={18} />
              </a>
          }
        />
      </div>
    </section>
  )
}
