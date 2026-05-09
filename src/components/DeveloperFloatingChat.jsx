import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/authContext'
import {
  getDirectChatUsers,
  getDirectMessagesWithUser,
  markDirectMessagesRead,
  sendDirectMessage,
  subscribeToDirectMessages,
} from '../api/messagesApi'
import { supabase } from '../services/supabase'
import { useToast } from '../components/Toast'
import { AvatarIcon } from '../data/avatars.jsx'
import { getDeliveryStatus, markMessageFailed, markMessageSent, mergeRealtimeMessage, mergeRealtimeMessages } from '../utils/messageStatus'
import { readStoredValue, writeStoredValue } from '../utils/persistedState'

let pendingId = Date.now()
function genId() { return `pending-floating-dev-${pendingId++}` }

export function DeveloperFloatingChat() {
  const { user } = useAuth()
  const location = useLocation()
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [adminUsers, setAdminUsers] = useState([])
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [visibleTimeMessageId, setVisibleTimeMessageId] = useState(null)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)
  const isMessagesPage = location.pathname === '/dev/mensajes'
  const chatIsOpen = isOpen && !isMessagesPage

  const scrollToEnd = useCallback((behavior = 'auto') => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' }))
    })
  }, [])

  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.id) return
      const { data: assignments, error: assignmentsError } = await supabase
        .from('project_developers')
        .select('project_id')
        .eq('developer_id', user.id)
      if (assignmentsError) {
        toast.error('No se pudieron cargar tus chats: ' + assignmentsError.message)
        return
      }
      const ids = assignments?.map(item => item.project_id) || []
      if (ids.length) {
        const { data, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', ids)
          .order('created_at', { ascending: false })
        if (projectsError) {
          toast.error('No se pudieron cargar tus proyectos: ' + projectsError.message)
        } else {
          setProjects(data || [])
        }
      }

      const users = await getDirectChatUsers()
      const admins = users.filter(profile => ['admin', 'manager'].includes(profile.role))
      setAdminUsers(admins)
      const savedAdminId = readStoredValue('dev-floating-chat-admin', '')
      const savedAdmin = admins.find(profile => profile.id === savedAdminId)
      setSelectedAdmin(prev => prev || savedAdmin || admins[0] || null)
    }
    loadProjects()
  }, [toast, user?.id])

  useEffect(() => {
    writeStoredValue('dev-floating-chat-admin', selectedAdmin?.id)
  }, [selectedAdmin?.id])

  useEffect(() => {
    if (!chatIsOpen || !selectedAdmin?.id || !user?.id) return
    let cancelled = false
    const loadMessages = () => getDirectMessagesWithUser(selectedAdmin.id).then(data => {
      if (cancelled) return
      setMessages(data || [])
      markDirectMessagesRead(selectedAdmin.id).then(readMessages => {
        if (readMessages.length) setMessages(prev => mergeRealtimeMessages(prev, readMessages))
      })
      scrollToEnd('auto')
    })
    loadMessages()
    const refreshId = setInterval(loadMessages, 5000)
    if (channelRef.current) channelRef.current.unsubscribe()
    channelRef.current = subscribeToDirectMessages(user.id, payload => {
      if (payload.sender_id !== selectedAdmin.id && payload.recipient_id !== selectedAdmin.id) return
      setMessages(prev => mergeRealtimeMessage(prev, payload))
      if (payload?.sender_id !== user?.id) {
        markDirectMessagesRead(selectedAdmin.id).then(readMessages => {
          if (readMessages.length) setMessages(prev => mergeRealtimeMessages(prev, readMessages))
        })
      }
    })
    return () => {
      cancelled = true
      clearInterval(refreshId)
      if (channelRef.current) channelRef.current.unsubscribe()
    }
  }, [chatIsOpen, scrollToEnd, selectedAdmin?.id, user?.id])

  useEffect(() => {
    if (!chatIsOpen) return
    const handleOutside = event => {
      if (panelRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [chatIsOpen])

  useEffect(() => {
    if (chatIsOpen) scrollToEnd(messages.length ? 'smooth' : 'auto')
  }, [chatIsOpen, messages, scrollToEnd])

  const handleToggle = () => {
    if (isMessagesPage) {
      toast.info('Ya estas usando el chat en esta pagina. Cierra esa herramienta o sal de Mensajes y vuelve a intentarlo.')
      return
    }
    setIsOpen(prev => !prev)
  }

  const handleSend = async event => {
    event.preventDefault()
    if (!newMessage.trim() || !selectedAdmin) return
    const content = newMessage.trim()
    const tempId = genId()
    setNewMessage('')
    setMessages(prev => [...prev, {
      id: tempId,
      sender_id: user?.id,
      recipient_id: selectedAdmin.id,
      content,
      channel: 'direct',
      is_admin_sender: false,
      created_at: new Date().toISOString(),
      _status: 'sending',
    }])
    try {
      const msg = await sendDirectMessage(selectedAdmin.id, content)
      setMessages(prev => markMessageSent(prev, tempId, msg || {}))
    } catch (error) {
      setMessages(prev => markMessageFailed(prev, tempId))
      toast.error('No se pudo enviar: ' + (error.message || 'revisa permisos de Supabase'))
    }
  }

  if (!adminUsers.length) return null

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title={isMessagesPage ? 'El chat ya esta abierto en esta pagina' : 'Hablar con admin'}
        className="cursor-pointer fixed bottom-5 right-5 z-[900] flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 text-white shadow-2xl shadow-purple-500/25 transition-all hover:bg-purple-400 active:scale-95 sm:bottom-6 sm:right-6"
      >
        <span className="material-symbols-rounded text-2xl">{chatIsOpen ? 'close' : 'forum'}</span>
      </button>

      {chatIsOpen && (
        <div ref={panelRef} className="fixed inset-x-3 bottom-24 z-[900] flex h-[min(520px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-6 sm:w-96">
          <div className="border-b border-dark-700 bg-dark-950 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{selectedAdmin?.full_name || selectedAdmin?.first_name || 'Admin'}</p>
                <p className="text-xs text-dark-500 truncate">Chat directo con admin</p>
              </div>
              {adminUsers.length > 1 && (
                <select
                  value={selectedAdmin?.id || ''}
                  onChange={event => setSelectedAdmin(adminUsers.find(profile => profile.id === event.target.value))}
                  className="cursor-pointer max-w-40 rounded-lg border border-dark-700 bg-dark-900 px-2 py-1 text-xs text-white outline-none"
                >
                  {adminUsers.map(profile => <option key={profile.id} value={profile.id}>{profile.full_name || profile.first_name || profile.email}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-xs text-dark-500">
                Escribe al admin
              </div>
            ) : messages.map(message => {
              const isMine = message.sender_id === user?.id
              const status = getDeliveryStatus(message, isMine)
              const showTime = visibleTimeMessageId === message.id
              return (
                <div key={message.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine && (
                    <div className="h-7 w-7 overflow-hidden rounded-full bg-white shrink-0">
                      <AvatarIcon id="16" size={28} />
                    </div>
                  )}
                  <div className={`flex max-w-[15rem] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setVisibleTimeMessageId(prev => prev === message.id ? null : message.id)}
                        className={`cursor-pointer rounded-2xl px-3 py-2 text-left text-sm ${
                          isMine ? 'rounded-br-md bg-purple-500 text-white' : 'rounded-bl-md bg-dark-800 text-dark-200'
                        }`}
                      >
                        <span className="whitespace-pre-wrap break-words">{message.content}</span>
                      </button>
                      {isMine && (
                        <span className="mb-1 flex h-4 w-4 items-center justify-center text-dark-500">
                          {status === 'sending' && <span className="h-3 w-3 animate-spin rounded-full border-2 border-dark-500 border-t-transparent" />}
                          {status === 'sent' && <span className="material-symbols-rounded text-[13px]">check</span>}
                          {status === 'read' && <span className="material-symbols-rounded text-[13px] text-sky-400">done_all</span>}
                          {status === 'error' && <span className="material-symbols-rounded text-[13px] text-red-400">error</span>}
                        </span>
                      )}
                    </div>
                    {showTime && (
                      <span className="mt-1 text-[10px] text-dark-500">
                        {new Date(message.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {isMine && (
                    <div className="h-7 w-7 overflow-hidden rounded-full bg-white shrink-0">
                      <AvatarIcon id={user?.avatar_id} name={user?.full_name || user?.first_name} size={28} />
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-dark-800 p-2">
            <input
              value={newMessage}
              onChange={event => setNewMessage(event.target.value)}
              className="flex-1 rounded-xl border border-dark-700 bg-dark-950 px-3 py-2 text-sm text-white outline-none placeholder:text-dark-500 focus:border-purple-500"
              placeholder="Mensaje al admin..."
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="cursor-pointer rounded-xl bg-purple-500 px-3 py-2 text-white transition-colors hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-rounded text-lg">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
