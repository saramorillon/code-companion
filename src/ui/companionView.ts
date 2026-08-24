import * as path from 'path'
import * as vscode from 'vscode'
import { CompanionViewState } from '../core/companionService.js'
import { AtlasRect, loadGardenAtlas, findSpecies } from '../core/gardenAtlas.js'

export class CompanionViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'codecompanion.companion'

  private view: vscode.WebviewView | null = null
  private latestState: CompanionViewState | null = null

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    }
    webviewView.webview.html = this.renderHtml(webviewView.webview)

    if (this.latestState) {
      this.postState(this.latestState)
    }
  }

  update(state: CompanionViewState): void {
    this.latestState = state
    if (!this.view) return
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
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'webview', 'main.js')),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'webview', 'styles.css')),
    )
    const sharedStyleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'shared.css')),
    )
    const sharedScriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'shared.js')),
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
  <div id="sprite-container">
    <div id="sprite-outer">
      <div id="sprite"></div>
    </div>
  </div>
  <div id="info">
    <div id="name-row">
      <span id="name"></span>
      <span id="kind-rarity"></span>
    </div>
    <div id="stage-text"></div>
    <div id="progress-bar"><div id="progress-fill"></div></div>
    <div id="remaining-text"></div>
  </div>
  <script src="${sharedScriptUri.toString()}"></script>
  <script src="${scriptUri.toString()}"></script>
</body>
</html>`
  }
}
