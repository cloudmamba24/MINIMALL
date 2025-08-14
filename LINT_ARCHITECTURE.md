# MiniMall Lint Architecture Guidelines

## Overview

This document outlines the linting strategy for MiniMall, a high-performance Shopify link-in-bio platform with <1.5s load time requirements. Our linting configuration balances code quality with architectural patterns specific to MiniMall's performance and UX requirements.

## Core Architectural Patterns

### 1. Performance-Critical Patterns

#### Array Index Keys in UI Components
**Pattern**: Using array indices as React keys for positional UI elements
**Files**: `components/modals/*`, `components/renderers/*`
**Justification**: 
- Star ratings: Index represents position (1st star, 2nd star, etc.)
- Pagination dots: Index represents slide position
- Product tags: Index represents spatial order on images
- Empty slots: Index represents layout position

```typescript
// ✅ Legitimate pattern - positional UI elements
{Array.from({ length: 5 }).map((_, i) => (
  <Star key={`star-${i}`} />  // Index IS the stable identifier
))}
```

#### Performance Observer Dependencies
**Pattern**: useEffect dependencies that control performance monitoring
**Files**: `components/optimization/*`, `components/instagram/*`
**Justification**: 
- Video intersection observers need re-initialization when content changes
- Analytics tracking requires specific dependency triggers
- Performance metrics collection is configId-dependent

```typescript
// ✅ Business-critical dependency
useEffect(() => {
  // Re-observe videos when visible count changes
}, [visibleCount]); // Required for performance optimization
```

### 2. Business Logic Patterns

#### URL State Synchronization
**Pattern**: useEffect intentionally excluding router/searchParams from dependencies
**Files**: `components/shop/*`
**Justification**: Prevents infinite loops during URL state updates

```typescript
// ✅ Intentional exclusion to prevent infinite loops
useEffect(() => {
  router.replace(`?${params.toString()}`);
  // router and searchParams intentionally excluded
}, [activeCategory, activeCollection]);
```

#### Spatial Product Tagging
**Pattern**: Array index keys for product tags with X/Y coordinates
**Files**: `components/renderers/StoriesRenderer.tsx`, `MasonryRenderer.tsx`
**Justification**: Tags are positioned by spatial coordinates; index represents order in spatial layout

```typescript
// ✅ Spatial positioning pattern
{productTags?.map((tag, tagIndex) => (
  <div 
    key={tagIndex}  // Represents spatial order
    style={{ left: `${tag.position.x}%`, top: `${tag.position.y}%` }}
  />
))}
```

### 3. Layout & Responsive Patterns

#### Masonry Layout Calculations
**Pattern**: Complex useEffect dependencies for responsive layout
**Files**: `components/renderers/MasonryRenderer.tsx`
**Justification**: Layout recalculation depends on category, layout config, and column count

```typescript
// ✅ Architectural pattern for responsive masonry
useEffect(() => {
  calculateMasonryLayout();
}, [category, layout, columns]); // All required for responsive behavior
```

## Lint Configuration Strategy

### 1. Global Rules (Strict)
- Type safety: `noExplicitAny: "warn"`
- Accessibility: `useButtonType: "warn"`
- Performance: `noForEach: "warn"`

### 2. Component-Specific Overrides

#### UI Components (`modals/*`, `renderers/*`, `shop/*`)
```json
{
  "noArrayIndexKey": "off",           // Positional UI patterns
  "useExhaustiveDependencies": "off"  // Business logic patterns
}
```

#### Performance Components (`optimization/*`, `instagram/*`)  
```json
{
  "useExhaustiveDependencies": "off", // Performance monitoring
  "noForEach": "off"                  // Mathematical calculations
}
```

### 3. Architectural Exceptions

#### Accepted Patterns
1. **Array index keys** for positional UI elements (stars, dots, spatial tags)
2. **Selective useEffect dependencies** for performance and business logic
3. **forEach in mathematical operations** (masonry layout calculations)
4. **URL state management** with intentional dependency exclusions

## Development Guidelines

### When to Use Array Index Keys
✅ **Legitimate Use Cases:**
- Star ratings (positional indicators)
- Pagination dots (slide positions) 
- Product tags with spatial coordinates
- Empty layout slots
- Loading placeholders

❌ **Avoid For:**
- Dynamic lists with reordering
- Items with stable IDs available
- Content that changes frequently

### When to Exclude useEffect Dependencies
✅ **Legitimate Use Cases:**
- URL state synchronization (prevents loops)
- Performance observers (intentional re-initialization)
- Analytics tracking (specific triggers needed)

❌ **Avoid For:**
- General state management
- Data fetching
- Regular component updates

### Performance Considerations
- `<1.5s load time requirement` drives many architectural decisions
- Video intersection observers are performance-critical
- Masonry layout calculations must be responsive-aware
- Analytics tracking should not impact core performance

## Code Review Guidelines

### Red Flags
1. Array index keys for dynamic, reorderable content
2. Removing dependencies without understanding business logic
3. Converting all forEach loops without considering mathematical operations
4. Adding dependencies that cause infinite loops

### Green Flags  
1. Documented architectural patterns with business justification
2. Performance-first approach in video and layout components
3. Accessibility compliance maintained
4. Type safety preserved

## Future Improvements

### Custom ESLint Rules (Future)
1. **minimall/no-dynamic-array-index**: Allow index keys only for positional UI
2. **minimall/performance-deps**: Validate performance-related dependencies
3. **minimall/spatial-keys**: Allow index keys for spatial positioning

### Monitoring
- Track lint error count in CI/CD
- Alert on new array index key violations
- Monitor performance impact of changes

## Conclusion

MiniMall's linting strategy prioritizes:
1. **Performance** - <1.5s load time requirement
2. **User Experience** - Smooth interactions and responsive design  
3. **Business Logic** - URL state, product flows, analytics
4. **Code Quality** - Type safety and maintainability

This approach allows us to maintain high code quality while preserving the architectural patterns that make MiniMall performant and user-friendly.