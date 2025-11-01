import axios from 'axios';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const ALPHA_VANTAGE_API_KEY = '0YY5I1USGKXCVKQUR';

// Popular Turkish stocks on Borsa Istanbul
const TURKISH_STOCKS = [
  "ASELS.IS", "THYAO.IS", "GARAN.IS", "BIMAS.IS", "AKBNK.IS",
  "EREGL.IS", "SISE.IS", "PETKM.IS", "TUPRS.IS", "TAVHL.IS",
  "ISCTR.IS", "HALKB.IS", "VAKBN.IS", "YKBNK.IS", "TCELL.IS",
  "FROTO.IS", "TOASO.IS", "TSKB.IS", "TTRAK.IS", "MGROS.IS",
  "KCHOL.IS", "AKSUE.IS", "KRDMD.IS", "KOZAL.IS", "KOZAA.IS",
  "ARCLK.IS", "ENKAI.IS", "SODA.IS", "ISGYO.IS", "KAPLM.IS",
  "IHLGM.IS", "KORDS.IS", "KARSN.IS"
];

// Basic logo map for popular BIST tickers → company domains
const TURKISH_STOCK_LOGOS: Record<string, string> = {
  ASELS: 'aselsan.com.tr',
  THYAO: 'thy.com',
  GARAN: 'garantibbva.com.tr',
  BIMAS: 'bim.com.tr',
  AKBNK: 'akbank.com',
  EREGL: 'erdemir.com.tr',
  SISE: 'sisecam.com.tr',
  PETKM: 'petkim.com.tr',
  TUPRS: 'tupras.com.tr',
  TAVHL: 'tavhavalimanlari.com.tr',
  ISCTR: 'isbank.com.tr',
  HALKB: 'halkbank.com.tr',
  VAKBN: 'vakifbank.com.tr',
  YKBNK: 'yapikredi.com.tr',
  TCELL: 'turkcell.com.tr',
  FROTO: 'fordotosan.com.tr',
  TOASO: 'tofas.com.tr',
  TSKB: 'tskb.com.tr',
  TTRAK: 'turktraktor.com.tr',
  MGROS: 'migros.com.tr',
  KCHOL: 'koc.com.tr',
  AKSUE: 'aksue.com.tr',
  KRDMD: 'kardemir.com',
  KOZAL: 'kozaltil.com.tr',
  KOZAA: 'kozaa.com.tr',
  ARCLK: 'arcelikglobal.com',
  ENKAI: 'enkai.com.tr',
  SODA: 'sodakimya.com.tr',
  ISGYO: 'isgyo.com.tr',
  KAPLM: 'kaplam.com.tr',
  IHLGM: 'ihlasgayrimenkul.com.tr',
  KORDS: 'kordsa.com',
  KARSN: 'karsan.com.tr'
};

// CoinGecko API service
export const cryptoApi = {
  // Get trending cryptocurrencies from locally cached file
  getTrendingCryptos: async (limit = 100) => {
    try {
      const res = await fetch('/coins.json', { cache: 'no-store' });
      if (!res.ok) {
        // Fallback: localStorage'dan oku
        try {
          const cached = localStorage.getItem('coins_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.data && parsed.data.length > 0) {
              console.warn('coins.json okunamadı, localStorage cache kullanılıyor');
              const sorted = parsed.data.sort((a: any, b: any) => (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999));
              return sorted.slice(0, limit);
            }
          }
        } catch {}
        return [];
      }
      const payload = await res.json();
      const coins = (payload?.data || []) as any[];
      
      // Başarılı okumada localStorage'a kaydet (fallback için)
      if (coins.length > 0) {
        try {
          localStorage.setItem('coins_cache', JSON.stringify(payload));
          localStorage.setItem('coins_cache_time', Date.now().toString());
        } catch {}
      }
      
      // Return up to limit, prioritize by market cap rank if available
      const sorted = coins.sort((a, b) => (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999));
      return sorted.slice(0, limit);
    } catch (error) {
      console.error('Error reading local coins.json:', error);
      // Fallback: localStorage'dan oku
      try {
        const cached = localStorage.getItem('coins_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.data && parsed.data.length > 0) {
            console.warn('coins.json hatası, localStorage cache kullanılıyor');
            const sorted = parsed.data.sort((a: any, b: any) => (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999));
            return sorted.slice(0, limit);
          }
        }
      } catch {}
      return [];
    }
  },

  // Get specific cryptocurrency data
  getCryptoDetails: async (id: string) => {
    try {
      // Önce geniş aramayı dene
      const list = await cryptoApi.getTrendingCryptos(500);
      let found = list.find((c: any) => c.id === id || c.id === id.toLowerCase());
      
      // Bulunamazsa localStorage cache'den ara
      if (!found) {
        try {
          const cached = localStorage.getItem('coins_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.data) {
              found = parsed.data.find((c: any) => 
                c.id === id || 
                c.id === id.toLowerCase() || 
                c.symbol?.toUpperCase() === id.toUpperCase()
              );
            }
          }
        } catch {}
      }
      
      return found || null;
    } catch (error) {
      console.error(`Error reading coin details from local coins.json for ${id}:`, error);
      return null;
    }
  },

  // Get historical price data (keep remote for now or replace later)
  getCryptoHistory: async (id: string, days: number = 7) => {
    try {
      const response = await axios.get(
        `${ALPHA_VANTAGE_BASE_URL}?function=DIGITAL_CURRENCY_DAILY&symbol=${id.toUpperCase()}&market=USD&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching crypto history for ${id}:`, error);
      return null;
    }
  },

  // Get global market data (optional: could be cached later too)
  getGlobalData: async () => {
    try {
      const response = await axios.get(`${COINGECKO_BASE_URL}/global`);
      return response.data;
    } catch (error) {
      console.error('Error fetching global market data:', error);
      return null;
    }
  }
};

// VakıfBank BIST API service for Turkish Stocks
export const stockApi = {
  // Get Turkish stocks from local static file generated by our server
  getTurkishStocks: async () => {
    try {
      const response = await fetch('/hisseler.json', { cache: 'no-store' });
      if (!response.ok) return [];
      const payload = await response.json();
      const data = payload?.data || {} as Record<string, {
        fiyat: number|null; tarih: string|null; error?: string;
        degisim?: number|null; degisimYuzde?: number|null;
        oncekiKapanis?: number|null; acilis?: number|null;
        yuksek?: number|null; dusuk?: number|null;
        hacim?: number|null; ortalamaHacim3A?: number|null;
        piyasaDegeri?: number|null; paraBirimi?: string|null;
        borsa?: string|null; ad?: string|null; uzunAd?: string|null;
      }>;

      const mapped = Object.entries(data)
        .filter(([symbol]) => TURKISH_STOCKS.includes(symbol))
        .map(([symbol, info]) => {
          const baseName = symbol.replace('.IS', '');
          const price = typeof info.fiyat === 'number' ? info.fiyat : 0;
          const domain = TURKISH_STOCK_LOGOS[baseName];
          const image = domain
            ? `https://logo.clearbit.com/${domain}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(baseName)}&background=0D8ABC&color=fff&rounded=true`;
          return {
            id: baseName,
            symbol: baseName,
            name: info.ad || baseName,
            price,
            change: typeof info.degisim === 'number' ? info.degisim : 0,
            changePercent: typeof info.degisimYuzde === 'number' ? info.degisimYuzde : 0,
            volume: typeof info.hacim === 'number' ? info.hacim : 0,
            volumeTL: undefined,
            high: typeof info.yuksek === 'number' ? info.yuksek : undefined,
            low: typeof info.dusuk === 'number' ? info.dusuk : undefined,
            open: typeof info.acilis === 'number' ? info.acilis : undefined,
            previousClose: typeof info.oncekiKapanis === 'number' ? info.oncekiKapanis : undefined,
            currency: (info.paraBirimi || 'TRY'),
            marketCap: typeof info.piyasaDegeri === 'number' ? info.piyasaDegeri : undefined,
            avgVolume3M: typeof info.ortalamaHacim3A === 'number' ? info.ortalamaHacim3A : undefined,
            exchange: info.borsa || undefined,
            longName: info.uzunAd || undefined,
            lastUpdate: info.tarih || undefined,
            image
          } as any;
        });

      // Fallback: if local file empty, return empty list
      return mapped;
    } catch (error) {
      console.error('Error fetching Turkish stocks from local hisseler.json:', error);
      return [];
    }
  },

  // Get specific stock details
  getStockDetails: async (symbol: string) => {
    const stocks = await stockApi.getTurkishStocks();
    return stocks.find(stock => stock.id === symbol);
  },

  // Get historical stock data
  getStockHistory: async (symbol: string) => {
    try {
      const response = await axios.get(
        `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}.IS&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      if (response.data['Time Series (Daily)']) {
        const timeSeries = response.data['Time Series (Daily)'];
        return Object.entries(timeSeries)
          .slice(0, 30) // Last 30 days
          .map(([date, data]: [string, any]) => ({
            date,
            open: parseFloat(data['1. open']),
            high: parseFloat(data['2. high']),
            low: parseFloat(data['3. low']),
            close: parseFloat(data['4. close']),
            volume: parseInt(data['5. volume'])
          }))
          .reverse();
      }
      return [];
    } catch (error) {
      console.error('Error fetching stock history:', error);
      return [];
    }
  }
};

// Technical indicators calculation utilities
export const indicators = {
  // Simple Moving Average
  calculateSMA: (prices: number[], period: number): number[] => {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  },

  // Relative Strength Index (Mock calculation)
  calculateRSI: (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  },

  // MACD (Mock calculation)
  calculateMACD: (prices: number[]): { macd: number; signal: number; histogram: number } => {
    const ema12 = prices[prices.length - 1] * 0.8 + prices[prices.length - 2] * 0.2;
    const ema26 = prices[prices.length - 1] * 0.7 + prices[prices.length - 2] * 0.3;
    const macd = ema12 - ema26;
    const signal = macd * 0.9;
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }
};

// Format utilities
export const formatters = {
  price: (price: number, currency: string = 'USD'): string => {
    if (currency === 'TRY') {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    }
    if (currency === 'USD' && price < 1) {
      return `$${price.toFixed(6)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  },

  largeNumber: (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  },

  percentage: (percent: number): string => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  }
};