import pc from 'picocolors'

export class CliError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CliError'
  }
}

export function exitWithError(message: string): never {
  console.error(pc.red('Error:') + ' ' + message)
  process.exit(1)
}

export function handleCliError(err: unknown): never {
  const message = err instanceof Error ? err.message : 'Unknown error'
  console.error(pc.red('Error:') + ' ' + message)
  process.exit(1)
}
