import { useState, useEffect } from 'react';
import { cryptoApi, stockApi } from '@/services/api';

interface MarketData {
  cryptos: any[];
  stocks: any[];
  globalStats: any;
  loading: boolean;
  error: string | null;
}

export const useMarketData = () => {
  const [data, setData] = useState<MarketData>({
    cryptos: [],
    stocks: [],
    globalStats: null,
    loading: true,
    error: null
  });

  const fetchMarketData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [cryptosResponse, stocksResponse, globalResponse] = await Promise.allSettled([
        cryptoApi.getTrendingCryptos(20),
        stockApi.getTurkishStocks(),
        cryptoApi.getGlobalData()
      ]);

      const cryptos = cryptosResponse.status === 'fulfilled' ? cryptosResponse.value : [];
      const stocks = stocksResponse.status === 'fulfilled' ? stocksResponse.value : [];
      const globalStats = globalResponse.status === 'fulfilled' ? globalResponse.value : null;

      setData({
        cryptos,
        stocks,
        globalStats,
        loading: false,
        error: null
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch market data'
      }));
    }
  };

  const refreshData = () => {
    fetchMarketData();
  };

  useEffect(() => {
    fetchMarketData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { ...data, refreshData };
};

export default useMarketData;