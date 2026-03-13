# Deferred Items - Phase 03 Session Management

## Pre-existing Build Errors (Out of Scope)

**Discovered during:** Plan 03-02 (pause command implementation)

**Issue:** TypeScript compilation fails with errors in unrelated command files:
- `src/commands/apply.ts` - Type inference and argument type errors
- `src/commands/help.ts` - Type inference error
- `src/commands/init.ts` - Type inference error  
- `src/commands/progress.ts` - Type inference error
- `src/commands/status.ts` - Type inference error

**Status:** Not fixed - out of scope for this plan

**Note:** These errors existed before plan 03-02 execution. The pause.ts file compiles without errors. These errors should be addressed in a future plan dedicated to fixing TypeScript issues across the codebase.

---

*Created: 2026-03-06*
*Phase: 03-session-management*

---

## Pre-existing Build Errors (Out of Scope)

**Discovered during:** Plan 03-04 (status command enhancements)

**Issue:** `npm run build` fails with TypeScript errors in unrelated command files:
- `src/commands/apply.ts` - Tool type inference and argument type errors
- `src/commands/help.ts` - Tool type inference error
- `src/commands/init.ts` - Tool type inference error
- `src/commands/progress.ts` - Tool type inference error

**Status:** Not fixed - out of scope for this plan

**Note:** These errors predate the current plan. Fixing them requires a dedicated TypeScript cleanup plan.
