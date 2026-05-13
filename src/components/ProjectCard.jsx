import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../utils/format'
import { parseGitHubUrl } from '../utils/github'
import { supabase } from '../services/supabase'

const phases = [
  { key: 'solicitado', label: 'Solicitado', color: 'bg-fizzia-500' },
  { key: 'revision', label: 'Revisión', color: 'bg-amber-500' },
  { key: 'preparando', label: 'Preparando', color: 'bg-purple-500' },
  { key: 'trabajando', label: 'Trabajando', color: 'bg-blue-500' },
  { key: 'pausado', label: 'Pausado', color: 'bg-yellow-500' },
  { key: 'entregado', label: 'Entregado', color: 'bg-green-500' },
  { key: 'cancelado', label: 'Cancelado', color: 'bg-red-500' },
]

function getPhase(status) {
  return phases.find(p => p.key === status) || phases[0]
}

function getDaysRemaining(dueDate) {
  if (!dueDate) return null
  const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

function CyclingInfo({ items, interval = 4000 }) {
  const [index, setIndex] = useState(0)
  const [animClass, setAnimClass] = useState('')

  useEffect(() => {
    if (!items.length) return
    const tick = () => {
      setAnimClass('opacity-0 translate-y-3')
      setTimeout(() => {
        setIndex(prev => (prev + 1) % items.length)
        setAnimClass('opacity-100 translate-y-0')
      }, 300)
    }
    const timer = setInterval(tick, interval)
    return () => clearInterval(timer)
  }, [items.length, interval])

  if (!items.length) return null

  return (
    <div className="h-5 overflow-hidden flex items-center justify-center">
      <span className={`text-sm font-medium truncate max-w-full transition-all duration-300 ease-out ${animClass} ${items[index].color || 'text-dark-300'}`}>
        {items[index].text}
      </span>
    </div>
  )
}

export function ProjectCard({ project, clientName, to, hidePrice }) {
  const phase = getPhase(project.status)
  const daysLeft = getDaysRemaining(project.due_date)
  const [lastCommit, setLastCommit] = useState(null)
  const [developerName, setDeveloperName] = useState(null)
  const fetchedRef = useRef(false)

  const accentClass = 'hover:border-[var(--accent)]/40 hover:shadow-[var(--accent)]/5 group-hover:text-[var(--accent)]'
  const gradientClass = 'from-[var(--accent)]/[0.02]'
  const arrowClass = 'group-hover:text-[var(--accent)]'

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    if (project.repository_url) {
      const repo = parseGitHubUrl(project.repository_url)
      if (repo) {
        fetch(
          `https://api.github.com/repos/${repo.owner}/${repo.repo}/commits?per_page=1`,
          { headers: { Accept: 'application/vnd.github+json' } }
        )
          .then(r => r.ok ? r.json() : [])
          .then(data => {
            const msg = data?.[0]?.commit?.message
            if (msg) {
              const firstLine = msg.split('\n')[0]
              setLastCommit(`Último commit: ${firstLine.length > 45 ? firstLine.slice(0, 42) + '...' : firstLine}`)
            }
          })
          .catch(() => {})
      }
    }

    supabase
      .from('project_developers')
      .select('developer_id, profiles!inner(full_name)')
      .eq('project_id', project.id)
      .limit(1)
      .then(({ data, error }) => {
        if (error) console.error('Error fetching dev:', error)
        const name = data?.[0]?.profiles?.full_name
        if (name) setDeveloperName(name.split(' ')[0])
      })
      .catch(() => {})
  }, [project.repository_url, project.id])

  const cycleItems = [
    { text: phase.label, color: 'text-white' },
  ]

  if (lastCommit) {
    cycleItems.push({ text: lastCommit, color: 'text-blue-400' })
  }

  if (developerName) {
    cycleItems.push({ text: `Desarrollador asignado: ${developerName}`, color: 'text-[var(--accent)]' })
  }

  return (
    <Link
      to={to}
      className={`group relative bg-dark-900/80 border border-dark-700/60 rounded-2xl p-5 transition-all duration-300 active:translate-y-0 overflow-hidden ${accentClass}`}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientClass} to-transparent pointer-events-none`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          {clientName && (
            <span className="text-xs text-dark-500 font-medium truncate pr-2">
              {clientName}
            </span>
          )}
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold text-white tracking-wide uppercase ${phase.color}`}>
            {phase.label}
          </span>
        </div>

        <h3 className={`text-white font-bold text-lg mb-3 transition-colors leading-snug ${arrowClass}`}>
          {project.name}
        </h3>

        <div className="flex items-center gap-3 text-xs text-dark-500 mb-3 flex-wrap">
          {project.status === 'revision' && project.client_deadline ? (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-rounded text-[14px]">hourglass_top</span>
              Tu fecha programada: {formatDate(project.client_deadline)}
            </span>
          ) : project.status !== 'revision' && project.due_date ? (
            daysLeft !== null ? (
              <span className={`inline-flex items-center gap-1 font-medium ${daysLeft < 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                <span className="material-symbols-rounded text-[14px]">schedule</span>
                {daysLeft < 0 ? `${Math.abs(daysLeft)} días atrasado` : `Entrega en ${daysLeft} días`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-rounded text-[14px]">calendar_today</span>
                Entrega: {formatDate(project.due_date)}
              </span>
            )
          ) : null}
        </div>

        {project.status === 'solicitado' || project.status === 'revision' ? (
          <p className="text-sm text-dark-400 text-center">{phase.label}</p>
        ) : (
          <CyclingInfo items={cycleItems} />
        )}

        <div className="mt-3 pt-3 border-t border-dark-800 flex items-center justify-between text-xs text-dark-500">
          {hidePrice && project.repository_url ? (
            <span className="font-medium text-dark-400 truncate">
              {project.repository_url.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')}
            </span>
          ) : !hidePrice && (project.final_price || project.budget) ? (
            <span className="font-medium text-dark-400">
              ${Number(project.final_price || project.budget).toLocaleString()}
            </span>
          ) : <span />}
          <span className={`material-symbols-rounded text-lg text-dark-600 transition-colors ${arrowClass}`}>
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-dark-900/50 border border-dark-700/60 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-dark-800 rounded animate-pulse" />
        <div className="h-5 w-20 bg-dark-800 rounded-full animate-pulse" />
      </div>
      <div className="h-6 w-3/4 bg-dark-800 rounded animate-pulse" />
      <div className="flex gap-3">
        <div className="h-4 w-32 bg-dark-800 rounded animate-pulse" />
        <div className="h-4 w-24 bg-dark-800 rounded animate-pulse" />
      </div>
      <div className="h-5 w-full bg-dark-800 rounded animate-pulse" />
      <div className="pt-3 border-t border-dark-800 flex justify-between">
        <div className="h-4 w-20 bg-dark-800 rounded animate-pulse" />
        <div className="h-4 w-4 bg-dark-800 rounded animate-pulse" />
      </div>
    </div>
  )
}

export function EmptyProjects({ message, actionLabel, actionTo }) {
  return (
    <div className="text-center py-16 sm:py-20 bg-dark-900/50 border border-dark-700/60 rounded-2xl col-span-full px-4">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-fizzia-500/20 flex items-center justify-center">
        <span className="material-symbols-rounded text-4xl text-fizzia-400">rocket_launch</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{message || 'No hay proyectos'}</h3>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-fizzia-500 text-white font-semibold rounded-xl hover:bg-fizzia-400 transition-all shadow-lg shadow-fizzia-500/25 mt-4"
        >
          <span className="material-symbols-rounded text-lg">add_circle</span>
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
