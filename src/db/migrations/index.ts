/**
 * Database Migrations Index
 * 
 * Exports all migrations for the migration runner
 */

import { initialSchema } from './001_initial_schema';
import { Migration } from './migrate';

/**
 * All migrations in chronological order
 * 
 * Migrations are automatically sorted by timestamp when loaded,
 * but maintaining order here helps with documentation
 */
export const migrations: Migration[] = [
  initialSchema,
  // Add new migrations here
  // Example:
  // export const addEmailField = createMigration(
  //   '002_add_email_field',
  //   'up SQL...',
  //   'down SQL...'
  // );
];

/**
 * Get all migrations
 */
export function getAllMigrations(): Migration[] {
  return migrations;
}

/**
 * Get migration by ID
 */
export function getMigrationById(id: string): Migration | undefined {
  return migrations.find(m => m.id === id);
}

/**
 * Get latest migration
 */
export function getLatestMigration(): Migration | undefined {
  return migrations[migrations.length - 1];
}
