type FsMocks = {
  existsSync: jest.Mock
  writeFileSync: jest.Mock
  renameSync: jest.Mock
  unlinkSync: jest.Mock
  mkdirSync: jest.Mock
}

const createFsMocks = (): FsMocks => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
  renameSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
})

let fsMocks: FsMocks

const mockFsModule = () => {
  jest.mock('fs', () => fsMocks)
}

describe('atomicWrite cleanup branches (mocked fs)', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('skips cleanup when temp file does not exist after write failure', async () => {
    jest.resetModules()
    fsMocks = createFsMocks()

    let existsCalls = 0
    fsMocks.existsSync.mockImplementation(() => {
      existsCalls += 1
      return existsCalls === 1
    })

    const originalError = new Error('write failed')
    fsMocks.writeFileSync.mockImplementation(() => {
      throw originalError
    })

    mockFsModule()
    const { atomicWrite } = await import('../../storage/atomic-writes')

    await expect(atomicWrite('/tmp/test.json', 'content')).rejects.toThrow(
      'write failed'
    )
    expect(fsMocks.unlinkSync).not.toHaveBeenCalled()
  })

  it('swallows cleanup errors and rethrows the original write failure', async () => {
    jest.resetModules()
    fsMocks = createFsMocks()

    let existsCalls = 0
    fsMocks.existsSync.mockImplementation(() => {
      existsCalls += 1
      return existsCalls <= 2
    })

    const originalError = new Error('write failed')
    fsMocks.writeFileSync.mockImplementation(() => {
      throw originalError
    })
    fsMocks.unlinkSync.mockImplementation(() => {
      throw new Error('cleanup failed')
    })

    mockFsModule()
    const { atomicWrite } = await import('../../storage/atomic-writes')

    await expect(atomicWrite('/tmp/test.json', 'content')).rejects.toThrow(
      'write failed'
    )
    expect(fsMocks.unlinkSync).toHaveBeenCalledTimes(1)
  })
})
