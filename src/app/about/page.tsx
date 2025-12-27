import React from 'react';
import Link from 'next/link';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Navigation } from '../../components/layout/Navigation';

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-surface-off_white">
        {/* Hero Section */}
        <section className="py-[80px] md:py-[120px] bg-white">
          <Container>
            <div className="max-w-[800px] mx-auto text-center">
              <h1 className="text-[32px] md:text-[48px] font-bold text-neutral-900 leading-tight mb-[24px]">
                About Dog Trainers Directory
              </h1>
              <p className="text-[16px] md:text-[18px] text-neutral-600 leading-relaxed mb-[32px]">
                We're on a mission to connect dog owners across Melbourne with verified, professional dog trainers. 
                Our platform makes it easy to find, compare, and book the perfect trainer for your furry friend.
              </p>
              <Link href="/search">
                <Button variant="primary">
                  Find a Trainer
                </Button>
              </Link>
            </div>
          </Container>
        </section>

        {/* Mission Section */}
        <section className="py-[80px]">
          <Container>
            <div className="max-w-[1000px] mx-auto">
              <h2 className="text-[24px] md:text-[32px] font-bold text-neutral-900 text-center mb-[48px]">
                Our Mission
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px]">
                <Card className="h-full">
                  <div className="flex items-start gap-4 mb-[16px]">
                    <div className="w-[48px] h-[48px] bg-primary-brand_light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[24px]">🎯</span>
                    </div>
                    <h3 className="text-[20px] font-semibold text-neutral-900">
                      Connect
                    </h3>
                  </div>
                  <p className="text-[16px] text-neutral-600 leading-relaxed">
                    Bridge the gap between dog owners and professional trainers across Melbourne, making it easier than ever to find the right match for your dog's needs.
                  </p>
                </Card>

                <Card className="h-full">
                  <div className="flex items-start gap-4 mb-[16px]">
                    <div className="w-[48px] h-[48px] bg-primary-brand_light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[24px]">✓</span>
                    </div>
                    <h3 className="text-[20px] font-semibold text-neutral-900">
                      Verify
                    </h3>
                  </div>
                  <p className="text-[16px] text-neutral-600 leading-relaxed">
                    Ensure every trainer on our platform is verified for credentials, experience, and professionalism, giving dog owners peace of mind.
                  </p>
                </Card>

                <Card className="h-full">
                  <div className="flex items-start gap-4 mb-[16px]">
                    <div className="w-[48px] h-[48px] bg-primary-brand_light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[24px]">⭐</span>
                    </div>
                    <h3 className="text-[20px] font-semibold text-neutral-900">
                      Empower
                    </h3>
                  </div>
                  <p className="text-[16px] text-neutral-600 leading-relaxed">
                    Provide transparent information through genuine reviews and detailed profiles, empowering dog owners to make informed decisions.
                  </p>
                </Card>

                <Card className="h-full">
                  <div className="flex items-start gap-4 mb-[16px]">
                    <div className="w-[48px] h-[48px] bg-primary-brand_light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[24px]">🤝</span>
                    </div>
                    <h3 className="text-[20px] font-semibold text-neutral-900">
                      Support
                    </h3>
                  </div>
                  <p className="text-[16px] text-neutral-600 leading-relaxed">
                    Support local dog trainers and businesses by providing them with a platform to showcase their services and connect with potential clients.
                  </p>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* Our Story Section */}
        <section className="py-[80px] bg-white">
          <Container>
            <div className="max-w-[800px] mx-auto">
              <h2 className="text-[24px] md:text-[32px] font-bold text-neutral-900 text-center mb-[32px]">
                Our Story
              </h2>
              <div className="space-y-[24px]">
                <p className="text-[16px] text-neutral-600 leading-relaxed">
                  Dog Trainers Directory was born from a simple observation: finding a reliable dog trainer in Melbourne shouldn't be difficult. 
                  As dog owners ourselves, we experienced the frustration of searching through countless websites, making endless phone calls, 
                  and still feeling uncertain about which trainer to choose.
                </p>
                <p className="text-[16px] text-neutral-600 leading-relaxed">
                  We knew there had to be a better way. A platform where you could easily search for trainers in your area, 
                  read genuine reviews from other dog owners, compare services and specialties, and book with clarity—all in one place.
                </p>
                <p className="text-[16px] text-neutral-600 leading-relaxed">
                  Today, we're proud to serve dog owners across Melbourne, connecting them with verified trainers who share our passion 
                  for helping dogs live happy, healthy lives. Whether you're looking for puppy training, behavior consultations, 
                  or specialized services, our directory is here to help you find the perfect match.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Values Section */}
        <section className="py-[80px]">
          <Container>
            <div className="max-w-[1000px] mx-auto">
              <h2 className="text-[24px] md:text-[32px] font-bold text-neutral-900 text-center mb-[48px]">
                Our Values
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px]">
                <div className="text-center">
                  <div className="w-[80px] h-[80px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <span className="text-[40px]">🔒</span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-neutral-900 mb-[12px]">
                    Trust & Transparency
                  </h3>
                  <p className="text-[16px] text-neutral-600">
                    We believe in complete transparency. Every trainer is verified, and all reviews are genuine from real dog owners.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-[80px] h-[80px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <span className="text-[40px]">💙</span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-neutral-900 mb-[12px]">
                    Dog-First Approach
                  </h3>
                  <p className="text-[16px] text-neutral-600">
                    Everything we do is centered around the well-being of dogs. We prioritize trainers who use positive, humane methods.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-[80px] h-[80px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <span className="text-[40px]">🌏</span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-neutral-900 mb-[12px]">
                    Local Community
                  </h3>
                  <p className="text-[16px] text-neutral-600">
                    We're proud to support Melbourne's local dog training community and help connect neighbors with trusted local experts.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Team Section */}
        <section className="py-[80px] bg-white">
          <Container>
            <div className="max-w-[800px] mx-auto text-center">
              <h2 className="text-[24px] md:text-[32px] font-bold text-neutral-900 mb-[24px]">
                Meet the Team
              </h2>
              <p className="text-[16px] text-neutral-600 mb-[48px]">
                We're a passionate team of dog lovers, tech enthusiasts, and community builders dedicated to making dog training accessible to everyone in Melbourne.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[32px]">
                <div className="flex flex-col items-center">
                  <div className="w-[120px] h-[120px] bg-neutral-200 rounded-full flex items-center justify-center mb-[16px]">
                    <span className="text-[48px]">👨‍💻</span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-neutral-900 mb-[4px]">
                    Alex Chen
                  </h3>
                  <p className="text-[14px] text-primary-brand font-medium mb-[8px]">
                    Founder & CEO
                  </p>
                  <p className="text-[14px] text-neutral-600">
                    Passionate about building products that make a real difference in people's lives.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-[120px] h-[120px] bg-neutral-200 rounded-full flex items-center justify-center mb-[16px]">
                    <span className="text-[48px]">👩‍💻</span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-neutral-900 mb-[4px]">
                    Sarah Mitchell
                  </h3>
                  <p className="text-[14px] text-primary-brand font-medium mb-[8px]">
                    Head of Operations
                  </p>
                  <p className="text-[14px] text-neutral-600">
                    Ensuring every trainer on our platform meets our high standards of quality.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-[120px] h-[120px] bg-neutral-200 rounded-full flex items-center justify-center mb-[16px]">
                    <span className="text-[48px]">👨‍🔬</span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-neutral-900 mb-[4px]">
                    James Wilson
                  </h3>
                  <p className="text-[14px] text-primary-brand font-medium mb-[8px]">
                    Lead Developer
                  </p>
                  <p className="text-[14px] text-neutral-600">
                    Building the technology that powers our platform and keeps it running smoothly.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-[80px] bg-primary-brand">
          <Container>
            <div className="max-w-[600px] mx-auto text-center">
              <h2 className="text-[24px] md:text-[32px] font-bold text-white mb-[16px]">
                Join Our Community
              </h2>
              <p className="text-[16px] text-white opacity-90 mb-[32px]">
                Whether you're a dog owner looking for a trainer or a professional trainer looking to connect with clients, we'd love to have you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/search">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Find a Trainer
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
      </main>
    </>
  );
}
