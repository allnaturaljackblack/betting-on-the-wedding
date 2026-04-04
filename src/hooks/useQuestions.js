import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useQuestions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchQuestions() {
    setLoading(true)
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { questions, loading, error, refetch: fetchQuestions }
}
