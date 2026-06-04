import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, Menu } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { AnimatedThemeToggler } from '../ui/AnimatedThemeToggler'
import { BrandLogo } from '../BrandLogo'
import { getServiceSlugByName } from '../../data/servicePages'

export function Header() {
  const [, setActiveSection] = useState('inicio')
  const [langOpen, setLangOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const navRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const lockedRef = useRef(false)
  const navigate = useNavigate()
  const { lang, setLang, t } = useLanguage()

  const navItems = t('header.nav')
  const services = t('services.items').slice(0, 5)

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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (menuOpen) document.body.style.overflow = 'hidden'

    const onDocumentClick = (event) => {
      if (menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setMenuOpen(false)
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', onDocumentClick)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('mousedown', onDocumentClick)
    }
  }, [menuOpen, openDropdown])

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

  const handleMobileNavClick = (event, id) => {
    setMenuOpen(false)
    setOpenDropdown(null)
    handleNavClick(event, id)
  }

  const toggleDropdown = (name) => {
    setOpenDropdown((current) => (current === name ? null : name))
  }

  const renderNavLink = (item) => (
    <a
      key={item.id}
      href={isHome ? `#${item.id}` : `/#${item.id}`}
      onClick={(e) => {
        setOpenDropdown(null)
        handleNavClick(e, item.id)
      }}
      className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-[#526155] transition-colors hover:text-[#0b120d]"
    >
      {item.label}
    </a>
  )

  const getServiceHref = (service) => {
    const slug = getServiceSlugByName(service.name)
    return slug ? `/servicios#${slug}` : isHome ? '#servicios' : '/#servicios'
  }

  const navigateToService = (event, service) => {
    const slug = getServiceSlugByName(service.name)
    if (!slug) return

    event.preventDefault()
    setOpenDropdown(null)
    setMenuOpen(false)
    navigate(`/servicios#${slug}`)

    window.setTimeout(() => {
      document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 border-b border-[#e7eee8] bg-white/86 backdrop-blur-md"
      aria-label="Navegacion principal"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <a href="/" className="inline-flex items-center transition-opacity hover:opacity-75" aria-label="Fizzia">
              <BrandLogo markClassName="h-9" themeClassName="h-10" />
            </a>

            <nav className="hidden font-medium text-[#526155] lg:flex" aria-label="Secciones">
              <ul className="flex items-center space-x-2">
                {navItems.map((item) => (
                  <li key={item.id} className="relative">
                    {item.id === 'servicios' ? (
                      <div ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => toggleDropdown('services')}
                          className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium text-[#526155] transition-colors hover:text-[#0b120d]"
                        >
                          {item.label}
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${openDropdown === 'services' ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === 'services' && (
                          <ul className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-[#dce6dd] bg-white p-2 shadow-xl shadow-black/10">
                            {services.map((service) => (
                              <li key={service.name}>
                                <a
                                  href={getServiceHref(service)}
                                  onClick={(event) => navigateToService(event, service)}
                                  className="block cursor-pointer rounded-lg px-3 py-2 text-sm text-[#526155] transition-colors hover:bg-[#f1f6f2] hover:text-[#0b120d]"
                                >
                                  {service.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      renderNavLink(item)
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="hidden md:flex lg:hidden items-center space-x-6">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={isHome ? `#${item.id}` : `/#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className="relative cursor-pointer text-sm font-medium text-[#526155] transition-colors hover:text-[#0b120d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#32a852]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <AnimatedThemeToggler />
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex cursor-pointer items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-[#526155] transition-colors hover:text-[#0b120d] sm:text-sm"
              >
                {lang.toUpperCase()}
                <ChevronDown className={`h-4 w-4 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 z-50 mt-2 w-32 overflow-hidden rounded-xl border border-[#dce6dd] bg-white p-1 shadow-xl shadow-black/10">
                  {['ES', 'EN'].map(code => {
                    const langKey = code.toLowerCase()
                    return (
                      <button
                        key={code}
                        onClick={() => changeLanguage(code)}
                        className={`w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors hover:bg-fizzia-500/10 hover:text-fizzia-600 ${lang === langKey ? 'font-bold text-fizzia-600' : 'text-[#526155]'}`}
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
              className="hidden cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-[#0b120d] transition-colors hover:text-[#526155] lg:inline-flex"
            >
              {t('header.signIn')}
            </a>
            <a
              href="/register"
              className="hidden cursor-pointer items-center gap-2 rounded-xl bg-[#0b120d] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#25332a] lg:inline-flex"
            >
              {t('header.createAccount')}
              <ArrowRight className="h-4 w-4" />
            </a>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex cursor-pointer rounded-xl p-2 text-[#0b120d] transition-colors hover:bg-[#f1f6f2] lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-haspopup="menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="absolute right-4 top-full mt-2 w-64 rounded-xl border border-[#dce6dd] bg-white/95 p-2 shadow-xl shadow-black/10 backdrop-blur-md lg:hidden"
          role="menu"
          aria-label="Menu movil"
        >
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              item.id === 'servicios' ? (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('mobile-services')}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-[#526155] transition-colors hover:bg-[#f1f6f2] hover:text-[#0b120d]"
                  >
                    {item.label}
                    <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'mobile-services' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'mobile-services' && (
                    <ul className="ml-4 mt-1 border-l border-[#dce6dd] pl-3">
                      {services.map((service) => (
                        <li key={service.name}>
                          <a
                            href={getServiceHref(service)}
                            onClick={(event) => navigateToService(event, service)}
                            className="block cursor-pointer rounded-lg px-3 py-1.5 text-sm text-[#526155] transition-colors hover:bg-[#f1f6f2] hover:text-[#0b120d]"
                          >
                            {service.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <a
                  key={item.id}
                  href={isHome ? `#${item.id}` : `/#${item.id}`}
                  onClick={(event) => handleMobileNavClick(event, item.id)}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-[#526155] transition-colors hover:bg-[#f1f6f2] hover:text-[#0b120d]"
                  role="menuitem"
                >
                  {item.label}
                </a>
              )
            ))}
            <div className="mt-2 space-y-2 border-t border-[#dce6dd] pt-2">
              <a
                href="/login"
                className="block cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-medium text-[#0b120d] transition-colors hover:bg-[#f1f6f2]"
              >
                {t('header.signIn')}
              </a>
              <a
                href="/register"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0b120d] px-3 py-2.5 text-sm font-medium text-white"
              >
                {t('header.createAccount')}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
