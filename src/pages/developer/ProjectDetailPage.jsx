import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/authContext'
import { supabase } from '../../services/supabase'
import { getAllProjectFiles } from '../../api/filesApi'
import { updateProject } from '../../api/projectsApi'
import { useToast } from '../../components/Toast'
import { Modal } from '../../components/ui/Modal'
import { formatDate } from '../../utils/format'
import { getProjectStatusLabel, getProjectStatusColor, isProjectClosed } from '../../domain/projects'
import { fetchGitHubCommits, formatCommitTime, getCommitAuthorName } from '../../utils/github'
import { readStoredValue, writeStoredValue } from '../../utils/persistedState'
import { useRealtimeProject } from '../../hooks/useRealtimeProjects'

const devStatusOptions = [
  { key: 'trabajando', icon: 'build', label: 'Trabajando' },
  { key: 'pausado', icon: 'pause_circle', label: 'Pausado' },
]

const getFileIcon = (file) => {
  if (file?.file_type?.includes('image')) return 'image'
  if (file?.file_type?.includes('pdf')) return 'picture_as_pdf'
  if (file?.file_type?.includes('zip') || file?.file_type?.includes('rar')) return 'folder_zip'
  return 'attach_file'
}

const getFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProjectDetailPage() {
  const { user } = useAuth()
  const { projectId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(() => {
    return readStoredValue(`dev-project-tab-${projectId}`, 'general', value => ['general', 'archivos', 'commits'].includes(value))
  })
  const [files, setFiles] = useState([])
  const [commits, setCommits] = useState([])
  const [commitsLoading, setCommitsLoading] = useState(false)
  const [showAbandonModal, setShowAbandonModal] = useState(false)
  const [abandonPassword, setAbandonPassword] = useState('')
  const [abandonAgreedText, setAbandonAgreedText] = useState('')
  const [abandoning, setAbandoning] = useState(false)

  const isClosed = project && isProjectClosed(project.status)

  const handleRealtimeProject = useCallback((updatedProject) => {
    if (!updatedProject) return navigate('/dev')
    setProject(prev => prev ? { ...prev, ...updatedProject } : prev)
  }, [navigate])

  useRealtimeProject(projectId, handleRealtimeProject)

  useEffect(() => {
    writeStoredValue(`dev-project-tab-${projectId}`, tab)
  }, [tab, projectId])

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return

      const { data: projectData } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('id', projectId)
        .single()

      if (projectData) {
        setProject(projectData)
        if (projectData.repository_url) {
          setCommitsLoading(true)
          const c = await fetchGitHubCommits(projectData.repository_url)
          setCommits(c)
          setCommitsLoading(false)
        }
      }
      setLoading(false)
    }
    load()
  }, [projectId, user])

  useEffect(() => {
    if (!projectId || !project) return
    getAllProjectFiles(projectId).then(setFiles).catch(() => {})
  }, [projectId, project])

  const handleStatusChange = async (newStatus) => {
    if (newStatus === project.status) return
    const { error } = await updateProject(project.id, { status: newStatus })
    if (error) return toast.error('Error al cambiar el estado')
    toast.success(`Estado cambiado a "${getProjectStatusLabel(newStatus)}"`)
    setProject(prev => ({ ...prev, status: newStatus }))
  }

  const handleAbandon = async () => {
    try {
      if (!abandonPassword.trim()) { toast.error('Ingresa tu contraseña'); return }
      if (abandonAgreedText !== 'Estoy de acuerdo en abandonar este proyecto') { toast.error('Debes escribir la frase de confirmación'); return }
      setAbandoning(true)
      const sessionRes = await supabase.auth.getSession()
      const userEmail = sessionRes.data?.session?.user?.email
      if (!userEmail) { toast.error('No se pudo verificar tu sesión'); setAbandoning(false); return }
      const { error: pwError } = await supabase.auth.signInWithPassword({
        email: userEmail, password: abandonPassword,
      })
      if (pwError) { toast.error('Contraseña incorrecta'); setAbandoning(false); return }
      const { error: delError } = await supabase
        .from('project_developers')
        .delete()
        .eq('developer_id', sessionRes.data.session.user.id)
        .eq('project_id', project.id)
      setAbandoning(false)
      if (delError) return toast.error('Error al abandonar el proyecto')
      toast.success('Proyecto abandonado')
      setShowAbandonModal(false)
      setAbandonPassword('')
      setAbandonAgreedText('')
      navigate('/dev')
    } catch (err) {
      toast.error('Error inesperado: ' + (err.message || 'intenta de nuevo'))
      setAbandoning(false)
    }
  }

  if (loading) return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b border-dark-800/70 bg-dark-950/45 backdrop-blur-sm shrink-0">
        <div className="px-4 sm:px-6 py-4">
          <div className="h-8 w-64 bg-dark-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex-1 p-4 sm:p-6">
        <div className="h-96 bg-dark-800 rounded-xl animate-pulse" />
      </div>
    </div>
  )

  if (!project) return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
      <button onClick={() => navigate('/dev')} className="cursor-pointer text-purple-400 hover:text-purple-300 text-sm mb-4 inline-flex items-center gap-1">
        <span className="material-symbols-rounded text-sm">arrow_back</span> Volver
      </button>
      <p className="text-dark-400">Proyecto no encontrado</p>
    </div>
  )

  const tabs = [
    { id: 'general', label: 'General', icon: 'dashboard' },
    { id: 'archivos', label: 'Archivos', icon: 'folder' },
    { id: 'commits', label: 'Commits', icon: 'code' },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b border-dark-800/70 bg-dark-950/45 backdrop-blur-sm shrink-0">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button onClick={() => navigate('/dev')} className="cursor-pointer p-2 text-dark-400 hover:text-white transition-colors shrink-0">
                <span className="material-symbols-rounded">arrow_back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{project.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium text-white ${getProjectStatusColor(project.status)}`}>
                    {getProjectStatusLabel(project.status)}
                  </span>
                  <span className="text-sm text-dark-400">{project.clients?.name || ''}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button
                onClick={() => setShowAbandonModal(true)}
                className="cursor-pointer px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-all"
              >
                Abandonar proyecto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-800/70 bg-dark-950/25 shrink-0">
        <div className="px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar snap-x">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`cursor-pointer min-w-max snap-start flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-[var(--accent)] text-white'
                    : 'border-transparent text-dark-400 hover:text-white hover:border-dark-600'
                }`}
              >
                <span className="material-symbols-rounded text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {/* General tab */}
        {tab === 'general' && (
          <div className="space-y-6">
            {/* Status change chips */}
            {!isClosed && (
              <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-dark-400">Estado del proyecto</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {devStatusOptions.map(({ key, icon, label }) => {
                    const isActive = project.status === key
                    return (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(key)}
                        className={`cursor-pointer flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          isActive
                            ? `${getProjectStatusColor(key)} text-white border-transparent shadow-lg`
                            : 'bg-dark-950 border-dark-700 text-dark-300 hover:text-white hover:border-dark-500'
                        }`}
                      >
                        <span className="material-symbols-rounded text-lg">{icon}</span>
                        {label}
                        {isActive && <span className="material-symbols-rounded text-sm ml-auto">check</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <span className="material-symbols-rounded text-[var(--accent)]">event_note</span>
                Fechas del proyecto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-dark-950 border border-dark-800 rounded-lg p-3">
                  <p className="text-[10px] text-dark-500 uppercase tracking-wider font-medium mb-1">Inicio</p>
                  <p className="text-white text-sm font-medium">
                    {project.start_date ? formatDate(project.start_date) : <span className="text-dark-500">Sin definir</span>}
                  </p>
                </div>
                <div className="bg-dark-950 border border-dark-800 rounded-lg p-3">
                  <p className="text-[10px] text-dark-500 uppercase tracking-wider font-medium mb-1">Entrega</p>
                  <p className="text-white text-sm font-medium">
                    {project.due_date ? formatDate(project.due_date) : <span className="text-dark-500">Sin definir</span>}
                  </p>
                </div>
                <div className="bg-dark-950 border border-dark-800 rounded-lg p-3">
                  <p className="text-[10px] text-dark-500 uppercase tracking-wider font-medium mb-1">Límite cliente</p>
                  <p className="text-white text-sm font-medium">
                    {project.client_deadline ? formatDate(project.client_deadline) : <span className="text-dark-500">Sin definir</span>}
                  </p>
                </div>
              </div>
              {project.repository_url && (
                <div className="mt-3 pt-3 border-t border-dark-800">
                  <a
                    href={project.repository_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-lighter)] transition-colors"
                  >
                    <span className="material-symbols-rounded text-sm">code</span>
                    {project.repository_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </div>
              )}
            </div>

            <p className="text-xs text-dark-600">Creado el {formatDate(project.created_at)}</p>
          </div>
        )}

        {/* Archivos tab */}
        {tab === 'archivos' && (
          <div>
            {files.length > 0 ? (
              <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="material-symbols-rounded text-[var(--accent)]">folder</span>
                    Archivos del proyecto
                  </h3>
                  <span className="text-[10px] text-dark-500 font-medium uppercase tracking-wider">{files.length} archivos</span>
                </div>
                <div className="space-y-2">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center gap-2 bg-dark-950 border border-dark-800 rounded-lg p-2.5 group">
                      <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-[var(--accent)] text-sm">{getFileIcon(file)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{file.file_name}</p>
                        <p className="text-dark-500 text-[10px]">{getFileSize(file.file_size)}{file.note && ` · ${file.note}`}</p>
                      </div>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer p-1 text-dark-500 hover:text-white transition-colors"
                      >
                        <span className="material-symbols-rounded text-sm">download</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-dark-900/50 border border-dark-800 rounded-xl">
                <span className="material-symbols-rounded text-dark-600 text-5xl mb-3 block">folder_open</span>
                <p className="text-dark-400 text-sm">No hay archivos en este proyecto</p>
              </div>
            )}
          </div>
        )}

        {/* Commits tab */}
        {tab === 'commits' && (
          <div>
            {!project.repository_url ? (
              <div className="text-center py-16 bg-dark-900/50 border border-dark-800 rounded-xl">
                <span className="material-symbols-rounded text-dark-600 text-5xl mb-3 block">code</span>
                <p className="text-dark-400 text-sm">Sin repositorio configurado</p>
                <p className="text-dark-600 text-xs mt-1">El administrador debe agregar la URL del repositorio</p>
              </div>
            ) : commitsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-dark-800 rounded-lg animate-pulse" />)}
              </div>
            ) : commits.length === 0 ? (
              <div className="text-center py-16 bg-dark-900/50 border border-dark-800 rounded-xl">
                <span className="material-symbols-rounded text-dark-600 text-5xl mb-3 block">commit</span>
                <p className="text-dark-400 text-sm">No hay commits aún</p>
                <p className="text-dark-600 text-xs mt-1">O el repositorio es privado y necesita un token</p>
              </div>
            ) : (
              <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="material-symbols-rounded text-[var(--accent)]">commit</span>
                    Commits recientes
                  </h3>
                </div>
                <div className="space-y-2">
                  {commits.map(commit => (
                    <div key={commit.sha} className="flex items-start gap-3 p-4 bg-dark-950 border border-dark-800 rounded-lg hover:border-dark-700 transition-all">
                      <div className="w-8 h-8 rounded-full border border-dark-700 bg-dark-800 overflow-hidden flex items-center justify-center shrink-0">
                        {commit.author?.avatar_url ? (
                          <img src={commit.author.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-rounded text-[var(--accent)] text-sm">terminal</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {commit.commit?.message || 'Sin mensaje'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                          <span>{getCommitAuthorName(commit)}</span>
                          <span>{formatCommitTime(commit.commit?.author?.date)}</span>
                        </div>
                      </div>
                      <a
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer text-xs text-[var(--accent)] hover:text-[var(--accent-lighter)] font-mono shrink-0"
                      >
                        {commit.sha?.slice(0, 7)}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Abandon modal */}
      <Modal isOpen={showAbandonModal} onClose={() => { setShowAbandonModal(false); setAbandonPassword(''); setAbandonAgreedText('') }} title="Abandonar proyecto" size="sm" closeOnBackdrop={false} closeOnEscape={false}>
        <p className="text-dark-300 text-sm mb-4">Estás por abandonar <span className="text-white font-medium">{project.name}</span>. Esta acción requiere confirmación con tu contraseña.</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-dark-400 mb-1 block">Escribe la siguiente frase para confirmar:</label>
            <p className="text-xs text-[var(--accent)] font-mono mb-2">"Estoy de acuerdo en abandonar este proyecto"</p>
            <input
              type="text"
              value={abandonAgreedText}
              onChange={(e) => setAbandonAgreedText(e.target.value)}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)]"
              placeholder="Escribe la frase aquí"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="text-sm text-dark-400 mb-1 block">Contraseña</label>
            <input
              type="password"
              value={abandonPassword}
              onChange={(e) => setAbandonPassword(e.target.value)}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)]"
              placeholder="Ingresa tu contraseña"
              autoComplete="new-password"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAbandonModal(false); setAbandonPassword(''); setAbandonAgreedText('') }}
              className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleAbandon}
              disabled={abandoning || abandonAgreedText !== 'Estoy de acuerdo en abandonar este proyecto' || !abandonPassword.trim()}
              className="cursor-pointer flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 disabled:opacity-50 transition-all"
            >
              {abandoning ? 'Abandonando...' : 'Abandonar proyecto'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
