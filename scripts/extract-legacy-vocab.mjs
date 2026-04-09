import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(projectRoot, '..')

const sourceFiles = [
  path.join(workspaceRoot, 'vocab', 'vocab_pagodaN3.js'),
  path.join(workspaceRoot, 'vocab', 'vocab_handmade.js'),
  path.join(workspaceRoot, 'vocab', 'vocab_darakwon_verb.js'),
]

const outputDir = path.join(projectRoot, 'src', 'features', 'vocab', 'data')

function slugify(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function normalizeType(type) {
  const allowed = new Set(['verb', 'noun', 'i_adj', 'na_adj', 'adv', 'expression', 'other'])
  return allowed.has(type) ? type : 'other'
}

function toTsLiteral(value) {
  return JSON.stringify(value, null, 2)
}

async function collectLegacySets() {
  const sets = []
  const context = vm.createContext({
    registerVocabularySet: (set) => {
      sets.push(set)
    },
  })

  for (const file of sourceFiles) {
    try {
      await fs.access(file)
    } catch {
      continue
    }

    const source = await fs.readFile(file, 'utf8')
    vm.runInContext(source, context, { filename: file })
  }

  return sets
}

async function writeFiles() {
  const legacySets = await collectLegacySets()
  if (legacySets.length === 0) {
    return
  }

  const sets = []
  const words = []

  legacySets.forEach((set, setIndex) => {
    const setId = slugify(set.name || `set-${setIndex + 1}`) || `set-${setIndex + 1}`
    const wordIds = []

    set.words.forEach((word, wordIndex) => {
      const id = String(word.id ?? `${setId}-${wordIndex + 1}`)
      wordIds.push(id)
      words.push({
        id,
        setId,
        japanese: String(word.japanese ?? ''),
        reading: String(word.reading ?? ''),
        meaning: String(word.meaning ?? ''),
        type: normalizeType(word.type),
        difficulty: Number.isFinite(word.difficulty) ? Number(word.difficulty) : null,
        verbInfo: typeof word.verb_info === 'string' ? word.verb_info : null,
        sourceOrder: wordIndex,
      })
    })

    sets.push({
      id: setId,
      name: String(set.name ?? `Set ${setIndex + 1}`),
      order: setIndex,
      wordIds,
    })
  })

  await fs.mkdir(outputDir, { recursive: true })

  const setsFile = `import type { VocabularySet } from '../model/types'\n\nexport const vocabularySets: VocabularySet[] = ${toTsLiteral(sets)}\n`
  const wordsFile = `import type { VocabularyWord } from '../model/types'\n\nexport const vocabularyWords: VocabularyWord[] = ${toTsLiteral(words)}\n`
  const indexFile = `export { vocabularySets } from './vocabularySets'\nexport { vocabularyWords } from './vocabularyWords'\n`

  await fs.writeFile(path.join(outputDir, 'vocabularySets.ts'), setsFile, 'utf8')
  await fs.writeFile(path.join(outputDir, 'vocabularyWords.ts'), wordsFile, 'utf8')
  await fs.writeFile(path.join(outputDir, 'index.ts'), indexFile, 'utf8')
}

writeFiles().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
