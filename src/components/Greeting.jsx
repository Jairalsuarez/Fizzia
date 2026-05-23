import { useState, useEffect } from 'react'

const WELCOME_KEY = 'fizzia_welcome_rotate'

export function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function Typewriter({ text, speed = 40 }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!text) return
    let i = 0
    setDisplayed('')
    setDone(false)
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return (
    <span>
      {displayed}
      {!done && <span className="animate-blink text-[var(--accent)]">|</span>}
    </span>
  )
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function isWelcomeEnabled() {
  try {
    return JSON.parse(localStorage.getItem(WELCOME_KEY)) !== false
  } catch {
    return true
  }
}

export function Greeting({ name, phrases, fallback }) {
  const [phrase] = useState(() => randomItem(phrases || [fallback]))
  const [enabled, setEnabled] = useState(isWelcomeEnabled)

  useEffect(() => {
    const handler = () => setEnabled(isWelcomeEnabled())
    window.addEventListener('storage', handler)
    window.addEventListener('fizzia-welcome-change', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('fizzia-welcome-change', handler)
    }
  }, [])

  return (
    <h1 className="text-3xl font-bold text-white leading-tight animate-fade-in-up">
      {getTimeGreeting()}, {name}{enabled ? <>, <Typewriter text={phrase} /></> : ''}
    </h1>
  )
}
