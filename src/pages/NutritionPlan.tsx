import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Sparkles, Apple, Flame, Zap, Droplets, TrendingUp, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'https://api.skate.arkanatech.tech'

interface WeekStats {
  sessions: number
  totalKm: number
  avgRpe: number
  sports: { skating: number; cycling: number; gym: number }
}

function NutrientBar({ label, value, max, color, unit }: { label: string; value: number; max: number; color: string; unit: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#4A6888]">{label}</span>
        <span className="font-bold text-white">{value}{unit}</span>
      </div>
      <div className="h-2 bg-[#060D1A] border border-[#152038] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  )
}

const FALLBACK_PLANS: Record<string, string> = {
  low: `Plan de Nutrición - Día de Baja Carga\n\nDesayuno (7:00am)\nAvena con fruta fresca y miel\n2 huevos revueltos + yogur natural\n~450 kcal | 25g proteína\n\nAlmuerzo (12:00pm)\nArroz integral + pollo a la plancha + ensalada\n~600 kcal | 45g proteína\n\nMerienda (4:00pm)\nFruta + puñado de nueces\n~200 kcal\n\nCena (7:00pm)\nSopa de verduras + proteína ligera\n~400 kcal | 30g proteína\n\nHidratación: 2–2.5L agua/día`,
  medium: `Plan de Nutrición - Día de Carga Media\n\nDesayuno (6:30am) — Pre-entrenamiento\nTostadas de trigo + mantequilla de maní + plátano\n~500 kcal | 20g proteína\n\nIntra-entrenamiento\nBebida isotónica o gel energético (>60 min)\n\nAlmuerzo (1:00pm) — Post-entrenamiento\nPasta con pollo y vegetales + jugo natural\n~750 kcal | 50g proteína\n\nMerienda (4:00pm)\nBatido proteico + fruta\n~300 kcal | 30g proteína\n\nCena (7:30pm)\nArroz + pescado + aguacate\n~550 kcal | 40g proteína\n\nHidratación: 3–3.5L agua/día`,
  high: `Plan de Nutrición - Día de Alta Carga (Competencia)\n\nPre-competencia (2-3h antes)\nPasta o arroz blanco + pollo sin grasa + plátano\n~700 kcal | 35g proteína | 80g carbos\n\nDía de competencia\nEvitar grasas y fibra alta en la mañana\nHidratar desde la noche anterior\n\nPost-competencia (inmediato)\nBebida de recuperación: leche chocolate o batido\nVentana anabólica: 30 min post-ejercicio\n\nComida principal post-evento\nArroz + carne magra + vegetales + postre natural\n~900 kcal | 60g proteína\n\nHidratación: 4L+ agua/día\nSales minerales durante y después del esfuerzo`,
}

export default function NutritionPlan() {
  const { profile } = useAuth()
  const [weekStats, setWeekStats] = useState<WeekStats>({ sessions: 0, totalKm: 0, avgRpe: 0, sports: { skating: 0, cycling: 0, gym: 0 } })
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState({ weight_goal: 'maintain', allergies: '', preference: 'omnivore' })

  const weeklyKm = weekStats.totalKm
  const load = weeklyKm > 80 || weekStats.avgRpe > 7 ? 'high' : weeklyKm > 30 ? 'medium' : 'low'

  useEffect(() => { if (profile) loadWeekStats() }, [profile])

  async function loadWeekStats() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data } = await supabase
      .from('training_sessions')
      .select('sport_type, distance_m, rpe')
      .eq('user_id', profile!.id)
      .gte('date', weekAgo)
    if (!data) return
    const totalKm = data.reduce((s, d) => s + (d.distance_m ?? 0), 0) / 1000
    const rpeList = data.filter(d => d.rpe)
    const avgRpe = rpeList.length ? rpeList.reduce((s, d) => s + d.rpe, 0) / rpeList.length : 0
    const sports = { skating: 0, cycling: 0, gym: 0 }
    data.forEach(d => { if (d.sport_type in sports) (sports as any)[d.sport_type]++ })
    setWeekStats({ sessions: data.length, totalKm: Math.round(totalKm * 10) / 10, avgRpe: Math.round(avgRpe * 10) / 10, sports })
  }

  async function generatePlan() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND_URL}/api/nutrition-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ week_stats: weekStats, goals }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPlan(data.plan)
      toast.success('Plan generado con IA')
    } catch {
      setPlan(FALLBACK_PLANS[load])
      toast.info('Plan generado localmente — conecta el backend para planes personalizados con IA')
    }
    setLoading(false)
  }

  const weightKg = (profile as any)?.weight_kg ?? 60
  const kcalNeeds = Math.round(1800 + weekStats.totalKm * 30 + weekStats.sports.gym * 150)
  const proteinNeeds = Math.round(1.8 * weightKg)

  const quickStats = [
    { label: 'Sesiones esta semana', value: weekStats.sessions, Icon: Zap, color: '#00C6EF' },
    { label: 'KM recorridos', value: `${weekStats.totalKm} km`, Icon: TrendingUp, color: '#8FCF00' },
    { label: 'RPE promedio', value: weekStats.avgRpe || '—', Icon: Flame, color: weekStats.avgRpe > 7 ? '#E84A5F' : '#FF7A00' },
    { label: 'Carga estimada', value: load === 'high' ? 'Alta' : load === 'medium' ? 'Media' : 'Baja', Icon: Sparkles, color: load === 'high' ? '#E84A5F' : load === 'medium' ? '#FF7A00' : '#8FCF00' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Apple size={24} className="text-[#8FCF00]" /> Nutrición IA
        </h1>
        <p className="text-sm text-[#4A6888] mt-0.5">Plan nutricional personalizado según tu carga semanal</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickStats.map(stat => (
          <div key={stat.label} className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-3 text-center">
            <stat.Icon size={18} className="mx-auto mb-1" style={{ color: stat.color }} />
            <div className="text-lg font-black text-white">{stat.value}</div>
            <div className="text-[10px] text-[#3A5070]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-5 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#3A5070]">Necesidades estimadas esta semana</div>
        <div className="space-y-3">
          <NutrientBar label="Calorías totales" value={kcalNeeds} max={3500} color="#FF7A00" unit=" kcal/día" />
          <NutrientBar label="Proteínas" value={proteinNeeds} max={200} color="#00C6EF" unit="g/día" />
          <NutrientBar label="Carbohidratos" value={Math.round(kcalNeeds * 0.55 / 4)} max={500} color="#8FCF00" unit="g/día" />
          <NutrientBar label="Hidratación estimada" value={Math.round(2 + weekStats.totalKm * 0.04)} max={6} color="#A855F7" unit="L/día" />
        </div>
        <p className="text-[11px] text-[#3A5070]">Estimaciones basadas en carga de entrenamiento. Consulta un nutricionista para un plan personalizado.</p>
      </div>

      <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-5 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#3A5070]">Preferencias para el plan</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Objetivo</label>
            <select value={goals.weight_goal} onChange={e => setGoals(g => ({ ...g, weight_goal: e.target.value }))}
              className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1">
              <option value="maintain">Mantener peso</option>
              <option value="lose">Bajar peso</option>
              <option value="gain">Ganar masa</option>
              <option value="performance">Máximo rendimiento</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Dieta</label>
            <select value={goals.preference} onChange={e => setGoals(g => ({ ...g, preference: e.target.value }))}
              className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1">
              <option value="omnivore">Omnívoro</option>
              <option value="vegetarian">Vegetariano</option>
              <option value="vegan">Vegano</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[#3A5070] uppercase font-semibold">Alergias / restricciones</label>
            <input type="text" placeholder="Ej: lactosa, gluten" value={goals.allergies} onChange={e => setGoals(g => ({ ...g, allergies: e.target.value }))}
              className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white mt-1" />
          </div>
        </div>
        <button
          onClick={generatePlan}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#8FCF00] text-black font-bold rounded-lg text-sm hover:bg-[#7AB800] transition disabled:opacity-50"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? 'Generando plan...' : 'Generar plan con IA'}
        </button>
      </div>

      {plan && (
        <div className="bg-[#0D1A2E] border border-[#8FCF00]/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Apple size={18} className="text-[#8FCF00]" /> Tu plan nutricional
            </h2>
            <button onClick={generatePlan} disabled={loading} className="flex items-center gap-1.5 text-xs text-[#4A6888] hover:text-[#8FCF00] transition">
              <RefreshCw size={12} /> Regenerar
            </button>
          </div>
          <div className="text-sm text-[#B8C8D8] whitespace-pre-wrap leading-relaxed">{plan}</div>
        </div>
      )}
    </div>
  )
}
