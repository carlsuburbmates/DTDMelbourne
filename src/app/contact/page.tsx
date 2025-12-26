import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Navigation } from '../../components/layout/Navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Name must be less than 200 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = 'Subject must be less than 200 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.trim().length > 2000) {
      newErrors.message = 'Message must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitError(data.error?.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setSubmitError('An error occurred while sending your message. Please try again.');
      console.error('Error submitting contact form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-surface-off_white">
        <Container>
          <div className="max-w-[600px] mx-auto py-[80px]">
            <h1 className="text-[32px] md:text-[40px] font-bold text-neutral-900 mb-[16px]">
              Contact Us
            </h1>
            <p className="text-[16px] text-neutral-600 mb-[48px]">
              Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
            </p>

            {submitSuccess ? (
              <div className="bg-semantic-success_light border border-semantic-success rounded-[12px] p-[24px] mb-[32px]">
                <div className="flex items-start gap-3">
                  <span className="text-[24px]">✓</span>
                  <div>
                    <h2 className="text-[20px] font-semibold text-semantic-success mb-[8px]">
                      Message Sent Successfully
                    </h2>
                    <p className="text-[16px] text-neutral-700">
                      Thank you for reaching out! We've received your message and will respond within 1-2 business days.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="mt-[24px]"
                  onClick={() => setSubmitSuccess(false)}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-[24px]">
                {submitError && (
                  <div className="bg-semantic-error_light border border-semantic-error rounded-[8px] p-[16px]" role="alert">
                    <p className="text-[14px] font-medium text-semantic-error">
                      {submitError}
                    </p>
                  </div>
                )}

                <Input
                  id="name"
                  label="Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Your full name"
                  state={errors.name ? 'error' : 'default'}
                  required
                />

                <Input
                  id="email"
                  type="email"
                  label="Email *"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  placeholder="your.email@example.com"
                  state={errors.email ? 'error' : 'default'}
                  required
                />

                <Input
                  id="subject"
                  label="Subject *"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  error={errors.subject}
                  placeholder="What is this regarding?"
                  state={errors.subject ? 'error' : 'default'}
                  required
                />

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-[14px] font-medium text-neutral-700">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    className={`
                      w-full
                      px-[16px]
                      py-[12px]
                      rounded-[8px]
                      font-medium
                      text-[16px]
                      transition-all
                      duration-[200ms]
                      ease-out-expo
                      focus:outline-none
                      focus:ring-2
                      focus:ring-offset-2
                      focus:ring-primary-brand
                      focus:ring-radius-[4px]
                      ${errors.message ? 'border-2 border-semantic-error' : 'border-2 border-neutral-300 focus:border-primary-brand'}
                    `}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    required
                  />
                  {errors.message && (
                    <p
                      id="message-error"
                      className="text-[14px] font-medium text-semantic-error bg-semantic-error_light rounded-[4px] px-[12px] py-[8px] mt-2"
                      role="alert"
                    >
                      {errors.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  state={isSubmitting ? 'loading' : 'default'}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>

                <p className="text-[14px] text-neutral-500 text-center">
                  By submitting this form, you agree to our{' '}
                  <Link href="/privacy" className="text-primary-brand hover:underline">
                    Privacy Policy
                  </Link>
                  {' '}and{' '}
                  <Link href="/terms" className="text-primary-brand hover:underline">
                    Terms of Service
                  </Link>
                  .
                </p>
              </form>
            )}

            <div className="mt-[64px] pt-[48px] border-t border-neutral-200">
              <h2 className="text-[20px] font-semibold text-neutral-900 mb-[24px]">
                Other Ways to Reach Us
              </h2>
              <div className="space-y-[16px]">
                <div className="flex items-start gap-3">
                  <span className="text-[20px]">📧</span>
                  <div>
                    <p className="text-[14px] font-medium text-neutral-700">Email</p>
                    <a
                      href="mailto:support@dogtrainersdirectory.com.au"
                      className="text-[16px] text-primary-brand hover:underline"
                    >
                      support@dogtrainersdirectory.com.au
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[20px]">📍</span>
                  <div>
                    <p className="text-[14px] font-medium text-neutral-700">Location</p>
                    <p className="text-[16px] text-neutral-600">
                      Melbourne, Victoria, Australia
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[20px]">⏰</span>
                  <div>
                    <p className="text-[14px] font-medium text-neutral-700">Response Time</p>
                    <p className="text-[16px] text-neutral-600">
                      We typically respond within 1-2 business days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
