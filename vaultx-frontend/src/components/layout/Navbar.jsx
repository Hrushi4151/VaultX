import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import { ROUTES } from '../../utils/constants';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing',  href: '#pricing' },
  { label: 'About',    href: '#about' },
];

/**
 * Public navigation bar for landing and auth pages.
 */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group" aria-label="VaultX home">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
              <Shield className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-xl text-primary tracking-tight">VaultX</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary rounded-lg hover:bg-gray-100 transition-all duration-250"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.LOGIN)}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.REGISTER)}>
              Get Started
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-text-muted hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-border animate-slide-up">
            <nav className="flex flex-col gap-1 mb-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text-primary rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => { navigate(ROUTES.LOGIN); setMobileOpen(false); }}>
                Sign In
              </Button>
              <Button variant="primary" onClick={() => { navigate(ROUTES.REGISTER); setMobileOpen(false); }}>
                Get Started Free
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
