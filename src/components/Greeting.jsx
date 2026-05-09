import { useState, useEffect } from 'react'

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

export function Greeting({ name, phrases, fallback }) {
  const [phrase] = useState(() => randomItem(phrases || [fallback]))

  return (
    <h1 className="text-3xl font-bold text-white leading-tight animate-fade-in-up">
      {getTimeGreeting()}, {name}, <Typewriter text={phrase} />
    </h1>
  )
}
