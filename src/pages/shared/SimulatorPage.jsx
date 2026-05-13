import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { CountryProvider, useCountry } from '../../contexts/CountryContext'
import { LanguageProvider } from '../../contexts/LanguageContext'
import { Icon } from '../../components/ui/Icon'

const SIMULATOR_STEPS = ['projectType', 'scope', 'content', 'designLevel', 'delivery', 'features', 'maintenance', 'result']

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-dark-700 text-dark-400 text-[10px] font-bold cursor-help ml-1.5 shrink-0 hover:bg-dark-600 hover:text-dark-200 transition-colors"
      >
        ?
      </span>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-lg bg-dark-800 border border-dark-700 shadow-xl shadow-black/40 z-30 pointer-events-none">
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 rotate-45 bg-dark-800 border-r border-b border-dark-700" />
          <p className="text-dark-200 text-xs leading-relaxed">{text}</p>
        </div>
      )}
    </span>
  )
}

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
        <span className={`text-lg md:text-xl transition-colors duration-200 ${selected ? 'text-white font-medium' : 'text-dark-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="expand_more" size={24} className={`text-dark-500 group-hover:text-dark-300 transition-all duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`absolute top-full left-0 right-0 z-20 mt-1 overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden shadow-2xl shadow-black/40 divide-y divide-dark-800">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-200 cursor-pointer ${
                selected?.value === opt.value
                  ? 'bg-fizzia-500/10 text-fizzia-400'
                  : 'text-dark-200 hover:bg-dark-800/50 hover:text-white'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm md:text-base font-medium">{opt.label}</span>
                  {opt.info && <InfoTooltip text={opt.info} />}
                </div>
                {opt.desc && (
                  <p className="text-dark-500 text-xs mt-0.5">{opt.desc}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ToggleList({ options, selected, onToggle, multi }) {
  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const isSelected = multi
          ? !!selected.find((f) => f.value === opt.value)
          : selected?.value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'bg-fizzia-500/10 border-fizzia-500/40 text-white'
                : 'bg-dark-900/60 border-dark-800 text-dark-200 hover:border-dark-600 hover:text-white'
            }`}
          >
            <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border-2 text-xs font-black transition-all ${
              isSelected
                ? 'bg-fizzia-500 border-fizzia-400 text-white'
                : 'border-dark-600 text-dark-600'
            }`}>
              {isSelected ? '✓' : '?'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm md:text-base leading-snug">
                  {multi ? opt.question : opt.label}
                </span>
                {opt.info && <InfoTooltip text={opt.info} />}
              </div>
              {opt.desc && (
                <p className="text-dark-500 text-xs mt-0.5">{opt.desc}</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function StepDots({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-5">
      {steps.map((_, i) => (
        <span key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${
          i <= current ? 'bg-fizzia-400 shadow-[0_0_6px_rgba(68,166,74,0.4)]' : 'bg-dark-700'
        }`} />
      ))}
    </div>
  )
}

function FullScreenConfetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth * 2
    canvas.height = window.innerHeight * 2
    ctx.scale(2, 2)

    const colors = ['#44a64a', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6']
    const pieces = Array.from({ length: 200 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -60 - Math.random() * 300,
      w: 3 + Math.random() * 7,
      h: 3 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 12,
      vy: 3 + Math.random() * 8,
      rot: Math.random() * 360,
      rv: (Math.random() - 0.5) * 16,
      gravity: 0.02 + Math.random() * 0.03,
      opacity: 1,
    }))

    let frame
    function animate() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      let alive = false
      for (const p of pieces) {
        if (p.opacity <= 0) continue
        alive = true
        p.x += p.vx
        p.vy += p.gravity
        p.y += p.vy
        p.rot += p.rv
        p.vx *= 0.995
        if (p.y > window.innerHeight + 60) p.opacity -= 0.003
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

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />
}

function SimulatorContent() {
  const { t, language } = useLanguage()
  const { countryMultiplier } = useCountry()
  const data = t('simulator')
  const isES = language === 'es'

  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [projectType, setProjectType] = useState(null)
  const [scope, setScope] = useState(null)
  const [content, setContent] = useState(null)
  const [designLevel, setDesignLevel] = useState(null)
  const [delivery, setDelivery] = useState(null)
  const [features, setFeatures] = useState([])
  const [maintenance, setMaintenance] = useState(null)

  const currentStep = SIMULATOR_STEPS[step]

  const total = useMemo(() => {
    if (!projectType || !scope || !content || !designLevel || !delivery) return null
    return Math.round((
      (projectType.price + scope.price + content.price) * designLevel.multiplier * delivery.multiplier +
      features.reduce((s, f) => s + f.price, 0)
    ) * countryMultiplier)
  }, [projectType, scope, content, designLevel, delivery, features, countryMultiplier])

  const advance = useCallback(() => setStep((s) => Math.min(s + 1, SIMULATOR_STEPS.length - 1)), [])
  const goBack = useCallback(() => {
    if (step === 0) { setStarted(false); return }
    setStep((s) => s - 1)
  }, [step])

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

  const selectMaintenance = useCallback((opt) => {
    setMaintenance(opt)
  }, [])

  const restart = useCallback(() => {
    setStep(0)
    setProjectType(null)
    setScope(null)
    setContent(null)
    setDesignLevel(null)
    setDelivery(null)
    setFeatures([])
    setMaintenance(null)
  }, [])

  const pdfHtml = useMemo(() => {
    if (!total) return ''
    return `<!DOCTYPE html><html lang="${language}"><head><meta charset="UTF-8"><title>Fizzia - ${t('simulator.totalLabel')}</title><style>body{font-family:system-ui,sans-serif;padding:48px;max-width:600px;margin:0 auto;color:#1a1a1a}h1{font-size:28px;color:#44a64a;margin-bottom:4px}.sub{color:#666;font-size:14px;margin-bottom:32px}.line{border-top:2px solid #eee;margin:24px 0}.row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}.label{color:#666}.val{font-weight:500}.price{font-size:48px;font-weight:900;color:#44a64a;text-align:center;margin:32px 0}.note{text-align:center;color:#999;font-size:12px;margin-top:32px}.tag{display:inline-block;background:#f0fdf4;color:#44a64a;font-size:11px;padding:2px 8px;border-radius:4px;margin-left:6px}</style></head><body><h1>Fizzia</h1><p class="sub">${t('simulator.totalLabel')}</p><div class="line"></div><div class="row"><span class="label">${t('simulator.questions.projectType')}</span><span class="val">${projectType?.label || '—'}</span></div><div class="row"><span class="label">${data.scope.label}</span><span class="val">${scope?.label || '—'}</span></div><div class="row"><span class="label">${data.content.label}</span><span class="val">${content?.label || '—'}</span></div><div class="row"><span class="label">${t('simulator.questions.designLevel')}</span><span class="val">${designLevel?.label || '—'}</span></div><div class="row"><span class="label">${t('simulator.questions.delivery')}</span><span class="val">${delivery?.label || '—'}</span></div><div class="row"><span class="label">${data.features.label}</span><span class="val">${features.length ? features.map(f => f.label).join(', ') : '—'}</span></div>${maintenance && maintenance.value !== 'none' ? `<div class="row"><span class="label">${data.maintenance.label}</span><span class="val">${maintenance.label}</span></div>` : ''}<div class="line"></div><div class="price">$${total?.toLocaleString() || '0'}</div><p class="note">${t('simulator.disclaimer')}</p></body></html>`
  }, [total, projectType, scope, content, designLevel, delivery, features, maintenance, language, t, data])

  const handleViewPdf = () => {
    const blob = new Blob([pdfHtml], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  const handleDownloadPdf = () => {
    const blob = new Blob([pdfHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Fizzia-Presupuesto-${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const text = `${t('simulator.sharedText')}${total?.toLocaleString() || '0'}`
    if (navigator.share) {
      try { await navigator.share({ title: 'Fizzia', text, url: window.location.href }) } catch {
        // Sharing can be cancelled by the user.
      }
    } else {
      try { await navigator.clipboard.writeText(text) } catch {
        // Clipboard permissions are browser-dependent.
      }
    }
  }

  const nonResultSteps = SIMULATOR_STEPS.filter(s => s !== 'result')

  const btnPrimary = 'inline-flex items-center justify-center gap-2 px-6 py-3 bg-fizzia-500 text-white font-bold rounded-xl hover:bg-fizzia-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-fizzia-500/25 text-sm cursor-pointer'
  const btnSecondary = 'inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-dark-700 text-dark-200 font-semibold rounded-xl hover:border-fizzia-500/40 hover:text-fizzia-400 transition-all duration-200 text-sm cursor-pointer'
  const btnGhost = 'inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-dark-700 text-dark-500 font-semibold rounded-xl hover:border-dark-600 hover:text-white transition-all duration-200 text-sm cursor-pointer'

  return (
    <div className="min-h-dvh bg-dark-950 flex flex-col">
      {currentStep === 'result' && <FullScreenConfetti key="confetti" />}

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-dark-800/60">
        <a href="/" className="flex items-center gap-2">
          <img src="/images/Solo la figura del logo.png" alt="Fizzia" className="h-8 w-auto" />
          <span className="text-fizzia-500 font-black text-xl">Fizzia</span>
        </a>
        <a href="/" className="text-dark-400 hover:text-white transition-colors">
          <Icon name="close" size={22} />
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          {!started ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-fizzia-500/10 text-fizzia-400 mb-6">
                <Icon name="calculate" size={32} />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
                {t('simulator.heading')}
              </h1>
              <p className="text-dark-300 text-base md:text-lg mb-8 max-w-lg mx-auto">
                {t('simulator.description')}
              </p>
              <button
                onClick={() => setStarted(true)}
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-fizzia-500 text-white font-bold rounded-xl hover:bg-fizzia-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-fizzia-500/25 text-base md:text-lg cursor-pointer"
              >
                {t('simulator.start')}
                <Icon name="arrow_forward" size={20} />
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-hidden">
                <div className="flex transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(-${step * 100}%)` }}>
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

                  {/* Scope */}
                  <div className="min-w-0 w-full flex-shrink-0">
                    <DropdownSelect
                      question={t('simulator.questions.scope')}
                      options={data.scope.options}
                      selected={scope}
                      onSelect={(opt) => select(setScope, opt)}
                      placeholder={t('simulator.selectHint')}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 w-full flex-shrink-0">
                    <DropdownSelect
                      question={t('simulator.questions.content')}
                      options={data.content.options}
                      selected={content}
                      onSelect={(opt) => select(setContent, opt)}
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
                    <p className="text-2xl md:text-3xl lg:text-4xl text-white font-black leading-tight tracking-tight mb-2">
                      {t('simulator.questions.features')}
                    </p>
                    <p className="text-dark-400 text-sm mb-6">
                      {isES ? 'Puedes elegir varias opciones.' : 'You can select multiple options.'}
                    </p>
                    <ToggleList
                      options={data.features.options}
                      selected={features}
                      onToggle={toggleFeature}
                      multi
                    />
                    <button
                      onClick={advance}
                      className={`mt-6 ${btnPrimary}`}
                    >
                      {isES ? 'Continuar' : 'Continue'}
                      <Icon name="arrow_forward" size={16} />
                    </button>
                  </div>

                  {/* Maintenance */}
                  <div className="min-w-0 w-full flex-shrink-0">
                    <p className="text-2xl md:text-3xl lg:text-4xl text-white font-black leading-tight tracking-tight mb-2">
                      {t('simulator.questions.maintenance')}
                    </p>
                    <p className="text-dark-400 text-sm mb-6">
                      {isES ? 'Elige una opción.' : 'Choose one option.'}
                    </p>
                    <ToggleList
                      options={data.maintenance.options}
                      selected={maintenance}
                      onToggle={(opt) => { selectMaintenance(opt); setTimeout(() => advance(), 350) }}
                      multi={false}
                    />
                  </div>

                  {/* Result */}
                  <div className="min-w-0 w-full flex-shrink-0">
                    <div className="text-center">
                      <p className="text-dark-500 text-xs font-bold uppercase tracking-[0.2em] mb-6">
                        {t('simulator.totalLabel')}
                      </p>
                      {total !== null && (
                        <>
                          <p className="text-6xl md:text-7xl lg:text-8xl font-black text-fizzia-400 mb-4 tracking-tight leading-none">
                            ${total.toLocaleString()}
                          </p>
                          <p className="text-dark-400 text-xs md:text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                            {t('simulator.disclaimer')}
                          </p>

                          {/* Summary of selections */}
                          <div className="max-w-sm mx-auto mb-8 border border-dark-800 rounded-xl p-4 bg-dark-900/40">
                            <p className="text-dark-500 text-xs font-semibold uppercase tracking-wider mb-2">
                              {isES ? 'Tu selección' : 'Your selections'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {projectType && <span className="inline-flex px-2.5 py-1 rounded-lg bg-dark-800 text-dark-200 text-xs font-medium">{projectType.label}</span>}
                              {scope && <span className="inline-flex px-2.5 py-1 rounded-lg bg-dark-800 text-dark-200 text-xs font-medium">{scope.label}</span>}
                              {content && <span className="inline-flex px-2.5 py-1 rounded-lg bg-dark-800 text-dark-200 text-xs font-medium">{content.label}</span>}
                              {designLevel && <span className="inline-flex px-2.5 py-1 rounded-lg bg-dark-800 text-dark-200 text-xs font-medium">{designLevel.label}</span>}
                              {delivery && <span className="inline-flex px-2.5 py-1 rounded-lg bg-dark-800 text-dark-200 text-xs font-medium">{delivery.label}</span>}
                              {features.map(f => (
                                <span key={f.value} className="inline-flex px-2.5 py-1 rounded-lg bg-dark-800 text-dark-200 text-xs font-medium">{f.label}</span>
                              ))}
                              {maintenance && maintenance.value !== 'none' && (
                                <span className="inline-flex px-2.5 py-1 rounded-lg bg-amber-900/40 text-amber-400 text-xs font-medium">{maintenance.label}</span>
                              )}
                            </div>
                            {maintenance && maintenance.value !== 'none' && (
                              <p className="text-amber-400/60 text-xs mt-3 border-t border-dark-800 pt-3">
                                {isES
                                  ? `* Mantenimiento no incluido en el total. ${maintenance.value === 'monthly' ? 'Consulta nuestros planes de soporte.' : 'Precio con descuento trimestral.'}`
                                  : `* Maintenance not included in the total. ${maintenance.value === 'monthly' ? 'Ask about our support plans.' : 'Discounted quarterly price.'}`}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button onClick={handleViewPdf} className={btnPrimary}>
                              <Icon name="visibility" size={16} />
                              {t('simulator.viewPdf')}
                            </button>
                            <button onClick={handleDownloadPdf} className={btnSecondary}>
                              <Icon name="download" size={16} />
                              {t('simulator.downloadPdf')}
                            </button>
                            <button onClick={handleShare} className={btnSecondary}>
                              <Icon name="share" size={16} />
                              {t('simulator.share')}
                            </button>
                            <button onClick={restart} className={btnGhost}>
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

              <div className="flex items-center justify-between mt-8">
                <button onClick={goBack} className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-all duration-300 cursor-pointer group">
                  <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
                    <Icon name="arrow_back" size={14} />
                  </span>
                  {step === 0 ? t('simulator.cancel') : t('simulator.back')}
                </button>
              </div>

              {currentStep !== 'result' && (
                <StepDots steps={nonResultSteps} current={step} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function SimulatorPage() {
  return (
    <LanguageProvider>
      <CountryProvider>
        <SimulatorContent />
      </CountryProvider>
    </LanguageProvider>
  )
}
