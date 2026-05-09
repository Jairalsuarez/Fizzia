import { useEffect, useState } from 'react'
import { EmptyState, Skeleton } from '../../components/ui/'
import { getAllDevelopers } from '../../api/developersApi'
import { AvatarIcon } from '../../data/avatars'

export default function DeveloperList({ selectedId, onSelect, refreshKey }) {
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('developer')

  useEffect(() => {
    setLoading(true)
    getAllDevelopers()
      .then(data => setDevelopers(data || []))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const filteredDevelopers = developers.filter(dev => dev.role === filter)
  const activeCount = developers.filter(dev => dev.role === 'developer').length
  const clientCount = developers.filter(dev => dev.role === 'client').length

  return (
    <div className="rounded-lg border border-dark-700 bg-dark-900 h-full flex flex-col">
      <div className="p-3 border-b border-dark-700">
        <h2 className="text-white font-semibold">Desarrolladores</h2>
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
              className={`flex items-center gap-3 p-3 cursor-pointer border-l-2 transition-colors ${
                selectedId === dev.id
                  ? 'border-fizzia-500 bg-fizzia-500/10'
                  : 'border-transparent hover:bg-dark-800'
              }`}
            >
              <AvatarIcon id={dev.avatar_id} name={dev.full_name || dev.first_name} size={36} zoom={1.5} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{dev.full_name || dev.first_name || 'Sin nombre'}</p>
                <p className="text-dark-400 text-xs truncate">{dev.email || 'Sin email'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-dark-500">{dev.role === 'developer' ? `${dev.project_count || 0} proyectos` : 'Disponible para contratar'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6">
            <EmptyState message={filter === 'developer' ? 'No hay desarrolladores activos' : 'No hay clientes para contratar'} />
          </div>
        )}
      </div>
    </div>
  )
}
