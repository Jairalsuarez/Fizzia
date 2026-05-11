export const countryCodes = [
  { code: 'EC', dial: '+593', label: 'Ecuador', flag: '🇪🇨', pattern: /^\d{9}$/, example: '099 123 4567' },
  { code: 'CO', dial: '+57', label: 'Colombia', flag: '🇨🇴', pattern: /^\d{10}$/, example: '300 123 4567' },
  { code: 'PE', dial: '+51', label: 'Perú', flag: '🇵🇪', pattern: /^\d{9}$/, example: '999 123 456' },
  { code: 'AR', dial: '+54', label: 'Argentina', flag: '🇦🇷', pattern: /^\d{10}$/, example: '11 1234 5678' },
  { code: 'CL', dial: '+56', label: 'Chile', flag: '🇨🇱', pattern: /^\d{9}$/, example: '9 1234 5678' },
  { code: 'MX', dial: '+52', label: 'México', flag: '🇲🇽', pattern: /^\d{10}$/, example: '55 1234 5678' },
  { code: 'BO', dial: '+591', label: 'Bolivia', flag: '🇧🇴', pattern: /^\d{8}$/, example: '71234567' },
  { code: 'UY', dial: '+598', label: 'Uruguay', flag: '🇺🇾', pattern: /^\d{8}$/, example: '91 234 567' },
  { code: 'PY', dial: '+595', label: 'Paraguay', flag: '🇵🇾', pattern: /^\d{9}$/, example: '981 123 456' },
  { code: 'CR', dial: '+506', label: 'Costa Rica', flag: '🇨🇷', pattern: /^\d{8}$/, example: '8312 3456' },
  { code: 'PA', dial: '+507', label: 'Panamá', flag: '🇵🇦', pattern: /^\d{8}$/, example: '6123 4567' },
  { code: 'DO', dial: '+1-809', label: 'República Dominicana', flag: '🇩🇴', pattern: /^\d{10}$/, example: '809 123 4567' },
  { code: 'GT', dial: '+502', label: 'Guatemala', flag: '🇬🇹', pattern: /^\d{8}$/, example: '5123 4567' },
  { code: 'SV', dial: '+503', label: 'El Salvador', flag: '🇸🇻', pattern: /^\d{8}$/, example: '7123 4567' },
  { code: 'HN', dial: '+504', label: 'Honduras', flag: '🇭🇳', pattern: /^\d{8}$/, example: '9123 4567' },
  { code: 'NI', dial: '+505', label: 'Nicaragua', flag: '🇳🇮', pattern: /^\d{8}$/, example: '8123 4567' },
  { code: 'ES', dial: '+34', label: 'España', flag: '🇪🇸', pattern: /^\d{9}$/, example: '612 345 678' },
  { code: 'US', dial: '+1', label: 'Estados Unidos', flag: '🇺🇸', pattern: /^\d{10}$/, example: '(212) 555 0199' },
  { code: 'VE', dial: '+58', label: 'Venezuela', flag: '🇻🇪', pattern: /^\d{10}$/, example: '412 123 4567' },
]

export function getCountryByCode(code) {
  return countryCodes.find(c => c.code === code) || countryCodes[0]
}

export function validatePhone(dialCode, number) {
  const country = countryCodes.find(c => c.dial === dialCode)
  if (!country) return number.length >= 7
  return country.pattern.test(number.replace(/\D/g, ''))
}
