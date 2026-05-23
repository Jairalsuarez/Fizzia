import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/authContext'
import { getMyProfile } from '../../api/profilesApi'
import { AvatarIcon } from '../../data/avatars.jsx'
import { useAppTheme } from '../../theme/appTheme'
import { ThemeProvider } from '../../theme/ThemeContext'
import { TermsAcceptanceGate } from '../legal/TermsAcceptanceGate'
import { VersionChecker } from '../VersionChecker'

export function DashboardLayout({
  navItems,
  roleLabel,
  settingsPath,
  termsPath,
  theme = 'fizzia',
  topActions = null,
  children,
}) {
  const { signOut, session, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(user)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [updateVersion, setUpdateVersion] = useState(null)
  const mobileNavRef = useRef(null)
  const { theme: activeTheme, palette } = useAppTheme(theme)
  const preloadRoute = (item) => item.preload?.()

  useEffect(() => {
    function handleClickOutside(e) {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target)) {
        setMobileNavOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      if (!session?.user) return
      const p = await getMyProfile()
      if (!cancelled) setProfile(p || user)
    }
    loadProfile()
    return () => { cancelled = true }
  }, [session, user])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = (e) => setUpdateVersion(e.detail)
    window.addEventListener('fizzia-update', handler)
    return () => window.removeEventListener('fizzia-update', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const avatarId = profile?.avatar_id || user?.avatar_id || null
  const email = session?.user?.email || ''
  const displayName = profile?.full_name || profile?.first_name || roleLabel || 'Usuario'
  const summaryPath = navItems[0]?.to || '/'
  const isClientLayout = termsPath?.startsWith('/cliente')
  const activeNavItem = navItems.find(item => (
    item.end
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  )) || navItems[0]

  const handleTermsAccepted = (updatedProfile) => {
    setProfile(updatedProfile || profile)
    if (location.pathname !== summaryPath) {
      navigate(summaryPath, { replace: true })
    }
    if (isClientLayout) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('fizzia-start-client-tour', { detail: { path: summaryPath } }))
      }, 450)
    }
  }

  const needsTerms = profile && !profile.terms_accepted_at

  if (needsTerms) {
    return (
      <div className="min-h-dvh bg-dark-950" data-theme={activeTheme}>
        <TermsAcceptanceGate profile={profile} onAccepted={handleTermsAccepted} />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-dark-950" data-theme={activeTheme}>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute -top-24 -left-24 w-[500px] h-[500px] ${palette.glow} rounded-full blur-3xl`} />
        <div className={`absolute top-1/2 -right-24 w-[400px] h-[400px] ${palette.glowSoft} rounded-full blur-3xl`} />
        <img
          src="/images/Solo la figura del logo.png"
          alt=""
          className="absolute bottom-[-8rem] left-1/2 h-[28rem] -translate-x-1/2 opacity-[0.035] blur-[1px]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-transparent to-dark-950/80" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/85 backdrop-blur-xl border-b border-dark-800/60">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-dark-400 hover:bg-dark-800 hover:text-white transition-colors"
                aria-label="Abrir menu"
              >
                <span className="material-symbols-rounded text-2xl">menu</span>
              </button>
              <NavLink to={navItems[0]?.to || '/'} className="cursor-pointer flex-shrink-0 flex items-center gap-2" title="Ir al resumen">
                <img src="/images/Solo la figura del logo.png" alt="Fizzia" className="h-8 w-auto" onError={(e) => { e.target.style.display = 'none' }} />
                <span className="text-fizzia-500 font-black text-xl">Fizzia</span>
              </NavLink>
            </div>

            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onMouseEnter={() => preloadRoute(item)}
                  onFocus={() => preloadRoute(item)}
                  onTouchStart={() => preloadRoute(item)}
                  end={item.end ?? item.to.endsWith('/admin') ?? item.to.endsWith('/dev') ?? item.to.endsWith('/cliente')}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? `${palette.activeText} ${palette.activeBg}`
                        : 'text-dark-300 hover:text-white hover:bg-dark-800/80'
                    }`
                  }
                >
                  <span className="material-symbols-rounded text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {topActions}
              <NavLink
                to={`${settingsPath}/perfil`}
                className="flex cursor-pointer items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full bg-white border ${palette.avatarBorder} overflow-hidden shrink-0`}>
                  <AvatarIcon id={avatarId} name={displayName} size={32} />
                </div>
              </NavLink>
            </div>
          </div>
        </div>

      </nav>

      {/* Mobile side drawer */}
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-[100] bg-black/60 transition-opacity duration-300 lg:hidden ${
            mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
        {/* Drawer */}
        <div
          ref={mobileNavRef}
          className={`fixed top-0 left-0 z-[110] flex h-full w-72 flex-col bg-dark-950 border-r border-dark-800 shadow-2xl shadow-black/50 transition-transform duration-300 ease-out lg:hidden ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800">
            <span className="text-sm font-semibold text-white">Menu</span>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-dark-400 hover:bg-dark-800 hover:text-white transition-colors"
              aria-label="Cerrar menu"
            >
              <span className="material-symbols-rounded text-xl">close</span>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                onMouseEnter={() => preloadRoute(item)}
                onFocus={() => preloadRoute(item)}
                onTouchStart={() => preloadRoute(item)}
                end={item.end ?? item.to.endsWith('/admin') ?? item.to.endsWith('/dev') ?? item.to.endsWith('/cliente')}
                className={({ isActive }) =>
                  `flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? `${palette.activeText} ${palette.activeBg}`
                      : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-rounded text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-dark-800 px-3 py-3 space-y-1">
            <NavLink
              to={settingsPath}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? `${palette.activeText} ${palette.activeBg}`
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                }`
              }
            >
              <span className="material-symbols-rounded text-lg">settings</span>
              Configuracion
            </NavLink>
            <button
              onClick={handleSignOut}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-dark-800 hover:text-red-300"
            >
              <span className="material-symbols-rounded text-lg">logout</span>
              Cerrar sesion
            </button>
          </div>
          <div className="px-4 py-2.5 border-t border-dark-800 flex items-center justify-between">
            <p className="text-[11px] text-dark-500 font-mono">v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}</p>
            {updateVersion && (
              <button
                onClick={() => { sessionStorage.removeItem('fizzia_version_dismissed'); window.location.reload() }}
                className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-fizzia-500/15 px-2.5 py-1 text-[11px] font-semibold text-fizzia-400 hover:bg-fizzia-500/25 transition-colors"
              >
                <span className="material-symbols-rounded text-sm">new_releases</span>
                Actualizar
              </button>
            )}
          </div>
        </div>
      </>

      <main className="pt-28 pb-10 lg:pt-20 relative z-10">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          {location.pathname !== navItems[0]?.to && (
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-1 text-sm text-dark-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Volver atras"
            >
              <span className="material-symbols-rounded text-lg">arrow_back</span>
              Volver
            </button>
          )}
          <ThemeProvider value={{ theme: activeTheme, palette }}>
            {children || <Outlet key={location.key} />}
          </ThemeProvider>
        </div>
      </main>
      <VersionChecker />
    </div>
  )
}
