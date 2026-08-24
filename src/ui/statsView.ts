import * as path from 'path'
import * as vscode from 'vscode'
import { CompanionStats } from '../core/companionModel.js'

export class StatsViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'codecompanion.stats'

  private view: vscode.WebviewView | null = null
  private latestStats: CompanionStats | null = null

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView
    webviewView.webview.options = { enableScripts: true }
    webviewView.webview.html = this.renderHtml(webviewView.webview)

    if (this.latestStats) {
      this.postStats(this.latestStats)
    }
  }

  update(stats: CompanionStats): void {
    this.latestStats = stats
    if (!this.view) return
    this.postStats(stats)
  }

  private postStats(stats: CompanionStats): void {
    this.view?.webview.postMessage({ type: 'stats', stats })
  }

  private renderHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'stats', 'main.js')),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'stats', 'styles.css')),
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
  <div class="stat-row">
    <span class="stat-label">Harvested</span>
    <span class="stat-value" id="harvested-count"></span>
  </div>
  <div class="rarity-section" id="counts-list"></div>
  <div class="stat-section">
    <div class="stat-row">
      <span class="stat-label">Tokens today</span>
      <span class="stat-value" id="today-tokens"></span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Characters today</span>
      <span class="stat-value" id="today-chars"></span>
    </div>
  </div>
  <div class="stat-section">
    <div id="ratio-donut"></div>
    <div class="legend-row">
      <span class="legend-dot legend-ai"></span>
      <span class="legend-label">AI</span>
      <span class="stat-value" id="ratio-ai-pct"></span>
    </div>
    <div class="legend-row">
      <span class="legend-dot legend-typed"></span>
      <span class="legend-label">Typed</span>
      <span class="stat-value" id="ratio-typed-pct"></span>
    </div>
  </div>
  <div class="stat-section">
    <div id="week-chart"></div>
    <div class="legend-row">
      <span class="legend-dot legend-ai"></span>
      <span class="legend-label">AI</span>
      <span class="legend-dot legend-typed"></span>
      <span class="legend-label">Typed</span>
    </div>
    <div id="best-day-card">
      <div id="best-day-trophy">🏆</div>
      <div id="best-day-info">
        <div id="best-day-title">Best day</div>
        <div id="best-day-value"></div>
        <div id="best-day-date"></div>
      </div>
    </div>
  </div>
  <script src="${sharedScriptUri.toString()}"></script>
  <script src="${scriptUri.toString()}"></script>
</body>
</html>`
  }
}
