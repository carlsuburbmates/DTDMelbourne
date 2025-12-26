#!/usr/bin/env node

/**
 * Database Migration CLI
 * 
 * Command-line interface for running database migrations
 * Usage:
 *   npm run migrate:status    - Show migration status
 *   npm run migrate:up        - Apply pending migrations
 *   npm run migrate:down      - Rollback last migration
 *   npm run migrate:rollback   - Rollback to specific migration
 *   npm run migrate:validate   - Validate migration integrity
 *   npm run migrate:report     - Generate migration report
 */

import { Pool } from 'pg';
import { createMigrationRunner, getAllMigrations } from './index';

// Database connection configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dogtrainersdirectory',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

/**
 * CLI command interface
 */
interface Command {
  name: string;
  description: string;
  handler: (pool: Pool, args: string[]) => Promise<void>;
}

/**
 * Available CLI commands
 */
const commands: Command[] = [
  {
    name: 'status',
    description: 'Show migration status',
    handler: async (pool) => {
      const runner = createMigrationRunner(pool, getAllMigrations());
      await runner.initialize();
      const status = await runner.getStatus();
      
      console.log('\n=== Migration Status ===\n');
      
      if (status.length === 0) {
        console.log('No migrations tracked');
      } else {
        const table = status.map(s => {
          const statusIcon = s.status === 'applied' ? '✓' : s.status === 'failed' ? '✗' : '↩';
          const appliedAt = s.applied_at ? s.applied_at.toISOString() : '-';
          const error = s.error ? `\n  Error: ${s.error}` : '';
          return `${statusIcon} ${s.id}\n  Applied: ${appliedAt}${error}`;
        }).join('\n\n');
        console.log(table);
      }
      
      const pending = await runner.getPendingMigrations();
      console.log(`\nPending: ${pending.length}`);
      console.log(`Applied: ${status.filter(s => s.status === 'applied').length}`);
      console.log(`Failed: ${status.filter(s => s.status === 'failed').length}`);
      console.log(`Rolled Back: ${status.filter(s => s.status === 'rolled_back').length}`);
    },
  },
  {
    name: 'up',
    description: 'Apply pending migrations',
    handler: async (pool) => {
      const runner = createMigrationRunner(pool, getAllMigrations());
      await runner.initialize();
      
      const pending = await runner.getPendingMigrations();
      
      if (pending.length === 0) {
        console.log('No pending migrations to apply');
        return;
      }
      
      console.log(`\nApplying ${pending.length} pending migration(s)...\n`);
      
      const results = await runner.migrate();
      
      console.log('\n=== Migration Results ===\n');
      
      for (const result of results) {
        const icon = result.success ? '✓' : '✗';
        const duration = `${result.duration}ms`;
        const error = result.error ? `\n  Error: ${result.error}` : '';
        console.log(`${icon} ${result.id} (${duration})${error}`);
      }
      
      const failed = results.filter(r => !r.success).length;
      if (failed > 0) {
        console.log(`\n${failed} migration(s) failed`);
        process.exit(1);
      } else {
        console.log('\nAll migrations applied successfully');
      }
    },
  },
  {
    name: 'down',
    description: 'Rollback last migration',
    handler: async (pool) => {
      const runner = createMigrationRunner(pool, getAllMigrations());
      await runner.initialize();
      
      const status = await runner.getStatus();
      const applied = status.filter(s => s.status === 'applied');
      
      if (applied.length === 0) {
        console.log('No migrations to rollback');
        return;
      }
      
      const lastApplied = applied[applied.length - 1];
      console.log(`\nRolling back migration: ${lastApplied.id}\n`);
      
      const result = await runner.rollback(lastApplied.id);
      
      const icon = result.success ? '✓' : '✗';
      const duration = `${result.duration}ms`;
      const error = result.error ? `\n  Error: ${result.error}` : '';
      console.log(`${icon} ${result.id} (${duration})${error}`);
      
      if (!result.success) {
        console.log('\nRollback failed');
        process.exit(1);
      } else {
        console.log('\nRollback successful');
      }
    },
  },
  {
    name: 'rollback',
    description: 'Rollback to specific migration (usage: rollback <migration_id>)',
    handler: async (pool, args) => {
      const targetId = args[0];
      
      if (!targetId) {
        console.error('Error: Migration ID required');
        console.error('Usage: npm run migrate:rollback <migration_id>');
        process.exit(1);
      }
      
      const runner = createMigrationRunner(pool, getAllMigrations());
      await runner.initialize();
      
      console.log(`\nRolling back to migration: ${targetId}\n`);
      
      const results = await runner.rollbackTo(targetId);
      
      console.log('\n=== Rollback Results ===\n');
      
      for (const result of results) {
        const icon = result.success ? '✓' : '✗';
        const duration = `${result.duration}ms`;
        const error = result.error ? `\n  Error: ${result.error}` : '';
        console.log(`${icon} ${result.id} (${duration})${error}`);
      }
      
      const failed = results.filter(r => !r.success).length;
      if (failed > 0) {
        console.log(`\n${failed} rollback(s) failed`);
        process.exit(1);
      } else {
        console.log('\nRollback successful');
      }
    },
  },
  {
    name: 'validate',
    description: 'Validate migration integrity',
    handler: async (pool) => {
      const runner = createMigrationRunner(pool, getAllMigrations());
      await runner.initialize();
      
      console.log('\nValidating migrations...\n');
      
      const validation = await runner.validate();
      
      if (validation.valid) {
        console.log('✓ All migrations are valid');
      } else {
        console.log('✗ Validation errors found:\n');
        for (const error of validation.errors) {
          console.log(`  - ${error}`);
        }
        process.exit(1);
      }
    },
  },
  {
    name: 'report',
    description: 'Generate migration report',
    handler: async (pool) => {
      const runner = createMigrationRunner(pool, getAllMigrations());
      await runner.initialize();
      
      const report = await runner.generateReport();
      console.log(report);
    },
  },
];

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const commandName = args[0];
  
  if (!commandName) {
    console.log('Database Migration CLI\n');
    console.log('Usage: npm run migrate:<command> [args]\n');
    console.log('Available commands:\n');
    
    for (const command of commands) {
      console.log(`  ${command.name.padEnd(12)} - ${command.description}`);
    }
    
    console.log('\nExamples:');
    console.log('  npm run migrate:status');
    console.log('  npm run migrate:up');
    console.log('  npm run migrate:down');
    console.log('  npm run migrate:rollback 001_initial_schema');
    console.log('  npm run migrate:validate');
    console.log('  npm run migrate:report');
    process.exit(0);
  }
  
  const command = commands.find(c => c.name === commandName);
  
  if (!command) {
    console.error(`Unknown command: ${commandName}`);
    console.error('Run without arguments to see available commands');
    process.exit(1);
  }
  
  // Create database connection pool
  const pool = new Pool(DB_CONFIG);
  
  try {
    await command.handler(pool, args.slice(1));
  } catch (error) {
    console.error('\nError:', (error as Error).message);
    console.error('\nStack trace:');
    console.error((error as Error).stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run CLI
main();
