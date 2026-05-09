import { useMemo } from 'react'
import { useAuth } from '../../features/auth/authContext'

const TERMS_PDF_URL = '/legal/terminos-fizzia.pdf'

const sections = [
  {
    id: 'solicitud',
    title: '1. Estoy de acuerdo en como se procesa una solicitud',
    body: [
      'Entiendo que enviar una solicitud no garantiza aceptacion inmediata. Fizzia revisa alcance, disponibilidad, presupuesto, materiales y tiempos antes de confirmar el inicio.',
      'Acepto que Fizzia puede pedirme informacion adicional, accesos o archivos antes de definir una propuesta final.',
    ],
  },
  {
    id: 'alcance',
    title: '2. Estoy de acuerdo en respetar alcance y entregables',
    body: [
      'Acepto que el alcance aprobado define pantallas, funcionalidades, integraciones, contenido, archivos, revisiones y entregables.',
      'Acepto que cambios no acordados, nuevas integraciones, contenido tardio o modificaciones sustanciales pueden requerir nueva cotizacion o mover el calendario.',
      'Acepto que una entrega se considera realizada cuando Fizzia pone a disposicion enlaces, archivos, repositorio, documentacion o paquete final acordado.',
    ],
  },
  {
    id: 'pagos',
    title: '3. Estoy de acuerdo en las condiciones de pago',
    body: [
      'Entiendo que los pagos se gestionan de forma independiente mediante comprobantes, transferencias, pasarelas o metodos habilitados por Fizzia.',
      'Entiendo que estos registros no representan factura tributaria automatica, recibo fiscal ni documento contable formal salvo que Fizzia lo acuerde expresamente por escrito.',
      'Acepto que un pago puede quedar pendiente, aprobado o rechazado segun validacion administrativa. Comisiones bancarias, conversiones o cargos externos pueden depender del metodo usado.',
    ],
  },
  {
    id: 'entrega',
    title: '4. Estoy de acuerdo en las reglas posteriores a la entrega',
    body: [
      'Acepto que, una vez entregado el proyecto y pasado el periodo de revision acordado, nuevas solicitudes pueden considerarse mantenimiento, soporte o mejora adicional.',
      'Acepto revisar avances y reportar observaciones de forma clara dentro de los canales autorizados.',
      'Entiendo que retrasos en aprobaciones, pagos, accesos o contenido pueden extender fechas estimadas.',
    ],
  },
  {
    id: 'responsabilidades',
    title: '5. Estoy de acuerdo en mis responsabilidades',
    body: [
      'Como cliente, debo entregar informacion real, materiales autorizados, accesos necesarios y aprobaciones oportunas.',
      'Como developer, debo mantener confidencialidad, comunicacion profesional, trazabilidad del trabajo y cuidado de archivos, credenciales y datos del cliente.',
      'Acepto no compartir informacion privada, credenciales, archivos internos o conversaciones fuera del entorno autorizado.',
    ],
  },
  {
    id: 'legal',
    title: '6. Estoy de acuerdo en la firma digital y condiciones generales',
    body: [
      'Acepto que escribir mi nombre completo y activar la aceptacion registra consentimiento digital dentro de Fizzia.',
      'Acepto que Fizzia puede actualizar estos terminos por cambios operativos, legales o de servicio.',
      'Entiendo que estos terminos no reemplazan contratos particulares firmados fuera de la plataforma. Si existe un contrato especifico, sus condiciones prevalecen en lo que corresponda.',
    ],
  },
]

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
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Terminos y condiciones</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-dark-300">
                Declaracion de consentimiento para solicitudes, pagos independientes, entregas, confidencialidad y responsabilidades dentro de Fizzia.
              </p>
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
              {sections.map(section => (
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
            {sections.map(section => (
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
