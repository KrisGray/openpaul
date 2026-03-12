interface CodebaseDoc {
    projectName: string;
    version: string;
    description: string;
    structure: string;
    fileCounts: {
        files: number;
        directories: number;
    };
    stack: {
        name: string;
        version: string;
        type: string;
    }[];
    conventions: string[];
    concerns: string[];
    integrations: string[];
    architecture: string;
}
export declare function generateCodebaseDoc(projectRoot: string, options?: {
    maxDepth?: number;
    outputPath?: string;
}): CodebaseDoc;
export declare function docToMarkdown(doc: CodebaseDoc): string;
export {};
//# sourceMappingURL=codebase-generator.d.ts.map