// ============================================================================
// DTD: Register New User (SSOT_FINAL)
// File: src/app/api/auth/register/route.ts
// Description: Register new trainer account
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
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';

/**
 * POST /api/auth/register - Register new user
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.auth, ip);

    const body = await request.json();
    if (!body.email || !body.password) {
      throw new BadRequestError('Email and password are required');
    }

    const emailValidation = emailSchema.safeParse(body.email);
    if (!emailValidation.success) {
      throw new BadRequestError(emailValidation.error.errors[0].message);
    }

    if (body.password.length < 8 || body.password.length > 128) {
      throw new BadRequestError('Password must be between 8 and 128 characters');
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .maybeSingle();

    if (existingUser) {
      throw new ConflictError('User already exists with this email');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    });

    if (authError || !authData.user) {
      throw handleSupabaseError(authError);
    }

    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: body.email,
        role: 'trainer',
      })
      .select()
      .single();

    if (dbError || !user) {
      throw handleSupabaseError(dbError);
    }

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
        status:
          apiError instanceof ConflictError || apiError instanceof BadRequestError
            ? 400
            : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
