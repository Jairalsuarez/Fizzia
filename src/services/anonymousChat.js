import { supabase } from './supabase'

function getSessionId() {
  let id = localStorage.getItem('fizzia_anon_session')
  if (!id) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    localStorage.setItem('fizzia_anon_session', id)
  }
  return id
}

const MSG_KEY = (convId) => `fizzia_anon_msgs_${convId}`

function loadLocalMessages(convId) {
  try {
    const raw = localStorage.getItem(MSG_KEY(convId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveLocalMessages(convId, messages) {
  try {
    localStorage.setItem(MSG_KEY(convId), JSON.stringify(messages))
  } catch {}
}

export async function createConversation({ name, lastName, country, city, email, phone, dialCode, simulatorData }) {
  const sessionId = getSessionId()
  const { data, error } = await supabase
    .from('anonymous_conversations')
    .insert({
      session_id: sessionId,
      visitor_name: name || 'Visitante',
      visitor_last_name: lastName || null,
      visitor_country: country || null,
      visitor_city: city || null,
      visitor_email: email || null,
      visitor_phone: phone || null,
      dial_code: dialCode || null,
      simulator_data: simulatorData || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMyConversation() {
  const sessionId = getSessionId()
  const { data, error } = await supabase
    .from('anonymous_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export function sendMessageLocally(convId, content) {
  const local = loadLocalMessages(convId)
  const msg = {
    id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    content,
    is_from_visitor: true,
    created_at: new Date().toISOString(),
    conversation_id: convId,
  }
  local.push(msg)
  saveLocalMessages(convId, local)
  return msg
}

export function replaceLocalMessage(convId, localId, serverMsg) {
  const local = loadLocalMessages(convId)
  const idx = local.findIndex((m) => m.id === localId)
  if (idx !== -1) {
    local[idx] = { ...local[idx], id: serverMsg.id, synced: true }
    saveLocalMessages(convId, local)
  }
}

export async function sendMessageToSupabase(convId, content) {
  const { data, error } = await supabase
    .from('anonymous_messages')
    .insert({
      conversation_id: convId,
      content,
      is_from_visitor: true,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export function getLocalMessages(convId) {
  return loadLocalMessages(convId)
}

export async function fetchMessagesFromSupabase(convId) {
  const { data, error } = await supabase
    .from('anonymous_messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export function mergeMessages(local, remote) {
  const seen = new Set()
  const remoteContent = new Set()
  for (const m of remote) {
    seen.add(m.id)
    remoteContent.add(`${m.content}_${m.is_from_visitor}`)
  }
  const all = [...remote]
  for (const m of local) {
    if (!seen.has(m.id) && !remoteContent.has(`${m.content}_${m.is_from_visitor}`)) {
      seen.add(m.id)
      all.push(m)
    }
  }
  all.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  return all
}

export function saveMergedMessages(convId, messages) {
  saveLocalMessages(convId, messages)
}

// --- Admin functions ---

export async function getAllConversations() {
  const { data, error } = await supabase
    .from('anonymous_conversations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAdminMessages(convId) {
  const { data, error } = await supabase
    .from('anonymous_messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function sendAdminReply(convId, content) {
  const { data, error } = await supabase
    .from('anonymous_messages')
    .insert({
      conversation_id: convId,
      content,
      is_from_visitor: false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function closeConversation(convId) {
  const { error } = await supabase
    .from('anonymous_conversations')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', convId)
  if (error) throw error
}

export function subscribeToAdminMessages(callback) {
  return supabase
    .channel('anon-chat-admin')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'anonymous_messages' },
      (payload) => callback(payload.new)
    )
    .subscribe()
}
