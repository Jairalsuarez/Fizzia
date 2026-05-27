import { useState, useEffect, useCallback } from 'react'
import { StatusBadge, Modal } from '../../components/ui/'
import { formatMoney } from '../../utils/format'
import { deleteClient, updateClient, getAllClientProjects } from '../../api/clientsApi'
import ProjectForm from './ProjectForm'
import { DeleteProjectModal } from '../../components/projects/DeleteProjectModal'
import { useToast } from '../../components/Toast'
import { AvatarIcon } from '../../data/avatars'

export default function ClientDetail({ client, onUpdate }) {
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState(() => ({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    city: client.city || '',
    country: client.country || '',
  }))
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectDetail, setShowProjectDetail] = useState(false)
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const loadProjects = useCallback(async () => {
    const data = await getAllClientProjects(client.id)
    setProjects(data || [])
  }, [client.id])

  useEffect(() => {
    loadProjects()
    setEditData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      city: client.city || '',
      country: client.country || '',
    })
  }, [client, loadProjects])

  const handleSaveEdit = async () => {
    if (!editData.name.trim()) { toast.error('El nombre es requerido'); return }
    setSaving(true)
    const { data, error } = await updateClient(client.id, editData)
    setSaving(false)
    if (error) {
      toast.error('Error al actualizar: ' + error.message)
      return
    }
    toast.success('Cliente actualizado')
    setShowEditModal(false)
    onUpdate(data || { ...client, ...editData })
  }

  const handleDelete = async () => {
    const { error } = await deleteClient(client.id)
    if (error) {
      toast.error('Error al eliminar: ' + error.message)
      return
    }
    setShowDeleteModal(false)
    onUpdate()
    toast.success('Cliente eliminado')
  }

  const sendWhatsApp = () => {
    const phone = client.phone?.replace(/[\s\-()]/g, '') || ''
    if (!phone) return toast.error('El cliente no tiene teléfono')
    const name = client.name?.split(' ')[0] || 'estimado cliente'
    const msg = `Hola ${name}, gracias por tu preferencia. Queremos recordarte que estamos disponibles para cualquier consulta sobre tus proyectos. Saludos, equipo Fizzia.`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="h-full min-w-0 overflow-y-auto rounded-lg border border-dark-700 bg-dark-900 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarIcon id={client.avatar_id} name={client.name} size={44} zoom={1.5} className="shrink-0" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-white">{client.name}</h2>
            <p className="truncate text-sm text-dark-400">{client.email}</p>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <button
            onClick={() => setShowProjectForm(true)}
            className="col-span-2 inline-flex cursor-pointer items-center justify-center rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-fizzia-500/15 transition-all hover:bg-fizzia-600 sm:col-span-1"
          >
            Nuevo proyecto
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-dark-600 px-3 py-2 text-sm text-dark-300 transition-all hover:border-dark-500 hover:text-white"
          >
            <span className="material-symbols-rounded text-sm">edit</span>
            Editar
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="cursor-pointer rounded border border-red-500/20 px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10"
          >
            Eliminar
          </button>
          <button
            onClick={sendWhatsApp}
            className="col-span-2 inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm text-white transition-all hover:bg-green-500 sm:col-span-1"
          >
            <span className="material-symbols-rounded text-base">chat</span>
            WhatsApp
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-dark-400">Email</p>
          <p className="break-words text-white">{client.email || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-dark-400">Teléfono</p>
          <p className="break-words text-white">{client.phone || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-dark-400">Ciudad</p>
          <p className="break-words text-white">{client.city || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-dark-400">País</p>
          <p className="break-words text-white">{client.country || '-'}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Proyectos ({projects.length})</h3>
        {projects.length > 0 ? (
          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => { setSelectedProject(project); setShowProjectDetail(true) }}
                className="grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-dark-700 bg-dark-800/50 p-3 text-left transition-all hover:border-dark-500 hover:bg-dark-800 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
              >
                <StatusBadge status={project.status} size="sm" />
                <span className="truncate text-sm font-medium text-white">{project.name}</span>
                <span className="hidden shrink-0 text-xs text-dark-400 sm:inline">{formatMoney(project.final_price || project.budget || 0)}</span>
                <span className="material-symbols-rounded text-base text-dark-500">chevron_right</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-dark-500 text-sm">No hay proyectos</p>
        )}
      </div>

      {/* Project Detail Modal */}
      <Modal open={showProjectDetail} onClose={() => { setShowProjectDetail(false); setSelectedProject(null) }} title={selectedProject?.name || 'Proyecto'} size="sm">
        {selectedProject && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-dark-400">Estado</p>
                <StatusBadge status={selectedProject.status} size="sm" />
              </div>
              <div>
                <p className="text-xs text-dark-400">Presupuesto</p>
                <p className="text-white text-sm font-semibold">{formatMoney(selectedProject.budget || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-dark-400">Precio final</p>
                <p className="text-white text-sm font-semibold">{selectedProject.final_price ? formatMoney(selectedProject.final_price) : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-400">Moneda</p>
                <p className="text-white text-sm">{selectedProject.currency || 'USD'}</p>
              </div>
            </div>
            {selectedProject.description && (
              <div>
                <p className="text-xs text-dark-400 mb-1">Descripción</p>
                <p className="text-white text-sm">{selectedProject.description}</p>
              </div>
            )}
            <div className="flex gap-2 pt-4 border-t border-dark-700">
              <button onClick={() => setShowProjectDetail(false)} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all">Cerrar</button>
              <button onClick={() => { setShowProjectDetail(false); setShowDeleteProjectModal(true) }} className="cursor-pointer flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 transition-all">Eliminar proyecto</button>
            </div>
          </div>
        )}
      </Modal>

      <DeleteProjectModal
        isOpen={showDeleteProjectModal}
        onClose={() => setShowDeleteProjectModal(false)}
        project={selectedProject}
        onDeleted={() => { setShowDeleteProjectModal(false); setShowProjectDetail(false); setSelectedProject(null); loadProjects() }}
      />

      <Modal open={showProjectForm} onClose={() => setShowProjectForm(false)}>
        <ProjectForm clientId={client.id} onSaved={() => { setShowProjectForm(false); loadProjects() }} />
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar cliente" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-dark-400 mb-1 block">Nombre</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-fizzia-500"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-dark-400 mb-1 block">Email</label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-fizzia-500"
              />
            </div>
            <div>
              <label className="text-sm text-dark-400 mb-1 block">Teléfono</label>
              <input
                type="text"
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-fizzia-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-dark-400 mb-1 block">Ciudad</label>
              <input
                type="text"
                value={editData.city}
                onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-fizzia-500"
              />
            </div>
            <div>
              <label className="text-sm text-dark-400 mb-1 block">País</label>
              <input
                type="text"
                value={editData.country}
                onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-fizzia-500"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowEditModal(false)} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all">Cancelar</button>
            <button onClick={handleSaveEdit} disabled={saving} className="cursor-pointer flex-1 px-4 py-2.5 bg-fizzia-500 text-white text-sm font-medium rounded-lg hover:bg-fizzia-400 disabled:opacity-50 transition-all">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Eliminar Cliente</h3>
          <p className="text-dark-300 mb-4">¿Eliminar cliente "{client.name}"?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded border border-dark-700 text-white hover:bg-dark-800">Cancelar</button>
            <button onClick={handleDelete} className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
