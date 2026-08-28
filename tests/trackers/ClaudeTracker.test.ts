import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { ClaudeTracker } from '../../src/trackers/ClaudeTracker.js'
import { AppState } from '../../src/types.js'

vi.mock(import('node:fs'))
vi.mock(import('node:fs/promises'))

beforeEach(() => {
  vi.mocked(stat).mockResolvedValue({ size: 100 } as never)
})

describe(ClaudeTracker.prototype.start, () => {
  it('should keep given file offsets if not empty', async () => {
    const tracker = new ClaudeTracker()
    await tracker.start({ fileOffsets: { file: 10 } } as never)
    expect(tracker['fileOffsets']).toEqual({ file: 10 })
  })

  it('should scan files and set offsets to their current size if no offsets given', async () => {
    const tracker = new ClaudeTracker()
    tracker['scanFiles'] = vi.fn().mockResolvedValue(['file'])
    await tracker.start({ fileOffsets: {} } as AppState)
    expect(tracker['fileOffsets']).toEqual({ file: 100 })
  })
})

describe(ClaudeTracker.prototype['_update'], () => {
  it('should not add tokens if file size did not grow', async () => {
    const tracker = new ClaudeTracker()
    tracker['scanFiles'] = vi.fn().mockResolvedValue(['file'])
    tracker['readNewTokensSince'] = vi.fn().mockResolvedValue({ tokens: 0, newOffset: 0 })
    await tracker['_update']({ fileOffsets: {} } as AppState)
    expect(tracker['tokens']).toBe(0)
  })

  it('should add tokens if file size grew', async () => {
    const tracker = new ClaudeTracker()
    tracker['scanFiles'] = vi.fn().mockResolvedValue(['file'])
    tracker['readNewTokensSince'] = vi.fn().mockResolvedValue({ tokens: 100, newOffset: 0 })
    await tracker['_update']({ fileOffsets: {} } as AppState)
    expect(tracker['tokens']).toBe(100)
  })

  it('should set new file offsets', async () => {
    const tracker = new ClaudeTracker()
    tracker['scanFiles'] = vi.fn().mockResolvedValue(['file'])
    tracker['readNewTokensSince'] = vi.fn().mockResolvedValue({ tokens: 100, newOffset: 100 })
    const state = { fileOffsets: {} } as AppState
    await tracker['_update'](state)
    expect(state.fileOffsets['file']).toBe(100)
  })
})

describe(ClaudeTracker.prototype['scanFiles'], () => {
  beforeEach(() => {
    vi.mocked(readdir).mockResolvedValue([{ isFile: () => true, name: 'a.jsonl', parentPath: '/projects' }] as never)
  })

  it('should ignore files not ending with .jsonl', async () => {
    vi.mocked(readdir).mockResolvedValue([{ isFile: () => true, name: 'a.txt', parentPath: '/projects' }] as never)
    const tracker = new ClaudeTracker()
    const files = await tracker['scanFiles']()
    expect(files).toEqual([])
  })

  it('should ignore non file entries', async () => {
    vi.mocked(readdir).mockResolvedValue([{ isFile: () => false, name: 'a.jsonl', parentPath: '/projects' }] as never)
    const tracker = new ClaudeTracker()
    const files = await tracker['scanFiles']()
    expect(files).toEqual([])
  })

  it('should return .jsonl full file path', async () => {
    const tracker = new ClaudeTracker()
    const files = await tracker['scanFiles']()
    expect(files).toEqual(['/projects/a.jsonl'])
  })
})

describe(ClaudeTracker.prototype['readNewTokensSince'], () => {
  beforeEach(() => {
    const stream = Object.assign(Readable.from('line1\nline2'), { close: vi.fn() }) as never
    vi.mocked(createReadStream).mockReturnValue(stream)
  })

  it('should do nothing if size did not change', async () => {
    const tracker = new ClaudeTracker()
    await tracker['readNewTokensSince']('filepath', 100)
    expect(createReadStream).not.toHaveBeenCalled()
  })

  it('should read each line', async () => {
    const tracker = new ClaudeTracker()
    tracker['readTokens'] = vi.fn()
    await tracker['readNewTokensSince']('filepath', 0)
    expect(tracker['readTokens']).toHaveBeenCalledWith('line1')
    expect(tracker['readTokens']).toHaveBeenCalledWith('line2')
  })

  it('should return the total number of tokens', async () => {
    const tracker = new ClaudeTracker()
    tracker['readTokens'] = vi.fn().mockReturnValue(10)
    const result = await tracker['readNewTokensSince']('filepath', 0)
    expect(result.tokens).toBe(20)
  })

  it('should return the new offset', async () => {
    const tracker = new ClaudeTracker()
    tracker['readTokens'] = vi.fn()
    const result = await tracker['readNewTokensSince']('filepath', 0)
    expect(result.newOffset).toBe(12)
  })
})

describe(ClaudeTracker.prototype['readTokens'], () => {
  it('should return 0 if the line does not contains the word "assistant"', () => {
    const tracker = new ClaudeTracker()
    expect(tracker['readTokens']('usage')).toBe(0)
  })

  it('should return 0 if the line does not contains the word "usage"', () => {
    const tracker = new ClaudeTracker()
    expect(tracker['readTokens']('assistant')).toBe(0)
  })

  it('should return 0 if the line is not a valid json', () => {
    const tracker = new ClaudeTracker()
    expect(tracker['readTokens']('assistant usage')).toBe(0)
  })

  it('should return 0 if the total number of tokens', () => {
    const tracker = new ClaudeTracker()
    expect(
      tracker['readTokens'](
        JSON.stringify({
          type: 'assistant',
          message: {
            usage: {
              input_tokens: 1,
              output_tokens: 2,
              cache_creation_input_tokens: 3,
              cache_read_input_tokens: 4,
            },
          },
        }),
      ),
    ).toBe(10)
  })
})
