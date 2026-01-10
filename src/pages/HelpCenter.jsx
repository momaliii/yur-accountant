import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  BookOpen,
  MessageSquare,
  Settings,
  DollarSign,
  Users,
  FileText,
  CreditCard,
  Target,
  TrendingUp,
  TrendingDown,
  Receipt,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Phone,
  Cloud,
  Bell,
  Mail,
  Ticket,
  Shield,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    color: 'from-indigo-500 to-cyan-500',
    questions: [
      {
        q: 'How do I add my first client?',
        a: 'Navigate to the Clients page from the sidebar, then click the "Add Client" button. Fill in the client details including name, email, phone, and address. You can also add notes for additional information.',
      },
      {
        q: 'How do I set up my base currency?',
        a: 'Go to Settings and select your base currency from the dropdown. All amounts will be converted to this currency for reporting. You can update exchange rates manually by clicking "Update Rates".',
      },
      {
        q: 'How do I enable AI features?',
        a: 'Go to Settings and enter your OpenAI API key in the "OpenAI API Key" section. Once saved, you can use the AI Assistant for financial insights and predictions.',
      },
    ],
  },
  {
    id: 'income-expenses',
    title: 'Income & Expenses',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-500',
    questions: [
      {
        q: 'How do I add income entries?',
        a: 'Go to the Income page and click "Add Income". Fill in the amount, source, date received, and payment method. You can also add notes for additional context.',
      },
      {
        q: 'How do I track recurring expenses?',
        a: 'When adding an expense, you can mark it as recurring and set the frequency (daily, weekly, monthly, etc.). The system will automatically remind you about upcoming recurring expenses.',
      },
      {
        q: 'Can I categorize my expenses?',
        a: 'Yes! When adding an expense, you can select a category from the dropdown. Categories help you track spending patterns and generate better reports.',
      },
    ],
  },
  {
    id: 'invoices',
    title: 'Invoices',
    icon: Receipt,
    color: 'from-blue-500 to-indigo-500',
    questions: [
      {
        q: 'How do I create an invoice?',
        a: 'Navigate to the Invoices page and click "Add New Invoice". Fill in the client, invoice number, date, due date, items, and amounts. You can also add notes and tax information.',
      },
      {
        q: 'How do I track invoice status?',
        a: 'Each invoice has a status (Draft, Sent, Paid, Overdue). You can filter and sort invoices by status to see which ones need attention.',
      },
      {
        q: 'Can I export invoices?',
        a: 'Yes, you can view invoice details and the system stores all invoice information. Export functionality may be available in future updates.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    icon: FileText,
    color: 'from-purple-500 to-pink-500',
    questions: [
      {
        q: 'What reports are available?',
        a: 'You can access financial reports from the Reports page, which shows income vs expenses, trends, and summaries. Tax Reports provide tax-related information based on your transactions.',
      },
      {
        q: 'How do I generate a tax report?',
        a: 'Go to Tax Reports and select the date range. The report will calculate estimated tax based on your VAT/GST rate set in Settings.',
      },
      {
        q: 'Can I export reports?',
        a: 'Report data can be viewed in the dashboard. Full export functionality may be available in future updates.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings & Preferences',
    icon: Settings,
    color: 'from-amber-500 to-orange-500',
    questions: [
      {
        q: 'What is Privacy Mode?',
        a: 'Privacy Mode hides or blurs sensitive financial data when enabled. This is useful when sharing your screen or working in public spaces.',
      },
      {
        q: 'How do I enable notifications?',
        a: 'Go to Settings and click "Enable Notifications". You\'ll need to grant browser permission first. Notifications alert you about overdue debts, recurring expenses, and goal progress.',
      },
      {
        q: 'How do I backup my data?',
        a: 'In Settings, click "Export Data" to download a JSON backup file. You can restore this data later using "Import Data".',
      },
      {
        q: 'What is the Vodafone Cash fee?',
        a: 'This is the default fee percentage for VF Cash payments (typically 1-1.5%). You can set this in Settings, and it will be used when calculating net amounts for VF Cash transactions.',
      },
    ],
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions & Plans',
    icon: CreditCard,
    color: 'from-purple-500 to-pink-500',
    questions: [
      {
        q: 'How do I change my subscription plan?',
        a: 'Go to Financial Dashboard and click "Change Plan". You can view all available plans, select a new one, and choose between monthly or yearly billing. Your plan will be updated immediately.',
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Yes, you can cancel your subscription from the Financial Dashboard. Click "Cancel Subscription" on your current plan. You\'ll continue to have access until the end of your billing period.',
      },
      {
        q: 'What happens if I cancel my subscription?',
        a: 'Your subscription will remain active until the end of your current billing period. After that, you\'ll be moved to the Free plan. You can reactivate your subscription at any time.',
      },
      {
        q: 'How do I upgrade or downgrade my plan?',
        a: 'Go to Financial Dashboard, click "Change Plan", select your desired plan, and confirm. Changes take effect immediately. If upgrading, you\'ll be charged the prorated amount.',
      },
      {
        q: 'What is the difference between monthly and yearly billing?',
        a: 'Yearly billing offers a 20% discount compared to monthly billing. You pay once per year instead of monthly, saving money in the long run.',
      },
    ],
  },
  {
    id: 'data-sync',
    title: 'Data Sync & Migration',
    icon: Cloud,
    color: 'from-cyan-500 to-blue-500',
    questions: [
      {
        q: 'What is Data Sync?',
        a: 'Data Sync allows you to synchronize your local data with the cloud database. This ensures your data is backed up and accessible from any device.',
      },
      {
        q: 'How do I sync my data to the cloud?',
        a: 'Go to Data Sync from the sidebar, review your local data, and click "Sync to Cloud". Your data will be uploaded to your account in the database.',
      },
      {
        q: 'Can I sync data from cloud to local?',
        a: 'Yes, you can download your cloud data to your local storage. This is useful when switching devices or working offline.',
      },
      {
        q: 'Is my data automatically synced?',
        a: 'Data sync is manual by default. You can sync whenever you want to backup your data or when you make significant changes.',
      },
      {
        q: 'What happens if I have data conflicts?',
        a: 'The system will show you conflicts and let you choose which version to keep. You can keep local, cloud, or merge both versions.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications & Communication',
    icon: Bell,
    color: 'from-amber-500 to-yellow-500',
    questions: [
      {
        q: 'How do I view my notifications?',
        a: 'Click the bell icon in the top navigation bar to see all notifications. You can also go to the Notifications page from the sidebar to view and manage all notifications.',
      },
      {
        q: 'How do I send a message to another user?',
        a: 'Go to Messages from the sidebar and click "New Message". Select the recipient and compose your message. Admins can send messages to any user.',
      },
      {
        q: 'How do I create a support ticket?',
        a: 'Go to Support Tickets from the sidebar and click "Create Ticket". Fill in the subject, description, priority, and category. Your ticket will be assigned to support staff.',
      },
      {
        q: 'How do I view announcements?',
        a: 'Go to Announcements from the sidebar to see all platform announcements. Important announcements may also appear as notifications.',
      },
      {
        q: 'Can I customize notification preferences?',
        a: 'Notification preferences can be managed in Settings. You can enable or disable different types of notifications.',
      },
    ],
  },
  {
    id: 'financial',
    title: 'Financial Dashboard',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-500',
    questions: [
      {
        q: 'What is the Financial Dashboard?',
        a: 'The Financial Dashboard is your central hub for managing subscriptions, viewing payment history, and tracking your financial activity. It combines subscription management with payment tracking.',
      },
      {
        q: 'How do I view my payment history?',
        a: 'Go to Financial Dashboard and scroll to the Payment History section. You\'ll see all your past payments with dates, amounts, status, and payment methods.',
      },
      {
        q: 'How do I manage my subscription?',
        a: 'In the Financial Dashboard, you can view your current subscription details, change plans, cancel or reactivate your subscription, and see billing information.',
      },
      {
        q: 'What payment methods are supported?',
        a: 'Payment processing is integrated with Stripe. You can use credit cards, debit cards, and other payment methods supported by Stripe.',
      },
    ],
  },
];

const quickGuides = [
  {
    title: 'Setting Up Your Account',
    icon: BookOpen,
    color: 'from-indigo-500 to-cyan-500',
    steps: [
      'Set your base currency in Settings',
      'Configure your VAT/GST rate if applicable',
      'Add your OpenAI API key for AI features (optional)',
      'Enable notifications for reminders (optional)',
    ],
  },
  {
    title: 'Managing Clients',
    icon: Users,
    color: 'from-blue-500 to-indigo-500',
    steps: [
      'Add clients with their contact information',
      'View client details and transaction history',
      'Track invoices and payments per client',
      'Add notes for important client information',
    ],
  },
  {
    title: 'Tracking Income',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-500',
    steps: [
      'Add income entries with source and amount',
      'Categorize income by type',
      'Track payment methods and dates',
      'View income trends in reports',
    ],
  },
  {
    title: 'Managing Expenses',
    icon: TrendingDown,
    color: 'from-red-500 to-pink-500',
    steps: [
      'Add expense entries with amount and category',
      'Set up recurring expenses for automation',
      'Track payment methods and dates',
      'Monitor spending patterns in reports',
    ],
  },
  {
    title: 'Creating Invoices',
    icon: Receipt,
    color: 'from-purple-500 to-pink-500',
    steps: [
      'Select a client for the invoice',
      'Add invoice items and amounts',
      'Set due date and payment terms',
      'Track invoice status (Draft, Sent, Paid)',
    ],
  },
  {
    title: 'Setting Financial Goals',
    icon: Target,
    color: 'from-amber-500 to-orange-500',
    steps: [
      'Define your goal type (income, savings, expense reduction)',
      'Set target amount and timeframe',
      'Track progress automatically',
      'Get notifications on goal milestones',
    ],
  },
  {
    title: 'Managing Subscriptions',
    icon: CreditCard,
    color: 'from-purple-500 to-pink-500',
    steps: [
      'View your current plan in Financial Dashboard',
      'Click "Change Plan" to see available options',
      'Select a new plan and billing cycle',
      'Confirm the change to update immediately',
    ],
  },
  {
    title: 'Syncing Your Data',
    icon: Cloud,
    color: 'from-cyan-500 to-blue-500',
    steps: [
      'Go to Data Sync from the sidebar',
      'Review your local data summary',
      'Click "Sync to Cloud" to backup',
      'Or "Download from Cloud" to restore',
    ],
  },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleCategory = (categoryId) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  const toggleQuestion = (questionIndex) => {
    setOpenQuestion(openQuestion === questionIndex ? null : questionIndex);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Help Center</h1>
        <p className="text-slate-400 mt-1">Find answers and learn how to use YUR Finance</p>
      </div>

      {/* Support Section */}
      <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
            <Phone size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">Need Help?</h2>
            <p className="text-slate-300 mb-3">Contact our support team via WhatsApp</p>
            <a
              href="https://wa.me/201060098267"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              <MessageSquare size={18} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card hover className="cursor-pointer group" onClick={() => navigate('/app')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Getting Started</h3>
              <p className="text-xs text-slate-400">New user guide</p>
            </div>
          </div>
        </Card>
        <Card hover className="cursor-pointer group" onClick={() => navigate('/app/ai-chat')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
              <p className="text-xs text-slate-400">Ask questions</p>
            </div>
          </div>
        </Card>
        <Card hover className="cursor-pointer group" onClick={() => navigate('/app/settings')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Settings</h3>
              <p className="text-xs text-slate-400">Configure app</p>
            </div>
          </div>
        </Card>
        <Card hover className="cursor-pointer group" onClick={() => navigate('/app/financial')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Subscriptions</h3>
              <p className="text-xs text-slate-400">Manage your plan</p>
            </div>
          </div>
        </Card>
        <Card hover className="cursor-pointer group" onClick={() => navigate('/app/migration')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Cloud size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Data Sync</h3>
              <p className="text-xs text-slate-400">Backup & restore</p>
            </div>
          </div>
        </Card>
        <Card hover className="cursor-pointer group" onClick={() => navigate('/app/tickets')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <Ticket size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Support Tickets</h3>
              <p className="text-xs text-slate-400">Get help</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Guides */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickGuides.map((guide, index) => (
            <Card key={index} hover>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${guide.color} flex items-center justify-center flex-shrink-0`}>
                  <guide.icon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-3">{guide.title}</h3>
                  <ol className="space-y-2">
                    {guide.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-indigo-400 font-semibold mt-0.5">{stepIndex + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Categories */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <category.icon size={20} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-white text-left">{category.title}</h3>
                </div>
                {openCategory === category.id ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>
              
              {openCategory === category.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
                  {category.questions.map((item, qIndex) => (
                    <div key={qIndex} className="rounded-lg bg-white/5 p-4">
                      <button
                        onClick={() => toggleQuestion(`${category.id}-${qIndex}`)}
                        className="w-full flex items-start justify-between gap-3 text-left w-full"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-2 flex items-start gap-2">
                            <HelpCircle size={18} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                            {item.q}
                          </h4>
                          {openQuestion === `${category.id}-${qIndex}` && (
                            <p className="text-sm text-slate-300 mt-2 ml-6">{item.a}</p>
                          )}
                        </div>
                        {openQuestion === `${category.id}-${qIndex}` ? (
                          <ChevronUp size={18} className="text-slate-400 flex-shrink-0 mt-1" />
                        ) : (
                          <ChevronDown size={18} className="text-slate-400 flex-shrink-0 mt-1" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <Card>
        <h2 className="text-xl font-bold mb-4">Additional Resources</h2>
        <div className="space-y-3">
          <a
            href="https://wa.me/201060098267"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-emerald-500/20 transition-colors cursor-pointer border border-emerald-500/30"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Phone size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">WhatsApp Support</h3>
              <p className="text-sm text-slate-400">Contact us: 01060098267</p>
            </div>
            <ExternalLink size={16} className="text-emerald-400" />
          </a>
          <div 
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => navigate('/app/ai-chat')}
          >
            <MessageSquare size={20} className="text-cyan-400" />
            <div className="flex-1">
              <h3 className="font-medium text-white">AI Assistant</h3>
              <p className="text-sm text-slate-400">Get instant answers to your questions</p>
            </div>
            <ExternalLink size={16} className="text-slate-400" />
          </div>
          <div 
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => navigate('/app/financial')}
          >
            <CreditCard size={20} className="text-purple-400" />
            <div className="flex-1">
              <h3 className="font-medium text-white">Financial Dashboard</h3>
              <p className="text-sm text-slate-400">Manage subscriptions and payments</p>
            </div>
            <ExternalLink size={16} className="text-slate-400" />
          </div>
          <div 
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => navigate('/app/migration')}
          >
            <Cloud size={20} className="text-cyan-400" />
            <div className="flex-1">
              <h3 className="font-medium text-white">Data Sync</h3>
              <p className="text-sm text-slate-400">Backup and sync your data</p>
            </div>
            <ExternalLink size={16} className="text-slate-400" />
          </div>
          <div 
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => navigate('/app/tickets')}
          >
            <Ticket size={20} className="text-red-400" />
            <div className="flex-1">
              <h3 className="font-medium text-white">Support Tickets</h3>
              <p className="text-sm text-slate-400">Create and track support requests</p>
            </div>
            <ExternalLink size={16} className="text-slate-400" />
          </div>
          <div 
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => navigate('/app/settings')}
          >
            <Settings size={20} className="text-amber-400" />
            <div className="flex-1">
              <h3 className="font-medium text-white">Settings & Preferences</h3>
              <p className="text-sm text-slate-400">Customize your experience</p>
            </div>
            <ExternalLink size={16} className="text-slate-400" />
          </div>
        </div>
      </Card>
    </div>
  );
}

