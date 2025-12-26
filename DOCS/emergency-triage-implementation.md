# Emergency Triage Implementation Documentation

**DTD Phase 4: Emergency Triage**  
**Version:** 1.0.0  
**Date:** 2025-12-25

---

## Table of Contents

1. [Overview](#overview)
2. [Z.AI Integration](#zai-integration)
3. [z.ai Fallback Logic](#openai-fallback-logic)
4. [Cascade Logic](#cascade-logic)
5. [Emergency Classification System](#emergency-classification-system)
6. [API Endpoints](#api-endpoints)
7. [Testing Guidelines](#testing-guidelines)
8. [Error Handling Patterns](#error-handling-patterns)
9. [Security Considerations](#security-considerations)
10. [Performance Optimizations](#performance-optimizations)
11. [Monitoring and Alerting](#monitoring-and-alerting)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

The Emergency Triage system provides AI-powered classification of dog-related emergency situations with automatic fallback between Z.AI (primary) and z.ai (secondary) providers. The system classifies emergencies into four categories:

- **Medical**: Dog is injured, bleeding, or in physical distress
- **Crisis**: Dog is attacking, aggressive, or posing immediate danger
- **Stray**: Dog is lost, abandoned, or wandering alone
- **Normal**: Non-urgent situation requiring general advice

### Key Features

- **Cascade Logic**: Automatic fallback from Z.AI to z.ai on failure
- **Metrics Tracking**: Detailed logging of all AI operations
- **Health Monitoring**: Real-time availability checks for both providers
- **Configurable**: Enable/disable cascade via environment variables
- **Type-Safe**: Full TypeScript support with strict type checking

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Emergency Triage System                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐    ┌─────────────┐              │
│  │   Z.AI      │    │   z.ai     │              │
│  │  (Primary)   │    │  (Fallback)   │              │
│  └──────┬──────┘    └──────┬──────┘              │
│         │                    │                         │
│         └────────┬───────────┘                         │
│                  │                                      │
│         ┌────────▼────────┐                           │
│         │ Cascade Manager │                           │
│         └────────┬────────┘                           │
│                  │                                      │
│         ┌────────▼────────┐                           │
│         │ Triage Service  │                           │
│         └────────┬────────┘                           │
│                  │                                      │
│         ┌────────▼────────┐                           │
│         │  Supabase DB   │                           │
│         └─────────────────┘                           │
│                                                       │
└───────────────────────────────────────────────────────────────┘
```

---

## Z.AI Integration

### Configuration

Z.AI is configured via environment variables:

```bash
ZAI_API_KEY=your-zai-api-key-here
ZAI_MODEL=zai-1
ZAI_BASE_URL=https://api.zai.ai
```

### Client Implementation

The Z.AI client ([`src/lib/zai.ts`](src/lib/zai.ts)) provides:

- **`classifyEmergency()`**: Classify emergency severity
- **`getEmergencyRecommendations()`**: Get recommendations based on classification
- **`getEmergencyContacts()`**: Get emergency contacts for a council
- **`isAvailable()`**: Health check for Z.AI service

### API Endpoints

Z.AI client uses the following endpoints:

- `POST /v1/classify` - Emergency classification
- `POST /v1/recommend` - Get recommendations
- `POST /v1/contacts` - Get emergency contacts
- `GET /v1/health` - Health check

### Request Format

```typescript
{
  model: string,
  prompt: string,
  temperature: number,
  max_tokens: number
}
```

### Response Format

```typescript
{
  classification: 'medical' | 'crisis' | 'stray' | 'normal',
  confidence: number,
  reasoning: string
}
```

### Error Handling

Z.AI errors are wrapped in [`AI_SERVICE_ERROR`](src/lib/errors.ts:60) with detailed error messages:

```typescript
throw new AI_SERVICE_ERROR(`Z.AI request failed: ${error.message}`);
```

---

## z.ai Fallback Logic

### Configuration

z.ai is configured via environment variables:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com
```

### Client Implementation

The z.ai client ([`src/lib/openai.ts`](src/lib/openai.ts)) provides:

- **`classifyEmergencyFallback()`**: Fallback classification
- **`getEmergencyRecommendationsFallback()`**: Fallback recommendations
- **`getEmergencyContactsFallback()`**: Fallback contacts
- **`isAvailable()`**: Health check for z.ai service

### API Endpoints

z.ai client uses the Chat Completions API:

- `POST /v1/chat/completions` - Chat completions with JSON response
- `GET /v1/models` - Health check

### Request Format

```typescript
{
  model: string,
  messages: Array<{
    role: 'system' | 'user',
    content: string
  }>,
  temperature: number,
  max_tokens: number,
  response_format: { type: 'json_object' }
}
```

### Response Format

```typescript
{
  choices: Array<{
    message: {
      content: string
    }
  }>
}
```

### Error Handling

z.ai errors are wrapped in [`AI_SERVICE_ERROR`](src/lib/errors.ts:60) with detailed error messages:

```typescript
throw new AI_SERVICE_ERROR(`z.ai request failed: ${error.message}`);
```

---

## Cascade Logic

### Overview

The cascade manager ([`src/lib/emergency-cascade.ts`](src/lib/emergency-cascade.ts)) implements automatic fallback between Z.AI and z.ai:

1. **Primary Provider**: Z.AI is tried first
2. **Fallback Provider**: z.ai is used if Z.AI fails
3. **Configuration**: Cascade can be enabled/disabled via `EMERGENCY_CASCADE_ENABLED`
4. **Logging**: All operations are logged with timestamps and durations

### Cascade Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cascade Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                           │
│  Start Request                                            │
│       │                                                    │
│       ▼                                                    │
│  ┌─────────────────┐                                       │
│  │ Is Cascade     │                                       │
│  │ Enabled?       │                                       │
│  └────┬────────────┘                                       │
│       │                                                    │
│   ┌───┴────┐                                           │
│   │ Yes       │ No                                       │
│   ▼           ▼                                           │
│ ┌─────────┐  ┌─────────┐                                 │
│ │ Try Z.AI │  │ Try Z.AI │                                 │
│ │ First    │  │ Only     │                                 │
│ └────┬────┘  └────┬────┘                                 │
│      │            │                                        │
│   ┌──┴────┐      │                                        │
│   │ Success? │      │                                        │
│   └───┬────┘      │                                        │
│       │            │                                        │
│   ┌───┴────┐      │                                        │
│   │ Yes      │ No   │                                        │
│   ▼         ▼      │                                        │
│ Return     ┌─────────┐                                      │
│ Result     │ Try     │                                      │
│            │ z.ai   │                                      │
│            │ Fallback  │                                      │
│            └────┬────┘                                      │
│                 │                                           │
│            ┌────┴────┐                                     │
│            │ Success?  │                                     │
│            └────┬────┘                                     │
│                 │                                           │
│            ┌────┴────┐                                     │
│            │ Yes      │ No                                   │
│            ▼         ▼                                     │
│        Return     Throw Error                               │
│        Result                                              │
│                                                           │
└───────────────────────────────────────────────────────────────────┘
```

### Cascade Metrics

The cascade manager tracks:

- **Total Requests**: Number of requests processed
- **Z.AI Success Count**: Successful Z.AI requests
- **Z.AI Failure Count**: Failed Z.AI requests
- **z.ai Success Count**: Successful z.ai requests
- **z.ai Failure Count**: Failed z.ai requests
- **Total Failure Count**: Total failed requests
- **Cascade Events**: Detailed event log (last 100 events)

### Event Log Format

```typescript
{
  timestamp: string,
  operation: string,
  provider: 'zai' | 'openai' | 'none',
  success: boolean,
  error?: string,
  duration_ms: number
}
```

### Health Status

```typescript
{
  zai_available: boolean,
  openai_available: boolean,
  cascade_enabled: boolean
}
```

---

## Emergency Classification System

### Classification Categories

| Classification | Description | Urgency | Recommended Actions |
|----------------|-------------|-----------|-------------------|
| **Medical** | Dog is injured, bleeding, or in physical distress | Critical | 1. Assess immediate danger<br>2. Apply first aid if safe<br>3. Contact veterinarian immediately<br>4. Transport to emergency vet if needed |
| **Crisis** | Dog is attacking, aggressive, or posing immediate danger | Critical | 1. Ensure personal safety<br>2. Secure the area<br>3. Contact emergency services<br>4. Do not approach aggressive dog |
| **Stray** | Dog is lost, abandoned, or wandering alone | Medium | 1. Observe from distance<br>2. Check for identification<br>3. Contact animal control<br>4. Post on lost/found platforms |
| **Normal** | Non-urgent situation requiring general advice | Low | 1. Assess situation<br>2. Provide general advice<br>3. Recommend trainer if needed<br>4. Schedule consultation |

### Confidence Scores

Confidence scores range from 0.0 to 1.0:

- **0.9 - 1.0**: High confidence - Very reliable classification
- **0.7 - 0.9**: Medium-high confidence - Generally reliable
- **0.5 - 0.7**: Medium confidence - May need verification
- **0.3 - 0.5**: Low-medium confidence - Uncertain classification
- **0.0 - 0.3**: Low confidence - Unreliable classification

### Urgency Levels

| Urgency Level | Confidence Range | Response Time |
|---------------|-------------------|---------------|
| **Critical** | 0.8 - 1.0 | Immediate (< 5 minutes) |
| **High** | 0.6 - 0.8 | Urgent (< 15 minutes) |
| **Medium** | 0.4 - 0.6 | Standard (< 1 hour) |
| **Low** | 0.0 - 0.4 | Routine (< 24 hours) |

---

## API Endpoints

### POST /api/v1/emergency/submit

Submit emergency triage with AI-powered classification.

#### Request Body

```typescript
{
  user_message: string,
  location?: {
    council_id?: string,
    locality_id?: string
  }
}
```

#### Response

```typescript
{
  success: true,
  data: {
    classification: 'medical' | 'crisis' | 'stray' | 'normal',
    confidence_score: number,
    ai_response: string,
    recommended_actions: string[],
    ai_model_used: string,
    emergency_contacts: EmergencyContact[],
    triage_id: string
  },
  meta: {
    timestamp: string,
    version: string
  }
}
```

#### Rate Limiting

- **Window**: 60 seconds
- **Max Requests**: 100 per window
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

#### Error Responses

| Status | Error Code | Description |
|---------|-------------|-------------|
| 400 | BAD_REQUEST | Invalid request body |
| 429 | RATE_LIMIT_EXCEEDED | Rate limit exceeded |
| 500 | INTERNAL_SERVER_ERROR | Server error |

### GET /api/v1/emergency/triage/:id

Get emergency triage by ID.

#### Response

```typescript
{
  success: true,
  data: {
    id: string,
    user_message: string,
    classification: string,
    confidence_score: number,
    ai_model_used: string,
    recommended_actions: string[],
    ai_response: string,
    created_at: Date
  }
}
```

### GET /api/v1/emergency/triage/user/:ip

Get emergency triages by user IP address.

#### Query Parameters

- `limit`: Number of results (default: 10)
- `offset`: Pagination offset (default: 0)

### GET /api/v1/emergency/contacts

Get emergency contacts for a council.

#### Query Parameters

- `council_id`: Council ID (required)
- `classification`: Filter by classification (optional)
- `limit`: Number of results (default: 10)
- `offset`: Pagination offset (default: 0)

---

## Testing Guidelines

### Unit Testing

Test individual components in isolation:

```typescript
// Test Z.AI client
describe('ZaiClient', () => {
  it('should classify emergency correctly', async () => {
    const client = new ZaiClient({ apiKey: 'test', model: 'zai-1', baseUrl: 'https://api.test.com' });
    const result = await client.classifyEmergency('Dog is bleeding', 'Adult', 'Aggression');
    expect(result.classification).toBe('medical');
    expect(result.confidence_score).toBeGreaterThan(0.8);
  });
});

// Test cascade manager
describe('CascadeManager', () => {
  it('should fallback to z.ai when Z.AI fails', async () => {
    const manager = new CascadeManager();
    const result = await manager.classifyEmergencyWithCascade('Test message', 'Adult', 'Aggression');
    expect(result.provider).toBe('openai');
  });
});
```

### Integration Testing

Test API endpoints with real database:

```typescript
describe('POST /api/v1/emergency/submit', () => {
  it('should submit emergency triage successfully', async () => {
    const response = await fetch('/api/v1/emergency/submit', {
      method: 'POST',
      body: JSON.stringify({
        user_message: 'My dog is bleeding',
        location: { council_id: '1' }
      })
    });
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.classification).toBe('medical');
  });
});
```

### E2E Testing

Test complete user flows:

1. **Emergency Submission Flow**
   - User submits emergency description
   - System classifies emergency
   - System provides recommendations
   - System returns relevant contacts

2. **Cascade Fallback Flow**
   - Z.AI service is unavailable
   - System falls back to z.ai
   - User receives response from z.ai

3. **Error Handling Flow**
   - Both AI providers are unavailable
   - System returns appropriate error
   - User receives clear error message

### Test Data

Use realistic test scenarios:

```typescript
const testCases = [
  {
    description: 'My dog is bleeding from a cut on its paw',
    expectedClassification: 'medical',
    expectedConfidence: 0.9
  },
  {
    description: 'A dog is attacking people in the park',
    expectedClassification: 'crisis',
    expectedConfidence: 0.95
  },
  {
    description: 'I found a stray dog wandering alone',
    expectedClassification: 'stray',
    expectedConfidence: 0.8
  },
  {
    description: 'My dog keeps jumping on visitors',
    expectedClassification: 'normal',
    expectedConfidence: 0.7
  }
];
```

---

## Error Handling Patterns

### Error Hierarchy

```
ApiError (base class)
├── BadRequestError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── ValidationError (422)
├── RateLimitError (429)
└── InternalServerError (500)
    ├── AI_SERVICE_ERROR (6000)
    ├── DatabaseError (5000)
    └── StripeError (6000)
```

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: Record<string, unknown>,
    timestamp: string
  }
}
```

### Error Codes

| Code | Status | Description |
|-------|---------|-------------|
| `BAD_REQUEST` | 400 | Invalid request |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `AI_SERVICE_ERROR` | 500 | AI service error |
| `DATABASE_ERROR` | 500 | Database error |

### Error Logging

All errors are logged with context:

```typescript
logError(error, {
  operation: 'classify_emergency',
  provider: 'zai',
  user_ip: '192.168.1.1',
  timestamp: new Date().toISOString()
});
```

---

## Security Considerations

### API Key Security

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** (every 90 days)
4. **Use separate keys** for development and production
5. **Restrict key permissions** to minimum required scope

### Input Validation

1. **Sanitize user input** to prevent injection attacks
2. **Validate request body** against schema
3. **Limit input length** to prevent DoS attacks
4. **Rate limit requests** to prevent abuse

### Data Privacy

1. **Anonymize IP addresses** in logs
2. **Encrypt sensitive data** at rest
3. **Use HTTPS** for all API calls
4. **Implement audit logging** for compliance

### Access Control

1. **Implement authentication** for admin endpoints
2. **Use role-based access control** (RBAC)
3. **Audit access** to sensitive operations
4. **Implement session timeout** for authenticated users

---

## Performance Optimizations

### Caching Strategy

1. **Cache AI responses** for similar queries
2. **Cache emergency contacts** by council
3. **Use Redis** for distributed caching
4. **Set appropriate TTL** (5-15 minutes)

```typescript
// Example caching implementation
const cacheKey = `emergency:${classification}:${councilId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await getEmergencyContacts(classification, councilId);
await redis.set(cacheKey, JSON.stringify(result), 'EX', 300); // 5 minutes
```

### Database Optimization

1. **Use indexes** on frequently queried columns
2. **Implement connection pooling** for Supabase
3. **Use prepared statements** for repeated queries
4. **Optimize query patterns** to avoid N+1 queries

```sql
-- Add indexes for performance
CREATE INDEX idx_triage_logs_classification ON triage_logs(classification);
CREATE INDEX idx_triage_logs_created_at ON triage_logs(created_at DESC);
CREATE INDEX idx_emergency_contacts_council ON emergency_contacts(council_id);
```

### Request Optimization

1. **Batch similar requests** when possible
2. **Use connection keep-alive** for HTTP requests
3. **Implement request timeout** (30 seconds)
4. **Use compression** for large payloads

```typescript
// Example request optimization
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate'
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(30000) // 30 second timeout
});
```

---

## Monitoring and Alerting

### Key Metrics

Monitor these metrics for system health:

1. **Cascade Success Rate**: Percentage of successful requests
2. **Z.AI Availability**: Uptime percentage for Z.AI
3. **z.ai Availability**: Uptime percentage for z.ai
4. **Average Response Time**: Mean response time across all requests
5. **Error Rate**: Percentage of failed requests
6. **Classification Distribution**: Breakdown by classification type

### Alert Thresholds

Set up alerts for:

| Metric | Warning | Critical |
|---------|----------|-----------|
| Cascade Success Rate | < 95% | < 90% |
| Z.AI Availability | < 99% | < 95% |
| z.ai Availability | < 99% | < 95% |
| Average Response Time | > 5s | > 10s |
| Error Rate | > 5% | > 10% |

### Logging Strategy

1. **Structured logging** with JSON format
2. **Log levels**: error, warn, info, debug
3. **Log aggregation**: Centralize logs for analysis
4. **Log retention**: Keep logs for 30 days

```typescript
// Example structured logging
logger.info({
  timestamp: new Date().toISOString(),
  level: 'info',
  operation: 'classify_emergency',
  provider: 'zai',
  duration_ms: 1234,
  success: true,
  user_ip: '192.168.1.1'
});
```

### Health Checks

Implement health check endpoints:

```typescript
// GET /api/v1/health
{
  status: 'healthy',
  timestamp: string,
  services: {
    zai: 'available' | 'unavailable',
    openai: 'available' | 'unavailable',
    database: 'connected' | 'disconnected'
  }
}
```

---

## Troubleshooting Guide

### Common Issues

#### Issue: Z.AI Returns 500 Errors

**Symptoms**: All Z.AI requests fail with 500 status

**Possible Causes**:
- Invalid API key
- Rate limit exceeded
- Service outage

**Solutions**:
1. Verify API key in environment variables
2. Check Z.AI status page for outages
3. Review rate limit usage
4. Contact Z.AI support if issue persists

#### Issue: z.ai Fallback Not Working

**Symptoms**: Z.AI fails but z.ai is not tried

**Possible Causes**:
- Cascade disabled in configuration
- z.ai API key not configured
- z.ai service unavailable

**Solutions**:
1. Check `EMERGENCY_CASCADE_ENABLED` is set to `true`
2. Verify `OPENAI_API_KEY` is configured
3. Test z.ai availability with health check
4. Review cascade logs for errors

#### Issue: Low Confidence Scores

**Symptoms**: All classifications have confidence < 0.5

**Possible Causes**:
- Insufficient context in user message
- Ambiguous situation description
- AI model not trained on domain

**Solutions**:
1. Improve prompt engineering for classification
2. Add more context fields (dog age, breed, etc.)
3. Fine-tune AI model on domain data
4. Implement confidence threshold for manual review

#### Issue: Slow Response Times

**Symptoms**: API responses take > 10 seconds

**Possible Causes**:
- Network latency
- Database query performance
- AI provider throttling

**Solutions**:
1. Check network connectivity
2. Optimize database queries with indexes
3. Implement caching for frequent queries
4. Contact AI provider about throttling

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Set log level to debug
LOG_LEVEL=debug
LOG_STRUCTURED=true
```

Debug logs include:

- Request/response payloads
- Timing information
- Error stack traces
- Cascade decision flow

### Testing Tools

Use these tools for troubleshooting:

1. **Postman**: Test API endpoints manually
2. **curl**: Quick command-line testing
3. **Supabase Dashboard**: Monitor database performance
4. **AI Provider Dashboards**: Monitor API usage and errors

```bash
# Example curl command
curl -X POST http://localhost:3000/api/v1/emergency/submit \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "My dog is bleeding",
    "location": { "council_id": "1" }
  }'
```

---

## Appendix

### File Structure

```
src/
├── lib/
│   ├── zai.ts                    # Z.AI client implementation
│   ├── openai.ts                 # z.ai client implementation
│   ├── emergency-cascade.ts        # Cascade logic manager
│   ├── emergency-triage.ts        # Triage service
│   ├── emergency-contacts.ts       # Contacts service
│   ├── errors.ts                  # Error handling
│   └── auth.ts                   # Supabase auth
├── app/
│   └── api/
│       └── v1/
│           └── emergency/
│               └── submit/
│                   └── route.ts  # Emergency submit endpoint
└── types/
    ├── database.ts                # Database types
    └── api.ts                    # API types
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|-----------|---------|-------------|
| `ZAI_API_KEY` | Yes | - | Z.AI API key |
| `ZAI_MODEL` | No | `zai-1` | Z.AI model name |
| `ZAI_BASE_URL` | No | `https://api.zai.ai` | Z.AI base URL |
| `OPENAI_API_KEY` | Yes | - | z.ai API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | z.ai model name |
| `OPENAI_BASE_URL` | No | `https://api.openai.com` | z.ai base URL |
| `EMERGENCY_CASCADE_ENABLED` | No | `true` | Enable cascade logic |

### Database Schema

#### triage_logs Table

```sql
CREATE TABLE triage_logs (
  id SERIAL PRIMARY KEY,
  owner_message TEXT NOT NULL,
  classification dog_triage_classification NOT NULL,
  confidence_score DECIMAL(3, 2),
  ai_model_used VARCHAR(50),
  recommended_actions TEXT[],
  action_taken VARCHAR(100),
  action_timestamp TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT confidence_valid CHECK (confidence_score >= 0 AND confidence_score <= 1)
);
```

#### emergency_contacts Table

```sql
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,
  resource_type dog_business_resource_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  locality_id INT,
  council_id INT,
  phone VARCHAR(20) NOT NULL,
  emergency_hours VARCHAR(100),
  availability_status VARCHAR(50) DEFAULT 'active',
  last_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (locality_id) REFERENCES localities(id) ON DELETE SET NULL,
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE SET NULL,
  
  CONSTRAINT resource_type_emergency CHECK (resource_type IN ('emergency_vet', 'urgent_care', 'emergency_shelter'))
);
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-25  
**Maintained By**: KiloCode
