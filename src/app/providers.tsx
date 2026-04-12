import { useEffect } from 'react'
import { useConjugationStore } from '@/features/conjugation/conjugationStore'
import { useExamStore } from '@/features/exam/examStore'
import { applyThemeMode, usePreferencesStore } from '@/features/preferences/preferencesStore'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'
import { useSmartReviewStore } from '@/features/smart-review/smartReviewStore'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const themeMode = usePreferencesStore((state) => state.themeMode)

  useEffect(() => {
    useConjugationStore.getState().hydrate()
    useExamStore.getState().hydrate()
    useLearnSessionStore.getState().hydrate()
    useSmartReviewStore.getState().hydrate()
  }, [])

  useEffect(() => {
    applyThemeMode(themeMode)
  }, [themeMode])

  return <>{children}</>
}
