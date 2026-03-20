import pc from 'picocolors'

let verbosity = 0

export function setVerbosity(level: number): void {
  verbosity = level
}

export function getVerbosity(): number {
  return verbosity
}

export function error(message: string): void {
  console.error(pc.red('Error:') + ' ' + message)
}

export function success(message: string): void {
  console.log(pc.green('✓') + ' ' + message)
}

export function step(message: string): void {
  console.log(pc.gray('•') + ' ' + message)
}

export function info(message: string): void {
  if (verbosity >= 1) {
    console.log(pc.blue('ℹ') + ' ' + message)
  }
}

export function debug(message: string): void {
  if (verbosity >= 2) {
    console.log(pc.dim('[debug]') + ' ' + message)
  }
}
