# AI Integration Specialist Memory Bank

## User Preferences

- **Greeting Name:** DTD Developer
- **Cost Sensitivity:** Strict (alert at 80% of budget)
- **Failover Strategy:** Balanced (switch after 3 failures in 5 min)

## Session History

### 2025-12-24 - Initial Agent Creation
- Created AI Integration Specialist Expert agent for DTD project
- Specialization: Z.AI primary, z.ai fallback, deterministic rules, feature flags, health monitoring, audit logging
- Reference documents: DOCS/07_AI_AUTOMATION_AND_MODES.md

## AI Integration Decisions

### Three-Tier AI Strategy

**Tier 1: Z.AI (Primary)**
- Speed: <500ms target
- Cost: ~$0.001 per call
- Accuracy: Specialized dog behavior models
- When: Normal operation
- Risk: Depends on external API

**Tier 2: z.ai GPT-4 (Secondary Fallback)**
- Speed: <2 seconds
- Cost: ~$0.01 per call (10x expensive)
- Accuracy: General-purpose, very accurate
- When: Z.AI unavailable >5 min
- Risk: Higher cost, slower

**Tier 3: Deterministic Rules (Final Fallback)**
- Speed: <10ms (sub-millisecond)
- Cost: Zero
- Accuracy: Keyword-based, limited but safe
- When: Both APIs timeout
- Risk: May over/under-classify (acceptable for safety)

### Cascade Logic

1. Try Z.AI (5s timeout)
2. If fails → Try z.ai (10s timeout)
3. If fails → Use deterministic rules
4. Default: "normal" classification + log incident

### Feature Flags

```typescript
interface AIFeatureFlags {
  AI_ENABLED: boolean;              // Master kill switch
  AI_MODE: 'z_ai' | 'openai' | 'deterministic';
  Z_AI_CONFIDENCE_THRESHOLD: number; // 0.85 (auto-approve)
  Z_AI_MANUAL_REVIEW_THRESHOLD: number; // 0.70 (manual queue)
  OPENAI_FALLBACK_TIMEOUT: number;  // 300 seconds
  REVIEW_AUTO_APPROVE_THRESHOLD: number; // 0.90
  TRIAGE_AUTO_APPROVE_THRESHOLD: number; // 0.85
}
```

### Confidence Thresholds

**Triage Classification:**
- Auto-approve: ≥0.85 confidence
- Manual review: 0.70–0.85 confidence
- Escalate: <0.70 confidence (call 000 if critical)

**Review Moderation:**
- Auto-approve: ≥0.90 confidence
- Manual review: 0.85–0.90 confidence
- Flag for review: <0.85 confidence

### Health Monitoring SLOs

**Z.AI Health:**
- Response time target: <500ms (P95)
- Error rate target: <1%
- Uptime target: 99.9%
- Failure trigger: 3 failures in 5 min → Switch to z.ai
- Health check: Every 60s

**z.ai Health:**
- Response time target: <2 seconds (P95)
- Error rate target: <0.5%
- Uptime target: 99.95% (public API, very reliable)
- Rate limit: 100 req/min (shared quota)
- Health check: Every 60s

**Deterministic Rules:**
- Response time: <10ms (sub-millisecond)
- Error rate: 0% (pure logic, no external deps)
- Uptime: 100% (local computation)
- Failsafe: Always available

### Cost Budget

**Monthly Budget: <$250 (D-009)**

**Z.AI PRIMARY TIER:**
- Estimate: 1,000 triage calls/day
- Monthly: ~30,000 calls
- Cost: 30,000 × $0.001 = $30/month
- Confidence: 0.85 threshold (auto-approve 85% of calls)

**OPENAI FALLBACK TIER:**
- Trigger: Z.AI fails >5 min (estimated: 2% of calls)
- Estimate: 30,000 calls × 0.02 = 600 fallback calls/month
- Cost: 600 × $0.01 = $6/month
- Total fallback cost: ~$6/month

**DETERMINISTIC FALLBACK:**
- Trigger: Both APIs down (rare)
- Cost: $0 (pure keyword matching)
- Frequency: <1% of calls

**REVIEW MODERATION:**
- Estimate: 100 reviews/day, 50% flagged by Z.AI
- Cost: 50 reviews × $0.001 = $0.05/day = $1.50/month
- Manual review: Admin cost (already budgeted as D-010)

**TOTAL MONTHLY BUDGET:**
- Z.AI triage: $30
- z.ai fallback: $6
- Review moderation: $1.50
- Deterministic: $0
- **TOTAL: ~$37.50/month** (well under $250 target)

### Audit Logging

**Triage Logs (triage_logs table):**
- Immutable: No updates, only inserts
- Retention: 1 year (for stats), then anonymize
- Privacy: dog_description encrypted, minimal IP tracking
- Fields: classification, confidence, ai_model_used, latency_ms, provider_response

**Review Moderation Logs (review_moderation_logs table):**
- Immutable: No updates, only inserts
- Fields: z_ai_sentiment, z_ai_spam_score, z_ai_flags, z_ai_confidence
- Decision: action (approve|reject|manual_review), decided_by (z_ai|openai|operator|system)

## Personal Notes

- Always reference DOCS/07_AI_AUTOMATION_AND_MODES.md for complete AI integration specification
- Use three-tier cascade pattern (Z.AI → z.ai → Deterministic)
- Implement feature flags for runtime control (AI_ENABLED, AI_MODE)
- Monitor provider health and trigger automatic failover
- Log all classifications to immutable audit trail
- Track costs and alert at 80% of budget
- Use deterministic rules first (zero cost) when possible
- Cache Z.AI results (5-min TTL) to reduce API calls
