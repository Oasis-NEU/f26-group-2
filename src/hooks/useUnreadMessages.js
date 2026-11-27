import { useEffect, useState } from 'react'

import { hasUnreadMessages, MESSAGES_READ_EVENT } from '../data/messages'

// How often to check for new messages while the tab is open.
const CHECK_MS = 30000

// Every page renders its own Nav, so remember the last answer between pages.
// Otherwise the dot would blink off on each page change until the check ends.
let lastKnown = { userId: null, unread: false }

// Whether the signed-in user has unread messages, for the nav's red dot.
// Checks on load, every 30 seconds while the tab is visible, when the tab
// comes back into focus, and right after a conversation is read.
export function useUnreadMessages(userId) {
  const [unread, setUnread] = useState(lastKnown.userId === userId && lastKnown.unread)

  useEffect(() => {
    if (!userId) return undefined
    let ignore = false

    async function check() {
      if (document.visibilityState === 'hidden') return
      try {
        const next = await hasUnreadMessages(userId)
        lastKnown = { userId, unread: next }
        if (!ignore) setUnread(next)
      } catch (error) {
        // Keep showing the last answer; the next check may work.
        console.error(error)
      }
    }

    check()
    const timer = setInterval(check, CHECK_MS)
    document.addEventListener('visibilitychange', check)
    window.addEventListener(MESSAGES_READ_EVENT, check)

    return () => {
      ignore = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener(MESSAGES_READ_EVENT, check)
    }
  }, [userId])

  return Boolean(userId) && unread
}
