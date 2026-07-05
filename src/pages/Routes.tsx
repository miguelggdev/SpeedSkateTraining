import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Route as RouteType } from '@/types/database'
import { Plus, Clock, TrendingUp, Zap, ChevronRight } from 'lucide-react'

const RouteMap = lazy(() => import('@/components/RouteMap'))

function fmtDuration(s: number | null) {
  if (!s) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

interface RouteWithSession extends RouteType {
  sport_type?: string
}

export default function Routes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<RouteWithSession[]>([])
  const [selected, setSelected] = useState<RouteWithSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('routes')
      .select('*, training_sessions(sport_type)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        const mapped = (data ?? []).map((r: any) => ({
          ...r,
          sport_type: r.training_sessions?.sport_type,
        }))
        setRoutes(mapped)
        if (mapped.length > 0) setSelected(mapped[0])
        setLoading(false)
      })
  }, [user])

  const mapPoints = (r: RouteWithSession): [number, number][] =>
    r.geojson?.geometry?.coordinates?.map(([lng, lat]: number[]) => [lat, lng]) ?? []

  const color = (r: RouteWithSession) =>
    r.sport_type === 'cycling' ? '#FF7A00' : '#00C6EF'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Arial Black', sans-serif" }}>
          Rutas GPS
        </h1>
        <button
          onClick={() => navigate('/live-session')}
          className="flex items-center gap-1.5 bg-[#FF7A00] hover:bg-[#E86E00] text-white font-bold text-xs px-3 py-2 rounded-xl transition-all active:scale-95"
        >
          <Plus size={13} />
          Nueva ruta
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-3xl animate-pulse">🗺️</span>
        </div>
      ) : routes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <div className="text-lg font-black text-white mb-2" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              Sin rutas aún
            </div>
            <p className="text-[#4A6888] text-sm mb-5">
              Inicia una sesión GPS en tu próxima salida en bicicleta o patinaje en ruta
            </p>
            <button
              onClick={() => navigate('/live-session')}
              className="bg-[#FF7A00] hover:bg-[#E86E00] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all active:scale-95"
            >
              Iniciar sesión GPS
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Map preview */}
          {selected && (
            <div className="mx-4 mb-3 rounded-2xl overflow-hidden flex-shrink-0" style={{ height: 220 }}>
              <Suspense fallback={<div className="w-full h-full bg-[#0D1A2E] flex items-center justify-center"><span className="text-[#4A6888] text-sm">Cargando mapa...</span></div>}>
                <RouteMap points={mapPoints(selected)} color={color(selected)} />
              </Suspense>
            </div>
          )}

          {/* Selected route stats */}
          {selected && (
            <div className="mx-4 mb-3 grid grid-cols-4 gap-2 flex-shrink-0">
              {[
                { icon: TrendingUp, label: 'Distancia', value: selected.distance_km ? `${selected.distance_km} km` : '—', c: color(selected) },
                { icon: Clock,      label: 'Duración',  value: fmtDuration(selected.duration_s), c: '#A78BFA' },
                { icon: Zap,        label: 'Vel. prom', value: selected.speed_avg ? `${Math.round(selected.speed_avg)} km/h` : '—', c: '#00C48C' },
                { icon: Zap,        label: 'Vel. máx',  value: selected.speed_max ? `${Math.round(selected.speed_max)} km/h` : '—', c: '#F5A623' },
              ].map(s => (
                <div key={s.label} className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-2.5 text-center">
                  <div className="text-sm font-black font-mono" style={{ color: s.c, fontFamily: 'Consolas, monospace' }}>{s.value}</div>
                  <div className="text-[9px] text-[#3A5070] uppercase tracking-wide mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Route list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2">Historial de rutas</div>
            {routes.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="w-full text-left bg-[#0D1A2E] border rounded-xl p-3.5 transition-all hover:scale-[1.005] flex items-center gap-3"
                style={{ borderColor: selected?.id === r.id ? color(r) : '#152038' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${color(r)}18`, border: `1px solid ${color(r)}30` }}
                >
                  {r.sport_type === 'cycling' ? '🚴' : '⛸️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">
                    {r.distance_km ? `${r.distance_km} km` : 'Ruta'} — {fmtDuration(r.duration_s)}
                  </div>
                  <div className="text-[10px] text-[#3A5070]">{fmtDate(r.created_at)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold" style={{ color: color(r) }}>
                    {r.speed_avg ? `${Math.round(r.speed_avg)} km/h` : '—'}
                  </div>
                  <ChevronRight size={12} className="text-[#3A5070] ml-auto mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
