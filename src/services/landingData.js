import { supabase } from './supabase'
import { cleanPayload, isValidEmail, sanitizeEmail } from '../utils/security'

export async function getPublishedServices() {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return data || []
}

export async function getPublishedProjects() {
  const { data } = await supabase
    .from('portfolio_projects')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
  return data || []
}

export async function getPublishedTestimonials() {
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_published', true)
  return data || []
}

export async function getPublishedFaqs() {
  const { data } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_published', true)
  return data || []
}

export async function getLandingSections() {
  const { data } = await supabase
    .from('landing_sections')
    .select('*')
    .eq('is_published', true)
  return data || []
}

export async function createContactMessage(payload) {
  const cleaned = cleanPayload(payload, ['message', 'need_summary', 'project_description'])
  if (cleaned.email) cleaned.email = sanitizeEmail(cleaned.email)
  if (cleaned.email && !isValidEmail(cleaned.email)) {
    return { data: null, error: { message: 'Correo electrónico inválido' } }
  }
  return supabase.from('contact_messages').insert(cleaned).select().single()
}

export async function createLead(payload) {
  const normalized = {
    ...payload,
    company_name: payload.company_name || payload.company,
    need_summary: payload.need_summary || payload.project_description,
  }
  const allowedFields = [
    'contact_message_id',
    'full_name',
    'email',
    'phone',
    'company_name',
    'tax_id',
    'province',
    'city',
    'source',
    'status',
    'service_id',
    'budget_range',
    'need_summary',
    'probability',
    'assigned_to',
    'next_follow_up_at',
    'converted_client_id',
    'won_at',
    'lost_reason',
    'metadata',
  ]
  const cleaned = cleanPayload(
    Object.fromEntries(
      Object.entries(normalized).filter(([key, value]) => (
        allowedFields.includes(key) && value !== null && value !== undefined && value !== ''
      ))
    ),
    ['need_summary', 'lost_reason']
  )
  if (cleaned.email) cleaned.email = sanitizeEmail(cleaned.email)
  if (cleaned.email && !isValidEmail(cleaned.email)) {
    return { data: null, error: { message: 'Correo electrónico inválido' } }
  }
  return supabase.from('leads').insert(cleaned)
}
