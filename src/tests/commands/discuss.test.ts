/**
 * discuss command Tests
 */

import { openpaulDiscuss } from '../../commands/discuss'
import { existsSync } from 'fs'
import { join } from 'path'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

jest.mock('../../storage/atomic-writes', () => ({
  atomicWrite: jest.fn().mockResolvedValue(undefined),
}))

jest.mock(
  '@opencode-ai/plugin',
  () => {
    const chainable = {
      optional: () => chainable,
      describe: () => chainable,
    }
    const tool = (input: any) => input
    tool.schema = {
      boolean: () => chainable,
      string: () => chainable,
      number: () => chainable,
    }
    return { tool }
  },
  { virtual: true }
)

describe('openpaulDiscuss', () => {
  const mockContext = { directory: '/test/project' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return error when phase directory not found', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(false)
    
    const result = await (openpaulDiscuss as any).execute(
      { phase: 99 },
      mockContext
    )
    
    expect(result).toContain('Cannot Discuss Phase')
  })

  it('should return error when CONTEXT.md exists without overwrite', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(true)
    
    const result = await (openpaulDiscuss as any).execute(
      { phase: 1 },
      mockContext
    )
    
    expect(result).toContain('Context Already Exists')
  })
})
