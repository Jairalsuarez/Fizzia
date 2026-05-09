import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../features/auth/authContext'
import {
  getDirectChatUsers,
  getDirectMessagesWithUser,
  getInternalProjectMessages,
  markDirectMessagesRead,
  markInternalProjectMessagesRead,
  sendDirectMessage,
  sendInternalProjectMessage,
  subscribeToDirectMessages,
  subscribeToInternalProjectMessages,
} from '../../api/messagesApi'
import { supabase } from '../../services/supabase'
import { AvatarIcon } from '../../data/avatars.jsx'
import { formatDate } from '../../utils/format'
import { getMessageAuthor, getMessageAuthorName, getMessageAvatarId } from '../../utils/messageIdentity'
import { getDeliveryStatus, markMessageFailed, markMessageSent, mergeRealtimeMessage, mergeRealtimeMessages } from '../../utils/messageStatus'
import { readStoredValue, writeStoredValue } from '../../utils/persistedState'
import { mergeRealtimeProject, useRealtimeProjects } from '../../hooks/useRealtimeProjects'

let pendingId = Date.now()
function genId() { return `pending-dev-${pendingId++}` }

export function MessagesPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [teamUsers, setTeamUsers] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedTeamUser, setSelectedTeamUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageAuthors, setMessageAuthors] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [visibleTimeMessageId, setVisibleTimeMessageId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [conversationMode, setConversationMode] = useState(() => readStoredValue('dev-messages-mode', 'projects', value => ['projects', 'team'].includes(value)))
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  const handleRealtimeProject = useCallback((payload) => {
    if (payload.eventType === 'DELETE') {
      setProjects(prev => prev.filter(project => project.id !== payload.old.id))
      setSelectedProject(prev => prev?.id === payload.old.id ? null : prev)
      return
    }
    setProjects(prev => prev.some(project => project.id === payload.new.id) ? mergeRealtimeProject(prev, payload.new) : prev)
    setSelectedProject(prev => prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev)
  }, [])

  useRealtimeProjects(handleRealtimeProject)

  const scrollToEnd = (behavior = 'auto') => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' }))
    })
  }

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return

      const { data: assignments } = await supabase
        .from('project_developers')
        .select('project_id')
        .eq('developer_id', user.id)

      const ids = (assignments || []).map(a => a.project_id)
      let projs = []
      if (ids.length) {
        const { data } = await supabase
          .from('projects')
          .select('id, name, status, clients(name)')
          .in('id', ids)
          .order('created_at', { ascending: false })
        projs = data || []
      }

      const rows = projs
      const directUsers = await getDirectChatUsers()
      setProjects(rows)
      setTeamUsers(directUsers)
      const savedProjectId = readStoredValue('dev-messages-project', '')
      const savedProject = rows.find(project => project.id === savedProjectId)
      setSelectedProject(prev => prev || savedProject || rows[0] || null)
      const savedTeamUserId = readStoredValue('dev-messages-team-user', '')
      const savedTeamUser = directUsers.find(profile => profile.id === savedTeamUserId)
      setSelectedTeamUser(prev => prev || savedTeamUser || directUsers[0] || null)
      setLoading(false)
    }
    load()
  }, [user?.id])

  useEffect(() => {
    writeStoredValue('dev-messages-project', selectedProject?.id)
  }, [selectedProject?.id])

  useEffect(() => {
    writeStoredValue('dev-messages-team-user', selectedTeamUser?.id)
  }, [selectedTeamUser?.id])

  useEffect(() => {
    writeStoredValue('dev-messages-mode', conversationMode)
  }, [conversationMode])

  useEffect(() => {
    if (conversationMode !== 'projects' || !selectedProject?.id) return
    let cancelled = false

    const loadMessages = async () => {
      const msgs = await getInternalProjectMessages(selectedProject.id)
      if (cancelled) return
      setMessages(msgs)
      markInternalProjectMessagesRead(selectedProject.id).then(readMessages => {
        if (readMessages.length) setMessages(prev => mergeRealtimeMessages(prev, readMessages))
      })
      scrollToEnd('auto')
    }

    loadMessages()
    const refreshId = setInterval(loadMessages, 5000)
    if (channelRef.current) channelRef.current.unsubscribe()
    channelRef.current = subscribeToInternalProjectMessages(selectedProject.id, (payload) => {
      setMessages(prev => mergeRealtimeMessage(prev, payload))
      if (payload?.sender_id !== user?.id) {
        markInternalProjectMessagesRead(selectedProject.id).then(readMessages => {
          if (readMessages.length) setMessages(prev => mergeRealtimeMessages(prev, readMessages))
        })
      }
    })

    return () => {
      cancelled = true
      clearInterval(refreshId)
      if (channelRef.current) channelRef.current.unsubscribe()
    }
  }, [conversationMode, selectedProject?.id, user?.id])

  useEffect(() => {
    if (conversationMode !== 'team' || !selectedTeamUser?.id || !user?.id) return
    let cancelled = false

    const loadMessages = async () => {
      const msgs = await getDirectMessagesWithUser(selectedTeamUser.id)
      if (cancelled) return
      setMessages(msgs)
      markDirectMessagesRead(selectedTeamUser.id).then(readMessages => {
        if (readMessages.length) setMessages(prev => mergeRealtimeMessages(prev, readMessages))
      })
      scrollToEnd('auto')
    }

    loadMessages()
    const refreshId = setInterval(loadMessages, 5000)
    if (channelRef.current) channelRef.current.unsubscribe()
    channelRef.current = subscribeToDirectMessages(user.id, (payload) => {
      const isCurrentConversation = payload.sender_id === selectedTeamUser.id || payload.recipient_id === selectedTeamUser.id
      if (!isCurrentConversation) return
      setMessages(prev => mergeRealtimeMessage(prev, payload))
      if (payload?.sender_id !== user.id) {
        markDirectMessagesRead(selectedTeamUser.id).then(readMessages => {
          if (readMessages.length) setMessages(prev => mergeRealtimeMessages(prev, readMessages))
        })
      }
    })

    return () => {
      cancelled = true
      clearInterval(refreshId)
      if (channelRef.current) channelRef.current.unsubscribe()
    }
  }, [conversationMode, selectedTeamUser?.id, user?.id])

  useEffect(() => {
    scrollToEnd(messages.length ? 'smooth' : 'auto')
  }, [messages])

  useEffect(() => {
    const ids = [...new Set(messages.map(message => message.sender_id).filter(Boolean))]
      .filter(id => !messageAuthors[id])
    if (!ids.length) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('id, full_name, first_name, email, avatar_id, role')
      .in('id', ids)
      .then(({ data }) => {
        if (cancelled) return
        setMessageAuthors(prev => ({
          ...prev,
          ...Object.fromEntries((data || []).map(profile => [profile.id, profile])),
        }))
      })
    return () => { cancelled = true }
  }, [messages, messageAuthors])

  const handleSend = async (event) => {
    event.preventDefault()
    if (!newMessage.trim()) return
    if (conversationMode === 'projects' && !selectedProject) return
    if (conversationMode === 'team' && !selectedTeamUser) return
    const content = newMessage.trim()
    const tempId = genId()
    setNewMessage('')
    setMessages(prev => [...prev, {
      id: tempId,
      project_id: conversationMode === 'projects' ? selectedProject.id : null,
      sender_id: user?.id,
      recipient_id: conversationMode === 'team' ? selectedTeamUser.id : null,
      content,
      channel: conversationMode === 'projects' ? 'internal' : 'direct',
      is_admin_sender: false,
      created_at: new Date().toISOString(),
      _status: 'sending',
    }])

    try {
      const msg = conversationMode === 'projects'
        ? await sendInternalProjectMessage(selectedProject.id, content)
        : await sendDirectMessage(selectedTeamUser.id, content)
      setMessages(prev => markMessageSent(prev, tempId, msg || {}))
    } catch (error) {
      setMessages(prev => markMessageFailed(prev, tempId))
      console.error('Error sending developer message:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-[34rem] rounded-xl bg-dark-800 animate-pulse" />
      </div>
    )
  }

  const hasConversations = projects.length > 0 || teamUsers.length > 0
  const activeTitle = conversationMode === 'projects'
    ? selectedProject?.name
    : selectedTeamUser?.full_name || selectedTeamUser?.first_name || selectedTeamUser?.email || 'Developer'
  const activeSubtitle = conversationMode === 'projects'
    ? 'Chat interno con el equipo admin'
    : 'Chat directo con developer'
  const emptyMessage = conversationMode === 'projects'
    ? 'Todavia no hay mensajes internos'
    : 'Todavia no hay mensajes con este developer'

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Mensajes internos</h1>
        <p className="text-dark-400 text-sm mt-1">Habla con el admin por proyecto o conversa directo con otros developers</p>
      </div>

      {!hasConversations ? (
        <div className="text-center py-16 bg-dark-900/50 border border-dark-800 rounded-xl">
          <span className="material-symbols-rounded text-dark-600 text-5xl mb-3 block">chat</span>
          <p className="text-dark-400 text-sm">No tienes conversaciones disponibles</p>
        </div>
      ) : (
        <div className="grid h-[calc(100dvh-11rem)] min-h-[32rem] max-h-[44rem] grid-cols-1 overflow-hidden rounded-xl border border-dark-800 bg-dark-950/40 lg:grid-cols-[20rem_1fr]">
          <aside className="border-b border-dark-800 bg-dark-900/70 lg:border-b-0 lg:border-r">
            <div className="border-b border-dark-800 p-4">
              <p className="text-sm font-semibold text-white">Conversaciones</p>
              <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-dark-950 p-1">
                <button
                  onClick={() => { setConversationMode('projects'); setMessages([]) }}
                  className={`cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-all ${conversationMode === 'projects' ? 'bg-[var(--accent)] text-white' : 'text-dark-400 hover:text-white'}`}
                >
                  Admin ({projects.length})
                </button>
                <button
                  onClick={() => { setConversationMode('team'); setMessages([]) }}
                  className={`cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-all ${conversationMode === 'team' ? 'bg-[var(--accent)] text-white' : 'text-dark-400 hover:text-white'}`}
                >
                  Devs ({teamUsers.length})
                </button>
              </div>
            </div>
            <div className="max-h-[34rem] overflow-y-auto">
              {conversationMode === 'projects' && projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => { setSelectedProject(project); setMessages([]) }}
                  className={`cursor-pointer w-full border-b border-dark-800 p-4 text-left transition-colors ${
                    selectedProject?.id === project.id ? 'bg-fizzia-500/10' : 'hover:bg-dark-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                    <span className="material-symbols-rounded text-base text-fizzia-400">admin_panel_settings</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-dark-500">Linea directa con admin</p>
                </button>
              ))}
              {conversationMode === 'team' && teamUsers.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => { setSelectedTeamUser(profile); setMessages([]) }}
                  className={`cursor-pointer w-full border-b border-dark-800 p-4 text-left transition-colors ${
                    selectedTeamUser?.id === profile.id ? 'bg-fizzia-500/10' : 'hover:bg-dark-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-white shrink-0">
                      <AvatarIcon id={profile.avatar_id || '1'} name={profile.full_name || profile.first_name} size={36} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{profile.full_name || profile.first_name || 'Developer'}</p>
                      <p className="mt-0.5 truncate text-xs text-dark-500">{profile.email || profile.role}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="border-b border-dark-800 bg-dark-900/60 p-4">
              <p className="text-sm font-semibold text-white">{activeTitle}</p>
              <p className="text-xs text-dark-500">{activeSubtitle}</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-dark-500">
                  {emptyMessage}
                </div>
              ) : (
                messages.map(message => {
                  const isMine = message.sender_id === user?.id
                  const status = getDeliveryStatus(message, isMine)
                  const author = getMessageAuthor(message, messageAuthors)
                  const authorName = getMessageAuthorName({ message, isMine, author, clientName: 'Admin' })
                  const avatarId = getMessageAvatarId({ message, isMine, author, currentUser: user })
                  const showTime = visibleTimeMessageId === message.id
                  return (
                    <div key={message.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="h-8 w-8 rounded-full bg-white overflow-hidden shrink-0">
                          <AvatarIcon id={avatarId || '16'} size={32} />
                        </div>
                      )}
                      <div className={`flex max-w-[70%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <span className={`mb-1 text-[11px] font-medium ${isMine ? 'text-fizzia-400' : 'text-dark-400'}`}>
                          {authorName}
                        </span>
                        <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <button
                            type="button"
                            onClick={() => setVisibleTimeMessageId(prev => prev === message.id ? null : message.id)}
                            className={`cursor-pointer rounded-2xl px-4 py-3 text-left text-sm ${
                              isMine ? 'bg-[var(--accent)] text-white rounded-br-sm' : 'bg-dark-800 text-dark-100 rounded-bl-sm'
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
                          <span className="mt-1 text-[10px] text-dark-500">{formatDate(message.created_at)}</span>
                        )}
                      </div>
                      {isMine && (
                        <div className="h-8 w-8 rounded-full bg-white overflow-hidden shrink-0">
                          <AvatarIcon id={avatarId || '1'} size={32} />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 border-t border-dark-800 p-3">
              <input
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                className="flex-1 rounded-xl border border-dark-700 bg-dark-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-dark-500 focus:border-[var(--accent)]"
                placeholder={conversationMode === 'projects' ? 'Escribir al admin...' : 'Escribir al developer...'}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="cursor-pointer rounded-xl bg-[var(--accent)] px-4 py-2.5 text-white transition-colors hover:bg-[var(--accent-lighter)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-rounded text-lg">send</span>
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
