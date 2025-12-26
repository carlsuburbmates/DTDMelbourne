# 04_ROUTES_AND_NAVIGATION.md – Complete URL Structure & Auth Boundaries

**Dog Trainers Directory — Routing & Navigation Specification**

**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Decisions Implemented:** D-003 (geography), D-006 (search ranking)  
**Technologies:** Next.js App Router, Middleware (auth), Rate limiting (Vercel)

---

## Executive Summary

**Single responsibility per route. Clear auth boundaries. No ambiguity.**

- ✅ **40+ routes** mapped (public, trainer, admin, emergency, API, static)
- ✅ **4 auth levels** (public, trainer, admin, emergency)
- ✅ **Protected resources** enforced at middleware (cannot bypass)
- ✅ **URL conventions** locked (kebab-case, UUID IDs, no trailing slashes)
- ✅ **Rate limiting** per endpoint (DDoS protection)
- ✅ **Redirects** explicit (post-signup, post-purchase, post-logout)

---

## Part 1: Complete Route Map (40+ Routes)

### 1.1 Public Routes (No Authentication Required)

```
┌─────────────────────────────────────────────────────────────┐
│ PUBLIC ROUTES (Anonymous Access)                            │
└─────────────────────────────────────────────────────────────┘

GET  /                              Home page (landing)
GET  /search                        Search trainers (core journey)
GET  /search/results                Search results page (paginated)
GET  /trainer/{id}                  Trainer profile (public view)
GET  /emergency                     Emergency triage form
POST /api/emergency/triage          Emergency triage API
GET  /terms                         Terms & conditions
GET  /privacy                       Privacy policy
GET  /contact                       Contact form / support
GET  /health                        Health check (monitoring)
GET  /_next/...                     Next.js static assets
GET  /public/...                    Static files (logo, favicon)
GET  /favicon.ico                   Favicon
GET  /robots.txt                    SEO robots
GET  /sitemap.xml                   SEO sitemap

Query Parameters Allowed:
  /search?age=Puppy&issues=Pulling&suburb=Hawthorn&page=1&per_page=20&sort=rating
  /search/results?q=dog+training&council=melbourne
  /emergency?suburb=melbourne&phone=0412345678
  /trainer/{id}?tab=reviews&sort=recent

Status Codes:
  - 200: Success
  - 404: Not found (trainer, page)
  - 429: Rate limit exceeded
```

### 1.2 Trainer Routes (Email OTP Auth Required)

```
┌─────────────────────────────────────────────────────────────┐
│ TRAINER ROUTES (Email OTP Auth Required)                    │
│ Middleware: Verify JWT token, user_id present, email_verified │
└─────────────────────────────────────────────────────────────┘

AUTHENTICATION & ONBOARDING:
  GET  /trainer/signup                  Signup page (public entry)
  POST /api/auth/signup                 Signup API
  GET  /trainer/verify-otp              OTP verification page
  POST /api/auth/verify-otp             OTP verification API
  GET  /trainer/onboard                 Onboarding wizard (1st time)
  POST /api/trainer/onboard             Save business profile
  GET  /trainer/login                   Login page (public)
  POST /api/auth/login                  Login API
  POST /api/auth/logout                 Logout API

TRAINER DASHBOARD & PROFILE:
  GET  /trainer/dashboard               Main dashboard
  GET  /api/trainer/dashboard           Dashboard data (aggregate)
  GET  /trainer/profile                 Profile edit page
  POST /api/trainer/profile             Update profile API
  GET  /trainer/profile/preview         Preview profile (how it looks)
  PUT  /api/trainer/{business_id}       Update business details
  DELETE /api/trainer/{business_id}     Delete account (soft delete)

FEATURED PLACEMENT:
  GET  /trainer/featured                Featured status page
  GET  /api/featured/status/{id}        Get featured status
  POST /api/payments/create-checkout    Create Stripe session
  GET  /trainer/featured/success        Post-purchase confirmation
  GET  /trainer/featured/cancelled      Purchase cancelled
  POST /api/featured/create-checkout    Initiate purchase
  GET  /trainer/queue-status            Queue position & ETA

REVIEWS & FEEDBACK:
  GET  /trainer/reviews                 Reviews page (all reviews)
  GET  /api/trainer/reviews             Get reviews list
  POST /api/reviews/create              Submit review (reply to review)
  GET  /api/reviews/{business_id}       Get reviews for business

ACCOUNT & SETTINGS:
  GET  /trainer/account                 Account settings
  GET  /trainer/account/security        Security & MFA
  POST /api/auth/change-password        Change password (future)
  GET  /trainer/account/data            Data export
  POST /api/auth/logout                 Logout

Auth Enforcement:
  ├─ Redirect if not logged in: → /trainer/login
  ├─ Redirect if email not verified: → /trainer/verify-otp
  ├─ Trainer isolation: Can only see own {business_id}
  ├─ Cannot access: /admin/*, /api/admin/*
  └─ Session: 24-hour JWT expiry

Status Codes:
  - 200: Success
  - 201: Created (new profile)
  - 401: Unauthorized (no token)
  - 403: Forbidden (wrong trainer_id)
  - 404: Not found
  - 409: Conflict (email exists)
  - 429: Rate limit exceeded
```

### 1.3 Admin Operator Routes (MFA TOTP Required)

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN OPERATOR ROUTES (MFA TOTP Required)                   │
│ Middleware: Verify JWT, admin role, TOTP verified           │
│ Operator workflow: 4h/week, pull-based (D-010)              │
└─────────────────────────────────────────────────────────────┘

ADMIN DASHBOARD & ALERTS:
  GET  /admin                           Main admin dashboard
  GET  /api/admin/dashboard             Dashboard metrics (real-time)
  GET  /admin/alerts                    Red alerts page
  GET  /api/admin/alerts                Get alert list
  POST /api/admin/alerts/clear          Clear alert

REVIEW MODERATION (1–2h per week):
  GET  /admin/reviews                   Pending reviews list
  GET  /api/admin/reviews/pending       Pending reviews (paginated)
  GET  /admin/reviews/{id}              Review detail
  POST /api/admin/reviews/{id}/approve  Approve review
  POST /api/admin/reviews/{id}/reject   Reject review
  POST /api/admin/reviews/batch         Batch approve/reject

FEATURED PLACEMENTS & QUEUE:
  GET  /admin/featured                  Featured placements list
  GET  /api/admin/featured/queue        Queue status per council
  GET  /api/admin/featured/capacity     Slot utilization
  GET  /admin/featured/{id}             Placement detail
  PUT  /api/admin/featured/{id}         Override placement (if needed)

PAYMENT & REFUND MANAGEMENT (30 min per week):
  GET  /admin/payments                  Payment history
  GET  /api/admin/payments              Payments (paginated)
  GET  /admin/refunds                   Refund requests
  GET  /api/admin/refunds/pending       Pending refunds
  POST /api/admin/refunds/{id}/process  Process refund (Stripe API)
  POST /api/admin/refunds/{id}/deny     Deny refund (outside 3 days)
  GET  /admin/reconciliation            Payment reconciliation
  GET  /api/admin/reconciliation        Stripe vs. DB comparison

CRON JOB MONITORING (10 min per week):
  GET  /admin/cron                      Cron job logs
  GET  /api/admin/cron/status           Last execution status
  POST /api/admin/cron/run-featured     Manually trigger cron
  GET  /admin/cron/{job_id}             Job execution detail

TRAINER & BUSINESS MANAGEMENT:
  GET  /admin/trainers                  All trainers list
  GET  /api/admin/trainers              Trainers (paginated)
  GET  /admin/trainers/{id}             Trainer detail
  GET  /admin/businesses                All businesses
  POST /api/admin/businesses/{id}/flag  Flag profile for review
  POST /api/admin/businesses/{id}/suspend Suspend business

COMPLAINT & INVESTIGATION (30 min–1h per week):
  GET  /admin/complaints                Complaints list
  GET  /api/admin/complaints            Complaints (paginated)
  GET  /admin/complaints/{id}           Complaint detail
  POST /api/admin/complaints/{id}/investigate Mark as investigated
  POST /api/admin/complaints/{id}/resolve Resolve complaint

LOGS & AUDIT:
  GET  /admin/logs                      System logs
  GET  /api/admin/logs                  Logs (paginated, filterable)
  GET  /admin/logs/audit                Audit trail (immutable)
  GET  /admin/logs/security             Security events

Auth Enforcement:
  ├─ Redirect if not logged in: → /admin/login
  ├─ Redirect if MFA not verified: → /admin/mfa
  ├─ Admin role check: user.role = 'admin'
  ├─ Cannot access: /trainer/*, /api/trainer/* (isolated)
  ├─ Cannot DELETE data: Only PATCH/POST (approve/reject, no hard deletes)
  └─ Session: 24-hour JWT expiry, re-verify TOTP every 8 hours

Status Codes:
  - 200: Success
  - 201: Created
  - 401: Unauthorized (no token)
  - 403: Forbidden (not admin, TOTP not verified)
  - 404: Not found
  - 429: Rate limit exceeded (admin: unlimited, but logged)
```

### 1.4 Emergency Routes (Public, No Auth, Rate-Limited)

```
┌─────────────────────────────────────────────────────────────┐
│ EMERGENCY ROUTES (Public, Rate-Limited)                     │
│ Auth: None (anonymous access)                               │
│ Rate limit: 20 req/min per IP (DDoS protection)             │
│ Sensitive data: Dog description encrypted, minimal logging  │
└─────────────────────────────────────────────────────────────┘

EMERGENCY TRIAGE:
  GET  /emergency                       Emergency form page
  POST /api/emergency/triage            Triage API (Z.AI integration)
  GET  /emergency/results               Triage results page
  GET  /emergency/success               Success page (after register optional)

Triage Request Flow:
  1. User fills form: Dog description, suburb, phone
  2. POST /api/emergency/triage
  3. Z.AI classifies: medical|crisis|stray|normal
  4. Returns: Resources (vets, shelters, trainers)
  5. Optional: User can register to save results

Query Parameters:
  /emergency?suburb=melbourne&phone=optional
  /emergency/results?classification=crisis&ref_id={triage_id}

Response Payload (Example):
  {
    "classification": "crisis",
    "confidence": 0.92,
    "resources": [
      {
        "type": "emergency_vet",
        "name": "24-Hour Emergency Vet",
        "phone": "1300 VETHELP",
        "hours": "24/7",
        "distance_km": 2.5
      },
      {
        "type": "trainer",
        "name": "Dog Trainer A",
        "phone": "0412345678",
        "hours": "9am-5pm"
      }
    ],
    "escalation": {
      "action": "Call 000 immediately",
      "reason": "Crisis classification (aggressive/dangerous behavior)"
    }
  }

Status Codes:
  - 200: Success
  - 400: Invalid input (suburb not found)
  - 429: Rate limit exceeded
  - 503: Z.AI unavailable (fallback to deterministic)
```

### 1.5 API Routes (Backend-Only, No UI)

```
┌─────────────────────────────────────────────────────────────┐
│ API ROUTES (Backend-Only, No UI)                            │
│ All under /api/* path                                       │
│ Include: Rate limiting, error handling, logging             │
└─────────────────────────────────────────────────────────────┘

WEBHOOKS (No Auth, Signature Verification):
  POST /api/webhooks/stripe             Stripe payment events
  POST /api/webhooks/z-ai               Z.AI classification events (future)

CRON JOBS (Vercel Secret Auth):
  GET  /api/cron/featured-expiry-and-promotion  Daily at 2am AEDT
  GET  /api/cron/cleanup                        Weekly cleanup (future)

HEALTH & MONITORING:
  GET  /api/health                      System health check
  GET  /api/health/db                   Database connectivity
  GET  /api/health/stripe               Stripe API status
  GET  /api/health/z-ai                 Z.AI API status

INTERNAL SERVICES (API Key Auth):
  POST /api/internal/sync-search        Rebuild search index (future)
  POST /api/internal/generate-invoice   Generate invoice (Phase 2)

Status Codes:
  - 200: Success
  - 400: Bad request
  - 401: Unauthorized (missing auth)
  - 403: Forbidden (invalid signature)
  - 500: Server error
```

### 1.6 Static & Error Routes

```
┌─────────────────────────────────────────────────────────────┐
│ STATIC & ERROR ROUTES                                       │
└─────────────────────────────────────────────────────────────┘

STATIC PAGES:
  GET  /terms                           Terms & conditions
  GET  /privacy                         Privacy policy
  GET  /contact                         Contact form
  GET  /about                           About DTD
  GET  /help                            Help / FAQ

ERROR PAGES (Automatic Redirects):
  GET  /404                             Not found
  GET  /500                             Server error
  GET  /403                             Forbidden
  GET  /401                             Unauthorized
  GET  /429                             Rate limit exceeded
  GET  /maintenance                     Feature disabled (feature flag)

STATIC ASSETS:
  GET  /favicon.ico                     Favicon
  GET  /robots.txt                      SEO robots
  GET  /sitemap.xml                     SEO sitemap
  GET  /logo.png                        Logo
  GET  /logo-dark.png                   Dark mode logo
  GET  /.well-known/...                 Well-known URLs (ACME, etc.)
```

---

## Part 2: Master Route Table (Complete Reference)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ MASTER ROUTE TABLE (40+ Routes)                                              │
└──────────────────────────────────────────────────────────────────────────────┘

| Route | Method | Auth | Role | Purpose | Status | Rate Limit |
|-------|--------|------|------|---------|--------|-----------|
| / | GET | None | Public | Home/Landing | 200 | 1000/min |
| /search | GET | None | Public | Search trainers | 200 | 100/min |
| /trainer/{id} | GET | None | Public | View profile | 200, 404 | 100/min |
| /emergency | GET | None | Public | Emergency form | 200 | 20/min |
| /api/emergency/triage | POST | None | Public | Triage API | 200, 400, 503 | 20/min |
| /trainer/signup | GET | None | Public | Signup form | 200 | 5/min |
| /api/auth/signup | POST | None | Public | Register | 201, 409, 400 | 5/min |
| /trainer/verify-otp | GET | None | Public | OTP form | 200 | 10/min |
| /api/auth/verify-otp | POST | None | Public | Verify OTP | 200, 401, 400 | 10/min |
| /trainer/login | GET | None | Public | Login form | 200 | 10/min |
| /api/auth/login | POST | None | Public | Login | 200, 401, 400 | 10/min |
| /trainer/dashboard | GET | Trainer | Trainer | Dashboard | 200, 401 | Unlimited |
| /api/trainer/dashboard | GET | Trainer | Trainer | Dashboard data | 200, 401 | Unlimited |
| /trainer/profile | GET | Trainer | Trainer | Edit profile | 200, 401 | Unlimited |
| /api/trainer/profile | POST | Trainer | Trainer | Update profile | 200, 400, 401 | Unlimited |
| /trainer/featured | GET | Trainer | Trainer | Featured status | 200, 401 | Unlimited |
| /api/featured/status/{id} | GET | Trainer | Trainer | Get status | 200, 401, 403 | Unlimited |
| /api/payments/create-checkout | POST | Trainer | Trainer | Stripe session | 200, 400, 401 | 1/min |
| /trainer/reviews | GET | Trainer | Trainer | Reviews list | 200, 401 | Unlimited |
| /admin/dashboard | GET | Admin | Admin | Admin dashboard | 200, 401, 403 | Unlimited |
| /api/admin/dashboard | GET | Admin | Admin | Dashboard data | 200, 401, 403 | Unlimited |
| /admin/reviews | GET | Admin | Admin | Pending reviews | 200, 401, 403 | Unlimited |
| /api/admin/reviews/pending | GET | Admin | Admin | Reviews (paginated) | 200, 401, 403 | Unlimited |
| /api/admin/reviews/{id}/approve | POST | Admin | Admin | Approve review | 200, 400, 401, 403 | Unlimited |
| /admin/payments | GET | Admin | Admin | Payment history | 200, 401, 403 | Unlimited |
| /api/admin/refunds/{id}/process | POST | Admin | Admin | Process refund | 200, 400, 401, 403 | Unlimited |
| /admin/cron | GET | Admin | Admin | Cron logs | 200, 401, 403 | Unlimited |
| /api/health | GET | None | Public | Health check | 200, 503 | 100/min |
| /terms | GET | None | Public | Terms | 200 | 1000/min |
| /privacy | GET | None | Public | Privacy | 200 | 1000/min |
| /contact | GET | None | Public | Contact | 200 | 100/min |
| /404 | GET | None | Public | Not found | 404 | Unlimited |
| /500 | GET | None | Public | Server error | 500 | Unlimited |
| /favicon.ico | GET | None | Public | Favicon | 200, 404 | 1000/min |
| /robots.txt | GET | None | Public | SEO robots | 200 | 1000/min |
| /sitemap.xml | GET | None | Public | SEO sitemap | 200 | 1000/min |
| /api/webhooks/stripe | POST | Signature | Internal | Stripe webhook | 200, 400 | Unlimited |
| /api/cron/featured-expiry-and-promotion | GET | Vercel Secret | Internal | Daily cron | 200, 500 | Unlimited |
```

---

## Part 3: Auth Boundaries & Middleware

### 3.1 Middleware Enforcement

```typescript
// File: /middleware.ts (Next.js)

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 1. Public routes (no auth required)
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // 2. Trainer routes (email OTP required)
  if (pathname.startsWith('/trainer') || pathname.startsWith('/api/trainer')) {
    const token = request.cookies.get('token')?.value;
    const emailVerified = request.cookies.get('email_verified')?.value;
    
    if (!token || !emailVerified) {
      return NextResponse.redirect(new URL('/trainer/login', request.url));
    }
    
    // Verify JWT validity
    try {
      const decoded = verifyJWT(token);
      if (decoded.exp < Date.now() / 1000) {
        return NextResponse.redirect(new URL('/trainer/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/trainer/login', request.url));
    }
  }
  
  // 3. Admin routes (TOTP required)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('token')?.value;
    const mfaVerified = request.cookies.get('mfa_verified')?.value;
    
    if (!token || !mfaVerified) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Verify admin role
    try {
      const decoded = verifyJWT(token);
      if (decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/forbidden', request.url));
      }
      if (decoded.exp < Date.now() / 1000) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/search',
    '/trainer/',
    '/emergency',
    '/terms',
    '/privacy',
    '/contact',
    '/health',
    '/api/emergency/triage',
    '/api/webhooks/stripe',
    '/api/cron/featured-expiry-and-promotion',
  ];
  return publicRoutes.some(route => pathname.startsWith(route));
}
```

### 3.2 Auth Levels (4 Tiers)

```
┌────────────────────────────────────────────────────────────┐
│ AUTH LEVELS                                                 │
└────────────────────────────────────────────────────────────┘

LEVEL 0: PUBLIC (No Authentication)
  ├─ Routes: /, /search, /emergency, /terms, /privacy
  ├─ Token required: No
  ├─ Rate limit: Standard (100–1000 req/min)
  └─ Access: Anyone

LEVEL 1: TRAINER (Email OTP Verified)
  ├─ Routes: /trainer/*, /api/trainer/*
  ├─ Token required: JWT (24-hour expiry)
  ├─ Email verified: Yes (OTP confirmation)
  ├─ Rate limit: Unlimited (internal)
  ├─ Access: Logged-in trainers only
  └─ Isolation: Can only access own {business_id}

LEVEL 2: ADMIN (MFA TOTP Verified)
  ├─ Routes: /admin/*, /api/admin/*
  ├─ Token required: JWT (24-hour expiry)
  ├─ Email verified: Yes
  ├─ MFA verified: Yes (TOTP 6-digit code)
  ├─ Role check: user.role = 'admin'
  ├─ Rate limit: Unlimited (all actions logged)
  ├─ Access: Admin operators only
  └─ Permissions: Read all, write limited (approve/reject only, no delete)

LEVEL 3: EMERGENCY (Rate-Limited, No Auth)
  ├─ Routes: /api/emergency/triage
  ├─ Token required: No
  ├─ Rate limit: 20 req/min per IP (strict)
  ├─ Access: Anyone (anonymous)
  └─ Tracking: Minimal (don't track user, just IP for rate limit)

LEVEL 4: INTERNAL (API Key or Vercel Secret)
  ├─ Routes: /api/webhooks/stripe, /api/cron/*
  ├─ Auth: Signature verification (Stripe) or Vercel secret header
  ├─ Rate limit: Unlimited (internal only)
  └─ Access: Stripe, Vercel, internal services only
```

### 3.3 Protected Resource Logic

```
PRINCIPLE: Trainer Isolation (Trainer cannot access other trainers' data)

Rule 1: Trainer Edit Own Profile Only
  GET  /api/trainer/{business_id}
       ├─ If business_id = current user's business → ALLOW
       ├─ If business_id ≠ current user's business → 403 FORBIDDEN
       └─ Enforced in: RLS policy (Supabase)

Rule 2: Trainer View Own Dashboard Only
  GET  /api/trainer/dashboard
       ├─ Returns: current user's data
       └─ No business_id parameter (implicit from JWT)

Rule 3: Trainer View Own Reviews Only
  GET  /api/trainer/reviews
       ├─ Returns: reviews for current user's business
       └─ Cannot see reviews of other businesses

Rule 4: Trainer View Own Featured Status Only
  GET  /api/featured/status/{business_id}
       ├─ If business_id = current user's business → ALLOW
       ├─ If business_id ≠ current user's business → 403 FORBIDDEN
       └─ Can view featured until date, queue position

Rule 5: Admin Can See All Data (Read)
  GET  /api/admin/reviews
       ├─ Returns: ALL pending reviews across ALL businesses
       └─ No isolation (admin access)

Rule 6: Admin Cannot Delete (Approve/Reject Only)
  POST /api/admin/reviews/{id}/approve
       ├─ Update: moderation_status = 'approved'
       ├─ Cannot: DELETE review record
       └─ Reason: Audit trail preservation

Rule 7: Unauthenticated User Cannot Access Trainer Routes
  GET  /trainer/dashboard (no token)
       ├─ Middleware intercepts
       ├─ Redirects to: /trainer/login
       └─ Returns: 302 (redirect)
```

---

## Part 4: Redirects & Flow Logic

### 4.1 Post-Auth Redirects

```
SIGNUP FLOW:
  1. GET  /trainer/signup (form)
  2. POST /api/auth/signup (register email)
  3. Response: {user_id, otp_sent}
  4. Redirect to: /trainer/verify-otp
  5. User enters OTP
  6. POST /api/auth/verify-otp
  7. Response: {session_token}
  8. Set cookie: token = session_token
  9. Redirect to: /trainer/onboard (1st time only)
  10. User fills business info
  11. POST /api/trainer/onboard
  12. Response: {business_id}
  13. Redirect to: /trainer/dashboard (success!)

FORGOT OTP FLOW:
  1. User clicks "Didn't get code?"
  2. POST /api/auth/resend-otp
  3. New OTP sent to email
  4. User enters new code
  5. POST /api/auth/verify-otp (again)
  6. Same redirect as step 7 above

LOGIN FLOW (Existing Trainer):
  1. GET  /trainer/login (form)
  2. POST /api/auth/login (email only, no password)
  3. Response: {otp_sent}
  4. Redirect to: /trainer/verify-otp
  5. Rest: Same as signup flow steps 5–7

ADMIN LOGIN FLOW:
  1. GET  /admin/login (form)
  2. POST /api/auth/admin-login (email)
  3. Response: {otp_sent}
  4. Redirect to: /admin/verify-otp
  5. User enters OTP
  6. POST /api/auth/verify-otp
  7. Response: {requires_mfa: true}
  8. Redirect to: /admin/mfa-setup (if first time) OR /admin/verify-mfa (if setup)
  9. User enters TOTP code from authenticator
  10. POST /api/auth/verify-mfa
  11. Response: {session_token, mfa_verified}
  12. Set cookies: token, mfa_verified
  13. Redirect to: /admin/dashboard (success!)
```

### 4.2 Post-Action Redirects

```
POST-FEATURED-PURCHASE:
  1. User clicks [Promote] button
  2. POST /api/payments/create-checkout
  3. Response: {stripe_session_id}
  4. Redirect to: Stripe Checkout (external)
  5. User pays
  6. Stripe redirects to: /trainer/featured/success?session_id=cs_...
  7. Dashboard shows: "✅ Your profile is now featured" OR "⏳ You're queued"

POST-REFUND-REQUEST:
  1. User clicks [Request Refund]
  2. POST /api/trainer/refund-request
  3. Response: {request_id, status}
  4. Redirect to: /trainer/refund-confirmation?id=...
  5. Dashboard shows: "Your refund request was submitted"

POST-PROFILE-UPDATE:
  1. User edits profile
  2. POST /api/trainer/profile
  3. Response: {business_id, status}
  4. Stay on: /trainer/profile (same page, show success message)
  5. Or redirect to: /trainer/dashboard?success=profile_updated

POST-REVIEW-APPROVAL (Admin):
  1. Admin clicks [Approve] on review
  2. POST /api/admin/reviews/{id}/approve
  3. Response: {status: 'approved'}
  4. Refresh: /admin/reviews (stay on page, update UI)
  5. Or redirect to: /admin/reviews?filter=approved (filter view)

POST-LOGOUT:
  1. User clicks [Logout]
  2. POST /api/auth/logout
  3. Response: {success: true}
  4. Clear cookies: token, mfa_verified, email_verified
  5. Redirect to: / (home page)
```

### 4.3 Error Redirects

```
UNAUTHORIZED (401):
  ├─ No token in cookie
  ├─ Token expired
  ├─ Token invalid (signature mismatch)
  ├─ Action: Redirect to /trainer/login
  └─ Message: "Session expired. Please log in again."

FORBIDDEN (403):
  ├─ Trainer accessing other trainer's data
  ├─ Trainer accessing /admin/* routes
  ├─ Admin without MFA verification
  ├─ Action: Redirect to /403
  └─ Message: "You don't have permission to access this page."

NOT FOUND (404):
  ├─ Trainer ID doesn't exist
  ├─ Business not found
  ├─ Route doesn't exist
  ├─ Action: Redirect to /404
  └─ Message: "Page not found."

RATE LIMIT EXCEEDED (429):
  ├─ Too many requests from IP
  ├─ Action: Redirect to /429
  ├─ Header: Retry-After (seconds)
  └─ Message: "Too many requests. Please try again later."

SERVER ERROR (500):
  ├─ Database down
  ├─ API timeout
  ├─ Unhandled exception
  ├─ Action: Redirect to /500
  └─ Message: "Something went wrong. Our team has been notified."
```

---

## Part 5: URL Conventions

### 5.1 Naming Standards (Locked)

```
┌────────────────────────────────────────────────────────────┐
│ URL CONVENTIONS (IMMUTABLE)                                │
└────────────────────────────────────────────────────────────┘

NAMING:
  ✅ Kebab-case: /trainer-dashboard, /featured-status
  ✅ Lowercase: /search, /emergency, /admin (never /SEARCH)
  ✅ Plural for collections: /reviews, /trainers, /alerts
  ✅ Singular for resources: /trainer/{id}, /review/{id}
  ✅ Verb for actions: /search (GET), /approve (POST)

INVALID PATTERNS:
  ❌ CamelCase: /trainerDashboard
  ❌ UPPER_CASE: /FEATURED_STATUS
  ❌ Underscores: /trainer_dashboard (except in query params)
  ❌ Mixed: /trainer-Dashboard, /review_id

RESOURCE IDs:
  ✅ UUIDs: /trainer/{uuid}/profile
  ✅ UUIDs: /review/{uuid}/approve
  ❌ Human-readable: /trainer/john-smith
  ❌ Sequential integers: /trainer/123
  Reason: Security, privacy, no information leakage

TRAILING SLASHES:
  ✅ No trailing slash: /trainer/dashboard
  ❌ Trailing slash: /trainer/dashboard/
  Middleware enforcement: Strip trailing slash → 301 redirect

QUERY PARAMETERS:
  ✅ Lowercase: /search?age=Puppy&suburb=Hawthorn
  ✅ Kebab-case in values: /search?sort=featured-until
  ✅ Pagination: ?page=1&per_page=20
  ❌ Camel case: /search?ageGroup=Puppy
  ❌ POST data in URL: /api/review/approve?review_id=123 (use POST body)
```

### 5.2 API Versioning Strategy

```
CURRENT: No versioning (v0/implicit)
FUTURE STRATEGY (Phase 2+):
  
  Option A: URL Path Versioning
    GET /api/v1/search (future)
    GET /api/v2/search (if breaking change)
  
  Option B: Header Versioning
    GET /api/search
    Header: X-API-Version: 1
  
  DECISION: Path versioning (clearer, easier to deprecate)
  
  Rollout Timeline:
    - Phase 1: No versioning (launch as /api/*)
    - Phase 2: Introduce /api/v1/* alongside /api/* (both work)
    - Phase 3: Deprecate /api/* (6-month notice)
    - Phase 4: Remove /api/* (v1 only)
```

---

## Part 6: Query Parameters & Filtering

### 6.1 Search Query Parameters

```
GET /search?age=Puppy&issues=Pulling&suburb=Hawthorn&page=1&per_page=20&sort=rating

Required:
  (none - all optional, but suburb recommended)

Optional Parameters:
  age=Puppy|Adolescent|Adult|Senior|Any
    ├─ Repeatable: ?age=Puppy&age=Adult (OR logic)
    └─ Encode if spaces: ?age=Any+age
  
  issues=Pulling|Anxiety|Barking|... (13 options)
    ├─ Repeatable: ?issues=Pulling&issues=Anxiety
    └─ URL encode commas if needed
  
  service_type=Puppy+Training|Obedience|...
    ├─ Filter by service type
    └─ Repeatable
  
  suburb=Hawthorn|Melbourne|...
    ├─ Suburb name (or partial match)
    └─ Auto-complete in frontend
  
  council=melbourne|... (optional, can infer from suburb)
    ├─ Filter by council ID
    └─ Backend validates against D-003
  
  page=1
    ├─ Pagination (1-indexed)
    ├─ Default: 1
    └─ Max: 100 (pagination enforced)
  
  per_page=20
    ├─ Results per page
    ├─ Default: 20
    ├─ Min: 1
    ├─ Max: 100
    └─ Admin can request 100
  
  sort=featured_until|rating|distance|created_at
    ├─ featured_until: Featured first (DESC)
    ├─ rating: High ratings first (DESC)
    ├─ distance: Closest first (ASC)
    ├─ created_at: Newest first (DESC)
    └─ Multiple sort: ?sort=featured_until,-rating (not MVP)
  
  search=dog+training
    ├─ Full-text search (trainer name, suburb, service)
    └─ Encode spaces as + or %20

Server-Side Processing:
  1. Validate all params (no injection)
  2. Convert to SQL WHERE clauses
  3. Apply ranking (D-006: featured → verified → distance → rating)
  4. Paginate results (LIMIT, OFFSET)
  5. Return 20 results max (per_page enforced)

Example Query:
  /search?age=Puppy&age=Adolescent&issues=Anxiety&suburb=Hawthorn&page=1&per_page=20&sort=rating
  
  SQL Translation:
    SELECT * FROM businesses
    WHERE status = 'active'
      AND age_specialties @> ARRAY['Puppy', 'Adolescent']
      AND behavior_issues @> ARRAY['Anxiety']
      AND council_id = (SELECT id FROM councils WHERE name = 'Hawthorn Council')
    ORDER BY featured_until DESC, verified DESC, distance_km ASC, avg_rating DESC
    LIMIT 20 OFFSET 0;
```

---

## Part 7: Rate Limiting

### 7.1 Rate Limits Per Endpoint

```
┌────────────────────────────────────────────────────────────┐
│ RATE LIMITING (DDoS & ABUSE PROTECTION)                    │
└────────────────────────────────────────────────────────────┘

Tier 1: Extreme (20 req/min per IP) — Emergency Triage
  └─ /api/emergency/triage
     Reason: Public endpoint, triage_logs stored, Z.AI cost
     Penalty: 429 Too Many Requests

Tier 2: Strict (5–10 req/min per IP) — Authentication
  ├─ POST /api/auth/signup (5/min per IP)
  ├─ POST /api/auth/verify-otp (10/min per email)
  ├─ POST /api/auth/login (10/min per email)
  └─ Reason: Brute force protection

Tier 3: Moderate (100 req/min per IP) — Public Search
  ├─ GET /search (100/min per IP)
  ├─ GET /trainer/{id} (100/min per IP)
  └─ Reason: Browse protection

Tier 4: High (1 req/min per user) — Premium Features
  ├─ POST /api/payments/create-checkout (1/min per user)
  ├─ POST /api/trainer/refund-request (1/min per user)
  └─ Reason: Prevent duplicate payment attempts

Tier 5: Unlimited (Internal Only) — Authenticated
  ├─ GET /api/trainer/dashboard (logged-in users)
  ├─ GET /api/admin/reviews (admins only)
  └─ Reason: Internal use, authenticated, tracked by IP + user_id

Implementation:
  ├─ Tool: Vercel built-in rate limiting + Cloudflare WAF
  ├─ Strategy: Sliding window (last 60 seconds)
  ├─ Headers:
  │  ├─ X-RateLimit-Limit: 100
  │  ├─ X-RateLimit-Remaining: 87
  │  └─ X-RateLimit-Reset: 1640926543 (Unix timestamp)
  ├─ Response (429):
  │  ├─ Status: 429 Too Many Requests
  │  ├─ Retry-After: 60 (seconds)
  │  └─ Body: {error: "rate_limit_exceeded", retry_after: 60}
  └─ Logging: All 429s logged (alert if >1000/min from single IP)
```

### 7.2 Rate Limit Bypass Rules

```
TRAINER ROUTES (/trainer/*, /api/trainer/*):
  ├─ Per user (authenticated by JWT)
  ├─ Rate limit: Unlimited (internal)
  ├─ Logging: All actions logged (audit trail)
  └─ Trust: Trusted because email OTP required

ADMIN ROUTES (/admin/*, /api/admin/*):
  ├─ Per user (authenticated by JWT + TOTP)
  ├─ Rate limit: Unlimited (internal)
  ├─ Logging: All actions logged (audit trail)
  ├─ Trust: Highly trusted (MFA required)
  └─ Note: All actions audit-logged (no deletion allowed)

INTERNAL ENDPOINTS:
  ├─ /api/webhooks/stripe (Stripe signature verified)
  ├─ /api/cron/* (Vercel secret in header)
  ├─ Rate limit: Unlimited
  └─ Logging: Minimal (just success/failure)
```

---

## Part 8: Error Handling & Status Codes

### 8.1 HTTP Status Codes (Standard)

```
SUCCESS:
  200 OK              GET /search, GET /admin/dashboard
  201 Created         POST /api/auth/signup (new user)
  204 No Content      DELETE /api/resource (no response body)

REDIRECTION:
  301 Moved Permanently  /trainer/dashboard/ → /trainer/dashboard
  302 Found              /trainer/login?redirect=/dashboard
  304 Not Modified       Caching (ETag match)

CLIENT ERROR:
  400 Bad Request        Invalid query params, validation error
  401 Unauthorized       No token, token expired
  403 Forbidden          Wrong trainer_id, not admin
  404 Not Found          Trainer doesn't exist, route invalid
  409 Conflict           Email already registered
  429 Too Many Requests  Rate limit exceeded

SERVER ERROR:
  500 Internal Error     Unhandled exception, DB error
  503 Service Unavailable Z.AI down, maintenance mode
```

### 8.2 Error Response Format (Standardized)

```json
{
  "error": "validation_error",
  "message": "Invalid input",
  "code": 400,
  "details": [
    {
      "field": "suburb",
      "reason": "Suburb not found in database",
      "suggestion": "Try: Hawthorn, Melbourne, Brunswick"
    }
  ],
  "timestamp": "2025-12-25T12:34:56Z",
  "request_id": "req_abc123xyz"
}
```

---

## Part 9: Static Assets & SEO

### 9.1 Static Routes

```
/favicon.ico           Favicon (all browsers)
/robots.txt            SEO robots (crawlers)
/sitemap.xml           SEO sitemap (Googlebot)
/logo.png              Logo (transparent PNG)
/logo-dark.png         Dark mode logo
/open-graph.png        OG image (social sharing)
/.well-known/          ACME challenges (SSL, future)
/public/               Static files folder
```

### 9.2 SEO Metadata

```html
<!-- Home page: / -->
<title>Dog Trainers Directory - Find Trainers Near You</title>
<meta name="description" content="Search certified dog trainers in Melbourne. Emergency triage, featured trainers, reviews.">

<!-- Search results: /search -->
<title>Search Results - Dog Trainers Directory</title>
<meta name="description" content="Found N trainers matching your search. Puppy training, behavior consulting.">

<!-- Trainer profile: /trainer/{id} -->
<title>{Trainer Name} - Dog Trainer in {Suburb}</title>
<meta name="description" content="{Bio}. Services: {Services}. Reviews: {Rating}/5 ({Count}).">

<!-- Emergency: /emergency -->
<title>Emergency Triage - Dog Trainers Directory</title>
<meta name="description" content="Emergency help for dogs. Triage system connects you to vets, shelters, trainers.">
```

---

## Part 10: Monitoring & Health Checks

### 10.1 Health Endpoints

```
GET /health
  Response: {status: 'ok', timestamp, checks: {...}}
  Checks:
    ├─ database: connected
    ├─ stripe: reachable
    ├─ z_ai: responsive
    └─ cron: last_run (timestamp)
  Usage: Vercel monitoring, alerting dashboard

GET /api/health/db
  Response: {status: 'ok', latency_ms: 25}
  Usage: Database connectivity test

GET /api/health/stripe
  Response: {status: 'ok', api_version: '2024-12-15'}
  Usage: Stripe API status

GET /api/health/z-ai
  Response: {status: 'ok', response_time_ms: 342}
  Usage: Z.AI integration status
```

---

**Document Version:** 1.0  
**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Owner:** Architecture + Backend Team  
**Next Document:** 05_DATA_AND_API_CONTRACTS.md (API endpoints & schemas)

---

**End of 04_ROUTES_AND_NAVIGATION.md**
