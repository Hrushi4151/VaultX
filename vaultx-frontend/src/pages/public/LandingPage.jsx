import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Lock, Globe, Users, Search, BarChart2,
  ArrowRight, Check, ChevronDown, Star, Zap,
  FileText, Database, Clock, Award
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { ROUTES } from '../../utils/constants';

// ── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Lock,
    title: 'Military-Grade Encryption',
    description: 'AES-256 encryption at rest and TLS 1.3 in transit. Your documents are always protected.',
  },
  {
    icon: Globe,
    title: 'Access Anywhere',
    description: 'Securely access your documents from any device, anywhere in the world, at any time.',
  },
  {
    icon: Search,
    title: 'Instant Search',
    description: 'Find any document in milliseconds with full-text search across all your files.',
    comingSoon: true,
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share documents and collaborate with your team with fine-grained access control.',
    comingSoon: true,
  },
  {
    icon: BarChart2,
    title: 'Analytics & Insights',
    description: 'Understand your storage usage and document activity with detailed analytics.',
    comingSoon: true,
  },
  {
    icon: FileText,
    title: 'Smart Organization',
    description: 'AI-powered categorization and tagging to keep your documents organized automatically.',
    comingSoon: true,
  },
];

const benefits = [
  'SOC 2 Type II Compliant',
  'GDPR & HIPAA Ready',
  '99.9% Uptime SLA',
  'Zero-knowledge architecture',
  'Audit logs for every action',
  '24/7 Priority Support',
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CTO, FinanceCorp',
    text: 'VaultX transformed how we handle sensitive financial documents. Security and usability in one package.',
    avatar: 'SJ',
  },
  {
    name: 'Marcus Lee',
    role: 'Legal Director, LawFirm LLP',
    text: 'The audit trails and access control features are exactly what our legal team needed. Highly recommended.',
    avatar: 'ML',
  },
  {
    name: 'Priya Sharma',
    role: 'Head of IT, MedTech Inc.',
    text: "HIPAA compliance was our biggest concern. VaultX handled it seamlessly from day one.",
    avatar: 'PS',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individuals getting started',
    features: ['5 GB Storage', '100 Documents', 'Basic encryption', 'Email support'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    description: 'For professionals and small teams',
    features: ['100 GB Storage', 'Unlimited Documents', 'Advanced encryption', 'Priority support', 'Team sharing', 'Audit logs'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: ['Unlimited Storage', 'Custom integrations', 'Dedicated support', 'SSO/SAML', 'Custom SLA', 'On-premise option'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'How secure is VaultX?',
    answer: 'VaultX uses AES-256 encryption at rest and TLS 1.3 in transit. We follow a zero-knowledge architecture, meaning only you can access your encryption keys.',
  },
  {
    question: 'Is VaultX GDPR compliant?',
    answer: 'Yes. VaultX is designed with privacy by default. We offer data residency options and full GDPR compliance with data processing agreements available.',
  },
  {
    question: 'Can I migrate from Google Drive or Dropbox?',
    answer: 'We provide migration tools for Google Drive, Dropbox, and OneDrive. Our team can assist with enterprise migrations.',
  },
  {
    question: 'What file types are supported?',
    answer: 'VaultX supports all common file types including PDF, Word, Excel, images, videos, and more. We also offer OCR for searchable PDFs.',
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes. Our comprehensive REST API allows you to integrate VaultX with your existing workflows and applications.',
  },
];

// ── Components ───────────────────────────────────────────────────────────────

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-text-primary pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-text-muted flex-shrink-0 transition-transform duration-250 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-text-muted leading-relaxed animate-slide-up border-t border-border pt-4">
          {answer}
        </div>
      )}
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-xl" aria-hidden="true" />
      {/* Main card */}
      <div className="relative bg-white rounded-2xl border border-border shadow-modal overflow-hidden">
        {/* Sidebar mockup */}
        <div className="flex">
          <div className="w-48 bg-gray-50 border-r border-border p-3 hidden sm:block">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-bold text-primary">VaultX</span>
            </div>
            {['Dashboard','Documents','Storage','Activity'].map((item, i) => (
              <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 text-xs ${i === 0 ? 'bg-primary/10 text-primary font-medium' : 'text-gray-500'}`}>
                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-gray-300'}`} />
                {item}
              </div>
            ))}
          </div>
          {/* Content mockup */}
          <div className="flex-1 p-4">
            <p className="text-xs font-semibold text-gray-800 mb-3">Dashboard</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: 'Documents', val: '0', color: 'bg-primary/10 text-primary' },
                { label: 'Storage',   val: '0 GB', color: 'bg-accent/10 text-accent' },
              ].map((c) => (
                <div key={c.label} className="bg-gray-50 rounded-xl p-2.5 border border-border">
                  <p className={`text-lg font-bold ${c.color.split(' ')[1]}`}>{c.val}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-border">
              <p className="text-[10px] font-medium text-gray-500 mb-2">Recent Documents</p>
              <div className="flex flex-col gap-1.5">
                {['Q3 Report.pdf','Contract.docx','Budget.xlsx'].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-primary/10 rounded flex items-center justify-center">
                      <FileText className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-[10px] text-gray-600 truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating badges */}
      <div className="absolute -bottom-3 -left-3 bg-white border border-border rounded-xl px-3 py-2 shadow-card hidden lg:flex items-center gap-2">
        <div className="w-6 h-6 bg-success/15 rounded-lg flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-success" />
        </div>
        <span className="text-xs font-medium text-text-primary">AES-256 Encrypted</span>
      </div>
      <div className="absolute -top-3 -right-3 bg-white border border-border rounded-xl px-3 py-2 shadow-card hidden lg:flex items-center gap-2">
        <div className="w-6 h-6 bg-warning/15 rounded-lg flex items-center justify-center">
          <Award className="w-3.5 h-3.5 text-warning" />
        </div>
        <span className="text-xs font-medium text-text-primary">SOC 2 Compliant</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      {/* ── Hero ─────────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/[0.03] to-transparent" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/[0.06] rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-primary/[0.05] rounded-full blur-3xl" />
        </div>

        <div className="container-page py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/8 border border-primary/15 rounded-full mb-6">
                <Zap className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span className="text-xs font-semibold text-primary">Enterprise Document Security</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-primary leading-tight mb-5">
                Your Secure{' '}
                <span className="relative">
                  Digital
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent/60 rounded" aria-hidden="true" />
                </span>{' '}
                Document Vault
              </h1>

              <p className="text-lg text-text-muted leading-relaxed mb-8">
                Manage, secure, and access your documents anywhere. Built for teams
                that demand enterprise-grade security without sacrificing simplicity.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(ROUTES.REGISTER)}
                  rightIcon={ArrowRight}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  Sign In
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4">
                {['SOC 2 Compliant', 'AES-256 Encrypted', 'GDPR Ready'].map((tag) => (
                  <div key={tag} className="flex items-center gap-1.5 text-sm text-text-muted">
                    <Check className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — product mockup */}
            <div className="lg:flex justify-end">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ─────────────────────────────── */}
      <section className="border-y border-border bg-gray-50/60 py-8">
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Documents Secured',   value: '2M+' },
              { label: 'Enterprise Clients',  value: '500+' },
              { label: 'Data Encrypted',      value: '50TB+' },
              { label: 'Uptime Guarantee',    value: '99.9%' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-primary mb-1">{s.value}</p>
                <p className="text-sm text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Everything you need to manage documents securely
            </h2>
            <p className="text-text-muted">
              A complete platform for document management, built with security-first principles
              and designed for enterprise workflows.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`relative card group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250 ${feature.comingSoon ? 'opacity-75' : ''}`}
              >
                {feature.comingSoon && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why VaultX ──────────────────────────────── */}
      <section id="about" className="py-20 bg-gray-50/60">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Why VaultX</p>
              <h2 className="text-3xl font-bold text-text-primary mb-5">
                Security without compromise
              </h2>
              <p className="text-text-muted leading-relaxed mb-8">
                Most document platforms trade security for usability. VaultX was built from
                the ground up to deliver both — enterprise-grade protection with an interface
                your team will actually love using.
              </p>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" aria-hidden="true" />
                    </div>
                    <span className="text-text-primary font-medium">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Visual */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Lock,     label: 'Zero-Trust',  desc: 'Every access request verified' },
                { icon: Clock,    label: 'Always On',   desc: '99.9% guaranteed uptime' },
                { icon: Database, label: 'Redundant',   desc: 'Triple-replicated storage' },
                { icon: Shield,   label: 'Compliant',   desc: 'SOC 2, GDPR, HIPAA' },
              ].map((c) => (
                <div key={c.label} className="card flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <c.icon className="w-4.5 h-4.5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{c.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Screenshots Placeholder ──────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-page text-center">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Product Tour</p>
          <h2 className="text-3xl font-bold text-text-primary mb-4">See VaultX in action</h2>
          <p className="text-text-muted mb-10 max-w-lg mx-auto">
            Screenshots and product demos will be available once the document management module is complete.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {['Document Library', 'Upload & Organize', 'Share & Collaborate'].map((label) => (
              <div key={label} className="aspect-video bg-gray-100 rounded-2xl border border-border flex flex-col items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-gray-300" aria-hidden="true" />
                <span className="text-sm text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────── */}
      <section className="py-20 bg-gray-50/60">
        <div className="container-page">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl font-bold text-text-primary">Trusted by industry leaders</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-sm text-text-muted leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container-page">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl font-bold text-text-primary mb-4">Simple, transparent pricing</h2>
            <p className="text-text-muted max-w-lg mx-auto">No hidden fees. Start free and scale as you grow.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`card flex flex-col ${plan.highlighted ? 'ring-2 ring-primary !border-primary/30 relative' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-5">
                  <p className="font-semibold text-text-primary mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                    {plan.period && <span className="text-sm text-text-muted">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-text-muted mt-1">{plan.description}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-primary">
                      <Check className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  onClick={() => navigate(ROUTES.REGISTER)}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section className="py-20 bg-gray-50/60">
        <div className="container-page max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-text-primary">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────── */}
      <section className="py-20 bg-primary">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start securing your documents today
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            Join thousands of professionals who trust VaultX to protect their most important documents.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="accent"
              size="lg"
              onClick={() => navigate(ROUTES.REGISTER)}
              rightIcon={ArrowRight}
            >
              Get Started Free
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="!text-white !border-white/30 hover:!bg-white/10"
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="bg-white border-t border-border py-12">
        <div className="container-page">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-primary">VaultX</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Your Secure Digital Document Vault. Built for enterprise. Loved by teams.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Security', 'Roadmap'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal',   links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="divider pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} VaultX. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {['Privacy', 'Terms', 'Cookies'].map((l) => (
                <a key={l} href="#" className="text-xs text-text-muted hover:text-text-primary transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
