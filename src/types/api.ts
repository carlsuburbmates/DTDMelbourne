// ============================================================================
// DTD Phase 2: API Contract - TypeScript API Types
// File: src/types/api.ts
// Description: API request/response types for all endpoints
// ============================================================================

import type {
  Business,
  Council,
  Suburb,
  Review,
  FeaturedPlacement,
  EmergencyContact,
  TriageLog,
  PaymentAudit,
  DogAgeGroup,
  DogBehaviorIssue,
  DogServiceType,
  DogBusinessResourceType,
  DogTriageClassification,
  CouncilRegion,
  ReviewModerationStatus,
  FeaturedPlacementStatus,
  PaginatedResponse,
} from './database';

// ============================================================================
// COMMON API TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  timestamp: string;
  request_id?: string;
  version: string;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort query parameters
 */
export interface SortQuery {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// PUBLIC API TYPES
// ============================================================================

/**
 * Search trainers query parameters
 */
export interface SearchTrainersQuery extends PaginationQuery {
  suburb: string;
  age_stage: DogAgeGroup;
  behaviour_issue?: DogBehaviorIssue;
  radius_km?: number;
}

/**
 * Trainer profile response
 */
export interface TrainerProfileResponse {
  trainer: Business & {
    council?: Council;
    suburb?: Suburb;
  };
  reviews?: Review[];
  featured?: FeaturedPlacement | null;
}

/**
 * Trainer reviews response
 */
export interface TrainerReviewsResponse extends PaginatedResponse<Review> {
  trainer_id: string;
  average_rating: number;
  total_reviews: number;
}

/**
 * Councils list response
 */
export interface CouncilsResponse extends PaginatedResponse<Council> {
  regions?: CouncilRegion[];
}

/**
 * Suburbs list response
 */
export interface SuburbsResponse extends PaginatedResponse<Suburb> {
  council_id?: string;
  region?: CouncilRegion;
}

/**
 * Services list response
 */
export interface ServicesResponse {
  services: DogServiceType[];
}

/**
 * Issues list response
 */
export interface IssuesResponse {
  issues: DogBehaviorIssue[];
}

/**
 * Age groups list response
 */
export interface AgeGroupsResponse {
  age_groups: DogAgeGroup[];
}

/**
 * Emergency triage request
 */
export interface EmergencyTriageRequest {
  user_message: string;
  location?: {
    council_id?: string;
    suburb_id?: string;
  };
}

/**
 * Emergency triage response
 */
export interface EmergencyTriageResponse {
  classification: DogTriageClassification;
  recommended_actions: string[];
  emergency_contacts?: EmergencyContact[];
  triage_id: string;
}

/**
 * Emergency contacts query
 */
export interface EmergencyContactsQuery extends PaginationQuery {
  council_id?: string;
  suburb_id?: string;
  resource_type?: DogBusinessResourceType;
}

/**
 * Emergency contacts response
 */
export interface EmergencyContactsResponse extends PaginatedResponse<EmergencyContact> {}

// ============================================================================
// TRAINER API TYPES
// ============================================================================

/**
 * Create trainer profile request
 */
export interface CreateBusinessRequest {
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  suburb: string;
  website?: string | null;
}

/**
 * Update business request
 */
export interface UpdateBusinessRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  age_specialties?: DogAgeGroup[];
  behavior_issues?: DogBehaviorIssue[];
  service_type_primary?: DogServiceType | null;
  service_type_secondary?: DogServiceType[] | null;
  emergency_phone?: string | null;
  emergency_hours?: string | null;
  emergency_services?: string[] | null;
}

/**
 * Trainer profile response
 */
export interface TrainerOwnProfileResponse {
  trainer: Business;
  featured?: FeaturedPlacement | null;
  stats?: {
    total_reviews: number;
    average_rating: number;
    featured_status: FeaturedPlacementStatus | null;
  };
}

/**
 * Claim business request
 */
export interface ClaimBusinessRequest {
  business_id: string;
  verification_method: 'sms';
  code: string;
}

/**
 * ABN verify request
 */
export interface AbnVerifyRequest {
  business_id: string;
  abn: string;
}

/**
 * Pro subscribe request
 */
export interface ProSubscribeRequest {
  business_id: string;
}

/**
 * Add service request
 */
export interface AddServiceRequest {
  service_type: DogServiceType;
  is_primary?: boolean;
}

/**
 * Add service response
 */
export interface AddServiceResponse {
  trainer: Business;
  added_service: DogServiceType;
}

/**
 * Remove service request
 */
export interface RemoveServiceRequest {
  service_type: DogServiceType;
}

/**
 * Remove service response
 */
export interface RemoveServiceResponse {
  trainer: Business;
  removed_service: DogServiceType;
}

/**
 * Add issue request
 */
export interface AddIssueRequest {
  behavior_issue: DogBehaviorIssue;
}

/**
 * Add issue response
 */
export interface AddIssueResponse {
  trainer: Business;
  added_issue: DogBehaviorIssue;
}

/**
 * Remove issue request
 */
export interface RemoveIssueRequest {
  behavior_issue: DogBehaviorIssue;
}

/**
 * Remove issue response
 */
export interface RemoveIssueResponse {
  trainer: Business;
  removed_issue: DogBehaviorIssue;
}

/**
 * Purchase featured placement request
 */
export interface PurchaseFeaturedRequest {
  business_id: string;
  council_id: string;
}

/**
 * Purchase featured response
 */
export interface PurchaseFeaturedResponse {
  session_id: string;
  checkout_url: string;
}

/**
 * Featured status response
 */
export interface FeaturedStatusResponse {
  featured: FeaturedPlacement | null;
  queue_position?: number | null;
  can_purchase: boolean;
  next_available_date?: string | null;
}

// ============================================================================
// ADMIN API TYPES
// ============================================================================

/**
 * Admin trainers query
 */
export interface AdminTrainersQuery extends PaginationQuery, SortQuery {
  status?: 'pending' | 'verified' | 'all';
  council_id?: string;
  resource_type?: DogBusinessResourceType;
  data_source?: string;
  search?: string;
}

/**
 * Admin trainers response
 */
export interface AdminTrainersResponse extends PaginatedResponse<Business> {
  filters: {
    status?: string;
    council_id?: string;
    resource_type?: DogBusinessResourceType;
  };
}

/**
 * Update trainer status request
 */
export interface UpdateTrainerStatusRequest {
  verified?: boolean;
  claimed?: boolean;
  status_reason?: string;
}

/**
 * Update trainer status response
 */
export interface UpdateTrainerStatusResponse {
  trainer: Business;
  previous_status: {
    verified: boolean;
    claimed: boolean;
  };
}

/**
 * Pending reviews query
 */
export interface PendingReviewsQuery extends PaginationQuery {
  council_id?: string;
  min_rating?: number;
  max_rating?: number;
}

/**
 * Pending reviews response
 */
export interface PendingReviewsResponse extends PaginatedResponse<Review & { business: Business }> {}

/**
 * Moderate review request
 */
export interface ModerateReviewRequest {
  moderation_status: ReviewModerationStatus;
  rejection_reason?: string;
}

/**
 * Moderate review response
 */
export interface ModerateReviewResponse {
  review: Review;
  previous_status: ReviewModerationStatus;
}

/**
 * Featured queue query
 */
export interface FeaturedQueueQuery extends PaginationQuery {
  council_id?: string;
  status?: FeaturedPlacementStatus;
}

/**
 * Featured queue response
 */
export interface FeaturedQueueResponse extends PaginatedResponse<FeaturedPlacement & { business: Business; council: Council }> {}

/**
 * Promote from queue request
 */
export interface PromoteFromQueueRequest {
  featured_placement_id: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Promote from queue response
 */
export interface PromoteFromQueueResponse {
  featured_placement: FeaturedPlacement;
  queue_updates: FeaturedPlacement[];
}

/**
 * Emergency logs query
 */
export interface EmergencyLogsQuery extends PaginationQuery {
  classification?: DogTriageClassification;
  date_from?: string;
  date_to?: string;
}

/**
 * Emergency logs response
 */
export interface EmergencyLogsResponse extends PaginatedResponse<TriageLog> {}

/**
 * Payment audit query
 */
export interface PaymentAuditQuery extends PaginationQuery {
  event_type?: string;
  business_id?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Payment audit response
 */
export interface PaymentAuditResponse extends PaginatedResponse<PaymentAudit> {}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
  mfa_code?: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  access_token: string;
  refresh_token?: string;
  requires_mfa?: boolean;
  mfa_method?: 'totp' | 'otp';
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
}

/**
 * Logout request
 */
export interface LogoutRequest {
  refresh_token?: string;
}

/**
 * Logout response
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Setup MFA request
 */
export interface SetupMfaRequest {
  method: 'totp' | 'otp';
}

/**
 * Setup MFA response
 */
export interface SetupMfaResponse {
  secret?: string;
  qr_code_url?: string;
  backup_codes?: string[];
  method: 'totp' | 'otp';
}

/**
 * Verify MFA request
 */
export interface VerifyMfaRequest {
  code: string;
  method: 'totp' | 'otp';
}

/**
 * Verify MFA response
 */
export interface VerifyMfaResponse {
  success: boolean;
  message: string;
}

/**
 * Disable MFA request
 */
export interface DisableMfaRequest {
  code: string;
  method: 'totp' | 'otp';
}

/**
 * Disable MFA response
 */
export interface DisableMfaResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Stripe webhook event
 */
export interface StripeWebhookEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: Record<string, unknown>;
  };
  type: string;
}

/**
 * Webhook response
 */
export interface WebhookResponse {
  received: boolean;
  event_id: string;
  processed: boolean;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  ApiResponse,
  ResponseMeta,
  ApiError,
  PaginationQuery,
  SortQuery,
  SearchTrainersQuery,
  TrainerProfileResponse,
  TrainerReviewsResponse,
  CouncilsResponse,
  SuburbsResponse,
  ServicesResponse,
  IssuesResponse,
  AgeGroupsResponse,
  EmergencyTriageRequest,
  EmergencyTriageResponse,
  EmergencyContactsQuery,
  EmergencyContactsResponse,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  ClaimBusinessRequest,
  AbnVerifyRequest,
  ProSubscribeRequest,
  TrainerOwnProfileResponse,
  AddServiceRequest,
  AddServiceResponse,
  RemoveServiceRequest,
  RemoveServiceResponse,
  AddIssueRequest,
  AddIssueResponse,
  RemoveIssueRequest,
  RemoveIssueResponse,
  PurchaseFeaturedRequest,
  PurchaseFeaturedResponse,
  FeaturedStatusResponse,
  AdminTrainersQuery,
  AdminTrainersResponse,
  UpdateTrainerStatusRequest,
  UpdateTrainerStatusResponse,
  PendingReviewsQuery,
  PendingReviewsResponse,
  ModerateReviewRequest,
  ModerateReviewResponse,
  FeaturedQueueQuery,
  FeaturedQueueResponse,
  PromoteFromQueueRequest,
  PromoteFromQueueResponse,
  EmergencyLogsQuery,
  EmergencyLogsResponse,
  PaymentAuditQuery,
  PaymentAuditResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse,
  SetupMfaRequest,
  SetupMfaResponse,
  VerifyMfaRequest,
  VerifyMfaResponse,
  DisableMfaRequest,
  DisableMfaResponse,
  StripeWebhookEvent,
  WebhookResponse,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. All API request/response types for all endpoints
// 2. Public API types for unauthenticated access
// 3. Trainer API types for authenticated trainer access
// 4. Admin API types for authenticated admin access
// 5. Authentication types for login/logout/MFA
// 6. Webhook types for Stripe integration
// 7. Based on DOCS/05_DATA_AND_API_CONTRACTS.md
// ============================================================================
