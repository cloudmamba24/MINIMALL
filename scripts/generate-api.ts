#!/usr/bin/env tsx
/**
 * API Route Generator Script
 * Generates a new Next.js API route with TypeScript types and documentation
 * 
 * Usage: npx tsx scripts/generate-api.ts route-name [app]
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const routeName = process.argv[2];
const appName = process.argv[3] || 'admin'; // Default to admin app

if (!routeName) {
  console.error('❌ Please provide a route name');
  console.log('Usage: npx tsx scripts/generate-api.ts route-name [app]');
  console.log('Examples:');
  console.log('  npx tsx scripts/generate-api.ts users');
  console.log('  npx tsx scripts/generate-api.ts configs/publish admin');
  process.exit(1);
}

// Validate route name
if (!/^[a-z0-9\/-]+$/.test(routeName)) {
  console.error('❌ Route name must be lowercase with hyphens and slashes only');
  process.exit(1);
}

const apps = {
  admin: 'apps/admin',
  public: 'apps/public'
};

if (!apps[appName as keyof typeof apps]) {
  console.error(`❌ Invalid app. Choose from: ${Object.keys(apps).join(', ')}`);
  process.exit(1);
}

const basePath = apps[appName as keyof typeof apps];
const apiDir = join(process.cwd(), basePath, 'src/pages/api', routeName);
const routeDir = dirname(apiDir);
const routeFile = `${apiDir}.ts`;

// Ensure directory exists
if (!existsSync(routeDir)) {
  mkdirSync(routeDir, { recursive: true });
}

console.log(`🚀 Generating API route /${routeName} in ${appName} app`);

// Extract route segments for naming
const routeSegments = routeName.split('/');
const resourceName = routeSegments[routeSegments.length - 1];
const capitalizedResource = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

// 1. Generate API route file
const apiCode = `import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { captureException } from '@sentry/nextjs';

// Request/Response schemas
const ${capitalizedResource}QuerySchema = z.object({
  id: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
});

const ${capitalizedResource}BodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ${capitalizedResource}Query = z.infer<typeof ${capitalizedResource}QuerySchema>;
type ${capitalizedResource}Body = z.infer<typeof ${capitalizedResource}BodySchema>;

interface ${capitalizedResource}Response {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * API Route: /${routeName}
 * 
 * @description Handles ${resourceName} operations
 * @methods GET, POST, PUT, DELETE
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<${capitalizedResource}Response>
) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          error: \`Method \${req.method} not allowed\`,
        });
    }
  } catch (error) {
    console.error('API Error in /${routeName}:', error);
    
    // Report to Sentry
    captureException(error, {
      tags: {
        api_route: '/${routeName}',
        method: req.method,
      },
      extra: {
        query: req.query,
        body: req.body,
      },
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Handle GET requests
 * Retrieve ${resourceName} data with optional filtering
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<${capitalizedResource}Response>
) {
  try {
    // Validate query parameters
    const query = ${capitalizedResource}QuerySchema.parse(req.query);
    
    // TODO: Implement database query
    const mockData = {
      items: [
        {
          id: '1',
          name: 'Sample ${capitalizedResource}',
          description: 'This is a sample ${resourceName}',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      limit: query.limit,
      offset: query.offset,
    };

    return res.status(200).json({
      success: true,
      data: mockData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        data: error.errors,
      });
    }
    throw error;
  }
}

/**
 * Handle POST requests
 * Create new ${resourceName}
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<${capitalizedResource}Response>
) {
  try {
    // Validate request body
    const body = ${capitalizedResource}BodySchema.parse(req.body);
    
    // TODO: Implement database creation
    const mockCreated = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      data: mockCreated,
      message: '${capitalizedResource} created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        data: error.errors,
      });
    }
    throw error;
  }
}

/**
 * Handle PUT requests
 * Update existing ${resourceName}
 */
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<${capitalizedResource}Response>
) {
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: '${capitalizedResource} ID is required',
      });
    }

    // Validate request body
    const body = ${capitalizedResource}BodySchema.partial().parse(req.body);
    
    // TODO: Implement database update
    const mockUpdated = {
      id,
      name: 'Updated ${capitalizedResource}',
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: mockUpdated,
      message: '${capitalizedResource} updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        data: error.errors,
      });
    }
    throw error;
  }
}

/**
 * Handle DELETE requests
 * Delete ${resourceName}
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<${capitalizedResource}Response>
) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: '${capitalizedResource} ID is required',
    });
  }

  // TODO: Implement database deletion
  // const deleted = await db.delete(id);

  return res.status(200).json({
    success: true,
    message: '${capitalizedResource} deleted successfully',
  });
}
`;

writeFileSync(routeFile, apiCode);

// 2. Generate TypeScript types file
const typesCode = `/**
 * Types for /${routeName} API route
 */

export interface ${capitalizedResource} {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ${capitalizedResource}CreateRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface ${capitalizedResource}UpdateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ${capitalizedResource}Query {
  id?: string;
  limit?: number;
  offset?: number;
}

export interface ${capitalizedResource}ListResponse {
  success: boolean;
  data: {
    items: ${capitalizedResource}[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ${capitalizedResource}Response {
  success: boolean;
  data?: ${capitalizedResource};
  error?: string;
  message?: string;
}

export interface ${capitalizedResource}ErrorResponse {
  success: false;
  error: string;
  data?: any;
}
`;

const typesDir = join(process.cwd(), basePath, 'src/types/api');
if (!existsSync(typesDir)) {
  mkdirSync(typesDir, { recursive: true });
}

writeFileSync(join(typesDir, `${resourceName}.ts`), typesCode);

// 3. Generate test file
const testCode = `import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/${routeName}';

describe('/${routeName} API route', () => {
  describe('GET /${routeName}', () => {
    it('returns ${resourceName} list successfully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '10',
          offset: '0',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.items).toBeInstanceOf(Array);
    });

    it('validates query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: 'invalid',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('POST /${routeName}', () => {
    it('creates ${resourceName} successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test ${capitalizedResource}',
          description: 'Test description',
          isActive: true,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Test ${capitalizedResource}');
      expect(data.message).toBe('${capitalizedResource} created successfully');
    });

    it('validates request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required name field
          description: 'Test description',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });
  });

  describe('PUT /${routeName}', () => {
    it('updates ${resourceName} successfully', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'test-id' },
        body: {
          name: 'Updated ${capitalizedResource}',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toBe('${capitalizedResource} updated successfully');
    });

    it('requires ID parameter', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: { name: 'Updated Name' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('${capitalizedResource} ID is required');
    });
  });

  describe('DELETE /${routeName}', () => {
    it('deletes ${resourceName} successfully', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'test-id' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toBe('${capitalizedResource} deleted successfully');
    });

    it('requires ID parameter', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('${capitalizedResource} ID is required');
    });
  });

  it('returns 405 for unsupported methods', async () => {
    const { req, res } = createMocks({
      method: 'PATCH',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getHeaders().allow).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
  });
});
`;

const testDir = join(process.cwd(), basePath, 'src/__tests__/api');
const testSubDir = join(testDir, ...routeSegments.slice(0, -1));

if (!existsSync(testSubDir)) {
  mkdirSync(testSubDir, { recursive: true });
}

writeFileSync(join(testDir, `${routeName.replace('/', '-')}.test.ts`), testCode);

// 4. Generate client SDK helper
const clientCode = `/**
 * Client SDK for /${routeName} API
 */

import type {
  ${capitalizedResource},
  ${capitalizedResource}CreateRequest,
  ${capitalizedResource}UpdateRequest,
  ${capitalizedResource}Query,
  ${capitalizedResource}ListResponse,
  ${capitalizedResource}Response,
} from '../types/api/${resourceName}';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://${appName}.minimall.com'
  : \`http://localhost:\${${appName === 'admin' ? '3001' : '3000'}}\`;

class ${capitalizedResource}API {
  private baseUrl = \`\${API_BASE}/api/${routeName}\`;

  /**
   * Get ${resourceName} list
   */
  async list(query?: ${capitalizedResource}Query): Promise<${capitalizedResource}ListResponse> {
    const params = new URLSearchParams();
    if (query?.id) params.append('id', query.id);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await fetch(\`\${this.baseUrl}?\${params}\`);
    
    if (!response.ok) {
      throw new Error(\`Failed to fetch ${resourceName} list: \${response.statusText}\`);
    }
    
    return response.json();
  }

  /**
   * Create new ${resourceName}
   */
  async create(data: ${capitalizedResource}CreateRequest): Promise<${capitalizedResource}Response> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(\`Failed to create ${resourceName}: \${response.statusText}\`);
    }
    
    return response.json();
  }

  /**
   * Update existing ${resourceName}
   */
  async update(id: string, data: ${capitalizedResource}UpdateRequest): Promise<${capitalizedResource}Response> {
    const response = await fetch(\`\${this.baseUrl}?id=\${id}\`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(\`Failed to update ${resourceName}: \${response.statusText}\`);
    }
    
    return response.json();
  }

  /**
   * Delete ${resourceName}
   */
  async delete(id: string): Promise<${capitalizedResource}Response> {
    const response = await fetch(\`\${this.baseUrl}?id=\${id}\`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(\`Failed to delete ${resourceName}: \${response.statusText}\`);
    }
    
    return response.json();
  }
}

// Export singleton instance
export const ${resourceName}API = new ${capitalizedResource}API();

// Export for custom instances
export { ${capitalizedResource}API };
`;

const clientDir = join(process.cwd(), basePath, 'src/lib/api');
if (!existsSync(clientDir)) {
  mkdirSync(clientDir, { recursive: true });
}

writeFileSync(join(clientDir, `${resourceName}.ts`), clientCode);

console.log('✅ API route generation complete!');
console.log(`
Generated files:
- ${basePath}/src/pages/api/${routeName}.ts (API route)
- ${basePath}/src/types/api/${resourceName}.ts (TypeScript types)
- ${basePath}/src/__tests__/api/${routeName.replace('/', '-')}.test.ts (Tests)
- ${basePath}/src/lib/api/${resourceName}.ts (Client SDK)

Next steps:
1. Replace TODO comments with actual database operations
2. Update the mock data with your actual data structure
3. Add database schema and migrations if needed
4. Run tests: npm test ${routeName}
5. Test the API: curl http://localhost:${appName === 'admin' ? '3001' : '3000'}/api/${routeName}

API Endpoints:
- GET    /api/${routeName}     - List ${resourceName}s
- POST   /api/${routeName}     - Create ${resourceName}
- PUT    /api/${routeName}?id=X - Update ${resourceName}
- DELETE /api/${routeName}?id=X - Delete ${resourceName}

Usage in components:
import { ${resourceName}API } from '../lib/api/${resourceName}';
const data = await ${resourceName}API.list();
`);

export {};