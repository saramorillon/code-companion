import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import { assert, test, beforeEach, afterEach } from 'vitest'
import { scanForNewTokens } from '../src/core/usageTracker.js'

function assistantLine(tokens: number): string {
  return JSON.stringify({
    type: 'assistant',
    message: {
      usage: { input_tokens: tokens, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    },
  })
}

let projectsDir: string
let previousHome: string | undefined

beforeEach(async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'codecompanion-home-'))
  projectsDir = path.join(home, '.claude', 'projects')
  await fs.mkdir(projectsDir, { recursive: true })
  previousHome = process.env.HOME
  process.env.HOME = home
  process.env.USERPROFILE = home
})

afterEach(async () => {
  await fs.rm(path.dirname(path.dirname(projectsDir)), { recursive: true, force: true })
  process.env.HOME = previousHome
})

test('a file that already existed before the install baseline is not read retroactively', async () => {
  const filePath = path.join(projectsDir, 'old-session.jsonl')
  await fs.writeFile(filePath, assistantLine(1_000) + '\n')

  const installBaselineAt = new Date(Date.now() + 1000) // baseline fixée après la création du fichier
  const result = await scanForNewTokens({}, installBaselineAt)

  assert.equal(result.tokens, 0)
})

test('a file created after the install baseline is fully counted even if discovered on a later scan', async () => {
  const installBaselineAt = new Date(Date.now() - 1000) // baseline fixée avant la création du fichier

  // Premier scan : le fichier n'existe pas encore.
  const firstScan = await scanForNewTokens({}, installBaselineAt)
  assert.equal(firstScan.tokens, 0)

  // La session démarre après le premier scan, dans l'intervalle avant le prochain scan périodique.
  const filePath = path.join(projectsDir, 'new-session.jsonl')
  await fs.writeFile(filePath, assistantLine(500) + '\n')

  const secondScan = await scanForNewTokens(firstScan.offsets, installBaselineAt)
  assert.equal(secondScan.tokens, 500)
})

test('an already-tracked file only reports newly appended tokens', async () => {
  const installBaselineAt = new Date(Date.now() - 1000)
  const filePath = path.join(projectsDir, 'session.jsonl')
  await fs.writeFile(filePath, assistantLine(100) + '\n')

  const firstScan = await scanForNewTokens({}, installBaselineAt)
  assert.equal(firstScan.tokens, 100)

  await fs.appendFile(filePath, assistantLine(20) + '\n')
  const secondScan = await scanForNewTokens(firstScan.offsets, installBaselineAt)
  assert.equal(secondScan.tokens, 20)
})
