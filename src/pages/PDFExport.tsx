import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { FileDown, Printer, Calendar, Activity, Trophy, Heart } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface MonthStats {
  sessions: number
  totalKm: number
  totalMin: number
  avgRpe: number
  byWeek: { week: string; km: number; sessions: number }[]
  bySport: { sport: string; km: number; sessions: number }[]
}

interface PBEntry {
  distance_m: number
  time_ms: number
  race_date: string
}

interface WellnessAvg {
  sleep_quality: number
  fatigue: number
  mood: number
  hydration: number
}

const SPORT_LABELS: Record<string, string> = { skating: '⛸️ Patinaje', cycling: '🚴 Bicicleta', gym: '🏋️ Gym' }
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const centis = Math.floor((ms % 1000) / 10)
  if (min > 0) return `${min}:${String(sec).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
  return `${sec}.${String(centis).padStart(2, '0')}`
}

export default function PDFExport() {
  const { profile } = useAuth()
  const reportRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState<MonthStats | null>(null)
  const [pbs, setPbs] = useState<PBEntry[]>([])
  const [wellness, setWellness] = useState<WellnessAvg | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => { if (profile) loadData() }, [profile, selectedMonth, selectedYear])

  async function loadData() {
    setLoading(true)
    const from = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const to = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const [sessRes, pbRes, wellRes] = await Promise.all([
      supabase.from('training_sessions').select('date, distance_m, duration_min, rpe, sport_type').eq('user_id', profile!.id).gte('date', from).lte('date', to),
      supabase.from('race_times').select('distance_m, time_ms, race_date').eq('user_id', profile!.id).eq('is_pb', true).order('distance_m'),
      supabase.from('wellness_logs').select('sleep_quality, fatigue, mood, hydration').eq('user_id', profile!.id).gte('log_date', from).lte('log_date', to),
    ])

    const sessions = sessRes.data ?? []
    const totalKm = sessions.reduce((s, d) => s + (d.distance_m ?? 0), 0) / 1000
    const totalMin = sessions.reduce((s, d) => s + (d.duration_min ?? 0), 0)
    const rpeList = sessions.filter(d => d.rpe)
    const avgRpe = rpeList.length ? rpeList.reduce((s, d) => s + d.rpe, 0) / rpeList.length : 0

    // By week
    const weeks: Record<string, { km: number; sessions: number }> = {}
    sessions.forEach(s => {
      const d = new Date(s.date)
      const weekNum = Math.ceil(d.getDate() / 7)
      const key = `Sem ${weekNum}`
      if (!weeks[key]) weeks[key] = { km: 0, sessions: 0 }
      weeks[key].km += (s.distance_m ?? 0) / 1000
      weeks[key].sessions++
    })
    const byWeek = Object.entries(weeks).map(([week, v]) => ({ week, km: Math.round(v.km * 10) / 10, sessions: v.sessions }))

    // By sport
    const sports: Record<string, { km: number; sessions: number }> = {}
    sessions.forEach(s => {
      const key = s.sport_type ?? 'other'
      if (!sports[key]) sports[key] = { km: 0, sessions: 0 }
      sports[key].km += (s.distance_m ?? 0) / 1000
      sports[key].sessions++
    })
    const bySport = Object.entries(sports).map(([sport, v]) => ({ sport, km: Math.round(v.km * 10) / 10, sessions: v.sessions }))

    setStats({ sessions: sessions.length, totalKm: Math.round(totalKm * 10) / 10, totalMin, avgRpe: Math.round(avgRpe * 10) / 10, byWeek, bySport })
    setPbs(pbRes.data ?? [])

    const wLogs = wellRes.data ?? []
    if (wLogs.length > 0) {
      setWellness({
        sleep_quality: Math.round(wLogs.reduce((s, l) => s + (l.sleep_quality ?? 0), 0) / wLogs.length * 10) / 10,
        fatigue: Math.round(wLogs.reduce((s, l) => s + (l.fatigue ?? 0), 0) / wLogs.length * 10) / 10,
        mood: Math.round(wLogs.reduce((s, l) => s + (l.mood ?? 0), 0) / wLogs.length * 10) / 10,
        hydration: Math.round(wLogs.reduce((s, l) => s + (l.hydration ?? 0), 0) / wLogs.length * 10) / 10,
      })
    }
    setLoading(false)
  }

  function handlePrint() {
    window.print()
  }

  const hours = stats ? Math.floor(stats.totalMin / 60) : 0
  const mins = stats ? stats.totalMin % 60 : 0

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Controls - hidden when printing */}
      <div className="print:hidden flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileDown size={24} className="text-[#E84A5F]" /> Exportar Informe
          </h1>
          <p className="text-sm text-[#4A6888] mt-0.5">Reporte mensual en PDF</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white"
          >
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-[#0D1A2E] border border-[#152038] rounded-lg px-3 py-2 text-sm text-white"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#E84A5F] text-white rounded-lg text-sm font-bold hover:bg-[#D03355] transition"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Report */}
      <div ref={reportRef} className="bg-white text-black rounded-xl overflow-hidden print:rounded-none print:shadow-none" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div style={{ background: '#080E1C', color: 'white', padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>
                ⛸️ SpeedSkate<span style={{ color: '#00C6EF' }}>Training</span>
              </div>
              <div style={{ fontSize: 13, color: '#5A76A0', marginTop: 4 }}>Reporte mensual de entrenamiento</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#00C6EF' }}>{MONTH_NAMES[selectedMonth]} {selectedYear}</div>
              <div style={{ fontSize: 12, color: '#5A76A0', marginTop: 2 }}>{profile?.full_name}</div>
              {(profile as any)?.category && <div style={{ fontSize: 11, color: '#3A5070' }}>{(profile as any).category}</div>}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 32px', background: '#F8FAFC' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Cargando datos...</div>
          ) : !stats || stats.sessions === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No hay sesiones registradas en {MONTH_NAMES[selectedMonth]} {selectedYear}
            </div>
          ) : (
            <>
              {/* KPI Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Sesiones', value: stats.sessions, icon: '📊', color: '#00C6EF' },
                  { label: 'Kilómetros', value: `${stats.totalKm} km`, icon: '📍', color: '#8FCF00' },
                  { label: 'Tiempo total', value: `${hours}h ${mins}m`, icon: '⏱️', color: '#FF7A00' },
                  { label: 'RPE promedio', value: stats.avgRpe || '—', icon: '💪', color: '#E84A5F' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20 }}>{kpi.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color, marginTop: 4 }}>{kpi.value}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    KM por semana
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={stats.byWeek}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                      <Bar dataKey="km" fill="#00C6EF" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Distribución por deporte
                  </div>
                  <div style={{ space: '8px' }}>
                    {stats.bySport.map(s => (
                      <div key={s.sport} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: '#374151' }}>{SPORT_LABELS[s.sport] ?? s.sport}</span>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{s.km} km · {s.sessions} ses</span>
                        </div>
                        <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#00C6EF', borderRadius: 4, width: `${(s.km / stats.totalKm) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PBs */}
              {pbs.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🏆 Marcas Personales Actuales
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {pbs.slice(0, 6).map(pb => (
                      <div key={pb.distance_m} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px' }}>
                        <div style={{ fontSize: 10, color: '#92400E', fontWeight: 700 }}>{pb.distance_m}m</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#D97706' }}>{formatTime(pb.time_ms)}</div>
                        <div style={{ fontSize: 10, color: '#B45309' }}>{pb.race_date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wellness */}
              {wellness && (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    💚 Bienestar promedio del mes
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: 'Calidad sueño', value: wellness.sleep_quality, max: 5 },
                      { label: 'Estado de ánimo', value: wellness.mood, max: 5 },
                      { label: 'Hidratación', value: wellness.hydration, max: 5 },
                      { label: 'Fatiga (inv)', value: 6 - wellness.fatigue, max: 5 },
                    ].map(w => (
                      <div key={w.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981' }}>{w.value}/5</div>
                        <div style={{ fontSize: 10, color: '#6B7280' }}>{w.label}</div>
                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#10B981', borderRadius: 3, width: `${(w.value / w.max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#080E1C', color: '#3A5070', padding: '12px 32px', fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
          <span>SpeedSkateTraining — Generado el {new Date().toLocaleDateString('es-CO')}</span>
          <span>arkanatech.tech</span>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
