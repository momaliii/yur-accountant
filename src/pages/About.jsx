import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Wallet,
  Target,
  Users,
  Zap,
  Shield,
  Heart,
  Menu,
  X,
  ArrowRight,
  TrendingUp,
  Globe,
  Award,
} from 'lucide-react';
import Button from '../components/ui/Button';

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description: 'We\'re committed to making financial management accessible to everyone, regardless of business size.',
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'Your financial data is encrypted and protected with industry-leading security measures.',
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'We continuously improve our platform with new features based on user feedback.',
  },
  {
    icon: Heart,
    title: 'Customer Focus',
    description: 'Your success is our success. We\'re here to help you achieve your financial goals.',
  },
];

const team = [
  {
    name: 'Our Team',
    role: 'Dedicated Developers',
    description: 'A passionate team of developers, designers, and financial experts working together to build the best financial management platform.',
  },
];

const milestones = [
  { year: '2024', event: 'YUR Finance Launched', description: 'Started with a vision to simplify financial management' },
  { year: '2024', event: '10,000+ Users', description: 'Reached our first major milestone' },
  { year: '2024', event: '$50M+ Tracked', description: 'Helped businesses track over $50 million in revenue' },
];

export default function About() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/landing" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Wallet size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">YUR Finance</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link to="/landing#features" className="text-slate-300 hover:text-white transition-colors">Features</Link>
              <Link to="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
              <Link to="/about" className="text-white font-medium">About</Link>
              <Link to="/login" className="text-slate-300 hover:text-white transition-colors">Sign In</Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900">
            <div className="px-4 py-4 space-y-4">
              <Link to="/landing#features" className="block text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link to="/pricing" className="block text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link to="/about" className="block text-white font-medium" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link to="/login" className="block text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              About YUR Finance
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 leading-relaxed">
            We're on a mission to simplify financial management for businesses of all sizes.
            Our platform empowers you to take control of your finances with powerful, easy-to-use tools.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-white">Our Mission</h2>
              <p className="text-lg text-slate-300 mb-4 leading-relaxed">
                At YUR Finance, we believe that managing your finances shouldn't be complicated.
                We've built a comprehensive platform that makes it easy to track income, manage expenses,
                and make informed financial decisions.
              </p>
              <p className="text-lg text-slate-300 mb-4 leading-relaxed">
                Whether you're a freelancer, small business owner, or growing company, our tools
                are designed to help you stay organized and focused on what matters most—growing your business.
              </p>
              <p className="text-lg text-slate-300 leading-relaxed">
                We're committed to providing you with the best possible experience, backed by
                secure technology and dedicated customer support.
              </p>
            </div>
            <div className="relative">
              <div className="p-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Target size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Our Vision</h3>
                      <p className="text-slate-400">Empowering financial success</p>
                    </div>
                  </div>
                  <div className="h-64 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700">
                    <TrendingUp size={64} className="text-indigo-400/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Our Values</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition-all hover:scale-105 hover:-translate-y-2 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white">By The Numbers</h2>
            <p className="text-xl text-slate-400">Our impact in numbers</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group cursor-default">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 transition-all group-hover:scale-110 group-hover:text-indigo-400">
                10K+
              </div>
              <div className="text-slate-400 group-hover:text-slate-300 transition-colors">Active Users</div>
            </div>
            <div className="group cursor-default">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 transition-all group-hover:scale-110 group-hover:text-indigo-400">
                $50M+
              </div>
              <div className="text-slate-400 group-hover:text-slate-300 transition-colors">Tracked Revenue</div>
            </div>
            <div className="group cursor-default">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 transition-all group-hover:scale-110 group-hover:text-indigo-400">
                99.9%
              </div>
              <div className="text-slate-400 group-hover:text-slate-300 transition-colors">Uptime</div>
            </div>
            <div className="group cursor-default">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 transition-all group-hover:scale-110 group-hover:text-indigo-400">
                24/7
              </div>
              <div className="text-slate-400 group-hover:text-slate-300 transition-colors">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white">Our Journey</h2>
            <p className="text-xl text-slate-400">Key milestones in our growth</p>
          </div>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex gap-6 p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition-all hover:scale-105"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Award size={24} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-indigo-400 font-bold">{milestone.year}</span>
                    <h3 className="text-xl font-semibold text-white">{milestone.event}</h3>
                  </div>
                  <p className="text-slate-400">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Join Us on This Journey</h2>
          <p className="text-xl text-indigo-100 mb-10">
            Be part of a growing community of businesses taking control of their finances.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" icon={ArrowRight} className="text-lg px-8 py-4 hover-lift group">
                <span className="group-hover:translate-x-1 transition-transform inline-block">
                  Start Your Free Trial
                </span>
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 hover-lift">
                View Pricing
              </Button>
            </Link>
          </div>
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
                <li><Link to="/landing#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
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
