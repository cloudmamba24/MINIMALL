/**
 * Type-safe utility functions for handling exactOptionalPropertyTypes in Admin App
 */

/**
 * Creates an object with only defined properties, avoiding undefined assignments to optional props
 */
export function conditionalProps<T extends Record<string, any>>(props: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== null) {
      (result as any)[key] = value;
    }
  }
  
  return result;
}

/**
 * Safe array access that handles potentially undefined elements
 */
export function safeArrayAccess<T>(array: T[], index: number): T | undefined {
  return index >= 0 && index < array.length ? array[index] : undefined;
}

/**
 * Safe property assignment that converts null to undefined for optional properties
 */
export function safeOptionalProp<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Safe object property access with fallback
 */
export function safeProp<T, K extends keyof T>(obj: T | undefined, key: K, fallback?: T[K]): T[K] | undefined {
  return obj?.[key] ?? fallback;
}

/**
 * Creates a filtered object with only truthy values for optional properties
 */
export function filterDefinedProps<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      (result as any)[key] = value;
    }
  });
  
  return result;
}