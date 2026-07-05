import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  usePersonalBests, OFFICIAL_DISTANCES, formatTime, parseTimeInput,
  getWsCategory, WS_CATEGORIES
} from '@/hooks/usePersonalBests'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Trophy, Plus, X, Star, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

const TRACK_OPTIONS = [
  { value: 'track_200', label: '🏟 Pista 200m (indoor)' },
  { value: 'track_400', label: '🏟 Pista 400m (outdoor)' },
  { value: 'open_road', label: '🛣 Ruta abierta' },
]

const EMPTY_FORM = {
  distance_m: 500,
  time_input: '',
  track_type: 'track_400',
  competition: false,
  event_name: '',
  location: '',
  recorded_at: new Date().toISOString().split('T')[0],
  notes: '',
}

function speed(distM: number, timeMs: number) {
  return ((distM / 1000) / (timeMs / 3600000)).toFixed(2)
}

export default function PersonalBests() {
  const { user, profile } = useAuth()
  const { times, pbs, loading, addTime, deleteTime, getHistory } = usePersonalBests(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [filterSprint, setFilterSprint] = useState<'all' | 'sprint' | 'endurance'>('all')

  const wsCategory = getWsCategory(profile?.birth_date ?? null)

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleAdd() {
    const ms = parseTimeInput(form.time_input)
    if (!ms || ms <= 0) { toast.error('Formato de tiempo inválido. Usa mm:ss.ms o ss.ms'); return }
    setSaving(true)
    const { isPb, error } = await addTime({
      distance_m:   form.distance_m,
      time_ms:      ms,
      track_type:   form.track_type || null,
      competition:  form.competition,
      event_name:   form.event_name || null,
      location:     form.location || null,
      session_id:   null,
      notes:        form.notes || null,
      recorded_at:  form.recorded_at,
    })
    setSaving(false)
    if (error) toast.error('Error al guardar')
    else {
      toast.success(isPb ? '🏆 ¡Nuevo récord personal!' : 'Tiempo registrado ✓')
      setForm({ ...EMPTY_FORM })
      setShowForm(false)
    }
  }

  const filtered = OFFICIAL_DISTANCES.filter(d =>
    filterSprint === 'all' ? true :
    filterSprint === 'sprint' ? d.sprint : !d.sprint
  )

  const pbCount = Object.keys(pbs).length

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy size={22} className="text-[#F59E0B]" /> Marcas Personales
          </h1>
          <p className="text-sm text-[#4A6888] mt-0.5">
            {pbCount} distancias con marca · Reglamento World Skate 2024
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90"
        >
          <Plus size={16} /> Registrar tiempo
        </button>
      </div>

      {/* Category badge */}
      {wsCategory && (
        <div className="flex items-center gap-3 bg-[#0D1A2E] border border-[#F59E0B]/20 rounded-2xl px-5 py-3">
          <div className="w-8 h-8 rounded-full bg-[#F59E0B]/15 flex items-center justify-center text-sm">🏅</div>
          <div>
            <div className="text-sm font-bold text-white">
              Categoría World Skate: <span className="text-[#F59E0B]">{wsCategory.label}</span>
            </div>
            <div className="text-xs text-[#4A6888]">
              {wsCategory.minAge}–{wsCategory.maxAge} años · calculado automáticamente
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 bg-[#060D1A] border border-[#152038] rounded-xl p-1 w-fit">
        {([['all','Todas'],['sprint','Velocidad'],['endurance','Fondo']] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilterSprint(v)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterSprint === v ? 'bg-[#00C6EF] text-black' : 'text-[#4A6888] hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-[#0D1A2E] border border-[#00C6EF]/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Registrar tiempo</h3>
            <button onClick={() => setShowForm(false)} className="text-[#4A6888] hover:text-white"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Distancia</label>
              <select
                value={form.distance_m}
                onChange={e => set('distance_m', Number(e.target.value))}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              >
                {OFFICIAL_DISTANCES.map(d => (
                  <option key={d.m} value={d.m}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">
                Tiempo <span className="text-[#3A5070] normal-case">(mm:ss.ms ó ss.ms)</span>
              </label>
              <input
                value={form.time_input}
                onChange={e => set('time_input', e.target.value)}
                placeholder="1:23.45 ó 45.32"
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50 font-mono"
              />
              {form.time_input && parseTimeInput(form.time_input) && (
                <div className="text-[11px] text-[#00C6EF] mt-1">
                  = {formatTime(parseTimeInput(form.time_input)!)} · {speed(form.distance_m, parseTimeInput(form.time_input)!)} km/h
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Pista</label>
              <select
                value={form.track_type}
                onChange={e => set('track_type', e.target.value)}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              >
                {TRACK_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Fecha</label>
              <input
                type="date" value={form.recorded_at}
                onChange={e => set('recorded_at', e.target.value)}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.competition}
                onChange={e => set('competition', e.target.checked)}
                className="accent-[#00C6EF]"
              />
              <span className="text-sm text-white">Competencia oficial 🏆</span>
            </label>
          </div>

          {form.competition && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Nombre del evento</label>
                <input
                  value={form.event_name} onChange={e => set('event_name', e.target.value)}
                  placeholder="Campeonato Nacional 2024"
                  className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Lugar</label>
                <input
                  value={form.location} onChange={e => set('location', e.target.value)}
                  placeholder="Medellín, Colombia"
                  className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={saving || !form.time_input}
            className="w-full py-3 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90 disabled:opacity-40"
          >
            {saving ? 'Guardando...' : 'Guardar tiempo'}
          </button>
        </div>
      )}

      {/* PB Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#4A6888]">Cargando marcas...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(dist => {
            const pb = pbs[dist.m]
            const history = getHistory(dist.m)
            const isExpanded = expanded === dist.m
            const improvement = history.length >= 2
              ? ((history[0].time_ms - history[history.length - 1].time_ms) / history[0].time_ms * 100)
              : null

            return (
              <div
                key={dist.m}
                className={`bg-[#0D1A2E] border rounded-2xl overflow-hidden transition-all ${
                  pb ? 'border-[#152038] hover:border-[#00C6EF]/20' : 'border-[#152038] opacity-60'
                }`}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : dist.m)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  {/* Distance */}
                  <div className="w-20 shrink-0">
                    <div className="text-sm font-black text-white">{dist.label}</div>
                    <div className="text-[10px] text-[#3A5070]">{dist.sprint ? 'Velocidad' : 'Fondo'}</div>
                  </div>

                  {/* PB */}
                  <div className="flex-1">
                    {pb ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black font-mono text-[#00C6EF]">
                          {formatTime(pb.time_ms)}
                        </span>
                        {pb.competition && <Star size={12} className="text-[#F59E0B]" fill="#F59E0B" />}
                        <span className="text-xs text-[#4A6888]">{speed(dist.m, pb.time_ms)} km/h</span>
                      </div>
                    ) : (
                      <span className="text-[#3A5070] text-sm">Sin marca</span>
                    )}
                    {pb && (
                      <div className="text-[10px] text-[#3A5070] mt-0.5">
                        {new Date(pb.recorded_at).toLocaleDateString('es', { day:'numeric', month:'short', year:'numeric' })}
                        {pb.event_name && ` · ${pb.event_name}`}
                      </div>
                    )}
                  </div>

                  {/* Improvement */}
                  {improvement !== null && improvement > 0 && (
                    <div className="flex items-center gap-1 text-[#8FCF00] text-xs font-bold shrink-0">
                      <TrendingDown size={12} /> -{improvement.toFixed(1)}%
                    </div>
                  )}

                  {/* Count */}
                  {history.length > 0 && (
                    <div className="text-[11px] text-[#3A5070] shrink-0">{history.length} registros</div>
                  )}

                  {history.length > 0 && (
                    isExpanded ? <ChevronUp size={14} className="text-[#4A6888] shrink-0" /> : <ChevronDown size={14} className="text-[#4A6888] shrink-0" />
                  )}
                </button>

                {/* Expanded: history + chart */}
                {isExpanded && history.length > 0 && (
                  <div className="px-5 pb-5 space-y-4 border-t border-[#152038]">
                    {/* Progress chart */}
                    {history.length >= 2 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider mb-3">Progresión</div>
                        <ResponsiveContainer width="100%" height={120}>
                          <LineChart data={history.map(h => ({
                            date: new Date(h.recorded_at).toLocaleDateString('es', { day:'numeric', month:'short' }),
                            seg: (h.time_ms / 1000).toFixed(2),
                          }))}>
                            <XAxis dataKey="date" tick={{ fill: '#4A6888', fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis
                              tick={{ fill: '#4A6888', fontSize: 9 }}
                              axisLine={false} tickLine={false}
                              domain={['auto', 'auto']}
                              tickFormatter={v => `${v}s`}
                            />
                            <Tooltip
                              contentStyle={{ background: '#060D1A', border: '1px solid #152038', borderRadius: 8, fontSize: 11 }}
                              formatter={(v: any) => [`${v}s`, 'Tiempo']}
                            />
                            <Line type="monotone" dataKey="seg" stroke="#00C6EF" strokeWidth={2} dot={{ fill: '#00C6EF', r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* History list */}
                    <div className="space-y-1.5">
                      {[...history].reverse().map((h, i) => (
                        <div key={h.id} className="flex items-center gap-3 bg-[#060D1A] rounded-xl px-4 py-2.5">
                          {h.is_pb && <Star size={12} className="text-[#F59E0B] shrink-0" fill="#F59E0B" />}
                          {!h.is_pb && <div className="w-3 shrink-0" />}
                          <span className="font-mono text-sm font-bold" style={{ color: h.is_pb ? '#F59E0B' : '#fff' }}>
                            {formatTime(h.time_ms)}
                          </span>
                          <span className="text-xs text-[#4A6888]">{speed(dist.m, h.time_ms)} km/h</span>
                          {h.competition && <span className="text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] px-1.5 py-0.5 rounded">Competencia</span>}
                          {h.event_name && <span className="text-[10px] text-[#4A6888] truncate">{h.event_name}</span>}
                          <span className="ml-auto text-[10px] text-[#3A5070]">
                            {new Date(h.recorded_at).toLocaleDateString('es', { day:'numeric', month:'short', year:'2-digit' })}
                          </span>
                          <button
                            onClick={() => { if (confirm('¿Eliminar este tiempo?')) deleteTime(h.id) }}
                            className="text-[#3A5070] hover:text-[#E84A5F] transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
