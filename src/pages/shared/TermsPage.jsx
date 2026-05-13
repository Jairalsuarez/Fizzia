import { useMemo } from 'react'
import { useAuth } from '../../features/auth/authContext'
import { legalLastUpdated, termsSections } from '../../data/legalDocuments'

const TERMS_PDF_URL = '/legal/terminos-fizzia.pdf'

export function TermsPage() {
  const { user } = useAuth()
  const acceptedAt = user?.terms_accepted_at
  const signedName = user?.terms_full_name || user?.full_name
  const roleCopy = useMemo(() => {
    if (user?.role === 'developer') return 'Developer'
    if (user?.role === 'client') return 'Cliente'
    return 'Usuario'
  }, [user?.role])

  return (
    <div className="terms-page-shell">
      <section className="terms-page-card overflow-hidden border border-dark-800 bg-dark-900">
        <div className="terms-page-hero border-b border-dark-800 bg-dark-950">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fizzia-400">Fizzia Legal</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Términos, privacidad y política de desembolso</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-dark-300">
                Documento de referencia para contratación, alcance, pagos, reuniones, privacidad, cancelaciones y devolución de saldos no consumidos.
              </p>
              <p className="mt-2 text-xs font-medium text-dark-500">Última actualización: {legalLastUpdated}</p>
              <a
                href={TERMS_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-fizzia-500 px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-fizzia-400 active:scale-[0.98]"
              >
                <span className="material-symbols-rounded text-base">picture_as_pdf</span>
                Abrir PDF en otra pestana
              </a>
            </div>
            <div className="shrink-0 rounded-xl border border-dark-800 bg-dark-900 px-4 py-3">
              <p className="text-xs text-dark-500">Estado de firma</p>
              <p className="mt-1 text-sm font-semibold text-white">{acceptedAt ? 'Aceptado' : 'Pendiente'}</p>
              {acceptedAt && (
                <p className="mt-1 text-xs text-dark-400">{signedName} · {new Date(acceptedAt).toLocaleDateString('es')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[18rem_1fr]">
          <aside className="terms-page-nav border-b border-dark-800 bg-dark-950/55 lg:border-b-0 lg:border-r">
            <p className="text-sm font-semibold text-white">Documento para {roleCopy}</p>
            <nav className="mt-4 space-y-1">
              {termsSections.map(section => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-dark-400 transition-colors hover:bg-dark-800 hover:text-white"
                >
                  {section.title.replace(/^\d+\.\s*/, '')}
                </a>
              ))}
            </nav>
          </aside>

          <div className="divide-y divide-dark-800">
            {termsSections.map(section => (
              <section key={section.id} id={section.id} className="terms-page-section scroll-mt-32">
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.body.map(paragraph => (
                    <p key={paragraph} className="max-w-3xl text-sm leading-7 text-dark-300">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
