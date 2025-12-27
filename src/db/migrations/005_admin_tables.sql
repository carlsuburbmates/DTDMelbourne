-- Admin Tables Migration
-- This migration creates tables for admin dashboard functionality
-- Version: 005
-- Date: 2025-12-27

-- Admin tasks table
CREATE TABLE IF NOT EXISTS admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainer verifications table
CREATE TABLE IF NOT EXISTS trainer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Featured placements table
CREATE TABLE IF NOT EXISTS featured_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment audits table
CREATE TABLE IF NOT EXISTS payment_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'refunded')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_priority ON admin_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_due_date ON admin_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assigned_to ON admin_tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_trainer_verifications_trainer_id ON trainer_verifications(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_verifications_status ON trainer_verifications(status);

CREATE INDEX IF NOT EXISTS idx_featured_placements_trainer_id ON featured_placements(trainer_id);
CREATE INDEX IF NOT EXISTS idx_featured_placements_status ON featured_placements(status);

CREATE INDEX IF NOT EXISTS idx_payment_audits_booking_id ON payment_audits(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_audits_status ON payment_audits(status);
CREATE INDEX IF NOT EXISTS idx_payment_audits_timestamp ON payment_audits(timestamp);

-- Add comments for documentation
COMMENT ON TABLE admin_tasks IS 'Admin tasks for task management';
COMMENT ON TABLE trainer_verifications IS 'Trainer verification workflow records';
COMMENT ON TABLE featured_placements IS 'Featured placement requests';
COMMENT ON TABLE payment_audits IS 'Payment audit records for revenue tracking';
