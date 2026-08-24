import * as vscode from 'vscode'
import { TypedCharsAccumulator } from '../typedCharsCounter.js'

// Approximation, pas une mesure exacte : VSCode n'expose aucun moyen de distinguer une vraie
// frappe clavier d'un collage, d'une auto-complétion ou d'une édition faite par une autre
// extension (Claude Code y compris, s'il applique des changements dans l'éditeur actif).
// On compte simplement les caractères insérés dans le document actuellement actif.
export class TypingTracker {
  private readonly accumulator = new TypedCharsAccumulator()

  constructor() {
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document !== vscode.window.activeTextEditor?.document) return
      this.accumulator.add(event.contentChanges)
    })
  }

  takePendingChars(): number {
    return this.accumulator.takePendingChars()
  }
}
