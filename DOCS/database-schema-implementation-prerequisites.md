# Database Schema Implementation Prerequisites

**Document:** DTD Phase 1 Database Schema Implementation  
**Date:** 2025-12-25  
**Status:** 🟢 Ready for Implementation  
**Purpose:** Comprehensive list of all prerequisites for Database Schema Architect agent

---

## Executive Summary

This document provides a complete, step-by-step guide for all prerequisites required to execute DTD Phase 1: Database Schema Implementation. It covers third-party tools, environment variables, platform registration, and verification steps to ensure seamless execution.

---

## Part 1: Third-Party Tools Required

### 1.1 Supabase (Primary Database Platform)

**Purpose:** PostgreSQL hosting, authentication, real-time subscriptions, storage, edge functions.

**Required Components:**
- Supabase Project (PostgreSQL database)
- Supabase CLI (for migrations)
- Supabase Dashboard (for management)
- Supabase Auth (for authentication)
- Supabase Storage (for file uploads, if needed)

**Installation Steps:**

```bash
# Step 1: Install Supabase CLI globally
npm install -g supabase

# Step 2: Verify installation
supabase --version
# Expected output: supabase 1.x.x.x or higher

# Step 3: Login to Supabase
supabase login
# This will open browser for authentication
```

**Verification:**
```bash
# Check if logged in
supabase projects list
# Should show your projects (empty if new account)
```

---

### 1.2 Node.js & npm (Runtime & Package Manager)

**Purpose:** JavaScript runtime, package management, Supabase CLI dependency.

**Installation Steps:**

```bash
# Step 1: Check if Node.js is installed
node --version
# Expected: v18.x.x or higher (LTS recommended)

# Step 2: Check if npm is installed
npm --version
# Expected: 9.x.x or higher

# Step 3: If not installed, download from:
# https://nodejs.org/ (Download LTS version)
```

**Verification:**
```bash
# Verify Node.js and npm
node -e "console.log('Node.js:', process.version)"
npm -e "console.log('npm:', require('npm/package.json').version)"
```

---

### 1.3 TypeScript (Type Definitions)

**Purpose:** Type-safe database schema definitions.

**Installation Steps:**

```bash
# Step 1: Install TypeScript globally (optional, can use local)
npm install -g typescript

# Step 2: Verify installation
tsc --version
# Expected: Version 5.x.x or higher

# Step 3: Install TypeScript types for Supabase
npm install --save-dev @supabase/supabase-js
npm install --save-dev @types/node
```

**Verification:**
```bash
# Check TypeScript version
tsc --version

# Check installed packages
cat package.json | grep -A 5 "devDependencies"
```

---

### 1.4 Git (Version Control)

**Purpose:** Track database migrations, version control for schema changes.

**Installation Steps:**

```bash
# Step 1: Check if Git is installed
git --version
# Expected: git version 2.x.x.x

# Step 2: If not installed, download from:
# https://git-scm.com/downloads
```

**Verification:**
```bash
# Verify Git installation
git --version

# Initialize Git repository (if not already)
git init
git status
```

---

### 1.5 VS Code (Development Environment)

**Purpose:** IDE for development, database schema editing, migration management.

**Required Extensions:**
- Supabase (official extension)
- PostgreSQL (for SQL syntax highlighting)
- Prettier (code formatting)
- ESLint (code linting)

**Installation Steps:**

```bash
# Step 1: Install VS Code from:
# https://code.visualstudio.com/

# Step 2: Install extensions via command palette (Cmd+Shift+P)
# Search and install:
# - "Supabase"
# - "PostgreSQL"
# - "Prettier - Code formatter"
# - "ESLint"
```

**Verification:**
```bash
# Open VS Code and check extensions
code --list-extensions | grep -i "supabase\|postgresql\|prettier\|eslint"
```

---

## Part 2: Environment Variables Required

### 2.1 Supabase Environment Variables

**Purpose:** Connect application to Supabase database and services.

**Required Variables:**

| Variable Name | Purpose | Required? | Example Value |
|---------------|---------|------------|---------------|
| `SUPABASE_URL` | Database connection URL | ✅ Yes | `https://xyzcompany.supabase.co` |
| `SUPABASE_ANON_KEY` | Anonymous/public API key | ✅ Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin access) | ✅ Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**How to Obtain:**

```bash
# Step 1: Log in to Supabase Dashboard
# https://supabase.com/dashboard

# Step 2: Create or select your project
# Click "New Project" or select existing project

# Step 3: Navigate to Project Settings
# Click on project name → Settings → API

# Step 4: Copy environment variables
# You'll see:
# - Project URL → SUPABASE_URL
# - anon public → SUPABASE_ANON_KEY
# - service_role secret → SUPABASE_SERVICE_ROLE_KEY
```

**Local Development Setup:**

```bash
# Step 1: Create .env.local file in project root
touch .env.local

# Step 2: Add Supabase variables
cat > .env.local << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF

# Step 3: Add .env.local to .gitignore
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
```

**Vercel Deployment Setup:**

```bash
# Step 1: Log in to Vercel Dashboard
# https://vercel.com/dashboard

# Step 2: Select your project or create new

# Step 3: Navigate to Settings → Environment Variables

# Step 4: Add each variable:
# - Key: SUPABASE_URL
# - Value: https://your-project.supabase.co
# - Environment: Production (or Preview/Development)

# Repeat for all three variables
```

---

### 2.2 Stripe Environment Variables

**Purpose:** Payment processing for featured placements.

**Required Variables:**

| Variable Name | Purpose | Required? | Example Value |
|---------------|---------|------------|---------------|
| `STRIPE_SECRET_KEY` | Secret API key for server-side operations | ✅ Yes | `sk_live_51AbC...` |
| `STRIPE_PUBLIC_KEY` | Publishable key for client-side operations | ✅ Yes | `pk_live_51AbC...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret for verification | ✅ Yes | `whsec_...` |

**How to Obtain:**

```bash
# Step 1: Log in to Stripe Dashboard
# https://dashboard.stripe.com/

# Step 2: Navigate to Developers → API keys

# Step 3: Create API keys (if not exists)
# Click "Create secret key"
# - Key type: Secret key
# - Description: "DTD Production"
# - Click "Create key"
# Copy the key (starts with sk_live_...)

# Step 4: Get publishable key
# Scroll down to "Publishable key"
# Copy the key (starts with pk_live_...)

# Step 5: Set up webhook (for production)
# Navigate to Developers → Webhooks
# Click "Add endpoint"
# - Endpoint URL: https://your-domain.com/api/webhooks/stripe
# - Events to send: charge.succeeded, charge.refunded, charge.failed
# - Click "Add endpoint"
# Copy the webhook signing secret (starts with whsec_...)
```

**Test Mode Setup:**

```bash
# For development/testing, use test keys:
# - Test secret key: sk_test_...
# - Test publishable key: pk_test_...
# - Test webhook secret: whsec_test_...

# Add to .env.local:
cat >> .env.local << EOF
STRIPE_SECRET_KEY=sk_test_51AbC...
STRIPE_PUBLIC_KEY=pk_test_51AbC...
STRIPE_WEBHOOK_SECRET=whsec_test_...
EOF
```

**Production Mode Setup:**

```bash
# Add production keys to Vercel:
# Navigate to Vercel Dashboard → Settings → Environment Variables
# Add:
# - STRIPE_SECRET_KEY = sk_live_...
# - STRIPE_PUBLIC_KEY = pk_live_...
# - STRIPE_WEBHOOK_SECRET = whsec_...
```

---

### 2.3 AI Service Environment Variables

**Purpose:** Emergency triage classification (Z.AI primary, z.ai fallback).

**Required Variables:**

| Variable Name | Purpose | Required? | Example Value |
|---------------|---------|------------|---------------|
| `Z_AI_API_KEY` | Z.AI API authentication | ✅ Yes | `Bearer zai_...` |
| `OPENAI_API_KEY` | z.ai API authentication (fallback) | ✅ Yes | `sk-proj-...` |

**How to Obtain:**

```bash
# Z.AI Registration:
# Step 1: Visit Z.AI website
# https://z.ai/ (replace with actual URL)

# Step 2: Sign up for account
# Provide email, create password

# Step 3: Navigate to API Keys section
# Generate new API key
# Copy the key (starts with "Bearer " or similar)

# z.ai Registration:
# Step 1: Visit z.ai website
# https://platform.openai.com/

# Step 2: Sign up or log in

# Step 3: Navigate to API Keys
# Click "Create new secret key"
# Copy the key (starts with "sk-proj-...")
```

**Local Development Setup:**

```bash
# Add to .env.local:
cat >> .env.local << EOF
Z_AI_API_KEY=Bearer zai_your_key_here
OPENAI_API_KEY=sk-proj-your_key_here
EOF
```

**Vercel Deployment Setup:**

```bash
# Add to Vercel Environment Variables:
# - Z_AI_API_KEY
# - OPENAI_API_KEY
```

---

### 2.4 Security Environment Variables

**Purpose:** Data encryption, cron job verification.

**Required Variables:**

| Variable Name | Purpose | Required? | Example Value |
|---------------|---------|------------|---------------|
| `ENCRYPTION_KEY` | AES-256-GCM encryption key for sensitive data | ✅ Yes | `32-byte-random-hex-string` |
| `CRON_SECRET` | Secret for verifying cron job requests | ✅ Yes | `random-secret-string` |

**How to Generate:**

```bash
# Step 1: Generate ENCRYPTION_KEY (32 bytes = 64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Example output: a1b2c3d4e5f6... (64 characters)

# Step 2: Generate CRON_SECRET (random string)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Example output: AbCdEfGhIjKlMnOpQrStUvWxYz...

# Step 3: Add to .env.local
cat >> .env.local << EOF
ENCRYPTION_KEY=a1b2c3d4e5f6...
CRON_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz...
EOF
```

**Vercel Deployment Setup:**

```bash
# Add to Vercel Environment Variables:
# - ENCRYPTION_KEY
# - CRON_SECRET
```

---

### 2.5 Application Environment Variables

**Purpose:** Application configuration, domain settings.

**Required Variables:**

| Variable Name | Purpose | Required? | Example Value |
|---------------|---------|------------|---------------|
| `NEXT_PUBLIC_DOMAIN` | Public domain for URLs, redirects | ✅ Yes | `https://dogtrainers.com.au` |
| `NEXT_PUBLIC_APP_URL` | Full application URL | ✅ Yes | `https://dogtrainers.com.au` |
| `NODE_ENV` | Environment (development/production) | ✅ Yes | `production` |

**How to Set:**

```bash
# Add to .env.local:
cat >> .env.local << EOF
NEXT_PUBLIC_DOMAIN=https://dogtrainers.com.au
NEXT_PUBLIC_APP_URL=https://dogtrainers.com.au
NODE_ENV=development
EOF

# Add to Vercel Environment Variables:
# - NEXT_PUBLIC_DOMAIN
# - NEXT_PUBLIC_APP_URL
# - NODE_ENV (set to "production")
```

---

## Part 3: Platform Registration Process

### 3.1 Supabase Registration & Project Setup

**Step-by-Step Instructions:**

```bash
# Step 1: Create Supabase Account
# Visit: https://supabase.com/
# Click "Start your project"
# Sign up with email, password, or OAuth (GitHub, Google)

# Step 2: Create New Project
# After login, click "New Project"
# Project name: "dogtrainersdirectory"
# Database password: Generate strong password (save securely!)
# Region: Select closest region (e.g., "Southeast Asia (Singapore)")
# Click "Create new project"

# Step 3: Wait for Project Initialization
# Supabase will create:
# - PostgreSQL database
# - Authentication service
# - Storage service
# - Edge Functions
# - Real-time service
# Wait 1-2 minutes for initialization

# Step 4: Navigate to SQL Editor
# Click on "SQL Editor" in left sidebar
# This is where you'll run migrations

# Step 5: Get Project Credentials
# Click on project name → Settings → API
# Copy:
# - Project URL → SUPABASE_URL
# - anon public → SUPABASE_ANON_KEY
# - service_role secret → SUPABASE_SERVICE_ROLE_KEY

# Step 6: Set Up Local Development
# Initialize Supabase CLI:
supabase init --db-url "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Link to remote project:
supabase link --project-ref "[project-ref]"

# Step 7: Verify Connection
supabase db remote commit
# Should show "Remote commit successful"
```

**Verification Checklist:**
- [ ] Supabase account created
- [ ] Project "dogtrainersdirectory" created
- [ ] Database initialized
- [ ] SQL Editor accessible
- [ ] API credentials obtained
- [ ] Local CLI linked to project
- [ ] Test connection successful

---

### 3.2 Stripe Registration & Setup

**Step-by-Step Instructions:**

```bash
# Step 1: Create Stripe Account
# Visit: https://dashboard.stripe.com/register
# Fill in:
# - Email address
# - Country (Australia)
# - Business details (or individual)
# - Bank account (for payouts, can skip for test mode)
# Click "Create account"

# Step 2: Verify Email Address
# Check email for Stripe verification link
# Click verification link
# Account now active

# Step 3: Complete Business Profile (if applicable)
# Navigate to Settings → Business profile
# Fill in:
# - Business name: "Dog Trainers Directory"
# - Business type: "Company"
# - Business website: "https://dogtrainers.com.au"
# - Customer support email: "support@dogtrainers.com.au"
# Click "Save"

# Step 4: Enable Test Mode
# Navigate to Developers → API keys
# Toggle "View test data" to ON
# This allows you to use test keys without real charges

# Step 5: Create Test API Keys
# Click "Create secret key"
# - Key type: Secret key
# Description: "DTD Test Mode"
# Click "Create key"
# Copy the test secret key (starts with sk_test_...)

# Step 6: Get Test Publishable Key
# Scroll down to "Publishable key"
# Copy the test publishable key (starts with pk_test_...)

# Step 7: Create Product (Featured Placement)
# Navigate to Products → Add product
# Fill in:
# - Name: "Featured Profile Promotion"
# - Description: "30-day featured placement in search results"
# - Price: $22.00 AUD (includes GST)
# Click "Save product"

# Step 8: Set Up Webhook (Test Mode)
# Navigate to Developers → Webhooks
# Click "Add endpoint"
# Fill in:
# - Endpoint URL: http://localhost:3000/api/webhooks/stripe
#   (Use ngrok or localtunnel for local development)
# - Events to send:
#   - charge.succeeded
#   - charge.refunded
#   - charge.failed
# - invoice.payment_failed
# Click "Add endpoint"
# Copy the webhook signing secret (starts with whsec_test_...)

# Step 9: Create Production API Keys (for later)
# Toggle "View test data" to OFF
# Repeat steps 5-6 for production keys
# Production keys start with sk_live_ and pk_live_

# Step 10: Set Up Production Webhook (for later)
# Repeat step 8 with production URL:
# - Endpoint URL: https://dogtrainers.com.au/api/webhooks/stripe
# Copy production webhook secret (starts with whsec_...)
```

**Verification Checklist:**
- [ ] Stripe account created and verified
- [ ] Business profile completed
- [ ] Test mode enabled
- [ ] Test API keys created
- [ ] Test product created
- [ ] Test webhook configured
- [ ] Production API keys created (for later)
- [ ] Production webhook configured (for later)

---

### 3.3 Z.AI Registration (Primary AI Provider)

**Step-by-Step Instructions:**

```bash
# Step 1: Create Z.AI Account
# Visit: https://z.ai/ (replace with actual URL)
# Click "Sign up" or "Get started"
# Fill in:
# - Email address
# - Password
# - Organization name (optional)
# Click "Create account"

# Step 2: Verify Email
# Check email for verification link
# Click verification link
# Account now active

# Step 3: Navigate to API Keys Section
# Click on "API Keys" or "Developers" in dashboard
# Click "Generate new API key"
# Provide description: "DTD Emergency Triage"
# Click "Generate"

# Step 4: Copy API Key
# Copy the API key
# Format: "Bearer [key]" or similar
# Save securely

# Step 5: Review API Documentation
# Navigate to "Documentation" or "API Reference"
# Review:
# - Authentication method
# - Endpoint URLs
# - Request/response formats
# - Rate limits
# - Pricing (if applicable)
```

**Verification Checklist:**
- [ ] Z.AI account created and verified
- [ ] API key generated
- [ ] API documentation reviewed
- [ ] Rate limits understood

---

### 3.4 z.ai Registration (Fallback AI Provider)

**Step-by-Step Instructions:**

```bash
# Step 1: Create z.ai Account
# Visit: https://platform.openai.com/
# Click "Sign up"
# Fill in:
# - Email address
# - Password
# - Phone number (for 2FA)
# Click "Continue"

# Step 2: Verify Email
# Check email for verification code
# Enter verification code
# Account now active

# Step 3: Verify Phone Number
# Enter phone number
# Receive SMS verification code
# Enter code
# 2FA now enabled

# Step 4: Navigate to API Keys
# Click on "API keys" in left sidebar
# Click "Create new secret key"
# Provide description: "DTD Emergency Triage Fallback"
# Click "Create secret key"
# Copy the key (starts with "sk-proj-...")
# Save securely

# Step 5: Review API Documentation
# Navigate to "Documentation"
# Review:
# - Available models (e.g., GPT-4, GPT-3.5-turbo)
# - API endpoints
# - Pricing
# - Rate limits
```

**Verification Checklist:**
- [ ] z.ai account created and verified
- [ ] Phone number verified (2FA enabled)
- [ ] API key generated
- [ ] API documentation reviewed
- [ ] Pricing and rate limits understood

---

### 3.5 Vercel Registration (Deployment Platform)

**Step-by-Step Instructions:**

```bash
# Step 1: Create Vercel Account
# Visit: https://vercel.com/signup
# Sign up with:
# - Email address
# - Password
# - Or OAuth (GitHub, GitLab, Bitbucket)
# Click "Create account"

# Step 2: Verify Email
# Check email for verification link
# Click verification link
# Account now active

# Step 3: Import or Create Project
# Option A: Import from Git repository
# Click "Add New Project"
# Click "Import Git Repository"
# Connect your Git provider (GitHub, GitLab, Bitbucket)
# Select repository: "dogtrainersdirectory"
# Click "Import"

# Option B: Create new project
# Click "Add New Project"
# Click "Continue with GitHub" (or other provider)
# Select repository or create new
# Configure project settings:
#   - Framework Preset: Next.js
#   - Root Directory: ./
# Click "Create"

# Step 4: Configure Environment Variables
# Navigate to Project → Settings → Environment Variables
# Add all variables from Part 2:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_PUBLIC_KEY
# - STRIPE_WEBHOOK_SECRET
# - Z_AI_API_KEY
# - OPENAI_API_KEY
# - ENCRYPTION_KEY
# - CRON_SECRET
# - NEXT_PUBLIC_DOMAIN
# - NEXT_PUBLIC_APP_URL
# - NODE_ENV

# Step 5: Configure Cron Jobs
# Navigate to Settings → Cron Jobs
# Add cron job:
# - Job name: "featured-expiry-and-promotion"
# - Schedule: "0 15 * * *" (3pm UTC = 2am AEDT)
# - Command: "npm run cron:featured-expiry-and-promotion"
# Click "Add"

# Step 6: Deploy Project
# Click "Deploy" in project header
# Wait for deployment to complete
# Vercel will provide production URL

# Step 7: Configure Custom Domain (if applicable)
# Navigate to Settings → Domains
# Click "Add Domain"
# Enter domain: "dogtrainers.com.au"
# Follow DNS configuration instructions
# Wait for SSL certificate to provision
# Domain now active
```

**Verification Checklist:**
- [ ] Vercel account created and verified
- [ ] Project imported or created
- [ ] Environment variables configured
- [ ] Cron jobs configured
- [ ] Project deployed successfully
- [ ] Production URL accessible
- [ ] Custom domain configured (if applicable)

---

## Part 4: Directory Structure Setup

### 4.1 Create Required Directories

**Purpose:** Organize database migrations, types, and configuration.

**Step-by-Step Instructions:**

```bash
# Step 1: Create migrations directory
mkdir -p supabase/migrations

# Step 2: Create types directory
mkdir -p src/types

# Step 3: Create services directory
mkdir -p src/services

# Step 4: Create utils directory
mkdir -p src/utils

# Step 5: Verify directory structure
tree -L 2
# Expected output:
# .
# ├── src
# │   ├── types
# │   ├── services
# │   └── utils
# └── supabase
#     └── migrations
```

---

### 4.2 Initialize Git Repository

**Step-by-Step Instructions:**

```bash
# Step 1: Initialize Git (if not already)
git init

# Step 2: Create .gitignore file
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.yarn/install-state

# Environment variables
.env
.env.local
.env.production
.env.development

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build
dist/
build/
.next/
out/

# Testing
coverage/
.nyc_output/

# Misc
*.pid
*.seed
*.pid.lock
EOF

# Step 3: Create initial commit
git add .
git commit -m "Initial commit: Database schema implementation setup"

# Step 4: Create main branch (if not exists)
git branch -M main

# Step 5: Push to remote (if remote exists)
git remote add origin https://github.com/yourusername/dogtrainersdirectory.git
git push -u origin main
```

---

## Part 5: Pre-Implementation Verification

### 5.1 Verify All Prerequisites

**Step-by-Step Verification Checklist:**

```bash
# Step 1: Verify Node.js and npm
node --version
npm --version

# Step 2: Verify Supabase CLI
supabase --version

# Step 3: Verify TypeScript
tsc --version

# Step 4: Verify Git
git --version

# Step 5: Verify environment variables exist
cat .env.local

# Step 6: Verify directory structure
ls -la supabase/migrations
ls -la src/types

# Step 7: Verify Git repository
git status
git log --oneline -1

# Step 8: Test Supabase connection
supabase db remote commit

# Step 9: Test Stripe connection (optional, requires code)
# This will be tested during implementation

# Step 10: Test AI provider connection (optional, requires code)
# This will be tested during implementation
```

**Expected Results:**
- Node.js: v18.x.x or higher
- npm: 9.x.x or higher
- Supabase CLI: 1.x.x or higher
- TypeScript: 5.x.x or higher
- Git: 2.x.x.x or higher
- .env.local: Contains all required variables
- Directories: Created and accessible
- Git: Initialized and committed
- Supabase: Connected to remote project

---

## Part 6: Troubleshooting Common Issues

### 6.1 Supabase Connection Issues

**Issue:** "Connection refused" or "Authentication failed"

**Solutions:**
```bash
# Solution 1: Verify project URL
echo $SUPABASE_URL
# Should match Supabase Dashboard

# Solution 2: Verify API keys
echo $SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
# Should match Supabase Dashboard

# Solution 3: Re-link Supabase CLI
supabase link --project-ref "[project-ref]"

# Solution 4: Check network connectivity
ping db.[project-ref].supabase.co
```

---

### 6.2 Stripe Webhook Issues

**Issue:** "Webhook signature verification failed"

**Solutions:**
```bash
# Solution 1: Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET
# Should match Stripe Dashboard

# Solution 2: Test webhook with Stripe CLI
stripe trigger charge.succeeded
# This will send test webhook to your endpoint

# Solution 3: Check endpoint is accessible
curl -X POST https://your-domain.com/api/webhooks/stripe
# Should return 200 OK (or 400 if signature check fails)
```

---

### 6.3 Environment Variable Issues

**Issue:** "Environment variable not found"

**Solutions:**
```bash
# Solution 1: Verify .env.local exists
ls -la .env.local

# Solution 2: Verify .env.local is loaded
# In Next.js, .env.local is auto-loaded
# Check next.config.js for dotenv configuration

# Solution 3: Restart development server
# Stop server (Ctrl+C)
# Start server again: npm run dev

# Solution 4: Verify Vercel environment variables
# Navigate to Vercel Dashboard → Settings → Environment Variables
# Verify all variables are present
```

---

## Part 7: Security Best Practices

### 7.1 Secret Management

**Guidelines:**
- Never commit `.env.local` or `.env` files to Git
- Use different keys for development, staging, and production
- Rotate keys quarterly (as per D-014)
- Use strong, unique passwords for all accounts
- Enable 2FA on all accounts that support it

**Key Rotation Schedule:**
- Supabase: Every 3 months
- Stripe: Every 3 months
- Z.AI: Every 3 months
- z.ai: Every 3 months
- Encryption keys: Every 6 months

---

### 7.2 Access Control

**Guidelines:**
- Limit access to production environment variables to authorized team members
- Use Vercel team features for collaboration
- Implement proper RLS policies in Supabase
- Use service role keys only for server-side operations
- Never expose secret keys in client-side code

---

## Part 8: Implementation Readiness Checklist

### 8.1 Final Verification

**Complete all items before starting database schema implementation:**

**Tools & Software:**
- [ ] Node.js v18+ installed
- [ ] npm 9+ installed
- [ ] Supabase CLI installed and linked
- [ ] TypeScript 5+ installed
- [ ] Git 2+ installed
- [ ] VS Code with required extensions

**Platform Accounts:**
- [ ] Supabase account created and verified
- [ ] Supabase project "dogtrainersdirectory" created
- [ ] Stripe account created and verified
- [ ] Stripe test mode enabled
- [ ] Z.AI account created and API key obtained
- [ ] z.ai account created and API key obtained
- [ ] Vercel account created and project imported

**Environment Variables:**
- [ ] `.env.local` file created with all variables
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `STRIPE_SECRET_KEY` set (test mode)
- [ ] `STRIPE_PUBLIC_KEY` set (test mode)
- [ ] `STRIPE_WEBHOOK_SECRET` set (test mode)
- [ ] `Z_AI_API_KEY` set
- [ ] `OPENAI_API_KEY` set
- [ ] `ENCRYPTION_KEY` generated and set
- [ ] `CRON_SECRET` generated and set
- [ ] `NEXT_PUBLIC_DOMAIN` set
- [ ] `NEXT_PUBLIC_APP_URL` set
- [ ] `NODE_ENV` set

**Vercel Configuration:**
- [ ] Project imported or created
- [ ] All environment variables added to Vercel
- [ ] Cron job configured
- [ ] Project deployed successfully
- [ ] Production URL accessible

**Directory Structure:**
- [ ] `supabase/migrations/` directory created
- [ ] `src/types/` directory created
- [ ] `src/services/` directory created
- [ ] `src/utils/` directory created
- [ ] `.gitignore` file created
- [ ] Git repository initialized

**Testing:**
- [ ] Supabase connection tested
- [ ] Local development server starts without errors
- [ ] Environment variables loaded correctly

**Documentation:**
- [ ] This prerequisites document reviewed
- [ ] All architectural decisions in DOCS/ reviewed
- [ ] Database schema specification understood

---

## Part 9: Next Steps After Prerequisites

### 9.1 Begin Database Schema Implementation

Once all prerequisites are verified, proceed with:

1. **Create Enum Types** (`001_enums.sql`)
   - Define all 12 enum types
   - Follow specifications in DOCS/02_DOMAIN_MODEL.md

2. **Create Core Tables** (`002_tables.sql`)
   - Implement 10 core tables
   - Define foreign key relationships
   - Add constraints

3. **Implement RLS Policies** (`003_rls_policies.sql`)
   - Set up row-level security
   - Define public read access
   - Define trainer write access
   - Define admin full access

4. **Create Indexes and Triggers** (`004_indexes_triggers.sql`)
   - Add performance indexes
   - Create triggers for featured placement queue
   - Create triggers for suburb auto-assignment

5. **Seed Reference Data** (`005_seed_data.sql`)
   - Insert 28 councils
   - Insert 200+ suburbs
   - Add sample trainer profiles

6. **Create Verification Scripts** (`006_verification.sql`)
   - Verify all constraints
   - Test referential integrity
   - Validate data integrity

7. **Generate TypeScript Types** (`src/types/database.ts`)
   - Create type definitions for all tables
   - Export types for use in application

8. **Update Agent Sidecar Memory**
   - Document implementation details
   - Track schema evolution
   - Record any deviations from specification

---

## Part 10: Support and Resources

### 10.1 Documentation References

**Internal Documentation:**
- DOCS/02_DOMAIN_MODEL.md - Complete database schema specification
- DOCS/05_DATA_AND_API_CONTRACTS.md - API endpoints and data contracts
- DOCS/06_MONETISATION_AND_FEATURED.md - Stripe integration details
- DOCS/08_OPERATIONS_AND_HEALTH.md - Operations workflows
- DOCS/09_SECURITY_AND_PRIVACY.md - Security and compliance

**External Documentation:**
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- PostgreSQL: https://www.postgresql.org/docs/
- TypeScript: https://www.typescriptlang.org/docs/

---

### 10.2 Troubleshooting Resources

**Supabase Support:**
- Dashboard: https://supabase.com/dashboard
- Status Page: https://status.supabase.com/
- GitHub Issues: https://github.com/supabase/supabase/issues

**Stripe Support:**
- Dashboard: https://dashboard.stripe.com/
- Status Page: https://status.stripe.com/
- Contact: https://support.stripe.com/

**Vercel Support:**
- Dashboard: https://vercel.com/dashboard
- Status Page: https://www.vercel-status.com/
- Contact: https://vercel.com/support

---

## Appendix A: Quick Reference Commands

### A.1 Supabase CLI Commands

```bash
# Link to project
supabase link --project-ref "[project-ref]"

# Push migrations
supabase db push

# Pull remote schema
supabase db pull

# Generate TypeScript types
supabase gen types typescript --local --schema public > src/types/database.ts

# Start local development
supabase start

# Reset local database
supabase db reset
```

### A.2 Git Commands

```bash
# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "Commit message"

# Push to remote
git push

# Pull from remote
git pull

# Create branch
git branch feature/branch-name

# Switch branch
git checkout feature/branch-name

# Merge branch
git merge feature/branch-name
```

### A.3 Environment Variable Commands

```bash
# List all environment variables
env | sort

# Get specific variable
echo $VARIABLE_NAME

# Set variable (temporary, current session only)
export VARIABLE_NAME="value"

# Unset variable
unset VARIABLE_NAME
```

---

## Appendix B: Common Error Messages and Solutions

### B.1 Supabase Errors

**Error:** "Connection refused"
- **Cause:** Incorrect project URL or network issue
- **Solution:** Verify SUPABASE_URL, check network connectivity

**Error:** "Authentication failed"
- **Cause:** Invalid or expired API key
- **Solution:** Regenerate API key in Supabase Dashboard

**Error:** "Migration failed"
- **Cause:** SQL syntax error or constraint violation
- **Solution:** Review SQL syntax, check constraints in DOCS/02_DOMAIN_MODEL.md

### B.2 Stripe Errors

**Error:** "Invalid API key"
- **Cause:** Incorrect or expired API key
- **Solution:** Verify STRIPE_SECRET_KEY, regenerate if needed

**Error:** "Webhook signature verification failed"
- **Cause:** Incorrect STRIPE_WEBHOOK_SECRET
- **Solution:** Verify webhook secret in Stripe Dashboard

**Error:** "No such customer"
- **Cause:** Customer ID doesn't exist
- **Solution:** Verify customer creation, check test mode vs production

### B.3 Node.js/npm Errors

**Error:** "Module not found"
- **Cause:** Missing dependency
- **Solution:** Run `npm install`

**Error:** "EACCES: permission denied"
- **Cause:** File permission issue
- **Solution:** Run `chmod +x` on script or use `sudo`

**Error:** "EMFILE: too many open files"
- **Cause:** System limit reached
- **Solution:** Increase system limit or close unused files

---

## Conclusion

This document provides a comprehensive, step-by-step guide for all prerequisites required to execute DTD Phase 1: Database Schema Implementation. By following this guide, you will have:

1. All required third-party tools installed and configured
2. All environment variables set up for local and production
3. All platform accounts registered and verified
4. Directory structure organized for implementation
5. Troubleshooting resources for common issues

**Next Step:** Begin database schema implementation by creating the first migration file: `supabase/migrations/001_enums.sql`

---

**Document Version:** 1.0  
**Date:** 2025-12-25  
**Status:** 🟢 Ready for Implementation  
**Owner:** Database Schema Architect  
**Next Document:** Database Schema Implementation Execution Plan
