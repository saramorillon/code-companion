import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

export function claudeProjectsDir(): string {
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')
  return path.join(configDir, 'projects')
}

export async function findJsonlFiles(rootDir: string): Promise<string[]> {
  let entries: fs.Dirent[]
  try {
    entries = await fsPromises.readdir(rootDir, { recursive: true, withFileTypes: true })
  } catch {
    return []
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
    .map((entry) => path.join(entry.parentPath ?? (entry as unknown as { path: string }).path, entry.name))
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheWriteTokens: number
  cacheReadTokens: number
}

export function totalTokens(usage: TokenUsage): number {
  return usage.inputTokens + usage.outputTokens + usage.cacheWriteTokens + usage.cacheReadTokens
}

export function parseAssistantLineUsage(line: string): TokenUsage | null {
  if (!line.includes('"assistant"') || !line.includes('"usage"')) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(line)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const obj = parsed as Record<string, unknown>
  if (obj.type !== 'assistant') return null

  const message = obj.message as Record<string, unknown> | undefined
  const usage = message?.usage as Record<string, unknown> | undefined
  if (!usage) return null

  return {
    inputTokens: Number(usage.input_tokens) || 0,
    outputTokens: Number(usage.output_tokens) || 0,
    cacheWriteTokens: Number(usage.cache_creation_input_tokens) || 0,
    cacheReadTokens: Number(usage.cache_read_input_tokens) || 0,
  }
}

// Lit uniquement les octets ajoutés à un fichier .jsonl depuis le dernier offset connu,
// et retourne le total de tokens des nouvelles lignes "assistant" ainsi que le nouvel offset.
export async function readNewTokensSince(
  filePath: string,
  knownOffset: number,
): Promise<{ tokens: number; newOffset: number }> {
  const stat = await fsPromises.stat(filePath)
  if (stat.size <= knownOffset) {
    return { tokens: 0, newOffset: knownOffset }
  }

  const handle = await fsPromises.open(filePath, 'r')
  try {
    const length = stat.size - knownOffset
    const buffer = Buffer.alloc(length)
    await handle.read(buffer, 0, length, knownOffset)
    const chunk = buffer.toString('utf8')
    const lines = chunk.split('\n')

    // La dernière ligne peut être incomplète (écriture en cours) : on ne l'avance pas au-delà.
    const lastLineComplete = chunk.endsWith('\n')
    const completeLines = lastLineComplete ? lines.slice(0, -1) : lines.slice(0, -1)
    const consumedBytes = completeLines.reduce((sum, l) => sum + Buffer.byteLength(l, 'utf8') + 1, 0)

    let tokens = 0
    for (const line of completeLines) {
      const usage = parseAssistantLineUsage(line)
      if (usage) tokens += totalTokens(usage)
    }

    return { tokens, newOffset: knownOffset + consumedBytes }
  } finally {
    await handle.close()
  }
}

export async function fileSize(filePath: string): Promise<number> {
  const stat = await fsPromises.stat(filePath)
  return stat.size
}

export async function fileCreatedAt(filePath: string): Promise<Date> {
  const stat = await fsPromises.stat(filePath)
  return stat.birthtime
}
