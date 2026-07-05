import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCoach } from '@/hooks/useCoach'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts'
import { Users, TrendingUp } from 'lucide-react'

const SPORT_COLOR: Record<string, string> = {
  skating: '#00C6EF', cycling: '#FF7A00', gym: '#8FCF00',
}
const ATHLETE_COLORS = ['#00C6EF', '#FF7A00', '#8FCF00', '#A78BFA', '#F472B6']

interface AthleteStats {
  id: string
  name: string
  sessions: number
  distanceKm: number
  avgSpeed: number
  avgRpe: number
  durationHours: number
  color: string
}

export default function CompareAthletes() {
  const { profile } = useAuth()
  const { athletes, loading } = useCoach(profile?.id)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [stats, setStats] = useState<AthleteStats[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [metric, setMetric] = useState<'sessions' | 'distanceKm' | 'avgSpeed' | 'avgRpe' | 'durationHours'>('sessions')

  const METRIC_LABEL: Record<typeof metric, string> = {
    sessions: 'Sesiones',
    distanceKm: 'Km totales',
    avgSpeed: 'Vel. promedio (km/h)',
    avgRpe: 'RPE promedio',
    durationHours: 'Horas entrenadas',
  }

  function toggleAthlete(id: string) {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 5 ? [...prev, id] : prev
    )
  }

  useEffect(() => {
    if (selectedIds.length === 0) { setStats([]); return }
    setLoadingStats(true)
    Promise.all(
      selectedIds.map(async (id, idx) => {
        const { data } = await supabase
          .from('training_sessions')
          .select('distance_km, duration_minutes, speed_avg, rpe')
          .eq('user_id', id)
        const athlete = athletes.find(a => a.id === id)
        const rows = data ?? []
        return {
          id,
          name: athlete?.full_name?.split(' ')[0] ?? id.slice(0, 6),
          sessions: rows.length,
          distanceKm: Math.round(rows.reduce((a, r) => a + (r.distance_km ?? 0), 0) * 10) / 10,
          avgSpeed: rows.filter(r => r.speed_avg).length
            ? Math.round(rows.filter(r => r.speed_avg).reduce((a, r) => a + (r.speed_avg ?? 0), 0) / rows.filter(r => r.speed_avg).length * 10) / 10
            : 0,
          avgRpe: rows.filter(r => r.rpe).length
            ? Math.round(rows.filter(r => r.rpe).reduce((a, r) => a + (r.rpe ?? 0), 0) / rows.filter(r => r.rpe).length * 10) / 10
            : 0,
          durationHours: Math.round(rows.reduce((a, r) => a + (r.duration_minutes ?? 0), 0) / 60 * 10) / 10,
          color: ATHLETE_COLORS[idx % ATHLETE_COLORS.length],
        } as AthleteStats
      })
    ).then(results => {
      setStats(results)
      setLoadingStats(false)
    })
  }, [selectedIds, athletes])

  // Radar data normalized 0-100
  const radarData = stats.length > 0
    ? (['sessions', 'distanceKm', 'avgSpeed', 'avgRpe', 'durationHours'] as const).map(key => {
        const max = Math.max(...stats.map(s => s[key]), 1)
        const entry: Record<string, number | string> = { metric: METRIC_LABEL[key] }
        for (const s of stats) entry[s.name] = Math.round((s[key] / max) * 100)
        return entry
      })
    : []

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <TrendingUp size={22} className="text-[#00C6EF]" />
          Comparativa de atletas
        </h1>
        <p className="text-sm text-[#4A6888] mt-0.5">Selecciona hasta 5 atletas para comparar su rendimiento.</p>
      </div>

      {/* Athlete picker */}
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
        <h3 className="text-xs font-bold text-[#4A6888] uppercase tracking-wider mb-3">
          Atletas ({selectedIds.length}/5 seleccionados)
        </h3>
        {loading ? (
          <p className="text-[#4A6888] text-sm">Cargando...</p>
        ) : athletes.length === 0 ? (
          <p className="text-[#4A6888] text-sm">No tienes atletas asignados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {athletes.map((a, idx) => {
              const selected = selectedIds.includes(a.id)
              const colorIdx = selectedIds.indexOf(a.id)
              const color = colorIdx >= 0 ? ATHLETE_COLORS[colorIdx] : undefined
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAthlete(a.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all"
                  style={
                    selected && color
                      ? { background: `${color}15`, borderColor: `${color}40`, color }
                      : { background: '#060D1A', borderColor: '#152038', color: '#4A6888' }
                  }
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: selected && color ? `${color}30` : '#152038', color: selected && color ? color : '#3A5070' }}
                  >
                    {a.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
                  </div>
                  {a.full_name?.split(' ')[0] ?? 'Atleta'}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedIds.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <Users size={40} className="mx-auto text-[#152038]" />
          <p className="text-[#4A6888]">Selecciona atletas arriba para ver la comparativa.</p>
        </div>
      )}

      {selectedIds.length > 0 && (
        <>
          {/* Metric selector */}
          <div className="flex gap-1 flex-wrap">
            {(Object.keys(METRIC_LABEL) as (typeof metric)[]).map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  metric === m ? 'bg-[#00C6EF] text-black' : 'bg-[#0D1A2E] border border-[#152038] text-[#4A6888] hover:text-white'
                }`}
              >
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>

          {loadingStats ? (
            <div className="text-center py-12 text-[#4A6888]">Calculando estadísticas...</div>
          ) : (
            <>
              {/* Bar chart */}
              <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">{METRIC_LABEL[metric]}</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.map(s => ({ name: s.name, value: s[metric], color: s.color }))} barSize={40}>
                    <XAxis dataKey="name" tick={{ fill: '#4A6888', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#4A6888', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#060D1A', border: '1px solid #152038', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" name={METRIC_LABEL[metric]} radius={[6, 6, 0, 0]}>
                      {stats.map((s, i) => (
                        <Bar key={s.id} dataKey="value" fill={s.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar chart */}
              {stats.length >= 2 && (
                <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Perfil de rendimiento comparado</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#152038" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#4A6888', fontSize: 10 }} />
                      {stats.map(s => (
                        <Radar
                          key={s.id}
                          name={s.name}
                          dataKey={s.name}
                          stroke={s.color}
                          fill={s.color}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12, color: '#4A6888' }}
                      />
                      <Tooltip
                        contentStyle={{ background: '#060D1A', border: '1px solid #152038', borderRadius: 8, fontSize: 12 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-[#3A5070] text-center mt-2">
                    Valores normalizados 0-100 respecto al máximo del grupo
                  </p>
                </div>
              )}

              {/* Summary table */}
              <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#152038]">
                  <h3 className="text-sm font-bold text-white">Resumen completo</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#152038]">
                        <th className="px-5 py-3 text-left text-[10px] text-[#3A5070] uppercase tracking-wider">Atleta</th>
                        {(['sessions', 'distanceKm', 'avgSpeed', 'avgRpe', 'durationHours'] as const).map(m => (
                          <th key={m} className="px-4 py-3 text-right text-[10px] text-[#3A5070] uppercase tracking-wider">
                            {METRIC_LABEL[m]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map(s => (
                        <tr key={s.id} className="border-b border-[#152038]/50 hover:bg-[#060D1A]/50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                              <span className="font-semibold" style={{ color: s.color }}>{s.name}</span>
                            </div>
                          </td>
                          {(['sessions', 'distanceKm', 'avgSpeed', 'avgRpe', 'durationHours'] as const).map(m => (
                            <td key={m} className="px-4 py-3 text-right text-white font-mono text-xs">
                              {s[m] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
