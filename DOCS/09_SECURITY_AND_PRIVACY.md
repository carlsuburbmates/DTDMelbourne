# 09_SECURITY_AND_PRIVACY.md – Authentication, Encryption & Compliance

**Dog Trainers Directory — Security Architecture, Privacy & Regulatory Compliance**

**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Decisions Implemented:** D-013 (MFA: Admin TOTP, Trainer OTP), D-014 (key rotation quarterly)  
**Compliance:** GDPR, Australian Privacy Act, ACCC Consumer Law, PCI-DSS

---

## Executive Summary

**Security-first by design. Minimal data. Strong encryption. Clear policies.**

- ✅ **Trainer Auth**: Email OTP (passwordless, no MFA required)
- ✅ **Admin Auth**: Email + TOTP (mandatory 2FA, no passwords)
- ✅ **Emergency Triage**: Public endpoint, rate-limited, no auth (anonymous)
- ✅ **Encryption**: AES-256-GCM at rest, TLS 1.3 in transit
- ✅ **GDPR Compliant**: Data export, deletion, retention policies
- ✅ **Australian Privacy Act**: APPs 1–13, minimal data collection
- ✅ **Key Rotation**: Quarterly (D-014), emergency rotation available
- ✅ **Audit Trail**: Immutable, 2+ year retention, compliance-ready

---

## Part 1: Authentication Architecture

### 1.1 Trainer Authentication (Email OTP)

**Passwordless. Simple. Secure. No MFA required.**

```
┌────────────────────────────────────────────────────────────┐
│ TRAINER SIGNUP & LOGIN (Email OTP Flow)                    │
└────────────────────────────────────────────────────────────┘

SIGNUP:
  1. User enters email → /api/auth/signup
  2. System checks if email already registered
  3. OTP generated (6-digit code, 15-min expiry)
  4. Email sent: "Your Dog Trainers Directory signup code: 234567"
  5. User enters code → /api/auth/verify-otp
  6. Verification succeeds → Session created
  7. Redirect to /profile/setup
  8. Result: Account created, user logged in

LOGIN:
  1. User enters email → /api/auth/login
  2. OTP generated (6-digit code, 15-min expiry)
  3. Email sent: "Your login code: 123456"
  4. User enters code → /api/auth/verify-otp
  5. Verification succeeds → Session created
  6. Redirect to /dashboard
  7. Result: User logged in

SESSION TOKEN:
  ├─ Format: JWT (JSON Web Token)
  ├─ Payload: {
  │    user_id: "uuid",
  │    email: "trainer@example.com",
  │    role: "trainer",
  │    iat: 1703529600,
  │    exp: 1703616000  (24 hours)
  │  }
  ├─ Storage: HttpOnly secure cookie (not localStorage)
  ├─ Refresh: 7-day refresh token (optional auto-extend)
  └─ Expiry: 24 hours inactivity logout

LOGOUT:
  ├─ Action: DELETE /api/auth/logout
  ├─ System: Delete session + refresh tokens
  ├─ Result: User logged out, redirect to /

MFA:
  ├─ Not required for trainers (Phase 1)
  ├─ Future: Optional 2FA via SMS (Phase 2)
  └─ Rationale: Low-risk account (read-only reviews, no payments)
```

### 1.2 Admin Authentication (Email + TOTP)

**Two-factor mandatory. No passwords. TOTP required.**

```
┌────────────────────────────────────────────────────────────┐
│ ADMIN SIGNUP & LOGIN (Email + TOTP MFA)                    │
└────────────────────────────────────────────────────────────┘

ADMIN SETUP (First Time):
  1. Admin onboarded by product team
  2. Email sent: "Set up your DTD account"
  3. Click link → /admin/setup?token=xxx
  4. Enter email + set password (not used for auth, backup only)
  5. Authenticator app setup:
     ├─ System generates TOTP secret (20-byte random)
     ├─ Secret encoded as QR code (Base32 format)
     ├─ Admin scans QR with Google Authenticator / Authy
     ├─ App displays 6-digit code (refreshes every 30 sec)
     └─ Admin enters 2 consecutive codes to verify
  6. Backup codes displayed (10 single-use codes)
  7. Admin downloads/prints codes (store safely!)
  8. Setup complete → Stored in users.mfa_seed_encrypted

ADMIN LOGIN:
  1. Admin enters email → /api/auth/admin-login
  2. Email verified (must be admin email)
  3. OTP sent (optional, SMS preferred if available)
  4. Admin enters OTP → Code verified
  5. If verified: Prompt for TOTP
     ├─ Admin opens authenticator app
     ├─ Reads 6-digit code
     ├─ Enters code → /api/auth/verify-totp
  6. System verifies TOTP:
     ├─ Compute expected code using secret
     ├─ Accept current window + previous 30sec (clock skew)
     ├─ If match: Login successful
     └─ If no match: Deny (try again or use backup code)
  7. Session created + stored in HttpOnly cookie
  8. Redirect to /admin/dashboard

TOTP VERIFICATION LOGIC:
  ├─ Algorithm: HMAC-SHA1 (RFC 6238 standard)
  ├─ Time step: 30 seconds
  ├─ Digit count: 6 digits (0–999999)
  ├─ Tolerance: Current window + previous window (±30 sec)
  ├─ One-time: Code cannot be reused (store last valid code)
  └─ False positives: <0.001% (acceptable)

MFA LOSS SCENARIO:
  ├─ If admin loses authenticator (phone damage, app deleted)
  ├─ Action: Use 1 backup code to login
  ├─ System: Accept code, mark as used, force MFA reset
  ├─ Backup code format: 8-character alphanumeric, single-use
  ├─ Recovery: New TOTP secret generated, new QR code
  └─ Safety: Can only use 10 backup codes total

SESSION:
  ├─ Token format: JWT (same as trainer)
  ├─ Payload: {
  │    user_id: "uuid",
  │    email: "admin@dtd.io",
  │    role: "admin",
  │    mfa_verified: true,  ← Key difference
  │    iat: 1703529600,
  │    exp: 1703616000  (24 hours)
  │  }
  ├─ Storage: HttpOnly secure cookie
  ├─ Expiry: 24 hours inactivity logout
  └─ Re-auth: If accessing sensitive ops, prompt for TOTP again
```

### 1.3 Emergency Triage (Public, Rate-Limited)

**No authentication. Anonymous. Rate-limited. Public endpoint.**

```
┌────────────────────────────────────────────────────────────┐
│ EMERGENCY TRIAGE (PUBLIC ENDPOINT)                         │
└────────────────────────────────────────────────────────────┘

ENDPOINT:
  ├─ Path: POST /api/emergency/triage
  ├─ Auth: None (public)
  ├─ Rate limit: 20 req/min per IP
  ├─ CORS: Allow all origins (emergency, not sensitive)
  └─ Response: < 2 seconds (fast)

REQUEST:
  {
    "dog_description": "My dog is bleeding from the paw",
    "suburb": "Melbourne, VIC",
    "phone": "+61412345678"  (optional, for callback)
  }

RESPONSE:
  {
    "classification": "medical",
    "confidence": 0.94,
    "resources": [
      {
        "name": "Melbourne Vet Emergency",
        "type": "veterinary_clinic",
        "address": "123 Smith St, Melbourne",
        "phone": "03 9000 1111",
        "distance_km": 2.1
      },
      ...
    ],
    "ai_model": "z_ai",
    "processing_time_ms": 342
  }

PRIVACY:
  ├─ Data stored: dog_description encrypted in triage_logs
  ├─ Phone number: Optional, not stored by default
  ├─ IP address: Logged for rate limiting only (no tracking)
  ├─ Session: Stateless, no cookies, no login required
  └─ User ID: Not captured (anonymous)

RATE LIMITING:
  ├─ Per IP: 20 requests per minute
  ├─ Block: Return 429 if exceeded
  ├─ Reset: Every minute
  ├─ Enforcement: Vercel rate limiting + Cloudflare WAF
  └─ Exceptions: None (even for emergency, fairness matters)

WHY PUBLIC:
  ├─ Emergency triage is urgent (no time to login)
  ├─ Users may not be trainers (dog owners reaching out)
  ├─ No sensitive data collected (public already)
  └─ Rate limiting prevents abuse
```

---

## Part 2: Multi-Factor Authentication (TOTP)

### 2.1 TOTP Implementation Details (RFC 6238)

```
┌────────────────────────────────────────────────────────────┐
│ TOTP (Time-Based One-Time Password) - RFC 6238             │
└────────────────────────────────────────────────────────────┘

SETUP PROCESS:

Step 1: Generate Secret
  ├─ Random 20-byte value (160 bits)
  ├─ Encoded as Base32 (RFC 4648)
  ├─ Example: JBSWY3DPEBLW64TMMQ====== (32 chars)
  └─ Library: speakeasy.generateSecret()

Step 2: Create QR Code
  ├─ Format: otpauth://totp/DTD:admin@dtd.io?secret=JBSWY3DPEBLW64TMMQ======&issuer=DTD
  ├─ Encode as QR (2D barcode)
  ├─ Display on setup page
  └─ User scans with authenticator app

Step 3: User Scans QR
  ├─ App used: Google Authenticator, Authy, Microsoft Authenticator
  ├─ App stores: Secret locally (encrypted on phone)
  ├─ App displays: 6-digit code, updates every 30 sec
  ├─ Admin sees: "Setup complete" message
  └─ Admin enters: 2 consecutive codes to verify

Step 4: Verify TOTP (2x Consecutive Codes)
  ├─ Admin enters first code (e.g., 456789)
  ├─ System verifies: Compute expected code, check match
  ├─ Result: Match? Ask for second code
  ├─ Admin waits: ~20 seconds (code refreshes)
  ├─ Admin enters second code (e.g., 234567)
  ├─ System verifies: Second code is different window
  ├─ Result: Both match? Setup successful
  ├─ Rationale: Verifying 2 codes proves sync + seed is correct
  └─ Store: Secret in users.mfa_seed_encrypted (hashed)

TOTP CODE GENERATION (Each Login):

  T = floor( (current_time_seconds - epoch) / 30 )
  
  Where:
    ├─ current_time_seconds = Unix timestamp (seconds since 1970)
    ├─ epoch = 0 (standard)
    ├─ 30 = time step (window duration)
    └─ T = number of 30-second windows since 1970

  HMAC = HMAC-SHA1(secret, T_bytes)
  
  Where:
    ├─ secret = 20-byte binary seed
    ├─ T_bytes = 8-byte big-endian integer
    └─ Result = 20-byte hash

  Code = (last_4_bytes_of_HMAC) mod 10^6
  
  Where:
    ├─ last_4_bytes = interpret as 31-bit integer (mask high bit)
    ├─ mod 10^6 = take remainder (0–999999)
    └─ Result = 6-digit code with leading zeros

TIME WINDOW TOLERANCE:
  ├─ Current window: T
  ├─ Previous window: T - 1 (30 sec ago)
  ├─ Accept both: Handles clock skew (server slightly ahead/behind)
  ├─ Next window: T + 1 (not accepted, prevents code reuse)
  └─ Rationale: User's phone clock may differ by ±30 sec

ONE-TIME USE:
  ├─ Store: users.last_totp_code = hash(code_used)
  ├─ Check: If code matches last_totp_code, reject (reuse attempt)
  ├─ Reset: Clear last_totp_code when time window expires
  └─ Rationale: Prevent attacker replaying intercepted code

BACKUP CODES:
  ├─ Generated: 10 single-use codes (during MFA setup)
  ├─ Format: 8-character alphanumeric (e.g., "AB12-CD34")
  ├─ Storage: users.mfa_backup_codes (comma-separated, hashed)
  ├─ Use: If user loses authenticator, login with backup code
  ├─ One-time: After using a backup code, remove it from list
  ├─ Recovery: User cannot generate new backup codes (admin only)
  └─ Recommendation: User stores them in password manager

LIBRARIES:
  ├─ Node.js: speakeasy, totp (npm packages)
  ├─ Example: speakeasy.totp({ secret, encoding: 'base32' })
  ├─ QR generation: qrcode (npm)
  └─ Hash: crypto.createHmac('sha1', secret)
```

### 2.2 MFA Seed Management

```
DATABASE SCHEMA:

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,  -- 'trainer' or 'admin'
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_seed_encrypted TEXT,  -- Encrypted TOTP secret
  mfa_backup_codes TEXT,    -- Comma-separated, hashed
  last_totp_code_hash TEXT, -- Last used code (prevent reuse)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ENCRYPTION:

  MFA seed storage:
    ├─ Raw seed: JBSWY3DPEBLW64TMMQ====== (20-byte Base32)
    ├─ Encrypt: AES-256-GCM(seed, encryption_key)
    ├─ Result: mfa_seed_encrypted = ciphertext + IV + auth_tag
    ├─ Key: process.env.ENCRYPTION_KEY (Vercel Secrets)
    └─ Decryption: Only in-memory, never logged

  Backup codes:
    ├─ Generated: 10 codes (e.g., ["AB12-CD34", "EF56-GH78"])
    ├─ Hash each: SHA256(code)
    ├─ Store: mfa_backup_codes = "hash1,hash2,hash3,..."
    ├─ Comparison: SHA256(user_input) == stored_hash
    └─ Rationale: If DB leaked, backup codes not immediately usable

ROTATION (MFA Reset):

  Scenario: Admin compromised or lost device
    1. Product team initiates MFA reset: DELETE mfa_seed_encrypted
    2. Operator/admin re-login with backup code
    3. System forces TOTP setup (same as first time)
    4. New secret generated + QR code shown
    5. Admin scans + verifies (2x codes)
    6. New seed stored + old seed discarded
    7. Old backup codes invalidated (new ones generated)
    └─ Result: Fresh MFA setup, old codes unusable
```

---

## Part 3: Secret Management & Key Rotation (D-014)

### 3.1 Secrets in Vercel

**Never in code. Always in environment.**

```
┌────────────────────────────────────────────────────────────┐
│ SECRETS MANAGEMENT (Vercel Environment Variables)          │
└────────────────────────────────────────────────────────────┘

SECRETS STORED:

  STRIPE_SECRET_KEY
    ├─ Value: sk_live_xxxxxxxxxx (Stripe API)
    ├─ Env: Production only (test key for staging)
    ├─ Access: Backend only (never exposed to client)
    └─ Rotation: Quarterly (D-014)

  STRIPE_WEBHOOK_SECRET
    ├─ Value: whsec_xxxxxxxxxx (Webhook signing)
    ├─ Env: Production only
    ├─ Access: Webhook handler (/api/webhooks/stripe)
    └─ Rotation: Quarterly, but webhook must continue working

  Z_AI_API_KEY
    ├─ Value: Bearer token (Z.AI authentication)
    ├─ Env: Production only
    ├─ Access: Triage service (/api/emergency/triage)
    └─ Rotation: Quarterly

  OPENAI_API_KEY
    ├─ Value: sk-proj-xxxxxxxxxx (z.ai API)
    ├─ Env: Production only (fallback provider)
    ├─ Access: Triage fallback (Tier 2)
    └─ Rotation: Quarterly

  SUPABASE_SERVICE_ROLE_KEY
    ├─ Value: Service role JWT (full DB access)
    ├─ Env: Production only (for server-side queries)
    ├─ Access: Backend only (never exposed to client)
    └─ Rotation: Quarterly (high-risk, monitor usage)

  CRON_SECRET
    ├─ Value: Random token (verify cron requests)
    ├─ Env: Production only (passed in cron scheduler)
    ├─ Access: Cron job handler (/api/cron/featured-expiry)
    └─ Rotation: Quarterly

  ENCRYPTION_KEY
    ├─ Value: 32-byte key (AES-256 for data encryption)
    ├─ Env: Production only (sensitive!)
    ├─ Access: Data encryption services
    ├─ Rotation: Quarterly (⚠️ requires re-encryption)
    └─ Note: Leakage = critical incident

HOW TO STORE:

  1. Vercel Dashboard:
     ├─ Go to: Settings → Environment Variables
     ├─ Add: Key = "STRIPE_SECRET_KEY", Value = "sk_live_xxx"
     ├─ Select: Production environment only
     └─ Save: Auto-deployed to production

  2. Local Development:
     ├─ Create: .env.local file (never commit!)
     ├─ Add: STRIPE_SECRET_KEY=sk_test_xxx (test key)
     ├─ Add: .env.local to .gitignore
     └─ Load: Next.js auto-loads on dev startup

  3. Staging:
     ├─ Use: Test/sandbox API keys
     ├─ Example: sk_test_xxx (Stripe test key)
     ├─ Never use production keys in staging
     └─ Separate Vercel project (dtd-staging)
```

### 3.2 Key Rotation Schedule (D-014)

```
┌────────────────────────────────────────────────────────────┐
│ QUARTERLY KEY ROTATION (D-014)                             │
└────────────────────────────────────────────────────────────┘

SCHEDULE:

  Rotation dates:
    ├─ 2025-01-01: Q1 rotation (Jan–Mar)
    ├─ 2025-04-01: Q2 rotation (Apr–Jun)
    ├─ 2025-07-01: Q3 rotation (Jul–Sep)
    └─ 2025-10-01: Q4 rotation (Oct–Dec)

ROTATION PROCESS (No Downtime):

  Step 1: Generate new key
    ├─ Provider: Generate in Stripe/Z.AI/z.ai dashboard
    ├─ Store: Temporary note (not in code)
    └─ Verify: Test new key in staging environment

  Step 2: Deploy with both keys (grace period)
    ├─ Update: Vercel environment variable with new key
    ├─ Code: Support both old + new keys for 30 days
    ├─ Example: Try new key first, fallback to old key on error
    ├─ Deploy: Auto-deploys to production
    └─ Verify: Monitor logs, confirm requests working

  Step 3: Monitor (30-day grace period)
    ├─ Duration: 30 days (from 2025-01-01 to 2025-01-31)
    ├─ Watch: Error rates, failed API calls
    ├─ Alert: If >1% of requests fail, rollback
    ├─ Action: Send summary email to team
    └─ Status: Both old + new keys active

  Step 4: Remove old key
    ├─ Date: 2025-01-31 (end of grace period)
    ├─ Action: Delete old key from provider
    ├─ Code: Remove fallback to old key (use new only)
    ├─ Deploy: New version deployed
    └─ Verify: Logs show all requests using new key

EXAMPLE TIMELINE (STRIPE_SECRET_KEY):

  Dec 24, 2024 (Old key active):
    Current: sk_live_oldoldold123
    Using: All requests via sk_live_oldoldold123

  Jan 1, 2025 (Rotation day):
    1. Generate in Stripe: sk_live_newnewnew456
    2. Update Vercel: STRIPE_SECRET_KEY = sk_live_newnewnew456
    3. Code update: Try new key, fallback to old
    4. Deploy: Live within 5 min
    5. Monitor: Error rates, API responses

  Jan 2–31, 2025 (Grace period):
    Both keys active:
      ├─ New: sk_live_newnewnew456 (preferred)
      ├─ Old: sk_live_oldoldold123 (fallback only)
      └─ Usage: Majority on new, some on old (retries)

  Feb 1, 2025 (Old key disabled):
    1. Verify: 99%+ of requests on new key
    2. Delete old key from provider
    3. Remove fallback from code
    4. Deploy: New version, old key reference gone
    5. Done: New key is only key

EMERGENCY ROTATION (If Leaked):

  If key is compromised (leaked in GitHub, Slack, etc.):
    1. Immediate: Invalidate old key in provider dashboard
    2. Deploy: Vercel secrets updated with new key (no grace period)
    3. Verify: Requests go through new key
    4. Incident: Log security incident, notify stakeholders
    5. Audit: Determine where key was exposed
    6. Review: Add preventative controls (secret scanning, etc.)
    ├─ Timeline: <5 min from detection to fix
    ├─ Risk: Briefly using wrong key, but minimized
    └─ Cost: New tokens may have higher usage spike
```

---

## Part 4: Encryption

### 4.1 Encryption at Rest (AES-256-GCM)

```
┌────────────────────────────────────────────────────────────┐
│ ENCRYPTION AT REST (Database)                              │
└────────────────────────────────────────────────────────────┘

ENCRYPTED COLUMNS:

  triage_logs.dog_description
    ├─ Content: Dog emergency description (e.g., "bleeding from paw")
    ├─ Why: Personal health info (dog's), sensitive
    ├─ Encryption: AES-256-GCM (Supabase managed)
    ├─ Key: process.env.ENCRYPTION_KEY
    ├─ Access: Only in operator dashboard (audit-logged)
    └─ Retention: 1 year (then anonymized)

  reviews.text
    ├─ Content: User review of trainer (e.g., "Great trainer!")
    ├─ Why: User-generated content (preserve privacy)
    ├─ Encryption: AES-256-GCM
    ├─ Key: process.env.ENCRYPTION_KEY
    ├─ Access: Public if approved, visible to reviewer if pending
    └─ Retention: 7 years (audit trail)

  users.mfa_seed_encrypted
    ├─ Content: TOTP secret (20-byte seed)
    ├─ Why: Critical authentication factor
    ├─ Encryption: AES-256-GCM
    ├─ Key: process.env.ENCRYPTION_KEY
    ├─ Access: Never displayed (only verified at login)
    └─ Retention: While account active

  payment_audit.stripe_customer_id
    ├─ Content: Stripe customer ID (not card data)
    ├─ Why: Links payment to trainer (needed for refunds)
    ├─ Encryption: AES-256-GCM
    ├─ Key: process.env.ENCRYPTION_KEY
    ├─ Access: Operator only (payment processing)
    └─ Retention: 7 years (ATO requirement)

ENCRYPTION METHOD:

  AES-256-GCM (Galois/Counter Mode):
    ├─ Algorithm: AES (Advanced Encryption Standard)
    ├─ Key size: 256 bits (32 bytes)
    ├─ Mode: GCM (authenticated encryption)
    ├─ IV: Random 12 bytes (generated per encryption)
    ├─ Auth tag: 16 bytes (detects tampering)
    ├─ Library: crypto (Node.js native)
    └─ Performance: <1ms per operation

  Implementation:
    const crypto = require('crypto');
    
    // Encrypt
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Store: iv + encrypted + authTag
    const stored = iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
    
    // Decrypt
    const [ivHex, encryptedHex, authTagHex] = stored.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

WHY MINIMAL ENCRYPTION:

  DTD doesn't store card data:
    ├─ Cards: Stripe handles (PCI Level 1 certified)
    ├─ DTD stores: Only last_4 digits (non-PCI)
    ├─ Responsibility: Stripe's, not DTD's
    └─ Result: Lower compliance burden

  What we DO encrypt (non-card, sensitive):
    ├─ Triage descriptions (medical info)
    ├─ Reviews (user-generated content)
    ├─ TOTP secrets (auth factors)
    ├─ Customer IDs (link to payment)
    └─ Total: Low volume, minimal overhead

SUPABASE MANAGED ENCRYPTION:

  At-rest encryption (Supabase feature):
    ├─ All data: Encrypted by Supabase before writing to disk
    ├─ Key: Managed by Supabase (we never see it)
    ├─ Transparency: Default, no extra config needed
    ├─ Performance: Transparent (no app slowdown)
    └─ Trust: Enterprise-grade, SOC 2 certified
```

### 4.2 Encryption in Transit (TLS 1.3)

```
┌────────────────────────────────────────────────────────────┐
│ ENCRYPTION IN TRANSIT (Network)                            │
└────────────────────────────────────────────────────────────┘

HTTPS/TLS 1.3:

  Requirement: All endpoints HTTPS only
    ├─ No HTTP (unencrypted) allowed
    ├─ Redirect: HTTP → HTTPS (automatic)
    ├─ Certificate: Issued by Let's Encrypt (free, auto-renew)
    ├─ Provider: Vercel manages (no manual work)
    └─ Validation: DigiCert DV certificate

  TLS Version:
    ├─ Minimum: TLS 1.3 (required)
    ├─ Legacy: TLS 1.2 deprecated (after 2025)
    ├─ Unsupported: SSL 3.0, TLS 1.0, TLS 1.1 (rejected)
    ├─ Cipher suites: Modern, authenticated encryption
    └─ Key exchange: ECDHE (perfect forward secrecy)

  HSTS (HTTP Strict-Transport-Security):
    ├─ Header: Strict-Transport-Security: max-age=31536000
    ├─ Duration: 1 year (31536000 seconds)
    ├─ Effect: Browser enforces HTTPS only
    ├─ Prevents: MITM downgrade attacks
    └─ Preload: dtd.io in HSTS preload list (browser vendors)

WEBHOOK SIGNATURE VERIFICATION (Stripe):

  Stripe sends signed webhook:
    ├─ Header: X-Stripe-Signature (HMAC-SHA256)
    ├─ Format: t=timestamp,v1=signature,v0=old_signature
    ├─ Signed data: Timestamp + '.' + Request body
    └─ Key: Webhook secret (whsec_xxx)

  DTD verifies signature:
    1. Extract: t (timestamp) from header
    2. Verify timestamp: Not older than 5 min (replay attack)
    3. Reconstruct: signed_content = t + '.' + raw_body
    4. Compute HMAC: expected_signature = HMAC-SHA256(signed_content, secret)
    5. Compare: expected_signature == provided_signature
    6. If match: Webhook is genuine (not spoofed)
    7. If no match: Reject webhook (suspicious)

  Implementation:
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    app.post('/api/webhooks/stripe', (req, res) => {
      const sig = req.headers['x-stripe-signature'];
      
      try {
        const event = stripe.webhooks.constructEvent(
          req.rawBody,  // Raw JSON body (not parsed)
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        // Process event (charge.succeeded, charge.refunded, etc.)
        ...
        
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    });

API COMMUNICATION:

  Client → Server:
    ├─ Auth: Bearer token in Authorization header
    ├─ Format: Authorization: Bearer eyJhbGc...
    ├─ Token: JWT (signed by Supabase)
    ├─ Transport: HTTPS (encrypted)
    ├─ Storage: HttpOnly cookie (not accessible to JS)
    └─ Refresh: Auto-extend via refresh token (7 days)

  Server → Supabase:
    ├─ Auth: Service role key (for admin queries)
    ├─ Method: Direct client library (not HTTP)
    ├─ Transport: TLS 1.3 (encrypted)
    ├─ Key: Kept in process.env (never exposed)
    └─ Usage: Admin operations only

  Server → Stripe:
    ├─ Auth: API key + HTTPS certificate validation
    ├─ Transport: TLS 1.3 (encrypted)
    ├─ Method: HTTPS POST to https://api.stripe.com
    ├─ Verification: Server verifies Stripe's TLS cert
    └─ Security: Stripe is PCI Level 1 certified

  Server → Z.AI:
    ├─ Auth: Bearer token (Z_AI_API_KEY)
    ├─ Transport: HTTPS (encrypted)
    ├─ Format: Authorization: Bearer xxx
    └─ Timeout: 5 seconds (fallback if slow)
```

---

## Part 5: Row-Level Security (RLS) Policies

```
┌────────────────────────────────────────────────────────────┐
│ ROW-LEVEL SECURITY (Supabase Policies)                     │
└────────────────────────────────────────────────────────────┘

POLICY 1: Trainers See Only Own Business

CREATE POLICY trainer_view_own_business
ON businesses FOR SELECT
USING (user_id = auth.uid());

Effect:
  ├─ Query: SELECT * FROM businesses
  ├─ Trainer A: Only sees their own row
  ├─ Trainer B: Only sees their own row
  ├─ Result: No cross-trainer data leakage
  └─ Admin: Can override with service role key

POLICY 2: Reviews Are Public (Approved Only)

CREATE POLICY review_list_public
ON reviews FOR SELECT
USING (moderation_status = 'approved');

Effect:
  ├─ Query: SELECT * FROM reviews
  ├─ Anyone: Sees only approved reviews
  ├─ Pending/rejected: Not visible to non-admins
  ├─ Unauthenticated: Can still query approved reviews
  └─ Admin: Can see all reviews (service role)

POLICY 3: Admins See Everything

CREATE POLICY admin_full_access
ON businesses FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

Effect:
  ├─ Query: SELECT/INSERT/UPDATE/DELETE
  ├─ Admin only: Full CRUD access to all tables
  ├─ Trainer: Blocked (only own business via Policy 1)
  ├─ Key: Requires JWT role claim = 'admin'
  └─ Auth: Via service role key (backend only)

POLICY 4: Payment Audit Append-Only (No Updates)

CREATE POLICY payment_audit_append_only
ON payment_audit FOR INSERT
WITH CHECK (true);

CREATE POLICY payment_audit_no_update
ON payment_audit FOR UPDATE
USING (false);  -- Always deny

Effect:
  ├─ INSERT: Allowed (append-only log)
  ├─ UPDATE: Denied (immutable record)
  ├─ DELETE: Denied (never delete)
  ├─ Result: Audit trail cannot be modified
  └─ Admin: Even admins cannot update past records

POLICY 5: Trainers Cannot Delete Own Reviews

CREATE POLICY trainer_no_delete_reviews
ON reviews FOR DELETE
USING (false);  -- All deletes denied

Effect:
  ├─ Trainer cannot delete their own reviews
  ├─ Trainer cannot delete reviews of them
  ├─ Reviews: Immutable once submitted
  ├─ Moderation: Only operator can reject
  └─ Audit: Review history preserved

HOW TO TEST RLS:

  1. Trainer A login (token = A_token)
     SELECT * FROM businesses
     -- Returns: Only their own business ✓

  2. Trainer B login (token = B_token)
     SELECT * FROM businesses WHERE user_id = trainer_a_id
     -- Returns: Empty result (blocked by RLS) ✓

  3. Admin login (service role key)
     SELECT * FROM businesses
     -- Returns: All businesses ✓

  4. Try INSERT into payment_audit
     INSERT INTO payment_audit (...) VALUES (...)
     -- Success ✓

  5. Try UPDATE payment_audit
     UPDATE payment_audit SET ... WHERE id = xxx
     -- Denied (false policy) ✓
```

---

## Part 6: GDPR & Privacy Act Compliance

### 6.1 Australian Privacy Act (APPs 1–13)

```
┌────────────────────────────────────────────────────────────┐
│ AUSTRALIAN PRIVACY PRINCIPLES (APP) COMPLIANCE             │
└────────────────────────────────────────────────────────────┘

APP 1: Open and transparent management of personal information
  ├─ Requirement: Clear privacy policy, collection notice
  ├─ DTD implementation:
  │  ├─ Privacy Policy: /privacy (written, accessible)
  │  ├─ Collection notice: Shown at signup
  │  ├─ Terms: /terms (explain data use)
  │  └─ Contact: privacy@dtd.io for questions
  ├─ Evidence: Legal team reviews before launch
  └─ Audit: Annual privacy review

APP 2: Collection of solicited personal information
  ├─ Requirement: Only collect info we need
  ├─ DTD implementation:
  │  ├─ Trainer email: Required (for OTP, account recovery)
  │  ├─ Business name: Required (directory listing)
  │  ├─ Age specialties: Required (search filter)
  │  ├─ Behavior issues: Required (search filter)
  │  ├─ Suburb: Required (geographic search)
  │  ├─ Phone: Optional (contact if featured)
  │  └─ Tax file number: Not collected (Phase 1)
  ├─ Evidence: No optional fields beyond necessary
  └─ Rationale: Minimal data = minimal risk

APP 3: Collection of unsolicited personal information
  ├─ Requirement: Delete unsolicited info (or de-identify)
  ├─ DTD implementation:
  │  ├─ Scenario: Email sent to us about someone (unsolicited)
  │  ├─ Action: Don't use it, delete email
  │  ├─ OR: Ask consent (written) if we want to use it
  │  └─ Process: No automatic use of unsolicited data
  └─ Training: Staff briefed on this

APP 4: De-identification of personal information
  ├─ Requirement: Remove identifiers when possible
  ├─ DTD implementation:
  │  ├─ Triage logs: After 1 year, remove dog_description
  │  ├─ Reviews: Remove names (already anonymous)
  │  ├─ Search: Don't log user searches with identifiers
  │  └─ Analytics: Use aggregate data only (no individuals)
  └─ Method: SQL script runs nightly to anonymize old data

APP 5: Notification of collection of personal information
  ├─ Requirement: Tell people when collecting their info
  ├─ DTD implementation:
  │  ├─ Signup page: "We collect email for account login"
  │  ├─ Collection notice: Popup before form submission
  │  ├─ Privacy policy: Detailed list of what we collect
  │  └─ Consent: Checkbox "I agree to privacy policy"
  └─ Evidence: Screenshot of collection notice

APP 6: Use and disclosure of personal information
  ├─ Requirement: Only use info for stated purpose
  ├─ DTD implementation:
  │  ├─ Use cases: Directory listing, search, featured placement
  │  ├─ No selling: Never sell trainer data to marketers
  │  ├─ No sharing: Never share with third parties
  │  ├─ Exception: Stripe (payment processing, necessary)
  │  ├─ Exception: Supabase (database, necessary)
  │  └─ Disclosure: Privacy policy lists exceptions
  └─ Audit: No unauthorized sharing in logs

APP 7: Data quality and data security
  ├─ Requirement: Keep data accurate, secure from breaches
  ├─ DTD implementation:
  │  ├─ Accuracy: Trainers can update their profile
  │  ├─ Encryption: Sensitive data encrypted at rest
  │  ├─ Access: Limited to operator + system
  │  ├─ Monitoring: Audit logs track all access
  │  ├─ Backup: Daily encrypted backups (Supabase managed)
  │  └─ Incident: <72 hour breach notification
  └─ Certification: SOC 2 audit annually

APP 8: Data subject access and correction
  ├─ Requirement: Let people access & correct their data
  ├─ DTD implementation:
  │  ├─ Access: /api/user/export → ZIP of all data
  │  ├─ Format: JSON + CSV (human-readable)
  │  ├─ Correction: Edit profile at /profile/edit
  │  ├─ Deletion: /api/user/delete → Soft-delete
  │  └─ Request form: /contact (for manual requests)
  └─ Turnaround: <30 days for manual requests

APP 9: Anonymity and pseudonymity
  ├─ Requirement: Allow anonymous transactions where possible
  ├─ DTD implementation:
  │  ├─ Emergency triage: No login required, anonymous
  │  ├─ Search: Public, no tracking
  │  ├─ Reviews: Can submit anonymously (not connected to account)
  │  ├─ Trainer profile: Public, no login to view
  │  └─ Limitation: Featured placement requires account (payment)
  └─ Rationale: Anonymity default where practical

APP 10: Unique identifiers
  ├─ Requirement: Don't use government ID as identifier
  ├─ DTD implementation:
  │  ├─ Trainer ID: UUID (internal, not ABN)
  │  ├─ ABN: Stored separately (Phase 2, only if verified)
  │  ├─ Tax file: Never collected
  │  └─ Email: Used as identifier (for OTP, not ID)
  └─ Compliance: No government ID reuse

APP 11: Security of personal information
  ├─ Requirement: Protect data from misuse/loss
  ├─ DTD implementation:
  │  ├─ Encryption: AES-256-GCM at rest + TLS in transit
  │  ├─ Access control: RLS policies + audit logging
  │  ├─ Backup: Daily, tested monthly
  │  ├─ Breach response: Incident plan drafted
  │  └─ Staff training: Privacy + security quarterly
  └─ Testing: Annual penetration test

APP 12: Access to personal information
  ├─ Requirement: Promptly provide access to own data
  ├─ DTD implementation:
  │  ├─ Self-service: /api/user/export (instant)
  │  ├─ Manual request: /contact → Email within 3 days
  │  ├─ Format: Portable (JSON, CSV)
  │  ├─ Cost: Free (no charges)
  │  └─ Verification: Confirm identity via email
  └─ Evidence: Logs show all access requests

APP 13: Correction of personal information
  ├─ Requirement: Let people correct inaccurate data
  ├─ DTD implementation:
  │  ├─ Self-service: /profile/edit → Change any field
  │  ├─ History: Audit log tracks changes (for disputes)
  │  ├─ Disputes: /contact → Flag data as inaccurate
  │  ├─ Response: <30 days to investigate
  │  └─ Correction: Update or add note
  └─ Example: Trainer says bio is wrong → Trainer updates

DATA RETENTION SCHEDULE:

  Active accounts: Keep all data (indefinite)
  Deleted accounts:
    ├─ Soft-delete: marked deleted=TRUE, deleted_at set
    ├─ Data: Kept for 90 days (in case user recovers account)
    ├─ After 90 days: Anonymize personal data (remove email, name)
    └─ Audit: Keep anonymized records (2 years for stats)

  Triage logs:
    ├─ Keep: 1 year (for emergency statistics)
    ├─ After: Anonymize (remove dog_description, suburb)
    └─ Archive: Anonymized data kept indefinitely (stats)

  Payment audit:
    ├─ Keep: 7 years (ATO legal requirement)
    ├─ No deletion: Immutable, audit trail
    ├─ No anonymization: Must preserve for tax
    └─ Encryption: At rest + backup to secure location

  Reviews:
    ├─ Keep: Published reviews (indefinite, part of history)
    ├─ Keep: Rejected reviews (2 years, audit trail)
    └─ Soft-delete: Marked deleted if trainer requests removal
```

---

## Part 7: Compliance Checklist (Pre-Launch)

```
┌────────────────────────────────────────────────────────────┐
│ PRE-LAUNCH COMPLIANCE CHECKLIST                            │
└────────────────────────────────────────────────────────────┘

AUTHENTICATION & MFA:
  ☐ Trainer OTP flow tested (email → code → session)
  ☐ Admin TOTP setup working (QR code → authenticator app)
  ☐ Backup codes generated & tested (single-use)
  ☐ MFA recovery tested (use backup code → re-setup)
  ☐ Session timeout after 24 hours (auto-logout)
  ☐ Refresh token works (7-day auto-extend)

ENCRYPTION:
  ☐ HTTPS/TLS 1.3 enforced (no HTTP)
  ☐ HSTS header set (1-year duration)
  ☐ Certificate validity checked (Let's Encrypt)
  ☐ Sensitive columns encrypted (AES-256-GCM)
  ☐ ENCRYPTION_KEY in Vercel Secrets (not code)
  ☐ Stripe webhook signatures verified
  ☐ Test: Decrypt encrypted data (round-trip test)

SECRETS MANAGEMENT:
  ☐ All API keys in Vercel Secrets (not .env.local)
  ☐ No secrets in GitHub repo (git history clean)
  ☐ .env.local in .gitignore
  ☐ Key rotation calendar established (Q-yearly)
  ☐ Emergency rotation plan drafted
  ☐ Test: Rotate test key, verify fallback works

RLS POLICIES:
  ☐ Trainer isolation policy tested (can't see other trainers)
  ☐ Review public policy tested (approved reviews visible)
  ☐ Admin full-access policy tested (admins see everything)
  ☐ Payment audit immutable policy tested (no updates)
  ☐ All RLS policies deployed to production

GDPR COMPLIANCE (if EU users):
  ☐ Privacy policy written (GDPR Article 13)
  ☐ Terms & conditions finalized
  ☐ Data export endpoint working (/api/user/export)
  ☐ Data deletion endpoint working (/api/user/delete)
  ☐ Consent form at signup (checkbox)
  ☐ Third-party disclosures listed (Stripe, Supabase)
  ☐ GDPR Data Processing Agreement signed (if required)

AUSTRALIAN PRIVACY ACT COMPLIANCE:
  ☐ Privacy policy covers APPs 1–13
  ☐ Collection notice at signup (minimal data)
  ☐ Trader email: Only collect necessary info
  ☐ Anonymization script running (triage logs after 1 year)
  ☐ Data retention schedule documented
  ☐ Access/deletion requests process ready
  ☐ Breach notification process drafted

ACCC & AUSTRALIAN CONSUMER LAW:
  ☐ Featured placement description clear
  ☐ Price displays $22 AUD (inc. GST)
  ☐ Refund policy linked from checkout
  ☐ Refund policy in email confirmation
  ☐ Terms & conditions include warranty
  ☐ No misleading marketing claims
  ☐ Support contact form working

AUDIT LOGGING:
  ☐ Operator actions logged (review approvals)
  ☐ Payment events logged (charge, refund)
  ☐ Admin access logged (dashboard visits)
  ☐ Failed login attempts logged
  ☐ MFA reset logged
  ☐ Key rotation logged
  ☐ Logs immutable (append-only table)

STRIPE PCI COMPLIANCE:
  ☐ Never store card numbers (Stripe handles)
  ☐ Only store last_4 digits (non-PCI)
  ☐ Webhook signatures verified
  ☐ Test: Stripe webhook handler accepts valid signature
  ☐ Test: Stripe webhook handler rejects invalid signature
  ☐ Stripe account verified (PCI attestation)

RATE LIMITING & DDoS:
  ☐ Search: 100 req/min per IP
  ☐ Signup: 5 req/min per IP
  ☐ Emergency: 20 req/min per IP
  ☐ Login: 10 req/min per email
  ☐ Test: Exceed limit → 429 response
  ☐ Cloudflare WAF enabled (Vercel)

DATA MINIMIZATION:
  ☐ No tax file numbers collected (Phase 1)
  ☐ No health data collected
  ☐ No social media profiles
  ☐ Email only personal identifier (not ABN)
  ☐ Minimal fields on signup (email, business name only)

INCIDENT RESPONSE:
  ☐ Breach plan drafted (detection, containment, notification)
  ☐ Escalation path defined (DevOps, Legal, OAIC)
  ☐ Contact list ready (privacy@dtd.io, legal team)
  ☐ 72-hour notification deadline documented
  ☐ Post-mortem process established

DEPLOYMENT:
  ☐ Staging environment tested (all security checks)
  ☐ Production secrets loaded (Vercel Secrets)
  ☐ HTTPS certificate valid
  ☐ Backup tested (restore & verify data integrity)
  ☐ Rollback plan ready (if security issue found)
```

---

**Document Version:** 1.0  
**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Owner:** Security Team + Legal  
**Next Document:** 10_LAUNCH_RUNBOOK.md (go-live checklist, training, support)

---

**End of 09_SECURITY_AND_PRIVACY.md**
