#!/usr/bin/env tsx
/**
 * Component Generator Script
 * Generates a new React component with TypeScript, tests, and stories
 * 
 * Usage: npx tsx scripts/generate-component.ts ComponentName [package]
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const componentName = process.argv[2];
const packageName = process.argv[3] || 'ui'; // Default to ui package

if (!componentName) {
  console.error('❌ Please provide a component name');
  console.log('Usage: npx tsx scripts/generate-component.ts ComponentName [package]');
  process.exit(1);
}

// Validate component name
if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
  console.error('❌ Component name must be PascalCase and start with a capital letter');
  process.exit(1);
}

const packages = {
  ui: 'packages/ui/src/components',
  admin: 'apps/admin/src/components',
  public: 'apps/public/src/components'
};

if (!packages[packageName as keyof typeof packages]) {
  console.error(`❌ Invalid package. Choose from: ${Object.keys(packages).join(', ')}`);
  process.exit(1);
}

const basePath = packages[packageName as keyof typeof packages];
const componentDir = join(process.cwd(), basePath);
const kebabCaseName = componentName.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);

// Ensure directory exists
if (!existsSync(componentDir)) {
  mkdirSync(componentDir, { recursive: true });
}

console.log(`🚀 Generating ${componentName} component in ${basePath}`);

// 1. Generate main component file
const componentCode = `import React from 'react';
import { cn } from '../lib/utils';

export interface ${componentName}Props {
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Child elements
   */
  children?: React.ReactNode;
  /**
   * Disable the component
   */
  disabled?: boolean;
}

/**
 * ${componentName} component
 * 
 * @example
 * <${componentName}>
 *   Content here
 * </${componentName}>
 */
export const ${componentName} = React.forwardRef<
  HTMLDivElement,
  ${componentName}Props
>(({ className, children, disabled, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "${kebabCaseName}",
        disabled && "${kebabCaseName}--disabled",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

${componentName}.displayName = "${componentName}";
`;

writeFileSync(join(componentDir, `${kebabCaseName}.tsx`), componentCode);

// 2. Generate test file
const testCode = `import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${kebabCaseName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName}>Test content</${componentName}>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <${componentName} className="custom-class">
        Test content
      </${componentName}>
    );
    const element = screen.getByText('Test content');
    expect(element).toHaveClass('custom-class');
  });

  it('handles disabled state', () => {
    render(
      <${componentName} disabled>
        Test content
      </${componentName}>
    );
    const element = screen.getByText('Test content');
    expect(element).toHaveClass('${kebabCaseName}--disabled');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<${componentName} ref={ref}>Test content</${componentName}>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
`;

writeFileSync(join(componentDir, `${kebabCaseName}.test.tsx`), testCode);

// 3. Generate Storybook stories
const storiesCode = `import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from './${kebabCaseName}';

const meta: Meta<typeof ${componentName}> = {
  title: '${packageName === 'ui' ? 'UI' : packageName === 'admin' ? 'Admin' : 'Public'}/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '${componentName} component with customizable styling and behavior.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disable the component',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default ${componentName}',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled ${componentName}',
    disabled: true,
  },
};

export const CustomStyling: Story = {
  args: {
    children: 'Custom Styled ${componentName}',
    className: 'p-4 bg-blue-100 border border-blue-300 rounded-lg',
  },
};

export const WithComplexContent: Story = {
  args: {
    children: (
      <div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Complex Content</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          This ${componentName} contains multiple elements and demonstrates
          how it handles complex nested content.
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '${componentName} with complex nested content structure.',
      },
    },
  },
};
`;

writeFileSync(join(componentDir, `${kebabCaseName}.stories.tsx`), storiesCode);

// 4. Generate index file for easy imports (if it doesn't exist)
const indexPath = join(componentDir, 'index.ts');
let indexContent = '';

if (existsSync(indexPath)) {
  // Read existing index and add new export
  const fs = require('fs');
  indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes(kebabCaseName)) {
    indexContent += `export * from './${kebabCaseName}';\n`;
  }
} else {
  indexContent = `export * from './${kebabCaseName}';\n`;
}

writeFileSync(indexPath, indexContent);

// 5. Update main package index if it exists
const packageIndexPath = join(process.cwd(), basePath, '../index.ts');
if (existsSync(packageIndexPath)) {
  const fs = require('fs');
  let packageIndex = fs.readFileSync(packageIndexPath, 'utf8');
  const exportLine = `export * from './components/${kebabCaseName}';`;
  
  if (!packageIndex.includes(exportLine)) {
    packageIndex += `${exportLine}\n`;
    writeFileSync(packageIndexPath, packageIndex);
    console.log('📝 Updated package index');
  }
}

// 6. Generate CSS file if ui package
if (packageName === 'ui') {
  const cssCode = `.${kebabCaseName} {
  /* Base styles for ${componentName} */
}

.${kebabCaseName}--disabled {
  opacity: 0.6;
  pointer-events: none;
}
`;

  const cssPath = join(process.cwd(), 'packages/ui/src/styles/components');
  if (!existsSync(cssPath)) {
    mkdirSync(cssPath, { recursive: true });
  }
  
  writeFileSync(join(cssPath, `${kebabCaseName}.css`), cssCode);
  console.log('🎨 Generated CSS file');
}

console.log('✅ Component generation complete!');
console.log(`
Generated files:
- ${basePath}/${kebabCaseName}.tsx
- ${basePath}/${kebabCaseName}.test.tsx  
- ${basePath}/${kebabCaseName}.stories.tsx
${packageName === 'ui' ? `- packages/ui/src/styles/components/${kebabCaseName}.css` : ''}

Next steps:
1. Review the generated component and customize as needed
2. Add specific styling and behavior
3. Run tests: npm test ${kebabCaseName}
4. View in Storybook: npm run storybook
5. Import and use: import { ${componentName} } from '@minimall/${packageName}';
`);

export {};