import { useCallback, useSyncExternalStore } from 'react'

// Matches Tailwind's `lg` breakpoint (≥1024 px).
export const DESKTOP_QUERY = '(min-width: 1024px)'

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
