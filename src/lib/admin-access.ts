export const ADMIN_ENABLED = process.env.ADMIN_ENABLED === 'true';

export function isAdminEnabled(): boolean {
  return ADMIN_ENABLED;
}
