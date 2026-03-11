export interface GitFileStatus {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'untracked';
}
export interface GitChangeStatus {
    hasChanges: boolean;
    files: GitFileStatus[];
}
export interface FileModification {
    path: string;
    oldChecksum: string;
    newChecksum: string;
}
export interface ModifiedFileStatus {
    hasModifications: boolean;
    files: FileModification[];
}
export declare function detectUncommittedChanges(directory: string): Promise<GitChangeStatus>;
export declare function detectModifiedFiles(directory: string, fileChecksums: Record<string, string>): Promise<ModifiedFileStatus>;
//# sourceMappingURL=change-detector.d.ts.map