import { useRef, useEffect, useState } from 'react'
import { ChartNoAxesCombined, Fingerprint, Layers3, ShieldCheck } from 'lucide-react'
import { Icon } from '../ui/Icon'
import { Card, CardContent } from '../ui/Card'
import { useLanguage } from '../../contexts/LanguageContext'

export function ServicesSection() {
  const { t } = useLanguage()
  const businesses = t('businessTypes.items')
  const heading = t('businessTypes.heading')
  const services = t('services.items')
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const isPausedRef = useRef(false)
  const [selected, setSelected] = useState(null)
  const featureCards = [
    {
      metric: '100%',
      title: services[0]?.name,
      text: services[0]?.description,
      type: 'custom',
    },
    {
      icon: Fingerprint,
      title: services[1]?.name,
      text: services[1]?.description,
      type: 'secure',
    },
    {
      icon: ChartNoAxesCombined,
      title: services[4]?.name,
      text: services[4]?.description,
      type: 'chart',
    },
    {
      icon: Layers3,
      title: services[3]?.name,
      text: services[3]?.description,
      type: 'stack',
    },
    {
      icon: ShieldCheck,
      title: services[2]?.name,
      text: services[2]?.description,
      type: 'team',
    },
  ]

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const container = track.parentElement

    let progress = 0
    let isAuto = true
    let scrollTimeout
    let lastTime = 0
    const SPEED = window.innerWidth < 768 ? 0.000006 : 0.000012

    const apply = () => {
      const maxMove = Math.max(0, track.scrollWidth - container.clientWidth)
      track.style.transform = `translateX(${-progress * maxMove}px)`
    }

    const onScroll = () => {
      if (isPausedRef.current) return
      const rect = section.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) return
      progress = Math.max(0, Math.min(1, -rect.top / scrollable))
      isAuto = false
      apply()
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => { isAuto = true; lastTime = 0 }, 500)
    }

    let rafId
    const animate = (time) => {
      if (!isPausedRef.current && isAuto) {
        if (lastTime === 0) lastTime = time
        progress += (time - lastTime) * SPEED
        if (progress >= 1) progress = 0
        lastTime = time
        apply()
      } else {
        lastTime = 0
      }
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
      clearTimeout(scrollTimeout)
    }
  }, [businesses.length])

  const openModal = (business) => {
    isPausedRef.current = true
    setSelected(business)
  }

  const closeModal = () => {
    isPausedRef.current = false
    setSelected(null)
  }

  return (
    <>
      <section id="servicios" ref={sectionRef} className="relative bg-dark-950 overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-fizzia-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div>
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                {heading[0]} <br />
                {heading[1]} <span className="text-fizzia-400">{heading[2]}</span>
              </h2>
            </div>

            <div className="relative z-10 mb-12 grid grid-cols-6 gap-3">
              <Card className="relative col-span-full flex min-h-64 overflow-hidden lg:col-span-2">
                <CardContent className="relative m-auto size-fit pt-6 text-center">
                  <div className="relative mx-auto flex h-24 w-56 items-center">
                    <svg className="absolute inset-0 size-full text-fizzia-500/25" viewBox="0 0 254 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M112.9 97.7C140.4 97.1 171 94.7 201.1 87.5C210.4 85.3 219.6 82.6 228.3 78.2C232.2 76.3 235.9 74 239.3 71.3C241.9 69.3 244 66.8 245.6 63.9C249.3 57.3 248.3 50.5 242.5 45.6C239 42.7 235.2 40.3 231.2 38.3C219.4 32.7 207.1 28.4 194.5 25.5C184 23.2 173.4 21.8 162.6 21.3C161.4 21.4 160.1 21.2 158.9 20.8C158 20.4 156.9 19.2 157 18.5C157.1 17.9 157.4 17.4 157.7 16.9C158.1 16.5 158.6 16.1 159.1 15.8C160.1 15.5 161.3 15.4 162.4 15.5C179.8 15.4 196.6 18.8 213 24.5C221 27.2 228.8 30.5 236.4 34.1C240.5 36.1 244.2 38.7 247.5 41.8C254.3 48.3 255.7 56.9 251.8 65.5C249.8 69.9 246.7 73.7 242.9 76.6C236.2 82 228.5 85.5 220.5 88.3C205 93.8 189 96.9 172.7 99.2C153.4 101.9 134 103.5 114.5 103.8C91.1 104.2 67.9 103 45.1 97.6C36 95.6 27.3 92.2 19.2 87.5C13.8 84.6 9.2 80.6 5.4 75.8C-.5 67.7-1.1 59.2 3.3 50.3C5.8 45.4 9.3 41 13.5 37.4C24.3 27.6 37 21 50.5 15.7C68.1 8.9 86.5 5.1 105.2 2.8C129 .1 153.2 .1 177 2.9C197.7 5.2 218 9 237.6 16.4" fill="currentColor" />
                    </svg>
                    <span className="mx-auto block w-fit text-5xl font-black text-dark-50">{featureCards[0].metric}</span>
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-dark-50">{featureCards[0].title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-dark-300">{featureCards[0].text}</p>
                </CardContent>
              </Card>

              {featureCards.slice(1, 3).map((feature) => {
                const LucideIcon = feature.icon
                return (
                  <Card key={feature.title} className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                    <CardContent className="pt-6">
                      <div className="relative mx-auto flex aspect-square size-32 rounded-full border border-dark-700 before:absolute before:-inset-2 before:rounded-full before:border before:border-dark-800">
                        <LucideIcon className="m-auto size-12 text-fizzia-500" strokeWidth={1.35} />
                      </div>
                      <div className="relative z-10 mt-6 space-y-2 text-center">
                        <h3 className="text-lg font-bold text-dark-50">{feature.title}</h3>
                        <p className="text-sm leading-relaxed text-dark-300">{feature.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {featureCards.slice(3).map((feature, index) => {
                const LucideIcon = feature.icon
                return (
                  <Card key={feature.title} className="relative col-span-full overflow-hidden lg:col-span-3">
                    <CardContent className="grid h-full gap-6 pt-6 sm:grid-cols-2">
                      <div className="relative z-10 flex flex-col justify-between gap-10">
                        <div className="relative flex aspect-square size-12 rounded-full border border-dark-700 before:absolute before:-inset-2 before:rounded-full before:border before:border-dark-800">
                          <LucideIcon className="m-auto size-5 text-fizzia-500" strokeWidth={1.4} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-dark-50">{feature.title}</h3>
                          <p className="text-sm leading-relaxed text-dark-300">{feature.text}</p>
                        </div>
                      </div>
                      <div className="relative min-h-44 overflow-hidden rounded-xl border border-dark-800 bg-dark-950/70 p-4">
                        <div className="absolute left-4 top-3 flex gap-1.5">
                          <span className="size-2 rounded-full bg-fizzia-500/60" />
                          <span className="size-2 rounded-full bg-dark-700" />
                          <span className="size-2 rounded-full bg-dark-700" />
                        </div>
                        {index === 0 ? <InventoryGraph /> : <ClientFlow />}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <div className="border-y border-dark-800/60 bg-dark-900/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-fizzia-500/5 via-transparent to-violet-500/5 pointer-events-none" />
            <div className="mx-auto max-w-full overflow-hidden">
              <div
                ref={trackRef}
                className="flex gap-4 px-6 py-7 md:px-8 md:py-8 will-change-transform"
              >
                {businesses.concat(businesses).map((business, i) => (
                  <button
                    key={`${business.name}-${i}`}
                    onClick={() => openModal(business)}
                    className="group inline-flex shrink-0 items-center gap-3 rounded-full px-3 py-2 text-left transition-colors duration-200 hover:bg-fizzia-500/10 cursor-pointer"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fizzia-500/10 text-fizzia-400 transition-colors duration-200 group-hover:bg-fizzia-500/20 group-hover:text-fizzia-300">
                      <Icon name={business.icon || 'storefront'} size={19} />
                    </div>
                    <span className="whitespace-nowrap text-sm font-bold text-dark-200 transition-colors duration-200 group-hover:text-white">
                      {business.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-dark-900 border border-dark-700/80 rounded-2xl p-8 max-w-lg w-full shadow-2xl shadow-black/50 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700 transition-colors cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>

            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-fizzia-500/10 text-fizzia-400 mb-5">
              <Icon name={selected.icon || 'code'} size={28} />
            </div>

            <h3 className="text-white text-xl font-bold mb-4 leading-snug">
              {selected.name}
            </h3>

            <p className="text-dark-300 text-sm leading-relaxed mb-8">
              {selected.details}
            </p>

            <a
              href="/register"
              className="block w-full text-center py-3 px-6 rounded-xl bg-fizzia-500 hover:bg-fizzia-400 text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-fizzia-500/20"
            >
              {t('businessTypes.cta')}
            </a>
          </div>
        </div>
      )}
    </>
  )
}

function InventoryGraph() {
  return (
    <svg className="mt-10 h-36 w-full text-fizzia-500" viewBox="0 0 360 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 130C24 116 35 92 56 96C78 100 79 128 102 121C124 114 129 70 151 73C174 76 176 118 202 110C226 102 228 52 252 54C280 56 281 123 310 101C330 86 340 61 360 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M0 130C24 116 35 92 56 96C78 100 79 128 102 121C124 114 129 70 151 73C174 76 176 118 202 110C226 102 228 52 252 54C280 56 281 123 310 101C330 86 340 61 360 42V150H0V130Z" fill="currentColor" opacity=".12" />
    </svg>
  )
}

function ClientFlow() {
  const names = ['Cliente', 'Pedido', 'Pago']
  return (
    <div className="flex h-full min-h-36 flex-col justify-center gap-5 pt-8">
      {names.map((name, index) => (
        <div key={name} className={`flex items-center gap-3 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <span className="rounded-lg border border-dark-800 bg-dark-900 px-3 py-1.5 text-xs font-semibold text-dark-200">{name}</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-fizzia-500/12 text-xs font-black text-fizzia-500">{index + 1}</span>
        </div>
      ))}
    </div>
  )
}
