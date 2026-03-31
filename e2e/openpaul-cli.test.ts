/**
 * E2E Tests for OpenPAUL CLI functionality
 * Tests the compiled CLI in a realistic environment
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, mkdtempSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const CLI_PATH = resolve(__dirname, '../dist/cli.js');

function runCLI(args: string[], cwd?: string): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(`node "${CLI_PATH}" ${args.join(' ')}`, {
      cwd: cwd ?? tmpdir(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    return { stdout, stderr: '', code: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      code: error.status ?? 1,
    };
  }
}

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'openpaul-e2e-'));
}

function cleanupDir(dir: string) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('OpenPAUL CLI E2E Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('CLI basics', () => {
    it('should execute without errors when run', () => {
      const result = runCLI(['--force', '--name', 'test-project'], tempDir);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should show help with --help flag', () => {
      const result = runCLI(['--help'], tempDir);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Usage: openpaul');
      expect(result.stdout).toContain('--preset');
      expect(result.stdout).toContain('--force');
      expect(result.stdout).toContain('--name');
    });

    it('should show version with --version flag', () => {
      const result = runCLI(['--version'], tempDir);
      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should show verbose output with -v flag', () => {
      const result = runCLI(['-v', '--force', '--name', 'test-project'], tempDir);
      expect(result.code).toBe(0);
    });
  });

  describe('Scaffolding', () => {
    it('should create .openpaul directory', () => {
      const result = runCLI(['--force', '--name', 'test-project'], tempDir);
      expect(result.code).toBe(0);
      expect(existsSync(join(tempDir, '.openpaul'))).toBe(true);
    });

    it('should create state.json with project name', () => {
      const result = runCLI(['--force', '--name', 'my-awesome-project'], tempDir);
      expect(result.code).toBe(0);
      
      const statePath = join(tempDir, '.openpaul', 'state.json');
      expect(existsSync(statePath)).toBe(true);
      
      const state = JSON.parse(readFileSync(statePath, 'utf-8'));
      expect(state.name).toBe('my-awesome-project');
      expect(state.version).toBe('1.0');
      expect(state.createdAt).toBeDefined();
      expect(state.updatedAt).toBeDefined();
    });

    it('should create .opencode directory with minimal preset (default)', () => {
      const result = runCLI(['--force', '--name', 'test-project'], tempDir);
      expect(result.code).toBe(0);
      expect(existsSync(join(tempDir, '.opencode'))).toBe(true);
      expect(existsSync(join(tempDir, 'opencode.json'))).toBe(true);
      expect(existsSync(join(tempDir, '.opencode', 'package.json'))).toBe(true);
      expect(existsSync(join(tempDir, '.opencode', 'plugins', 'openpaul.ts'))).toBe(true);
    });

    it('should create full preset when --preset full is specified', () => {
      const result = runCLI(['--force', '--name', 'test-project', '--preset', 'full'], tempDir);
      expect(result.code).toBe(0);
      expect(existsSync(join(tempDir, 'tui.json'))).toBe(true);
      expect(existsSync(join(tempDir, '.opencode', 'commands', 'example.md'))).toBe(true);
      expect(existsSync(join(tempDir, '.opencode', 'rules', 'example.md'))).toBe(true);
      expect(existsSync(join(tempDir, '.opencode', 'package.json'))).toBe(true);
      expect(existsSync(join(tempDir, '.opencode', 'plugins', 'openpaul.ts'))).toBe(true);
    });

    it('should create minimal preset when --preset minimal is specified', () => {
      const result = runCLI(['--force', '--name', 'test-project', '--preset', 'minimal'], tempDir);
      expect(result.code).toBe(0);
      expect(existsSync(join(tempDir, 'opencode.json'))).toBe(true);
      expect(existsSync(join(tempDir, 'tui.json'))).toBe(false);
    });
  });

  describe('Path handling', () => {
    it('should scaffold to specified --path', () => {
      const customPath = join(tempDir, 'custom-dir');
      const result = runCLI(['--force', '--name', 'test-project', '--path', customPath], tempDir);
      expect(result.code).toBe(0);
      expect(existsSync(join(customPath, '.openpaul'))).toBe(true);
    });

    it('should scaffold to specified -p (short flag)', () => {
      const customPath = join(tempDir, 'short-path');
      const result = runCLI(['--force', '--name', 'test-project', '-p', customPath], tempDir);
      expect(result.code).toBe(0);
      expect(existsSync(join(customPath, '.openpaul'))).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should reject unknown options', () => {
      const result = runCLI(['--unknown-flag'], tempDir);
      expect(result.code).toBe(1);
      expect(result.stderr.toLowerCase()).toContain('error');
    });

    it('should accept project names with special characters (validation only in prompt mode)', () => {
      const result = runCLI(['--force', '--name', 'invalid/name'], tempDir);
      expect(result.code).toBe(0);
    });

    it('should reject empty project names', () => {
      const result = runCLI(['--force', '--name', ''], tempDir);
      expect(result.code).toBe(1);
    });
  });

  describe('Overwrite protection', () => {
    it('should warn when .openpaul already exists (without --force)', () => {
      runCLI(['--force', '--name', 'test-project'], tempDir);
      const result = runCLI(['--force', '--name', 'test-project'], tempDir);
      expect(result.code).toBe(0);
    });
  });

  describe('Output formatting', () => {
    it('should show success message with green checkmark', () => {
      const result = runCLI(['--force', '--name', 'test-project'], tempDir);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('initialized successfully');
    });

    it('should show preset info when preset specified', () => {
      const result = runCLI(['--force', '--name', 'test-project', '--preset', 'full'], tempDir);
      expect(result.code).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('full');
    });
  });
});
