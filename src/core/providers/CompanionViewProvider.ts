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

  protected renderHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'dist', 'ui', 'webview', 'App.js')),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'webview', 'styles.css')),
    )
    const sharedStyleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'shared.css')),
    )

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource}; script-src ${webview.cspSource};" />
  <link rel="stylesheet" href="${sharedStyleUri.toString()}" />
  <link rel="stylesheet" href="${styleUri.toString()}" />
</head>
<body>
  <script src="${scriptUri.toString()}"></script>
</body>
</html>`
  }
}
