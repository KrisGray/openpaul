import { z } from 'zod'

export type PlanWizardStep =
  | 'phase'
  | 'plan'
  | 'criteria'
  | 'boundaries'
  | 'taskCount'
  | 'taskName'
  | 'taskFiles'
  | 'taskAction'
  | 'taskVerify'
  | 'taskDone'

export interface PlanWizardTaskDraft {
  name?: string
  files?: string[]
  action?: string
  verify?: string
  done?: string
}

export interface PlanWizardState {
  step: PlanWizardStep
  phase?: number
  plan?: string
  criteria?: string[]
  boundaries?: string[]
  taskCount?: number
  currentTaskIndex?: number
  tasks: PlanWizardTaskDraft[]
  createdAt?: number
  updatedAt?: number
}

export const PlanWizardTaskDraftSchema = z.object({
  name: z.string().optional(),
  files: z.array(z.string()).optional(),
  action: z.string().optional(),
  verify: z.string().optional(),
  done: z.string().optional(),
})

export const PlanWizardStateSchema = z.object({
  step: z.enum([
    'phase',
    'plan',
    'criteria',
    'boundaries',
    'taskCount',
    'taskName',
    'taskFiles',
    'taskAction',
    'taskVerify',
    'taskDone',
  ]),
  phase: z.number().int().positive().optional(),
  plan: z.string().optional(),
  criteria: z.array(z.string()).optional(),
  boundaries: z.array(z.string()).optional(),
  taskCount: z.number().int().positive().max(5).optional(),
  currentTaskIndex: z.number().int().nonnegative().optional(),
  tasks: z.array(PlanWizardTaskDraftSchema),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
})
