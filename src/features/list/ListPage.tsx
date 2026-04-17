import { memo, startTransition, type KeyboardEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Heart, Search, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import { useExamStore } from '@/features/exam/examStore'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { allSets, allWords, getSetName, getWordById, getWordsForSet } from '@/features/vocab/model/selectors'
import type { VocabularyWord } from '@/features/vocab/model/types'
import { matchesWordSearch } from '@/lib/search'
import styles from '@/features/list/list.module.css'

const TOOLBAR_INTERACTION_LOCK_MS = 640

function cancelAnimationFrameSafely(frameId: number | null) {
  if (frameId === null || typeof window === 'undefined') {
    return
  }

  window.cancelAnimationFrame(frameId)
}

function scheduleAfterNextPaint(frameRef: { current: number | null }, task: () => void) {
  if (typeof window === 'undefined') {
    task()
    return
  }

  cancelAnimationFrameSafely(frameRef.current)
  frameRef.current = window.requestAnimationFrame(() => {
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      task()
    })
  })
}

function resolveListSetId(setId: string | 'all') {
  if (setId === 'all') {
    return allSets[0]?.id ?? 'favorites'
  }

  return setId
}

function ConcealedText({
  className,
  sample,
  lang,
  translate,
}: {
  className: string
  sample: string
  lang?: string
  translate?: 'yes' | 'no'
}) {
  return (
    <span aria-hidden="true" className={`${className} ${styles.concealed}`} lang={lang} translate={translate}>
      <span className={styles.concealedGhost}>{sample}</span>
    </span>
  )
}

function SlashGlyphIcon({
  glyph,
  glyphFontFamily,
  size = 24,
  strokeWidth = 1.9,
  ...rest
}: LucideProps & {
  glyph: string
  glyphFontFamily: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      {...rest}
    >
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="20"
        fontWeight="700"
        fontFamily={glyphFontFamily}
        fill="currentColor"
        stroke="none"
      >
        {glyph}
      </text>
      <path d="M4.5 4.5L19.5 19.5" />
    </svg>
  )
}

function JapaneseHiddenIcon(props: LucideProps) {
  return <SlashGlyphIcon {...props} glyph="日" glyphFontFamily="var(--font-jp), 'Noto Sans JP', sans-serif" />
}

function MeaningHiddenIcon(props: LucideProps) {
  return <SlashGlyphIcon {...props} glyph="가" glyphFontFamily="var(--font-ui), 'Noto Sans KR', sans-serif" />
}

function getPartOfSpeechLabel(word: VocabularyWord) {
  switch (word.type) {
    case 'verb':
      if (word.verbInfo?.includes('1')) return '1동사'
      if (word.verbInfo?.includes('2')) return '2동사'
      if (word.verbInfo?.includes('3')) return '3동사'
      return '동사'
    case 'noun':
      return '명사'
    case 'i_adj':
      return 'い형'
    case 'na_adj':
      return 'な형'
    case 'adv':
      return '부사'
    case 'expression':
      return '표현'
    default:
      return '기타'
  }
}

const VocabCard = memo(function VocabCard({
  word,
  hideJapanese,
  hideMeaning,
  hideJapaneseVersion,
  hideMeaningVersion,
  displayNumber,
  isFavorite,
  onToggleFavorite,
}: {
  word: VocabularyWord
  hideJapanese: boolean
  hideMeaning: boolean
  hideJapaneseVersion: number
  hideMeaningVersion: number
  displayNumber: number
  isFavorite: boolean
  onToggleFavorite: (wordId: string) => void
}) {
  const [revealedState, setRevealedState] = useState(() => ({
    japanese: false,
    meaning: false,
    hideJapaneseVersion,
    hideMeaningVersion,
  }))
  const revealJapanese = revealedState.hideJapaneseVersion === hideJapaneseVersion && revealedState.japanese
  const revealMeaning = revealedState.hideMeaningVersion === hideMeaningVersion && revealedState.meaning
  const japaneseHidden = hideJapanese && !revealJapanese
  const meaningHidden = hideMeaning && !revealMeaning
  const hasHiddenContent = japaneseHidden || meaningHidden

  const revealHiddenContent = () => {
    setRevealedState((current) => ({
      japanese: japaneseHidden ? true : current.hideJapaneseVersion === hideJapaneseVersion && current.japanese,
      meaning: meaningHidden ? true : current.hideMeaningVersion === hideMeaningVersion && current.meaning,
      hideJapaneseVersion,
      hideMeaningVersion,
    }))
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasHiddenContent) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      revealHiddenContent()
    }
  }

  return (
    <GlassPanel className={styles.card} padding="sm">
      <div
        className={styles.cardSurface}
        data-revealable={hasHiddenContent}
        role={hasHiddenContent ? 'button' : undefined}
        tabIndex={hasHiddenContent ? 0 : undefined}
        onClick={hasHiddenContent ? revealHiddenContent : undefined}
        onKeyDown={hasHiddenContent ? handleCardKeyDown : undefined}
      >
        <div className={styles.cardTop}>
          <div className={styles.chipRow}>
            <span className={styles.orderBadge}>{displayNumber}번</span>
            <span className={styles.partBadge}>{getPartOfSpeechLabel(word)}</span>
          </div>
          <Tooltip label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
            <button
              type="button"
              aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              className={styles.cardFavoriteButton}
              onClick={(event) => {
                event.stopPropagation()
                onToggleFavorite(word.id)
              }}
            >
              <Heart size={18} strokeWidth={1.9} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </Tooltip>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.wordColumn}>
            {japaneseHidden ? (
              <>
                <ConcealedText className={styles.jp} sample={word.japanese} lang="ja-JP" translate="no" />
                <ConcealedText className={styles.reading} sample={word.reading} lang="ja-JP" translate="no" />
              </>
            ) : (
              <>
                <span className={styles.jp} lang="ja-JP" translate="no">
                  {word.japanese}
                </span>
                <span className={styles.reading} lang="ja-JP" translate="no">
                  {word.reading}
                </span>
              </>
            )}
          </div>

          <div className={styles.meaningColumn}>
            {meaningHidden ? (
              <ConcealedText className={styles.meaning} sample={word.meaning} />
            ) : (
              <span className={styles.meaning}>{word.meaning}</span>
            )}
          </div>
        </div>
      </div>
    </GlassPanel>
  )
})

export function ListPage() {
  const navigate = useNavigate()
  const wrongAnswerIds = useExamStore((state) => state.wrongAnswerIds)
  const persistedHideJapaneseInList = usePreferencesStore((state) => state.hideJapaneseInList)
  const persistedHideMeaningInList = usePreferencesStore((state) => state.hideMeaningInList)
  const persistedListFontScale = usePreferencesStore((state) => state.listFontScale)
  const lastSelectedSetId = usePreferencesStore((state) => state.lastSelectedSetId)
  const setLastSelectedSetId = usePreferencesStore((state) => state.setLastSelectedSetId)
  const setHideJapaneseInList = usePreferencesStore((state) => state.setHideJapaneseInList)
  const setHideMeaningInList = usePreferencesStore((state) => state.setHideMeaningInList)
  const setListFontScale = usePreferencesStore((state) => state.setListFontScale)
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hideJapaneseInList, setHideJapaneseInListImmediate] = useState(persistedHideJapaneseInList)
  const [hideMeaningInList, setHideMeaningInListImmediate] = useState(persistedHideMeaningInList)
  const [listFontScale, setListFontScaleImmediate] = useState(persistedListFontScale)
  const [hideJapaneseVersion, setHideJapaneseVersion] = useState(0)
  const [hideMeaningVersion, setHideMeaningVersion] = useState(0)
  const deferredQuery = useDeferredValue(query)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null)
  const scrollDistanceRef = useRef(0)
  const toolbarInteractionLockUntilRef = useRef(0)
  const hideJapanesePersistFrameRef = useRef<number | null>(null)
  const hideMeaningPersistFrameRef = useRef<number | null>(null)
  const listFontScalePersistFrameRef = useRef<number | null>(null)
  const wrongAnswerWords = useMemo(
    () =>
      wrongAnswerIds
        .map((wordId) => getWordById(wordId))
        .filter((word): word is VocabularyWord => word !== undefined),
    [wrongAnswerIds],
  )
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])
  const resolvedSetId = resolveListSetId(lastSelectedSetId)
  const currentSetName = resolvedSetId === 'wrong_answers' ? '오답 노트' : getSetName(resolvedSetId)

  useEffect(() => {
    if (resolvedSetId !== lastSelectedSetId) {
      setLastSelectedSetId(resolvedSetId)
    }
  }, [lastSelectedSetId, resolvedSetId, setLastSelectedSetId])

  const baseWords = useMemo(() => {
    if (resolvedSetId === 'wrong_answers') {
      return wrongAnswerWords
    }

    if (resolvedSetId === 'favorites') {
      return allWords.filter((word) => favoriteIdSet.has(word.id))
    }

    return getWordsForSet(resolvedSetId)
  }, [favoriteIdSet, resolvedSetId, wrongAnswerWords])

  const words = useMemo(() => {
    return baseWords
      .filter((word) => (favoritesOnly ? favoriteIdSet.has(word.id) : true))
      .filter((word) => matchesWordSearch(word, deferredQuery))
  }, [baseWords, deferredQuery, favoriteIdSet, favoritesOnly])

  const fontScaleStyle = useMemo(() => {
    const presets = [
      { jp: '1.02rem', reading: '0.76rem', meaning: '0.82rem' },
      { jp: '1.12rem', reading: '0.82rem', meaning: '0.88rem' },
      { jp: '1.22rem', reading: '0.88rem', meaning: '0.94rem' },
      { jp: '1.32rem', reading: '0.94rem', meaning: '1rem' },
      { jp: '1.44rem', reading: '1rem', meaning: '1.08rem' },
      { jp: '1.56rem', reading: '1.08rem', meaning: '1.16rem' },
      { jp: '1.7rem', reading: '1.16rem', meaning: '1.24rem' },
    ]
    const preset = presets[listFontScale] ?? presets[3]

    return {
      ['--list-jp-size' as string]: preset.jp,
      ['--list-reading-size' as string]: preset.reading,
      ['--list-meaning-size' as string]: preset.meaning,
    }
  }, [listFontScale])

  const keepToolbarVisible = () => {
    const now = typeof performance === 'undefined' ? Date.now() : performance.now()
    toolbarInteractionLockUntilRef.current = now + TOOLBAR_INTERACTION_LOCK_MS
    setToolbarVisible(true)
    scrollDirectionRef.current = null
    scrollDistanceRef.current = 0
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrameSafely(hideJapanesePersistFrameRef.current)
      cancelAnimationFrameSafely(hideMeaningPersistFrameRef.current)
      cancelAnimationFrameSafely(listFontScalePersistFrameRef.current)
    }
  }, [])

  const updateHideJapaneseInList = (next: boolean) => {
    setHideJapaneseInListImmediate(next)
    setHideJapaneseVersion((version) => version + 1)
    scheduleAfterNextPaint(hideJapanesePersistFrameRef, () => {
      setHideJapaneseInList(next)
    })
  }

  const updateHideMeaningInList = (next: boolean) => {
    setHideMeaningInListImmediate(next)
    setHideMeaningVersion((version) => version + 1)
    scheduleAfterNextPaint(hideMeaningPersistFrameRef, () => {
      setHideMeaningInList(next)
    })
  }

  const updateListFontScale = (next: number) => {
    const clampedNext = Math.max(0, Math.min(6, next))
    setListFontScaleImmediate(clampedNext)
    scheduleAfterNextPaint(listFontScalePersistFrameRef, () => {
      setListFontScale(clampedNext)
    })
  }

  useEffect(() => {
    lastScrollYRef.current = window.scrollY
    scrollDirectionRef.current = null
    scrollDistanceRef.current = 0

    const handleScroll = () => {
      const currentY = Math.max(window.scrollY, 0)
      const delta = currentY - lastScrollYRef.current
      lastScrollYRef.current = currentY
      const magnitude = Math.abs(delta)
      const now = typeof performance === 'undefined' ? Date.now() : performance.now()

      if (now < toolbarInteractionLockUntilRef.current) {
        setToolbarVisible(true)
        scrollDirectionRef.current = null
        scrollDistanceRef.current = 0
        return
      }

      if (magnitude < 2) {
        return
      }

      if (currentY <= 24) {
        setToolbarVisible(true)
        scrollDirectionRef.current = null
        scrollDistanceRef.current = 0
        return
      }

      const direction = delta > 0 ? 'down' : 'up'

      if (scrollDirectionRef.current !== direction) {
        scrollDirectionRef.current = direction
        scrollDistanceRef.current = 0
      }

      scrollDistanceRef.current += magnitude

      if (direction === 'up' && scrollDistanceRef.current >= 18) {
        setToolbarVisible(true)
        scrollDistanceRef.current = 0
        return
      }

      if (direction === 'down' && scrollDistanceRef.current >= 42) {
        setToolbarVisible(false)
        scrollDistanceRef.current = 0
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className={styles.root} style={fontScaleStyle}>
      <div className="page-header">
        <div className="page-header__left">
          <Tooltip label="홈으로 이동">
            <span>
              <IconButton icon={Undo2} label="홈으로 이동" onClick={() => navigate('/')} />
            </span>
          </Tooltip>
          <div className="page-header__meta">
            <p className="page-header__caption">{currentSetName}</p>
            <h1 className="page-header__title">목록 모드</h1>
          </div>
        </div>
        <div className="page-header__right">
          <span className="page-header__caption">{`${words.length}개 표시`}</span>
        </div>
      </div>

      <div className={`${styles.toolbarDock} ${toolbarVisible ? styles.toolbarVisible : styles.toolbarHidden}`}>
        <div className={styles.searchWrap}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarActions}>
              <Tooltip label="검색">
                <span>
                  <IconButton
                    icon={Search}
                    label="검색"
                    active={searchOpen}
                    onClick={() => {
                      keepToolbarVisible()
                      setSearchOpen((value) => !value)
                    }}
                  />
                </span>
              </Tooltip>
              <Tooltip label="일본어 가리기">
                <span>
                  <IconButton
                    icon={JapaneseHiddenIcon}
                    label="일본어 가리기"
                    active={hideJapaneseInList}
                    onClick={() => {
                      keepToolbarVisible()
                      updateHideJapaneseInList(!hideJapaneseInList)
                    }}
                  />
                </span>
              </Tooltip>
              <Tooltip label="뜻 가리기">
                <span>
                  <IconButton
                    icon={MeaningHiddenIcon}
                    label="뜻 가리기"
                    active={hideMeaningInList}
                    onClick={() => {
                      keepToolbarVisible()
                      updateHideMeaningInList(!hideMeaningInList)
                    }}
                  />
                </span>
              </Tooltip>
              <Tooltip label="즐겨찾기만 보기">
                <span>
                  <IconButton
                    icon={Heart}
                    label="즐겨찾기만 보기"
                    active={favoritesOnly}
                    onClick={() => {
                      keepToolbarVisible()
                      setFavoritesOnly((value) => !value)
                    }}
                  />
                </span>
              </Tooltip>
              <span className={styles.fontControlGroup}>
                <Tooltip label="글자 작게">
                  <span>
                    <IconButton
                      icon={ZoomOut}
                      label="글자 작게"
                      onClick={() => {
                        keepToolbarVisible()
                        updateListFontScale(listFontScale - 1)
                      }}
                      disabled={listFontScale <= 0}
                    />
                  </span>
                </Tooltip>
                <Tooltip label="글자 크게">
                  <span>
                    <IconButton
                      icon={ZoomIn}
                      label="글자 크게"
                      onClick={() => {
                        keepToolbarVisible()
                        updateListFontScale(listFontScale + 1)
                      }}
                      disabled={listFontScale >= 6}
                    />
                  </span>
                </Tooltip>
              </span>
            </div>
          </div>

          {searchOpen ? (
            <input
              className="glass-input"
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value
                startTransition(() => {
                  setQuery(nextQuery)
                })
              }}
              placeholder="일본어, 읽기, 뜻으로 검색"
            />
          ) : null}
        </div>
      </div>

      {words.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="표시할 단어가 없습니다."
          description={
            favoritesOnly
              ? '즐겨찾기 필터나 검색어를 다시 조정해 주세요.'
              : '세트와 검색 조건을 다시 확인해 주세요.'
          }
        />
      ) : (
        <div className={styles.grid}>
          {words.map((word, index) => (
            <VocabCard
              key={word.id}
              word={word}
              hideJapanese={hideJapaneseInList}
              hideMeaning={hideMeaningInList}
              hideJapaneseVersion={hideJapaneseVersion}
              hideMeaningVersion={hideMeaningVersion}
              displayNumber={index + 1}
              isFavorite={favoriteIdSet.has(word.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}
