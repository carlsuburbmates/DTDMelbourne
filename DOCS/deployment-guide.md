# Deployment Guide

**Project:** Dog Trainers Directory  
**Version:** 1.0.0  
**Date:** 2025-12-25  
**Purpose:** Comprehensive deployment procedures for production environment

---

## Overview

This guide provides step-by-step instructions for deploying the Dog Trainers Directory application to production. It covers environment setup, database migrations, configuration, deployment procedures, rollback strategies, and monitoring setup.

### Deployment Architecture

```mermaid
flowchart TD
    A[Development] --> B[Staging]
    B --> C[Production]
    C --> D[Monitoring]
    C --> E[Alerting]
    D --> F[Incident Response]
    E --> G[Rollback if needed]
```

---

## Pre-Deployment Checklist

### Code Quality Verification

- [ ] All TypeScript compilation successful
- [ ] No console errors or warnings in development
- [ ] Code review completed for all components
- [ ] Design system compliance verified
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Cross-browser testing completed
- [ ] Responsive design verified across breakpoints

### Testing Verification

- [ ] Unit tests passing for all components
- [ ] Integration tests passing for API endpoints
- [ ] E2E tests passing for critical user flows
- [ ] Accessibility tests passed
- [ ] Performance benchmarks met
- [ ] Security audit completed

### Documentation Verification

- [ ] All verification documentation complete
- [ ] Deployment guide reviewed
- [ ] Testing strategy documented
- [ ] API integration guide created
- [ ] Known limitations documented
- [ ] Rollback procedures documented

### Infrastructure Verification

- [ ] Database server provisioned
- [ ] Email provider account created (SendGrid/AWS SES)
- [ ] SMS provider account created (Twilio)
- [ ] CDN configured (if applicable)
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Monitoring tools configured

---

## Environment Setup

### Development Environment

**Purpose:** Local development and testing

**Configuration:**

```bash
# Environment Variables (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dogtrainersdirectory_dev
DB_USER=postgres
DB_PASSWORD=dev_password
```

**Setup Steps:**

1. Clone repository
2. Install dependencies: `npm install`
3. Copy environment template: `cp .env.example .env.local`
4. Configure local environment variables
5. Start database: `docker-compose up -d postgres`
6. Run migrations: `npm run migrate:up`
7. Start development server: `npm run dev`

### Staging Environment

**Purpose:** Pre-production testing and validation

**Configuration:**

```bash
# Environment Variables (.env.staging)
NEXT_PUBLIC_API_URL=https://staging-api.dogtrainersdirectory.com.au/api/v1
NEXT_PUBLIC_APP_URL=https://staging.dogtrainersdirectory.com.au
DB_HOST=staging-db.example.com
DB_PORT=5432
DB_NAME=dogtrainersdirectory_staging
DB_USER=staging_user
DB_PASSWORD=staging_password
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.staging.xxxxx.xxxxx.xxxxx.xxxxx.xxxxxx.xxxxxxx
TWILIO_ACCOUNT_SID=ACstagingxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=stagingxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+61400000000
```

**Setup Steps:**

1. Provision staging server
2. Configure DNS for staging domain
3. Set up SSL certificate
4. Clone repository to staging server
5. Install dependencies: `npm ci`
6. Configure staging environment variables
7. Create staging database
8. Run migrations: `npm run migrate:up`
9. Build application: `npm run build`
10. Start production server: `npm start`
11. Configure reverse proxy (nginx/Apache)
12. Test all functionality end-to-end

### Production Environment

**Purpose:** Live production deployment

**Configuration:**

```bash
# Environment Variables (.env.production)
NEXT_PUBLIC_API_URL=https://api.dogtrainersdirectory.com.au/api/v1
NEXT_PUBLIC_APP_URL=https://dogtrainersdirectory.com.au
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=dogtrainersdirectory_prod
DB_USER=prod_user
DB_PASSWORD=prod_secure_password
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.prod.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxxxx
TWILIO_ACCOUNT_SID=ACprodxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=prodxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+61400000000
EMAIL_FROM=noreply@dogtrainersdirectory.com.au
APP_URL=https://dogtrainersdirectory.com.au
```

**Setup Steps:**

1. Provision production server
2. Configure DNS for production domain
3. Set up SSL certificate (Let's Encrypt or commercial)
4. Configure firewall rules
5. Clone repository to production server
6. Install dependencies: `npm ci`
7. Configure production environment variables
8. Create production database
9. Run migrations: `npm run migrate:up`
10. Build application: `npm run build`
11. Start production server: `npm start`
12. Configure reverse proxy with SSL
13. Configure CDN (if applicable)
14. Set up monitoring and alerting

---

## Database Migration Steps

### Migration Framework Overview

The application uses a comprehensive migration framework located in [`src/db/migrations/`](../src/db/migrations/):

- [`migrate.ts`](../src/db/migrations/migrate.ts) - Core migration framework
- [`001_initial_schema.ts`](../src/db/migrations/001_initial_schema.ts) - Initial schema
- [`index.ts`](../src/db/migrations/index.ts) - Migrations registry
- [`cli.ts`](../src/db/migrations/cli.ts) - CLI interface

### Pre-Migration Checklist

- [ ] Database backup created
- [ ] Migration scripts reviewed
- [ ] Rollback scripts tested in development
- [ ] Migration validation passes
- [ ] Database connection verified
- [ ] Sufficient disk space available
- [ ] Maintenance window scheduled

### Migration Commands

```bash
# Check migration status
npm run migrate:status

# Apply pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Rollback to specific migration
npm run migrate:rollback 001_initial_schema

# Validate migration integrity
npm run migrate:validate

# Generate migration report
npm run migrate:report
```

### Migration Process

1. **Backup Database**
   ```bash
   pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Check Current Status**
   ```bash
   npm run migrate:status
   ```

3. **Apply Pending Migrations**
   ```bash
   npm run migrate:up
   ```

4. **Verify Migration Success**
   ```bash
   npm run migrate:validate
   ```

5. **Test Application Functionality**
   - Verify all pages load correctly
   - Test API endpoints
   - Test authentication flow
   - Test database queries

6. **Document Migration**
   - Record migration ID and timestamp
   - Note any warnings or issues
   - Update migration log

### Rollback Procedure

If migration fails or causes issues:

1. **Identify Failed Migration**
   ```bash
   npm run migrate:status
   ```

2. **Rollback to Previous State**
   ```bash
   npm run migrate:down
   ```

3. **Verify Rollback**
   ```bash
   npm run migrate:validate
   ```

4. **Test Application**
   - Verify application works with previous schema
   - Test critical functionality

5. **Investigate Failure**
   - Review migration logs
   - Check database error logs
   - Identify root cause

6. **Fix and Retry**
   - Update migration script
   - Test in development
   - Retry migration process

---

## Environment Variables Configuration

### Required Environment Variables

#### Application Configuration

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.dogtrainersdirectory.com.au/api/v1
NEXT_PUBLIC_APP_URL=https://dogtrainersdirectory.com.au

# Database Configuration
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=dogtrainersdirectory_prod
DB_USER=prod_user
DB_PASSWORD=prod_secure_password
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=10000
```

#### Email Configuration

```bash
# Email Provider Selection
EMAIL_PROVIDER=sendgrid  # Options: sendgrid, aws_ses

# SendGrid Configuration
SENDGRID_API_KEY=SG.prod.xxxxx.xxxxx.xxxxx.xxxxx.xxxxx.xxxxxxx
EMAIL_FROM=noreply@dogtrainersdirectory.com.au
EMAIL_REPLY_TO=support@dogtrainersdirectory.com.au

# AWS SES Configuration (alternative)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-southeast-2
```

#### SMS Configuration

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACprodxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=prodxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+61400000000
```

#### Application Settings

```bash
# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRY=604800  # 7 days in seconds
REFRESH_TOKEN_EXPIRY=2592000  # 30 days in seconds

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_MFA=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_SMS_VERIFICATION=true
```

### Environment Variable Security

- [ ] Never commit environment variables to version control
- [ ] Use strong, unique passwords for production
- [ ] Rotate API keys regularly
- [ ] Use secrets management service (AWS Secrets Manager, HashiCorp Vault)
- [ ] Restrict access to production credentials
- [ ] Audit access to environment variables
- [ ] Use different credentials for each environment

---

## Build and Deployment Process

### Build Process

#### Development Build

```bash
# Start development server with hot reload
npm run dev
```

#### Production Build

```bash
# Install dependencies
npm ci

# Run type checking
npm run type-check

# Run linter
npm run lint

# Run tests
npm test

# Build for production
npm run build

# Verify build output
ls -la .next
```

#### Build Optimization

- [ ] Code splitting enabled
- [ ] Tree shaking enabled
- [ ] Minification enabled
- [ ] Source maps generated (for production debugging)
- [ ] Asset optimization enabled
- [ ] Image optimization enabled

### Deployment Strategies

#### Strategy 1: Manual Deployment

**Use Case:** Small deployments, quick fixes

**Steps:**

1. SSH into production server
2. Navigate to application directory
3. Pull latest code: `git pull origin main`
4. Install dependencies: `npm ci`
5. Build application: `npm run build`
6. Restart application: `pm2 restart dogtrainersdirectory`
7. Verify deployment: Check logs and test functionality

#### Strategy 2: CI/CD Pipeline

**Use Case:** Automated deployments, multiple environments

**Example GitHub Actions Workflow:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.APP_URL }}
          
      - name: Deploy to server
        uses: easingthemes/ssh-deploy@v2.1.5
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: /var/www/dogtrainersdirectory
        with:
          args: "--exclude=node_modules --exclude=.git --exclude=.next"
```

#### Strategy 3: Docker Deployment

**Use Case:** Containerized deployments, orchestration

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
```

**Docker Compose:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
    depends_on:
      - postgres
      
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

**Deployment Steps:**

1. Build Docker image: `docker build -t dogtrainersdirectory .`
2. Tag image: `docker tag dogtrainersdirectory registry.example.com/dogtrainersdirectory:latest`
3. Push to registry: `docker push registry.example.com/dogtrainersdirectory:latest`
4. SSH into production server
5. Pull image: `docker pull registry.example.com/dogtrainersdirectory:latest`
6. Stop existing container: `docker stop dogtrainersdirectory`
7. Remove existing container: `docker rm dogtrainersdirectory`
8. Run new container: `docker run -d --name dogtrainersdirectory -p 3000:3000 registry.example.com/dogtrainersdirectory:latest`
9. Verify deployment: Check logs and test functionality

### Post-Deployment Verification

#### Health Checks

```bash
# Check application is running
curl -f https://dogtrainersdirectory.com.au/health || exit 1

# Check API is responding
curl -f https://api.dogtrainersdirectory.com.au/health || exit 1

# Check database connectivity
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check email service connectivity
curl -f https://api.sendgrid.com/v3/user/account || exit 1
```

#### Functional Testing

- [ ] Home page loads correctly
- [ ] Search functionality works
- [ ] Trainer profile pages load
- [ ] Registration form submits successfully
- [ ] Login with MFA works
- [ ] Navigation works across all pages
- [ ] Contact form submits successfully
- [ ] About page displays correctly
- [ ] FAQ page search and filtering works
- [ ] Error pages display correctly
- [ ] Email notifications are sent
- [ ] SMS notifications are sent

#### Performance Testing

- [ ] Page load times meet targets (< 2s)
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Lighthouse performance score ≥ 90

#### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility verified
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA attributes correct

---

## Rollback Procedures

### Rollback Triggers

Rollback should be considered when:

- Critical bugs affecting core functionality
- Performance degradation impacting users
- Security vulnerabilities discovered
- Data corruption or loss
- Database migration failures
- API integration failures

### Rollback Strategies

#### Strategy 1: Code Rollback

**Use Case:** Application-level issues, bugs

**Steps:**

1. Identify previous stable commit
   ```bash
   git log --oneline -10
   ```

2. Checkout previous commit
   ```bash
   git checkout <commit-hash>
   ```

3. Rebuild application
   ```bash
   npm ci
   npm run build
   ```

4. Redeploy application
   ```bash
   pm2 restart dogtrainersdirectory
   ```

5. Verify rollback
   - Test critical functionality
   - Check application logs
   - Monitor error rates

#### Strategy 2: Database Rollback

**Use Case:** Migration failures, data corruption

**Steps:**

1. Stop application
   ```bash
   pm2 stop dogtrainersdirectory
   ```

2. Restore database backup
   ```bash
   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < backup_YYYYMMDD_HHMMSS.sql
   ```

3. Verify database integrity
   ```bash
   npm run migrate:validate
   ```

4. Restart application
   ```bash
   pm2 start dogtrainersdirectory
   ```

5. Test functionality
   - Verify data integrity
   - Test critical features
   - Check application logs

#### Strategy 3: Configuration Rollback

**Use Case:** Environment variable issues, configuration errors

**Steps:**

1. Identify problematic configuration
   - Review recent changes
   - Check error logs
   - Identify root cause

2. Restore previous configuration
   ```bash
   # Restore from version control
   git checkout HEAD~1 .env.production
   
   # Or restore from backup
   cp .env.production.backup .env.production
   ```

3. Restart application
   ```bash
   pm2 restart dogtrainersdirectory
   ```

4. Verify configuration
   - Test affected features
   - Check application logs
   - Monitor error rates

### Rollback Verification

After any rollback:

- [ ] Application starts successfully
- [ ] No errors in application logs
- [ ] Database connectivity verified
- [ ] API endpoints responding correctly
- [ ] Email/SMS services working
- [ ] Critical functionality tested
- [ ] Performance metrics acceptable
- [ ] Error rates within normal range
- [ ] User feedback monitored

---

## Monitoring and Alerting Setup

### Application Monitoring

#### Health Endpoints

Implement health check endpoints:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
  };
  
  return NextResponse.json(health);
}
```

#### Metrics to Monitor

- Application uptime
- Response times
- Error rates
- Request throughput
- Database query performance
- Email/SMS delivery rates
- Memory usage
- CPU usage
- Disk usage

#### Monitoring Tools

**Recommended Tools:**

- **Application Performance Monitoring (APM)**
  - New Relic
  - Datadog
  - Sentry (for errors)

- **Uptime Monitoring**
  - UptimeRobot
  - Pingdom
  - StatusCake

- **Log Aggregation**
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Splunk
  - Papertrail

### Alerting Configuration

#### Critical Alerts

Configure alerts for:

- Application down (uptime < 99.9%)
- Error rate > 5%
- Response time > 3s
- Database connection failures
- Email/SMS delivery failures
- Memory usage > 80%
- CPU usage > 80%
- Disk usage > 80%

#### Warning Alerts

Configure alerts for:

- Error rate > 1%
- Response time > 2s
- Database query time > 1s
- Email/SMS delivery rate < 95%
- Memory usage > 60%
- CPU usage > 60%
- Disk usage > 60%

#### Alert Channels

Configure multiple alert channels:

- Email (on-call team)
- SMS (critical alerts only)
- Slack/Teams (team notifications)
- PagerDuty (critical incidents)
- Webhook (custom integrations)

### Log Management

#### Application Logs

```typescript
// Configure structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'logs/application.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});
```

#### Database Logs

Configure PostgreSQL logging:

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = 'on';

-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
```

#### Access Logs

Configure web server access logs:

```nginx
# nginx configuration
access_log /var/log/nginx/access.log;
error_log /var/log/nginx/error.log;
```

### Incident Response

#### Incident Severity Levels

| Severity | Response Time | Examples |
|----------|---------------|----------|
| P1 - Critical | 15 minutes | Application down, data loss, security breach |
| P2 - High | 1 hour | Major feature broken, performance degradation |
| P3 - Medium | 4 hours | Minor feature broken, intermittent issues |
| P4 - Low | 24 hours | Cosmetic issues, minor bugs |

#### Incident Response Process

1. **Detection**
   - Alert received from monitoring system
   - Verify incident severity
   - Acknowledge alert

2. **Assessment**
   - Investigate root cause
   - Determine impact scope
   - Identify affected users

3. **Response**
   - Implement workaround if available
   - Begin fix implementation
   - Communicate with stakeholders

4. **Resolution**
   - Deploy fix or rollback
   - Verify resolution
   - Monitor for recurrence

5. **Post-Incident**
   - Document incident details
   - Conduct post-mortem
   - Implement preventive measures

---

## Appendix A: Deployment Commands Reference

### Migration Commands

```bash
# Check migration status
npm run migrate:status

# Apply pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Rollback to specific migration
npm run migrate:rollback <migration-id>

# Validate migration integrity
npm run migrate:validate

# Generate migration report
npm run migrate:report
```

### Build Commands

```bash
# Install dependencies
npm ci

# Run type checking
npm run type-check

# Run linter
npm run lint

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Start development server
npm run dev
```

### Docker Commands

```bash
# Build Docker image
docker build -t dogtrainersdirectory .

# Run Docker container
docker run -d -p 3000:3000 --name dogtrainersdirectory dogtrainersdirectory

# Stop Docker container
docker stop dogtrainersdirectory

# Remove Docker container
docker rm dogtrainersdirectory

# View Docker logs
docker logs dogtrainersdirectory

# Execute command in container
docker exec -it dogtrainersdirectory sh
```

### Database Commands

```bash
# Create database backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > backup.sql

# Restore database backup
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < backup.sql

# Connect to database
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Check database size
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT pg_sizeof('$DB_NAME');"
```

---

## Appendix B: Troubleshooting

### Common Deployment Issues

#### Build Failures

**Issue:** Build fails with TypeScript errors

**Solution:**
```bash
# Check TypeScript version
npm list typescript

# Clear cache
rm -rf .next
rm -rf node_modules/.cache

# Rebuild
npm run build
```

**Issue:** Build fails with out of memory

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### Database Connection Issues

**Issue:** Cannot connect to database

**Solution:**
```bash
# Check database is running
pg_isready -h $DB_HOST -p $DB_PORT

# Check connection string
echo $DATABASE_URL

# Test connection manually
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

#### Environment Variable Issues

**Issue:** Application not using environment variables

**Solution:**
```bash
# Verify environment variables are set
echo $NEXT_PUBLIC_API_URL

# Check .env file exists
ls -la .env.production

# Restart application after changes
pm2 restart dogtrainersdirectory
```

#### Performance Issues

**Issue:** Slow page load times

**Solution:**
```bash
# Check build output size
du -sh .next

# Enable production mode
export NODE_ENV=production

# Check for large dependencies
npm ls --depth=0 | grep -v node_modules

# Optimize images
npm run optimize-images
```

---

## Appendix C: Related Documentation

- [`DOCS/production-readiness-summary.md`](DOCS/production-readiness-summary.md) - Production readiness overview
- [`DOCS/testing-strategy.md`](DOCS/testing-strategy.md) - Testing approach and recommendations
- [`DOCS/api-integration-guide.md`](DOCS/api-integration-guide.md) - API integration patterns
- [`openapi.yaml`](../openapi.yaml) - API specification
- [`src/db/migrations/`](../src/db/migrations/) - Migration framework documentation

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-12-25  
**Next Review:** After first production deployment
