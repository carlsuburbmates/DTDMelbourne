// ============================================================================
// DTD Phase 1: Database Schema - TypeScript Type Definitions
// File: src/types/database.ts
// Description: TypeScript types matching database schema
// ============================================================================

// ============================================================================
// ENUM TYPES
// ============================================================================

/**
 * Dog age group classification
 * Based on DOCS/02_DOMAIN_MODEL.md
 */
export type DogAgeGroup =
  | 'Puppies (0–6m)'
  | 'Adolescent (6–18m)'
  | 'Adult (18m–7y)'
  | 'Senior (7y+)'
  | 'Rescue';

/**
 * Dog behavior issue classification
 * Based on DOCS/02_DOMAIN_MODEL.md
 */
export type DogBehaviorIssue =
  | 'Pulling on lead'
  | 'Separation anxiety'
  | 'Excessive barking'
  | 'Dog aggression'
  | 'Leash reactivity'
  | 'Jumping up'
  | 'Destructive behaviour'
  | 'Recall issues'
  | 'Anxiety'
  | 'Resource guarding'
  | 'Mouthing/nipping/biting'
  | 'Rescue dog support'
  | 'Socialisation';

/**
 * Dog service type classification
 * Based on DOCS/02_DOMAIN_MODEL.md
 */
export type DogServiceType =
  | 'Puppy training'
  | 'Obedience training'
  | 'Behaviour consultations'
  | 'Group classes'
  | 'Private training';

/**
 * Dog business resource type classification
 * Based on DOCS/02_DOMAIN_MODEL.md
 */
export type DogBusinessResourceType =
  | 'trainer'
  | 'behaviour_consultant'
  | 'emergency_vet'
  | 'urgent_care'
  | 'emergency_shelter';

/**
 * Review moderation status
 * Based on DOCS/02_DOMAIN_MODEL.md
 */
export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected';

/**
 * Featured placement status
 * Based on DOCS/02_DOMAIN_MODEL.md
 */
export type FeaturedPlacementStatus = 'queued' | 'active' | 'expired' | 'cancelled';

/**
 * Business tier (monetisation)
 */
export type BusinessTier = 'basic' | 'pro';

/**
 * Dog triage classification
 * Based on DOCS/02_DOMAIN_MODEL.md
 */
export type DogTriageClassification = 'medical' | 'crisis' | 'stray' | 'normal';

/**
 * Council region classification
 * Based on DOCS/02_DOMAIN_MODEL.md
 */
export type CouncilRegion = 'Inner City' | 'Northern' | 'Eastern' | 'South Eastern' | 'Western';

/**
 * Business data source classification
 * Based on DOCS/02_DOMAIN_MODEL.md
 */
export type BusinessDataSource = 'manual_form' | 'scraped' | 'api_import' | 'admin_entry';

/**
 * Cron job status classification
 */
export type CronJobStatus = 'pending' | 'running' | 'completed' | 'failed';

// ============================================================================
// TABLE INTERFACES
// ============================================================================

/**
 * Council interface
 * Reference data for 28 Melbourne metropolitan councils
 */
export interface Council {
  id: string;
  name: string;
  region: CouncilRegion;
  shire: boolean;
  ux_label: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Suburb interface
 * Reference data for 200+ Melbourne suburbs
 */
export interface Suburb {
  id: string;
  name: string;
  council_id: string;
  region: CouncilRegion;
  postcode: string;
  latitude: number;
  longitude: number;
  ux_label: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * User interface
 * Trainer accounts with authentication
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'trainer' | 'user';
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

/**
 * Business interface
 * Core trainer listings with all fields
 */
export interface Business {
  id: string;
  name: string;
  resource_type: DogBusinessResourceType;
  suburb_id: string;
  council_id: string;
  region: CouncilRegion;
  address: string | null;
  phone: string;
  email: string | null;
  website: string | null;
  description: string | null;
  age_specialties: DogAgeGroup[];
  behavior_issues: DogBehaviorIssue[];
  service_type_primary: DogServiceType | null;
  service_type_secondary: DogServiceType[] | null;
  abn: string | null;
  abn_verified: boolean;
  emergency_phone: string | null;
  emergency_hours: string | null;
  emergency_services: string[] | null;
  claimed: boolean;
  scaffolded: boolean;
  data_source: BusinessDataSource;
  tier: BusinessTier;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Review interface
 * User reviews with moderation
 */
export interface Review {
  id: string;
  business_id: string;
  user_id: string | null;
  rating: number;
  comment: string;
  moderation_status: ReviewModerationStatus;
  approved_at: Date | null;
  rejected_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Featured placement interface
 * Monetisation audit log
 */
export interface FeaturedPlacement {
  id: string;
  business_id: string;
  council_id: string;
  starts_at: Date;
  ends_at: Date;
  status: FeaturedPlacementStatus;
  queue_position: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Payment audit interface
 * Stripe webhook event log (immutable)
 */
export interface PaymentAudit {
  id: string;
  stripe_event_id: string;
  stripe_event_type: string;
  business_id: string | null;
  council_id: string | null;
  payment_intent_id: string | null;
  charge_id: string | null;
  customer_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  webhook_received_at: Date;
  processed_at: Date | null;
  processing_success: boolean | null;
  processing_error: string | null;
  created_at: Date;
}

/**
 * ABN verification interface
 * Optional verification record (Active status = badge)
 */
export interface AbnVerification {
  id: string;
  business_id: string;
  abn: string;
  status: string;
  verified: boolean;
  matched_json: unknown | null;
  checked_at: Date;
  created_at: Date;
}

/**
 * Subscription interface
 * Pro (Gold Card) subscription status
 */
export interface Subscription {
  id: string;
  business_id: string;
  tier: BusinessTier;
  status: string;
  current_period_end: Date;
  stripe_subscription_id: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Emergency contact interface
 * Cached emergency resources
 */
export interface EmergencyContact {
  id: string;
  business_id: string;
  resource_type: DogBusinessResourceType;
  name: string;
  suburb_id: string | null;
  council_id: string | null;
  phone: string;
  emergency_hours: string | null;
  availability_status: string;
  last_verified: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Triage log interface
 * Emergency triage audit trail
 */
export interface TriageLog {
  id: string;
  user_message: string;
  classification: DogTriageClassification;
  recommended_actions?: string[] | null;
  created_at: Date;
}

/**
 * Cron job interface
 * Scheduled task audit
 */
export interface CronJob {
  id: string;
  job_name: string;
  status: CronJobStatus;
  started_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

/**
 * Business with council relationship
 */
export interface BusinessWithCouncil extends Business {
  council: Council;
}

/**
 * Business with suburb relationship
 */
export interface BusinessWithSuburb extends Business {
  suburb: Suburb;
}

/**
 * Business with reviews relationship
 */
export interface BusinessWithReviews extends Business {
  reviews: Review[];
}

/**
 * Council with suburbs relationship
 */
export interface CouncilWithSuburbs extends Council {
  suburbs: Suburb[];
}

/**
 * Suburb with council relationship
 */
export interface SuburbWithCouncil extends Suburb {
  council: Council;
}

/**
 * Review with business relationship
 */
export interface ReviewWithBusiness extends Review {
  business: Business;
}

/**
 * Featured placement with business relationship
 */
export interface FeaturedPlacementWithBusiness extends FeaturedPlacement {
  business: Business;
}

/**
 * Featured placement with council relationship
 */
export interface FeaturedPlacementWithCouncil extends FeaturedPlacement {
  council: Council;
}

// ============================================================================
// INPUT TYPES (for mutations)
// ============================================================================

/**
 * Input type for creating a council
 */
export interface CreateCouncilInput {
  name: string;
  region: CouncilRegion;
  shire: boolean;
  ux_label: string;
}

/**
 * Input type for creating a suburb
 */
export interface CreateSuburbInput {
  name: string;
  council_id: string;
  region: CouncilRegion;
  postcode: string;
  latitude: number;
  longitude: number;
  ux_label: string;
}

/**
 * Input type for creating a user
 */
export interface CreateUserInput {
  email: string;
  password: string;
  role: 'admin' | 'trainer' | 'user';
}

/**
 * Input type for creating a business
 */
export interface CreateBusinessInput {
  name: string;
  resource_type: DogBusinessResourceType;
  suburb_id: string;
  council_id: string;
  region: CouncilRegion;
  address?: string | null;
  phone: string;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  age_specialties?: DogAgeGroup[];
  behavior_issues?: DogBehaviorIssue[];
  service_type_primary?: DogServiceType | null;
  service_type_secondary?: DogServiceType[] | null;
  abn?: string | null;
  abn_verified?: boolean;
  emergency_phone?: string | null;
  emergency_hours?: string | null;
  emergency_services?: string[] | null;
  claimed?: boolean;
  scaffolded?: boolean;
  data_source?: BusinessDataSource;
  tier?: BusinessTier;
}

/**
 * Input type for creating a review
 */
export interface CreateReviewInput {
  business_id: string;
  user_id?: string | null;
  rating: number;
  comment: string;
}

/**
 * Input type for creating a featured placement
 */
export interface CreateFeaturedPlacementInput {
  business_id: string;
  council_id: string;
  starts_at: Date;
  ends_at: Date;
}

/**
 * Input type for creating a triage log
 */
export interface CreateTriageLogInput {
  user_message: string;
  classification: DogTriageClassification;
  recommended_actions?: string[] | null;
}

// ============================================================================
// UPDATE TYPES (for mutations)
// ============================================================================

/**
 * Input type for updating a business
 */
export interface UpdateBusinessInput {
  name?: string;
  address?: string | null;
  phone?: string;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  age_specialties?: DogAgeGroup[];
  behavior_issues?: DogBehaviorIssue[];
  service_type_primary?: DogServiceType | null;
  service_type_secondary?: DogServiceType[] | null;
  abn?: string | null;
  abn_verified?: boolean;
  emergency_phone?: string | null;
  emergency_hours?: string | null;
  emergency_services?: string[] | null;
  claimed?: boolean;
  tier?: BusinessTier;
}

/**
 * Input type for updating a review
 */
export interface UpdateReviewInput {
  moderation_status?: ReviewModerationStatus;
  approved_at?: Date | null;
  rejected_at?: Date | null;
  rejection_reason?: string | null;
}

/**
 * Input type for updating a featured placement
 */
export interface UpdateFeaturedPlacementInput {
  status?: FeaturedPlacementStatus;
  queue_position?: number | null;
}

// ============================================================================
// FILTER TYPES (for queries)
// ============================================================================

/**
 * Filter type for businesses
 */
export interface BusinessFilter {
  council_id?: string;
  suburb_id?: string;
  resource_type?: DogBusinessResourceType;
  age_specialty?: DogAgeGroup;
  behavior_issue?: DogBehaviorIssue;
  service_type?: DogServiceType;
  abn_verified?: boolean;
  claimed?: boolean;
  include_deleted?: boolean;
}

/**
 * Filter type for reviews
 */
export interface ReviewFilter {
  business_id?: string;
  user_id?: string;
  moderation_status?: ReviewModerationStatus;
  min_rating?: number;
  max_rating?: number;
}

/**
 * Filter type for featured placements
 */
export interface FeaturedPlacementFilter {
  business_id?: string;
  council_id?: string;
  status?: FeaturedPlacementStatus;
  active_date?: Date;
}

/**
 * Filter type for emergency contacts
 */
export interface EmergencyContactFilter {
  council_id?: string;
  suburb_id?: string;
  resource_type?: DogBusinessResourceType;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Database error type
 */
export interface DatabaseError {
  code: string;
  message: string;
  details?: unknown;
  hint?: string;
}

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract keys from an interface
 */
export type KeysOf<T> = keyof T;

/**
 * Partial required fields
 */
export type PartialRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Nullable fields
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  Council,
  Suburb,
  User,
  Business,
  BusinessTier,
  Review,
  FeaturedPlacement,
  PaymentAudit,
  AbnVerification,
  Subscription,
  EmergencyContact,
  TriageLog,
  CronJob,
  BusinessWithCouncil,
  BusinessWithSuburb,
  BusinessWithReviews,
  CouncilWithSuburbs,
  SuburbWithCouncil,
  ReviewWithBusiness,
  FeaturedPlacementWithBusiness,
  FeaturedPlacementWithCouncil,
  CreateCouncilInput,
  CreateSuburbInput,
  CreateUserInput,
  CreateBusinessInput,
  CreateReviewInput,
  CreateFeaturedPlacementInput,
  CreateTriageLogInput,
  UpdateBusinessInput,
  UpdateReviewInput,
  UpdateFeaturedPlacementInput,
  BusinessFilter,
  ReviewFilter,
  FeaturedPlacementFilter,
  EmergencyContactFilter,
  PaginationParams,
  PaginatedResponse,
  DatabaseError,
  ValidationError,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. All enum types match database enum definitions
// 2. All interfaces match database table schemas
// 3. Relationship types for common join queries
// 4. Input types for create/update mutations
// 5. Filter types for query parameters
// 6. Pagination types for paginated responses
// 7. Error types for error handling
// 8. Utility types for type manipulation
// 9. Based on DOCS/02_DOMAIN_MODEL.md and DOCS/05_DATA_AND_API_CONTRACTS.md
// ============================================================================
