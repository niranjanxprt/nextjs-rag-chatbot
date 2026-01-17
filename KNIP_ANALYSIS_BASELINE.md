# Knip Analysis Baseline Report

**Generated on:** $(date)
**Knip Version:** Latest
**Project:** Next.js RAG Chatbot (Post Supabase-to-Convex Migration)

## Executive Summary

Knip has identified significant opportunities for code cleanup following the Supabase to Convex migration. The analysis reveals:

- **28 unused files** that can be safely removed
- **24 unlisted dependencies** that need to be added to package.json or removed
- **9 unresolved imports** pointing to missing or moved files
- **153 unused exports** that can be cleaned up
- **89 unused exported types** that are no longer needed
- **3 unused enum members** that can be removed
- **1 duplicate export** that needs resolution

## Detailed Findings

### 1. Unused Files (28 files)

#### Chat Components (6 files)

- `src/components/chat/ChatContainer.tsx`
- `src/components/chat/ChatInput.tsx`
- `src/components/chat/EnhancedChatMessage.tsx`
- `src/components/chat/MessageList.tsx`
- `src/components/chat/SourceCitations.tsx`
- `src/components/chat/TypingIndicator.tsx`

#### Layout Components (2 files)

- `src/components/layouts/DashboardLayout.tsx`
- `src/components/layouts/SidebarLayout.tsx`

#### UI Components (17 files)

- `src/components/ui/accordion.tsx`
- `src/components/ui/breadcrumb-nav.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/calendar.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/ui/command.tsx`
- `src/components/ui/context-menu.tsx`
- `src/components/ui/hover-card.tsx`
- `src/components/ui/keyboard-shortcuts-dialog.tsx`
- `src/components/ui/loading-spinner.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/navigation.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/suspense-wrapper.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/toggle.tsx`

#### Utility Files (3 files)

- `src/lib/animations/page-transitions.ts`
- `src/lib/env.ts`
- `src/lib/responsive/breakpoints.ts`

### 2. Unlisted Dependencies (24 dependencies)

#### Testing Dependencies

- `@jest/globals` (used in 14 test files)
- `node-mocks-http` (used in integration tests)

#### Migration Artifacts

- `@supabase/supabase-js` (still referenced in auth tests)

#### Configuration Dependencies

- `postcss-load-config` (used in postcss.config.ts)

#### AI/ML Dependencies

- `ai/react` (used in ChatInterface test)
- `langfuse` (used in langfuse test)

### 3. Unresolved Imports (9 imports)

#### Missing Service Files

- `@/lib/services/document-processor` (referenced in 3 test files)
- `@/lib/services/embeddings` (referenced in 2 test files)
- `@/lib/services/vector-search` (referenced in 2 test files)
- `@/lib/services/langfuse` (referenced in 1 test file)

#### Missing Route Files

- `../[id]/process/route` (referenced in document processing test)

### 4. Unused Exports (153 exports)

#### High-Priority Cleanup Areas

**UI Component Exports (50+ exports)**

- Multiple unused component variants and sub-components
- Unused props interfaces and type definitions
- Unused utility functions and hooks

**Database and Schema Exports (40+ exports)**

- Unused type definitions from migration
- Unused validation schemas
- Unused database query functions

**Hook Exports (30+ exports)**

- Unused custom hooks for various features
- Unused hook interfaces and types

**Utility Exports (20+ exports)**

- Unused error handling functions
- Unused performance monitoring functions
- Unused validation utilities

### 5. Configuration Issues

#### Redundant Entry Patterns

- Several configuration files are listed as both entry points and in ignore patterns
- Some dependencies are unnecessarily listed in ignoreDependencies

## Action Plan

### Phase 1: Immediate Cleanup (High Impact, Low Risk)

1. **Remove unused files** - Start with clearly unused UI components
2. **Clean up package.json** - Add missing dependencies or remove unused imports
3. **Fix unresolved imports** - Update import paths or remove broken references

### Phase 2: Export Cleanup (Medium Impact, Medium Risk)

1. **Remove unused exports** - Focus on clearly unused functions and types
2. **Consolidate duplicate exports** - Resolve duplicate export issues
3. **Clean up type definitions** - Remove unused interfaces and types

### Phase 3: Optimization (Medium Impact, Low Risk)

1. **Optimize Knip configuration** - Remove redundant patterns
2. **Update import paths** - Fix remaining import issues
3. **Final validation** - Ensure all changes work correctly

## Estimated Impact

### Bundle Size Reduction

- **Estimated reduction:** 15-25% based on unused files
- **Target files for maximum impact:** Large UI components and unused utilities

### Dependency Cleanup

- **Dependencies to remove:** 5-10 unused packages
- **Dependencies to add:** 3-5 missing but used packages

### Code Quality Improvement

- **Lines of code reduction:** 2000+ lines
- **Type safety improvement:** Remove unused type definitions
- **Maintainability:** Cleaner codebase structure

## Risk Assessment

### Low Risk Items

- Unused UI components that are clearly not imported
- Unused utility functions with no external dependencies
- Unused type definitions and interfaces

### Medium Risk Items

- Files that might be dynamically imported
- Components that might be used in string-based references
- Test utilities that might be used indirectly

### High Risk Items

- Core functionality components
- Files with complex dependency chains
- Configuration files and middleware

## Next Steps

1. **Validate findings** - Manual review of flagged files
2. **Create backup** - Ensure current state is backed up
3. **Incremental cleanup** - Remove files in small batches
4. **Test thoroughly** - Run full test suite after each batch
5. **Monitor performance** - Track bundle size improvements

## Notes

- This analysis was performed after the Supabase to Convex migration
- Some unused code may be migration artifacts that are safe to remove
- Test files reference many services that have been disabled/removed
- The project structure suggests this is a comprehensive refactoring opportunity

---

**Recommendation:** Proceed with Phase 1 cleanup immediately, as it represents the highest impact with lowest risk. The significant number of unused files suggests substantial optimization potential.
