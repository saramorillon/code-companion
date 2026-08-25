import * as vscode from 'vscode'
import { CompanionStats } from '../../types.js'
import { AbstractViewProvider } from './AbstractViewProvider.js'

export class StatsViewProvider extends AbstractViewProvider<CompanionStats> {
  static readonly viewId = 'codecompanion.stats'

  protected override getScriptUri(webview: vscode.Webview): vscode.Uri {
    return this.getUri(webview, 'dist', 'ui', 'stats', 'App.js')
  }

  protected override getStyleUri(webview: vscode.Webview): vscode.Uri {
    return this.getUri(webview, 'src', 'ui', 'stats', 'styles.css')
  }
}
