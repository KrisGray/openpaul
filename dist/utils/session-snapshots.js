import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
export function captureSessionSnapshots(projectRoot, sessionId, fileChecksums) {
    const snapshotRoot = join('.openpaul', 'SESSIONS', sessionId, 'snapshots');
    const snapshotRootPath = join(projectRoot, snapshotRoot);
    const captured = [];
    if (!existsSync(snapshotRootPath)) {
        mkdirSync(snapshotRootPath, { recursive: true });
    }
    for (const filePath of Object.keys(fileChecksums)) {
        const sourcePath = join(projectRoot, filePath);
        if (!existsSync(sourcePath)) {
            continue;
        }
        const snapshotPath = join(snapshotRootPath, filePath);
        const snapshotDir = dirname(snapshotPath);
        if (!existsSync(snapshotDir)) {
            mkdirSync(snapshotDir, { recursive: true });
        }
        const content = readFileSync(sourcePath);
        writeFileSync(snapshotPath, content);
        captured.push(filePath);
    }
    return { snapshotRoot, captured };
}
export function loadSnapshotContent(projectRoot, snapshotRoot, filePath) {
    const rootPath = snapshotRoot.startsWith(projectRoot)
        ? snapshotRoot
        : join(projectRoot, snapshotRoot);
    const snapshotPath = join(rootPath, filePath);
    if (!existsSync(snapshotPath)) {
        return null;
    }
    try {
        return readFileSync(snapshotPath, 'utf-8');
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=session-snapshots.js.map