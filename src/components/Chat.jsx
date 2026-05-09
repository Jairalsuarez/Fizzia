import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../features/auth/authContext'
import { supabase } from '../services/supabase'
import { ChatListItem } from './ChatListItem'
import { AvatarIcon } from '../data/avatars.jsx'
import { useToast } from './Toast'
import {
  getUserConversations,
  getMessagesWithUser,
  sendMessageToUser,
  markUserMessagesRead,
  subscribeToAllMessages,
  getAllMyMessages,
  sendMessageToTeam,
  markAllMyMessagesRead,
} from '../api/messagesApi'
import { getDeliveryStatus, markMessageFailed, markMessageSent, mergeRealtimeMessage } from '../utils/messageStatus'
import { getMessageAuthor, getMessageAvatarId } from '../utils/messageIdentity'
import { getLastSeenAt, isMissingLastSeenColumn, isProfileOnline } from '../utils/presence'

let pendingId = Date.now()
function genId() { return `pending-chat-${pendingId++}` }

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

const ROLE_ICONS = {
  admin: 'admin_panel_settings',
  manager: 'manage_accounts',
  developer: 'code',
  client: 'person',
}

async function fetchProfilePresence(userId) {
  let result = await supabase.from('profiles').select('updated_at, last_seen_at').eq('id', userId).single()
  if (isMissingLastSeenColumn(result.error)) {
    result = await supabase.from('profiles').select('updated_at').eq('id', userId).single()
  }
  return result.data || null
}

export function Chat({ onUnreadChange }) {
  const { user } = useAuth()
  const userId = user?.id
  const isStaff = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'developer'
  const toast = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [conversationsLoaded, setConversationsLoaded] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageAuthors, setMessageAuthors] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [clientUnreadBase, setClientUnreadBase] = useState(0)
  const [visibleTimeMessageId, setVisibleTimeMessageId] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [chatSettings, setChatSettings] = useState(() => {
    const saved = localStorage.getItem('fizzia-chat-settings')
    return saved ? JSON.parse(saved) : { sound: true, enterToSend: true }
  })

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  // Derived unread total
  const effectiveUnread = isStaff
    ? conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)
    : clientUnreadBase

  const messagesEndRef = useRef(null)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const allMessagesRef = useRef(null)
  const settingsRef = useRef(null)

  const scrollMessagesToEnd = useCallback((behavior = 'auto') => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' }))
    })
  }, [])

  // Notify parent of unread changes (derived, not from effect body)
  const prevUnread = useRef(effectiveUnread)
  useEffect(() => {
    if (prevUnread.current !== effectiveUnread) {
      prevUnread.current = effectiveUnread
      if (onUnreadChange) onUnreadChange(effectiveUnread)
    }
  }, [effectiveUnread, onUnreadChange])

  // Initial load
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (isStaff) {
        const convs = await getUserConversations()
        if (cancelled) return
        setConversations(convs || [])
        setConversationsLoaded(true)
      } else {
        const msgs = await getAllMyMessages()
        if (cancelled) return
        setMessages(msgs || [])
        const unread = (msgs || []).filter(m => m.sender_id !== userId && !m.read_at).length
        setClientUnreadBase(unread)
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [userId, isStaff])

  // Load messages when opening
  useEffect(() => {
    if (!isOpen || !userId) return
    let cancelled = false
    const load = async () => {
      if (isStaff) {
        const convs = await getUserConversations()
        if (cancelled) return
        setConversations(convs || [])
        setConversationsLoaded(true)
      } else {
        const msgs = await getAllMyMessages()
        if (cancelled) return
        setMessages(msgs || [])
        scrollMessagesToEnd('auto')
        markAllMyMessagesRead().then(read => {
          if (cancelled || !read?.length) return
          setClientUnreadBase(0)
        })
      }
    }
    load()
    return () => { cancelled = true }
  }, [isOpen, userId, isStaff, scrollMessagesToEnd, onUnreadChange])

  // Load messages when selecting a user (staff)
  useEffect(() => {
    if (!isStaff || !selectedUser?.id || !isOpen) return
    let cancelled = false
    getMessagesWithUser(selectedUser.id).then(msgs => {
      if (cancelled) return
      setMessages(msgs || [])
      scrollMessagesToEnd('auto')
    })
    markUserMessagesRead(selectedUser.id).then(() => {
      if (cancelled) return
      setConversations(prev => prev.map(c =>
        c.id === selectedUser.id ? { ...c, unreadCount: 0 } : c
      ))
    })
    return () => { cancelled = true }
  }, [isStaff, selectedUser?.id, isOpen, scrollMessagesToEnd])

  // Real-time subscription
  useEffect(() => {
    if (!isOpen || !userId) return
    if (allMessagesRef.current) allMessagesRef.current.unsubscribe()
    allMessagesRef.current = subscribeToAllMessages(payload => {
      if (!payload) return
      setConversations(prev => {
        if (payload.sender_id === userId) return prev
        const exists = prev.find(c => c.id === payload.sender_id)
        if (exists) {
          return prev.map(c =>
            c.id === payload.sender_id
              ? { ...c, lastMessage: payload.content, lastMessageAt: payload.created_at, unreadCount: c.unreadCount + (selectedUser?.id === payload.sender_id ? 0 : 1) }
              : c
          ).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
        }
        return prev
      })
      if (!isStaff) {
        setMessages(prev => mergeRealtimeMessage(prev, payload))
        if (payload.sender_id !== userId) markAllMyMessagesRead().catch(() => {})
      } else if (selectedUser?.id && (payload.sender_id === selectedUser.id || payload.sender_id === userId)) {
        setMessages(prev => mergeRealtimeMessage(prev, payload))
        if (payload.sender_id !== userId) {
          markUserMessagesRead(selectedUser.id).catch(() => {})
        }
      }
    })
    return () => { allMessagesRef.current?.unsubscribe() }
  }, [isOpen, userId, isStaff, selectedUser?.id])

  // Online detection: polls the selected user's last activity every 10s.
  useEffect(() => {
    if (!isStaff || !isOpen || !selectedUser?.id) return
    let cancelled = false
    const check = async () => {
      const data = await fetchProfilePresence(selectedUser.id)
      if (!cancelled && getLastSeenAt(data)) {
        setOnlineUsers(prev => {
          const next = new Set(prev)
          if (isProfileOnline(data)) next.add(selectedUser.id)
          else next.delete(selectedUser.id)
          return next
        })
        setSelectedUser(prev => prev?.id === selectedUser.id ? { ...prev, ...data } : prev)
      }
    }
    check()
    const id = setInterval(check, 10000)
    return () => { cancelled = true; clearInterval(id) }
  }, [isStaff, isOpen, selectedUser?.id])

  // Open chat with specific user via custom event
  useEffect(() => {
    const handler = async (event) => {
      const targetUserId = event.detail?.userId
      setIsOpen(true)
      if (isStaff && targetUserId) {
        let profile = conversations.find(c => c.id === targetUserId)
        if (profile && !getLastSeenAt(profile)) {
          const data = await fetchProfilePresence(profile.id)
          if (data) profile = { ...profile, ...data }
        }
        if (!profile) {
          const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).single()
          if (data) profile = { ...data, lastMessage: '', lastMessageAt: null, unreadCount: 0 }
        }
        if (profile) setSelectedUser(profile)
      }
    }
    window.addEventListener('fizzia-chat-open-user', handler)
    return () => window.removeEventListener('fizzia-chat-open-user', handler)
  }, [isStaff, conversations])

  useEffect(() => {
    const handler = (event) => {
      setIsOpen(true)
      if (event.detail?.message) setNewMessage(event.detail.message)
    }
    window.addEventListener('fizzia-open-chat', handler)
    return () => window.removeEventListener('fizzia-open-chat', handler)
  }, [])

  // Fetch message authors
  useEffect(() => {
    const ids = [...new Set(messages.map(m => m.sender_id).filter(Boolean))]
      .filter(id => id !== userId && !messageAuthors[id])
    if (!ids.length) return
    let cancelled = false
    supabase.from('profiles').select('id, full_name, first_name, email, avatar_id, role').in('id', ids).then(({ data }) => {
      if (cancelled || !data) return
      setMessageAuthors(prev => ({ ...prev, ...Object.fromEntries(data.map(p => [p.id, p])) }))
    })
    return () => { cancelled = true }
  }, [messages, messageAuthors, userId])

  // Scroll on messages change
  useEffect(() => {
    if (isOpen) scrollMessagesToEnd(messages.length ? 'smooth' : 'auto')
  }, [messages, isOpen, scrollMessagesToEnd])

  // Outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = e => {
      if (settingsRef.current?.contains(e.target)) return
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const toggleOpen = () => setIsOpen(prev => !prev)

  const handleSelectUser = async (profile) => {
    if (profile && !getLastSeenAt(profile)) {
      const data = await fetchProfilePresence(profile.id)
      if (data) profile = { ...profile, ...data }
    }
    setSelectedUser(profile)
    setMessages([])
  }

  const handleBack = () => {
    setSelectedUser(null)
    setMessages([])
    getUserConversations().then(convs => setConversations(convs || []))
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const content = newMessage.trim()
    setNewMessage('')
    const tempId = genId()
    const tempMsg = { id: tempId, sender_id: userId, content, created_at: new Date().toISOString(), _status: 'sending' }
    setMessages(prev => [...prev, tempMsg])
    try {
      const result = isStaff && selectedUser?.id
        ? await sendMessageToUser(selectedUser.id, content)
        : await sendMessageToTeam(content)
      setMessages(prev => markMessageSent(prev, tempId, result || {}))
    } catch {
      setMessages(prev => markMessageFailed(prev, tempId))
      toast.error('Error al enviar el mensaje')
    }
  }

  useEffect(() => {
    localStorage.setItem('fizzia-chat-settings', JSON.stringify(chatSettings))
  }, [chatSettings])

  const isOnlineUser = isStaff && selectedUser
    ? onlineUsers.has(selectedUser.id) || isProfileOnline(selectedUser)
    : false

  const title = isStaff
    ? (selectedUser ? (selectedUser.full_name || selectedUser.first_name || 'Usuario') : 'Conversaciones')
    : 'Soporte'

  const subtitle = isStaff
    ? (selectedUser ? 'Chatea con este usuario' : `${onlineUsers.size} en línea`)
    : 'Chatea con el equipo de Fizzia'

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        data-tour="client-chat"
        title={isStaff ? 'Conversaciones' : effectiveUnread > 0 ? `${effectiveUnread} mensajes nuevos` : 'Chatear con Fizzia'}
        className="cursor-pointer fixed bottom-5 right-5 z-[900] flex h-14 w-14 items-center justify-center rounded-full bg-fizzia-500 shadow-2xl shadow-fizzia-500/25 transition-all hover:bg-fizzia-400 active:scale-95 sm:bottom-6 sm:right-6 group"
      >
        <span className="material-symbols-rounded text-white text-2xl">
          {isOpen ? 'close' : isStaff ? 'group' : 'chat'}
        </span>
        {!isOpen && effectiveUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
            {effectiveUnread > 9 ? '9+' : effectiveUnread}
          </span>
        )}
        {!isOpen && (
          <span className="pointer-events-none absolute bottom-full right-0 mb-3 hidden w-56 rounded-xl border border-dark-700 bg-dark-950 px-3 py-2 text-left text-xs font-medium text-dark-200 shadow-xl group-hover:block">
            {isStaff ? 'Ver conversaciones' : effectiveUnread > 0 ? `${effectiveUnread} mensajes nuevos` : 'Chatear con el equipo'}
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={panelRef} className="fixed inset-x-3 bottom-24 z-[900] flex h-[min(520px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-6 sm:w-96">
          <div className="bg-dark-950 border-b border-dark-700 p-3 flex items-center gap-3">
            {isStaff && selectedUser ? (
              <>
                <button onClick={handleBack} className="cursor-pointer text-dark-400 hover:text-white shrink-0">
                  <span className="material-symbols-rounded text-lg">arrow_back</span>
                </button>
                <AvatarIcon id={selectedUser.avatar_id} name={selectedUser.full_name || selectedUser.first_name} size={32} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white text-sm font-semibold truncate">{selectedUser.full_name || selectedUser.first_name || 'Usuario'}</p>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isOnlineUser ? 'bg-green-500' : 'bg-dark-500'}`} />
                  </div>
                  <p className="text-xs" style={{ color: isOnlineUser ? '#86efac' : '#6b7280' }}>
                    {isOnlineUser ? 'En línea' : `Última conexión fue ${formatLastSeen(getLastSeenAt(selectedUser))}`}
                  </p>
                </div>
                <button onClick={() => setShowSearch(prev => !prev)} className="cursor-pointer text-dark-400 hover:text-white shrink-0" title="Buscar">
                  <span className="material-symbols-rounded text-lg">{showSearch ? 'close' : 'search'}</span>
                </button>
                <button onClick={() => setShowSettings(true)} className="cursor-pointer text-dark-400 hover:text-white shrink-0" title="Configuración">
                  <span className="material-symbols-rounded text-lg">settings</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{title}</p>
                  <p className="text-dark-500 text-xs">{subtitle}</p>
                </div>
                {(!selectedUser || !isStaff) && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                )}
              </>
            )}
          </div>

          {showSearch && (
            <div className="p-2 border-b border-dark-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-fizzia-500 placeholder-dark-500"
                  placeholder="Buscar en el chat..."
                  autoFocus
                />
                {searchQuery.trim() && (
                  <span className="text-xs text-dark-500 shrink-0">{filteredMessages.length} resultados</span>
                )}
              </div>
            </div>
          )}

          {isStaff && !selectedUser ? (
            <div className="flex-1 overflow-y-auto">
              {!conversationsLoaded ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 bg-dark-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex items-center justify-center h-full text-dark-500 text-sm">Sin conversaciones</div>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map(conv => (
                    <ChatListItem
                      key={conv.id}
                      avatarId={conv.avatar_id || '1'}
                      name={conv.full_name || conv.first_name || 'Usuario'}
                      lastMessage={conv.lastMessage}
                      isOnline={onlineUsers.has(conv.id) || isProfileOnline(conv)}
                      roleIcon={ROLE_ICONS[conv.role] || 'person'}
                      onClick={() => handleSelectUser(conv)}
                      rightContent={conv.unreadCount > 0 ? (
                        <span className="bg-fizzia-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      ) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {filteredMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-dark-500 text-sm">
                    {searchQuery.trim() ? 'Sin resultados' : (isStaff && !selectedUser ? 'Selecciona un usuario' : 'Inicia la conversación')}
                  </div>
                ) : (
                  filteredMessages.map(msg => {
                    const isMine = msg.sender_id === userId
                    const status = getDeliveryStatus(msg, isMine)
                    const showTime = visibleTimeMessageId === msg.id
                    const author = getMessageAuthor(msg, messageAuthors)
                    const avatarId = getMessageAvatarId({ message: msg, isMine, author, currentUser: user })
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <div className="h-7 w-7 rounded-full bg-white overflow-hidden shrink-0">
                            <AvatarIcon id={avatarId || '2'} size={28} />
                          </div>
                        )}
                        <div className={`flex max-w-[16rem] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                            <button
                              type="button"
                              onClick={() => setVisibleTimeMessageId(prev => prev === msg.id ? null : msg.id)}
                              className={`cursor-pointer px-3 py-2 rounded-2xl text-sm text-left ${
                                isMine
                                  ? status === 'error' ? 'bg-red-500/80 text-white rounded-br-md'
                                  : 'bg-fizzia-500 text-white rounded-br-md'
                                  : 'bg-dark-800 text-dark-200 rounded-bl-md'
                              }`}
                            >
                              <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                            </button>
                            {isMine && (
                              <span className={`mb-1 flex h-4 w-4 items-center justify-center ${status === 'error' ? 'text-red-400' : 'text-dark-500'}`}>
                                {status === 'sending' && (
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                )}
                                {status === 'sent' && <span className="material-symbols-rounded text-[13px]">check</span>}
                                {status === 'read' && <span className="material-symbols-rounded text-[13px] text-sky-400">done_all</span>}
                                {status === 'error' && <span className="material-symbols-rounded text-[13px]">error</span>}
                              </span>
                            )}
                          </div>
                          {showTime && (
                            <div className={`mt-1 text-[10px] ${isMine ? 'mr-6 text-fizzia-200/70' : 'ml-2 text-dark-500'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                        {isMine && (
                          <div className="h-7 w-7 rounded-full bg-white overflow-hidden shrink-0">
                            <AvatarIcon id={avatarId || '1'} size={28} />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-2 border-t border-dark-800 flex gap-2">
                {chatSettings.enterToSend ? (
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e) }
                    }}
                    className="flex-1 px-3 py-2 bg-dark-950 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-fizzia-500 text-sm"
                    placeholder="Escribe un mensaje..."
                  />
                ) : (
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSendMessage(e) }
                    }}
                    className="flex-1 px-3 py-2 bg-dark-950 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-fizzia-500 text-sm resize-none"
                    placeholder="Ctrl+Enter para enviar"
                    rows={1}
                  />
                )}
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="cursor-pointer px-3 py-2 bg-fizzia-500 text-white rounded-xl hover:bg-fizzia-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-rounded text-lg">send</span>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div ref={settingsRef} className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="fixed inset-0 bg-black/60" />
          <div className="relative w-full max-w-xs rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-4">Configuración del chat</h3>
            <div className="space-y-5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-dark-300">Sonido de notificaciones</span>
                <button
                  onClick={() => setChatSettings(prev => ({ ...prev, sound: !prev.sound }))}
                  className={`cursor-pointer relative w-10 h-5 rounded-full transition-colors ${chatSettings.sound ? 'bg-fizzia-500' : 'bg-dark-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${chatSettings.sound ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-dark-300">Enter para enviar</span>
                <button
                  onClick={() => setChatSettings(prev => ({ ...prev, enterToSend: !prev.enterToSend }))}
                  className={`cursor-pointer relative w-10 h-5 rounded-full transition-colors ${chatSettings.enterToSend ? 'bg-fizzia-500' : 'bg-dark-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${chatSettings.enterToSend ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>
              <div className="border-t border-dark-700 pt-4 space-y-3">
                <p className="text-xs text-dark-500 font-medium uppercase tracking-wider">Acciones</p>
                <button
                  onClick={() => { setShowSettings(false); setShowSearch(true) }}
                  className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 bg-dark-800 rounded-lg text-sm text-dark-300 hover:text-white hover:bg-dark-700 transition-all"
                >
                  <span className="material-symbols-rounded text-lg">search</span>
                  Buscar en el chat
                </button>
                <button
                  onClick={() => {
                    if (messages.length === 0) return
                    const confirmed = window.confirm('¿Vaciar la conversación? Los mensajes se eliminarán solo de tu vista.')
                    if (!confirmed) return
                    setMessages([])
                    setShowSettings(false)
                    toast.success('Conversación vaciada')
                  }}
                  className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <span className="material-symbols-rounded text-lg">delete_sweep</span>
                  Vaciar conversación
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="cursor-pointer mt-4 w-full py-2 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
