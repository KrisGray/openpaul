/**
 * assumptions command Tests
 */

import { openpaulAssumptions } from '../../commands/assumptions'
import { existsSync } from 'fs'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

jest.mock('../../storage/atomic-writes', () => ({
  atomicWrite: jest.fn().mockResolvedValue(undefined),
}))

describe('openpaulAssumptions', () => {
  const mockContext = { directory: '/test/project' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return error when phase directory not found', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(false)
    
    const result = await (openpaulAssumptions as any).execute(
      { phase: 99, assumptions: 'Test assumption' },
      mockContext
    )
    
    expect(result).toContain('Cannot Create Assumptions')
  })

  it('should create assumptions with default values', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    
    const result = await (openpaulAssumptions as any).execute(
      { 
        phase: 1, 
        assumptions: 'Test assumption 1, Test assumption 2',
        overwrite: true,
      },
      mockContext
    )
    
    expect(result).toContain('Assumptions Captured')
  })

  it('should return error when file exists without overwrite', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(true)
    
    const result = await (openpaulAssumptions as any).execute(
      { phase: 1, assumptions: 'Test' },
      mockContext
    )
    
    expect(result).toContain('Assumptions Already Exist')
  })
})
