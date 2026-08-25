import path from 'path'
import * as vscode from 'vscode'

export abstract class AbstractViewProvider<T> implements vscode.WebviewViewProvider {
  protected data: T | null = null
  protected view: vscode.WebviewView | null = null
  protected isReady = false

  constructor(protected readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView
    this.isReady = false
    webviewView.webview.options = { enableScripts: true }
    webviewView.webview.html = this.renderHtml(webviewView.webview)
    webviewView.webview.onDidReceiveMessage((message: { type: string }) => {
      if (message.type !== 'ready') {
        return
      }
      this.isReady = true
      if (this.data) {
        this.postState(this.data)
      }
    })
  }

  update(data: T): void {
    this.data = data
    if (!this.view || !this.isReady) {
      return
    }
    this.postState(data)
  }

  private postState(data: T): void {
    if (!this.view) {
      return
    }

    const state = this.buildState(data)
    if (state) {
      this.view.webview.postMessage({ type: 'state', state })
    }
  }

  protected buildState(data: T): unknown {
    return data
  }

  protected getUri(webview: vscode.Webview, ...paths: string[]) {
    return webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, ...paths)))
  }

  protected abstract getScriptUri(webview: vscode.Webview): vscode.Uri

  protected abstract getStyleUri(webview: vscode.Webview): vscode.Uri

  protected renderHtml(webview: vscode.Webview): string {
    const scriptUri = this.getScriptUri(webview)
    const styleUri = this.getStyleUri(webview)
    const sharedStyleUri = this.getUri(webview, 'src', 'ui', 'shared.css')

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
