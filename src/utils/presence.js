const ONLINE_WINDOW_MS = 30000

export function getLastSeenAt(profile) {
  return profile?.last_seen_at || profile?.updated_at || null
}

export function isProfileOnline(profile) {
  const lastSeenAt = getLastSeenAt(profile)
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS
}

export function isMissingLastSeenColumn(error) {
  const message = String(error?.message || '')
  return error?.code === '42703' || message.includes('last_seen_at')
}
