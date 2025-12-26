// ============================================================================
// DTD Phase 2: API Contract - Zod Validation Schemas
// File: src/lib/validation.ts
// Description: Zod schemas for all API endpoints
// ============================================================================

import { z } from 'zod';
import type {
  DogAgeGroup,
  DogBehaviorIssue,
  DogServiceType,
  DogBusinessResourceType,
  DogTriageClassification,
  CouncilRegion,
  ReviewModerationStatus,
  FeaturedPlacementStatus,
} from '../types/database';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

const dogAgeGroupSchema = z.enum([
  'Puppy (0–6 months)',
  'Adolescent (6–18 months)',
  'Adult (1.5–7 years)',
  'Senior (7–10 years)',
  'Any age',
] as const);

const dogBehaviorIssueSchema = z.enum([
  'Pulling on the lead',
  'Separation anxiety',
  'Barking',
  'Aggression',
  'Jumping up on people',
  'Recall issues',
  'Socialisation',
  'Chewing',
  'Digging',
  'House training',
  'Fear/phobias',
  'Other',
] as const);

const dogServiceTypeSchema = z.enum([
  'Puppy training',
  'Obedience training',
  'Behaviour consultations',
  'Group classes',
  'Private training',
] as const);

const dogBusinessResourceTypeSchema = z.enum([
  'trainer',
  'behaviour_consultant',
  'emergency_vet',
  'urgent_care',
  'emergency_shelter',
] as const);

const dogTriageClassificationSchema = z.enum([
  'medical',
  'crisis',
  'stray',
  'normal',
] as const);

const councilRegionSchema = z.enum([
  'Inner City',
  'Northern',
  'Eastern',
  'South Eastern',
  'Western',
] as const);

const reviewModerationStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
] as const);

const featuredPlacementStatusSchema = z.enum([
  'queued',
  'active',
  'expired',
  'refunded',
  'cancelled',
] as const);

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().optional(),
});

/**
 * Sort schema
 */
export const sortSchema = z.object({
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

/**
 * ID schema
 */
export const idSchema = z.string().uuid('Invalid ID format');

/**
 * Email schema
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Phone schema (Australian format)
 */
export const phoneSchema = z.string().regex(
  /^(\+61|0)?[4]\d{8}$/,
  'Invalid Australian phone number'
);

/**
 * URL schema
 */
export const urlSchema = z.string().url('Invalid URL').optional().nullable();

/**
 * Rating schema (1-5)
 */
export const ratingSchema = z.coerce.number().int().min(1).max(5);

/**
 * Coordinates schema
 */
export const coordinatesSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

// ============================================================================
// PUBLIC API SCHEMAS
// ============================================================================

/**
 * Search trainers query schema
 */
export const searchTrainersQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortSchema.shape,
  council_id: idSchema.optional(),
  locality_id: idSchema.optional(),
  resource_type: dogBusinessResourceTypeSchema.optional(),
  age_specialty: dogAgeGroupSchema.optional(),
  behavior_issue: dogBehaviorIssueSchema.optional(),
  service_type: dogServiceTypeSchema.optional(),
  verified: z.coerce.boolean().optional(),
  claimed: z.coerce.boolean().optional(),
  search: z.string().min(1).max(200).optional(),
});

/**
 * Get trainer by ID schema
 */
export const getTrainerByIdSchema = z.object({
  id: idSchema,
});

/**
 * Get trainer reviews query schema
 */
export const getTrainerReviewsQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortSchema.shape,
  min_rating: ratingSchema.optional(),
  max_rating: ratingSchema.optional(),
});

/**
 * Get councils query schema
 */
export const getCouncilsQuerySchema = z.object({
  ...paginationSchema.shape,
  region: councilRegionSchema.optional(),
});

/**
 * Get suburbs query schema
 */
export const getSuburbsQuerySchema = z.object({
  ...paginationSchema.shape,
  council_id: idSchema.optional(),
  region: councilRegionSchema.optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
});

/**
 * Emergency triage request schema
 */
export const emergencyTriageRequestSchema = z.object({
  user_message: z.string().min(10).max(1000),
  location: z.object({
    council_id: idSchema.optional(),
    locality_id: idSchema.optional(),
  }).optional(),
});

/**
 * Emergency contacts query schema
 */
export const emergencyContactsQuerySchema = z.object({
  ...paginationSchema.shape,
  council_id: idSchema.optional(),
  locality_id: idSchema.optional(),
  resource_type: dogBusinessResourceTypeSchema.optional(),
});

// ============================================================================
// TRAINER API SCHEMAS
// ============================================================================

/**
 * Create trainer profile request schema
 */
export const createTrainerProfileRequestSchema = z.object({
  name: z.string().min(2).max(200),
  locality_id: idSchema,
  council_id: idSchema,
  phone: phoneSchema,
  email: emailSchema.optional().nullable(),
  website: urlSchema,
  description: z.string().min(10).max(2000).optional().nullable(),
  age_specialties: z.array(dogAgeGroupSchema).min(1).max(5).optional(),
  behavior_issues: z.array(dogBehaviorIssueSchema).min(1).max(10).optional(),
  service_type_primary: dogServiceTypeSchema.nullable().optional(),
  service_type_secondary: z.array(dogServiceTypeSchema).max(4).optional(),
  abr_abn: z.string().regex(/^\d{11}$/).optional().nullable(),
  emergency_phone: phoneSchema.optional().nullable(),
  emergency_hours: z.string().max(200).optional().nullable(),
  emergency_services: z.array(z.string().max(100)).max(5).optional(),
});

/**
 * Update trainer profile request schema
 */
export const updateTrainerProfileRequestSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional().nullable(),
  website: urlSchema,
  description: z.string().min(10).max(2000).optional().nullable(),
  age_specialties: z.array(dogAgeGroupSchema).min(1).max(5).optional(),
  behavior_issues: z.array(dogBehaviorIssueSchema).min(1).max(10).optional(),
  service_type_primary: dogServiceTypeSchema.nullable().optional(),
  service_type_secondary: z.array(dogServiceTypeSchema).max(4).optional(),
  abr_abn: z.string().regex(/^\d{11}$/).optional().nullable(),
  emergency_phone: phoneSchema.optional().nullable(),
  emergency_hours: z.string().max(200).optional().nullable(),
  emergency_services: z.array(z.string().max(100)).max(5).optional(),
});

/**
 * Add service request schema
 */
export const addServiceRequestSchema = z.object({
  service_type: dogServiceTypeSchema,
  is_primary: z.coerce.boolean().optional().default(false),
});

/**
 * Remove service request schema
 */
export const removeServiceRequestSchema = z.object({
  service_type: dogServiceTypeSchema,
});

/**
 * Add issue request schema
 */
export const addIssueRequestSchema = z.object({
  behavior_issue: dogBehaviorIssueSchema,
});

/**
 * Remove issue request schema
 */
export const removeIssueRequestSchema = z.object({
  behavior_issue: dogBehaviorIssueSchema,
});

/**
 * Purchase featured placement request schema
 */
export const purchaseFeaturedRequestSchema = z.object({
  council_id: idSchema,
  duration_days: z.coerce.number().int().min(1).max(365),
  payment_method_id: z.string().min(1),
});

/**
 * Get featured status query schema
 */
export const getFeaturedStatusQuerySchema = z.object({
  council_id: idSchema.optional(),
});

// ============================================================================
// ADMIN API SCHEMAS
// ============================================================================

/**
 * Admin trainers query schema
 */
export const adminTrainersQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortSchema.shape,
  status: z.enum(['pending', 'verified', 'all']).optional(),
  council_id: idSchema.optional(),
  resource_type: dogBusinessResourceTypeSchema.optional(),
  data_source: z.string().optional(),
  search: z.string().min(1).max(200).optional(),
});

/**
 * Update trainer status request schema
 */
export const updateTrainerStatusRequestSchema = z.object({
  verified: z.coerce.boolean().optional(),
  claimed: z.coerce.boolean().optional(),
  status_reason: z.string().min(1).max(500).optional(),
});

/**
 * Pending reviews query schema
 */
export const pendingReviewsQuerySchema = z.object({
  ...paginationSchema.shape,
  council_id: idSchema.optional(),
  min_rating: ratingSchema.optional(),
  max_rating: ratingSchema.optional(),
});

/**
 * Moderate review request schema
 */
export const moderateReviewRequestSchema = z.object({
  moderation_status: reviewModerationStatusSchema,
  rejection_reason: z.string().min(1).max(500).optional(),
});

/**
 * Featured queue query schema
 */
export const featuredQueueQuerySchema = z.object({
  ...paginationSchema.shape,
  council_id: idSchema.optional(),
  status: featuredPlacementStatusSchema.optional(),
});

/**
 * Promote from queue request schema
 */
export const promoteFromQueueRequestSchema = z.object({
  featured_placement_id: idSchema,
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

/**
 * Emergency logs query schema
 */
export const emergencyLogsQuerySchema = z.object({
  ...paginationSchema.shape,
  classification: dogTriageClassificationSchema.optional(),
  min_confidence: z.coerce.number().min(0).max(1).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

/**
 * Payment audit query schema
 */
export const paymentAuditQuerySchema = z.object({
  ...paginationSchema.shape,
  event_type: z.string().optional(),
  business_id: idSchema.optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Login request schema
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  mfa_code: z.string().length(6).regex(/^\d+$/).optional(),
});

/**
 * Refresh token request schema
 */
export const refreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1),
});

/**
 * Logout request schema
 */
export const logoutRequestSchema = z.object({
  refresh_token: z.string().min(1).optional(),
});

/**
 * Setup MFA request schema
 */
export const setupMfaRequestSchema = z.object({
  method: z.enum(['totp', 'otp']),
});

/**
 * Verify MFA request schema
 */
export const verifyMfaRequestSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
  method: z.enum(['totp', 'otp']),
});

/**
 * Disable MFA request schema
 */
export const disableMfaRequestSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
  method: z.enum(['totp', 'otp']),
});

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

/**
 * Stripe webhook signature schema
 */
export const stripeWebhookSignatureSchema = z.object({
  signature: z.string().min(1),
});

/**
 * Stripe webhook event schema
 */
export const stripeWebhookEventSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  api_version: z.string(),
  created: z.number(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
  type: z.string(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }
  return result.data;
}

/**
 * Validate query parameters against schema
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }
  return result.data;
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  public errors: Array<{ field: string; message: string }>;

  constructor(message: string, errors: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export {
  dogAgeGroupSchema,
  dogBehaviorIssueSchema,
  dogServiceTypeSchema,
  dogBusinessResourceTypeSchema,
  dogTriageClassificationSchema,
  councilRegionSchema,
  reviewModerationStatusSchema,
  featuredPlacementStatusSchema,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. All Zod schemas for API request validation
// 2. Public API schemas for unauthenticated endpoints
// 3. Trainer API schemas for authenticated trainer endpoints
// 4. Admin API schemas for authenticated admin endpoints
// 5. Authentication schemas for login/logout/MFA
// 6. Webhook schemas for Stripe integration
// 7. Helper functions for validation
// 8. Based on DOCS/05_DATA_AND_API_CONTRACTS.md
// ============================================================================
