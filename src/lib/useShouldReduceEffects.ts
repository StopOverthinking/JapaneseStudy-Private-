import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

const COARSE_POINTER_MEDIA_QUERY = '(hover: none) and (pointer: coarse)'

function getCoarsePointerMatch() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(COARSE_POINTER_MEDIA_QUERY).matches
}

export function useShouldReduceEffects() {
  const prefersReducedMotion = useReducedMotion()
  const [hasCoarsePointer, setHasCoarsePointer] = useState(getCoarsePointerMatch)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(COARSE_POINTER_MEDIA_QUERY)
    const update = () => setHasCoarsePointer(mediaQuery.matches)

    update()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }

    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  return Boolean(prefersReducedMotion) || hasCoarsePointer
}
