import { useAuth } from '@/hooks/useAuth'
import { useStats } from '@/hooks/useStats'
import { Activity, Flame, Clock, TrendingUp, Plus, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const SPORT_COLORS = {
  skating: { color: '#00C6EF', bg: 'rgba(0,198,239,0.10)', border: 'rgba(0,198,239,0.25)' },
  cycling: { color: '#FF7A00', bg: 'rgba(255,122,0,0.10)', border: 'rgba(255,122,0,0.25)' },
  gym:     { color: '#8FCF00', bg: 'rgba(143,207,0,0.10)', border: 'rgba(143,207,0,0.25)' },
}

const TRAINING_TYPES = [
  { key: 'strength_plyo', label: 'Fuerza y Pliometría', icon: '💪', color: '#E84A5F' },
  { key: 'dry_technique', label: 'Técnico en Seco',     icon: '🪞', color: '#F5A623' },
  { key: 'endurance',     label: 'Resistencia',         icon: '🔄', color: '#00C48C' },
  { key: 'sprint_start',  label: 'Salidas y Sprint',    icon: '⚡', color: '#00C6EF' },
  { key: 'flexibility',   label: 'Flexibilidad',        icon: '🧘', color: '#A78BFA' },
]

const SPORT_LABEL: Record<string, string> = {
  skating: '⛸️ Patinaje', cycling: '🚴 Bicicleta', gym: '🏋️ Gym',
}

const TRAINING_LABEL: Record<string, string> = {
  strength_plyo: '💪 Fuerza', dry_technique: '🪞 Técnico',
  endurance: '🔄 Resistencia', sprint_start: '⚡ Sprint', flexibility: '🧘 Flex',
}

function fmtDuration(min: number | null) {
  if (!min) return '—'
  if (min < 60) return `${min}m`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const stats = useStats()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Atleta'

  const kpis = [
    { label: 'Sesiones este mes', value: stats.loading ? '…' : String(stats.month.sessions),
      icon: Activity, color: '#00C6EF', sub: 'patinaje + bici + gym' },
    { label: 'Km totales', value: stats.loading ? '…' : `${Math.round(stats.month.distanceKm * 10) / 10}`,
      icon: TrendingUp, color: '#FF7A00', sub: 'este mes' },
    { label: 'Calorías', value: stats.loading ? '…' : (stats.month.calories ? `${stats.month.calories}` : '—'),
      icon: Flame, color: '#E84A5F', sub: 'este mes' },
    { label: 'Tiempo activo', value: stats.loading ? '…' : fmtDuration(stats.month.activeMinutes),
      icon: Clock, color: '#8FCF00', sub: 'este mes' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#4A6888] text-sm font-medium">{greeting},</p>
          <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            {firstName} 👋
          </h1>
          <p className="text-[#3A5070] text-xs mt-1">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/sessions/new')}
          className="flex items-center gap-2 bg-[#00C6EF] hover:bg-[#00B5D8] text-[#060D1A] font-bold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-[#00C6EF]/20"
        >
          <Plus size={16} />
          Nueva sesión
        </button>
      </div>

      {/* NFC Banner */}
      <div className="bg-gradient-to-r from-[#00C6EF]/10 to-transparent border border-[#00C6EF]/20 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#00C6EF]/15 border border-[#00C6EF]/25 flex items-center justify-center text-xl flex-shrink-0">
          📡
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">Registro automático con NFC</div>
          <div className="text-xs text-[#4A6888]">Toca el casco al teléfono para iniciar sesión automáticamente</div>
        </div>
        <button onClick={() => navigate('/nfc')} className="text-[#00C6EF] text-xs font-bold hover:underline flex-shrink-0">
          Configurar →
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A5070]">{kpi.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
                <kpi.icon size={14} style={{ color: kpi.color }} />
              </div>
            </div>
            <div className="text-2xl font-black" style={{ color: kpi.color, fontFamily: 'Consolas, monospace' }}>
              {kpi.value}
            </div>
            <div className="text-[10px] text-[#3A5070] mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#3A5070] mb-4">
          Minutos por día — últimos 7 días
        </h2>
        {stats.loading ? (
          <div className="h-28 flex items-center justify-center">
            <span className="text-[#3A5070] text-xs">Cargando...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={stats.weekPoints} barSize={10} barGap={2} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: '#3A5070', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#0D1A2E', border: '1px solid #152038', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#fff' }}
                formatter={(v: number, name: string) => [
                  `${v}m`,
                  name === 'skating' ? '⛸️ Patinaje' : name === 'cycling' ? '🚴 Bicicleta' : '🏋️ Gym',
                ]}
              />
              <Bar dataKey="skating" stackId="a" fill="#00C6EF" />
              <Bar dataKey="cycling" stackId="a" fill="#FF7A00" />
              <Bar dataKey="gym"     stackId="a" fill="#8FCF00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-1">
          {[['#00C6EF','Patinaje'],['#FF7A00','Bicicleta'],['#8FCF00','Gym']].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: c }} />
              <span className="text-[10px] text-[#3A5070]">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sports this month */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#3A5070] mb-3">Deportes este mes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['skating','cycling','gym'] as const).map(sport => {
            const c = SPORT_COLORS[sport]
            const meta = {
              skating: { icon: '⛸️', label: 'Patinaje',  sub: 'Velocista · Fondista' },
              cycling: { icon: '🚴', label: 'Bicicleta', sub: 'Rutas GPS · Splits' },
              gym:     { icon: '🏋️', label: 'Gym',       sub: 'Fuerza complementaria' },
            }[sport]
            return (
              <div
                key={sport}
                className="bg-[#0D1A2E] border rounded-xl p-4 cursor-pointer hover:scale-[1.01] transition-transform"
                style={{ borderColor: c.border }}
                onClick={() => navigate(`/sessions?sport=${sport}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl"
                       style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    {meta.icon}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{meta.label}</div>
                    <div className="text-[10px] text-[#3A5070]">{meta.sub}</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black" style={{ color: c.color, fontFamily: 'Consolas, monospace' }}>
                    {stats.loading ? '…' : stats.month.bySport[sport]}
                  </span>
                  <span className="text-[11px] text-[#3A5070]">sesiones este mes</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Training types */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#3A5070] mb-3">
          Tipos de entrenamiento — Patinaje
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {TRAINING_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => navigate(`/sessions/new?training_type=${t.key}`)}
              className="bg-[#0D1A2E] border border-[#152038] hover:border-[#1E3050] rounded-xl p-3 text-left transition-all hover:scale-[1.02] group"
            >
              <div className="text-xl mb-2">{t.icon}</div>
              <div className="text-[11px] font-bold text-white leading-tight">{t.label}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ color: t.color }}>
                Registrar →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#3A5070]">Últimas sesiones</h2>
          <button onClick={() => navigate('/sessions')} className="text-xs text-[#00C6EF] hover:underline font-semibold">
            Ver todas →
          </button>
        </div>

        {stats.loading ? (
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-8 text-center">
            <span className="text-3xl animate-pulse">⛸️</span>
          </div>
        ) : stats.recentSessions.length === 0 ? (
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-8 text-center">
            <div className="text-3xl mb-2">🏁</div>
            <div className="text-sm font-semibold text-white mb-1">Sin sesiones aún</div>
            <div className="text-xs text-[#3A5070] mb-4">
              Toca el casco o presiona "Nueva sesión" para registrar tu primer entrenamiento
            </div>
            <button
              onClick={() => navigate('/sessions/new')}
              className="bg-[#00C6EF]/10 border border-[#00C6EF]/25 text-[#00C6EF] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#00C6EF]/20 transition-colors"
            >
              + Registrar primera sesión
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentSessions.map(s => {
              const c = SPORT_COLORS[s.sport_type as keyof typeof SPORT_COLORS] ?? SPORT_COLORS.skating
              return (
                <div
                  key={s.id}
                  className="bg-[#0D1A2E] border border-[#152038] hover:border-[#1E3050] rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors"
                  onClick={() => navigate(`/sessions/${s.id}`)}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                       style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    {s.sport_type === 'skating' ? '⛸️' : s.sport_type === 'cycling' ? '🚴' : '🏋️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">
                        {SPORT_LABEL[s.sport_type] ?? s.sport_type}
                      </span>
                      {s.training_type && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: `${c.color}18`, color: c.color }}>
                          {TRAINING_LABEL[s.training_type] ?? s.training_type}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#3A5070] mt-0.5">
                      {fmtDate(s.started_at)}
                      {s.duration_minutes ? ` · ${fmtDuration(s.duration_minutes)}` : ''}
                      {s.distance_km ? ` · ${s.distance_km} km` : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.calories ? (
                      <div className="text-xs font-bold" style={{ color: '#E84A5F' }}>{s.calories} kcal</div>
                    ) : null}
                    <ChevronRight size={14} className="text-[#3A5070] ml-auto mt-1" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Lifetime totals */}
      {!stats.loading && stats.totalSessions > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-white" style={{ fontFamily: 'Consolas, monospace' }}>
              {stats.totalSessions}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#3A5070] mt-1">sesiones totales</div>
          </div>
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-[#FF7A00]" style={{ fontFamily: 'Consolas, monospace' }}>
              {stats.totalKm}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#3A5070] mt-1">km totales acumulados</div>
          </div>
        </div>
      )}

    </div>
  )
}
