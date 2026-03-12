import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { scanDirectory, treeToMarkdown, countFiles } from './directory-scanner';
export function generateCodebaseDoc(projectRoot, options = {}) {
    const maxDepth = options.maxDepth || 5;
    const outputPath = options.outputPath || 'CODEBASE.md';
    const packageJson = loadPackageJson(projectRoot);
    const projectName = packageJson?.name || 'Unknown Project';
    const version = packageJson?.version || '1.0.0';
    const description = packageJson?.description || '';
    const srcTree = scanDirectory(join(projectRoot, 'src'), { maxDepth });
    const structure = srcTree ? treeToMarkdown(srcTree) : '';
    const fileCounts = srcTree ? countFiles(srcTree) : { files: 0, directories: 0 };
    const stack = extractStack(packageJson);
    const conventions = extractConventions(projectRoot);
    const concerns = extractConcerns(srcTree);
    const integrations = extractIntegrations(projectRoot, packageJson);
    const architecture = extractArchitecture(srcTree);
    return {
        projectName,
        version,
        description,
        structure,
        fileCounts,
        stack,
        conventions,
        concerns,
        integrations,
        architecture,
    };
}
function loadPackageJson(projectRoot) {
    const packageJsonPath = join(projectRoot, 'package.json');
    if (!existsSync(packageJsonPath)) {
        return null;
    }
    try {
        const content = readFileSync(packageJsonPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
function extractStack(packageJson) {
    const stack = [];
    if (!packageJson) {
        return stack;
    }
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const knownDeps = {
        'typescript': 'Language',
        'ts-node': 'Runtime',
        'jest': 'Testing',
        'vitest': 'Testing',
        'mocha': 'Testing',
        'eslint': 'Linting',
        'prettier': 'Formatting',
        'zod': 'Validation',
        'yaml': 'Config',
        'diff': 'Utilities',
        '@opencode-ai/plugin': 'Framework',
    };
    for (const [dep, type] of Object.entries(knownDeps)) {
        if (deps[dep]) {
            stack.push({
                name: dep,
                version: deps[dep] || 'latest',
                type,
            });
        }
    }
    return stack;
}
function extractConventions(projectRoot) {
    const conventions = [];
    const tsconfigPath = join(projectRoot, 'tsconfig.json');
    if (existsSync(tsconfigPath)) {
        conventions.push('TypeScript for type safety');
    }
    const eslintPath = join(projectRoot, '.eslintrc.json');
    const eslintrcPath = join(projectRoot, '.eslintrc.js');
    if (existsSync(eslintPath) || existsSync(eslintrcPath)) {
        conventions.push('ESLint for code linting');
    }
    const prettierPath = join(projectRoot, '.prettierrc');
    if (existsSync(prettierPath)) {
        conventions.push('Prettier for code formatting');
    }
    const jestConfig = join(projectRoot, 'jest.config.js');
    const vitestConfig = join(projectRoot, 'vitest.config.ts');
    if (existsSync(jestConfig) || existsSync(vitestConfig)) {
        conventions.push('Unit testing with Jest/Vitest');
    }
    conventions.push('ESM modules (type: module)');
    return conventions;
}
function extractConcerns(srcTree) {
    const concerns = [];
    if (!srcTree?.children) {
        return concerns;
    }
    const topLevelDirs = srcTree.children
        .filter(c => c.type === 'directory')
        .map(c => c.name);
    const concernMap = {
        commands: 'CLI commands',
        storage: 'Data persistence',
        state: 'State management',
        utils: 'Utility functions',
        types: 'TypeScript types',
        output: 'Output formatting',
        roadmap: 'Roadmap management',
    };
    for (const [dir, concern] of Object.entries(concernMap)) {
        if (topLevelDirs.includes(dir)) {
            concerns.push(concern);
        }
    }
    return concerns;
}
function extractIntegrations(projectRoot, packageJson) {
    const integrations = [];
    if (!packageJson) {
        return integrations;
    }
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const integrationMap = {
        '@opencode-ai/plugin': 'OpenCode AI',
    };
    for (const [dep, name] of Object.entries(integrationMap)) {
        if (deps[dep]) {
            integrations.push(name);
        }
    }
    return integrations;
}
function extractArchitecture(srcTree) {
    if (!srcTree?.children) {
        return 'Simple module structure';
    }
    const hasCommands = srcTree.children.some(c => c.type === 'directory' && c.name === 'commands');
    const hasStorage = srcTree.children.some(c => c.type === 'directory' && c.name === 'storage');
    const hasState = srcTree.children.some(c => c.type === 'directory' && c.name === 'state');
    if (hasCommands && hasStorage && hasState) {
        return 'Command → Manager → Storage pattern (three-layer architecture)';
    }
    if (hasCommands) {
        return 'Command-based architecture';
    }
    return 'Module-based architecture';
}
export function docToMarkdown(doc) {
    const stackTable = doc.stack
        .map(s => `| ${s.name} | ${s.version} | ${s.type} |`)
        .join('\n');
    const conventionsList = doc.conventions.map(c => `- ${c}`).join('\n');
    const concernsList = doc.concerns.map(c => `- ${c}`).join('\n');
    const integrationsList = doc.integrations.length > 0
        ? doc.integrations.map(i => `- ${i}`).join('\n')
        : 'None detected';
    return `# Codebase Documentation

**Project:** ${doc.projectName}
**Version:** ${doc.version}
**Generated:** ${new Date().toISOString()}

---

## Overview

${doc.description || 'No description available.'}

---

## Structure

\`\`\`
${doc.structure || 'No structure available.'}
\`\`\`

**File counts:** ${doc.fileCounts.files} files, ${doc.fileCounts.directories} directories

---

## Tech Stack

| Package | Version | Type |
|---------|---------|------|
${stackTable || '| - | - | - |'}

---

## Conventions

${conventionsList || 'No conventions detected.'}

---

## Concerns

${concernsList || 'No concerns detected.'}

---

## Integrations

${integrationsList}

---

## Architecture

${doc.architecture}

---

*Generated by /openpaul:map-codebase*
`;
}
//# sourceMappingURL=codebase-generator.js.map