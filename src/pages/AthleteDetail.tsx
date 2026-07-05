import { useParams, useNavigate } from 'react-router-dom'
import { useAthleteDetail } from '@/hooks/useCoach'
import { ArrowLeft, Activity, Map, Zap, Heart, Timer } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const SPORT_COLOR: Record<string, string> = {
  skating: '#00C6EF',
  cycling: '#FF7A00',
  gym: '#8FCF00',
}
const SPORT_ICON: Record<string, string> = {
  skating: '⛸️', cycling: '🚴', gym: '🏋️',
}

function fmt(sec: number | null) {
  if (!sec) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m`
}

export default function AthleteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, sessions, loading } = useAthleteDetail(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#4A6888]">
        Cargando perfil...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-[#4A6888]">Atleta no encontrado.</p>
        <button onClick={() => navigate('/coach')} className="text-[#00C6EF] text-sm hover:underline">
          ← Volver
        </button>
      </div>
    )
  }

  // Weekly volume for last 8 weeks
  const weeklyData: Record<string, { skating: number; cycling: number; gym: number }> = {}
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const key = `Sem ${8 - i}`
    weeklyData[key] = { skating: 0, cycling: 0, gym: 0 }
  }
  for (const s of sessions) {
    const d = new Date(s.started_at)
    const weeksAgo = Math.floor((now.getTime() - d.getTime()) / (7 * 86400000))
    if (weeksAgo >= 8) continue
    const key = `Sem ${8 - weeksAgo}`
    const sport = s.sport_type as keyof typeof weeklyData[string]
    if (weeklyData[key] && sport in weeklyData[key]) {
      weeklyData[key][sport] += s.duration_minutes ?? 0
    }
  }
  const chartData = Object.entries(weeklyData).map(([week, v]) => ({ week, ...v }))

  // Sport distribution
  const sportCount = { skating: 0, cycling: 0, gym: 0 }
  for (const s of sessions) {
    const sp = s.sport_type as keyof typeof sportCount
    if (sp in sportCount) sportCount[sp]++
  }
  const totalSessions = sessions.length

  // Averages
  const avgRpe = sessions.filter(s => s.rpe).reduce((acc, s) => acc + (s.rpe ?? 0), 0) / (sessions.filter(s => s.rpe).length || 1)
  const avgSpeed = sessions.filter(s => s.speed_avg).reduce((acc, s) => acc + (s.speed_avg ?? 0), 0) / (sessions.filter(s => s.speed_avg).length || 1)
  const totalKm = sessions.reduce((acc, s) => acc + (s.distance_km ?? 0), 0)
  const totalMin = sessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)

  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/coach')}
        className="flex items-center gap-2 text-sm text-[#4A6888] hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Volver al panel
      </button>

      {/* Profile header */}
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#00C6EF]/10 border border-[#00C6EF]/20 flex items-center justify-center text-xl font-black text-[#00C6EF]">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-black text-white">{profile.full_name ?? 'Sin nombre'}</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-[#152038] text-[#4A6888] capitalize">{profile.category ?? 'atleta'}</span>
          </div>
          <div className="text-sm text-[#4A6888] mt-1 space-x-4">
            {profile.skate_club && <span>🏟 {profile.skate_club}</span>}
            {profile.birth_date && <span>🎂 {new Date(profile.birth_date).getFullYear()}</span>}
            {profile.hr_max && <span>❤️ FC máx: {profile.hr_max} bpm</span>}
          </div>
        </div>
        {/* Sport pills */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(sportCount).filter(([, c]) => c > 0).map(([sport, count]) => (
            <div
              key={sport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: `${SPORT_COLOR[sport]}15`, color: SPORT_COLOR[sport], border: `1px solid ${SPORT_COLOR[sport]}30` }}
            >
              {SPORT_ICON[sport]} {count} ses.
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Activity, label: 'Sesiones', value: totalSessions, color: '#00C6EF' },
          { icon: Map, label: 'Km totales', value: `${totalKm.toFixed(1)} km`, color: '#FF7A00' },
          { icon: Timer, label: 'Tiempo total', value: fmt(totalMin * 60), color: '#8FCF00' },
          { icon: Zap, label: 'RPE promedio', value: sessions.filter(s=>s.rpe).length ? avgRpe.toFixed(1) : '—', color: '#A78BFA' },
        ].map(k => (
          <div key={k.label} className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <k.icon size={15} style={{ color: k.color }} />
              <span className="text-[10px] text-[#4A6888] uppercase tracking-wider font-semibold">{k.label}</span>
            </div>
            <div className="text-xl font-black text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Weekly volume chart */}
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Volumen semanal (minutos · últimas 8 semanas)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={12} barGap={2}>
            <XAxis dataKey="week" tick={{ fill: '#4A6888', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4A6888', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#060D1A', border: '1px solid #152038', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#aaa' }}
            />
            <Bar dataKey="skating" stackId="a" name="Patinaje" fill="#00C6EF" radius={[0,0,0,0]} />
            <Bar dataKey="cycling" stackId="a" name="Bicicleta" fill="#FF7A00" radius={[0,0,0,0]} />
            <Bar dataKey="gym" stackId="a" name="Gym" fill="#8FCF00" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent sessions */}
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Últimas sesiones</h3>
        {sessions.length === 0 ? (
          <p className="text-[#4A6888] text-sm text-center py-8">Sin sesiones registradas.</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 15).map(s => (
              <div
                key={s.id}
                className="flex items-center gap-3 bg-[#060D1A] border border-[#152038] rounded-xl px-4 py-3"
              >
                <span className="text-lg">{SPORT_ICON[s.sport_type] ?? '🏅'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white capitalize">{s.sport_type}</span>
                    {s.training_type && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#152038] text-[#4A6888] capitalize">
                        {s.training_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#3A5070] mt-0.5">
                    {new Date(s.started_at).toLocaleDateString('es', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  {s.distance_km && <div className="text-xs font-mono text-[#00C6EF]">{s.distance_km.toFixed(1)} km</div>}
                  {s.duration_minutes && <div className="text-[10px] text-[#4A6888]">{fmt(s.duration_minutes * 60)}</div>}
                  {s.rpe && <div className="text-[10px] text-[#A78BFA]">RPE {s.rpe}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
