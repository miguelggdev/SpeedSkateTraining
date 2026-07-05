import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Goal {
  id: string
  user_id: string
  title: string
  sport_type: string | null
  metric: 'sessions' | 'distance_km' | 'duration_minutes' | 'calories' | 'points'
  target_value: number
  current_value: number
  period: 'weekly' | 'monthly' | 'yearly' | 'custom'
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'failed' | 'cancelled'
  created_at: string
}

export interface Achievement {
  id: string
  user_id: string
  badge_key: string
  title: string
  description: string | null
  icon: string
  earned_at: string
}

const BADGE_DEFINITIONS = [
  { key: 'first_session',  title: 'Primera sesión',    icon: '⛸️',  desc: 'Completaste tu primer entrenamiento' },
  { key: 'sessions_10',    title: '10 sesiones',        icon: '🔟',  desc: 'Llegaste a 10 sesiones registradas' },
  { key: 'sessions_50',    title: '50 sesiones',        icon: '🏅',  desc: '50 entrenamientos completados' },
  { key: 'sessions_100',   title: '100 sesiones',       icon: '💯',  desc: 'Un centenar de entrenamientos' },
  { key: 'km_50',          title: '50 kilómetros',      icon: '📍',  desc: 'Acumulaste 50 km de entrenamiento' },
  { key: 'km_100',         title: '100 kilómetros',     icon: '🗺️', desc: 'Cien kilómetros recorridos' },
  { key: 'km_500',         title: '500 kilómetros',     icon: '🌍',  desc: 'Medio millar de kilómetros' },
  { key: 'streak_7',       title: 'Racha de 7 días',    icon: '🔥',  desc: 'Entrenaste 7 días seguidos' },
  { key: 'streak_30',      title: 'Racha de 30 días',   icon: '🌟',  desc: 'Un mes sin parar' },
  { key: 'multisport',     title: 'Multideporte',       icon: '🎽',  desc: 'Entrenaste los 3 deportes' },
  { key: 'early_bird',     title: 'Madrugador',         icon: '🌅',  desc: 'Sesión antes de las 7am' },
  { key: 'goal_first',     title: 'Primera meta',       icon: '🎯',  desc: 'Completaste tu primera meta' },
]

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('achievements').select('*').eq('user_id', userId).order('earned_at', { ascending: false }),
    ]).then(([{ data: g }, { data: a }]) => {
      setGoals(g ?? [])
      setAchievements(a ?? [])
      setLoading(false)
    })
  }, [userId])

  async function createGoal(goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'current_value' | 'status'>) {
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: userId, current_value: 0, status: 'active' })
      .select()
      .single()
    if (!error && data) setGoals(prev => [data, ...prev])
    return { data, error }
  }

  async function updateGoalStatus(goalId: string, status: Goal['status']) {
    const { error } = await supabase.from('goals').update({ status }).eq('id', goalId)
    if (!error) setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status } : g))
    return { error }
  }

  async function deleteGoal(goalId: string) {
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (!error) setGoals(prev => prev.filter(g => g.id !== goalId))
    return { error }
  }

  async function earnBadge(badgeKey: string) {
    const def = BADGE_DEFINITIONS.find(b => b.key === badgeKey)
    if (!def || achievements.find(a => a.badge_key === badgeKey)) return
    const { data, error } = await supabase
      .from('achievements')
      .insert({ user_id: userId, badge_key: def.key, title: def.title, description: def.desc, icon: def.icon })
      .select()
      .single()
    if (!error && data) setAchievements(prev => [data, ...prev])
  }

  const allBadges = BADGE_DEFINITIONS.map(b => ({
    ...b,
    earned: achievements.find(a => a.badge_key === b.key) ?? null,
  }))

  return { goals, achievements, allBadges, loading, createGoal, updateGoalStatus, deleteGoal, earnBadge }
}
