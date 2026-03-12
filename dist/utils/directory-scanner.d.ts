export interface TreeNode {
    name: string;
    type: 'file' | 'directory';
    path: string;
    children?: TreeNode[];
}
export interface ScanOptions {
    maxDepth: number;
    excludeDirs: string[];
    force?: boolean;
    verbose?: boolean;
}
export interface CacheEntry {
    path: string;
    mtime: number;
    size: number;
}
export interface CacheData {
    version: string;
    timestamp: number;
    entries: CacheEntry[];
}
export declare function scanDirectory(dir: string, options?: Partial<ScanOptions>, currentDepth?: number): TreeNode | null;
export declare function treeToMarkdown(node: TreeNode, prefix?: string, isLast?: boolean): string;
export declare function countFiles(node: TreeNode): {
    files: number;
    directories: number;
};
export declare function loadCache(projectRoot: string): CacheData | null;
export declare function saveCache(projectRoot: string, entries: CacheEntry[]): void;
export declare function isCacheValid(projectRoot: string, outputPath?: string): boolean;
//# sourceMappingURL=directory-scanner.d.ts.map