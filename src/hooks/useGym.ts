import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface Exercise {
  id: string
  name: string
  category: string
  description: string | null
  muscle_group: string | null
  is_skate_specific: boolean
}

export interface GymSet {
  id: string
  exercise_id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  duration_s: number | null
  notes: string | null
  exercise?: Exercise
}

export interface GymSession {
  id: string
  session_date: string
  duration_min: number | null
  notes: string | null
  rpe: number | null
  sets?: GymSet[]
}

export function useGym() {
  const { profile } = useAuth()
  const [sessions, setSessions] = useState<GymSession[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadExercises()
    loadSessions()
  }, [profile])

  async function loadExercises() {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    if (data) setExercises(data)
  }

  async function loadSessions() {
    setLoading(true)
    const { data } = await supabase
      .from('gym_sessions')
      .select(`
        *,
        sets:gym_sets(*, exercise:exercises(*))
      `)
      .eq('user_id', profile!.id)
      .order('session_date', { ascending: false })
      .limit(30)
    if (data) setSessions(data as GymSession[])
    setLoading(false)
  }

  async function createSession(fields: {
    session_date: string
    duration_min?: number
    notes?: string
    rpe?: number
  }) {
    const { data, error } = await supabase
      .from('gym_sessions')
      .insert({ ...fields, user_id: profile!.id })
      .select()
      .single()
    if (error) throw error
    await loadSessions()
    return data
  }

  async function addSet(sessionId: string, set: Omit<GymSet, 'id' | 'session_id'>) {
    const { error } = await supabase
      .from('gym_sets')
      .insert({ ...set, session_id: sessionId })
    if (error) throw error
    await loadSessions()
  }

  async function deleteSession(id: string) {
    const { error } = await supabase.from('gym_sessions').delete().eq('id', id)
    if (error) throw error
    setSessions(s => s.filter(x => x.id !== id))
  }

  return { sessions, exercises, loading, createSession, addSet, deleteSession }
}
