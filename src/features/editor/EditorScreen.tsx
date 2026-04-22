import { WordbookEditorPage } from '@/features/editor/WordbookEditorPage'

export function EditorScreen() {
  return (
    <div className="app-shell">
      <main className="screen-frame" style={{ width: 'min(1680px, calc(100vw - 40px))' }}>
        <div className="page-shell">
          <WordbookEditorPage />
        </div>
      </main>
    </div>
  )
}
