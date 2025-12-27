// ============================================================================
// DTD Phase 4: Emergency Triage - Emergency Submit Endpoint
// File: src/app/api/v1/emergency/submit/route.ts
// Description: Submit emergency triage with cascade logic
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';
import { emergencyTriageRequestSchema, validateRequestBody } from '@/lib/validation';
import { handleSupabaseError, formatErrorResponse, BadRequestError } from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import { getEmergencyTriageService } from '@/lib/emergency-triage';
import { getEmergencyContactsService } from '@/lib/emergency-contacts';
import type { EmergencyTriageRequest } from '@/types/api';

/**
 * POST /api/v1/emergency/submit - Submit emergency triage
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.emergency, ip);

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      emergencyTriageRequestSchema,
      body
    ) as EmergencyTriageRequest;

    // Get user agent for logging
    const userAgent = request.headers.get('user-agent') || undefined;

    // Submit emergency triage using cascade logic
    const emergencyTriageService = getEmergencyTriageService();
    const triageResult = await emergencyTriageService.submitEmergencyTriage({
      user_message: validatedBody.user_message,
      location: validatedBody.location,
      ip_address: ip,
      user_agent: userAgent,
    });

    // Get emergency contacts based on location and classification
    let emergencyContacts = [];

    if (validatedBody.location?.council_id || validatedBody.location?.suburb_id) {
      const emergencyContactsService = getEmergencyContactsService();
      
      if (validatedBody.location.council_id) {
        emergencyContacts = await emergencyContactsService.getEmergencyContactsByClassification(
          triageResult.classification,
          validatedBody.location.council_id,
          10
        );
      } else if (validatedBody.location.suburb_id) {
        emergencyContacts = await emergencyContactsService.getEmergencyContactsBySuburb(
          validatedBody.location.suburb_id,
          10
        );
      }
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          classification: triageResult.classification,
          recommended_actions: triageResult.recommended_actions,
          emergency_contacts: emergencyContacts,
          triage_id: triageResult.id,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to submit emergency triage'),
      {
        status: apiError instanceof BadRequestError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
