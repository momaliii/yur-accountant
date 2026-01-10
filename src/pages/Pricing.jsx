import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Wallet,
  Check,
  ArrowRight,
  Zap,
  Shield,
  Headphones,
  Globe,
  TrendingUp,
  Menu,
  X,
  Star,
} from 'lucide-react';
import Button from '../components/ui/Button';
import apiClient from '../services/api/client';

const features = [
  { name: 'Unlimited Income Tracking', included: true },
  { name: 'Unlimited Expense Tracking', included: true },
  { name: 'Client Management', included: true },
  { name: 'Invoice Generation', included: true },
  { name: 'Financial Reports', included: true },
  { name: 'Goal Setting', included: true },
  { name: 'Debt Management', included: true },
  { name: 'Savings Tracker', included: true },
  { name: 'Multi-Currency Support', included: true },
  { name: 'Cloud Sync', included: true },
  { name: 'Mobile App Access', included: true },
  { name: 'Priority Support', included: false },
  { name: 'Advanced Analytics', included: false },
  { name: 'API Access', included: false },
  { name: 'Custom Integrations', included: false },
];

const faqs = [
  {
    question: 'Can I change my plan later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Stripe.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start your trial.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely! You can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data is safe! You can export all your data before canceling, and we\'ll keep it for 30 days in case you want to return.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied, contact us within 30 days for a full refund.',
  },
];

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or yearly

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await apiClient.get('/api/plans');
      console.log('Plans API response:', data);
      if (data?.plans) {
        // Sort: highlighted first, then by sortOrder
        const sortedPlans = data.plans.sort((a, b) => {
          if (a.isHighlighted && !b.isHighlighted) return -1;
          if (!a.isHighlighted && b.isHighlighted) return 1;
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
        console.log('Sorted plans:', sortedPlans);
        setPlans(sortedPlans);
      } else {
        console.warn('No plans found in response:', data);
        setPlans([]);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

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
              <Link to="/pricing" className="text-white font-medium">Pricing</Link>
              <Link to="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
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
              <Link to="/pricing" className="block text-white font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link to="/about" className="block text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link to="/login" className="block text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
            No credit card required.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
              Yearly
              <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Save 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const price = billingCycle === 'yearly' && plan.price?.yearly > 0 
                  ? plan.price.yearly / 12 
                  : plan.price?.monthly || 0;
                const displayPrice = billingCycle === 'yearly' && plan.price?.yearly > 0
                  ? plan.price.yearly
                  : plan.price?.monthly || 0;

                return (
                  <div
                    key={plan._id}
                    className={`relative p-8 rounded-xl border-2 transition-all hover:scale-105 hover:-translate-y-2 ${
                      plan.isHighlighted
                        ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500 scale-105 shadow-lg shadow-yellow-500/30'
                        : plan.isDefault
                          ? 'bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      {plan.isHighlighted && (
                        <div className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-medium rounded-full flex items-center gap-1">
                          <Star size={14} className="fill-white" />
                          Featured
                        </div>
                      )}
                      {plan.isDefault && !plan.isHighlighted && (
                        <div className="px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-full">
                          Most Popular
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-slate-400 mb-6 text-sm min-h-[40px]">{plan.description}</p>
                      <div className="flex items-baseline justify-center gap-2 mb-2">
                        <span className="text-5xl font-bold text-white">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: plan.currency || 'USD',
                            minimumFractionDigits: 0,
                          }).format(displayPrice)}
                        </span>
                        {billingCycle === 'yearly' && plan.price?.yearly > 0 && (
                          <span className="text-slate-400">/year</span>
                        )}
                        {billingCycle === 'monthly' && (
                          <span className="text-slate-400">/month</span>
                        )}
                      </div>
                      {billingCycle === 'yearly' && plan.price?.yearly > 0 && (
                        <p className="text-sm text-slate-400">
                          ${price.toFixed(2)}/month billed annually
                        </p>
                      )}
                      {plan.trialDays > 0 && (
                        <p className="text-sm text-green-400 mt-2 font-medium">
                          {plan.trialDays} days free trial
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 mb-8 min-h-[300px]">
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
                        features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            {feature.included ? (
                              <>
                                <Check size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-300 text-sm">{feature.name}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-600 flex-shrink-0 mt-0.5">×</span>
                                <span className="text-slate-500 text-sm line-through">{feature.name}</span>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <Link 
                      to={`/register?plan=${plan.slug}&billing=${billingCycle}`}
                      className="block"
                    >
                      <Button
                        variant={plan.isDefault ? 'primary' : 'outline'}
                        className="w-full hover-lift group"
                        icon={ArrowRight}
                      >
                        <span className="group-hover:translate-x-1 transition-transform inline-block">
                          Get Started
                        </span>
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p>Plans coming soon...</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white">Compare Plans</h2>
            <p className="text-xl text-slate-400">See what's included in each plan</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-white font-semibold">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan._id} className="text-center p-4 text-white font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-4 text-slate-300">{feature.name}</td>
                    {plans.map((plan) => {
                      const planFeature = plan.features?.find(f => f.name === feature.name);
                      const included = planFeature?.included !== false;
                      return (
                        <td key={plan._id} className="text-center p-4">
                          {included ? (
                            <Check size={20} className="text-green-400 mx-auto" />
                          ) : (
                            <span className="text-slate-600">×</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-400">Everything you need to know about our pricing</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedPlan(selectedPlan === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                  <span className="text-indigo-400">{selectedPlan === index ? '−' : '+'}</span>
                </div>
                {selectedPlan === index && (
                  <p className="text-slate-400 mt-4 leading-relaxed">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join thousands of users managing their finances with YUR Finance.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" icon={ArrowRight} className="text-lg px-8 py-4 hover-lift group">
              <span className="group-hover:translate-x-1 transition-transform inline-block">
                Start Your Free Trial
              </span>
            </Button>
          </Link>
          
          {plans.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-slate-300 mb-4">Or select a plan above to get started</p>
            </div>
          )}
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
