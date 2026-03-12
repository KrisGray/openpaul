import { z } from 'zod';
export type ValidationStatus = 'unvalidated' | 'validated' | 'invalidated';
export declare const ValidationStatusSchema: z.ZodEnum<["unvalidated", "validated", "invalidated"]>;
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export declare const ConfidenceLevelSchema: z.ZodEnum<["high", "medium", "low"]>;
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export declare const IssueSeveritySchema: z.ZodEnum<["critical", "high", "medium", "low"]>;
export type DiscoveryDepth = 'quick' | 'standard' | 'deep';
export declare const DiscoveryDepthSchema: z.ZodEnum<["quick", "standard", "deep"]>;
export type ContextStatus = 'Ready for planning' | 'In progress' | 'Complete';
export declare const ContextStatusSchema: z.ZodEnum<["Ready for planning", "In progress", "Complete"]>;
export interface DecisionEntry {
    title: string;
    description: string;
}
export declare const DecisionEntrySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
}, {
    description: string;
    title: string;
}>;
export interface ContextArtifact {
    phase: number;
    gathered: string;
    status: ContextStatus;
    domain: string;
    decisions: DecisionEntry[];
    specifics: string[];
    deferred: string[];
}
export declare const ContextArtifactSchema: z.ZodObject<{
    phase: z.ZodNumber;
    gathered: z.ZodString;
    status: z.ZodEnum<["Ready for planning", "In progress", "Complete"]>;
    domain: z.ZodString;
    decisions: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
    }, {
        description: string;
        title: string;
    }>, "many">;
    specifics: z.ZodArray<z.ZodString, "many">;
    deferred: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    phase: number;
    status: "Ready for planning" | "In progress" | "Complete";
    gathered: string;
    domain: string;
    decisions: {
        description: string;
        title: string;
    }[];
    specifics: string[];
    deferred: string[];
}, {
    phase: number;
    status: "Ready for planning" | "In progress" | "Complete";
    gathered: string;
    domain: string;
    decisions: {
        description: string;
        title: string;
    }[];
    specifics: string[];
    deferred: string[];
}>;
export interface AssumptionEntry {
    statement: string;
    validation_status: ValidationStatus;
    confidence: ConfidenceLevel;
    impact: string;
}
export declare const AssumptionEntrySchema: z.ZodObject<{
    statement: z.ZodString;
    validation_status: z.ZodEnum<["unvalidated", "validated", "invalidated"]>;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    impact: z.ZodString;
}, "strip", z.ZodTypeAny, {
    statement: string;
    validation_status: "unvalidated" | "validated" | "invalidated";
    confidence: "low" | "medium" | "high";
    impact: string;
}, {
    statement: string;
    validation_status: "unvalidated" | "validated" | "invalidated";
    confidence: "low" | "medium" | "high";
    impact: string;
}>;
export interface AssumptionsArtifact {
    phase: number;
    assumptions: AssumptionEntry[];
    createdAt: string;
    updatedAt: string;
}
export declare const AssumptionsArtifactSchema: z.ZodObject<{
    phase: z.ZodNumber;
    assumptions: z.ZodArray<z.ZodObject<{
        statement: z.ZodString;
        validation_status: z.ZodEnum<["unvalidated", "validated", "invalidated"]>;
        confidence: z.ZodEnum<["high", "medium", "low"]>;
        impact: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        statement: string;
        validation_status: "unvalidated" | "validated" | "invalidated";
        confidence: "low" | "medium" | "high";
        impact: string;
    }, {
        statement: string;
        validation_status: "unvalidated" | "validated" | "invalidated";
        confidence: "low" | "medium" | "high";
        impact: string;
    }>, "many">;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phase: number;
    createdAt: string;
    assumptions: {
        statement: string;
        validation_status: "unvalidated" | "validated" | "invalidated";
        confidence: "low" | "medium" | "high";
        impact: string;
    }[];
    updatedAt: string;
}, {
    phase: number;
    createdAt: string;
    assumptions: {
        statement: string;
        validation_status: "unvalidated" | "validated" | "invalidated";
        confidence: "low" | "medium" | "high";
        impact: string;
    }[];
    updatedAt: string;
}>;
export interface IssueEntry {
    severity: IssueSeverity;
    description: string;
    affectedAreas: string[];
    mitigation: string;
}
export declare const IssueEntrySchema: z.ZodObject<{
    severity: z.ZodEnum<["critical", "high", "medium", "low"]>;
    description: z.ZodString;
    affectedAreas: z.ZodArray<z.ZodString, "many">;
    mitigation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    affectedAreas: string[];
    mitigation: string;
}, {
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    affectedAreas: string[];
    mitigation: string;
}>;
export interface IssuesArtifact {
    phase: number;
    issues: IssueEntry[];
    createdAt: string;
}
export declare const IssuesArtifactSchema: z.ZodObject<{
    phase: z.ZodNumber;
    issues: z.ZodArray<z.ZodObject<{
        severity: z.ZodEnum<["critical", "high", "medium", "low"]>;
        description: z.ZodString;
        affectedAreas: z.ZodArray<z.ZodString, "many">;
        mitigation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        affectedAreas: string[];
        mitigation: string;
    }, {
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        affectedAreas: string[];
        mitigation: string;
    }>, "many">;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phase: number;
    issues: {
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        affectedAreas: string[];
        mitigation: string;
    }[];
    createdAt: string;
}, {
    phase: number;
    issues: {
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        affectedAreas: string[];
        mitigation: string;
    }[];
    createdAt: string;
}>;
export interface DiscoveryArtifact {
    phase: number;
    depth: DiscoveryDepth;
    summary: string;
    findings: string[];
    optionsConsidered: string[];
    recommendation: string;
    references: string[];
    createdAt: string;
}
export declare const DiscoveryArtifactSchema: z.ZodObject<{
    phase: z.ZodNumber;
    depth: z.ZodEnum<["quick", "standard", "deep"]>;
    summary: z.ZodString;
    findings: z.ZodArray<z.ZodString, "many">;
    optionsConsidered: z.ZodArray<z.ZodString, "many">;
    recommendation: z.ZodString;
    references: z.ZodArray<z.ZodString, "many">;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phase: number;
    createdAt: string;
    summary: string;
    depth: "quick" | "standard" | "deep";
    findings: string[];
    optionsConsidered: string[];
    recommendation: string;
    references: string[];
}, {
    phase: number;
    createdAt: string;
    summary: string;
    depth: "quick" | "standard" | "deep";
    findings: string[];
    optionsConsidered: string[];
    recommendation: string;
    references: string[];
}>;
export interface ContextParams {
    domain?: string;
    decisions?: DecisionEntry[];
    specifics?: string[];
    deferred?: string[];
}
export declare const ContextParamsSchema: z.ZodObject<{
    domain: z.ZodOptional<z.ZodString>;
    decisions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
    }, {
        description: string;
        title: string;
    }>, "many">>;
    specifics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    deferred: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    domain?: string | undefined;
    decisions?: {
        description: string;
        title: string;
    }[] | undefined;
    specifics?: string[] | undefined;
    deferred?: string[] | undefined;
}, {
    domain?: string | undefined;
    decisions?: {
        description: string;
        title: string;
    }[] | undefined;
    specifics?: string[] | undefined;
    deferred?: string[] | undefined;
}>;
export interface DiscoveryParams {
    topic: string;
    depth: DiscoveryDepth;
    summary: string;
    findings: string[];
    optionsConsidered: string[];
    recommendation: string;
    references: string[];
}
export declare const DiscoveryParamsSchema: z.ZodObject<{
    topic: z.ZodString;
    depth: z.ZodEnum<["quick", "standard", "deep"]>;
    summary: z.ZodString;
    findings: z.ZodArray<z.ZodString, "many">;
    optionsConsidered: z.ZodArray<z.ZodString, "many">;
    recommendation: z.ZodString;
    references: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    summary: string;
    depth: "quick" | "standard" | "deep";
    findings: string[];
    optionsConsidered: string[];
    recommendation: string;
    references: string[];
    topic: string;
}, {
    summary: string;
    depth: "quick" | "standard" | "deep";
    findings: string[];
    optionsConsidered: string[];
    recommendation: string;
    references: string[];
    topic: string;
}>;
//# sourceMappingURL=pre-planning.d.ts.map