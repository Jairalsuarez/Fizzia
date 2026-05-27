import { getCookieValue, purgeCookiePrefixes, removeCookieValue, setCookieValue } from './cookieStorage'

purgeCookiePrefixes([
  'fizzia-admin-dashboard-cache',
  'fizzia-admin-clients-cache',
  'fizzia-admin-developers-cache',
  'fizzia-admin-payments-cache',
  'fizzia-admin-finance-cache',
  'fizzia-client-dashboard-cache',
  'fizzia-client-finances-cache',
  'fizzia-developer-dashboard-cache',
  'fizzia-developer-finance-cache',
])

const COOKIE_KEYS = [
  'fizzia-auth-snapshot',
]

function shouldUseCookie(key) {
  return COOKIE_KEYS.includes(key) || key.startsWith('login_attempts:')
}

function getStoredItem(key) {
  if (shouldUseCookie(key)) return getCookieValue(key)
  return window.sessionStorage.getItem(key)
}

function setStoredItem(key, value) {
  if (shouldUseCookie(key)) setCookieValue(key, value)
  else window.sessionStorage.setItem(key, value)
}

function removeStoredItem(key) {
  if (shouldUseCookie(key)) removeCookieValue(key)
  else window.sessionStorage.removeItem(key)
}

export function readStoredValue(key, fallback, validate = null) {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = getStoredItem(key)
    if (stored === null) return fallback
    return validate && !validate(stored) ? fallback : stored
  } catch {
    return fallback
  }
}

export function writeStoredValue(key, value) {
  if (typeof window === 'undefined') return
  try {
    if (value === undefined || value === null || value === '') removeStoredItem(key)
    else setStoredItem(key, String(value))
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

export function readStoredJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = getStoredItem(key)
    return stored === null ? fallback : JSON.parse(stored)
  } catch {
    return fallback
  }
}

export function writeStoredJson(key, value) {
  if (typeof window === 'undefined') return
  try {
    if (value === undefined || value === null) removeStoredItem(key)
    else setStoredItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}
