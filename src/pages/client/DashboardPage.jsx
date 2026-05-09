import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getMyProjects } from '../../api/projectsApi'
import { useAuth } from '../../features/auth/authContext'
import { ProjectCard, ProjectCardSkeleton, EmptyProjects } from '../../components/ProjectCard'
import { Greeting } from '../../components/Greeting'
import { mergeRealtimeProject, useRealtimeProjects } from '../../hooks/useRealtimeProjects'

const clientPhrases = [
  'un placer tenerte aquí',
  'qué alegría verte de nuevo',
  'esperamos que tengas un excelente día',
  'gracias por confiar en nosotros',
  'estamos felices de trabajar contigo',
  'tu proyecto está en buenas manos',
  'bienvenido a bordo, capitán',
  'nos encanta verte progresar',
]

export function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const handleRealtimeProject = useCallback((payload) => {
    if (payload.eventType === 'DELETE') setProjects(prev => prev.filter(project => project.id !== payload.old.id))
    else setProjects(prev => prev.some(project => project.id === payload.new.id) ? mergeRealtimeProject(prev, payload.new) : prev)
  }, [])

  useRealtimeProjects(handleRealtimeProject)

  const openMessages = () => {
    window.dispatchEvent(new CustomEvent('fizzia-open-chat', {
      detail: { projectId: projects[0]?.id },
    }))
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const projectsRes = await getMyProjects()
        setProjects(projectsRes || [])
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-dark-800 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-dark-800 rounded animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-40 bg-dark-800 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4" data-tour="client-welcome">
        <Greeting
          name={user?.full_name?.split(' ')[0] || 'Usuario'}
          phrases={clientPhrases}
          fallback="un placer tenerte aquí"
        />
        <div className="flex items-center gap-2 shrink-0">
          {projects.length > 0 && (
            <button
              type="button"
              onClick={openMessages}
              className="cursor-pointer group relative px-4 py-2.5 bg-dark-900 border border-dark-700 text-white font-semibold rounded-xl hover:border-[var(--accent)]/50 hover:bg-dark-800 transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-rounded text-lg text-[var(--accent)]">chat</span>
              Mensajes
              <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-64 rounded-xl border border-dark-700 bg-dark-950 px-3 py-2 text-left text-xs font-medium text-dark-200 shadow-xl group-hover:block">
                Preguntar al desarrollador sobre tu proyecto
              </span>
            </button>
          )}
          <Link
            to="/cliente/nuevo-proyecto"
            data-tour="client-new-project"
            className="cursor-pointer px-4 py-2.5 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-lighter)] transition-all shadow-lg shadow-[var(--accent)]/25 inline-flex items-center gap-2"
          >
            <span className="material-symbols-rounded text-lg">add_circle</span>
            Nuevo proyecto
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div data-tour="client-projects">
          <EmptyProjects
            message="Aun no tienes proyectos"
            actionLabel="Crear mi primer proyecto"
            actionTo="/cliente/nuevo-proyecto"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="client-projects">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              clientName={project.client_name}
              to={`/cliente/proyecto/${project.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
