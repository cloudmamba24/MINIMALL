/**
 * API Agent - Advanced REST API and GraphQL generation
 * 
 * Capabilities:
 * - REST API endpoint generation (Express.js, Next.js API routes)
 * - GraphQL schema and resolver generation
 * - Authentication and authorization middleware
 * - Input validation and error handling
 * - API documentation generation (OpenAPI/Swagger)
 * - Rate limiting and security middleware
 * - Database integration and ORM queries
 * - API testing and mock generation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ApiAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'API';
    this.capabilities = [
      'rest_api_generation',
      'graphql_schema_generation',
      'authentication_middleware',
      'input_validation',
      'error_handling',
      'api_documentation',
      'security_middleware',
      'database_integration'
    ];
    
    this.apiPatterns = {
      'rest': {
        framework: 'express',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        middleware: ['cors', 'helmet', 'rate-limiting', 'compression'],
        authentication: ['jwt', 'oauth', 'api-key', 'session']
      },
      'graphql': {
        framework: 'apollo-server',
        features: ['queries', 'mutations', 'subscriptions', 'schema-stitching'],
        middleware: ['authentication', 'authorization', 'caching', 'complexity-analysis'],
        tools: ['dataloader', 'federation', 'code-generation']
      },
      'nextjs': {
        framework: 'next.js',
        features: ['api-routes', 'middleware', 'edge-functions'],
        patterns: ['page-based', 'app-directory'],
        deployment: ['vercel', 'serverless']
      }
    };

    this.securityFeatures = [
      'input_sanitization',
      'sql_injection_prevention', 
      'xss_protection',
      'csrf_protection',
      'rate_limiting',
      'cors_configuration',
      'helmet_security_headers',
      'jwt_validation',
      'role_based_access',
      'api_key_management'
    ];

    this.validationLibraries = {
      'joi': {
        strength: 'high',
        features: ['schema_validation', 'custom_validators', 'internationalization'],
        typescript: true
      },
      'zod': {
        strength: 'high',
        features: ['type_inference', 'schema_composition', 'transforms'],
        typescript: true
      },
      'yup': {
        strength: 'medium',
        features: ['object_validation', 'async_validation', 'conditional_validation'],
        typescript: true
      },
      'express-validator': {
        strength: 'medium',
        features: ['middleware_based', 'sanitization', 'custom_validators'],
        typescript: false
      }
    };

    this.responsePatterns = {
      success: {
        structure: { success: true, data: {}, message: '' },
        codes: [200, 201, 202, 204]
      },
      error: {
        structure: { success: false, error: {}, message: '', code: '' },
        codes: [400, 401, 403, 404, 422, 429, 500]
      },
      paginated: {
        structure: { success: true, data: [], pagination: {}, meta: {} },
        codes: [200]
      }
    };
  }

  async generate(context) {
    console.log('🔌 API Agent: Generating API endpoints and services...');
    
    const results = {
      files: [],
      endpoints: [],
      schemas: [],
      middleware: [],
      metrics: {
        endpointsGenerated: 0,
        middlewareCreated: 0,
        schemasGenerated: 0,
        testsGenerated: 0,
        linesOfCode: 0
      },
      dependencies: [],
      documentation: []
    };

    // 1. Analyze API requirements
    const apiRequirements = await this.analyzeApiRequirements(context);
    
    // 2. Plan API architecture
    const apiArchitecture = await this.planApiArchitecture(apiRequirements, context);
    
    // 3. Generate API structure
    const structureFiles = await this.generateApiStructure(apiArchitecture, context);
    results.files.push(...structureFiles);

    // 4. Generate endpoints
    for (const endpointSpec of apiArchitecture.endpoints) {
      try {
        const endpointResult = await this.generateEndpoint(endpointSpec, context);
        results.files.push(...endpointResult.files);
        results.endpoints.push(endpointResult.endpoint);
        results.metrics.endpointsGenerated++;
        results.metrics.linesOfCode += endpointResult.linesOfCode;
        
        // Generate tests for endpoints
        if (endpointSpec.includeTests) {
          const testResult = await this.generateEndpointTests(endpointSpec, context);
          results.files.push(...testResult.files);
          results.metrics.testsGenerated++;
        }
        
      } catch (error) {
        console.warn(`Failed to generate endpoint ${endpointSpec.path}:`, error.message);
      }
    }

    // 5. Generate middleware
    for (const middlewareSpec of apiArchitecture.middleware) {
      const middlewareResult = await this.generateMiddleware(middlewareSpec, context);
      results.files.push(...middlewareResult.files);
      results.middleware.push(middlewareResult.middleware);
      results.metrics.middlewareCreated++;
    }

    // 6. Generate GraphQL schema if needed
    if (apiArchitecture.graphql) {
      const graphqlResult = await this.generateGraphQLSchema(apiArchitecture.graphql, context);
      results.files.push(...graphqlResult.files);
      results.schemas = graphqlResult.schemas;
      results.metrics.schemasGenerated = graphqlResult.schemas.length;
    }

    // 7. Generate API documentation
    const documentationResult = await this.generateApiDocumentation(apiArchitecture, results, context);
    results.files.push(...documentationResult.files);
    results.documentation = documentationResult.documentation;

    // 8. Generate configuration files
    const configFiles = await this.generateConfigurationFiles(apiArchitecture, context);
    results.files.push(...configFiles);

    console.log(`✅ API Agent: Generated ${results.metrics.endpointsGenerated} endpoints and ${results.metrics.middlewareCreated} middleware`);
    
    return results;
  }

  async analyzeApiRequirements(context) {
    const requirements = {
      type: 'rest', // default
      framework: 'express',
      authentication: false,
      database: false,
      endpoints: [],
      middleware: [],
      validation: 'joi',
      documentation: true,
      testing: true
    };

    // Extract API requirements from context
    if (context.requirements) {
      context.requirements.forEach(req => {
        if (req.type === 'api' || req.category === 'backend') {
          this.parseApiRequirement(req, requirements);
        }
      });
    }

    // Detect existing API patterns
    requirements.existingPatterns = await this.detectExistingApiPatterns(context);
    
    // Determine framework based on project context
    requirements.framework = this.determineFramework(context);
    
    return requirements;
  }

  parseApiRequirement(requirement, requirements) {
    // Parse endpoint specifications
    if (requirement.endpoints) {
      requirement.endpoints.forEach(endpoint => {
        requirements.endpoints.push(this.parseEndpointSpec(endpoint));
      });
    }

    // Parse authentication requirements
    if (requirement.auth || requirement.authentication) {
      requirements.authentication = {
        type: requirement.auth?.type || 'jwt',
        provider: requirement.auth?.provider || 'local',
        roles: requirement.auth?.roles || false,
        permissions: requirement.auth?.permissions || false
      };
    }

    // Parse database requirements
    if (requirement.database) {
      requirements.database = {
        type: requirement.database.type || 'postgresql',
        orm: requirement.database.orm || 'prisma',
        migrations: requirement.database.migrations !== false
      };
    }

    // Parse validation requirements
    if (requirement.validation) {
      requirements.validation = requirement.validation.library || 'joi';
    }
  }

  parseEndpointSpec(endpoint) {
    return {
      path: endpoint.path || endpoint.route,
      method: endpoint.method?.toUpperCase() || 'GET',
      handler: endpoint.handler || this.generateHandlerName(endpoint.path, endpoint.method),
      validation: endpoint.validation || null,
      authentication: endpoint.auth !== false,
      authorization: endpoint.roles || endpoint.permissions || null,
      rateLimit: endpoint.rateLimit || null,
      cache: endpoint.cache || null,
      description: endpoint.description || '',
      parameters: endpoint.params || endpoint.parameters || [],
      requestBody: endpoint.body || endpoint.request || null,
      responses: endpoint.responses || this.getDefaultResponses(endpoint.method),
      includeTests: endpoint.tests !== false
    };
  }

  async planApiArchitecture(requirements, context) {
    const architecture = {
      framework: requirements.framework,
      structure: this.planDirectoryStructure(requirements, context),
      endpoints: requirements.endpoints,
      middleware: this.planMiddleware(requirements),
      database: requirements.database,
      authentication: requirements.authentication,
      validation: requirements.validation,
      documentation: requirements.documentation,
      graphql: this.shouldIncludeGraphQL(requirements) ? this.planGraphQLSchema(requirements) : null
    };

    return architecture;
  }

  planDirectoryStructure(requirements, context) {
    const baseDir = context.architecture?.apiPath || 'src/api';
    
    return {
      base: baseDir,
      routes: path.join(baseDir, 'routes'),
      controllers: path.join(baseDir, 'controllers'),
      middleware: path.join(baseDir, 'middleware'),
      validators: path.join(baseDir, 'validators'),
      services: path.join(baseDir, 'services'),
      models: path.join(baseDir, 'models'),
      utils: path.join(baseDir, 'utils'),
      tests: path.join(baseDir, '__tests__'),
      docs: path.join(baseDir, 'docs')
    };
  }

  planMiddleware(requirements) {
    const middleware = [];
    
    // Always include basic middleware
    middleware.push({
      name: 'cors',
      type: 'security',
      config: { origin: true, credentials: true }
    });
    
    middleware.push({
      name: 'helmet',
      type: 'security',
      config: { contentSecurityPolicy: false }
    });
    
    middleware.push({
      name: 'compression',
      type: 'performance',
      config: {}
    });

    // Authentication middleware
    if (requirements.authentication) {
      middleware.push({
        name: 'authentication',
        type: 'auth',
        config: requirements.authentication
      });
    }

    // Rate limiting
    middleware.push({
      name: 'rateLimit',
      type: 'security',
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    });

    // Request validation middleware
    if (requirements.validation) {
      middleware.push({
        name: 'validation',
        type: 'validation',
        config: { library: requirements.validation }
      });
    }

    return middleware;
  }

  async generateApiStructure(architecture, context) {
    const files = [];
    
    // Generate main server file
    const serverFile = await this.generateServerFile(architecture, context);
    files.push(serverFile);
    
    // Generate app configuration
    const appFile = await this.generateAppFile(architecture, context);
    files.push(appFile);
    
    // Generate route index
    const routeIndexFile = await this.generateRouteIndex(architecture, context);
    files.push(routeIndexFile);
    
    return files;
  }

  async generateServerFile(architecture, context) {
    let content = '';
    
    // Imports
    content += `const express = require('express');\n`;
    content += `const cors = require('cors');\n`;
    content += `const helmet = require('helmet');\n`;
    content += `const compression = require('compression');\n`;
    if (architecture.authentication) {
      content += `const jwt = require('jsonwebtoken');\n`;
    }
    content += `const rateLimit = require('express-rate-limit');\n`;
    content += `\nconst app = express();\n`;
    content += `const PORT = process.env.PORT || 3000;\n\n`;

    // Middleware setup
    content += `// Security middleware\n`;
    content += `app.use(helmet());\n`;
    content += `app.use(cors());\n`;
    content += `app.use(compression());\n\n`;
    
    content += `// Rate limiting\n`;
    content += `const limiter = rateLimit({\n`;
    content += `  windowMs: 15 * 60 * 1000, // 15 minutes\n`;
    content += `  max: 100 // limit each IP to 100 requests per windowMs\n`;
    content += `});\n`;
    content += `app.use(limiter);\n\n`;
    
    content += `// Body parsing\n`;
    content += `app.use(express.json({ limit: '10mb' }));\n`;
    content += `app.use(express.urlencoded({ extended: true }));\n\n`;

    // Routes
    content += `// Routes\n`;
    content += `app.use('/api', require('./routes'));\n\n`;
    
    // Error handling
    content += `// Error handling middleware\n`;
    content += `app.use((err, req, res, next) => {\n`;
    content += `  console.error(err.stack);\n`;
    content += `  res.status(500).json({\n`;
    content += `    success: false,\n`;
    content += `    message: 'Internal server error',\n`;
    content += `    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'\n`;
    content += `  });\n`;
    content += `});\n\n`;
    
    // Start server
    content += `// Start server\n`;
    content += `app.listen(PORT, () => {\n`;
    content += `  console.log(\`🚀 Server running on port \${PORT}\`);\n`;
    content += `});\n\n`;
    content += `module.exports = app;\n`;
    
    return {
      path: path.join(architecture.structure.base, 'server.js'),
      content,
      type: 'server'
    };
  }

  async generateEndpoint(endpointSpec, context) {
    const endpointResult = {
      endpoint: endpointSpec,
      files: [],
      linesOfCode: 0
    };

    // Generate controller
    const controllerFile = await this.generateController(endpointSpec, context);
    endpointResult.files.push(controllerFile);
    endpointResult.linesOfCode += this.countLines(controllerFile.content);

    // Generate route
    const routeFile = await this.generateRoute(endpointSpec, context);
    endpointResult.files.push(routeFile);
    endpointResult.linesOfCode += this.countLines(routeFile.content);

    // Generate validation schema if needed
    if (endpointSpec.validation) {
      const validatorFile = await this.generateValidator(endpointSpec, context);
      endpointResult.files.push(validatorFile);
      endpointResult.linesOfCode += this.countLines(validatorFile.content);
    }

    return endpointResult;
  }

  async generateController(endpointSpec, context) {
    const controllerName = this.getControllerName(endpointSpec.path);
    
    let content = '';
    
    // Imports
    content += `const { validationResult } = require('express-validator');\n`;
    if (context.database) {
      content += `const { ${this.getModelName(endpointSpec.path)} } = require('../models');\n`;
    }
    content += `\n`;
    
    // Controller function
    content += `const ${endpointSpec.handler} = async (req, res) => {\n`;
    content += `  try {\n`;
    
    // Validation check
    if (endpointSpec.validation) {
      content += `    const errors = validationResult(req);\n`;
      content += `    if (!errors.isEmpty()) {\n`;
      content += `      return res.status(400).json({\n`;
      content += `        success: false,\n`;
      content += `        message: 'Validation failed',\n`;
      content += `        errors: errors.array()\n`;
      content += `      });\n`;
      content += `    }\n\n`;
    }
    
    // Main logic based on method
    content += this.generateControllerLogic(endpointSpec, context);
    
    content += `  } catch (error) {\n`;
    content += `    console.error('Controller error:', error);\n`;
    content += `    res.status(500).json({\n`;
    content += `      success: false,\n`;
    content += `      message: 'Internal server error'\n`;
    content += `    });\n`;
    content += `  }\n`;
    content += `};\n\n`;
    
    content += `module.exports = { ${endpointSpec.handler} };\n`;
    
    return {
      path: path.join(context.architecture?.structure?.controllers || 'src/api/controllers', `${controllerName}.js`),
      content,
      type: 'controller'
    };
  }

  generateControllerLogic(endpointSpec, context) {
    let logic = '';
    
    switch (endpointSpec.method) {
      case 'GET':
        if (endpointSpec.path.includes(':id')) {
          // Get single item
          logic += `    const { id } = req.params;\n`;
          logic += `    const item = await ${this.getModelName(endpointSpec.path)}.findByPk(id);\n`;
          logic += `    \n`;
          logic += `    if (!item) {\n`;
          logic += `      return res.status(404).json({\n`;
          logic += `        success: false,\n`;
          logic += `        message: 'Item not found'\n`;
          logic += `      });\n`;
          logic += `    }\n`;
          logic += `    \n`;
          logic += `    res.json({\n`;
          logic += `      success: true,\n`;
          logic += `      data: item\n`;
          logic += `    });\n`;
        } else {
          // Get list
          logic += `    const { page = 1, limit = 10, ...filters } = req.query;\n`;
          logic += `    const offset = (page - 1) * limit;\n`;
          logic += `    \n`;
          logic += `    const { count, rows } = await ${this.getModelName(endpointSpec.path)}.findAndCountAll({\n`;
          logic += `      where: filters,\n`;
          logic += `      limit: parseInt(limit),\n`;
          logic += `      offset: parseInt(offset)\n`;
          logic += `    });\n`;
          logic += `    \n`;
          logic += `    res.json({\n`;
          logic += `      success: true,\n`;
          logic += `      data: rows,\n`;
          logic += `      pagination: {\n`;
          logic += `        page: parseInt(page),\n`;
          logic += `        limit: parseInt(limit),\n`;
          logic += `        total: count,\n`;
          logic += `        pages: Math.ceil(count / limit)\n`;
          logic += `      }\n`;
          logic += `    });\n`;
        }
        break;
        
      case 'POST':
        logic += `    const data = req.body;\n`;
        logic += `    const item = await ${this.getModelName(endpointSpec.path)}.create(data);\n`;
        logic += `    \n`;
        logic += `    res.status(201).json({\n`;
        logic += `      success: true,\n`;
        logic += `      data: item,\n`;
        logic += `      message: 'Item created successfully'\n`;
        logic += `    });\n`;
        break;
        
      case 'PUT':
      case 'PATCH':
        logic += `    const { id } = req.params;\n`;
        logic += `    const data = req.body;\n`;
        logic += `    \n`;
        logic += `    const [updatedCount] = await ${this.getModelName(endpointSpec.path)}.update(data, {\n`;
        logic += `      where: { id }\n`;
        logic += `    });\n`;
        logic += `    \n`;
        logic += `    if (updatedCount === 0) {\n`;
        logic += `      return res.status(404).json({\n`;
        logic += `        success: false,\n`;
        logic += `        message: 'Item not found'\n`;
        logic += `      });\n`;
        logic += `    }\n`;
        logic += `    \n`;
        logic += `    const item = await ${this.getModelName(endpointSpec.path)}.findByPk(id);\n`;
        logic += `    res.json({\n`;
        logic += `      success: true,\n`;
        logic += `      data: item,\n`;
        logic += `      message: 'Item updated successfully'\n`;
        logic += `    });\n`;
        break;
        
      case 'DELETE':
        logic += `    const { id } = req.params;\n`;
        logic += `    \n`;
        logic += `    const deletedCount = await ${this.getModelName(endpointSpec.path)}.destroy({\n`;
        logic += `      where: { id }\n`;
        logic += `    });\n`;
        logic += `    \n`;
        logic += `    if (deletedCount === 0) {\n`;
        logic += `      return res.status(404).json({\n`;
        logic += `        success: false,\n`;
        logic += `        message: 'Item not found'\n`;
        logic += `      });\n`;
        logic += `    }\n`;
        logic += `    \n`;
        logic += `    res.json({\n`;
        logic += `      success: true,\n`;
        logic += `      message: 'Item deleted successfully'\n`;
        logic += `    });\n`;
        break;
        
      default:
        logic += `    // TODO: Implement ${endpointSpec.method} logic\n`;
        logic += `    res.json({\n`;
        logic += `      success: true,\n`;
        logic += `      message: 'Endpoint implemented successfully'\n`;
        logic += `    });\n`;
    }
    
    return logic;
  }

  async generateMiddleware(middlewareSpec, context) {
    const middlewareResult = {
      middleware: middlewareSpec,
      files: []
    };
    
    let content = '';
    
    switch (middlewareSpec.name) {
      case 'authentication':
        content = this.generateAuthenticationMiddleware(middlewareSpec.config);
        break;
      case 'validation':
        content = this.generateValidationMiddleware(middlewareSpec.config);
        break;
      case 'rateLimit':
        content = this.generateRateLimitMiddleware(middlewareSpec.config);
        break;
      default:
        content = this.generateGenericMiddleware(middlewareSpec);
    }
    
    const middlewareFile = {
      path: path.join(context.architecture?.structure?.middleware || 'src/api/middleware', `${middlewareSpec.name}.js`),
      content,
      type: 'middleware'
    };
    
    middlewareResult.files.push(middlewareFile);
    
    return middlewareResult;
  }

  generateAuthenticationMiddleware(config) {
    let content = '';
    
    content += `const jwt = require('jsonwebtoken');\n\n`;
    
    content += `const authenticateToken = (req, res, next) => {\n`;
    content += `  const authHeader = req.headers['authorization'];\n`;
    content += `  const token = authHeader && authHeader.split(' ')[1];\n\n`;
    
    content += `  if (!token) {\n`;
    content += `    return res.status(401).json({\n`;
    content += `      success: false,\n`;
    content += `      message: 'Access token required'\n`;
    content += `    });\n`;
    content += `  }\n\n`;
    
    content += `  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {\n`;
    content += `    if (err) {\n`;
    content += `      return res.status(403).json({\n`;
    content += `        success: false,\n`;
    content += `        message: 'Invalid or expired token'\n`;
    content += `      });\n`;
    content += `    }\n\n`;
    
    content += `    req.user = user;\n`;
    content += `    next();\n`;
    content += `  });\n`;
    content += `};\n\n`;
    
    if (config.roles) {
      content += `const requireRole = (roles) => {\n`;
      content += `  return (req, res, next) => {\n`;
      content += `    if (!req.user || !roles.includes(req.user.role)) {\n`;
      content += `      return res.status(403).json({\n`;
      content += `        success: false,\n`;
      content += `        message: 'Insufficient permissions'\n`;
      content += `      });\n`;
      content += `    }\n`;
      content += `    next();\n`;
      content += `  };\n`;
      content += `};\n\n`;
      content += `module.exports = { authenticateToken, requireRole };\n`;
    } else {
      content += `module.exports = { authenticateToken };\n`;
    }
    
    return content;
  }

  // Utility methods
  countLines(content) {
    return content.split('\n').length;
  }

  getControllerName(path) {
    const segments = path.split('/').filter(segment => segment && !segment.startsWith(':'));
    return segments[segments.length - 1] || 'index';
  }

  getModelName(path) {
    const name = this.getControllerName(path);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  generateHandlerName(path, method) {
    const resource = this.getControllerName(path);
    const methodMap = {
      'GET': path.includes(':id') ? 'get' : 'list',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'delete'
    };
    
    const action = methodMap[method?.toUpperCase()] || 'handle';
    return `${action}${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
  }

  getDefaultResponses(method) {
    const responses = {
      'GET': [200, 404, 500],
      'POST': [201, 400, 422, 500],
      'PUT': [200, 400, 404, 422, 500],
      'PATCH': [200, 400, 404, 422, 500],
      'DELETE': [200, 404, 500]
    };
    
    return responses[method] || [200, 400, 500];
  }

  determineFramework(context) {
    if (context.projectContext.framework === 'Next.js') {
      return 'nextjs';
    } else if (context.projectContext.projectType === 'express-api') {
      return 'express';
    }
    
    return 'express'; // default
  }

  shouldIncludeGraphQL(requirements) {
    return requirements.type === 'graphql' || 
           (requirements.endpoints && requirements.endpoints.some(e => e.type === 'graphql'));
  }
}

module.exports = { ApiAgent };