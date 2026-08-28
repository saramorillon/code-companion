import { AbstractViewProvider } from '../../src/providers/AbstractViewProvider.js'

class ViewProviderImpl extends AbstractViewProvider<null> {
  override readonly viewId = 'viewId'
  override readonly viewName = 'viewName'
  protected getScriptUri = vi.fn()
  protected getStyleUri = vi.fn()
  protected buildState = vi.fn()
}

describe(AbstractViewProvider.prototype.start, () => {
  it('should initialize data', () => {
    const provider = new ViewProviderImpl()
    const data = {} as never
    provider.start(data, {} as never)
    expect(provider['data']).toBe(data)
  })

  it('should initialize data', () => {
    const provider = new ViewProviderImpl()
    const uri = { fsPath: 'fsPath' } as never
    provider.start({} as never, uri)
    expect(provider['extensionPath']).toBe('fsPath')
  })
})

describe(AbstractViewProvider.prototype.resolveWebviewView, () => {
  it('should initialize data', () => {
    const provider = new ViewProviderImpl()
    const data = {} as never
    provider.start(data, {} as never)
    expect(provider['data']).toBe(data)
  })

  it('should initialize data', () => {
    const provider = new ViewProviderImpl()
    const uri = { fsPath: 'fsPath' } as never
    provider.start({} as never, uri)
    expect(provider['extensionPath']).toBe('fsPath')
  })
})
