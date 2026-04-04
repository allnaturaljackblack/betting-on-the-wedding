import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateScore } from '../utils/scoring'

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [guestsRes, betsRes, questionsRes, settingsRes] = await Promise.all([
        supabase.from('guests').select('*'),
        supabase.from('bets').select('*'),
        supabase.from('questions').select('*'),
        supabase.from('settings').select('*').eq('id', 1).single(),
      ])

      if (guestsRes.error) throw guestsRes.error
      if (betsRes.error) throw betsRes.error
      if (questionsRes.error) throw questionsRes.error
      if (settingsRes.error) throw settingsRes.error

      const guests = guestsRes.data || []
      const bets = betsRes.data || []
      const questions = questionsRes.data || []
      const settingsData = { ...settingsRes.data, _forceScore: true }

      setSettings(settingsRes.data)

      // Build guest map
      const guestMap = {}
      for (const g of guests) {
        guestMap[g.id] = g
      }

      // Count bets per guest
      const betCount = {}
      for (const b of bets) {
        betCount[b.guest_id] = (betCount[b.guest_id] || 0) + 1
      }

      // Calculate scores
      const scores = calculateScore(bets, questions, settingsData)

      // Build leaderboard — include all guests even with 0 score
      const guestsWithScore = guests.map((g) => {
        const scoreEntry = scores.find((s) => s.guest_id === g.id)
        return {
          id: g.id,
          name: g.name,
          score: scoreEntry ? scoreEntry.total_score : 0,
          betCount: betCount[g.id] || 0,
        }
      })

      // Sort by score desc, then name
      guestsWithScore.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.name.localeCompare(b.name)
      })

      // Assign ranks (tied scores get same rank)
      let rank = 1
      for (let i = 0; i < guestsWithScore.length; i++) {
        if (i > 0 && guestsWithScore[i].score < guestsWithScore[i - 1].score) {
          rank = i + 1
        }
        guestsWithScore[i].rank = rank
      }

      setLeaderboard(guestsWithScore)
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchAll)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { leaderboard, settings, loading, error, refetch: fetchAll }
}
