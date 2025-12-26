# API Contract Designer Knowledge Base

## API Contract Reference

Primary reference document: [`DOCS/05_DATA_AND_API_CONTRACTS.md`](../../DOCS/05_DATA_AND_API_CONTRACTS.md:1)

### Endpoint Categories (25+ total)

#### Authentication API (4 endpoints)
| Endpoint | Method | Auth | Rate Limit |
|----------|--------|------|------------|
| POST /api/auth/signup | POST | None (public) | 5 req/min per IP |
| POST /api/auth/verify-otp | POST | None (public) | 10 req/min per email |
| POST /api/auth/login | POST | None (public) | 10 req/min per email |
| POST /api/auth/logout | POST | Trainer (email verified) | Unlimited |

#### Trainer Profile API (6 endpoints)
| Endpoint | Method | Auth | Rate Limit | Caching |
|----------|--------|------|------------|---------|
| GET /api/trainer/dashboard | GET | Trainer (email verified) | Unlimited | 5-min TTL |
| POST /api/trainer/profile | POST | Trainer (email verified) | Unlimited | 5-min TTL |
| GET /api/trainer/{business_id} | GET | None (public) OR Trainer (own profile) | 100 req/min per IP | - |
| GET /api/trainer/onboard | GET | Trainer (email verified) | Unlimited | - |
| POST /api/trainer/onboard | POST | Trainer (email verified) | 1 req/min per user | - |
| DELETE /api/trainer/{business_id} | DELETE | Trainer (own business) | 1 req/hour per user | - |

#### Search API (1 endpoint, most critical)
| Endpoint | Method | Auth | Rate Limit | Caching | Performance Target |
|----------|--------|------|------------|---------|------------------|
| GET /api/search | GET | None (public) | 100 req/min per IP | 5-min TTL | <200ms |

#### Featured Placement API (3 endpoints)
| Endpoint | Method | Auth | Rate Limit | Caching |
|----------|--------|------|------------|---------|
| POST /api/featured/create-checkout | POST | Trainer (email verified) | 1 req/min per user | - |
| GET /api/featured/status/{business_id} | GET | Trainer (own business) OR Admin | Unlimited | 1-min TTL |
| GET /api/featured/queue-status | GET | None (public) | 100 req/min per IP | 5-min TTL |

#### Review API (4 endpoints)
| Endpoint | Method | Auth | Rate Limit | Caching |
|----------|--------|------|------------|---------|
| POST /api/reviews/create | POST | None (anonymous) OR Trainer (identified) | 100 req/min per IP | - |
| GET /api/reviews/{business_id} | GET | None (public) | 100 req/min per IP | 10-min TTL |
| POST /api/reviews/{review_id}/moderate | POST | Admin (TOTP verified) | Unlimited | - |
| POST /api/reviews/batch-moderate | POST | Admin (TOTP verified) | Unlimited | - |

#### Emergency Triage API (1 endpoint, public)
| Endpoint | Method | Auth | Rate Limit | Performance Target |
|----------|--------|------|------------|------------------|
| POST /api/emergency/triage | POST | None (public, anonymous) | 20 req/min per IP | <500ms |

#### Admin API (5 endpoints)
| Endpoint | Method | Auth | Rate Limit | Caching |
|----------|--------|------|------------|---------|
| GET /api/admin/dashboard | GET | Admin (TOTP verified) | Unlimited | 1-min TTL |
| GET /api/admin/reviews/pending | GET | Admin (TOTP verified) | Unlimited | - |
| GET /api/admin/refunds/pending | GET | Admin (TOTP verified) | Unlimited | - |
| POST /api/admin/refunds/{featured_placement_id}/process | POST | Admin (TOTP verified) | Unlimited | - |
| GET /api/admin/cron/status | GET | Admin (TOTP verified) | Unlimited | - |

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

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| validation_error | 400 | Invalid input data |
| unauthorized | 401 | Session expired or invalid credentials |
| forbidden | 403 | Permission denied |
| not_found | 404 | Resource not found |
| email_exists | 409 | Email already registered |
| rate_limit_exceeded | 429 | Too many requests |
| server_error | 500 | Internal server error |
| service_unavailable | 503 | Service temporarily unavailable |

### Rate Limits Summary

| Tier | Rate Limit | Scope |
|------|-------------|--------|
| Tier 1 | 20 req/min per IP | Emergency Triage |
| Tier 2 | 5–10 req/min per IP | Auth endpoints |
| Tier 3 | 100 req/min per IP | Public Search |
| Tier 4 | 1 req/min per user | Premium features |
| Tier 5 | Unlimited | Authenticated internal |

### Caching Strategy

| Cache Type | TTL | Invalidation Triggers |
|------------|-----|---------------------|
| Search Results | 5-min | Profile update, featured purchase |
| Featured Status | 1-min | Purchase, expiry, refund |
| Reviews | 10-min | New review (pending), moderation action |
| Admin Dashboard | 1-min | Real-time priority |
| Trainer Dashboard | 5-min | Per-user cache |
| Queue Status | 5-min | Global cache |

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

### Webhook Contract (Stripe)

| Property | Value |
|----------|-------|
| Webhook Endpoint | POST /api/webhooks/stripe |
| Signature Verification | HMAC-SHA256 |
| Header | X-Stripe-Signature |
| Events Handled | charge.succeeded, charge.failed, charge.refunded |
| Processing Strategy | Idempotent (store event_id to prevent duplicates) |
| Retry | Stripe handles retries (not our responsibility) |
| Timeout | 5 seconds (quick response required) |

## Architectural Decisions

| Decision | Implementation |
|----------|----------------|
| D-003 (geography) | Suburb-first UX, council auto-assignment |
| D-004 (search API) | Enum-driven taxonomy, type-safe filtering |
| D-006 (search ranking) | Featured first, verified second, distance third, rating fourth |
| D-013 (MFA) | TOTP for admin endpoints, 6-digit code, 30-second window |
| RESTful conventions | GET, POST, PUT, DELETE with proper HTTP semantics |
| TypeScript types | All request/response schemas typed |
| Zod validation | Runtime type checking for all request bodies |
| Rate limiting | Per endpoint tier (DDoS protection) |
| Caching | TTL-based invalidation strategy |

## Performance Targets

- Search queries: <200ms
- Emergency triage: <500ms
- Featured status: <100ms
- Review moderation: <500ms
- Admin dashboard: <1s
