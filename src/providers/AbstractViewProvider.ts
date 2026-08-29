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

  constructor(private isDev: boolean) {}

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
    return this.getUri(webview, 'media', AtlasManager.getImage()).toString()
  }

  protected renderHtml(webview: Webview): string {
    if (this.isDev) {
      const server = 'http://localhost:5173'
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    img-src ${server} ${webview.cspSource} data:;
    style-src ${server} 'unsafe-inline';
    script-src ${server} 'unsafe-inline' 'unsafe-eval';
    connect-src ${server} ${server.replace('http', 'ws')};
  " />
</head>
<body>
  <script type="module" src="${server}/@vite/client"></script>
  <script type="module" src="${server}/src/views/${this.viewName}/App.tsx"></script>
</body>
</html>
  `
    }

    const scriptUri = this.getUri(webview, 'dist', 'views', this.viewName, 'App.js')
    const styleUri = this.getUri(webview, 'dist', 'views', this.viewName, 'App.css')
    const sharedUri = this.getUri(webview, 'dist', 'views', 'shared', 'App.css')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    img-src ${webview.cspSource} data:;
    style-src ${webview.cspSource};
    script-src ${webview.cspSource};
  " />
  <link rel="stylesheet" href="${styleUri.toString()}" />
  <link rel="stylesheet" href="${sharedUri.toString()}" />
</head>
<body>
  <script type="module" src="${scriptUri.toString()}"></script>
</body>
</html>`
  }
}
