import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from './Icon'
import { SpecialText } from './SpecialText'

export function AnimatedHero({
  badge,
  heading,
  animatedWords,
  description,
  primaryCta,
  secondaryCta,
  benefits = [],
  highlightTerms = [],
  className = '',
}) {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(() => animatedWords.filter(Boolean), [animatedWords])

  useEffect(() => {
    if (titles.length <= 1) return undefined

    const timeoutId = setTimeout(() => {
      setTitleNumber((current) => (current === titles.length - 1 ? 0 : current + 1))
    }, 2400)

    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  const renderHeading = () => {
    if (!highlightTerms.length) return heading

    const pattern = new RegExp(`(${highlightTerms.map(escapeRegExp).join('|')})`, 'gi')
    return heading.split(pattern).map((part, index) => {
      const isHighlighted = highlightTerms.some((term) => term.toLowerCase() === part.toLowerCase())
      if (isHighlighted && part.toLowerCase() === 'fizzia') {
        return (
          <span key={`${part}-${index}`} className="text-fizzia-400">
            {part}
          </span>
        )
      }
      return isHighlighted ? (
        <SpecialText key={`${part}-${index}`} speed={34} delay={0.15} inView className="text-fizzia-400">
          {part}
        </SpecialText>
      ) : (
        part
      )
    })
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:px-6 lg:py-24">
        {badge}

        <div className="flex max-w-4xl flex-col items-center gap-5">
          <h1 className="text-balance text-4xl font-black leading-[1.05] text-dark-50 sm:text-5xl lg:text-7xl">
            <span>{renderHeading()}</span>
            {titles.length > 0 && (
              <span className="relative mt-2 flex min-h-[1.08em] w-full justify-center overflow-hidden text-center text-fizzia-400 sm:mt-3">
                {titles.map((title, index) => (
                  <motion.span
                    key={title}
                    className="absolute font-black"
                    initial={{ opacity: 0, y: 90 }}
                    transition={{ type: 'spring', stiffness: 58, damping: 18 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : { y: titleNumber > index ? -110 : 110, opacity: 0 }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            )}
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-dark-300 md:text-xl">
            {description}
          </p>
        </div>

        <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          {primaryCta}
          {secondaryCta}
        </div>

        {benefits.length > 0 && (
          <div className="grid w-full max-w-3xl grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.label} className="flex items-center justify-center gap-2 rounded-full border border-dark-800 bg-dark-900/60 px-3 py-2 text-sm font-semibold text-dark-200">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fizzia-500/10 text-fizzia-400">
                  <Icon name={benefit.icon} size={15} />
                </span>
                <span className="truncate">{benefit.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
