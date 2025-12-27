/**
 * SocialShare component for Dog Trainers Directory
 * Implements social sharing using Web Share API
 */

'use client';

import React, { useState } from 'react';

interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
}

export default function SocialShare({ title, text, url }: SocialShareProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async () => {
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
          setShowFallback(true);
        }
      }
    } else {
      // Fallback to manual sharing options
      setShowFallback(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please try again.');
    }
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const shareByEmail = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="social-share">
      <button
        type="button"
        className="share-btn"
        onClick={handleShare}
        aria-label="Share"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77C15.04 16.38 14.5 16 14 16s-1.04.38-1.04.85c0 .47.68.77 1.44.77 1.96 0 .84-.65 1.52-1.44 1.52-.79 0-1.44-.68-1.44-1.52 0-.47.68-.77 1.44-.77 1.96 0 .84.65 1.52 1.44 1.52zM14 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-6 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm0-6c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm6 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm0-6c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm6 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm0 6c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm0 6c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z" />
        </svg>
        Share
      </button>

      {showFallback && (
        <div className="share-fallback" role="dialog" aria-modal="true">
          <div className="share-fallback-content">
            <h3>Share this review</h3>
            <div className="share-options">
              <button
                type="button"
                className="share-option facebook"
                onClick={shareOnFacebook}
                aria-label="Share on Facebook"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                Facebook
              </button>
              <button
                type="button"
                className="share-option twitter"
                onClick={shareOnTwitter}
                aria-label="Share on Twitter"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0 3.94-2.48 10.9 10.9 0 0 1-3.17 1.21 4.92 4.92 0 0 0-8.38-4.48V9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5a4.92 4.92 0 0 0 8.38 4.48 10.9 10.9 0 0 1 3.17-1.21 4.48 4.48 0 0 0 3.94 2.48A10.9 10.9 0 0 1 23 3z" />
                </svg>
                Twitter
              </button>
              <button
                type="button"
                className="share-option linkedin"
                onClick={shareOnLinkedIn}
                aria-label="Share on LinkedIn"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                LinkedIn
              </button>
              <button
                type="button"
                className="share-option email"
                onClick={shareByEmail}
                aria-label="Share via email"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                Email
              </button>
            </div>
            <div className="copy-link">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="share-url-input"
                aria-label="Share URL"
              />
              <button
                type="button"
                className="btn btn-secondary copy-btn"
                onClick={handleCopyLink}
                aria-label="Copy link"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <button
              type="button"
              className="close-btn"
              onClick={() => setShowFallback(false)}
              aria-label="Close share options"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
