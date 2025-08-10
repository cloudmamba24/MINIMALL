/**
 * Styling Agent - Advanced CSS and component styling generation
 * 
 * Capabilities:
 * - CSS generation (modern CSS, responsive design)
 * - Component styling (styled-components, emotion, CSS modules)
 * - Design system integration (Tailwind, Material-UI, Chakra)
 * - Theme and variant systems (dark/light modes)
 * - Animation and transition generation
 * - Responsive breakpoint management
 * - CSS optimization and best practices
 * - Style guide and token generation
 */

const fs = require('fs');
const path = require('path');

class StylingAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Styling';
    this.capabilities = [
      'css_generation',
      'component_styling',
      'design_system_integration',
      'theme_systems',
      'animation_generation',
      'responsive_design',
      'css_optimization',
      'style_guide_generation'
    ];

    this.stylingApproaches = {
      'css-modules': {
        features: ['scoped_styles', 'class_composition', 'typescript_support'],
        files: ['*.module.css', '*.module.scss'],
        framework: 'any'
      },
      'styled-components': {
        features: ['css_in_js', 'dynamic_styling', 'theming', 'ssr_support'],
        files: ['*.styles.ts', '*.styles.js'],
        framework: 'react'
      },
      'emotion': {
        features: ['css_in_js', 'performance_optimized', 'server_rendering'],
        files: ['*.emotion.ts', '*.emotion.js'],
        framework: 'react'
      },
      'tailwind': {
        features: ['utility_first', 'responsive_design', 'dark_mode', 'purge_css'],
        files: ['tailwind.config.js', 'globals.css'],
        framework: 'any'
      },
      'sass': {
        features: ['variables', 'mixins', 'nesting', 'modules'],
        files: ['*.scss', '*.sass'],
        framework: 'any'
      }
    };

    this.designTokens = {
      colors: {
        primary: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
        secondary: { main: '#64748b', light: '#94a3b8', dark: '#475569' },
        success: { main: '#10b981', light: '#34d399', dark: '#059669' },
        warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
        error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
        neutral: { 50: '#f8fafc', 100: '#f1f5f9', 500: '#64748b', 900: '#0f172a' }
      },
      spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem' },
      typography: {
        fonts: { sans: 'Inter, sans-serif', serif: 'Crimson Pro, serif', mono: 'Fira Code, monospace' },
        sizes: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem' },
        weights: { normal: '400', medium: '500', semibold: '600', bold: '700' }
      },
      borderRadius: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
      },
      breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' }
    };

    this.componentPatterns = {
      'button': {
        variants: ['primary', 'secondary', 'outline', 'ghost', 'link'],
        sizes: ['sm', 'md', 'lg'],
        states: ['default', 'hover', 'active', 'disabled', 'loading']
      },
      'input': {
        variants: ['default', 'filled', 'outline'],
        sizes: ['sm', 'md', 'lg'],
        states: ['default', 'focus', 'error', 'disabled']
      },
      'card': {
        variants: ['default', 'elevated', 'outline'],
        sizes: ['sm', 'md', 'lg'],
        states: ['default', 'hover', 'selected']
      }
    };
  }

  async generate(context) {
    console.log('🎨 Styling Agent: Generating styles and design system...');
    
    const results = {
      files: [],
      styles: [],
      themes: [],
      tokens: {},
      metrics: {
        stylesGenerated: 0,
        tokensCreated: 0,
        themesGenerated: 0,
        animationsCreated: 0,
        linesOfCode: 0
      },
      configuration: []
    };

    // 1. Analyze styling requirements
    const styleRequirements = await this.analyzeStyleRequirements(context);
    
    // 2. Generate design tokens
    const tokenResult = await this.generateDesignTokens(styleRequirements, context);
    results.files.push(...tokenResult.files);
    results.tokens = tokenResult.tokens;
    results.metrics.tokensCreated = Object.keys(tokenResult.tokens).length;

    // 3. Generate theme system
    const themeResult = await this.generateThemeSystem(styleRequirements, context);
    results.files.push(...themeResult.files);
    results.themes = themeResult.themes;
    results.metrics.themesGenerated = themeResult.themes.length;

    // 4. Generate component styles
    if (context.components) {
      for (const component of context.components) {
        const componentStyles = await this.generateComponentStyles(component, styleRequirements, context);
        results.files.push(...componentStyles.files);
        results.styles.push(...componentStyles.styles);
        results.metrics.stylesGenerated++;
      }
    }

    // 5. Generate global styles
    const globalStylesResult = await this.generateGlobalStyles(styleRequirements, context);
    results.files.push(...globalStylesResult.files);

    // 6. Generate responsive utilities
    const responsiveResult = await this.generateResponsiveUtilities(styleRequirements, context);
    results.files.push(...responsiveResult.files);

    // 7. Generate animations
    const animationResult = await this.generateAnimations(styleRequirements, context);
    results.files.push(...animationResult.files);
    results.metrics.animationsCreated = animationResult.animationCount;

    // 8. Generate configuration files
    const configResult = await this.generateStylingConfiguration(styleRequirements, context);
    results.files.push(...configResult.files);
    results.configuration = configResult.configuration;

    console.log(`✅ Styling Agent: Generated ${results.metrics.stylesGenerated} component styles and ${results.metrics.themesGenerated} themes`);
    
    return results;
  }

  async analyzeStyleRequirements(context) {
    const requirements = {
      approach: 'css-modules',
      framework: null,
      designSystem: null,
      themes: ['light', 'dark'],
      responsive: true,
      animations: true,
      customTokens: {},
      components: []
    };

    // Extract styling requirements from context
    if (context.requirements) {
      context.requirements.forEach(req => {
        if (req.type === 'styling' || req.category === 'design') {
          this.parseStyleRequirement(req, requirements);
        }
      });
    }

    // Detect project styling approach
    requirements.approach = this.detectStylingApproach(context);
    requirements.framework = context.projectContext.framework;

    return requirements;
  }

  async generateDesignTokens(requirements, context) {
    const tokens = { ...this.designTokens };
    
    // Merge custom tokens
    if (requirements.customTokens) {
      Object.assign(tokens, requirements.customTokens);
    }

    const files = [];

    // Generate tokens file
    if (requirements.approach === 'css-modules' || requirements.approach === 'sass') {
      const cssTokensFile = this.generateCSSTokens(tokens, requirements);
      files.push(cssTokensFile);
    } else if (requirements.approach === 'styled-components' || requirements.approach === 'emotion') {
      const jsTokensFile = this.generateJSTokens(tokens, requirements, context);
      files.push(jsTokensFile);
    }

    // Generate Tailwind config if needed
    if (requirements.approach === 'tailwind') {
      const tailwindConfig = this.generateTailwindConfig(tokens, requirements);
      files.push(tailwindConfig);
    }

    return { files, tokens };
  }

  generateCSSTokens(tokens, requirements) {
    let content = '';
    
    content += `/* Design Tokens */\n`;
    content += `:root {\n`;
    
    // Colors
    Object.entries(tokens.colors).forEach(([colorName, colorValue]) => {
      if (typeof colorValue === 'object') {
        Object.entries(colorValue).forEach(([shade, value]) => {
          content += `  --color-${colorName}-${shade}: ${value};\n`;
        });
      } else {
        content += `  --color-${colorName}: ${colorValue};\n`;
      }
    });
    
    // Spacing
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      content += `  --spacing-${name}: ${value};\n`;
    });
    
    // Typography
    Object.entries(tokens.typography.fonts).forEach(([name, value]) => {
      content += `  --font-${name}: ${value};\n`;
    });
    
    Object.entries(tokens.typography.sizes).forEach(([name, value]) => {
      content += `  --text-${name}: ${value};\n`;
    });
    
    // Border radius
    Object.entries(tokens.borderRadius).forEach(([name, value]) => {
      content += `  --radius-${name}: ${value};\n`;
    });
    
    // Shadows
    Object.entries(tokens.shadows).forEach(([name, value]) => {
      content += `  --shadow-${name}: ${value};\n`;
    });
    
    content += `}\n\n`;
    
    // Dark theme
    content += `[data-theme="dark"] {\n`;
    content += `  --color-neutral-50: #1e293b;\n`;
    content += `  --color-neutral-900: #f8fafc;\n`;
    content += `  /* Add more dark theme overrides */\n`;
    content += `}\n`;

    return {
      path: 'src/styles/tokens.css',
      content,
      type: 'tokens'
    };
  }

  generateJSTokens(tokens, requirements, context) {
    const isTypeScript = context.projectContext.language === 'TypeScript';
    const extension = isTypeScript ? 'ts' : 'js';
    
    let content = '';
    
    if (isTypeScript) {
      content += `export interface DesignTokens {\n`;
      content += `  colors: Record<string, string | Record<string, string>>;\n`;
      content += `  spacing: Record<string, string>;\n`;
      content += `  typography: {\n`;
      content += `    fonts: Record<string, string>;\n`;
      content += `    sizes: Record<string, string>;\n`;
      content += `    weights: Record<string, string>;\n`;
      content += `  };\n`;
      content += `  borderRadius: Record<string, string>;\n`;
      content += `  shadows: Record<string, string>;\n`;
      content += `  breakpoints: Record<string, string>;\n`;
      content += `}\n\n`;
    }
    
    content += `export const tokens${isTypeScript ? ': DesignTokens' : ''} = ${JSON.stringify(tokens, null, 2)};\n\n`;
    
    // Generate helper functions
    content += `export const getColor = (color: string, shade?: string) => {\n`;
    content += `  const colorValue = tokens.colors[color];\n`;
    content += `  if (typeof colorValue === 'object' && shade) {\n`;
    content += `    return colorValue[shade];\n`;
    content += `  }\n`;
    content += `  return typeof colorValue === 'string' ? colorValue : colorValue.main;\n`;
    content += `};\n\n`;
    
    content += `export const getSpacing = (size: string) => tokens.spacing[size];\n\n`;
    content += `export const getBreakpoint = (bp: string) => tokens.breakpoints[bp];\n`;

    return {
      path: `src/styles/tokens.${extension}`,
      content,
      type: 'tokens'
    };
  }

  async generateThemeSystem(requirements, context) {
    const themes = [];
    const files = [];

    for (const themeName of requirements.themes) {
      const theme = this.generateTheme(themeName, requirements, context);
      themes.push(theme);
      
      const themeFile = this.generateThemeFile(theme, requirements, context);
      files.push(themeFile);
    }

    // Generate theme provider if using JS approach
    if (requirements.approach === 'styled-components' || requirements.approach === 'emotion') {
      const providerFile = this.generateThemeProvider(themes, requirements, context);
      files.push(providerFile);
    }

    return { files, themes };
  }

  generateTheme(themeName, requirements, context) {
    const baseTheme = {
      name: themeName,
      colors: { ...this.designTokens.colors },
      spacing: { ...this.designTokens.spacing },
      typography: { ...this.designTokens.typography },
      borderRadius: { ...this.designTokens.borderRadius },
      shadows: { ...this.designTokens.shadows }
    };

    // Apply theme-specific overrides
    if (themeName === 'dark') {
      baseTheme.colors.neutral = {
        50: '#1e293b',
        100: '#334155', 
        500: '#94a3b8',
        900: '#f8fafc'
      };
      baseTheme.colors.background = '#0f172a';
      baseTheme.colors.surface = '#1e293b';
    }

    return baseTheme;
  }

  async generateComponentStyles(component, requirements, context) {
    const styles = [];
    const files = [];

    const componentStyle = {
      name: component.name,
      variants: this.componentPatterns[component.type?.toLowerCase()]?.variants || ['default'],
      sizes: this.componentPatterns[component.type?.toLowerCase()]?.sizes || ['md'],
      approach: requirements.approach
    };

    switch (requirements.approach) {
      case 'css-modules':
        const cssModuleFile = this.generateCSSModuleStyles(component, componentStyle, requirements);
        files.push(cssModuleFile);
        break;
        
      case 'styled-components':
        const styledComponentFile = this.generateStyledComponentStyles(component, componentStyle, requirements, context);
        files.push(styledComponentFile);
        break;
        
      case 'tailwind':
        const tailwindStyles = this.generateTailwindStyles(component, componentStyle, requirements);
        componentStyle.classes = tailwindStyles;
        break;
    }

    styles.push(componentStyle);

    return { files, styles };
  }

  generateCSSModuleStyles(component, style, requirements) {
    let content = '';
    
    // Base component styles
    content += `/* ${component.name} Component Styles */\n`;
    content += `.${component.name.toLowerCase()} {\n`;
    content += this.generateBaseStyles(component, style);
    content += `}\n\n`;
    
    // Variants
    style.variants.forEach(variant => {
      content += `.${component.name.toLowerCase()}--${variant} {\n`;
      content += this.generateVariantStyles(component, variant, style);
      content += `}\n\n`;
    });
    
    // Sizes
    style.sizes.forEach(size => {
      content += `.${component.name.toLowerCase()}--${size} {\n`;
      content += this.generateSizeStyles(component, size, style);
      content += `}\n\n`;
    });
    
    // States
    const states = this.componentPatterns[component.type?.toLowerCase()]?.states || ['hover', 'focus', 'disabled'];
    states.forEach(state => {
      if (state !== 'default') {
        const pseudoClass = state === 'disabled' ? '[disabled]' : `:${state}`;
        content += `.${component.name.toLowerCase()}${pseudoClass} {\n`;
        content += this.generateStateStyles(component, state, style);
        content += `}\n\n`;
      }
    });

    return {
      path: `src/components/${component.name}/${component.name}.module.css`,
      content,
      type: 'component-style'
    };
  }

  generateBaseStyles(component, style) {
    let styles = '';
    
    // Common base styles
    styles += `  display: flex;\n`;
    styles += `  align-items: center;\n`;
    styles += `  justify-content: center;\n`;
    styles += `  border: none;\n`;
    styles += `  border-radius: var(--radius-md);\n`;
    styles += `  font-family: var(--font-sans);\n`;
    styles += `  font-weight: var(--weight-medium);\n`;
    styles += `  cursor: pointer;\n`;
    styles += `  transition: all 0.2s ease-in-out;\n`;
    
    // Component-specific styles
    if (component.type === 'Button') {
      styles += `  padding: var(--spacing-sm) var(--spacing-md);\n`;
      styles += `  min-height: 2.5rem;\n`;
    } else if (component.type === 'Input') {
      styles += `  padding: var(--spacing-sm) var(--spacing-md);\n`;
      styles += `  border: 1px solid var(--color-neutral-300);\n`;
      styles += `  background-color: var(--color-neutral-50);\n`;
    }
    
    return styles;
  }

  generateVariantStyles(component, variant, style) {
    let styles = '';
    
    if (component.type === 'Button') {
      switch (variant) {
        case 'primary':
          styles += `  background-color: var(--color-primary-main);\n`;
          styles += `  color: white;\n`;
          break;
        case 'secondary':
          styles += `  background-color: var(--color-secondary-main);\n`;
          styles += `  color: white;\n`;
          break;
        case 'outline':
          styles += `  background-color: transparent;\n`;
          styles += `  border: 1px solid var(--color-primary-main);\n`;
          styles += `  color: var(--color-primary-main);\n`;
          break;
      }
    }
    
    return styles;
  }

  generateSizeStyles(component, size, style) {
    let styles = '';
    
    const sizeMap = {
      'sm': { padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--text-sm)' },
      'md': { padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: 'var(--text-base)' },
      'lg': { padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: 'var(--text-lg)' }
    };
    
    const sizeStyles = sizeMap[size];
    if (sizeStyles) {
      Object.entries(sizeStyles).forEach(([property, value]) => {
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        styles += `  ${cssProperty}: ${value};\n`;
      });
    }
    
    return styles;
  }

  generateStateStyles(component, state, style) {
    let styles = '';
    
    switch (state) {
      case 'hover':
        if (component.type === 'Button') {
          styles += `  transform: translateY(-1px);\n`;
          styles += `  box-shadow: var(--shadow-md);\n`;
        }
        break;
      case 'focus':
        styles += `  outline: 2px solid var(--color-primary-main);\n`;
        styles += `  outline-offset: 2px;\n`;
        break;
      case 'disabled':
        styles += `  opacity: 0.5;\n`;
        styles += `  cursor: not-allowed;\n`;
        break;
    }
    
    return styles;
  }

  detectStylingApproach(context) {
    // Try to detect from project dependencies or existing files
    if (context.projectContext.framework === 'Next.js') {
      return 'css-modules'; // Next.js default
    }
    
    return 'css-modules'; // Default fallback
  }

  parseStyleRequirement(requirement, requirements) {
    if (requirement.approach) {
      requirements.approach = requirement.approach;
    }
    
    if (requirement.themes) {
      requirements.themes = requirement.themes;
    }
    
    if (requirement.tokens) {
      requirements.customTokens = requirement.tokens;
    }
  }
}

module.exports = { StylingAgent };