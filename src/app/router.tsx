import { createHashRouter } from 'react-router-dom'
import { App } from '@/app/App'
import { ExamResultPage } from '@/features/exam/ExamResultPage'
import { ExamSessionPage } from '@/features/exam/ExamSessionPage'
import { ExamSetupPage } from '@/features/exam/ExamSetupPage'
import { GameResultPage } from '@/features/game/GameResultPage'
import { GameSessionPage } from '@/features/game/GameSessionPage'
import { GameSetupPage } from '@/features/game/GameSetupPage'
import { HomePage } from '@/features/home/HomePage'
import { LearnResultPage } from '@/features/learn/LearnResultPage'
import { LearnSessionPage } from '@/features/learn/LearnSessionPage'
import { LearnSetupPage } from '@/features/learn/LearnSetupPage'
import { ListPage } from '@/features/list/ListPage'

export const router = createHashRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'list', element: <ListPage /> },
        { path: 'learn', element: <LearnSetupPage /> },
        { path: 'learn/session', element: <LearnSessionPage /> },
        { path: 'learn/result', element: <LearnResultPage /> },
        { path: 'exam', element: <ExamSetupPage /> },
        { path: 'exam/session', element: <ExamSessionPage /> },
        { path: 'exam/result', element: <ExamResultPage /> },
        { path: 'game', element: <GameSetupPage /> },
        { path: 'game/session', element: <GameSessionPage /> },
        { path: 'game/result', element: <GameResultPage /> },
      ],
    },
  ],
)
