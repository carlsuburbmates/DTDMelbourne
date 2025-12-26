import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Rating } from '../components/ui/Rating';
import { Business } from '../types/database';
import { SearchTrainersQuery } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function HomePage() {
  const [featuredTrainers, setFeaturedTrainers] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedTrainers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/trainers?verified=true&limit=6`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setFeaturedTrainers(data.data.trainers || []);
        } else {
          setError('Failed to load featured trainers');
        }
      } catch (err) {
        setError('An error occurred while loading trainers');
        console.error('Error fetching featured trainers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedTrainers();
  }, []);

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-surface-off_white">
        {/* Hero Section */}
        <section className="py-[80px] md:py-[120px]">
          <Container>
            <div className="max-w-[800px] mx-auto text-center">
              <h1 className="text-[32px] md:text-[48px] font-bold text-neutral-900 leading-tight mb-[24px]">
                Find the Perfect Dog Trainer in Melbourne
              </h1>
              <p className="text-[16px] md:text-[18px] text-neutral-600 leading-relaxed mb-[32px]">
                Connect with verified, professional dog trainers across Melbourne. 
                Browse reviews, compare services, and book with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/search">
                  <Button variant="primary" className="w-full sm:w-auto">
                    Search Trainers
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Register as Trainer
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Featured Trainers Section */}
        <section className="py-[80px]">
          <Container>
            <div className="flex items-center justify-between mb-[32px]">
              <h2 className="text-[24px] md:text-[32px] font-bold text-neutral-900">
                Featured Trainers
              </h2>
              <Link href="/search?verified=true">
                <Button variant="tertiary">
                  View All
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="h-[300px]">
                    <div className="animate-pulse bg-neutral-200 h-[120px] rounded-[8px] mb-[16px]" />
                    <div className="animate-pulse bg-neutral-200 h-[24px] rounded-[4px] mb-[12px]" />
                    <div className="animate-pulse bg-neutral-200 h-[16px] rounded-[4px] w-2/3" />
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-[48px]">
                <p className="text-[16px] text-semantic-error mb-[16px]">{error}</p>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : featuredTrainers.length === 0 ? (
              <div className="text-center py-[48px]">
                <p className="text-[16px] text-neutral-600 mb-[16px]">
                  No featured trainers available at this time.
                </p>
                <Link href="/search">
                  <Button variant="primary">
                    Browse All Trainers
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
                {featuredTrainers.map((trainer) => (
                  <Link key={trainer.id} href={`/trainer/${trainer.id}`}>
                    <Card state="hover" className="h-full cursor-pointer">
                      <div className="flex items-start justify-between mb-[16px]">
                        <div className="flex-1">
                          <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                            {trainer.name}
                          </h3>
                          <p className="text-[14px] text-neutral-600">
                            {trainer.locality?.name || trainer.council?.name || 'Melbourne'}
                          </p>
                        </div>
                        {trainer.verified && (
                          <Badge variant="verified">Verified</Badge>
                        )}
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
            )}
          </Container>
        </section>

        {/* Value Proposition Section */}
        <section className="py-[80px] bg-white">
          <Container>
            <h2 className="text-[24px] md:text-[32px] font-bold text-neutral-900 text-center mb-[48px]">
              Why Choose Our Directory?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px]">
              <div className="text-center">
                <div className="w-[64px] h-[64px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                  <span className="text-[32px]">✓</span>
                </div>
                <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                  Verified Trainers
                </h3>
                <p className="text-[16px] text-neutral-600">
                  All trainers are verified for credentials and experience
                </p>
              </div>
              <div className="text-center">
                <div className="w-[64px] h-[64px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                  <span className="text-[32px]">⭐</span>
                </div>
                <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                  Real Reviews
                </h3>
                <p className="text-[16px] text-neutral-600">
                  Genuine reviews from real dog owners in Melbourne
                </p>
              </div>
              <div className="text-center">
                <div className="w-[64px] h-[64px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                  <span className="text-[32px]">📍</span>
                </div>
                <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                  Local Experts
                </h3>
                <p className="text-[16px] text-neutral-600">
                  Find trainers in your specific Melbourne suburb
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-[80px] bg-primary-brand">
          <Container>
            <div className="max-w-[600px] mx-auto text-center">
              <h2 className="text-[24px] md:text-[32px] font-bold text-white mb-[16px]">
                Ready to Find Your Perfect Trainer?
              </h2>
              <p className="text-[16px] text-white opacity-90 mb-[32px]">
                Search our directory of verified dog trainers across Melbourne
              </p>
              <Link href="/search">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Start Your Search
                </Button>
              </Link>
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
