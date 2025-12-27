/**
 * Unit tests for LazyImage component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { LazyImage, TrainerImage, GalleryImage, ThumbnailImage } from './LazyImage';

describe('LazyImage', () => {
  const mockSrc = 'https://example.com/image.jpg';
  const mockAlt = 'Test image';

  it('should render placeholder initially', () => {
    render(<LazyImage src={mockSrc} alt={mockAlt} />);
    
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('should load image when in viewport', async () => {
    render(<LazyImage src={mockSrc} alt={mockAlt} />);
    
    const img = screen.getByRole('img');
    
    // Simulate intersection observer callback
    const observerCallback = (window as any).IntersectionObserver?.mock?.callbacks?.[0];
    if (observerCallback) {
      observerCallback([{ isIntersecting: true }]);
    }
    
    await waitFor(() => {
      expect(img).toHaveClass('opacity-100');
    });
  });

  it('should show error state on load error', async () => {
    render(<LazyImage src={mockSrc} alt={mockAlt} />);
    
    const img = screen.getByRole('img');
    
    // Simulate error
    const errorEvent = new Event('error');
    Object.defineProperty(errorEvent, 'type', { value: 'error' });
    img.dispatchEvent(errorEvent);
    
    await waitFor(() => {
      expect(screen.getByText(/image/i)).toBeInTheDocument();
    });
  });

  it('should call onLoad callback', async () => {
    const onLoad = jest.fn();
    render(<LazyImage src={mockSrc} alt={mockAlt} onLoad={onLoad} />);
    
    const img = screen.getByRole('img');
    
    // Simulate load
    const loadEvent = new Event('load');
    Object.defineProperty(loadEvent, 'type', { value: 'load' });
    img.dispatchEvent(loadEvent);
    
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('should call onError callback', async () => {
    const onError = jest.fn();
    render(<LazyImage src={mockSrc} alt={mockAlt} onError={onError} />);
    
    const img = screen.getByRole('img');
    
    // Simulate error
    const errorEvent = new Event('error');
    Object.defineProperty(errorEvent, 'type', { value: 'error' });
    img.dispatchEvent(errorEvent);
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should apply custom className', () => {
    render(<LazyImage src={mockSrc} alt={mockAlt} className="custom-class" />);
    
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should apply custom style', () => {
    const customStyle = { width: '200px' };
    render(<LazyImage src={mockSrc} alt={mockAlt} style={customStyle} />);
    
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveStyle(customStyle);
  });
});

describe('TrainerImage', () => {
  it('should render with trainer-specific props', () => {
    render(<TrainerImage src="test.jpg" alt="Trainer" />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveClass('rounded-full', 'object-cover');
  });
});

describe('GalleryImage', () => {
  it('should render with gallery-specific props', () => {
    render(<GalleryImage src="test.jpg" alt="Gallery" />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveClass('rounded-lg', 'object-cover');
  });
});

describe('ThumbnailImage', () => {
  it('should render with thumbnail-specific props', () => {
    render(<ThumbnailImage src="test.jpg" alt="Thumbnail" />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveClass('rounded-md', 'object-cover');
  });
});
