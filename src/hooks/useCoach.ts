import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile, TrainingSession } from '@/types/database'

export interface AthleteWithStats extends Profile {
  session_count: number
  last_session_at: string | null
  total_distance_km: number
  avg_rpe: number | null
}

export interface TrainingPlan {
  id: string
  coach_id: string
  athlete_id: string
  title: string
  description: string | null
  sport_type: string
  weeks: number
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  sessions_per_week: number
  notes: string | null
  created_at: string
}

export function useCoach(coachId: string | undefined) {
  const [athletes, setAthletes] = useState<AthleteWithStats[]>([])
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!coachId) return
    fetchAthletes()
    fetchPlans()
  }, [coachId])

  async function fetchAthletes() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('coach_id', coachId)
      .eq('role', 'athlete')

    if (!profiles) { setLoading(false); return }

    const athleteIds = profiles.map(p => p.id)
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('user_id, started_at, distance_km, rpe')
      .in('user_id', athleteIds)

    const statsMap: Record<string, { count: number; lastAt: string | null; dist: number; rpeSum: number; rpeCount: number }> = {}
    for (const p of profiles) {
      statsMap[p.id] = { count: 0, lastAt: null, dist: 0, rpeSum: 0, rpeCount: 0 }
    }
    for (const s of sessions ?? []) {
      const st = statsMap[s.user_id]
      if (!st) continue
      st.count++
      st.dist += s.distance_km ?? 0
      if (s.rpe) { st.rpeSum += s.rpe; st.rpeCount++ }
      if (!st.lastAt || s.started_at > st.lastAt) st.lastAt = s.started_at
    }

    setAthletes(profiles.map(p => ({
      ...p,
      session_count: statsMap[p.id]?.count ?? 0,
      last_session_at: statsMap[p.id]?.lastAt ?? null,
      total_distance_km: Math.round(statsMap[p.id]?.dist ?? 0),
      avg_rpe: statsMap[p.id]?.rpeCount
        ? Math.round((statsMap[p.id].rpeSum / statsMap[p.id].rpeCount) * 10) / 10
        : null,
    })))
    setLoading(false)
  }

  async function fetchPlans() {
    const { data } = await supabase
      .from('training_plans')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
    setPlans(data ?? [])
  }

  async function createPlan(plan: Omit<TrainingPlan, 'id' | 'created_at' | 'coach_id'>) {
    const { data, error } = await supabase
      .from('training_plans')
      .insert({ ...plan, coach_id: coachId })
      .select()
      .single()
    if (!error && data) setPlans(prev => [data, ...prev])
    return { data, error }
  }

  async function updatePlanStatus(planId: string, status: TrainingPlan['status']) {
    const { error } = await supabase
      .from('training_plans')
      .update({ status })
      .eq('id', planId)
    if (!error) setPlans(prev => prev.map(p => p.id === planId ? { ...p, status } : p))
    return { error }
  }

  async function deletePlan(planId: string) {
    const { error } = await supabase
      .from('training_plans')
      .delete()
      .eq('id', planId)
    if (!error) setPlans(prev => prev.filter(p => p.id !== planId))
    return { error }
  }

  return { athletes, plans, loading, createPlan, updatePlanStatus, deletePlan, refetch: fetchAthletes }
}

export function useAthleteDetail(athleteId: string | undefined) {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!athleteId) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', athleteId).single(),
      supabase.from('training_sessions').select('*').eq('user_id', athleteId).order('started_at', { ascending: false }).limit(30),
    ]).then(([{ data: p }, { data: s }]) => {
      setProfile(p)
      setSessions(s ?? [])
      setLoading(false)
    })
  }, [athleteId])

  return { profile, sessions, loading }
}
