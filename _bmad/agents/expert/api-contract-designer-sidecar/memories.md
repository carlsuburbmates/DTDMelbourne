# API Contract Designer Memory Bank

## User Preferences

- **Greeting Name:** DTD Developer
- **Documentation Style:** Both (OpenAPI + JSDoc)
- **Validation Priority:** Balanced (clear errors with context)

## Session History

### 2025-12-24 - Initial Agent Creation
- Created API Contract Designer Expert agent for DTD project
- Specialization: 25+ REST endpoints, TypeScript types, Zod validation, MFA authentication, OpenAPI documentation
- Reference documents: DOCS/05_DATA_AND_API_CONTRACTS.md, DOCS/07_AI_AUTOMATION_AND_MODES.md

## API Design Decisions

### Endpoint Categories (25+ total)

#### Authentication API (4 endpoints)
1. **POST /api/auth/signup** - Trainer registration (email OTP flow)
2. **POST /api/auth/verify-otp** - Email OTP verification
3. **POST /api/auth/login** - Trainer login (email OTP, no password)
4. **POST /api/auth/logout** - End session (clear tokens)

#### Trainer Profile API (6 endpoints)
1. **GET /api/trainer/dashboard** - Fetch trainer dashboard data (aggregate endpoint)
2. **POST /api/trainer/profile** - Update trainer profile
3. **GET /api/trainer/{business_id}** - Get specific trainer profile
4. **GET /api/trainer/onboard** - Check onboarding status
5. **POST /api/trainer/onboard** - Complete onboarding
6. **DELETE /api/trainer/{business_id}** - Soft-delete account

#### Search API (1 endpoint, most critical)
1. **GET /api/search** - Search trainers with ranking, filtering, pagination

#### Featured Placement API (3 endpoints)
1. **POST /api/featured/create-checkout** - Create Stripe checkout session
2. **GET /api/featured/status/{business_id}** - Get featured placement status
3. **GET /api/featured/queue-status** - Get queue status across all councils

#### Review API (4 endpoints)
1. **POST /api/reviews/create** - Submit review for trainer
2. **GET /api/reviews/{business_id}** - Get approved reviews (paginated)
3. **POST /api/reviews/{review_id}/moderate** - Approve or reject review (admin)
4. **POST /api/reviews/batch-moderate** - Batch approve/reject reviews (admin)

#### Emergency Triage API (1 endpoint, public)
1. **POST /api/emergency/triage** - Classify emergency situation, return resources

#### Admin API (5 endpoints)
1. **GET /api/admin/dashboard** - Operator dashboard (alerts, metrics, tasks)
2. **GET /api/admin/reviews/pending** - Get pending reviews for moderation
3. **GET /api/admin/refunds/pending** - Get pending refund requests
4. **POST /api/admin/refunds/{featured_placement_id}/process** - Process refund
5. **GET /api/admin/cron/status** - Check cron job health

### Key Design Principles

- RESTful API conventions for all endpoints
- TypeScript type safety for all request/response schemas
- Zod validation for runtime type checking
- Consistent error format across all endpoints
- Rate limiting per endpoint (DDoS protection)
- Caching strategy (5-min search, 1-min featured, 10-min reviews)
- MFA authentication for admin endpoints (D-013)
- OpenAPI documentation for all endpoints

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;           // error_code
  message: string;         // Human-readable error message
  code: number;            // HTTP status code
  details?: ErrorDetail[];  // Optional field-specific details
  timestamp: string;        // ISO 8601 timestamp
  request_id: string;      // Request tracking ID
}

interface ErrorDetail {
  field: string;
  reason: string;
  suggestion?: string;
}
```

### Error Codes Used

- `validation_error` (400)
- `unauthorized` (401)
- `forbidden` (403)
- `not_found` (404)
- `email_exists` (409)
- `rate_limit_exceeded` (429)
- `server_error` (500)
- `service_unavailable` (503)

### Rate Limits Summary

- Tier 1: 20 req/min per IP (Emergency Triage)
- Tier 2: 5–10 req/min per IP (Auth endpoints)
- Tier 3: 100 req/min per IP (Public Search)
- Tier 4: 1 req/min per user (Premium features)
- Tier 5: Unlimited (Authenticated internal)

### Caching Strategy

- Search Results: 5-min TTL (invalidated on profile update, featured purchase)
- Featured Status: 1-min TTL (invalidated on purchase, expiry, refund)
- Reviews: 10-min TTL (invalidated on new review, moderation action)
- Admin Dashboard: 1-min TTL (real-time priority)
- Trainer Dashboard: 5-min TTL (per-user cache)
- Queue Status: 5-min TTL (global cache)

### Pagination Defaults

- Default: 20 items/page
- Max: 100 items/page
- Min: 1 item/page
- Offset: (page - 1) * per_page

### MFA Authentication (D-013)

- Admin endpoints require TOTP verification
- TOTP secret stored securely (environment variable)
- 6-digit code, 30-second validity window
- Rate limiting: 5 attempts per 5 minutes

## Personal Notes

- Always reference DOCS/05_DATA_AND_API_CONTRACTS.md for complete API specification
- Use TypeScript interfaces for all request/response types
- Use Zod schemas for runtime validation
- Provide OpenAPI specification for all endpoints
- Implement rate limiting per endpoint tier
- Use caching strategy with appropriate TTL
- Follow RESTful conventions (GET, POST, PUT, DELETE)
- Provide consistent error format across all endpoints
