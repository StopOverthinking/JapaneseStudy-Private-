import { useEffect, useMemo, useRef, useState } from 'react'
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
import { getSetName, getWordById, getWordsForSet } from '@/features/vocab/model/selectors'
import type { VocabularyWord } from '@/features/vocab/model/types'
import { matchesWordSearch } from '@/lib/search'
import styles from '@/features/list/list.module.css'

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
      if (word.verbInfo?.includes('1')) return '동1'
      if (word.verbInfo?.includes('2')) return '동2'
      if (word.verbInfo?.includes('3')) return '동3'
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

function VocabCard({
  word,
  hideJapanese,
  hideMeaning,
  displayNumber,
}: {
  word: VocabularyWord
  hideJapanese: boolean
  hideMeaning: boolean
  displayNumber: number
}) {
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const [revealJapanese, setRevealJapanese] = useState(false)
  const [revealMeaning, setRevealMeaning] = useState(false)

  useEffect(() => {
    setRevealJapanese(false)
    setRevealMeaning(false)
  }, [hideJapanese, hideMeaning, word.id])

  const isFavorite = favoriteIds.includes(word.id)
  const japaneseHidden = hideJapanese && !revealJapanese
  const meaningHidden = hideMeaning && !revealMeaning

  return (
    <GlassPanel className={styles.card} padding="sm">
      <div className={styles.cardTop}>
        <div className={styles.chipRow}>
          <span className={styles.orderBadge}>{displayNumber}번</span>
          <span className={styles.partBadge}>{getPartOfSpeechLabel(word)}</span>
        </div>
        <Tooltip label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
          <span
            role="button"
            tabIndex={0}
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            className={styles.cardFavoriteButton}
            onClick={() => toggleFavorite(word.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                toggleFavorite(word.id)
              }
            }}
          >
            <Heart size={18} strokeWidth={1.9} fill={isFavorite ? 'currentColor' : 'none'} />
          </span>
        </Tooltip>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.wordColumn}>
          <button
            type="button"
            className={`${styles.jp} ${japaneseHidden ? styles.concealed : ''}`}
            onClick={() => setRevealJapanese((value) => !value)}
          >
            {word.japanese}
          </button>
          <button
            type="button"
            className={`${styles.reading} ${japaneseHidden ? styles.concealed : ''}`}
            onClick={() => setRevealJapanese((value) => !value)}
          >
            {word.reading}
          </button>
        </div>

        <div className={styles.meaningColumn}>
          <button
            type="button"
            className={`${styles.meaning} ${meaningHidden ? styles.concealed : ''}`}
            onClick={() => setRevealMeaning((value) => !value)}
          >
            {word.meaning}
          </button>
        </div>
      </div>
    </GlassPanel>
  )
}

export function ListPage() {
  const navigate = useNavigate()
  const wrongAnswerIds = useExamStore((state) => state.wrongAnswerIds)
  const {
    hideJapaneseInList,
    hideMeaningInList,
    listFontScale,
    lastSelectedSetId,
    setHideJapaneseInList,
    setHideMeaningInList,
    setListFontScale,
  } = usePreferencesStore()
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null)
  const scrollDistanceRef = useRef(0)
  const wrongAnswerWords = useMemo(
    () =>
      wrongAnswerIds
        .map((wordId) => getWordById(wordId))
        .filter((word): word is VocabularyWord => word !== undefined),
    [wrongAnswerIds],
  )
  const currentSetName = lastSelectedSetId === 'wrong_answers' ? '오답 노트' : getSetName(lastSelectedSetId)

  const words = useMemo(() => {
    const base = lastSelectedSetId === 'wrong_answers'
      ? wrongAnswerWords
      : getWordsForSet(lastSelectedSetId, favoriteIds)

    return base
      .filter((word) => (favoritesOnly ? favoriteIds.includes(word.id) : true))
      .filter((word) => matchesWordSearch(word, query))
  }, [favoriteIds, favoritesOnly, lastSelectedSetId, query, wrongAnswerWords])

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

  useEffect(() => {
    lastScrollYRef.current = window.scrollY
    scrollDirectionRef.current = null
    scrollDistanceRef.current = 0

    const handleScroll = () => {
      const currentY = Math.max(window.scrollY, 0)
      const delta = currentY - lastScrollYRef.current
      lastScrollYRef.current = currentY
      const magnitude = Math.abs(delta)

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
              <Tooltip label="검색 열기">
                <span>
                  <IconButton icon={Search} label="검색 열기" active={searchOpen} onClick={() => setSearchOpen((value) => !value)} />
                </span>
              </Tooltip>
              <Tooltip label="일본어 가리기">
                <span>
                  <IconButton
                    icon={JapaneseHiddenIcon}
                    label="일본어 가리기"
                    active={hideJapaneseInList}
                    onClick={() => setHideJapaneseInList(!hideJapaneseInList)}
                  />
                </span>
              </Tooltip>
              <Tooltip label="뜻 가리기">
                <span>
                  <IconButton
                    icon={MeaningHiddenIcon}
                    label="뜻 가리기"
                    active={hideMeaningInList}
                    onClick={() => setHideMeaningInList(!hideMeaningInList)}
                  />
                </span>
              </Tooltip>
              <Tooltip label="즐겨찾기만 보기">
                <span>
                  <IconButton icon={Heart} label="즐겨찾기만 보기" active={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)} />
                </span>
              </Tooltip>
              <span className={styles.fontControlGroup}>
                <Tooltip label="글자 작게">
                  <span>
                    <IconButton
                      icon={ZoomOut}
                      label="글자 작게"
                      onClick={() => setListFontScale(listFontScale - 1)}
                      disabled={listFontScale <= 0}
                    />
                  </span>
                </Tooltip>
                <Tooltip label="글자 크게">
                  <span>
                    <IconButton
                      icon={ZoomIn}
                      label="글자 크게"
                      onClick={() => setListFontScale(listFontScale + 1)}
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder="일본어, 읽기, 뜻으로 검색"
            />
          ) : null}
        </div>
      </div>

      {words.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="표시할 단어가 없습니다."
          description={favoritesOnly ? '즐겨찾기 필터나 검색어를 다시 조정해 주세요.' : '세트나 검색 조건을 다시 확인해 주세요.'}
        />
      ) : (
        <div className={styles.grid}>
          {words.map((word, index) => (
            <VocabCard
              key={`${word.id}-${hideJapaneseInList}-${hideMeaningInList}`}
              word={word}
              hideJapanese={hideJapaneseInList}
              hideMeaning={hideMeaningInList}
              displayNumber={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
