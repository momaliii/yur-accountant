import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password);
      navigate('/app');
    } catch (err) {
      setFormError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            YUR Finance
          </h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || formError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error || formError}
              </div>
            )}

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
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
              icon={LogIn}
            >
              Sign In
            </Button>

            <div className="text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign up
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
