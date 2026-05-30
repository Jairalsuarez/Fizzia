import { useEffect, useMemo, useState, useRef } from 'react'
import { formatDate, formatMoney } from '../../utils/format'

const DAILY_DEV_RATE = 20
const BASELINE_WORKDAYS_FOR_FULL_PRICE = 5
const MAX_DISCOUNT_WORKDAYS = 20
const MAX_SCHEDULE_DISCOUNT = 0.15
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

const MAINTENANCE_OPTIONS = [
  { value: 'none', label: 'Sin mantenimiento', multiplier: 0 },
  { value: 'monthly', label: 'Mensual', multiplier: 0.06 },
  { value: 'annual', label: 'Anual', multiplier: 0.05 },
]

const EXTRAS = [
  { key: 'advancedAuth', label: 'Autenticación avanzada y roles', price: 320, difficulty: 5, risk: 3, maintenance: 2, types: ['web', 'booking', 'inventory', 'gym', 'restaurant', 'crm', 'education', 'ecommerce', 'delivery', 'forum', 'realestate', 'hotel', 'hospital', 'mobile', 'marketplace', 'both', 'saas'] },
  { key: 'adminAnalytics', label: 'Dashboard ejecutivo con métricas', price: 380, difficulty: 5, risk: 2, maintenance: 2, types: ['web', 'booking', 'inventory', 'gym', 'restaurant', 'crm', 'education', 'ecommerce', 'delivery', 'realestate', 'hotel', 'hospital', 'fleet', 'marketplace', 'both', 'saas'] },
  { key: 'reportsExport', label: 'Reportes avanzados y exportación', price: 340, difficulty: 5, risk: 3, maintenance: 2, types: ['web', 'inventory', 'crm', 'education', 'ecommerce', 'hospital', 'fleet', 'marketplace', 'saas', 'both'] },
  { key: 'paymentSystem', label: 'Pagos en línea y conciliación', price: 420, difficulty: 6, risk: 5, maintenance: 4, types: ['ecommerce', 'booking', 'gym', 'restaurant', 'delivery', 'hotel', 'marketplace', 'saas', 'both'] },
  { key: 'multiVendor', label: 'Gestión multivendedor', price: 720, difficulty: 8, risk: 6, maintenance: 5, types: ['marketplace', 'ecommerce', 'both'] },
  { key: 'inventoryOps', label: 'Inventario con movimientos y alertas', price: 460, difficulty: 6, risk: 4, maintenance: 3, types: ['inventory', 'ecommerce', 'restaurant', 'delivery', 'marketplace', 'fleet'] },
  { key: 'bookingEngine', label: 'Motor de reservas con disponibilidad', price: 430, difficulty: 6, risk: 4, maintenance: 3, types: ['booking', 'gym', 'restaurant', 'hotel', 'realestate', 'education', 'hospital'] },
  { key: 'realtimeChat', label: 'Chat en vivo con historial', price: 360, difficulty: 5, risk: 3, maintenance: 3, types: ['web', 'ecommerce', 'forum', 'education', 'hospital', 'saas', 'both', 'marketplace'] },
  { key: 'automationFlow', label: 'Automatizaciones y estados complejos', price: 520, difficulty: 7, risk: 5, maintenance: 4, types: ['crm', 'saas', 'inventory', 'hospital', 'education', 'marketplace', 'web', 'both'] },
  { key: 'fileWorkflow', label: 'Gestión documental con aprobaciones', price: 420, difficulty: 6, risk: 4, maintenance: 3, types: ['web', 'education', 'crm', 'hospital', 'forum', 'saas', 'both', 'legal'] },
  { key: 'multilanguage', label: 'Multilenguaje administrable', price: 330, difficulty: 5, risk: 2, maintenance: 2, types: ['web', 'ecommerce', 'blog', 'education', 'saas', 'marketplace', 'both', 'hotel'] },
  { key: 'securityHardening', label: 'Seguridad avanzada y auditoría', price: 480, difficulty: 7, risk: 5, maintenance: 4, types: ['ecommerce', 'saas', 'both', 'hospital', 'marketplace', 'crm', 'web'] },
  { key: 'subscriptions', label: 'Suscripciones y membresías', price: 520, difficulty: 7, risk: 5, maintenance: 4, types: ['gym', 'saas', 'education', 'forum', 'booking', 'mobile'] },
  { key: 'coursePlatform', label: 'Cursos, lecciones y progreso', price: 620, difficulty: 7, risk: 4, maintenance: 4, types: ['education', 'saas', 'both'] },
  { key: 'geolocation', label: 'Geolocalización, rutas y mapas', price: 420, difficulty: 6, risk: 4, maintenance: 3, types: ['delivery', 'realestate', 'hotel', 'fleet', 'mobile', 'restaurant', 'both'] },
  { key: 'pushNotifications', label: 'Push notifications FCM/APNS', price: 360, difficulty: 5, risk: 4, maintenance: 4, types: ['mobile', 'delivery', 'both', 'saas'] },
  { key: 'offlineMode', label: 'Modo offline con sincronización', price: 560, difficulty: 8, risk: 6, maintenance: 5, types: ['mobile', 'delivery', 'both', 'fleet'] },
  { key: 'tracking', label: 'Tracking en tiempo real', price: 620, difficulty: 8, risk: 6, maintenance: 5, types: ['delivery', 'fleet', 'mobile', 'both'] },
  { key: 'whatsappApi', label: 'WhatsApp API con automatización', price: 440, difficulty: 6, risk: 5, maintenance: 4, types: ['web', 'ecommerce', 'booking', 'gym', 'restaurant', 'crm', 'delivery', 'hotel', 'hospital', 'both', 'saas'] },
  { key: 'aiAssistant', label: 'IA / asistente inteligente', price: 580, difficulty: 7, risk: 5, maintenance: 5, types: ['web', 'crm', 'education', 'saas', 'both', 'hospital'] },
  { key: 'sriBilling', label: 'Facturación electrónica SRI', price: 720, difficulty: 8, risk: 6, maintenance: 5, types: ['ecommerce', 'marketplace', 'inventory', 'restaurant', 'hotel', 'web', 'saas'] },
  { key: 'externalCrm', label: 'Integración con CRM externo', price: 520, difficulty: 7, risk: 5, maintenance: 4, types: ['web', 'ecommerce', 'crm', 'saas', 'both'] },
  { key: 'erpIntegration', label: 'Integración ERP', price: 760, difficulty: 9, risk: 7, maintenance: 5, types: ['web', 'inventory', 'saas', 'both', 'accounting', 'wms'] },
  { key: 'cloudStorage', label: 'Storage privado en la nube', price: 340, difficulty: 5, risk: 3, maintenance: 3, types: ['web', 'education', 'forum', 'saas', 'both', 'hospital', 'legal'] },
  { key: 'machineLearning', label: 'Machine Learning / predicciones', price: 900, difficulty: 10, risk: 8, maintenance: 6, types: ['saas', 'crm', 'education', 'hospital', 'inventory'] },
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
  if (code === 'EC') return 0.35
  if (LATAM.includes(code)) return 0.15
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
  const current = parseDateInput(toDateInputValue(from))
  const end = parseDateInput(toDateInputValue(to))
  current.setDate(current.getDate() + 1)
  while (current < end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return Math.max(0, count)
}

function toDateInputValue(date = new Date()) {
  const local = new Date(date)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 10)
}

function parseDateInput(value) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function addWorkDays(startDate, workDays) {
  const date = new Date(startDate)
  let remaining = Math.max(1, Math.ceil(workDays))
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() !== 0 && date.getDay() !== 6) remaining -= 1
  }
  return date
}

function getScheduleDiscountRate(availableWorkDays) {
  if (!availableWorkDays || availableWorkDays <= BASELINE_WORKDAYS_FOR_FULL_PRICE) return 0
  const cappedDays = Math.min(availableWorkDays, MAX_DISCOUNT_WORKDAYS)
  const progress = (cappedDays - BASELINE_WORKDAYS_FOR_FULL_PRICE) / (MAX_DISCOUNT_WORKDAYS - BASELINE_WORKDAYS_FOR_FULL_PRICE)
  return Math.max(0, Math.min(MAX_SCHEDULE_DISCOUNT, progress * MAX_SCHEDULE_DISCOUNT))
}

function deriveComplexity(projectType, selectedExtras) {
  const extraCount = selectedExtras.length
  const extraDiff = sumItems(EXTRAS, selectedExtras, 'difficulty')

  let score = 0
  score += extraCount * 2.4
  score += extraDiff * 0.55
  if (projectType.baseDays >= 20) score += 3
  if (projectType.baseCost >= 1000) score += 2

  if (score >= 28) return COMPLEXITY[3]
  if (score >= 18) return COMPLEXITY[2]
  if (score >= 9) return COMPLEXITY[1]
  return COMPLEXITY[0]
}

function calculateProjectPrice({ form, extras, coupons }) {
  const projectType = PROJECT_TYPES.find(item => item.value === form.projectType) || PROJECT_TYPES[0]
  const maintenance = MAINTENANCE_OPTIONS.find(item => item.value === form.maintenance) || MAINTENANCE_OPTIONS[0]
  const coupon = coupons.find(item => item.id === form.couponId && isCouponValid(item))

  const complexity = deriveComplexity(projectType, extras)
  const extraCost = sumItems(EXTRAS, extras, 'price')
  const extraRisk = sumItems(EXTRAS, extras, 'risk')
  const maintenanceWeight = sumItems(EXTRAS, extras, 'maintenance')

  const extraDays = sumItems(EXTRAS, extras, 'difficulty') * 0.9
  const workDays = Math.max(1, Math.ceil(
    projectType.baseDays + extraDays
  ))
  const devCount = Math.max(1, Number(form.devs || 1))
  const estimatedCalendarDays = Math.ceil(workDays / devCount)
  const selectedDeliveryDate = parseDateInput(form.deliveryDate)
  const availableWorkDays = selectedDeliveryDate ? calculateWorkdays(new Date(), selectedDeliveryDate) : estimatedCalendarDays
  const today = parseDateInput(toDateInputValue())
  const deliveryInPast = selectedDeliveryDate && selectedDeliveryDate < today
  const scheduleDiscountRate = deliveryInPast ? 0 : getScheduleDiscountRate(availableWorkDays)

  const internalLabor = workDays * DAILY_DEV_RATE
  const baseWithoutLabor = projectType.baseCost + Number(form.domain || 0)
  const pricedScopeBase = baseWithoutLabor + extraCost
  const weightedCost = pricedScopeBase * complexity.multiplier
  const riskScore = complexity.risk + extraRisk
  const dynamicBufferRate = complexity.buffer + (extras.length >= 4 ? 0.06 : 0) + (riskScore >= 18 ? 0.05 : 0)
  const errorMarginApplied = pricedScopeBase * dynamicBufferRate
  const subtotalBeforeDiscount = weightedCost + errorMarginApplied + internalLabor
  const scheduleDiscount = subtotalBeforeDiscount * scheduleDiscountRate
  const afterScheduleDiscount = subtotalBeforeDiscount - scheduleDiscount
  const countryDiscount = afterScheduleDiscount * getCountryDiscount(form.country)
  const couponDiscount = coupon ? (afterScheduleDiscount - countryDiscount) * (coupon.percent / 100) : 0
  const recommended = Math.max(0, Math.round(subtotalBeforeDiscount - scheduleDiscount - countryDiscount - couponDiscount))
  const minimumSubtotal = subtotalBeforeDiscount * 0.78
  const minimumScheduleDiscount = minimumSubtotal * scheduleDiscountRate
  const minimumAfterScheduleDiscount = minimumSubtotal - minimumScheduleDiscount
  const minimumCountryDiscount = minimumAfterScheduleDiscount * getCountryDiscount(form.country)
  const minimumCouponDiscount = coupon ? (minimumAfterScheduleDiscount - minimumCountryDiscount) * (coupon.percent / 100) : 0
  const minimum = Math.max(0, Math.round(minimumSubtotal - minimumScheduleDiscount - minimumCountryDiscount - minimumCouponDiscount))
  const maintenanceMonthly = Math.max(25, Math.round((baseWithoutLabor + extraCost) * (maintenance.multiplier || 0.06) + maintenanceWeight * 5))
  const maintenanceSuggestion = form.maintenance === 'annual' ? Math.round(maintenanceMonthly * 12 * 0.85) : maintenanceMonthly

  const warnings = []
  const profit = recommended - internalLabor - weightedCost - errorMarginApplied
  const profitability = recommended > 0 ? profit / recommended : 0
  if (deliveryInPast) warnings.push('La fecha de entrega no puede ser anterior a hoy.')
  if (extras.length >= 4) warnings.push('Varios extras complejos, conviene revisar alcance y margen de error.')
  if (form.maintenance === 'none' && (riskScore >= 14 || maintenanceWeight >= 14)) warnings.push('Proyecto complejo sin mantenimiento incluido.')

  return {
    inputs: { form, extras },
    complexity,
    breakdown: {
      baseWithoutLabor,
      internalLabor,
      extraCost,
      errorMarginApplied,
      scheduleDiscount,
      countryDiscount,
      couponDiscount,
      subtotalBeforeDiscount,
    },
    prices: { minimum, recommended },
    meta: {
      riskScore,
      riskLabel: riskLabel(riskScore),
      profitability,
      profit,
      workDays,
      availableWorkDays,
      estimatedCalendarDays,
      deliveryDate: addWorkDays(new Date(), estimatedCalendarDays),
      scheduleDiscountRate,
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
    devs: 1,
    deliveryDate: '',
    domain: 20,
    maintenance: 'none',
  })
  const [selectedExtras, setSelectedExtras] = useState([])
  const [coupons, setCoupons] = useState(DEFAULT_COUPONS)
  const [result, setResult] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [copied, setCopied] = useState(false)

  const projectType = PROJECT_TYPES.find(p => p.value === form.projectType)
  const isCustom = form.projectType === 'custom'
  const availableExtras = projectType
    ? (isCustom ? EXTRAS : EXTRAS.filter(m => m.types.includes(form.projectType)))
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

  const inputKey = useMemo(() => JSON.stringify({ form, selectedExtras }), [form, selectedExtras])
  const dirty = result && result.inputKey !== inputKey

  const update = (key, value) => {
    const nextValue = key === 'deliveryDate' && value && value < todayStr ? todayStr : value
    setForm(prev => ({ ...prev, [key]: nextValue }))
    setCopied(false)
  }

  const handleSelectProjectType = (value) => {
    setForm(prev => ({ ...prev, projectType: value }))
    setSelectedExtras([])
    setPhase('form')
    setCopied(false)
  }

  const toggleItem = (setter, key) => {
    setter(prev => prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key])
    setCopied(false)
  }

  const calculate = () => {
    setCalculating(true)
    const sanitizedForm = {
      ...form,
      deliveryDate: form.deliveryDate && form.deliveryDate < todayStr ? todayStr : form.deliveryDate,
    }
    if (sanitizedForm.deliveryDate !== form.deliveryDate) setForm(sanitizedForm)
    window.setTimeout(() => {
      const nextInputKey = JSON.stringify({ form: sanitizedForm, selectedExtras })
      const nextResult = calculateProjectPrice({ form: sanitizedForm, extras: selectedExtras, coupons })
      setResult({ ...nextResult, inputKey: nextInputKey })
      setCalculating(false)
    }, 650)
  }

  const clear = () => {
    setPhase('type')
    setForm({
      projectType: '',
      country: 'EC',
      devs: 1,
      deliveryDate: '',
      domain: 20,
      maintenance: 'none',
    })
    setSelectedExtras([])
    setResult(null)
    setCopied(false)
  }

  const handleChangeProjectType = () => {
    setPhase('type')
    setResult(null)
  }

  const todayStr = toDateInputValue()

  const resultText = result ? [
    `Precio mínimo: ${formatMoney(result.prices.minimum)}`,
    `Precio recomendado: ${formatMoney(result.prices.recommended)}`,
    `Riesgo: ${result.meta.riskLabel}`,
    `Días laborables disponibles: ${Math.ceil(result.meta.availableWorkDays)}`,
    `Mantenimiento sugerido: ${formatMoney(result.meta.maintenanceMonthly)}/mes`,
  ].join('\n') : ''

  const copyResult = async () => {
    if (!resultText) return
    await navigator.clipboard.writeText(resultText)
    setCopied(true)
  }

  const createQuotePdf = () => {
    if (!result || !projectType) return
    const selectedExtraItems = EXTRAS.filter(item => selectedExtras.includes(item.key))
    const quoteNumber = `FZ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    const rows = [
      ['Sistema base', projectType.label, result.breakdown.baseWithoutLabor],
      ...selectedExtraItems.map(item => ['Extra', item.label, item.price]),
      ['Mano de obra estimada', `${Math.ceil(result.meta.workDays)} días laborables`, result.breakdown.internalLabor],
      ['Margen de error', result.complexity.label, result.breakdown.errorMarginApplied],
      ['Subtotal', 'Antes de descuentos', result.breakdown.subtotalBeforeDiscount],
      ...(result.breakdown.scheduleDiscount > 0 ? [['Descuento por plazo', `${Math.ceil(result.meta.availableWorkDays)} días laborables disponibles`, -result.breakdown.scheduleDiscount]] : []),
      ...(result.breakdown.countryDiscount > 0 ? [['Descuento', 'Ajuste por país', -result.breakdown.countryDiscount]] : []),
      ...(result.breakdown.couponDiscount > 0 ? [['Cupón', 'Descuento aplicado', -result.breakdown.couponDiscount]] : []),
    ]
    const rowsHtml = rows.map(([type, detail, amount]) => `
      <tr>
        <td>${type}</td>
        <td>${detail}</td>
        <td class="money">${formatMoney(amount)}</td>
      </tr>
    `).join('')
    const extrasHtml = selectedExtraItems.length
      ? selectedExtraItems.map(item => `<li>${item.label} <span>${formatMoney(item.price)}</span></li>`).join('')
      : '<li>Sin extras adicionales seleccionados <span>$0.00</span></li>'
    const warningsHtml = result.meta.warnings.length
      ? `<div class="notes"><strong>Observaciones</strong>${result.meta.warnings.map(w => `<p>${w}</p>`).join('')}</div>`
      : ''
    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Cotización ${quoteNumber}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172018; background: #f7faf7; }
    .page { background: #ffffff; min-height: 100vh; padding: 34px; border: 1px solid #d8e2da; }
    header { display: flex; justify-content: space-between; gap: 28px; border-bottom: 2px solid #172018; padding-bottom: 22px; }
    .brand h1 { margin: 0; font-size: 30px; letter-spacing: -0.02em; }
    .brand p, .meta p { margin: 4px 0; color: #5a6a5d; font-size: 12px; }
    .badge { display: inline-block; margin-bottom: 8px; padding: 5px 10px; border-radius: 999px; background: #e8f5ea; color: #25713a; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    .meta { text-align: right; }
    .total { margin: 28px 0; padding: 24px; background: #172018; color: #ffffff; display: flex; justify-content: space-between; align-items: end; }
    .total span { display: block; color: #b7c5ba; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    .total strong { font-size: 40px; line-height: 1; }
    h2 { margin: 28px 0 10px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; background: #fff; border: 1px solid #d8e2da; }
    th { text-align: left; color: #5a6a5d; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; background: #eef4ef; }
    th, td { padding: 12px 14px; border-bottom: 1px solid #e4ece5; vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    .money { text-align: right; font-weight: 800; color: #172018; white-space: nowrap; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .box { border: 1px solid #d8e2da; padding: 14px; background: #fbfdfb; }
    .box span { display: block; color: #5a6a5d; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
    .box strong { font-size: 15px; }
    ul { list-style: none; padding: 0; margin: 0; border: 1px solid #d8e2da; }
    li { display: flex; justify-content: space-between; gap: 18px; padding: 11px 14px; border-bottom: 1px solid #e4ece5; font-size: 13px; }
    li:last-child { border-bottom: 0; }
    li span { font-weight: 800; }
    .notes { margin-top: 18px; padding: 14px; background: #fff7ed; border: 1px solid #fed7aa; color: #7c2d12; font-size: 12px; }
    .notes p { margin: 6px 0 0; }
    footer { margin-top: 28px; padding-top: 18px; border-top: 1px solid #d8e2da; color: #5a6a5d; font-size: 11px; display: flex; justify-content: space-between; gap: 24px; }
    @media print { body { background: #ffffff; } .page { border: 0; padding: 0; } }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <div class="brand">
        <span class="badge">Cotización profesional</span>
        <h1>Fizzia</h1>
        <p>Desarrollo de software, sistemas web y aplicaciones</p>
      </div>
      <div class="meta">
        <p><strong>No.</strong> ${quoteNumber}</p>
        <p><strong>Fecha:</strong> ${formatDate(new Date())}</p>
        <p><strong>Vigencia:</strong> 15 días</p>
      </div>
    </header>

    <section class="total">
      <div>
        <span>Proyecto</span>
        <strong>${projectType.label}</strong>
      </div>
      <div style="text-align:right">
        <span>Total recomendado</span>
        <strong>${formatMoney(result.prices.recommended)}</strong>
      </div>
    </section>

    <div class="grid">
      <div class="box"><span>Mínimo</span><strong>${formatMoney(result.prices.minimum)}</strong></div>
      <div class="box"><span>Días laborables</span><strong>${Math.ceil(result.meta.availableWorkDays)}</strong></div>
      <div class="box"><span>Riesgo</span><strong>${result.meta.riskLabel}</strong></div>
    </div>

    <h2>Detalle de cotización</h2>
    <table>
      <thead><tr><th>Concepto</th><th>Detalle</th><th class="money">Valor</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <h2>Extras seleccionados</h2>
    <ul>${extrasHtml}</ul>

    <h2>Resumen operativo</h2>
    <div class="grid">
      <div class="box"><span>Esfuerzo</span><strong>${Math.ceil(result.meta.workDays)} días laborables</strong></div>
      <div class="box"><span>Descuento por plazo</span><strong>${Math.round(result.meta.scheduleDiscountRate * 100)}%</strong></div>
      <div class="box"><span>Mantenimiento sugerido</span><strong>${formatMoney(result.meta.maintenanceMonthly)}/mes</strong></div>
    </div>

    ${warningsHtml}

    <footer>
      <span>Esta cotización es referencial hasta validar alcance final, accesos, contenido y dependencias externas.</span>
      <span>Fizzia</span>
    </footer>
  </main>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 250))</script>
</body>
</html>`
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className="price-calculator space-y-6 p-4 sm:p-6">
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
                <Field label="Desarrolladores">
                  <input type="number" min="1" max="12" value={form.devs} onChange={e => update('devs', e.target.value)} className="w-full rounded-xl border border-dark-700 bg-dark-950/80 px-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors" />
                </Field>
                <Field label="Fecha de entrega">
                  <input type="date" min={todayStr} value={form.deliveryDate} onChange={e => update('deliveryDate', e.target.value)} className="price-date-input w-full rounded-xl border border-dark-700 bg-dark-950/80 px-3 py-3 text-sm text-white outline-none focus:border-[var(--accent)] transition-colors" />
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

              {availableExtras.length > 0 && (
                <div>
                  <h2 className="mb-3 text-lg font-bold text-white">Extras</h2>
                  <ToggleGrid items={availableExtras} selected={selectedExtras} onToggle={(key) => toggleItem(setSelectedExtras, key)} />
                </div>
              )}
            </>
          )}
        </section>

        <aside className="space-y-4">
          {phase === 'form' && (
            <button onClick={calculate} disabled={calculating} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-4 text-sm font-bold text-white hover:bg-[var(--accent-lighter)] disabled:opacity-60">
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
                  <p className="mt-1 text-3xl font-black text-white">{formatMoney(result.prices.recommended)}</p>
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
                <div className="rounded-xl bg-dark-950 p-3"><p className="text-xs text-dark-500">Días laborables</p><p className="text-sm font-bold text-white">{Math.ceil(result.meta.availableWorkDays)}</p></div>
              </div>

              <div className="space-y-2 border-t border-dark-800 pt-4">
                <MoneyRow label="Base del proyecto" value={result.breakdown.baseWithoutLabor} />
                <MoneyRow label="Mano de obra estimada" value={result.breakdown.internalLabor} />
                <MoneyRow label="Extras" value={result.breakdown.extraCost} />
                <MoneyRow label="Margen de error" value={result.breakdown.errorMarginApplied} />
                <div className="border-t border-dark-700 pt-2">
                  <MoneyRow label="Subtotal" value={result.breakdown.subtotalBeforeDiscount} />
                </div>
                {result.breakdown.scheduleDiscount > 0 && (
                  <MoneyRow label={`Descuento por plazo (${Math.round(result.meta.scheduleDiscountRate * 100)}%)`} value={result.breakdown.scheduleDiscount} />
                )}
                <MoneyRow label="Descuento país" value={result.breakdown.countryDiscount} />
                {result.breakdown.couponDiscount > 0 && (
                  <MoneyRow label="Cupón" value={result.breakdown.couponDiscount} />
                )}
                <div className="border-t border-dark-700 pt-2">
                  <MoneyRow label="Total estimado" value={result.prices.recommended} />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-dark-300">
                  Mantenimiento sugerido: <span className="text-white font-semibold">{formatMoney(result.meta.maintenanceMonthly)}/mes</span>
                </p>
              </div>

              {result.meta.warnings.length > 0 && (
                <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  {result.meta.warnings.map(w => <p key={w} className="text-sm text-amber-300">{w}</p>)}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-3">
                <button onClick={copyResult} className="cursor-pointer rounded-xl border border-dark-700 px-3 py-2 text-sm font-semibold text-dark-200 hover:bg-dark-800">{copied ? 'Copiado' : 'Copiar'}</button>
                <button onClick={createQuotePdf} className="cursor-pointer rounded-xl border border-dark-700 px-3 py-2 text-sm font-semibold text-dark-200 hover:bg-dark-800">PDF</button>
                <button onClick={clear} className="cursor-pointer rounded-xl border border-dark-700 px-3 py-2 text-sm font-semibold text-dark-200 hover:bg-dark-800">Limpiar</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
