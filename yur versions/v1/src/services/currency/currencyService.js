const API_BASE = 'https://api.exchangerate-api.com/v4/latest';

export const currencyService = {
  async getExchangeRates(baseCurrency = 'USD') {
    try {
      const response = await fetch(`${API_BASE}/${baseCurrency}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data = await response.json();
      // The API returns rates where baseCurrency = 1, and other currencies are relative to it
      // We need to ensure baseCurrency is always 1 in our rates object
      const rates = { ...data.rates, [baseCurrency]: 1 };
      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return default rates if API fails (rates are relative to USD)
      return {
        USD: 1,
        EGP: 50.0,
        EUR: 0.92,
        SAR: 3.75,
        AED: 3.67,
      };
    }
  },
  
  convert(amount, fromCurrency, toCurrency, rates) {
    if (fromCurrency === toCurrency) return amount;
    if (!rates || Object.keys(rates).length === 0) {
      console.warn('Exchange rates not available, returning original amount');
      return amount;
    }
    
    // Rates are fetched with USD as base (rates[USD] = 1)
    // Example: rates[EGP] = 50 means 1 USD = 50 EGP
    // To convert 100 EGP to USD: 100 / 50 = 2 USD
    // To convert 2 USD to EGP: 2 * 50 = 100 EGP
    
    // Find base currency (USD, which has rate = 1)
    const baseCurrency = 'USD';
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    // Convert to base currency first
    let baseAmount;
    if (fromCurrency === baseCurrency) {
      baseAmount = amount;
    } else {
      // Convert from source currency to USD
      baseAmount = amount / fromRate;
    }
    
    // Convert from base currency to target
    if (toCurrency === baseCurrency) {
      return baseAmount;
    } else {
      // Convert from USD to target currency
      return baseAmount * toRate;
    }
  },
  
  formatCurrency(amount, currency = 'EGP') {
    const symbols = {
      USD: '$',
      EGP: 'E£',
      EUR: '€',
      SAR: 'SAR ',
      AED: 'AED ',
    };
    
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    return `${symbols[currency] || currency + ' '}${formatted}`;
  },
};

export default currencyService;

