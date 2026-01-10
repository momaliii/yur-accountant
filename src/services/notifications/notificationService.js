class NotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  async checkPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    this.permission = Notification.permission;
    return this.permission;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission === 'granted';
  }

  async showNotification(title, options = {}) {
    if (!('Notification' in window)) {
      return false;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return false;
      }
    }

    const defaultOptions = {
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: 'yur-finance',
      requireInteraction: false,
      ...options,
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Specific notification types
  async notifyOverdueDebt(debt) {
    return this.showNotification('Overdue Debt Reminder', {
      body: `${debt.partyName} owes you ${this.formatCurrency(debt.amount, debt.currency)}. Payment was due on ${new Date(debt.dueDate).toLocaleDateString()}.`,
      tag: `debt-${debt.id}`,
      requireInteraction: true,
    });
  }

  async notifyUpcomingDebt(debt, daysUntilDue) {
    return this.showNotification('Upcoming Payment Due', {
      body: `${debt.partyName} payment of ${this.formatCurrency(debt.amount, debt.currency)} is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}.`,
      tag: `debt-upcoming-${debt.id}`,
    });
  }

  async notifyRecurringExpense(expense) {
    return this.showNotification('Recurring Expense Reminder', {
      body: `Don't forget: ${expense.description || 'Recurring expense'} - ${this.formatCurrency(expense.amount, expense.currency)}`,
      tag: `expense-recurring-${expense.id}`,
    });
  }

  async notifyGoalProgress(goal, progress) {
    if (progress >= 100) {
      return this.showNotification('Goal Achieved! 🎉', {
        body: `Congratulations! You've achieved your ${goal.type} goal of ${this.formatCurrency(goal.targetAmount)}.`,
        tag: `goal-achieved-${goal.id}`,
        requireInteraction: true,
      });
    } else if (progress >= 75) {
      return this.showNotification('Goal Almost There!', {
        body: `You're ${progress.toFixed(0)}% towards your ${goal.type} goal. Keep it up!`,
        tag: `goal-progress-${goal.id}`,
      });
    }
    return false;
  }

  async notifyLowBalance(amount, threshold) {
    return this.showNotification('Low Balance Alert', {
      body: `Your balance is below the threshold. Current: ${this.formatCurrency(amount)} (Threshold: ${this.formatCurrency(threshold)})`,
      tag: 'low-balance',
      requireInteraction: true,
    });
  }

  async notifySavingsMaturity(saving, daysUntil) {
    return this.showNotification('Savings Maturity Reminder', {
      body: `${saving.name} (${saving.type}) matures in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}. Consider reinvestment options.`,
      tag: `savings-maturity-${saving.id}`,
      requireInteraction: daysUntil <= 3,
    });
  }

  async notifySavingsGoalProgress(saving, progress) {
    if (progress >= 100) {
      return this.showNotification('Savings Goal Achieved! 🎉', {
        body: `Congratulations! You've reached your goal for ${saving.name}.`,
        tag: `savings-goal-${saving.id}`,
        requireInteraction: true,
      });
    } else if (progress >= 75) {
      return this.showNotification('Savings Goal Almost There!', {
        body: `You're ${progress.toFixed(0)}% towards your goal for ${saving.name}. Keep it up!`,
        tag: `savings-goal-${saving.id}`,
      });
    }
    return false;
  }

  async notifySavingsBehindSchedule(saving) {
    return this.showNotification('Savings Goal Behind Schedule', {
      body: `${saving.name} is behind schedule. Consider increasing your monthly contributions.`,
      tag: `savings-schedule-${saving.id}`,
    });
  }

  formatCurrency(amount, currency = 'EGP') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }
}

// Export singleton instance
export default new NotificationService();

