import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
/**
 * MilestoneManager
 *
 * Manages milestone lifecycle operations:
 * - Create milestones with name, scope, and phases
 * - Track milestone progress by phases completed
 * - Mark milestones complete and archive them
 * - Validate milestone scope modifications
 *
 * Integration points:
 * - ROADMAP.md: Stores milestone definitions and progress
 * - MILESTONE-ARCHIVE.md: Archives completed milestones
 * - STATE.md: Tracks current milestone position
 */
export class MilestoneManager {
    constructor(projectRoot, roadmapManager) {
        this.projectRoot = projectRoot;
        this.roadmapManager = roadmapManager;
    }
    /**
     * Resolve the path to MILESTONE-ARCHIVE.md file
     * Checks both .paul/ and .openpaul/ locations.
     *
     * @returns Full path to MILESTONE-ARCHIVE.md or null if planning dir not found
     */
    resolveMilestoneArchivePath() {
        const primaryDir = join(this.projectRoot, '.paul');
        if (existsSync(primaryDir)) {
            return join(primaryDir, 'MILESTONE-ARCHIVE.md');
        }
        const fallbackDir = join(this.projectRoot, '.openpaul');
        if (existsSync(fallbackDir)) {
            return join(fallbackDir, 'MILESTONE-ARCHIVE.md');
        }
        return null;
    }
    /**
     * Get the planning directory path (.paul or .openpaul)
     */
    getPlanningDir() {
        const primary = join(this.projectRoot, '.paul');
        if (existsSync(primary)) {
            return primary;
        }
        return join(this.projectRoot, '.openpaul');
    }
    /**
     * Get the path to ROADMAP.md
     */
    getRoadmapPath() {
        return this.roadmapManager.resolveRoadmapPath();
    }
    /**
     * Create a new milestone
     *
     * Adds milestone section to ROADMAP.md with header + bullet list format.
     *
     * @param name - Milestone identifier (e.g., "v1.1 Full Command Implementation")
     * @param scope - Description of what the milestone delivers
     * @param phases - Array of phase numbers included in milestone
     * @param theme - Optional theme/slogan for the milestone
     * @returns The created Milestone object
     */
    createMilestone(name, scope, phases, theme) {
        const roadmapPath = this.getRoadmapPath();
        if (!roadmapPath) {
            throw new Error('ROADMAP.md not found. Run /openpaul:init first.');
        }
        // Validate phase numbers exist
        const existingPhases = this.roadmapManager.parsePhases();
        const existingPhaseNumbers = new Set(existingPhases.map(p => p.number));
        for (const phaseNum of phases) {
            if (!existingPhaseNumbers.has(phaseNum)) {
                throw new Error(`Phase ${phaseNum} does not exist in ROADMAP.md`);
            }
        }
        const now = new Date().toISOString();
        const milestone = {
            name,
            scope,
            phases,
            theme: theme || null,
            status: 'planned',
            startedAt: null,
            completedAt: null,
            createdAt: now,
        };
        // Read current ROADMAP.md content
        let content = readFileSync(roadmapPath, 'utf-8');
        // Add milestone to the Milestones section
        const milestonesSectionMatch = content.match(/##\s*Milestones\s*\n/);
        if (milestonesSectionMatch) {
            const insertPos = milestonesSectionMatch.index + milestonesSectionMatch[0].length;
            const milestoneLine = `- 📋 **${name}** - Phases ${this.formatPhaseRange(phases)} (${milestone.status})\n`;
            content = content.slice(0, insertPos) + milestoneLine + content.slice(insertPos);
        }
        // Add detailed milestone section after existing milestone details or in Phases section
        const milestoneDetailSection = this.formatMilestoneDetailSection(milestone, existingPhases);
        // Find insertion point (before "## Phases" or at end of file)
        const phasesSectionMatch = content.match(/\n##\s*Phases\s*\n/);
        if (phasesSectionMatch) {
            const insertPos = phasesSectionMatch.index;
            content = content.slice(0, insertPos) + '\n' + milestoneDetailSection + content.slice(insertPos);
        }
        else {
            content += '\n' + milestoneDetailSection;
        }
        // Write updated ROADMAP.md
        writeFileSync(roadmapPath, content, 'utf-8');
        return milestone;
    }
    /**
     * Format phase range for display (e.g., "3-9" or "5")
     */
    formatPhaseRange(phases) {
        if (phases.length === 0)
            return 'none';
        const sorted = [...phases].sort((a, b) => a - b);
        if (sorted.length === 1)
            return sorted[0].toString();
        return `${sorted[0]}-${sorted[sorted.length - 1]}`;
    }
    /**
     * Format milestone detail section for ROADMAP.md
     */
    formatMilestoneDetailSection(milestone, existingPhases) {
        const phaseItems = milestone.phases
            .sort((a, b) => a - b)
            .map(phaseNum => {
            const phase = existingPhases.find(p => p.number === phaseNum);
            return `#### Phase ${phaseNum}: ${phase?.name || 'Unknown'}`;
        })
            .join('\n');
        return `### 📋 ${milestone.name} (Planned)

**Milestone Goal:** ${milestone.scope}
${milestone.theme ? `**Theme:** ${milestone.theme}\n` : ''}
**Scope:**
${this.formatScopeItems(milestone.phases, existingPhases)}

${phaseItems}

`;
    }
    /**
     * Format scope items as bullet list
     */
    formatScopeItems(phases, existingPhases) {
        return phases
            .sort((a, b) => a - b)
            .map(phaseNum => {
            const phase = existingPhases.find(p => p.number === phaseNum);
            return `- Phase ${phaseNum}: ${phase?.name || 'Unknown'}`;
        })
            .join('\n');
    }
    /**
     * Get a milestone by name
     *
     * Parses milestone from ROADMAP.md section.
     *
     * @param name - Milestone name to find
     * @returns Milestone object or null if not found
     */
    getMilestone(name) {
        const roadmapPath = this.getRoadmapPath();
        if (!roadmapPath) {
            return null;
        }
        const content = readFileSync(roadmapPath, 'utf-8');
        // Find milestone section by name
        // Pattern: ### [emoji] MilestoneName (Status)
        const milestoneRegex = new RegExp(`###\\s*[✅🚧📋]+\\s*${this.escapeRegex(name)}\\s*\\((planned|in[- ]progress|completed)\\)`, 'i');
        const match = content.match(milestoneRegex);
        if (!match) {
            return null;
        }
        // Parse milestone details from section
        return this.parseMilestoneFromContent(content, name);
    }
    /**
     * Escape special regex characters in a string
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Parse milestone from ROADMAP.md content
     */
    parseMilestoneFromContent(content, name) {
        // Find the milestone section
        const sectionRegex = new RegExp(`###\\s*[✅🚧📋]+\\s*${this.escapeRegex(name)}\\s*\\([^)]*\\)[\\s\\S]*?(?=###\\s*[✅🚧📋]|##\\s*Phases|##\\s*Progress|##\\s*Dependencies|$)`, 'i');
        const sectionMatch = content.match(sectionRegex);
        if (!sectionMatch) {
            return null;
        }
        const section = sectionMatch[0];
        // Parse fields from section
        const statusMatch = section.match(/\((planned|in[- ]progress|completed)\)/i);
        const status = statusMatch
            ? statusMatch[1].toLowerCase().replace(' ', '-')
            : 'planned';
        const scopeMatch = section.match(/\*\*Milestone Goal:\*\*\s*(.+?)(?:\n|$)/i);
        const scope = scopeMatch ? scopeMatch[1].trim() : '';
        const themeMatch = section.match(/\*\*Theme:\*\*\s*(.+?)(?:\n|$)/i);
        const theme = themeMatch ? themeMatch[1].trim() : null;
        // Parse phases from "Phases X-Y" or scope items
        const phases = [];
        // Try to find phases from scope items first
        const scopePhaseRegex = /Phase\s+(\d+):/gi;
        let phaseMatch;
        while ((phaseMatch = scopePhaseRegex.exec(section)) !== null) {
            phases.push(parseInt(phaseMatch[1], 10));
        }
        // Also check "Phases X-Y" format
        const rangeMatch = section.match(/Phases\s+(\d+)(?:\s*-\s*(\d+))?/i);
        if (rangeMatch) {
            const start = parseInt(rangeMatch[1], 10);
            const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : start;
            for (let i = start; i <= end; i++) {
                if (!phases.includes(i)) {
                    phases.push(i);
                }
            }
        }
        // Parse dates (if any)
        const startedMatch = section.match(/\*\*Started:\*\*\s*(.+?)(?:\n|$)/i);
        const completedMatch = section.match(/\*\*Completed:\*\*\s*(.+?)(?:\n|$)/i);
        const createdMatch = section.match(/\*\*Created:\*\*\s*(.+?)(?:\n|$)/i);
        // Check for dates in Progress section too
        const progressMatch = content.match(new RegExp(`\\*\\*Milestone:\\*\\*\\s*${this.escapeRegex(name)}[\\s\\S]*?\\*\\*Started:\\*\\*\\s*(.+?)(?:\n|$)`, 'i'));
        return {
            name,
            scope,
            phases: Array.from(new Set(phases)).sort((a, b) => a - b),
            theme,
            status,
            startedAt: startedMatch?.[1]?.trim() || progressMatch?.[1]?.trim() || null,
            completedAt: completedMatch?.[1]?.trim() || null,
            createdAt: createdMatch?.[1]?.trim() || new Date().toISOString(),
        };
    }
    /**
     * Get the active (first non-completed) milestone
     *
     * @returns Active Milestone or null if all completed or no milestones
     */
    getActiveMilestone() {
        const roadmapPath = this.getRoadmapPath();
        if (!roadmapPath) {
            return null;
        }
        const content = readFileSync(roadmapPath, 'utf-8');
        // Find all milestone entries in the Milestones section
        const milestonesSectionMatch = content.match(/##\s*Milestones\s*\n([\s\S]*?)(?=\n##|$)/);
        if (!milestonesSectionMatch) {
            return null;
        }
        const milestonesSection = milestonesSectionMatch[1];
        // Find milestones that are not completed
        const activeMilestoneRegex = /-\s*[🚧📋]+\s*\*\*([^*]+)\*\*/g;
        let match;
        const activeMilestones = [];
        while ((match = activeMilestoneRegex.exec(milestonesSection)) !== null) {
            // Check if NOT completed (✅)
            const fullLine = milestonesSection.substring(Math.max(0, match.index - 10), match.index + match[0].length + 50);
            if (!fullLine.includes('✅')) {
                activeMilestones.push(match[1].trim());
            }
        }
        // Return first active milestone
        if (activeMilestones.length > 0) {
            return this.getMilestone(activeMilestones[0]);
        }
        return null;
    }
    /**
     * Get milestone progress by phases completed
     *
     * Primary metric: phases completed / total phases
     *
     * @param name - Milestone name
     * @returns MilestoneProgress with detailed breakdown
     */
    getMilestoneProgress(name) {
        const milestone = this.getMilestone(name);
        if (!milestone) {
            return null;
        }
        const allPhases = this.roadmapManager.parsePhases();
        const phaseStatus = milestone.phases.map(phaseNum => {
            const phase = allPhases.find(p => p.number === phaseNum);
            return {
                number: phaseNum,
                status: phase?.status || 'pending',
            };
        });
        const phasesCompleted = phaseStatus.filter(p => p.status === 'complete').length;
        const phasesTotal = milestone.phases.length;
        const percentage = phasesTotal > 0 ? Math.round((phasesCompleted / phasesTotal) * 100) : 0;
        return {
            milestoneName: name,
            phasesCompleted,
            phasesTotal,
            percentage,
            phaseStatus,
        };
    }
    /**
     * Mark a milestone as complete and archive it
     *
     * - Archives milestone to MILESTONE-ARCHIVE.md
     * - Includes summary + metrics
     * - Collapses milestone phases to <details> section in ROADMAP.md
     *
     * @param name - Milestone name to complete
     * @returns MilestoneArchiveEntry with completion details
     */
    completeMilestone(name) {
        const milestone = this.getMilestone(name);
        if (!milestone) {
            throw new Error(`Milestone "${name}" not found`);
        }
        if (milestone.status === 'completed') {
            throw new Error(`Milestone "${name}" is already completed`);
        }
        const roadmapPath = this.getRoadmapPath();
        if (!roadmapPath) {
            throw new Error('ROADMAP.md not found');
        }
        const now = new Date().toISOString();
        const progress = this.getMilestoneProgress(name);
        if (!progress) {
            throw new Error(`Could not calculate progress for milestone "${name}"`);
        }
        // Get all phases for this milestone
        const allPhases = this.roadmapManager.parsePhases();
        const milestonePhases = allPhases.filter(p => milestone.phases.includes(p.number));
        // Calculate metrics
        const plansCompleted = this.calculatePlansCompleted(milestonePhases);
        const totalPlans = this.calculateTotalPlans(milestonePhases);
        const executionTime = this.calculateExecutionTime(milestone.startedAt, now);
        const requirements = this.extractRequirements(milestonePhases);
        const archiveEntry = {
            name: milestone.name,
            scope: milestone.scope,
            phases: milestone.phases,
            startedAt: milestone.startedAt,
            completedAt: now,
            plansCompleted,
            totalPlans,
            executionTime,
            requirementsAddressed: requirements,
        };
        // Archive to MILESTONE-ARCHIVE.md
        this.archiveMilestone(archiveEntry, milestonePhases);
        // Update ROADMAP.md
        this.collapseMilestoneInRoadmap(roadmapPath, milestone, archiveEntry, milestonePhases);
        return archiveEntry;
    }
    /**
     * Calculate total plans completed from phases
     */
    calculatePlansCompleted(phases) {
        // Count completed plans from phase sections
        let completed = 0;
        const roadmapPath = this.getRoadmapPath();
        if (!roadmapPath)
            return 0;
        const content = readFileSync(roadmapPath, 'utf-8');
        for (const phase of phases) {
            if (phase.status === 'complete') {
                // Find phase section and count checked items
                const phaseSectionRegex = new RegExp(`###\\s*Phase\\s+${phase.number}:[\\s\\S]*?(?=###\\s*Phase|$)`, 'i');
                const sectionMatch = content.match(phaseSectionRegex);
                if (sectionMatch) {
                    const checkedItems = (sectionMatch[0].match(/- \[x\]/g) || []).length;
                    completed += checkedItems;
                }
            }
        }
        return completed;
    }
    /**
     * Calculate total plans from phases
     */
    calculateTotalPlans(phases) {
        let total = 0;
        const roadmapPath = this.getRoadmapPath();
        if (!roadmapPath)
            return 0;
        const content = readFileSync(roadmapPath, 'utf-8');
        for (const phase of phases) {
            // Find phase section and count all plan items
            const phaseSectionRegex = new RegExp(`###\\s*Phase\\s+${phase.number}:[\\s\\S]*?(?=###\\s*Phase|$)`, 'i');
            const sectionMatch = content.match(phaseSectionRegex);
            if (sectionMatch) {
                const allItems = (sectionMatch[0].match(/- \[[x ]\]/g) || []).length;
                total += allItems;
            }
        }
        return total;
    }
    /**
     * Calculate execution time between start and end
     */
    calculateExecutionTime(startedAt, completedAt) {
        if (!startedAt) {
            return 'Unknown';
        }
        const start = new Date(startedAt).getTime();
        const end = new Date(completedAt).getTime();
        const diffMs = end - start;
        const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
        if (diffHours >= 24) {
            const days = Math.round(diffHours / 24 * 10) / 10;
            return `${days} days`;
        }
        return `${diffHours} hours`;
    }
    /**
     * Extract requirements addressed from phases
     */
    extractRequirements(phases) {
        const requirements = [];
        const roadmapPath = this.getRoadmapPath();
        if (!roadmapPath)
            return requirements;
        const content = readFileSync(roadmapPath, 'utf-8');
        for (const phase of phases) {
            // Find phase section and extract requirements
            const phaseSectionRegex = new RegExp(`###\\s*Phase\\s+${phase.number}:[\\s\\S]*?(?=###\\s*Phase|$)`, 'i');
            const sectionMatch = content.match(phaseSectionRegex);
            if (sectionMatch) {
                const reqMatch = sectionMatch[0].match(/\*\*Requirements\*\*:\s*([^\n]+)/i);
                if (reqMatch) {
                    const reqs = reqMatch[1].split(',').map(r => r.trim()).filter(r => r && r !== 'TBD');
                    requirements.push(...reqs);
                }
            }
        }
        return Array.from(new Set(requirements));
    }
    /**
     * Archive milestone to MILESTONE-ARCHIVE.md
     */
    archiveMilestone(entry, phases) {
        const archivePath = this.resolveMilestoneArchivePath();
        if (!archivePath) {
            // Create the archive file if planning directory doesn't exist
            const planningDir = this.getPlanningDir();
            if (!existsSync(planningDir)) {
                mkdirSync(planningDir, { recursive: true });
            }
        }
        const finalPath = archivePath || join(this.getPlanningDir(), 'MILESTONE-ARCHIVE.md');
        // Create header if file doesn't exist
        if (!existsSync(finalPath)) {
            const header = `# Milestone Archive

This file contains archived milestones with completion details.

---

`;
            writeFileSync(finalPath, header, 'utf-8');
        }
        // Append milestone entry
        const entryContent = `
## ${entry.name}

**Scope:** ${entry.scope}

**Timeline:**
- Started: ${entry.startedAt || 'Not recorded'}
- Completed: ${entry.completedAt}

**Metrics:**
- Phases: ${entry.phases.join(', ')}
- Plans Completed: ${entry.plansCompleted}/${entry.totalPlans}
- Execution Time: ${entry.executionTime}
- Requirements Addressed: ${entry.requirementsAddressed.length > 0 ? entry.requirementsAddressed.join(', ') : 'None recorded'}

**Phase Summary:**
${phases.map(p => `- Phase ${p.number}: ${p.name} (${p.status})`).join('\n')}

---

`;
        appendFileSync(finalPath, entryContent, 'utf-8');
    }
    /**
     * Collapse milestone in ROADMAP.md
     */
    collapseMilestoneInRoadmap(roadmapPath, milestone, archiveEntry, phases) {
        let content = readFileSync(roadmapPath, 'utf-8');
        // Update milestone status in Milestones section
        const milestoneLineRegex = new RegExp(`(-\\s*)[🚧📋](\\s*\\*\\*${this.escapeRegex(milestone.name)}\\*\\*\\s*-\\s*Phases\\s+[^\\(]+\\()([a-z-]+)(\\))`, 'i');
        content = content.replace(milestoneLineRegex, `$1✅$2shipped$4`);
        // Find and replace the milestone detail section with collapsed version
        const detailSectionRegex = new RegExp(`(###\\s*[✅🚧📋]+\\s*${this.escapeRegex(milestone.name)}\\s*\\([^)]*\\)[\\s\\S]*?(?=###\\s*[✅🚧📋]|##\\s*Phases|##\\s*Progress|##\\s*Dependencies|$))`, 'i');
        const collapsedSection = this.createCollapsedSection(milestone, archiveEntry, phases);
        content = content.replace(detailSectionRegex, collapsedSection);
        // Write updated ROADMAP.md
        writeFileSync(roadmapPath, content, 'utf-8');
    }
    /**
     * Create collapsed <details> section for completed milestone
     */
    createCollapsedSection(milestone, archiveEntry, phases) {
        const phaseSummary = phases
            .map(p => {
            const planCount = this.getPlanCountForPhase(p.number);
            return `- [x] ${p.number.toString().padStart(2, '0')}-${p.number.toString().padStart(2, '0')}: ${p.name} (${planCount} plans)`;
        })
            .join('\n');
        return `### ✅ ${milestone.name} (Shipped ${new Date(archiveEntry.completedAt).toISOString().split('T')[0]})

<details>
<summary>**${milestone.name} (Phases ${this.formatPhaseRange(milestone.phases)})** - SHIPPED ${new Date(archiveEntry.completedAt).toISOString().split('T')[0]}</summary>

**Milestone Goal:** ${milestone.scope}

**Metrics:**
- Plans Completed: ${archiveEntry.plansCompleted}/${archiveEntry.totalPlans}
- Execution Time: ${archiveEntry.executionTime}
- Requirements Addressed: ${archiveEntry.requirementsAddressed.length}

Plans:
${phaseSummary}

</details>

`;
    }
    /**
     * Get plan count for a phase from ROADMAP.md
     */
    getPlanCountForPhase(phaseNumber) {
        const roadmapPath = this.getRoadmapPath();
        if (!roadmapPath)
            return 0;
        const content = readFileSync(roadmapPath, 'utf-8');
        const phaseSectionRegex = new RegExp(`###\\s*Phase\\s+${phaseNumber}:[\\s\\S]*?(?=###\\s*Phase|$)`, 'i');
        const sectionMatch = content.match(phaseSectionRegex);
        if (sectionMatch) {
            return (sectionMatch[0].match(/- \[[x ]\]/g) || []).length;
        }
        return 0;
    }
    /**
     * Check if a phase can be modified
     *
     * Validates scope modifications during active milestones.
     * Returns warning if phase is part of active milestone.
     *
     * @param phaseNumber - Phase number to check
     * @returns PhaseModificationResult with allowed status and optional warning
     */
    canModifyPhase(phaseNumber) {
        const activeMilestone = this.getActiveMilestone();
        if (!activeMilestone) {
            return { allowed: true };
        }
        if (activeMilestone.phases.includes(phaseNumber)) {
            return {
                allowed: true,
                warning: `Phase ${phaseNumber} is part of active milestone "${activeMilestone.name}". Modifying this phase may affect milestone scope. Proceed with caution.`,
            };
        }
        return { allowed: true };
    }
}
//# sourceMappingURL=milestone-manager.js.map