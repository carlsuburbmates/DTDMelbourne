// ============================================================================
// DTD Phase 2: API Contract - Register New User
// File: src/app/api/v1/auth/register/route.ts
// Description: Register new user
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/auth';
import { emailSchema } from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  ConflictError,
  BadRequestError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';

/**
 * POST /api/v1/auth/register - Register new user
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.auth, ip);

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      throw new BadRequestError('Email and password are required');
    }

    // Validate email
    const emailValidation = emailSchema.safeParse(body.email);
    if (!emailValidation.success) {
      throw new BadRequestError(emailValidation.error.errors[0].message);
    }

    // Validate password
    if (body.password.length < 8 || body.password.length > 128) {
      throw new BadRequestError('Password must be between 8 and 128 characters');
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .maybeSingle();

    if (existingUser) {
      throw new ConflictError('User already exists with this email');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    });

    if (authError) {
      throw handleSupabaseError(authError);
    }

    // Create user record in database
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: body.email,
        role: 'trainer',
      })
      .select()
      .single();

    if (dbError) {
      throw handleSupabaseError(dbError);
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
      {
        status: 201,
        headers: {
          ...formatRateLimitHeaders(rateLimitResult),
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const apiError = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      formatErrorResponse(apiError as any, apiError.message || 'Failed to register user'),
      {
        status: apiError instanceof ConflictError || apiError instanceof BadRequestError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
