import React, { useState } from 'react';
import Link from 'next/link';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Navigation } from '../../components/layout/Navigation';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    category: 'General',
    question: 'What is Dog Trainers Directory?',
    answer: 'Dog Trainers Directory is a platform that connects dog owners across Melbourne with verified, professional dog trainers. We provide a comprehensive directory where you can search for trainers by location, specialty, and services, read genuine reviews from other dog owners, and book with confidence.',
  },
  {
    id: '2',
    category: 'General',
    question: 'Is Dog Trainers Directory free to use?',
    answer: 'Yes! Searching for trainers and viewing profiles is completely free for dog owners. Trainers can list their services on our platform for free, with optional paid featured placement opportunities for increased visibility.',
  },
  {
    id: '3',
    category: 'General',
    question: 'How do I find a dog trainer in my area?',
    answer: 'Simply use our search feature to filter trainers by your suburb, council, or region. You can also filter by service type (puppy training, obedience, behavior consultations, etc.), age specialty, and specific behavior issues. Our advanced search helps you find the perfect match for your dog\'s needs.',
  },
  {
    id: '4',
    category: 'Trainers',
    question: 'How are trainers verified?',
    answer: 'All trainers on our platform undergo a thorough verification process. We check their credentials, certifications, insurance, and experience. Only trainers who meet our strict standards are listed as "Verified" on our platform, giving you peace of mind when choosing a trainer.',
  },
  {
    id: '5',
    category: 'Trainers',
    question: 'What does "Verified" mean?',
    answer: 'A "Verified" badge means the trainer has successfully completed our verification process. This includes confirming their professional credentials, checking their insurance coverage, and verifying their experience. Verified trainers have demonstrated their commitment to professionalism and quality service.',
  },
  {
    id: '6',
    category: 'Trainers',
    question: 'How do I register as a trainer?',
    answer: 'Click the "Register as Trainer" button on our homepage or navigate to /register. You\'ll need to provide your business details, services offered, specialties, and contact information. Once registered, you can claim your profile and start connecting with potential clients.',
  },
  {
    id: '7',
    category: 'Trainers',
    question: 'What is featured placement?',
    answer: 'Featured placement is a paid option that gives your trainer profile increased visibility. Featured trainers appear prominently in search results and on our homepage, helping you stand out and attract more clients. Placement is available per council area, and you can choose the duration of your featured listing.',
  },
  {
    id: '8',
    category: 'Reviews',
    question: 'Are the reviews genuine?',
    answer: 'Absolutely. We have strict moderation to ensure all reviews are from genuine clients who have actually worked with the trainer. We verify review authenticity and remove any suspicious or fraudulent reviews to maintain trust in our platform.',
  },
  {
    id: '9',
    category: 'Reviews',
    question: 'How do I leave a review?',
    answer: 'After working with a trainer, you can leave a review by visiting their profile page and clicking the "Write a Review" button. You\'ll be asked to rate the trainer from 1-5 stars and provide a detailed comment about your experience. Your review will be submitted for moderation before being published.',
  },
  {
    id: '10',
    category: 'Reviews',
    question: 'Can I edit or delete my review?',
    answer: 'Yes, you can edit or delete your review at any time. Simply visit the trainer\'s profile, find your review, and use the edit or delete options. Please note that once a review is moderated and published, any edits will need to go through moderation again.',
  },
  {
    id: '11',
    category: 'Booking',
    question: 'How do I book a trainer?',
    answer: 'Each trainer profile includes their contact information. You can contact them directly via phone or email to discuss your needs and arrange a booking. Some trainers may also have a website link where you can book online. We recommend discussing your dog\'s specific needs, training goals, and availability before booking.',
  },
  {
    id: '12',
    category: 'Booking',
    question: 'What should I expect during the first session?',
    answer: 'The first session is typically an assessment where the trainer evaluates your dog\'s behavior, discusses your training goals, and creates a customized training plan. This is also an opportunity for you to ask questions and ensure the trainer is a good fit for you and your dog.',
  },
  {
    id: '13',
    category: 'Services',
    question: 'What types of training services are available?',
    answer: 'Our trainers offer a wide range of services including: Puppy training (0-6 months), Obedience training, Behavior consultations, Group classes, and Private one-on-one training. Many trainers also specialize in specific behavior issues like separation anxiety, aggression, or recall problems.',
  },
  {
    id: '14',
    category: 'Services',
    question: 'How do I know which type of training my dog needs?',
    answer: 'Consider your dog\'s age, current behavior, and your training goals. Puppies benefit from early socialization and basic obedience. Adult dogs with specific behavior issues may need behavior consultations. If you\'re unsure, many trainers offer initial assessments to recommend the best approach for your dog.',
  },
  {
    id: '15',
    category: 'Emergency',
    question: 'What should I do in a dog emergency?',
    answer: 'For immediate medical emergencies, contact your nearest emergency veterinarian. Our platform includes an emergency triage feature that can help you determine the urgency of your situation and provide contact information for emergency vets, urgent care facilities, and emergency shelters in your area.',
  },
  {
    id: '16',
    category: 'Account',
    question: 'How do I create an account?',
    answer: 'Click the "Login" button and select "Register" to create your account. You\'ll need to provide your email, create a password, and enter your phone number. Having an account allows you to save favorite trainers, leave reviews, and manage your trainer profile if you\'re a trainer.',
  },
  {
    id: '17',
    category: 'Account',
    question: 'I forgot my password. What should I do?',
    answer: 'On the login page, click the "Forgot Password" link. Enter your email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password. If you don\'t receive the email within a few minutes, check your spam folder.',
  },
  {
    id: '18',
    category: 'Support',
    question: 'How can I contact customer support?',
    answer: 'You can reach our support team by emailing support@dogtrainersdirectory.com.au or by using the contact form on our website. We typically respond within 1-2 business days. For urgent matters, please include "Urgent" in your subject line.',
  },
  {
    id: '19',
    category: 'Support',
    question: 'What areas do you cover?',
    answer: 'We currently cover the entire Melbourne metropolitan area, including all councils and suburbs. Our directory includes trainers from Inner City, Northern, Eastern, South Eastern, and Western regions. If you don\'t find a trainer in your specific area, try expanding your search to nearby suburbs.',
  },
  {
    id: '20',
    category: 'Support',
    question: 'How do I report an issue with a trainer or review?',
    answer: 'If you encounter any issues with a trainer or believe a review violates our guidelines, please contact us immediately through our support channels. We take all reports seriously and will investigate promptly. Your feedback helps us maintain a safe and trustworthy platform for everyone.',
  },
];

const categories = Array.from(new Set(faqData.map(item => item.category)));

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-surface-off_white">
        {/* Hero Section */}
        <section className="py-[80px] md:py-[120px] bg-white">
          <Container>
            <div className="max-w-[800px] mx-auto text-center">
              <h1 className="text-[32px] md:text-[48px] font-bold text-neutral-900 leading-tight mb-[24px]">
                Frequently Asked Questions
              </h1>
              <p className="text-[16px] md:text-[18px] text-neutral-600 leading-relaxed mb-[32px]">
                Find answers to common questions about our platform, trainers, and services. 
                Can't find what you're looking for? Feel free to contact us.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-[600px] mx-auto mb-[32px]">
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[48px] px-[16px] rounded-[8px] border-2 border-neutral-300 focus:border-primary-brand focus:outline-none focus:ring-2 focus:ring-primary-brand focus:ring-offset-2 text-[16px]"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-2 mb-[32px]">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`
                    px-[16px] py-[8px] rounded-[8px] text-[14px] font-medium transition-all duration-[200ms]
                    ${selectedCategory === 'All' 
                      ? 'bg-primary-brand text-white' 
                      : 'bg-surface-off_white text-neutral-700 hover:bg-neutral-200'}
                  `}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`
                      px-[16px] py-[8px] rounded-[8px] text-[14px] font-medium transition-all duration-[200ms]
                      ${selectedCategory === category 
                        ? 'bg-primary-brand text-white' 
                        : 'bg-surface-off_white text-neutral-700 hover:bg-neutral-200'}
                    `}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* FAQ Items */}
        <section className="py-[48px]">
          <Container>
            <div className="max-w-[800px] mx-auto space-y-[16px]">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-[48px]">
                  <p className="text-[16px] text-neutral-600 mb-[16px]">
                    No FAQs found matching your search.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                filteredFAQs.map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-start justify-between px-[24px] py-[20px] bg-transparent border-none text-left cursor-pointer"
                      aria-expanded={expandedItems.has(item.id)}
                      aria-controls={`faq-answer-${item.id}`}
                    >
                      <div className="flex-1 pr-4">
                        <span className="inline-block px-[8px] py-[4px] bg-primary-brand_light text-primary-brand text-[12px] font-medium rounded-[4px] mb-[8px]">
                          {item.category}
                        </span>
                        <h3 className="text-[16px] font-semibold text-neutral-900">
                          {item.question}
                        </h3>
                      </div>
                      <span className={`
                        text-[24px] transition-transform duration-[200ms] flex-shrink-0
                        ${expandedItems.has(item.id) ? 'rotate-180' : ''}
                      `}>
                        ▼
                      </span>
                    </button>
                    {expandedItems.has(item.id) && (
                      <div
                        id={`faq-answer-${item.id}`}
                        className="px-[24px] pb-[20px] border-t border-neutral-200"
                      >
                        <p className="text-[16px] text-neutral-600 leading-relaxed pt-[16px]">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </Container>
        </section>

        {/* Still Have Questions Section */}
        <section className="py-[80px] bg-white">
          <Container>
            <div className="max-w-[600px] mx-auto text-center">
              <h2 className="text-[24px] md:text-[32px] font-bold text-neutral-900 mb-[16px]">
                Still Have Questions?
              </h2>
              <p className="text-[16px] text-neutral-600 mb-[32px]">
                Can't find the answer you're looking for? Our support team is here to help. 
                Reach out and we'll get back to you as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button variant="primary" className="w-full sm:w-auto">
                    Contact Support
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Browse Trainers
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
