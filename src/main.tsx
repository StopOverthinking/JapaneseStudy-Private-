import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { applyThemeMode, readStoredThemeMode } from '@/features/preferences/preferencesStore'
import '@/styles/tokens.css'
import '@/styles/global.css'
import '@/styles/motion.css'

applyThemeMode(readStoredThemeMode())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
