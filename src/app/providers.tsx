import { useEffect } from 'react'
import { useExamStore } from '@/features/exam/examStore'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useExamStore.getState().hydrate()
    useLearnSessionStore.getState().hydrate()
  }, [])

  return <>{children}</>
}
