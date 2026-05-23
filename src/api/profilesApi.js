import { supabase } from '../services/supabase'
import { cleanPayload, sanitizeString } from '../utils/security'

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id
}

export async function getProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function getMyProfile() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return data
}

export async function updateProfile(payload) {
  const userId = await getCurrentUserId()
  if (!userId) return { data: null, error: 'No se pudo identificar tu usuario' }

  const cleaned = cleanPayload(
    Object.fromEntries(
      Object.entries(payload)
        .filter(([key, value]) => key !== 'email' && value !== null && value !== undefined && value !== '')
    )
  )

  if (Object.keys(cleaned).length === 0) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(cleaned)
    .eq('id', userId)
    .select()
    .maybeSingle()

  return { data: data ? { ...data } : null, error }
}

export async function acceptTerms() {
  const userId = await getCurrentUserId()
  if (!userId) return { data: null, error: { message: 'No se pudo identificar tu usuario' } }

  const acceptedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from('profiles')
    .update({
      terms_accepted_at: acceptedAt,
    })
    .eq('id', userId)
    .select()
    .maybeSingle()

  return { data: data ? { ...data } : null, error }
}

export function updatePassword(_currentPassword, newPassword) {
  return supabase.auth.updateUser({ password: newPassword })
}
