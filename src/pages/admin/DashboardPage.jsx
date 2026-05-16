import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardData } from '../../hooks/useDashboardData'
import { ProjectCard, ProjectCardSkeleton, EmptyProjects } from '../../components/ProjectCard'
import { StatusBadge } from '../../components/ui/'
import { formatDate } from '../../utils/format'
import { useAuth } from '../../features/auth/authContext'
import { Greeting } from '../../components/Greeting'

const WORKING_STATUSES = ['preparando', 'trabajando', 'pausado']

const adminPhrases = [
  'es hora de liderar',
  'el equipo te necesita',
  'grandes decisiones te esperan',
  'a construir el futuro',
  'tu visión marca el camino',
  'el éxito empieza aquí',
  'cada detalle cuenta',
  'tú pones el rumbo',
]

export function DashboardPage() {
  const { user } = useAuth()
  const { data, loading, error, refreshData } = useDashboardData()
  const [tab, setTab] = useState('proyectos')

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-red-400">Error: {error}</p>
          <button onClick={refreshData} className="mt-2 text-sm text-red-400 hover:text-red-300">Reintentar</button>
        </div>
      </div>
    )
  }

  const projects = data?.projects || []

  const workingProjects = projects.filter(p => WORKING_STATUSES.includes(p.status))
  const requests = projects.filter(p => p.status === 'solicitado')

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Greeting
        name={user?.full_name?.split(' ')[0] || user?.first_name || 'Admin'}
        phrases={adminPhrases}
        fallback="es hora de liderar"
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setTab('solicitudes')}
          className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
            tab === 'solicitudes' ? 'bg-[var(--accent)] text-white' : 'text-dark-400 hover:text-white'
          }`}
        >
          Solicitudes
          {requests.length > 0 && (
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              tab === 'solicitudes' ? 'bg-white/20' : 'bg-fizzia-500/20 text-fizzia-400'
            }`}>
              {requests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('proyectos')}
          className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'proyectos' ? 'bg-[var(--accent)] text-white' : 'text-dark-400 hover:text-white'
          }`}
        >
          Proyectos
        </button>
      </div>

      {/* Solicitudes tab */}
      {tab === 'solicitudes' && (
        <div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-dark-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-2">
              {requests.map((project) => (
                <Link
                  key={project.id}
                  to={`/admin/proyecto/${project.id}`}
                  className="cursor-pointer flex items-center gap-4 bg-dark-900/50 border border-dark-800 rounded-xl p-4 hover:border-[var(--accent)]/50 hover:bg-dark-900 transition-all group"
                >
                  <div className="w-10 h-10 bg-fizzia-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-fizzia-400">request_quote</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold group-hover:text-fizzia-400 transition-colors truncate">
                      {project.name}
                    </p>
                    <p className="text-dark-400 text-sm">{project.clients?.name || 'Sin cliente'}</p>
                  </div>
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-white font-medium">${Number(project.final_price || project.budget || 0).toLocaleString()}</p>
                    <p className="text-dark-500 text-xs">{formatDate(project.created_at)}</p>
                  </div>
                  <StatusBadge status="solicitado" size="sm" />
                  <span className="material-symbols-rounded text-dark-500 group-hover:text-fizzia-400 transition-colors shrink-0">chevron_right</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyProjects message="No hay solicitudes pendientes" />
          )}
        </div>
      )}

      {/* Proyectos tab */}
      {tab === 'proyectos' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
            </div>
          ) : workingProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workingProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  clientName={project.clients?.name}
                  to={`/admin/proyecto/${project.id}`}
                  showClient
                  showBudget
                />
              ))}
            </div>
          ) : (
            <EmptyProjects message="No hay proyectos en curso" />
          )}
        </div>
      )}

    </div>
  )
}
