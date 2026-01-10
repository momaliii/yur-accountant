import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Check, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../services/api/client';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isAuthenticated, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
    
    // Load selected plan from URL params
    const planSlug = searchParams.get('plan');
    const billing = searchParams.get('billing') || 'monthly';
    
    if (planSlug) {
      loadPlan(planSlug);
      setBillingCycle(billing);
    }
  }, [isAuthenticated, navigate, searchParams]);

  const loadPlan = async (slug) => {
    try {
      const data = await apiClient.get(`/api/plans/${slug}`);
      setSelectedPlan(data);
    } catch (error) {
      console.error('Error loading plan:', error);
      // If plan not found, clear selection
      setSelectedPlan(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      // Register with plan information
      const registerData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
      };

      if (selectedPlan) {
        registerData.planSlug = selectedPlan.slug;
        registerData.billingCycle = billingCycle;
      }

      await register(
        formData.email, 
        formData.password, 
        formData.name,
        selectedPlan?.slug,
        billingCycle
      );
      
      navigate('/app');
    } catch (err) {
      setFormError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            YUR Finance
          </h1>
          <p className="text-slate-400">Create your account</p>
        </div>

        <Card>
          {selectedPlan && (
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">Selected Plan: {selectedPlan.name}</h3>
                  <p className="text-sm text-slate-400">{selectedPlan.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                    navigate('/register');
                  }}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Price: </span>
                  <span className="text-white font-semibold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: selectedPlan.currency || 'USD',
                    }).format(
                      billingCycle === 'yearly' && selectedPlan.price?.yearly > 0
                        ? selectedPlan.price.yearly
                        : selectedPlan.price?.monthly || 0
                    )}
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                {selectedPlan.trialDays > 0 && (
                  <div className="flex items-center gap-1 text-green-400">
                    <Check size={16} />
                    <span>{selectedPlan.trialDays} days free trial</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || formError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error || formError}
              </div>
            )}

            <Input
              type="text"
              label="Name"
              icon={User}
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              type="email"
              label="Email"
              icon={Mail}
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              type="password"
              label="Password"
              icon={Lock}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />

            <Input
              type="password"
              label="Confirm Password"
              icon={Lock}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
              icon={UserPlus}
            >
              Create Account
            </Button>

            {!selectedPlan && (
              <div className="text-center">
                <Link to="/pricing" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                  View pricing plans →
                </Link>
              </div>
            )}
            
            <div className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign in
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
