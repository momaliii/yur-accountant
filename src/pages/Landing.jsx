import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Target,
  Shield,
  Check,
  ArrowRight,
  BarChart3,
  Receipt,
  CreditCard,
  Landmark,
  Zap,
  Globe,
  Lock,
  Headphones,
  Menu,
  X,
} from 'lucide-react';
import Button from '../components/ui/Button';
import apiClient from '../services/api/client';

const features = [
  {
    icon: TrendingUp,
    title: 'Income Tracking',
    description: 'Track all your income sources with detailed categorization.',
  },
  {
    icon: TrendingDown,
    title: 'Expense Management',
    description: 'Monitor expenses with recurring payment support.',
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Manage clients with payment tracking and insights.',
  },
  {
    icon: FileText,
    title: 'Invoice Generation',
    description: 'Create professional invoices and track payments.',
  },
  {
    icon: Target,
    title: 'Goal Setting',
    description: 'Set financial goals and track progress visually.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Reports',
    description: 'Generate comprehensive reports with charts.',
  },
];

const benefits = [
  'Save hours of manual bookkeeping',
  'Make data-driven financial decisions',
  'Track business growth over time',
  'Never miss a payment or deadline',
  'Professional invoice generation',
  'Comprehensive financial insights',
];

export default function Landing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [stats, setStats] = useState({ users: 0, revenue: 0, uptime: 0, support: 0 });
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);

  useEffect(() => {
    loadPlans();
    
    // Handle scroll for navbar
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          // Animate stats when visible
          if (entry.target === statsRef.current) {
            animateStats();
          }
        }
      });
    }, observerOptions);

    if (statsRef.current) observer.observe(statsRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (pricingRef.current) observer.observe(pricingRef.current);

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const animateStats = () => {
    const targets = { users: 10000, revenue: 50000000, uptime: 99.9, support: 24 };
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setStats({
        users: Math.floor(targets.users * easeOut),
        revenue: Math.floor(targets.revenue * easeOut),
        uptime: Number((targets.uptime * easeOut).toFixed(1)),
        support: targets.support,
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setStats(targets);
      }
    }, stepDuration);
  };

  const loadPlans = async () => {
    try {
      const data = await apiClient.get('/api/plans');
      if (data?.plans) {
        setPlans(data.plans.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 
          ? 'bg-slate-900/98 backdrop-blur-md border-b border-slate-800 shadow-lg' 
          : 'bg-slate-900/95 backdrop-blur-sm border-b border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Wallet size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">YUR Finance</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors cursor-pointer">Features</a>
              <button 
                onClick={() => navigate('/pricing')} 
                className="text-slate-300 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
              >
                Pricing
              </button>
              <button 
                onClick={() => navigate('/about')} 
                className="text-slate-300 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
              >
                About
              </button>
              <button 
                onClick={() => navigate('/login')} 
                className="text-slate-300 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
              >
                Sign In
              </button>
              <Button 
                size="sm" 
                onClick={() => navigate('/register')}
                className="cursor-pointer"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900">
            <div className="px-4 py-4 space-y-4">
              <a 
                href="#features" 
                className="block text-slate-300 hover:text-white cursor-pointer" 
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <button 
                onClick={() => {
                  navigate('/pricing');
                  setMobileMenuOpen(false);
                }} 
                className="block text-slate-300 hover:text-white cursor-pointer bg-transparent border-none text-left w-full"
              >
                Pricing
              </button>
              <button 
                onClick={() => {
                  navigate('/about');
                  setMobileMenuOpen(false);
                }} 
                className="block text-slate-300 hover:text-white cursor-pointer bg-transparent border-none text-left w-full"
              >
                About
              </button>
              <button 
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }} 
                className="block text-slate-300 hover:text-white cursor-pointer bg-transparent border-none text-left w-full"
              >
                Sign In
              </button>
              <Button 
                size="sm" 
                className="w-full cursor-pointer"
                onClick={() => {
                  navigate('/register');
                  setMobileMenuOpen(false);
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8 animate-fade-in hover:scale-105 transition-transform cursor-default hover:bg-indigo-500/20 hover:border-indigo-500/40">
            <span className="text-sm text-indigo-400 font-medium animate-pulse-badge">✨ New: AI-Powered Financial Insights</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Financial Management
            </span>
            <br />
            <span className="text-white">Made Simple</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Take control of your finances with our comprehensive platform.
            Track income, manage expenses, and grow your business with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight} className="text-lg px-8 py-4 hover-lift group">
                <span className="group-hover:translate-x-1 transition-transform inline-block">Start Free Trial</span>
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 hover-lift hover:bg-slate-800 hover:border-indigo-500/50">
              View Demo
            </Button>
          </div>
          <p className="text-sm text-slate-500">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group cursor-default">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 transition-all group-hover:scale-110 group-hover:text-indigo-400">
                {stats.users.toLocaleString()}+
              </div>
              <div className="text-slate-400 group-hover:text-slate-300 transition-colors">Active Users</div>
            </div>
            <div className="group cursor-default">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 transition-all group-hover:scale-110 group-hover:text-indigo-400">
                ${(stats.revenue / 1000000).toFixed(0)}M+
              </div>
              <div className="text-slate-400 group-hover:text-slate-300 transition-colors">Tracked Revenue</div>
            </div>
            <div className="group cursor-default">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 transition-all group-hover:scale-110 group-hover:text-indigo-400">
                {stats.uptime}%
              </div>
              <div className="text-slate-400 group-hover:text-slate-300 transition-colors">Uptime</div>
            </div>
            <div className="group cursor-default">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 transition-all group-hover:scale-110 group-hover:text-indigo-400">
                {stats.support}/7
              </div>
              <div className="text-slate-400 group-hover:text-slate-300 transition-colors">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Powerful Features</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to manage your finances efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-105 hover:-translate-y-2 cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Why Choose YUR Finance?
              </h2>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Join thousands of businesses that trust YUR Finance to manage their finances.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={16} className="text-green-400" />
                    </div>
                    <span className="text-slate-300 text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative group">
              <div className="p-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform">
                      <BarChart3 size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">Real-time Analytics</h3>
                      <p className="text-slate-400 group-hover:text-slate-300 transition-colors">Track your financial health instantly</p>
                    </div>
                  </div>
                  <div className="h-64 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700 group-hover:border-indigo-500/50 transition-colors relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <BarChart3 size={64} className="text-indigo-400/30 group-hover:text-indigo-400/50 group-hover:scale-110 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" ref={pricingRef} className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Simple Pricing</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <div
                  key={plan._id}
                  className={`relative p-8 rounded-xl border-2 transition-all hover:scale-105 hover:-translate-y-2 cursor-pointer ${
                    plan.isDefault
                      ? 'bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30'
                      : 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/70'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {plan.isDefault && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-400 mb-6 text-sm">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="text-5xl font-bold text-white">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: plan.currency || 'USD',
                          minimumFractionDigits: 0,
                        }).format(plan.price?.monthly || 0)}
                      </span>
                      <span className="text-slate-400">/month</span>
                    </div>
                    {plan.price?.yearly > 0 && (
                      <p className="text-sm text-slate-400">
                        or {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: plan.currency || 'USD',
                        }).format(plan.price.yearly)}/year
                      </p>
                    )}
                    {plan.trialDays > 0 && (
                      <p className="text-sm text-green-400 mt-2 font-medium">
                        {plan.trialDays} days free trial
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 mb-8 min-h-[200px]">
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300 text-sm">
                            {feature.name}
                            {feature.limit && ` (${feature.limit})`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-sm text-center py-8">
                        All core features included
                      </div>
                    )}
                  </div>

                  <Link to="/register" className="block">
                    <Button
                      variant={plan.isDefault ? 'primary' : 'outline'}
                      className="w-full hover-lift group"
                      icon={ArrowRight}
                    >
                      <span className="group-hover:translate-x-1 transition-transform inline-block">Get Started</span>
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p>Plans coming soon...</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join thousands of users who trust YUR Finance for their financial management.
            Start your free trial today.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" icon={ArrowRight} className="text-lg px-8 py-4 hover-lift group">
              <span className="group-hover:translate-x-1 transition-transform inline-block">Start Your Free Trial</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Wallet size={24} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">YUR Finance</span>
              </div>
              <p className="text-slate-400 text-sm">
                Your comprehensive financial management solution.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} YUR Finance. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
