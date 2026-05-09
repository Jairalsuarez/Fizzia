import { useEffect, useMemo, useRef, useState } from 'react'
import { acceptTerms } from '../../api/profilesApi'
import { useAuth } from '../../features/auth/authContext'
import { useToast } from '../Toast'

const TERMS_PDF_URL = '/legal/terminos-fizzia.pdf'

const consentItems = [
  'Estoy de acuerdo en que la solicitud de proyecto sera revisada antes de ser aceptada.',
  'Estoy de acuerdo en que los pagos son independientes, se validan con comprobantes y no constituyen factura tributaria salvo acuerdo escrito.',
  'Estoy de acuerdo en que cambios fuera del alcance, integraciones extras o retrasos de informacion pueden modificar tiempos y costos.',
  'Estoy de acuerdo en que, una vez entregado y aprobado el proyecto, ajustes posteriores pueden cotizarse como soporte o mantenimiento.',
  'Estoy de acuerdo en mantener trato profesional, confidencialidad y uso responsable de archivos, accesos y credenciales.',
]

function needsTerms(profile) {
  return !profile?.terms_accepted_at
}

export function TermsAcceptanceGate({ profile, onAccepted }) {
  const { updateUser } = useAuth()
  const toast = useToast()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [accepted, setAccepted] = useState(false)
  const [slideProgress, setSlideProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const slideRef = useRef(null)
  const thumbRef = useRef(null)

  const shouldShow = useMemo(() => {
    if (!profile) return false
    return needsTerms(profile)
  }, [profile])

  useEffect(() => {
    if (!shouldShow) return undefined
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [shouldShow])

  if (!shouldShow) return null

  const updateSlideFromPointer = (clientX) => {
    const track = slideRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const thumbOffset = 48
    const rawProgress = (clientX - rect.left - thumbOffset / 2) / (rect.width - thumbOffset)
    const nextProgress = Math.min(1, Math.max(0, rawProgress))
    setSlideProgress(nextProgress)
    return nextProgress
  }

  const handleSlidePointerDown = (event) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(true)
    updateSlideFromPointer(event.clientX)
  }

  const handleSlidePointerMove = (event) => {
    if (!dragging) return
    updateSlideFromPointer(event.clientX)
  }

  const handleSlidePointerUp = (event) => {
    if (!dragging) return
    const finalProgress = updateSlideFromPointer(event.clientX)
    setDragging(false)
    if (finalProgress >= 0.92) {
      setAccepted(true)
      setSlideProgress(1)
      return
    }
    setAccepted(false)
    setSlideProgress(0)
  }

  const handleTrackPointerDown = (event) => {
    if (event.target !== thumbRef.current && !thumbRef.current?.contains(event.target)) {
      event.preventDefault()
    }
  }

  const handleAccept = async () => {
    if (!fullName.trim() || fullName.trim().split(/\s+/).length < 2) {
      toast.error('Ingresa tu nombre completo')
      return
    }
    if (!accepted) {
      toast.error('Activa la aceptacion para continuar')
      return
    }

    setSaving(true)
    const { data, error } = await acceptTerms(fullName)
    setSaving(false)
    if (error) {
      toast.error('No se pudo guardar la aceptacion: ' + error.message)
      return
    }
    updateUser(data || { full_name: fullName.trim(), terms_accepted_at: new Date().toISOString() })
    onAccepted?.(data)
    toast.success('Terminos aceptados')
  }

  const openPdf = () => {
    window.open(TERMS_PDF_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="terms-gate-screen fixed inset-0 z-[1000] overflow-y-auto bg-dark-950 px-4">
      <div className="terms-gate-panel w-full max-w-2xl overflow-hidden rounded-2xl border border-dark-700 bg-dark-950 shadow-2xl shadow-black/50">
        <div className="relative px-6 py-6 sm:px-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fizzia-400/70 to-transparent" />
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Acepta los terminos de Fizzia</h2>
            </div>
            <span className="material-symbols-rounded rounded-full border border-fizzia-500/30 bg-fizzia-500/10 p-3 text-2xl text-fizzia-300">contract_edit</span>
          </div>
        </div>

        <div className="space-y-5 px-6 pb-6 sm:px-7">
          <div className="rounded-2xl border border-dark-800 bg-dark-900/55 p-4">
            <p className="text-sm font-semibold text-white">Al firmar confirmas:</p>
            <div className="mt-3 space-y-2.5">
              {consentItems.map((item) => (
                <div key={item} className="flex gap-2.5 text-sm leading-5 text-dark-300">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-fizzia-500/15 text-fizzia-300">
                    <span className="material-symbols-rounded text-[13px]">check</span>
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-dark-300">Nombre completo para la firma</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-sm font-semibold text-white outline-none transition-colors placeholder:text-dark-600 focus:border-fizzia-500"
              placeholder="Ej: Maria Fernanda Moreira"
            />
          </label>

          <button
            type="button"
            onPointerDown={handleTrackPointerDown}
            className={`terms-slide-accept ${accepted ? 'is-accepted' : ''} ${dragging ? 'is-dragging' : ''}`}
            style={{ '--slide-progress': slideProgress }}
            aria-pressed={accepted}
            aria-label={accepted ? 'Terminos aceptados' : 'Desliza hasta el final para aceptar'}
          >
            <span ref={slideRef} className="terms-slide-track">
              <span className="terms-slide-fill" />
              <span
                ref={thumbRef}
                className="terms-slide-thumb"
                onPointerDown={handleSlidePointerDown}
                onPointerMove={handleSlidePointerMove}
                onPointerUp={handleSlidePointerUp}
                onPointerCancel={() => {
                  setDragging(false)
                  if (!accepted) setSlideProgress(0)
                }}
              >
                <span className="material-symbols-rounded text-[17px]">{accepted ? 'done' : 'arrow_forward'}</span>
              </span>
              <span className="terms-slide-label">
                {accepted ? 'Terminos aceptados' : 'Desliza para aceptar'}
              </span>
            </span>
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={openPdf}
              className="cursor-pointer inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-sm font-semibold text-dark-200 transition-[border-color,color,transform] duration-200 hover:border-dark-500 hover:text-white active:scale-[0.98]"
            >
              <span className="material-symbols-rounded text-base">picture_as_pdf</span>
              Abrir PDF completo
            </button>
            <button
              onClick={handleAccept}
              disabled={saving || !accepted || !fullName.trim()}
              className="cursor-pointer inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-fizzia-500 px-4 py-3 text-sm font-semibold text-white transition-[background-color,transform,opacity] duration-200 hover:bg-fizzia-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="material-symbols-rounded text-base">draw</span>
              {saving ? 'Guardando firma...' : 'Firmar y continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
