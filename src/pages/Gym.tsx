import { useState } from 'react'
import { useGym } from '@/hooks/useGym'
import { Dumbbell, Plus, ChevronDown, ChevronUp, X, Flame } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORY_LABELS: Record<string, string> = {
  legs: 'Piernas', core: 'Core', upper: 'Tren Superior',
  plyometric: 'Pliometría', flexibility: 'Flexibilidad', cardio: 'Cardio'
}

const CATEGORY_COLORS: Record<string, string> = {
  legs: '#00C6EF', core: '#8FCF00', upper: '#FF7A00',
  plyometric: '#A855F7', flexibility: '#F59E0B', cardio: '#E84A5F'
}

export default function Gym() {
  const { sessions, exercises, loading, createSession, addSet, deleteSession } = useGym()
  const [showNew, setShowNew] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAddSet, setShowAddSet] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState('all')

  const [form, setForm] = useState({ session_date: new Date().toISOString().slice(0, 10), duration_min: '', notes: '', rpe: '' })
  const [newSetForm, setNewSetForm] = useState({ exercise_id: '', set_number: 1, reps: '', weight_kg: '', duration_s: '', notes: '' })

  const categories = ['all', ...Array.from(new Set(exercises.map(e => e.category)))]
  const filteredExercises = catFilter === 'all' ? exercises : exercises.filter(e => e.category === catFilter)

  async function handleCreateSession() {
    try {
      await createSession({
        session_date: form.session_date,
        duration_min: form.duration_min ? Number(form.duration_min) : undefined,
        notes: form.notes || undefined,
        rpe: form.rpe ? Number(form.rpe) : undefined,
      })
      toast.success('Sesión creada')
      setShowNew(false)
      setForm({ session_date: new Date().toISOString().slice(0, 10), duration_min: '', notes: '', rpe: '' })
    } catch { toast.error('Error al crear sesión') }
  }

  async function handleAddSet(sessionId: string) {
    if (!newSetForm.exercise_id) { toast.error('Selecciona un ejercicio'); return }
    try {
      await addSet(sessionId, {
        exercise_id: newSetForm.exercise_id,
        set_number: newSetForm.set_number,
        reps: newSetForm.reps ? Number(newSetForm.reps) : null,
        weight_kg: newSetForm.weight_kg ? Number(newSetForm.weight_kg) : null,
        duration_s: newSetForm.duration_s ? Number(newSetForm.duration_s) : null,
        notes: newSetForm.notes || null,
      })
      toast.success('Serie registrada')
      setNewSetForm(s => ({ ...s, set_number: s.set_number + 1, reps: '', weight_kg: '', duration_s: '' }))
    } catch { toast.error('Error al registrar serie') }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Dumbbell size={24} className="text-[#8FCF00]" /> Gym
          </h1>
          <p className="text-sm text-[#4A6888] mt-0.5">Registro de fuerza para patinadores</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#8FCF00] text-black rounded-lg text-sm font-bold hover:bg-[#7AB800] transition"
        >
          <Plus size={16} /> Nueva sesión
        </button>
      </div>

      {/* Exercise library */}
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#3A5070] mb-3">Biblioteca de ejercicios</div>
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${catFilter === c ? 'bg-[#00C6EF]/20 text-[#00C6EF] border border-[#00C6EF]/30' : 'bg-[#060D1A] text-[#4A6888] border border-[#152038] hover:border-[#00C6EF]/20'}`}
            >
              {c === 'all' ? 'Todos' : CATEGORY_LABELS[c] ?? c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredExercises.map(ex => (
            <div key={ex.id} className="bg-[#060D1A] border border-[#152038] rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-white">{ex.name}</span>
                {ex.is_skate_specific && (
                  <span className="text-[10px] bg-[#00C6EF]/10 text-[#00C6EF] border border-[#00C6EF]/20 px-1.5 py-0.5 rounded font-semibold shrink-0">⛸️ Skate</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-semibold"
                  style={{ background: `${CATEGORY_COLORS[ex.category]}20`, color: CATEGORY_COLORS[ex.category] }}
                >
                  {CATEGORY_LABELS[ex.category] ?? ex.category}
                </span>
                {ex.muscle_group && <span className="text-[10px] text-[#3A5070]">{ex.muscle_group}</span>}
              </div>
              {ex.description && <p className="text-[11px] text-[#4A6888] mt-1">{ex.description}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#3A5070]">Sesiones recientes</div>
        {loading && <div className="text-[#4A6888] text-sm">Cargando...</div>}
        {!loading && sessions.length === 0 && (
          <div className="text-center text-[#4A6888] py-12 bg-[#0D1A2E] border border-[#152038] rounded-xl">
            <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay sesiones de gym registradas</p>
            <button onClick={() => setShowNew(true)} className="mt-3 text-[#8FCF00] text-sm hover:underline">Crear primera sesión →</button>
          </div>
        )}
        {sessions.map(s => (
          <div key={s.id} className="bg-[#0D1A2E] border border-[#152038] rounded-xl overflow-hidden">
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/2"
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <div className="w-10 h-10 rounded-lg bg-[#8FCF00]/10 border border-[#8FCF00]/20 flex items-center justify-center">
                <Dumbbell size={18} className="text-[#8FCF00]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{new Date(s.session_date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  {s.duration_min && <span className="text-[11px] text-[#4A6888]">{s.duration_min} min</span>}
                  {s.rpe && (
                    <span className="text-[11px] flex items-center gap-1" style={{ color: s.rpe >= 8 ? '#E84A5F' : s.rpe >= 6 ? '#FF7A00' : '#8FCF00' }}>
                      <Flame size={10} /> RPE {s.rpe}
                    </span>
                  )}
                  <span className="text-[11px] text-[#3A5070]">{(s.sets ?? []).length} series</span>
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteSession(s.id) }} className="text-[#3A5070] hover:text-[#E84A5F] p-1"><X size={14} /></button>
              {expanded === s.id ? <ChevronUp size={16} className="text-[#3A5070]" /> : <ChevronDown size={16} className="text-[#3A5070]" />}
            </div>

            {expanded === s.id && (
              <div className="border-t border-[#152038] p-4 space-y-3">
                {s.notes && <p className="text-sm text-[#5A76A0] italic">{s.notes}</p>}

                {(s.sets ?? []).length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#3A5070] border-b border-[#152038]">
                          <th className="text-left py-1.5 pr-4">Ejercicio</th>
                          <th className="text-center px-2">Serie</th>
                          <th className="text-center px-2">Reps</th>
                          <th className="text-center px-2">Kg</th>
                          <th className="text-center px-2">Seg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(s.sets ?? []).map(set => (
                          <tr key={set.id} className="border-b border-[#0D1A2E] hover:bg-white/2">
                            <td className="py-1.5 pr-4 text-white font-medium">{set.exercise?.name ?? '—'}</td>
                            <td className="text-center px-2 text-[#4A6888]">{set.set_number}</td>
                            <td className="text-center px-2 text-[#00C6EF]">{set.reps ?? '—'}</td>
                            <td className="text-center px-2 text-[#8FCF00]">{set.weight_kg ?? '—'}</td>
                            <td className="text-center px-2 text-[#FF7A00]">{set.duration_s ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={() => setShowAddSet(showAddSet === s.id ? null : s.id)}
                  className="flex items-center gap-2 text-sm text-[#8FCF00] hover:text-[#7AB800]"
                >
                  <Plus size={14} /> Agregar serie
                </button>

                {showAddSet === s.id && (
                  <div className="bg-[#060D1A] border border-[#152038] rounded-lg p-3 space-y-3">
                    <select
                      value={newSetForm.exercise_id}
                      onChange={e => setNewSetForm(f => ({ ...f, exercise_id: e.target.value }))}
                      className="w-full bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">-- Ejercicio --</option>
                      {exercises.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-[#3A5070] uppercase">Reps</label>
                        <input type="number" value={newSetForm.reps} onChange={e => setNewSetForm(f => ({ ...f, reps: e.target.value }))}
                          className="w-full bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-0.5" placeholder="12" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#3A5070] uppercase">Peso (kg)</label>
                        <input type="number" step="0.5" value={newSetForm.weight_kg} onChange={e => setNewSetForm(f => ({ ...f, weight_kg: e.target.value }))}
                          className="w-full bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-0.5" placeholder="60" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#3A5070] uppercase">Seg (tiempo)</label>
                        <input type="number" value={newSetForm.duration_s} onChange={e => setNewSetForm(f => ({ ...f, duration_s: e.target.value }))}
                          className="w-full bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-0.5" placeholder="30" />
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddSet(s.id)}
                      className="w-full py-2 bg-[#8FCF00] text-black font-bold rounded-lg text-sm hover:bg-[#7AB800] transition"
                    >
                      Registrar serie {newSetForm.set_number}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New session modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Nueva sesión de gym</h2>
              <button onClick={() => setShowNew(false)} className="text-[#3A5070] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Fecha</label>
                <input type="date" value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
                  className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Duración (min)</label>
                  <input type="number" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}
                    className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1" placeholder="60" />
                </div>
                <div>
                  <label className="text-[11px] text-[#3A5070] uppercase font-semibold">RPE (1-10)</label>
                  <input type="number" min="1" max="10" value={form.rpe} onChange={e => setForm(f => ({ ...f, rpe: e.target.value }))}
                    className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1" placeholder="7" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1 resize-none" placeholder="Observaciones..." />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 border border-[#152038] rounded-lg text-sm text-[#4A6888] hover:text-white">Cancelar</button>
              <button onClick={handleCreateSession} className="flex-1 py-2.5 bg-[#8FCF00] text-black font-bold rounded-lg text-sm hover:bg-[#7AB800] transition">Crear sesión</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
