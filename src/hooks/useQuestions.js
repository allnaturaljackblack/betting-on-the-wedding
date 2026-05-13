import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useQuestions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(true)

  async function fetchQuestions() {
    setError(null)
    const { data, error: err } = await supabase
      .from('questions')
      .select('*')
      .eq('active', true)
      .order('order_index', { ascending: true })
    if (err) {
      setError(err.message)
    } else {
      setQuestions(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQuestions()

    const channel = supabase
      .channel('questions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        fetchQuestions()
      })
      .on('system', {}, (status) => {
        if (status === 'SUBSCRIBED') setConnected(true)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnected(true)
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnected(false)
        }
      })

    // Refetch when the tab becomes visible again (phone waking up)
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        fetchQuestions()
        setConnected(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { questions, loading, error, connected, refetch: fetchQuestions }
}
