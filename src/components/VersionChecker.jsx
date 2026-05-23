import { useState, useEffect, useCallback } from 'react'
import { useToast } from './Toast'

const POLL_INTERVAL = 5 * 60 * 1000
const STORAGE_KEY = 'fizzia_version_dismissed'

const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

export function VersionChecker() {
  const toast = useToast()
  const [hasUpdate, setHasUpdate] = useState(false)

  const notify = useCallback((version) => {
    setHasUpdate(true)
    window.__fizziaUpdate = version
    window.dispatchEvent(new CustomEvent('fizzia-update', { detail: version }))
    toast.info('Nueva versión disponible. Actualiza desde el menú para tener la última experiencia.', 8000)
  }, [toast])

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`)
      const data = await res.json()
      if (data.version !== currentVersion) {
        const dismissed = sessionStorage.getItem(STORAGE_KEY)
        if (dismissed !== data.version) {
          notify(data.version)
        }
      }
    } catch {
      // ignore
    }
  }, [notify])

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY)
    if (dismissed && dismissed !== currentVersion) {
      sessionStorage.removeItem(STORAGE_KEY)
    }
    checkVersion()
    const interval = setInterval(checkVersion, POLL_INTERVAL)
    const onVisibility = () => { if (document.visibilityState === 'visible') checkVersion() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [checkVersion])

  return null
}
