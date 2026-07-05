import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface WellnessLog {
  id: string
  user_id: string
  log_date: string
  sleep_hours: number | null
  sleep_quality: number | null
  fatigue: number | null
  hydration: number | null
  mood: number | null
  stress: number | null
  muscle_soreness: number | null
  resting_hr: number | null
  weight_kg: number | null
  notes: string | null
  created_at: string
}

export function useWellness(userId: string | undefined) {
  const [logs, setLogs] = useState<WellnessLog[]>([])
  const [today, setToday] = useState<WellnessLog | null>(null)
  const [loading, setLoading] = useState(true)

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!userId) return
    supabase
      .from('wellness_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setLogs(data ?? [])
        setToday(data?.find(l => l.log_date === todayStr) ?? null)
        setLoading(false)
      })
  }, [userId])

  async function upsertLog(log: Partial<WellnessLog> & { log_date: string }) {
    const { data, error } = await supabase
      .from('wellness_logs')
      .upsert({ ...log, user_id: userId }, { onConflict: 'user_id,log_date' })
      .select()
      .single()
    if (!error && data) {
      setLogs(prev => {
        const idx = prev.findIndex(l => l.log_date === data.log_date)
        return idx >= 0 ? prev.map((l, i) => i === idx ? data : l) : [data, ...prev]
      })
      if (data.log_date === todayStr) setToday(data)
    }
    return { data, error }
  }

  return { logs, today, loading, upsertLog }
}
