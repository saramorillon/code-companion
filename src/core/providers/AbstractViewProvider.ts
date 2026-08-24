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
    return webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, 'dist', 'ui', ...paths)))
  }

  protected abstract renderHtml(webview: vscode.Webview): string
}
