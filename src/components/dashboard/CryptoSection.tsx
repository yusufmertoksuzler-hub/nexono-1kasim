import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AssetCard from './AssetCard';
import { useNavigate } from 'react-router-dom';
import { cryptoApi } from '@/services/api';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  total_volume: number;
  image: string;
}

const CryptoSection = () => {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCryptoData();
  }, []);

  const fetchCryptoData = async () => {
    try {
      // Get more cryptos - up to 100 for better variety
      const list = await cryptoApi.getTrendingCryptos(100);
      setCryptos(list as any);
    } catch (error) {
      console.error('Failed to fetch crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleAssetClick = (crypto: CryptoData) => {
    navigate(`/crypto/${crypto.symbol}`, { state: { asset: crypto } });
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-accent" />
            <h2 className="text-2xl font-bold">Cryptocurrencies</h2>
          </div>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[280px] h-[140px] bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold">Cryptocurrencies</h2>
          <span className="text-sm text-muted-foreground">Global Markets</span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cryptos.map((crypto) => (
          <AssetCard
            key={crypto.id}
            id={crypto.id}
            symbol={crypto.symbol}
            name={crypto.name}
            price={crypto.current_price}
            change={crypto.price_change_24h}
            changePercent={crypto.price_change_percentage_24h}
            volume={crypto.total_volume}
            image={crypto.image}
            type="crypto"
            onClick={() => handleAssetClick(crypto)}
          />
        ))}
      </div>
    </section>
  );
};

export default CryptoSection;