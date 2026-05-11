import { createContext, useContext, useState, useCallback } from 'react'
import { translations } from '../data/i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('es')

  const t = useCallback((path) => {
    const keys = path.split('.')
    let value = translations[lang]
    for (const key of keys) {
      if (value == null) return path
      value = value[key]
    }
    return value ?? path
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
