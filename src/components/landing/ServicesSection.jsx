import { useRef, useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import { useLanguage } from '../../contexts/LanguageContext'

export function ServicesSection() {
  const { t } = useLanguage()
  const services = t('services.items')
  const heading = t('services.heading')
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const isPausedRef = useRef(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const container = track.parentElement

    let progress = 0
    let isAuto = true
    let scrollTimeout
    let lastTime = 0
    const SPEED = 0.00008

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
  }, [services.length])

  const openModal = (service) => {
    isPausedRef.current = true
    setSelected(service)
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
          </div>

          <div className="border-t border-b border-dark-800/60 bg-dark-900/30 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-fizzia-500/5 via-transparent to-violet-500/5 pointer-events-none" />
            <div className="mx-auto max-w-full overflow-hidden">
              <div
                ref={trackRef}
                className="flex gap-5 px-6 py-8 md:px-8 md:py-10 will-change-transform"
              >
                {services.concat(services).map((service, i) => (
                  <button
                    key={`${service.name}-${i}`}
                    onClick={() => openModal(service)}
                    className="group shrink-0 w-72 md:w-80 p-6 md:p-7 rounded-xl bg-dark-950/60 border border-dark-800/60 hover:border-fizzia-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fizzia-500/10 text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-fizzia-500/10 text-fizzia-400 mb-5 group-hover:bg-fizzia-500/20 group-hover:scale-[1.04] transition-all duration-200">
                      <Icon name={service.icon || 'code'} size={24} />
                    </div>
                    <h3 className="text-white font-bold text-base mb-3 group-hover:text-fizzia-100 transition-colors duration-200 leading-snug">
                      {service.name}
                    </h3>
                    <p className="text-dark-400 text-sm leading-relaxed group-hover:text-dark-300 transition-colors duration-200">
                      {service.description}
                    </p>
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
              {t('header.createAccount')}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
