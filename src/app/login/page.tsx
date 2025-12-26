'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoginRequest, LoginResponse, MFAVerifyRequest } from '../../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface FormData {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  mfaCode?: string;
}

type LoginStep = 'credentials' | 'mfa';

export default function LoginPage() {
  const router = useRouter();

  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    mfaCode: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [requiresMFA, setRequiresMFA] = useState(false);

  const validateCredentialsForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMFAForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.mfaCode || formData.mfaCode.trim().length === 0) {
      newErrors.mfaCode = 'MFA code is required';
    } else if (!/^\d{6}$/.test(formData.mfaCode)) {
      newErrors.mfaCode = 'Please enter a valid 6-digit code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCredentialsForm()) {
      return;
    }

    try {
      setLoading(true);
      setApiError(null);

      const requestData: LoginRequest = {
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      };

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.data) {
        if (data.data.requiresMFA) {
          setRequiresMFA(true);
          setLoginStep('mfa');
        } else if (data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken || '');
          localStorage.setItem('user', JSON.stringify(data.data.user));
          router.push('/');
        }
      } else if (data.error) {
        setApiError(data.error.message || 'Login failed. Please check your credentials.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      setApiError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMFAForm()) {
      return;
    }

    try {
      setLoading(true);
      setApiError(null);

      const requestData: MFAVerifyRequest = {
        email: formData.email.trim(),
        mfaCode: formData.mfaCode!,
      };

      const response = await fetch(`${API_BASE_URL}/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.data && data.data.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken || '');
        localStorage.setItem('user', JSON.stringify(data.data.user));
        router.push('/');
      } else if (data.error) {
        setApiError(data.error.message || 'Invalid MFA code. Please try again.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      setApiError('Network error. Please check your connection and try again.');
      console.error('MFA verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendMFA = async () => {
    try {
      setLoading(true);
      setApiError(null);

      const response = await fetch(`${API_BASE_URL}/auth/mfa/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setApiError(null);
      } else if (data.error) {
        setApiError(data.error.message || 'Failed to resend code. Please try again.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      setApiError('Network error. Please check your connection and try again.');
      console.error('Resend MFA error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setLoginStep('credentials');
    setRequiresMFA(false);
    setFormData(prev => ({
      ...prev,
      mfaCode: '',
    }));
    setErrors({});
    setApiError(null);
  };

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-surface-off_white">
        {/* Header Section */}
        <section className="py-[48px] bg-white border-b border-neutral-200">
          <Container>
            <h1 className="text-[32px] md:text-[40px] font-bold text-neutral-900 text-center mb-[16px]">
              {loginStep === 'credentials' ? 'Sign In' : 'Verify Your Identity'}
            </h1>
            <p className="text-[16px] text-neutral-600 text-center max-w-[600px] mx-auto">
              {loginStep === 'credentials'
                ? 'Welcome back! Sign in to access your account.'
                : 'Enter the 6-digit code sent to your email to complete sign in.'}
            </p>
          </Container>
        </section>

        {/* Login Form */}
        <section className="py-[48px]">
          <Container>
            <div className="max-w-[500px] mx-auto">
              <Card>
                {loginStep === 'credentials' ? (
                  <>
                    <h2 className="text-[24px] font-semibold text-neutral-900 mb-[32px]">
                      Enter Your Credentials
                    </h2>

                    {apiError && (
                      <div className="mb-[24px] p-[16px] bg-semantic-error_light rounded-[8px]">
                        <p className="text-[14px] font-medium text-semantic-error" role="alert">
                          {apiError}
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleCredentialsSubmit} noValidate>
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

                      {/* Password Field */}
                      <Input
                        id="password"
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        error={errors.password}
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                      />

                      {/* Remember Me Checkbox */}
                      <div className="mb-[24px] flex items-center">
                        <input
                          id="rememberMe"
                          type="checkbox"
                          checked={formData.rememberMe}
                          onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                          className="w-[20px] h-[20px] rounded-[4px] border-2 border-neutral-300 focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                          aria-label="Remember me"
                        />
                        <label htmlFor="rememberMe" className="ml-[12px] text-[16px] text-neutral-700">
                          Remember me
                        </label>
                      </div>

                      {/* Forgot Password Link */}
                      <div className="mb-[24px] text-right">
                        <Link
                          href="/forgot-password"
                          className="text-[14px] font-medium text-primary-brand hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        state={loading ? 'loading' : 'default'}
                        className="w-full"
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>

                    {/* Register Link */}
                    <div className="text-center mt-[24px]">
                      <p className="text-[14px] text-neutral-600 mb-[8px]">
                        Don't have an account?
                      </p>
                      <Link href="/register" className="text-[16px] font-medium text-primary-brand hover:underline">
                        Create Account
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-[24px] font-semibold text-neutral-900 mb-[32px]">
                      Two-Factor Authentication
                    </h2>

                    {apiError && (
                      <div className="mb-[24px] p-[16px] bg-semantic-error_light rounded-[8px]">
                        <p className="text-[14px] font-medium text-semantic-error" role="alert">
                          {apiError}
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleMFASubmit} noValidate>
                      {/* MFA Code Field */}
                      <div className="mb-[24px]">
                        <label htmlFor="mfaCode" className="block text-[14px] font-medium text-neutral-700 mb-[8px]">
                          Enter 6-Digit Code
                        </label>
                        <input
                          id="mfaCode"
                          type="text"
                          inputMode="numeric"
                          pattern="\d{6}"
                          maxLength={6}
                          value={formData.mfaCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            handleInputChange('mfaCode', value);
                          }}
                          placeholder="000000"
                          className={`w-full h-[48px] px-[16px] rounded-[8px] border-2 bg-white text-[20px] text-center tracking-[8px] font-mono focus:outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand focus:ring-offset-2 ${
                            errors.mfaCode ? 'border-semantic-error' : 'border-neutral-300'
                          }`}
                          required
                          autoComplete="one-time-code"
                          aria-invalid={!!errors.mfaCode}
                          aria-describedby={errors.mfaCode ? 'mfaCode-error' : undefined}
                        />
                        {errors.mfaCode && (
                          <p id="mfaCode-error" className="mt-[8px] text-[14px] text-semantic-error">
                            {errors.mfaCode}
                          </p>
                        )}
                      </div>

                      {/* Resend Code Link */}
                      <div className="mb-[24px] text-center">
                        <button
                          type="button"
                          onClick={handleResendMFA}
                          disabled={loading}
                          className="text-[14px] font-medium text-primary-brand hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Resend code
                        </button>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        state={loading ? 'loading' : 'default'}
                        className="w-full"
                      >
                        {loading ? 'Verifying...' : 'Verify'}
                      </Button>

                      {/* Back Button */}
                      <button
                        type="button"
                        onClick={handleBackToCredentials}
                        className="w-full mt-[16px] text-[14px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                      >
                        Back to sign in
                      </button>
                    </form>
                  </>
                )}
              </Card>
            </div>
          </Container>
        </section>

        {/* Information Section */}
        <section className="py-[48px] bg-white">
          <Container>
            <div className="max-w-[800px] mx-auto">
              <h2 className="text-[24px] font-semibold text-neutral-900 mb-[24px]">
                Why Sign In?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px]">
                <div className="text-center">
                  <div className="w-[64px] h-[64px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <span className="text-[32px]">🔒</span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                    Secure Access
                  </h3>
                  <p className="text-[16px] text-neutral-600">
                    Your account is protected with two-factor authentication for enhanced security.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-[64px] h-[64px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <span className="text-[32px]">📊</span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                    Manage Profile
                  </h3>
                  <p className="text-[16px] text-neutral-600">
                    Update your trainer profile, services, and contact information easily.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-[64px] h-[64px] bg-primary-brand_light rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <span className="text-[32px]">💬</span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-neutral-900 mb-[8px]">
                    View Reviews
                  </h3>
                  <p className="text-[16px] text-neutral-600">
                    Monitor and respond to reviews from dog owners who used your services.
                  </p>
                </div>
              </div>
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
            <Link href="/login" className="text-[16px] font-medium text-primary-brand">
              Login
            </Link>
          </div>
        </div>
      </Container>
    </nav>
  );
}
