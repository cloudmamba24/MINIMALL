# Deployment Warning Fixes

## Problem
Deployment warnings from Vercel build logs indicating:
1. Node.js version mismatch warnings
2. NPM security vulnerabilities (8 moderate severity)
3. Shopify Polaris component API deprecations
4. TypeScript strict mode compilation issues

## Root Causes
1. **Node.js Version Mismatch**: package.json specified "node": "20.x" while project needed 22.x
2. **Security Vulnerabilities**: Outdated transitive dependencies (esbuild, prismjs, react-is)
3. **Polaris API Changes**: Components upgraded to v13.9.5 with breaking changes:
   - Text component requires `as` prop
   - `color` prop changed to `tone` 
   - `caption` variant removed
   - Button component uses `icon` prop instead of children
   - TextField requires `autoComplete` prop
4. **TypeScript Strict Mode**: File upload handling needed null checks

## Solutions Applied

### 1. Node.js Version Alignment
```json
// package.json
"engines": {
  "node": "22.x"
}
```

### 2. Security Vulnerability Fixes
```json
// package.json overrides section  
"overrides": {
  "react-is": "^18.3.1",
  "prismjs": "^1.30.0", 
  "esbuild": "^0.25.0"
}
```

### 3. Shopify Polaris Component Updates

#### Text Components
```tsx
// Before
<Text variant="bodyLg">Text content</Text>
<Text variant="caption" color="subdued">Small text</Text>

// After  
<Text variant="bodyLg" as="p">Text content</Text>
<Text variant="bodySm" tone="subdued" as="span">Small text</Text>
```

#### Button Components
```tsx
// Before
<Button onClick={handler}>
  <EditIcon />
</Button>

// After
<Button onClick={handler} icon={EditIcon} />
```

#### TextField Components
```tsx
// Before
<TextField label="Name" value={value} onChange={onChange} />

// After
<TextField 
  label="Name" 
  value={value} 
  onChange={onChange}
  autoComplete="off" 
/>
```

### 4. TypeScript Strict Mode Compliance

#### File Upload Null Safety
```tsx
// asset-manager.tsx:132
for (let i = 0; i < acceptedFiles.length; i++) {
  const file = acceptedFiles[i];
  
  if (!file) continue; // Added null check
  
  const formData = new FormData();
  formData.append('file', file);
  // ...
}
```

#### Error Handling
```tsx
// Before
<Badge tone="critical">Error: {upload.error}</Badge>

// After  
<Badge tone="critical">{`Error: ${upload.error || 'Upload failed'}`}</Badge>
```

## Verification
- ✅ Build completes successfully for both admin and public apps
- ✅ Security vulnerabilities reduced from 8 to 4 (remaining are indirect dependencies)
- ✅ Node.js version warnings eliminated
- ✅ All Polaris components updated to v13.9.5 API
- ✅ TypeScript strict mode compliance achieved

## Remaining Items
Visual editor stories need updating to match current SiteConfig schema (categories vs content structure) - this is a separate task for story maintenance.

## Files Modified
- `package.json` - Node version and security overrides
- `apps/admin/src/components/assets/asset-manager.tsx` - Polaris API updates, TypeScript fixes
- `apps/admin/src/components/assets/asset-manager.stories.tsx` - Storybook interface compliance  
- `apps/admin/src/components/editor/visual-editor.stories.tsx` - Type annotations (partial)

🤖 Generated with [Claude Code](https://claude.ai/code)