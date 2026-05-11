import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Icon } from '../ui/Icon'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCountry } from '../../contexts/CountryContext'
import { countryCodes, getCountryByCode, validatePhone } from '../../data/countryCodes'
import { createConversation } from '../../services/anonymousChat'
import { createLead } from '../../services/landingData'

const SIMULATOR_STEPS = ['projectType', 'designLevel', 'delivery', 'features', 'result']

function DropdownSelect({ question, options, selected, onSelect, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} className="relative">
      <p className="text-2xl md:text-3xl lg:text-4xl text-white font-black leading-tight tracking-tight mb-5">
        {question}
      </p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between pb-2 border-b-2 border-dark-700 text-left transition-all duration-200 hover:border-dark-500 focus:outline-none focus:border-fizzia-500 cursor-pointer group bg-transparent"
      >
        <span className={`text-lg md:text-xl transition-colors duration-200 ${
          selected ? 'text-white font-medium' : 'text-dark-500'
        }`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className={`text-dark-500 group-hover:text-dark-300 transition-all duration-300 ${open ? 'rotate-180' : ''}`}>
          <Icon name="expand_more" size={24} />
        </span>
      </button>

      <div
        className={`absolute top-full left-0 right-0 z-20 mt-1 overflow-hidden transition-all duration-300 ease-out ${
          open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden shadow-2xl shadow-black/40 divide-y divide-dark-800">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt); setOpen(false) }}
              className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-all duration-200 cursor-pointer ${
                selected?.value === opt.value
                  ? 'bg-fizzia-500/10 text-fizzia-400'
                  : 'text-dark-200 hover:bg-dark-800/50 hover:text-white'
              }`}
            >
              <span className="text-sm md:text-base font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConfettiEffect() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const colors = ['#44a64a', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6']
    const pieces = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: -30 - Math.random() * 150,
      w: 4 + Math.random() * 6,
      h: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 8,
      vy: 3 + Math.random() * 6,
      rot: Math.random() * 360,
      rv: (Math.random() - 0.5) * 12,
      gravity: 0.03 + Math.random() * 0.02,
      opacity: 1,
    }))

    let frame
    function animate() {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      let alive = false
      for (const p of pieces) {
        if (p.opacity <= 0) continue
        alive = true
        p.x += p.vx
        p.vy += p.gravity
        p.y += p.vy
        p.rot += p.rv
        p.vx *= 0.995
        if (p.y > canvas.offsetHeight + 40) p.opacity -= 0.006
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      if (alive) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  )
}

function CountryCodeDropdown({ dialCode, onChange }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const listRef = useRef(null)
  const [style, setStyle] = useState({})
  const searchRef = useRef('')
  const searchTimer = useRef(null)

  useEffect(() => {
    if (!open || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const h = Math.min(240, spaceBelow - 16)
    setStyle({
      position: 'fixed',
      top: Math.min(rect.bottom + 4, window.innerHeight - h - 8) + 'px',
      left: rect.left + 'px',
      width: Math.max(rect.width, 260) + 'px',
      maxHeight: h + 'px',
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) && !e.target.closest('.country-dropdown-list')) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      clearTimeout(searchTimer.current)
      searchRef.current += e.key.toLowerCase()
      searchTimer.current = setTimeout(() => { searchRef.current = '' }, 500)
      const idx = countryCodes.findIndex(c => c.label.toLowerCase().startsWith(searchRef.current))
      if (idx !== -1) {
        onChange(countryCodes[idx].dial)
        const el = listRef.current?.children?.[idx]
        if (el) el.scrollIntoView({ block: 'nearest' })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(searchTimer.current)
    }
  }, [open, onChange])

  const selected = countryCodes.find(c => c.dial === dialCode)

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-dark-800 border border-dark-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-fizzia-500 transition-colors cursor-pointer min-w-[90px]"
      >
        <span className="flex items-center justify-center w-6 h-4 text-[10px] font-bold rounded bg-dark-700 text-dark-300 shrink-0">
          {selected?.code || '?'}
        </span>
        <span className="text-dark-200">{selected?.dial}</span>
        <span className={`text-dark-500 transition-transform ${open ? 'rotate-180' : ''}`}>
          <Icon name="expand_more" size={16} />
        </span>
      </button>
      {open && (
        <div className="country-dropdown-list" style={style} onWheel={(e) => {
          const el = listRef.current
          if (!el) return
          const atTop = el.scrollTop === 0
          const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight
          if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) return
          e.stopPropagation()
        }}>
          <div ref={listRef} className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl shadow-black/40 overflow-y-auto max-h-full">
            {countryCodes.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.dial); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                  dialCode === c.dial ? 'bg-fizzia-500/10 text-fizzia-400' : 'text-dark-200 hover:bg-dark-800 hover:text-white'
                }`}
              >
                <span className="flex items-center justify-center w-6 h-4 text-[10px] font-bold rounded bg-dark-700 text-dark-300 shrink-0">
                  {c.code}
                </span>
                <span className="font-medium">{c.dial}</span>
                <span className="text-dark-500">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RequestForm({ projectType, designLevel, delivery, features, total, countryMultiplier, onClose, onSuccess }) {
  const { t } = useLanguage()
  const { countryCode } = useCountry()
  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState(getCountryByCode(countryCode).label)
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [dialCode, setDialCode] = useState(getCountryByCode(countryCode).dial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedCountry = countryCodes.find(c => c.dial === dialCode)
  const isValid = !phone || validatePhone(dialCode, phone)
  const fullName = [name.trim(), lastName.trim()].filter(Boolean).join(' ')

  const buildProjectSummary = (simulatorData) => {
    const selectedFeatures = simulatorData.features.length
      ? simulatorData.features.join(', ')
      : 'Sin funciones adicionales'

    return [
      `Proyecto solicitado desde estimador: ${simulatorData.projectType || 'Sin tipo definido'}.`,
      `Diseno: ${simulatorData.designLevel || 'Sin definir'}.`,
      `Entrega: ${simulatorData.delivery || 'Sin definir'}.`,
      `Funciones: ${selectedFeatures}.`,
      `Presupuesto estimado: $${simulatorData.total?.toLocaleString?.() || simulatorData.total || 0}.`,
    ].join('\n')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    setSubmitting(true)
    setError('')
    try {
      const simulatorData = {
        projectType: projectType?.label,
        projectTypeValue: projectType?.value,
        designLevel: designLevel?.label,
        designLevelValue: designLevel?.value,
        delivery: delivery?.label,
        deliveryValue: delivery?.value,
        features: features.map(f => f.label),
        featureValues: features.map(f => f.value),
        total,
        multiplier: countryMultiplier,
      }
      const conversation = await createConversation({
        name: name.trim() || undefined,
        lastName: lastName.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        phone: phone.trim() || undefined,
        dialCode,
        simulatorData,
      })
      await createLead({
        full_name: fullName || 'Visitante landing',
        phone: phone.trim() ? `${dialCode} ${phone.trim()}` : undefined,
        city: city.trim() || undefined,
        source: 'landing_estimator',
        status: 'new',
        budget_range: total || undefined,
        need_summary: buildProjectSummary(simulatorData),
        probability: 40,
        metadata: {
          country: country.trim() || undefined,
          dial_code: dialCode,
          anonymous_conversation_id: conversation?.id,
          requested_project: simulatorData,
        },
      })
      window.dispatchEvent(new CustomEvent('open-anon-chat', { detail: { name: name.trim() } }))
      onSuccess()
    } catch (err) {
      console.error('createConversation error:', err)
      setError('Error al enviar. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto p-6 md:p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-400 hover:text-white cursor-pointer">
          <Icon name="close" size={20} />
        </button>

        <h3 className="text-xl md:text-2xl font-black text-white mb-1">{t('simulator.ctaFinal')}</h3>
        <p className="text-dark-400 text-sm mb-6">Déjanos tus datos y te contactamos</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-dark-300 text-xs font-semibold block mb-1.5">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Juan"
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-fizzia-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-dark-300 text-xs font-semibold block mb-1.5">Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Pérez"
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-fizzia-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-dark-300 text-xs font-semibold block mb-1.5">País</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="Ecuador"
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-fizzia-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-dark-300 text-xs font-semibold block mb-1.5">Ciudad</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Quito"
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-fizzia-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-dark-300 text-xs font-semibold block mb-1.5">Celular</label>
            <div className="flex gap-2">
              <CountryCodeDropdown dialCode={dialCode} onChange={setDialCode} />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder={selectedCountry?.example ? `Ej: ${selectedCountry.example}` : 'Número de celular'}
                className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-fizzia-500 transition-colors"
              />
            </div>
            {phone && !validatePhone(dialCode, phone) && (
              <p className="text-red-400 text-xs mt-1.5">Número inválido para {selectedCountry?.label}</p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 border-2 border-dark-700 text-dark-300 font-bold rounded-xl hover:border-dark-600 hover:text-white transition-all cursor-pointer text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="flex-[2] py-3.5 bg-fizzia-500 text-white font-bold rounded-xl hover:bg-fizzia-400 disabled:bg-dark-700 disabled:text-dark-400 transition-all cursor-pointer disabled:cursor-not-allowed text-sm"
            >
              {submitting ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>

          <p className="text-dark-500 text-xs text-center">
            Te respondemos en menos de 24h. No compartimos tus datos.
          </p>
        </form>
      </div>
    </div>
  )
}

export function SimulatorSection() {
  const { t } = useLanguage()
  const { countryMultiplier } = useCountry()
  const data = t('simulator')

  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [projectType, setProjectType] = useState(null)
  const [designLevel, setDesignLevel] = useState(null)
  const [delivery, setDelivery] = useState(null)
  const [features, setFeatures] = useState([])
  const [showForm, setShowForm] = useState(false)

  const currentStep = SIMULATOR_STEPS[step]

  const total = useMemo(() => {
    if (!projectType || !designLevel || !delivery) return null
    return Math.round(
      (projectType.price * designLevel.multiplier * delivery.multiplier +
      features.reduce((s, f) => s + f.price, 0)) * countryMultiplier
    )
  }, [projectType, designLevel, delivery, features, countryMultiplier])

  const advance = useCallback(() => setStep((s) => Math.min(s + 1, SIMULATOR_STEPS.length - 1)), [])
  const goBack = useCallback(() => {
    if (step === 0) { setStarted(false); return }
    if (currentStep === 'features') setFeatures([])
    setStep((s) => s - 1)
  }, [step, currentStep])

  const select = useCallback((setter, value) => {
    setter(value)
    setTimeout(() => advance(), 350)
  }, [advance])

  const toggleFeature = useCallback((opt) => {
    setFeatures((prev) =>
      prev.find((f) => f.value === opt.value)
        ? prev.filter((f) => f.value !== opt.value)
        : [...prev, opt]
    )
  }, [])

  const restart = useCallback(() => {
    setStep(0)
    setProjectType(null)
    setDesignLevel(null)
    setDelivery(null)
    setFeatures([])
  }, [])

  const handleRequestProject = () => setShowForm(true)

  return (
    <section className="relative pt-16 pb-10 md:pt-20 md:pb-12 bg-dark-950 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-[30%] w-[500px] h-[500px] bg-fizzia-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fizzia-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl px-6">
        <div className={`transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          started ? 'opacity-0 translate-y-4 pointer-events-none absolute inset-x-0' : 'opacity-100 translate-y-0'
        }`}>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              {t('simulator.heading')}
            </h2>
            <p className="text-dark-300 text-base md:text-lg max-w-xl mx-auto mb-8">
              {t('simulator.description')}
            </p>
            <button
              onClick={() => setStarted(true)}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-fizzia-500 text-white font-bold rounded-xl hover:bg-fizzia-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-fizzia-500/25 hover:shadow-fizzia-500/40 text-base md:text-lg cursor-pointer group"
            >
              <Icon name="calculate" size={22} />
              {t('simulator.cta')}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                <Icon name="arrow_forward" size={18} />
              </span>
            </button>
          </div>
        </div>

        <div className={`transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          started ? 'relative opacity-100 translate-y-0' : 'absolute inset-x-0 top-0 opacity-0 translate-y-5 pointer-events-none'
        }`}>
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateX(-${step * 100}%)` }}
            >
              {/* Project type */}
              <div className="min-w-0 w-full flex-shrink-0">
                <DropdownSelect
                  question={t('simulator.questions.projectType')}
                  options={data.projectType.options}
                  selected={projectType}
                  onSelect={(opt) => select(setProjectType, opt)}
                  placeholder={t('simulator.selectHint')}
                />
              </div>

              {/* Design level */}
              <div className="min-w-0 w-full flex-shrink-0">
                <DropdownSelect
                  question={t('simulator.questions.designLevel')}
                  options={data.designLevel.options}
                  selected={designLevel}
                  onSelect={(opt) => select(setDesignLevel, opt)}
                  placeholder={t('simulator.selectHint')}
                />
              </div>

              {/* Delivery */}
              <div className="min-w-0 w-full flex-shrink-0">
                <DropdownSelect
                  question={t('simulator.questions.delivery')}
                  options={data.delivery.options}
                  selected={delivery}
                  onSelect={(opt) => select(setDelivery, opt)}
                  placeholder={t('simulator.selectHint')}
                />
              </div>

              {/* Features */}
              <div className="min-w-0 w-full flex-shrink-0">
                <p className="text-2xl md:text-3xl lg:text-4xl text-white font-black leading-tight tracking-tight mb-5">
                  {t('simulator.questions.features')}
                </p>
                <div className="divide-y divide-dark-800">
                  {data.features.options.map((opt) => {
                    const selected = !!features.find((f) => f.value === opt.value)
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleFeature(opt)}
                        className={`w-full flex items-center justify-between py-2.5 text-left transition-all duration-200 cursor-pointer group ${
                          selected ? 'text-fizzia-400' : 'text-dark-200 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] font-black transition-all duration-200 ${
                            selected
                              ? 'bg-fizzia-500 border-fizzia-400 text-white'
                              : 'border-dark-600'
                          }`}>
                            {selected ? '✓' : ''}
                          </span>
                          <span className="text-sm md:text-base font-medium">{opt.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={advance}
                  className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-fizzia-500 text-white font-bold rounded-xl hover:bg-fizzia-400 active:scale-[0.98] transition-all duration-200 text-sm cursor-pointer shadow-lg shadow-fizzia-500/20"
                >
                  {t('simulator.ctaFinal')}
                  <Icon name="arrow_forward" size={16} />
                </button>
              </div>

              {/* Result */}
              <div className="min-w-0 w-full flex-shrink-0 relative">
                {currentStep === 'result' && <ConfettiEffect />}
                <div className="text-center relative z-20">
                  <p className="text-dark-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t('simulator.totalLabel')}</p>
                  {total !== null && (
                    <>
                      <p className="text-6xl md:text-7xl lg:text-8xl font-black text-fizzia-400 mb-4 tracking-tight leading-none">
                        ${total.toLocaleString()}
                      </p>
                      <p className="text-dark-400 text-xs md:text-sm mb-6 leading-relaxed max-w-xs mx-auto">
                        {t('simulator.disclaimer')}
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          onClick={handleRequestProject}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-fizzia-500 text-white font-bold rounded-xl hover:bg-fizzia-400 transition-all duration-200 shadow-lg shadow-fizzia-500/25 text-sm w-full sm:w-auto justify-center cursor-pointer"
                        >
                          {t('simulator.ctaFinal')}
                          <Icon name="arrow_forward" size={16} />
                        </button>
                        <button
                          onClick={restart}
                          className="inline-flex items-center gap-1.5 px-6 py-3 border-2 border-dark-700 text-dark-200 font-semibold rounded-xl hover:border-dark-600 hover:text-white transition-all duration-200 text-sm cursor-pointer w-full sm:w-auto justify-center"
                        >
                          <Icon name="refresh" size={16} />
                          {t('simulator.recalculate')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-0">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-all duration-300 cursor-pointer group"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
                <Icon name="arrow_back" size={14} />
              </span>
              {step === 0 ? t('simulator.cancel') : t('simulator.back')}
            </button>
          </div>

          {/* Step dots */}
          {currentStep !== 'result' && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  i <= step ? 'bg-fizzia-400 shadow-[0_0_6px_rgba(68,166,74,0.4)]' : 'bg-dark-700'
                }`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <RequestForm
          data={data}
          projectType={projectType}
          designLevel={designLevel}
          delivery={delivery}
          features={features}
          total={total}
          countryMultiplier={countryMultiplier}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </section>
  )
}
