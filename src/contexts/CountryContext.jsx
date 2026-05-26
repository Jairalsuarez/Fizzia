import { createContext, useContext, useState, useEffect } from 'react'
import { findCity } from '../data/localSeo'

const CountryContext = createContext(null)

const LATAM = ['CO', 'PE', 'AR', 'CL', 'MX', 'BO', 'UY', 'PY', 'CR', 'PA', 'DO', 'GT', 'SV', 'HN', 'NI', 'CU', 'VE']
const COUNTRY_NAMES = { EC: 'Ecuador', CO: 'Colombia', ES: 'España', MX: 'México', AR: 'Argentina', PE: 'Perú', CL: 'Chile', US: 'United States' }

function getMultiplier(code) {
  if (code === 'EC') return 0.5
  if (LATAM.includes(code)) return 0.75
  return 1.0
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
      return
    }

    async function detect() {
      try {
        const res = await fetch('https://ip-api.com/json/?fields=country,countryCode,city,regionName')
        const data = await res.json()
        if (data.country && data.countryCode) {
          setCountry(data.country)
          setCountryCode(data.countryCode.toUpperCase())
          setCity(findCity(data.city) || findCity(data.regionName))
          return
        }
      } catch {
        // Country detection is best-effort only.
      }

      try {
        const res = await fetch('https://ipinfo.io/json')
        const data = await res.json()
        if (data.country) {
          setCountry(COUNTRY_NAMES[data.country] || data.country)
          setCountryCode(data.country.toUpperCase())
          setCity(findCity(data.city) || findCity(data.region))
        }
      } catch {
        // Country detection is best-effort only.
      }
    }

    detect()
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
