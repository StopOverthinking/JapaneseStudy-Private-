import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const wordFiles = [
  ['basic', path.join(projectRoot, 'src', 'features', 'vocab', 'editor-data', 'vocabularyWords.json')],
  ['theme', path.join(projectRoot, 'src', 'features', 'vocab', 'editor-data', 'themeWords.json')],
  ['compare', path.join(projectRoot, 'src', 'features', 'vocab', 'editor-data', 'comparisonWords.json')],
]

function adjustJlptDifficulty(value) {
  if (!Number.isFinite(value)) return value
  if (value >= 42) return value - 6
  if (value >= 38) return value - 4
  if (value >= 34) return value - 3
  if (value >= 30) return value - 1
  return value
}

function adjustSet2Difficulty(value) {
  if (!Number.isFinite(value)) return value
  if (value >= 55) return value - 8
  if (value >= 50) return value - 6
  if (value >= 45) return value - 4
  if (value >= 40) return value - 2
  return value
}

function adjustDifficultyBySet(word) {
  if (!Number.isFinite(word.difficulty)) {
    return word.difficulty
  }

  if (word.setId === 'jlpt-n3') {
    return adjustJlptDifficulty(word.difficulty)
  }

  if (word.setId === 'set-2') {
    return adjustSet2Difficulty(word.difficulty)
  }

  return word.difficulty
}

function createWordKey(word) {
  return `${word.japanese}__${word.reading}`
}

async function loadWordFiles() {
  const loaded = await Promise.all(wordFiles.map(async ([kind, filePath]) => {
    const words = JSON.parse(await fs.readFile(filePath, 'utf8'))
    return [kind, filePath, words]
  }))

  return loaded.map(([kind, filePath, words]) => ({
    kind,
    filePath,
    words,
  }))
}

async function saveWordFile(filePath, words) {
  await fs.writeFile(filePath, `${JSON.stringify(words, null, 2)}\n`, 'utf8')
}

function normalizeDuplicateGroups(wordEntries) {
  const groupedWords = new Map()

  for (const entry of wordEntries) {
    for (const word of entry.words) {
      const key = createWordKey(word)
      const list = groupedWords.get(key) ?? []
      list.push(word)
      groupedWords.set(key, list)
    }
  }

  for (const list of groupedWords.values()) {
    if (list.length < 2) continue

    const values = list.map((word) => word.difficulty).filter((value) => Number.isFinite(value))
    if (values.length < 2) continue

    const normalized = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    for (const word of list) {
      word.difficulty = normalized
    }
  }
}

function summarizeChanges(beforeEntries, afterEntries) {
  const summary = []

  for (let entryIndex = 0; entryIndex < afterEntries.length; entryIndex += 1) {
    const beforeWords = beforeEntries[entryIndex]?.words ?? []
    const afterWords = afterEntries[entryIndex]?.words ?? []
    let changedCount = 0

    for (let wordIndex = 0; wordIndex < afterWords.length; wordIndex += 1) {
      if (beforeWords[wordIndex]?.difficulty !== afterWords[wordIndex]?.difficulty) {
        changedCount += 1
      }
    }

    summary.push({
      kind: afterEntries[entryIndex]?.kind ?? 'unknown',
      changedCount,
      totalCount: afterWords.length,
    })
  }

  return summary
}

async function main() {
  const originalEntries = await loadWordFiles()
  const adjustedEntries = originalEntries.map((entry) => ({
    ...entry,
    words: entry.words.map((word) => ({
      ...word,
      difficulty: adjustDifficultyBySet(word),
    })),
  }))

  normalizeDuplicateGroups(adjustedEntries)

  await Promise.all(adjustedEntries.map((entry) => saveWordFile(entry.filePath, entry.words)))

  const summary = summarizeChanges(originalEntries, adjustedEntries)
  for (const item of summary) {
    console.log(`${item.kind}: ${item.changedCount}/${item.totalCount} updated`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
