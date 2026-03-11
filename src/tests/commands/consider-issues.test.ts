/**
 * consider-issues command Tests
 */

import { paulConsiderIssues } from '../../commands/consider-issues'
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

describe('paulConsiderIssues', () => {
  const mockContext = { directory: '/test/project' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return error when phase directory not found', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(false)
    
    const result = await (paulConsiderIssues as any).execute(
      { phase: 99, issues: 'Test issue' },
      mockContext
    )
    
    expect(result).toContain('Cannot Create Issues')
  })

  it('should create issues with severity categorization', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    
    const result = await (paulConsiderIssues as any).execute(
      { 
        phase: 1, 
        issues: 'Issue 1, Issue 2',
        severities: 'critical,medium',
        areas: 'API|Database|UI',
        mitigations: 'Fix 1, Fix 2',
        overwrite: true,
      },
      mockContext
    )
    
    expect(result).toContain('Issues Identified')
    expect(result).toContain('Critical:')
    expect(result).toContain('Medium:')
  })

  it('should return error for invalid severity', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    
    const result = await (paulConsiderIssues as any).execute(
      { 
        phase: 1, 
        issues: 'Issue 1',
        severities: 'invalid',
      },
      mockContext
    )
    
    expect(result).toContain('Invalid Severity')
  })

  it('should return error when file exists without overwrite', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(true)
    
    const result = await (paulConsiderIssues as any).execute(
      { phase: 1, issues: 'Test' },
      mockContext
    )
    
    expect(result).toContain('Issues Already Exist')
  })
})
