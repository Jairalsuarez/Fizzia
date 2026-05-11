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
        className={`w-9 h-9 rounded-full border-2 ${currentTheme.avatarBorder} bg-dark-900/50 flex items-center justify-center hover:bg-dark-800 transition-colors cursor-pointer overflow-hidden shadow-lg`}
        aria-label="Cambiar tema"
      >
        <span className={`w-5 h-5 rounded-full ${currentTheme.swatch} shadow-inner`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-dark-900 border border-dark-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <p className="px-4 py-1 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1">Color del tema</p>
          {Object.values(appThemes).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStoredTheme(t.key)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                current === t.key ? 'bg-dark-800 text-white font-medium' : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`}
            >
              <span className={`w-4 h-4 rounded-full ${t.swatch} shadow-sm border border-black/20`} />
              {t.label}
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
