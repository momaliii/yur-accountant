// Price tracking service for gold and stocks
// Note: This uses free/public APIs. For production, consider using paid APIs for more reliable data

class PriceService {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 60 * 60 * 1000; // 1 hour cache
  }

  // Get cached price or fetch new
  async getCachedPrice(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.price;
    }
    return null;
  }

  setCachedPrice(key, price) {
    this.cache.set(key, { price, timestamp: Date.now() });
  }

  // Get gold price per gram (in USD, can be converted to other currencies)
  async getGoldPrice(currency = 'USD') {
    try {
      const cacheKey = `gold_${currency}`;
      const cached = await this.getCachedPrice(cacheKey);
      if (cached) return cached;

      // Using a free API - metals-api.com (requires free API key)
      // For now, we'll use a fallback method
      // In production, you'd want to use a proper API with an API key
      
      // Fallback: Return a mock price (in production, replace with real API)
      // Example API call (requires API key):
      // const response = await fetch(`https://api.metals.live/v1/spot/gold?currency=${currency}`);
      // const data = await response.json();
      // return data.price;
      
      // For now, return null to indicate price tracking is not fully configured
      // Users can manually update prices
      return null;
    } catch (error) {
      console.error('Error fetching gold price:', error);
      return null;
    }
  }

  // Get stock price (requires symbol)
  async getStockPrice(symbol, currency = 'USD') {
    try {
      const cacheKey = `stock_${symbol}_${currency}`;
      const cached = await this.getCachedPrice(cacheKey);
      if (cached) return cached;

      // Using Alpha Vantage or Yahoo Finance API
      // For now, return null - users can manually update
      // Example with Alpha Vantage (requires API key):
      // const apiKey = 'YOUR_API_KEY';
      // const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
      // const data = await response.json();
      // return parseFloat(data['Global Quote']['05. price']);
      
      return null;
    } catch (error) {
      console.error('Error fetching stock price:', error);
      return null;
    }
  }

  // Update savings price (for gold/stocks)
  async updateSavingsPrice(savings, updateCallback) {
    if (savings.type === 'gold') {
      const price = await this.getGoldPrice(savings.currency);
      if (price && savings.quantity) {
        const newValue = savings.quantity * price;
        if (updateCallback) {
          updateCallback(savings.id, newValue, price);
        }
        return { price, value: newValue };
      }
    } else if (savings.type === 'stock') {
      // For stocks, we'd need a symbol - this would need to be stored in savings
      // For now, return null
      return null;
    }
    return null;
  }

  // Calculate price change percentage
  calculatePriceChange(currentPrice, previousPrice) {
    if (!previousPrice || previousPrice === 0) return null;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }
}

export const priceService = new PriceService();
export default priceService;

