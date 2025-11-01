import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, Activity, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PriceData {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  data: PriceData[];
  title: string;
  timeframe: string;
  isPositive: boolean;
  currency?: 'USD' | 'TRY';
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, title, timeframe, isPositive, currency = 'USD' }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [showMovingAverage, setShowMovingAverage] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Timeframe'e göre filtreleme ve veri üretimi
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return data;
    
    const now = Date.now();
    let timeRange: number;
    
    switch (selectedTimeframe) {
      case '1D':
        timeRange = 24 * 60 * 60 * 1000; // 24 saat
        break;
      case '1W':
        timeRange = 7 * 24 * 60 * 60 * 1000; // 7 gün
        break;
      case '1M':
        timeRange = 30 * 24 * 60 * 60 * 1000; // 30 gün
        break;
      case '3M':
        timeRange = 90 * 24 * 60 * 60 * 1000; // 90 gün
        break;
      case '1Y':
        timeRange = 365 * 24 * 60 * 60 * 1000; // 365 gün
        break;
      default:
        return data;
    }
    
    const cutoffTime = now - timeRange;
    let filtered = data.filter(d => d.timestamp >= cutoffTime);
    
    // Eğer seçilen timeframe için yeterli veri yoksa, mock data oluştur
    if (filtered.length < 2 && selectedTimeframe !== '1D') {
      const firstPrice = data[0]?.price || data[data.length - 1]?.price || 0;
      const lastPrice = data[data.length - 1]?.price || firstPrice;
      const points = selectedTimeframe === '1W' ? 168 : // Her saat için 1 hafta
                     selectedTimeframe === '1M' ? 720 : // Her saat için 1 ay (yaklaşık)
                     selectedTimeframe === '3M' ? 2160 : // Her saat için 3 ay
                     8760; // Her saat için 1 yıl (yaklaşık)
      
      const interval = timeRange / (points - 1);
      filtered = Array.from({ length: points }, (_, i) => {
        const t = points > 1 ? i / (points - 1) : 1;
        // Rastgele volatilite ekle
        const volatility = 0.02; // %2 volatilite
        const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
        const trendPrice = firstPrice + (lastPrice - firstPrice) * t;
        const price = trendPrice * randomFactor;
        return {
          timestamp: now - timeRange + i * interval,
          price: Number(price.toFixed(6))
        };
      });
    }
    
    return filtered.length > 0 ? filtered : data;
  }, [data, selectedTimeframe]);

  // Moving Average hesapla (basit 7 noktalık)
  const dataWithMA = useMemo(() => {
    const windowSize = Math.min(7, Math.floor(filteredData.length / 3)); // Veri uzunluğuna göre ayarla
    return filteredData.map((point, index) => {
      if (index < windowSize - 1) {
        return { ...point, ma: point.price };
      }
      const slice = filteredData.slice(index - windowSize + 1, index + 1);
      const avg = slice.reduce((sum, p) => sum + p.price, 0) / windowSize;
      return { ...point, ma: avg };
    });
  }, [filteredData]);

  // İstatistikler
  const stats = useMemo(() => {
    const prices = filteredData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / avg * 100; // Yüzde volatilite
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
    
    return {
      min,
      max,
      avg,
      volatility: volatility.toFixed(2),
      change,
      changePercent: changePercent.toFixed(2),
      range: max - min,
      rangePercent: firstPrice > 0 ? ((max - min) / firstPrice) * 100 : 0
    };
  }, [filteredData]);
  const formatPrice = (value: number) => {
    if (currency === 'TRY') {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (selectedTimeframe === '1D' || timeframe === '1D') {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="p-3 sm:p-6 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border-border/50">
      {/* Header with Stats */}
      <div className="mb-4 sm:mb-6 space-y-3">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-base sm:text-xl font-bold text-foreground">{title}</h3>
          <div className="flex items-center space-x-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            )}
            <span className={`text-sm sm:text-base font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent}%
            </span>
          </div>
        </div>
        
        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-muted/50 rounded-lg p-2 sm:p-3 border border-border/30">
            <div className="flex items-center space-x-1 mb-1">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Ortalama</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-foreground">{formatPrice(stats.avg)}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 sm:p-3 border border-border/30">
            <div className="flex items-center space-x-1 mb-1">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Volatilite</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-foreground">{stats.volatility}%</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 sm:p-3 border border-border/30">
            <div className="flex items-center space-x-1 mb-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">En Yüksek</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-green-500">{formatPrice(stats.max)}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 sm:p-3 border border-border/30">
            <div className="flex items-center space-x-1 mb-1">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">En Düşük</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-red-500">{formatPrice(stats.min)}</div>
          </div>
        </div>

        {/* Timeframe Tabs */}
        <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-9 sm:h-10">
            <TabsTrigger value="1D" className="text-[10px] sm:text-xs">1G</TabsTrigger>
            <TabsTrigger value="1W" className="text-[10px] sm:text-xs">1H</TabsTrigger>
            <TabsTrigger value="1M" className="text-[10px] sm:text-xs">1A</TabsTrigger>
            <TabsTrigger value="3M" className="text-[10px] sm:text-xs">3A</TabsTrigger>
            <TabsTrigger value="1Y" className="text-[10px] sm:text-xs">1Y</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Moving Average Toggle */}
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">{timeframe} Fiyat Hareketi</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowMovingAverage(!showMovingAverage)}
          >
            {showMovingAverage ? 'MA: Açık' : 'MA: Kapalı'}
          </Button>
        </div>
      </div>
      
      <div className="h-[250px] sm:h-[400px] lg:h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataWithMA} margin={{ top: 10, right: isMobile ? 5 : 15, left: isMobile ? -20 : 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.4}
              vertical={!isMobile}
            />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="hsl(var(--muted-foreground))"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              interval={isMobile ? 'preserveStartEnd' : 'preserveEnd'}
              minTickGap={isMobile ? 40 : 20}
            />
            <YAxis 
              tickFormatter={formatPrice}
              stroke="hsl(var(--muted-foreground))"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              width={isMobile ? 50 : 80}
              tickCount={isMobile ? 5 : 7}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '2px solid hsl(var(--border))',
                borderRadius: '12px',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                padding: isMobile ? '8px 10px' : '12px 16px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '600'
              }}
              labelFormatter={(timestamp) => {
                const date = new Date(timestamp as number);
                return date.toLocaleString('tr-TR', { 
                  day: '2-digit', 
                  month: 'short', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
              }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'price') {
                  return [formatPrice(value), 'Fiyat'];
                }
                if (name === 'ma') {
                  return [formatPrice(value), 'MA(7)'];
                }
                return [value, name];
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '6px', fontSize: isMobile ? '13px' : '15px' }}
              cursor={{ stroke: isPositive ? '#10b981' : '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={isMobile ? 2.5 : 3}
              fill="url(#colorGradient)"
              activeDot={{ 
                r: isMobile ? 6 : 8, 
                stroke: isPositive ? '#10b981' : '#ef4444',
                strokeWidth: 2,
                fill: 'hsl(var(--background))',
                strokeDasharray: '0'
              }}
              dot={false}
            />
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="ma"
                stroke="#8b5cf6"
                strokeWidth={isMobile ? 1.5 : 2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            {/* Ortalama referans çizgisi */}
            <ReferenceLine 
              y={stats.avg} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{ value: 'Ortalama', position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Alt bilgi - Detaylı İstatistikler */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <span className="text-muted-foreground font-medium">Değişim:</span>
            <span className={`font-bold ${stats.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.change >= 0 ? '+' : ''}{formatPrice(stats.change)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <span className="text-muted-foreground font-medium">Fiyat Aralığı:</span>
            <span className="font-bold text-foreground">{formatPrice(stats.range)}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <span className="text-muted-foreground font-medium">Aralık %:</span>
            <span className="font-bold text-foreground">{stats.rangePercent.toFixed(2)}%</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <span className="text-muted-foreground font-medium">Veri Noktası:</span>
            <span className="font-bold text-foreground">{filteredData.length}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PriceChart;