import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Send, Bot, User, Loader2, Zap, BarChart2, Calendar } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.skate.arkanatech.tech'

interface Message {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

const QUICK_PROMPTS = [
  { icon: '📊', label: 'Resumen semanal', text: 'Dame un resumen de mi entrenamiento esta semana y cómo puedo mejorar.' },
  { icon: '⚡', label: 'Mejorar sprint',  text: '¿Cómo puedo mejorar mis salidas y sprint para las próximas competencias?' },
  { icon: '😴', label: 'Recuperación',    text: '¿Estoy recuperando bien? Revisa mi sueño y fatiga recientes.' },
  { icon: '🏆', label: 'Plan semanal',    text: 'Con base en mi historial, diseña un plan de entrenamiento para esta semana.' },
]

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-[#00C6EF]/20' : 'bg-[#A78BFA]/15 border border-[#A78BFA]/20'
      }`}>
        {isUser ? <User size={14} className="text-[#00C6EF]" /> : <Bot size={14} className="text-[#A78BFA]" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[#00C6EF]/15 border border-[#00C6EF]/20 text-white rounded-tr-sm'
            : 'bg-[#0D1A2E] border border-[#152038] text-[#C8D8E8] rounded-tl-sm'
        }`}>
          {msg.loading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#A78BFA]" />
              <span className="text-[#4A6888] text-xs">Coach analizando tus datos...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{msg.content}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AiCoach() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: '¡Hola! Soy tu Coach IA personalizado 🤖⛸️\n\nAnalizo tus sesiones de entrenamiento, bienestar y rendimiento para darte recomendaciones precisas.\n\n¿En qué te puedo ayudar hoy?',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || !user || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const loadingMsg: Message = { role: 'assistant', content: '', loading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages
        .filter(m => !m.loading)
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch(`${API_URL}/api/v1/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, message: text, history }),
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()

      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: data.reply },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: '⚠️ No pude conectarme al servidor del Coach. Verifica que el backend esté activo en `api.skate.arkanatech.tech`.',
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0D1A2E] border-b border-[#152038] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <div className="font-black text-white text-sm" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            Coach IA
          </div>
          <div className="text-[10px] text-[#A78BFA] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] inline-block animate-pulse" />
            Powered by Claude · Analiza tus datos en tiempo real
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.text)}
              disabled={loading}
              className="flex items-center gap-1.5 bg-[#0D1A2E] border border-[#152038] hover:border-[#A78BFA]/40 text-xs font-semibold text-[#4A6888] hover:text-white px-3 py-2 rounded-xl whitespace-nowrap transition-all flex-shrink-0"
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-[#152038]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Pregunta al Coach..."
            disabled={loading}
            className="flex-1 bg-[#0D1A2E] border border-[#152038] focus:border-[#A78BFA]/50 text-white text-sm rounded-xl px-4 py-3 outline-none placeholder:text-[#2A3A55] transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
            style={{ background: '#A78BFA', boxShadow: '0 4px 16px #A78BFA30' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-[#1E2E45] mt-2 text-center">
          El Coach accede a tus datos de entrenamiento y bienestar para personalizar las respuestas
        </p>
      </div>
    </div>
  )
}
