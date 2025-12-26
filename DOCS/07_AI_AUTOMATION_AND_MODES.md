# 07_AI_AUTOMATION_AND_MODES.md – AI Integration & Fallback Strategy

**Dog Trainers Directory — Z.AI Integration, Fallback Rules & Cost Management**

**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Decisions Implemented:** D-007 (fallback rules), D-008 (confidence thresholds), D-009 (Z.AI + OpenAI)  
**Technologies:** Z.AI (primary), OpenAI GPT-4 (fallback), Deterministic keyword matching (final fallback)

---

## Executive Summary

**Multi-tier AI strategy. No single point of failure. Always returns a result.**

- ✅ **Z.AI primary** (fast, cheap, specialized for dog behavior)
- ✅ **OpenAI fallback** (if Z.AI down >5 min, more accurate but 10x cost)
- ✅ **Deterministic rules** (keyword matching, <10ms, zero cost)
- ✅ **Feature flags** (runtime control, disable AI if needed)
- ✅ **Cost budgeted** (<$250/month, D-009)
- ✅ **Full audit trail** (all classifications logged, immutable)

---

## Part 1: AI Integration Architecture

### 1.1 Three-Tier AI Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ AI ARCHITECTURE (Cascading Fallback Pattern)                │
└─────────────────────────────────────────────────────────────┘

TIER 1: Z.AI (Primary)
  ├─ Speed: <500ms target
  ├─ Cost: ~$0.001 per call
  ├─ Accuracy: Specialized dog behavior models
  ├─ When: Normal operation
  └─ Risk: Depends on external API

TIER 2: OpenAI GPT-4 (Secondary Fallback)
  ├─ Speed: <2 seconds
  ├─ Cost: ~$0.01 per call (10x expensive)
  ├─ Accuracy: General-purpose, very accurate
  ├─ When: Z.AI unavailable >5 min
  └─ Risk: Higher cost, slower

TIER 3: Deterministic Rules (Final Fallback)
  ├─ Speed: <10ms (sub-millisecond)
  ├─ Cost: Zero
  ├─ Accuracy: Keyword-based, limited but safe
  ├─ When: Both APIs timeout
  └─ Risk: May over/under-classify (acceptable for safety)

Cascade Logic:
  1. Try Z.AI (5s timeout)
  2. If fails → Try OpenAI (10s timeout)
  3. If fails → Use deterministic rules
  4. Default: "normal" classification + log incident
```

### 1.2 Feature Flags (Runtime Control)

```typescript
// Feature flags for AI mode switching (Vercel KV or Supabase)

interface AIFeatureFlags {
  AI_ENABLED: boolean;              // Master kill switch
  AI_MODE: 'z_ai' | 'openai' | 'deterministic';
  Z_AI_CONFIDENCE_THRESHOLD: number; // 0.85 (auto-approve)
  Z_AI_MANUAL_REVIEW_THRESHOLD: number; // 0.70 (manual queue)
  OPENAI_FALLBACK_TIMEOUT: number;  // 300 seconds
  REVIEW_AUTO_APPROVE_THRESHOLD: number; // 0.90
  TRIAGE_AUTO_APPROVE_THRESHOLD: number; // 0.85
}

// Usage example:
const flags = await getFeatureFlags();
if (!flags.AI_ENABLED) {
  // Disable all AI, use deterministic only
  return classifyDeterministic(input);
}

switch (flags.AI_MODE) {
  case 'z_ai':
    return classifyWithZAI(input, flags.Z_AI_CONFIDENCE_THRESHOLD);
  case 'openai':
    return classifyWithOpenAI(input);
  case 'deterministic':
    return classifyDeterministic(input);
}
```

---

## Part 2: Use Case 1 – Emergency Triage Classification

### 2.1 Z.AI Integration (Primary Model)

**Purpose:** Classify dog emergency into 4 categories with confidence score

```json
{
  "endpoint": "POST https://api.z.ai/v1/classify",
  "auth": "Bearer token (env var: Z_AI_API_KEY)",
  "timeout": "5 seconds",
  "request": {
    "text": "My dog is bleeding from the paw and limping badly. Very agitated.",
    "model": "dog-behavior-classifier-v1",
    "confidence_threshold": 0.85
  },
  "request_format": {
    "text": {
      "type": "string",
      "max_length": 500,
      "description": "Dog description + symptoms"
    },
    "model": {
      "type": "string",
      "enum": ["dog-behavior-classifier-v1"],
      "description": "Z.AI model identifier"
    },
    "confidence_threshold": {
      "type": "float",
      "min": 0.0,
      "max": 1.0,
      "description": "Minimum confidence to auto-classify"
    }
  },
  "response_200": {
    "classification": "medical",
    "confidence": 0.94,
    "labels": [
      {
        "label": "medical_emergency",
        "score": 0.94,
        "reasoning": "Keywords: bleeding, limping, agitated"
      },
      {
        "label": "injury",
        "score": 0.89,
        "reasoning": "Paw injury indicated"
      }
    ],
    "processing_time_ms": 342,
    "model_version": "1.2.1"
  },
  "response_400": {
    "error": "invalid_input",
    "message": "Text too short (minimum 20 chars)"
  },
  "response_429": {
    "error": "rate_limit",
    "message": "Too many requests",
    "retry_after_seconds": 60
  },
  "response_500": {
    "error": "api_error",
    "message": "Z.AI service error"
  },
  "cost": {
    "per_call": 0.001,
    "currency": "USD",
    "usage_example": "1000 calls/day = $1/day = $30/month"
  },
  "implementation": {
    "request_code": "fetch('https://api.z.ai/v1/classify', { method: 'POST', headers: { 'Authorization': 'Bearer ' + process.env.Z_AI_API_KEY }, body: JSON.stringify({text, model: 'dog-behavior-classifier-v1', confidence_threshold: 0.85}) })",
    "error_handling": "Timeout >5s → Try OpenAI, Retry on 429 with exponential backoff"
  }
}
```

### 2.2 OpenAI Fallback (If Z.AI Down >5 min)

**Purpose:** GPT-4 fallback with deterministic prompt

```json
{
  "endpoint": "POST https://api.openai.com/v1/chat/completions",
  "auth": "Bearer token (env var: OPENAI_API_KEY)",
  "timeout": "10 seconds",
  "trigger": "Z.AI fails 3x in 5 min OR timeout >5s",
  "request": {
    "model": "gpt-4-turbo",
    "messages": [
      {
        "role": "system",
        "content": "You are a dog emergency triage system. Classify the following dog situation into ONE of: medical, crisis, stray, normal. Return ONLY the classification word, nothing else."
      },
      {
        "role": "user",
        "content": "My dog is bleeding from the paw and limping badly. Very agitated."
      }
    ],
    "temperature": 0,
    "max_tokens": 10
  },
  "response_200": {
    "choices": [
      {
        "message": {
          "content": "medical"
        }
      }
    ],
    "usage": {
      "prompt_tokens": 45,
      "completion_tokens": 1,
      "total_tokens": 46
    },
    "processing_time_ms": 1250
  },
  "cost": {
    "per_call": 0.01,
    "currency": "USD",
    "note": "10x more expensive than Z.AI, only used as fallback",
    "monthly_budget": "50 fallback calls × $0.01 = $0.50"
  },
  "implementation": {
    "decision_tree": "If Z.AI fails → Wait up to 10s for OpenAI response → If OpenAI also fails → Use deterministic fallback"
  }
}
```

### 2.3 Deterministic Rules (Final Fallback)

**Purpose:** Keyword matching, zero cost, instant response

```typescript
// File: lib/triage/deterministic-classifier.ts

const TRIAGE_KEYWORDS = {
  medical: [
    'bleeding', 'blood', 'injury', 'injured', 'broken', 'fracture',
    'poison', 'poisoned', 'toxin', 'unconscious', 'collapsed',
    'seizure', 'seizures', 'vomiting', 'diarrhea', 'difficulty breathing',
    'choking', 'pale gums', 'shock', 'critical'
  ],
  crisis: [
    'danger', 'dangerous', 'threat', 'threatening', 'aggressive',
    'attack', 'attacking', 'scared', 'terrified', 'emergency',
    'urgent', 'afraid', 'biting', 'snarling', 'lunging'
  ],
  stray: [
    'lost', 'stray', 'missing', 'found', 'abandoned', 'wandering',
    'no owner', 'no home', 'unknown dog', 'roaming', 'loose'
  ]
};

interface TriageResult {
  classification: 'medical' | 'crisis' | 'stray' | 'normal';
  confidence: number;
  matched_keywords: string[];
  processing_time_ms: number;
  model: 'deterministic';
}

export function classifyDeterministic(text: string): TriageResult {
  const lowerText = text.toLowerCase();
  const startTime = Date.now();
  const matched: { [key: string]: string[] } = {};

  // Check each category
  for (const [category, keywords] of Object.entries(TRIAGE_KEYWORDS)) {
    matched[category] = keywords.filter(kw => lowerText.includes(kw));
  }

  // Find highest priority match
  if (matched.medical.length > 0) {
    return {
      classification: 'medical',
      confidence: 0.95, // High confidence in keyword match
      matched_keywords: matched.medical,
      processing_time_ms: Date.now() - startTime,
      model: 'deterministic'
    };
  }

  if (matched.crisis.length > 0) {
    return {
      classification: 'crisis',
      confidence: 0.95,
      matched_keywords: matched.crisis,
      processing_time_ms: Date.now() - startTime,
      model: 'deterministic'
    };
  }

  if (matched.stray.length > 0) {
    return {
      classification: 'stray',
      confidence: 0.95,
      matched_keywords: matched.stray,
      processing_time_ms: Date.now() - startTime,
      model: 'deterministic'
    };
  }

  // Default: no keywords matched
  return {
    classification: 'normal',
    confidence: 0.80, // Lower confidence, defaulting to safe option
    matched_keywords: [],
    processing_time_ms: Date.now() - startTime,
    model: 'deterministic'
  };
}
```

### 2.4 Confidence Thresholds (Triage)

```
┌────────────────────────────────────────────────────────────┐
│ CONFIDENCE THRESHOLDS (Auto-Approve vs Manual Review)      │
└────────────────────────────────────────────────────────────┘

TRIAGE_AUTO_APPROVE_THRESHOLD: 0.85
  ├─ If confidence ≥ 0.85: Accept classification, use immediately
  ├─ If 0.70 ≤ confidence < 0.85: Queue for manual review (secondary)
  ├─ If confidence < 0.70: Flag as uncertain, manual review required
  └─ Rationale: Emergency triage is high-stakes, err on side of caution

Confidence Scoring:
  Z.AI: Returns 0.0–1.0 (use directly)
  OpenAI: Parse confidence from prompt engineering (binary pass/fail)
  Deterministic: 0.95 if keywords matched, 0.80 if defaulting to "normal"

Processing Flow:
  1. Triage submitted
  2. Call Z.AI → Get confidence score
  3. If confidence ≥ 0.85 → AUTO-APPROVE (immediate result)
  4. If 0.70 ≤ confidence < 0.85 → QUEUE for manual review (1-2h wait)
  5. If < 0.70 → ESCALATE to emergency (call 000 if critical)
```

---

## Part 3: Use Case 2 – Review Moderation

### 3.1 Z.AI Review Moderation

**Purpose:** Sentiment analysis + spam detection for trainer reviews

```json
{
  "endpoint": "POST https://api.z.ai/v1/classify",
  "use_case": "Review moderation (secondary use case)",
  "request": {
    "text": "Great trainer! Very knowledgeable and patient. Highly recommend.",
    "model": "review-moderation-v1",
    "task": "sentiment_and_spam_detection"
  },
  "response_200": {
    "sentiment": "positive",
    "sentiment_score": 0.92,
    "spam_score": 0.02,
    "flags": [],
    "recommendation": "approve",
    "confidence": 0.95
  },
  "response_harmful": {
    "sentiment": "negative",
    "spam_score": 0.05,
    "flags": ["offensive_language", "profanity"],
    "recommendation": "reject",
    "confidence": 0.88,
    "reason": "Contains offensive language"
  },
  "auto_approve_threshold": 0.90,
  "manual_review_threshold": 0.85,
  "fallback_rule": "If Z.AI down >30 min, approve all (don't queue indefinitely)"
}
```

### 3.2 Review Moderation Flow

```
┌────────────────────────────────────────────────────────────┐
│ REVIEW MODERATION WORKFLOW                                 │
└────────────────────────────────────────────────────────────┘

Step 1: Validation (No AI)
  ├─ Length check: 50–1000 chars (deterministic)
  ├─ Language detection: English only (deterministic)
  ├─ Profanity filter: Block obvious spam words
  └─ If fails validation → Reject immediately (0 cost)

Step 2: AI Classification (Z.AI)
  ├─ Analyze sentiment + spam score
  ├─ If confidence ≥ 0.90 → Auto-approve (safe)
  ├─ If 0.85 ≤ confidence < 0.90 → Queue for manual review
  ├─ If confidence < 0.85 → Flag for manual review
  └─ If Z.AI fails → Try OpenAI
  
Step 3: Manual Review Queue (Admin)
  ├─ Operator reviews pending reviews
  ├─ Target: Clear queue to <10 pending
  ├─ Time: 1–2 hours per week (D-010)
  └─ If queue >100 → Operator works extra hours

Step 4: Final Decision
  ├─ Admin approves → Published to trainer profile
  ├─ Admin rejects → Email sent to reviewer (if not anonymous)
  └─ Immutable: Decision logged in audit trail
```

---

## Part 4: Use Case 3 – Trainer ABN Verification (Phase 2)

**Purpose:** Verify ABN against ATO database (not Phase 1)

```json
{
  "status": "Phase 2 enhancement (not MVP)",
  "endpoint": "ATO API (not Z.AI)",
  "request": {
    "abn": "12345678901"
  },
  "integration": {
    "api": "Australian Taxation Office (ATO) lookup",
    "auth": "OAuth2 (requires ABN lookup service subscription)",
    "fallback": "Manual operator verification (request doc upload)"
  },
  "timeline": "Phase 2 (after launch, if needed for trust building)"
}
```

---

## Part 5: Provider Health Monitoring

### 5.1 Health Check Targets

```
┌────────────────────────────────────────────────────────────┐
│ PROVIDER HEALTH MONITORING (SLOs)                          │
└────────────────────────────────────────────────────────────┘

Z.AI Health:
  ├─ Response time target: <500ms (P95)
  ├─ Error rate target: <1%
  ├─ Uptime target: 99.9%
  ├─ Failure trigger: 3 failures in 5 min → Switch to OpenAI
  └─ Health check: Every 60s

OpenAI Health:
  ├─ Response time target: <2 seconds (P95)
  ├─ Error rate target: <0.5%
  ├─ Uptime target: 99.95% (public API, very reliable)
  ├─ Rate limit: 100 req/min (shared quota)
  └─ Health check: Every 60s

Deterministic Rules:
  ├─ Response time: <10ms (sub-millisecond)
  ├─ Error rate: 0% (pure logic, no external deps)
  ├─ Uptime: 100% (local computation)
  └─ Failsafe: Always available

Fallback Decision Tree:
  1. Health check Z.AI → Healthy? → Use Z.AI
  2. Z.AI unhealthy? → Check uptime last 5 min
  3. If Z.AI down >5 min → Switch to OpenAI
  4. If OpenAI also down → Use deterministic
  5. All down? → Default to "normal" + alert ops team
```

### 5.2 Implementation Example

```typescript
// File: lib/health/ai-provider-monitor.ts

interface ProviderHealth {
  provider: 'z_ai' | 'openai' | 'deterministic';
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  error_rate: number;
  last_check: Date;
  failures_last_5min: number;
}

class AIProviderMonitor {
  private healthChecks: Map<string, ProviderHealth> = new Map();

  async checkProviderHealth(): Promise<void> {
    // Check Z.AI
    const zaiHealth = await this.checkZAI();
    this.healthChecks.set('z_ai', zaiHealth);

    // Check OpenAI
    const openaiHealth = await this.checkOpenAI();
    this.healthChecks.set('openai', openaiHealth);

    // Deterministic always healthy
    this.healthChecks.set('deterministic', {
      provider: 'deterministic',
      status: 'healthy',
      latency_ms: 5,
      error_rate: 0,
      last_check: new Date(),
      failures_last_5min: 0
    });

    // Decide primary provider
    this.decidePrimaryProvider();
  }

  private async checkZAI(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.z.ai/health', {
        timeout: 3000,
        headers: { Authorization: `Bearer ${process.env.Z_AI_API_KEY}` }
      });
      const latency = Date.now() - startTime;
      
      return {
        provider: 'z_ai',
        status: response.ok ? 'healthy' : 'degraded',
        latency_ms: latency,
        error_rate: response.ok ? 0 : 1,
        last_check: new Date(),
        failures_last_5min: 0
      };
    } catch (error) {
      return {
        provider: 'z_ai',
        status: 'down',
        latency_ms: 3000,
        error_rate: 1,
        last_check: new Date(),
        failures_last_5min: this.incrementFailures('z_ai')
      };
    }
  }

  private decidePrimaryProvider(): void {
    const zaiHealth = this.healthChecks.get('z_ai');
    const downFor5Min = zaiHealth?.failures_last_5min || 0 > 3;

    if (zaiHealth?.status === 'healthy' && !downFor5Min) {
      // Use Z.AI
      process.env.AI_MODE = 'z_ai';
    } else if (!downFor5Min) {
      // Use OpenAI
      process.env.AI_MODE = 'openai';
    } else {
      // Fallback to deterministic
      process.env.AI_MODE = 'deterministic';
    }
  }
}
```

---

## Part 6: Logging & Audit Trail

### 6.1 Triage Logs (Immutable)

```sql
-- Table: triage_logs
-- Purpose: Complete audit trail of all emergency triages (never deleted)

CREATE TABLE triage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Input
  dog_description TEXT NOT NULL ENCRYPTED,
  suburb VARCHAR(100),
  phone VARCHAR(20),
  
  -- Classification
  classification VARCHAR(50) NOT NULL, -- medical|crisis|stray|normal
  confidence_score DECIMAL(3,2) NOT NULL, -- 0.00-1.00
  ai_model_used VARCHAR(50) NOT NULL, -- z_ai|openai|deterministic
  
  -- Processing
  latency_ms INTEGER NOT NULL,
  provider_response JSONB, -- Full API response (for debugging)
  
  -- Resources
  resources_returned JSONB, -- Matched vets, shelters, trainers
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address INET, -- For rate limiting analysis
  user_id UUID, -- If user opts to save results
  
  -- Indexes
  INDEX idx_created_at (created_at),
  INDEX idx_classification (classification),
  INDEX idx_ai_model (ai_model_used)
);

-- Retention: 1 year (for stats), then anonymize
-- Immutable: No updates, only inserts
-- Privacy: dog_description encrypted, minimal IP tracking
```

### 6.2 Review Moderation Logs

```sql
-- Table: review_moderation_logs
-- Purpose: Track all review moderation decisions (audit trail)

CREATE TABLE review_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id),
  
  -- Z.AI Analysis
  z_ai_sentiment VARCHAR(50),
  z_ai_spam_score DECIMAL(3,2),
  z_ai_flags JSONB,
  z_ai_confidence DECIMAL(3,2),
  
  -- Decision
  action VARCHAR(50) NOT NULL, -- approve|reject|manual_review
  reason TEXT,
  decided_by VARCHAR(50), -- z_ai|openai|operator|system
  
  -- Operator Action (if manual)
  operator_id UUID REFERENCES users(id),
  operator_decision VARCHAR(50), -- approve|reject|override
  operator_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  
  INDEX idx_review_id (review_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);
```

---

## Part 7: Cost Analysis & Budgeting

### 7.1 Monthly Cost Breakdown

```
┌────────────────────────────────────────────────────────────┐
│ COST ANALYSIS (Decision D-009)                             │
└────────────────────────────────────────────────────────────┘

Z.AI PRIMARY TIER:
  ├─ Estimate: 1,000 triage calls/day (1,000 × $0.001 = $1/day)
  ├─ Monthly: ~1,000 calls × 30 days = 30,000 calls
  ├─ Cost: 30,000 × $0.001 = $30/month
  └─ Confidence: 0.85 threshold (auto-approve 85% of calls)

OPENAI FALLBACK TIER:
  ├─ Trigger: Z.AI fails >5 min (estimated: 2% of calls)
  ├─ Estimate: 30,000 calls × 0.02 = 600 fallback calls/month
  ├─ Cost: 600 × $0.01 = $6/month
  └─ Total fallback cost: ~$6/month

DETERMINISTIC FALLBACK:
  ├─ Trigger: Both APIs down (rare)
  ├─ Cost: $0 (pure keyword matching)
  └─ Frequency: <1% of calls

REVIEW MODERATION:
  ├─ Estimate: 100 reviews/day, 50% flagged by Z.AI
  ├─ Cost: 50 reviews × $0.001 = $0.05/day = $1.50/month
  └─ Manual review: Admin cost (already budgeted as D-010)

TOTAL MONTHLY BUDGET:
  ├─ Z.AI triage: $30
  ├─ OpenAI fallback: $6
  ├─ Review moderation: $1.50
  ├─ Deterministic: $0
  └─ TOTAL: ~$37.50/month (well under $250 target)

BUDGET ALERT THRESHOLDS:
  ├─ Warning: If spend exceeds $200/month (80% of target)
  ├─ Alert ops team
  ├─ Review query patterns
  └─ Consider feature flag to reduce Z.AI usage

COST OPTIMIZATION TACTICS:
  ├─ Deterministic rules first (zero cost)
  ├─ Cache Z.AI results (5-min TTL)
  ├─ Batch process reviews during low-traffic hours
  ├─ Monitor Z.AI response times (higher latency = more fallbacks)
  └─ Archive old triage_logs (1 year retention)
```

---

## Part 8: Error Handling & Failsafes

### 8.1 Timeout & Retry Logic

```typescript
// File: lib/triage/triage-cascade.ts

interface TriageClassification {
  classification: 'medical' | 'crisis' | 'stray' | 'normal';
  confidence: number;
  model: 'z_ai' | 'openai' | 'deterministic';
  processing_time_ms: number;
  fallback_used: boolean;
}

export async function classifyTriageRequest(
  input: string,
  suburb: string
): Promise<TriageClassification> {
  const cascade = new TriageCascade();

  // Tier 1: Z.AI
  try {
    const result = await cascade.withTimeout(
      classifyWithZAI(input),
      5000 // 5 second timeout
    );
    if (result.confidence >= 0.70) {
      return { ...result, fallback_used: false };
    }
  } catch (error) {
    console.error('[Triage] Z.AI failed:', error);
    // Fall through to Tier 2
  }

  // Tier 2: OpenAI (if Z.AI failed or below threshold)
  try {
    const result = await cascade.withTimeout(
      classifyWithOpenAI(input),
      10000 // 10 second timeout
    );
    return { ...result, fallback_used: true };
  } catch (error) {
    console.error('[Triage] OpenAI failed:', error);
    // Fall through to Tier 3
  }

  // Tier 3: Deterministic (guaranteed to work)
  const result = classifyDeterministic(input);
  return { ...result, fallback_used: true };
}

private async withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]) as Promise<T>;
}
```

### 8.2 Error Scenarios

```
Scenario 1: Z.AI Timeout (>5 sec)
  ├─ Detection: Promise.race timeout
  ├─ Action: Catch error, don't retry (move to Tier 2)
  ├─ Logging: Log timeout event, increment failure counter
  ├─ User impact: 5 second wait (transparent)
  └─ Recovery: Try OpenAI next

Scenario 2: Z.AI Rate Limit (429)
  ├─ Detection: HTTP 429 response
  ├─ Action: Exponential backoff (2s, 4s, 8s)
  ├─ Retries: Up to 3 retries (total 14 seconds)
  ├─ On all retries exhausted: Move to Tier 2
  └─ Cost implication: Avoid excessive fallback costs

Scenario 3: Z.AI API Error (500)
  ├─ Detection: HTTP 5xx response
  ├─ Action: Don't retry (server error, not rate limit)
  ├─ Increment failure counter: 1 failure
  ├─ If 3 failures in 5 min → Switch to OpenAI tier
  └─ Recovery: Monitor health check

Scenario 4: OpenAI Timeout (>10 sec)
  ├─ Detection: Promise.race timeout
  ├─ Action: Don't retry (expensive)
  ├─ Move to Tier 3 (deterministic)
  ├─ Logging: Log OpenAI timeout + alert ops
  └─ User impact: 10 second wait, then deterministic result

Scenario 5: All APIs Down
  ├─ Detection: Z.AI + OpenAI both fail
  ├─ Action: Use deterministic fallback immediately
  ├─ Result: "normal" classification (safe default)
  ├─ Logging: CRITICAL alert to ops team
  ├─ Cost: $0 (deterministic is free)
  └─ Recovery: Manual review recommended
```

---

## Part 9: Testing & Validation

### 9.1 Test Scenarios (20 per Classification)

```
┌────────────────────────────────────────────────────────────┐
│ TEST CASES (80 Total: 20 per classification)               │
└────────────────────────────────────────────────────────────┘

MEDICAL SCENARIOS (20 test cases):
  1. "Dog bleeding from paw" → medical (0.95+ confidence)
  2. "Broken leg, can't walk" → medical (0.95+ confidence)
  3. "Poisoned by rat poison, vomiting" → medical (0.95+ confidence)
  4. "Seizure, unconscious" → medical (0.95+ confidence)
  5. "Choking, difficulty breathing" → medical (0.95+ confidence)
  6. "Pale gums, shock symptoms" → medical (0.95+ confidence)
  7. "Limping, injured paw" → medical (0.90+ confidence)
  8. "Swelling, possible fracture" → medical (0.90+ confidence)
  9. "Excessive bleeding won't stop" → medical (0.95+ confidence)
  10. "Dog hit by car, trauma" → medical (0.95+ confidence)
  [... 10 more medical scenarios]

CRISIS SCENARIOS (20 test cases):
  1. "Dog is aggressive toward strangers" → crisis (0.85+ confidence)
  2. "Attacking other dogs viciously" → crisis (0.95+ confidence)
  3. "Scary, dangerous behavior toward people" → crisis (0.90+ confidence)
  4. "Lunging at kids, very aggressive" → crisis (0.95+ confidence)
  5. "Dog is threatening, snarling constantly" → crisis (0.90+ confidence)
  6. "Terrified, biting handler" → crisis (0.85+ confidence)
  7. "Emergency, dog attack situation" → crisis (0.95+ confidence)
  8. "Dangerous dog, won't let anyone near" → crisis (0.90+ confidence)
  9. "Scared and snapping at everyone" → crisis (0.85+ confidence)
  10. "Dog is threatening with teeth showing" → crisis (0.90+ confidence)
  [... 10 more crisis scenarios]

STRAY SCENARIOS (20 test cases):
  1. "Found a dog in my yard, no collar" → stray (0.90+ confidence)
  2. "Lost dog, missing for 2 days" → stray (0.95+ confidence)
  3. "Stray wandering the streets" → stray (0.95+ confidence)
  4. "Abandoned dog, no owner around" → stray (0.95+ confidence)
  5. "Unknown dog roaming neighborhood" → stray (0.90+ confidence)
  6. "Dog with no home, no identification" → stray (0.90+ confidence)
  7. "Found stray, very friendly" → stray (0.95+ confidence)
  8. "Dog escaped, searching for owner" → stray (0.85+ confidence)
  9. "Loose dog, appears abandoned" → stray (0.90+ confidence)
  10. "Missing dog poster matching this dog" → stray (0.90+ confidence)
  [... 10 more stray scenarios]

NORMAL SCENARIOS (20 test cases):
  1. "Dog is stubborn, won't listen" → normal (0.75+ confidence)
  2. "Puppy is jumping on guests" → normal (0.85+ confidence)
  3. "Dog barks too much at other dogs" → normal (0.80+ confidence)
  4. "Needs help with house training" → normal (0.85+ confidence)
  5. "Dog pulls on leash constantly" → normal (0.85+ confidence)
  6. "Gets anxious when left alone" → normal (0.85+ confidence)
  7. "Doesn't respond to recall" → normal (0.85+ confidence)
  8. "Dog is destructive when bored" → normal (0.85+ confidence)
  9. "Reactive to other dogs on walks" → normal (0.80+ confidence)
  10. "Needs better behavior training" → normal (0.85+ confidence)
  [... 10 more normal scenarios]

EDGE CASES (Special testing):
  1. Empty input "" → Reject (validation error)
  2. Very long input (>500 chars) → Truncate and classify
  3. Non-English text "Mon chien est..." → Language detection flag
  4. Ambiguous input "Dog situation help" → Deterministic default "normal"
  5. All caps "BLEEDING UNCONSCIOUS" → Classify as medical
```

### 9.2 Confidence Accuracy Targets

```
Performance Metric: Precision at 0.85 Confidence Threshold

Target: >90% precision (of calls auto-approved at 0.85+, >90% correct)

Calculation:
  ├─ True positives: Calls auto-approved + actually correct
  ├─ False positives: Calls auto-approved + actually wrong
  ├─ Precision = TP / (TP + FP)
  ├─ Target: TP / (TP + FP) > 0.90
  └─ Acceptable: <10% of auto-approved calls are wrong

Validation Method:
  1. Run 80 test scenarios through Z.AI
  2. Record confidence scores
  3. Filter to calls with confidence ≥ 0.85
  4. Manually verify correctness (gold standard)
  5. Calculate precision
  6. If precision <90%, retrain or adjust thresholds
```

---

## Part 10: Phase 1 Scope (MVP)

```
PHASE 1 (LAUNCH):
  ✅ Z.AI integration for emergency triage (critical path)
  ✅ Review moderation with Z.AI (secondary)
  ✅ Deterministic fallback rules (always available)
  ✅ OpenAI fallback (if Z.AI down >5 min)
  ✅ Feature flags (runtime control)
  ✅ Monitoring & logging (audit trail)
  ✅ Health checks (provider monitoring)
  ✅ Cost tracking (<$250/month)

PHASE 2+ (FUTURE ENHANCEMENTS):
  ⏳ ABN verification (ATO API)
  ⏳ Trainer profile auto-tagging (ML-based categories)
  ⏳ Search ranking optimization (ML-based relevance)
  ⏳ Fraud detection (chargeback prediction)
  ⏳ Sentiment analysis on reviews (beyond binary approve/reject)
  ⏳ Personalized recommendations (similar trainers)
```

---

## Part 11: Quick Reference – Decision Tree

```
User submits emergency triage:
  │
  ├─ AI_ENABLED = false? → Use deterministic (skip to Tier 3)
  │
  ├─ AI_MODE = 'z_ai'?
  │  ├─ Call Z.AI (5s timeout)
  │  ├─ confidence ≥ 0.85? → AUTO-APPROVE, return result
  │  ├─ 0.70 ≤ confidence < 0.85? → QUEUE for manual review
  │  ├─ Timeout or error? → Try OpenAI (Tier 2)
  │  └─ 3 failures in 5 min? → Switch to OpenAI mode
  │
  ├─ AI_MODE = 'openai'?
  │  ├─ Call OpenAI (10s timeout)
  │  ├─ Success? → Return result (no confidence score, binary pass/fail)
  │  ├─ Timeout or error? → Use deterministic (Tier 3)
  │  └─ Both failed? → Alert ops team
  │
  └─ AI_MODE = 'deterministic'?
     ├─ Check keywords against TRIAGE_KEYWORDS
     ├─ Match found? → Return classification (confidence 0.95)
     └─ No match? → Default to "normal" (confidence 0.80)
```

---

**Document Version:** 1.0  
**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Owner:** AI + Backend Team  
**Next Document:** 08_OPERATIONS_AND_HEALTH.md (operator workflows, playbooks)

---

**End of 07_AI_AUTOMATION_AND_MODES.md**
