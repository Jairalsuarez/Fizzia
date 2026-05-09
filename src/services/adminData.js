import { supabase } from './supabase'
import { isMissingLastSeenColumn } from '../utils/presence'

export function getSession() {
  return supabase.auth.getSession()
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signUp(email, password, fullName, metadata) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'client', ...metadata } }
  })
}

export async function checkEmailExists(email) {
  const { data, error } = await supabase.rpc('check_email_exists', { check_email: email })
  if (error) {
    console.error('RPC error:', error)
    return false
  }
  return data || false
}

export async function signOut() {
  return supabase.auth.signOut()
}

export function resetPassword(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  })
}

export async function loadDashboardData() {
  const [clients, projects, invoices, payments, expenses, leads, appointments] =
    await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(80),
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }).limit(80),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(80),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(80),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(80),
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(80),
      supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(80)
    ])

  return {
    clients: clients.data || [],
    projects: projects.data || [],
    invoices: invoices.data || [],
    payments: payments.data || [],
    expenses: expenses.data || [],
    leads: leads.data || [],
    appointments: appointments.data || []
  }
}

export async function createClient(payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('clients').insert(cleaned).select().single()
}

export async function deleteClient(id) {
  if (!id) return { data: null, error: { message: 'Cliente inválido' } }
  try {
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', id)
    if (projectsError) throw projectsError

    for (const project of projects || []) {
      const { error } = await deleteProject(project.id)
      if (error) throw error
    }

    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id')
      .eq('client_id', id)
    if (invoicesError) throw invoicesError

    const invoiceIds = (invoices || []).map(invoice => invoice.id)
    if (invoiceIds.length) {
      const { error: paymentsError } = await supabase.from('payments').delete().in('invoice_id', invoiceIds)
      if (paymentsError) throw paymentsError
      const { error: itemsError } = await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds)
      if (itemsError) throw itemsError
      const { error: invoiceDeleteError } = await supabase.from('invoices').delete().in('id', invoiceIds)
      if (invoiceDeleteError) throw invoiceDeleteError
    }

    const { error: directPaymentsError } = await supabase.from('payments').delete().eq('client_id', id)
    if (directPaymentsError) throw directPaymentsError

    return supabase.from('clients').delete().eq('id', id)
  } catch (error) {
    return { data: null, error }
  }
}

export async function createProject(payload) {
  const cleaned = cleanPayload({
    ...payload,
    currency: payload.currency || 'USD',
    status: payload.status || 'solicitado'
  })
  return supabase.from('projects').insert(cleaned).select().single()
}

export async function updateProject(id, payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('projects').update(cleaned).eq('id', id).select().single()
}

export async function updateLead(id, payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('leads').update(cleaned).eq('id', id).select().single()
}

export async function convertLeadToInformal(lead) {
  const { data: client } = await createClient({
    name: lead.full_name,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    source: lead.source || 'informal',
    notes: lead.notes || `Lead informal - ${lead.need_summary || 'Sin resumen'}`,
  })

  await supabase.from('leads').update({ status: 'informal' }).eq('id', lead.id)

  return client
}

export async function createInformalProject(clientId, projectData) {
  return createProject({
    client_id: clientId,
    name: projectData.name,
    description: projectData.description,
    budget: projectData.budget,
    status: 'discovery',
  })
}

export async function convertLeadToClient(lead) {
  const { data: client } = await createClient({
    name: lead.full_name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    source: lead.source
  })

  await supabase.from('leads').update({ status: 'won' }).eq('id', lead.id)

  return client
}

export async function createCharge(payload) {
  const { paid_amount, ...invoiceData } = payload
  const { data: invoice } = await supabase
    .from('invoices')
    .insert(cleanInvoiceData(invoiceData))
    .select()
    .single()

  if (paid_amount > 0) {
    await supabase.from('payments').insert({
      invoice_id: invoice.id,
      amount: paid_amount,
      payment_date: new Date().toISOString()
    })
  }

  return invoice
}

function cleanInvoiceData(data) {
  return cleanPayload(data)
}

export async function createPayment(payload) {
  const cleaned = cleanPayload(payload)
  const { data: payment } = await supabase
    .from('payments')
    .insert(cleaned)
    .select()
    .single()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('total_amount, payments:payments(amount)')
    .eq('id', cleaned.invoice_id)
    .single()

  if (invoice) {
    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
    if (totalPaid >= invoice.total_amount) {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', cleaned.invoice_id)
    }
  }

  return payment
}

export async function createExpense(payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('expenses').insert(cleaned).select().single()
}

export async function getAllClients() {
  const { data } = await supabase
    .from('clients')
    .select(`
      *,
      projects:projects(count),
      client_users(
        profiles(avatar_id)
      )
    `)
    .order('created_at', { ascending: false })
  return (data || []).map(c => ({
    ...c,
    project_count: c.projects?.[0]?.count || 0,
    projects: undefined,
    avatar_id: c.client_users?.[0]?.profiles?.avatar_id || null,
    client_users: undefined,
  }))
}

export async function getAllProjects() {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function getProjectsWithMessages() {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function getUserConversations() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let result = await supabase
    .from('messages')
    .select('sender_id, recipient_id, content, created_at, read_at')
    .order('created_at', { ascending: false })
  if (result.error?.code === '42703' || String(result.error?.message || '').includes('recipient_id')) {
    result = await supabase
      .from('messages')
      .select('sender_id, content, created_at, read_at')
      .neq('sender_id', user.id)
      .order('created_at', { ascending: false })
  }

  const senderMap = {}
  for (const msg of result.data || []) {
    const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
    if (!partnerId || partnerId === user.id) continue
    if (!senderMap[partnerId]) {
      senderMap[partnerId] = { lastMessage: msg.content, lastMessageAt: msg.created_at, unreadCount: 0 }
    }
    if (msg.sender_id !== user.id && !msg.read_at) senderMap[partnerId].unreadCount++
  }

  const senderIds = Object.keys(senderMap)
  if (!senderIds.length) return []

  let profilesResult = await supabase
    .from('profiles')
    .select('id, full_name, first_name, avatar_id, role, updated_at, last_seen_at')
    .in('id', senderIds)
  if (isMissingLastSeenColumn(profilesResult.error)) {
    profilesResult = await supabase
      .from('profiles')
      .select('id, full_name, first_name, avatar_id, role, updated_at')
      .in('id', senderIds)
  }

  const profileMap = Object.fromEntries((profilesResult.data || []).map(p => [p.id, p]))

  return senderIds
    .map(id => ({ ...(profileMap[id] || {}), id, ...senderMap[id] }))
    .filter(c => c.full_name || c.first_name)
    .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
}

export async function getMessagesWithUser(userId) {
  const { data: link } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!link) {
    const directMessages = await getDirectMessagesWithUser(userId)
    if (directMessages.length) return directMessages

    const { data } = await supabase
      .from('messages')
      .select('*, projects(name)')
      .eq('sender_id', userId)
      .order('created_at', { ascending: true })
    return data || []
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', link.client_id)

  const projectIds = projects?.map(p => p.id) || []
  if (!projectIds.length) {
    const { data } = await supabase
      .from('messages')
      .select('*, projects(name)')
      .eq('sender_id', userId)
      .order('created_at', { ascending: true })
    return data || []
  }

  const { data } = await supabase
    .from('messages')
    .select('*, projects(name)')
    .in('project_id', projectIds)
    .eq('channel', 'client')
    .order('created_at', { ascending: true })

  return data || []
}

export async function sendMessageToUser(recipientId, content) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: link } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', recipientId)
    .maybeSingle()
  if (!link) return sendDirectMessage(recipientId, content)

  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', link.client_id)
    .order('created_at', { ascending: false })
    .limit(1)
  if (!projects?.length) return null

  const { data } = await supabase
    .from('messages')
    .insert({ project_id: projects[0].id, sender_id: user.id, content, is_admin_sender: true, channel: 'client' })
    .select()
    .single()
  return data
}

export async function markUserMessagesRead(senderId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString(), read_by: user.id })
    .eq('sender_id', senderId)
    .neq('sender_id', user.id)
    .is('read_at', null)
    .select()
  return data || []
}

export function subscribeToAllMessages(callback) {
  return supabase
    .channel('messages:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
      if (payload.new) callback(payload.new)
    })
    .subscribe()
}

async function selectMessagesByChannel(projectId, channel) {
  const query = () => supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .eq('channel', channel)
    .order('created_at', { ascending: true })

  const { data, error } = await query()
  if (!error) return data || []
  if (error.code !== '42703' && !String(error.message || '').includes('channel')) {
    console.error('Error fetching messages:', error)
    return []
  }

  const fallback = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (fallback.error) console.error('Error fetching messages:', fallback.error)
  return fallback.data || []
}

async function updateMessagesReadByChannel(projectId, channel) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const update = () => supabase
    .from('messages')
    .update({ read_at: new Date().toISOString(), read_by: user.id })
    .eq('project_id', projectId)
    .eq('channel', channel)
    .neq('sender_id', user.id)
    .is('read_at', null)
    .select()

  const { data, error } = await update()
  if (!error) return data || []
  if (error.code !== '42703' && !String(error.message || '').includes('channel')) {
    console.error('Error marking messages as read:', error)
    return []
  }

  const fallback = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString(), read_by: user.id })
    .eq('project_id', projectId)
    .neq('sender_id', user.id)
    .is('read_at', null)
    .select()
  if (fallback.error) console.error('Error marking messages as read:', fallback.error)
  return fallback.data || []
}

export async function getAdminProjectMessages(projectId, channel = 'client') {
  return selectMessagesByChannel(projectId, channel)
}

export async function getInternalProjectMessages(projectId) {
  return selectMessagesByChannel(projectId, 'internal')
}

export async function sendAdminMessage(projectId, content, channel = 'client') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('messages')
    .insert({ project_id: projectId, sender_id: user.id, content, is_admin_sender: channel === 'client', channel })
    .select()
    .single()
  if (error?.code === '42703' || String(error?.message || '').includes('channel')) {
    const fallback = await supabase
      .from('messages')
      .insert({ project_id: projectId, sender_id: user.id, content, is_admin_sender: true })
      .select()
      .single()
    if (fallback.error) throw fallback.error
    return fallback.data
  }
  if (error) throw error
  return data
}

export async function sendInternalProjectMessage(projectId, content) {
  try {
    return await sendAdminMessage(projectId, content, 'internal')
  } catch (error) {
    const { data, error: rpcError } = await supabase
      .rpc('send_project_internal_message', {
        target_project_id: projectId,
        message_content: content,
      })
    if (rpcError) throw rpcError
    return data
  }
}

export async function markAdminProjectMessagesRead(projectId, channel = 'client') {
  return updateMessagesReadByChannel(projectId, channel)
}

export async function markInternalProjectMessagesRead(projectId) {
  return updateMessagesReadByChannel(projectId, 'internal')
}

export async function getMessagesBySender(senderId) {
  const { data } = await supabase
    .from('messages')
    .select('content, created_at, project_id, projects!inner(name)')
    .eq('sender_id', senderId)
    .order('created_at', { ascending: false })
    .limit(1)
  return data || []
}

export function subscribeToProjectMessagesByChannel(projectId, channel, callback) {
  return supabase
    .channel(`messages:${channel}:${projectId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` },
      (payload) => {
        if (!payload.new) return
        if (!payload.new.channel || payload.new.channel === channel) callback(payload.new)
      }
    )
    .subscribe()
}

export function subscribeToAdminMessages(projectId, callback, channel = 'client') {
  return subscribeToProjectMessagesByChannel(projectId, channel, callback)
}

export function subscribeToInternalProjectMessages(projectId, callback) {
  return subscribeToProjectMessagesByChannel(projectId, 'internal', callback)
}

export async function getDirectChatUsers() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, first_name, email, avatar_id, role, updated_at, last_seen_at')
    .in('role', ['developer', 'admin', 'manager'])
    .neq('id', user.id)
    .order('full_name', { ascending: true, nullsFirst: false })
  if (error) {
    console.error('Error fetching direct chat users:', error)
    return []
  }
  return data || []
}

export async function getDirectMessagesWithUser(recipientId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !recipientId) return []
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel', 'direct')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
  if (error?.code === '42703' || String(error?.message || '').includes('recipient_id')) return []
  if (error) {
    console.error('Error fetching direct messages:', error)
    return []
  }
  return data || []
}

export async function sendDirectMessage(recipientId, content) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !recipientId) return null
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: user.id, recipient_id: recipientId, content, channel: 'direct', is_admin_sender: false })
    .select()
    .single()
  if (error) {
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('send_direct_chat_message', {
        target_user_id: recipientId,
        message_content: content,
      })
    if (rpcError) throw rpcError
    return rpcData
  }
  return data
}

export async function markDirectMessagesRead(senderId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !senderId) return []
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString(), read_by: user.id })
    .eq('channel', 'direct')
    .eq('sender_id', senderId)
    .eq('recipient_id', user.id)
    .is('read_at', null)
    .select()
  if (error?.code === '42703' || String(error?.message || '').includes('recipient_id')) return []
  if (error) console.error('Error marking direct messages as read:', error)
  return data || []
}

export function subscribeToDirectMessages(userId, callback) {
  return supabase
    .channel(`messages:direct:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        if (!payload.new || payload.new.channel !== 'direct') return
        if (payload.new.sender_id === userId || payload.new.recipient_id === userId) callback(payload.new)
      }
    )
    .subscribe()
}

export async function markAllProjectMessagesRead(projectId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString(), read_by: user.id })
    .eq('project_id', projectId)
    .neq('sender_id', user.id)
    .is('read_at', null)
    .select()
  if (error) console.error('Error marking admin messages as read:', error)
  return data || []
}

export async function getPendingProjectRequests() {
  const { data } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .eq('status', 'solicitado')
    .order('created_at', { ascending: false })
  return data || []
}

export async function getOpenCharges() {
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  return data || []
}

export async function createInvoice(payload) {
  const cleaned = cleanPayload(payload)
  const { data } = await supabase
    .from('invoices')
    .insert(cleaned)
    .select()
    .single()
  return data
}

export async function getLeads() {
  const { data } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function updateLeadStatus(id, status) {
  const { data } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  return data
}

export async function deleteLead(id) {
  return supabase.from('leads').delete().eq('id', id)
}

export async function readTable(table, columns = '*', orderColumn = 'created_at') {
  return supabase
    .from(table)
    .select(columns)
    .order(orderColumn, { ascending: false })
}

export function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== '')
  )
}

export async function uploadProjectFileAdmin(projectId, file, note = '') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`
  const filePath = `${projectId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(filePath, file, { contentType: file.type, cacheControl: '3600' })

  if (uploadError) return { data: null, error: uploadError }

  const { data: publicUrl } = supabase.storage
    .from('project-files')
    .getPublicUrl(filePath)

  const { data, error } = await supabase
    .from('project_files')
    .insert({
      project_id: projectId,
      uploader_id: user.id,
      file_name: file.name,
      file_url: publicUrl.publicUrl,
      storage_path: filePath,
      file_type: file.type,
      file_size: file.size,
      visibility: 'client',
      note,
    })
    .select()
    .single()

  return { data, error }
}

export async function getAllProjectFiles(projectId) {
  const { data } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function deleteProject(id) {
  if (!id) return { data: null, error: { message: 'Proyecto inválido' } }

  const run = async (operation, options = {}) => {
    const { error, data } = await operation()
    if (!error) return data
    const message = String(error.message || '')
    const isMissingSchema = (
      error.code === '42P01'
      || error.code === '42703'
      || error.code === 'PGRST205'
      || message.includes('does not exist')
      || message.includes('schema cache')
      || message.includes('Could not find the table')
    )
    if (options.ignoreMissingSchema && isMissingSchema) return null
    throw error
  }

  try {
    const files = await run(
      () => supabase.from('project_files').select('*').eq('project_id', id),
      { ignoreMissingSchema: true }
    ) || []
    const storagePaths = files.map(file => file.storage_path || file.path).filter(Boolean)
    if (storagePaths.length) {
      await supabase.storage.from('project-files').remove(storagePaths)
    }

    const invoices = await run(
      () => supabase.from('invoices').select('id').eq('project_id', id),
      { ignoreMissingSchema: true }
    ) || []
    const invoiceIds = invoices.map(invoice => invoice.id)

    await run(() => supabase.from('messages').delete().eq('project_id', id), { ignoreMissingSchema: true })
    await run(() => supabase.from('project_file_requests').delete().eq('project_id', id), { ignoreMissingSchema: true })
    await run(() => supabase.from('project_developers').delete().eq('project_id', id), { ignoreMissingSchema: true })
    await run(() => supabase.from('project_tasks').delete().eq('project_id', id), { ignoreMissingSchema: true })
    await run(() => supabase.from('project_milestones').delete().eq('project_id', id), { ignoreMissingSchema: true })
    await run(() => supabase.from('project_services').delete().eq('project_id', id), { ignoreMissingSchema: true })
    await run(() => supabase.from('project_files').delete().eq('project_id', id), { ignoreMissingSchema: true })

    if (invoiceIds.length) {
      await run(() => supabase.from('payments').update({ project_id: null }).in('invoice_id', invoiceIds), { ignoreMissingSchema: true })
      await run(() => supabase.from('invoice_items').delete().in('invoice_id', invoiceIds), { ignoreMissingSchema: true })
      await run(() => supabase.from('invoices').delete().in('id', invoiceIds), { ignoreMissingSchema: true })
    }
    await run(() => supabase.from('payments').update({ project_id: null }).eq('project_id', id), { ignoreMissingSchema: true })
    await run(() => supabase.from('invoices').update({ project_id: null }).eq('project_id', id), { ignoreMissingSchema: true })

    await run(() => supabase.from('proposals').update({ project_id: null }).eq('project_id', id), { ignoreMissingSchema: true })
    await run(() => supabase.from('expenses').update({ project_id: null }).eq('project_id', id), { ignoreMissingSchema: true })
    await run(() => supabase.from('appointments').update({ project_id: null }).eq('project_id', id), { ignoreMissingSchema: true })

    return await supabase.from('projects').delete().eq('id', id)
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteProjectFile(fileId, storagePath) {
  if (storagePath) {
    await supabase.storage.from('project-files').remove([storagePath])
  }
  return supabase.from('project_files').delete().eq('id', fileId)
}

export async function getProjectInvoices(projectId) {
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getProjectPayments(projectId) {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id')
    .eq('project_id', projectId)
  const invoiceIds = invoices.map(i => i.id)
  if (!invoiceIds.length) return []
  const { data } = await supabase
    .from('payments')
    .select('*, invoices(invoice_number)')
    .in('invoice_id', invoiceIds)
    .order('paid_at', { ascending: false })
  return data || []
}

export async function getProjectInvoicesWithPayments(projectId) {
  const { data } = await supabase
    .from('invoices')
    .select('*, payments(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getProjectMilestones(projectId) {
  const { data } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')
  return data || []
}

export async function createMilestone(payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('project_milestones').insert(cleaned).select().single()
}

export async function updateMilestone(id, payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('project_milestones').update(cleaned).eq('id', id).select().single()
}

export async function deleteMilestone(id) {
  return supabase.from('project_milestones').delete().eq('id', id)
}

export async function createInvoiceForProject(payload) {
  const cleaned = cleanPayload(payload)
  const { data } = await supabase
    .from('invoices')
    .insert(cleaned)
    .select()
    .single()
  return data
}

export async function getAllPendingPayments() {
  const { data } = await supabase
    .from('payments')
    .select(`
      *,
      projects(name, final_price, budget, client_id),
      clients(name, email)
    `)
    .eq('admin_status', 'pending')
    .order('created_at', { ascending: false })
  return data || []
}

export async function getPaymentProofUrl(proofPath) {
  if (!proofPath) return null
  
  // If it's a full URL from old uploads, extract the path
  let path = proofPath
  if (proofPath.startsWith('http')) {
    // Extract path after /object/public/ or /object/authenticated/
    const match = proofPath.match(/\/object\/(?:public|authenticated)\/[^/]+\/(.+)$/)
    if (match) {
      path = match[1]
    } else {
      return proofPath // Fallback: return original URL
    }
  }
  
  // Generate signed URL for private bucket
  const { data, error } = await supabase.storage
    .from('project-files')
    .createSignedUrl(path, 3600)
  if (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
  return data.signedUrl
}

export async function getAllPayments() {
  console.log('Fetching all payments (no joins)...')
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
  console.log('Payments result:', data?.length, 'rows, error:', error)

  if (!data?.length) return []

  const projectIds = [...new Set(data.map(p => p.project_id).filter(Boolean))]
  const clientIds = [...new Set(data.map(p => p.client_id).filter(Boolean))]

  let projectsMap = {}
  let clientsMap = {}
  if (projectIds.length) {
    const { data: projects } = await supabase.from('projects').select('id, name, final_price, budget').in('id', projectIds)
    projectsMap = Object.fromEntries(projects.map(p => [p.id, p]))
  }
  if (clientIds.length) {
    const { data: clients } = await supabase.from('clients').select('id, name, email').in('id', clientIds)
    clientsMap = Object.fromEntries(clients.map(c => [c.id, c]))
  }

  const enriched = data.map(p => ({
    ...p,
    projects: p.project_id ? projectsMap[p.project_id] || null : null,
    clients: p.client_id ? clientsMap[p.client_id] || null : null,
  }))

  // Pre-resolve all signed URLs in parallel
  const resolvedPayments = await Promise.all(
    enriched.map(async (p) => {
      if (p.proof_url) {
        const proofUrl = await getPaymentProofUrl(p.proof_url)
        return { ...p, proofUrl }
      }
      return { ...p, proofUrl: null }
    })
  )

  return resolvedPayments
}

export async function approvePayment(paymentId, reviewedBy) {
  const { data } = await supabase
    .from('payments')
    .update({
      admin_status: 'approved',
      admin_reviewed_at: new Date().toISOString(),
      admin_reviewed_by: reviewedBy,
    })
    .eq('id', paymentId)
    .select()
    .single()
  return { data, error: data ? null : { message: 'Error aprobando pago' } }
}

export async function rejectPayment(paymentId, reviewedBy, reason) {
  const { data } = await supabase
    .from('payments')
    .update({
      admin_status: 'rejected',
      admin_reviewed_at: new Date().toISOString(),
      admin_reviewed_by: reviewedBy,
      admin_rejection_reason: reason,
    })
    .eq('id', paymentId)
    .select()
    .single()
  return { data, error: data ? null : { message: 'Error rechazando pago' } }
}

export async function deletePayment(paymentId) {
  return supabase.from('payments').delete().eq('id', paymentId)
}

export async function getProjectTasks(projectId) {
  const { data } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')
  return data || []
}

export async function createProjectTask(payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('project_tasks').insert(cleaned).select().single()
}

export async function updateProjectTask(id, payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('project_tasks').update(cleaned).eq('id', id).select().single()
}

export async function deleteProjectTask(id) {
  return supabase.from('project_tasks').delete().eq('id', id)
}

export async function getProjectFileRequests(projectId) {
  const { data } = await supabase
    .from('project_file_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function createProjectFileRequest(projectId, requestText) {
  const { data } = await supabase
    .from('project_file_requests')
    .insert({ project_id: projectId, request_text: requestText })
    .select()
    .single()
  return data
}

export async function deleteProjectFileRequest(id) {
  return supabase.from('project_file_requests').delete().eq('id', id)
}

export async function updateClient(id, payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('clients').update(cleaned).eq('id', id).select().single()
}

export async function getAllClientProjects(clientId) {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getAllDevelopers() {
  const { data } = await supabase
    .from('profiles')
    .select(`
      *,
      project_developers(count)
    `)
    .in('role', ['developer', 'client'])
    .order('full_name', { ascending: true, nullsFirst: false })
  return (data || []).map(d => ({
    ...d,
    project_count: d.project_developers?.[0]?.count || 0,
    project_developers: undefined,
  }))
}

export async function updateDeveloper(id, payload) {
  const cleaned = cleanPayload(payload)
  return supabase.from('profiles').update(cleaned).eq('id', id).select().single()
}

export async function dismissDeveloper(id) {
  if (!id) return { data: null, error: { message: 'Desarrollador inválido' } }
  const { error: assignmentError } = await supabase.from('project_developers').delete().eq('developer_id', id)
  if (assignmentError) return { data: null, error: assignmentError }
  return updateDeveloper(id, { role: 'client' })
}

export async function hireDeveloper(id) {
  if (!id) return { data: null, error: { message: 'Usuario inválido' } }
  return updateDeveloper(id, { role: 'developer' })
}

export async function uploadPaymentProof(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`
  const filePath = `payment-proofs/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(filePath, file, { contentType: file.type, cacheControl: '3600' })

  if (uploadError) return { data: null, error: uploadError }

  const { data: publicUrl } = supabase.storage
    .from('project-files')
    .getPublicUrl(filePath)

  return { data: publicUrl.publicUrl, error: null }
}
