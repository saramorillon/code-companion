import * as path from 'path'
import * as vscode from 'vscode'
import { CompanionViewState } from '../companionService.js'
import { AtlasRect, loadGardenAtlas, findSpecies } from '../gardenAtlas.js'
import { AbstractViewProvider } from './AbstractViewProvider.js'

export class CompanionViewProvider extends AbstractViewProvider<CompanionViewState> {
  static readonly viewId = 'codecompanion.companion'

  protected override buildState(state: CompanionViewState) {
    if (!this.view) return

    const atlas = loadGardenAtlas(this.extensionUri.fsPath)
    const tilesetUri = this.view.webview
      .asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, atlas.image)))
      .toString()

    let rect: AtlasRect | null = null
    if (state.kind && state.speciesId && state.color && state.stageIndex !== null) {
      const species = findSpecies(atlas, state.kind, state.speciesId)
      rect = species?.stages[state.color][state.stageIndex] ?? null
    }

    return { state, tilesetUri, rect }
  }

  protected override getScriptUri(webview: vscode.Webview): vscode.Uri {
    return this.getUri(webview, 'dist', 'ui', 'companion', 'App.js')
  }

  protected override getStyleUri(webview: vscode.Webview): vscode.Uri {
    return this.getUri(webview, 'src', 'ui', 'companion', 'styles.css')
  }
}
