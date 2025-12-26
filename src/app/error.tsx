'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/**
 * 500 Internal Server Error Page
 * 
 * Displays when an unexpected server error occurs.
 * Uses design system tokens for consistent styling.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FEE2E2]">
            <svg
              className="w-12 h-12 text-[#EF4444]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-[80px] font-bold text-[#0A0A0A] leading-none mb-4">
          500
        </h1>

        {/* Error Title */}
        <h2 className="text-[24px] font-semibold text-[#0A0A0A] mb-3">
          Something went wrong
        </h2>

        {/* Error Message */}
        <p className="text-[16px] text-[#64748B] mb-8 leading-relaxed">
          We're experiencing technical difficulties. Our team has been notified and is working to fix the issue.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            onClick={() => reset()}
          >
            Try again
          </Button>
          <Link href="/">
            <Button variant="secondary">
              Go to homepage
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-[#E2E8F0]">
          <p className="text-[14px] text-[#64748B] mb-4">
            Still having trouble?
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/search"
              className="text-[14px] text-[#2563EB] hover:text-[#1D4ED8] underline"
            >
              Search trainers
            </Link>
            <span className="text-[#E2E8F0]">•</span>
            <Link
              href="/contact"
              className="text-[14px] text-[#2563EB] hover:text-[#1D4ED8] underline"
            >
              Contact support
            </Link>
            <span className="text-[#E2E8F0]">•</span>
            <Link
              href="/faq"
              className="text-[14px] text-[#2563EB] hover:text-[#1D4ED8] underline"
            >
              Visit FAQ
            </Link>
          </div>
        </div>

        {/* Error Reference (for debugging) */}
        {process.env.NODE_ENV === 'development' && error.digest && (
          <div className="mt-8 p-4 bg-[#F1F5F9] rounded-lg text-left">
            <p className="text-[12px] text-[#64748B] mb-2">
              Error Reference:
            </p>
            <code className="text-[12px] text-[#0A0A0A] break-all">
              {error.digest}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
