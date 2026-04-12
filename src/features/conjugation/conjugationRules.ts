import type { VocabularyWord } from '@/features/vocab/model/types'
import type { ConjugationForm, VerbGroup } from '@/features/conjugation/conjugationTypes'
import { normalizePronunciationInput, toHiragana } from '@/lib/japanese'

type ConjugationOutcome = {
  form: ConjugationForm
  label: string
  japanese: string
  reading: string
  acceptedAnswers: string[]
  explanation: string
}

const FORM_METADATA: Record<ConjugationForm, { label: string }> = {
  masu: { label: 'ます형' },
  te: { label: 'て형' },
  ta: { label: 'た형' },
  nai: { label: 'ない형' },
  potential: { label: '가능형' },
  volitional: { label: '의지형' },
  imperative: { label: '명령형' },
  prohibitive: { label: '금지형' },
}

const GODAN_ROWS = {
  う: { a: 'わ', i: 'い', e: 'え', o: 'お', te: 'って', ta: 'った' },
  く: { a: 'か', i: 'き', e: 'け', o: 'こ', te: 'いて', ta: 'いた' },
  ぐ: { a: 'が', i: 'ぎ', e: 'げ', o: 'ご', te: 'いで', ta: 'いだ' },
  す: { a: 'さ', i: 'し', e: 'せ', o: 'そ', te: 'して', ta: 'した' },
  つ: { a: 'た', i: 'ち', e: 'て', o: 'と', te: 'って', ta: 'った' },
  ぬ: { a: 'な', i: 'に', e: 'ね', o: 'の', te: 'んで', ta: 'んだ' },
  ぶ: { a: 'ば', i: 'び', e: 'べ', o: 'ぼ', te: 'んで', ta: 'んだ' },
  む: { a: 'ま', i: 'み', e: 'め', o: 'も', te: 'んで', ta: 'んだ' },
  る: { a: 'ら', i: 'り', e: 'れ', o: 'ろ', te: 'って', ta: 'った' },
} as const

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0))]
}

function normalizeWhitespace(text: string) {
  return text.replace(/[\s\u3000]+/g, '').trim()
}

function removeLastChar(text: string) {
  return text.slice(0, Math.max(0, text.length - 1))
}

function replaceLastChar(text: string, replacement: string) {
  return `${removeLastChar(text)}${replacement}`
}

function replaceTail(text: string, tail: string, replacement: string) {
  return text.endsWith(tail) ? `${text.slice(0, -tail.length)}${replacement}` : text
}

function buildAnswerVariants(
  word: Pick<VocabularyWord, 'japanese' | 'reading'>,
  japanese: string,
  reading: string,
  extras: string[] = [],
) {
  const normalizedReading = toHiragana(reading)
  const japaneseVariants = word.japanese === toHiragana(word.reading) ? [normalizedReading] : [japanese, normalizedReading]
  return uniqueStrings([...japaneseVariants, ...extras.map((value) => toHiragana(value))])
}

function buildIchidanExplanation(suffix: string) {
  return `1단 동사는 마지막 る를 뺀 뒤 ${suffix}를 붙입니다.`
}

function buildGodanSuffixExplanation(ending: string, replacement: string, suffix: string) {
  return `${ending}로 끝나는 5단 동사는 마지막 ${ending}를 ${replacement}로 바꾼 뒤 ${suffix}를 붙입니다.`
}

function buildGodanReplacementExplanation(ending: string, replacement: string) {
  return `${ending}로 끝나는 5단 동사는 마지막 ${ending}를 ${replacement}로 바꿉니다.`
}

function buildAppendNaExplanation() {
  return '금지형은 사전형 뒤에 な를 붙입니다.'
}

function buildSuruExplanation(replacement: string) {
  return `する 동사는 する를 ${replacement}로 바꿉니다.`
}

function buildKuruExplanation(replacement: string) {
  return `来る 동사는 くる를 ${replacement}로 바꿉니다.`
}

function isSuruVerb(word: Pick<VocabularyWord, 'japanese' | 'reading'>) {
  return word.japanese.endsWith('する') || toHiragana(word.reading).endsWith('する')
}

function isKuruVerb(word: Pick<VocabularyWord, 'japanese' | 'reading'>) {
  return word.japanese.endsWith('来る') || word.japanese.endsWith('くる') || toHiragana(word.reading).endsWith('くる')
}

function getGodanRow(ending: string) {
  return GODAN_ROWS[ending as keyof typeof GODAN_ROWS] ?? null
}

export function getConjugationFormLabel(form: ConjugationForm) {
  return FORM_METADATA[form].label
}

export function getVerbGroup(word: Pick<VocabularyWord, 'type' | 'verbInfo' | 'japanese' | 'reading'>): VerbGroup | null {
  if (word.type !== 'verb') return null
  if (word.verbInfo?.includes('3')) {
    if (isSuruVerb(word)) return 'irregular-suru'
    if (isKuruVerb(word)) return 'irregular-kuru'
    return null
  }
  if (word.verbInfo?.includes('2')) return 'ichidan'
  if (word.verbInfo?.includes('1')) return 'godan'
  return null
}

export function isConjugationEligible(word: Pick<VocabularyWord, 'type' | 'verbInfo' | 'japanese' | 'reading'>) {
  return getVerbGroup(word) !== null
}

function buildIchidanOutcome(word: Pick<VocabularyWord, 'japanese' | 'reading'>, form: ConjugationForm): ConjugationOutcome {
  const stemJapanese = removeLastChar(word.japanese)
  const stemReading = removeLastChar(toHiragana(word.reading))

  if (form === 'masu') {
    const japanese = `${stemJapanese}ます`
    const reading = `${stemReading}ます`
    return { form, label: FORM_METADATA[form].label, japanese, reading, acceptedAnswers: buildAnswerVariants(word, japanese, reading), explanation: buildIchidanExplanation('ます') }
  }

  if (form === 'te') {
    const japanese = `${stemJapanese}て`
    const reading = `${stemReading}て`
    return { form, label: FORM_METADATA[form].label, japanese, reading, acceptedAnswers: buildAnswerVariants(word, japanese, reading), explanation: buildIchidanExplanation('て') }
  }

  if (form === 'ta') {
    const japanese = `${stemJapanese}た`
    const reading = `${stemReading}た`
    return { form, label: FORM_METADATA[form].label, japanese, reading, acceptedAnswers: buildAnswerVariants(word, japanese, reading), explanation: buildIchidanExplanation('た') }
  }

  if (form === 'nai') {
    const japanese = `${stemJapanese}ない`
    const reading = `${stemReading}ない`
    return { form, label: FORM_METADATA[form].label, japanese, reading, acceptedAnswers: buildAnswerVariants(word, japanese, reading), explanation: buildIchidanExplanation('ない') }
  }

  if (form === 'potential') {
    const japanese = `${stemJapanese}られる`
    const reading = `${stemReading}られる`
    return { form, label: FORM_METADATA[form].label, japanese, reading, acceptedAnswers: buildAnswerVariants(word, japanese, reading), explanation: buildIchidanExplanation('られる') }
  }

  if (form === 'volitional') {
    const japanese = `${stemJapanese}よう`
    const reading = `${stemReading}よう`
    return { form, label: FORM_METADATA[form].label, japanese, reading, acceptedAnswers: buildAnswerVariants(word, japanese, reading), explanation: buildIchidanExplanation('よう') }
  }

  if (form === 'imperative') {
    const japanese = `${stemJapanese}ろ`
    const reading = `${stemReading}ろ`
    return {
      form,
      label: FORM_METADATA[form].label,
      japanese,
      reading,
      acceptedAnswers: buildAnswerVariants(word, japanese, reading, [`${stemJapanese}よ`, `${stemReading}よ`]),
      explanation: buildIchidanExplanation('ろ'),
    }
  }

  const japanese = `${word.japanese}な`
  const reading = `${toHiragana(word.reading)}な`
  return { form, label: FORM_METADATA[form].label, japanese, reading, acceptedAnswers: buildAnswerVariants(word, japanese, reading), explanation: buildAppendNaExplanation() }
}

function buildGodanOutcome(word: Pick<VocabularyWord, 'japanese' | 'reading'>, form: ConjugationForm): ConjugationOutcome | null {
  const reading = toHiragana(word.reading)
  const ending = reading.slice(-1)
  const row = getGodanRow(ending)
  if (!row) return null

  const isIku = word.japanese === '行く' || reading === 'いく'

  if (form === 'masu') {
    const japanese = `${replaceLastChar(word.japanese, row.i)}ます`
    const nextReading = `${replaceLastChar(reading, row.i)}ます`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildGodanSuffixExplanation(ending, row.i, 'ます') }
  }

  if (form === 'te') {
    const japanese = isIku ? `${removeLastChar(word.japanese)}って` : replaceLastChar(word.japanese, row.te)
    const nextReading = isIku ? `${removeLastChar(reading)}って` : replaceLastChar(reading, row.te)
    return {
      form,
      label: FORM_METADATA[form].label,
      japanese,
      reading: nextReading,
      acceptedAnswers: buildAnswerVariants(word, japanese, nextReading),
      explanation: isIku ? '行く는 예외로 て형에서 行って가 됩니다.' : buildGodanReplacementExplanation(ending, row.te),
    }
  }

  if (form === 'ta') {
    const japanese = isIku ? `${removeLastChar(word.japanese)}った` : replaceLastChar(word.japanese, row.ta)
    const nextReading = isIku ? `${removeLastChar(reading)}った` : replaceLastChar(reading, row.ta)
    return {
      form,
      label: FORM_METADATA[form].label,
      japanese,
      reading: nextReading,
      acceptedAnswers: buildAnswerVariants(word, japanese, nextReading),
      explanation: isIku ? '行く는 예외로 た형에서 行った가 됩니다.' : buildGodanReplacementExplanation(ending, row.ta),
    }
  }

  if (form === 'nai') {
    const japanese = `${replaceLastChar(word.japanese, row.a)}ない`
    const nextReading = `${replaceLastChar(reading, row.a)}ない`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildGodanSuffixExplanation(ending, row.a, 'ない') }
  }

  if (form === 'potential') {
    const japanese = `${replaceLastChar(word.japanese, row.e)}る`
    const nextReading = `${replaceLastChar(reading, row.e)}る`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildGodanSuffixExplanation(ending, row.e, 'る') }
  }

  if (form === 'volitional') {
    const japanese = `${replaceLastChar(word.japanese, row.o)}う`
    const nextReading = `${replaceLastChar(reading, row.o)}う`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildGodanSuffixExplanation(ending, row.o, 'う') }
  }

  if (form === 'imperative') {
    const japanese = replaceLastChar(word.japanese, row.e)
    const nextReading = replaceLastChar(reading, row.e)
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildGodanReplacementExplanation(ending, row.e) }
  }

  const japanese = `${word.japanese}な`
  const nextReading = `${reading}な`
  return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildAppendNaExplanation() }
}

function buildSuruOutcome(word: Pick<VocabularyWord, 'japanese' | 'reading'>, form: ConjugationForm): ConjugationOutcome {
  const reading = toHiragana(word.reading)
  const japaneseStem = replaceTail(word.japanese, 'する', '')
  const readingStem = replaceTail(reading, 'する', '')

  if (form === 'masu') {
    const japanese = `${japaneseStem}します`
    const nextReading = `${readingStem}します`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildSuruExplanation('します') }
  }

  if (form === 'te') {
    const japanese = `${japaneseStem}して`
    const nextReading = `${readingStem}して`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildSuruExplanation('して') }
  }

  if (form === 'ta') {
    const japanese = `${japaneseStem}した`
    const nextReading = `${readingStem}した`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildSuruExplanation('した') }
  }

  if (form === 'nai') {
    const japanese = `${japaneseStem}しない`
    const nextReading = `${readingStem}しない`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildSuruExplanation('しない') }
  }

  if (form === 'potential') {
    const japanese = `${japaneseStem}できる`
    const nextReading = `${readingStem}できる`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildSuruExplanation('できる') }
  }

  if (form === 'volitional') {
    const japanese = `${japaneseStem}しよう`
    const nextReading = `${readingStem}しよう`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildSuruExplanation('しよう') }
  }

  if (form === 'imperative') {
    const japanese = `${japaneseStem}しろ`
    const nextReading = `${readingStem}しろ`
    return {
      form,
      label: FORM_METADATA[form].label,
      japanese,
      reading: nextReading,
      acceptedAnswers: buildAnswerVariants(word, japanese, nextReading, [`${japaneseStem}せよ`, `${readingStem}せよ`]),
      explanation: buildSuruExplanation('しろ'),
    }
  }

  const japanese = `${word.japanese}な`
  const nextReading = `${reading}な`
  return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: '금지형은 する 뒤에 な를 붙입니다.' }
}

function buildKuruOutcome(word: Pick<VocabularyWord, 'japanese' | 'reading'>, form: ConjugationForm): ConjugationOutcome {
  const reading = toHiragana(word.reading)
  const japaneseStem = word.japanese.endsWith('来る') ? replaceTail(word.japanese, '来る', '') : replaceTail(word.japanese, 'くる', '')
  const readingStem = replaceTail(reading, 'くる', '')
  const useKanjiTail = word.japanese.endsWith('来る')
  const renderJapanese = (kanjiTail: string, kanaTail: string) => `${japaneseStem}${useKanjiTail ? kanjiTail : kanaTail}`

  if (form === 'masu') {
    const japanese = renderJapanese('来ます', 'きます')
    const nextReading = `${readingStem}きます`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildKuruExplanation('きます') }
  }

  if (form === 'te') {
    const japanese = renderJapanese('来て', 'きて')
    const nextReading = `${readingStem}きて`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildKuruExplanation('きて') }
  }

  if (form === 'ta') {
    const japanese = renderJapanese('来た', 'きた')
    const nextReading = `${readingStem}きた`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildKuruExplanation('きた') }
  }

  if (form === 'nai') {
    const japanese = renderJapanese('来ない', 'こない')
    const nextReading = `${readingStem}こない`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildKuruExplanation('こない') }
  }

  if (form === 'potential') {
    const japanese = renderJapanese('来られる', 'こられる')
    const nextReading = `${readingStem}こられる`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildKuruExplanation('こられる') }
  }

  if (form === 'volitional') {
    const japanese = renderJapanese('来よう', 'こよう')
    const nextReading = `${readingStem}こよう`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildKuruExplanation('こよう') }
  }

  if (form === 'imperative') {
    const japanese = renderJapanese('来い', 'こい')
    const nextReading = `${readingStem}こい`
    return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: buildKuruExplanation('こい') }
  }

  const japanese = `${word.japanese}な`
  const nextReading = `${reading}な`
  return { form, label: FORM_METADATA[form].label, japanese, reading: nextReading, acceptedAnswers: buildAnswerVariants(word, japanese, nextReading), explanation: '금지형은 来る 뒤에 な를 붙입니다.' }
}

export function conjugateWord(word: Pick<VocabularyWord, 'type' | 'verbInfo' | 'japanese' | 'reading'>, form: ConjugationForm) {
  const group = getVerbGroup(word)
  if (!group) return null

  if (group === 'ichidan') return buildIchidanOutcome(word, form)
  if (group === 'godan') return buildGodanOutcome(word, form)
  if (group === 'irregular-suru') return buildSuruOutcome(word, form)
  return buildKuruOutcome(word, form)
}

export function normalizeConjugationText(text: string) {
  return normalizePronunciationInput(normalizeWhitespace(text))
}
