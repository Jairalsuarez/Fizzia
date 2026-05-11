import { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '../ui/Icon'
import { useLanguage } from '../../contexts/LanguageContext'

export function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0)
  const sectionRef = useRef(null)
  const stepRefs = useRef([])
  const { t } = useLanguage()

  const steps = t('process.steps')
  const heading = t('process.heading')

  const setStepRef = useCallback((el, i) => {
    stepRefs.current[i] = el
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.index)
            if (!isNaN(idx)) setActiveStep((prev) => Math.max(prev, idx))
          }
        })
      },
      { threshold: 0.15 }
    )

    const refs = stepRefs.current
    refs.forEach((r) => { if (r) observer.observe(r) })
    return () => refs.forEach((r) => { if (r) observer.unobserve(r) })
  }, [])

  return (
    <section id="proceso" ref={sectionRef} className="relative py-16 md:py-20 bg-dark-950 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-fizzia-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-fizzia-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6">
        <div className="text-center mb-12 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
            {heading[0]}{' '}
            <span className="text-fizzia-400">{heading[1]}</span>
          </h2>
        </div>

        <div className="relative">
          {steps.map((step, i) => {
            const isActive = i <= activeStep
            const isCurrent = i === activeStep
            const isPast = i < activeStep
            const isLast = i === steps.length - 1
            const isFirst = i === 0

            return (
              <div
                key={step.title}
                ref={(el) => setStepRef(el, i)}
                data-index={i}
                className="group relative flex items-start gap-4 md:gap-6 pb-10 md:pb-12 last:pb-0"
              >
                {/* Left column: circle + curved connector */}
                <div className="relative flex flex-col items-center flex-shrink-0 w-12 md:w-16">
                  {!isLast && (
                    <div className="absolute top-12 md:top-16 bottom-0 left-1/2 -translate-x-1/2 w-8 overflow-visible">
                      {/* Gray background curve */}
                      <svg className="w-full h-full" viewBox="0 0 32 200" preserveAspectRatio="none">
                        <path
                          d="M 16 0 C 16 50, 40 50, 40 100 C 40 150, 16 150, 16 200"
                          fill="none"
                          stroke="#2d2d2d"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Green animated curve */}
                      <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 32 200"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M 16 0 C 16 50, 40 50, 40 100 C 40 150, 16 150, 16 200"
                          fill="none"
                          stroke="#44a64a"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray="400"
                          strokeDashoffset={isActive ? '0' : '400'}
                          style={{
                            transition: `stroke-dashoffset 0.62s cubic-bezier(0.22,1,0.36,1) ${i * 0.06 + 0.08}s`,
                          }}
                        />
                      </svg>
                    </div>
                  )}

                  <div
                    className={`relative z-10 flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] ${
                      isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-45'
                    }`}
                    style={{
                      transitionDelay: isActive ? `${i * 0.06}s` : '0s',
                    }}
                  >
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isCurrent
                          ? 'bg-fizzia-500 border-fizzia-400 text-white shadow-[0_0_28px_rgba(68,166,74,0.28)]'
                          : isPast
                          ? 'bg-fizzia-500/20 border-fizzia-500/60 text-fizzia-300 shadow-[0_0_16px_4px_rgba(68,166,74,0.2)]'
                          : 'bg-dark-900 border-dark-700 text-dark-400'
                      }`}
                    >
                      {isFirst ? (
                        <Icon name="play_arrow" size={22} />
                      ) : isLast ? (
                        <Icon name="flag" size={20} />
                      ) : (
                        <span className="text-base md:text-lg font-black">{i + 1}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column: content */}
                <div
                    className={`flex-1 min-w-0 pt-1.5 md:pt-3 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-55 translate-y-2'
                    }`}
                    style={{
                      transitionDelay: isActive ? `${i * 0.06 + 0.08}s` : '0s',
                    }}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3
                      className={`font-black text-base md:text-lg transition-colors duration-300 ${
                        isCurrent
                          ? 'text-fizzia-400'
                          : isPast
                          ? 'text-white'
                          : 'text-dark-300'
                      }`}
                    >
                      {step.title}
                    </h3>
                    {isFirst && (
                      <span className="px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full bg-fizzia-500/15 text-fizzia-400 border border-fizzia-500/30">
                        {t('process.startBadge')}
                      </span>
                    )}
                    {isLast && (
                      <span className="px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {t('process.goalBadge')}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm md:text-base leading-relaxed transition-colors duration-300 ${
                      isActive ? 'text-dark-200' : 'text-dark-500'
                    }`}
                  >
                    {step.text}
                  </p>

                  {/* Hover CTA: step 1 shows "Crear cuenta" */}
                  {isFirst && (
                    <div className="mt-3 overflow-hidden">
                      <div className="transition-all duration-200 -translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                        <a
                          href="/register"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-fizzia-500 text-white hover:bg-fizzia-400 transition-colors duration-200 shadow-lg shadow-fizzia-500/25"
                        >
                          <Icon name="person_add" size={14} />
                          {t('header.createAccount')}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Hover: other steps show icon */}
                  {!isFirst && !isLast && (
                    <div className="mt-2 overflow-hidden">
                      <div className="transition-all duration-200 -translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1 text-fizzia-500/60 text-xs">
                          <Icon name={step.icon} size={14} />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
