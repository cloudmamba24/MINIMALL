/**
 * Documentation Agent - Comprehensive documentation generation
 * 
 * Capabilities:
 * - README generation with setup guides and usage examples
 * - API documentation (OpenAPI/Swagger specifications)
 * - Code documentation (JSDoc, TypeScript comments)
 * - Architecture diagrams (Mermaid, PlantUML)
 * - Component documentation (Storybook integration)
 * - Deployment guides and runbooks
 * - Contributing guidelines and code standards
 * - Changelog and release notes generation
 */

const fs = require('fs');
const path = require('path');

class DocumentationAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Documentation';
    this.capabilities = [
      'readme_generation',
      'api_documentation',
      'code_documentation',
      'architecture_diagrams',
      'component_documentation',
      'deployment_guides',
      'contributing_guidelines',
      'changelog_generation'
    ];

    this.documentTypes = {
      'readme': { priority: 'high', template: 'project-readme', audience: 'developers' },
      'api': { priority: 'high', template: 'openapi-spec', audience: 'api-consumers' },
      'setup': { priority: 'medium', template: 'setup-guide', audience: 'new-developers' },
      'deployment': { priority: 'medium', template: 'deployment-guide', audience: 'devops' },
      'contributing': { priority: 'low', template: 'contributing-guide', audience: 'contributors' },
      'architecture': { priority: 'medium', template: 'architecture-doc', audience: 'technical-leads' }
    };

    this.diagramTypes = {
      'architecture': 'System architecture overview',
      'database': 'Database schema and relationships', 
      'api-flow': 'API request/response flows',
      'component-tree': 'React component hierarchy',
      'deployment': 'Deployment pipeline and infrastructure',
      'user-journey': 'User workflow and interactions'
    };

    this.codeDocPatterns = {
      'function': '/**\n * {description}\n * @param {type} {name} - {description}\n * @returns {type} {description}\n */',
      'class': '/**\n * {description}\n * @class {name}\n */',
      'interface': '/**\n * {description}\n * @interface {name}\n */',
      'component': '/**\n * {description}\n * @component\n * @param {Props} props - Component properties\n */'
    };
  }

  async generate(context) {
    console.log('📚 Documentation Agent: Generating comprehensive documentation...');
    
    const results = {
      files: [],
      documents: [],
      diagrams: [],
      metrics: {
        documentsGenerated: 0,
        diagramsCreated: 0,
        apiEndpointsDocumented: 0,
        componentsDocumented: 0,
        linesOfDocumentation: 0
      },
      coverage: {}
    };

    // 1. Analyze documentation requirements
    const docRequirements = await this.analyzeDocumentationRequirements(context);
    
    // 2. Generate project README
    const readmeResult = await this.generateProjectREADME(docRequirements, context);
    results.files.push(...readmeResult.files);
    results.documents.push(readmeResult.document);
    results.metrics.documentsGenerated++;

    // 3. Generate API documentation
    if (docRequirements.includeAPI && context.endpoints) {
      const apiDocResult = await this.generateAPIDocumentation(context.endpoints, context);
      results.files.push(...apiDocResult.files);
      results.documents.push(...apiDocResult.documents);
      results.metrics.apiEndpointsDocumented = context.endpoints.length;
      results.metrics.documentsGenerated++;
    }

    // 4. Generate component documentation
    if (docRequirements.includeComponents && context.components) {
      const componentDocResult = await this.generateComponentDocumentation(context.components, context);
      results.files.push(...componentDocResult.files);
      results.documents.push(...componentDocResult.documents);
      results.metrics.componentsDocumented = context.components.length;
      results.metrics.documentsGenerated++;
    }

    // 5. Generate architecture diagrams
    if (docRequirements.includeDiagrams) {
      const diagramResult = await this.generateArchitectureDiagrams(docRequirements, context);
      results.files.push(...diagramResult.files);
      results.diagrams = diagramResult.diagrams;
      results.metrics.diagramsCreated = diagramResult.diagrams.length;
    }

    // 6. Generate setup and deployment guides
    const guidesResult = await this.generateSetupGuides(docRequirements, context);
    results.files.push(...guidesResult.files);
    results.documents.push(...guidesResult.documents);
    results.metrics.documentsGenerated += guidesResult.documents.length;

    // 7. Generate code documentation
    const codeDocResult = await this.generateCodeDocumentation(context);
    results.files.push(...codeDocResult.files);

    // 8. Generate contributing guidelines
    if (docRequirements.includeContributing) {
      const contributingResult = await this.generateContributingGuidelines(docRequirements, context);
      results.files.push(...contributingResult.files);
      results.documents.push(contributingResult.document);
      results.metrics.documentsGenerated++;
    }

    console.log(`✅ Documentation Agent: Generated ${results.metrics.documentsGenerated} documents, ${results.metrics.diagramsCreated} diagrams`);
    
    return results;
  }

  async analyzeDocumentationRequirements(context) {
    const requirements = {
      includeAPI: false,
      includeComponents: false,
      includeDiagrams: true,
      includeContributing: true,
      includeDeployment: true,
      style: 'technical',
      audience: 'developers',
      format: 'markdown'
    };

    // Extract documentation requirements from context
    if (context.requirements) {
      context.requirements.forEach(req => {
        if (req.type === 'documentation' || req.category === 'docs') {
          this.parseDocumentationRequirement(req, requirements);
        }
      });
    }

    // Infer requirements from project context
    if (context.endpoints && context.endpoints.length > 0) {
      requirements.includeAPI = true;
    }

    if (context.components && context.components.length > 0) {
      requirements.includeComponents = true;
    }

    return requirements;
  }

  async generateProjectREADME(requirements, context) {
    const projectName = context.projectContext.name || 'Project';
    const framework = context.projectContext.framework || 'Node.js';
    
    let content = '';

    // Header
    content += `# ${projectName}\n\n`;
    content += `A modern ${framework} application with advanced features and best practices.\n\n`;

    // Badges
    content += this.generateBadges(context);

    // Table of Contents
    content += `## Table of Contents\n\n`;
    content += `- [Features](#features)\n`;
    content += `- [Quick Start](#quick-start)\n`;
    content += `- [Installation](#installation)\n`;
    content += `- [Usage](#usage)\n`;
    if (requirements.includeAPI) content += `- [API Documentation](#api-documentation)\n`;
    if (requirements.includeComponents) content += `- [Components](#components)\n`;
    content += `- [Development](#development)\n`;
    content += `- [Testing](#testing)\n`;
    content += `- [Deployment](#deployment)\n`;
    content += `- [Contributing](#contributing)\n`;
    content += `- [License](#license)\n\n`;

    // Features section
    content += `## Features\n\n`;
    content += this.generateFeaturesList(context);

    // Quick Start
    content += `## Quick Start\n\n`;
    content += this.generateQuickStart(context);

    // Installation
    content += `## Installation\n\n`;
    content += this.generateInstallationInstructions(context);

    // Usage
    content += `## Usage\n\n`;
    content += this.generateUsageExamples(context);

    // API Documentation
    if (requirements.includeAPI) {
      content += `## API Documentation\n\n`;
      content += this.generateAPIOverview(context);
    }

    // Development section
    content += `## Development\n\n`;
    content += this.generateDevelopmentGuide(context);

    // Testing section
    content += `## Testing\n\n`;
    content += this.generateTestingGuide(context);

    // Deployment section
    content += `## Deployment\n\n`;
    content += this.generateDeploymentOverview(context);

    const readmeFile = {
      path: 'README.md',
      content,
      type: 'readme'
    };

    return {
      files: [readmeFile],
      document: {
        name: 'Project README',
        type: 'readme',
        sections: ['features', 'installation', 'usage', 'development']
      }
    };
  }

  async generateAPIDocumentation(endpoints, context) {
    const documents = [];
    const files = [];

    // Generate OpenAPI specification
    const openApiSpec = this.generateOpenAPISpec(endpoints, context);
    files.push({
      path: 'docs/api/openapi.yaml',
      content: openApiSpec,
      type: 'api-spec'
    });

    // Generate API guide
    const apiGuide = this.generateAPIGuide(endpoints, context);
    files.push({
      path: 'docs/api/README.md',
      content: apiGuide,
      type: 'api-guide'
    });

    documents.push({
      name: 'API Documentation',
      type: 'api',
      endpoints: endpoints.length
    });

    return { files, documents };
  }

  generateOpenAPISpec(endpoints, context) {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: `${context.projectContext.name || 'API'} Documentation`,
        version: '1.0.0',
        description: 'API documentation generated by CodeCraft Engine'
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };

    // Generate paths
    endpoints.forEach(endpoint => {
      const path = endpoint.path.replace(/:(\w+)/g, '{$1}');
      const method = endpoint.method.toLowerCase();
      
      if (!spec.paths[path]) {
        spec.paths[path] = {};
      }

      spec.paths[path][method] = {
        summary: endpoint.description || `${endpoint.method} ${endpoint.path}`,
        operationId: endpoint.handler,
        responses: this.generateOpenAPIResponses(endpoint),
        ...(endpoint.parameters && { parameters: this.generateOpenAPIParameters(endpoint.parameters) }),
        ...(endpoint.requestBody && { requestBody: this.generateOpenAPIRequestBody(endpoint.requestBody) }),
        ...(endpoint.authentication && { security: [{ bearerAuth: [] }] })
      };
    });

    return `# Generated OpenAPI Specification\n${JSON.stringify(spec, null, 2)}`;
  }

  generateAPIGuide(endpoints, context) {
    let content = '';

    content += `# API Documentation\n\n`;
    content += `This document provides detailed information about the API endpoints.\n\n`;

    content += `## Authentication\n\n`;
    content += `Most endpoints require authentication using JWT tokens:\n\n`;
    content += `\`\`\`\n`;
    content += `Authorization: Bearer <your-jwt-token>\n`;
    content += `\`\`\`\n\n`;

    content += `## Endpoints\n\n`;

    // Group endpoints by resource
    const groupedEndpoints = this.groupEndpointsByResource(endpoints);
    
    Object.entries(groupedEndpoints).forEach(([resource, resourceEndpoints]) => {
      content += `### ${resource}\n\n`;
      
      resourceEndpoints.forEach(endpoint => {
        content += `#### ${endpoint.method} ${endpoint.path}\n\n`;
        content += `${endpoint.description || 'No description available'}\n\n`;
        
        // Request example
        content += `**Request:**\n\n`;
        content += `\`\`\`bash\n`;
        content += `curl -X ${endpoint.method} \\\n`;
        content += `  http://localhost:3000/api${endpoint.path} \\\n`;
        if (endpoint.authentication) {
          content += `  -H "Authorization: Bearer <token>" \\\n`;
        }
        content += `  -H "Content-Type: application/json"\n`;
        if (endpoint.requestBody) {
          content += `  -d '${JSON.stringify(this.generateSampleRequestBody(endpoint), null, 2)}'\n`;
        }
        content += `\`\`\`\n\n`;
        
        // Response example
        content += `**Response:**\n\n`;
        content += `\`\`\`json\n`;
        content += JSON.stringify(this.generateSampleResponse(endpoint), null, 2);
        content += `\n\`\`\`\n\n`;
      });
    });

    return content;
  }

  async generateComponentDocumentation(components, context) {
    const documents = [];
    const files = [];

    // Generate component guide
    let componentGuide = '';
    componentGuide += `# Component Documentation\n\n`;
    componentGuide += `This document provides information about the React components in this project.\n\n`;

    components.forEach(component => {
      componentGuide += `## ${component.name}\n\n`;
      componentGuide += `${component.description || 'A React component'}\n\n`;
      
      // Props table
      if (component.props) {
        componentGuide += `### Props\n\n`;
        componentGuide += `| Prop | Type | Required | Default | Description |\n`;
        componentGuide += `|------|------|----------|---------|-------------|\n`;
        
        Object.entries(component.props).forEach(([propName, prop]) => {
          const type = prop.type || 'any';
          const required = prop.required !== false ? 'Yes' : 'No';
          const defaultValue = prop.default || '-';
          const description = prop.description || '';
          
          componentGuide += `| ${propName} | ${type} | ${required} | ${defaultValue} | ${description} |\n`;
        });
        
        componentGuide += '\n';
      }

      // Usage example
      componentGuide += `### Usage\n\n`;
      componentGuide += `\`\`\`jsx\n`;
      componentGuide += `import { ${component.name} } from './components/${component.name}';\n\n`;
      componentGuide += `function App() {\n`;
      componentGuide += `  return (\n`;
      componentGuide += `    <${component.name}`;
      
      if (component.props) {
        const exampleProps = this.generateExampleProps(component.props);
        if (exampleProps) {
          componentGuide += `\n      ${exampleProps}`;
        }
      }
      
      componentGuide += `${component.children !== false ? `>\n      {/* Content */}\n    </${component.name}>` : ' />'}\n`;
      componentGuide += `  );\n`;
      componentGuide += `}\n`;
      componentGuide += `\`\`\`\n\n`;
    });

    files.push({
      path: 'docs/components/README.md',
      content: componentGuide,
      type: 'component-guide'
    });

    documents.push({
      name: 'Component Documentation',
      type: 'components',
      componentCount: components.length
    });

    return { files, documents };
  }

  async generateArchitectureDiagrams(requirements, context) {
    const diagrams = [];
    const files = [];

    // System architecture diagram
    const archDiagram = this.generateSystemArchitectureDiagram(context);
    files.push({
      path: 'docs/diagrams/architecture.md',
      content: archDiagram,
      type: 'architecture-diagram'
    });
    diagrams.push({ name: 'System Architecture', type: 'mermaid' });

    // Database diagram
    if (context.schemas) {
      const dbDiagram = this.generateDatabaseDiagram(context.schemas);
      files.push({
        path: 'docs/diagrams/database.md',
        content: dbDiagram,
        type: 'database-diagram'
      });
      diagrams.push({ name: 'Database Schema', type: 'mermaid' });
    }

    // Component tree diagram
    if (context.components) {
      const componentDiagram = this.generateComponentTreeDiagram(context.components);
      files.push({
        path: 'docs/diagrams/components.md',
        content: componentDiagram,
        type: 'component-diagram'
      });
      diagrams.push({ name: 'Component Tree', type: 'mermaid' });
    }

    return { files, diagrams };
  }

  generateSystemArchitectureDiagram(context) {
    let content = '';
    
    content += `# System Architecture\n\n`;
    content += `\`\`\`mermaid\n`;
    content += `graph TB\n`;
    content += `    subgraph "Frontend"\n`;
    content += `        UI[User Interface]\n`;
    content += `        COMP[Components]\n`;
    content += `        STATE[State Management]\n`;
    content += `    end\n\n`;
    
    content += `    subgraph "Backend"\n`;
    content += `        API[API Layer]\n`;
    content += `        BL[Business Logic]\n`;
    content += `        AUTH[Authentication]\n`;
    content += `    end\n\n`;
    
    if (context.database) {
      content += `    subgraph "Data"\n`;
      content += `        DB[Database]\n`;
      content += `        CACHE[Cache]\n`;
      content += `    end\n\n`;
    }
    
    content += `    UI --> COMP\n`;
    content += `    COMP --> STATE\n`;
    content += `    COMP --> API\n`;
    content += `    API --> AUTH\n`;
    content += `    API --> BL\n`;
    
    if (context.database) {
      content += `    BL --> DB\n`;
      content += `    BL --> CACHE\n`;
    }
    
    content += `\`\`\`\n`;

    return content;
  }

  // Utility methods
  generateBadges(context) {
    let badges = '';
    
    const framework = context.projectContext.framework;
    if (framework) {
      badges += `![${framework}](https://img.shields.io/badge/${framework}-blue.svg) `;
    }
    
    const language = context.projectContext.language;
    if (language) {
      badges += `![${language}](https://img.shields.io/badge/${language}-green.svg) `;
    }
    
    badges += `![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg) `;
    badges += `![License](https://img.shields.io/badge/license-MIT-blue.svg)\n\n`;
    
    return badges;
  }

  generateFeaturesList(context) {
    let features = '';
    
    features += `✨ **Modern Tech Stack**: Built with ${context.projectContext.framework || 'modern technologies'}\n`;
    features += `🔒 **Security First**: Built-in authentication and authorization\n`;
    features += `📱 **Responsive Design**: Works on all devices and screen sizes\n`;
    features += `🚀 **Performance Optimized**: Fast loading and smooth interactions\n`;
    features += `🧪 **Well Tested**: Comprehensive test coverage\n`;
    features += `📚 **Well Documented**: Clear documentation and examples\n\n`;
    
    return features;
  }

  generateQuickStart(context) {
    let quickStart = '';
    
    quickStart += `\`\`\`bash\n`;
    quickStart += `# Clone the repository\n`;
    quickStart += `git clone <repository-url>\n`;
    quickStart += `cd ${context.projectContext.name || 'project'}\n\n`;
    quickStart += `# Install dependencies\n`;
    quickStart += `npm install\n\n`;
    quickStart += `# Start development server\n`;
    quickStart += `npm run dev\n`;
    quickStart += `\`\`\`\n\n`;
    
    return quickStart;
  }

  generateInstallationInstructions(context) {
    let installation = '';
    
    installation += `### Prerequisites\n\n`;
    installation += `- Node.js (v16 or higher)\n`;
    installation += `- npm or yarn\n`;
    if (context.database) {
      installation += `- ${context.database.type || 'Database'} (for data storage)\n`;
    }
    installation += `\n`;
    
    installation += `### Step-by-step Installation\n\n`;
    installation += `1. **Clone the repository**\n`;
    installation += `   \`\`\`bash\n`;
    installation += `   git clone <repository-url>\n`;
    installation += `   cd ${context.projectContext.name || 'project'}\n`;
    installation += `   \`\`\`\n\n`;
    
    installation += `2. **Install dependencies**\n`;
    installation += `   \`\`\`bash\n`;
    installation += `   npm install\n`;
    installation += `   \`\`\`\n\n`;
    
    installation += `3. **Environment setup**\n`;
    installation += `   \`\`\`bash\n`;
    installation += `   cp .env.example .env\n`;
    installation += `   # Edit .env with your configuration\n`;
    installation += `   \`\`\`\n\n`;
    
    if (context.database) {
      installation += `4. **Database setup**\n`;
      installation += `   \`\`\`bash\n`;
      installation += `   npm run db:migrate\n`;
      installation += `   npm run db:seed\n`;
      installation += `   \`\`\`\n\n`;
    }
    
    installation += `${context.database ? '5' : '4'}. **Start the application**\n`;
    installation += `   \`\`\`bash\n`;
    installation += `   npm run dev\n`;
    installation += `   \`\`\`\n\n`;
    
    return installation;
  }

  groupEndpointsByResource(endpoints) {
    const groups = {};
    
    endpoints.forEach(endpoint => {
      const resource = endpoint.path.split('/')[1] || 'root';
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(endpoint);
    });
    
    return groups;
  }

  generateSampleRequestBody(endpoint) {
    if (!endpoint.requestBody) return {};
    
    // Generate sample based on endpoint type
    if (endpoint.method === 'POST' && endpoint.path.includes('user')) {
      return {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123'
      };
    }
    
    return { sample: 'data' };
  }

  generateSampleResponse(endpoint) {
    return {
      success: true,
      data: endpoint.method === 'GET' ? { id: 1, example: 'data' } : { id: 1 },
      message: 'Operation completed successfully'
    };
  }

  parseDocumentationRequirement(requirement, requirements) {
    if (requirement.types) {
      requirement.types.forEach(type => {
        requirements[`include${type.charAt(0).toUpperCase() + type.slice(1)}`] = true;
      });
    }
    
    if (requirement.style) {
      requirements.style = requirement.style;
    }
    
    if (requirement.audience) {
      requirements.audience = requirement.audience;
    }
  }
}

module.exports = { DocumentationAgent };