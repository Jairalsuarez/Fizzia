import { useCallback, useEffect, useState } from 'react'
import { Modal } from '../../components/ui/'
import { EmptyState } from '../../components/ui/EmptyState'
import { deleteClient, createClient } from '../../api/clientsApi'
import ClientList from '../../features/clients/ClientList'
import ClientDetail from '../../features/clients/ClientDetail'
import { useToast } from '../../components/Toast'
import { readStoredValue, writeStoredValue } from '../../utils/persistedState'

const SELECTED_CLIENT_KEY = 'fizzia-admin-selected-client'

export function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState(() => readStoredValue(SELECTED_CLIENT_KEY, ''))
  const [showForm, setShowForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', country: '' })
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const toast = useToast()

  useEffect(() => {
    writeStoredValue(SELECTED_CLIENT_KEY, selectedClientId)
  }, [selectedClientId])

  const handleSelectClient = useCallback((client) => {
    setSelectedClient(client)
    setSelectedClientId(client?.id || '')
  }, [])

  const handleClientSaved = async (e) => {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    const { error } = await createClient(form)
    setSaving(false)
    if (error) return toast.error('Error al crear cliente')
    setShowForm(false)
    setForm({ name: '', email: '', phone: '', city: '', country: '' })
    toast.success('Cliente creado')
    setRefreshKey(k => k + 1)
  }

  const handleDelete = async () => {
    const { error } = await deleteClient(selectedClient.id)
    if (error) {
      toast.error('Error al eliminar: ' + error.message)
      return
    }
    setShowDeleteModal(false)
    handleSelectClient(null)
    toast.success('Cliente eliminado')
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <button onClick={() => setShowForm(true)} className="cursor-pointer px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all">Nuevo Cliente</button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-180px)]">
        <div className="w-1/3">
          <ClientList selectedId={selectedClient?.id || selectedClientId} onSelect={handleSelectClient} refreshKey={refreshKey} />
        </div>
        <div className="flex-1">
          {selectedClient ? (
            <ClientDetail client={selectedClient} onUpdate={(updated) => { setRefreshKey(k => k + 1); if (updated) handleSelectClient(updated) }} />
          ) : (
            <div className="rounded-xl border border-dark-800 bg-dark-900/50 h-full flex items-center justify-center">
              <EmptyState message="Selecciona un cliente para ver detalles" />
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setForm({ name: '', email: '', phone: '', city: '', country: '' }) }} title="Nuevo Cliente" size="sm">
        <form onSubmit={handleClientSaved} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)] placeholder-dark-600"
              placeholder="Nombre del cliente"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)] placeholder-dark-600"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Teléfono</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)] placeholder-dark-600"
              placeholder="+52 55 1234 5678"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)] placeholder-dark-600"
                placeholder="Ciudad"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">País</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)] placeholder-dark-600"
                placeholder="País"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setShowForm(false); setForm({ name: '', email: '', phone: '', city: '', country: '' }) }} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="cursor-pointer flex-1 px-4 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar Cliente" size="sm">
        <p className="text-dark-300 text-sm mb-4">¿Eliminar cliente <span className="text-white font-medium">&quot;{selectedClient?.name}&quot;</span>?</p>
        <div className="flex gap-2">
          <button onClick={() => setShowDeleteModal(false)} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all">Cancelar</button>
          <button onClick={handleDelete} className="cursor-pointer flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 transition-all">Eliminar</button>
        </div>
      </Modal>
    </div>
  )
}
