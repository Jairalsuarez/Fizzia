import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { supabase } from '../../services/supabase'
import { sendAdminMessage } from '../../api/messagesApi'
import { deleteProject } from '../../api/projectsApi'
import { useToast } from '../Toast'

const AGREED_PHRASE = 'Estoy de acuerdo en eliminar este proyecto'

export function DeleteProjectModal({ isOpen, onClose, project, onDeleted }) {
  const [password, setPassword] = useState('')
  const [agreedText, setAgreedText] = useState('')
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)
  const toast = useToast()

  const reset = () => {
    setPassword('')
    setAgreedText('')
    setReason('')
    setActing(false)
  }

  const handleClose = () => {
    reset()
    onClose?.()
  }

  const handleConfirm = async () => {
    if (!password.trim()) { toast.error('Ingresa tu contraseña'); return }
    if (agreedText !== AGREED_PHRASE) { toast.error('Debes escribir la frase de confirmación exactamente'); return }
    if (!reason.trim()) { toast.error('Ingresa una razón para eliminar el proyecto'); return }

    const { error } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email, password,
    })
    if (error) { toast.error('Contraseña incorrecta'); return }

    setActing(true)
    const message = `Tu proyecto ${project?.name} ha sido rechazado por el administrador de Fizzia, por la siguiente razón: ${reason}. Si tienes alguna duda, escríbenos, o crea un proyecto nuevo.`
    await sendAdminMessage(project?.id, message).catch(() => null)
    const { error: deleteError } = await deleteProject(project?.id)
    if (deleteError) {
      setActing(false)
      toast.error('Error al eliminar: ' + deleteError.message)
      return
    }
    toast.success('Proyecto eliminado')
    onDeleted?.()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Eliminar proyecto" size="sm" closeOnBackdrop={false} closeOnEscape={false}>
      <p className="text-dark-300 text-sm mb-4">Estás por eliminar permanentemente <span className="text-white font-medium">{project?.name}</span>. Esta acción no se puede deshacer.</p>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-dark-400 mb-1 block">Razón de la eliminación</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)] resize-none" rows={3} placeholder="Explica por qué se elimina este proyecto..." />
        </div>
        <div>
          <label className="text-sm text-dark-400 mb-1 block">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)]" placeholder="Ingresa tu contraseña" />
        </div>
        <div>
          <label className="text-sm text-dark-400 mb-1 block">Escribe la siguiente frase para confirmar:</label>
          <p className="text-xs text-dark-500 mb-2 font-mono">{AGREED_PHRASE}</p>
          <input type="text" value={agreedText} onChange={(e) => setAgreedText(e.target.value)} className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)]" placeholder="Escribe la frase exacta..." />
        </div>
        <div className="flex gap-2">
          <button onClick={handleClose} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all">Cerrar</button>
          <button onClick={handleConfirm} disabled={acting} className="cursor-pointer flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 disabled:opacity-50 transition-all">{acting ? 'Eliminando...' : 'Eliminar proyecto'}</button>
        </div>
      </div>
    </Modal>
  )
}
