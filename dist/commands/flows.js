import { tool } from '@opencode-ai/plugin';
import { FlowsManager } from '../storage/flows-manager';
import { formatHeader, formatBold } from '../output/formatter';
import { existsSync } from 'fs';
import { join } from 'path';
export const paulFlows = tool({
    description: 'Manage special flows (list/enable/disable/init)',
    args: {
        action: tool.schema.enum(['list', 'enable', 'disable', 'init']).optional().describe('Flow action: list, enable, disable, init'),
        name: tool.schema.string().optional().describe('Flow name to enable or disable'),
    },
    execute: async ({ action = 'list', name }, context) => {
        try {
            const flowsDir = join(context.directory, '.openpaul');
            switch (action) {
                case 'init': {
                    const flowsPath = FlowsManager.init(context.directory);
                    return formatHeader(2, '⚡ Flows Initialized') + '\n\n' +
                        formatBold('Flows file:') + ` ${flowsPath}\n\n` +
                        'Run `/openpaul:flows action=list` to view flows.';
                }
                case 'list': {
                    if (!existsSync(join(flowsDir, 'SPECIAL-FLOWS.md'))) {
                        return formatHeader(2, '🌊 Special Flows') + '\n\n' +
                            formatBold('Status:') + ' Not initialized\n\n' +
                            'Run `/openpaul:flows action=init` to create flows file.';
                    }
                    const flowsManager = new FlowsManager(context.directory);
                    const flows = flowsManager.list();
                    if (flows.length === 0) {
                        return formatHeader(2, '🌊 Special Flows') + '\n\n' +
                            'No flows configured.\n\n' +
                            'Run `/openpaul:flows action=init` to create default flows.';
                    }
                    let output = formatHeader(2, '🌊 Special Flows') + '\n\n';
                    for (const flow of flows) {
                        const status = flow.enabled ? '✓ Enabled' : '○ Disabled';
                        output += formatBold(`${flow.name}:`) + ` ${status}`;
                        if (flow.trigger) {
                            output += ` (trigger: ${flow.trigger})`;
                        }
                        output += '\n';
                    }
                    return output;
                }
                case 'enable': {
                    if (!name) {
                        return 'Error: --name required for enable action';
                    }
                    if (!existsSync(join(flowsDir, 'SPECIAL-FLOWS.md'))) {
                        return 'Error: Flows not initialized. Run `/openpaul:flows action=init` first.';
                    }
                    const flowsManager = new FlowsManager(context.directory);
                    const success = flowsManager.enable(name);
                    if (!success) {
                        return `Error: Flow "${name}" not found.`;
                    }
                    return formatHeader(2, '⚡ Flow Enabled') + '\n\n' +
                        formatBold('Flow:') + ` ${name}\n\n` +
                        'Run `/openpaul:flows action=list` to verify.';
                }
                case 'disable': {
                    if (!name) {
                        return 'Error: --name required for disable action';
                    }
                    if (!existsSync(join(flowsDir, 'SPECIAL-FLOWS.md'))) {
                        return 'Error: Flows not initialized. Run `/openpaul:flows action=init` first.';
                    }
                    const flowsManager = new FlowsManager(context.directory);
                    const success = flowsManager.disable(name);
                    if (!success) {
                        return `Error: Flow "${name}" not found.`;
                    }
                    return formatHeader(2, '⚡ Flow Disabled') + '\n\n' +
                        formatBold('Flow:') + ` ${name}\n\n` +
                        'Run `/openpaul:flows action=list` to verify.';
                }
                default:
                    return 'Unknown action. Use: list, enable, disable, init';
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return formatHeader(2, '❌ Flows Error') + '\n\n' +
                `Failed to ${action} flows: ${errorMessage}`;
        }
    },
});
//# sourceMappingURL=flows.js.map