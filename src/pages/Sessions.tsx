import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Plus, ChevronRight } from 'lucide-react'

const SPORT_COLORS = {
  skating: { color: '#00C6EF', bg: 'rgba(0,198,239,0.10)', border: 'rgba(0,198,239,0.25)' },
  cycling: { color: '#FF7A00', bg: 'rgba(255,122,0,0.10)', border: 'rgba(255,122,0,0.25)' },
  gym:     { color: '#8FCF00', bg: 'rgba(143,207,0,0.10)', border: 'rgba(143,207,0,0.25)' },
}

const SPORT_ICON: Record<string, string> = { skating: '⛸️', cycling: '🚴', gym: '🏋️' }

const TRAINING_LABEL: Record<string, string> = {
  strength_plyo: '💪 Fuerza', dry_technique: '🪞 Técnico',
  endurance: '🔄 Resistencia', sprint_start: '⚡ Sprint', flexibility: '🧘 Flex',
}

interface Session {
  id: string
  sport_type: string
  training_type: string | null
  athlete_category: string | null
  started_at: string
  duration_minutes: number | null
  distance_km: number | null
  calories: number | null
  speed_avg: number | null
  lap_count: number | null
}

function fmtDuration(min: number | null) {
  if (!min) return null
  if (min < 60) return `${min}m`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Sessions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [sportFilter, setSportFilter] = useState(searchParams.get('sport') ?? 'all')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    let q = supabase
      .from('training_sessions')
      .select('id,sport_type,training_type,athlete_category,started_at,duration_minutes,distance_km,calories,speed_avg,lap_count')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50)

    if (sportFilter !== 'all') q = q.eq('sport_type', sportFilter)

    q.then(({ data }) => {
      setSessions((data ?? []) as Session[])
      setLoading(false)
    })
  }, [user, sportFilter])

  function setFilter(sport: string) {
    setSportFilter(sport)
    if (sport === 'all') searchParams.delete('sport')
    else searchParams.set('sport', sport)
    setSearchParams(searchParams)
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Arial Black', sans-serif" }}>
          Sesiones
        </h1>
        <button
          onClick={() => navigate('/sessions/new')}
          className="flex items-center gap-1.5 bg-[#00C6EF] hover:bg-[#00B5D8] text-[#060D1A] font-bold text-xs px-3 py-2 rounded-xl transition-all active:scale-95"
        >
          <Plus size={13} />
          Nueva
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all',     label: 'Todas',     icon: '📋', color: '#A78BFA' },
          { key: 'skating', label: 'Patinaje',  icon: '⛸️', color: '#00C6EF' },
          { key: 'cycling', label: 'Bicicleta', icon: '🚴', color: '#FF7A00' },
          { key: 'gym',     label: 'Gym',       icon: '🏋️', color: '#8FCF00' },
        ].map(f => {
          const active = sportFilter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 border"
              style={active
                ? { background: `${f.color}22`, borderColor: `${f.color}55`, color: f.color }
                : { background: 'transparent', borderColor: '#152038', color: '#4A6888' }
              }
            >
              {f.icon} {f.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="text-4xl animate-pulse">⛸️</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">🏁</div>
          <div className="text-sm font-semibold text-white mb-1">Sin sesiones</div>
          <p className="text-xs text-[#3A5070] mb-4">Registra tu primera sesión de entrenamiento</p>
          <button
            onClick={() => navigate('/sessions/new')}
            className="bg-[#00C6EF]/10 border border-[#00C6EF]/25 text-[#00C6EF] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#00C6EF]/20 transition-colors"
          >
            + Nueva sesión
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => {
            const c = SPORT_COLORS[s.sport_type as keyof typeof SPORT_COLORS] ?? SPORT_COLORS.skating
            const details = [
              fmtDuration(s.duration_minutes),
              s.distance_km ? `${s.distance_km} km` : null,
              s.lap_count ? `${s.lap_count} vueltas` : null,
              s.speed_avg ? `${Math.round(s.speed_avg)} km/h prom` : null,
            ].filter(Boolean).join(' · ')

            return (
              <div
                key={s.id}
                className="bg-[#0D1A2E] border border-[#152038] hover:border-[#1E3050] rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-colors group"
                onClick={() => navigate(`/sessions/${s.id}`)}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                     style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  {SPORT_ICON[s.sport_type] ?? '🏃'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white capitalize">{s.sport_type}</span>
                    {s.training_type && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${c.color}18`, color: c.color }}>
                        {TRAINING_LABEL[s.training_type] ?? s.training_type}
                      </span>
                    )}
                    {s.athlete_category && (
                      <span className="text-[10px] text-[#4A6888] capitalize">{s.athlete_category}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#3A5070] mt-0.5">
                    {fmtDate(s.started_at)}
                    {details ? ` · ${details}` : ''}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  {s.calories ? (
                    <span className="text-xs font-bold" style={{ color: '#E84A5F' }}>{s.calories} kcal</span>
                  ) : null}
                  <ChevronRight size={14} className="text-[#3A5070]" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
