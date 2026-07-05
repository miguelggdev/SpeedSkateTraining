import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGoals, Goal } from '@/hooks/useGoals'
import { Plus, Target, X, CheckCircle, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const METRIC_LABEL: Record<Goal['metric'], string> = {
  sessions: 'Sesiones',
  distance_km: 'Kilómetros',
  duration_minutes: 'Minutos',
  calories: 'Calorías',
  points: 'Puntos',
}
const METRIC_UNIT: Record<Goal['metric'], string> = {
  sessions: 'ses.', distance_km: 'km', duration_minutes: 'min', calories: 'kcal', points: 'pts',
}
const PERIOD_LABEL: Record<Goal['period'], string> = {
  weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual', custom: 'Personalizado',
}
const STATUS_COLOR: Record<Goal['status'], string> = {
  active: '#00C6EF', completed: '#8FCF00', failed: '#E84A5F', cancelled: '#3A5070',
}
const SPORT_ICON: Record<string, string> = {
  skating: '⛸️', cycling: '🚴', gym: '🏋️', all: '🏅',
}

function GoalCard({ goal, onComplete, onDelete }: {
  goal: Goal
  onComplete: () => void
  onDelete: () => void
}) {
  const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
  const daysLeft = Math.ceil((new Date(goal.end_date).getTime() - Date.now()) / 86400000)
  const expired = daysLeft < 0 && goal.status === 'active'

  return (
    <div className={`bg-[#0D1A2E] border rounded-2xl p-5 transition-all ${
      goal.status === 'completed' ? 'border-[#8FCF00]/30' :
      goal.status === 'failed' || expired ? 'border-[#E84A5F]/20' :
      'border-[#152038]'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{SPORT_ICON[goal.sport_type ?? 'all']}</span>
          <div className="min-w-0">
            <div className="font-semibold text-white text-sm truncate">{goal.title}</div>
            <div className="text-[10px] text-[#3A5070] mt-0.5">
              {PERIOD_LABEL[goal.period]} · {METRIC_LABEL[goal.metric]}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
            style={{ background: `${STATUS_COLOR[goal.status]}20`, color: STATUS_COLOR[goal.status] }}
          >
            {goal.status === 'active' ? (expired ? 'Expirada' : 'Activa') : goal.status}
          </span>
          <button onClick={onDelete} className="text-[#3A5070] hover:text-[#E84A5F] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-white font-mono font-bold">
            {goal.current_value} / {goal.target_value} {METRIC_UNIT[goal.metric]}
          </span>
          <span style={{ color: STATUS_COLOR[goal.status] }}>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-[#060D1A] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: STATUS_COLOR[goal.status] }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-[#3A5070]">
          <span>{new Date(goal.start_date).toLocaleDateString('es', { day:'numeric', month:'short' })}</span>
          <span>{daysLeft > 0 ? `${daysLeft} días restantes` : daysLeft === 0 ? 'Vence hoy' : `Venció hace ${-daysLeft}d`}</span>
          <span>{new Date(goal.end_date).toLocaleDateString('es', { day:'numeric', month:'short' })}</span>
        </div>
      </div>

      {goal.status === 'active' && pct >= 100 && (
        <button
          onClick={onComplete}
          className="mt-3 w-full py-2 rounded-xl bg-[#8FCF00]/10 border border-[#8FCF00]/20 text-[#8FCF00] text-xs font-bold hover:bg-[#8FCF00]/20 transition-colors"
        >
          ✓ Marcar como completada
        </button>
      )}
    </div>
  )
}

const today = new Date().toISOString().split('T')[0]
function addDays(days: number) {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]
}

export default function Goals() {
  const { user } = useAuth()
  const { goals, allBadges, loading, createGoal, updateGoalStatus, deleteGoal } = useGoals(user?.id)
  const [tab, setTab] = useState<'goals' | 'badges'>('goals')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', sport_type: 'all', metric: 'sessions' as Goal['metric'],
    target_value: 10, period: 'monthly' as Goal['period'],
    start_date: today, end_date: addDays(30),
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleCreate() {
    if (!form.title) return
    const { error } = await createGoal(form)
    if (error) toast.error('Error al crear meta')
    else { toast.success('Meta creada ✓'); setShowForm(false) }
  }

  const active    = goals.filter(g => g.status === 'active')
  const done      = goals.filter(g => g.status === 'completed')
  const earnedCount = allBadges.filter(b => b.earned).length

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Metas y Logros</h1>
          <p className="text-sm text-[#4A6888] mt-0.5">{active.length} metas activas · {earnedCount} badges ganados</p>
        </div>
        {tab === 'goals' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90"
          >
            <Plus size={16} /> Nueva meta
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#060D1A] border border-[#152038] rounded-xl p-1 w-fit">
        {(['goals', 'badges'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-[#00C6EF] text-black' : 'text-[#4A6888] hover:text-white'
            }`}
          >
            {t === 'goals' ? `🎯 Metas (${goals.length})` : `🏆 Badges (${earnedCount}/${allBadges.length})`}
          </button>
        ))}
      </div>

      {/* Goals tab */}
      {tab === 'goals' && (
        <>
          {showForm && (
            <div className="bg-[#0D1A2E] border border-[#00C6EF]/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Nueva meta</h3>
                <button onClick={() => setShowForm(false)} className="text-[#4A6888] hover:text-white"><X size={18} /></button>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Título</label>
                <input
                  value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Ej: Correr 100km este mes"
                  className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Deporte</label>
                  <select
                    value={form.sport_type} onChange={e => set('sport_type', e.target.value)}
                    className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
                  >
                    {[['all','Todos'],['skating','Patinaje'],['cycling','Bicicleta'],['gym','Gym']].map(([v,l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Métrica</label>
                  <select
                    value={form.metric} onChange={e => set('metric', e.target.value as Goal['metric'])}
                    className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
                  >
                    {(Object.entries(METRIC_LABEL) as [Goal['metric'], string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">
                    Objetivo ({METRIC_UNIT[form.metric]})
                  </label>
                  <input
                    type="number" min={1} value={form.target_value}
                    onChange={e => set('target_value', Number(e.target.value))}
                    className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Período</label>
                  <select
                    value={form.period} onChange={e => set('period', e.target.value as Goal['period'])}
                    className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
                  >
                    {(Object.entries(PERIOD_LABEL) as [Goal['period'], string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Inicio</label>
                  <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                    className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Fin</label>
                  <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                    className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50" />
                </div>
              </div>

              <button
                onClick={handleCreate} disabled={!form.title}
                className="w-full py-3 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90 disabled:opacity-40"
              >
                Crear meta
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-[#4A6888]">Cargando metas...</div>
          ) : goals.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Target size={40} className="mx-auto text-[#152038]" />
              <p className="text-[#4A6888]">Sin metas creadas. ¡Define tu primer objetivo!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {active.length > 0 && (
                <>
                  <h3 className="text-xs font-bold text-[#4A6888] uppercase tracking-wider">Activas</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {active.map(g => (
                      <GoalCard key={g.id} goal={g}
                        onComplete={() => updateGoalStatus(g.id, 'completed')}
                        onDelete={() => { if (confirm('¿Eliminar meta?')) deleteGoal(g.id) }}
                      />
                    ))}
                  </div>
                </>
              )}
              {done.length > 0 && (
                <>
                  <h3 className="text-xs font-bold text-[#4A6888] uppercase tracking-wider mt-4">Completadas</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {done.map(g => (
                      <GoalCard key={g.id} goal={g}
                        onComplete={() => {}}
                        onDelete={() => { if (confirm('¿Eliminar meta?')) deleteGoal(g.id) }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Badges tab */}
      {tab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allBadges.map(b => (
            <div
              key={b.key}
              className={`bg-[#0D1A2E] border rounded-2xl p-4 text-center transition-all ${
                b.earned ? 'border-[#F59E0B]/30' : 'border-[#152038] opacity-50'
              }`}
            >
              <div className={`text-3xl mb-2 ${!b.earned ? 'grayscale' : ''}`}>{b.icon}</div>
              <div className="text-xs font-bold text-white">{b.title}</div>
              <div className="text-[10px] text-[#4A6888] mt-1">{b.desc}</div>
              {b.earned && (
                <div className="mt-2 text-[9px] text-[#F59E0B]">
                  {new Date(b.earned.earned_at).toLocaleDateString('es', { day:'numeric', month:'short', year:'numeric' })}
                </div>
              )}
              {!b.earned && (
                <div className="mt-2 text-[9px] text-[#3A5070]">Por ganar</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
