import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  body: string
  read: boolean
  created_at: string
}

export interface Conversation {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  lastMessage: string
  lastAt: string
  unread: number
}

export function useMessages(userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!userId) return
    fetchMessages()

    // Realtime subscription
    channelRef.current = supabase
      .channel(`messages:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { channelRef.current?.unsubscribe() }
  }, [userId])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoading(false)
  }

  async function sendMessage(receiverId: string, body: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: userId, receiver_id: receiverId, body })
      .select()
      .single()
    if (!error && data) setMessages(prev => [...prev, data])
    return { data, error }
  }

  async function markRead(senderId: string) {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', userId)
    setMessages(prev => prev.map(m =>
      m.sender_id === senderId && m.receiver_id === userId ? { ...m, read: true } : m
    ))
  }

  function getThread(partnerId: string) {
    return messages.filter(m =>
      (m.sender_id === userId && m.receiver_id === partnerId) ||
      (m.sender_id === partnerId && m.receiver_id === userId)
    )
  }

  function unreadCount(partnerId: string) {
    return messages.filter(m => m.sender_id === partnerId && m.receiver_id === userId && !m.read).length
  }

  const totalUnread = messages.filter(m => m.receiver_id === userId && !m.read).length

  return { messages, loading, sendMessage, markRead, getThread, unreadCount, totalUnread, refetch: fetchMessages }
}
