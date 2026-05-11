import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

export function TrustSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const { t } = useLanguage()

  const testimonials = t('trust.testimonials')

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length)
    }, 60000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <section className="py-14 md:py-20 bg-dark-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-fizzia-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-fizzia-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-6 sm:px-12">
        {testimonials.map((test, i) => (
          <div
            key={i}
            className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${i === activeTestimonial ? 'opacity-100 block' : 'opacity-0 hidden'}`}
          >
            {i === activeTestimonial && (
              <div className="text-center">
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white italic leading-relaxed font-light max-w-6xl mx-auto">
                  &ldquo;{test.quote}
                  {test.hasFizzia && <span className="text-fizzia-400 font-bold not-italic">Fizzia</span>}
                  {test.quote2}&rdquo;
                </p>
                <div className="flex items-center justify-center gap-2 mt-5">
                  <span className="text-dark-300 font-medium text-sm uppercase tracking-wider">{test.name}</span>
                  <span className="text-dark-600 text-sm">|</span>
                  <span className="text-fizzia-500/80 text-sm">{test.location}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
