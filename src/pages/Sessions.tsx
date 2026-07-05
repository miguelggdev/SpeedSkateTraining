import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { TrainingSession, SportType } from '@/types/database'
import { Plus, Clock, MapPin, Zap, Filter } from 'lucide-react'

const SPORT_META: Record<SportType, { icon: string; color: string; label: string }> = {
  skating: { icon: '⛸️', color: '#00C6EF', label: 'Patinaje' },
  cycling: { icon: '🚴', color: '#FF7A00', label: 'Bicicleta' },
  gym:     { icon: '🏋️', color: '#8FCF00', label: 'Gym' },
}

const TRAINING_LABELS: Record<string, string> = {
  strength_plyo: 'Fuerza y Pliometría',
  dry_technique: 'Técnico en Seco',
  endurance:     'Resistencia',
  sprint_start:  'Salidas y Sprint',
  flexibility:   'Flexibilidad',
}

function formatDuration(min: number | null) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Sessions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState<SportType | 'all'>(
    (params.get('sport') as SportType) || 'all'
  )

  useEffect(() => {
    if (!user) return
    setLoading(true)
    let q = supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50)

    if (sport !== 'all') q = q.eq('sport_type', sport)

    q.then(({ data }) => {
      setSessions(data ?? [])
      setLoading(false)
    })
  }, [user, sport])

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Arial Black', sans-serif" }}>
          Sesiones
        </h1>
        <button
          onClick={() => navigate('/sessions/new')}
          className="flex items-center gap-2 bg-[#00C6EF] hover:bg-[#00B5D8] text-[#060D1A] font-bold text-sm px-3 py-2 rounded-xl transition-all active:scale-95"
        >
          <Plus size={15} />
          Nueva
        </button>
      </div>

      {/* Sport filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setSport('all')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
          style={{
            borderColor: sport === 'all' ? '#00C6EF' : '#152038',
            background: sport === 'all' ? '#00C6EF15' : '#0D1A2E',
            color: sport === 'all' ? '#00C6EF' : '#5A76A0',
          }}
        >
          <Filter size={11} /> Todos
        </button>
        {(Object.entries(SPORT_META) as [SportType, typeof SPORT_META[SportType]][]).map(([key, m]) => (
          <button
            key={key}
            onClick={() => setSport(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
            style={{
              borderColor: sport === key ? m.color : '#152038',
              background: sport === key ? `${m.color}15` : '#0D1A2E',
              color: sport === key ? m.color : '#5A76A0',
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="text-3xl animate-pulse">⛸️</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">🏁</div>
          <div className="text-sm font-semibold text-white mb-1">Sin sesiones aún</div>
          <div className="text-xs text-[#3A5070] mb-4">
            Registra tu primera sesión para ver el historial
          </div>
          <button
            onClick={() => navigate('/sessions/new')}
            className="bg-[#00C6EF]/10 border border-[#00C6EF]/25 text-[#00C6EF] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#00C6EF]/20 transition-colors"
          >
            + Nueva sesión
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => {
            const m = SPORT_META[s.sport_type]
            return (
              <div
                key={s.id}
                className="bg-[#0D1A2E] border border-[#152038] hover:border-[#1E3050] rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.005]"
                onClick={() => {}}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${m.color}18`, border: `1px solid ${m.color}30` }}
                    >
                      {m.icon}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {s.training_type ? TRAINING_LABELS[s.training_type] : m.label}
                      </div>
                      <div className="text-[10px] text-[#3A5070] capitalize">
                        {s.athlete_category && `${s.athlete_category} · `}
                        {formatDate(s.started_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold" style={{ color: m.color }}>
                      {s.distance_km ? `${s.distance_km} km` : s.duration_minutes ? formatDuration(s.duration_minutes) : '—'}
                    </div>
                    {s.rpe && (
                      <div className="text-[10px] text-[#3A5070]">RPE {s.rpe}/10</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-[#4A6888]">
                  {s.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {formatDuration(s.duration_minutes)}
                    </span>
                  )}
                  {s.calories && (
                    <span className="flex items-center gap-1">
                      🔥 {s.calories} kcal
                    </span>
                  )}
                  {s.avg_hr && (
                    <span className="flex items-center gap-1">
                      ❤️ {s.avg_hr} bpm
                    </span>
                  )}
                  {s.location_name && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={10} /> {s.location_name}
                    </span>
                  )}
                  {s.lap_count && (
                    <span className="flex items-center gap-1">
                      <Zap size={10} /> {s.lap_count} vueltas
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
