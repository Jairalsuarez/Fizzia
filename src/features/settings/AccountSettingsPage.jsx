import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { supabase } from '../../services/supabase'
import { getMyProfile, updatePassword, updateProfile } from '../../api/profilesApi'
import { useToast } from '../../components/Toast'
import { avatars } from '../../data/avatarOptions'
import { AvatarIcon } from '../../data/avatars.jsx'
import { appThemeOptions, useAppTheme } from '../../theme/appTheme'

const NOTIF_KEY = 'fizzia_notifications'
const WELCOME_KEY = 'fizzia_welcome_rotate'

function loadPrefs() {
  try {
    const notif = JSON.parse(localStorage.getItem(NOTIF_KEY))
    const welcome = JSON.parse(localStorage.getItem(WELCOME_KEY))
    return {
      projectUpdates: notif?.projectUpdates !== false,
      messages: notif?.messages !== false,
      payments: notif?.payments !== false,
      welcomeRotate: welcome !== false,
    }
  } catch {
    return { projectUpdates: true, messages: true, payments: true, welcomeRotate: true }
  }
}

function saveNotif(key, value) {
  const current = loadPrefs()
  const updated = { ...current, [key]: value }
  localStorage.setItem(NOTIF_KEY, JSON.stringify({ projectUpdates: updated.projectUpdates, messages: updated.messages, payments: updated.payments }))
  localStorage.setItem(WELCOME_KEY, JSON.stringify(updated.welcomeRotate))
}

const sectionMeta = [
  { key: 'perfil', icon: 'person', title: 'Perfil', desc: 'Tu informacion personal y avatar' },
  { key: 'seguridad', icon: 'lock', title: 'Seguridad', desc: 'Contrasena y sesion' },
  { key: 'tema', icon: 'palette', title: 'Tema', desc: 'Color de la aplicacion' },
  { key: 'notificaciones', icon: 'notifications', title: 'Notificaciones', desc: 'Que notificaciones recibes' },
  { key: 'bienvenida', icon: 'waving_hand', title: 'Mensajes de bienvenida', desc: 'Frases aleatorias en el inicio' },
]

export function AccountSettingsPage({
  fallbackName = 'Usuario',
  basePath = '/cliente',
}) {
  const { section } = useParams()
  const navigate = useNavigate()
  const { session, updateUser, signOut } = useAuth()
  const toast = useToast()
  const { theme: selectedTheme, palette, setTheme } = useAppTheme()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [previewAvatarId, setPreviewAvatarId] = useState(null)
  const [formData, setFormData] = useState({ full_name: '', phone: '' })
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [prefs, setPrefs] = useState(loadPrefs)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const p = await getMyProfile()
      if (cancelled) return
      setProfile(p)
      if (p) setFormData({ full_name: p.full_name || '', phone: p.phone || '' })
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const displayName = profile?.full_name || fallbackName
  const selectedAvatarId = profile?.avatar_id
  const inputClass = 'w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-[var(--accent)] transition-all'

  const togglePref = (key, value) => {
    saveNotif(key, value)
    setPrefs(prev => ({ ...prev, [key]: value }))
    window.dispatchEvent(new Event('fizzia-welcome-change'))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await updateProfile(formData)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    if (data) {
      setProfile(prev => ({ ...prev, ...data }))
      updateUser(data)
      window.dispatchEvent(new Event('auth-profile-update'))
    }
    toast.success('Perfil actualizado')
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (passwordData.new !== passwordData.confirm) { toast.error('Las contrasenas no coinciden'); return }
    if (passwordData.new.length < 6) { toast.error('Minimo 6 caracteres'); return }
    setSaving(true)
    const { error } = await updatePassword(passwordData.current, passwordData.new)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setPasswordData({ current: '', new: '', confirm: '' })
    toast.success('Contrasena actualizada')
  }

  const handleSelectAvatar = async (avatarId) => {
    const { error } = await supabase.from('profiles').update({ avatar_id: avatarId }).eq('id', session?.user?.id)
    if (error) { toast.error('Error al actualizar avatar'); return }
    setProfile(prev => ({ ...prev, avatar_id: avatarId }))
    updateUser({ avatar_id: avatarId })
    toast.success('Avatar actualizado')
    setShowAvatarPicker(false); setPreviewAvatarId(null)
  }

  const handleRemoveAvatar = async () => {
    const { error } = await supabase.from('profiles').update({ avatar_id: null }).eq('id', session?.user?.id)
    if (error) { toast.error('Error al eliminar avatar'); return }
    setProfile(prev => ({ ...prev, avatar_id: null }))
    updateUser({ avatar_id: null })
    toast.success('Avatar eliminado')
    setShowAvatarPicker(false); setPreviewAvatarId(null)
  }

  const Toggle = ({ checked, onChange }) => (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`cursor-pointer relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[var(--accent)]' : 'bg-dark-700'}`}>
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-dark-800 rounded animate-pulse" />
        <div className="h-16 bg-dark-800 rounded-xl animate-pulse" />
        <div className="h-16 bg-dark-800 rounded-xl animate-pulse" />
        <div className="h-16 bg-dark-800 rounded-xl animate-pulse" />
        <div className="h-16 bg-dark-800 rounded-xl animate-pulse" />
        <div className="h-16 bg-dark-800 rounded-xl animate-pulse" />
        <div className="h-16 bg-dark-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  const backLink = `${basePath}/configuracion`

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 w-full">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {section ? sectionMeta.find(s => s.key === section)?.title || 'Configuracion' : 'Configuracion'}
          </h1>
          <p className="text-dark-400 text-sm mt-0.5">
            {section ? 'Personaliza esta seccion' : 'Personaliza tu experiencia en Fizzia'}
          </p>
        </div>
      </div>

      {/* ── INDEX ── */}
      {!section && (
        <div className="space-y-2">
          {sectionMeta.map(s => (
            <Link
              key={s.key}
              to={`${backLink}/${s.key}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dark-800 bg-dark-900/60 px-4 py-3.5 transition-colors hover:border-dark-600 hover:bg-dark-800/80"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-rounded text-[var(--accent)] text-xl shrink-0">{s.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{s.title}</span>
                  <span className="block text-xs text-dark-500">{s.desc}</span>
                </span>
              </span>
              <span className="material-symbols-rounded text-dark-500 text-lg shrink-0">chevron_right</span>
            </Link>
          ))}

          <Link to={`${basePath}/terminos`} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dark-800 bg-dark-900/60 px-4 py-3.5 transition-colors hover:border-dark-600 hover:bg-dark-800/80">
            <span className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-rounded text-[var(--accent)] text-xl shrink-0">contract</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Terminos y condiciones</span>
                <span className="block text-xs text-dark-500">Lee el documento legal</span>
              </span>
            </span>
            <span className="material-symbols-rounded text-dark-500 text-lg shrink-0">chevron_right</span>
          </Link>

          <Link to={`${basePath}/tutoriales`} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dark-800 bg-dark-900/60 px-4 py-3.5 transition-colors hover:border-dark-600 hover:bg-dark-800/80">
            <span className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-rounded text-[var(--accent)] text-xl shrink-0">menu_book</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Tutoriales</span>
                <span className="block text-xs text-dark-500">Reproduce los tutoriales de cada seccion</span>
              </span>
            </span>
            <span className="material-symbols-rounded text-dark-500 text-lg shrink-0">chevron_right</span>
          </Link>
        </div>
      )}

      {/* ── PERFIL ── */}
      {section === 'perfil' && (
        <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => { setShowAvatarPicker(true); setPreviewAvatarId(selectedAvatarId) }}
              className="cursor-pointer w-20 h-20 rounded-full bg-white border-2 border-dark-700 flex items-center justify-center overflow-hidden group relative">
              <AvatarIcon id={selectedAvatarId} size={80} />
              <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-rounded text-white text-xl">edit</span>
              </div>
            </button>
            <div>
              <p className="text-white font-semibold">{displayName}</p>
              <p className="text-dark-400 text-sm">{session?.user?.email}</p>
              <button type="button" onClick={() => { setShowAvatarPicker(true); setPreviewAvatarId(selectedAvatarId) }}
                className="text-[var(--accent)] text-xs font-medium mt-1 hover:underline">Cambiar avatar</button>
            </div>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Nombre completo</label>
              <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className={inputClass} placeholder="Tu nombre" />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Telefono</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} placeholder="+52 55 1234 5678" />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Email</label>
              <input type="email" value={session?.user?.email || ''} className={`${inputClass} opacity-60 cursor-not-allowed`} disabled />
              <p className="text-dark-500 text-xs mt-1">El email no se puede cambiar</p>
            </div>
            <button type="submit" disabled={saving} className="cursor-pointer px-6 py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-lighter)] disabled:opacity-50 transition-all">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      )}

      {/* ── SEGURIDAD ── */}
      {section === 'seguridad' && (
        <div className="space-y-4">
          <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="text-white font-semibold">Cambiar contrasena</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {[
                { key: 'current', label: 'Contrasena actual', placeholder: 'Tu contrasena actual' },
                { key: 'new', label: 'Nueva contrasena', placeholder: 'Minimo 6 caracteres' },
                { key: 'confirm', label: 'Confirmar nueva contrasena', placeholder: 'Repite la contrasena' },
              ].map(field => (
                <div className="relative" key={field.key}>
                  <label className="block text-sm text-dark-300 mb-1.5">{field.label}</label>
                  <input type={showPasswords[field.key] ? 'text' : 'password'} value={passwordData[field.key]}
                    onChange={(e) => setPasswordData({ ...passwordData, [field.key]: e.target.value })}
                    className={`${inputClass} pr-12`} placeholder={field.placeholder} />
                  <button type="button" onClick={() => setShowPasswords(p => ({ ...p, [field.key]: !p[field.key] }))}
                    className="cursor-pointer absolute right-3 top-[38px] text-dark-500 hover:text-white transition-colors" tabIndex={-1}>
                    <span className="material-symbols-rounded text-xl">{showPasswords[field.key] ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              ))}
              <button type="submit" disabled={saving} className="cursor-pointer px-6 py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-lighter)] disabled:opacity-50 transition-all">
                {saving ? 'Actualizando...' : 'Actualizar contrasena'}
              </button>
            </form>
          </div>
          <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5 sm:p-6 space-y-3">
            <h3 className="text-white font-semibold">Cerrar sesion</h3>
            <p className="text-dark-400 text-sm">Cierra tu sesion en todos los dispositivos</p>
            <button onClick={signOut} className="cursor-pointer px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-all">
              Cerrar sesion
            </button>
          </div>
        </div>
      )}

      {/* ── TEMA ── */}
      {section === 'tema' && (
        <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {appThemeOptions.map(option => {
              const isSelected = selectedTheme === option.key
              return (
                <button key={option.key} type="button" onClick={() => setTheme(option.key)}
                  className={`cursor-pointer flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${isSelected ? `${option.borderStrong} ${option.activeBg}` : 'border-dark-700 bg-dark-950/50 hover:border-dark-600'}`}>
                  <span className={`h-8 w-8 rounded-full ${option.swatch} shadow-lg ${option.shadow}`} />
                  <span>
                    <span className="block text-sm font-medium text-white">{option.label}</span>
                    <span className="block text-xs text-dark-500">{isSelected ? 'Activo' : 'Disponible'}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── NOTIFICACIONES ── */}
      {section === 'notificaciones' && (
        <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="space-y-4">
            {[
              { key: 'projectUpdates', label: 'Actualizaciones de proyecto', desc: 'Cuando cambie el estado de tu proyecto' },
              { key: 'messages', label: 'Mensajes del equipo', desc: 'Cuando recibas un mensaje del equipo' },
              { key: 'payments', label: 'Pagos y facturas', desc: 'Cuando se registre un pago o factura' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-dark-500">{item.desc}</p>
                </div>
                <Toggle checked={prefs[item.key]} onChange={(v) => togglePref(item.key, v)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BIENVENIDA ── */}
      {section === 'bienvenida' && (
        <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Rotar mensajes de bienvenida</p>
              <p className="text-xs text-dark-500">Muestra una frase diferente cada vez que entras al inicio</p>
            </div>
            <Toggle checked={prefs.welcomeRotate} onChange={(v) => togglePref('welcomeRotate', v)} />
          </div>
        </div>
      )}

      {/* ── AVATAR PICKER ── */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setShowAvatarPicker(false); setPreviewAvatarId(null) }}>
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-dark-700">
              <h3 className="text-lg font-bold text-white">Elige tu avatar</h3>
              <button onClick={() => { setShowAvatarPicker(false); setPreviewAvatarId(null) }} className="cursor-pointer text-dark-400 hover:text-white transition-colors">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="flex flex-col items-center py-8 bg-dark-950/50">
              <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg">
                <AvatarIcon id={previewAvatarId || selectedAvatarId} size={128} />
              </div>
              <p className="text-white font-medium mt-4 text-sm">
                {previewAvatarId || selectedAvatarId ? avatars.find(a => a.id === (previewAvatarId || selectedAvatarId))?.label : 'Sin avatar'}
              </p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3">
                {avatars.map(av => (
                  <button key={av.id} onClick={() => setPreviewAvatarId(av.id)}
                    className={`cursor-pointer aspect-square rounded-full border-2 transition-all flex items-center justify-center overflow-hidden bg-white ${
                      previewAvatarId === av.id ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] scale-105'
                        : selectedAvatarId === av.id ? 'border-dark-500' : 'border-dark-700 hover:border-dark-600'}`}
                    title={av.label}>
                    <AvatarIcon id={av.id} size={48} />
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-dark-700 flex gap-3">
              <button onClick={handleRemoveAvatar} className="cursor-pointer flex-1 py-3 bg-dark-800 border border-dark-700 text-dark-300 font-semibold rounded-xl hover:text-white transition-all">Quitar avatar</button>
              <button onClick={() => handleSelectAvatar(previewAvatarId || selectedAvatarId)} className="cursor-pointer flex-1 py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-lighter)] transition-all">Usar este avatar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
