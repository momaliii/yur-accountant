import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, TrendingUp, Users, FileText, Target, Wallet, BarChart3, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../stores/useStore';

const slides = [
  {
    icon: Wallet,
    title: 'Welcome to YUR Finance',
    description: 'Your comprehensive financial management solution for media buyers. Track income, expenses, clients, and more all in one place.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    icon: Users,
    title: 'Manage Your Clients',
    description: 'Keep track of all your clients, their payment history, and financial relationships. Organize your business relationships efficiently.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: TrendingUp,
    title: 'Track Income & Expenses',
    description: 'Record all your income and expenses with automatic currency conversion. Set up recurring expenses for monthly bills.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Target,
    title: 'Set Financial Goals',
    description: 'Define and track your financial goals. Monitor your progress and stay motivated to achieve your targets.',
    color: 'from-orange-500 to-amber-600',
  },
  {
    icon: BarChart3,
    title: 'Generate Reports',
    description: 'Create detailed financial reports and tax documents. Export data for accounting and analysis purposes.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Insights',
    description: 'Get intelligent financial insights and recommendations from our AI assistant. Make smarter financial decisions.',
    color: 'from-violet-500 to-fuchsia-600',
  },
];

export default function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setHasSeenOnboarding } = useSettingsStore();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setHasSeenOnboarding(true);
    onComplete();
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-2xl mx-4">
        {/* Slide Content */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-700/50">
          {/* Icon */}
          <div className={`w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br ${currentSlideData.color} flex items-center justify-center shadow-lg transform transition-all duration-500 ${currentSlide === currentSlide ? 'scale-100 rotate-0' : 'scale-90 rotate-12'}`}>
            <Icon className="w-12 h-12 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
            {currentSlideData.title}
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-slate-300 text-center mb-8 leading-relaxed">
            {currentSlideData.description}
          </p>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-indigo-500'
                    : 'w-2 bg-slate-600 hover:bg-slate-500'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleSkip}
              className="px-6 py-3 text-slate-400 hover:text-slate-200 transition-colors font-medium"
            >
              Skip
            </button>

            <div className="flex gap-3">
              {currentSlide > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
              )}

              <button
                onClick={handleNext}
                className={`px-8 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium ${
                  currentSlide === slides.length - 1
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {currentSlide === slides.length - 1 ? (
                  <>
                    Get Started
                    <Check className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 w-full max-w-md mx-auto">
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-slate-400 text-sm mt-2">
            {currentSlide + 1} of {slides.length}
          </p>
        </div>
      </div>
    </div>
  );
}
