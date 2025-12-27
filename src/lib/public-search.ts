import { supabase } from '@/lib/auth';
import { haversineDistanceKm } from '@/lib/geo';
import type { SearchTrainersQuery } from '@/types/api';
import { BadRequestError } from '@/lib/errors';

const TRAINER_RESOURCE_TYPES = ['trainer', 'behaviour_consultant'];

type SuburbRecord = {
  id: string;
  name: string;
  council_id: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
};

type BusinessRecord = Record<string, any>;

function withDistanceFilter(
  businesses: BusinessRecord[],
  suburb: SuburbRecord,
  radiusKm?: number
): BusinessRecord[] {
  if (!radiusKm || !suburb.latitude || !suburb.longitude) {
    return businesses;
  }

  return businesses.filter((business) => {
    const latitude = business?.suburb?.latitude;
    const longitude = business?.suburb?.longitude;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }
    const distance = haversineDistanceKm(
      { latitude: suburb.latitude, longitude: suburb.longitude },
      { latitude, longitude }
    );
    return distance <= radiusKm;
  });
}

function applyCompatibilityFilters(
  query: any,
  ageStage: string,
  behaviourIssue?: string
) {
  let filtered = query.contains('age_specialties', [ageStage]);
  if (behaviourIssue) {
    filtered = filtered.contains('behavior_issues', [behaviourIssue]);
  }
  return filtered;
}

export async function runPublicSearch(params: SearchTrainersQuery) {
  const suburbName = params.suburb.trim();
  if (!suburbName) {
    throw new BadRequestError('Suburb is required');
  }

  const { data: suburb, error: suburbError } = await supabase
    .from('suburbs')
    .select('id, name, council_id, region, latitude, longitude')
    .ilike('name', suburbName)
    .limit(1)
    .maybeSingle<SuburbRecord>();

  if (suburbError) {
    throw new BadRequestError('Failed to resolve suburb');
  }

  if (!suburb) {
    throw new BadRequestError('Suburb not found');
  }

  const nowIso = new Date().toISOString();

  const { data: featuredPlacements } = await supabase
    .from('featured_placements')
    .select('business_id, queue_activated_at, starts_at')
    .eq('council_id', suburb.council_id)
    .eq('status', 'active')
    .gt('ends_at', nowIso)
    .order('queue_activated_at', { ascending: true });

  const featuredIds = featuredPlacements?.map((p) => p.business_id) || [];

  const baseSelect = `
    *,
    council:councils(id, name, region, shire, ux_label),
    suburb:suburbs(id, name, postcode, region, latitude, longitude, ux_label)
  `;

  const featuredResults: BusinessRecord[] = [];
  if (featuredIds.length > 0) {
    let featuredQuery = supabase
      .from('businesses')
      .select(baseSelect)
      .in('id', featuredIds)
      .eq('deleted', false)
      .in('resource_type', TRAINER_RESOURCE_TYPES);
    featuredQuery = applyCompatibilityFilters(
      featuredQuery,
      params.age_stage,
      params.behaviour_issue
    );
    const { data: featuredBusinesses } = await featuredQuery;
    const featuredMap = new Map(
      featuredBusinesses?.map((business) => [business.id, business]) || []
    );
    featuredIds.forEach((id) => {
      const business = featuredMap.get(id);
      if (business) {
        featuredResults.push(business);
      }
    });
  }

  let proQuery = supabase
    .from('businesses')
    .select(baseSelect)
    .eq('council_id', suburb.council_id)
    .eq('tier', 'pro')
    .eq('deleted', false)
    .in('resource_type', TRAINER_RESOURCE_TYPES);
  proQuery = applyCompatibilityFilters(
    proQuery,
    params.age_stage,
    params.behaviour_issue
  );
  const { data: proBusinesses } = await proQuery.order('created_at', {
    ascending: false,
  });

  let basicQuery = supabase
    .from('businesses')
    .select(baseSelect)
    .eq('council_id', suburb.council_id)
    .eq('tier', 'basic')
    .eq('deleted', false)
    .in('resource_type', TRAINER_RESOURCE_TYPES);
  basicQuery = applyCompatibilityFilters(
    basicQuery,
    params.age_stage,
    params.behaviour_issue
  );
  const { data: basicBusinesses } = await basicQuery.order('created_at', {
    ascending: false,
  });

  const featuredIdSet = new Set(featuredIds);
  const proResults = (proBusinesses || []).filter(
    (business) => !featuredIdSet.has(business.id)
  );
  const basicResults = (basicBusinesses || []).filter(
    (business) => !featuredIdSet.has(business.id)
  );

  const combined = [
    ...featuredResults,
    ...proResults,
    ...basicResults,
  ];

  const filtered = withDistanceFilter(combined, suburb, params.radius_km);

  const page = params.page || 1;
  const limit = params.limit || 20;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return {
    results: paged,
    total: filtered.length,
    page,
    limit,
    has_more: start + limit < filtered.length,
    meta: {
      applied_filters: {
        suburb: suburb.name,
        age_stage: params.age_stage,
        behaviour_issue: params.behaviour_issue || null,
        radius_km: params.radius_km || null,
      },
      council: suburb.council_id,
      region: suburb.region,
    },
  };
}
