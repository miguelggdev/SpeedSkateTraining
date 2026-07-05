import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CalendarEvent {
  id: string
  user_id: string
  event_date: string
  title: string
  description: string | null
  sport_type: string | null
  intensity: string | null
  duration_min: number | null
  completed: boolean
}

const SPORT_COLORS: Record<string, string> = {
  skating: '#00C6EF', cycling: '#FF7A00', gym: '#8FCF00', rest: '#4A6888', competition: '#E84A5F'
}
const SPORT_ICONS: Record<string, string> = {
  skating: '⛸️', cycling: '🚴', gym: '🏋️', rest: '😴', competition: '🏆'
}
const INTENSITY_COLORS: Record<string, string> = {
  low: '#8FCF00', medium: '#FF7A00', high: '#E84A5F', race: '#A855F7'
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function Calendar() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date())
  const [viewDate, setViewDate] = useState(new Date())
  const [selected, setSelected] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    title: '', event_date: new Date().toISOString().slice(0, 10),
    sport_type: 'skating', intensity: 'medium', duration_min: '', description: ''
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  useEffect(() => { if (profile) loadEvents() }, [profile, viewDate])

  async function loadEvents() {
    setLoading(true)
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', profile!.id)
      .gte('event_date', from)
      .lte('event_date', to)
      .order('event_date')
    if (data) setEvents(data)
    setLoading(false)
  }

  async function createEvent() {
    if (!form.title.trim()) { toast.error('Agrega un título'); return }
    const { error } = await supabase.from('calendar_events').insert({
      user_id: profile!.id, created_by: profile!.id,
      title: form.title, event_date: form.event_date,
      sport_type: form.sport_type, intensity: form.intensity,
      duration_min: form.duration_min ? Number(form.duration_min) : null,
      description: form.description || null,
    })
    if (error) { toast.error('Error al crear evento'); return }
    toast.success('Evento creado')
    setShowNew(false)
    setForm({ title: '', event_date: new Date().toISOString().slice(0, 10), sport_type: 'skating', intensity: 'medium', duration_min: '', description: '' })
    loadEvents()
  }

  async function toggleComplete(ev: CalendarEvent) {
    await supabase.from('calendar_events').update({ completed: !ev.completed }).eq('id', ev.id)
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, completed: !e.completed } : e))
  }

  async function deleteEvent(id: string) {
    await supabase.from('calendar_events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
    setSelected(null)
  }

  function eventsForDay(day: number): CalendarEvent[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.event_date === dateStr)
  }

  const selectedEvents = selected ? eventsForDay(Number(selected.split('-')[2])) : []

  const todayStr = today.toISOString().slice(0, 10)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CalendarDays size={24} className="text-[#A855F7]" /> Calendario
          </h1>
          <p className="text-sm text-[#4A6888] mt-0.5">Plan de entrenamientos</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#A855F7] text-white rounded-lg text-sm font-bold hover:bg-[#9333EA] transition"
        >
          <Plus size={16} /> Nuevo evento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-[#0D1A2E] border border-[#152038] rounded-xl overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#152038]">
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="text-[#4A6888] hover:text-white p-1">
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-white">{MONTH_NAMES[month]} {year}</span>
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="text-[#4A6888] hover:text-white p-1">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-b border-[#152038]">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[10px] font-bold uppercase text-[#3A5070] py-2">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 border-b border-r border-[#152038]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = eventsForDay(day)
              const isToday = dateStr === todayStr
              const isSelected = selected === dateStr
              return (
                <div
                  key={day}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                  className={`h-20 border-b border-r border-[#152038] p-1.5 cursor-pointer transition-colors ${isSelected ? 'bg-[#A855F7]/10' : 'hover:bg-white/2'}`}
                >
                  <div className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-1 ${isToday ? 'bg-[#A855F7] text-white' : 'text-[#4A6888]'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold truncate"
                        style={{ background: `${SPORT_COLORS[ev.sport_type ?? 'skating']}20`, color: SPORT_COLORS[ev.sport_type ?? 'skating'] }}
                      >
                        {SPORT_ICONS[ev.sport_type ?? 'skating']} {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[9px] text-[#3A5070]">+{dayEvents.length - 2} más</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-4">
          {selected ? (
            <div className="space-y-3">
              <div className="font-bold text-white text-sm">
                {new Date(selected + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              {selectedEvents.length === 0 && (
                <div className="text-[#4A6888] text-sm py-6 text-center">
                  Sin eventos<br />
                  <button
                    onClick={() => { setForm(f => ({ ...f, event_date: selected })); setShowNew(true) }}
                    className="text-[#A855F7] hover:underline mt-1"
                  >
                    + Agregar
                  </button>
                </div>
              )}
              {selectedEvents.map(ev => (
                <div key={ev.id} className={`border rounded-lg p-3 space-y-2 ${ev.completed ? 'border-[#8FCF00]/30 bg-[#8FCF00]/5' : 'border-[#152038] bg-[#060D1A]'}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{SPORT_ICONS[ev.sport_type ?? 'skating']}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${ev.completed ? 'line-through text-[#4A6888]' : 'text-white'}`}>{ev.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ev.intensity && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: `${INTENSITY_COLORS[ev.intensity]}20`, color: INTENSITY_COLORS[ev.intensity] }}>
                            {ev.intensity.toUpperCase()}
                          </span>
                        )}
                        {ev.duration_min && <span className="text-[10px] text-[#4A6888]">{ev.duration_min} min</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleComplete(ev)} className={`p-1 rounded transition ${ev.completed ? 'text-[#8FCF00]' : 'text-[#3A5070] hover:text-[#8FCF00]'}`}>
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => deleteEvent(ev.id)} className="text-[#3A5070] hover:text-[#E84A5F] p-1"><X size={14} /></button>
                    </div>
                  </div>
                  {ev.description && <p className="text-[11px] text-[#5A76A0]">{ev.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#4A6888] py-12">
              <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecciona un día para ver eventos</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#3A5070] mb-3">Próximos eventos</div>
        {events.filter(e => e.event_date >= todayStr && !e.completed).slice(0, 5).length === 0 && (
          <p className="text-[#4A6888] text-sm">No hay eventos próximos este mes</p>
        )}
        <div className="space-y-2">
          {events.filter(e => e.event_date >= todayStr && !e.completed).slice(0, 5).map(ev => (
            <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-[#152038] last:border-0">
              <span className="text-xl">{SPORT_ICONS[ev.sport_type ?? 'skating']}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{ev.title}</div>
                <div className="text-[11px] text-[#4A6888]">{new Date(ev.event_date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              </div>
              {ev.intensity && (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: `${INTENSITY_COLORS[ev.intensity]}20`, color: INTENSITY_COLORS[ev.intensity] }}>
                  {ev.intensity.toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New event modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Nuevo evento</h2>
              <button onClick={() => setShowNew(false)} className="text-[#3A5070] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Título del entrenamiento" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Fecha</label>
                  <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1" />
                </div>
                <div>
                  <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Duración (min)</label>
                  <input type="number" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}
                    className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1" placeholder="90" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Deporte</label>
                  <select value={form.sport_type} onChange={e => setForm(f => ({ ...f, sport_type: e.target.value }))}
                    className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1">
                    <option value="skating">⛸️ Patinaje</option>
                    <option value="cycling">🚴 Bicicleta</option>
                    <option value="gym">🏋️ Gym</option>
                    <option value="rest">😴 Descanso</option>
                    <option value="competition">🏆 Competencia</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Intensidad</label>
                  <select value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: e.target.value }))}
                    className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1">
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="race">Competencia</option>
                  </select>
                </div>
              </div>
              <textarea placeholder="Descripción / notas..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 border border-[#152038] rounded-lg text-sm text-[#4A6888] hover:text-white">Cancelar</button>
              <button onClick={createEvent} className="flex-1 py-2.5 bg-[#A855F7] text-white font-bold rounded-lg text-sm hover:bg-[#9333EA] transition">Crear evento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
