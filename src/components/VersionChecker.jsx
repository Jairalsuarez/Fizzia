import { useState, useEffect, useCallback } from 'react'

const POLL_INTERVAL = 5 * 60 * 1000
const STORAGE_KEY = 'fizzia_version_dismissed'

const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

export function VersionChecker() {
  const [hasUpdate, setHasUpdate] = useState(false)

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`)
      const data = await res.json()
      if (data.version !== currentVersion) {
        const dismissed = sessionStorage.getItem(STORAGE_KEY)
        if (dismissed !== data.version) {
          setHasUpdate(true)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    checkVersion()
    const interval = setInterval(checkVersion, POLL_INTERVAL)
    const onVisibility = () => { if (document.visibilityState === 'visible') checkVersion() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [checkVersion])

  const handleRefresh = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, currentVersion)
    setHasUpdate(false)
  }

  if (!hasUpdate) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-md animate-slide-up">
      <div className="rounded-xl border border-fizzia-500/30 bg-fizzia-950/95 backdrop-blur-xl shadow-2xl shadow-fizzia-500/10 p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-rounded text-fizzia-400 text-xl shrink-0 mt-0.5">new_releases</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Nueva version disponible</p>
            <p className="text-xs text-dark-400 mt-0.5">Actualiza para tener la ultima experiencia</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDismiss}
              className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            >
              Ahora no
            </button>
            <button
              onClick={handleRefresh}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold bg-fizzia-500 text-white hover:bg-fizzia-400 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
