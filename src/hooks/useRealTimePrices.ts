import { useState, useEffect, useCallback } from 'react';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  lastUpdated: Date;
}

interface AssetPrice {
  [key: string]: PriceData;
}

export const useRealTimePrices = () => {
  const [prices, setPrices] = useState<AssetPrice>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Kripto fiyatları
      const cryptoResponse = await fetch('/coins.json', { cache: 'no-store' });
      const cryptoData = cryptoResponse.ok ? await cryptoResponse.json() : { data: [] };
      
      // Hisse fiyatları
      const stockResponse = await fetch('/hisseler.json', { cache: 'no-store' });
      const stockData = stockResponse.ok ? await stockResponse.json() : { data: {} };
      
      const newPrices: AssetPrice = {};
      
      // Kripto fiyatlarını işle
      if (cryptoData?.data && Array.isArray(cryptoData.data)) {
        cryptoData.data.forEach((coin: any) => {
          if (coin.symbol && coin.current_price !== undefined) {
            newPrices[coin.symbol.toUpperCase()] = {
              symbol: coin.symbol.toUpperCase(),
              price: coin.current_price,
              change24h: coin.price_change_24h || 0,
              changePercent24h: coin.price_change_percentage_24h || 0,
              lastUpdated: new Date()
            };
          }
        });
      }
      
      // Hisse fiyatlarını işle
      if (stockData?.data && typeof stockData.data === 'object') {
        Object.entries(stockData.data).forEach(([symbol, stock]: [string, any]) => {
          const cleanSymbol = symbol.replace('.IS', '');
          if (stock.fiyat !== undefined) {
            newPrices[cleanSymbol] = {
              symbol: cleanSymbol,
              price: stock.fiyat,
              change24h: stock.degisim || 0,
              changePercent24h: stock.degisimYuzde || 0,
              lastUpdated: new Date()
            };
          }
        });
      }
      
      setPrices(newPrices);
    } catch (err) {
      console.error('Fiyat güncelleme hatası:', err);
      setError('Fiyat güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  }, []);

  const getPrice = useCallback((symbol: string): PriceData | null => {
    return prices[symbol.toUpperCase()] || null;
  }, [prices]);

  const calculatePnL = useCallback((symbol: string, quantity: number, purchasePrice: number): {
    currentValue: number;
    totalPnL: number;
    pnlPercent: number;
    isProfit: boolean;
  } | null => {
    const priceData = getPrice(symbol);
    if (!priceData) return null;
    
    const currentValue = quantity * priceData.price;
    const totalPnL = currentValue - (quantity * purchasePrice);
    const pnlPercent = purchasePrice > 0 ? (totalPnL / (quantity * purchasePrice)) * 100 : 0;
    const isProfit = totalPnL > 0;
    
    return {
      currentValue,
      totalPnL,
      pnlPercent,
      isProfit
    };
  }, [getPrice]);

  useEffect(() => {
    fetchPrices();
    
    // Her 10 saniyede bir fiyatları güncelle
    const interval = setInterval(fetchPrices, 10000);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    getPrice,
    calculatePnL,
    refreshPrices: fetchPrices
  };
};

export default useRealTimePrices;
