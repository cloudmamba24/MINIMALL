/**
 * Type-safe utility functions for handling exactOptionalPropertyTypes
 */

/**
 * Creates an object with only defined properties, avoiding undefined assignments to optional props
 */
export function conditionalProps<T extends Record<string, unknown>>(props: T): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== null) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

/**
 * Safe property assignment that converts null to undefined for optional properties
 */
export function safeOptionalProp<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Safe array access that handles potentially undefined elements
 */
export function safeArrayAccess<T>(array: T[], index: number): T | undefined {
  return index >= 0 && index < array.length ? array[index] : undefined;
}

/**
 * Safe object property access with fallback
 */
export function safeProp<T, K extends keyof T>(
  obj: T | undefined,
  key: K,
  fallback?: T[K]
): T[K] | undefined {
  return obj?.[key] ?? fallback;
}

/**
 * Creates UTM parameters object with only defined values
 */
export function createUTMParams(searchParams: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {};

  const utmFields = [
    { key: "source", param: "utm_source" },
    { key: "medium", param: "utm_medium" },
    { key: "campaign", param: "utm_campaign" },
    { key: "term", param: "utm_term" },
    { key: "content", param: "utm_content" },
  ];

  utmFields.forEach(({ key, param }) => {
    const value = searchParams.get(param);
    if (value) {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Creates attribution data object with only defined values
 */
export function createAttributionData(input: {
  configId: string;
  categoryId?: string | undefined;
  itemId?: string | undefined;
  [key: string]: unknown;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {
    configId: input.configId,
  };

  // Only add properties that have actual values
  Object.entries(input).forEach(([key, value]) => {
    if (key !== "configId" && value !== undefined && value !== null && value !== "") {
      result[key] = value as unknown;
    }
  });

  return result;
}
