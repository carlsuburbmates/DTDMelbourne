'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Rating } from '../../components/ui/Rating';
import { Input } from '../../components/ui/Input';
import { Business, DogAgeGroup, DogBehaviorIssue, DogServiceType, DogBusinessResourceType, Council, Locality } from '../../types/database';
import { SearchTrainersQuery } from '../../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const AGE_GROUPS: DogAgeGroup[] = [
  'Puppy (0–6 months)',
  'Adolescent (6–18 months)',
  'Adult (1.5–7 years)',
  'Senior (7–10 years)',
  'Any age',
];

const BEHAVIOR_ISSUES: DogBehaviorIssue[] = [
  'Pulling on lead',
  'Separation anxiety',
  'Barking',
  'Aggression',
  'Jumping up on people',
  'Recall issues',
  'Socialisation',
  'Chewing',
  'Digging',
  'House training',
  'Fear/phobias',
  'Other',
];

const SERVICE_TYPES: DogServiceType[] = [
  'Puppy training',
  'Obedience training',
  'Behaviour consultations',
  'Group classes',
  'Private training',
];

const RESOURCE_TYPES: DogBusinessResourceType[] = [
  'trainer',
  'behaviour_consultant',
  'emergency_vet',
  'urgent_care',
  'emergency_shelter',
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [trainers, setTrainers] = useState<Business[]>([]);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [filters, setFilters] = useState<SearchTrainersQuery>({
    search: searchParams.get('search') || '',
    council_id: searchParams.get('council_id') || undefined,
    locality_id: searchParams.get('locality_id') || undefined,
    resource_type: (searchParams.get('resource_type') as DogBusinessResourceType) || undefined,
    age_specialty: (searchParams.get('age_specialty') as DogAgeGroup) || undefined,
    behavior_issue: (searchParams.get('behavior_issue') as DogBehaviorIssue) || undefined,
    service_type: (searchParams.get('service_type') as DogServiceType) || undefined,
    verified: searchParams.get('verified') === 'true',
    claimed: searchParams.get('claimed') === 'true',
    sort_by: searchParams.get('sort_by') || 'name',
    sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc',
    page: 1,
    limit: 20,
  });

  const [selectedCouncil, setSelectedCouncil] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('');

  useEffect(() => {
    const fetchCouncils = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/councils`);
        const data = await response.json();
        if (data.success && data.data) {
          setCouncils(data.data.councils || []);
        }
      } catch (err) {
        console.error('Error fetching councils:', err);
      }
    };

    fetchCouncils();
  }, []);

  useEffect(() => {
    if (selectedCouncil) {
      const fetchLocalities = async () => {
        try {
          setLoadingFilters(true);
          const response = await fetch(`${API_BASE_URL}/suburbs?council_id=${selectedCouncil}`);
          const data = await response.json();
          if (data.success && data.data) {
            setLocalities(data.data.suburbs || []);
          }
        } catch (err) {
          console.error('Error fetching localities:', err);
        } finally {
          setLoadingFilters(false);
        }
      };

      fetchLocalities();
    } else {
      setLocalities([]);
    }
  }, [selectedCouncil]);

  const fetchTrainers = useCallback(async (query: SearchTrainersQuery) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE_URL}/trainers?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data) {
        setTrainers(data.data.trainers || []);
        setTotal(data.data.total || 0);
        setHasMore(data.data.has_more || false);
        setPage(data.data.page || 1);
      } else {
        setError('Failed to load trainers');
      }
    } catch (err) {
      setError('An error occurred while searching for trainers');
      console.error('Error fetching trainers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers(filters);
  }, [filters, fetchTrainers]);

  const handleFilterChange = (key: keyof SearchTrainersQuery, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleSearch = () => {
    fetchTrainers({ ...filters, page: 1 });
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchTrainersQuery = {
      search: '',
      council_id: undefined,
      locality_id: undefined,
      resource_type: undefined,
      age_specialty: undefined,
      behavior_issue: undefined,
      service_type: undefined,
      verified: undefined,
      claimed: undefined,
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 20,
    };
    setFilters(clearedFilters);
    setSelectedCouncil('');
    setSelectedLocality('');
  };

  const handlePageChange = (newPage: number) => {
    fetchTrainers({ ...filters, page: newPage });
  };

  const handleSortChange = (sortBy: string) => {
    const newSortOrder = filters.sort_by === sortBy && filters.sort_order === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy,
      sort_order: newSortOrder,
    }));
  };

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-surface-off_white">
        {/* Search Header */}
        <section className="py-[32px] bg-white border-b border-neutral-200">
          <Container>
            <div className="flex flex-col lg:flex-row gap-[24px]">
              {/* Search Input */}
              <div className="flex-1">
                <Input
                  id="search-input"
                  type="text"
                  placeholder="Search by trainer name or keywords..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="w-full"
                  aria-label="Search trainers"
                />
              </div>

              {/* Search Button */}
              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={loading}
                className="w-full lg:w-auto"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </Container>
        </section>

        {/* Filters Section */}
        <section className="py-[24px] bg-surface-off_white border-b border-neutral-200">
          <Container>
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="text-[20px] font-semibold text-neutral-900">
                Filters
              </h2>
              <Button
                variant="tertiary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px]">
              {/* Council Filter */}
              <div>
                <label htmlFor="council-filter" className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                  Council
                </label>
                <select
                  id="council-filter"
                  value={selectedCouncil}
                  onChange={(e) => {
                    setSelectedCouncil(e.target.value);
                    handleFilterChange('council_id', e.target.value || undefined);
                    setSelectedLocality('');
                  }}
                  disabled={loadingFilters}
                  className="w-full h-[48px] px-[16px] rounded-[8px] border-2 border-neutral-300 bg-white text-[16px] focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                  aria-label="Filter by council"
                >
                  <option value="">All Councils</option>
                  {councils.map((council) => (
                    <option key={council.id} value={council.id}>
                      {council.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Locality Filter */}
              <div>
                <label htmlFor="locality-filter" className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                  Suburb
                </label>
                <select
                  id="locality-filter"
                  value={selectedLocality}
                  onChange={(e) => handleFilterChange('locality_id', e.target.value || undefined)}
                  disabled={loadingFilters || !selectedCouncil}
                  className="w-full h-[48px] px-[16px] rounded-[8px] border-2 border-neutral-300 bg-white text-[16px] focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  aria-label="Filter by suburb"
                >
                  <option value="">All Suburbs</option>
                  {localities.map((locality) => (
                    <option key={locality.id} value={locality.id}>
                      {locality.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Type Filter */}
              <div>
                <label htmlFor="resource-type-filter" className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                  Resource Type
                </label>
                <select
                  id="resource-type-filter"
                  value={filters.resource_type || ''}
                  onChange={(e) => handleFilterChange('resource_type', e.target.value || undefined)}
                  disabled={loading}
                  className="w-full h-[48px] px-[16px] rounded-[8px] border-2 border-neutral-300 bg-white text-[16px] focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                  aria-label="Filter by resource type"
                >
                  <option value="">All Types</option>
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type Filter */}
              <div>
                <label htmlFor="service-type-filter" className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                  Service Type
                </label>
                <select
                  id="service-type-filter"
                  value={filters.service_type || ''}
                  onChange={(e) => handleFilterChange('service_type', e.target.value || undefined)}
                  disabled={loading}
                  className="w-full h-[48px] px-[16px] rounded-[8px] border-2 border-neutral-300 bg-white text-[16px] focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                  aria-label="Filter by service type"
                >
                  <option value="">All Services</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age Specialty Filter */}
              <div>
                <label htmlFor="age-filter" className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                  Age Specialty
                </label>
                <select
                  id="age-filter"
                  value={filters.age_specialty || ''}
                  onChange={(e) => handleFilterChange('age_specialty', e.target.value || undefined)}
                  disabled={loading}
                  className="w-full h-[48px] px-[16px] rounded-[8px] border-2 border-neutral-300 bg-white text-[16px] focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                  aria-label="Filter by age specialty"
                >
                  <option value="">All Ages</option>
                  {AGE_GROUPS.map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </div>

              {/* Behavior Issue Filter */}
              <div>
                <label htmlFor="behavior-filter" className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                  Behavior Issue
                </label>
                <select
                  id="behavior-filter"
                  value={filters.behavior_issue || ''}
                  onChange={(e) => handleFilterChange('behavior_issue', e.target.value || undefined)}
                  disabled={loading}
                  className="w-full h-[48px] px-[16px] rounded-[8px] border-2 border-neutral-300 bg-white text-[16px] focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                  aria-label="Filter by behavior issue"
                >
                  <option value="">All Issues</option>
                  {BEHAVIOR_ISSUES.map((issue) => (
                    <option key={issue} value={issue}>
                      {issue}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verified Filter */}
              <div className="flex items-center h-[48px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="verified-filter"
                    checked={filters.verified || false}
                    onChange={(e) => handleFilterChange('verified', e.target.checked)}
                    disabled={loading}
                    className="w-[20px] h-[20px] rounded-[4px] border-2 border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                    aria-label="Show only verified trainers"
                  />
                  <span className="text-[16px] font-medium text-neutral-700">
                    Verified Only
                  </span>
                </label>
              </div>

              {/* Claimed Filter */}
              <div className="flex items-center h-[48px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="claimed-filter"
                    checked={filters.claimed || false}
                    onChange={(e) => handleFilterChange('claimed', e.target.checked)}
                    disabled={loading}
                    className="w-[20px] h-[20px] rounded-[4px] border-2 border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                    aria-label="Show only claimed profiles"
                  />
                  <span className="text-[16px] font-medium text-neutral-700">
                    Claimed Only
                  </span>
                </label>
              </div>
            </div>
          </Container>
        </section>

        {/* Results Section */}
        <section className="py-[32px]">
          <Container>
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-[24px] gap-[16px]">
              <div>
                <h2 className="text-[24px] font-semibold text-neutral-900 mb-[8px]">
                  {total} {total === 1 ? 'Trainer' : 'Trainers'} Found
                </h2>
                <p className="text-[14px] text-neutral-600">
                  {filters.search && `Searching for "${filters.search}"`}
                  {(filters.council_id || filters.locality_id || filters.resource_type || filters.service_type || filters.age_specialty || filters.behavior_issue || filters.verified || filters.claimed) && ' with filters applied'}
                </p>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-[8px]">
                <label htmlFor="sort-by" className="text-[14px] font-medium text-neutral-700">
                  Sort by:
                </label>
                <select
                  id="sort-by"
                  value={filters.sort_by || 'name'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  disabled={loading}
                  className="h-[40px] px-[12px] rounded-[8px] border-2 border-neutral-300 bg-white text-[14px] focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                  aria-label="Sort results"
                >
                  <option value="name">Name</option>
                  <option value="rating">Rating</option>
                  <option value="verified">Verified</option>
                  <option value="created_at">Newest</option>
                </select>
                <Button
                  variant="ghost"
                  onClick={() => handleSortChange(filters.sort_by || 'name')}
                  disabled={loading}
                  className="h-[40px] px-[12px]"
                  aria-label={`Toggle sort order: ${filters.sort_order === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {filters.sort_order === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="h-[280px]">
                    <div className="animate-pulse bg-neutral-200 h-[120px] rounded-[8px] mb-[16px]" />
                    <div className="animate-pulse bg-neutral-200 h-[24px] rounded-[4px] mb-[12px]" />
                    <div className="animate-pulse bg-neutral-200 h-[16px] rounded-[4px] w-2/3" />
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-[48px]">
                <p className="text-[16px] text-semantic-error mb-[16px]">{error}</p>
                <Button variant="primary" onClick={handleSearch}>
                  Try Again
                </Button>
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center py-[48px]">
                <p className="text-[16px] text-neutral-600 mb-[16px]">
                  No trainers found matching your criteria.
                </p>
                <Button variant="primary" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px] mb-[32px]">
                  {trainers.map((trainer) => (
                    <Link key={trainer.id} href={`/trainer/${trainer.id}`}>
                      <Card state="hover" className="h-full cursor-pointer">
                        <div className="flex items-start justify-between mb-[16px]">
                          <div className="flex-1">
                            <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                              {trainer.name}
                            </h3>
                            <p className="text-[14px] text-neutral-600 mb-[8px]">
                              {trainer.locality?.name || trainer.council?.name || 'Melbourne'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {trainer.resource_type && (
                                <Badge variant="new">
                                  {trainer.resource_type.replace(/_/g, ' ')}
                                </Badge>
                              )}
                              {trainer.verified && (
                                <Badge variant="verified">Verified</Badge>
                              )}
                              {trainer.claimed && (
                                <Badge variant="featured">Claimed</Badge>
                              )}
                            </div>
                            </div>
                          </div>
                        </div>

                        {trainer.description && (
                          <p className="text-[14px] text-neutral-600 line-clamp-2 mb-[16px]">
                            {trainer.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-[16px]">
                          {trainer.service_type_primary && (
                            <span className="text-[12px] font-medium text-primary-brand bg-surface-off_white px-[8px] py-[4px] rounded-[4px]">
                              {trainer.service_type_primary}
                            </span>
                          )}
                          {trainer.age_specialties?.slice(0, 2).map((specialty) => (
                            <span key={specialty} className="text-[12px] font-medium text-neutral-600 bg-surface-off_white px-[8px] py-[4px] rounded-[4px]">
                              {specialty}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-[16px] border-t border-neutral-200">
                          <div className="flex items-center gap-2">
                            <Rating rating={4.5} />
                            <span className="text-[14px] text-neutral-600">
                              (12 reviews)
                            </span>
                          </div>
                          <span className="text-[14px] font-medium text-primary-brand">
                            View Profile
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {hasMore && (
                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      Load More Trainers
                    </Button>
                  </div>
                )}
              </>
            )}
          </Container>
        </section>
      </main>
    </>
  );
}

function Navigation() {
  return (
    <nav className="bg-white border-b border-neutral-200 shadow-subtle">
      <Container>
        <div className="flex items-center justify-between h-[64px]">
          <Link href="/" className="text-[20px] font-bold text-primary-brand">
            Dog Trainers Directory
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/search" className="text-[16px] font-medium text-primary-brand">
              Find Trainers
            </Link>
            <Link href="/register" className="text-[16px] font-medium text-neutral-600 hover:text-primary-brand transition-colors">
              Register
            </Link>
            <Link href="/login" className="text-[16px] font-medium text-neutral-600 hover:text-primary-brand transition-colors">
              Login
            </Link>
          </div>
        </div>
      </Container>
    </nav>
  );
}
