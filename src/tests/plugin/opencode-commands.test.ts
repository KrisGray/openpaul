// Strip tool() wrapper so OpenPaulPlugin can be imported without bundling errors.
jest.mock(
  '@opencode-ai/plugin',
  () => {
    const chainable = (): any => {
      const fn: any = () => chainable()
      return new Proxy(fn, { get: () => chainable() })
    }
    const tool: any = (input: any) => input
    tool.schema = chainable()
    return { tool, z: require('zod') }
  },
  { virtual: true }
)

import { OpenPaulPlugin } from '../../index'

describe('OpenPaulPlugin command injection', () => {
  it('merges OpenPAUL commands into config.command', async () => {
    const log = jest.fn().mockResolvedValue(undefined)
    const plugin = await OpenPaulPlugin({
      project: { id: 'test-project', worktree: '/tmp' } as any,
      client: { app: { log } } as any,
      directory: '/tmp',
      worktree: '/tmp',
      serverUrl: new URL('http://localhost'),
      $: {} as any,
    })

    if (!plugin.config) {
      throw new Error('Expected config hook to be defined')
    }

    const config: { command?: Record<string, { template: string }> } = {
      command: {
        existing: { template: 'keep-me' },
      },
    }

    await plugin.config(config as any)

    const expectedCommands = [
      'openpaul:init',
      'openpaul:plan',
      'openpaul:apply',
      'openpaul:unify',
      'openpaul:progress',
      'openpaul:status',
      'openpaul:help',
      'openpaul:pause',
      'openpaul:resume',
      'openpaul:handoff',
      'openpaul:milestone',
      'openpaul:complete-milestone',
      'openpaul:discuss-milestone',
      'openpaul:discuss',
      'openpaul:assumptions',
      'openpaul:discover',
      'openpaul:consider-issues',
      'openpaul:research',
      'openpaul:research-phase',
      'openpaul:config',
      'openpaul:flows',
      'openpaul:map-codebase',
      'openpaul:add-phase',
      'openpaul:remove-phase',
      'openpaul:verify',
      'openpaul:plan-fix',
    ]

    for (const command of expectedCommands) {
      expect(config.command?.[command]).toBeDefined()
      expect(config.command?.[command].template).toContain(command)
    }

    expect(config.command?.existing.template).toBe('keep-me')
  })
})
