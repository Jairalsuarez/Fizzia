import { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/'
import { supabase } from '../../services/supabase'
import { dismissDeveloper, hireDeveloper, updateDeveloper } from '../../api/developersApi'
import { AvatarIcon } from '../../data/avatars'
import { useToast } from '../../components/Toast'
import { getLastSeenAt, isMissingLastSeenColumn, isProfileOnline } from '../../utils/presence'

function openChatWith(userId) {
  window.dispatchEvent(new CustomEvent('fizzia-chat-open-user', { detail: { userId } }))
}

function formatLastSeen(dateStr) {
  if (!dateStr) return 'Desconocida'
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Justo ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `Hace ${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatOnlineDuration(createdAt) {
  if (!createdAt) return '-'
  const now = new Date()
  const created = new Date(createdAt)
  const diffMs = now - created
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 30) return `${diffDays} días`
  const months = Math.floor(diffDays / 30)
  const days = diffDays % 30
  if (months < 12) return `${months}m ${days}d`
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  return `${years}a ${remMonths}m`
}

async function fetchDeveloperPresence(developerId) {
  let result = await supabase.from('profiles').select('updated_at, last_seen_at').eq('id', developerId).single()
  if (isMissingLastSeenColumn(result.error)) {
    result = await supabase.from('profiles').select('updated_at').eq('id', developerId).single()
  }
  return result.data || null
}

export default function DeveloperDetail({ developer, onUpdate }) {
  const toast = useToast()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showHireModal, setShowHireModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [roleSaving, setRoleSaving] = useState(false)
  const [editData, setEditData] = useState(() => ({
    full_name: developer.full_name || '',
    email: developer.email || '',
    phone: developer.phone || '',
  }))
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState(() => getLastSeenAt(developer))

  useEffect(() => {
    setEditData({
      full_name: developer.full_name || '',
      email: developer.email || '',
      phone: developer.phone || '',
    })
    setLastSeenAt(getLastSeenAt(developer))
  }, [developer])

  useEffect(() => {
    if (!developer?.id) return
    let cancelled = false
    const check = async () => {
      const data = await fetchDeveloperPresence(developer.id)
      if (!cancelled && getLastSeenAt(data)) {
        setLastSeenAt(getLastSeenAt(data))
        setIsOnline(isProfileOnline(data))
      }
    }
    check()
    const id = setInterval(check, 10000)
    return () => { cancelled = true; clearInterval(id) }
  }, [developer.id])

  const handleSaveEdit = async () => {
    if (!editData.full_name.trim()) { toast.error('El nombre es requerido'); return }
    setSaving(true)
    const { data, error } = await updateDeveloper(developer.id, editData)
    setSaving(false)
    if (error) { toast.error('Error al actualizar: ' + error.message); return }
    toast.success('Desarrollador actualizado')
    setShowEditModal(false)
    onUpdate(data || { ...developer, ...editData })
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(`¿Despedir a ${developer.full_name || developer.first_name}? Esta acción eliminará su acceso.`)
    if (!confirmed) return
    setRoleSaving(true)
    const { data, error } = await dismissDeveloper(developer.id)
    setRoleSaving(false)
    if (error) { toast.error('Error al despedir: ' + error.message); return }
    toast.success(`${developer.full_name || developer.first_name} ahora es cliente`)
    setShowDeleteModal(false)
    onUpdate(data || { ...developer, role: 'client', project_count: 0 })
  }

  const handleHire = async () => {
    setRoleSaving(true)
    const { data, error } = await hireDeveloper(developer.id)
    setRoleSaving(false)
    if (error) { toast.error('Error al contratar: ' + error.message); return }
    toast.success(`${developer.full_name || developer.first_name} contratado como developer`)
    setShowHireModal(false)
    onUpdate(data || { ...developer, role: 'developer' })
  }

  if (!developer) return null

  return (
    <div className="rounded-lg border border-dark-700 bg-dark-900 h-full overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-dark-700">
        <div className="flex items-center gap-4 mb-4">
          <AvatarIcon id={developer.avatar_id} name={developer.full_name || developer.first_name} size={52} zoom={1.5} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white truncate">{developer.full_name || developer.first_name || 'Sin nombre'}</h2>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-green-500' : 'bg-dark-500'}`} />
            </div>
            <p className="text-dark-400 text-sm">{developer.email || 'Sin email'}</p>
            <p className="text-xs mt-0.5" style={{ color: isOnline ? 'var(--accent)' : '#6b7280' }}>
              {isOnline ? 'En línea' : `Última conexión fue ${formatLastSeen(lastSeenAt)}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openChatWith(developer.id)}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/20 transition-all text-sm"
          >
            <span className="material-symbols-rounded text-lg">chat</span>
            Chatear
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 text-dark-300 rounded-lg hover:text-white hover:bg-dark-700 transition-all text-sm"
          >
            <span className="material-symbols-rounded text-lg">edit</span>
            Editar
          </button>
          {developer.role === 'developer' ? (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm"
            >
              <span className="material-symbols-rounded text-lg">person_remove</span>
              Despedir
            </button>
          ) : (
            <button
              onClick={() => setShowHireModal(true)}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all text-sm"
            >
              <span className="material-symbols-rounded text-lg">person_add</span>
              Contratar
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Información</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-dark-400">Nombre</p>
            <p className="text-white text-sm">{developer.full_name || developer.first_name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-dark-400">Email</p>
            <p className="text-white text-sm">{developer.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-dark-400">Teléfono</p>
            <p className="text-white text-sm">{developer.phone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-dark-400">Rol</p>
            <p className="text-white text-sm capitalize">{developer.role || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-dark-400">Proyectos asignados</p>
            <p className="text-white text-sm">{developer.project_count || 0}</p>
          </div>
          <div>
            <p className="text-xs text-dark-400">Tiempo en el sistema</p>
            <p className="text-white text-sm">{formatOnlineDuration(developer.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar desarrollador" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-dark-400 mb-1 block">Nombre completo</label>
            <input
              type="text"
              value={editData.full_name}
              onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="text-sm text-dark-400 mb-1 block">Email</label>
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="text-sm text-dark-400 mb-1 block">Teléfono</label>
            <input
              type="text"
              value={editData.phone}
              onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowEditModal(false)} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all">Cancelar</button>
            <button onClick={handleSaveEdit} disabled={saving} className="cursor-pointer flex-1 px-4 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Despedir desarrollador" size="sm">
        <p className="text-dark-300 text-sm mb-4">¿Despedir a <span className="text-white font-medium">&quot;{developer.full_name || developer.first_name}&quot;</span>? Esta acción eliminará su acceso.</p>
        <div className="flex gap-2">
          <button onClick={() => setShowDeleteModal(false)} disabled={roleSaving} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white disabled:opacity-50 transition-all">Cancelar</button>
          <button onClick={handleDelete} disabled={roleSaving} className="cursor-pointer flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 disabled:opacity-50 transition-all">{roleSaving ? 'Despidiendo...' : 'Despedir'}</button>
        </div>
      </Modal>

      <Modal isOpen={showHireModal} onClose={() => setShowHireModal(false)} title="Contratar developer" size="sm">
        <p className="text-dark-300 text-sm mb-4">¿Contratar a <span className="text-white font-medium">&quot;{developer.full_name || developer.first_name}&quot;</span> como developer? Recuperará acceso al panel de desarrollador.</p>
        <div className="flex gap-2">
          <button onClick={() => setShowHireModal(false)} disabled={roleSaving} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white disabled:opacity-50 transition-all">Cancelar</button>
          <button onClick={handleHire} disabled={roleSaving} className="cursor-pointer flex-1 px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-400 disabled:opacity-50 transition-all">{roleSaving ? 'Contratando...' : 'Contratar'}</button>
        </div>
      </Modal>
    </div>
  )
}
