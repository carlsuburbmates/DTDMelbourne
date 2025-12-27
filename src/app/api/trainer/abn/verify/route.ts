// ============================================================================
// DTD: ABN Verification Endpoint (SSOT_FINAL)
// File: src/app/api/trainer/abn/verify/route.ts
// Description: Verify ABN (server-only) and set Verified badge if Active
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAccessToken, isTrainer } from '@/lib/auth';
import { abnVerifyRequestSchema, validateRequestBody } from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors';
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';
import type { AbnVerifyRequest } from '@/types/api';

type AbnLookupResult = {
  status: string;
  verified: boolean;
  raw: unknown | null;
};

async function lookupAbnStatus(abn: string): Promise<AbnLookupResult> {
  const lookupUrl = process.env.ABN_LOOKUP_URL;
  if (!lookupUrl) {
    return { status: 'NotConfigured', verified: false, raw: null };
  }

  const url = new URL(lookupUrl);
  url.searchParams.set('abn', abn);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return { status: 'LookupFailed', verified: false, raw: null };
  }

  const data = await response.json();
  const status =
    (typeof data?.status === 'string' && data.status) ||
    (typeof data?.entity_status === 'string' && data.entity_status) ||
    (typeof data?.EntityStatus === 'string' && data.EntityStatus) ||
    (typeof data?.AbnStatus === 'string' && data.AbnStatus) ||
    'Unknown';

  return {
    status,
    verified: status === 'Active',
    raw: data,
  };
}

/**
 * POST /api/trainer/abn/verify - Verify ABN (server-only)
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.trainer, ip);

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyAccessToken(token);

    if (!isTrainer(user)) {
      throw new ForbiddenError('Only trainers can verify ABN');
    }

    const body = await request.json();
    const validatedBody = validateRequestBody(
      abnVerifyRequestSchema,
      body
    ) as AbnVerifyRequest;

    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id')
      .eq('id', validatedBody.business_id)
      .single();

    if (fetchError || !business) {
      throw new NotFoundError('Business not found');
    }

    if (business.user_id !== user.id) {
      throw new ForbiddenError('You do not own this business');
    }

    const lookup = await lookupAbnStatus(validatedBody.abn);

    const { error: verificationError } = await supabaseAdmin
      .from('abn_verifications')
      .insert({
        business_id: validatedBody.business_id,
        abn: validatedBody.abn,
        status: lookup.status,
        verified: lookup.verified,
        matched_json: lookup.raw,
        checked_at: new Date().toISOString(),
      });

    if (verificationError) {
      throw handleSupabaseError(verificationError);
    }

    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({
        abn: validatedBody.abn,
        abn_verified: lookup.verified,
      })
      .eq('id', validatedBody.business_id);

    if (updateError) {
      throw handleSupabaseError(updateError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          verified: lookup.verified,
          status: lookup.status,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
      {
        status: 200,
        headers: {
          ...formatRateLimitHeaders(rateLimitResult),
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const apiError = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      formatErrorResponse(apiError as any, apiError.message || 'Failed to verify ABN'),
      {
        status:
          apiError instanceof UnauthorizedError ||
          apiError instanceof ForbiddenError ||
          apiError instanceof NotFoundError
            ? 401
            : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
