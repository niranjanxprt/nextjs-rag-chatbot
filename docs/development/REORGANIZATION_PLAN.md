# Repository Reorganization Plan

## Current Issues
1. Configuration files not all using TypeScript extensions
2. Test files scattered across multiple locations
3. Some naming conventions not following Kiro standards
4. Missing proper structure alignment with steering documents

## Reorganization Steps

### 1. Configuration Files (TypeScript-first)
- ✅ `next.config.ts` - Already correct
- ✅ `tailwind.config.ts` - Already correct  
- ✅ `jest.config.ts` - Already correct
- ✅ `playwright.config.ts` - Already correct
- ✅ `postcss.config.ts` - Already correct

### 2. Test Structure Consolidation
- Move all test files to follow proper naming conventions
- Consolidate test utilities
- Ensure all test files use `.test.ts`/`.test.tsx` suffix

### 3. Component Structure
- ✅ All components already using `.tsx` extensions
- ✅ Following PascalCase naming
- ✅ Proper directory organization

### 4. Service Layer
- ✅ All services using `.ts` extensions
- ✅ Following kebab-case naming
- ✅ Proper TypeScript implementation

### 5. API Routes
- ✅ All using `route.ts` convention
- ✅ Proper REST structure

## Actions Required
1. Consolidate test files into proper structure
2. Update any remaining JavaScript config files to TypeScript
3. Ensure all imports use `@/` alias consistently
4. Verify all files follow TypeScript strict mode

## Status: Repository is already well-organized according to Kiro standards!
