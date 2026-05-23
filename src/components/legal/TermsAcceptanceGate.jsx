import { useEffect, useMemo, useRef, useState } from 'react'
import { acceptTerms } from '../../api/profilesApi'
import { useAuth } from '../../features/auth/authContext'
import { useToast } from '../Toast'
import { legalLastUpdated, termsSections } from '../../data/legalDocuments'

function needsTerms(profile) {
  return !profile?.terms_accepted_at
}

export function TermsAcceptanceGate({ profile, onAccepted }) {
  const { updateUser } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [hasReadAll, setHasReadAll] = useState(false)
  const scrollRef = useRef(null)

  const shouldShow = useMemo(() => {
    if (!profile) return false
    return needsTerms(profile)
  }, [profile])

  useEffect(() => {
    if (!shouldShow) return
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [shouldShow])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      setHasReadAll(true)
    }
  }

  const handleAccept = async () => {
    if (!hasReadAll) return
    setSaving(true)
    const { data, error } = await acceptTerms()
    setSaving(false)
    if (error) {
      toast.error('No se pudo guardar la aceptacion: ' + error.message)
      return
    }
    updateUser(data || { terms_accepted_at: new Date().toISOString() })
    onAccepted?.(data)
    toast.success('Terminos aceptados')
  }

  if (!shouldShow) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-6 bg-dark-950"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(50,168,82,0.1), transparent), radial-gradient(ellipse 50% 40% at 80% 90%, rgba(50,168,82,0.06), transparent), #050605',
      }}
    >
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-dark-700 bg-dark-950 shadow-2xl shadow-black/50 max-h-[calc(100dvh-3rem)]">
        <div className="relative shrink-0 px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fizzia-400/70 to-transparent" />
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-white">Terminos y condiciones de Fizzia</h2>
              <p className="mt-1.5 text-sm leading-5 text-dark-400">
                Lee el documento completo para poder continuar. Incluye politica de privacidad, cancelacion y reembolso.
              </p>
              <p className="mt-0.5 text-xs font-medium text-dark-500">Ultima actualizacion: {legalLastUpdated}</p>
            </div>
            <span className="material-symbols-rounded mt-1 shrink-0 rounded-full border border-fizzia-500/30 bg-fizzia-500/10 p-3 text-2xl text-fizzia-300">contract</span>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 space-y-6 overflow-y-auto px-6 pb-4 sm:px-8 scroll-smooth"
        >
          {termsSections.map((section) => (
            <div key={section.id} className="rounded-xl border border-dark-800 bg-dark-900/60 p-5 sm:p-6">
              <h3 className="text-base font-bold text-white">{section.title}</h3>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-sm leading-6 text-dark-300">{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-dark-800/60 px-6 py-4 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-dark-500">
              {hasReadAll
                ? 'Has leido todos los terminos. Puedes aceptar para continuar.'
                : 'Desplazate hasta el final para aceptar los terminos.'}
            </p>
            <button
              onClick={handleAccept}
              disabled={!hasReadAll || saving}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-fizzia-500 px-6 py-3 text-sm font-semibold text-white transition-[background-color,transform,opacity] duration-200 hover:bg-fizzia-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-rounded text-base">check_circle</span>
              {saving ? 'Guardando...' : 'Aceptar terminos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
