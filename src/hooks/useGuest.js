import { useState } from 'react'

const STORAGE_KEY = 'wedding_guest'

function readGuest() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useGuest() {
  const [guest, setGuestState] = useState(readGuest)

  function setGuest(guestObj) {
    if (guestObj) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestObj))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setGuestState(guestObj)
  }

  function clearGuest() {
    setGuest(null)
  }

  return { guest, setGuest, clearGuest }
}
