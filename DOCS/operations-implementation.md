# DTD Phase 5: Operations - Implementation Documentation

## Overview

This document describes the implementation of the Operations phase for the Dog Trainers Directory (DTD) project. The Operations phase provides admin dashboard, operator workflow, and health monitoring capabilities.

## Table of Contents

1. [Admin Dashboard](#admin-dashboard)
2. [Operator Workflow](#operator-workflow)
3. [Health Monitoring](#health-monitoring)
4. [API Endpoints](#api-endpoints)
5. [Environment Variables](#environment-variables)
6. [Testing Guidelines](#testing-guidelines)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Security Considerations](#security-considerations)
9. [Performance Optimizations](#performance-optimizations)
10. [Monitoring and Alerting Recommendations](#monitoring-and-alerting-recommendations)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## Admin Dashboard

### Overview

The admin dashboard provides comprehensive statistics and monitoring capabilities for administrators to oversee the entire platform.

### Service: [`AdminDashboardService`](../src/lib/admin-dashboard.ts)

#### Key Methods

| Method | Description | Returns |
|----------|-------------|----------|
| `getDashboardOverview()` | Get complete dashboard overview with all statistics | [`DashboardOverview`](#dashboard-overview) |
| `getTrainerStats()` | Get trainer statistics | [`TrainerStats`](#trainer-stats) |
| `getReviewStats()` | Get review statistics | [`ReviewStats`](#review-stats) |
| `getPaymentStats()` | Get payment statistics | [`PaymentStats`](#payment-stats) |
| `getEmergencyStats()` | Get emergency triage statistics | [`EmergencyStats`](#emergency-stats) |
| `getFeaturedStats()` | Get featured placement statistics | [`FeaturedStats`](#featured-stats) |
| `getRecentActivity(limit)` | Get recent activity log | [`ActivityLog[]`](#activity-log) |
| `getPendingActions()` | Get pending actions requiring attention | [`PendingAction[]`](#pending-action) |

#### Dashboard Overview

```typescript
interface DashboardOverview {
  total_trainers: number;
  verified_trainers: number;
  pending_trainers: number;
  total_reviews: number;
  pending_reviews: number;
  total_featured: number;
  active_featured: number;
  queued_featured: number;
  total_emergency_triage: number;
  medical_triage: number;
  crisis_triage: number;
  total_payments: number;
  total_revenue: number;
  recent_activity: ActivityLog[];
  pending_actions: PendingAction[];
}
```

#### Trainer Statistics

```typescript
interface TrainerStats {
  total: number;
  verified: number;
  unverified: number;
  claimed: number;
  unclaimed: number;
  by_council: CouncilStats[];
  by_resource_type: ResourceTypeStats[];
  by_data_source: DataSourceStats[];
  new_this_week: number;
  new_this_month: number;
}
```

#### Review Statistics

```typescript
interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  average_rating: number;
  by_rating: RatingStats[];
  by_council: CouncilStats[];
  new_this_week: number;
  new_this_month: number;
}
```

#### Payment Statistics

```typescript
interface PaymentStats {
  total_payments: number;
  total_revenue: number;
  revenue_this_week: number;
  revenue_this_month: number;
  average_transaction: number;
  by_council: CouncilStats[];
  successful_payments: number;
  failed_payments: number;
  refund_count: number;
  refund_amount: number;
}
```

#### Emergency Statistics

```typescript
interface EmergencyStats {
  total_triage: number;
  medical: number;
  crisis: number;
  stray: number;
  normal: number;
  average_confidence: number;
  by_council: CouncilStats[];
  new_this_week: number;
  new_this_month: number;
  ai_response_rate: number;
}
```

#### Featured Statistics

```typescript
interface FeaturedStats {
  total: number;
  active: number;
  queued: number;
  expired: number;
  refunded: number;
  cancelled: number;
  by_council: CouncilStats[];
  queue_length: number;
  average_queue_time: number;
  revenue_this_month: number;
}
```

#### Activity Log

```typescript
interface ActivityLog {
  id: string;
  type: 'trainer' | 'review' | 'payment' | 'triage' | 'featured';
  action: string;
  description: string;
  entity_id: string;
  entity_name: string;
  user_id: string | null;
  created_at: Date;
}
```

#### Pending Actions

```typescript
interface PendingAction {
  id: string;
  type: 'review' | 'trainer' | 'featured_queue';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  entity_id: string;
  entity_name: string;
  created_at: Date;
  due_date?: Date;
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|----------|-------------|
| `/api/v1/admin/dashboard/overview` | GET | Get dashboard overview |
| `/api/v1/admin/dashboard/stats` | GET | Get dashboard statistics (by type) |
| `/api/v1/admin/dashboard/activity` | GET | Get recent activity |
| `/api/v1/admin/dashboard/pending` | GET | Get pending actions |

---

## Operator Workflow

### Overview

The operator workflow service manages tasks for operators, including task assignment, completion, escalation, and history tracking.

### Service: [`OperatorWorkflowService`](../src/lib/operator-workflow.ts)

#### Key Methods

| Method | Description | Returns |
|----------|-------------|----------|
| `getOperatorTasks(filter?)` | Get operator tasks with optional filters | [`OperatorTask[]`](#operator-task) |
| `getTaskById(taskId)` | Get specific task by ID | [`OperatorTask`](#operator-task) |
| `createTask(data)` | Create new operator task | [`OperatorTask`](#operator-task) |
| `assignTask(taskId, operatorId)` | Assign task to operator | [`OperatorTask`](#operator-task) |
| `completeTask(taskId, notes)` | Complete task with notes | [`OperatorTask`](#operator-task) |
| `escalateTask(taskId, reason)` | Escalate task with reason | [`OperatorTask`](#operator-task) |
| `updateTask(taskId, data)` | Update task details | [`OperatorTask`](#operator-task) |
| `deleteTask(taskId)` | Delete task | `void` |
| `getTaskHistory(taskId)` | Get task history | [`TaskHistory[]`](#task-history) |

#### Operator Task

```typescript
interface OperatorTask {
  id: string;
  type: OperatorTaskType;
  priority: OperatorTaskPriority;
  status: OperatorTaskStatus;
  title: string;
  description: string;
  entity_type: string;
  entity_id: string;
  assigned_to: string | null;
  assigned_at: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  escalated_at: Date | null;
  escalation_reason: string | null;
  notes: string | null;
  completion_notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  due_date: Date | null;
}

type OperatorTaskType =
  | 'review_moderation'
  | 'trainer_verification'
  | 'featured_queue'
  | 'emergency_triage'
  | 'payment_dispute'
  | 'user_inquiry'
  | 'system_alert';

type OperatorTaskPriority = 'critical' | 'high' | 'medium' | 'low';

type OperatorTaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'escalated' | 'cancelled';
```

#### Task History

```typescript
interface TaskHistory {
  id: string;
  task_id: string;
  action: string;
  previous_status: OperatorTaskStatus | null;
  new_status: OperatorTaskStatus | null;
  notes: string | null;
  user_id: string;
  created_at: Date;
}
```

#### Task Filter

```typescript
interface TaskFilter {
  status?: OperatorTaskStatus;
  type?: OperatorTaskType;
  priority?: OperatorTaskPriority;
  assigned_to?: string | null;
  created_by?: string | null;
  entity_type?: string;
  entity_id?: string;
  date_from?: Date;
  date_to?: Date;
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|----------|-------------|
| `/api/v1/admin/operator/tasks` | GET | Get operator tasks |
| `/api/v1/admin/operator/tasks` | POST | Create new task |
| `/api/v1/admin/operator/tasks/[id]/assign` | POST | Assign task to operator |
| `/api/v1/admin/operator/tasks/[id]/complete` | POST | Complete task |
| `/api/v1/admin/operator/tasks/[id]/escalate` | POST | Escalate task |
| `/api/v1/admin/operator/tasks/[id]/history` | GET | Get task history |

---

## Health Monitoring

### Overview

The health monitoring service provides comprehensive system health checks, metrics tracking, and alerting capabilities.

### Service: [`HealthMonitoringService`](../src/lib/health-monitoring.ts)

#### Key Methods

| Method | Description | Returns |
|----------|-------------|----------|
| `getSystemHealth()` | Get overall system health | [`SystemHealth`](#system-health) |
| `getServiceHealth(service)` | Get specific service health | [`HealthCheckResult`](#health-check-result) |
| `getHealthHistory(service?, hours?)` | Get health history | [`HealthHistory[]`](#health-history) |
| `checkDatabaseHealth()` | Check database health | [`HealthCheckResult`](#health-check-result) |
| `checkStripeHealth()` | Check Stripe health | [`HealthCheckResult`](#health-check-result) |
| `checkZaiHealth()` | Check Z.AI health | [`HealthCheckResult`](#health-check-result) |
| `checkOpenaiHealth()` | Check z.ai health | [`HealthCheckResult`](#health-check-result) |
| `checkSupabaseHealth()` | Check Supabase health | [`HealthCheckResult`](#health-check-result) |
| `getHealthMetrics(service, hours?)` | Get health metrics | [`HealthMetrics`](#health-metrics) |
| `createHealthAlert(data)` | Create health alert | [`HealthAlert`](#health-alert) |
| `getHealthAlerts(status?, service?)` | Get health alerts | [`HealthAlert[]`](#health-alert) |
| `resolveHealthAlert(alertId, resolvedBy, resolutionNotes)` | Resolve health alert | [`HealthAlert`](#health-alert) |

#### System Health

```typescript
interface SystemHealth {
  overall_status: HealthStatus;
  services: HealthCheckResult[];
  uptime_percentage: number;
  last_checked: Date;
  active_alerts: number;
}

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
```

#### Health Check Result

```typescript
interface HealthCheckResult {
  service: ServiceName;
  status: HealthStatus;
  latency_ms: number;
  message: string;
  last_checked: Date;
  details?: Record<string, unknown>;
}

type ServiceName = 'database' | 'stripe' | 'zai' | 'openai' | 'supabase' | 'api';
```

#### Health Metrics

```typescript
interface HealthMetrics {
  service: ServiceName;
  uptime_percentage: number;
  average_latency_ms: number;
  success_rate: number;
  total_checks: number;
  failed_checks: number;
  last_failure: Date | null;
  last_success: Date | null;
  period_start: Date;
  period_end: Date;
}
```

#### Health Alert

```typescript
interface HealthAlert {
  id: string;
  service: ServiceName;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'resolved';
  title: string;
  message: string;
  details?: Record<string, unknown>;
  triggered_at: Date;
  resolved_at: Date | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: Date;
  updated_at: Date;
}
```

#### Health History

```typescript
interface HealthHistory {
  id: string;
  service: ServiceName;
  status: HealthStatus;
  latency_ms: number;
  message: string;
  details?: Record<string, unknown>;
  checked_at: Date;
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|----------|-------------|
| `/api/v1/admin/health` | GET | Get system health |
| `/api/v1/admin/health/services` | GET | Get service health (all or specific) |
| `/api/v1/admin/health/history` | GET | Get health history |
| `/api/v1/admin/health/alerts` | GET | Get health alerts |
| `/api/v1/admin/health/alerts` | POST | Create health alert |
| `/api/v1/admin/health/alerts/[id]/resolve` | POST | Resolve health alert |

---

## API Endpoints

### Admin Dashboard Endpoints

#### GET /api/v1/admin/dashboard/overview

Get complete dashboard overview with all statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_trainers": 150,
    "verified_trainers": 120,
    "pending_trainers": 30,
    "total_reviews": 500,
    "pending_reviews": 25,
    "total_featured": 50,
    "active_featured": 10,
    "queued_featured": 5,
    "total_emergency_triage": 200,
    "medical_triage": 50,
    "crisis_triage": 30,
    "total_payments": 100,
    "total_revenue": 10000,
    "recent_activity": [...],
    "pending_actions": [...]
  },
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

#### GET /api/v1/admin/dashboard/stats

Get dashboard statistics by type.

**Query Parameters:**
- `type` (optional): `trainers` | `reviews` | `payments` | `emergency` | `featured`

**Response:**
```json
{
  "success": true,
  "data": {
    "trainers": { ... },
    "reviews": { ... },
    "payments": { ... },
    "emergency": { ... },
    "featured": { ... }
  },
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

#### GET /api/v1/admin/dashboard/activity

Get recent activity log.

**Query Parameters:**
- `limit` (optional): Number of activity entries (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "review",
      "action": "New review submitted",
      "description": "A new review has been submitted",
      "entity_id": "uuid",
      "entity_name": "Review uuid",
      "user_id": null,
      "created_at": "2025-12-25T09:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0",
    "count": 10
  }
}
```

#### GET /api/v1/admin/dashboard/pending

Get pending actions requiring attention.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "review",
      "priority": "high",
      "title": "Review pending moderation",
      "description": "Review for Business Name",
      "entity_id": "uuid",
      "entity_name": "Business Name",
      "created_at": "2025-12-25T09:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0",
    "count": 20
  }
}
```

### Operator Workflow Endpoints

#### GET /api/v1/admin/operator/tasks

Get operator tasks with optional filters.

**Query Parameters:**
- `status` (optional): `pending` | `assigned` | `in_progress` | `completed` | `escalated` | `cancelled`
- `type` (optional): `review_moderation` | `trainer_verification` | `featured_queue` | `emergency_triage` | `payment_dispute` | `user_inquiry` | `system_alert`
- `priority` (optional): `critical` | `high` | `medium` | `low`
- `assigned_to` (optional): Operator ID
- `created_by` (optional): User ID
- `entity_type` (optional): Entity type
- `entity_id` (optional): Entity ID
- `date_from` (optional): ISO date string
- `date_to` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "review_moderation",
      "priority": "high",
      "status": "pending",
      "title": "Review pending moderation",
      "description": "Review for Business Name",
      "entity_type": "review",
      "entity_id": "uuid",
      "assigned_to": null,
      "assigned_at": null,
      "started_at": null,
      "completed_at": null,
      "escalated_at": null,
      "escalation_reason": null,
      "notes": null,
      "completion_notes": null,
      "created_by": "uuid",
      "created_at": "2025-12-25T09:00:00.000Z",
      "updated_at": "2025-12-25T09:00:00.000Z",
      "due_date": null
    }
  ],
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0",
    "count": 50
  }
}
```

#### POST /api/v1/admin/operator/tasks

Create new operator task.

**Request Body:**
```json
{
  "type": "review_moderation",
  "priority": "high",
  "title": "Review pending moderation",
  "description": "Review for Business Name",
  "entity_type": "review",
  "entity_id": "uuid",
  "due_date": "2025-12-26T09:00:00.000Z",
  "created_by": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "review_moderation",
    "priority": "high",
    "status": "pending",
    "title": "Review pending moderation",
    "description": "Review for Business Name",
    "entity_type": "review",
    "entity_id": "uuid",
    "assigned_to": null,
    "assigned_at": null,
    "started_at": null,
    "completed_at": null,
    "escalated_at": null,
    "escalation_reason": null,
    "notes": null,
    "completion_notes": null,
    "created_by": "uuid",
    "created_at": "2025-12-25T09:00:00.000Z",
    "updated_at": "2025-12-25T09:00:00.000Z",
    "due_date": "2025-12-26T09:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

#### POST /api/v1/admin/operator/tasks/[id]/assign

Assign task to operator.

**Request Body:**
```json
{
  "operator_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "review_moderation",
    "priority": "high",
    "status": "assigned",
    "title": "Review pending moderation",
    "description": "Review for Business Name",
    "entity_type": "review",
    "entity_id": "uuid",
    "assigned_to": "uuid",
    "assigned_at": "2025-12-25T09:00:00.000Z",
    "started_at": null,
    "completed_at": null,
    "escalated_at": null,
    "escalation_reason": null,
    "notes": null,
    "completion_notes": null,
    "created_by": "uuid",
    "created_at": "2025-12-25T09:00:00.000Z",
    "updated_at": "2025-12-25T09:00:00.000Z",
    "due_date": "2025-12-26T09:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

#### POST /api/v1/admin/operator/tasks/[id]/complete

Complete task with notes.

**Request Body:**
```json
{
  "notes": "Review approved - meets guidelines"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "review_moderation",
    "priority": "high",
    "status": "completed",
    "title": "Review pending moderation",
    "description": "Review for Business Name",
    "entity_type": "review",
    "entity_id": "uuid",
    "assigned_to": "uuid",
    "assigned_at": "2025-12-25T09:00:00.000Z",
    "started_at": "2025-12-25T09:00:00.000Z",
    "completed_at": "2025-12-25T09:00:00.000Z",
    "escalated_at": null,
    "escalation_reason": null,
    "notes": null,
    "completion_notes": "Review approved - meets guidelines",
    "created_by": "uuid",
    "created_at": "2025-12-25T09:00:00.000Z",
    "updated_at": "2025-12-25T09:00:00.000Z",
    "due_date": "2025-12-26T09:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

#### POST /api/v1/admin/operator/tasks/[id]/escalate

Escalate task with reason.

**Request Body:**
```json
{
  "reason": "Requires additional review"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "review_moderation",
    "priority": "high",
    "status": "escalated",
    "title": "Review pending moderation",
    "description": "Review for Business Name",
    "entity_type": "review",
    "entity_id": "uuid",
    "assigned_to": "uuid",
    "assigned_at": "2025-12-25T09:00:00.000Z",
    "started_at": null,
    "completed_at": null,
    "escalated_at": "2025-12-25T09:00:00.000Z",
    "escalation_reason": "Requires additional review",
    "notes": null,
    "completion_notes": null,
    "created_by": "uuid",
    "created_at": "2025-12-25T09:00:00.000Z",
    "updated_at": "2025-12-25T09:00:00.000Z",
    "due_date": "2025-12-26T09:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

#### GET /api/v1/admin/operator/tasks/[id]/history

Get task history.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "task_id": "uuid",
      "action": "created",
      "previous_status": null,
      "new_status": "pending",
      "notes": "Task created",
      "user_id": "uuid",
      "created_at": "2025-12-25T09:00:00.000Z"
    },
    {
      "id": "uuid",
      "task_id": "uuid",
      "action": "assigned",
      "previous_status": "pending",
      "new_status": "assigned",
      "notes": "Task assigned to operator",
      "user_id": "uuid",
      "created_at": "2025-12-25T09:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0",
    "count": 2
  }
}
```

### Health Monitoring Endpoints

#### GET /api/v1/admin/health

Get overall system health.

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_status": "healthy",
    "services": [
      {
        "service": "database",
        "status": "healthy",
        "latency_ms": 45,
        "message": "Database connection successful",
        "last_checked": "2025-12-25T09:00:00.000Z"
      },
      {
        "service": "stripe",
        "status": "healthy",
        "latency_ms": 120,
        "message": "Stripe API connection successful",
        "last_checked": "2025-12-25T09:00:00.000Z"
      },
      {
        "service": "zai",
        "status": "healthy",
        "latency_ms": 250,
        "message": "Z.AI API connection successful",
        "last_checked": "2025-12-25T09:00:00.000Z"
      },
      {
        "service": "openai",
        "status": "healthy",
        "latency_ms": 300,
        "message": "z.ai API connection successful",
        "last_checked": "2025-12-25T09:00:00.000Z"
      },
      {
        "service": "supabase",
        "status": "healthy",
        "latency_ms": 50,
        "message": "Supabase connection successful",
        "last_checked": "2025-12-25T09:00:00.000Z"
      }
    ],
    "uptime_percentage": 99.5,
    "last_checked": "2025-12-25T09:00:00.000Z",
    "active_alerts": 0
  },
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

#### GET /api/v1/admin/health/services

Get service health (all or specific).

**Query Parameters:**
- `service` (optional): `database` | `stripe` | `zai` | `openai` | `supabase` | `api`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "service": "database",
      "status": "healthy",
      "latency_ms": 45,
      "message": "Database connection successful",
      "last_checked": "2025-12-25T09:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0",
    "count": 1
  }
}
```

#### GET /api/v1/admin/health/history

Get health history.

**Query Parameters:**
- `service` (optional): Service name
- `hours` (optional): Hours of history (default: 24, max: 168)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "service": "database",
      "status": "healthy",
      "latency_ms": 45,
      "message": "Database connection successful",
      "checked_at": "2025-12-25T09:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0",
    "count": 1440,
    "hours": 24
  }
}
```

#### GET /api/v1/admin/health/alerts

Get health alerts.

**Query Parameters:**
- `status` (optional): `active` | `resolved` | `all`
- `service` (optional): Service name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "service": "database",
      "severity": "critical",
      "status": "active",
      "title": "DATABASE Service Unhealthy",
      "message": "Database connection failed: Connection timeout",
      "details": {
        "error": "Connection timeout after 30s"
      },
      "triggered_at": "2025-12-25T09:00:00.000Z",
      "resolved_at": null,
      "resolved_by": null,
      "resolution_notes": null,
      "created_at": "2025-12-25T09:00:00.000Z",
      "updated_at": "2025-12-25T09:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0",
    "count": 1
  }
}
```

#### POST /api/v1/admin/health/alerts

Create health alert.

**Request Body:**
```json
{
  "service": "database",
  "severity": "critical",
  "title": "DATABASE Service Unhealthy",
  "message": "Database connection failed: Connection timeout",
  "details": {
    "error": "Connection timeout after 30s"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "service": "database",
    "severity": "critical",
    "status": "active",
    "title": "DATABASE Service Unhealthy",
    "message": "Database connection failed: Connection timeout",
    "details": {
      "error": "Connection timeout after 30s"
    },
    "triggered_at": "2025-12-25T09:00:00.000Z",
    "resolved_at": null,
    "resolved_by": null,
    "resolution_notes": null,
    "created_at": "2025-12-25T09:00:00.000Z",
    "updated_at": "2025-12-25T09:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

#### POST /api/v1/admin/health/alerts/[id]/resolve

Resolve health alert.

**Request Body:**
```json
{
  "resolved_by": "uuid",
  "resolution_notes": "Database connection restored - issue resolved"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "service": "database",
    "severity": "critical",
    "status": "resolved",
    "title": "DATABASE Service Unhealthy",
    "message": "Database connection failed: Connection timeout",
    "details": {
      "error": "Connection timeout after 30s"
    },
    "triggered_at": "2025-12-25T09:00:00.000Z",
    "resolved_at": "2025-12-25T09:00:00.000Z",
    "resolved_by": "uuid",
    "resolution_notes": "Database connection restored - issue resolved",
    "created_at": "2025-12-25T09:00:00.000Z",
    "updated_at": "2025-12-25T09:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-12-25T09:00:00.000Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

---

## Environment Variables

### Health Monitoring Configuration

| Variable | Description | Default |
|----------|-------------|----------|
| `HEALTH_CHECK_INTERVAL` | Health check interval in seconds | 60 |
| `HEALTH_ALERT_THRESHOLD` | Number of consecutive failures before creating alert | 3 |

### Operator Workflow Configuration

| Variable | Description | Default |
|----------|-------------|----------|
| `OPERATOR_EMAIL_NOTIFICATIONS` | Enable operator email notifications | true |
| `ADMIN_EMAIL_NOTIFICATIONS` | Enable admin email notifications | true |

### Example Configuration

```bash
# Health check interval in seconds
HEALTH_CHECK_INTERVAL=60

# Health alert threshold
HEALTH_ALERT_THRESHOLD=3

# Enable operator email notifications
OPERATOR_EMAIL_NOTIFICATIONS=true

# Enable admin email notifications
ADMIN_EMAIL_NOTIFICATIONS=true
```

---

## Testing Guidelines

### Unit Testing

Write unit tests for pure functions in services:

```typescript
// Example test for AdminDashboardService
describe('AdminDashboardService', () => {
  it('should calculate council stats correctly', () => {
    const service = new AdminDashboardService();
    const trainers = [
      { council_id: 'council-1', ... },
      { council_id: 'council-1', ... },
      { council_id: 'council-2', ... },
    ];
    const councilMap = new Map([
      ['council-1', 'Council 1'],
      ['council-2', 'Council 2'],
    ]);
    const stats = service['calculateCouncilStats'](trainers, councilMap);
    
    expect(stats).toHaveLength(2);
    expect(stats[0].count).toBe(2);
    expect(stats[0].percentage).toBe(67);
  });
});
```

### Integration Testing

Test API endpoints with actual database:

```typescript
// Example integration test
describe('GET /api/v1/admin/dashboard/overview', () => {
  it('should return dashboard overview', async () => {
    const response = await fetch('/api/v1/admin/dashboard/overview', {
      headers: {
        'Authorization': 'Bearer test-token',
      },
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('total_trainers');
  });
});
```

### E2E Testing

Test critical user flows:

1. Admin views dashboard overview
2. Operator creates and completes task
3. Health check detects and alerts on service failure
4. Admin resolves health alert

---

## Error Handling Patterns

### Service Layer Errors

All services use consistent error handling:

```typescript
try {
  // Service logic
} catch (error) {
  logError(error, { method: 'methodName' });
  throw handleSupabaseError(error);
}
```

### API Layer Errors

All API endpoints use consistent error responses:

```typescript
if (error instanceof UnauthorizedError) {
  return NextResponse.json(formatErrorResponse(error), { status: 401 });
}

if (error instanceof BadRequestError) {
  return NextResponse.json(formatErrorResponse(error), { status: 400 });
}

if (error instanceof NotFoundError) {
  return NextResponse.json(formatErrorResponse(error), { status: 404 });
}

return NextResponse.json(formatErrorResponse(error), { status: 500 });
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    },
    "timestamp": "2025-12-25T09:00:00.000Z"
  }
}
```

---

## Security Considerations

### Authentication

All admin endpoints require JWT authentication:

```typescript
const authHeader = request.headers.get('authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  throw new UnauthorizedError('Missing or invalid authorization header');
}

const token = authHeader.substring(7);
// TODO: Verify JWT token and extract user role
```

### Authorization

Verify user has admin role before allowing access:

```typescript
// TODO: Verify JWT token and extract user role
const userRole = verifyToken(token);
if (userRole !== 'admin') {
  throw new ForbiddenError('Admin access required');
}
```

### Input Validation

Validate all inputs at API boundaries:

```typescript
// Validate required fields
if (!body.type || !body.priority || !body.title) {
  throw new BadRequestError('Missing required fields');
}

// Validate data types
if (isNaN(limit) || limit < 1 || limit > 100) {
  throw new BadRequestError('Limit must be between 1 and 100');
}
```

### SQL Injection Prevention

Use parameterized queries with Supabase client:

```typescript
// Safe query with parameterized input
const { data, error } = await this.supabase
  .from('business')
  .select('*')
  .eq('id', businessId); // Parameterized, not string interpolation
```

### Rate Limiting

Implement rate limiting for API endpoints:

```typescript
// TODO: Implement rate limiting
const rateLimit = await checkRateLimit(userId);
if (rateLimit.exceeded) {
  throw new RateLimitError('Rate limit exceeded', rateLimit.retryAfter);
}
```

---

## Performance Optimizations

### Database Query Optimization

Use efficient queries with proper indexing:

```typescript
// Use specific fields instead of *
const { data } = await this.supabase
  .from('business')
  .select('id, name, verified, claimed') // Only select needed fields
  .eq('deleted_at', null);
```

### Caching Strategy

Implement caching for frequently accessed data:

```typescript
// TODO: Implement caching
const cacheKey = `dashboard:overview:${userId}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return cached;
}

const overview = await this.getDashboardOverview();
await cache.set(cacheKey, overview, { ttl: 60 }); // Cache for 60 seconds
```

### Pagination

Use pagination for large datasets:

```typescript
const { data } = await this.supabase
  .from('business')
  .select('*')
  .range(0, 49) // First 50 records
  .order('created_at', { ascending: false });
```

### Batch Operations

Use batch operations when possible:

```typescript
// Batch insert multiple tasks
const tasks = await Promise.all([
  this.createTask(task1),
  this.createTask(task2),
  this.createTask(task3),
]);
```

---

## Monitoring and Alerting Recommendations

### Health Check Frequency

Run health checks at regular intervals:

- Database: Every 60 seconds
- Stripe: Every 60 seconds
- Z.AI: Every 60 seconds
- z.ai: Every 60 seconds
- Supabase: Every 60 seconds

### Alert Thresholds

Create alerts after consecutive failures:

- Default threshold: 3 consecutive failures
- Critical alerts: 5 consecutive failures
- Warning alerts: 3 consecutive failures

### Metrics to Monitor

Key metrics to track:

1. **Uptime Percentage**: Target > 99.5%
2. **Average Latency**: Target < 500ms for database, < 2000ms for AI services
3. **Success Rate**: Target > 99%
4. **Error Rate**: Target < 1%

### Alert Channels

Configure multiple alert channels:

1. **Email**: Send alerts to admin email
2. **Slack**: Post alerts to Slack channel
3. **PagerDuty**: Create incidents for critical alerts
4. **Dashboard**: Display alerts in admin dashboard

---

## Troubleshooting Guide

### Common Issues

#### Dashboard Overview Not Loading

**Symptoms:**
- Dashboard overview returns empty data
- Statistics show zeros

**Solutions:**
1. Check database connection
2. Verify data exists in tables
3. Check service role key permissions
4. Review logs for errors

#### Health Checks Failing

**Symptoms:**
- All health checks showing unhealthy
- High latency on all services
- Connection timeouts

**Solutions:**
1. Check network connectivity
2. Verify API keys are valid
3. Check service status pages:
   - Supabase: https://status.supabase.com
   - Stripe: https://status.stripe.com
   - Z.AI: Check with provider
   - z.ai: https://status.openai.com
4. Review recent changes to configuration

#### Operator Tasks Not Creating

**Symptoms:**
- Task creation fails with database error
- Task not appearing in list after creation

**Solutions:**
1. Check operator_tasks table exists
2. Verify operator_tasks_history table exists
3. Check database permissions
4. Review logs for specific error messages

#### Health Alerts Not Creating

**Symptoms:**
- Service failures not creating alerts
- Alerts not appearing in list

**Solutions:**
1. Check health_alerts table exists
2. Verify alert threshold configuration
3. Check alert deduplication logic
4. Review logs for alert creation errors

### Debugging

Enable debug logging for troubleshooting:

```bash
# Set log level to debug
LOG_LEVEL=debug
```

Check logs for detailed error information:

```typescript
// Logs include context
console.error('[ERROR]', {
  timestamp: new Date().toISOString(),
  method: 'methodName',
  error: error.message,
  stack: error.stack,
  context: { additionalContext },
});
```

### Performance Issues

#### Slow Dashboard Loading

**Symptoms:**
- Dashboard overview takes > 5 seconds to load
- Statistics queries are slow

**Solutions:**
1. Add database indexes on frequently queried columns
2. Implement caching for statistics
3. Use pagination for large datasets
4. Optimize complex aggregations

#### High Memory Usage

**Symptoms:**
- Node.js process using excessive memory
- Frequent garbage collection pauses

**Solutions:**
1. Implement streaming for large datasets
2. Use pagination instead of loading all data
3. Optimize data structures
4. Implement connection pooling

---

## Database Schema Requirements

### Operator Tasks Table

```sql
CREATE TABLE operator_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_reason TEXT,
  notes TEXT,
  completion_notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_operator_tasks_status ON operator_tasks(status);
CREATE INDEX idx_operator_tasks_assigned_to ON operator_tasks(assigned_to);
CREATE INDEX idx_operator_tasks_created_at ON operator_tasks(created_at);
```

### Operator Task History Table

```sql
CREATE TABLE operator_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES operator_tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_operator_task_history_task_id ON operator_task_history(task_id);
CREATE INDEX idx_operator_task_history_created_at ON operator_task_history(created_at);
```

### Health History Table

```sql
CREATE TABLE health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_history_service ON health_history(service);
CREATE INDEX idx_health_history_checked_at ON health_history(checked_at);
```

### Health Alerts Table

```sql
CREATE TABLE health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_alerts_status ON health_alerts(status);
CREATE INDEX idx_health_alerts_service ON health_alerts(service);
CREATE INDEX idx_health_alerts_triggered_at ON health_alerts(triggered_at);
```

---

## Next Steps

1. **Database Migration**: Create required database tables for operator tasks and health monitoring
2. **Authentication**: Implement JWT token verification for admin endpoints
3. **Email Notifications**: Implement email sending for operator and admin notifications
4. **Caching**: Implement caching layer for dashboard statistics
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Testing**: Write comprehensive unit and integration tests
7. **Monitoring**: Set up external monitoring (e.g., Sentry, DataDog)
8. **Documentation**: Create user-facing documentation for admin dashboard

---

## References

- [Database Schema](./database-schema-implementation.md)
- [API Contract](./api-contract-implementation.md)
- [Monetisation Implementation](./monetisation-implementation.md)
- [Emergency Triage Implementation](./emergency-triage-implementation.md)
- [Error Handling](../src/lib/errors.ts)
- [Database Types](../src/types/database.ts)
- [API Types](../src/types/api.ts)
