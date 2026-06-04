import { useEffect, useRef, useState } from 'react'
import { Icon } from '../ui/Icon'
import { useLanguage } from '../../contexts/LanguageContext'

export function BusinessCarousel() {
  const { t } = useLanguage()
  const businesses = t('businessTypes.items')
  const [selected, setSelected] = useState(null)
  const trackRef = useRef(null)
  const pausedRef = useRef(false)
  const offsetRef = useRef(0)
  const dragRef = useRef({ active: false, startX: 0, startOffset: 0, moved: false })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let rafId
    let lastTime = 0
    const speed = window.innerWidth < 768 ? 0.035 : 0.052
    const normalize = (value, width) => ((value % width) + width) % width

    const applyOffset = () => {
      const loopWidth = track.scrollWidth / 2
      if (!loopWidth) return
      offsetRef.current = normalize(offsetRef.current, loopWidth)
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
    }

    const animate = (time) => {
      if (!pausedRef.current) {
        if (!lastTime) lastTime = time
        const loopWidth = track.scrollWidth / 2
        offsetRef.current = (offsetRef.current + (time - lastTime) * speed) % loopWidth
        applyOffset()
        lastTime = time
      } else {
        lastTime = 0
      }
      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const moveTrack = (clientX) => {
    const track = trackRef.current
    if (!track) return
    const loopWidth = track.scrollWidth / 2
    if (!loopWidth) return

    const delta = clientX - dragRef.current.startX
    if (Math.abs(delta) > 4) dragRef.current.moved = true
    offsetRef.current = dragRef.current.startOffset - delta
    offsetRef.current = ((offsetRef.current % loopWidth) + loopWidth) % loopWidth
    track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
  }

  const handlePointerDown = (event) => {
    pausedRef.current = true
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startOffset: offsetRef.current,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current.active) return
    moveTrack(event.clientX)
  }

  const handlePointerUp = (event) => {
    dragRef.current.active = false
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    window.setTimeout(() => {
      pausedRef.current = false
      dragRef.current.moved = false
    }, event.pointerType === 'touch' ? 500 : 120)
  }

  const openModal = (business) => {
    if (dragRef.current.moved || window.matchMedia('(max-width: 767px)').matches) return
    pausedRef.current = true
    setSelected(business)
  }

  const closeModal = () => {
    pausedRef.current = false
    setSelected(null)
  }

  return (
    <>
      <section className="relative overflow-hidden border-y border-dark-800/60 bg-dark-950 py-4 md:py-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-dark-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-dark-950 to-transparent" />

        <div
          className="touch-pan-y overflow-hidden"
          onMouseEnter={() => { pausedRef.current = true }}
          onMouseLeave={() => { pausedRef.current = false }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div ref={trackRef} className="flex w-max gap-3 px-6 will-change-transform">
            {businesses.concat(businesses).map((business, index) => (
              <button
                key={`${business.name}-${index}`}
                type="button"
                onClick={() => openModal(business)}
                className="group inline-flex shrink-0 cursor-grab items-center gap-3 rounded-full border border-dark-800 bg-dark-900/70 px-3 py-2 text-left shadow-sm transition-all duration-200 hover:border-fizzia-400 hover:bg-fizzia-500 hover:text-white hover:shadow-lg hover:shadow-fizzia-500/20 active:cursor-grabbing md:cursor-pointer"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fizzia-500/10 text-fizzia-400 transition-colors duration-200 group-hover:bg-white/20 group-hover:text-white">
                  <Icon name={business.icon || 'storefront'} size={19} />
                </span>
                <span className="whitespace-nowrap text-sm font-black text-dark-100 transition-colors duration-200 group-hover:text-white">
                  {business.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-2xl border border-dark-700/80 bg-dark-900 p-8 shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-dark-800 text-dark-400 transition-colors hover:bg-dark-700 hover:text-white"
            >
              <Icon name="close" size={18} />
            </button>

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-fizzia-500/10 text-fizzia-400">
              <Icon name={selected.icon || 'code'} size={28} />
            </div>

            <h3 className="mb-4 text-xl font-black leading-snug text-white">
              {selected.name}
            </h3>

            <p className="mb-8 text-sm leading-relaxed text-dark-300">
              {selected.details}
            </p>

            <a
              href="/register"
              className="block rounded-xl bg-fizzia-500 px-6 py-3 text-center text-sm font-black text-white transition-all duration-200 hover:bg-fizzia-400 hover:shadow-lg hover:shadow-fizzia-500/20"
            >
              {t('businessTypes.cta')}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
