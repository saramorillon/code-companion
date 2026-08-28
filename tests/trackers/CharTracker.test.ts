import { workspace } from 'vscode'
import { CharTracker } from '../../src/trackers/CharTracker.js'

describe(CharTracker.prototype.start, () => {
  it('should do nothing if document is not active', () => {
    vi.spyOn(workspace, 'onDidChangeTextDocument').mockImplementation((fn) =>
      fn({ document: 'not active document' } as never),
    )
    const tracker = new CharTracker()
    void tracker.start()
    expect(tracker['tokens']).toBe(0)
  })

  it('should increment tokens if document is active', () => {
    vi.spyOn(workspace, 'onDidChangeTextDocument').mockImplementation((fn) =>
      fn({ document: 'active document', contentChanges: [{ text: new String('a').repeat(30) }] } as never),
    )
    const tracker = new CharTracker()
    void tracker.start()
    expect(tracker['tokens']).toBe(15000)
  })
})
