'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { RegisterRequest, RegisterResponse } from '../../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: 'admin' | 'trainer' | 'user';
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'trainer',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Name must not exceed 200 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password must not exceed 128 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+61|0)?[4]\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid Australian mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setApiError(null);

      const requestData: RegisterRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
      };

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: RegisterResponse = await response.json();

      if (data.success && data.data) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else if (data.error) {
        setApiError(data.error.message || 'Registration failed. Please try again.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      setApiError('Network error. Please check your connection and try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Navigation />
        <main id="main-content" className="min-h-screen bg-surface-off_white flex items-center justify-center">
          <Container>
            <Card className="max-w-[500px] w-full">
              <div className="text-center mb-[32px]">
                <div className="w-[64px] h-[64px] bg-semantic-success_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                  <span className="text-[32px]">✓</span>
                </div>
                <h1 className="text-[32px] font-bold text-neutral-900 mb-[16px]">
                  Registration Successful!
                </h1>
                <p className="text-[16px] text-neutral-600 mb-[32px]">
                  Your account has been created successfully. You will be redirected to the login page shortly.
                </p>
                <Link href="/login">
                  <Button variant="primary" className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-surface-off_white">
        {/* Header Section */}
        <section className="py-[48px] bg-white border-b border-neutral-200">
          <Container>
            <h1 className="text-[32px] md:text-[40px] font-bold text-neutral-900 text-center mb-[16px]">
              Register as Trainer
            </h1>
            <p className="text-[16px] text-neutral-600 text-center max-w-[600px] mx-auto">
              Create your trainer profile and start connecting with dog owners across Melbourne.
            </p>
          </Container>
        </section>

        {/* Registration Form */}
        <section className="py-[48px]">
          <Container>
            <div className="max-w-[500px] mx-auto">
              <Card>
                <h2 className="text-[24px] font-semibold text-neutral-900 mb-[32px]">
                  Create Your Account
                </h2>

                {apiError && (
                  <div className="mb-[24px] p-[16px] bg-semantic-error_light rounded-[8px]">
                    <p className="text-[14px] font-medium text-semantic-error" role="alert">
                      {apiError}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Name Field */}
                  <Input
                    id="name"
                    label="Full Name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={errors.name}
                    placeholder="Enter your full name"
                    required
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />

                  {/* Email Field */}
                  <Input
                    id="email"
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={errors.email}
                    placeholder="Enter your email address"
                    required
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />

                  {/* Phone Field */}
                  <Input
                    id="phone"
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    error={errors.phone}
                    placeholder="04XX XXX XXX"
                    required
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                  />

                  {/* Password Field */}
                  <Input
                    id="password"
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    error={errors.password}
                    placeholder="Create a strong password"
                    required
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />

                  {/* Confirm Password Field */}
                  <Input
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    error={errors.confirmPassword}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  />

                  {/* Role Field */}
                  <div className="mb-[24px]">
                    <label htmlFor="role" className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                      Account Type
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value as 'admin' | 'trainer' | 'user')}
                      className="w-full h-[48px] px-[16px] rounded-[8px] border-2 border-neutral-300 bg-white text-[16px] focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                      aria-label="Select account type"
                    >
                      <option value="trainer">Trainer</option>
                      <option value="user">Dog Owner</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    state={loading ? 'loading' : 'default'}
                    className="w-full"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>

                {/* Login Link */}
                <div className="text-center mt-[24px]">
                  <p className="text-[14px] text-neutral-600 mb-[8px]">
                    Already have an account?
                  </p>
                  <Link href="/login" className="text-[16px] font-medium text-primary-brand hover:underline">
                    Sign In
                  </Link>
                </div>
              </Card>
            </div>
          </Container>
        </section>

        {/* Information Section */}
        <section className="py-[48px] bg-white">
          <Container>
            <div className="max-w-[800px] mx-auto">
              <h2 className="text-[24px] font-semibold text-neutral-900 mb-[24px]">
                What You'll Get
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px]">
                <div className="text-center">
                  <div className="w-[64px] h-[64px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <span className="text-[32px]">📋</span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                    Profile Visibility
                  </h3>
                  <p className="text-[16px] text-neutral-600">
                    Create a professional profile that dog owners can find and contact you easily.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-[64px] h-[64px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <span className="text-[32px]">⭐</span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                    Reviews & Ratings
                  </h3>
                  <p className="text-[16px] text-neutral-600">
                    Build your reputation with genuine reviews from satisfied dog owners.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-[64px] h-[64px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <span className="text-[32px]">📍</span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                    Featured Placement
                  </h3>
                  <p className="text-[16px] text-neutral-600">
                    Get featured in search results and attract more clients to your business.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Terms Section */}
        <section className="py-[32px] bg-surface-off_white border-t border-neutral-200">
          <Container>
            <div className="max-w-[800px] mx-auto text-center">
              <p className="text-[14px] text-neutral-600">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-primary-brand hover:underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary-brand hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
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
            <Link href="/register" className="text-[16px] font-medium text-primary-brand">
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
