import { useState, useEffect, useRef } from 'react'

const navItems = [
  { label: 'Inicio', id: 'inicio' },
  { label: 'Servicios', id: 'servicios' },
  { label: 'Proyectos', id: 'proyectos' },
  { label: 'Proceso', id: 'proceso' },
  { label: 'Contacto', id: 'contacto' },
]

export function Header() {
  const [activeSection, setActiveSection] = useState('inicio')
  const navRef = useRef(null)
  const lockedRef = useRef(false)

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-80px 0px -40% 0px',
      threshold: 0.1,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !lockedRef.current) {
          setActiveSection(entry.target.id)
        }
      })
    }, options)

    const sections = document.querySelectorAll('section[id], [id="inicio"]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const handleNavClick = (e, id) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (!target) return

    const navHeight = navRef.current ? navRef.current.offsetHeight : 80
    const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight

    lockedRef.current = true
    setActiveSection(id)

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    })

    let released = false
    const release = () => {
      if (released) return
      released = true
      lockedRef.current = false
    }

    window.addEventListener('scrollend', release, { once: true })
    setTimeout(release, 1000)
  }

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-dark-950/85 backdrop-blur-xl border-b border-dark-800/60"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a href="#inicio" className="flex items-center gap-2">
              <img src="/images/Solo la figura del logo.png" alt="Fizzia" className="h-8 w-auto" onError={(e) => { e.target.style.display = 'none' }} />
              <span className="text-fizzia-500 font-black text-2xl">Fizzia</span>
            </a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  activeSection === item.id
                    ? 'text-fizzia-300 bg-fizzia-500/10'
                    : 'text-dark-200 hover:text-white hover:bg-dark-900'
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <span className="absolute bottom-1.5 left-3 right-3 h-px bg-fizzia-400 rounded-full" />
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="text-dark-300 hover:text-white text-sm font-medium transition-colors px-3 py-2"
            >
              Ingresar
            </a>
            <a
              href="/register"
              className="bg-fizzia-500 hover:bg-fizzia-400 active:translate-y-px text-white px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-fizzia-500/20 hover:shadow-fizzia-500/30"
            >
              Crear cuenta gratis
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
