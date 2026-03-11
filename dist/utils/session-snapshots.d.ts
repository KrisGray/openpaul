type SnapshotCaptureResult = {
    snapshotRoot: string;
    captured: string[];
};
export declare function captureSessionSnapshots(projectRoot: string, sessionId: string, fileChecksums: Record<string, string>): SnapshotCaptureResult;
export declare function loadSnapshotContent(projectRoot: string, snapshotRoot: string, filePath: string): string | null;
export {};
//# sourceMappingURL=session-snapshots.d.ts.map