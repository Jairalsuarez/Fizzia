import { useState, useRef, useEffect } from 'react'
import { appThemes, getStoredTheme, setStoredTheme } from '../theme/appTheme'

export function ThemeToggle() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(() => getStoredTheme('fizzia'))
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleThemeChange(e) {
      setCurrent(e.detail)
    }
    window.addEventListener('fizzia-theme-change', handleThemeChange)
    return () => window.removeEventListener('fizzia-theme-change', handleThemeChange)
  }, [])

  const currentTheme = appThemes[current] || appThemes.fizzia

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`group inline-flex h-9 items-center gap-2 rounded-full border ${currentTheme.borderSoft} bg-dark-900/80 px-2.5 text-dark-200 shadow-lg shadow-black/10 transition-all hover:bg-dark-800 hover:text-white focus:outline-none focus:ring-2 ${currentTheme.ring} cursor-pointer`}
        aria-label={`Cambiar tema. Tema actual: ${currentTheme.label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        type="button"
      >
        <span className="material-symbols-rounded text-[18px]" aria-hidden="true">palette</span>
        <span className={`h-4 w-4 rounded-full ${currentTheme.swatch} shadow-inner ring-2 ring-dark-950`} aria-hidden="true" />
        <span className="hidden text-xs font-semibold sm:inline">Tema</span>
        <span className={`material-symbols-rounded text-[16px] text-dark-500 transition-transform group-hover:text-dark-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          expand_more
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-dark-800 bg-dark-900 shadow-2xl shadow-black/30 animate-in fade-in zoom-in-95 duration-200"
          role="menu"
        >
          <div className="border-b border-dark-800 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-dark-500">Apariencia</p>
            <p className="mt-0.5 text-sm font-semibold text-white">Color del tema</p>
          </div>
          {Object.values(appThemes).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStoredTheme(t.key)
                setOpen(false)
              }}
              className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors ${
                current === t.key ? 'bg-dark-800 text-white font-semibold' : 'text-dark-300 hover:bg-dark-800/70 hover:text-white'
              }`}
              role="menuitemradio"
              aria-checked={current === t.key}
              type="button"
            >
              <span className={`h-5 w-5 rounded-full ${t.swatch} border border-black/20 shadow-sm`} aria-hidden="true" />
              <span className="flex-1 text-left">{t.label}</span>
              {current === t.key && (
                <span className={`ml-auto material-symbols-rounded text-sm ${t.text}`}>check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
