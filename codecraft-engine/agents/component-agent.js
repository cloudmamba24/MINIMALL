/**
 * Component Agent - Advanced React/UI component generation
 * 
 * Capabilities:
 * - React functional component generation with hooks
 * - TypeScript integration with proper typing
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance optimization (memo, lazy loading)
 * - Props interface generation and validation
 * - Component composition and patterns
 * - Story generation for Storybook
 * - Responsive design integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComponentAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Component';
    this.capabilities = [
      'react_component_generation',
      'typescript_integration',
      'accessibility_compliance',
      'performance_optimization',
      'props_interface_generation',
      'component_composition',
      'story_generation',
      'responsive_design'
    ];
    
    this.componentTypes = {
      'ui': {
        priority: 'high',
        patterns: ['Button', 'Input', 'Modal', 'Card', 'Badge', 'Avatar'],
        complexity: 'low',
        dependencies: ['styling']
      },
      'layout': {
        priority: 'high',
        patterns: ['Container', 'Grid', 'Flex', 'Sidebar', 'Header', 'Footer'],
        complexity: 'medium',
        dependencies: ['styling', 'responsive']
      },
      'form': {
        priority: 'medium',
        patterns: ['Form', 'FormField', 'Validation', 'DatePicker', 'Select'],
        complexity: 'high',
        dependencies: ['validation', 'state-management']
      },
      'data': {
        priority: 'medium',
        patterns: ['Table', 'List', 'DataGrid', 'Tree', 'Chart'],
        complexity: 'high',
        dependencies: ['data-fetching', 'virtualization']
      },
      'feature': {
        priority: 'low',
        patterns: ['Dashboard', 'Profile', 'Settings', 'Search', 'Navigation'],
        complexity: 'very-high',
        dependencies: ['api', 'routing', 'state-management']
      }
    };

    this.templates = {
      functional: this.getFunctionalComponentTemplate(),
      class: this.getClassComponentTemplate(),
      hook: this.getCustomHookTemplate(),
      story: this.getStoryTemplate(),
      test: this.getComponentTestTemplate(),
      types: this.getTypeDefinitionsTemplate()
    };

    this.designPatterns = {
      'compound': {
        description: 'Components with sub-components (e.g., Modal.Header, Modal.Body)',
        complexity: 'medium',
        example: 'Modal with Header, Body, Footer'
      },
      'render-prop': {
        description: 'Components that use render props pattern',
        complexity: 'high',
        example: 'DataProvider with render prop'
      },
      'higher-order': {
        description: 'Higher Order Components (HOCs)',
        complexity: 'high',
        example: 'withAuth, withLoading'
      },
      'context-provider': {
        description: 'Context providers for state management',
        complexity: 'medium',
        example: 'ThemeProvider, UserProvider'
      }
    };

    this.accessibilityRules = [
      'semantic_html',
      'aria_labels',
      'keyboard_navigation',
      'focus_management',
      'color_contrast',
      'screen_reader_support',
      'responsive_design'
    ];
  }

  async generate(context) {
    console.log('🎨 Component Agent: Generating React components...');
    
    const results = {
      files: [],
      components: [],
      metrics: {
        componentsGenerated: 0,
        linesOfCode: 0,
        testsGenerated: 0,
        storiesGenerated: 0
      },
      dependencies: [],
      warnings: []
    };

    // 1. Analyze component requirements
    const componentRequirements = await this.analyzeComponentRequirements(context);
    
    // 2. Plan component architecture
    const componentArchitecture = await this.planComponentArchitecture(componentRequirements);
    
    // 3. Generate components
    for (const componentSpec of componentArchitecture.components) {
      try {
        const componentResult = await this.generateComponent(componentSpec, context);
        results.files.push(...componentResult.files);
        results.components.push(componentResult.component);
        results.metrics.componentsGenerated++;
        results.metrics.linesOfCode += componentResult.linesOfCode;
        
        // Generate associated files
        if (componentSpec.includeTests) {
          const testResult = await this.generateComponentTest(componentSpec, context);
          results.files.push(...testResult.files);
          results.metrics.testsGenerated++;
        }
        
        if (componentSpec.includeStory) {
          const storyResult = await this.generateComponentStory(componentSpec, context);
          results.files.push(...storyResult.files);
          results.metrics.storiesGenerated++;
        }
        
        // Track dependencies
        results.dependencies.push(...componentResult.dependencies);
        
      } catch (error) {
        results.warnings.push({
          component: componentSpec.name,
          error: error.message,
          severity: 'medium'
        });
      }
    }

    // 4. Generate index files and exports
    const indexFiles = await this.generateIndexFiles(results.components, context);
    results.files.push(...indexFiles);

    // 5. Generate TypeScript definitions
    if (context.projectContext.language === 'TypeScript') {
      const typeFiles = await this.generateTypeDefinitions(results.components, context);
      results.files.push(...typeFiles);
    }

    console.log(`✅ Component Agent: Generated ${results.metrics.componentsGenerated} components`);
    
    return results;
  }

  async analyzeComponentRequirements(context) {
    const requirements = {
      components: [],
      patterns: [],
      complexity: 'medium',
      framework: context.projectContext.framework || 'React'
    };

    // Extract component requirements from context
    if (context.requirements) {
      context.requirements.forEach(req => {
        if (req.type === 'component' || req.category === 'ui') {
          requirements.components.push(this.parseComponentRequirement(req));
        }
      });
    }

    // Analyze existing component patterns
    const existingPatterns = await this.analyzeExistingComponentPatterns(context);
    requirements.patterns = existingPatterns;

    // Determine complexity level
    requirements.complexity = this.determineComplexity(requirements.components);

    return requirements;
  }

  parseComponentRequirement(requirement) {
    return {
      name: requirement.name || this.extractComponentName(requirement.description),
      type: this.categorizeComponent(requirement),
      props: requirement.props || this.inferProps(requirement),
      features: requirement.features || [],
      accessibility: requirement.accessibility !== false,
      responsive: requirement.responsive !== false,
      includeTests: requirement.tests !== false,
      includeStory: requirement.storybook !== false,
      styling: requirement.styling || 'css-modules',
      complexity: requirement.complexity || 'medium'
    };
  }

  async planComponentArchitecture(requirements) {
    const architecture = {
      components: [],
      sharedTypes: [],
      hooks: [],
      utils: [],
      dependencies: []
    };

    // Plan individual components
    for (const req of requirements.components) {
      const componentPlan = await this.planIndividualComponent(req, requirements);
      architecture.components.push(componentPlan);
      
      // Extract shared elements
      architecture.sharedTypes.push(...componentPlan.types);
      architecture.hooks.push(...componentPlan.hooks);
      architecture.utils.push(...componentPlan.utils);
      architecture.dependencies.push(...componentPlan.dependencies);
    }

    // Optimize architecture
    architecture.sharedTypes = this.deduplicateTypes(architecture.sharedTypes);
    architecture.hooks = this.optimizeHooks(architecture.hooks);
    
    return architecture;
  }

  async generateComponent(componentSpec, context) {
    const component = {
      name: componentSpec.name,
      type: componentSpec.type,
      filePath: this.getComponentFilePath(componentSpec, context),
      content: '',
      dependencies: [],
      exports: []
    };

    // Generate main component content
    const componentContent = await this.generateComponentContent(componentSpec, context);
    component.content = componentContent.code;
    component.dependencies = componentContent.dependencies;
    component.exports = componentContent.exports;

    // Create component file
    const componentFile = {
      path: component.filePath,
      content: component.content,
      type: 'component'
    };

    // Generate style file if needed
    const styleFiles = await this.generateComponentStyles(componentSpec, context);
    
    const result = {
      component,
      files: [componentFile, ...styleFiles],
      linesOfCode: this.countLines(component.content),
      dependencies: component.dependencies
    };

    return result;
  }

  async generateComponentContent(componentSpec, context) {
    const isTypeScript = context.projectContext.language === 'TypeScript';
    const template = this.selectTemplate(componentSpec);
    
    const content = {
      imports: this.generateImports(componentSpec, context),
      types: isTypeScript ? this.generateTypeDefinitions(componentSpec) : '',
      interfaces: isTypeScript ? this.generateInterfaces(componentSpec) : '',
      component: this.generateComponentBody(componentSpec, context),
      exports: this.generateExports(componentSpec)
    };

    const code = this.assembleComponentCode(content, componentSpec);
    
    return {
      code,
      dependencies: this.extractDependencies(content),
      exports: this.extractExports(content)
    };
  }

  generateImports(componentSpec, context) {
    const imports = [];
    
    // React imports
    const reactImports = ['React'];
    if (componentSpec.hooks?.includes('useState')) reactImports.push('useState');
    if (componentSpec.hooks?.includes('useEffect')) reactImports.push('useEffect');
    if (componentSpec.hooks?.includes('useCallback')) reactImports.push('useCallback');
    if (componentSpec.hooks?.includes('useMemo')) reactImports.push('useMemo');
    if (componentSpec.accessibility?.includes('useRef')) reactImports.push('useRef');
    
    imports.push(`import ${reactImports.join(', ')} from 'react';`);

    // TypeScript imports
    if (context.projectContext.language === 'TypeScript') {
      const typeImports = this.getRequiredTypeImports(componentSpec);
      if (typeImports.length > 0) {
        imports.push(`import type { ${typeImports.join(', ')} } from 'react';`);
      }
    }

    // Styling imports
    if (componentSpec.styling === 'css-modules') {
      imports.push(`import styles from './${componentSpec.name}.module.css';`);
    } else if (componentSpec.styling === 'styled-components') {
      imports.push(`import styled from 'styled-components';`);
    }

    // Component-specific imports
    if (componentSpec.dependencies) {
      componentSpec.dependencies.forEach(dep => {
        if (dep.type === 'component') {
          imports.push(`import { ${dep.name} } from '${dep.path}';`);
        } else if (dep.type === 'utility') {
          imports.push(`import { ${dep.name} } from '${dep.path}';`);
        }
      });
    }

    return imports.join('\n');
  }

  generateTypeDefinitions(componentSpec) {
    if (!componentSpec.props) return '';

    const propsInterface = `interface ${componentSpec.name}Props {
${Object.entries(componentSpec.props).map(([key, prop]) => {
  const optional = prop.required === false ? '?' : '';
  const type = this.mapPropType(prop.type);
  const comment = prop.description ? `  /** ${prop.description} */\n` : '';
  return `${comment}  ${key}${optional}: ${type};`;
}).join('\n')}
}`;

    return propsInterface;
  }

  generateComponentBody(componentSpec, context) {
    const isTypeScript = context.projectContext.language === 'TypeScript';
    const propsType = isTypeScript ? `: ${componentSpec.name}Props` : '';
    
    let componentBody = '';
    
    // Component declaration
    componentBody += `export const ${componentSpec.name} = (${this.generatePropsDestructuring(componentSpec)}${propsType}) => {\n`;
    
    // Hooks and state
    if (componentSpec.state) {
      componentBody += this.generateStateHooks(componentSpec.state);
    }
    
    // Event handlers
    if (componentSpec.events) {
      componentBody += this.generateEventHandlers(componentSpec.events);
    }
    
    // Effects
    if (componentSpec.effects) {
      componentBody += this.generateEffectHooks(componentSpec.effects);
    }
    
    // Accessibility setup
    if (componentSpec.accessibility) {
      componentBody += this.generateAccessibilitySetup(componentSpec);
    }
    
    // Component JSX
    componentBody += '  return (\n';
    componentBody += this.generateJSX(componentSpec);
    componentBody += '  );\n';
    
    componentBody += '};\n';
    
    // Display name for debugging
    componentBody += `\n${componentSpec.name}.displayName = '${componentSpec.name}';`;
    
    return componentBody;
  }

  generateJSX(componentSpec) {
    const tagName = componentSpec.semantic?.tag || 'div';
    const className = this.generateClassName(componentSpec);
    const attributes = this.generateJSXAttributes(componentSpec);
    
    let jsx = `    <${tagName}`;
    
    if (className) {
      jsx += ` className={${className}}`;
    }
    
    if (attributes.length > 0) {
      jsx += `\n      ${attributes.join('\n      ')}`;
    }
    
    jsx += '>\n';
    jsx += this.generateJSXContent(componentSpec);
    jsx += `    </${tagName}>`;
    
    return jsx;
  }

  generateJSXAttributes(componentSpec) {
    const attributes = [];
    
    // Accessibility attributes
    if (componentSpec.accessibility) {
      if (componentSpec.accessibility.role) {
        attributes.push(`role="${componentSpec.accessibility.role}"`);
      }
      if (componentSpec.accessibility.ariaLabel) {
        attributes.push(`aria-label={${componentSpec.accessibility.ariaLabel}}`);
      }
      if (componentSpec.accessibility.ariaDescribedBy) {
        attributes.push(`aria-describedby={${componentSpec.accessibility.ariaDescribedBy}}`);
      }
    }
    
    // Event handlers
    if (componentSpec.events) {
      Object.entries(componentSpec.events).forEach(([event, handler]) => {
        attributes.push(`${event}={${handler}}`);
      });
    }
    
    // Data attributes
    if (componentSpec.dataAttributes) {
      Object.entries(componentSpec.dataAttributes).forEach(([key, value]) => {
        attributes.push(`data-${key}="${value}"`);
      });
    }
    
    return attributes;
  }

  generateJSXContent(componentSpec) {
    let content = '';
    
    if (componentSpec.children === false) {
      // Self-closing component
      return '';
    }
    
    if (componentSpec.content) {
      if (typeof componentSpec.content === 'string') {
        content += `      {${componentSpec.content}}\n`;
      } else if (Array.isArray(componentSpec.content)) {
        componentSpec.content.forEach(item => {
          content += `      ${this.generateContentItem(item)}\n`;
        });
      }
    }
    
    if (componentSpec.children !== false) {
      content += '      {children}\n';
    }
    
    return content;
  }

  async generateComponentTest(componentSpec, context) {
    const testFramework = context.projectContext.testFramework || 'jest';
    const testContent = this.generateTestContent(componentSpec, testFramework);
    
    const testFilePath = this.getTestFilePath(componentSpec, context);
    
    const testFile = {
      path: testFilePath,
      content: testContent,
      type: 'test'
    };
    
    return {
      files: [testFile]
    };
  }

  generateTestContent(componentSpec, testFramework) {
    let testContent = '';
    
    // Imports
    testContent += `import React from 'react';\n`;
    testContent += `import { render, screen } from '@testing-library/react';\n`;
    testContent += `import { ${componentSpec.name} } from './${componentSpec.name}';\n\n`;
    
    // Test suite
    testContent += `describe('${componentSpec.name}', () => {\n`;
    
    // Basic render test
    testContent += `  it('renders without crashing', () => {\n`;
    testContent += `    render(<${componentSpec.name} />);\n`;
    testContent += `  });\n\n`;
    
    // Props tests
    if (componentSpec.props) {
      Object.entries(componentSpec.props).forEach(([propName, prop]) => {
        if (prop.testable !== false) {
          testContent += this.generatePropTest(componentSpec.name, propName, prop);
        }
      });
    }
    
    // Accessibility tests
    if (componentSpec.accessibility) {
      testContent += this.generateAccessibilityTests(componentSpec);
    }
    
    // Event tests
    if (componentSpec.events) {
      testContent += this.generateEventTests(componentSpec);
    }
    
    testContent += '});\n';
    
    return testContent;
  }

  async generateComponentStory(componentSpec, context) {
    const storyContent = this.generateStoryContent(componentSpec);
    const storyFilePath = this.getStoryFilePath(componentSpec, context);
    
    const storyFile = {
      path: storyFilePath,
      content: storyContent,
      type: 'story'
    };
    
    return {
      files: [storyFile]
    };
  }

  generateStoryContent(componentSpec) {
    let storyContent = '';
    
    // Imports
    storyContent += `import type { Meta, StoryObj } from '@storybook/react';\n`;
    storyContent += `import { ${componentSpec.name} } from './${componentSpec.name}';\n\n`;
    
    // Meta
    storyContent += `const meta: Meta<typeof ${componentSpec.name}> = {\n`;
    storyContent += `  title: 'Components/${componentSpec.name}',\n`;
    storyContent += `  component: ${componentSpec.name},\n`;
    storyContent += `  parameters: {\n`;
    storyContent += `    layout: 'centered',\n`;
    storyContent += `  },\n`;
    storyContent += `  tags: ['autodocs'],\n`;
    if (componentSpec.props) {
      storyContent += `  argTypes: {\n`;
      Object.entries(componentSpec.props).forEach(([propName, prop]) => {
        storyContent += `    ${propName}: {\n`;
        storyContent += `      description: '${prop.description || ''}',\n`;
        if (prop.options) {
          storyContent += `      control: { type: 'select' },\n`;
          storyContent += `      options: ${JSON.stringify(prop.options)},\n`;
        }
        storyContent += `    },\n`;
      });
      storyContent += `  },\n`;
    }
    storyContent += `};\n\n`;
    storyContent += `export default meta;\n`;
    storyContent += `type Story = StoryObj<typeof meta>;\n\n`;
    
    // Default story
    storyContent += `export const Default: Story = {\n`;
    storyContent += `  args: {\n`;
    if (componentSpec.props) {
      Object.entries(componentSpec.props).forEach(([propName, prop]) => {
        if (prop.defaultValue !== undefined) {
          storyContent += `    ${propName}: ${JSON.stringify(prop.defaultValue)},\n`;
        }
      });
    }
    storyContent += `  },\n`;
    storyContent += `};\n\n`;
    
    // Additional stories based on component variants
    if (componentSpec.variants) {
      componentSpec.variants.forEach(variant => {
        const variantName = this.capitalizeFirst(variant.name);
        storyContent += `export const ${variantName}: Story = {\n`;
        storyContent += `  args: {\n`;
        Object.entries(variant.props).forEach(([propName, value]) => {
          storyContent += `    ${propName}: ${JSON.stringify(value)},\n`;
        });
        storyContent += `  },\n`;
        storyContent += `};\n\n`;
      });
    }
    
    return storyContent;
  }

  // Utility methods
  getFunctionalComponentTemplate() {
    return {
      imports: '',
      types: '',
      component: '',
      exports: ''
    };
  }

  getClassComponentTemplate() {
    return {
      imports: '',
      types: '',
      component: '',
      exports: ''
    };
  }

  getCustomHookTemplate() {
    return {
      imports: '',
      hook: '',
      exports: ''
    };
  }

  getStoryTemplate() {
    return {
      meta: '',
      stories: []
    };
  }

  getComponentTestTemplate() {
    return {
      setup: '',
      tests: []
    };
  }

  getTypeDefinitionsTemplate() {
    return {
      interfaces: '',
      types: ''
    };
  }

  getComponentFilePath(componentSpec, context) {
    const extension = context.projectContext.language === 'TypeScript' ? 'tsx' : 'jsx';
    const basePath = context.architecture?.componentPath || 'src/components';
    
    if (componentSpec.type === 'page') {
      return path.join(basePath, 'pages', `${componentSpec.name}.${extension}`);
    } else if (componentSpec.type === 'layout') {
      return path.join(basePath, 'layout', `${componentSpec.name}.${extension}`);
    } else {
      return path.join(basePath, componentSpec.name, `${componentSpec.name}.${extension}`);
    }
  }

  getTestFilePath(componentSpec, context) {
    const componentPath = this.getComponentFilePath(componentSpec, context);
    const dir = path.dirname(componentPath);
    const name = path.basename(componentPath, path.extname(componentPath));
    return path.join(dir, `${name}.test.${context.projectContext.language === 'TypeScript' ? 'tsx' : 'jsx'}`);
  }

  getStoryFilePath(componentSpec, context) {
    const componentPath = this.getComponentFilePath(componentSpec, context);
    const dir = path.dirname(componentPath);
    const name = path.basename(componentPath, path.extname(componentPath));
    return path.join(dir, `${name}.stories.${context.projectContext.language === 'TypeScript' ? 'tsx' : 'jsx'}`);
  }

  countLines(content) {
    return content.split('\n').length;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  extractComponentName(description) {
    // Simple extraction logic - would be more sophisticated in practice
    const match = description.match(/(?:create|build|generate)\s+(?:a\s+)?(\w+)(?:\s+component)?/i);
    return match ? this.capitalizeFirst(match[1]) : 'Component';
  }

  categorizeComponent(requirement) {
    const description = requirement.description?.toLowerCase() || '';
    
    if (description.includes('button') || description.includes('input')) return 'ui';
    if (description.includes('form')) return 'form';
    if (description.includes('table') || description.includes('list')) return 'data';
    if (description.includes('layout') || description.includes('grid')) return 'layout';
    
    return 'feature';
  }

  mapPropType(type) {
    const typeMap = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'array': 'any[]',
      'object': 'object',
      'function': '() => void',
      'node': 'React.ReactNode'
    };
    
    return typeMap[type] || 'any';
  }
}

module.exports = { ComponentAgent };