import { ExtensionContext, workspace, commands, window } from 'vscode'
import { DataManager } from './manager/DataManager.js'
import { AbstractViewProvider } from './providers/AbstractViewProvider.js'
import { CompanionViewProvider } from './providers/CompanionViewProvider.js'
import { PantryViewProvider } from './providers/PantryViewProvider.js'
import { StatsViewProvider } from './providers/StatsViewProvider.js'
import { AbstractTracker } from './trackers/AbstractTracker.js'
import { CharTracker } from './trackers/CharTracker.js'
import { ClaudeTracker } from './trackers/ClaudeTracker.js'
import { Provider } from './types.js'

let refreshTimer: ReturnType<typeof setInterval> | null = null

let dataManager: DataManager | null = null

const trackers: Record<Provider, AbstractTracker> = {
  user: new CharTracker(),
  claude: new ClaudeTracker(),
}

const viewProviders: Record<string, AbstractViewProvider<unknown>> = {
  companion: new CompanionViewProvider(),
  pantry: new PantryViewProvider(),
  stats: new StatsViewProvider(),
}

export async function activate(context: ExtensionContext) {
  const storageDir = context.globalStorageUri.fsPath

  dataManager = new DataManager(storageDir)
  await dataManager.loadData()

  for (const tracker of Object.values(trackers)) {
    await tracker.start(dataManager.state)
  }

  for (const viewProvider of Object.values(viewProviders)) {
    viewProvider.start(dataManager.state, context.extensionUri)
  }

  async function refresh() {
    if (dataManager) {
      for (const tracker of Object.values(trackers)) {
        const tokens = await tracker.update(dataManager.state)
        dataManager.update(tracker.key, tokens)
      }

      for (const viewProvider of Object.values(viewProviders)) {
        viewProvider.update(dataManager.state)
      }

      await dataManager.saveData()
    }
  }

  context.subscriptions.push(
    ...Object.values(viewProviders).map((viewProvider) =>
      window.registerWebviewViewProvider(viewProvider.viewId, viewProvider),
    ),
  )

  scheduleRefresh(refresh)

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codecompanion.refreshIntervalSeconds')) {
        scheduleRefresh(refresh)
      }
    }),
  )

  context.subscriptions.push(
    window.onDidChangeWindowState((windowState) => {
      if (windowState.focused) {
        void refresh()
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('codecompanion.refresh', () => {
      void refresh()
    }),
  )
}

function scheduleRefresh(refresh: () => Promise<void>): void {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  const seconds = workspace.getConfiguration('codecompanion').get<number>('refreshIntervalSeconds', 90)
  refreshTimer = setInterval(refresh, seconds * 1000)
}

export async function deactivate() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }

  await dataManager?.saveData()
  for (const tracker of Object.values(trackers)) {
    await tracker.stop()
  }
}
