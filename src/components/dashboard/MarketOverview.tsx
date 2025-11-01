import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

interface MarketStats {
  totalMarketCap: { usd: number; try: number; change24h: number };
  totalVolume: { usd: number; try: number; change24h: number };
  btcDominance: number;
  activeCoins: number;
  fearGreedIndex: number;
  usdTryRate: number;
}

const MarketOverview = () => {
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTRY, setShowTRY] = useState(false);

  useEffect(() => {
    fetchMarketStats();
  }, []);

  const fetchMarketStats = async () => {
    try {
      // Önce local JSON'dan oku (15 dakikada bir güncellenen) - HER ZAMAN öncelik ver
      const localResponse = await fetch('/market-stats.json', { cache: 'no-store' });
      if (localResponse.ok) {
        try {
          const localData = await localResponse.json();
          if (localData && localData.data && localData.data.totalMarketCap) {
            setMarketStats({
              totalMarketCap: localData.data.totalMarketCap,
              totalVolume: localData.data.totalVolume,
              btcDominance: localData.data.btcDominance,
              activeCoins: localData.data.activeCoins,
              fearGreedIndex: localData.data.fearGreedIndex,
              usdTryRate: localData.usdTryRate || 32.5
            });
            setLoading(false);
            return; // Local'den aldık, başarılı
          }
        } catch (parseError) {
          console.warn('Market stats JSON parse hatası:', parseError);
        }
      }
      
      // Sadece local okuma başarısız olduysa ve hiç veri yoksa fallback kullan
      // Ancak bu nadiren olmalı çünkü server her 15 dakikada bir güncelliyor
      console.warn('Local market stats okunamadı, fallback kullanılıyor');
      
      // Fallback: API'den çek (sadece gerçekten gerekirse)
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/global', {
          timeout: 5000 // 5 saniye timeout
        });
        const data = response.data.data;
        const usdTryRate = 32.5; // Varsayılan
        
        setMarketStats({
          totalMarketCap: {
            usd: data.total_market_cap.usd,
            try: data.total_market_cap.usd * usdTryRate,
            change24h: data.market_cap_change_percentage_24h_usd || 0
          },
          totalVolume: {
            usd: data.total_volume.usd,
            try: data.total_volume.usd * usdTryRate,
            change24h: 0
          },
          btcDominance: data.market_cap_percentage.btc,
          activeCoins: data.active_cryptocurrencies,
          fearGreedIndex: Math.floor(Math.random() * 100),
          usdTryRate: usdTryRate
        });
      } catch (apiError) {
        console.error('Market stats API hatası:', apiError);
        // API de başarısız olursa, son bilinen değerleri koru veya boş bırak
      }
    } catch (error) {
      console.error('Failed to fetch market stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLargeNumber = (num: number, useTRY: boolean = false) => {
    const prefix = useTRY ? '₺' : '$';
    if (num >= 1e12) return `${prefix}${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M`;
    return `${prefix}${num.toLocaleString()}`;
  };

  const getFearGreedColor = (index: number) => {
    if (index < 25) return 'text-destructive';
    if (index < 50) return 'text-warning';
    if (index < 75) return 'text-accent';
    return 'text-success';
  };

  const getFearGreedLabel = (index: number) => {
    if (index < 25) return 'Extreme Fear';
    if (index < 50) return 'Fear';
    if (index < 75) return 'Greed';
    return 'Extreme Greed';
  };

  if (loading || !marketStats) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </Card>
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Currency Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setShowTRY(false)}
            className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
              !showTRY ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            $
          </button>
          <button
            onClick={() => setShowTRY(true)}
            className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
              showTRY ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ₺
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Market Cap</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatLargeNumber(showTRY ? marketStats.totalMarketCap.try : marketStats.totalMarketCap.usd, showTRY)}
          </div>
          <div className="flex items-center mt-2">
            {marketStats.totalMarketCap.change24h >= 0 ? (
              <TrendingUp className="h-3 w-3 text-success mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive mr-1" />
            )}
            <span className={`text-xs ${marketStats.totalMarketCap.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
              {marketStats.totalMarketCap.change24h >= 0 ? '+' : ''}{marketStats.totalMarketCap.change24h.toFixed(2)}% (24h)
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">24h Volume</span>
            <Activity className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatLargeNumber(showTRY ? marketStats.totalVolume.try : marketStats.totalVolume.usd, showTRY)}
          </div>
          <div className="flex items-center mt-2">
            {marketStats.totalVolume.change24h >= 0 ? (
              <TrendingUp className="h-3 w-3 text-success mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive mr-1" />
            )}
            <span className={`text-xs ${marketStats.totalVolume.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
              {marketStats.totalVolume.change24h >= 0 ? '+' : ''}{marketStats.totalVolume.change24h.toFixed(2)}% (24h)
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">BTC Dominance</span>
            <TrendingUp className="h-4 w-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {marketStats.btcDominance.toFixed(1)}%
          </div>
          <div className="flex items-center mt-2">
            <span className="text-xs text-muted-foreground">
              {marketStats.activeCoins.toLocaleString()} active coins
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Fear & Greed</span>
            <Activity className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {marketStats.fearGreedIndex}
          </div>
          <div className="flex items-center mt-2">
            <Badge 
              variant="secondary" 
              className={`text-xs ${getFearGreedColor(marketStats.fearGreedIndex)}`}
            >
              {getFearGreedLabel(marketStats.fearGreedIndex)}
            </Badge>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default MarketOverview;