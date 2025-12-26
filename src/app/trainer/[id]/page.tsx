'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '../../../components/layout/Container';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Rating } from '../../../components/ui/Rating';
import { Business, Review, Council, Locality, FeaturedPlacement } from '../../../types/database';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function TrainerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const trainerId = params.id as string;

  const [trainer, setTrainer] = useState<Business | null>(null);
  const [council, setCouncil] = useState<Council | null>(null);
  const [locality, setLocality] = useState<Locality | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [featured, setFeatured] = useState<FeaturedPlacement | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const fetchTrainerProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/trainers/${trainerId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setTrainer(data.data.trainer);
          setCouncil(data.data.council || null);
          setLocality(data.data.locality || null);
          setFeatured(data.data.featured || null);
        } else {
          setError('Failed to load trainer profile');
        }
      } catch (err) {
        setError('An error occurred while loading trainer profile');
        console.error('Error fetching trainer profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerProfile();
  }, [trainerId]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const response = await fetch(`${API_BASE_URL}/trainers/${trainerId}/reviews?page=${reviewPage}&limit=5`);
        const data = await response.json();

        if (data.success && data.data) {
          setReviews(data.data.reviews || []);
          setTotalReviews(data.data.total || 0);
          setHasMoreReviews(data.data.has_more || false);
        } else {
          console.error('Failed to load reviews');
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [trainerId, reviewPage]);

  const handleLoadMoreReviews = () => {
    setReviewPage(prev => prev + 1);
  };

  const handleContact = () => {
    if (trainer?.phone) {
      window.location.href = `tel:${trainer.phone}`;
    }
  };

  const handleEmail = () => {
    if (trainer?.email) {
      window.location.href = `mailto:${trainer.email}`;
    }
  };

  const handleWebsite = () => {
    if (trainer?.website) {
      window.open(trainer.website, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <main id="main-content" className="min-h-screen bg-surface-off_white">
          <Container>
            <div className="py-[80px]">
              <div className="animate-pulse bg-neutral-200 h-[48px] rounded-[8px] mb-[24px]" />
              <div className="animate-pulse bg-neutral-200 h-[300px] rounded-[8px] mb-[24px]" />
              <div className="animate-pulse bg-neutral-200 h-[24px] rounded-[4px] mb-[12px]" />
              <div className="animate-pulse bg-neutral-200 h-[24px] rounded-[4px] w-2/3" />
            </div>
          </Container>
        </main>
      </>
    );
  }

  if (error || !trainer) {
    return (
      <>
        <Navigation />
        <main id="main-content" className="min-h-screen bg-surface-off_white">
          <Container>
            <div className="py-[80px] text-center">
              <h1 className="text-[32px] font-bold text-neutral-900 mb-[16px]">
                {error || 'Trainer Not Found'}
              </h1>
              <p className="text-[16px] text-neutral-600 mb-[32px]">
                {error || 'The trainer you are looking for does not exist or has been removed.'}
              </p>
              <Link href="/search">
                <Button variant="primary">
                  Browse All Trainers
                </Button>
              </Link>
            </div>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-surface-off_white">
        {/* Trainer Header */}
        <section className="py-[48px] bg-white border-b border-neutral-200">
          <Container>
            <div className="flex flex-col lg:flex-row gap-[32px]">
              {/* Trainer Info */}
              <div className="flex-1">
                <div className="flex items-start gap-[16px] mb-[16px]">
                  <div className="flex-1">
                    <h1 className="text-[32px] md:text-[40px] font-bold text-neutral-900 mb-[8px]">
                      {trainer.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-[8px]">
                      {trainer.verified && (
                        <Badge variant="verified">Verified</Badge>
                      )}
                      {trainer.claimed && (
                        <Badge variant="featured">Claimed</Badge>
                      )}
                      {trainer.resource_type && (
                        <Badge variant="new">
                          {trainer.resource_type.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {featured && featured.status === 'active' && (
                    <Badge variant="featured">Featured</Badge>
                  )}
                </div>

                <div className="flex items-center gap-[8px] mb-[16px]">
                  <div className="flex items-center gap-2">
                    <Rating rating={4.5} />
                    <span className="text-[16px] text-neutral-600">
                      ({totalReviews} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-[8px] mb-[24px]">
                  <div className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <span className="font-medium">Location:</span>
                    <span>{locality?.name || council?.name || 'Melbourne'}</span>
                  </div>
                  {trainer.phone && (
                    <div className="flex items-center gap-2 text-[14px] text-neutral-600">
                      <span className="font-medium">Phone:</span>
                      <a
                        href={`tel:${trainer.phone}`}
                        className="text-primary-brand hover:underline"
                        aria-label={`Call ${trainer.name}`}
                      >
                        {trainer.phone}
                      </a>
                    </div>
                  )}
                  {trainer.email && (
                    <div className="flex items-center gap-2 text-[14px] text-neutral-600">
                      <span className="font-medium">Email:</span>
                      <a
                        href={`mailto:${trainer.email}`}
                        className="text-primary-brand hover:underline"
                        aria-label={`Email ${trainer.name}`}
                      >
                        {trainer.email}
                      </a>
                    </div>
                  )}
                </div>

                {trainer.description && (
                  <div className="mb-[24px]">
                    <h2 className="text-[20px] font-semibold text-neutral-900 mb-[12px]">
                      About
                    </h2>
                    <p className="text-[16px] text-neutral-600 leading-relaxed">
                      {trainer.description}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-[16px]">
                  <Button
                    variant="primary"
                    onClick={handleContact}
                    disabled={!trainer.phone}
                    className="flex-1 sm:flex-none"
                  >
                    Call Now
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleEmail}
                    disabled={!trainer.email}
                    className="flex-1 sm:flex-none"
                  >
                    Send Email
                  </Button>
                  {trainer.website && (
                    <Button
                      variant="ghost"
                      onClick={handleWebsite}
                      className="flex-1 sm:flex-none"
                    >
                      Visit Website
                    </Button>
                  )}
                </div>
              </div>

              {/* Contact Card */}
              <Card className="lg:w-[400px]">
                <h3 className="text-[20px] font-semibold text-neutral-900 mb-[16px]">
                  Contact Information
                </h3>
                <div className="space-y-[16px]">
                  {trainer.phone && (
                    <div>
                      <label className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                        Phone
                      </label>
                      <a
                        href={`tel:${trainer.phone}`}
                        className="block text-[16px] text-primary-brand hover:underline"
                        aria-label={`Call ${trainer.name}`}
                      >
                        {trainer.phone}
                      </a>
                    </div>
                  )}
                  {trainer.email && (
                    <div>
                      <label className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                        Email
                      </label>
                      <a
                        href={`mailto:${trainer.email}`}
                        className="block text-[16px] text-primary-brand hover:underline"
                        aria-label={`Email ${trainer.name}`}
                      >
                        {trainer.email}
                      </a>
                    </div>
                  )}
                  {trainer.website && (
                    <div>
                      <label className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                        Website
                      </label>
                      <a
                        href={trainer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[16px] text-primary-brand hover:underline"
                        aria-label={`Visit ${trainer.name} website`}
                      >
                        {trainer.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {trainer.emergency_phone && (
                    <div>
                      <label className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                        Emergency Phone
                      </label>
                      <a
                        href={`tel:${trainer.emergency_phone}`}
                        className="block text-[16px] text-semantic-error hover:underline"
                        aria-label={`Emergency call ${trainer.name}`}
                      >
                        {trainer.emergency_phone}
                      </a>
                    </div>
                  )}
                  {trainer.emergency_hours && (
                    <div>
                      <label className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                        Emergency Hours
                      </label>
                      <p className="text-[16px] text-neutral-600">
                        {trainer.emergency_hours}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </Container>
        </section>

        {/* Services Section */}
        {trainer.service_type_primary || trainer.service_type_secondary?.length || trainer.age_specialties?.length || trainer.behavior_issues?.length ? (
          <section className="py-[48px] bg-surface-off_white">
            <Container>
              <h2 className="text-[24px] font-semibold text-neutral-900 mb-[24px]">
                Services & Specialties
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                {trainer.service_type_primary && (
                  <Card>
                    <h3 className="text-[18px] font-semibold text-neutral-900 mb-[12px]">
                      Primary Service
                    </h3>
                    <p className="text-[16px] text-neutral-600">
                      {trainer.service_type_primary}
                    </p>
                  </Card>
                )}
                {trainer.service_type_secondary && trainer.service_type_secondary.length > 0 && (
                  <Card>
                    <h3 className="text-[18px] font-semibold text-neutral-900 mb-[12px]">
                      Additional Services
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {trainer.service_type_secondary.map((service) => (
                        <span
                          key={service}
                          className="text-[14px] font-medium text-primary-brand bg-surface-off_white px-[8px] py-[4px] rounded-[4px]"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}
                {trainer.age_specialties && trainer.age_specialties.length > 0 && (
                  <Card>
                    <h3 className="text-[18px] font-semibold text-neutral-900 mb-[12px]">
                      Age Specialties
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {trainer.age_specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="text-[14px] font-medium text-neutral-600 bg-surface-off_white px-[8px] py-[4px] rounded-[4px]"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}
                {trainer.behavior_issues && trainer.behavior_issues.length > 0 && (
                  <Card>
                    <h3 className="text-[18px] font-semibold text-neutral-900 mb-[12px]">
                      Behavior Issues
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {trainer.behavior_issues.map((issue) => (
                        <span
                          key={issue}
                          className="text-[14px] font-medium text-neutral-600 bg-surface-off_white px-[8px] py-[4px] rounded-[4px]"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </Container>
          </section>
        ) : null}

        {/* Reviews Section */}
        <section className="py-[48px] bg-white border-t border-neutral-200">
          <Container>
            <div className="flex items-center justify-between mb-[24px]">
              <h2 className="text-[24px] font-semibold text-neutral-900">
                Reviews ({totalReviews})
              </h2>
              <Link href="/search">
                <Button variant="tertiary">
                  Back to Search
                </Button>
              </Link>
            </div>

            {loadingReviews ? (
              <div className="space-y-[16px]">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="h-[150px]">
                    <div className="animate-pulse bg-neutral-200 h-[24px] rounded-[4px] mb-[12px]" />
                    <div className="animate-pulse bg-neutral-200 h-[16px] rounded-[4px] mb-[8px] w-3/4" />
                    <div className="animate-pulse bg-neutral-200 h-[16px] rounded-[4px]" />
                  </Card>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-[48px]">
                <p className="text-[16px] text-neutral-600 mb-[16px]">
                  No reviews yet for this trainer.
                </p>
                <p className="text-[14px] text-neutral-500 mb-[24px]">
                  Be the first to share your experience!
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-[16px] mb-[32px]">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <div className="flex items-start gap-[16px] mb-[12px]">
                        <div className="flex-1">
                          <div className="flex items-center gap-[8px] mb-[8px]">
                            <h3 className="text-[18px] font-semibold text-neutral-900">
                              {review.user_id ? 'Verified Owner' : 'Anonymous'}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Rating rating={review.rating} />
                              <span className="text-[14px] text-neutral-500">
                                {new Date(review.created_at).toLocaleDateString('en-AU', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-[16px] text-neutral-600 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {hasMoreReviews && (
                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      onClick={handleLoadMoreReviews}
                      disabled={loadingReviews}
                      className="w-full sm:w-auto"
                    >
                      {loadingReviews ? 'Loading...' : 'Load More Reviews'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-[48px] bg-primary-brand">
          <Container>
            <div className="max-w-[600px] mx-auto text-center">
              <h2 className="text-[24px] md:text-[32px] font-bold text-white mb-[16px]">
                Ready to Book?
              </h2>
              <p className="text-[16px] text-white opacity-90 mb-[32px]">
                Contact {trainer.name} directly to discuss your dog training needs
              </p>
              <Button
                variant="secondary"
                onClick={handleContact}
                disabled={!trainer.phone}
                className="w-full sm:w-auto"
              >
                Contact Trainer
              </Button>
            </div>
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
            <Link href="/search" className="text-[16px] font-medium text-neutral-600 hover:text-primary-brand transition-colors">
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
