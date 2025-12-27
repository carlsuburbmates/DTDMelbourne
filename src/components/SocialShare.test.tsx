/**
 * Tests for SocialShare component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialShare from './SocialShare';

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  value: jest.fn().mockResolvedValue(undefined),
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render share button', () => {
    render(<SocialShare title="Test" text="Test review" />);
    expect(screen.getByLabelText('Share')).toBeInTheDocument();
  });

  it('should call navigator.share when supported', async () => {
    render(<SocialShare title="Test" text="Test review" />);
    const shareButton = screen.getByLabelText('Share');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Test',
        text: 'Test review',
        url: expect.any(String),
      });
    });
  });

  it('should show fallback when navigator.share is not supported', async () => {
    (navigator.share as jest.Mock).mockRejectedValue(new Error('Not supported'));
    render(<SocialShare title="Test" text="Test review" />);
    const shareButton = screen.getByLabelText('Share');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(screen.getByText('Share this review')).toBeInTheDocument();
    });
  });

  it('should render social media buttons in fallback', async () => {
    (navigator.share as jest.Mock).mockRejectedValue(new Error('Not supported'));
    render(<SocialShare title="Test" text="Test review" />);
    const shareButton = screen.getByLabelText('Share');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('Share via email')).toBeInTheDocument();
    });
  });

  it('should copy link to clipboard', async () => {
    (navigator.share as jest.Mock).mockRejectedValue(new Error('Not supported'));
    render(<SocialShare title="Test" text="Test review" />);
    const shareButton = screen.getByLabelText('Share');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      const copyButton = screen.getByText('Copy Link');
      fireEvent.click(copyButton);
    });
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });
});
