import { type RenderOptions, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type ReactElement, type ReactNode } from 'react';

/**
 * Test helper utilities
 */

/**
 * Custom render with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
) {
  const AllProviders = ({ children }: { children: ReactNode }) => {
    // Add your providers here (Redux, Router, Theme, etc.)
    return React.createElement(React.Fragment, null, children);
  };

  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Setup user event
 */
export function setupUser() {
  return userEvent.setup();
}

/**
 * Wait for async operations
 */
export async function waitFor(ms = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create mock FormData
 */
export function createMockFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}

/**
 * Create mock File
 */
export function createMockFile(
  name = 'test.jpg',
  size = 1024,
  type = 'image/jpeg'
): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

/**
 * Mock localStorage
 */
export class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

/**
 * Mock sessionStorage
 */
export class SessionStorageMock extends LocalStorageMock {}

/**
 * Assert API response
 */
export function assertApiResponse(
  response: any,
  expectedStatus = 200
) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get('content-type')).toContain('application/json');
}

/**
 * Create mock webhook signature
 */
export function createWebhookSignature(
  body: string,
  secret = 'test-webhook-secret'
): string {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
}

/**
 * Mock date
 */
export function mockDate(date: Date | string): () => void {
  const originalDate = global.Date;
  const mockDate = new Date(date);
  
  global.Date = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(mockDate.getTime());
      } else {
        // @ts-ignore - spread args to super
        super(...args);
      }
    }
    
    static now() {
      return mockDate.getTime();
    }
  } as any;
  
  return () => {
    global.Date = originalDate;
  };
}