import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Wheel {
  id: string
  user_id: string
  brand: string
  model: string | null
  hardness: string | null
  size_mm: number | null
  color: string | null
  km_limit: number
  km_used: number
  is_active: boolean
  notes: string | null
  purchased_at: string | null
  created_at: string
}

export function useWheels(userId: string | undefined) {
  const [wheels, setWheels] = useState<Wheel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('wheels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setWheels(data ?? []); setLoading(false) })
  }, [userId])

  async function addWheel(w: Omit<Wheel, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('wheels')
      .insert({ ...w, user_id: userId })
      .select()
      .single()
    if (!error && data) setWheels(prev => [data, ...prev])
    return { data, error }
  }

  async function updateKm(wheelId: string, kmToAdd: number) {
    const wheel = wheels.find(w => w.id === wheelId)
    if (!wheel) return
    const newKm = Number(wheel.km_used) + kmToAdd
    const { error } = await supabase.from('wheels').update({ km_used: newKm }).eq('id', wheelId)
    if (!error) setWheels(prev => prev.map(w => w.id === wheelId ? { ...w, km_used: newKm } : w))
    return { error }
  }

  async function toggleActive(wheelId: string) {
    const wheel = wheels.find(w => w.id === wheelId)
    if (!wheel) return
    const { error } = await supabase.from('wheels').update({ is_active: !wheel.is_active }).eq('id', wheelId)
    if (!error) setWheels(prev => prev.map(w => w.id === wheelId ? { ...w, is_active: !w.is_active } : w))
  }

  async function deleteWheel(wheelId: string) {
    const { error } = await supabase.from('wheels').delete().eq('id', wheelId)
    if (!error) setWheels(prev => prev.filter(w => w.id !== wheelId))
    return { error }
  }

  return { wheels, loading, addWheel, updateKm, toggleActive, deleteWheel }
}
