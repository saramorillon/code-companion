import * as path from 'path'
import * as vscode from 'vscode'
import { CompanionStats } from './companionModel.js'

export class StatsViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'codecompanion.stats'

  private view: vscode.WebviewView | null = null
  private latestStats: CompanionStats | null = null
  private isReady = false

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView
    this.isReady = false
    webviewView.webview.options = { enableScripts: true }
    webviewView.webview.html = this.renderHtml(webviewView.webview)

    // Le script de la webview se charge en async : un postMessage envoyé avant qu'il ait attaché
    // son listener 'message' est perdu. La webview signale donc qu'elle est prête à le recevoir.
    webviewView.webview.onDidReceiveMessage((message: { type: string }) => {
      if (message.type !== 'ready') return
      this.isReady = true
      if (this.latestStats) {
        this.postStats(this.latestStats)
      }
    })
  }

  update(stats: CompanionStats): void {
    this.latestStats = stats
    if (!this.view || !this.isReady) return
    this.postStats(stats)
  }

  private postStats(stats: CompanionStats): void {
    this.view?.webview.postMessage({ type: 'stats', stats })
  }

  private renderHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'dist', 'ui', 'stats', 'main.js')),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'stats', 'styles.css')),
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
