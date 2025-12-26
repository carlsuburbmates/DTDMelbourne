// ============================================================================
// DTD Phase 2: API Contract - MFA Authentication
// File: src/lib/auth.ts
// Description: Admin TOTP and Trainer OTP authentication
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { authenticator } from 'otplib';
import crypto from 'crypto';
import type { Database } from '../types/database';

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

// ============================================================================
// TYPES
// ============================================================================

/**
 * User session
 */
export interface UserSession {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'trainer' | 'user';
  };
  access_token: string;
  refresh_token?: string;
  requires_mfa?: boolean;
  mfa_method?: 'totp' | 'otp';
}

/**
 * MFA setup result
 */
export interface MfaSetupResult {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

/**
 * MFA verification result
 */
export interface MfaVerificationResult {
  success: boolean;
  message: string;
}

// ============================================================================
// TOTP AUTHENTICATION (Admin)
// ============================================================================

/**
 * Generate TOTP secret for admin
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate TOTP QR code URL
 */
export function generateTotpQrCodeUrl(secret: string, email: string): string {
  return authenticator.keyuri(email, 'Dog Trainers Directory', secret);
}

/**
 * Generate backup codes for TOTP
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

/**
 * Verify TOTP code
 */
export function verifyTotpCode(secret: string, token: string): boolean {
  return authenticator.verify({
    secret,
    token,
    window: 2, // Allow 2 time steps before and after
  });
}

/**
 * Setup TOTP for admin user
 */
export async function setupAdminTotp(userId: string): Promise<MfaSetupResult> {
  const secret = generateTotpSecret();
  const backupCodes = generateBackupCodes();
  const qrCodeUrl = generateTotpQrCodeUrl(secret, `admin-${userId}`);

  // Store secret and backup codes in database
  const { error } = await supabaseAdmin
    .from('user_mfa')
    .insert({
      user_id: userId,
      method: 'totp',
      secret: secret,
      backup_codes: backupCodes,
      enabled: false,
    });

  if (error) {
    throw new Error('Failed to setup TOTP');
  }

  return {
    secret,
    qr_code_url: qrCodeUrl,
    backup_codes: backupCodes,
  };
}

/**
 * Verify and enable TOTP for admin user
 */
export async function verifyAndEnableAdminTotp(
  userId: string,
  code: string
): Promise<MfaVerificationResult> {
  // Get user's TOTP secret
  const { data: mfaData, error: fetchError } = await supabaseAdmin
    .from('user_mfa')
    .select('*')
    .eq('user_id', userId)
    .eq('method', 'totp')
    .single();

  if (fetchError || !mfaData) {
    return {
      success: false,
      message: 'TOTP not setup for this user',
    };
  }

  // Verify code
  const isValid = verifyTotpCode(mfaData.secret, code);

  if (!isValid) {
    return {
      success: false,
      message: 'Invalid TOTP code',
    };
  }

  // Enable TOTP
  const { error: updateError } = await supabaseAdmin
    .from('user_mfa')
    .update({ enabled: true })
    .eq('user_id', userId)
    .eq('method', 'totp');

  if (updateError) {
    return {
      success: false,
      message: 'Failed to enable TOTP',
    };
  }

  return {
    success: true,
    message: 'TOTP enabled successfully',
  };
}

/**
 * Verify TOTP during login
 */
export async function verifyAdminTotpLogin(
  userId: string,
  code: string
): Promise<MfaVerificationResult> {
  // Get user's TOTP secret
  const { data: mfaData, error: fetchError } = await supabaseAdmin
    .from('user_mfa')
    .select('*')
    .eq('user_id', userId)
    .eq('method', 'totp')
    .eq('enabled', true)
    .single();

  if (fetchError || !mfaData) {
    return {
      success: false,
      message: 'TOTP not enabled for this user',
    };
  }

  // Verify code
  const isValid = verifyTotpCode(mfaData.secret, code);

  if (!isValid) {
    // Check backup codes
    const backupCodes = mfaData.backup_codes as string[];
    const backupIndex = backupCodes.indexOf(code);

    if (backupIndex === -1) {
      return {
        success: false,
        message: 'Invalid TOTP code',
      };
    }

    // Remove used backup code
    const updatedBackupCodes = [...backupCodes];
    updatedBackupCodes.splice(backupIndex, 1);

    await supabaseAdmin
      .from('user_mfa')
      .update({ backup_codes: updatedBackupCodes })
      .eq('user_id', userId)
      .eq('method', 'totp');
  }

  return {
    success: true,
    message: 'TOTP verified successfully',
  };
}

/**
 * Disable TOTP for admin user
 */
export async function disableAdminTotp(
  userId: string,
  code: string
): Promise<MfaVerificationResult> {
  // Verify code before disabling
  const verification = await verifyAdminTotpLogin(userId, code);

  if (!verification.success) {
    return verification;
  }

  // Disable TOTP
  const { error } = await supabaseAdmin
    .from('user_mfa')
    .update({ enabled: false })
    .eq('user_id', userId)
    .eq('method', 'totp');

  if (error) {
    return {
      success: false,
      message: 'Failed to disable TOTP',
    };
  }

  return {
    success: true,
    message: 'TOTP disabled successfully',
  };
}

// ============================================================================
// OTP AUTHENTICATION (Trainer)
// ============================================================================

/**
 * Generate OTP code for trainer
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate OTP expiry time (5 minutes from now)
 */
export function generateOtpExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 5);
  return expiry;
}

/**
 * Send OTP via email (placeholder - implement with email service)
 */
async function sendOtpEmail(email: string, code: string): Promise<void> {
  // TODO: Implement email sending logic
  // This is a placeholder - integrate with your email service
  console.log(`Sending OTP to ${email}: ${code}`);
}

/**
 * Send OTP via SMS (placeholder - implement with SMS service)
 */
async function sendOtpSms(phone: string, code: string): Promise<void> {
  // TODO: Implement SMS sending logic
  // This is a placeholder - integrate with your SMS service
  console.log(`Sending OTP to ${phone}: ${code}`);
}

/**
 * Setup OTP for trainer user
 */
export async function setupTrainerOtp(userId: string, method: 'email' | 'sms'): Promise<void> {
  const { error } = await supabaseAdmin
    .from('user_mfa')
    .insert({
      user_id: userId,
      method: 'otp',
      otp_method: method,
      enabled: true,
    });

  if (error) {
    throw new Error('Failed to setup OTP');
  }
}

/**
 * Send OTP to trainer
 */
export async function sendTrainerOtp(userId: string): Promise<void> {
  // Get user's contact info
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('email, phone')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  // Get user's OTP method
  const { data: mfaData, error: mfaError } = await supabaseAdmin
    .from('user_mfa')
    .select('otp_method')
    .eq('user_id', userId)
    .eq('method', 'otp')
    .eq('enabled', true)
    .single();

  if (mfaError || !mfaData) {
    throw new Error('OTP not setup for this user');
  }

  // Generate OTP
  const code = generateOtpCode();
  const expiry = generateOtpExpiry();

  // Store OTP in database
  const { error: storeError } = await supabaseAdmin
    .from('otp_codes')
    .insert({
      user_id: userId,
      code: code,
      expires_at: expiry.toISOString(),
    });

  if (storeError) {
    throw new Error('Failed to store OTP');
  }

  // Send OTP
  if (mfaData.otp_method === 'email' && user.email) {
    await sendOtpEmail(user.email, code);
  } else if (mfaData.otp_method === 'sms' && user.phone) {
    await sendOtpSms(user.phone, code);
  }
}

/**
 * Verify OTP for trainer
 */
export async function verifyTrainerOtp(
  userId: string,
  code: string
): Promise<MfaVerificationResult> {
  // Get latest OTP code
  const { data: otpData, error: fetchError } = await supabaseAdmin
    .from('otp_codes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !otpData) {
    return {
      success: false,
      message: 'No OTP found',
    };
  }

  // Check if OTP is expired
  if (new Date(otpData.expires_at) < new Date()) {
    return {
      success: false,
      message: 'OTP has expired',
    };
  }

  // Verify code
  if (otpData.code !== code) {
    return {
      success: false,
      message: 'Invalid OTP code',
    };
  }

  // Mark OTP as used
  await supabaseAdmin
    .from('otp_codes')
    .update({ used: true })
    .eq('id', otpData.id);

  return {
    success: true,
    message: 'OTP verified successfully',
  };
}

/**
 * Disable OTP for trainer user
 */
export async function disableTrainerOtp(userId: string): Promise<MfaVerificationResult> {
  const { error } = await supabaseAdmin
    .from('user_mfa')
    .update({ enabled: false })
    .eq('user_id', userId)
    .eq('method', 'otp');

  if (error) {
    return {
      success: false,
      message: 'Failed to disable OTP',
    };
  }

  return {
    success: true,
    message: 'OTP disabled successfully',
  };
}

// ============================================================================
// AUTHENTICATION FLOW
// ============================================================================

/**
 * Login user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<UserSession> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Get user role
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User not found');
  }

  // Check if MFA is required
  const { data: mfaData } = await supabaseAdmin
    .from('user_mfa')
    .select('method')
    .eq('user_id', data.user.id)
    .eq('enabled', true)
    .single();

  const requiresMfa = !!mfaData;

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      role: userData.role as 'admin' | 'trainer' | 'user',
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    requires_mfa: requiresMfa,
    mfa_method: mfaData?.method as 'totp' | 'otp' | undefined,
  };
}

/**
 * Complete MFA login
 */
export async function completeMfaLogin(
  userId: string,
  code: string,
  method: 'totp' | 'otp'
): Promise<UserSession> {
  let verification: MfaVerificationResult;

  if (method === 'totp') {
    verification = await verifyAdminTotpLogin(userId, code);
  } else {
    verification = await verifyTrainerOtp(userId, code);
  }

  if (!verification.success) {
    throw new Error(verification.message);
  }

  // Get user session
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('Failed to get user session');
  }

  // Get user role
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    throw new Error('User not found');
  }

  return {
    user: {
      id: userId,
      email: data.user.email!,
      role: userData.role as 'admin' | 'trainer' | 'user',
    },
    access_token: data.session?.access_token || '',
    refresh_token: data.session?.refresh_token,
  };
}

/**
 * Logout user
 */
export async function logoutUser(refreshToken?: string): Promise<void> {
  if (refreshToken) {
    await supabase.auth.signOut();
  } else {
    await supabase.auth.signOut();
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<UserSession> {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Get user role
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User not found');
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      role: userData.role as 'admin' | 'trainer' | 'user',
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}

/**
 * Get current user from session
 */
export async function getCurrentUser(accessToken: string): Promise<UserSession['user']> {
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error('Invalid session');
  }

  // Get user role
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User not found');
  }

  return {
    id: data.user.id,
    email: data.user.email!,
    role: userData.role as 'admin' | 'trainer' | 'user',
  };
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Verify JWT token
 */
export async function verifyAccessToken(token: string): Promise<UserSession['user']> {
  try {
    return await getCurrentUser(token);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: UserSession['user'], role: string): boolean {
  return user.role === role;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: UserSession['user']): boolean {
  return user.role === 'admin';
}

/**
 * Check if user is trainer
 */
export function isTrainer(user: UserSession['user']): boolean {
  return user.role === 'trainer';
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export {
  generateTotpSecret,
  generateTotpQrCodeUrl,
  generateBackupCodes,
  verifyTotpCode,
  generateOtpCode,
  generateOtpExpiry,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. TOTP authentication for admin users
// 2. OTP authentication for trainer users
// 3. MFA setup, verification, and disable functions
// 4. Authentication flow with MFA support
// 5. Session management (login, logout, refresh)
// 6. Middleware helpers for route protection
// 7. Based on DOCS/05_DATA_AND_API_CONTRACTS.md and D-013 requirement
// ============================================================================
