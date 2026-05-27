import { useCallback, useEffect, useState } from 'react'
import { EmptyState, Skeleton } from '../../components/ui/'
import { getAllDevelopers } from '../../api/developersApi'
import { AvatarIcon } from '../../data/avatars'
import { supabase } from '../../services/supabase'
import { readStoredJson, writeStoredJson } from '../../utils/persistedState'

const CACHE_KEY = 'fizzia-admin-developers-cache'

export default function DeveloperList({ selectedId, onSelect, refreshKey, showRoleFilter = true, fixedRole = null }) {
  const [developers, setDevelopers] = useState(() => readStoredJson(CACHE_KEY, []))
  const [loading, setLoading] = useState(() => readStoredJson(CACHE_KEY, []).length === 0)
  const [filter, setFilter] = useState('developer')

  const loadDevelopers = useCallback(async () => {
    const data = await getAllDevelopers()
    setDevelopers(data || [])
    writeStoredJson(CACHE_KEY, data || [])
    if (selectedId) {
      const selectedDeveloper = (data || []).find(dev => dev.id === selectedId)
      onSelect(selectedDeveloper || null)
    }
  }, [selectedId, onSelect])

  useEffect(() => {
    setLoading(true)
    loadDevelopers().finally(() => setLoading(false))
  }, [refreshKey, loadDevelopers])

  useEffect(() => {
    let timer = null
    const refreshSilently = () => {
      clearTimeout(timer)
      timer = setTimeout(loadDevelopers, 250)
    }

    const channel = supabase
      .channel('admin:developers:list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refreshSilently)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_developers' }, refreshSilently)
      .subscribe()

    return () => {
      clearTimeout(timer)
      channel.unsubscribe()
    }
  }, [loadDevelopers])

  const activeFilter = fixedRole || filter
  const filteredDevelopers = developers.filter(dev => dev.role === activeFilter)
  const activeCount = developers.filter(dev => dev.role === 'developer').length
  const clientCount = developers.filter(dev => dev.role === 'client').length

  return (
    <div className="flex h-full flex-col rounded-lg border border-dark-700 bg-dark-900">
      <div className="border-b border-dark-700 p-3">
        <h2 className="text-white font-semibold">Desarrolladores</h2>
        {showRoleFilter && (
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-dark-950 p-1">
            <button
              onClick={() => setFilter('developer')}
              className={`cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-all ${filter === 'developer' ? 'bg-[var(--accent)] text-white' : 'text-dark-400 hover:text-white'}`}
            >
              Activos ({activeCount})
            </button>
            <button
              onClick={() => setFilter('client')}
              className={`cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-all ${filter === 'client' ? 'bg-[var(--accent)] text-white' : 'text-dark-400 hover:text-white'}`}
            >
              Clientes ({clientCount})
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}
          </div>
        ) : filteredDevelopers.length > 0 ? (
          filteredDevelopers.map((dev) => (
            <div
              key={dev.id}
              onClick={() => onSelect(dev)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-3.5 transition-colors sm:p-3 ${
                selectedId === dev.id
                  ? 'bg-fizzia-500/10 ring-1 ring-inset ring-fizzia-500/20'
                  : 'hover:bg-dark-800'
              }`}
            >
              <AvatarIcon id={dev.avatar_id} name={dev.full_name || dev.first_name} size={40} zoom={1.5} className="shrink-0 sm:!h-9 sm:!w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{dev.full_name || dev.first_name || 'Sin nombre'}</p>
                <p className="text-dark-400 text-xs truncate">{dev.email || 'Sin email'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-dark-500">{dev.role === 'developer' ? `${dev.project_count || 0} proyectos` : 'Disponible para contratar'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6">
            <EmptyState message={activeFilter === 'developer' ? 'No hay desarrolladores activos' : 'No hay clientes para contratar'} />
          </div>
        )}
      </div>
    </div>
  )
}
