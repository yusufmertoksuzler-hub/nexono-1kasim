import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AssetCard from './AssetCard';
import { useNavigate } from 'react-router-dom';
import { stockApi } from '@/services/api';

interface StockData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  volumeTL?: number;
}

const StockSection = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      try {
        const stockData = await stockApi.getTurkishStocks();
        setStocks(stockData);
      } catch (error) {
        console.error('Error fetching Turkish stocks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleAssetClick = (stock: StockData) => {
    navigate(`/stock/${stock.symbol}`, { state: { asset: stock } });
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Turkish Stocks</h2>
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
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Turkish Stocks</h2>
          <span className="text-sm text-muted-foreground">Borsa İstanbul</span>
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
        {stocks.map((stock) => (
          <AssetCard
            key={stock.id}
            id={stock.id}
            symbol={stock.symbol}
            name={stock.name}
            price={stock.price}
            change={stock.change}
            changePercent={stock.changePercent}
            volume={stock.volume}
            volumeTL={stock.volumeTL}
            type="stock"
            currency="TRY"
            onClick={() => handleAssetClick(stock)}
          />
        ))}
      </div>
    </section>
  );
};

export default StockSection;