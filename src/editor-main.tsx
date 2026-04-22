import React from 'react'
import ReactDOM from 'react-dom/client'
import { EditorScreen } from '@/features/editor/EditorScreen'
import '@/styles/tokens.css'
import '@/styles/global.css'
import '@/styles/motion.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EditorScreen />
  </React.StrictMode>,
)
