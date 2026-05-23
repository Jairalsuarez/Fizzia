import { useEffect, useRef } from 'react'

const COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899']
const SHAPES = ['■', '●', '▲', '★']

export function Confetti({ active, onDone }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const w = window.innerWidth
    const h = window.innerHeight
    const particles = Array.from({ length: 100 }, () => {
      const el = document.createElement('div')
      const size = 10 + Math.random() * 14
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const startX = Math.random() * w
      const startY = Math.random() * h * -1
      el.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)]
      Object.assign(el.style, {
        position: 'fixed',
        left: `${startX}px`,
        top: `${startY}px`,
        fontSize: `${size}px`,
        color,
        lineHeight: '1',
        userSelect: 'none',
        pointerEvents: 'none',
        willChange: 'transform, top',
        zIndex: '9999',
      })
      document.body.appendChild(el)
      return {
        el, x: startX, y: startY,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * 360,
        rv: (Math.random() - 0.5) * 8,
        size,
      }
    })

    let frame
    const start = performance.now()

    function animate() {
      const elapsed = performance.now() - start
      let alive = false
      for (const p of particles) {
        p.y += p.vy
        p.x += p.vx
        p.rot += p.rv
        p.el.style.top = `${p.y}px`
        p.el.style.left = `${p.x}px`
        p.el.style.transform = `rotate(${p.rot}deg)`
        if (p.y < h + 50) alive = true
      }
      if (elapsed < 3500 && alive) {
        frame = requestAnimationFrame(animate)
      } else {
        particles.forEach(p => p.el.remove())
        onDone?.()
      }
    }
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      particles.forEach(p => p.el.remove())
    }
  }, [active, onDone])

  return null
}
