import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'

const RANDOM_CHARS = '_!X$0-+*#'

function getRandomChar(previousChar) {
  let char
  do {
    char = RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)]
  } while (char === previousChar)
  return char
}

export function SpecialText({
  children,
  speed = 20,
  delay = 0,
  className = '',
  inView = false,
  once = true,
}) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once, margin: '-100px' })
  const shouldAnimate = inView ? isInView : true
  const text = children
  const [hasStarted, setHasStarted] = useState(() => !inView && delay <= 0)
  const [displayText, setDisplayText] = useState(' '.repeat(text.length))
  const [currentPhase, setCurrentPhase] = useState('phase1')
  const [animationStep, setAnimationStep] = useState(0)
  const intervalRef = useRef(null)
  const startTimeoutRef = useRef(null)

  const clearStartTimeout = () => {
    if (startTimeoutRef.current === null) return
    window.clearTimeout(startTimeoutRef.current)
    startTimeoutRef.current = null
  }

  const startAnimation = () => {
    setHasStarted(true)
    setDisplayText(' '.repeat(text.length))
    setCurrentPhase('phase1')
    setAnimationStep(0)
  }

  useEffect(() => {
    if (shouldAnimate && !hasStarted) {
      clearStartTimeout()
      if (delay <= 0) {
        startAnimation()
        return undefined
      }
      startTimeoutRef.current = window.setTimeout(() => {
        startTimeoutRef.current = null
        startAnimation()
      }, delay * 1000)
    }

    return () => clearStartTimeout()
  }, [shouldAnimate, hasStarted, delay, text.length])

  useEffect(() => {
    if (!hasStarted) return undefined

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      if (currentPhase === 'phase1') {
        const maxSteps = text.length * 2
        const currentLength = Math.min(animationStep + 1, text.length)
        const chars = []

        for (let i = 0; i < currentLength; i += 1) {
          const previousChar = i > 0 ? chars[i - 1] : undefined
          chars.push(getRandomChar(previousChar))
        }

        for (let i = currentLength; i < text.length; i += 1) {
          chars.push('\u00A0')
        }

        setDisplayText(chars.join(''))

        if (animationStep < maxSteps - 1) {
          setAnimationStep((prev) => prev + 1)
        } else {
          setCurrentPhase('phase2')
          setAnimationStep(0)
        }
      } else {
        const revealedCount = Math.floor(animationStep / 2)
        const chars = []

        for (let i = 0; i < revealedCount && i < text.length; i += 1) {
          chars.push(text[i])
        }

        if (revealedCount < text.length) {
          chars.push(animationStep % 2 === 0 ? '_' : getRandomChar())
        }

        for (let i = chars.length; i < text.length; i += 1) {
          chars.push(getRandomChar())
        }

        setDisplayText(chars.join(''))

        if (animationStep < text.length * 2 - 1) {
          setAnimationStep((prev) => prev + 1)
        } else {
          setDisplayText(text)
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, speed)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [currentPhase, animationStep, text, speed, hasStarted])

  useEffect(() => {
    if (hasStarted) {
      setDisplayText(' '.repeat(text.length))
      setCurrentPhase('phase1')
      setAnimationStep(0)
    }

    return () => {
      clearStartTimeout()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [text, hasStarted])

  return (
    <span ref={containerRef} className={`inline-flex font-[inherit] leading-none ${className}`}>
      {displayText}
    </span>
  )
}
