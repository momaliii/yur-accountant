export const aiService = {
  async chat(messages, apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Please add it in Settings.');
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.3, // Lower temperature for more focused, expert responses
          max_tokens: 2000, // More tokens for detailed recommendations
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get AI response');
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  },
  
  async getInsights(data, apiKey) {
    const systemPrompt = `You are an expert financial advisor specializing in media buying and digital marketing businesses. 
    You have 15+ years of experience analyzing business finances, optimizing cash flow, and providing strategic recommendations.
    
    Your role is to:
    1. Analyze financial data with deep expertise
    2. Identify trends, risks, and opportunities
    3. Provide actionable, specific recommendations
    4. Calculate key financial metrics (margins, ratios, growth rates)
    5. Suggest optimizations for profitability
    6. Warn about potential financial issues
    
    Always structure your response with:
    - Executive Summary (2-3 sentences)
    - Key Metrics & Analysis
    - Critical Insights
    - Actionable Recommendations (prioritized)
    - Risk Warnings (if any)
    
    Be specific with numbers, percentages, and concrete recommendations. Act as a trusted financial advisor.`;
    
    const profitMargin = data.totalIncome > 0 
      ? ((data.netProfit / parseFloat(data.totalIncome.replace(/[^0-9.]/g, ''))) * 100).toFixed(1)
      : 0;
    
    const userPrompt = `Analyze this media buyer's financial data and provide expert recommendations:

FINANCIAL OVERVIEW:
- Total Income: ${data.totalIncome}
- Total Expenses: ${data.totalExpenses}
- Net Profit: ${data.netProfit}
- Profit Margin: ${profitMargin}%

TOP CLIENTS BY INCOME:
${data.topClients?.map(c => `- ${c.name}: ${c.income} (Payment Model: ${c.paymentModel})`).join('\n') || 'No client data'}

EXPENSE BREAKDOWN BY CATEGORY:
${data.expensesByCategory?.map(e => `- ${e.category}: ${e.amount}`).join('\n') || 'No expense data'}

Provide a comprehensive financial analysis with specific, actionable recommendations to improve profitability and business health.`;
    
    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], apiKey);
  },
  
  async getPredictions(historicalData, apiKey) {
    const systemPrompt = `You are an expert financial forecaster with expertise in media buying businesses.
    You specialize in:
    - Trend analysis and pattern recognition
    - Seasonal adjustments
    - Growth rate calculations
    - Risk assessment
    - Cash flow forecasting
    
    Analyze historical data and provide:
    1. Next month predictions (income, expenses, profit) with confidence levels
    2. Trend analysis (growing, declining, stable)
    3. Seasonal factors (if applicable)
    4. Growth rate calculations
    5. Potential risks or opportunities
    6. Recommended actions based on forecast
    
    Be specific with numbers and provide reasoning based on statistical analysis.`;
    
    const userPrompt = `Forecast next month's finances based on this historical data:

HISTORICAL MONTHLY DATA (Last 6 months):
${historicalData.map(m => `${m.month}: Income ${m.income}, Expenses ${m.expenses}`).join('\n')}

Provide:
1. Next month forecast (Income, Expenses, Net Profit)
2. Trend analysis and growth rates
3. Confidence level in predictions
4. Key assumptions
5. Recommended actions based on the forecast`;
    
    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], apiKey);
  },
  
  async categorizeExpense(description, apiKey) {
    const systemPrompt = `You are an expense categorization assistant.
    Categorize the expense into one of these categories:
    - Subscriptions
    - Fees
    - Tools
    - Outsourcing
    - Advertising
    - Office
    - Travel
    - Other
    
    Respond with ONLY the category name, nothing else.`;
    
    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Categorize this expense: "${description}"` },
    ], apiKey);
  },
  
  async answerFinancialQuestion(question, financialContext, apiKey) {
    const systemPrompt = `You are an expert financial advisor with 15+ years of experience in:
    - Media buying and digital marketing businesses
    - Cash flow management
    - Profitability optimization
    - Client relationship financial analysis
    - Tax planning and business finance
    - Expense optimization
    
    Your expertise includes:
    - Analyzing client profitability and payment models
    - Identifying cost-saving opportunities
    - Recommending pricing strategies
    - Cash flow forecasting
    - Debt management
    - Business growth strategies
    
    When answering questions:
    1. Provide expert-level analysis based on the data
    2. Give specific, actionable recommendations
    3. Calculate relevant financial metrics when needed
    4. Consider best practices for media buying businesses
    5. Warn about potential risks or issues
    6. Be thorough but clear in your explanations
    
    If you need more data to give a complete answer, ask for it but provide what insights you can with available data.`;
    
    // Calculate additional metrics for better context
    const profitMargin = financialContext.currentMonthIncome > 0
      ? ((financialContext.netProfit / financialContext.currentMonthIncome) * 100).toFixed(1)
      : 0;
    
    const avgClientIncome = financialContext.clientSummary.length > 0
      ? financialContext.clientSummary.reduce((sum, c) => sum + c.totalIncome, 0) / financialContext.clientSummary.length
      : 0;
    
    const userPrompt = `As an expert financial advisor, answer this question about my media buying business:

QUESTION: ${question}

FINANCIAL CONTEXT:
- Current Month Income: ${financialContext.currentMonthIncome} ${financialContext.currency}
- Current Month Expenses: ${financialContext.currentMonthExpenses} ${financialContext.currency}
- Net Profit: ${financialContext.netProfit} ${financialContext.currency}
- Profit Margin: ${profitMargin}%
- Total Active Clients: ${financialContext.totalClients}
- Pending Debts: ${financialContext.pendingDebtsCount} (Total: ${financialContext.pendingDebtsTotal} ${financialContext.currency})

CLIENT SUMMARY:
${financialContext.clientSummary.map(c => 
  `- ${c.name}: Total Income ${c.totalIncome} ${financialContext.currency}, Payment Model: ${c.paymentModel}`
).join('\n') || 'No client data'}

Provide expert analysis and recommendations based on this data.`;
    
    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], apiKey);
  },

  async analyzeClient(clientData, apiKey) {
    const systemPrompt = `You are an expert financial analyst and business consultant specializing in client relationship management for media buying and digital marketing businesses. You have 15+ years of experience analyzing client performance, payment patterns, profitability, and risk assessment.

    Your expertise includes:
    - Client profitability analysis
    - Payment pattern recognition and forecasting
    - Risk assessment and mitigation strategies
    - Client relationship financial health evaluation
    - Payment model optimization recommendations
    - Cash flow impact analysis
    - Client retention and growth strategies

    When analyzing a client, provide:
    1. **Executive Summary**: Brief overview of client's financial relationship
    2. **Payment Pattern Analysis**: Trends, consistency, frequency patterns
    3. **Profitability Assessment**: Is this client profitable? What's the margin?
    4. **Risk Evaluation**: Payment reliability, potential issues, red flags
    5. **Performance Insights**: Strengths, weaknesses, opportunities
    6. **Actionable Recommendations**: Specific steps to optimize the relationship
    7. **Forecast**: Expected future payments based on patterns

    Be specific, data-driven, and provide actionable insights. Use numbers, percentages, and concrete recommendations.`;

    const userPrompt = `Analyze this client's financial relationship and provide comprehensive insights:

CLIENT INFORMATION:
- Name: ${clientData.name}
- Payment Model: ${clientData.paymentModel}
- Rating: ${clientData.rating}/5
- Risk Level: ${clientData.riskLevel}
- Services: ${clientData.services?.join(', ') || 'Not specified'}
- Currency: ${clientData.currency}

PAYMENT STATISTICS:
- Total Income: ${clientData.totalIncome}
- Total Payments: ${clientData.totalPayments}
- Average Payment: ${clientData.averagePayment}
- First Payment: ${clientData.firstPaymentDate}
- Last Payment: ${clientData.lastPaymentDate}
- Payment Frequency: ${clientData.paymentFrequency}

PAYMENT HISTORY (Last 10 payments):
${clientData.recentPayments?.map((p, idx) => 
  `${idx + 1}. ${p.date}: ${p.amount} (${p.method})${p.projectName ? ` - Project: ${p.projectName}` : ''}`
).join('\n') || 'No payment history'}

PAYMENT MODEL DETAILS:
${clientData.paymentModelDetails || 'Standard payment model'}

Provide a comprehensive analysis covering payment patterns, profitability, risk assessment, and actionable recommendations to optimize this client relationship.`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], apiKey);
  },

  async getSavingsInsights(savingsData, incomeData, expensesData, apiKey) {
    const systemPrompt = `You are an expert savings and investment advisor with 15+ years of experience in:
    - Personal finance and wealth building
    - Savings strategies and optimization
    - Investment portfolio analysis
    - Goal-based financial planning
    - Risk management and diversification
    
    Your expertise includes:
    - Analyzing savings patterns and habits
    - Recommending optimal savings strategies
    - Identifying opportunities to increase savings
    - Goal achievement planning
    - Savings type recommendations (gold, certificates, stocks, cash)
    - Interest rate optimization
    - Maturity and reinvestment strategies
    
    When analyzing savings, provide:
    1. **Executive Summary**: Overview of savings health and progress
    2. **Savings Analysis**: Current state, distribution, performance
    3. **Goal Progress**: Status of savings goals and timelines
    4. **Opportunities**: Ways to optimize savings (increase contributions, better rates, diversification)
    5. **Recommendations**: Specific, actionable steps to improve savings
    6. **Risk Assessment**: Any concerns or warnings
    7. **Projections**: Future outlook based on current trajectory
    
    Be specific with numbers, percentages, and provide concrete, actionable recommendations.`;

    const savingsSummary = savingsData.savings.map(s => ({
      name: s.name,
      type: s.type,
      current: s.currentAmount || s.initialAmount || 0,
      target: s.targetAmount || null,
      interestRate: s.interestRate || null,
      maturityDate: s.maturityDate || null,
    }));

    const userPrompt = `Analyze my savings portfolio and provide expert recommendations:

SAVINGS PORTFOLIO:
${savingsSummary.map(s => 
  `- ${s.name} (${s.type}): ${s.current} ${savingsData.currency}${s.target ? `, Target: ${s.target}` : ''}${s.interestRate ? `, Interest: ${s.interestRate}%` : ''}${s.maturityDate ? `, Matures: ${s.maturityDate}` : ''}`
).join('\n') || 'No savings data'}

TOTAL SAVINGS: ${savingsData.total} ${savingsData.currency}
TOTAL TARGETS: ${savingsData.totalTarget || 0} ${savingsData.currency}

MONTHLY INCOME: ${incomeData.monthlyIncome || 0} ${savingsData.currency}
MONTHLY EXPENSES: ${expensesData.monthlyExpenses || 0} ${savingsData.currency}
DISPOSABLE INCOME: ${incomeData.monthlyIncome - expensesData.monthlyExpenses || 0} ${savingsData.currency}
SAVINGS RATE: ${savingsData.savingsRate || 0}%

Provide comprehensive savings analysis with specific recommendations to optimize my savings strategy and achieve my goals.`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], apiKey);
  },
};

export default aiService;

