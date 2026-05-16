import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../features/auth/authContext'
import { supabase } from '../../services/supabase'
import { ProjectCard, ProjectCardSkeleton } from '../../components/ProjectCard'
import { Greeting } from '../../components/Greeting'
import { mergeRealtimeProject, useRealtimeProjects } from '../../hooks/useRealtimeProjects'

const devPhrases = [
  'a darle al código',
  'tiempo de crear magia',
  'a construir cosas increíbles',
  'tu editor te espera',
  'líneas de calidad en camino',
  'hora de hacer magia',
  'los commits no se escriben solos',
  'otro bug menos, una feature más',
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
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Greeting
        name={user?.full_name?.split(' ')[0] || user?.first_name || 'Developer'}
        phrases={devPhrases}
        fallback="a darle al código"
      />

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-dark-900/50 border border-dark-700/60 rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
            <span className="material-symbols-rounded text-dark-500 text-3xl">folder_open</span>
          </div>
          <p className="text-dark-400 text-sm">No tienes proyectos asignados aún</p>
          <p className="text-dark-600 text-xs mt-1">El administrador te asignará proyectos pronto</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              clientName={project.clients?.name}
              to={`/dev/proyecto/${project.id}`}
              hidePrice
            />
          ))}
        </div>
      )}
    </div>
  )
}
