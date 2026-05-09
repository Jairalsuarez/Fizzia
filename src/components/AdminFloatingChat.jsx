import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { ChatListItem } from './ChatListItem'
import { useAuth } from '../features/auth/authContext'
import { getMessagesBySender } from '../api/messagesApi'

export function AdminFloatingChat() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [profiles, setProfiles] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [lastMessages, setLastMessages] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userMessages, setUserMessages] = useState([])
  const [userMessagesLoading, setUserMessagesLoading] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const loadProfiles = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('role', { ascending: true })
        if (!cancelled) setProfiles(data || [])
        if (!cancelled) {
          // Load last message for each profile
          const msgs = {}
          if (data) {
            await Promise.all(data.map(async (p) => {
              try {
                const msgsData = await getMessagesBySender(p.id)
                if (msgsData?.length) msgs[p.id] = msgsData[0].content
              } catch { /* ignore */ }
            }))
          }
          if (!cancelled) setLastMessages(msgs)
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadProfiles()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let channel
    try {
      channel = supabase.channel('app:presence')
      channel.on('presence', { event: 'sync' }, () => {
        try {
          const state = channel.presenceState()
          const userIds = new Set()
          for (const presences of Object.values(state)) {
            const items = Array.isArray(presences) ? presences : [presences]
            for (const p of items) { if (p?.user_id) userIds.add(p.user_id) }
          }
          setOnlineUsers(userIds)
        } catch { /* ignore */ }
      })
      channel.subscribe()
    } catch { /* ignore */ }
    return () => {
      try { channel?.unsubscribe() } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (e) => {
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return
      setIsOpen(false)
      setSelectedUser(null)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  const handleSelectUser = async (profile) => {
    setSelectedUser(profile)
    setUserMessagesLoading(true)
    try {
      const msgs = await getMessagesBySender(profile.id)
      setUserMessages(msgs || [])
    } catch {
      setUserMessages([])
    } finally {
      setUserMessagesLoading(false)
    }
  }

  const roleIcon = {
    admin: 'admin_panel_settings',
    manager: 'manage_accounts',
    developer: 'code',
    client: 'person',
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => { setIsOpen(prev => !prev); setSelectedUser(null) }}
        title="Usuarios en linea"
        className="cursor-pointer fixed bottom-5 right-5 z-[900] flex h-14 w-14 items-center justify-center rounded-full bg-fizzia-500 shadow-2xl shadow-fizzia-500/25 transition-all hover:bg-fizzia-400 active:scale-95 sm:bottom-6 sm:right-6"
      >
        <span className="material-symbols-rounded text-white text-2xl">
          {isOpen ? 'close' : 'group'}
        </span>
        {onlineUsers.size > 1 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
            {onlineUsers.size - 1 > 9 ? '9+' : onlineUsers.size - 1}
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={panelRef} className="fixed inset-x-3 bottom-24 z-[900] flex h-[min(520px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-6 sm:w-80">
          {/* Header */}
          <div className="border-b border-dark-700 bg-dark-950 p-3 flex items-center gap-3">
            {selectedUser && (
              <button onClick={() => setSelectedUser(null)} className="cursor-pointer text-dark-400 hover:text-white">
                <span className="material-symbols-rounded text-lg">arrow_back</span>
              </button>
            )}
            <div className="flex-1 min-w-0">
              {selectedUser ? (
                <>
                  <p className="text-white text-sm font-semibold truncate">
                    {selectedUser.full_name || selectedUser.first_name || 'Usuario'}
                    {selectedUser.id === user?.id && ' (tú)'}
                  </p>
                  <p className="text-dark-500 text-xs">Mensajes recientes</p>
                </>
              ) : (
                <>
                  <p className="text-white text-sm font-semibold">Usuarios</p>
                  <p className="text-dark-500 text-xs">{onlineUsers.size} en linea · {profiles.length} total</p>
                </>
              )}
            </div>
            {!selectedUser && onlineUsers.size > 0 && (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>

          {/* Content */}
          {selectedUser ? (
            <div className="flex-1 overflow-y-auto p-3">
              {userMessagesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 bg-dark-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : userMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-dark-500 text-sm">
                  Sin mensajes
                </div>
              ) : (
                <div className="space-y-3">
                  {userMessages.map((msg, i) => (
                    <div key={msg.id || i} className="bg-dark-800/50 border border-dark-700 rounded-xl p-3">
                      <p className="text-white text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-dark-500 text-[10px]">
                          {new Date(msg.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-dark-600">·</span>
                        <span className="text-fizzia-400 text-[10px] truncate">{msg.projects?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-dark-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : profiles.length === 0 ? (
                <div className="flex items-center justify-center h-full text-dark-500 text-sm">
                  No hay usuarios
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {profiles.map(profile => (
                    <ChatListItem
                      key={profile.id}
                      avatarId={profile.avatar_id}
                      name={profile.full_name || profile.first_name || 'Sin nombre'}
                      lastMessage={lastMessages[profile.id]}
                      isOnline={onlineUsers.has(profile.id)}
                      isCurrentUser={profile.id === user?.id}
                      roleIcon={roleIcon[profile.role] || 'person'}
                      onClick={() => handleSelectUser(profile)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
