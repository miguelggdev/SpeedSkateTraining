import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatTime, parseTimeInput, OFFICIAL_DISTANCES, getWsCategory, WHEEL_RULES } from '@/hooks/usePersonalBests'
import { Calculator, Flag, AlertTriangle, CheckCircle, Timer, Zap } from 'lucide-react'
import { toast } from 'sonner'

const TRACK_LENGTHS: Record<string, number> = {
  track_200: 200,
  track_400: 400,
  open_road: 0,
}

interface SplitRow {
  lap: number
  distance: number
  lapTimeMs: number
  splitMs: number
  speedKmh: number
}

function calcSplits(totalMs: number, distanceM: number, trackM: number): SplitRow[] {
  if (!totalMs || !distanceM) return []
  const rows: SplitRow[] = []
  const laps = trackM > 0 ? Math.ceil(distanceM / trackM) : 1
  const lapDist = trackM > 0 ? trackM : distanceM
  const msPerLap = totalMs / laps

  for (let i = 1; i <= laps; i++) {
    const isLast = i === laps
    const dist = isLast ? distanceM - lapDist * (laps - 1) : lapDist
    const lapMs = isLast ? totalMs - msPerLap * (laps - 1) : msPerLap
    const split = msPerLap * i
    const speedKmh = (dist / 1000) / (lapMs / 3_600_000)
    rows.push({ lap: i, distance: dist, lapTimeMs: Math.round(lapMs), splitMs: Math.round(split), speedKmh })
  }
  return rows
}

// Race pace targets: time needed at each distance to achieve a goal pace
function paceTargets(targetKmh: number) {
  return OFFICIAL_DISTANCES.map(d => ({
    ...d,
    ms: Math.round((d.m / 1000 / targetKmh) * 3_600_000),
  }))
}

export default function SplitCalculator() {
  const { profile } = useAuth()
  const wsCategory = getWsCategory(profile?.birth_date ?? null)

  // Splits tab
  const [distance, setDistance] = useState(1000)
  const [trackType, setTrackType] = useState<'track_200' | 'track_400' | 'open_road'>('track_400')
  const [timeInput, setTimeInput] = useState('')
  const [splits, setSplits] = useState<SplitRow[]>([])

  // Live lap tracker tab
  const [tab, setTab] = useState<'splits' | 'tracker' | 'pace' | 'wheels'>('splits')
  const [lapTimes, setLapTimes] = useState<number[]>([])
  const [running, setRunning] = useState(false)
  const [startMs, setStartMs] = useState(0)
  const [lapStart, setLapStart] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Pace calculator
  const [targetSpeed, setTargetSpeed] = useState(30)

  function calcSplitsHandler() {
    const ms = parseTimeInput(timeInput)
    if (!ms) { toast.error('Formato inválido. Ej: 1:23.45 ó 83.45'); return }
    const trackM = TRACK_LENGTHS[trackType]
    setSplits(calcSplits(ms, distance, trackM))
  }

  // Live tracker
  function startTracker() {
    const now = Date.now()
    setStartMs(now); setLapStart(now); setLapTimes([]); setRunning(true)
    timerRef.current = setInterval(() => setElapsed(Date.now() - now), 100)
  }
  function recordLap() {
    const now = Date.now()
    const lapMs = now - lapStart
    setLapTimes(prev => [...prev, lapMs])
    setLapStart(now)
  }
  function stopTracker() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
  }
  function resetTracker() {
    stopTracker(); setElapsed(0); setLapTimes([]); setStartMs(0); setLapStart(0)
  }

  const totalLapMs = lapTimes.reduce((a, b) => a + b, 0)
  const bestLap = lapTimes.length ? Math.min(...lapTimes) : 0
  const worstLap = lapTimes.length ? Math.max(...lapTimes) : 0
  const avgLap = lapTimes.length ? Math.round(totalLapMs / lapTimes.length) : 0

  // Wheel rules
  const wheelMaxIndoor = wsCategory ? WHEEL_RULES[wsCategory.key]?.indoor : null
  const wheelMaxOutdoor = wsCategory ? WHEEL_RULES[wsCategory.key]?.outdoor : null

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Calculator size={22} className="text-[#00C6EF]" /> Calculadora de Splits
        </h1>
        <p className="text-sm text-[#4A6888] mt-0.5">Planifica tus ritmos y controla vueltas en tiempo real</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#060D1A] border border-[#152038] rounded-xl p-1 overflow-x-auto">
        {([
          ['splits',  '📐 Splits'],
          ['tracker', '⏱ Cronómetro'],
          ['pace',    '🚀 Ritmos'],
          ['wheels',  '🛞 Ruedas'],
        ] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              tab === v ? 'bg-[#00C6EF] text-black' : 'text-[#4A6888] hover:text-white'
            }`}
          >{l}</button>
        ))}
      </div>

      {/* Splits calculator */}
      {tab === 'splits' && (
        <div className="space-y-4">
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Distancia</label>
                <select value={distance} onChange={e => setDistance(Number(e.target.value))}
                  className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50">
                  {OFFICIAL_DISTANCES.map(d => <option key={d.m} value={d.m}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Tipo de pista</label>
                <select value={trackType} onChange={e => setTrackType(e.target.value as any)}
                  className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50">
                  <option value="track_200">Pista 200m</option>
                  <option value="track_400">Pista 400m</option>
                  <option value="open_road">Ruta abierta</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">
                  Tiempo objetivo
                </label>
                <input value={timeInput} onChange={e => setTimeInput(e.target.value)}
                  placeholder="1:23.45"
                  className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white font-mono placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50" />
              </div>
            </div>

            {timeInput && parseTimeInput(timeInput) && (
              <div className="bg-[#060D1A] border border-[#152038] rounded-xl px-4 py-3 flex gap-6 text-sm">
                <div>
                  <span className="text-[#4A6888]">Velocidad: </span>
                  <span className="font-bold text-[#00C6EF]">
                    {((distance / 1000) / (parseTimeInput(timeInput)! / 3_600_000)).toFixed(2)} km/h
                  </span>
                </div>
                <div>
                  <span className="text-[#4A6888]">Tiempo: </span>
                  <span className="font-bold text-white">{formatTime(parseTimeInput(timeInput)!)}</span>
                </div>
                {trackType !== 'open_road' && (
                  <div>
                    <span className="text-[#4A6888]">Vueltas: </span>
                    <span className="font-bold text-white">
                      {Math.ceil(distance / TRACK_LENGTHS[trackType])}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button onClick={calcSplitsHandler} disabled={!timeInput}
              className="w-full py-3 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90 disabled:opacity-40">
              Calcular splits
            </button>
          </div>

          {splits.length > 0 && (
            <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#152038]">
                <h3 className="text-sm font-bold text-white">
                  Splits por vuelta · {trackType === 'open_road' ? 'Ruta' : `Pista ${TRACK_LENGTHS[trackType]}m`}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#152038]">
                      {['Vuelta','Distancia','Tiempo vuelta','Split total','Velocidad'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] text-[#3A5070] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {splits.map(s => (
                      <tr key={s.lap} className="border-b border-[#152038]/50 hover:bg-[#060D1A]/50">
                        <td className="px-4 py-3 font-bold text-white">{s.lap}</td>
                        <td className="px-4 py-3 text-[#4A6888]">{s.distance}m</td>
                        <td className="px-4 py-3 font-mono text-[#00C6EF] font-bold">{formatTime(s.lapTimeMs)}</td>
                        <td className="px-4 py-3 font-mono text-white">{formatTime(s.splitMs)}</td>
                        <td className="px-4 py-3 text-[#8FCF00] font-semibold">{s.speedKmh.toFixed(1)} km/h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live lap tracker */}
      {tab === 'tracker' && (
        <div className="space-y-4">
          {/* Big timer */}
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-8 text-center">
            <div className="text-6xl font-black font-mono text-white mb-2">
              {formatTime(elapsed)}
            </div>
            <div className="text-[#4A6888] text-sm">
              {running ? `Vuelta ${lapTimes.length + 1} · ${formatTime(elapsed - totalLapMs)}` : 'Listo'}
            </div>

            <div className="flex gap-3 justify-center mt-6">
              {!running && elapsed === 0 && (
                <button onClick={startTracker}
                  className="px-8 py-3 rounded-xl bg-[#8FCF00] text-black font-black text-lg hover:bg-[#8FCF00]/90">
                  ▶ Iniciar
                </button>
              )}
              {running && (
                <>
                  <button onClick={recordLap}
                    className="px-6 py-3 rounded-xl bg-[#00C6EF] text-black font-bold hover:bg-[#00C6EF]/90 flex items-center gap-2">
                    <Flag size={16} /> Vuelta
                  </button>
                  <button onClick={stopTracker}
                    className="px-6 py-3 rounded-xl bg-[#E84A5F] text-white font-bold hover:bg-[#E84A5F]/90">
                    ■ Parar
                  </button>
                </>
              )}
              {!running && elapsed > 0 && (
                <button onClick={resetTracker}
                  className="px-6 py-3 rounded-xl border border-[#152038] text-[#4A6888] font-bold hover:text-white">
                  ↺ Reset
                </button>
              )}
            </div>
          </div>

          {/* Lap stats */}
          {lapTimes.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Mejor vuelta', value: formatTime(bestLap), color: '#8FCF00' },
                  { label: 'Promedio',     value: formatTime(avgLap),  color: '#00C6EF' },
                  { label: 'Peor vuelta',  value: formatTime(worstLap),color: '#E84A5F' },
                ].map(s => (
                  <div key={s.label} className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-4 text-center">
                    <div className="font-black font-mono text-lg" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-[#4A6888] uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#152038]">
                  <h3 className="text-sm font-bold text-white">Tiempos de vuelta</h3>
                </div>
                <div className="divide-y divide-[#152038]">
                  {[...lapTimes].reverse().map((ms, ri) => {
                    const i = lapTimes.length - ri
                    const isBest = ms === bestLap
                    const isWorst = ms === worstLap && lapTimes.length > 1
                    const cumMs = lapTimes.slice(0, lapTimes.length - ri).reduce((a, b) => a + b, 0)
                    return (
                      <div key={i} className="flex items-center gap-4 px-5 py-3">
                        <span className="text-xs text-[#3A5070] w-16">Vuelta {i}</span>
                        <span className={`font-mono font-bold text-sm ${isBest ? 'text-[#8FCF00]' : isWorst ? 'text-[#E84A5F]' : 'text-white'}`}>
                          {formatTime(ms)}
                        </span>
                        {isBest && <span className="text-[10px] text-[#8FCF00]">↑ mejor</span>}
                        {isWorst && <span className="text-[10px] text-[#E84A5F]">↓ peor</span>}
                        <span className="ml-auto text-xs font-mono text-[#4A6888]">{formatTime(cumMs)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Pace targets */}
      {tab === 'pace' && (
        <div className="space-y-4">
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5 space-y-3">
            <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">
              Velocidad objetivo: <span className="text-[#00C6EF] text-base font-black">{targetSpeed} km/h</span>
            </label>
            <input type="range" min={5} max={60} step={0.5}
              value={targetSpeed} onChange={e => setTargetSpeed(Number(e.target.value))}
              className="w-full accent-[#00C6EF]" />
            <div className="flex justify-between text-[10px] text-[#3A5070]">
              <span>5 km/h</span><span>30 km/h</span><span>60 km/h</span>
            </div>
          </div>

          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#152038]">
              <h3 className="text-sm font-bold text-white">Tiempos necesarios a {targetSpeed} km/h</h3>
            </div>
            <div className="divide-y divide-[#152038]">
              {paceTargets(targetSpeed).map(d => (
                <div key={d.m} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-sm font-bold text-white w-20">{d.label}</span>
                  <span className="font-mono font-black text-[#00C6EF]">{formatTime(d.ms)}</span>
                  <span className="text-xs text-[#4A6888] ml-auto">
                    {d.sprint ? '⚡ Velocidad' : '🏃 Fondo'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wheel rules */}
      {tab === 'wheels' && (
        <div className="space-y-4">
          {wsCategory ? (
            <>
              <div className="bg-[#0D1A2E] border border-[#F59E0B]/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">🏅</div>
                  <div>
                    <div className="font-bold text-white">Categoría: {wsCategory.label}</div>
                    <div className="text-xs text-[#4A6888]">Reglas de ruedas según World Skate 2024</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#060D1A] border border-[#152038] rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-[#00C6EF]">{wheelMaxIndoor}mm</div>
                    <div className="text-xs text-[#4A6888] mt-1">Máximo indoor (200m)</div>
                  </div>
                  <div className="bg-[#060D1A] border border-[#152038] rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-[#FF7A00]">{wheelMaxOutdoor}mm</div>
                    <div className="text-xs text-[#4A6888] mt-1">Máximo outdoor (400m)</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#152038]">
                  <h3 className="text-sm font-bold text-white">Tabla completa por categoría</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#152038]">
                        <th className="px-4 py-3 text-left text-[10px] text-[#3A5070] uppercase tracking-wider">Categoría</th>
                        <th className="px-4 py-3 text-center text-[10px] text-[#3A5070] uppercase tracking-wider">Indoor</th>
                        <th className="px-4 py-3 text-center text-[10px] text-[#3A5070] uppercase tracking-wider">Outdoor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WS_CATEGORIES.map(cat => {
                        const rules = WHEEL_RULES[cat.key]
                        const isMe = wsCategory.key === cat.key
                        return (
                          <tr key={cat.key}
                            className={`border-b border-[#152038]/50 ${isMe ? 'bg-[#00C6EF]/5' : 'hover:bg-[#060D1A]/50'}`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isMe && <div className="w-1.5 h-1.5 rounded-full bg-[#00C6EF]" />}
                                <span className={`font-semibold ${isMe ? 'text-[#00C6EF]' : 'text-white'}`}>{cat.label}</span>
                                <span className="text-[10px] text-[#3A5070]">{cat.minAge}–{cat.maxAge} años</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-[#00C6EF]">{rules?.indoor ?? '—'}mm</td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-[#FF7A00]">{rules?.outdoor ?? '—'}mm</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-3">
              <AlertTriangle size={40} className="mx-auto text-[#F59E0B]" />
              <p className="text-white font-semibold">Fecha de nacimiento no configurada</p>
              <p className="text-[#4A6888] text-sm">
                Ve a <a href="/settings" className="text-[#00C6EF] hover:underline">Configuración → Perfil</a> y
                agrega tu fecha de nacimiento para ver las reglas de ruedas de tu categoría.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
