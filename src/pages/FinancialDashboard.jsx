import { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowRight,
  Star,
} from 'lucide-react';
import Card, { StatCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../services/api/client';

export default function FinancialDashboard() {
  const { isAuthenticated } = useAuthStore();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [planName, setPlanName] = useState('Free');

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      loadPlans();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subData, revenueData, paymentsData] = await Promise.all([
        apiClient.get('/api/subscriptions'),
        apiClient.get('/api/admin/stats').catch(() => null), // Only for admins
        apiClient.get('/api/payments').catch(() => []), // Will create this
      ]);

      // Handle subscription response (could be object or array)
      const subscriptionData = Array.isArray(subData) ? subData[0] : subData;
      setSubscription(subscriptionData);
      
      // Load plan name
      if (subscriptionData?.plan) {
        try {
          const planData = await apiClient.get(`/api/plans/${subscriptionData.plan}`);
          setPlanName(planData.name || subscriptionData.plan);
        } catch (error) {
          setPlanName(subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1));
        }
      }
      
      setRevenue(revenueData);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const data = await apiClient.get('/api/plans');
      if (data?.plans) {
        // Sort: highlighted first, then by sortOrder
        const sortedPlans = data.plans.sort((a, b) => {
          if (a.isHighlighted && !b.isHighlighted) return -1;
          if (!a.isHighlighted && b.isHighlighted) return 1;
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
        setPlans(sortedPlans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) return;
    try {
      await apiClient.post('/api/subscriptions/cancel');
      await loadData();
      alert('Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert(error.response?.data?.error || 'Failed to cancel subscription');
    }
  };

  const handleReactivate = async () => {
    try {
      await apiClient.post('/api/subscriptions/reactivate');
      await loadData();
      alert('Subscription reactivated successfully');
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      alert('Failed to reactivate subscription. Please try again.');
    }
  };

  const changePlan = async () => {
    if (!selectedPlan) {
      alert('Please select a plan');
      return;
    }

    if (!confirm(`Are you sure you want to change to ${selectedPlan.name}?`)) return;

    try {
      setIsChangingPlan(true);
      await apiClient.post('/api/subscriptions/change-plan', {
        planSlug: selectedPlan.slug,
        billingCycle: billingCycle,
      });
      await loadData();
      setShowChangePlan(false);
      setSelectedPlan(null);
      alert('Plan changed successfully!');
    } catch (error) {
      console.error('Error changing plan:', error);
      alert(error.response?.data?.error || 'Failed to change plan');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'trial':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'cancelled':
      case 'expired':
        return <XCircle size={20} className="text-red-400" />;
      default:
        return <Calendar size={20} className="text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'trial':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled':
      case 'expired':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
            <DollarSign className="w-8 h-8" />
            Financial Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Manage subscriptions, billing, and revenue</p>
        </div>
      </div>

      {/* Subscription Card */}
      {subscription ? (
        <Card>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{planName}</h2>
                <div className="flex items-center gap-2">
                  {getStatusIcon(subscription.status)}
                  <span className={`px-3 py-1 rounded text-sm border ${getStatusColor(subscription.status)}`}>
                    {subscription.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: subscription.currency || 'USD',
                    minimumFractionDigits: 0,
                  }).format(subscription.amount)}
                  <span className="text-lg text-slate-400">/{subscription.billingCycle}</span>
                </p>
                <p className="text-sm text-slate-400">{subscription.currency}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-sm text-slate-400 mb-1">Start Date</p>
                <p className="text-white">
                  {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">End Date</p>
                <p className="text-white">
                  {subscription.endDate
                    ? new Date(subscription.endDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              {subscription.trialEndDate && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Trial Ends</p>
                  <p className="text-white">
                    {new Date(subscription.trialEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-400 mb-1">Auto Renew</p>
                <p className="text-white">
                  {subscription.autoRenew ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 flex gap-3">
              {subscription.status === 'cancelled' && (
                <Button onClick={handleReactivate}>Reactivate</Button>
              )}
              {subscription.status === 'active' && subscription.plan !== 'free' && (
                <Button onClick={handleCancel} variant="danger">
                  Cancel Subscription
                </Button>
              )}
              <Button
                onClick={() => setShowChangePlan(!showChangePlan)}
                variant="outline"
              >
                {showChangePlan ? 'Hide Plans' : 'Change Plan'}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400 mb-4">No active subscription</p>
            <Button variant="primary" onClick={() => window.location.href = '/#/pricing'}>
              View Plans
            </Button>
          </div>
        </Card>
      )}

      {/* Change Plan Section */}
      {showChangePlan && plans.length > 0 && (
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Available Plans</h2>
              <p className="text-slate-400">Select a plan to upgrade or downgrade</p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
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
                {billingCycle === 'yearly' && (
                  <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Save 20%</span>
                )}
              </span>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const price = billingCycle === 'yearly' && plan.price?.yearly > 0 
                  ? plan.price.yearly 
                  : plan.price?.monthly || 0;
                const isCurrentPlan = subscription?.plan === plan.slug;
                
                return (
                  <div
                    key={plan._id}
                    className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                      isCurrentPlan
                        ? 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-500'
                        : plan.isHighlighted
                          ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500 shadow-lg shadow-yellow-500/20'
                          : selectedPlan?._id === plan._id
                            ? 'bg-slate-800/50 border-indigo-500'
                            : 'bg-slate-800/30 border-slate-700 hover:border-indigo-500/50'
                    }`}
                    onClick={() => !isCurrentPlan && setSelectedPlan(plan)}
                  >
                    <div className="text-center mb-4 flex items-center justify-center gap-2">
                      {isCurrentPlan && (
                        <span className="px-3 py-1 bg-indigo-500 text-white text-sm font-medium rounded-full">
                          Current Plan
                        </span>
                      )}
                      {plan.isHighlighted && !isCurrentPlan && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-full flex items-center gap-1">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold text-white">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: plan.currency || 'USD',
                            minimumFractionDigits: 0,
                          }).format(price)}
                        </span>
                        <span className="text-slate-400">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                    </div>

                    {selectedPlan?._id === plan._id && !isCurrentPlan && (
                      <div className="mt-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            changePlan();
                          }}
                          variant="primary"
                          className="w-full"
                          loading={isChangingPlan}
                          disabled={isChangingPlan}
                        >
                          {isChangingPlan ? 'Changing...' : 'Select This Plan'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Payments"
          value={payments.length}
          icon={Receipt}
          color="indigo"
        />
        <StatCard
          title="Total Paid"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
          }).format(
            payments
              .filter(p => p.status === 'completed')
              .reduce((sum, p) => sum + (p.amount || 0), 0)
          )}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Pending Payments"
          value={payments.filter(p => p.status === 'pending').length}
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Payment History */}
      <Card>
        <h3 className="text-xl font-semibold mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No payment history available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((payment) => (
                  <tr key={payment._id || payment.id} className="hover:bg-white/5">
                    <td className="p-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: payment.currency || 'EGP',
                      }).format(payment.amount)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        payment.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">{payment.method || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
