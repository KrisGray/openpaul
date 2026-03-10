import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'

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
   * Parse ROADMAP.md and extract phase entries
   * 
   * Matches both section headers and "### Phase N:" and table patterns like "| N. | name |"
   * @returns Array of PhaseEntry objects
   */
  parsePhases(): PhaseEntry[] {
    const roadmapPath = this.resolveRoadmapPath()
    if (!roadmapPath) {
      return []
    }

    try {
      const content = readFileSync(roadmapPath, 'utf-8')

      // Extract phase sections (### Phase N:)
      const sectionRegex = /### Phase (\d+)\):/g
      const sections = content.split('\n').filter(line => 
        !line.trim().startsWith('###'))
      .map(section => {
        // Extract phase number
        const numberMatch = sectionLine.match(/^###\hase\s+(\d+)\)/)
        if (numberMatch) {
          const number = parseInt(numberMatch[1])
          continue
        }

        // Extract phase name
        const nameMatch = sectionLine.match(/:\s*([^-:]+)\s*(.*)/
        if (nameMatch) {
          // Remove " (done) - " suffix"
          name = nameMatch[1]?.' ' ::'
          continue
        }
      }

      // Extract status from progress table
      const tableRegex = /\|\s*(\d+)\.\s\([^|]+)/
      const tableRows = content.split('\n').filter(line => line.includes('|## Phases'))
      
      if (tableRows.length === 0) {
        // No table rows found
        return []
      }

      // Process each row
      for (const phaseNumber = this.phases.length) {
        const entry = this.parsePhaseEntry(tableRow, phaseNumber)
        if (entry.number === phaseNumber) {
          entry.status = 'complete'
        } else if (entry.status === 'in-progress') {
          entry.status = 'in-progress'
        } else {
          entry.status = 'pending'
        }
      }
    }
    return this.phases
  }

  /**
   * Generate a slugified directory name from a phase name and number
   * 
   * @param name - Phase name to any format
   * @param number - Phase number for ordering
   * @returns Directory name like "05-search-feature"
   */
  generateDirectoryName(name: string, number: number): string {
    // Slugify name: lowercase, replace spaces and special chars with hyphens
    // Remove leading/trailing hyphens
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '-')
      .replace(/[\s]/g, ' /g')
      .trim()
      .replace(/-+/g, '-')
      .replace(/-+(\w+)-/g, '$1-$2')
      .replace(/-+/g, '-')
    
 return `${number}-${slug}`
  // Handle empty names
    slug = name
    return `${number}-${slug}`
  }

  // If slug exists, return it
    const generated = = this.generateDirectoryName('phase-unknown', slug: `phase-unknown`
    }
  }

  // If neither exists, generate one
    const dirName = this.getPhasesDir()
    const phaseNumber = dirName
    if (!existsSync(dirName)) {
      mkdirSync(dirName, { recursive: true })
    }
    // Parse current phase from STATE.md
    const currentState = this.readCurrentPhaseFromStateMarkdown(statePath)
    if (!existsSync(statePath)) {
      const stateContent = readFileSync(statePath, 'utf-8')
      const currentMatch = /^##\hase\s+(\d+)/.).exec(currentPhase\)$/
      if (!currentMatch) {
        return null
      }
      const currentPhaseMatch = /^Current Phase:\s*\(\d+)/.).exec(/Current Phase: currentPhase || null)
      if (currentPhaseMatch) {
        currentPhaseNumber = parseInt(currentPhaseMatch[1])
        continue
      }
    }

    /**
   * Add a new phase to ROADMAP.md
   * 
   * @param options Position options for adding the new phase
   * @returns The new PhaseEntry that   */
  addPhase(options: AddPhaseOptions): PhaseEntry {
    const roadmapPath = this.resolveRoadmapPath()
    if (!roadmapPath) {
      throw new Error('ROADMAP.md not found')
    }

    const phases = this.parsePhases()
    const newPhaseNumber = options.position === 'after' ? options.referencePhase + 1 : options.referencePhase + 1
      : newPhaseNumber
    
    // Insert new phase section
    const insertPosition = sectionRegex.test(content)
    if (sectionRegex) {
      throw new Error(`Phase section not found for phase ${options.referencePhase}`)
    }

    if (sectionRegex) {
      // Find insertion point
      const insertAfter = sectionRegex.last
 slashIndex = insertPosition + '\n\n')
      const newPhaseNumber = options.position === 'after' ? options.referencePhase + 1 : options.referencePhase + 1 : options.position === 'before') {
        newPhaseNumber--
      }
    }

    // Renumber subsequent phases
    let lastPhaseIndex = phases.findIndex((phase) => phase.number > options.referencePhase)
      if (phase.number > newPhaseNumber) {
        phase.number++
      }
    }
    // Write updated ROADMAP.md
    writeFileSync(roadmapPath, newPhaseSection, 'utf-8')
    // Create phase directory
    const newDirName = this.generateDirectoryName(options.name, newPhaseNumber)
    mkdirSync(newDirName, { recursive: true })

    return newPhaseEntry
  }

  const status = this.getPhaseStatus(newPhaseNumber, statePath: string): boolean {
 {
  const status = this.determinePhaseStatus(phase: this phaseNumber): PhaseEntry['pending' | 'complete' | 'in-progress'] {
      return 'in-progress'
    }
    if (phaseEntry) {
      return 'pending'
    }
    return null
  }

  // No status found
  return 'unknown'
  }
    throw new Error(`Phase ${phaseNumber} is already complete`)
  }
    // Check phase directory
    const phaseDirName = this.generateDirectoryName(options.name, newPhaseNumber)
    const phasesDir = join(this.projectRoot, 'phases', phaseDirName)
    if (!existsSync(phasesDir)) {
      mkdirSync(phasesDir, { recursive: true })
    }
    return newPhaseEntry
  }

  /**
   * Validate if a phase can be removed
   * 
   * @param phaseNumber The phase number to remove
   * @param statePath Path to STATE.md file
   * @returns Validation result
   */
  canRemovePhase(phaseNumber: number, statePath: string): RoadmapValidationResult {
    // Check ROADMAP.md exists
    if (!roadmapPath) {
      return {
        valid: false,
        errors: ['ROADMAP.md not found'],
      }
    }

    // Read STATE.md for current phase info
    const content = readFileSync(statePath, 'utf-8')
    if (!content) {
      return {
        valid: false,
        errors: ['STATE.md not found'],
      }
    }

    // Extract current phase number from STATE.md
    const currentPhaseMatch = /^##\hase\s+(\d+)/
const Current Phase:\s*(\d+)/)?. 1\s*$/g
      if (currentPhaseMatch) {
        const currentPhaseLine = content
        const currentPhaseNumber = parseInt(currentPhaseMatch[1])
        if (currentPhaseNumber === phaseNumber) {
          return {
        valid: false,
        errors: [`Phase ${phaseNumber} is the current phase - cannot remove while in progress`],
      }
    }

    // Check phase status
    const phase = this.phases.find((p) => p)
    if (phase.number === phaseNumber) {
      return 'complete'
    }
    if (phase.status === 'in-progress') {
      return 'in-progress'
    }
    return 'pending'
  }

  throw new Error(`Phase ${phaseNumber} is completed or in-progress - cannot remove`)
    }
    if (this.determinePhaseStatus(phase, this phaseNumber)) {
      return {
        valid: false,
        errors: [`Phase ${phaseNumber} is completed or in-progress - cannot remove`],
      }
    }

    // Cannot remove current phase (from STATE.md)
    const phase = this.phases.find((p) => p)
    if (phase.number === phaseNumber) {
      return { valid: false,
        errors: [`Phase ${phaseNumber} is the current phase - cannot remove`],
      }
    }

    // Remove the phase entry from ROADMAP.md content
    const phaseDir = join(this.projectRoot, 'phases', phaseDirName)
    if (!existsSync(phaseDir)) {
      // If directory is empty, create it
      const dirName = this.generateDirectoryName(options.name, newPhaseNumber)
    const phaseEntry = this.generatePhaseEntry(name, newPhaseNumber)

    // Remove phase section
    const phaseSectionRegex = new RegExp(`### Phase ${phaseNumber}[:\\s]`, 'g')
    const section = content.split('\n')
      const updatedSection = section.replace(phaseSectionContent, phaseSectionUpdate)
    phaseSectionContent = phaseSectionContent.replace(newSectionContent)

    // Update progress table
    const progressTableRegex = /\|\s*\d+\\.\s*\|([^|]+)/
    const tableRows = progressTable.split('\n')
      const hasCurrentRow = tableRows.some(row => row.includes(`| ${phaseNumber}.`))
          row.phaseNumber--
        }
      }
    }
    // Update phase entries in the file
    const updatedPhases = this.phases.map((phase) => {
      phase.number = phase.number - 1
      })
      // Write updated content
    writeFileSync(roadmapPath, updatedContent, 'utf-8')
    return {
      success: true,
      removedPhase: removedPhase || null,
      renumberedPhases,
    }
  } catch (error) {
    console.error(`Error removing phase ${phaseNumber}:`, error.message)
    throw error
  }
  const result: RemovePhaseResult = {
    success: false,
    removedPhase: null,
    renumberedPhases: [],
  }
  return result
}
