import { useEffect, useState } from 'react'
import { ChartNoAxesCombined, Fingerprint, Layers3, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui/Card'
import { useLanguage } from '../../contexts/LanguageContext'
import { getServiceSlugByName } from '../../data/servicePages'

const cardMotion = (index = 0) => ({
  initial: { opacity: 0, y: 28, scale: 0.96 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] },
  whileHover: { y: -6, scale: 1.01 },
})

const interactHandlers = (setActiveType, type) => ({
  onMouseEnter: () => setActiveType(type),
  onFocus: () => setActiveType(type),
  onPointerDown: () => setActiveType(type),
  onMouseLeave: () => setActiveType(null),
  onBlur: () => setActiveType(null),
})

function AnimatedMetric({ active }) {
  const [value, setValue] = useState(100)

  useEffect(() => {
    if (!active) {
      setValue(100)
      return undefined
    }

    setValue(0)
    const start = performance.now()
    let frameId

    const tick = (time) => {
      const progress = Math.min(1, (time - start) / 760)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(eased * 100))
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [active])

  return <span className="mx-auto block w-fit text-5xl font-black text-dark-50">{value}%</span>
}

function ServiceIcon({ type, Icon, active, small = false }) {
  const sizeClass = small ? 'size-5' : 'size-12'
  const lineBase = 'absolute h-0.5 rounded-full bg-fizzia-400/70'

  if (type === 'secure') {
    return (
      <motion.div
        className="relative flex items-center justify-center"
        animate={active ? { x: [0, -2, 2, -1, 0], scale: [1, 1.04, 1] } : { x: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Icon className={`${sizeClass} text-fizzia-500`} strokeWidth={1.35} />
        {[0, 1, 2].map((line) => (
          <motion.span
            key={line}
            className={`${lineBase} ${small ? 'right-[-10px] w-2' : 'right-[-18px] w-4'}`}
            style={{ top: `${small ? 4 + line * 6 : 12 + line * 9}px` }}
            animate={active ? { x: [0, 5, 0], opacity: [0.25, 1, 0.35] } : { x: 0, opacity: 0.25 }}
            transition={{ duration: 0.45, delay: line * 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </motion.div>
    )
  }

  if (type === 'chart') {
    return (
      <motion.div
        className="flex items-center justify-center"
        animate={active ? { y: [0, -5, 0], rotate: [0, -3, 3, 0], scale: [1, 1.08, 1] } : { y: 0, rotate: 0, scale: 1 }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      >
        <Icon className={`${sizeClass} text-fizzia-500`} strokeWidth={1.35} />
      </motion.div>
    )
  }

  if (type === 'stack') {
    return (
      <motion.div
        className="flex items-center justify-center"
        animate={active ? { y: [0, -2, 0], skewX: [0, -5, 0] } : { y: 0, skewX: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Icon className={`${sizeClass} text-fizzia-500`} strokeWidth={1.35} />
      </motion.div>
    )
  }

  if (type === 'team') {
    return (
      <motion.div
        className="flex items-center justify-center"
        animate={active ? { scale: [1, 1.12, 0.98, 1], rotate: [0, 4, -2, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
      >
        <Icon className={`${sizeClass} text-fizzia-500`} strokeWidth={1.35} />
      </motion.div>
    )
  }

  return <Icon className={`${sizeClass} text-fizzia-500`} strokeWidth={1.35} />
}

export function ServicesSection() {
  const [activeType, setActiveType] = useState(null)
  const { t } = useLanguage()
  const heading = t('businessTypes.heading')
  const services = t('services.items')
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
  const getServiceHref = (name) => {
    const slug = getServiceSlugByName(name)
    return slug ? `/servicios#${slug}` : '#servicios'
  }

  return (
    <section id="servicios" className="relative bg-dark-950 overflow-hidden py-16 md:py-20">
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

            <motion.div
              className="relative z-10 mb-12 grid grid-cols-6 gap-3"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
            >
              <motion.a href={getServiceHref(featureCards[0].title)} className="group relative col-span-full flex min-h-64 cursor-pointer overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fizzia-400 lg:col-span-2" {...cardMotion(0)} {...interactHandlers(setActiveType, featureCards[0].type)}>
              <Card className="relative flex h-full w-full overflow-hidden transition-colors duration-300 group-hover:border-fizzia-500/45">
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -right-16 -top-16 size-44 rounded-full border border-fizzia-500/25" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fizzia-400/60 to-transparent" />
                </div>
                <CardContent className="relative m-auto size-fit pt-6 text-center">
                  <motion.div className="relative mx-auto flex h-24 w-56 items-center" animate={{ rotate: [0, -1.5, 1.5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
                    <svg className="absolute inset-0 size-full text-fizzia-500/25" viewBox="0 0 254 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M112.9 97.7C140.4 97.1 171 94.7 201.1 87.5C210.4 85.3 219.6 82.6 228.3 78.2C232.2 76.3 235.9 74 239.3 71.3C241.9 69.3 244 66.8 245.6 63.9C249.3 57.3 248.3 50.5 242.5 45.6C239 42.7 235.2 40.3 231.2 38.3C219.4 32.7 207.1 28.4 194.5 25.5C184 23.2 173.4 21.8 162.6 21.3C161.4 21.4 160.1 21.2 158.9 20.8C158 20.4 156.9 19.2 157 18.5C157.1 17.9 157.4 17.4 157.7 16.9C158.1 16.5 158.6 16.1 159.1 15.8C160.1 15.5 161.3 15.4 162.4 15.5C179.8 15.4 196.6 18.8 213 24.5C221 27.2 228.8 30.5 236.4 34.1C240.5 36.1 244.2 38.7 247.5 41.8C254.3 48.3 255.7 56.9 251.8 65.5C249.8 69.9 246.7 73.7 242.9 76.6C236.2 82 228.5 85.5 220.5 88.3C205 93.8 189 96.9 172.7 99.2C153.4 101.9 134 103.5 114.5 103.8C91.1 104.2 67.9 103 45.1 97.6C36 95.6 27.3 92.2 19.2 87.5C13.8 84.6 9.2 80.6 5.4 75.8C-.5 67.7-1.1 59.2 3.3 50.3C5.8 45.4 9.3 41 13.5 37.4C24.3 27.6 37 21 50.5 15.7C68.1 8.9 86.5 5.1 105.2 2.8C129 .1 153.2 .1 177 2.9C197.7 5.2 218 9 237.6 16.4" fill="currentColor" />
                    </svg>
                    <AnimatedMetric active={activeType === featureCards[0].type} />
                  </motion.div>
                  <h3 className="mt-6 text-2xl font-bold text-dark-50">{featureCards[0].title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-dark-300">{featureCards[0].text}</p>
                </CardContent>
              </Card>
              </motion.a>

              {featureCards.slice(1, 3).map((feature) => {
                const LucideIcon = feature.icon
                return (
                  <motion.a key={feature.title} href={getServiceHref(feature.title)} className="group relative col-span-full cursor-pointer overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fizzia-400 sm:col-span-3 lg:col-span-2" {...cardMotion(featureCards.indexOf(feature))} {...interactHandlers(setActiveType, feature.type)}>
                  <Card className="relative h-full overflow-hidden transition-colors duration-300 group-hover:border-fizzia-500/45">
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fizzia-400/60 to-transparent" />
                    </div>
                    <CardContent className="pt-6">
                      <div className="relative mx-auto flex aspect-square size-32 rounded-full border border-dark-700 transition-transform duration-300 before:absolute before:-inset-2 before:rounded-full before:border before:border-dark-800 group-hover:scale-105">
                        <div className="m-auto">
                          <ServiceIcon type={feature.type} Icon={LucideIcon} active={activeType === feature.type} />
                        </div>
                      </div>
                      <div className="relative z-10 mt-6 space-y-2 text-center">
                        <h3 className="text-lg font-bold text-dark-50">{feature.title}</h3>
                        <p className="text-sm leading-relaxed text-dark-300">{feature.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                  </motion.a>
                )
              })}

              {featureCards.slice(3).map((feature, index) => {
                const LucideIcon = feature.icon
                return (
                  <motion.a key={feature.title} href={getServiceHref(feature.title)} className="group relative col-span-full cursor-pointer overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fizzia-400 lg:col-span-3" {...cardMotion(featureCards.indexOf(feature))} {...interactHandlers(setActiveType, feature.type)}>
                  <Card className="relative h-full overflow-hidden transition-colors duration-300 group-hover:border-fizzia-500/45">
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fizzia-400/60 to-transparent" />
                    </div>
                    <CardContent className="grid h-full gap-6 pt-6 sm:grid-cols-2">
                      <div className="relative z-10 flex flex-col justify-between gap-10">
                        <div className="relative flex aspect-square size-12 rounded-full border border-dark-700 before:absolute before:-inset-2 before:rounded-full before:border before:border-dark-800">
                          <div className="m-auto">
                            <ServiceIcon type={feature.type} Icon={LucideIcon} active={activeType === feature.type} small />
                          </div>
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
                  </motion.a>
                )
              })}
            </motion.div>
          </div>

        </div>
      </section>
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
