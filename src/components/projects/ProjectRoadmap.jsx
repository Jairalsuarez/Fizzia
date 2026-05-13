import { formatDate } from '../../utils/format'

const statusMeta = {
  todo: { label: 'Pendiente', icon: 'radio_button_unchecked', className: 'text-dark-500 bg-dark-800 border-dark-700' },
  doing: { label: 'En proceso', icon: 'pending', className: 'text-blue-300 bg-blue-500/10 border-blue-500/30' },
  blocked: { label: 'Bloqueado', icon: 'block', className: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  review: { label: 'En revisión', icon: 'rate_review', className: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
  done: { label: 'Completado', icon: 'check_circle', className: 'text-green-300 bg-green-500/10 border-green-500/30' },
  cancelled: { label: 'Cancelado', icon: 'cancel', className: 'text-red-300 bg-red-500/10 border-red-500/30' },
}

export function ProjectRoadmap({ milestones = [], admin = false, onStatusChange, onDelete }) {
  if (!milestones.length) {
    return (
      <div className="rounded-2xl border border-dark-800 bg-dark-900/60 p-8 text-center">
        <span className="material-symbols-rounded text-4xl text-dark-600">route</span>
        <p className="mt-2 text-sm text-dark-400">Aún no hay pasos definidos para este proyecto.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {milestones.map((step, index) => {
        const meta = statusMeta[step.status] || statusMeta.todo
        return (
          <div key={step.id} className="group relative rounded-2xl border border-dark-800 bg-dark-900/70 p-4">
            {index < milestones.length - 1 && (
              <div className="absolute left-8 top-14 h-[calc(100%+0.75rem)] w-px bg-dark-800" aria-hidden="true" />
            )}
            <div className="relative flex gap-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${meta.className}`}>
                <span className="material-symbols-rounded text-lg">{meta.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{step.title}</h4>
                    {step.description && <p className="mt-1 text-sm leading-6 text-dark-400">{step.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full border px-2 py-1 font-semibold ${meta.className}`}>{meta.label}</span>
                      {step.due_date && <span className="rounded-full border border-dark-700 bg-dark-950 px-2 py-1 text-dark-400">Fecha: {formatDate(step.due_date)}</span>}
                      {step.completed_at && <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-green-300">Completado: {formatDate(step.completed_at)}</span>}
                    </div>
                  </div>
                  {admin && (
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={step.status}
                        onChange={(event) => onStatusChange?.(step, event.target.value)}
                        className="cursor-pointer rounded-xl border border-dark-700 bg-dark-950 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[var(--accent)]"
                      >
                        {Object.entries(statusMeta).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => onDelete?.(step.id)}
                        className="cursor-pointer rounded-lg p-2 text-dark-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        aria-label="Eliminar paso"
                      >
                        <span className="material-symbols-rounded text-base">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function MeetingCards({ appointments = [], admin = false, onDelete }) {
  if (!appointments.length) {
    return (
      <div className="rounded-2xl border border-dark-800 bg-dark-900/60 p-6 text-center">
        <span className="material-symbols-rounded text-3xl text-dark-600">event</span>
        <p className="mt-2 text-sm text-dark-400">No hay reuniones agendadas todavía.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {appointments.map((meeting) => (
        <div key={meeting.id} className="rounded-2xl border border-dark-800 bg-dark-900/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-dark-500">{meeting.status === 'requested' ? 'Solicitada' : 'Reunión'}</p>
              <h4 className="mt-1 font-semibold text-white">{meeting.title}</h4>
            </div>
            {admin && (
              <button onClick={() => onDelete?.(meeting.id)} className="cursor-pointer rounded-lg p-1 text-dark-500 hover:bg-red-500/10 hover:text-red-300">
                <span className="material-symbols-rounded text-base">delete</span>
              </button>
            )}
          </div>
          <div className="mt-3 space-y-2 text-sm text-dark-300">
            <p className="flex items-center gap-2"><span className="material-symbols-rounded text-base text-dark-500">schedule</span>{formatDate(meeting.starts_at)}</p>
            <p className="flex items-center gap-2"><span className="material-symbols-rounded text-base text-dark-500">videocam</span>{meeting.platform || meeting.location || 'Por confirmar'}</p>
            {meeting.description && <p className="leading-6 text-dark-400">{meeting.description}</p>}
          </div>
          {meeting.meeting_url ? (
            <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-lighter)]">
              Abrir reunión
              <span className="material-symbols-rounded text-base">open_in_new</span>
            </a>
          ) : (
            <p className="mt-4 rounded-xl border border-dark-800 bg-dark-950 px-4 py-2 text-sm text-dark-500">Link pendiente de confirmación</p>
          )}
        </div>
      ))}
    </div>
  )
}
