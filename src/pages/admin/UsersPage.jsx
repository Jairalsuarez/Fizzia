import { useCallback, useEffect, useState } from 'react'
import { Modal } from '../../components/ui/'
import { EmptyState } from '../../components/ui/EmptyState'
import { createClient } from '../../api/clientsApi'
import ClientList from '../../features/clients/ClientList'
import ClientDetail from '../../features/clients/ClientDetail'
import DeveloperList from '../../features/developers/DeveloperList'
import DeveloperDetail from '../../features/developers/DeveloperDetail'
import { useToast } from '../../components/Toast'
import { readStoredJson, readStoredValue, writeStoredJson, writeStoredValue } from '../../utils/persistedState'

const SELECTED_USER_KEY = 'fizzia-admin-selected-user'
const USER_MODE_KEY = 'fizzia-admin-users-mode'
const emptyClientForm = { name: '', email: '', phone: '', city: '', country: '' }

export function UsersPage() {
  const [mode, setMode] = useState(() => readStoredValue(USER_MODE_KEY, 'clients'))
  const [selectedUser, setSelectedUser] = useState(() => readStoredJson(SELECTED_USER_KEY, null))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyClientForm)
  const [saving, setSaving] = useState(false)
  const [clientRefreshKey, setClientRefreshKey] = useState(0)
  const [developerRefreshKey, setDeveloperRefreshKey] = useState(0)
  const toast = useToast()

  useEffect(() => {
    writeStoredJson(SELECTED_USER_KEY, selectedUser)
  }, [selectedUser])

  useEffect(() => {
    writeStoredValue(USER_MODE_KEY, mode)
  }, [mode])

  const handleSelectClient = useCallback((client) => {
    setSelectedUser(client ? { type: 'client', data: client } : null)
  }, [])

  const handleSelectDeveloper = useCallback((developer) => {
    setSelectedUser(developer ? { type: 'developer', data: developer } : null)
  }, [])

  const handleClientSaved = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const { error } = await createClient(form)
    setSaving(false)
    if (error) return toast.error('Error al crear cliente')
    setShowForm(false)
    setForm(emptyClientForm)
    toast.success('Cliente creado')
    setClientRefreshKey(key => key + 1)
  }

  const handleClientUpdate = (updated) => {
    setClientRefreshKey(key => key + 1)
    setDeveloperRefreshKey(key => key + 1)
    setSelectedUser(updated ? { type: 'client', data: updated } : null)
  }

  const handleDeveloperUpdate = (updated) => {
    setDeveloperRefreshKey(key => key + 1)
    setClientRefreshKey(key => key + 1)
    setSelectedUser(updated ? { type: 'developer', data: updated } : null)
  }

  const selectedClientId = selectedUser?.type === 'client' ? selectedUser.data?.id : ''
  const selectedDeveloperId = selectedUser?.type === 'developer' ? selectedUser.data?.id : ''
  const showingClients = mode === 'clients'
  const hasActiveSelection = showingClients
    ? Boolean(selectedUser?.type === 'client' && selectedUser.data)
    : Boolean(selectedUser?.type === 'developer' && selectedUser.data)

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setSelectedUser((current) => {
      if (!current) return null
      if (nextMode === 'clients' && current.type === 'client') return current
      if (nextMode === 'developers' && current.type === 'developer') return current
      return null
    })
  }

  return (
    <div className="px-3 py-4 sm:p-6">
      <div className="mb-5 grid gap-4">
        <h1 className="text-center text-2xl font-bold text-white sm:text-left">Usuarios</h1>
        <div className="mx-auto w-full max-w-md">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-dark-700 bg-dark-900 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleModeChange('clients')}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-all ${showingClients ? 'bg-[var(--accent)] text-white shadow-md shadow-fizzia-500/15' : 'text-dark-400 hover:bg-dark-800 hover:text-white'}`}
            >
              Clientes
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('developers')}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-all ${!showingClients ? 'bg-[var(--accent)] text-white shadow-md shadow-fizzia-500/15' : 'text-dark-400 hover:bg-dark-800 hover:text-white'}`}
            >
              Desarrolladores
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(300px,0.42fr)_minmax(0,1fr)] xl:grid-cols-[minmax(340px,0.38fr)_minmax(0,1fr)]">
        <section className={`${hasActiveSelection ? 'hidden lg:block' : 'block'} h-[calc(100dvh-238px)] min-h-[420px] lg:h-[calc(100dvh-220px)]`}>
          {showingClients ? (
            <ClientList selectedId={selectedClientId} onSelect={handleSelectClient} refreshKey={clientRefreshKey} onCreate={() => setShowForm(true)} />
          ) : (
            <DeveloperList
              selectedId={selectedDeveloperId}
              onSelect={handleSelectDeveloper}
              refreshKey={developerRefreshKey}
              showRoleFilter={false}
              fixedRole="developer"
            />
          )}
        </section>

        <section className={`${hasActiveSelection ? 'flex' : 'hidden lg:flex'} min-h-[calc(100dvh-238px)] flex-col lg:h-[calc(100dvh-220px)]`}>
          {hasActiveSelection && (
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="mb-3 inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm font-medium text-dark-300 transition-all hover:border-dark-500 hover:text-white lg:hidden"
            >
              <span className="material-symbols-rounded text-lg">arrow_back</span>
              Usuarios
            </button>
          )}
          <div className="min-h-0 flex-1">
            {showingClients && selectedUser?.type === 'client' && selectedUser.data ? (
              <ClientDetail client={selectedUser.data} onUpdate={handleClientUpdate} />
            ) : !showingClients && selectedUser?.type === 'developer' && selectedUser.data ? (
              <DeveloperDetail developer={selectedUser.data} onUpdate={handleDeveloperUpdate} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dark-700 bg-dark-900/70">
                <EmptyState message={showingClients ? 'Selecciona un cliente para ver detalles' : 'Selecciona un desarrollador para ver detalles'} />
              </div>
            )}
          </div>
        </section>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setForm(emptyClientForm) }} title="Nuevo cliente" size="sm">
        <form onSubmit={handleClientSaved} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-dark-400">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm(prev => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-lg border border-dark-700 bg-dark-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-dark-500 focus:border-[var(--accent)]"
              placeholder="Nombre del cliente"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-dark-400">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm(prev => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-lg border border-dark-700 bg-dark-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-dark-500 focus:border-[var(--accent)]"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-dark-400">Telefono</label>
            <input
              type="text"
              value={form.phone}
              onChange={(event) => setForm(prev => ({ ...prev, phone: event.target.value }))}
              className="w-full rounded-lg border border-dark-700 bg-dark-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-dark-500 focus:border-[var(--accent)]"
              placeholder="+593 99 123 4567"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-dark-400">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(event) => setForm(prev => ({ ...prev, city: event.target.value }))}
                className="w-full rounded-lg border border-dark-700 bg-dark-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-dark-500 focus:border-[var(--accent)]"
                placeholder="Ciudad"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-dark-400">Pais</label>
              <input
                type="text"
                value={form.country}
                onChange={(event) => setForm(prev => ({ ...prev, country: event.target.value }))}
                className="w-full rounded-lg border border-dark-700 bg-dark-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-dark-500 focus:border-[var(--accent)]"
                placeholder="Pais"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(emptyClientForm) }}
              className="flex-1 cursor-pointer rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-sm font-medium text-dark-300 transition-all hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-fizzia-600 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
