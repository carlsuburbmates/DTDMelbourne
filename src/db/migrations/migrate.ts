/**
 * Database Migration Framework
 * 
 * Provides a structured approach to database schema migrations with:
 * - Version tracking
 * - Rollback support
 * - Transaction safety
 * - Migration logging
 */

import { Pool } from 'pg';

/**
 * Migration interface
 * Defines the structure of a database migration
 */
export interface Migration {
  /** Unique migration identifier (timestamp + description) */
  id: string;
  
  /** Human-readable description of migration */
  description: string;
  
  /** SQL to apply the migration */
  up: string;
  
  /** SQL to rollback the migration */
  down: string;
  
  /** Migration timestamp */
  timestamp: number;
}

/**
 * Migration result interface
 */
export interface MigrationResult {
  /** Migration ID */
  id: string;
  
  /** Whether migration succeeded */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Execution time in milliseconds */
  duration: number;
}

/**
 * Migration status interface
 */
export interface MigrationStatus {
  /** Migration ID */
  id: string;
  
  /** Current status */
  status: 'pending' | 'applied' | 'failed' | 'rolled_back';
  
  /** When migration was applied */
  applied_at?: Date;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Migration runner class
 * Handles execution and tracking of database migrations
 */
export class MigrationRunner {
  private pool: Pool;
  private migrations: Migration[];
  private schemaName: string = 'public';

  constructor(pool: Pool, migrations: Migration[]) {
    this.pool = pool;
    this.migrations = migrations.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Initialize migration tracking table
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.schemaName}._migrations (
          id VARCHAR(255) PRIMARY KEY,
          description TEXT NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          rolled_back_at TIMESTAMP WITH TIME ZONE,
          error TEXT
        );
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Get current migration status
   */
  async getStatus(): Promise<MigrationStatus[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id,
          CASE 
            WHEN rolled_back_at IS NOT NULL THEN 'rolled_back'
            WHEN error IS NOT NULL THEN 'failed'
            ELSE 'applied'
          END as status,
          applied_at,
          error
        FROM ${this.schemaName}._migrations
        ORDER BY id ASC;
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        status: row.status,
        applied_at: row.applied_at,
        error: row.error,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const status = await this.getStatus();
    const appliedIds = new Set(
      status
        .filter(s => s.status === 'applied')
        .map(s => s.id)
    );
    
    return this.migrations.filter(m => !appliedIds.has(m.id));
  }

  /**
   * Apply all pending migrations
   */
  async migrate(): Promise<MigrationResult[]> {
    const pending = await this.getPendingMigrations();
    const results: MigrationResult[] = [];

    for (const migration of pending) {
      const result = await this.applyMigration(migration);
      results.push(result);
      
      if (!result.success) {
        // Stop on first failure
        break;
      }
    }

    return results;
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Record migration start
      await client.query(
        `INSERT INTO ${this.schemaName}._migrations (id, description) VALUES ($1, $2)`,
        [migration.id, migration.description]
      );

      // Execute migration
      await client.query(migration.up);

      await client.query('COMMIT');

      return {
        id: migration.id,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Record failure
      await client.query(
        `UPDATE ${this.schemaName}._migrations SET error = $1 WHERE id = $2`,
        [(error as Error).message, migration.id]
      );

      return {
        id: migration.id,
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Rollback a specific migration
   */
  async rollback(migrationId: string): Promise<MigrationResult> {
    const migration = this.migrations.find(m => m.id === migrationId);
    
    if (!migration) {
      return {
        id: migrationId,
        success: false,
        error: 'Migration not found',
        duration: 0,
      };
    }

    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Execute rollback
      await client.query(migration.down);

      // Record rollback
      await client.query(
        `UPDATE ${this.schemaName}._migrations SET rolled_back_at = NOW() WHERE id = $1`,
        [migrationId]
      );

      await client.query('COMMIT');

      return {
        id: migrationId,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      await client.query('ROLLBACK');

      return {
        id: migrationId,
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Rollback to a specific migration
   */
  async rollbackTo(targetMigrationId: string): Promise<MigrationResult[]> {
    const status = await this.getStatus();
    const applied = status
      .filter(s => s.status === 'applied')
      .reverse(); // Rollback in reverse order

    const results: MigrationResult[] = [];

    for (const migrationStatus of applied) {
      if (migrationStatus.id === targetMigrationId) {
        break;
      }

      const result = await this.rollback(migrationStatus.id);
      results.push(result);
      
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Validate migration integrity
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const status = await this.getStatus();

    // Check for duplicate IDs
    const ids = this.migrations.map(m => m.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      errors.push('Duplicate migration IDs detected');
    }

    // Check for missing migrations in tracking
    const appliedIds = status
      .filter(s => s.status === 'applied')
      .map(s => s.id);
    
    for (const appliedId of appliedIds) {
      if (!this.migrations.find(m => m.id === appliedId)) {
        errors.push(`Applied migration ${appliedId} not found in migration list`);
      }
    }

    // Check for failed migrations
    const failed = status.filter(s => s.status === 'failed');
    if (failed.length > 0) {
      errors.push(`${failed.length} failed migrations detected`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate migration report
   */
  async generateReport(): Promise<string> {
    const status = await this.getStatus();
    const pending = await this.getPendingMigrations();
    const validation = await this.validate();

    let report = '=== Database Migration Report ===\n\n';
    
    report += `Total Migrations: ${this.migrations.length}\n`;
    report += `Applied: ${status.filter(s => s.status === 'applied').length}\n`;
    report += `Pending: ${pending.length}\n`;
    report += `Failed: ${status.filter(s => s.status === 'failed').length}\n`;
    report += `Rolled Back: ${status.filter(s => s.status === 'rolled_back').length}\n\n`;

    if (pending.length > 0) {
      report += '=== Pending Migrations ===\n';
      for (const migration of pending) {
        report += `- ${migration.id}: ${migration.description}\n`;
      }
      report += '\n';
    }

    if (!validation.valid) {
      report += '=== Validation Errors ===\n';
      for (const error of validation.errors) {
        report += `- ${error}\n`;
      }
      report += '\n';
    }

    return report;
  }
}

/**
 * Create a new migration file
 */
export function createMigration(
  description: string,
  up: string,
  down: string
): Migration {
  const timestamp = Date.now();
  const id = `${timestamp}_${description.toLowerCase().replace(/\s+/g, '_')}`;
  
  return {
    id,
    description,
    up,
    down,
    timestamp,
  };
}

/**
 * Export migration runner factory
 */
export function createMigrationRunner(
  pool: Pool,
  migrations: Migration[]
): MigrationRunner {
  return new MigrationRunner(pool, migrations);
}
