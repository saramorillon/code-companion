import { Disposable, window, workspace } from 'vscode'
import { AbstractTracker } from './AbstractTracker.js'

export const CHAR_TOKEN_FACTOR = 500 as const

export class CharTracker extends AbstractTracker {
  private disposable?: Disposable

  constructor() {
    super('user')
  }

  override async start() {
    this.disposable = workspace.onDidChangeTextDocument((event) => {
      if (event.document !== window.activeTextEditor?.document) {
        return
      }
      for (const change of event.contentChanges) {
        if (change.text.length > 0) {
          this.tokens += change.text.length * CHAR_TOKEN_FACTOR
        }
      }
    })
  }

  override stop() {
    this.disposable?.dispose()
  }
}
