import { useEffect } from 'react'
import { useExamStore } from '@/features/exam/examStore'
import { applyThemeMode, usePreferencesStore } from '@/features/preferences/preferencesStore'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const themeMode = usePreferencesStore((state) => state.themeMode)

  useEffect(() => {
    useExamStore.getState().hydrate()
    useLearnSessionStore.getState().hydrate()
  }, [])

  useEffect(() => {
    applyThemeMode(themeMode)
  }, [themeMode])

  return <>{children}</>
}
