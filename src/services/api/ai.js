import apiClient from './client';

export const aiService = {
  // Generate dashboard layout suggestions based on user data
  async generateDashboardSuggestions(userData) {
    try {
      const response = await apiClient.post('/api/ai/dashboard/suggest', {
        userData,
      });
      // Ensure suggestions array is returned
      if (response && response.suggestions) {
        return response;
      }
      // Fallback if response format is different
      return this.getDefaultSuggestions(userData);
    } catch (error) {
      console.error('Error generating dashboard suggestions:', error);
      // Fallback to default suggestions
      return this.getDefaultSuggestions(userData);
    }
  },

  // Optimize existing dashboard layout
  async optimizeDashboardLayout(currentLayout, userData) {
    try {
      const response = await apiClient.post('/api/ai/dashboard/optimize', {
        currentLayout,
        userData,
      });
      return response;
    } catch (error) {
      console.error('Error optimizing dashboard:', error);
      return currentLayout;
    }
  },

  // Get default suggestions (fallback)
  getDefaultSuggestions(userData) {
    const { hasIncome, hasExpenses, hasClients, hasGoals, hasInvoices } = userData || {};
    
    const suggestions = [];
    
    if (hasIncome || hasExpenses) {
      suggestions.push({
        type: 'chart',
        reason: 'Track your income and expenses trends',
        priority: 'high',
      });
    }
    
    if (hasIncome) {
      suggestions.push({
        type: 'stat-card',
        settings: { statType: 'income' },
        reason: 'Monitor your monthly income',
        priority: 'high',
      });
    }
    
    if (hasExpenses) {
      suggestions.push({
        type: 'stat-card',
        settings: { statType: 'expenses' },
        reason: 'Track your monthly expenses',
        priority: 'high',
      });
    }
    
    if (hasClients) {
      suggestions.push({
        type: 'clients',
        reason: 'Keep an eye on your top clients',
        priority: 'medium',
      });
    }
    
    if (hasGoals) {
      suggestions.push({
        type: 'goals',
        reason: 'Monitor your financial goals progress',
        priority: 'medium',
      });
    }
    
    if (hasInvoices) {
      suggestions.push({
        type: 'calendar',
        reason: 'Stay on top of upcoming deadlines',
        priority: 'medium',
      });
    }
    
    suggestions.push({
      type: 'quick-actions',
      reason: 'Quick access to frequently used features',
      priority: 'low',
    });
    
    return { suggestions };
  },
};

export default aiService;
