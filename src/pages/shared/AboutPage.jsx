import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Code2, Mail, MessageCircle } from 'lucide-react'
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext'
import { CountryProvider } from '../../contexts/CountryContext'
import { Header } from '../../components/landing/Header'
import { Footer } from '../../components/landing/Footer'
import { VerticalCutReveal } from '../../components/ui/VerticalCutReveal'

function Reveal({ children, className = '', delay = 0, as: Component = 'div', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -18, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ delay, duration: 0.5 }}
      className={className}
      {...props}
    >
      {Component === 'div' ? children : <Component>{children}</Component>}
    </motion.div>
  )
}

function AboutContent() {
  const heroRef = useRef(null)
  const { t, lang } = useLanguage()
  const about = t('about')
  const isEs = lang === 'es'

  const socials = [
    { href: 'mailto:fizziadev@outlook.com', label: 'Correo', icon: Mail },
    { href: 'https://github.com/Jairalsuarez', label: 'GitHub', icon: Code2 },
    { href: 'https://www.facebook.com/profile.php?id=61589954188509', label: 'Facebook', text: 'f' },
    { href: 'https://wa.me/593989200977', label: 'WhatsApp', icon: MessageCircle },
  ]

  return (
    <>
      <Header />

      <main className="landing-page bg-dark-950 text-dark-50 overflow-x-hidden">
        <section ref={heroRef} className="relative overflow-hidden bg-dark-950 px-4 pb-20 pt-28 md:px-8 md:pb-28">
          <div className="mx-auto max-w-6xl">
            <div className="relative">
              <div className="absolute -top-3 z-10 flex w-[80%] items-center justify-between sm:top-0 sm:w-[82%] lg:top-4 lg:w-[84%]">
                <Reveal className="flex items-center gap-2 text-xl">
                  <span className="text-fizzia-500 animate-spin" style={{ animationDuration: '6s' }}>✱</span>
                  <span className="text-sm font-bold uppercase tracking-[0.18em] text-dark-300">
                    {isEs ? 'Quiénes somos' : 'Who we are'}
                  </span>
                </Reveal>

                <div className="flex gap-2 sm:gap-3">
                  {socials.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <Reveal key={item.label} delay={index * 0.08}>
                        <a
                          href={item.href}
                          target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                          rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                          aria-label={item.label}
                          className="flex size-8 items-center justify-center rounded-lg border border-dark-800 bg-dark-900 text-dark-300 transition-colors hover:text-fizzia-500 sm:size-9"
                        >
                          {Icon ? <Icon size={16} /> : <span className="text-base font-black leading-none">{item.text}</span>}
                        </a>
                      </Reveal>
                    )
                  })}
                </div>
              </div>

              <Reveal delay={0.25} className="relative overflow-hidden rounded-[2rem]">
                <svg className="w-full" viewBox="0 0 100 40" role="img" aria-label={isEs ? 'Equipo trabajando en una aplicacion' : 'Team working on an application'}>
                  <defs>
                    <clipPath id="about-clip-inverted" clipPathUnits="objectBoundingBox">
                      <path d="M0.0998072 1H0.422076H0.749756C0.767072 1 0.774207 0.961783 0.77561 0.942675V0.807325C0.777053 0.743631 0.791844 0.731953 0.799059 0.734076H0.969813C0.996268 0.730255 1.00088 0.693206 0.999875 0.675159V0.0700637C0.999875 0.0254777 0.985045 0.00477707 0.977629 0H0.902473C0.854975 0 0.890448 0.138535 0.850165 0.138535H0.0204424C0.00408849 0.142357 0 0.180467 0 0.199045V0.410828C0 0.449045 0.0136283 0.46603 0.0204424 0.469745H0.0523086C0.0696245 0.471019 0.0735527 0.497877 0.0733523 0.511146V0.915605C0.0723903 0.983121 0.090588 1 0.0998072 1Z" />
                    </clipPath>
                  </defs>
                  <image
                    clipPath="url(#about-clip-inverted)"
                    preserveAspectRatio="xMidYMid slice"
                    width="100%"
                    height="100%"
                    href="/images/trabajando.png"
                  />
                </svg>
              </Reveal>

              <div className="h-8" />
            </div>

            <div className="grid gap-10 pt-10 md:grid-cols-3">
              <div className="md:col-span-2">
                <h1 className="mb-8 text-3xl font-black leading-[1.05] text-dark-50 sm:text-4xl md:text-6xl">
                  <VerticalCutReveal
                    splitBy="words"
                    staggerDuration={0.08}
                    reverse
                    transition={{
                      type: 'spring',
                      stiffness: 250,
                      damping: 30,
                      delay: 0.3,
                    }}
                  >
                    {about.hero.heading}
                  </VerticalCutReveal>
                </h1>

                <Reveal delay={0.2} className="grid gap-8 text-dark-300 md:grid-cols-2">
                  <p className="text-sm leading-relaxed sm:text-base">
                    {about.mission.text}
                  </p>
                  <p className="text-sm leading-relaxed sm:text-base">
                    {about.origin.text}
                  </p>
                </Reveal>
              </div>

              <aside className="md:col-span-1 md:text-right">
                <Reveal className="mb-2 text-3xl font-black text-fizzia-500">
                  FIZZIA
                </Reveal>
                <Reveal delay={0.08} className="mb-8 text-sm text-dark-300">
                  {about.hero.subtitle}
                </Reveal>

                <Reveal delay={0.16} className="mb-6">
                  <p className="font-semibold text-dark-50">
                    {about.cta.text}
                  </p>
                </Reveal>

                <Reveal delay={0.24}>
                  <a
                    href="/#contacto"
                    className="ml-auto inline-flex w-fit items-center gap-2 rounded-lg border border-dark-700 bg-dark-50 px-5 py-3 font-bold text-dark-950 shadow-lg transition-all duration-300 hover:gap-4"
                  >
                    {about.cta.button}
                    <ArrowRight size={18} />
                  </a>
                </Reveal>
              </aside>
            </div>

            <div className="mt-16 grid gap-6 border-t border-dark-800 pt-10 md:grid-cols-4">
              {about.approach.items.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.08} className="border-l border-dark-800 pl-5">
                  <h2 className="mb-2 font-bold text-dark-50">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-dark-300">{item.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export function AboutPage() {
  return (
    <LanguageProvider>
      <CountryProvider>
        <AboutContent />
      </CountryProvider>
    </LanguageProvider>
  )
}
