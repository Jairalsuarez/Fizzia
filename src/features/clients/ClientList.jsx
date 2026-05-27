 
import { useCallback, useEffect, useState } from 'react'
import { EmptyState, Skeleton } from '../../components/ui/'
import { getAllClients } from '../../api/clientsApi'
import { AvatarIcon } from '../../data/avatars'
import { supabase } from '../../services/supabase'
import { readStoredJson, writeStoredJson } from '../../utils/persistedState'

const CACHE_KEY = 'fizzia-admin-clients-cache'

export default function ClientList({ selectedId, onSelect, refreshKey, onCreate }) {
  const [clients, setClients] = useState(() => readStoredJson(CACHE_KEY, []))
  const [loading, setLoading] = useState(() => readStoredJson(CACHE_KEY, []).length === 0)

  const loadClients = useCallback(async () => {
    const data = await getAllClients()
    setClients(data || [])
    writeStoredJson(CACHE_KEY, data || [])
    if (selectedId) {
      const selectedClient = (data || []).find(client => client.id === selectedId)
      onSelect(selectedClient || null)
    }
  }, [selectedId, onSelect])

  useEffect(() => { 
    setLoading(true)
    loadClients().finally(() => setLoading(false))
  }, [refreshKey, loadClients])

  useEffect(() => {
    let timer = null
    const refreshSilently = () => {
      clearTimeout(timer)
      timer = setTimeout(loadClients, 250)
    }

    const channel = supabase
      .channel('admin:clients:list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, refreshSilently)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_users' }, refreshSilently)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refreshSilently)
      .subscribe()

    return () => {
      clearTimeout(timer)
      channel.unsubscribe()
    }
  }, [loadClients])

  return (
    <div className="flex h-full flex-col rounded-lg border border-dark-700 bg-dark-900">
      <div className="flex items-center justify-between gap-3 border-b border-dark-700 p-3">
        <h2 className="text-white font-semibold">Clientes</h2>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent)] text-white shadow-md shadow-fizzia-500/15 transition-all hover:-translate-y-0.5 hover:bg-fizzia-600"
            aria-label="Nuevo cliente"
            title="Nuevo cliente"
          >
            <span className="material-symbols-rounded text-xl">add</span>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}
          </div>
        ) : clients.length > 0 ? (
          clients.map((client) => (
            <div
              key={client.id}
              onClick={() => onSelect(client)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-3.5 transition-colors sm:p-3 ${
                selectedId === client.id
                  ? 'bg-fizzia-500/10 ring-1 ring-inset ring-fizzia-500/20'
                  : 'hover:bg-dark-800'
              }`}
            >
              <AvatarIcon id={client.avatar_id} name={client.name} size={40} zoom={1.5} className="shrink-0 sm:!h-9 sm:!w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{client.name}</p>
                <p className="text-dark-400 text-xs truncate">{client.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-dark-500">{client.project_count || 0} proyectos</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6">
            <EmptyState message="No hay clientes" />
          </div>
        )}
      </div>
    </div>
  )
}
