import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCoach } from '@/hooks/useCoach'
import {
  Users, Activity, TrendingUp, Plus, ChevronRight,
  CheckCircle, Clock, XCircle, ClipboardList, Search,
  Star, Zap
} from 'lucide-react'
import PlanModal from '@/components/PlanModal'
import { TrainingPlan } from '@/hooks/useCoach'

const SPORT_COLOR: Record<string, string> = {
  skating: '#00C6EF',
  cycling: '#FF7A00',
  gym: '#8FCF00',
}
const SPORT_ICON: Record<string, string> = {
  skating: '⛸️', cycling: '🚴', gym: '🏋️',
}
const STATUS_STYLE: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  active:    { color: '#8FCF00', icon: CheckCircle, label: 'Activo' },
  draft:     { color: '#F59E0B', icon: Clock,        label: 'Borrador' },
  completed: { color: '#00C6EF', icon: CheckCircle,  label: 'Completado' },
  cancelled: { color: '#E84A5F', icon: XCircle,      label: 'Cancelado' },
}

function daysSince(iso: string | null) {
  if (!iso) return null
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'hoy'
  if (d === 1) return 'ayer'
  return `hace ${d} días`
}

export default function CoachDashboard() {
  const { profile } = useAuth()
  const { athletes, plans, loading, createPlan, updatePlanStatus, deletePlan } = useCoach(profile?.id)
  const navigate = useNavigate()
  const [tab, setTab] = useState<'athletes' | 'plans'>('athletes')
  const [search, setSearch] = useState('')
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null)

  const filtered = athletes.filter(a =>
    !search || a.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const activePlans  = plans.filter(p => p.status === 'active').length
  const totalSessions = athletes.reduce((s, a) => s + a.session_count, 0)

  async function handleCreatePlan(plan: Omit<TrainingPlan, 'id' | 'created_at' | 'coach_id'>) {
    await createPlan(plan)
    setShowPlanModal(false)
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Panel del Entrenador</h1>
          <p className="text-sm text-[#4A6888] mt-0.5">
            {athletes.length} atleta{athletes.length !== 1 ? 's' : ''} bajo tu dirección
          </p>
        </div>
        <button
          onClick={() => setShowPlanModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90 transition-colors"
        >
          <Plus size={16} /> Nuevo plan
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Atletas', value: athletes.length, icon: Users, color: '#00C6EF' },
          { label: 'Planes activos', value: activePlans, icon: ClipboardList, color: '#8FCF00' },
          { label: 'Sesiones totales', value: totalSessions, icon: Activity, color: '#FF7A00' },
          { label: 'Planes creados', value: plans.length, icon: TrendingUp, color: '#A78BFA' },
        ].map(k => (
          <div key={k.label} className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <k.icon size={16} style={{ color: k.color }} />
              <span className="text-[11px] text-[#4A6888] uppercase tracking-wider font-semibold">{k.label}</span>
            </div>
            <div className="text-2xl font-black text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#060D1A] border border-[#152038] rounded-xl p-1 w-fit">
        {(['athletes', 'plans'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-[#00C6EF] text-black' : 'text-[#4A6888] hover:text-white'
            }`}
          >
            {t === 'athletes' ? `Atletas (${athletes.length})` : `Planes (${plans.length})`}
          </button>
        ))}
      </div>

      {/* Athletes tab */}
      {tab === 'athletes' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6888]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar atleta..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#0D1A2E] border border-[#152038] rounded-xl text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#4A6888]">Cargando atletas...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-3xl">👥</div>
              <p className="text-[#4A6888] text-sm">
                {search ? 'Sin resultados' : 'Aún no tienes atletas asignados.'}
              </p>
              {!search && (
                <p className="text-[#3A5070] text-xs">
                  Los atletas deben configurar su coach_id en su perfil.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map(a => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/coach/athlete/${a.id}`)}
                  className="bg-[#0D1A2E] border border-[#152038] hover:border-[#00C6EF]/30 rounded-2xl p-5 text-left transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#00C6EF]/10 border border-[#00C6EF]/20 flex items-center justify-center text-sm font-bold text-[#00C6EF]">
                        {a.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm truncate">{a.full_name ?? 'Sin nombre'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#152038] text-[#4A6888] capitalize">{a.category ?? a.role}</span>
                      </div>
                      <div className="text-[11px] text-[#3A5070] mt-0.5">
                        Última sesión: {daysSince(a.last_session_at) ?? 'nunca'}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#3A5070] group-hover:text-[#00C6EF] transition-colors mt-0.5" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      { label: 'Sesiones', value: a.session_count },
                      { label: 'Km totales', value: a.total_distance_km },
                      { label: 'RPE prom.', value: a.avg_rpe ?? '—' },
                    ].map(s => (
                      <div key={s.label} className="bg-[#060D1A] rounded-xl p-2.5 text-center">
                        <div className="text-base font-black text-white">{s.value}</div>
                        <div className="text-[9px] text-[#3A5070] uppercase tracking-wide mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Plans for this athlete */}
                  {plans.filter(p => p.athlete_id === a.id && p.status === 'active').map(p => (
                    <div key={p.id} className="mt-3 flex items-center gap-2 bg-[#8FCF00]/10 border border-[#8FCF00]/20 rounded-lg px-3 py-2">
                      <Zap size={12} className="text-[#8FCF00]" />
                      <span className="text-[11px] text-[#8FCF00] font-semibold truncate">{p.title}</span>
                      <span className="ml-auto text-[10px] text-[#5A7040]">{p.weeks} sem.</span>
                    </div>
                  ))}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plans tab */}
      {tab === 'plans' && (
        <div className="space-y-3">
          {plans.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-3xl">📋</div>
              <p className="text-[#4A6888] text-sm">Sin planes creados aún.</p>
              <button
                onClick={() => setShowPlanModal(true)}
                className="text-[#00C6EF] text-sm hover:underline"
              >
                Crear primer plan →
              </button>
            </div>
          ) : (
            plans.map(plan => {
              const ss = STATUS_STYLE[plan.status]
              const athlete = athletes.find(a => a.id === plan.athlete_id)
              return (
                <div key={plan.id} className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{plan.title}</span>
                        <span className="text-lg">{SPORT_ICON[plan.sport_type] ?? '🏅'}</span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${ss.color}20`, color: ss.color }}
                        >
                          {ss.label}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-xs text-[#4A6888] mt-1">{plan.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-[#3A5070]">
                        <span>👤 {athlete?.full_name ?? plan.athlete_id.slice(0, 8)}</span>
                        <span>📅 {plan.weeks} semanas</span>
                        <span>🗓 {plan.sessions_per_week}x/sem</span>
                        <span>{new Date(plan.start_date).toLocaleDateString('es')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.status === 'draft' && (
                        <button
                          onClick={() => updatePlanStatus(plan.id, 'active')}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-[#8FCF00]/10 text-[#8FCF00] hover:bg-[#8FCF00]/20 transition-colors font-semibold"
                        >
                          Activar
                        </button>
                      )}
                      {plan.status === 'active' && (
                        <button
                          onClick={() => updatePlanStatus(plan.id, 'completed')}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-[#00C6EF]/10 text-[#00C6EF] hover:bg-[#00C6EF]/20 transition-colors font-semibold"
                        >
                          Completar
                        </button>
                      )}
                      <button
                        onClick={() => deletePlan(plan.id)}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-[#E84A5F]/10 text-[#E84A5F] hover:bg-[#E84A5F]/20 transition-colors font-semibold"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {showPlanModal && (
        <PlanModal
          athletes={athletes}
          preselectedAthleteId={selectedAthlete}
          onClose={() => { setShowPlanModal(false); setSelectedAthlete(null) }}
          onSave={handleCreatePlan}
        />
      )}
    </div>
  )
}
