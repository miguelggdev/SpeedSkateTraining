import { useState } from 'react'
import { X } from 'lucide-react'
import { AthleteWithStats, TrainingPlan } from '@/hooks/useCoach'

interface Props {
  athletes: AthleteWithStats[]
  preselectedAthleteId?: string | null
  onClose: () => void
  onSave: (plan: Omit<TrainingPlan, 'id' | 'created_at' | 'coach_id'>) => void
}

const SPORTS = [
  { value: 'skating', label: '⛸️ Patinaje' },
  { value: 'cycling', label: '🚴 Bicicleta' },
  { value: 'gym',     label: '🏋️ Gym' },
]

export default function PlanModal({ athletes, preselectedAthleteId, onClose, onSave }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    athlete_id: preselectedAthleteId ?? (athletes[0]?.id ?? ''),
    title: '',
    description: '',
    sport_type: 'skating',
    weeks: 4,
    sessions_per_week: 3,
    start_date: today,
    end_date: '',
    status: 'draft' as TrainingPlan['status'],
    notes: '',
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => {
      const updated = { ...prev, [k]: v }
      if (k === 'start_date' || k === 'weeks') {
        const start = new Date(k === 'start_date' ? String(v) : prev.start_date)
        start.setDate(start.getDate() + (k === 'weeks' ? Number(v) : prev.weeks) * 7)
        updated.end_date = start.toISOString().split('T')[0]
      }
      return updated
    })
  }

  // Compute end_date on initial render
  if (!form.end_date) {
    const start = new Date(today)
    start.setDate(start.getDate() + form.weeks * 7)
    form.end_date = start.toISOString().split('T')[0]
  }

  function handleSave() {
    if (!form.title || !form.athlete_id) return
    onSave({
      athlete_id: form.athlete_id,
      title: form.title,
      description: form.description || null,
      sport_type: form.sport_type,
      weeks: form.weeks,
      sessions_per_week: form.sessions_per_week,
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
      notes: form.notes || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#152038]">
          <h2 className="font-bold text-white">Nuevo plan de entrenamiento</h2>
          <button onClick={onClose} className="text-[#4A6888] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Athlete */}
          <div>
            <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Atleta</label>
            <select
              value={form.athlete_id}
              onChange={e => set('athlete_id', e.target.value)}
              className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
            >
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.full_name ?? a.id.slice(0, 8)}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Título del plan</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ej: Preparación temporada velocidad"
              className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
            />
          </div>

          {/* Sport */}
          <div>
            <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Deporte</label>
            <div className="flex gap-2 mt-1.5">
              {SPORTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => set('sport_type', s.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    form.sport_type === s.value
                      ? 'bg-[#00C6EF]/10 border-[#00C6EF]/30 text-[#00C6EF]'
                      : 'bg-[#060D1A] border-[#152038] text-[#4A6888] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weeks + sessions/week */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Semanas</label>
              <input
                type="number" min={1} max={52}
                value={form.weeks}
                onChange={e => set('weeks', Number(e.target.value))}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Sesiones / semana</label>
              <input
                type="number" min={1} max={14}
                value={form.sessions_per_week}
                onChange={e => set('sessions_per_week', Number(e.target.value))}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Inicio</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Fin (calculado)</label>
              <input
                type="date"
                value={form.end_date}
                readOnly
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-[#4A6888] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Objetivos, fases, metodología..."
              className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50 resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Estado inicial</label>
            <div className="flex gap-2 mt-1.5">
              {(['draft', 'active'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => set('status', s)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                    form.status === s
                      ? 'bg-[#00C6EF]/10 border-[#00C6EF]/30 text-[#00C6EF]'
                      : 'bg-[#060D1A] border-[#152038] text-[#4A6888] hover:text-white'
                  }`}
                >
                  {s === 'draft' ? 'Borrador' : 'Activo'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#152038]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#152038] text-sm text-[#4A6888] hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title || !form.athlete_id}
            className="flex-1 py-2.5 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Crear plan
          </button>
        </div>
      </div>
    </div>
  )
}
