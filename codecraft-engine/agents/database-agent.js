/**
 * Database Agent - Advanced database schema and query generation
 * 
 * Capabilities:
 * - Database schema generation (Prisma, TypeORM, Mongoose)
 * - Migration script generation and management
 * - Query optimization and index suggestions
 * - Seed data and fixture generation
 * - Database relationship modeling
 * - Performance monitoring queries
 * - Backup and recovery scripts
 * - Multi-database support (PostgreSQL, MySQL, MongoDB)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DatabaseAgent {
  constructor(engine) {
    this.engine = engine;
    this.name = 'Database';
    this.capabilities = [
      'schema_generation',
      'migration_management',
      'query_optimization',
      'seed_data_generation',
      'relationship_modeling',
      'performance_monitoring',
      'backup_scripts',
      'multi_database_support'
    ];
    
    this.supportedDatabases = {
      'postgresql': {
        orm: ['prisma', 'typeorm', 'sequelize'],
        features: ['jsonb', 'arrays', 'full_text_search', 'gin_indexes'],
        migrations: true,
        transactions: true
      },
      'mysql': {
        orm: ['prisma', 'typeorm', 'sequelize'],
        features: ['json', 'full_text_search', 'partitioning'],
        migrations: true,
        transactions: true
      },
      'mongodb': {
        orm: ['mongoose', 'prisma'],
        features: ['aggregation', 'geospatial', 'text_search', 'transactions'],
        migrations: false,
        transactions: true
      },
      'sqlite': {
        orm: ['prisma', 'typeorm', 'sequelize'],
        features: ['fts', 'json1', 'rtree'],
        migrations: true,
        transactions: true
      }
    };

    this.dataTypes = {
      'string': { sql: 'VARCHAR', mongo: 'String', validation: ['minLength', 'maxLength', 'pattern'] },
      'text': { sql: 'TEXT', mongo: 'String', validation: ['minLength', 'maxLength'] },
      'integer': { sql: 'INTEGER', mongo: 'Number', validation: ['min', 'max'] },
      'float': { sql: 'FLOAT', mongo: 'Number', validation: ['min', 'max'] },
      'decimal': { sql: 'DECIMAL', mongo: 'Decimal128', validation: ['precision', 'scale'] },
      'boolean': { sql: 'BOOLEAN', mongo: 'Boolean', validation: [] },
      'date': { sql: 'DATE', mongo: 'Date', validation: ['min', 'max'] },
      'datetime': { sql: 'TIMESTAMP', mongo: 'Date', validation: ['min', 'max'] },
      'json': { sql: 'JSON', mongo: 'Mixed', validation: ['schema'] },
      'array': { sql: 'JSON', mongo: 'Array', validation: ['items', 'minItems', 'maxItems'] }
    };

    this.relationshipTypes = [
      'one-to-one',
      'one-to-many', 
      'many-to-many',
      'polymorphic',
      'self-referencing'
    ];

    this.indexTypes = [
      'primary',
      'unique',
      'index',
      'compound',
      'partial',
      'gin',
      'gist',
      'btree'
    ];
  }

  async generate(context) {
    console.log('🗄️ Database Agent: Generating database schema and migrations...');
    
    const results = {
      files: [],
      schemas: [],
      migrations: [],
      seeds: [],
      metrics: {
        tablesGenerated: 0,
        migrationsCreated: 0,
        seedsGenerated: 0,
        indexesCreated: 0,
        linesOfCode: 0
      },
      dependencies: [],
      configuration: {}
    };

    // 1. Analyze database requirements
    const dbRequirements = await this.analyzeDatabaseRequirements(context);
    
    // 2. Plan database architecture
    const dbArchitecture = await this.planDatabaseArchitecture(dbRequirements, context);
    
    // 3. Generate database configuration
    const configResult = await this.generateDatabaseConfiguration(dbArchitecture, context);
    results.files.push(...configResult.files);
    results.configuration = configResult.configuration;

    // 4. Generate schemas/models
    for (const schemaSpec of dbArchitecture.schemas) {
      try {
        const schemaResult = await this.generateSchema(schemaSpec, dbArchitecture, context);
        results.files.push(...schemaResult.files);
        results.schemas.push(schemaResult.schema);
        results.metrics.tablesGenerated++;
        results.metrics.linesOfCode += schemaResult.linesOfCode;
        
      } catch (error) {
        console.warn(`Failed to generate schema ${schemaSpec.name}:`, error.message);
      }
    }

    // 5. Generate migrations
    if (dbArchitecture.migrations) {
      const migrationResult = await this.generateMigrations(dbArchitecture, context);
      results.files.push(...migrationResult.files);
      results.migrations = migrationResult.migrations;
      results.metrics.migrationsCreated = migrationResult.migrations.length;
    }

    // 6. Generate seed data
    if (dbArchitecture.seeds) {
      const seedResult = await this.generateSeedData(dbArchitecture, context);
      results.files.push(...seedResult.files);
      results.seeds = seedResult.seeds;
      results.metrics.seedsGenerated = seedResult.seeds.length;
    }

    // 7. Generate database utilities
    const utilityResult = await this.generateDatabaseUtilities(dbArchitecture, context);
    results.files.push(...utilityResult.files);

    // 8. Generate performance monitoring
    const monitoringResult = await this.generatePerformanceMonitoring(dbArchitecture, context);
    results.files.push(...monitoringResult.files);

    console.log(`✅ Database Agent: Generated ${results.metrics.tablesGenerated} schemas and ${results.metrics.migrationsCreated} migrations`);
    
    return results;
  }

  async analyzeDatabaseRequirements(context) {
    const requirements = {
      database: 'postgresql',
      orm: 'prisma',
      schemas: [],
      relationships: [],
      migrations: true,
      seeds: true,
      performance: true,
      backup: false
    };

    // Extract database requirements from context
    if (context.requirements) {
      context.requirements.forEach(req => {
        if (req.type === 'database' || req.category === 'data') {
          this.parseDatabaseRequirement(req, requirements);
        }
      });
    }

    // Detect existing database setup
    requirements.existing = await this.detectExistingDatabase(context);
    
    return requirements;
  }

  parseDatabaseRequirement(requirement, requirements) {
    if (requirement.database) {
      requirements.database = requirement.database.type || requirements.database;
      requirements.orm = requirement.database.orm || requirements.orm;
    }

    if (requirement.models || requirement.schemas) {
      const models = requirement.models || requirement.schemas;
      models.forEach(model => {
        requirements.schemas.push(this.parseSchemaSpec(model));
      });
    }

    if (requirement.relationships) {
      requirement.relationships.forEach(rel => {
        requirements.relationships.push(this.parseRelationshipSpec(rel));
      });
    }
  }

  parseSchemaSpec(model) {
    return {
      name: model.name,
      tableName: model.tableName || this.toSnakeCase(model.name),
      fields: this.parseFields(model.fields || model.attributes || {}),
      relationships: model.relationships || [],
      indexes: model.indexes || [],
      constraints: model.constraints || [],
      timestamps: model.timestamps !== false,
      softDeletes: model.softDeletes || false,
      validation: model.validation || {}
    };
  }

  parseFields(fields) {
    const parsedFields = {};
    
    Object.entries(fields).forEach(([fieldName, fieldSpec]) => {
      if (typeof fieldSpec === 'string') {
        // Simple type specification
        parsedFields[fieldName] = {
          type: fieldSpec,
          required: true,
          nullable: false
        };
      } else {
        // Detailed field specification
        parsedFields[fieldName] = {
          type: fieldSpec.type || 'string',
          required: fieldSpec.required !== false,
          nullable: fieldSpec.nullable || false,
          unique: fieldSpec.unique || false,
          default: fieldSpec.default,
          validation: fieldSpec.validation || {},
          index: fieldSpec.index || false,
          references: fieldSpec.references || null
        };
      }
    });
    
    return parsedFields;
  }

  async generateSchema(schemaSpec, architecture, context) {
    const orm = architecture.orm;
    const schemaResult = {
      schema: schemaSpec,
      files: [],
      linesOfCode: 0
    };

    switch (orm) {
      case 'prisma':
        const prismaResult = await this.generatePrismaSchema(schemaSpec, architecture, context);
        schemaResult.files = prismaResult.files;
        schemaResult.linesOfCode = prismaResult.linesOfCode;
        break;
        
      case 'typeorm':
        const typeormResult = await this.generateTypeORMEntity(schemaSpec, architecture, context);
        schemaResult.files = typeormResult.files;
        schemaResult.linesOfCode = typeormResult.linesOfCode;
        break;
        
      case 'mongoose':
        const mongooseResult = await this.generateMongooseSchema(schemaSpec, architecture, context);
        schemaResult.files = mongooseResult.files;
        schemaResult.linesOfCode = mongooseResult.linesOfCode;
        break;
        
      default:
        throw new Error(`Unsupported ORM: ${orm}`);
    }

    return schemaResult;
  }

  async generatePrismaSchema(schemaSpec, architecture, context) {
    let content = '';
    
    // Model definition
    content += `model ${schemaSpec.name} {\n`;
    
    // ID field (always first)
    content += `  id    String @id @default(cuid())\n`;
    
    // Generate fields
    Object.entries(schemaSpec.fields).forEach(([fieldName, field]) => {
      const prismaType = this.mapToPrismaType(field.type);
      const optional = !field.required ? '?' : '';
      const unique = field.unique ? ' @unique' : '';
      const defaultValue = field.default ? ` @default(${this.formatPrismaDefault(field.default, field.type)})` : '';
      
      content += `  ${fieldName.padEnd(12)} ${prismaType}${optional}${defaultValue}${unique}\n`;
    });
    
    // Timestamps
    if (schemaSpec.timestamps) {
      content += `  createdAt DateTime @default(now())\n`;
      content += `  updatedAt DateTime @updatedAt\n`;
    }
    
    // Soft deletes
    if (schemaSpec.softDeletes) {
      content += `  deletedAt DateTime?\n`;
    }
    
    // Relationships
    schemaSpec.relationships.forEach(rel => {
      content += this.generatePrismaRelationship(rel);
    });
    
    // Table mapping
    content += `\n  @@map("${schemaSpec.tableName}")\n`;
    
    // Indexes
    if (schemaSpec.indexes.length > 0) {
      schemaSpec.indexes.forEach(index => {
        if (index.type === 'compound') {
          content += `  @@index([${index.fields.join(', ')}])\n`;
        } else if (index.type === 'unique') {
          content += `  @@unique([${index.fields.join(', ')}])\n`;
        }
      });
    }
    
    content += `}\n\n`;
    
    const schemaFile = {
      path: path.join('prisma/schema', `${schemaSpec.name.toLowerCase()}.prisma`),
      content,
      type: 'schema'
    };
    
    return {
      files: [schemaFile],
      linesOfCode: this.countLines(content)
    };
  }

  async generateTypeORMEntity(schemaSpec, architecture, context) {
    const isTypeScript = context.projectContext.language === 'TypeScript';
    const extension = isTypeScript ? 'ts' : 'js';
    
    let content = '';
    
    // Imports
    content += `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';\n\n`;
    
    // Entity decorator
    content += `@Entity('${schemaSpec.tableName}')\n`;
    content += `export class ${schemaSpec.name} {\n`;
    
    // ID field
    content += `  @PrimaryGeneratedColumn('uuid')\n`;
    content += `  id: string;\n\n`;
    
    // Generate fields
    Object.entries(schemaSpec.fields).forEach(([fieldName, field]) => {
      const typeormOptions = this.getTypeORMColumnOptions(field);
      const typeAnnotation = isTypeScript ? `: ${this.mapToTypeScriptType(field.type)}` : '';
      
      content += `  @Column(${typeormOptions})\n`;
      content += `  ${fieldName}${typeAnnotation};\n\n`;
    });
    
    // Timestamps
    if (schemaSpec.timestamps) {
      content += `  @CreateDateColumn()\n`;
      content += `  createdAt: Date;\n\n`;
      content += `  @UpdateDateColumn()\n`;
      content += `  updatedAt: Date;\n\n`;
    }
    
    content += `}\n`;
    
    const entityFile = {
      path: path.join('src/entities', `${schemaSpec.name}.${extension}`),
      content,
      type: 'entity'
    };
    
    return {
      files: [entityFile],
      linesOfCode: this.countLines(content)
    };
  }

  async generateMongooseSchema(schemaSpec, architecture, context) {
    let content = '';
    
    // Imports
    content += `const mongoose = require('mongoose');\n`;
    content += `const { Schema } = mongoose;\n\n`;
    
    // Schema definition
    content += `const ${schemaSpec.name.toLowerCase()}Schema = new Schema({\n`;
    
    // Generate fields
    Object.entries(schemaSpec.fields).forEach(([fieldName, field]) => {
      const mongooseField = this.mapToMongooseField(field);
      content += `  ${fieldName}: ${mongooseField},\n`;
    });
    
    content += `}, {\n`;
    
    // Timestamps
    if (schemaSpec.timestamps) {
      content += `  timestamps: true,\n`;
    }
    
    // Collection name
    content += `  collection: '${schemaSpec.tableName}'\n`;
    content += `});\n\n`;
    
    // Indexes
    schemaSpec.indexes.forEach(index => {
      if (index.type === 'compound') {
        const indexObj = index.fields.reduce((obj, field) => {
          obj[field] = 1;
          return obj;
        }, {});
        content += `${schemaSpec.name.toLowerCase()}Schema.index(${JSON.stringify(indexObj)});\n`;
      }
    });
    
    // Export model
    content += `\nmodule.exports = mongoose.model('${schemaSpec.name}', ${schemaSpec.name.toLowerCase()}Schema);\n`;
    
    const modelFile = {
      path: path.join('src/models', `${schemaSpec.name}.js`),
      content,
      type: 'model'
    };
    
    return {
      files: [modelFile],
      linesOfCode: this.countLines(content)
    };
  }

  async generateMigrations(architecture, context) {
    const migrations = [];
    const files = [];
    
    // Generate initial migration
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const migrationName = `${timestamp}_initial_schema`;
    
    let migrationContent = '';
    
    if (architecture.orm === 'prisma') {
      // Prisma handles migrations automatically
      return { migrations: [], files: [] };
    } else if (architecture.database === 'postgresql') {
      migrationContent = this.generatePostgreSQLMigration(architecture);
    } else if (architecture.database === 'mysql') {
      migrationContent = this.generateMySQLMigration(architecture);
    }
    
    const migrationFile = {
      path: path.join('migrations', `${migrationName}.sql`),
      content: migrationContent,
      type: 'migration'
    };
    
    files.push(migrationFile);
    migrations.push({
      name: migrationName,
      timestamp: timestamp,
      type: 'initial'
    });
    
    return { migrations, files };
  }

  generatePostgreSQLMigration(architecture) {
    let sql = '';
    
    architecture.schemas.forEach(schema => {
      sql += `-- Create ${schema.name} table\n`;
      sql += `CREATE TABLE IF NOT EXISTS ${schema.tableName} (\n`;
      
      // ID column
      sql += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
      
      // Fields
      Object.entries(schema.fields).forEach(([fieldName, field]) => {
        const pgType = this.mapToPostgreSQLType(field.type);
        const nullable = field.nullable ? '' : ' NOT NULL';
        const unique = field.unique ? ' UNIQUE' : '';
        const defaultValue = field.default ? ` DEFAULT ${this.formatSQLDefault(field.default, field.type)}` : '';
        
        sql += `  ${this.toSnakeCase(fieldName)} ${pgType}${nullable}${unique}${defaultValue},\n`;
      });
      
      // Timestamps
      if (schema.timestamps) {
        sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
        sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
      }
      
      sql = sql.slice(0, -2) + '\n'; // Remove last comma
      sql += `);\n\n`;
      
      // Indexes
      schema.indexes.forEach(index => {
        const indexName = `idx_${schema.tableName}_${index.fields.join('_')}`;
        const unique = index.type === 'unique' ? 'UNIQUE ' : '';
        sql += `CREATE ${unique}INDEX IF NOT EXISTS ${indexName} ON ${schema.tableName} (${index.fields.map(f => this.toSnakeCase(f)).join(', ')});\n`;
      });
      
      sql += '\n';
    });
    
    return sql;
  }

  // Utility methods
  mapToPrismaType(type) {
    const typeMap = {
      'string': 'String',
      'text': 'String',
      'integer': 'Int',
      'float': 'Float',
      'decimal': 'Decimal',
      'boolean': 'Boolean',
      'date': 'DateTime',
      'datetime': 'DateTime',
      'json': 'Json'
    };
    
    return typeMap[type] || 'String';
  }

  mapToTypeScriptType(type) {
    const typeMap = {
      'string': 'string',
      'text': 'string',
      'integer': 'number',
      'float': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'date': 'Date',
      'datetime': 'Date',
      'json': 'any'
    };
    
    return typeMap[type] || 'string';
  }

  mapToPostgreSQLType(type) {
    const typeMap = {
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'float': 'REAL',
      'decimal': 'DECIMAL(10,2)',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'TIMESTAMP WITH TIME ZONE',
      'json': 'JSONB'
    };
    
    return typeMap[type] || 'VARCHAR(255)';
  }

  mapToMongooseField(field) {
    const mongooseType = this.dataTypes[field.type]?.mongo || 'String';
    
    let fieldSpec = `{ type: ${mongooseType}`;
    
    if (field.required) {
      fieldSpec += ', required: true';
    }
    
    if (field.unique) {
      fieldSpec += ', unique: true';
    }
    
    if (field.default !== undefined) {
      fieldSpec += `, default: ${JSON.stringify(field.default)}`;
    }
    
    fieldSpec += ' }';
    
    return fieldSpec;
  }

  toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  countLines(content) {
    return content.split('\n').length;
  }

  formatPrismaDefault(value, type) {
    if (type === 'string') return `"${value}"`;
    if (type === 'boolean') return value.toString();
    if (type === 'datetime' && value === 'now') return 'now()';
    return value;
  }

  formatSQLDefault(value, type) {
    if (type === 'string') return `'${value}'`;
    if (type === 'boolean') return value.toString().toUpperCase();
    if (type === 'datetime' && value === 'now') return 'NOW()';
    return value;
  }
}

module.exports = { DatabaseAgent };