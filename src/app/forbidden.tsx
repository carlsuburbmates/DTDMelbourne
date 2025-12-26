'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/**
 * 403 Forbidden Page
 * 
 * Displays when a user attempts to access a resource without proper authorization.
 * Uses design system tokens for consistent styling.
 */
export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FEF3C7]">
            <svg
              className="w-12 h-12 text-[#F59E0B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-[80px] font-bold text-[#0A0A0A] leading-none mb-4">
          403
        </h1>

        {/* Error Title */}
        <h2 className="text-[24px] font-semibold text-[#0A0A0A] mb-3">
          Access denied
        </h2>

        {/* Error Message */}
        <p className="text-[16px] text-[#64748B] mb-8 leading-relaxed">
          You don't have permission to access this resource. Please log in or contact an administrator if you believe this is an error.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button variant="primary">
              Log in
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">
              Go to homepage
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-[#E2E8F0]">
          <p className="text-[14px] text-[#64748B] mb-4">
            Need help?
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
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
      </div>
    </div>
  );
}
