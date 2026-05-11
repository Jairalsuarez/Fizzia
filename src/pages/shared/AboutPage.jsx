import { LanguageProvider } from '../../contexts/LanguageContext'
import { CountryProvider } from '../../contexts/CountryContext'
import { Header } from '../../components/landing/Header'
import { Footer } from '../../components/landing/Footer'
import { AnonymousChat } from '../../components/landing/AnonymousChat'
import { useLanguage } from '../../contexts/LanguageContext'

function AboutContent() {
  const { t } = useLanguage()
  const about = t('about')

  return (
    <>
      <Header />

      <section className="relative pt-36 pb-24 bg-dark-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-fizzia-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fizzia-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            {about.hero.heading}
          </h1>
          <p className="text-lg md:text-xl text-fizzia-400 font-semibold">
            {about.hero.subtitle}
          </p>
        </div>
      </section>

      <section className="py-20 bg-dark-950 border-t border-dark-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
                {about.mission.heading}
              </h2>
              <p className="text-dark-200 leading-relaxed text-base">
                {about.mission.text}
              </p>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
                {about.origin.heading}
              </h2>
              <p className="text-dark-200 leading-relaxed text-base">
                {about.origin.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-dark-950 border-t border-dark-800">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-12 text-center">
            {about.approach.heading}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {about.approach.items.map((item, i) => (
              <div
                key={i}
                className="bg-dark-900/60 border border-dark-800 rounded-2xl p-6 hover:border-fizzia-500/30 transition-all duration-300"
              >
                <h3 className="text-white font-bold text-lg mb-3">{item.title}</h3>
                <p className="text-dark-300 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-dark-950 border-t border-dark-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fizzia-700 via-fizzia-600 to-fizzia-500 p-8 md:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
                {about.vision.heading}
              </h2>
              <p className="text-white/90 leading-relaxed text-base max-w-3xl">
                {about.vision.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-dark-950 border-t border-dark-800">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
            {about.cta.text}
          </h2>
          <a
            href="/#contacto"
            className="inline-flex items-center gap-2 px-8 py-4 bg-fizzia-500 text-white font-bold rounded-xl hover:bg-fizzia-400 transition-all shadow-lg shadow-fizzia-500/25 text-base cursor-pointer"
          >
            {about.cta.button}
          </a>
        </div>
      </section>

      <Footer />
      <AnonymousChat />
    </>
  )
}

export function AboutPage() {
  return (
    <LanguageProvider>
    <CountryProvider>
      <div className="bg-dark-950 overflow-x-hidden w-full max-w-full">
        <AboutContent />
      </div>
    </CountryProvider>
    </LanguageProvider>
  )
}
