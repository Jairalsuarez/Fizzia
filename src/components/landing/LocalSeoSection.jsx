import { useLanguage } from '../../contexts/LanguageContext'
import { SEO_INTENTS, SUPPORTED_CITIES } from '../../data/localSeo'

export function LocalSeoSection({ activeCity, activeIntent }) {
  const { t } = useLanguage()
  const intentCopy = t(`localSeo.intents.${activeIntent.key}`)
  const hasLocation = !!activeCity?.slug
  const activeLocationName = activeCity?.name || t('localSeo.neutralLocation')

  return (
    <section className="bg-dark-950 px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
          <nav className="rounded-xl border border-dark-700 bg-dark-900 p-4" aria-label={t('localSeo.cityNavTitle')}>
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href={`/?servicio=${activeIntent.slug}`}
                className="flex items-center justify-between rounded-lg border border-fizzia-500/30 bg-fizzia-500/10 px-3 py-2 text-sm font-semibold text-fizzia-300 transition-colors hover:border-fizzia-500/60 hover:text-fizzia-200"
              >
                <span>{intentCopy.label}</span>
                <span className="text-fizzia-500/80">{t('localSeo.neutralView')}</span>
              </a>
              {SUPPORTED_CITIES.map((city) => (
                <a
                  key={city.slug}
                  href={`/${activeIntent.slug}-${city.slug}`}
                  className="flex items-center justify-between rounded-lg border border-dark-700 bg-dark-950 px-3 py-2 text-sm font-semibold text-dark-300 transition-colors hover:border-fizzia-500/40 hover:text-fizzia-400"
                >
                  <span>{intentCopy.label} {t('localSeo.inCity')} {city.name}</span>
                  <span className="text-dark-500">{city.region}</span>
                </a>
              ))}
            </div>
          </nav>

          <nav className="grid gap-2 sm:grid-cols-2" aria-label={t('localSeo.intentNavTitle')}>
            {SEO_INTENTS.map((intent) => (
              <a
                key={intent.slug}
                href={hasLocation ? `/${intent.slug}-${activeCity.slug}` : `/?servicio=${intent.slug}`}
                className="rounded-lg border border-dark-700 px-4 py-3 text-sm font-bold text-dark-200 transition-colors hover:border-fizzia-500/40 hover:text-fizzia-400"
              >
                {t(`localSeo.intents.${intent.key}.label`)} {t('localSeo.inCity')} {activeLocationName}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
