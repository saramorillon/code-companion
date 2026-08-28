import { join } from 'node:path'
import { Uri, Webview, WebviewView, WebviewViewProvider } from 'vscode'
import { AtlasManager } from '../manager/AtlasManager.js'
import { AppState } from '../types.js'

export abstract class AbstractViewProvider<T> implements WebviewViewProvider {
  abstract readonly viewId: string
  abstract readonly viewName: string
  protected data: AppState | null = null
  protected view: WebviewView | null = null
  protected isReady = false
  protected extensionPath = ''

  start(data: AppState, extensionUri: Uri) {
    this.data = data
    this.extensionPath = extensionUri.fsPath
  }

  resolveWebviewView(webviewView: WebviewView): void {
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

  update(data: AppState): void {
    this.data = data
    this.postState(this.data)
  }

  private postState(data: AppState): void {
    if (!this.view || !this.isReady) {
      return
    }

    const state = this.buildState(data)
    if (state) {
      this.view.webview.postMessage({ type: 'state', state })
    }
  }

  protected abstract buildState(data: AppState): T | null

  protected getUri(webview: Webview, ...paths: string[]) {
    return webview.asWebviewUri(Uri.file(join(this.extensionPath, ...paths)))
  }

  protected getTilesetUri(webview: Webview) {
    return this.getUri(webview, AtlasManager.getImage()).toString()
  }

  protected renderHtml(webview: Webview): string {
    const scriptUri = this.getUri(webview, 'dist', 'views', this.viewName, 'App.js')
    const styleUri = this.getUri(webview, 'src', 'views', this.viewName, 'styles.css')
    const sharedStyleUri = this.getUri(webview, 'src', 'views', 'shared.css')

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
