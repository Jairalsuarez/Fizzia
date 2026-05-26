const DEFAULT_PRODUCTION_URL = 'https://fizzia.dev'

export function getAuthRedirectUrl(path = '/login') {
  if (typeof window === 'undefined') return `${DEFAULT_PRODUCTION_URL}${path}`

  const configuredUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const origin = configuredUrl || window.location.origin

  return `${origin}${path}`
}
