import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/**
 * 404 Not Found Page
 * 
 * Displays when a user navigates to a non-existent route.
 * Uses design system tokens for consistent styling.
 */
export default function NotFound() {
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-[80px] font-bold text-[#0A0A0A] leading-none mb-4">
          404
        </h1>

        {/* Error Title */}
        <h2 className="text-[24px] font-semibold text-[#0A0A0A] mb-3">
          Page not found
        </h2>

        {/* Error Message */}
        <p className="text-[16px] text-[#64748B] mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="primary">
              Go to homepage
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-lg border-2 border-[#2563EB] text-[#2563EB] font-medium text-[16px] hover:bg-[#EFF6FF] transition-all duration-200"
          >
            Go back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-[#E2E8F0]">
          <p className="text-[14px] text-[#64748B] mb-4">
            Looking for something specific?
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
              href="/about"
              className="text-[14px] text-[#2563EB] hover:text-[#1D4ED8] underline"
            >
              About us
            </Link>
            <span className="text-[#E2E8F0]">•</span>
            <Link
              href="/contact"
              className="text-[14px] text-[#2563EB] hover:text-[#1D4ED8] underline"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
