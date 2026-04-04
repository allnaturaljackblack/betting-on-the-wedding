/**
 * Calculate payout for a single bet in vegas mode.
 * @param {string} oddsStr - e.g. "+150" or "-180"
 * @param {number} chipsWagered
 * @returns {number} profit (not including stake)
 */
function vegasPayout(oddsStr, chipsWagered) {
  const odds = parseInt(oddsStr, 10)
  if (isNaN(odds) || chipsWagered <= 0) return 0
  if (odds > 0) {
    // Underdog: +150 means win 150 per 100 wagered
    return Math.round((odds / 100) * chipsWagered)
  } else {
    // Favorite: -180 means wager 180 to win 100
    return Math.round((100 / Math.abs(odds)) * chipsWagered)
  }
}

/**
 * Format American odds string for display.
 * @param {string|number} odds
 * @returns {string}
 */
export function formatOdds(odds) {
  if (odds === null || odds === undefined || odds === '') return ''
  const n = parseInt(String(odds), 10)
  if (isNaN(n)) return String(odds)
  return n > 0 ? `+${n}` : `${n}`
}

/**
 * Calculate scores for all guests.
 * @param {Array} bets - all bets from DB
 * @param {Array} questions - all questions from DB
 * @param {Object} settings - settings row
 * @returns {Array} [{ guest_id, total_score }] sorted desc
 */
export function calculateScore(bets, questions, settings) {
  const isVegas = settings?.scoring_mode === 'vegas'
  const showAnswers = settings?.show_answers === true

  // Map questions by id for quick lookup
  const questionMap = {}
  for (const q of questions) {
    questionMap[q.id] = q
  }

  // Group bets by guest
  const guestScores = {}
  for (const bet of bets) {
    if (!guestScores[bet.guest_id]) {
      guestScores[bet.guest_id] = 0
    }

    const q = questionMap[bet.question_id]
    if (!q) continue

    // Only score if answers are shown or we're computing for admin
    if (!showAnswers && !settings?._forceScore) continue

    let isCorrect = false
    const normalizedAnswer = String(bet.answer).trim().toLowerCase()
    if (q.type === 'fill_blank' && Array.isArray(q.accepted_answers) && q.accepted_answers.length > 0) {
      isCorrect = q.accepted_answers.some(
        (a) => String(a).trim().toLowerCase() === normalizedAnswer
      )
    } else {
      isCorrect =
        q.correct_answer &&
        normalizedAnswer === String(q.correct_answer).trim().toLowerCase()
    }

    if (!isCorrect) continue

    if (isVegas) {
      // Find the odds for this answer option
      const oddsForAnswer = q.odds && q.odds[bet.answer]
      if (oddsForAnswer && bet.chips_wagered) {
        guestScores[bet.guest_id] += (bet.chips_wagered || 0) + vegasPayout(oddsForAnswer, bet.chips_wagered)
      } else if (bet.chips_wagered) {
        guestScores[bet.guest_id] += bet.chips_wagered
      }
    } else {
      guestScores[bet.guest_id] += q.points || 0
    }
  }

  return Object.entries(guestScores)
    .map(([guest_id, total_score]) => ({ guest_id, total_score }))
    .sort((a, b) => b.total_score - a.total_score)
}

/**
 * Calculate chips spent by a guest.
 * @param {Array} bets - bets for a single guest
 * @returns {number}
 */
export function chipsSpent(bets) {
  return bets.reduce((sum, b) => sum + (b.chips_wagered || 0), 0)
}
