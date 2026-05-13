const HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const WHITESPACE = /\s+/g

export function sanitizeString(value, maxLength = 2000) {
  if (typeof value !== 'string') return value

  return value
    .normalize('NFKC')
    .replace(CONTROL_CHARS, '')
    .trim()
    .replace(WHITESPACE, ' ')
    .slice(0, maxLength)
    .replace(/[&<>"']/g, (char) => HTML_REPLACEMENTS[char])
}

export function sanitizeMultiline(value, maxLength = 5000) {
  if (typeof value !== 'string') return value

  return value
    .normalize('NFKC')
    .replace(CONTROL_CHARS, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, maxLength)
    .replace(/[&<>"']/g, (char) => HTML_REPLACEMENTS[char])
}

export function sanitizeEmail(value) {
  if (typeof value !== 'string') return ''
  return value.normalize('NFKC').trim().toLowerCase().slice(0, 254)
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(sanitizeEmail(value))
}

export function sanitizeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''

  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    return url.toString().slice(0, 2048)
  } catch {
    return ''
  }
}

export function sanitizeFileName(fileName) {
  const fallback = 'archivo'
  if (typeof fileName !== 'string') return fallback

  const safeName = fileName
    .normalize('NFKC')
    .replace(CONTROL_CHARS, '')
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

  return safeName || fallback
}

export function assertAllowedUpload(file, { maxBytes, allowedTypes, allowedExtensions }) {
  if (!file) throw new Error('No se seleccionó ningún archivo')
  if (maxBytes && file.size > maxBytes) throw new Error('El archivo supera el tamaño permitido')

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (allowedExtensions?.length && !allowedExtensions.includes(extension)) {
    throw new Error('El tipo de archivo no está permitido')
  }

  if (allowedTypes?.length && file.type && !allowedTypes.some((type) => {
    if (type.endsWith('/*')) return file.type.startsWith(type.slice(0, -1))
    return file.type === type
  })) {
    throw new Error('El tipo de archivo no está permitido')
  }
}

export function cleanPayload(payload, multilineFields = []) {
  return Object.fromEntries(
    Object.entries(payload)
      .map(([key, value]) => {
        if (value === null || value === undefined || value === '') return [key, undefined]
        if (typeof value === 'string') {
          const cleaned = multilineFields.includes(key)
            ? sanitizeMultiline(value)
            : sanitizeString(value)
          return [key, cleaned || undefined]
        }
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !(typeof File !== 'undefined' && value instanceof File)
        ) {
          return [key, cleanPayload(value, multilineFields)]
        }
        return [key, value]
      })
      .filter(([, value]) => value !== undefined)
  )
}
