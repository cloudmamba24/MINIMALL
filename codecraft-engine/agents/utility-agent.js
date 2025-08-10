/**
 * Utility Agent - Helper functions and utility module generation
 * 
 * Capabilities:
 * - Helper function generation (data manipulation, validation)
 * - Custom React hooks creation
 * - Business logic modules
 * - Configuration helpers and constants
 * - Type utilities and guards (TypeScript)
 * - Date/time utilities
 * - String manipulation helpers
 * - Array and object utilities
 */

const fs = require('fs');
const path = require('path');

class UtilityAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Utility';
    this.capabilities = [
      'helper_function_generation',
      'custom_hook_creation', 
      'business_logic_modules',
      'configuration_helpers',
      'type_utilities',
      'date_time_utilities',
      'string_manipulation',
      'data_structure_utilities'
    ];

    this.utilityCategories = {
      'validation': {
        functions: ['isEmail', 'isPhone', 'isURL', 'isRequired', 'isLength', 'isNumeric'],
        complexity: 'low',
        dependencies: []
      },
      'formatting': {
        functions: ['formatCurrency', 'formatDate', 'formatPhone', 'slugify', 'capitalize', 'truncate'],
        complexity: 'low',
        dependencies: []
      },
      'data-manipulation': {
        functions: ['groupBy', 'sortBy', 'filterBy', 'mapBy', 'reduceBy', 'uniqueBy'],
        complexity: 'medium',
        dependencies: []
      },
      'async-helpers': {
        functions: ['debounce', 'throttle', 'sleep', 'retry', 'timeout', 'queue'],
        complexity: 'high',
        dependencies: []
      },
      'storage': {
        functions: ['localStorage', 'sessionStorage', 'cookies', 'indexedDB'],
        complexity: 'medium',
        dependencies: []
      },
      'dom-helpers': {
        functions: ['addClass', 'removeClass', 'toggleClass', 'getElement', 'scrollTo'],
        complexity: 'low',
        dependencies: []
      }
    };

    this.reactHookPatterns = {
      'useLocalStorage': { type: 'storage', complexity: 'medium', dependencies: [] },
      'useSessionStorage': { type: 'storage', complexity: 'medium', dependencies: [] },
      'useDebounce': { type: 'performance', complexity: 'medium', dependencies: [] },
      'useThrottle': { type: 'performance', complexity: 'medium', dependencies: [] },
      'useFetch': { type: 'data-fetching', complexity: 'high', dependencies: [] },
      'useAsync': { type: 'async', complexity: 'high', dependencies: [] },
      'useToggle': { type: 'state', complexity: 'low', dependencies: [] },
      'useCounter': { type: 'state', complexity: 'low', dependencies: [] },
      'usePrevious': { type: 'state', complexity: 'low', dependencies: [] },
      'useClickOutside': { type: 'dom', complexity: 'medium', dependencies: [] },
      'useWindowSize': { type: 'dom', complexity: 'medium', dependencies: [] },
      'useKeyPress': { type: 'dom', complexity: 'medium', dependencies: [] }
    };

    this.typeUtilities = [
      'isString', 'isNumber', 'isBoolean', 'isArray', 'isObject', 'isFunction',
      'isNull', 'isUndefined', 'isDefined', 'isEmpty', 'isEqual',
      'assertString', 'assertNumber', 'assertArray', 'assertObject'
    ];
  }

  async generate(context) {
    console.log('🔧 Utility Agent: Generating helper functions and utilities...');
    
    const results = {
      files: [],
      utilities: [],
      hooks: [],
      types: [],
      metrics: {
        helpersGenerated: 0,
        hooksGenerated: 0,
        typesGenerated: 0,
        categoriesCreated: 0,
        linesOfCode: 0
      },
      exports: []
    };

    // 1. Analyze utility requirements
    const utilityRequirements = await this.analyzeUtilityRequirements(context);
    
    // 2. Generate helper functions by category
    for (const category of utilityRequirements.categories) {
      const categoryResult = await this.generateUtilityCategory(category, context);
      results.files.push(...categoryResult.files);
      results.utilities.push(...categoryResult.utilities);
      results.metrics.helpersGenerated += categoryResult.utilities.length;
      results.metrics.categoriesCreated++;
    }

    // 3. Generate React hooks
    if (utilityRequirements.hooks.length > 0) {
      for (const hookSpec of utilityRequirements.hooks) {
        const hookResult = await this.generateCustomHook(hookSpec, context);
        results.files.push(...hookResult.files);
        results.hooks.push(hookResult.hook);
        results.metrics.hooksGenerated++;
      }
    }

    // 4. Generate TypeScript utilities
    if (context.projectContext.language === 'TypeScript') {
      const typeUtilsResult = await this.generateTypeUtilities(utilityRequirements, context);
      results.files.push(...typeUtilsResult.files);
      results.types = typeUtilsResult.types;
      results.metrics.typesGenerated = typeUtilsResult.types.length;
    }

    // 5. Generate constants and configuration
    const configResult = await this.generateConfigurationHelpers(utilityRequirements, context);
    results.files.push(...configResult.files);

    // 6. Generate utility index files
    const indexFiles = await this.generateUtilityIndexes(results, context);
    results.files.push(...indexFiles);

    // 7. Generate utility tests
    if (utilityRequirements.includeTests) {
      const testResult = await this.generateUtilityTests(results, context);
      results.files.push(...testResult.files);
    }

    console.log(`✅ Utility Agent: Generated ${results.metrics.helpersGenerated} helpers, ${results.metrics.hooksGenerated} hooks, ${results.metrics.typesGenerated} type utilities`);
    
    return results;
  }

  async analyzeUtilityRequirements(context) {
    const requirements = {
      categories: ['validation', 'formatting', 'data-manipulation'],
      hooks: [],
      types: [],
      constants: [],
      includeTests: true
    };

    // Extract utility requirements from context
    if (context.requirements) {
      context.requirements.forEach(req => {
        if (req.type === 'utility' || req.category === 'helpers') {
          this.parseUtilityRequirement(req, requirements);
        }
      });
    }

    // Infer requirements from other generated components
    if (context.components) {
      requirements.hooks.push(...this.inferRequiredHooks(context.components));
    }

    if (context.endpoints) {
      requirements.categories.push('async-helpers');
      requirements.hooks.push('useFetch', 'useAsync');
    }

    return requirements;
  }

  async generateUtilityCategory(categoryName, context) {
    const category = this.utilityCategories[categoryName];
    if (!category) {
      throw new Error(`Unknown utility category: ${categoryName}`);
    }

    const utilities = [];
    const functions = [];

    // Generate each function in the category
    for (const functionName of category.functions) {
      const utilityFunction = this.generateUtilityFunction(functionName, categoryName, context);
      utilities.push(utilityFunction);
      functions.push(utilityFunction.code);
    }

    // Create category file
    const categoryFile = this.createCategoryFile(categoryName, functions, context);
    
    return {
      files: [categoryFile],
      utilities
    };
  }

  generateUtilityFunction(functionName, category, context) {
    const isTypeScript = context.projectContext.language === 'TypeScript';
    
    const functionTemplates = {
      // Validation functions
      'isEmail': {
        params: isTypeScript ? 'email: string' : 'email',
        returnType: isTypeScript ? ': boolean' : '',
        body: `  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);`
      },
      
      'isPhone': {
        params: isTypeScript ? 'phone: string' : 'phone',
        returnType: isTypeScript ? ': boolean' : '',
        body: `  const phoneRegex = /^[+]?[(]?[\\d\\s\\-()]{10,}$/;
  return phoneRegex.test(phone.replace(/\\s/g, ''));`
      },

      'isURL': {
        params: isTypeScript ? 'url: string' : 'url',
        returnType: isTypeScript ? ': boolean' : '',
        body: `  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }`
      },

      // Formatting functions
      'formatCurrency': {
        params: isTypeScript ? 'amount: number, currency = "USD", locale = "en-US"' : 'amount, currency = "USD", locale = "en-US"',
        returnType: isTypeScript ? ': string' : '',
        body: `  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);`
      },

      'formatDate': {
        params: isTypeScript ? 'date: Date | string, format = "short", locale = "en-US"' : 'date, format = "short", locale = "en-US"',
        returnType: isTypeScript ? ': string' : '',
        body: `  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { 
    dateStyle: format 
  }).format(dateObj);`
      },

      'slugify': {
        params: isTypeScript ? 'text: string' : 'text',
        returnType: isTypeScript ? ': string' : '',
        body: `  return text
    .toLowerCase()
    .trim()
    .replace(/[^\\w\\s-]/g, '')
    .replace(/[\\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');`
      },

      // Data manipulation functions
      'groupBy': {
        params: isTypeScript ? '<T>(array: T[], key: keyof T | ((item: T) => string))' : 'array, key',
        returnType: isTypeScript ? ': Record<string, T[]>' : '',
        body: `  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});`
      },

      'sortBy': {
        params: isTypeScript ? '<T>(array: T[], key: keyof T, order: "asc" | "desc" = "asc")' : 'array, key, order = "asc"',
        returnType: isTypeScript ? ': T[]' : '',
        body: `  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    const modifier = order === 'desc' ? -1 : 1;
    
    if (aVal < bVal) return -1 * modifier;
    if (aVal > bVal) return 1 * modifier;
    return 0;
  });`
      },

      // Async helpers
      'debounce': {
        params: isTypeScript ? '<T extends (...args: any[]) => any>(func: T, wait: number)' : 'func, wait',
        returnType: isTypeScript ? ': (...args: Parameters<T>) => void' : '',
        body: `  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };`
      },

      'sleep': {
        params: isTypeScript ? 'ms: number' : 'ms',
        returnType: isTypeScript ? ': Promise<void>' : '',
        body: `  return new Promise(resolve => setTimeout(resolve, ms));`
      }
    };

    const template = functionTemplates[functionName];
    if (!template) {
      // Generate a basic template
      return {
        name: functionName,
        code: `export const ${functionName} = (${isTypeScript ? '...args: any[]' : '...args'})${isTypeScript ? ': any' : ''} => {
  // TODO: Implement ${functionName}
  throw new Error('${functionName} not implemented');
};`,
        category,
        complexity: 'medium'
      };
    }

    const code = `/**
 * ${this.generateFunctionDescription(functionName, category)}
 */
export const ${functionName} = (${template.params})${template.returnType} => {
${template.body}
};`;

    return {
      name: functionName,
      code,
      category,
      complexity: this.utilityCategories[category].complexity
    };
  }

  createCategoryFile(categoryName, functions, context) {
    const isTypeScript = context.projectContext.language === 'TypeScript';
    const extension = isTypeScript ? 'ts' : 'js';
    
    let content = '';
    
    // File header
    content += `/**
 * ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Utilities
 * 
 * Collection of ${categoryName} helper functions
 */

`;

    // Add all functions
    content += functions.join('\n\n') + '\n';

    return {
      path: path.join('src/utils', `${categoryName}.${extension}`),
      content,
      type: 'utility'
    };
  }

  async generateCustomHook(hookName, context) {
    const hookPattern = this.reactHookPatterns[hookName];
    if (!hookPattern) {
      throw new Error(`Unknown hook pattern: ${hookName}`);
    }

    const isTypeScript = context.projectContext.language === 'TypeScript';
    const extension = isTypeScript ? 'ts' : 'js';
    
    const hookCode = this.generateHookCode(hookName, hookPattern, context);
    
    const hookFile = {
      path: path.join('src/hooks', `${hookName}.${extension}`),
      content: hookCode,
      type: 'hook'
    };

    return {
      files: [hookFile],
      hook: {
        name: hookName,
        type: hookPattern.type,
        complexity: hookPattern.complexity
      }
    };
  }

  generateHookCode(hookName, pattern, context) {
    const isTypeScript = context.projectContext.language === 'TypeScript';
    
    const hookTemplates = {
      'useLocalStorage': `import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage with React state
 */
export const useLocalStorage = ${isTypeScript ? '<T>' : ''}(
  key${isTypeScript ? ': string' : ''},
  initialValue${isTypeScript ? ': T' : ''}
)${isTypeScript ? ': [T, (value: T) => void]' : ''} => {
  const [storedValue, setStoredValue] = useState${isTypeScript ? '<T>' : ''}(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  const setValue = (value${isTypeScript ? ': T' : ''}) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(\`Error setting localStorage key "\${key}":\`, error);
    }
  };

  return [storedValue, setValue];
};`,

      'useDebounce': `import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 */
export const useDebounce = ${isTypeScript ? '<T>' : ''}(
  value${isTypeScript ? ': T' : ''},
  delay${isTypeScript ? ': number' : ''}
)${isTypeScript ? ': T' : ''} => {
  const [debouncedValue, setDebouncedValue] = useState${isTypeScript ? '<T>' : ''}(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};`,

      'useToggle': `import { useState, useCallback } from 'react';

/**
 * Custom hook for toggle functionality
 */
export const useToggle = (initialValue${isTypeScript ? ': boolean' : ''} = false)${isTypeScript ? ': [boolean, () => void, (value: boolean) => void]' : ''} => {
  const [value, setValue] = useState${isTypeScript ? '<boolean>' : ''}(initialValue);

  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setToggle = useCallback((newValue${isTypeScript ? ': boolean' : ''}) => setValue(newValue), []);

  return [value, toggle, setToggle];
};`,

      'useFetch': `import { useState, useEffect, useCallback } from 'react';

${isTypeScript ? `interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}` : ''}

/**
 * Custom hook for data fetching
 */
export const useFetch = ${isTypeScript ? '<T>' : ''}(
  url${isTypeScript ? ': string' : ''},
  options${isTypeScript ? '?: FetchOptions' : ''} = {}
)${isTypeScript ? ': FetchState<T> & { refetch: () => void }' : ''} => {
  const [data, setData] = useState${isTypeScript ? '<T | null>' : ''}(null);
  const [loading, setLoading] = useState${isTypeScript ? '<boolean>' : ''}(true);
  const [error, setError] = useState${isTypeScript ? '<string | null>' : ''}(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...(options.body && { body: JSON.stringify(options.body) })
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};`
    };

    return hookTemplates[hookName] || `// TODO: Implement ${hookName} hook`;
  }

  async generateTypeUtilities(requirements, context) {
    const types = [];
    let content = '';

    content += `/**
 * TypeScript Utility Types and Guards
 */

`;

    // Generate type guards
    this.typeUtilities.forEach(utilityName => {
      if (utilityName.startsWith('is')) {
        const typeGuard = this.generateTypeGuard(utilityName);
        content += typeGuard + '\n\n';
        types.push({ name: utilityName, type: 'type-guard' });
      } else if (utilityName.startsWith('assert')) {
        const assertion = this.generateTypeAssertion(utilityName);
        content += assertion + '\n\n';
        types.push({ name: utilityName, type: 'assertion' });
      }
    });

    // Generate utility types
    content += this.generateUtilityTypes();

    const typeUtilsFile = {
      path: 'src/utils/types.ts',
      content,
      type: 'type-utility'
    };

    return {
      files: [typeUtilsFile],
      types
    };
  }

  generateTypeGuard(guardName) {
    const typeGuards = {
      'isString': `export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};`,
      
      'isNumber': `export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};`,
      
      'isArray': `export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};`,
      
      'isObject': `export const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};`
    };

    return typeGuards[guardName] || `export const ${guardName} = (value: unknown): boolean => {
  // TODO: Implement ${guardName}
  return false;
};`;
  }

  generateUtilityTypes() {
    return `// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type NonEmptyArray<T> = [T, ...T[]];
export type Prettify<T> = { [K in keyof T]: T[K] } & {};`;
  }

  // Utility methods
  generateFunctionDescription(functionName, category) {
    const descriptions = {
      'isEmail': 'Validates if a string is a valid email address',
      'isPhone': 'Validates if a string is a valid phone number',
      'formatCurrency': 'Formats a number as currency',
      'formatDate': 'Formats a date using Intl.DateTimeFormat',
      'slugify': 'Converts a string to a URL-friendly slug',
      'groupBy': 'Groups array elements by a specified key',
      'debounce': 'Creates a debounced version of a function'
    };
    
    return descriptions[functionName] || `${category} utility function`;
  }

  inferRequiredHooks(components) {
    const hooks = [];
    
    components.forEach(component => {
      if (component.state) {
        hooks.push('useToggle', 'useLocalStorage');
      }
      if (component.events && component.events.includes('debounced')) {
        hooks.push('useDebounce');
      }
      if (component.type === 'Form') {
        hooks.push('useLocalStorage');
      }
    });
    
    return [...new Set(hooks)];
  }

  parseUtilityRequirement(requirement, requirements) {
    if (requirement.categories) {
      requirements.categories.push(...requirement.categories);
    }
    
    if (requirement.hooks) {
      requirements.hooks.push(...requirement.hooks);
    }
    
    if (requirement.functions) {
      requirement.functions.forEach(func => {
        const category = this.categorizeFunction(func);
        if (!requirements.categories.includes(category)) {
          requirements.categories.push(category);
        }
      });
    }
  }

  categorizeFunction(functionName) {
    if (functionName.startsWith('is') || functionName.includes('valid')) {
      return 'validation';
    } else if (functionName.includes('format') || functionName.includes('parse')) {
      return 'formatting';
    } else if (['group', 'sort', 'filter', 'map', 'reduce'].some(word => functionName.includes(word))) {
      return 'data-manipulation';
    } else if (['debounce', 'throttle', 'delay', 'timeout'].some(word => functionName.includes(word))) {
      return 'async-helpers';
    }
    
    return 'general';
  }
}

module.exports = { UtilityAgent };