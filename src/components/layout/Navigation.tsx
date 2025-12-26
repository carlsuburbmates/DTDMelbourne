import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ds } from '../../design-system.json';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Find Trainers', href: '/search' },
  { label: 'Featured', href: '/featured' },
  { label: 'Emergency', href: '/emergency' },
  { label: 'About', href: '/about' },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const isActive = (href: string): boolean => {
    return pathname === href;
  };

  return (
    <>
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only flex items-center justify-center bg-primary-brand text-white px-[8px] py-[8px] rounded-[4px] font-medium text-[14px]"
      >
        Skip to main content
      </a>

      {/* Mobile Navigation - Hamburger Menu, Fixed Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-elevated z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full h-[48px] flex items-center justify-center px-[24px] bg-transparent border-none"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <div className="flex flex-col gap-1">
            <span className={`w-[24px] h-[2px] bg-neutral-600 rounded-full transition-all duration-[200ms] ease-out-expo ${isMobileMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
            <span className="text-[16px] font-medium text-neutral-700">Menu</span>
          </div>
        </button>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="fixed bottom-[48px] left-0 right-0 bg-white border-t border-neutral-200 shadow-elevated z-40">
            <div className="max-w-[768px] mx-auto py-[16px]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3
                    px-[24px]
                    py-[16px]
                    text-[16px]
                    font-medium
                    text-neutral-700
                    hover:bg-surface-off_white
                    hover:text-neutral-900
                    active:bg-surface-off_white
                    active:text-neutral-900
                    transition-all
                    duration-[200ms]
                    ease-out-expo
                    ${isActive(item.href) ? 'bg-surface-off_white text-neutral-900' : ''}
                  `}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.icon && <span className="text-[20px]">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Desktop Navigation - Horizontal, Sticky Top */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 shadow-subtle z-50">
        <div className="max-w-[1200px] mx-auto px-[24px]">
          <div className="flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2
                  px-[16px]
                  py-[16px]
                  text-[16px]
                  font-medium
                  text-neutral-600
                  hover:text-primary-brand
                  active:text-primary-brand
                  transition-all
                  duration-[200ms]
                  ease-out-expo
                  ${isActive(item.href) ? 'text-primary-brand' : ''}
                `}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.icon && <span className="text-[20px]">{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};
