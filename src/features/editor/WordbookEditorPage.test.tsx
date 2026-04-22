import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WordbookEditorPage } from '@/features/editor/WordbookEditorPage'
import styles from '@/features/editor/editor.module.css'

describe('WordbookEditorPage', () => {
  it('renders the editor shell with save actions', () => {
    render(<WordbookEditorPage />)

    expect(screen.getByRole('heading', { name: '단어장 DB' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기본' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '주제형' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비교형' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '양식 다운로드' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'xlsx 업로드' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '현재 프로젝트에 저장' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다른 위치 선택' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '세트 추가' })).toBeInTheDocument()
    expect(screen.getByLabelText('단어 ID 접두사')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /^ID$/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'JP 열 너비 조절' })).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('JLPT N3 최빈출 한자 어휘').length).toBeGreaterThan(0)
  }, 20000)

  it('places workbook download and upload actions in the table toolbar', () => {
    render(<WordbookEditorPage />)

    const toolbar = screen.getByRole('button', { name: '양식 다운로드' }).closest(`.${styles.inlineActions}`)

    expect(toolbar).not.toBeNull()
    expect(toolbar).toContainElement(screen.getByRole('button', { name: '양식 다운로드' }))
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'xlsx 업로드' }))
    expect(toolbar).toContainElement(screen.getByRole('button', { name: '단어 추가' }))
  }, 20000)

  it('uses sidebar topic names and a dropdown topic selector in theme mode', () => {
    render(<WordbookEditorPage />)

    fireEvent.click(screen.getByRole('button', { name: '주제형' }))

    expect(screen.getByRole('heading', { name: '세트 정보' })).toBeInTheDocument()
    expect(screen.getByText('세트 이름')).toBeInTheDocument()
    expect(screen.getByText('세트 ID')).toBeInTheDocument()
    expect(screen.getByLabelText('단어 ID 접두사')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /^ID$/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.getAllByDisplayValue('움직임').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('option', { name: '움직임' }).length).toBeGreaterThan(0)
  }, 20000)

  it('opens an in-app dialog when deleting a theme topic', () => {
    render(<WordbookEditorPage />)

    fireEvent.click(screen.getByRole('button', { name: '주제형' }))
    fireEvent.click(screen.getByRole('button', { name: '선택 주제 삭제' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '단어 남기기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '단어도 삭제' })).toBeInTheDocument()
  }, 20000)

  it('aligns compare mode controls with the other wordbook editors', () => {
    render(<WordbookEditorPage />)

    fireEvent.click(screen.getByRole('button', { name: '비교형' }))

    expect(screen.getByRole('heading', { name: '세트 정보' })).toBeInTheDocument()
    expect(screen.getByLabelText('단어 ID 접두사')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /^ID$/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비교 카드 추가' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '비교형 단어 추가' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.queryByRole('heading', { name: '단어' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '설명' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'L JP' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(7)
  }, 20000)

  it('renders comparison pairs as two rows with one shared description box', () => {
    render(<WordbookEditorPage />)

    fireEvent.click(screen.getByRole('button', { name: '비교형' }))

    const sharedDescription = screen.getAllByRole('textbox', { name: '공통 설명' })[0]

    expect(screen.getByDisplayValue('急ぐ')).toBeInTheDocument()
    expect(screen.getByDisplayValue('慌てる')).toBeInTheDocument()
    expect((sharedDescription as HTMLTextAreaElement).value).toContain('急ぐ는')
    expect((sharedDescription as HTMLTextAreaElement).value).toContain('慌てる는')
    expect(sharedDescription.closest('td')).toHaveAttribute('rowspan', '2')
  }, 20000)

  it('resizes a basic table column by dragging the header handle', () => {
    render(<WordbookEditorPage />)

    const header = screen.getByRole('columnheader', { name: /JP/ })
    const handle = screen.getByRole('button', { name: 'JP 열 너비 조절' })

    Object.defineProperty(header, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        width: 96,
        height: 40,
        top: 0,
        left: 0,
        right: 96,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    })

    fireEvent.mouseDown(handle, { clientX: 100 })
    fireEvent.mouseMove(window, { clientX: 156 })
    fireEvent.mouseUp(window)

    expect(header).toHaveStyle({ width: '152px' })
  })
})
