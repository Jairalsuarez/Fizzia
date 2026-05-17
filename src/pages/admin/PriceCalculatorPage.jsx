import { useEffect, useMemo, useState, useRef } from 'react'
import { formatMoney } from '../../utils/format'

const DAILY_DEV_RATE = 20
const LATAM = ['CO', 'PE', 'AR', 'CL', 'MX', 'BO', 'UY', 'PY', 'CR', 'PA', 'DO', 'GT', 'SV', 'HN', 'NI', 'CU', 'VE']

const PROJECT_TYPES = [
  { value: 'landing', label: 'Landing page', baseCost: 180, baseDays: 4 },
  { value: 'portfolio', label: 'Portafolio / CV', baseCost: 200, baseDays: 4 },
  { value: 'blog', label: 'Blog / Revista digital', baseCost: 320, baseDays: 6 },
  { value: 'web', label: 'Sistema web corporativo', baseCost: 520, baseDays: 12 },
  { value: 'booking', label: 'Gestor de citas / reservas', baseCost: 480, baseDays: 10 },
  { value: 'inventory', label: 'Gestión de inventarios', baseCost: 520, baseDays: 10 },
  { value: 'gym', label: 'Sistema de gimnasio', baseCost: 560, baseDays: 12 },
  { value: 'restaurant', label: 'Sistema de restaurante', baseCost: 600, baseDays: 12 },
  { value: 'barber', label: 'Barbería / Salón', baseCost: 380, baseDays: 8 },
  { value: 'laundry', label: 'Lavandería', baseCost: 400, baseDays: 8 },
  { value: 'parking', label: 'Estacionamiento', baseCost: 440, baseDays: 8 },
  { value: 'vet', label: 'Veterinaria', baseCost: 500, baseDays: 10 },
  { value: 'loyalty', label: 'Fidelización / Puntos', baseCost: 480, baseDays: 10 },
  { value: 'events', label: 'Gestión de eventos', baseCost: 520, baseDays: 10 },
  { value: 'pos', label: 'Punto de venta (POS)', baseCost: 680, baseDays: 14 },
  { value: 'crm', label: 'CRM / Gestión de clientes', baseCost: 680, baseDays: 14 },
  { value: 'accounting', label: 'Sistema contable', baseCost: 700, baseDays: 14 },
  { value: 'hr', label: 'RRHH / Nómina', baseCost: 760, baseDays: 16 },
  { value: 'wms', label: 'Almacenes (WMS)', baseCost: 800, baseDays: 16 },
  { value: 'construction', label: 'Construcción', baseCost: 820, baseDays: 16 },
  { value: 'education', label: 'Educación / LMS', baseCost: 860, baseDays: 18 },
  { value: 'delivery', label: 'Delivery / Domicilios', baseCost: 880, baseDays: 18 },
  { value: 'mobile', label: 'Aplicación móvil', baseCost: 920, baseDays: 22 },
  { value: 'dating', label: 'App de citas', baseCost: 900, baseDays: 20 },
  { value: 'hospital', label: 'Sistema médico / salud', baseCost: 920, baseDays: 20 },
  { value: 'ecommerce', label: 'Tienda online', baseCost: 720, baseDays: 16 },
  { value: 'realestate', label: 'Portal inmobiliario', baseCost: 720, baseDays: 14 },
  { value: 'fleet', label: 'Gestión de flotas', baseCost: 760, baseDays: 16 },
  { value: 'hotel', label: 'Sistema hotelero', baseCost: 800, baseDays: 16 },
  { value: 'legal', label: 'Buffet jurídico', baseCost: 640, baseDays: 12 },
  { value: 'news', label: 'Portal de noticias', baseCost: 580, baseDays: 10 },
  { value: 'ngo', label: 'ONG / Fundación', baseCost: 360, baseDays: 6 },
  { value: 'forum', label: 'Foro / Comunidad', baseCost: 640, baseDays: 14 },
  { value: 'marketplace', label: 'Marketplace / Multivendedor', baseCost: 1200, baseDays: 26 },
  { value: 'social', label: 'Red social', baseCost: 1200, baseDays: 26 },
  { value: 'streaming', label: 'Plataforma streaming', baseCost: 1400, baseDays: 28 },
  { value: 'both', label: 'Web + App móvil', baseCost: 1380, baseDays: 30 },
  { value: 'saas', label: 'SaaS / Plataforma multi-tenant', baseCost: 1500, baseDays: 30 },
  { value: 'custom', label: 'Personalizado', baseCost: 500, baseDays: 10 },
]

const COMPLEXITY = [
  { value: 'simple', label: 'Simple', multiplier: 0.9, risk: 2, buffer: 0.06 },
  { value: 'medium', label: 'Media', multiplier: 1, risk: 4, buffer: 0.1 },
  { value: 'advanced', label: 'Avanzada', multiplier: 1.28, risk: 7, buffer: 0.16 },
  { value: 'enterprise', label: 'Muy compleja', multiplier: 1.55, risk: 9, buffer: 0.24 },
]

const DESIGN_LEVELS = [
  { value: 'basic', label: 'Básico', cost: 90, multiplier: 0.92, risk: 0 },
  { value: 'premium', label: 'Premium', cost: 220, multiplier: 1.12, risk: 1 },
  { value: 'custom', label: 'Muy personalizado', cost: 420, multiplier: 1.28, risk: 3 },
]

const MAINTENANCE_OPTIONS = [
  { value: 'none', label: 'Sin mantenimiento', multiplier: 0 },
  { value: 'monthly', label: 'Mensual', multiplier: 0.06 },
  { value: 'annual', label: 'Anual', multiplier: 0.05 },
]

const MODULES = [
  { key: 'contact', label: 'Formulario de contacto', price: 100, difficulty: 1, risk: 0, maintenance: 0, types: ['landing', 'portfolio', 'blog', 'web', 'booking', 'inventory', 'gym', 'restaurant', 'crm', 'education', 'ecommerce', 'delivery', 'forum', 'realestate', 'hotel', 'hospital', 'mobile', 'fleet', 'marketplace', 'both', 'saas'] },
  { key: 'auth', label: 'Login y registro', price: 170, difficulty: 2, risk: 1, maintenance: 1, types: ['web', 'booking', 'inventory', 'gym', 'restaurant', 'crm', 'education', 'ecommerce', 'delivery', 'forum', 'realestate', 'hotel', 'hospital', 'mobile', 'fleet', 'marketplace', 'both', 'saas'] },
  { key: 'roles', label: 'Roles y permisos', price: 210, difficulty: 3, risk: 2, maintenance: 1, types: ['web', 'crm', 'education', 'ecommerce', 'forum', 'hospital', 'marketplace', 'saas', 'both'] },
  { key: 'adminPanel', label: 'Panel administrativo', price: 300, difficulty: 4, risk: 2, maintenance: 2, types: ['web', 'booking', 'inventory', 'gym', 'restaurant', 'crm', 'education', 'ecommerce', 'delivery', 'forum', 'realestate', 'hotel', 'hospital', 'fleet', 'marketplace', 'both', 'saas'] },
  { key: 'dashboard', label: 'Dashboard con gráficos', price: 230, difficulty: 3, risk: 1, maintenance: 1, types: ['web', 'booking', 'inventory', 'gym', 'restaurant', 'crm', 'education', 'ecommerce', 'delivery', 'realestate', 'hotel', 'hospital', 'fleet', 'marketplace', 'both', 'saas'] },
  { key: 'reports', label: 'Reportes y exportación', price: 240, difficulty: 4, risk: 2, maintenance: 2, types: ['web', 'inventory', 'crm', 'education', 'ecommerce', 'hospital', 'fleet', 'marketplace', 'saas', 'both'] },
  { key: 'ecommerce', label: 'Catálogo y carrito', price: 360, difficulty: 5, risk: 3, maintenance: 3, types: ['ecommerce', 'marketplace', 'restaurant', 'delivery', 'both'] },
  { key: 'booking', label: 'Calendario y reservas', price: 260, difficulty: 4, risk: 2, maintenance: 2, types: ['booking', 'gym', 'restaurant', 'hotel', 'realestate', 'education'] },
  { key: 'chat', label: 'Chat en vivo', price: 220, difficulty: 4, risk: 2, maintenance: 2, types: ['web', 'ecommerce', 'forum', 'education', 'hospital', 'saas', 'both'] },
  { key: 'payments', label: 'Sistema de pagos', price: 280, difficulty: 5, risk: 4, maintenance: 3, types: ['ecommerce', 'booking', 'gym', 'restaurant', 'delivery', 'hotel', 'marketplace', 'saas', 'both'] },
  { key: 'files', label: 'Carga de archivos', price: 150, difficulty: 3, risk: 2, maintenance: 2, types: ['web', 'education', 'crm', 'hospital', 'forum', 'saas', 'both'] },
  { key: 'notifications', label: 'Notificaciones (email/SMS)', price: 170, difficulty: 3, risk: 2, maintenance: 2, types: ['web', 'booking', 'gym', 'crm', 'education', 'ecommerce', 'delivery', 'realestate', 'hotel', 'hospital', 'forum', 'marketplace', 'both', 'saas'] },
  { key: 'multilanguage', label: 'Multilenguaje', price: 190, difficulty: 3, risk: 1, maintenance: 1, types: ['web', 'ecommerce', 'blog', 'education', 'saas', 'marketplace', 'both'] },
  { key: 'security', label: 'Seguridad avanzada', price: 260, difficulty: 5, risk: 3, maintenance: 2, types: ['ecommerce', 'saas', 'both', 'hospital', 'marketplace'] },
  { key: 'subscriptions', label: 'Suscripciones y membresías', price: 320, difficulty: 5, risk: 4, maintenance: 3, types: ['gym', 'saas', 'education', 'forum', 'booking'] },
  { key: 'clients', label: 'Gestión de clientes/CRM', price: 230, difficulty: 3, risk: 2, maintenance: 2, types: ['crm', 'web', 'inventory', 'restaurant', 'hotel', 'hospital', 'fleet', 'realestate', 'both', 'saas'] },
  { key: 'inventory', label: 'Control de inventario', price: 280, difficulty: 4, risk: 2, maintenance: 2, types: ['inventory', 'ecommerce', 'restaurant', 'delivery', 'marketplace', 'fleet'] },
  { key: 'attendance', label: 'Asistencia / check-in', price: 200, difficulty: 3, risk: 1, maintenance: 1, types: ['gym', 'education', 'hospital', 'hotel'] },
  { key: 'menu', label: 'Menú digital / carta', price: 160, difficulty: 2, risk: 1, maintenance: 1, types: ['restaurant'] },
  { key: 'courses', label: 'Cursos / lecciones', price: 340, difficulty: 5, risk: 3, maintenance: 3, types: ['education', 'saas'] },
  { key: 'ratings', label: 'Valoraciones y reseñas', price: 180, difficulty: 3, risk: 1, maintenance: 1, types: ['ecommerce', 'marketplace', 'delivery', 'hotel', 'restaurant', 'realestate', 'forum'] },
  { key: 'geolocation', label: 'Geolocalización / mapas', price: 240, difficulty: 4, risk: 2, maintenance: 2, types: ['delivery', 'realestate', 'hotel', 'fleet', 'mobile'] },
  { key: 'scheduling', label: 'Agenda / horarios', price: 220, difficulty: 3, risk: 2, maintenance: 1, types: ['booking', 'gym', 'hospital', 'education'] },
  { key: 'push', label: 'Notificaciones push', price: 220, difficulty: 4, risk: 3, maintenance: 3, types: ['mobile', 'delivery', 'both', 'saas'] },
  { key: 'offline', label: 'Modo offline', price: 280, difficulty: 5, risk: 3, maintenance: 2, types: ['mobile', 'delivery', 'both'] },
  { key: 'tracking', label: 'Tracking / seguimiento', price: 300, difficulty: 5, risk: 3, maintenance: 2, types: ['delivery', 'fleet', 'mobile'] },
]

const INTEGRATIONS = [
  { key: 'gateway', label: 'Pasarela de pagos', price: 240, difficulty: 5, risk: 4, maintenance: 3, types: ['ecommerce', 'booking', 'restaurant', 'marketplace', 'hotel', 'delivery', 'saas', 'both', 'gym'] },
  { key: 'whatsapp', label: 'WhatsApp API', price: 260, difficulty: 5, risk: 4, maintenance: 4, types: ['web', 'ecommerce', 'booking', 'gym', 'restaurant', 'crm', 'delivery', 'hotel', 'hospital', 'both', 'saas'] },
  { key: 'openai', label: 'OpenAI / IA', price: 300, difficulty: 5, risk: 4, maintenance: 4, types: ['web', 'crm', 'education', 'saas', 'both'] },
  { key: 'maps', label: 'Google Maps', price: 150, difficulty: 3, risk: 2, maintenance: 2, types: ['delivery', 'realestate', 'hotel', 'fleet', 'mobile', 'restaurant'] },
  { key: 'sri', label: 'Facturación electrónica / SRI', price: 420, difficulty: 6, risk: 5, maintenance: 5, types: ['ecommerce', 'marketplace', 'inventory', 'restaurant', 'hotel', 'web', 'saas'] },
  { key: 'email', label: 'Email transaccional', price: 140, difficulty: 3, risk: 2, maintenance: 2, types: ['web', 'booking', 'gym', 'crm', 'education', 'ecommerce', 'delivery', 'forum', 'hotel', 'hospital', 'marketplace', 'both', 'saas'] },
  { key: 'socialLogin', label: 'Login Google/Facebook', price: 180, difficulty: 4, risk: 3, maintenance: 2, types: ['web', 'ecommerce', 'education', 'forum', 'saas', 'both'] },
  { key: 'crm', label: 'CRM externo (HubSpot, etc)', price: 340, difficulty: 5, risk: 4, maintenance: 4, types: ['web', 'ecommerce', 'crm', 'saas', 'both'] },
  { key: 'erp', label: 'ERP externo', price: 520, difficulty: 7, risk: 6, maintenance: 5, types: ['web', 'inventory', 'saas', 'both'] },
  { key: 'storage', label: 'Cloud storage (S3, etc)', price: 170, difficulty: 3, risk: 2, maintenance: 3, types: ['web', 'education', 'forum', 'saas', 'both', 'hospital'] },
  { key: 'push', label: 'Push notifications (FCM/APNS)', price: 220, difficulty: 4, risk: 3, maintenance: 3, types: ['mobile', 'delivery', 'both', 'saas'] },
  { key: 'calendar', label: 'Google Calendar / Outlook', price: 200, difficulty: 4, risk: 3, maintenance: 2, types: ['booking', 'education', 'hotel', 'hospital', 'gym'] },
  { key: 'sms', label: 'SMS / Twilio', price: 180, difficulty: 3, risk: 2, maintenance: 2, types: ['booking', 'delivery', 'hospital', 'gym', 'restaurant'] },
  { key: 'analytics', label: 'Google Analytics / Meta', price: 130, difficulty: 2, risk: 1, maintenance: 1, types: ['landing', 'web', 'ecommerce', 'blog', 'portfolio', 'realestate', 'marketplace', 'both', 'saas'] },
  { key: 'ml', label: 'Machine Learning / IA', price: 500, difficulty: 7, risk: 6, maintenance: 5, types: ['saas', 'crm', 'education', 'hospital'] },
]

const COUNTRIES = [
  { code: 'EC', label: 'Ecuador' },
  { code: 'CO', label: 'Colombia' },
  { code: 'PE', label: 'Perú' },
  { code: 'MX', label: 'México' },
  { code: 'AR', label: 'Argentina' },
  { code: 'CL', label: 'Chile' },
  { code: 'US', label: 'Estados Unidos' },
  { code: 'ES', label: 'España' },
  { code: 'OTHER', label: 'Otro país' },
]

const DEFAULT_COUPONS = [
  { id: 'coupon-10', label: '10%', percent: 10, expiresAt: '2026-08-15' },
  { id: 'coupon-20', label: '20%', percent: 20, expiresAt: '2026-08-15' },
  { id: 'coupon-30', label: '30%', percent: 30, expiresAt: '2026-08-15' },
]

function isCouponValid(coupon) {
  if (!coupon) return false
  const expires = coupon.expiresAt ? new Date(coupon.expiresAt) : null
  return expires ? new Date() <= expires : false
}

function getCountryDiscount(code) {
  if (code === 'EC') return 0.5
  if (LATAM.includes(code)) return 0.25
  return 0
}

function sumItems(items, keys, field) {
  return items.filter(item => keys.includes(item.key)).reduce((sum, item) => sum + Number(item[field] || 0), 0)
}

function riskLabel(score) {
  if (score >= 18) return 'Alto'
  if (score >= 10) return 'Medio'
  return 'Bajo'
}

function calculateWorkdays(from, to) {
  let count = 0
  const current = new Date(from)
  while (current <= to) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return Math.max(1, count)
}

function addWorkDays(startDate, workDays) {
  const date = new Date(startDate)
  let remaining = Math.max(1, Math.ceil(workDays))
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() !== 0) remaining -= 1
  }
  return date
}

function deriveComplexity(projectType, selectedModules, selectedIntegrations, designLevel) {
  const moduleCount = selectedModules.length
  const integrationCount = selectedIntegrations.length
  const moduleDiff = sumItems(MODULES, selectedModules, 'difficulty') + sumItems(INTEGRATIONS, selectedIntegrations, 'difficulty')
  const designIdx = DESIGN_LEVELS.indexOf(designLevel)

  let score = 0
  score += moduleCount * 1.5
  score += integrationCount * 2.5
  score += moduleDiff * 0.4
  score += designIdx * 2
  if (projectType.baseDays >= 20) score += 3
  if (projectType.baseCost >= 1000) score += 2

  if (score >= 28) return COMPLEXITY[3]
  if (score >= 18) return COMPLEXITY[2]
  if (score >= 9) return COMPLEXITY[1]
  return COMPLEXITY[0]
}

function calculateProjectPrice({ form, modules, integrations, coupons }) {
  const projectType = PROJECT_TYPES.find(item => item.value === form.projectType) || PROJECT_TYPES[0]
  const design = DESIGN_LEVELS.find(item => item.value === form.designLevel) || DESIGN_LEVELS[1]
  const maintenance = MAINTENANCE_OPTIONS.find(item => item.value === form.maintenance) || MAINTENANCE_OPTIONS[0]
  const coupon = coupons.find(item => item.id === form.couponId && isCouponValid(item))

  const complexity = deriveComplexity(projectType, modules, integrations, design)
  const moduleCost = sumItems(MODULES, modules, 'price')
  const integrationCost = sumItems(INTEGRATIONS, integrations, 'price')
  const moduleRisk = sumItems(MODULES, modules, 'risk')
  const integrationRisk = sumItems(INTEGRATIONS, integrations, 'risk')
  const maintenanceWeight = sumItems(MODULES, modules, 'maintenance') + sumItems(INTEGRATIONS, integrations, 'maintenance')

  const workDays = form.deliveryDate
    ? calculateWorkdays(new Date(), new Date(form.deliveryDate))
    : projectType.baseDays

  const internalLabor = workDays * Number(form.devs || 1) * DAILY_DEV_RATE
  const baseWithoutLabor = projectType.baseCost + Number(form.domain || 0)
  const customizationCost = design.cost * design.multiplier
  const weightedCost = (baseWithoutLabor + moduleCost + integrationCost + customizationCost) * complexity.multiplier
  const riskScore = complexity.risk + design.risk + moduleRisk + integrationRisk
  const dynamicBufferRate = complexity.buffer + (integrations.length >= 3 ? 0.06 : 0) + (modules.length >= 8 ? 0.04 : 0) + (riskScore >= 18 ? 0.05 : 0)
  const bufferApplied = (baseWithoutLabor + moduleCost + integrationCost + customizationCost) * dynamicBufferRate
  const subtotalBeforeDiscount = weightedCost + bufferApplied + internalLabor
  const discountableBase = weightedCost + bufferApplied
  const countryDiscount = discountableBase * getCountryDiscount(form.country)
  const couponDiscount = coupon ? (subtotalBeforeDiscount - countryDiscount) * (coupon.percent / 100) : 0
  const recommended = Math.max(0, Math.round(subtotalBeforeDiscount - countryDiscount - couponDiscount))
  const minimum = Math.max(0, Math.round(subtotalBeforeDiscount * 0.78 - countryDiscount - couponDiscount))
  const premium = Math.round(recommended * 1.28)
  const maintenanceMonthly = Math.max(25, Math.round((baseWithoutLabor + moduleCost + integrationCost) * (maintenance.multiplier || 0.06) + maintenanceWeight * 5))
  const maintenanceSuggestion = form.maintenance === 'annual' ? Math.round(maintenanceMonthly * 12 * 0.85) : maintenanceMonthly

  const warnings = []
  const profit = recommended - internalLabor - weightedCost - bufferApplied
  const profitability = recommended > 0 ? profit / recommended : 0
  if (profitability < 0.15) warnings.push('Margen bajo para el nivel de esfuerzo.')
  if (integrations.length >= 4) warnings.push('Muchas integraciones externas, conviene subir buffer.')
  if (form.maintenance === 'none' && (riskScore >= 14 || maintenanceWeight >= 14)) warnings.push('Proyecto complejo sin mantenimiento incluido.')

  return {
    inputs: { form, modules, integrations },
    complexity,
    breakdown: {
      baseWithoutLabor,
      internalLabor,
      moduleCost,
      integrationCost,
      customizationCost,
      bufferApplied,
      countryDiscount,
      couponDiscount,
      subtotalBeforeDiscount,
    },
    prices: { minimum, recommended, premium },
    meta: {
      riskScore,
      riskLabel: riskLabel(riskScore),
      profitability,
      profit,
      workDays,
      deliveryDate: addWorkDays(new Date(), workDays / Math.max(1, Number(form.devs || 1))),
      maintenanceMonthly,
      maintenanceSuggestion,
      maintenanceIncluded: form.maintenance !== 'none',
      warnings,
    },
  }
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-dark-500">{label}</span>
      {children}
    </label>
  )
}

function MoneyRow({ label, value, tone = 'text-white' }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-dark-400">{label}</span>
      <span className={`font-semibold ${tone}`}>{formatMoney(value)}</span>
    </div>
  )
}

function SearchSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="w-full flex items-center gap-3 rounded-2xl border-2 border-dark-700 bg-dark-950 px-5 py-4 text-left cursor-pointer transition-all duration-200 hover:border-fizzia-500/40 focus:outline-none focus:border-fizzia-500 group"
      >
        <svg className="shrink-0 text-dark-500 group-hover:text-fizzia-400 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <span className={`flex-1 text-base ${selected ? 'text-white font-semibold' : 'text-dark-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`shrink-0 text-dark-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-dark-900 border border-dark-700/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="p-3 border-b border-dark-800">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-dark-800/80 border border-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-fizzia-500/60 placeholder:text-dark-500 transition-colors"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-dark-800/50">
            {filtered.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                className={`w-full text-left px-4 py-3.5 text-sm transition-all duration-150 cursor-pointer flex items-center justify-between group ${
                  value === opt.value
                    ? 'bg-fizzia-500/10 text-fizzia-400'
                    : 'text-dark-200 hover:bg-dark-800/60 hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[11px] text-dark-500 font-mono">${opt.baseCost}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-dark-500">
                <svg className="mx-auto mb-2 text-dark-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                Sin resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleGrid({ items, selected, onToggle }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(item => (
        <button
          key={item.key}
          type="button"
          onClick={() => onToggle(item.key)}
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-all ${
            selected.includes(item.key)
              ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-white'
              : 'border-dark-800 bg-dark-950/70 text-dark-300 hover:border-dark-700'
          }`}
        >
          <span className="material-symbols-rounded text-base">{selected.includes(item.key) ? 'check_circle' : 'add_circle'}</span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{item.label}</span>
            <span className="text-xs text-dark-500">{formatMoney(item.price)}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export function PriceCalculatorPage() {
  const [phase, setPhase] = useState('type')
  const [form, setForm] = useState({
    projectType: '',
    country: 'EC',
    designLevel: 'premium',
    devs: 1,
    deliveryDate: '',
    domain: 20,
    maintenance: 'none',
  })
  const [selectedModules, setSelectedModules] = useState([])
  const [selectedIntegrations, setSelectedIntegrations] = useState([])
  const [coupons, setCoupons] = useState(DEFAULT_COUPONS)
  const [result, setResult] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [quoteText, setQuoteText] = useState('')
  const [copied, setCopied] = useState(false)

  const projectType = PROJECT_TYPES.find(p => p.value === form.projectType)
  const isCustom = form.projectType === 'custom'
  const availableModules = projectType
    ? (isCustom ? MODULES : MODULES.filter(m => m.types.includes(form.projectType)))
    : []
  const availableIntegrations = projectType
    ? (isCustom ? INTEGRATIONS : INTEGRATIONS.filter(m => m.types.includes(form.projectType)))
    : []

  useEffect(() => {
    const saved = localStorage.getItem('fizzia-admin-coupons')
    if (saved) {
      try { setCoupons(JSON.parse(saved)) } catch { setCoupons(DEFAULT_COUPONS) }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('fizzia-admin-coupons', JSON.stringify(coupons))
  }, [coupons])

  const inputKey = useMemo(() => JSON.stringify({ form, selectedModules, selectedIntegrations }), [form, selectedModules, selectedIntegrations])
  const dirty = result && result.inputKey !== inputKey

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setCopied(false)
  }

  const handleSelectProjectType = (value) => {
    setForm(prev => ({ ...prev, projectType: value }))
    setSelectedModules([])
    setSelectedIntegrations([])
    setPhase('form')
    setCopied(false)
  }

  const toggleItem = (setter, key) => {
    setter(prev => prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key])
    setCopied(false)
  }

  const calculate = () => {
    setCalculating(true)
    setQuoteText('')
    window.setTimeout(() => {
      const nextResult = calculateProjectPrice({ form, modules: selectedModules, integrations: selectedIntegrations, coupons })
      setResult({ ...nextResult, inputKey })
      setCalculating(false)
    }, 650)
  }

  const clear = () => {
    setPhase('type')
    setForm({
      projectType: '',
      country: 'EC',
      designLevel: 'premium',
      devs: 1,
      deliveryDate: '',
      domain: 20,
      maintenance: 'none',
    })
    setSelectedModules([])
    setSelectedIntegrations([])
    setResult(null)
    setQuoteText('')
    setCopied(false)
  }

  const handleChangeProjectType = () => {
    setPhase('type')
    setResult(null)
    setQuoteText('')
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  const resultText = result ? [
    `Precio mínimo: ${formatMoney(result.prices.minimum)}`,
    `Precio recomendado: ${formatMoney(result.prices.recommended)}`,
    `Precio premium: ${formatMoney(result.prices.premium)}`,
    `Riesgo: ${result.meta.riskLabel}`,
    `Días laborables: ${Math.ceil(result.meta.workDays)}`,
    `Mantenimiento sugerido: ${formatMoney(result.meta.maintenanceMonthly)}/mes`,
  ].join('\n') : ''

  const copyResult = async () => {
    if (!resultText) return
    await navigator.clipboard.writeText(resultText)
    setCopied(true)
  }

  const generateQuote = () => {
    if (!result) return
    setQuoteText(`Hola, revisamos el alcance del proyecto y el precio recomendado es ${formatMoney(result.prices.recommended)}. Incluye los módulos e integraciones definidos, una entrega estimada de ${Math.ceil(result.meta.workDays)} días laborables y una sugerencia de mantenimiento de ${formatMoney(result.meta.maintenanceMonthly)}/mes.`)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Calculadora de precio</h1>
        {dirty && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
            Cambios detectados, vuelve a calcular
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <section className="space-y-5 rounded-2xl border border-dark-800 bg-dark-900/60 p-4 sm:p-5">
          {phase === 'type' ? (
            <div className="py-12 md:py-16">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-fizzia-500/20 to-fizzia-600/10 text-fizzia-400 mb-4 ring-1 ring-fizzia-500/20">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-white">
                  ¿Qué tipo de proyecto necesitas?
                </p>
                <p className="text-dark-400 text-sm mt-1.5">
                  Selecciona el que más se acerque a tu idea
                </p>
              </div>
              <div className="max-w-lg mx-auto">
                <SearchSelect
                  options={PROJECT_TYPES}
                  value={form.projectType}
                  onChange={handleSelectProjectType}
                  placeholder="Busca el tipo de proyecto..."
                />
              </div>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-3 pb-4 border-b border-dark-800/60">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-fizzia-500 text-white text-[11px] font-black">✓</span>
                  <span className="text-fizzia-400">{projectType?.label}</span>
                </div>
                <svg className="text-dark-600" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                <span className="text-dark-400 text-xs font-medium">Detalles del proyecto</span>
                <button onClick={handleChangeProjectType} className="ml-auto text-dark-500 hover:text-dark-300 cursor-pointer transition-colors" title="Cambiar tipo">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="País">
                  <select value={form.country} onChange={e => update('country', e.target.value)} className="w-full rounded-xl border border-dark-700 bg-dark-950/80 px-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors cursor-pointer">
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Diseño visual">
                  <select value={form.designLevel} onChange={e => update('designLevel', e.target.value)} className="w-full rounded-xl border border-dark-700 bg-dark-950/80 px-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors cursor-pointer">
                    {DESIGN_LEVELS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </Field>
                <Field label="Desarrolladores">
                  <input type="number" min="1" max="12" value={form.devs} onChange={e => update('devs', e.target.value)} className="w-full rounded-xl border border-dark-700 bg-dark-950/80 px-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors" />
                </Field>
                <Field label="Fecha de entrega">
                  <input type="date" min={todayStr} value={form.deliveryDate} onChange={e => update('deliveryDate', e.target.value)} className="w-full rounded-xl border border-dark-700 bg-dark-950/80 px-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors [color-scheme:dark]" />
                </Field>
                <Field label="Dominio / hosting ($)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 text-sm font-mono">$</span>
                    <input type="number" min="0" step="0.01" value={form.domain} onChange={e => update('domain', e.target.value)} placeholder="20.00" className="w-full rounded-xl border border-dark-700 bg-dark-950/80 pl-7 pr-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors" />
                  </div>
                </Field>
                <Field label="Mantenimiento">
                  <select value={form.maintenance} onChange={e => update('maintenance', e.target.value)} className="w-full rounded-xl border border-dark-700 bg-dark-950/80 px-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors cursor-pointer">
                    {MAINTENANCE_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </Field>
                <Field label="Cupón">
                  <select value={form.couponId} onChange={e => update('couponId', e.target.value)} className="w-full rounded-xl border border-dark-700 bg-dark-950/80 px-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors cursor-pointer">
                    <option value="">Sin cupón</option>
                    {coupons.filter(isCouponValid).map(coupon => (
                      <option key={coupon.id} value={coupon.id}>{coupon.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {availableModules.length > 0 && (
                <div>
                  <h2 className="mb-3 text-lg font-bold text-white">Módulos</h2>
                  <ToggleGrid items={availableModules} selected={selectedModules} onToggle={(key) => toggleItem(setSelectedModules, key)} />
                </div>
              )}

              {availableIntegrations.length > 0 && (
                <div>
                  <h2 className="mb-3 text-lg font-bold text-white">Integraciones</h2>
                  <ToggleGrid items={availableIntegrations} selected={selectedIntegrations} onToggle={(key) => toggleItem(setSelectedIntegrations, key)} />
                </div>
              )}
            </>
          )}
        </section>

        <aside className="space-y-4">
          {phase === 'form' && (
            <button onClick={calculate} disabled={calculating || !form.deliveryDate} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-4 text-sm font-bold text-white hover:bg-[var(--accent-lighter)] disabled:opacity-60">
              {calculating && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {calculating ? 'Calculando...' : 'Calcular precio del proyecto'}
            </button>
          )}

          {result && (
            <div className="space-y-4 rounded-2xl border border-[var(--accent)]/30 bg-dark-900 p-5 shadow-2xl shadow-black/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Resultado</h2>
                  <p className="mt-1 text-3xl font-black text-[var(--accent)]">{formatMoney(result.prices.recommended)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  result.meta.riskLabel === 'Alto' ? 'bg-red-500/15 text-red-300' :
                  result.meta.riskLabel === 'Medio' ? 'bg-amber-500/15 text-amber-300' :
                  'bg-green-500/15 text-green-300'
                }`}>
                  {result.meta.riskLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-dark-950 p-3"><p className="text-xs text-dark-500">Mínimo</p><p className="text-sm font-bold text-white">{formatMoney(result.prices.minimum)}</p></div>
                <div className="rounded-xl bg-[var(--accent)]/10 p-3"><p className="text-xs text-dark-500">Recomendado</p><p className="text-sm font-bold text-white">{formatMoney(result.prices.recommended)}</p></div>
                <div className="rounded-xl bg-dark-950 p-3"><p className="text-xs text-dark-500">Premium</p><p className="text-sm font-bold text-white">{formatMoney(result.prices.premium)}</p></div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-dark-950 px-3 py-1 text-xs font-semibold text-dark-200">{result.complexity.label}</span>
                <span className="rounded-full bg-dark-950 px-3 py-1 text-xs font-semibold text-dark-200">{Math.ceil(result.meta.workDays)} días lab.</span>
                <span className="rounded-full bg-dark-950 px-3 py-1 text-xs font-semibold text-dark-200">Riesgo {result.meta.riskLabel}</span>
              </div>

              <div className="space-y-2 border-t border-dark-800 pt-4">
                <MoneyRow label="Base del proyecto" value={result.breakdown.baseWithoutLabor} />
                <MoneyRow label="Mano de obra (días)" value={result.breakdown.internalLabor} />
                <MoneyRow label="Módulos" value={result.breakdown.moduleCost} />
                <MoneyRow label="Integraciones" value={result.breakdown.integrationCost} />
                <MoneyRow label="Diseño" value={result.breakdown.customizationCost} />
                <MoneyRow label="Buffer de riesgo" value={result.breakdown.bufferApplied} />
                <MoneyRow label="Descuento país" value={result.breakdown.countryDiscount} tone="text-green-300" />
                {result.breakdown.couponDiscount > 0 && (
                  <MoneyRow label="Cupón" value={result.breakdown.couponDiscount} tone="text-green-300" />
                )}
                <div className="border-t border-dark-700 pt-2">
                  <MoneyRow label="Total estimado" value={result.prices.recommended} />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-dark-300">
                  Mantenimiento sugerido: <span className="text-white font-semibold">{formatMoney(result.meta.maintenanceMonthly)}/mes</span>
                </p>
                <p className="text-xs text-dark-500">
                  * Mano de obra por días no aplica descuento por país
                </p>
              </div>

              {result.meta.warnings.length > 0 && (
                <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  {result.meta.warnings.map(w => <p key={w} className="text-sm text-amber-300">{w}</p>)}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-3">
                <button onClick={copyResult} className="cursor-pointer rounded-xl border border-dark-700 px-3 py-2 text-sm font-semibold text-dark-200 hover:bg-dark-800">{copied ? 'Copiado' : 'Copiar'}</button>
                <button onClick={generateQuote} className="cursor-pointer rounded-xl border border-dark-700 px-3 py-2 text-sm font-semibold text-dark-200 hover:bg-dark-800">Cotización</button>
                <button onClick={clear} className="cursor-pointer rounded-xl border border-dark-700 px-3 py-2 text-sm font-semibold text-dark-200 hover:bg-dark-800">Limpiar</button>
              </div>

              {quoteText && (
                <textarea value={quoteText} readOnly rows={4} className="w-full resize-none rounded-xl border border-dark-700 bg-dark-950 px-3 py-2 text-sm text-dark-200 outline-none" />
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
