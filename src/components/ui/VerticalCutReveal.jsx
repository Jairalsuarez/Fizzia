import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { motion } from 'framer-motion'

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export const VerticalCutReveal = forwardRef(function VerticalCutReveal(
  {
    children,
    reverse = false,
    transition = {
      type: 'spring',
      stiffness: 190,
      damping: 22,
    },
    splitBy = 'words',
    staggerDuration = 0.2,
    staggerFrom = 'first',
    containerClassName,
    wordLevelClassName,
    elementLevelClassName,
    onClick,
    onStart,
    onComplete,
    autoStart = true,
    ...props
  },
  ref
) {
  const containerRef = useRef(null)
  const text = typeof children === 'string' ? children : children?.toString() || ''
  const [isAnimating, setIsAnimating] = useState(false)

  const elements = useMemo(() => {
    if (splitBy === 'lines') return text.split('\n')
    if (splitBy === 'words') return text.split(' ')
    return text.split(splitBy)
  }, [text, splitBy])

  const getStaggerDelay = useCallback(
    (index) => {
      const total = elements.length
      if (staggerFrom === 'first') return index * staggerDuration
      if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration
      if (staggerFrom === 'center') {
        const center = Math.floor(total / 2)
        return Math.abs(center - index) * staggerDuration
      }
      if (staggerFrom === 'random') return Math.abs(Math.floor(Math.random() * total) - index) * staggerDuration
      return Math.abs(staggerFrom - index) * staggerDuration
    },
    [elements.length, staggerFrom, staggerDuration]
  )

  const startAnimation = useCallback(() => {
    setIsAnimating(true)
    onStart?.()
  }, [onStart])

  useImperativeHandle(ref, () => ({
    startAnimation,
    reset: () => setIsAnimating(false),
  }))

  useEffect(() => {
    if (autoStart) startAnimation()
  }, [autoStart, startAnimation])

  const variants = {
    hidden: { y: reverse ? '-100%' : '100%' },
    visible: (index) => ({
      y: 0,
      transition: {
        ...transition,
        delay: (transition?.delay || 0) + getStaggerDelay(index),
      },
    }),
  }

  return (
    <span
      className={cn(containerClassName, 'flex flex-wrap whitespace-pre-wrap', splitBy === 'lines' && 'flex-col')}
      onClick={onClick}
      ref={containerRef}
      {...props}
    >
      <span className="sr-only">{text}</span>
      {elements.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden="true" className={cn('inline-flex overflow-hidden', wordLevelClassName)}>
          <span className={cn('relative whitespace-pre-wrap', elementLevelClassName)}>
            <motion.span
              custom={index}
              initial="hidden"
              animate={isAnimating ? 'visible' : 'hidden'}
              variants={variants}
              onAnimationComplete={index === elements.length - 1 ? onComplete : undefined}
              className="inline-block"
            >
              {word}
            </motion.span>
          </span>
          {index !== elements.length - 1 && <span> </span>}
        </span>
      ))}
    </span>
  )
})
