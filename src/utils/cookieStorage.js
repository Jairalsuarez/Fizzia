const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const CHUNK_SIZE = 3000

function cookieName(key) {
  return encodeURIComponent(key)
}

function cookieOptions(maxAge = COOKIE_MAX_AGE) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  return `; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function getRawCookie(name) {
  if (typeof document === 'undefined') return null
  const safeName = `${name}=`
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(safeName))
  return match ? match.slice(safeName.length) : null
}

function setRawCookie(name, value, maxAge = COOKIE_MAX_AGE) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${value}${cookieOptions(maxAge)}`
}

function removeRawCookie(name) {
  setRawCookie(name, '', 0)
}

export function getCookieValue(key) {
  const name = cookieName(key)
  const raw = getRawCookie(name)
  if (!raw) {
    const migrated = migrateLocalStorageValue(key)
    if (migrated !== null) return migrated
    return null
  }

  if (raw.startsWith('chunked:')) {
    const count = Number(raw.slice('chunked:'.length))
    if (!Number.isFinite(count) || count <= 0) return null
    let value = ''
    for (let index = 0; index < count; index += 1) {
      const chunk = getRawCookie(`${name}.${index}`)
      if (!chunk) return null
      value += chunk
    }
    try {
      return decodeURIComponent(value)
    } catch {
      return null
    }
  }

  try {
    return decodeURIComponent(raw)
  } catch {
    return null
  }
}

function migrateLocalStorageValue(key) {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(key)
    if (value === null) return null
    setCookieValue(key, value)
    window.localStorage.removeItem(key)
    return value
  } catch {
    return null
  }
}

export function setCookieValue(key, value) {
  const name = cookieName(key)
  removeCookieValue(key)
  const encoded = encodeURIComponent(value)

  if (encoded.length <= CHUNK_SIZE) {
    setRawCookie(name, encoded)
    return
  }

  const chunks = encoded.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || []
  setRawCookie(name, `chunked:${chunks.length}`)
  chunks.forEach((chunk, index) => setRawCookie(`${name}.${index}`, chunk))
}

export function removeCookieValue(key) {
  const name = cookieName(key)
  const raw = getRawCookie(name)
  if (raw?.startsWith('chunked:')) {
    const count = Number(raw.slice('chunked:'.length))
    if (Number.isFinite(count)) {
      for (let index = 0; index < count; index += 1) {
        removeRawCookie(`${name}.${index}`)
      }
    }
  }
  removeRawCookie(name)
}

export function purgeCookiePrefixes(prefixes) {
  if (typeof document === 'undefined') return
  document.cookie
    .split('; ')
    .map((row) => row.split('=')[0])
    .filter(Boolean)
    .forEach((name) => {
      let decoded = name
      try {
        decoded = decodeURIComponent(name)
      } catch {
        // Keep raw name.
      }
      if (prefixes.some((prefix) => decoded.startsWith(prefix))) {
        removeRawCookie(name)
      }
    })
}

export const cookieStorage = {
  getItem: getCookieValue,
  setItem: setCookieValue,
  removeItem: removeCookieValue,
}
