import { useState, useEffect } from 'react';
import { User, Mail, Building, Phone, Save, Edit2, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../services/api/client';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [planName, setPlanName] = useState('Free');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.profile?.name || '',
        email: user.email || '',
        company: user.profile?.company || '',
        phone: user.profile?.phone || '',
      });
    }
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    try {
      // Fetch subscription
      const subData = await apiClient.get('/api/subscriptions');
      const subscriptionData = Array.isArray(subData) ? subData[0] : subData;
      setSubscription(subscriptionData);

      // Fetch plan details to get the proper plan name
      if (subscriptionData?.plan) {
        try {
          const planData = await apiClient.get(`/api/plans/${subscriptionData.plan}`);
          setPlanName(planData.name || subscriptionData.plan);
        } catch (error) {
          // If plan not found, use the plan slug as fallback
          setPlanName(subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1));
        }
      } else {
        setPlanName('Free');
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setPlanName('Free');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update via API
      const updated = await apiClient.put('/api/auth/me', {
        profile: {
          name: formData.name,
          company: formData.company,
          phone: formData.phone,
        },
      });

      // Update local store
      updateUser(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-slate-400 mt-1">Manage your account information</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} icon={Edit2}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-white/10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {user?.profile?.name || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-slate-400">{user?.email}</p>
              {user?.role === 'admin' && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Administrator
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="text"
              label="Full Name"
              icon={User}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
            />

            <Input
              type="email"
              label="Email"
              icon={Mail}
              value={formData.email}
              disabled
              className="opacity-60"
            />

            <Input
              type="text"
              label="Company"
              icon={Building}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              disabled={!isEditing}
            />

            <Input
              type="tel"
              label="Phone"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user.profile?.name || '',
                    email: user.email || '',
                    company: user.profile?.company || '',
                    phone: user.profile?.phone || '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isLoading} icon={Save}>
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Account Type</span>
              <span className="text-white capitalize">{user?.role || 'user'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subscription</span>
              <span className="text-white capitalize">
                {planName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className={`${
                subscription?.status === 'active' || subscription?.status === 'trial' 
                  ? 'text-emerald-400' 
                  : subscription?.status === 'cancelled' 
                    ? 'text-red-400' 
                    : 'text-amber-400'
              }`}>
                {subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Active'}
              </span>
            </div>
            <div className="pt-4 border-t border-slate-700 mt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/app/financial')}
                icon={ArrowRight}
              >
                Manage Subscription
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/app/security')}
                icon={Shield}
              >
                Security Settings
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Last Login</span>
              <span className="text-white">
                {user?.lastLogin
                  ? new Date(user.lastLogin).toLocaleDateString()
                  : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Member Since</span>
              <span className="text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
