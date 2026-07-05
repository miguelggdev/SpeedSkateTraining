import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Trophy, Medal, Users, TrendingUp } from 'lucide-react'

interface RankEntry {
  id: string
  full_name: string
  avatar_url: string | null
  category: string | null
  total_sessions: number
  total_km: number
  best_pb_100m: string | null
  best_pb_300m: string | null
  best_pb_500m: string | null
  best_pb_1000m: string | null
}

interface Club {
  id: string
  name: string
  city: string | null
}

const METRICS = [
  { key: 'total_km', label: 'KM Total', unit: 'km', color: '#00C6EF' },
  { key: 'total_sessions', label: 'Sesiones', unit: '', color: '#8FCF00' },
  { key: 'best_pb_100m', label: 'PB 100m', unit: '', color: '#F59E0B', isTime: true },
  { key: 'best_pb_300m', label: 'PB 300m', unit: '', color: '#A855F7', isTime: true },
  { key: 'best_pb_500m', label: 'PB 500m', unit: '', color: '#E84A5F', isTime: true },
  { key: 'best_pb_1000m', label: 'PB 1000m', unit: '', color: '#FF7A00', isTime: true },
]

function formatTime(ms: number | null): string {
  if (!ms) return '—'
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const centis = Math.floor((ms % 1000) / 10)
  if (min > 0) return `${min}:${String(sec).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
  return `${sec}.${String(centis).padStart(2, '0')}`
}

export default function ClubRanking() {
  const { profile } = useAuth()
  const [club, setClub] = useState<Club | null>(null)
  const [ranking, setRanking] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState('total_km')
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => { if (profile) loadData() }, [profile])

  async function loadData() {
    setLoading(true)
    // Get user's club
    const { data: prof } = await supabase
      .from('profiles')
      .select('club_id')
      .eq('id', profile!.id)
      .single()

    if (!prof?.club_id) { setLoading(false); return }

    const { data: clubData } = await supabase
      .from('clubs')
      .select('id, name, city')
      .eq('id', prof.club_id)
      .single()
    if (clubData) setClub(clubData)

    // Get all club members
    const { data: members } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, category')
      .eq('club_id', prof.club_id)

    if (!members || members.length === 0) { setLoading(false); return }
    const memberIds = members.map(m => m.id)

    // Get session stats
    const { data: sessStats } = await supabase
      .from('training_sessions')
      .select('user_id, distance_m')
      .in('user_id', memberIds)

    // Get PBs
    const { data: pbData } = await supabase
      .from('race_times')
      .select('user_id, distance_m, time_ms, is_pb')
      .in('user_id', memberIds)
      .eq('is_pb', true)

    const entries: RankEntry[] = members.map(m => {
      const userSessions = (sessStats ?? []).filter(s => s.user_id === m.id)
      const totalKm = userSessions.reduce((sum, s) => sum + (s.distance_m ?? 0), 0) / 1000
      const userPbs = (pbData ?? []).filter(p => p.user_id === m.id)
      const getPb = (dist: number) => userPbs.find(p => p.distance_m === dist)?.time_ms ?? null

      return {
        ...m,
        total_sessions: userSessions.length,
        total_km: Math.round(totalKm * 10) / 10,
        best_pb_100m: getPb(100) ? String(getPb(100)) : null,
        best_pb_300m: getPb(300) ? String(getPb(300)) : null,
        best_pb_500m: getPb(500) ? String(getPb(500)) : null,
        best_pb_1000m: getPb(1000) ? String(getPb(1000)) : null,
      }
    })

    setRanking(entries)
    setLoading(false)
  }

  const categories = ['all', ...Array.from(new Set(ranking.map(r => r.category).filter(Boolean)))]
  const filtered = catFilter === 'all' ? ranking : ranking.filter(r => r.category === catFilter)

  const activeMetric = METRICS.find(m => m.key === metric)!

  const sorted = [...filtered].sort((a, b) => {
    const va = (a as any)[metric]
    const vb = (b as any)[metric]
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    if (activeMetric.isTime) return Number(va) - Number(vb) // lower is better for times
    return Number(vb) - Number(va) // higher is better for km/sessions
  })

  const MEDAL_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32']
  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Trophy size={24} className="text-[#F59E0B]" /> Ranking del Club
        </h1>
        <p className="text-sm text-[#4A6888] mt-0.5">{club ? `${club.name}${club.city ? ` · ${club.city}` : ''}` : 'Comparativa entre atletas'}</p>
      </div>

      {!loading && !club && (
        <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-10 text-center">
          <Users size={48} className="mx-auto text-[#3A5070] mb-4" />
          <p className="text-white font-semibold">No perteneces a ningún club</p>
          <p className="text-[#4A6888] text-sm mt-1">Pide a tu entrenador que te asigne a un club en Configuración</p>
        </div>
      )}

      {club && (
        <>
          {/* Metric selector */}
          <div className="flex gap-2 flex-wrap">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${metric === m.key ? 'text-black' : 'bg-[#0D1A2E] border border-[#152038] text-[#4A6888] hover:text-white'}`}
                style={metric === m.key ? { background: m.color } : {}}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c ?? 'all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${catFilter === (c ?? 'all') ? 'bg-[#00C6EF]/20 text-[#00C6EF] border border-[#00C6EF]/30' : 'bg-[#0D1A2E] text-[#4A6888] border border-[#152038]'}`}
                >
                  {c === 'all' ? 'Todas categorías' : c}
                </button>
              ))}
            </div>
          )}

          {loading && <div className="text-[#4A6888] text-sm">Cargando ranking...</div>}

          {/* Leaderboard */}
          {!loading && sorted.length > 0 && (
            <div className="space-y-2">
              {sorted.map((entry, idx) => {
                const value = (entry as any)[metric]
                const maxValue = Math.max(...sorted.map(e => Number((e as any)[metric]) || 0))
                const progress = maxValue > 0 ? (Number(value) || 0) / maxValue : 0
                const isMe = entry.id === profile!.id

                return (
                  <div
                    key={entry.id}
                    className={`bg-[#0D1A2E] border rounded-xl p-4 transition ${isMe ? 'border-[#00C6EF]/40' : 'border-[#152038]'}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-8 text-center">
                        {idx < 3 ? (
                          <Medal size={20} style={{ color: MEDAL_COLORS[idx] }} className="mx-auto" />
                        ) : (
                          <span className="text-sm font-bold text-[#3A5070]">#{idx + 1}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#00C6EF]/20 flex items-center justify-center text-xs font-bold text-[#00C6EF]">
                          {initials(entry.full_name ?? 'AT')}
                        </div>
                      )}

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">{entry.full_name ?? 'Atleta'}</span>
                          {isMe && <span className="text-[9px] bg-[#00C6EF]/20 text-[#00C6EF] px-1.5 py-0.5 rounded font-bold">Tú</span>}
                        </div>
                        {entry.category && <span className="text-[11px] text-[#4A6888]">{entry.category}</span>}
                        {/* Progress bar */}
                        <div className="h-1.5 bg-[#0D1A2E] border border-[#152038] rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress * 100}%`, background: activeMetric.color }}
                          />
                        </div>
                      </div>

                      {/* Value */}
                      <div className="text-right">
                        <div className="text-lg font-black" style={{ color: idx === 0 ? activeMetric.color : 'white' }}>
                          {activeMetric.isTime ? formatTime(value ? Number(value) : null) : value ?? '—'}
                        </div>
                        {activeMetric.unit && <div className="text-[10px] text-[#3A5070]">{activeMetric.unit}</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Atletas', value: ranking.length, icon: Users, color: '#00C6EF' },
              { label: 'KM total club', value: `${ranking.reduce((s, r) => s + r.total_km, 0).toFixed(0)} km`, icon: TrendingUp, color: '#8FCF00' },
              { label: 'Sesiones', value: ranking.reduce((s, r) => s + r.total_sessions, 0), icon: Trophy, color: '#F59E0B' },
              { label: 'Con PB 500m', value: ranking.filter(r => r.best_pb_500m).length, icon: Medal, color: '#A855F7' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-3 text-center">
                <stat.icon size={18} className="mx-auto mb-1" style={{ color: stat.color }} />
                <div className="text-lg font-black text-white">{stat.value}</div>
                <div className="text-[10px] text-[#3A5070]">{stat.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
