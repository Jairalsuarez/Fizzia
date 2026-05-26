import { createContext, useContext, useEffect, useState } from 'react'
import { findCity } from '../data/localSeo'

const CountryContext = createContext(null)

const LATAM = ['CO', 'PE', 'AR', 'CL', 'MX', 'BO', 'UY', 'PY', 'CR', 'PA', 'DO', 'GT', 'SV', 'HN', 'NI', 'CU', 'VE']
const COUNTRY_NAMES = { EC: 'Ecuador', CO: 'Colombia', ES: 'Espana', MX: 'Mexico', AR: 'Argentina', PE: 'Peru', CL: 'Chile', US: 'United States' }
const REGION_CITY_FALLBACKS = {
  guayas: 'Guayaquil',
  pichincha: 'Quito',
  'los rios': 'Quevedo',
}

const DETECTION_ENDPOINTS = [
  {
    url: 'https://ipapi.co/json/',
    normalize: (data) => ({
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
      valid: !data.error && data.country_code,
    }),
  },
  {
    url: 'https://ipwho.is/',
    normalize: (data) => ({
      country: data.country,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
      valid: data.success !== false && data.country_code,
    }),
  },
  {
    url: 'https://ipinfo.io/json',
    normalize: (data) => ({
      country: COUNTRY_NAMES[data.country] || data.country,
      countryCode: data.country,
      city: data.city,
      region: data.region,
      valid: data.country,
    }),
  },
]

function getMultiplier(code) {
  if (code === 'EC') return 0.5
  if (LATAM.includes(code)) return 0.75
  return 1.0
}

function normalizeText(value) {
  return (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function resolveCity(...values) {
  for (const value of values) {
    const city = findCity(value)
    if (city) return city

    const fallback = REGION_CITY_FALLBACKS[normalizeText(value)]
    if (fallback) return findCity(fallback)
  }

  return null
}

async function fetchJsonWithTimeout(url, timeout = 3500) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return res.json()
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function CountryProvider({ children }) {
  const [country, setCountry] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [city, setCity] = useState(null)
  const countryMultiplier = getMultiplier(countryCode)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const countryOverride = (params.get('pais') || params.get('country'))?.toUpperCase()

    if (countryOverride && COUNTRY_NAMES[countryOverride]) {
      setCountry(COUNTRY_NAMES[countryOverride])
      setCountryCode(countryOverride)
      setCity(null)
      return undefined
    }

    let cancelled = false

    async function detect() {
      for (const endpoint of DETECTION_ENDPOINTS) {
        try {
          const data = await fetchJsonWithTimeout(endpoint.url)
          if (!data) continue

          const location = endpoint.normalize(data)
          if (!location.valid) continue

          if (!cancelled) {
            const nextCountryCode = location.countryCode.toUpperCase()
            setCountry(location.country || COUNTRY_NAMES[nextCountryCode] || nextCountryCode)
            setCountryCode(nextCountryCode)
            setCity(resolveCity(location.city, location.region))
          }
          return
        } catch {
          // Country detection is best-effort only.
        }
      }
    }

    detect()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <CountryContext.Provider value={{ country, countryCode, countryMultiplier, city }}>
      {children}
    </CountryContext.Provider>
  )
}

export const useCountry = () => {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error('useCountry must be used within CountryProvider')
  return ctx
}
