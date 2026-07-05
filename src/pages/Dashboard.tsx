import { useAuth } from '@/hooks/useAuth'
import { Activity, Flame, Zap, Clock, TrendingUp, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SPORT_COLORS = {
  skating: { color: '#00C6EF', bg: 'rgba(0,198,239,0.10)', border: 'rgba(0,198,239,0.25)' },
  cycling: { color: '#FF7A00', bg: 'rgba(255,122,0,0.10)', border: 'rgba(255,122,0,0.25)' },
  gym:     { color: '#8FCF00', bg: 'rgba(143,207,0,0.10)', border: 'rgba(143,207,0,0.25)' },
}

const TRAINING_TYPES = [
  { key: 'strength_plyo', label: 'Fuerza y Pliometría', icon: '💪', color: '#E84A5F' },
  { key: 'dry_technique', label: 'Técnico en Seco',    icon: '🪞', color: '#F5A623' },
  { key: 'endurance',     label: 'Resistencia',        icon: '🔄', color: '#00C48C' },
  { key: 'sprint_start',  label: 'Salidas y Sprint',   icon: '⚡', color: '#00C6EF' },
  { key: 'flexibility',   label: 'Flexibilidad',       icon: '🧘', color: '#A78BFA' },
]

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Atleta'

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
        <button
          onClick={() => navigate('/nfc')}
          className="text-[#00C6EF] text-xs font-bold hover:underline flex-shrink-0"
        >
          Configurar →
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Sesiones este mes', value: '—', icon: Activity, color: '#00C6EF', sub: 'patinaje + bici + gym' },
          { label: 'Km totales',        value: '—', icon: TrendingUp, color: '#FF7A00', sub: 'patinaje y bicicleta' },
          { label: 'Calorías',          value: '—', icon: Flame,     color: '#E84A5F', sub: 'este mes' },
          { label: 'Tiempo activo',     value: '—', icon: Clock,     color: '#8FCF00', sub: 'este mes' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A5070]">
                {kpi.label}
              </span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                   style={{ background: `${kpi.color}18` }}>
                <kpi.icon size={14} style={{ color: kpi.color }} />
              </div>
            </div>
            <div className="text-2xl font-black font-mono" style={{ color: kpi.color, fontFamily: 'Consolas, monospace' }}>
              {kpi.value}
            </div>
            <div className="text-[10px] text-[#3A5070] mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Sports summary */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#3A5070] mb-3">Deportes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([
            { sport: 'skating', icon: '⛸️', label: 'Patinaje', sub: 'Velocista · Fondista' },
            { sport: 'cycling', icon: '🚴', label: 'Bicicleta', sub: 'Rutas GPS · Splits' },
            { sport: 'gym',     icon: '🏋️', label: 'Gym',       sub: 'Fuerza complementaria' },
          ] as const).map(({ sport, icon, label, sub }) => {
            const c = SPORT_COLORS[sport]
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
                    {icon}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{label}</div>
                    <div className="text-[10px] text-[#3A5070]">{sub}</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono" style={{ color: c.color, fontFamily: 'Consolas, monospace' }}>
                    —
                  </span>
                  <span className="text-[11px] text-[#3A5070]">sesiones este mes</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Training types quick access */}
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
              <div
                className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: t.color }}
              >
                Registrar →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent sessions placeholder */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#3A5070]">Últimas sesiones</h2>
          <button onClick={() => navigate('/sessions')} className="text-xs text-[#00C6EF] hover:underline font-semibold">
            Ver todas →
          </button>
        </div>
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
      </div>

    </div>
  )
}
