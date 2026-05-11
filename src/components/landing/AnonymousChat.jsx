import { useState, useEffect, useRef } from 'react'
import { Icon } from '../ui/Icon'
import {
  getMyConversation,
  createConversation,
  sendMessageLocally,
  sendMessageToSupabase,
  getLocalMessages,
  fetchMessagesFromSupabase,
  mergeMessages,
  saveMergedMessages,
  replaceLocalMessage,
} from '../../services/anonymousChat'

const RATE_LIMIT_WINDOW = 60000
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_BLOCK = 1800000
const POLL_INTERVAL = 5000

function ChatToggle({ isOpen, onClick, unread }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer fixed bottom-5 right-5 z-[900] flex h-14 w-14 items-center justify-center rounded-full bg-fizzia-500 shadow-2xl shadow-fizzia-500/25 transition-all hover:bg-fizzia-400 active:scale-95 sm:bottom-6 sm:right-6 group"
    >
      <Icon name={isOpen ? 'close' : 'forum'} size={24} className="text-white" />
      {unread > 0 && !isOpen && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}

function StartForm({ onCreated }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleStart = async () => {
    setSubmitting(true)
    try {
      const conv = await createConversation({ name: name.trim() || undefined })
      onCreated(conv)
    } catch (error) {
      console.warn('No se pudo iniciar el chat anonimo:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-dark-300 text-sm">¿Cómo te llamas? (opcional)</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-fizzia-500 transition-colors"
        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
      />
      <button
        onClick={handleStart}
        disabled={submitting}
        className="w-full py-2.5 bg-fizzia-500 text-white font-semibold rounded-xl hover:bg-fizzia-400 disabled:bg-dark-700 disabled:text-dark-400 transition-all cursor-pointer disabled:cursor-not-allowed text-sm"
      >
        {submitting ? '...' : 'Iniciar chat'}
      </button>
    </div>
  )
}

export function AnonymousChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [blockedUntil, setBlockedUntil] = useState(null)
  const [msgTimestamps, setMsgTimestamps] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const listRef = useRef(null)
  const panelRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    const handler = () => { setIsOpen(true); setUnread(0) }
    window.addEventListener('open-anon-chat', handler)
    window.addEventListener('open-chatbot', handler)
    return () => {
      window.removeEventListener('open-anon-chat', handler)
      window.removeEventListener('open-chatbot', handler)
    }
  }, [])

  useEffect(() => {
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          !e.target.closest('.fixed.bottom-5.right-5')) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    const loadConversation = async () => {
      setLoading(true)
      try {
        const conv = await getMyConversation()
        if (cancelled) return
        if (conv) {
          setConversation(conv)
          const local = getLocalMessages(conv.id)
          setMessages(local)
          try {
            const remote = await fetchMessagesFromSupabase(conv.id)
            if (cancelled) return
            const merged = mergeMessages(local, remote)
            setMessages(merged)
            saveMergedMessages(conv.id, merged)
          } catch (error) {
            console.warn('No se pudieron cargar mensajes remotos:', error)
          }
        }
      } catch (error) {
        console.warn('No se pudo cargar la conversacion anonima:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadConversation()
    return () => { cancelled = true }
  }, [isOpen])

  useEffect(() => {
    if (!conversation || !isOpen) return
    pollRef.current = setInterval(async () => {
      try {
        const remote = await fetchMessagesFromSupabase(conversation.id)
        const local = getLocalMessages(conversation.id)
        const merged = mergeMessages(local, remote)
        setMessages(merged)
        saveMergedMessages(conversation.id, merged)
      } catch (error) {
        console.warn('No se pudieron sincronizar mensajes anonimos:', error)
      }
    }, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [conversation, isOpen])

  useEffect(() => {
    if (!conversation || isOpen) return
    const stored = getLocalMessages(conversation.id)
    const adminMsgs = stored.filter((m) => !m.is_from_visitor)
    queueMicrotask(() => setUnread(adminMsgs.length))
  }, [conversation, isOpen, messages])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!blockedUntil) return
    const timer = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [blockedUntil])

  const isBlocked = blockedUntil && nowTick < blockedUntil

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !conversation || isBlocked) return

    const now = Date.now()
    const recent = msgTimestamps.filter((t) => now - t < RATE_LIMIT_WINDOW)
    if (recent.length >= RATE_LIMIT_MAX) {
      setBlockedUntil(now + RATE_LIMIT_BLOCK)
      setTimeout(() => setBlockedUntil(null), RATE_LIMIT_BLOCK)
      return
    }

    setSending(true)
    setMsgTimestamps((prev) => [...prev, now])
    const localMsg = sendMessageLocally(conversation.id, text)
    const localId = localMsg.id
    setMessages((prev) => [...prev, localMsg])
    setInput('')

    try {
      const serverMsg = await sendMessageToSupabase(conversation.id, text)
      replaceLocalMessage(conversation.id, localId, serverMsg)
      setMessages((prev) => prev.map((m) => m.id === localId ? { ...m, id: serverMsg.id, synced: true } : m))
    } catch (error) {
      console.warn('No se pudo enviar el mensaje anonimo:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const blockRemaining = isBlocked ? Math.ceil((blockedUntil - nowTick) / 60000) : 0

  return (
    <>
      <ChatToggle isOpen={isOpen} onClick={() => { setIsOpen(!isOpen); if (!isOpen) setUnread(0) }} unread={unread} />

      {isOpen && (
        <div
          ref={panelRef}
          className="fixed inset-x-3 bottom-24 z-[900] flex h-[min(520px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-6 sm:w-96"
        >
          <div className="bg-gradient-to-r from-fizzia-600 to-fizzia-500 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Fizzia Chat</h3>
                <p className="text-white/70 text-xs mt-0.5">Respuesta en menos de 24h</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white cursor-pointer">
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-fizzia-500/30 border-t-fizzia-500 rounded-full animate-spin" />
            </div>
          ) : !conversation ? (
            <StartForm onCreated={(conv) => { setConversation(conv); setMessages([]) }} />
          ) : (
            <>
              <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-dark-400 text-sm">Envía un mensaje y te responderemos en menos de 24h.</p>
                    <p className="text-dark-500 text-xs mt-2">
                      ¿Atención más rápida? <a href="/register" className="text-fizzia-400 underline">Crea una cuenta</a>
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.is_from_visitor ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.is_from_visitor
                        ? 'bg-fizzia-500 text-white rounded-br-md'
                        : 'bg-dark-800 text-dark-100 rounded-bl-md'
                    }`}>
                      {msg.content}
                      <p className={`text-[10px] mt-1 ${
                        msg.is_from_visitor ? 'text-fizzia-200' : 'text-dark-500'
                      }`}>
                        {new Date(msg.created_at).toLocaleString('es-ES', {
                          hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {isBlocked ? (
                <div className="px-4 py-3 bg-red-900/20 border-t border-dark-700">
                  <p className="text-red-400 text-xs text-center">
                    Demasiados mensajes. Espera {blockRemaining} min para enviar de nuevo.
                  </p>
                </div>
              ) : (
                <div className="px-3 py-3 border-t border-dark-700 flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-fizzia-500 transition-colors"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="w-10 h-10 flex items-center justify-center bg-fizzia-500 text-white rounded-xl hover:bg-fizzia-400 disabled:bg-dark-700 disabled:text-dark-400 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    {sending ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Icon name="send" size={18} />
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
