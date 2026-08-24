import * as path from 'path'
import * as vscode from 'vscode'
import { CompanionViewState } from '../core/companionService.js'
import { AtlasRect, loadGardenAtlas, findSpecies } from '../core/gardenAtlas.js'

export class CompanionViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'codecompanion.companion'

  private view: vscode.WebviewView | null = null
  private latestState: CompanionViewState | null = null
  private isReady = false

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView
    this.isReady = false
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    }
    webviewView.webview.html = this.renderHtml(webviewView.webview)

    // Le script de la webview se charge en async : un postMessage envoyé avant qu'il ait attaché
    // son listener 'message' est perdu. La webview signale donc qu'elle est prête à le recevoir.
    webviewView.webview.onDidReceiveMessage((message: { type: string }) => {
      if (message.type !== 'ready') return
      this.isReady = true
      if (this.latestState) {
        this.postState(this.latestState)
      }
    })
  }

  update(state: CompanionViewState): void {
    this.latestState = state
    if (!this.view || !this.isReady) return
    this.postState(state)
  }

  private postState(state: CompanionViewState): void {
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

    this.view.webview.postMessage({ type: 'state', state, tilesetUri, rect })
  }

  private renderHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'dist', 'ui', 'webview', 'main.js')),
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
