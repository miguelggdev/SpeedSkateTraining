import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useGpsTracker } from '@/hooks/useGpsTracker'
import { supabase } from '@/lib/supabase'
import { Play, Square, ArrowLeft, Navigation } from 'lucide-react'

const RouteMap = lazy(() => import('@/components/RouteMap'))

function fmtTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function LiveSession() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state, start, stop } = useGpsTracker()
  const [sportType] = useState<'cycling' | 'skating'>('cycling')
  const [saving, setSaving] = useState(false)

  const mapPoints: [number, number][] = state.points.map(p => [p.lat, p.lng])

  async function handleStop() {
    stop()
    if (!user || state.points.length < 2) return
    setSaving(true)

    const geojson = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: state.points.map(p => [p.lng, p.lat, p.alt ?? 0] as [number, number, number]),
      },
    }

    const { data: session } = await supabase.from('training_sessions').insert({
      user_id: user.id,
      sport_type: sportType,
      started_at: new Date(state.points[0].ts).toISOString(),
      ended_at: new Date(state.points[state.points.length - 1].ts).toISOString(),
      duration_minutes: Math.round(state.durationS / 60),
      distance_km: Math.round(state.distanceKm * 100) / 100,
      speed_avg: state.points.reduce((a, p) => a + (p.speed ?? 0), 0) / state.points.length * 3.6,
      speed_max: Math.round(state.speedMax * 10) / 10,
      location_lat: state.points[0].lat,
      location_lng: state.points[0].lng,
    }).select('id').single()

    if (session?.id) {
      await supabase.from('routes').insert({
        session_id: session.id,
        user_id: user.id,
        geojson,
        distance_km: Math.round(state.distanceKm * 100) / 100,
        duration_s: state.durationS,
        speed_avg: state.points.reduce((a, p) => a + (p.speed ?? 0), 0) / state.points.length * 3.6,
        speed_max: Math.round(state.speedMax * 10) / 10,
        start_lat: state.points[0].lat,
        start_lng: state.points[0].lng,
        end_lat: state.points[state.points.length - 1].lat,
        end_lng: state.points[state.points.length - 1].lng,
      })
    }

    setSaving(false)
    navigate('/routes')
  }

  const sportColor = sportType === 'cycling' ? '#FF7A00' : '#00C6EF'

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0D1A2E] border-b border-[#152038] flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-[#4A6888] hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="text-sm font-black text-white" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            Sesión en vivo
          </div>
          <div className="text-[10px] text-[#4A6888]">
            {state.tracking ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse inline-block" />
                Grabando ruta GPS
              </span>
            ) : 'Listo para iniciar'}
          </div>
        </div>
        {state.tracking && (
          <button
            onClick={handleStop}
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#E84A5F] hover:bg-[#D43A4F] text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
          >
            <Square size={12} fill="white" />
            {saving ? 'Guardando...' : 'Terminar'}
          </button>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <Suspense fallback={
          <div className="w-full h-full bg-[#0D1A2E] flex items-center justify-center">
            <span className="text-[#4A6888] text-sm">Cargando mapa...</span>
          </div>
        }>
          <RouteMap points={mapPoints} live={state.tracking} color={sportColor} />
        </Suspense>

        {state.error && (
          <div className="absolute top-3 left-3 right-3 bg-[#E84A5F]/90 text-white text-xs px-3 py-2 rounded-lg">
            {state.error}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="bg-[#080E1C]/95 backdrop-blur border-t border-[#152038] px-4 py-4 flex-shrink-0">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Tiempo',    value: fmtTime(state.durationS), mono: true },
            { label: 'Distancia', value: `${state.distanceKm.toFixed(2)} km`, mono: true },
            { label: 'Vel. actual', value: `${state.speedCurrent} km/h`, mono: true },
            { label: 'Vel. máx',  value: `${Math.round(state.speedMax)} km/h`, mono: true },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div
                className="text-lg font-black leading-tight"
                style={{ color: sportColor, fontFamily: stat.mono ? 'Consolas, monospace' : undefined }}
              >
                {stat.value}
              </div>
              <div className="text-[9px] text-[#3A5070] uppercase tracking-wide mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {!state.tracking ? (
          <button
            onClick={start}
            className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl transition-all active:scale-95 shadow-lg"
            style={{ background: sportColor, color: '#060D1A', boxShadow: `0 4px 20px ${sportColor}40` }}
          >
            <Play size={16} fill="#060D1A" />
            Iniciar sesión GPS
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-[#4A6888]">
            <Navigation size={12} className="text-[#00C48C]" />
            {state.points.length} puntos GPS grabados
          </div>
        )}
      </div>
    </div>
  )
}
