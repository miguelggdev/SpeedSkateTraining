import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMessages } from '@/hooks/useMessages'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import { Send, MessageSquare } from 'lucide-react'

function timeLabel(iso: string) {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function Messages() {
  const { user, profile } = useAuth()
  const { messages, loading, sendMessage, markRead, getThread, unreadCount } = useMessages(user?.id)
  const [contacts, setContacts] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile) return
    // Load coach (if athlete) or athletes (if coach)
    if (profile.role === 'athlete' && profile.coach_id) {
      supabase.from('profiles').select('*').eq('id', profile.coach_id).single()
        .then(({ data }) => { if (data) setContacts([data]) })
    } else if (profile.role === 'coach' || profile.role === 'admin') {
      supabase.from('profiles').select('*').eq('coach_id', profile.id)
        .then(({ data }) => setContacts(data ?? []))
    }
  }, [profile])

  useEffect(() => {
    if (selected) markRead(selected.id)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected, messages.length])

  async function handleSend() {
    if (!input.trim() || !selected) return
    setSending(true)
    await sendMessage(selected.id, input.trim())
    setInput('')
    setSending(false)
  }

  const thread = selected ? getThread(selected.id) : []

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-full">
      {/* Contacts sidebar */}
      <div className={`w-full lg:w-72 bg-[#0D1A2E] border-r border-[#152038] flex flex-col ${selected ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-5 py-4 border-b border-[#152038]">
          <h1 className="font-black text-white">Mensajes</h1>
          <p className="text-xs text-[#4A6888] mt-0.5">
            {profile?.role === 'athlete' ? 'Tu entrenador' : 'Tus atletas'}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#152038]">
          {loading ? (
            <div className="p-5 text-center text-[#4A6888] text-sm">Cargando...</div>
          ) : contacts.length === 0 ? (
            <div className="p-5 text-center space-y-2">
              <MessageSquare size={32} className="mx-auto text-[#152038]" />
              <p className="text-[#4A6888] text-sm">
                {profile?.role === 'athlete'
                  ? 'No tienes un coach asignado aún.'
                  : 'No tienes atletas asignados.'}
              </p>
            </div>
          ) : (
            contacts.map(c => {
              const unread = unreadCount(c.id)
              const thread = getThread(c.id)
              const last = thread[thread.length - 1]
              const initials = c.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-white/5 transition-all text-left ${
                    selected?.id === c.id ? 'bg-[#00C6EF]/5 border-l-2 border-[#00C6EF]' : ''
                  }`}
                >
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#00C6EF]/10 border border-[#00C6EF]/20 flex items-center justify-center text-sm font-bold text-[#00C6EF] shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white truncate">{c.full_name ?? 'Sin nombre'}</span>
                      {last && <span className="text-[10px] text-[#3A5070] shrink-0 ml-2">{timeLabel(last.created_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-[#4A6888] truncate">
                        {last ? (last.sender_id === user?.id ? 'Tú: ' : '') + last.body : 'Sin mensajes'}
                      </span>
                      {unread > 0 && (
                        <span className="ml-2 w-5 h-5 rounded-full bg-[#00C6EF] text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${!selected ? 'hidden lg:flex' : 'flex'}`}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MessageSquare size={48} className="mx-auto text-[#152038]" />
              <p className="text-[#4A6888]">Selecciona una conversación</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-[#0D1A2E] border-b border-[#152038]">
              <button
                onClick={() => setSelected(null)}
                className="lg:hidden text-[#4A6888] hover:text-white mr-1"
              >←</button>
              {selected.avatar_url ? (
                <img src={selected.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#00C6EF]/10 border border-[#00C6EF]/20 flex items-center justify-center text-xs font-bold text-[#00C6EF]">
                  {selected.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-white">{selected.full_name}</div>
                <div className="text-[10px] text-[#4A6888] capitalize">{selected.role}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {thread.length === 0 ? (
                <div className="text-center py-12 text-[#4A6888] text-sm">
                  Sin mensajes aún. ¡Envía el primero!
                </div>
              ) : (
                thread.map(m => {
                  const isMe = m.sender_id === user?.id
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-[#00C6EF] text-black rounded-br-md'
                          : 'bg-[#0D1A2E] border border-[#152038] text-white rounded-bl-md'
                      }`}>
                        <p>{m.body}</p>
                        <div className={`text-[10px] mt-1 ${isMe ? 'text-black/50 text-right' : 'text-[#3A5070]'}`}>
                          {timeLabel(m.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-[#0D1A2E] border-t border-[#152038]">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-[#060D1A] border border-[#152038] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-[#00C6EF] text-black flex items-center justify-center hover:bg-[#00C6EF]/90 transition-colors disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
