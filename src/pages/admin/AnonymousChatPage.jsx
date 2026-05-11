import { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '../../components/ui/Icon'
import {
  getAllConversations,
  getAdminMessages,
  sendAdminReply,
  closeConversation,
  subscribeToAdminMessages,
} from '../../services/anonymousChat'

function ConversationItem({ conv, active, onClick }) {
  const time = new Date(conv.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short',
  })
  return (
    <button
      onClick={() => onClick(conv)}
      className={`w-full text-left px-4 py-3 border-b border-dark-800 transition-colors cursor-pointer hover:bg-dark-800/50 ${
        active?.id === conv.id ? 'bg-dark-800' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-white text-sm font-semibold truncate max-w-[160px]">
          {conv.visitor_name} {conv.visitor_last_name || ''}
        </span>
        <span className="text-dark-500 text-[10px]">{time}</span>
      </div>
      <span className={`text-xs ${conv.status === 'active' ? 'text-fizzia-400' : 'text-dark-500'}`}>
        {conv.visitor_city || ''}{conv.visitor_city && conv.visitor_country ? ', ' : ''}{conv.visitor_country || ''} · {conv.status === 'active' ? 'Activo' : 'Cerrado'}
      </span>
      {conv.simulator_data && (
        <div className="text-dark-500 text-[10px] mt-1 truncate">
          {conv.simulator_data.projectType} — ${conv.simulator_data.total?.toLocaleString()}
        </div>
      )}
    </button>
  )
}

export function AnonymousChatPage() {
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  const load = useCallback(async () => {
    try { setConversations(await getAllConversations()) } catch {}
  }, [])

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return
    try { setMessages(await getAdminMessages(convId)) } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (activeConv) loadMessages(activeConv.id)
  }, [activeConv, loadMessages])

  useEffect(() => {
    const sub = subscribeToAdminMessages((msg) => {
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg])
      load()
    })
    return () => sub.unsubscribe()
  }, [load])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !activeConv || sending) return
    setSending(true)
    try { await sendAdminReply(activeConv.id, text); setInput('') } catch {} finally { setSending(false) }
  }

  const handleClose = async () => {
    if (!activeConv) return
    await closeConversation(activeConv.id)
    setActiveConv(null); setMessages([]); load()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const simData = activeConv?.simulator_data

  return (
    <div className="p-4 md:p-6 lg:p-8 h-[calc(100dvh-64px)]">
      <div className="mx-auto max-w-6xl h-full flex border border-dark-800 rounded-2xl overflow-hidden bg-dark-900/50">
        <div className="w-72 border-r border-dark-800 shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-dark-800">
            <h2 className="text-white font-bold text-sm">Chat Anónimo</h2>
            <p className="text-dark-500 text-xs mt-0.5">{conversations.length} conversaciones</p>
          </div>
          {conversations.length === 0 && (
            <div className="p-4 text-dark-500 text-xs text-center">Sin conversaciones aún</div>
          )}
          {conversations.map((conv) => (
            <ConversationItem key={conv.id} conv={conv} active={activeConv} onClick={setActiveConv} />
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Icon name="forum" size={48} className="text-dark-700 block mx-auto mb-3" />
                <p className="text-dark-500 text-sm">Selecciona una conversación</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-dark-800 flex items-center justify-between shrink-0 gap-2">
                <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">
                  {activeConv.visitor_name} {activeConv.visitor_last_name || ''}
                </h3>
                <p className="text-dark-500 text-xs truncate">
                  {activeConv.visitor_city || ''}{activeConv.visitor_city && activeConv.visitor_country ? ', ' : ''}{activeConv.visitor_country || ''}
                  {activeConv.visitor_phone && ` · ${activeConv.dial_code} ${activeConv.visitor_phone}`}
                </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {simData && (
                    <span className="text-fizzia-400 text-xs font-semibold">${simData.total?.toLocaleString()}</span>
                  )}
                  {activeConv.status === 'active' && (
                    <button onClick={handleClose} className="text-xs text-dark-400 hover:text-white px-3 py-1.5 border border-dark-700 rounded-lg transition-colors cursor-pointer">
                      Cerrar
                    </button>
                  )}
                </div>
              </div>

              {simData && (
                <div className="px-4 py-2 bg-dark-850/50 border-b border-dark-800 text-xs text-dark-400 flex gap-4 overflow-x-auto">
                  <span>{simData.projectType}</span>
                  <span className="text-dark-600">|</span>
                  <span>{simData.designLevel}</span>
                  <span className="text-dark-600">|</span>
                  <span>{simData.delivery}</span>
                  {simData.features?.length > 0 && (
                    <>
                      <span className="text-dark-600">|</span>
                      <span className="truncate">{simData.features.join(', ')}</span>
                    </>
                  )}
                </div>
              )}

              <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.is_from_visitor ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.is_from_visitor
                        ? 'bg-dark-800 text-dark-100 rounded-bl-md'
                        : 'bg-fizzia-500 text-white rounded-br-md'
                    }`}>
                      <p className="text-[10px] font-semibold mb-0.5 opacity-60">
                        {msg.is_from_visitor ? `${activeConv.visitor_name} ${activeConv.visitor_last_name || ''}`.trim() : 'Fizzia'}
                      </p>
                      {msg.content}
                      <p className={`text-[10px] mt-1 ${msg.is_from_visitor ? 'text-dark-500' : 'text-fizzia-200'}`}>
                        {new Date(msg.created_at).toLocaleString('es-ES', {
                          hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {activeConv.status === 'active' ? (
                <div className="px-3 py-3 border-t border-dark-800 flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Responder..."
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
              ) : (
                <div className="p-4 border-t border-dark-800 text-center">
                  <span className="text-dark-500 text-xs">Conversación cerrada</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
