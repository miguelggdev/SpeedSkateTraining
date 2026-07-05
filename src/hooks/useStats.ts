import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

export interface MonthStats {
  sessions: number
  distanceKm: number
  calories: number
  activeMinutes: number
  bySport: { skating: number; cycling: number; gym: number }
}

export interface WeekPoint {
  day: string
  skating: number
  cycling: number
  gym: number
}

export interface RecentSession {
  id: string
  sport_type: string
  training_type: string | null
  started_at: string
  duration_minutes: number | null
  distance_km: number | null
  calories: number | null
  track_type: string | null
  comments: string | null
}

export interface StatsState {
  loading: boolean
  month: MonthStats
  weekPoints: WeekPoint[]
  recentSessions: RecentSession[]
  totalSessions: number
  totalKm: number
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function useStats() {
  const { user } = useAuth()
  const [state, setState] = useState<StatsState>({
    loading: true,
    month: { sessions: 0, distanceKm: 0, calories: 0, activeMinutes: 0, bySport: { skating: 0, cycling: 0, gym: 0 } },
    weekPoints: [],
    recentSessions: [],
    totalSessions: 0,
    totalKm: 0,
  })

  useEffect(() => {
    if (!user) return

    async function load() {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()

      const [{ data: monthData }, { data: weekData }, { data: recent }, { data: totals }] = await Promise.all([
        supabase.from('training_sessions')
          .select('sport_type, duration_minutes, distance_km, calories')
          .eq('user_id', user!.id)
          .gte('started_at', monthStart),
        supabase.from('training_sessions')
          .select('sport_type, started_at, duration_minutes')
          .eq('user_id', user!.id)
          .gte('started_at', weekStart),
        supabase.from('training_sessions')
          .select('id, sport_type, training_type, started_at, duration_minutes, distance_km, calories, track_type, comments')
          .eq('user_id', user!.id)
          .order('started_at', { ascending: false })
          .limit(10),
        supabase.from('training_sessions')
          .select('distance_km')
          .eq('user_id', user!.id),
      ])

      const month: MonthStats = {
        sessions: monthData?.length ?? 0,
        distanceKm: monthData?.reduce((a, s) => a + (s.distance_km ?? 0), 0) ?? 0,
        calories: monthData?.reduce((a, s) => a + (s.calories ?? 0), 0) ?? 0,
        activeMinutes: monthData?.reduce((a, s) => a + (s.duration_minutes ?? 0), 0) ?? 0,
        bySport: {
          skating: monthData?.filter(s => s.sport_type === 'skating').length ?? 0,
          cycling: monthData?.filter(s => s.sport_type === 'cycling').length ?? 0,
          gym:     monthData?.filter(s => s.sport_type === 'gym').length ?? 0,
        },
      }

      // Build 7-day points
      const weekPoints: WeekPoint[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
        const dayStr = d.toDateString()
        const daySessions = weekData?.filter(s => new Date(s.started_at).toDateString() === dayStr) ?? []
        return {
          day: DAYS[d.getDay()],
          skating: daySessions.filter(s => s.sport_type === 'skating').reduce((a, s) => a + (s.duration_minutes ?? 0), 0),
          cycling: daySessions.filter(s => s.sport_type === 'cycling').reduce((a, s) => a + (s.duration_minutes ?? 0), 0),
          gym:     daySessions.filter(s => s.sport_type === 'gym').reduce((a, s) => a + (s.duration_minutes ?? 0), 0),
        }
      })

      const totalKm = totals?.reduce((a, s) => a + (s.distance_km ?? 0), 0) ?? 0

      setState({
        loading: false,
        month,
        weekPoints,
        recentSessions: (recent ?? []) as RecentSession[],
        totalSessions: totals?.length ?? 0,
        totalKm: Math.round(totalKm * 10) / 10,
      })
    }

    load()
  }, [user])

  return state
}
