import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../../components/Toast'
import { createProjectRequest, getMyProjects } from '../../api/projectsApi'
import { useAuth } from '../../features/auth/authContext'
import { AvatarIcon } from '../../data/avatars'

const schema = {
  title: 'Crear Proyecto',
  description: 'Cuéntanos tu idea para ayudarte mejor.',
  steps: [
    { id: 'projectType', title: '¿Qué quieres crear?', field: { type: 'radio', name: 'projectType', options: [{ label: 'Para mi negocio', value: 'business' }, { label: 'Personal', value: 'personal' }] } },
    { id: 'businessName', showIf: { field: 'projectType', equals: 'business' }, title: '¿Cómo se llama tu negocio?', field: { type: 'text', name: 'businessName', placeholder: 'Ejemplo: Tienda María' } },
    { id: 'businessType', showIf: { field: 'projectType', equals: 'business' }, title: '¿A qué se dedica tu negocio?', field: { type: 'text', name: 'businessType', placeholder: 'Ejemplo: Venta de ropa, restaurante, barbería...' } },
    { id: 'businessProblem', showIf: { field: 'projectType', equals: 'business' }, title: '¿Qué problema quieres resolver?', field: { type: 'textarea', name: 'businessProblem', placeholder: 'Cuéntanos qué se te hace difícil actualmente...' } },
    { id: 'businessNeeds', showIf: { field: 'projectType', equals: 'business' }, title: '¿Qué necesitas para tu negocio?', field: { type: 'checkbox', name: 'businessNeeds', options: [{ label: 'Página web', value: 'web' }, { label: 'Tienda online', value: 'tienda' }, { label: 'App móvil', value: 'app' }, { label: 'Sistema de ventas', value: 'sales_system' }, { label: 'No estoy seguro', value: 'not_sure' }] } },
    { id: 'personalIdea', showIf: { field: 'projectType', equals: 'personal' }, title: 'Cuéntanos tu idea', field: { type: 'textarea', name: 'personalIdea', placeholder: 'Explícala de la forma más simple posible...' } },
    { id: 'personalGoal', showIf: { field: 'projectType', equals: 'personal' }, title: '¿Qué quieres lograr con esto?', field: { type: 'textarea', name: 'personalGoal', placeholder: 'Ejemplo: Organizar algo, crear contenido, vender, aprender...' } },
    { id: 'personalNeeds', showIf: { field: 'projectType', equals: 'personal' }, title: '¿Qué crees que necesitas?', field: { type: 'checkbox', name: 'personalNeeds', options: [{ label: 'Página web', value: 'web' }, { label: 'App móvil', value: 'app' }, { label: 'Diseño', value: 'design' }, { label: 'No estoy seguro', value: 'not_sure' }] } },
    { id: 'references', title: '¿Has visto algo parecido?', field: { type: 'textarea', name: 'references', placeholder: 'Puedes pegar links o explicar alguna idea similar...' } },
    { id: 'extraInfo', title: '¿Hay algo más que debamos saber?', field: { type: 'textarea', name: 'extraInfo', placeholder: 'Cualquier detalle importante...' } },
    { id: 'urgency', title: '¿Qué tan pronto quieres empezar?', field: { type: 'select', name: 'urgency', options: [{ label: 'Lo antes posible', value: 'asap' }, { label: 'Este mes', value: 'this_month' }, { label: 'Solo estoy consultando', value: 'just_looking' }] } },
  ],
}

function buildFlow(steps, formData) {
  const flow = []
  for (const step of steps) {
    if (step.showIf) {
      if (formData[step.showIf.field] === step.showIf.equals) {
        flow.push(step)
      }
    } else {
      flow.push(step)
    }
  }
  return flow
}

const BASE_PRICES = { web: 800, tienda: 1500, app: 2500, rediseno: 500, asesoria: 300 }
const COUNTRY_DISCOUNT = 0.15
const FIRST_PROJECT_DISCOUNT = 0.50
const FIRST_PROJECT_PROMO_START = new Date('2026-05-23T00:00:00-05:00')
const LABELS = { business: 'Negocio', personal: 'Personal', web: 'Página web', tienda: 'Tienda online', app: 'App', design: 'Diseño', sales_system: 'Sistema de ventas', not_sure: 'No estoy seguro' }

export function NewProjectPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { session, user } = useAuth()
  const [showWelcome, setShowWelcome] = useState(location.state?.showConfetti || false)

  const [formData, setFormData] = useState({})
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [userPrice, setUserPrice] = useState(null)
  const [priceChanged, setPriceChanged] = useState(false)
  const [firstProjectEligible, setFirstProjectEligible] = useState(false)

  const flow = buildFlow(schema.steps, formData)
  const currentStep = flow[stepIndex]
  const isFormDone = stepIndex >= flow.length
  const projectType = formData.projectType
  const needs = formData.businessNeeds || formData.personalNeeds || []
  const basePrice = needs.reduce((max, n) => Math.max(max, BASE_PRICES[n] || 0), 0) || 500
  const countryDiscountAmount = Math.round(basePrice * COUNTRY_DISCOUNT)
  const firstProjectDiscountAmount = firstProjectEligible ? Math.round(basePrice * FIRST_PROJECT_DISCOUNT) : 0
  const estimatedPrice = basePrice - countryDiscountAmount - firstProjectDiscountAmount
  const displayPrice = userPrice !== null ? userPrice : estimatedPrice
  const priceDiff = displayPrice - estimatedPrice
  const pctChange = estimatedPrice > 0 ? Math.round((priceDiff / estimatedPrice) * 100) : 0

  const handleStart = () => setShowWelcome(false)

  useEffect(() => {
    let mounted = true

    const loadEligibility = async () => {
      const createdAt = session?.user?.created_at || user?.created_at
      const createdAfterPromoStart = createdAt ? new Date(createdAt) >= FIRST_PROJECT_PROMO_START : false
      const projects = await getMyProjects()
      if (mounted) setFirstProjectEligible(createdAfterPromoStart && projects.length === 0)
    }

    loadEligibility().catch(() => {
      if (mounted) setFirstProjectEligible(false)
    })

    return () => { mounted = false }
  }, [session?.user?.created_at, user?.created_at])

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))
  const toggleArray = (key, value) => setFormData(prev => {
    const arr = prev[key] || []
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    return { ...prev, [key]: next }
  })

  const handleNext = () => setStepIndex(i => i + 1)
  const handleBack = () => { if (stepIndex > 0) setStepIndex(i => i - 1) }

  const handleSubmit = async () => {
    setSubmitting(true)
    const isBusiness = formData.projectType === 'business'
    let fullDesc = isBusiness
      ? `Negocio: ${formData.businessName || '—'} (${formData.businessType || '—'})\nProblema: ${formData.businessProblem || '—'}`
      : `Idea: ${formData.personalIdea || '—'}\nObjetivo: ${formData.personalGoal || '—'}`
    fullDesc += `\n\nReferencias: ${formData.references || '—'}\nInfo extra: ${formData.extraInfo || '—'}\nUrgencia: ${formData.urgency || '—'}`
    fullDesc += `\n\n---\nPrecio base: $${basePrice}\nDto. país (15%): -$${countryDiscountAmount}\nDto. 1er proyecto (50%): -$${firstProjectDiscountAmount}\nPrecio estimado: $${estimatedPrice}\nPrecio ajustado por cliente: $${displayPrice}`

    if (!firstProjectEligible) {
      fullDesc = fullDesc.replace(/\nDto\. 1er proyecto \(50%\): -\$\d+/, '')
    }

    try {
      const result = await createProjectRequest('Nuevo Proyecto', fullDesc, displayPrice, '', null)
      if (result.error) {
        toast.error(result.error)
      } else if (result.project) {
        setStepIndex(flow.length + 2)
        toast.success('¡Tu proyecto se ha enviado exitosamente!')
      }
    } catch {
      toast.error('Error al crear el proyecto')
    } finally {
      setSubmitting(false)
    }
  }

  const confettiPieces = useMemo(() => showWelcome
    ? Array.from({ length: 100 }, (_, i) => ({
        id: i,
        color: ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'][i % 7],
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        size: 10 + Math.random() * 16,
        symbol: ['■', '●', '▲', '★'][i % 4],
        drift: (Math.random() - 0.5) * 80,
      }))
    : [], [showWelcome])

  if (showWelcome && firstProjectEligible) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-950/90 backdrop-blur-sm">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {confettiPieces.map(p => (
            <span key={p.id} className="absolute" style={{
              left: `${p.left}%`, top: '-5%', color: p.color,
              fontSize: `${p.size}px`, lineHeight: '1',
              animation: `confetti-fall 3s ease-in ${p.delay}s forwards`,
              transform: `translateX(${p.drift}px)`,
            }}>{p.symbol}</span>
          ))}
          <style>{`@keyframes confetti-fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0.3}}`}</style>
        </div>
        <div className="relative z-10 text-center px-6 animate-in zoom-in-95 duration-700">
          <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-amber-400/20 flex items-center justify-center animate-bounce">
            <span className="material-symbols-rounded text-6xl text-amber-400">celebration</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-3">¡Felicidades!</h2>
          <p className="text-2xl font-bold text-amber-400 mb-2">Ganaste 50% OFF</p>
          <p className="text-dark-200 text-lg mb-8">en tu primer proyecto con Fizzia</p>
          <button
            onClick={handleStart}
            className="cursor-pointer px-10 py-4 bg-amber-400 text-amber-950 font-bold text-lg rounded-xl hover:bg-amber-300 hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-xl shadow-amber-400/30"
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  if (stepIndex === flow.length + 2) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 fade-in">
        <div className="w-24 h-24 bg-[var(--accent-bg)] rounded-full flex items-center justify-center mb-8 mx-auto shadow-[0_0_30px_var(--accent-bg)] animate-bounce">
          <span className="material-symbols-rounded text-6xl text-[var(--accent)]">check_circle</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">¡Solicitud Enviada!</h2>
        <p className="text-dark-100 text-lg mb-8 max-w-md mx-auto">
          Recibimos tu solicitud. Te contactaremos pronto para darte una cotización.
        </p>
        <button onClick={() => navigate('/cliente')} className="cursor-pointer px-8 py-4 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-xl transition-all hover:-translate-y-1 active:scale-95">
          Volver al inicio
        </button>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-4 bg-dark-900/50 border-2 border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-[var(--accent)] focus:bg-dark-900 transition-all duration-300 text-lg hover:border-dark-600"
  const btnPrimary = "w-full cursor-pointer px-6 py-4 bg-[var(--accent)] text-white font-bold text-lg rounded-xl hover:bg-[var(--accent-lighter)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--accent-bg)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-[var(--accent)]/20"

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col justify-center">
      {!isFormDone && (
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">{schema.title}</h1>
          <p className="text-dark-200 text-lg">{schema.description}</p>
        </div>
      )}

      {/* QUESTIONS */}
      {!isFormDone && currentStep && (
        <div key={currentStep.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto w-full">
          <h2 className="text-2xl font-semibold text-center text-white mb-6">{currentStep.title}</h2>
          {(() => {
            const f = currentStep.field
            if (f.type === 'radio') {
              return (
                <div className="space-y-3">
                  {f.options.map(opt => (
                    <button key={opt.value} onClick={() => { update(f.name, opt.value); handleNext() }}
                      className={`cursor-pointer w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                        formData[f.name] === opt.value ? 'border-[var(--accent)] bg-[var(--accent-bg)]' : 'border-dark-700 bg-dark-900/50 hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]/50'
                      }`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${formData[f.name] === opt.value ? 'border-[var(--accent)]' : 'border-dark-500'}`}>
                        {formData[f.name] === opt.value && <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />}
                      </span>
                      <span className="text-left text-lg font-medium text-white">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )
            }
            if (f.type === 'text') {
              return (
                <div>
                  <input type="text" value={formData[f.name] || ''} onChange={e => update(f.name, e.target.value)} className={inputClass} placeholder={f.placeholder} autoFocus />
                  <button onClick={handleNext} disabled={!formData[f.name]?.trim()} className={`${btnPrimary} mt-4`}>Siguiente</button>
                </div>
              )
            }
            if (f.type === 'textarea') {
              return (
                <div>
                  <textarea value={formData[f.name] || ''} onChange={e => update(f.name, e.target.value)} className={`${inputClass} resize-none h-32`} placeholder={f.placeholder} autoFocus />
                  <button onClick={handleNext} disabled={!formData[f.name]?.trim()} className={`${btnPrimary} mt-4`}>Siguiente</button>
                </div>
              )
            }
            if (f.type === 'checkbox') {
              return (
                <div>
                  <div className="space-y-3">
                    {f.options.map(opt => {
                      const checked = (formData[f.name] || []).includes(opt.value)
                      return (
                        <button key={opt.value} type="button" onClick={() => toggleArray(f.name, opt.value)}
                          className={`cursor-pointer w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                            checked ? 'border-[var(--accent)] bg-[var(--accent-bg)]' : 'border-dark-700 bg-dark-900/50 hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]/50'
                          }`}>
                          <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                            checked ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-dark-500'
                          }`}>
                            {checked && <span className="material-symbols-rounded text-sm text-dark-950">check</span>}
                          </span>
                          <span className="text-lg font-medium text-white">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={handleNext} disabled={!(formData[f.name]?.length)} className={`${btnPrimary} mt-6`}>Siguiente</button>
                </div>
              )
            }
            if (f.type === 'select') {
              return (
                <div>
                  <select value={formData[f.name] || ''} onChange={e => update(f.name, e.target.value)} className={`${inputClass} appearance-none cursor-pointer`} autoFocus>
                    <option value="">Selecciona una opción</option>
                    {f.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <button onClick={handleNext} disabled={!formData[f.name]} className={`${btnPrimary} mt-4`}>Siguiente</button>
                </div>
              )
            }
            return null
          })()}
        </div>
      )}

      {/* PRICE CALCULATOR */}
      {isFormDone && stepIndex === flow.length && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto w-full">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-white mb-2">Tu presupuesto estimado</h2>
            <p className="text-dark-200">Precio referencial, no es el precio real final</p>
          </div>

          <div className="rounded-2xl border border-dark-700 bg-dark-900/60 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-dark-300">Tipo</span>
              <span className="text-white font-semibold">{LABELS[projectType] || projectType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-300">Necesitas</span>
              <span className="text-white font-semibold text-right">{needs.map(n => LABELS[n] || n).join(', ') || '—'}</span>
            </div>
            <div className="h-px bg-dark-700" />
            <div className="flex justify-between items-center">
              <span className="text-dark-300">Precio base</span>
              <span className="text-white font-semibold">${basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-green-400">
              <span>Dto. país (15%)</span>
              <span className="font-semibold">-${countryDiscountAmount.toLocaleString()}</span>
            </div>
            {firstProjectEligible && (
              <div className="flex justify-between items-center text-amber-400">
                <span>Dto. primer proyecto (50%)</span>
                <span className="font-semibold">-${firstProjectDiscountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="h-px bg-dark-700" />
            <div className="flex justify-between items-center text-lg">
              <span className="text-white font-bold">Estimado</span>
              <span className="text-white font-bold">${estimatedPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-dark-700 bg-dark-900/60 p-6 space-y-4">
            <p className="text-sm font-medium text-dark-200">Ajusta el precio (opcional)</p>
            <input
              type="range"
              min={Math.round(estimatedPrice * 0.5)}
              max={Math.round(estimatedPrice * 2)}
              value={displayPrice}
              onChange={e => { setUserPrice(Number(e.target.value)); setPriceChanged(true) }}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={displayPrice}
                onChange={e => { setUserPrice(Number(e.target.value)); setPriceChanged(true) }}
                className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white text-center text-lg font-bold focus:outline-none focus:border-[var(--accent)] [appearance:textfield]"
              />
              <span className="text-dark-300 font-medium">USD</span>
            </div>
            {priceChanged && pctChange < -15 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/40">
                <span className="material-symbols-rounded text-red-400 text-lg shrink-0 mt-0.5">warning</span>
                <p className="text-sm text-red-300">Si bajas más del 15%, es probable que el proyecto sea rechazado por presupuesto insuficiente.</p>
              </div>
            )}
            {priceChanged && pctChange > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-green-950/40 border border-green-800/40">
                <span className="material-symbols-rounded text-green-400 text-lg shrink-0 mt-0.5">trending_up</span>
                <p className="text-sm text-green-300">Si aumentas el presupuesto, tendrás prioridad para que te contactemos primero.</p>
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={submitting} className={btnPrimary}>
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      )}

      {/* BACK BUTTON */}
      {stepIndex > 0 && !isFormDone && (
        <button onClick={handleBack} className="mt-8 text-dark-200 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer w-fit mx-auto">
          <span className="material-symbols-rounded text-sm">arrow_back</span>
          Atrás
        </button>
      )}
      {isFormDone && stepIndex === flow.length && (
        <button onClick={() => setStepIndex(0)} className="mt-6 text-dark-200 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer w-fit mx-auto">
          <span className="material-symbols-rounded text-sm">arrow_back</span>
          Volver a preguntas
        </button>
      )}
    </div>
  )
}
