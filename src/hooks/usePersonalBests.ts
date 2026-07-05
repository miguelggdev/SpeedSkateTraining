import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface RaceTime {
  id: string
  user_id: string
  distance_m: number
  time_ms: number
  track_type: string | null
  competition: boolean
  event_name: string | null
  location: string | null
  session_id: string | null
  is_pb: boolean
  notes: string | null
  recorded_at: string
  created_at: string
}

// Official World Skate distances (meters)
export const OFFICIAL_DISTANCES = [
  { m: 100,   label: '100m',     sprint: true  },
  { m: 200,   label: '200m',     sprint: true  },
  { m: 300,   label: '300m',     sprint: true  },
  { m: 500,   label: '500m',     sprint: true  },
  { m: 1000,  label: '1.000m',   sprint: false },
  { m: 1500,  label: '1.500m',   sprint: false },
  { m: 3000,  label: '3.000m',   sprint: false },
  { m: 5000,  label: '5.000m',   sprint: false },
  { m: 10000, label: '10.000m',  sprint: false },
  { m: 42195, label: 'Maratón',  sprint: false },
]

// World Skate age categories (2024 rulebook)
export const WS_CATEGORIES = [
  { key: 'infantil_a', label: 'Infantil A', minAge: 8,  maxAge: 9  },
  { key: 'infantil_b', label: 'Infantil B', minAge: 10, maxAge: 11 },
  { key: 'infantil_c', label: 'Infantil C', minAge: 12, maxAge: 13 },
  { key: 'juvenil',    label: 'Juvenil',    minAge: 14, maxAge: 15 },
  { key: 'junior',     label: 'Junior',     minAge: 16, maxAge: 18 },
  { key: 'senior',     label: 'Senior',     minAge: 19, maxAge: 39 },
  { key: 'master_a',   label: 'Master A',   minAge: 40, maxAge: 49 },
  { key: 'master_b',   label: 'Master B',   minAge: 50, maxAge: 59 },
  { key: 'master_c',   label: 'Master C',   minAge: 60, maxAge: 99 },
]

// Max wheel size by category and track (World Skate rules)
export const WHEEL_RULES: Record<string, { indoor: number; outdoor: number }> = {
  infantil_a: { indoor: 80,  outdoor: 90  },
  infantil_b: { indoor: 84,  outdoor: 100 },
  infantil_c: { indoor: 90,  outdoor: 100 },
  juvenil:    { indoor: 100, outdoor: 110 },
  junior:     { indoor: 100, outdoor: 110 },
  senior:     { indoor: 100, outdoor: 110 },
  master_a:   { indoor: 100, outdoor: 110 },
  master_b:   { indoor: 100, outdoor: 110 },
  master_c:   { indoor: 100, outdoor: 110 },
}

export function getWsCategory(birthDate: string | null) {
  if (!birthDate) return null
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 86400000))
  return WS_CATEGORIES.find(c => age >= c.minAge && age <= c.maxAge) ?? null
}

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const millis   = ms % 1000
  const min      = Math.floor(totalSec / 60)
  const sec      = totalSec % 60
  if (min > 0) return `${min}:${String(sec).padStart(2,'0')}.${String(Math.floor(millis/10)).padStart(2,'0')}`
  return `${sec}.${String(Math.floor(millis/10)).padStart(2,'0')}s`
}

export function parseTimeInput(val: string): number | null {
  // Accepts: "1:23.45", "83.45", "83", "1:23"
  val = val.trim()
  const re1 = /^(\d+):(\d{2})\.?(\d{0,3})$/ // m:ss.ms
  const re2 = /^(\d+)\.(\d{1,3})$/            // ss.ms
  const re3 = /^(\d+)$/                        // ss
  let m
  if ((m = val.match(re1))) {
    const ms = Number(m[1])*60000 + Number(m[2])*1000 + Number(m[3].padEnd(3,'0'))
    return ms
  }
  if ((m = val.match(re2))) {
    return Number(m[1])*1000 + Number(m[2].padEnd(3,'0'))
  }
  if ((m = val.match(re3))) {
    return Number(m[1]) * 1000
  }
  return null
}

export function usePersonalBests(userId: string | undefined) {
  const [times, setTimes] = useState<RaceTime[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('race_times')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .then(({ data }) => { setTimes(data ?? []); setLoading(false) })
  }, [userId])

  // Current PB per distance
  const pbs: Record<number, RaceTime> = {}
  for (const t of times) {
    if (!pbs[t.distance_m] || t.time_ms < pbs[t.distance_m].time_ms) {
      pbs[t.distance_m] = t
    }
  }

  async function addTime(entry: Omit<RaceTime, 'id' | 'user_id' | 'is_pb' | 'created_at'>) {
    const isPb = !pbs[entry.distance_m] || entry.time_ms < pbs[entry.distance_m].time_ms
    const { data, error } = await supabase
      .from('race_times')
      .insert({ ...entry, user_id: userId, is_pb: isPb })
      .select()
      .single()
    if (!error && data) {
      setTimes(prev => [data, ...prev])
      // Mark previous PB as non-PB if this is faster
      if (isPb && pbs[entry.distance_m]) {
        await supabase
          .from('race_times')
          .update({ is_pb: false })
          .eq('id', pbs[entry.distance_m].id)
        setTimes(prev => prev.map(t =>
          t.id === pbs[entry.distance_m].id ? { ...t, is_pb: false } : t
        ))
      }
    }
    return { data, error, isPb }
  }

  async function deleteTime(id: string) {
    const { error } = await supabase.from('race_times').delete().eq('id', id)
    if (!error) setTimes(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  function getHistory(distanceM: number) {
    return times.filter(t => t.distance_m === distanceM).sort((a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
  }

  return { times, pbs, loading, addTime, deleteTime, getHistory }
}
