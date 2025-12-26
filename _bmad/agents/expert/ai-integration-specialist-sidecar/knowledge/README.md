# AI Integration Specialist Knowledge Base

## AI Integration Reference

Primary reference document: [`DOCS/07_AI_AUTOMATION_AND_MODES.md`](../../DOCS/07_AI_AUTOMATION_AND_MODES.md:1)

### Three-Tier AI Strategy

| Tier | Provider | Speed | Cost | Accuracy | When |
|-------|----------|-------|------|-------|
| Tier 1 | Z.AI | <500ms | ~$0.001/call | Specialized dog behavior | Normal operation |
| Tier 2 | z.ai GPT-4 | <2s | ~$0.01/call (10x) | General-purpose | Z.AI down >5 min |
| Tier 3 | Deterministic | <10ms | $0 | Keyword-based | Both APIs timeout |

### Cascade Logic

```
User submits emergency triage:
  │
  ├─ AI_ENABLED = false? → Use deterministic (skip to Tier 3)
  │
  ├─ AI_MODE = 'z_ai'?
  │  ├─ Call Z.AI (5s timeout)
  │  ├─ confidence ≥ 0.85? → AUTO-APPROVE, return result
  │  ├─ 0.70 ≤ confidence < 0.85? → QUEUE for manual review
  │  ├─ Timeout or error? → Try z.ai (Tier 2)
  │  └─ 3 failures in 5 min? → Switch to z.ai mode
  │
  ├─ AI_MODE = 'openai'?
  │  ├─ Call z.ai (10s timeout)
  │  ├─ Success? → Return result (no confidence score, binary pass/fail)
  │  ├─ Timeout or error? → Use deterministic (Tier 3)
  │  └─ Both failed? → Alert ops team
  │
  └─ AI_MODE = 'deterministic'?
     ├─ Check keywords against TRIAGE_KEYWORDS
     ├─ Match found? → Return classification (confidence 0.95)
     └─ No match? → Default to "normal" (confidence 0.80)
```

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

### Deterministic Keywords

```typescript
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
```

### Cost Budget

**Monthly Budget: <$250 (D-009)**

| Component | Estimate | Monthly Cost |
|-----------|-----------|-------------|
| Z.AI triage | 30,000 calls × $0.001 | $30 |
| z.ai fallback | 600 calls × $0.01 | $6 |
| Review moderation | 50 reviews × $0.001 | $1.50 |
| Deterministic | $0 | $0 |
| **TOTAL** | | **~$37.50/month** |

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

## Architectural Decisions

| Decision | Implementation |
|----------|----------------|
| D-007 (fallback rules) | Three-tier cascade: Z.AI → z.ai → Deterministic |
| D-008 (confidence thresholds) | 0.85 auto-approve, 0.70 manual review for triage |
| D-009 (Z.AI + z.ai) | Cost budgeted <$250/month, fallback to z.ai if Z.AI down >5 min |

## Performance Targets

- Z.AI response: <500ms (P95)
- z.ai response: <2 seconds (P95)
- Deterministic response: <10ms
- Triage classification: <500ms total
- Review moderation: <500ms
- Health check interval: 60 seconds
