import { LanguageProvider } from '../../contexts/LanguageContext'
import { CountryProvider } from '../../contexts/CountryContext'
import { Header } from '../../components/landing/Header'
import { Footer } from '../../components/landing/Footer'
import { AnonymousChat } from '../../components/landing/AnonymousChat'
import { useLanguage } from '../../contexts/LanguageContext'

function AboutContent() {
  const { t, language } = useLanguage()
  const about = t('about')

  return (
    <>
      <Header />

      {/* Hero — big, minimal, with a floating element */}
      <section className="relative min-h-[70dvh] flex items-center bg-dark-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-fizzia-500/4 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-fizzia-600/5 rounded-full blur-3xl" />
          <div className="absolute top-10 left-10 w-32 h-32 border border-fizzia-500/10 rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-24">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
            {about.hero.heading}
          </h1>
          <p className="text-xl md:text-2xl text-fizzia-400 font-semibold">
            {about.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Mission — narrative paragraph, no box */}
      <section className="relative py-24 bg-dark-950 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent" />
        <div className="max-w-3xl mx-auto px-6">
          <span className="text-fizzia-400 text-xs font-bold uppercase tracking-[0.2em]">
            {about.mission.heading}
          </span>
          <p className="text-white/85 text-lg md:text-xl leading-relaxed mt-6">
            {about.mission.text}
          </p>
        </div>
      </section>

      {/* Origin — with photo placeholder and more narrative */}
      <section className="relative py-24 bg-dark-950 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent" />
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-10 items-center">
            <div className="md:col-span-3">
              <span className="text-fizzia-400 text-xs font-bold uppercase tracking-[0.2em]">
                {about.origin.heading}
              </span>
              <p className="text-white/85 text-lg md:text-xl leading-relaxed mt-6">
                {about.origin.text}
              </p>
            </div>
            <div className="md:col-span-2 relative">
              <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-fizzia-500/20 via-dark-800 to-dark-900 border border-dark-700 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/40 to-transparent" />
                <div className="text-center p-6 relative">
                  <span className="text-6xl">🇪🇨</span>
                  <p className="text-dark-400 text-sm mt-3">
                    {language === 'es' ? 'Ecuador, nuestro origen' : 'Ecuador, our origin'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Approach — conversational bullets, no cards */}
      <section className="relative py-24 bg-dark-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-fizzia-500/3 rounded-full blur-3xl" />
        </div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent" />
        <div className="max-w-3xl mx-auto px-6 relative">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6 text-center">
            {about.approach.heading}
          </h2>
          <p className="text-dark-400 text-center mb-14 max-w-lg mx-auto">
            {language === 'es'
              ? 'No trabajamos con fórmulas. Cada proyecto es diferente y eso nos gusta.'
              : 'We don\'t work with formulas. Every project is different and we like it that way.'}
          </p>
          <div className="space-y-10">
            {about.approach.items.map((item, i) => (
              <div key={i} className="relative pl-10 border-l-2 border-dark-800 hover:border-fizzia-500/40 transition-colors duration-500">
                <span className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-dark-800 border-2 border-dark-700 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-fizzia-400" />
                </span>
                <h3 className="text-white font-bold text-lg mb-1.5">{item.title}</h3>
                <p className="text-dark-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision — full-width gradient moment */}
      <section className="relative py-32 bg-dark-950 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fizzia-700/80 via-fizzia-600/60 to-fizzia-500/40 p-10 md:p-16">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
            <div className="relative">
              <span className="text-white/70 text-xs font-bold uppercase tracking-[0.2em]">
                {about.vision.heading}
              </span>
              <p className="text-white/92 text-lg md:text-xl leading-relaxed mt-6 max-w-3xl">
                {about.vision.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 bg-dark-950 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent" />
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-dark-400 text-sm mb-2">
            {language === 'es' ? 'Conversemos sin compromiso' : 'Let\'s chat, no strings attached'}
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8">
            {about.cta.text}
          </h2>
          <a
            href="/#contacto"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-fizzia-500 text-white font-bold rounded-xl hover:bg-fizzia-400 transition-all shadow-lg shadow-fizzia-500/25 text-base hover:shadow-fizzia-500/40 cursor-pointer"
          >
            {about.cta.button}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
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
