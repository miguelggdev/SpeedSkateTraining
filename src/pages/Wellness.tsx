import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useWellness } from '@/hooks/useWellness'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Heart, Moon, Droplets, Smile, Zap, Activity, Save } from 'lucide-react'
import { toast } from 'sonner'

const METRICS = [
  { key: 'sleep_quality',     label: 'Sueño',          icon: Moon,      color: '#A78BFA' },
  { key: 'fatigue',           label: 'Fatiga',          icon: Zap,       color: '#F59E0B' },
  { key: 'hydration',         label: 'Hidratación',     icon: Droplets,  color: '#00C6EF' },
  { key: 'mood',              label: 'Ánimo',           icon: Smile,     color: '#8FCF00' },
  { key: 'stress',            label: 'Estrés',          icon: Activity,  color: '#E84A5F' },
  { key: 'muscle_soreness',   label: 'Dolor muscular',  icon: Heart,     color: '#FF7A00' },
] as const

type MetricKey = typeof METRICS[number]['key']

const EMOJI_SCALE: Record<number, string> = { 1: '😫', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }

function ScaleInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-xl text-lg transition-all border ${
            value === v
              ? 'bg-[#00C6EF]/15 border-[#00C6EF]/40 scale-105'
              : 'bg-[#060D1A] border-[#152038] opacity-50 hover:opacity-80'
          }`}
        >
          {EMOJI_SCALE[v]}
        </button>
      ))}
    </div>
  )
}

export default function Wellness() {
  const { user } = useAuth()
  const { logs, today, loading, upsertLog } = useWellness(user?.id)
  const todayStr = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    log_date: todayStr,
    sleep_hours: today?.sleep_hours ?? 7,
    sleep_quality: today?.sleep_quality ?? 3,
    fatigue: today?.fatigue ?? 3,
    hydration: today?.hydration ?? 3,
    mood: today?.mood ?? 3,
    stress: today?.stress ?? 3,
    muscle_soreness: today?.muscle_soreness ?? 1,
    resting_hr: today?.resting_hr ?? '',
    weight_kg: today?.weight_kg ?? '',
    notes: today?.notes ?? '',
  })

  const [saving, setSaving] = useState(false)

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    const { error } = await upsertLog({
      ...form,
      resting_hr: form.resting_hr ? Number(form.resting_hr) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      notes: form.notes || null,
    } as any)
    setSaving(false)
    if (error) toast.error('Error al guardar')
    else toast.success('Bienestar registrado ✓')
  }

  // Chart data — last 14 days
  const chartData = logs.slice(0, 14).reverse().map(l => ({
    date: new Date(l.log_date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
    Ánimo: l.mood,
    Fatiga: l.fatigue,
    Sueño: l.sleep_quality,
    Hidratación: l.hydration,
  }))

  // Wellness score today
  const score = today
    ? Math.round(((today.mood ?? 3) + (6 - (today.fatigue ?? 3)) + (today.sleep_quality ?? 3) + (today.hydration ?? 3)) / 4 * 20)
    : null

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Bienestar Diario</h1>
          <p className="text-sm text-[#4A6888] mt-0.5">Registra cómo te sientes cada día</p>
        </div>
        {score !== null && (
          <div className="text-center bg-[#0D1A2E] border border-[#152038] rounded-2xl px-5 py-3">
            <div className="text-3xl font-black" style={{
              color: score >= 70 ? '#8FCF00' : score >= 40 ? '#F59E0B' : '#E84A5F'
            }}>{score}</div>
            <div className="text-[10px] text-[#4A6888] uppercase tracking-wider">Score hoy</div>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Registro de hoy</h2>
          <input
            type="date"
            value={form.log_date}
            onChange={e => set('log_date', e.target.value)}
            className="bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00C6EF]/50"
          />
        </div>

        {METRICS.map(m => (
          <div key={m.key}>
            <div className="flex items-center gap-2 mb-2">
              <m.icon size={14} style={{ color: m.color }} />
              <span className="text-xs font-semibold text-white">{m.label}</span>
              <span className="ml-auto text-xs text-[#4A6888]">
                {EMOJI_SCALE[form[m.key] as number]} {form[m.key]}/5
              </span>
            </div>
            <ScaleInput
              value={form[m.key] as number}
              onChange={v => set(m.key, v)}
            />
          </div>
        ))}

        {/* Sleep hours */}
        <div>
          <label className="text-xs font-semibold text-white flex items-center gap-2 mb-2">
            <Moon size={14} className="text-[#A78BFA]" /> Horas de sueño
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={3} max={12} step={0.5}
              value={form.sleep_hours}
              onChange={e => set('sleep_hours', Number(e.target.value))}
              className="flex-1 accent-[#A78BFA]"
            />
            <span className="text-sm font-mono text-white w-12 text-right">{form.sleep_hours}h</span>
          </div>
        </div>

        {/* Physical */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">FC en reposo (bpm)</label>
            <input
              type="number" min={30} max={120}
              value={form.resting_hr}
              onChange={e => set('resting_hr', e.target.value as any)}
              placeholder="—"
              className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Peso (kg)</label>
            <input
              type="number" step="0.1" min={20} max={200}
              value={form.weight_kg}
              onChange={e => set('weight_kg', e.target.value as any)}
              placeholder="—"
              className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Notas</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            placeholder="¿Algo especial hoy? (lesión, enfermedad, viaje...)"
            className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90 transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar registro'}
        </button>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Tendencia (14 días)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#4A6888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} tick={{ fill: '#4A6888', fontSize: 10 }} axisLine={false} tickLine={false} ticks={[1,2,3,4,5]} />
              <Tooltip contentStyle={{ background: '#060D1A', border: '1px solid #152038', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#4A6888' }} />
              <Line type="monotone" dataKey="Ánimo"       stroke="#8FCF00" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Fatiga"      stroke="#F59E0B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Sueño"       stroke="#A78BFA" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Hidratación" stroke="#00C6EF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#152038]">
            <h3 className="text-sm font-bold text-white">Historial reciente</h3>
          </div>
          <div className="divide-y divide-[#152038]">
            {logs.slice(0, 7).map(l => {
              const s = Math.round(((l.mood ?? 3) + (6 - (l.fatigue ?? 3)) + (l.sleep_quality ?? 3) + (l.hydration ?? 3)) / 4 * 20)
              return (
                <div key={l.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="text-xs text-[#4A6888] w-24">
                    {new Date(l.log_date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex gap-3 flex-1 text-sm">
                    {l.sleep_quality && <span title="Sueño">😴 {l.sleep_quality}</span>}
                    {l.mood         && <span title="Ánimo">{EMOJI_SCALE[l.mood]}</span>}
                    {l.fatigue      && <span title="Fatiga">⚡{l.fatigue}</span>}
                    {l.hydration    && <span title="Hidratación">💧{l.hydration}</span>}
                    {l.sleep_hours  && <span className="text-[#4A6888] text-xs">{l.sleep_hours}h sueño</span>}
                  </div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: s >= 70 ? '#8FCF00' : s >= 40 ? '#F59E0B' : '#E84A5F' }}
                  >
                    {s}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
