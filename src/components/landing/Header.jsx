import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

export function Header() {
  const [activeSection, setActiveSection] = useState('inicio')
  const [langOpen, setLangOpen] = useState(false)
  const navRef = useRef(null)
  const lockedRef = useRef(false)
  const { lang, setLang, t } = useLanguage()

  const navItems = t('header.nav')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !lockedRef.current) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -40% 0px', threshold: 0.1 }
    )

    const sections = document.querySelectorAll('section[id]')
    sections.forEach((s) => observer.observe(s))

    return () => observer.disconnect()
  }, [])

  const isHome = window.location.pathname === '/'

  const handleNavClick = (e, id) => {
    if (!isHome) return
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

  const changeLanguage = (newLang) => {
    setLang(newLang.toLowerCase())
    setLangOpen(false)
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
            <a href="/" className="flex items-center gap-1.5 sm:gap-2">
              <img src="/images/Solo la figura del logo.png" alt="Fizzia" className="h-7 w-auto sm:h-8" onError={(e) => { e.target.style.display = 'none' }} />
              <span className="text-fizzia-500 font-black text-xl sm:text-2xl">Fizzia</span>
            </a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={isHome ? `#${item.id}` : `/#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isHome && activeSection === item.id
                    ? 'text-fizzia-300 bg-fizzia-500/10'
                    : 'text-dark-200 hover:text-white hover:bg-dark-900'
                }`}
              >
                {item.label}
                {isHome && activeSection === item.id && (
                  <span className="absolute bottom-1.5 left-3 right-3 h-px bg-fizzia-400 rounded-full" />
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-0.5 sm:gap-1 text-dark-300 hover:text-white px-1 sm:px-2 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                {lang.toUpperCase()}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-dark-900 border border-dark-800 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                  {['ES', 'EN'].map(code => {
                    const langKey = code.toLowerCase()
                    return (
                      <button
                        key={code}
                        onClick={() => changeLanguage(code)}
                        className={`w-full text-left px-4 py-2 text-sm cursor-pointer hover:bg-fizzia-500/10 hover:text-fizzia-400 transition-colors ${lang === langKey ? 'text-fizzia-400 font-bold' : 'text-dark-300'}`}
                      >
                        {t(`header.langNames.${code}`)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <a
              href="/login"
              className="text-dark-300 hover:text-white text-xs sm:text-sm font-medium transition-colors px-2 sm:px-3 py-2 cursor-pointer"
            >
              {t('header.signIn')}
            </a>
            <a
              href="/register"
              className="bg-fizzia-500 hover:bg-fizzia-400 active:translate-y-px text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-fizzia-500/20 hover:shadow-fizzia-500/30 cursor-pointer"
            >
              {t('header.createAccount')}
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
