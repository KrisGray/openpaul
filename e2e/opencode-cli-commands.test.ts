import { execSync } from 'child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'

const OPENCODE_IMAGE = process.env.OPENCODE_IMAGE ?? 'ghcr.io/anomalyco/opencode:latest'
const REPO_ROOT = resolve(__dirname, '..')

function dockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function packOpenpaul(): string {
  execSync('npm run build', { cwd: REPO_ROOT, stdio: 'ignore' })
  const output = execSync('npm pack', { cwd: REPO_ROOT, encoding: 'utf-8' })
  const lines = output.trim().split('\n')
  const tarball = lines[lines.length - 1]
  return join(REPO_ROOT, tarball)
}

function ensureWorkspaceWritable(path: string): void {
  const uid = typeof process.getuid === 'function' ? process.getuid() : 1000
  const gid = typeof process.getgid === 'function' ? process.getgid() : 1000
  const command = [
    'docker run --rm',
    `-v "${path}:/workspace"`,
    '--entrypoint sh',
    OPENCODE_IMAGE,
    `-c "chown -R ${uid}:${gid} /workspace"`,
  ].join(' ')

  execSync(command, { stdio: 'ignore' })
}

const describeIf = dockerAvailable() ? describe : describe.skip

describeIf('OpenCode CLI commands (docker)', () => {
  jest.setTimeout(180000)

  let workspace: string
  let projectDir: string
  let tarballPath: string
  let mountedTarball: string

  beforeEach(() => {
    workspace = mkdtempSync(join(tmpdir(), 'openpaul-opencode-cli-'))
    projectDir = join(workspace, 'project')
    mkdirSync(projectDir, { recursive: true })

    tarballPath = packOpenpaul()
    mountedTarball = join(workspace, 'openpaul.tgz')
    copyFileSync(tarballPath, mountedTarball)

    writeFileSync(
      join(projectDir, 'opencode.json'),
      JSON.stringify(
        {
          $schema: 'https://opencode.ai/config.json',
          plugin: ['file:/workspace/openpaul-package'],
        },
        null,
        2
      )
    )
  })

  afterEach(() => {
    if (tarballPath) {
      rmSync(tarballPath, { force: true })
    }
    if (workspace) {
      try {
        ensureWorkspaceWritable(workspace)
      } catch {
      }
      rmSync(workspace, { recursive: true, force: true })
    }
  })

  it('shows OpenPAUL plugin in resolved config', () => {
    const script = [
      'set -e',
      'apk add --no-cache curl bash >/dev/null',
      'if ! command -v bun >/dev/null 2>&1; then curl -fsSL https://bun.sh/install | bash; fi',
      'export PATH="/root/.bun/bin:$PATH"',
      'mkdir -p /workspace/openpaul-package',
      'tar -xzf /workspace/openpaul.tgz -C /workspace/openpaul-package --strip-components=1',
      'cd /workspace/openpaul-package',
      'bun install --production >/dev/null 2>&1 || bun install >/dev/null 2>&1',
      'cd /workspace/project',
      'OPENCODE_CONFIG=/workspace/project/opencode.json OPENCODE_DISABLE_AUTOUPDATE=1 OPENCODE_DISABLE_MODELS_FETCH=1 opencode debug config 2>&1',
    ].join('; ')
    const escaped = script.replace(/"/g, '\\"')
    const command = [
      'docker run --rm',
      `-v "${workspace}:/workspace"`,
      '--entrypoint sh',
      OPENCODE_IMAGE,
      `-c "${escaped}"`,
    ].join(' ')

    const output = execSync(command, { encoding: 'utf-8' })

    expect(output).toContain('file:/workspace/openpaul-package')
  })
})
