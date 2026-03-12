import { z } from 'zod';
/**
 * UAT Result - Outcome of a UAT test item
 */
export type UATResult = 'pass' | 'fail' | 'skip';
export declare const UATResultSchema: z.ZodEnum<["pass", "fail", "skip"]>;
/**
 * UAT Severity - Severity level for issues
 */
export type UATSeverity = 'critical' | 'major' | 'minor';
export declare const UATSeveritySchema: z.ZodEnum<["critical", "major", "minor"]>;
/**
 * UAT Category - Category of UAT test
 */
export type UATCategory = 'functional' | 'visual' | 'performance' | 'configuration';
export declare const UATCategorySchema: z.ZodEnum<["functional", "visual", "performance", "configuration"]>;
/**
 * UAT Item - Individual test item from must_haves truths
 */
export interface UATItem {
    id: number;
    description: string;
    result: UATResult;
    notes?: string;
    testedAt?: number;
}
export declare const UATItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    description: z.ZodString;
    result: z.ZodEnum<["pass", "fail", "skip"]>;
    notes: z.ZodOptional<z.ZodString>;
    testedAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: number;
    description: string;
    result: "pass" | "fail" | "skip";
    notes?: string | undefined;
    testedAt?: number | undefined;
}, {
    id: number;
    description: string;
    result: "pass" | "fail" | "skip";
    notes?: string | undefined;
    testedAt?: number | undefined;
}>;
/**
 * UAT Issue - Failed item with details
 */
export interface UATIssue {
    id: number;
    itemDescription: string;
    status: 'open' | 'fixed' | 'wontfix';
    severity: UATSeverity;
    category: UATCategory;
    description: string;
    suggestedFix?: string;
    sourcePlanId: string;
    fixPlanId?: string;
    createdAt: number;
}
export declare const UATIssueSchema: z.ZodObject<{
    id: z.ZodNumber;
    itemDescription: z.ZodString;
    status: z.ZodEnum<["open", "fixed", "wontfix"]>;
    severity: z.ZodEnum<["critical", "major", "minor"]>;
    category: z.ZodEnum<["functional", "visual", "performance", "configuration"]>;
    description: z.ZodString;
    suggestedFix: z.ZodOptional<z.ZodString>;
    sourcePlanId: z.ZodString;
    fixPlanId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "fixed" | "open" | "wontfix";
    id: number;
    description: string;
    createdAt: number;
    severity: "critical" | "major" | "minor";
    itemDescription: string;
    category: "functional" | "visual" | "performance" | "configuration";
    sourcePlanId: string;
    suggestedFix?: string | undefined;
    fixPlanId?: string | undefined;
}, {
    status: "fixed" | "open" | "wontfix";
    id: number;
    description: string;
    createdAt: number;
    severity: "critical" | "major" | "minor";
    itemDescription: string;
    category: "functional" | "visual" | "performance" | "configuration";
    sourcePlanId: string;
    suggestedFix?: string | undefined;
    fixPlanId?: string | undefined;
}>;
/**
 * UAT Summary - Summary counts
 */
export interface UATSummary {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
}
export declare const UATSummarySchema: z.ZodObject<{
    passed: z.ZodNumber;
    failed: z.ZodNumber;
    skipped: z.ZodNumber;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    failed: number;
    skipped: number;
    total: number;
    passed: number;
}, {
    failed: number;
    skipped: number;
    total: number;
    passed: number;
}>;
/**
 * UAT - UAT results file content
 */
export interface UAT {
    phaseNumber: number;
    planId: string;
    testedAt: number;
    status: 'complete' | 'partial' | 'in-progress';
    items: UATItem[];
    summary: UATSummary;
}
export declare const UATSchema: z.ZodObject<{
    phaseNumber: z.ZodNumber;
    planId: z.ZodString;
    testedAt: z.ZodNumber;
    status: z.ZodEnum<["complete", "partial", "in-progress"]>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        description: z.ZodString;
        result: z.ZodEnum<["pass", "fail", "skip"]>;
        notes: z.ZodOptional<z.ZodString>;
        testedAt: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        description: string;
        result: "pass" | "fail" | "skip";
        notes?: string | undefined;
        testedAt?: number | undefined;
    }, {
        id: number;
        description: string;
        result: "pass" | "fail" | "skip";
        notes?: string | undefined;
        testedAt?: number | undefined;
    }>, "many">;
    summary: z.ZodObject<{
        passed: z.ZodNumber;
        failed: z.ZodNumber;
        skipped: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        failed: number;
        skipped: number;
        total: number;
        passed: number;
    }, {
        failed: number;
        skipped: number;
        total: number;
        passed: number;
    }>;
}, "strip", z.ZodTypeAny, {
    phaseNumber: number;
    status: "in-progress" | "partial" | "complete";
    planId: string;
    summary: {
        failed: number;
        skipped: number;
        total: number;
        passed: number;
    };
    testedAt: number;
    items: {
        id: number;
        description: string;
        result: "pass" | "fail" | "skip";
        notes?: string | undefined;
        testedAt?: number | undefined;
    }[];
}, {
    phaseNumber: number;
    status: "in-progress" | "partial" | "complete";
    planId: string;
    summary: {
        failed: number;
        skipped: number;
        total: number;
        passed: number;
    };
    testedAt: number;
    items: {
        id: number;
        description: string;
        result: "pass" | "fail" | "skip";
        notes?: string | undefined;
        testedAt?: number | undefined;
    }[];
}>;
/**
 * UAT Issues - UAT issues file content
 */
export interface UATIssues {
    phaseNumber: number;
    sourcePlanId: string;
    createdAt: number;
    issues: UATIssue[];
}
export declare const UATIssuesSchema: z.ZodObject<{
    phaseNumber: z.ZodNumber;
    sourcePlanId: z.ZodString;
    createdAt: z.ZodNumber;
    issues: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        itemDescription: z.ZodString;
        status: z.ZodEnum<["open", "fixed", "wontfix"]>;
        severity: z.ZodEnum<["critical", "major", "minor"]>;
        category: z.ZodEnum<["functional", "visual", "performance", "configuration"]>;
        description: z.ZodString;
        suggestedFix: z.ZodOptional<z.ZodString>;
        sourcePlanId: z.ZodString;
        fixPlanId: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        status: "fixed" | "open" | "wontfix";
        id: number;
        description: string;
        createdAt: number;
        severity: "critical" | "major" | "minor";
        itemDescription: string;
        category: "functional" | "visual" | "performance" | "configuration";
        sourcePlanId: string;
        suggestedFix?: string | undefined;
        fixPlanId?: string | undefined;
    }, {
        status: "fixed" | "open" | "wontfix";
        id: number;
        description: string;
        createdAt: number;
        severity: "critical" | "major" | "minor";
        itemDescription: string;
        category: "functional" | "visual" | "performance" | "configuration";
        sourcePlanId: string;
        suggestedFix?: string | undefined;
        fixPlanId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    phaseNumber: number;
    issues: {
        status: "fixed" | "open" | "wontfix";
        id: number;
        description: string;
        createdAt: number;
        severity: "critical" | "major" | "minor";
        itemDescription: string;
        category: "functional" | "visual" | "performance" | "configuration";
        sourcePlanId: string;
        suggestedFix?: string | undefined;
        fixPlanId?: string | undefined;
    }[];
    createdAt: number;
    sourcePlanId: string;
}, {
    phaseNumber: number;
    issues: {
        status: "fixed" | "open" | "wontfix";
        id: number;
        description: string;
        createdAt: number;
        severity: "critical" | "major" | "minor";
        itemDescription: string;
        category: "functional" | "visual" | "performance" | "configuration";
        sourcePlanId: string;
        suggestedFix?: string | undefined;
        fixPlanId?: string | undefined;
    }[];
    createdAt: number;
    sourcePlanId: string;
}>;
//# sourceMappingURL=quality.d.ts.map