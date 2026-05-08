import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../features/auth/authContext'
import { supabase } from '../../services/supabase'
import { PROJECT_STATUS } from '../../domain/projects'
import { ProjectCard, ProjectCardSkeleton } from '../../components/ProjectCard'
import { mergeRealtimeProject, useRealtimeProjects } from '../../hooks/useRealtimeProjects'

export function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const handleRealtimeProject = useCallback((payload) => {
    if (payload.eventType === 'DELETE') setProjects(prev => prev.filter(project => project.id !== payload.old.id))
    else setProjects(prev => prev.some(project => project.id === payload.new.id) ? mergeRealtimeProject(prev, payload.new) : prev)
  }, [])

  useRealtimeProjects(handleRealtimeProject)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      const { data: assignments } = await supabase
        .from('project_developers')
        .select('project_id')
        .eq('developer_id', user.id)

      if (assignments?.length) {
        const ids = assignments.map(a => a.project_id)
        const { data: projs } = await supabase
          .from('projects')
          .select('*, clients(name)')
          .in('id', ids)
          .order('created_at', { ascending: false })
        setProjects(projs || [])
      }
      setLoading(false)
    }
    load()
  }, [user?.id])

  if (loading) return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-dark-800 rounded-xl animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
      </div>
    </div>
  )

  const totalProjects = projects.length
  const activeProjects = projects.filter(p => [PROJECT_STATUS.PREPARING, PROJECT_STATUS.WORKING].includes(p.status)).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bienvenido, {user?.full_name?.split(' ')[0] || user?.first_name || 'Developer'}, es hora de trabajar</h1>
        <p className="text-dark-400 text-sm mt-1">Estos son tus proyectos asignados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
          <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">Proyectos asignados</p>
          <p className="text-2xl font-bold text-white">{totalProjects}</p>
        </div>
        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
          <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">En progreso</p>
          <p className="text-2xl font-bold text-blue-400">{activeProjects}</p>
        </div>
        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
          <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">Completados</p>
          <p className="text-2xl font-bold text-green-400">{projects.filter(p => p.status === PROJECT_STATUS.DELIVERED).length}</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-dark-900/50 border border-dark-700/60 rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
            <span className="material-symbols-rounded text-dark-500 text-3xl">folder_open</span>
          </div>
          <p className="text-dark-400 text-sm">No tienes proyectos asignados aún</p>
          <p className="text-dark-600 text-xs mt-1">El administrador te asignará proyectos pronto</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              clientName={project.clients?.name}
              to={`/dev/proyecto/${project.id}`}
              accent="purple"
            />
          ))}
        </div>
      )}
    </div>
  )
}
