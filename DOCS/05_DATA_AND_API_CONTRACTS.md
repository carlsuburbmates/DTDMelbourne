# 05_DATA_AND_API_CONTRACTS.md – Complete API Endpoint Specification

**Dog Trainers Directory — API Routes, Data Contracts & Response Schemas**

**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Decisions Implemented:** D-003 (geography), D-004 (search API), D-006 (search ranking)  
**Technologies:** Next.js API Routes, Supabase (backend), Stripe (payments), Z.AI (triage)

---

## Executive Summary

**Single source of truth for all API contracts. Request/response schemas locked.**

- ✅ **25+ endpoints** fully specified (authentication, search, trainer, featured, reviews, emergency, admin)
- ✅ **Request/response JSON** with required vs. optional fields, enums, validation rules
- ✅ **Search API** complete (ranking, filtering, pagination, <200ms performance target)
- ✅ **Error standardization** (consistent 4xx/5xx format across all endpoints)
- ✅ **Rate limiting** per endpoint (DDoS protection, abuse prevention)
- ✅ **Caching strategy** (5-min search, 1-min featured, 10-min reviews, 1-min admin)

---

## Part 1: Authentication API (4 Endpoints)

### 1.1 POST /api/auth/signup

**Purpose:** Trainer registration (email OTP flow)

```json
{
  "endpoint": "POST /api/auth/signup",
  "auth": "None (public)",
  "rate_limit": "5 req/min per IP",
  "request": {
    "email": "trainer@example.com",
    "business_name": "Happy Paws Training",
    "council_id": "melbourne"
  },
  "request_schema": {
    "email": {
      "type": "string",
      "required": true,
      "validation": "email format, max 255 chars",
      "example": "trainer@example.com"
    },
    "business_name": {
      "type": "string",
      "required": true,
      "validation": "min 3, max 100 chars",
      "example": "Happy Paws Training"
    },
    "council_id": {
      "type": "string",
      "required": true,
      "validation": "must exist in councils table",
      "enum": ["melbourne", "monash", "stonnington", "boroondara"],
      "example": "melbourne"
    }
  },
  "response_201": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "trainer@example.com",
    "otp_sent": true,
    "message": "OTP sent to email. Expires in 10 minutes."
  },
  "response_400": {
    "error": "validation_error",
    "message": "Email is required",
    "code": 400,
    "details": [
      {
        "field": "email",
        "reason": "required"
      }
    ]
  },
  "response_409": {
    "error": "email_exists",
    "message": "Email already registered",
    "code": 409,
    "suggestion": "Try /trainer/login or use a different email"
  },
  "side_effects": [
    "Generate OTP (6 digits)",
    "Send email with OTP code",
    "Store OTP in cache (10-min TTL)",
    "Create user record (email_verified=false)",
    "Log event (audit trail)"
  ]
}
```

### 1.2 POST /api/auth/verify-otp

**Purpose:** Email OTP verification

```json
{
  "endpoint": "POST /api/auth/verify-otp",
  "auth": "None (public)",
  "rate_limit": "10 req/min per email",
  "request": {
    "email": "trainer@example.com",
    "otp_code": "123456"
  },
  "request_schema": {
    "email": {
      "type": "string",
      "required": true,
      "validation": "email format"
    },
    "otp_code": {
      "type": "string",
      "required": true,
      "validation": "exactly 6 digits",
      "example": "123456"
    }
  },
  "response_200": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email_verified": true,
    "is_first_login": true,
    "redirect": "/trainer/onboard"
  },
  "response_401": {
    "error": "invalid_otp",
    "message": "OTP code is incorrect or expired",
    "code": 401,
    "attempts_remaining": 2
  },
  "side_effects": [
    "Validate OTP against cache",
    "Update user: email_verified=true",
    "Generate JWT session token (24h expiry)",
    "Set HttpOnly secure cookie: token",
    "Log event (audit trail)"
  ]
}
```

### 1.3 POST /api/auth/login

**Purpose:** Trainer login (email OTP, no password)

```json
{
  "endpoint": "POST /api/auth/login",
  "auth": "None (public)",
  "rate_limit": "10 req/min per email",
  "request": {
    "email": "trainer@example.com"
  },
  "request_schema": {
    "email": {
      "type": "string",
      "required": true,
      "validation": "email format, must exist"
    }
  },
  "response_200": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "otp_sent": true,
    "message": "OTP sent to email. Expires in 10 minutes."
  },
  "response_404": {
    "error": "user_not_found",
    "message": "Email not registered",
    "code": 404,
    "suggestion": "Sign up at /trainer/signup"
  },
  "side_effects": [
    "Generate OTP (6 digits)",
    "Send email with OTP code",
    "Store OTP in cache (10-min TTL)",
    "Log event (audit trail)"
  ]
}
```

### 1.4 POST /api/auth/logout

**Purpose:** End session (clear tokens)

```json
{
  "endpoint": "POST /api/auth/logout",
  "auth": "Trainer (email verified)",
  "rate_limit": "Unlimited",
  "request": {},
  "response_200": {
    "success": true,
    "message": "Logged out successfully"
  },
  "side_effects": [
    "Clear HttpOnly cookie: token",
    "Clear HttpOnly cookie: mfa_verified",
    "Clear HttpOnly cookie: email_verified",
    "Invalidate session in cache",
    "Log event (audit trail)",
    "Redirect to: /"
  ]
}
```

---

## Part 2: Trainer Profile API (6 Endpoints)

### 2.1 GET /api/trainer/dashboard

**Purpose:** Fetch trainer dashboard data (aggregate endpoint)

```json
{
  "endpoint": "GET /api/trainer/dashboard",
  "auth": "Trainer (email verified)",
  "rate_limit": "Unlimited (internal)",
  "caching": "5-min TTL",
  "response_200": {
    "business_id": "550e8400-e29b-41d4-a716-446655440000",
    "profile": {
      "business_name": "Happy Paws Training",
      "age_specialties": ["Puppy", "Adult", "Senior"],
      "behavior_issues": ["Pulling", "Anxiety", "Reactivity"],
      "service_type": "Puppy Training",
      "suburb": "Hawthorn",
      "council_id": "melbourne",
      "verified": false,
      "created_at": "2025-12-25T00:00:00Z"
    },
    "featured": {
      "status": "inactive",
      "featured_until": null,
      "queue_position": 5,
      "active_slots": 3,
      "cost_aud": 22
    },
    "metrics": {
      "views_this_month": 47,
      "profile_completeness": 85,
      "reviews_count": 3,
      "avg_rating": 4.7
    },
    "reviews": [
      {
        "review_id": "rev-123",
        "rating": 5,
        "text": "Great trainer!",
        "author": "Anonymous",
        "moderation_status": "approved",
        "created_at": "2025-12-20T10:00:00Z"
      }
    ],
    "pending_refunds": []
  },
  "response_401": {
    "error": "unauthorized",
    "message": "Session expired. Please log in again.",
    "code": 401
  }
}
```

### 2.2 POST /api/trainer/profile

**Purpose:** Update trainer profile

```json
{
  "endpoint": "POST /api/trainer/profile",
  "auth": "Trainer (email verified)",
  "rate_limit": "Unlimited (internal)",
  "request": {
    "business_name": "Happy Paws Training",
    "age_specialties": ["Puppy", "Adult"],
    "behavior_issues": ["Pulling", "Anxiety"],
    "service_type": "Puppy Training",
    "suburb": "Hawthorn",
    "council_id": "melbourne",
    "bio": "Certified trainer with 10 years experience"
  },
  "request_schema": {
    "business_name": {
      "type": "string",
      "required": true,
      "validation": "min 3, max 100 chars"
    },
    "age_specialties": {
      "type": "array[string]",
      "required": true,
      "validation": "min 1, max 4 items",
      "enum": ["Puppy", "Adolescent", "Adult", "Senior"],
      "example": ["Puppy", "Adult"]
    },
    "behavior_issues": {
      "type": "array[string]",
      "required": true,
      "validation": "min 1, max 13 items",
      "enum": ["Pulling", "Anxiety", "Barking", "Aggression", "Reactivity", "Jumping", "Leash walking", "Recalls", "Socialization", "House training", "Destructive", "Separation anxiety", "Fear"],
      "example": ["Pulling", "Anxiety"]
    },
    "service_type": {
      "type": "string",
      "required": true,
      "enum": ["Puppy Training", "Obedience", "Behavior Consultation", "Board & Train"],
      "example": "Puppy Training"
    },
    "suburb": {
      "type": "string",
      "required": true,
      "validation": "must exist in suburbs table"
    },
    "council_id": {
      "type": "string",
      "required": true,
      "validation": "must match suburb"
    },
    "bio": {
      "type": "string",
      "required": false,
      "validation": "max 500 chars"
    }
  },
  "response_200": {
    "business_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "updated",
    "message": "Profile updated successfully"
  },
  "response_400": {
    "error": "validation_error",
    "message": "Invalid input",
    "code": 400,
    "details": [
      {
        "field": "age_specialties",
        "reason": "must have at least 1 item"
      }
    ]
  },
  "side_effects": [
    "Validate all fields (SQL injection prevention)",
    "Update businesses table",
    "Clear profile cache (5-min TTL)",
    "Clear search index cache",
    "Log event (audit trail)"
  ]
}
```

### 2.3 GET /api/trainer/{business_id}

**Purpose:** Get specific trainer profile (public or private based on auth)

```json
{
  "endpoint": "GET /api/trainer/{business_id}",
  "auth": "None (public) OR Trainer (own profile)",
  "rate_limit": "100 req/min per IP",
  "response_200_public": {
    "business_id": "550e8400-e29b-41d4-a716-446655440000",
    "business_name": "Happy Paws Training",
    "age_specialties": ["Puppy", "Adult"],
    "behavior_issues": ["Pulling", "Anxiety"],
    "service_type": "Puppy Training",
    "suburb": "Hawthorn",
    "verified": false,
    "avg_rating": 4.7,
    "reviews_count": 3,
    "featured_until": null
  },
  "response_403": {
    "error": "forbidden",
    "message": "You don't have permission to view this profile",
    "code": 403
  }
}
```

### 2.4 GET /api/trainer/onboard

**Purpose:** Check onboarding status (redirect logic)

```json
{
  "endpoint": "GET /api/trainer/onboard",
  "auth": "Trainer (email verified)",
  "rate_limit": "Unlimited",
  "response_200": {
    "is_onboarded": false,
    "redirect": "/trainer/onboard"
  }
}
```

### 2.5 POST /api/trainer/onboard

**Purpose:** Complete onboarding (create business profile)

```json
{
  "endpoint": "POST /api/trainer/onboard",
  "auth": "Trainer (email verified)",
  "rate_limit": "1 req/min per user",
  "request": {
    "business_name": "Happy Paws Training",
    "age_specialties": ["Puppy", "Adult"],
    "behavior_issues": ["Pulling", "Anxiety"],
    "service_type": "Puppy Training",
    "suburb": "Hawthorn",
    "council_id": "melbourne"
  },
  "response_201": {
    "business_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "created",
    "redirect": "/trainer/dashboard"
  },
  "side_effects": [
    "Create businesses record",
    "Set status='active'",
    "Set verified=false",
    "Calculate distance_km from council centroid",
    "Log event (audit trail)",
    "Redirect to: /trainer/dashboard"
  ]
}
```

### 2.6 DELETE /api/trainer/{business_id}

**Purpose:** Soft-delete account (data anonymization)

```json
{
  "endpoint": "DELETE /api/trainer/{business_id}",
  "auth": "Trainer (own business)",
  "rate_limit": "1 req/hour per user",
  "request": {
    "reason": "No longer training dogs"
  },
  "response_200": {
    "status": "deleted",
    "message": "Account has been deleted. Your data will be anonymized."
  },
  "side_effects": [
    "Soft-delete: Set businesses.deleted=true, deleted_at=NOW()",
    "Anonymize reviews: trainer_name='Deleted Trainer'",
    "Keep payment_audit (immutable, 7-year retention)",
    "Invalidate all sessions",
    "Log event (audit trail)"
  ]
}
```

---

## Part 3: Search API (1 Endpoint, Most Critical)

### 3.1 GET /api/search

**Purpose:** Search trainers with ranking, filtering, pagination

```json
{
  "endpoint": "GET /api/search",
  "auth": "None (public)",
  "rate_limit": "100 req/min per IP",
  "caching": "5-min TTL (cleared on profile update)",
  "performance_target": "<200ms",
  "query_parameters": {
    "age": {
      "type": "array[string]",
      "required": false,
      "enum": ["Puppy", "Adolescent", "Adult", "Senior", "Any"],
      "logic": "OR (multiple values allowed)",
      "example": "?age=Puppy&age=Adult"
    },
    "issues": {
      "type": "array[string]",
      "required": false,
      "enum": ["Pulling", "Anxiety", "Barking", "Aggression", "Reactivity", "Jumping", "Leash walking", "Recalls", "Socialization", "House training", "Destructive", "Separation anxiety", "Fear"],
      "logic": "OR (multiple values allowed)",
      "example": "?issues=Pulling&issues=Anxiety"
    },
    "service_type": {
      "type": "array[string]",
      "required": false,
      "enum": ["Puppy Training", "Obedience", "Behavior Consultation", "Board & Train"],
      "logic": "OR"
    },
    "suburb": {
      "type": "string",
      "required": false,
      "validation": "must exist in suburbs table, partial match allowed",
      "example": "?suburb=Hawthorn"
    },
    "council_id": {
      "type": "string",
      "required": false,
      "validation": "inferred from suburb if not provided"
    },
    "page": {
      "type": "integer",
      "required": false,
      "default": 1,
      "validation": "min 1, max 100",
      "example": "?page=2"
    },
    "per_page": {
      "type": "integer",
      "required": false,
      "default": 20,
      "validation": "min 1, max 100",
      "example": "?per_page=20"
    },
    "sort": {
      "type": "string",
      "required": false,
      "default": "featured_until,-rating",
      "enum": ["featured_until", "rating", "distance", "created_at"],
      "logic": "DESC by default (use - prefix for ASC)",
      "example": "?sort=featured_until,-rating"
    },
    "search": {
      "type": "string",
      "required": false,
      "validation": "full-text search on trainer name, suburb, service",
      "example": "?search=puppy+training"
    }
  },
  "response_200": {
    "results": [
      {
        "business_id": "550e8400-e29b-41d4-a716-446655440000",
        "business_name": "Happy Paws Training",
        "suburb": "Hawthorn",
        "age_specialties": ["Puppy", "Adult"],
        "behavior_issues": ["Pulling", "Anxiety"],
        "service_type": "Puppy Training",
        "verified": false,
        "featured_until": "2026-01-25T00:00:00Z",
        "avg_rating": 4.7,
        "reviews_count": 3,
        "distance_km": 2.5,
        "rank": 1
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 47,
      "total_pages": 3,
      "has_more": true
    },
    "filters_applied": {
      "age_specialties": ["Puppy", "Adult"],
      "behavior_issues": ["Pulling", "Anxiety"],
      "suburb": "Hawthorn",
      "council_id": "melbourne"
    }
  },
  "response_400": {
    "error": "validation_error",
    "message": "Invalid query parameter",
    "code": 400,
    "details": [
      {
        "field": "suburb",
        "reason": "Suburb not found in database"
      }
    ]
  },
  "sql_query": "SELECT * FROM businesses WHERE status='active' AND deleted=false AND age_specialties @> ARRAY[$1] AND behavior_issues @> ARRAY[$2] AND council_id=$3 ORDER BY featured_until DESC NULLS LAST, verified DESC, distance_km ASC, avg_rating DESC LIMIT 20 OFFSET 0",
  "ranking_logic": {
    "tier_1": "featured_until > NOW() (Featured trainers first)",
    "tier_2": "verified=true (Verified trainers second)",
    "tier_3": "distance_km ASC (Closest trainers third)",
    "tier_4": "avg_rating DESC (Highest rated fourth)"
  }
}
```

---

## Part 4: Featured Placement API (3 Endpoints)

### 4.1 POST /api/featured/create-checkout

**Purpose:** Create Stripe checkout session

```json
{
  "endpoint": "POST /api/featured/create-checkout",
  "auth": "Trainer (email verified)",
  "rate_limit": "1 req/min per user",
  "request": {
    "business_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "request_schema": {
    "business_id": {
      "type": "string",
      "required": true,
      "validation": "must belong to current user"
    }
  },
  "response_200": {
    "stripe_session_id": "cs_test_...",
    "checkout_url": "https://checkout.stripe.com/...",
    "amount_aud": 22,
    "currency": "AUD",
    "success_url": "https://dtd.app/trainer/featured/success?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://dtd.app/trainer/featured/cancelled"
  },
  "response_400": {
    "error": "invalid_request",
    "message": "Cannot create featured placement",
    "code": 400,
    "reason": "Already featured until 2026-01-25"
  },
  "side_effects": [
    "Validate business_id belongs to current user",
    "Check: featured_until < NOW() (not already featured)",
    "Call Stripe API: sessions.create()",
    "Store checkout_session in cache",
    "Log event (audit trail)"
  ]
}
```

### 4.2 GET /api/featured/status/{business_id}

**Purpose:** Get featured placement status

```json
{
  "endpoint": "GET /api/featured/status/{business_id}",
  "auth": "Trainer (own business) OR Admin",
  "rate_limit": "Unlimited (internal)",
  "caching": "1-min TTL",
  "response_200": {
    "business_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "featured_until": "2026-01-25T00:00:00Z",
    "queue_position": null,
    "queue_status": "not_queued",
    "active_count": 5,
    "max_slots": 10,
    "cost_aud": 22,
    "can_purchase": false,
    "reason_cannot_purchase": "Already featured"
  },
  "response_200_queued": {
    "business_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "queued",
    "featured_until": null,
    "queue_position": 3,
    "queue_status": "waiting",
    "estimated_wait_days": 14,
    "active_count": 10,
    "max_slots": 10,
    "can_purchase": false,
    "reason_cannot_purchase": "Maximum slots reached"
  },
  "response_403": {
    "error": "forbidden",
    "message": "You don't have permission to view this status",
    "code": 403
  }
}
```

### 4.3 GET /api/featured/queue-status

**Purpose:** Get queue status across all councils

```json
{
  "endpoint": "GET /api/featured/queue-status",
  "auth": "None (public)",
  "rate_limit": "100 req/min per IP",
  "caching": "5-min TTL",
  "response_200": {
    "queue_status_by_council": [
      {
        "council_id": "melbourne",
        "council_name": "Melbourne",
        "active_count": 5,
        "max_slots": 10,
        "queue_length": 3,
        "estimated_wait_days": 21,
        "queue_full": false
      },
      {
        "council_id": "monash",
        "council_name": "Monash",
        "active_count": 8,
        "max_slots": 10,
        "queue_length": 12,
        "estimated_wait_days": 42,
        "queue_full": false
      }
    ],
    "global_metrics": {
      "total_active": 45,
      "total_slots": 100,
      "utilization": 45,
      "total_queued": 87
    }
  }
}
```

---

## Part 5: Review API (4 Endpoints)

### 5.1 POST /api/reviews/create

**Purpose:** Submit review for trainer

```json
{
  "endpoint": "POST /api/reviews/create",
  "auth": "None (anonymous) OR Trainer (identified)",
  "rate_limit": "100 req/min per IP",
  "request": {
    "business_id": "550e8400-e29b-41d4-a716-446655440000",
    "rating": 5,
    "text": "Great trainer! Very knowledgeable and patient.",
    "anonymous": true
  },
  "request_schema": {
    "business_id": {
      "type": "string",
      "required": true,
      "validation": "must exist"
    },
    "rating": {
      "type": "integer",
      "required": true,
      "validation": "min 1, max 5",
      "example": 5
    },
    "text": {
      "type": "string",
      "required": true,
      "validation": "min 50, max 1000 chars",
      "example": "Great trainer! Very knowledgeable and patient."
    },
    "anonymous": {
      "type": "boolean",
      "required": true,
      "validation": "true or false",
      "example": true
    }
  },
  "response_201": {
    "review_id": "rev-550e8400-e29b-41d4-a716-446655440000",
    "business_id": "550e8400-e29b-41d4-a716-446655440000",
    "moderation_status": "pending",
    "message": "Review submitted. Pending moderation approval."
  },
  "response_400": {
    "error": "validation_error",
    "message": "Review text too short",
    "code": 400,
    "details": [
      {
        "field": "text",
        "reason": "must be at least 50 characters",
        "current_length": 30
      }
    ]
  },
  "side_effects": [
    "Validate all fields (SQL injection prevention)",
    "Create reviews record: moderation_status='pending'",
    "Queue for Z.AI moderation (async)",
    "Send admin alert if Z.AI flags (manual review)",
    "Clear review cache (10-min TTL)",
    "Log event (audit trail)"
  ]
}
```

### 5.2 GET /api/reviews/{business_id}

**Purpose:** Get approved reviews for trainer (paginated)

```json
{
  "endpoint": "GET /api/reviews/{business_id}",
  "auth": "None (public)",
  "rate_limit": "100 req/min per IP",
  "caching": "10-min TTL",
  "query_parameters": {
    "page": {
      "type": "integer",
      "required": false,
      "default": 1
    },
    "per_page": {
      "type": "integer",
      "required": false,
      "default": 10,
      "max": 50
    },
    "sort": {
      "type": "string",
      "required": false,
      "enum": ["recent", "rating_high", "rating_low"],
      "default": "recent"
    }
  },
  "response_200": {
    "business_id": "550e8400-e29b-41d4-a716-446655440000",
    "reviews": [
      {
        "review_id": "rev-123",
        "rating": 5,
        "text": "Great trainer! Very knowledgeable and patient.",
        "author": "Anonymous",
        "created_at": "2025-12-20T10:00:00Z",
        "moderation_status": "approved"
      },
      {
        "review_id": "rev-124",
        "rating": 4,
        "text": "Good service, would recommend.",
        "author": "Anonymous",
        "created_at": "2025-12-15T14:30:00Z",
        "moderation_status": "approved"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total": 3,
      "total_pages": 1
    },
    "summary": {
      "avg_rating": 4.7,
      "total_reviews": 3
    }
  },
  "response_404": {
    "error": "not_found",
    "message": "Business not found",
    "code": 404
  }
}
```

### 5.3 POST /api/reviews/{review_id}/moderate

**Purpose:** Approve or reject review (admin only)

```json
{
  "endpoint": "POST /api/reviews/{review_id}/moderate",
  "auth": "Admin (TOTP verified)",
  "rate_limit": "Unlimited (internal)",
  "request": {
    "action": "approve",
    "reason": ""
  },
  "request_schema": {
    "action": {
      "type": "string",
      "required": true,
      "enum": ["approve", "reject"],
      "example": "approve"
    },
    "reason": {
      "type": "string",
      "required": false,
      "validation": "max 255 chars (required if rejecting)",
      "example": "Offensive language"
    }
  },
  "response_200": {
    "review_id": "rev-123",
    "action": "approved",
    "moderation_status": "approved"
  },
  "response_200_reject": {
    "review_id": "rev-123",
    "action": "rejected",
    "moderation_status": "rejected",
    "reason": "Offensive language"
  },
  "side_effects": [
    "Update reviews: moderation_status='approved' or 'rejected'",
    "If approved: Clear review cache",
    "If rejected: Send email to reviewer (if identifiable)",
    "Log event (audit trail, immutable)"
  ]
}
```

### 5.4 POST /api/reviews/batch-moderate

**Purpose:** Batch approve/reject reviews (admin optimization)

```json
{
  "endpoint": "POST /api/reviews/batch-moderate",
  "auth": "Admin (TOTP verified)",
  "rate_limit": "Unlimited (internal)",
  "request": {
    "review_ids": ["rev-123", "rev-124", "rev-125"],
    "action": "approve"
  },
  "response_200": {
    "processed": 3,
    "action": "approved",
    "message": "3 reviews approved"
  }
}
```

---

## Part 6: Emergency Triage API (1 Endpoint, Public)

### 6.1 POST /api/emergency/triage

**Purpose:** Classify emergency situation, return resources

```json
{
  "endpoint": "POST /api/emergency/triage",
  "auth": "None (public, anonymous)",
  "rate_limit": "20 req/min per IP",
  "request": {
    "dog_description": "Golden Retriever, bleeding from paw, very agitated",
    "suburb": "Melbourne",
    "phone": "0412345678"
  },
  "request_schema": {
    "dog_description": {
      "type": "string",
      "required": true,
      "validation": "min 20, max 500 chars",
      "example": "Golden Retriever, bleeding from paw, very agitated"
    },
    "suburb": {
      "type": "string",
      "required": true,
      "validation": "must exist in suburbs table"
    },
    "phone": {
      "type": "string",
      "required": false,
      "validation": "Australian phone format"
    }
  },
  "response_200_medical": {
    "classification": "medical",
    "confidence": 0.94,
    "summary": "Dog appears to have injury requiring veterinary attention",
    "resources": [
      {
        "type": "emergency_vet",
        "name": "24-Hour Emergency Vet Melbourne",
        "phone": "1300 VETHELP",
        "hours": "24/7",
        "distance_km": 2.5,
        "address": "100 Brunswick St, Melbourne VIC 3000"
      },
      {
        "type": "trainer",
        "name": "Happy Paws Training",
        "phone": "0412345678",
        "hours": "9am-5pm Mon-Fri",
        "distance_km": 3.2,
        "service_type": "Behavior Consultation"
      }
    ],
    "escalation": {
      "action": "Go to emergency vet immediately",
      "reason": "Medical emergency (bleeding injury)",
      "phone": "1300 VETHELP",
      "urgent": true
    }
  },
  "response_200_crisis": {
    "classification": "crisis",
    "confidence": 0.88,
    "summary": "Dog showing dangerous/aggressive behavior",
    "resources": [
      {
        "type": "police",
        "name": "Local Police",
        "phone": "000",
        "action": "Report dangerous dog"
      },
      {
        "type": "shelter",
        "name": "RSPCA Victoria",
        "phone": "1300 ANIMAL",
        "action": "Report dangerous dog"
      }
    ],
    "escalation": {
      "action": "Call 000 if immediate danger to people",
      "reason": "Crisis classification (aggressive behavior)",
      "urgent": true
    }
  },
  "response_200_stray": {
    "classification": "stray",
    "confidence": 0.92,
    "summary": "Dog appears to be lost or abandoned",
    "resources": [
      {
        "type": "shelter",
        "name": "RSPCA Victoria",
        "phone": "1300 ANIMAL",
        "action": "Report stray dog"
      },
      {
        "type": "council",
        "name": "Melbourne City Council",
        "phone": "1300 650 461",
        "action": "Report stray dog"
      }
    ],
    "escalation": {
      "action": "Contact shelter immediately",
      "reason": "Stray dog",
      "urgent": false
    }
  },
  "response_200_normal": {
    "classification": "normal",
    "confidence": 0.85,
    "summary": "Dog does not appear to be in immediate danger",
    "resources": [
      {
        "type": "trainer",
        "name": "Happy Paws Training",
        "phone": "0412345678",
        "hours": "9am-5pm Mon-Fri",
        "service_type": "Behavior Consultation"
      }
    ],
    "escalation": {
      "action": "Consider contacting a trainer for behavior assessment",
      "reason": "Non-emergency behavior issue",
      "urgent": false
    }
  },
  "response_400": {
    "error": "validation_error",
    "message": "Suburb not found",
    "code": 400
  },
  "response_503": {
    "error": "service_unavailable",
    "message": "Z.AI service temporarily unavailable. Using fallback classification.",
    "code": 200,
    "classification": "unknown",
    "fallback": true
  },
  "side_effects": [
    "Encrypt dog_description before storing",
    "Call Z.AI API (POST https://api.z.ai/v1/classify)",
    "If Z.AI fails, use deterministic keyword rules",
    "Store in triage_logs (immutable, 1-year retention)",
    "Calculate distance_km from suburb centroid to resources",
    "Log event (minimal tracking, privacy-first)"
  ],
  "ai_processing": {
    "model": "Z.AI (primary) → z.ai (fallback) → Deterministic (final fallback)",
    "z_ai_confidence_threshold": 0.85,
    "openai_fallback_timeout": "5 seconds",
    "deterministic_keywords": {
      "medical": ["bleeding", "injury", "broken", "poison", "unconscious", "seizure"],
      "crisis": ["danger", "aggressive", "threat", "scared", "attack"],
      "stray": ["lost", "stray", "missing", "abandoned", "wandering"],
      "normal": "default"
    }
  }
}
```

---

## Part 7: Admin API (5 Endpoints)

### 7.1 GET /api/admin/dashboard

**Purpose:** Operator dashboard (alerts, metrics, tasks)

```json
{
  "endpoint": "GET /api/admin/dashboard",
  "auth": "Admin (TOTP verified)",
  "rate_limit": "Unlimited (internal)",
  "caching": "1-min TTL (real-time priority)",
  "response_200": {
    "alerts": {
      "red": [
        {
          "severity": "critical",
          "type": "z_ai_down",
          "message": "Z.AI API offline for 1h 3m",
          "timestamp": "2025-12-25T13:00:00Z",
          "action": "Check Z.AI status, consider switching to deterministic"
        }
      ],
      "yellow": [
        {
          "severity": "warning",
          "type": "high_refund_rate",
          "message": "Refund rate 18% (threshold: 15%)",
          "timestamp": "2025-12-25T12:00:00Z"
        }
      ]
    },
    "metrics": {
      "revenue": {
        "ltm": 24800,
        "mtd": 2200,
        "wtd": 520
      },
      "featured_adoption": {
        "total_trainers": 500,
        "featured_count": 90,
        "adoption_rate": 0.18
      },
      "queue": {
        "total_queued": 87,
        "avg_per_council": 12,
        "longest_queue": "monash (24)"
      },
      "refunds": {
        "rate": 0.02,
        "count_this_month": 1,
        "total_value": 22
      }
    },
    "pending_tasks": {
      "reviews": {
        "count": 51,
        "estimated_work_hours": 1.5
      },
      "refunds": {
        "count": 3,
        "estimated_work_hours": 0.5
      },
      "complaints": {
        "count": 1,
        "estimated_work_hours": 0.25
      }
    },
    "last_alerts": [
      {
        "timestamp": "2025-12-25T14:32:00Z",
        "type": "z_ai_timeout",
        "resolved": false
      },
      {
        "timestamp": "2025-12-25T13:45:00Z",
        "type": "webhook_retry",
        "resolved": true
      }
    ]
  }
}
```

### 7.2 GET /api/admin/reviews/pending

**Purpose:** Get pending reviews for moderation

```json
{
  "endpoint": "GET /api/admin/reviews/pending",
  "auth": "Admin (TOTP verified)",
  "rate_limit": "Unlimited (internal)",
  "query_parameters": {
    "page": {
      "type": "integer",
      "default": 1
    },
    "per_page": {
      "type": "integer",
      "default": 20,
      "max": 100
    }
  },
  "response_200": {
    "reviews": [
      {
        "review_id": "rev-123",
        "business_id": "550e8400-e29b-41d4-a716-446655440000",
        "business_name": "Happy Paws Training",
        "rating": 5,
        "text": "Great trainer! Very knowledgeable and patient.",
        "author": "Anonymous",
        "created_at": "2025-12-25T10:00:00Z",
        "moderation_status": "pending",
        "z_ai_score": 0.95,
        "z_ai_flag": false,
        "manual_action_required": false
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 51,
      "total_pages": 3
    }
  }
}
```

### 7.3 GET /api/admin/refunds/pending

**Purpose:** Get pending refund requests

```json
{
  "endpoint": "GET /api/admin/refunds/pending",
  "auth": "Admin (TOTP verified)",
  "rate_limit": "Unlimited (internal)",
  "response_200": {
    "refunds": [
      {
        "featured_placement_id": "fp-123",
        "business_id": "550e8400-e29b-41d4-a716-446655440000",
        "business_name": "Happy Paws Training",
        "amount_aud": 22,
        "requested_at": "2025-12-25T10:00:00Z",
        "purchased_at": "2025-12-24T14:00:00Z",
        "days_since_purchase": 1,
        "eligible_for_refund": true,
        "reason": "Not satisfied with results"
      }
    ],
    "pagination": {
      "total": 3
    }
  }
}
```

### 7.4 POST /api/admin/refunds/{featured_placement_id}/process

**Purpose:** Process refund (call Stripe API)

```json
{
  "endpoint": "POST /api/admin/refunds/{featured_placement_id}/process",
  "auth": "Admin (TOTP verified)",
  "rate_limit": "Unlimited (internal)",
  "request": {
    "action": "approve",
    "reason": "Customer request"
  },
  "response_200": {
    "featured_placement_id": "fp-123",
    "action": "approved",
    "stripe_refund_id": "re_123...",
    "amount_aud": 22,
    "status": "refunded"
  },
  "side_effects": [
    "Verify: NOW() - purchased_at < 3 days (hard constraint)",
    "Call Stripe API: refunds.create(charge_id, amount)",
    "Update payment_audit: status='refunded', refunded_at=NOW()",
    "Update featured_placements: refund_status='refunded'",
    "Send email to trainer: Refund processed",
    "Log event (audit trail, immutable)"
  ]
}
```

### 7.5 GET /api/admin/cron/status

**Purpose:** Check cron job health

```json
{
  "endpoint": "GET /api/admin/cron/status",
  "auth": "Admin (TOTP verified)",
  "rate_limit": "Unlimited (internal)",
  "response_200": {
    "jobs": [
      {
        "job_id": "featured-expiry-and-promotion",
        "last_run": "2025-12-25T02:00:00Z",
        "status": "success",
        "duration_seconds": 12,
        "next_run": "2025-12-26T02:00:00Z",
        "attempts": 1
      }
    ],
    "health": {
      "last_24h_success_rate": 1.0,
      "alerts": []
    }
  }
}
```

---

## Part 8: Error Response Format (Standardized)

**All endpoints return consistent error format:**

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "code": 400,
  "details": [
    {
      "field": "email",
      "reason": "required",
      "suggestion": "Please provide a valid email address"
    }
  ],
  "timestamp": "2025-12-25T12:34:56Z",
  "request_id": "req_abc123xyz"
}
```

**Error codes used:**
- `validation_error` (400)
- `unauthorized` (401)
- `forbidden` (403)
- `not_found` (404)
- `email_exists` (409)
- `rate_limit_exceeded` (429)
- `server_error` (500)
- `service_unavailable` (503)

---

## Part 9: Caching Strategy

```
┌────────────────────────────────────────────────────────────┐
│ CACHING STRATEGY (Performance Optimization)                │
└────────────────────────────────────────────────────────────┘

Search Results: 5-min TTL
  ├─ Invalidated on: Profile update, featured purchase
  ├─ Tool: Redis (in-memory)
  └─ Key: hash(age_specialties, issues, suburb, council_id, page)

Featured Status: 1-min TTL
  ├─ Invalidated on: Purchase, expiry, refund
  ├─ Tool: Redis
  └─ Key: featured_status_{business_id}

Reviews: 10-min TTL
  ├─ Invalidated on: New review (pending), moderation action
  ├─ Tool: Redis
  └─ Key: reviews_{business_id}_{page}

Admin Dashboard: 1-min TTL
  ├─ Real-time priority (short TTL)
  ├─ Tool: Redis
  └─ Key: admin_dashboard

Trainer Dashboard: 5-min TTL
  ├─ Per-user cache
  ├─ Tool: Redis
  └─ Key: dashboard_{business_id}

Queue Status: 5-min TTL
  ├─ Global cache
  ├─ Tool: Redis
  └─ Key: queue_status_global
```

---

## Part 10: Rate Limiting & Pagination

### 10.1 Rate Limits Summary

```
Tier 1: 20 req/min per IP (Emergency Triage)
Tier 2: 5–10 req/min per IP (Auth endpoints)
Tier 3: 100 req/min per IP (Public Search)
Tier 4: 1 req/min per user (Premium features)
Tier 5: Unlimited (Authenticated internal)
```

### 10.2 Pagination Defaults

```
Default: 20 items/page
Max: 100 items/page
Min: 1 item/page
Offset: (page - 1) * per_page
```

---

## Part 11: Webhook Contract (Stripe)

```json
{
  "webhook_endpoint": "POST /api/webhooks/stripe",
  "signature_verification": "HMAC-SHA256",
  "header": "X-Stripe-Signature",
  "events_handled": [
    "charge.succeeded",
    "charge.failed",
    "charge.refunded"
  ],
  "processing": {
    "strategy": "Idempotent (store event_id to prevent duplicates)",
    "retry": "Stripe handles retries (not our responsibility)",
    "timeout": "5 seconds (quick response required)"
  },
  "response_200": {
    "status": "received",
    "event_id": "evt_..."
  }
}
```

---

**Document Version:** 1.0  
**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Owner:** Architecture + Backend Team  
**Next Document:** 07_AI_AUTOMATION_AND_MODES.md (Z.AI integration, fallback rules)

---

**End of 05_DATA_AND_API_CONTRACTS.md**
