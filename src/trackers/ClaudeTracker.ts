import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { EOL, homedir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { AppState } from '../types.js'
import { AbstractTracker } from './AbstractTracker.js'

const PROJECTS_DIR = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'projects')

export class ClaudeTracker extends AbstractTracker {
  private fileOffsets: Record<string, number> = {}

  constructor() {
    super('claude')
  }

  override async start(data: AppState) {
    this.fileOffsets = { ...data.fileOffsets }
    if (Object.keys(this.fileOffsets).length === 0) {
      const files = await this.scanFiles()
      for (const file of files) {
        this.fileOffsets[file] = await stat(file).then((s) => s.size)
      }
    }
  }

  override async _update(state: AppState) {
    const files = await this.scanFiles()
    for (const file of files) {
      const result = await this.readNewTokensSince(file, this.fileOffsets[file] ?? 0)
      this.tokens += result.tokens
      this.fileOffsets[file] = result.newOffset
    }
    state.fileOffsets = { ...this.fileOffsets }
  }

  private async scanFiles() {
    const entries = await readdir(PROJECTS_DIR, { recursive: true, withFileTypes: true }).catch(() => [])
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map((entry) => join(entry.parentPath, entry.name))
  }

  private async readNewTokensSince(
    filePath: string,
    knownOffset: number,
  ): Promise<{ tokens: number; newOffset: number }> {
    const size = await stat(filePath).then((s) => s.size)
    if (size <= knownOffset) {
      return { tokens: 0, newOffset: knownOffset }
    }

    const stream = createReadStream(filePath, { start: knownOffset })
    const lines = createInterface(stream)
    let newOffset = knownOffset
    let tokens = 0
    for await (const line of lines) {
      tokens += this.readTokens(line)
      newOffset += Buffer.byteLength(line + EOL, 'utf8')
    }

    stream.close()

    return { tokens, newOffset }
  }

  private readTokens(line: string) {
    if (!line.includes('"assistant"') || !line.includes('"usage"')) {
      return 0
    }

    let parsed: unknown = null
    try {
      parsed = JSON.parse(line)
    } catch {
      return 0
    }

    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !('type' in parsed) ||
      parsed.type !== 'assistant' ||
      !('message' in parsed) ||
      typeof parsed.message !== 'object' ||
      parsed.message === null ||
      !('usage' in parsed.message) ||
      typeof parsed.message.usage !== 'object' ||
      parsed.message.usage === null ||
      !('input_tokens' in parsed.message.usage) ||
      typeof parsed.message.usage.input_tokens !== 'number' ||
      !('output_tokens' in parsed.message.usage) ||
      typeof parsed.message.usage.output_tokens !== 'number' ||
      !('cache_creation_input_tokens' in parsed.message.usage) ||
      typeof parsed.message.usage.cache_creation_input_tokens !== 'number' ||
      !('cache_read_input_tokens' in parsed.message.usage) ||
      typeof parsed.message.usage.cache_read_input_tokens !== 'number'
    ) {
      return 0
    }

    return (
      parsed.message.usage.input_tokens +
      parsed.message.usage.output_tokens +
      parsed.message.usage.cache_creation_input_tokens +
      parsed.message.usage.cache_read_input_tokens
    )
  }
}
