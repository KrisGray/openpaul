import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs'
import { join, dirname } from 'path'

import type { PhaseEntry, AddPhaseOptions, RemovePhaseResult, RoadmapValidationResult } from '../types/roadmap'

/**
 * RoadmapManager
 * 
 * Manages ROADMAP.md phase manipulation operations.
 * Provides core logic for adding and removing phases with proper
 * validation and file system operations.
 */
export class RoadmapManager {
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  /**
   * Resolve the path to ROADMAP.md file
   * Checks both .paul/ROADMAP.md and .openpaul/ROADMAP.md locations.
   * 
   * @returns Full path to ROADMAP.md or null if not found
   */
  resolveRoadmapPath(): string | null {
    const primaryPath = join(this.projectRoot, '.paul', 'ROADMAP.md')
    if (existsSync(primaryPath)) {
      return primaryPath
    }
    const fallbackPath = join(this.projectRoot, '.openpaul', 'ROADMAP.md')
    if (existsSync(fallbackPath)) {
      return fallbackPath
    }
    return null
  }

  /**
   * Get the planning directory path (.paul or .openpaul)
   */
  private getPlanningDir(): string {
    const primary = join(this.projectRoot, '.paul')
    if (existsSync(primary)) {
      return primary
    }
    return join(this.projectRoot, '.openpaul')
  }

  /**
   * Parse ROADMAP.md and extract phase entries
   * 
   * Matches both section headers "### Phase N:" and table patterns "| N. | name |"
   * @returns Array of PhaseEntry objects
   */
  parsePhases(): PhaseEntry[] {
    const roadmapPath = this.resolveRoadmapPath()
    if (!roadmapPath) {
      return []
    }

    const content = readFileSync(roadmapPath, 'utf-8')
    const phases: PhaseEntry[] = []

    // Parse section headers: ### Phase N: Name
    const sectionRegex = /### Phase (\d+):\s*(.+?)(?:\s*\n|$)/g
    let match
    while ((match = sectionRegex.exec(content)) !== null) {
      const number = parseInt(match[1], 10)
      let name = match[2].trim()
      
      // Remove status suffixes like " (done)" or " - complete"
      name = name.replace(/\s*\((?:done|complete|in[- ]progress)\)\s*/gi, '')
      name = name.replace(/\s*-\s*(?:complete|in[- ]progress)\s*$/gi, '')
      name = name.trim()

      const directoryName = this.generateDirectoryName(name, number)
      
      phases.push({
        number,
        name,
        status: 'pending',
        directoryName,
      })
    }

    // Parse progress table: | N. | name | status |
    const tableRowRegex = /^\|\s*(\d+)\.\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/gm
    while ((match = tableRowRegex.exec(content)) !== null) {
      const number = parseInt(match[1], 10)
      const name = match[2].trim()
      const statusCell = match[3].trim().toLowerCase()

      // Find or create phase entry
      let phase = phases.find(p => p.number === number)
      if (!phase) {
        const directoryName = this.generateDirectoryName(name, number)
        phase = { number, name, status: 'pending', directoryName }
        phases.push(phase)
      }

      // Update status based on table
      if (statusCell.includes('✓') || statusCell.includes('complete') || statusCell.includes('shipped')) {
        phase.status = 'complete'
      } else if (statusCell.includes('◆') || statusCell.includes('in-progress') || statusCell.includes('🚧')) {
        phase.status = 'in-progress'
      } else {
        phase.status = 'pending'
      }
    }

    // Sort by phase number
    phases.sort((a, b) => a.number - b.number)

    return phases
  }

  /**
   * Generate a slugified directory name from a phase name and number
   * 
   * @param name - Phase name to format
   * @param number - Phase number for ordering
   * @returns Directory name like "05-search-feature"
   */
  generateDirectoryName(name: string, number: number): string {
    // Slugify name: lowercase, replace spaces and special chars with hyphens
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/-+/g, '-')            // Collapse multiple hyphens
      .replace(/^-+|-+$/g, '')        // Remove leading/trailing hyphens

    // Format with leading zero for single-digit phases
    const paddedNumber = number.toString().padStart(2, '0')
    return `${paddedNumber}-${slug}`
  }

  /**
   * Add a new phase to ROADMAP.md
   * 
   * @param options Position options for adding the new phase
   * @returns The new PhaseEntry that was created
   */
  addPhase(options: AddPhaseOptions): PhaseEntry {
    const roadmapPath = this.resolveRoadmapPath()
    if (!roadmapPath) {
      throw new Error('ROADMAP.md not found. Run /openpaul:init first.')
    }

    const phases = this.parsePhases()
    
    // Calculate new phase number based on position
    let newPhaseNumber: number
    if (options.position === 'after') {
      newPhaseNumber = options.referencePhase + 1
    } else {
      newPhaseNumber = options.referencePhase
    }

    // Generate directory name
    const directoryName = this.generateDirectoryName(options.name, newPhaseNumber)

    // Read current content
    let content = readFileSync(roadmapPath, 'utf-8')

    // Renumber phases that come after the insertion point
    // Process in reverse order to avoid duplicate numbers
    const phasesToRenumber = phases.filter(p => p.number >= newPhaseNumber).reverse()
    
    for (const phase of phasesToRenumber) {
      const oldNumber = phase.number
      const newNumber = oldNumber + 1
      
      // Update section headers: ### Phase N:
      const sectionRegex = new RegExp(`(###\\s*Phase\\s+)${oldNumber}(:)`, 'g')
      content = content.replace(sectionRegex, `$1${newNumber}$2`)
      
      // Update table rows: | N. |
      const tableRegex = new RegExp(`(\\|\\s*)${oldNumber}(\\.\\s*\\|)`, 'g')
      content = content.replace(tableRegex, `$1${newNumber}$2`)

      // Update "Depends on: Phase N" references
      const dependsRegex = new RegExp(`(Depends on:\\s*.*Phase\\s+)${oldNumber}(\\s|,|$)`, 'g')
      content = content.replace(dependsRegex, `$1${newNumber}$2`)
    }

    // Create new phase section
    const newPhaseSection = `### Phase ${newPhaseNumber}: ${options.name}
**Goal**: [To be planned]
**Depends on**: Phase ${newPhaseNumber > 1 ? newPhaseNumber - 1 : 1}
**Requirements**: [TBD]
**Success Criteria** (what must be TRUE):
  1. [To be defined]
**Plans**: TBD

Plans:
- [ ] ${newPhaseNumber.toString().padStart(2, '0')}-01: [To be planned]
`

    // Find insertion point in sections
    // Look for the reference phase section
    const refPhaseRegex = new RegExp(`(###\\s*Phase\\s+${options.referencePhase}\\s*:.*?\\n(?:.*?\\n)*?)(?=###\\s*Phase|$)`, 's')
    const refMatch = content.match(refPhaseRegex)

    if (refMatch) {
      if (options.position === 'after') {
        // Insert after reference phase section
        content = content.replace(refPhaseRegex, `$1\n${newPhaseSection}`)
      } else {
        // Insert before reference phase section (already renumbered)
        content = content.replace(refPhaseRegex, `${newPhaseSection}\n$1`)
      }
    } else {
      // Fallback: append to end of Phase sections
      const lastPhaseIndex = content.lastIndexOf('### Phase')
      if (lastPhaseIndex !== -1) {
        // Find end of last phase section
        const nextSectionIndex = content.indexOf('\n### ', lastPhaseIndex + 1)
        if (nextSectionIndex !== -1) {
          content = content.slice(0, nextSectionIndex) + '\n' + newPhaseSection + content.slice(nextSectionIndex)
        } else {
          content += '\n' + newPhaseSection
        }
      } else {
        content += '\n' + newPhaseSection
      }
    }

    // Update progress table - add new row
    const tableRowRegex = /(\*\*Plans\*\*:\s*\d+\s*plans\s*\n)/
    const tableMatch = content.match(tableRowRegex)
    if (tableMatch) {
      // Find or create the progress table
      let tableStart = content.indexOf('| Phase |')
      if (tableStart === -1) {
        tableStart = content.indexOf('| # |')
      }
      
      if (tableStart !== -1) {
        // Find the row for the reference phase
        const refRowRegex = new RegExp(`(\\|\\s*${options.position === 'after' ? options.referencePhase : newPhaseNumber}\\s*\\.|[^\\n]*\\n)`)
        const rowMatch = content.slice(tableStart).match(refRowRegex)
        
        if (rowMatch) {
          const newRow = `| ${newPhaseNumber}. | ${options.name} | ○ | 0% |\n`
          const insertPos = tableStart + (rowMatch.index || 0) + rowMatch[0].length
          content = content.slice(0, insertPos) + newRow + content.slice(insertPos)
        }
      }
    }

    // Write updated ROADMAP.md
    writeFileSync(roadmapPath, content, 'utf-8')

    // Create phase directory
    const planningDir = this.getPlanningDir()
    const phasesDir = join(planningDir, 'phases')
    const newPhaseDir = join(phasesDir, directoryName)
    
    if (!existsSync(phasesDir)) {
      mkdirSync(phasesDir, { recursive: true })
    }
    if (!existsSync(newPhaseDir)) {
      mkdirSync(newPhaseDir, { recursive: true })
    }

    return {
      number: newPhaseNumber,
      name: options.name,
      status: 'pending',
      directoryName,
    }
  }

  /**
   * Read the current phase number from STATE.md
   */
  private readCurrentPhaseFromState(statePath: string): number | null {
    if (!existsSync(statePath)) {
      return null
    }

    const content = readFileSync(statePath, 'utf-8')
    
    // Look for "Current Phase: N" or similar patterns
    const currentPhaseMatch = content.match(/Current\s+Phase:\s*(\d+)/i)
    if (currentPhaseMatch) {
      return parseInt(currentPhaseMatch[1], 10)
    }

    // Also check for position markers like "position: phase-N"
    const positionMatch = content.match(/position:\s*phase-(\d+)/i)
    if (positionMatch) {
      return parseInt(positionMatch[1], 10)
    }

    return null
  }

  /**
   * Validate if a phase can be removed
   * 
   * @param phaseNumber The phase number to remove
   * @param statePath Path to STATE.md file
   * @returns Validation result
   */
  canRemovePhase(phaseNumber: number, statePath: string): RoadmapValidationResult {
    const errors: string[] = []

    // Check ROADMAP.md exists
    const roadmapPath = this.resolveRoadmapPath()
    if (!roadmapPath) {
      return {
        valid: false,
        errors: ['ROADMAP.md not found. Run /openpaul:init first.'],
      }
    }

    // Check phase exists
    const phases = this.parsePhases()
    const phase = phases.find(p => p.number === phaseNumber)
    if (!phase) {
      return {
        valid: false,
        errors: [`Phase ${phaseNumber} does not exist.`],
      }
    }

    // Check phase is not complete
    if (phase.status === 'complete') {
      errors.push(`Cannot remove completed phase ${phaseNumber}.`)
    }

    // Check phase is not in-progress
    if (phase.status === 'in-progress') {
      errors.push(`Cannot remove in-progress phase ${phaseNumber}.`)
    }

    // Check phase is not current phase from STATE.md
    const currentPhase = this.readCurrentPhaseFromState(statePath)
    if (currentPhase !== null && currentPhase === phaseNumber) {
      errors.push(`Cannot remove current phase ${phaseNumber} (currently in progress).`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Remove a phase from ROADMAP.md
   * 
   * @param phaseNumber The phase number to remove
   * @returns Result of the removal operation
   */
  removePhase(phaseNumber: number): RemovePhaseResult {
    const roadmapPath = this.resolveRoadmapPath()
    if (!roadmapPath) {
      throw new Error('ROADMAP.md not found')
    }

    const phases = this.parsePhases()
    const phaseToRemove = phases.find(p => p.number === phaseNumber)
    
    if (!phaseToRemove) {
      return {
        success: false,
        removedPhase: null,
        renumberedPhases: [],
      }
    }

    let content = readFileSync(roadmapPath, 'utf-8')
    const renumberedPhases: number[] = []

    // Remove phase section (### Phase N: ... until next ### Phase or end)
    const sectionRegex = new RegExp(`\\n*###\\s*Phase\\s+${phaseNumber}\\s*:.*?(?=\\n###\\s*Phase|$)`, 'gs')
    content = content.replace(sectionRegex, '')

    // Remove phase from progress table
    const tableRowRegex = new RegExp(`\\|\\s*${phaseNumber}\\.\\s*\\|[^\\n]*\\n`, 'g')
    content = content.replace(tableRowRegex, '')

    // Renumber all phases after the removed one (decrement by 1)
    const phasesToRenumber = phases.filter(p => p.number > phaseNumber)
    
    for (const phase of phasesToRenumber) {
      const oldNumber = phase.number
      const newNumber = oldNumber - 1
      renumberedPhases.push(oldNumber)

      // Update section headers: ### Phase N:
      const sectionHeaderRegex = new RegExp(`(###\\s*Phase\\s+)${oldNumber}(:)`, 'g')
      content = content.replace(sectionHeaderRegex, `$1${newNumber}$2`)
      
      // Update table rows: | N. |
      const tableNumRegex = new RegExp(`(\\|\\s*)${oldNumber}(\\.\\s*\\|)`, 'g')
      content = content.replace(tableNumRegex, `$1${newNumber}$2`)

      // Update "Depends on: Phase N" references
      const dependsRegex = new RegExp(`(Depends on:\\s*.*Phase\\s+)${oldNumber}(\\s|,|$)`, 'g')
      content = content.replace(dependsRegex, `$1${newNumber}$2`)
    }

    // Write updated ROADMAP.md
    writeFileSync(roadmapPath, content, 'utf-8')

    // Delete phase directory
    const planningDir = this.getPlanningDir()
    const phaseDir = join(planningDir, 'phases', phaseToRemove.directoryName)
    
    if (existsSync(phaseDir)) {
      rmSync(phaseDir, { recursive: true, force: true })
    }

    return {
      success: true,
      removedPhase: phaseToRemove,
      renumberedPhases,
    }
  }
}
