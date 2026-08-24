import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import { assert, test } from 'vitest'
import { parseAssistantLineUsage, totalTokens, readNewTokensSince } from '../src/core/claudeUsageReader.js'

test('parseAssistantLineUsage extracts token counts from a valid assistant line', () => {
  const line = JSON.stringify({
    type: 'assistant',
    message: {
      id: 'msg1',
      usage: { input_tokens: 10, output_tokens: 20, cache_creation_input_tokens: 1, cache_read_input_tokens: 2 },
    },
  })
  const usage = parseAssistantLineUsage(line)
  assert.ok(usage)
  assert.equal(totalTokens(usage!), 33)
})

test('parseAssistantLineUsage returns null for non-assistant lines', () => {
  const line = JSON.stringify({ type: 'user', message: { usage: { input_tokens: 10 } } })
  assert.equal(parseAssistantLineUsage(line), null)
})

test('parseAssistantLineUsage returns null for malformed JSON', () => {
  assert.equal(parseAssistantLineUsage('{not json'), null)
})

test('parseAssistantLineUsage returns null when usage is missing', () => {
  const line = JSON.stringify({ type: 'assistant', message: { id: 'msg1' } })
  assert.equal(parseAssistantLineUsage(line), null)
})

test('readNewTokensSince only reads bytes appended since the known offset', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codecompanion-test-'))
  const filePath = path.join(dir, 'session.jsonl')

  const line1 = JSON.stringify({
    type: 'assistant',
    message: {
      usage: { input_tokens: 100, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    },
  })
  await fs.writeFile(filePath, line1 + '\n')

  const firstRead = await readNewTokensSince(filePath, 0)
  assert.equal(firstRead.tokens, 100)

  const line2 = JSON.stringify({
    type: 'assistant',
    message: {
      usage: { input_tokens: 50, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    },
  })
  await fs.appendFile(filePath, line2 + '\n')

  const secondRead = await readNewTokensSince(filePath, firstRead.newOffset)
  assert.equal(secondRead.tokens, 50)

  const rereadFromStart = await readNewTokensSince(filePath, 0)
  assert.equal(rereadFromStart.tokens, 150)

  await fs.rm(dir, { recursive: true, force: true })
})

test('readNewTokensSince does not consume an incomplete trailing line', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codecompanion-test-'))
  const filePath = path.join(dir, 'session.jsonl')

  const completeLine = JSON.stringify({
    type: 'assistant',
    message: {
      usage: { input_tokens: 10, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    },
  })
  const incompleteLine = '{"type":"assistant","message":{"usage":{"input_'
  await fs.writeFile(filePath, completeLine + '\n' + incompleteLine)

  const result = await readNewTokensSince(filePath, 0)
  assert.equal(result.tokens, 10)
  assert.equal(result.newOffset, Buffer.byteLength(completeLine, 'utf8') + 1)

  await fs.rm(dir, { recursive: true, force: true })
})
