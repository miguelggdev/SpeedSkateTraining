import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { SportType, TrainingType, TrackType, AthleteCategory } from '@/types/database'
import { ArrowLeft, Save, MapPin, Clock, Zap } from 'lucide-react'

const SPORTS = [
  { key: 'skating' as SportType, icon: '⛸️', label: 'Patinaje', color: '#00C6EF' },
  { key: 'cycling' as SportType, icon: '🚴', label: 'Bicicleta', color: '#FF7A00' },
  { key: 'gym'     as SportType, icon: '🏋️', label: 'Gym',       color: '#8FCF00' },
]

const TRAINING_TYPES: { key: TrainingType; icon: string; label: string }[] = [
  { key: 'strength_plyo', icon: '💪', label: 'Fuerza y Pliometría' },
  { key: 'dry_technique', icon: '🪞', label: 'Técnico en Seco' },
  { key: 'endurance',     icon: '🔄', label: 'Resistencia' },
  { key: 'sprint_start',  icon: '⚡', label: 'Salidas y Sprint' },
  { key: 'flexibility',   icon: '🧘', label: 'Flexibilidad' },
]

const TRACK_TYPES: { key: TrackType; label: string }[] = [
  { key: 'track_400',    label: 'Pista 400 m' },
  { key: 'track_200',    label: 'Pista 200 m' },
  { key: 'open_road',    label: 'Ruta abierta' },
  { key: 'park_circuit', label: 'Circuito parque' },
]

const RPE_LABELS: Record<number, string> = {
  1: 'Muy fácil', 2: 'Fácil', 3: 'Moderado', 4: 'Un poco duro',
  5: 'Duro', 6: 'Más duro', 7: 'Muy duro', 8: 'Muy muy duro',
  9: 'Casi máximo', 10: 'Máximo esfuerzo',
}

export default function NewSession() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [sport, setSport] = useState<SportType>('skating')
  const [trainingType, setTrainingType] = useState<TrainingType | ''>(
    (params.get('training_type') as TrainingType) || ''
  )
  const [category, setCategory] = useState<AthleteCategory>('velocista')
  const [trackType, setTrackType] = useState<TrackType | ''>('')
  const [durationMin, setDurationMin] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [lapCount, setLapCount] = useState('')
  const [avgHr, setAvgHr] = useState('')
  const [maxHr, setMaxHr] = useState('')
  const [calories, setCalories] = useState('')
  const [rpe, setRpe] = useState(5)
  const [locationName, setLocationName] = useState('')
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError('')

    const now = new Date().toISOString()
    const { error: err } = await supabase.from('training_sessions').insert({
      user_id: user.id,
      sport_type: sport,
      training_type: trainingType || null,
      athlete_category: sport === 'skating' ? category : null,
      track_type: sport === 'skating' ? (trackType || null) : null,
      started_at: now,
      ended_at: now,
      duration_minutes: durationMin ? Number(durationMin) : null,
      distance_km: distanceKm ? Number(distanceKm) : null,
      lap_count: lapCount ? Number(lapCount) : null,
      avg_hr: avgHr ? Number(avgHr) : null,
      max_hr: maxHr ? Number(maxHr) : null,
      calories: calories ? Number(calories) : null,
      rpe,
      location_name: locationName || null,
      comments: comments || null,
    })

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      navigate('/sessions')
    }
  }

  const sportColor = SPORTS.find(s => s.key === sport)?.color ?? '#00C6EF'

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[#4A6888] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Arial Black', sans-serif" }}>
          Nueva Sesión
        </h1>
      </div>

      {/* Sport selector */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2 block">Deporte</label>
        <div className="grid grid-cols-3 gap-2">
          {SPORTS.map(s => (
            <button
              key={s.key}
              onClick={() => setSport(s.key)}
              className="flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: sport === s.key ? s.color : '#152038',
                background: sport === s.key ? `${s.color}15` : '#0D1A2E',
              }}
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-bold" style={{ color: sport === s.key ? s.color : '#5A76A0' }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Skating-specific fields */}
      {sport === 'skating' && (
        <>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2 block">
              Tipo de entrenamiento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRAINING_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTrainingType(trainingType === t.key ? '' : t.key)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-all text-left"
                  style={{
                    borderColor: trainingType === t.key ? sportColor : '#152038',
                    background: trainingType === t.key ? `${sportColor}15` : '#0D1A2E',
                  }}
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-xs font-semibold text-white">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2 block">
              Categoría
            </label>
            <div className="flex gap-2">
              {(['velocista', 'fondista'] as AthleteCategory[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="flex-1 py-2.5 rounded-xl border-2 text-sm font-bold capitalize transition-all"
                  style={{
                    borderColor: category === c ? sportColor : '#152038',
                    background: category === c ? `${sportColor}15` : '#0D1A2E',
                    color: category === c ? sportColor : '#5A76A0',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2 block">
              Tipo de pista
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRACK_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTrackType(trackType === t.key ? '' : t.key)}
                  className="py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                  style={{
                    borderColor: trackType === t.key ? sportColor : '#152038',
                    background: trackType === t.key ? `${sportColor}15` : '#0D1A2E',
                    color: trackType === t.key ? sportColor : '#5A76A0',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Metrics */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2 block flex items-center gap-1">
          <Clock size={11} /> Métricas
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Duración (min)', value: durationMin, set: setDurationMin },
            { label: sport !== 'gym' ? 'Distancia (km)' : 'Vueltas / series', value: sport !== 'gym' ? distanceKm : lapCount, set: sport !== 'gym' ? setDistanceKm : setLapCount },
            { label: 'FC promedio (bpm)', value: avgHr, set: setAvgHr },
            { label: 'FC máxima (bpm)',   value: maxHr, set: setMaxHr },
            { label: 'Calorías (kcal)',   value: calories, set: setCalories },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] text-[#3A5070] mb-1 block">{f.label}</label>
              <input
                type="number"
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder="—"
                className="w-full bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00C6EF]/50 placeholder-[#2A3A55]"
              />
            </div>
          ))}
          {sport === 'skating' && (
            <div>
              <label className="text-[10px] text-[#3A5070] mb-1 block">Vueltas</label>
              <input
                type="number"
                value={lapCount}
                onChange={e => setLapCount(e.target.value)}
                placeholder="—"
                className="w-full bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00C6EF]/50 placeholder-[#2A3A55]"
              />
            </div>
          )}
        </div>
      </div>

      {/* RPE */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2 block flex items-center gap-1">
          <Zap size={11} /> Esfuerzo percibido (RPE)
        </label>
        <div className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-black font-mono" style={{ color: sportColor }}>{rpe}</span>
            <span className="text-sm text-white font-semibold">{RPE_LABELS[rpe]}</span>
          </div>
          <input
            type="range" min={1} max={10} value={rpe}
            onChange={e => setRpe(Number(e.target.value))}
            className="w-full accent-[#00C6EF]"
          />
          <div className="flex justify-between text-[10px] text-[#3A5070] mt-1">
            <span>1 Muy fácil</span><span>10 Máximo</span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2 block flex items-center gap-1">
          <MapPin size={11} /> Lugar
        </label>
        <input
          type="text"
          value={locationName}
          onChange={e => setLocationName(e.target.value)}
          placeholder="Ej: Parque Simón Bolívar, Bogotá"
          className="w-full bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00C6EF]/50 placeholder-[#2A3A55]"
        />
      </div>

      {/* Comments */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2 block">
          Notas / Comentarios
        </label>
        <textarea
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={3}
          placeholder="¿Cómo te fue? Condiciones, sensaciones, puntos a mejorar..."
          className="w-full bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00C6EF]/50 placeholder-[#2A3A55] resize-none"
        />
      </div>

      {error && (
        <div className="bg-[#E84A5F]/10 border border-[#E84A5F]/30 text-[#E84A5F] text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[#00C6EF] hover:bg-[#00B5D8] disabled:opacity-60 text-[#060D1A] font-bold text-sm py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-[#00C6EF]/20"
      >
        <Save size={16} />
        {saving ? 'Guardando...' : 'Guardar sesión'}
      </button>

    </div>
  )
}
