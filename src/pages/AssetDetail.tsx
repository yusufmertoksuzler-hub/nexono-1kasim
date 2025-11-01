import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Building2, DollarSign, BarChart3, Calendar, Volume2, Sparkles, Wifi, WifiOff, Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import PriceChart from '@/components/charts/PriceChart';
import TradingViewEmbed from '@/components/charts/TradingViewEmbed';
import { fetchTVQuote } from '@/services/tv';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import NexonoAIChat from '@/components/ai/NexonoAIChat';
import { addDoc, deleteDoc, doc } from 'firebase/firestore';

interface AssetData {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  price?: number;
  image?: string;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  changePercent24h?: number;
  high24h?: number;
  low24h?: number;
  supply?: number;
}

interface UserAsset {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  quantity: number;
  purchasePrice: number;
  addedAt: Date;
  image?: string;
}

const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL path'ine göre type'ı belirle
  const type: 'crypto' | 'stock' = location.pathname.startsWith('/crypto/') ? 'crypto' : 'stock';
  const { user } = useAuth();
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [userAsset, setUserAsset] = useState<UserAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { getPrice, calculatePnL } = useRealTimePrices();
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const [tvPrice, setTvPrice] = useState<number | null>(null);
  const [tvChangePct, setTvChangePct] = useState<number | null>(null);
  const [isDataDelayed, setIsDataDelayed] = useState<boolean>(false);
  const [showTRYPrice, setShowTRYPrice] = useState<boolean>(true); // TRY paritesi göster
  const [cryptoTRY, setCryptoTRY] = useState<any>(null);

  useEffect(() => {
    // Sayfa açıldığında AI analizi otomatik göster (mobilde kapalı)
    if (window.innerWidth >= 768) {
      setAiOpen(true);
    }
    setShowDetails(false);
    setActiveTab('overview');
    setIsDataDelayed(type === 'stock'); // Varsayılan olarak stock gecikmeli
  }, [symbol, type]);

  useEffect(() => {
    if (type && symbol) {
      loadAssetData();
    } else {
      setLoading(false);
      setError('Geçersiz URL parametreleri');
    }
  }, [type, symbol]);

  // TradingView canlı veri - Optimized with longer interval and better error handling
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let consecutiveFailures = 0;
    
    const scheduleNext = (delay: number) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (mounted) fetchQuote();
      }, delay);
    };
    
    const fetchQuote = async () => {
      if (!mounted) return;
      try {
        const sym = type === 'stock' ? `BIST:${(symbol||'').toUpperCase()}` : (symbol||'').toUpperCase();
        const q = await fetchTVQuote(sym);
        if (mounted && q) {
          setTvPrice(q.price ?? null);
          setTvChangePct(q.changePercent24h ?? null);
          setIsDataDelayed(q.isDelayed ?? (type === 'stock')); // Stock varsayılan olarak gecikmeli
          consecutiveFailures = 0;
          scheduleNext(30000); // 30 seconds on success
        } else {
          consecutiveFailures++;
          // Exponential backoff on failures: 30s, 60s, 120s, max 5min
          const delay = Math.min(30000 * Math.pow(2, consecutiveFailures - 1), 300000);
          scheduleNext(delay);
          
          // Stop trying after too many failures
          if (consecutiveFailures > 5) {
            return;
          }
        }
      } catch {
        consecutiveFailures++;
        const delay = Math.min(30000 * Math.pow(2, consecutiveFailures - 1), 300000);
        scheduleNext(delay);
      }
    };

    // Initial fetch
    fetchQuote();
    
    return () => { 
      mounted = false; 
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [type, symbol]);

  useEffect(() => {
    if (user && symbol) {
      loadUserAsset();
      // favori kontrolü
      (async () => {
        try {
          const favRef = collection(db, 'userFavorites');
          const qFav = query(favRef, where('userId','==',user.uid), where('symbol','==', symbol.toUpperCase()));
          const snap = await getDocs(qFav);
          if (!snap.empty) {
            setIsFav(true);
            setFavId(snap.docs[0].id);
          } else {
            setIsFav(false);
            setFavId(null);
          }
        } catch {}
      })();
    }
  }, [user, symbol]);

  useEffect(() => {
    // Sayfa açıldığında AI analizi otomatik göster
    setAiOpen(true);
  }, [symbol]);

  const loadAssetData = async () => {
    if (!type || !symbol) {
      setLoading(false);
      setError('Geçersiz varlık parametreleri');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (type === 'crypto') {
        await loadCryptoData();
      } else if (type === 'stock') {
        await loadStockData();
      } else {
        throw new Error('Geçersiz varlık tipi');
      }
    } catch (err: any) {
      console.error('Varlık verisi yüklenirken hata:', err);
      setError(err?.message || 'Varlık bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  const loadCryptoData = async () => {
    try {
      const [usdRes, tryRes] = await Promise.all([
        fetch('/coins.json', { cache: 'no-store' }),
        fetch('/coins_try.json', { cache: 'no-store' })
      ]);
      const baseJson = usdRes.ok ? await usdRes.json() : { data: [] };
      const tryJson = tryRes.ok ? await tryRes.json() : { data: [] };
      const data = baseJson;
      
      if (data?.data && Array.isArray(data.data)) {
        // Önce tam eşleşme ara
        let crypto = data.data.find((c: any) => 
          c.symbol?.toLowerCase() === symbol?.toLowerCase()
        );
        
        // Eğer bulunamazsa, id ile ara
        if (!crypto) {
          crypto = data.data.find((c: any) => 
            c.id?.toLowerCase() === symbol?.toLowerCase()
          );
        }
        
        // Hala bulunamazsa, name ile ara
        if (!crypto) {
          crypto = data.data.find((c: any) => 
            c.name?.toLowerCase().includes(symbol?.toLowerCase())
          );
        }
        
        if (crypto) {
          // TRY paritesini eşle
          let cryptoTRY = null as any;
          if (Array.isArray(tryJson.data)) {
            cryptoTRY = tryJson.data.find((c: any) =>
              c.symbol?.toLowerCase() === symbol?.toLowerCase() ||
              c.id?.toLowerCase() === crypto.id?.toLowerCase()
            );
          }
          setCryptoTRY(cryptoTRY);
          // Varsayılan olarak TRY göster (eğer varsa)
          setAsset({
            symbol: crypto.symbol?.toUpperCase() || symbol?.toUpperCase() || '',
            name: crypto.name || symbol?.toUpperCase() || '',
            type: 'crypto',
            price: cryptoTRY?.current_price ?? crypto.current_price,
            image: crypto.image || '',
            marketCap: cryptoTRY?.market_cap ?? crypto.market_cap,
            volume24h: cryptoTRY?.total_volume ?? crypto.total_volume,
            change24h: cryptoTRY?.price_change_24h ?? crypto.price_change_24h,
            changePercent24h: cryptoTRY?.price_change_percentage_24h ?? crypto.price_change_percentage_24h,
            high24h: cryptoTRY?.high_24h ?? crypto.high_24h,
            low24h: cryptoTRY?.low_24h ?? crypto.low_24h,
            supply: crypto.total_supply
          });
        } else {
          throw new Error(`Kripto para bulunamadı: ${symbol}`);
        }
      } else {
        throw new Error('Kripto para verileri yüklenemedi');
      }
    } catch (err) {
      console.error('Kripto verisi yüklenirken hata:', err);
      throw err;
    }
  };

  const loadStockData = async () => {
    try {
      const response = await fetch('/hisseler.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Hisseler.json yüklenemedi');
      }
      const data = await response.json();
      
      if (data?.data && typeof data.data === 'object') {
        const stockSymbol = `${symbol}.IS`;
        const stock = data.data[stockSymbol];
        
        if (stock) {
          setAsset({
            symbol: symbol?.toUpperCase() || '',
            name: stock.ad || stock.uzunAd || symbol?.toUpperCase() || '',
            type: 'stock',
            price: stock.fiyat,
            marketCap: stock.piyasaDegeri,
            volume24h: stock.hacim,
            change24h: stock.degisim,
            changePercent24h: stock.degisimYuzde,
            high24h: stock.yuksek,
            low24h: stock.dusuk
          });
        } else {
          throw new Error('Hisse senedi bulunamadı');
        }
      } else {
        throw new Error('Hisse senedi verileri yüklenemedi');
      }
    } catch (err) {
      console.error('Hisse verisi yüklenirken hata:', err);
      throw err;
    }
  };

  const loadUserAsset = async () => {
    if (!user || !symbol) return;
    
    try {
      const assetsRef = collection(db, 'userAssets');
      const q = query(assetsRef, where('userId', '==', user.uid), where('symbol', '==', symbol.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        setUserAsset({
          id: doc.id,
          ...data,
          addedAt: data.addedAt.toDate()
        } as UserAsset);
      }
    } catch (error) {
      console.error('Kullanıcı varlığı yüklenirken hata:', error);
      // LocalStorage'dan yükle (fallback)
      try {
        const localAssets = localStorage.getItem(`userAssets_${user.uid}`);
        if (localAssets) {
          const assets = JSON.parse(localAssets);
          const userAsset = assets.find((a: any) => a.symbol.toUpperCase() === symbol.toUpperCase());
          if (userAsset) {
            setUserAsset({
              ...userAsset,
              addedAt: new Date(userAsset.addedAt)
            });
          }
        }
      } catch (localError) {
        console.error('LocalStorage\'dan yüklenirken hata:', localError);
      }
    }
  };

  const formatPrice = (price: number, type: 'crypto' | 'stock', useTRY?: boolean) => {
    const shouldUseTRY = useTRY ?? (type === 'stock' || (type === 'crypto' && showTRYPrice && cryptoTRY));
    
    if (shouldUseTRY) {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    }
    // Kripto para için dolar
    if (type === 'crypto' && price < 1) {
      return `$${price.toFixed(6)}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Varlık bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Varlık Bulunamadı</h1>
              <p className="text-sm text-muted-foreground">{error || 'Aradığınız varlık bulunamadı'}</p>
            </div>
          </div>
          
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Varlık Bulunamadı</h3>
                <p className="text-muted-foreground mb-4">
                  Aradığınız varlık mevcut değil veya silinmiş olabilir.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Dashboard'a Dön
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentPrice = getPrice(asset.symbol);
  // Crypto için TRY/USD fiyat seçimi
  const displayPrice = asset.type === 'crypto' && cryptoTRY && showTRYPrice 
    ? cryptoTRY.current_price 
    : (asset.type === 'crypto' && cryptoTRY && !showTRYPrice
      ? (asset.price || (tvPrice ?? currentPrice?.price))
      : (tvPrice ?? currentPrice?.price) || asset.price || 0);
  const change24h = currentPrice?.change24h || asset.change24h || 0;
  const changePercent24h = (tvChangePct ?? currentPrice?.changePercent24h) || asset.changePercent24h || 0;

  // Detaylı mock grafik verisi - 1 yıl için yeterli veri üret (timeframe seçimleri için)
  const chartData = (() => {
    const endPrice = displayPrice;
    const startPrice = endPrice - change24h;
    const now = Date.now();
    
    // 1 yıllık veri için 8760 saatlik veri noktası (her saat için bir veri)
    // Ancak performans için her 6 saatte bir veri noktası kullan (1460 nokta)
    const hoursInYear = 365 * 24;
    const interval = 6; // Her 6 saatte bir veri
    const points = Math.floor(hoursInYear / interval);
    
    const data = Array.from({ length: points }, (_, i) => {
      const t = points > 1 ? i / (points - 1) : 1;
      // Trend fiyatı
      const trendPrice = startPrice + (endPrice - startPrice) * t;
      // Rastgele volatilite ekle (gerçekçi görünüm için)
      const volatility = 0.015; // %1.5 volatilite
      const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
      const price = trendPrice * randomFactor;
      
      // Timestamp: son 1 yıldan itibaren
      const hoursAgo = (points - 1 - i) * interval;
      return {
        timestamp: now - hoursAgo * 60 * 60 * 1000,
        price: Number(price.toFixed(6))
      };
    });
    return data;
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                {asset?.image && (
                  <img 
                    src={asset.image} 
                    alt={asset.name}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{asset?.symbol || symbol?.toUpperCase()}</h1>
                    <Badge variant={type === 'crypto' ? 'default' : 'secondary'} className="flex-shrink-0">
                      {type === 'crypto' ? 'CRYPTO' : 'STOCK'}
                    </Badge>
                    {/* Canlı/Gecikmeli Veri Göstergesi (TV tarzı) */}
                    {asset && (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {isDataDelayed || asset.type === 'stock' ? (
                          <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-orange-500/40 bg-orange-500/10">
                            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-xs text-orange-500 font-medium">Gecikmeli</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 px-2 py-1 rounded-full border border-green-500/40 bg-green-500/10">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-500 font-medium">Canlı</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{asset?.name || symbol?.toUpperCase()}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Button 
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none active:bg-transparent hover:bg-transparent"
                onClick={async () => {
                  if (!user) { navigate('/login'); return; }
                  if (!asset) return;
                  try {
                    if (isFav && favId) {
                      await deleteDoc(doc(db,'userFavorites', favId));
                      setIsFav(false); setFavId(null);
                    } else {
                      const ref = await addDoc(collection(db,'userFavorites'), {
                        userId: user.uid,
                        symbol: asset.symbol,
                        name: asset.name,
                        type: asset.type,
                        image: asset.image || null,
                        addedAt: new Date()
                      });
                      setIsFav(true); setFavId(ref.id);
                    }
                  } catch {}
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Heart className={`h-4 w-4 transition-colors ${isFav ? 'text-red-500 fill-red-500' : 'text-muted-foreground hover:text-red-500'}`} />
              </Button>
              <Button 
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => {
                  const payload = {
                    id: asset.symbol,
                    symbol: asset.symbol,
                    name: asset.name,
                    type: asset.type,
                    image: asset.image
                  } as any;
                  navigate('/add-asset', { state: { preselect: payload } });
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="icon"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)] h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="
                    w-[95vw]
                    max-w-[95vw]
                    sm:!w-[70vw]
                    sm:!max-w-[800px]
                    max-h-[90vh]
                    sm:!max-h-[80vh]
                    h-auto
                    sm:!h-auto
                    rounded-2xl
                    sm:!rounded-3xl
                    !p-0 
                    !m-0
                    !border !border-border/50
                    !bg-background
                    !overflow-hidden 
                    !flex 
                    !flex-col
                    !left-[50%]
                    sm:!left-[50%]
                    !top-[50%]
                    sm:!top-[50%]
                    !bottom-auto
                    sm:!bottom-auto
                    !translate-x-[-50%]
                    sm:!translate-x-[-50%]
                    !translate-y-[-50%]
                    sm:!translate-y-[-50%]
                    !fixed
                    !shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
                    data-[state=open]:animate-in
                    data-[state=closed]:animate-out
                    data-[state=closed]:fade-out-0
                    data-[state=open]:fade-in-0
                    data-[state=closed]:zoom-out-95
                    data-[state=open]:zoom-in-95
                    data-[state=closed]:slide-out-to-bottom
                    data-[state=open]:slide-in-from-bottom
                    sm:data-[state=closed]:slide-out-to-left-1/2
                    sm:data-[state=closed]:slide-out-to-top-[48%]
                    sm:data-[state=open]:slide-in-from-left-1/2
                    sm:data-[state=open]:slide-in-from-top-[48%]
                    duration-300
                    [&>button:has(span.sr-only)]:hidden
                    !gap-0
                  " 
                  aria-describedby={undefined}
                >
                  <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 flex flex-row items-center justify-between bg-background/95 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0" onClick={() => setAiOpen(false)}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <DialogTitle className="text-sm sm:text-base font-semibold truncate">NEXONO AI - {asset?.name || symbol?.toUpperCase()}</DialogTitle>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setAiOpen(false);
                          setActiveTab('overview');
                          setShowDetails(false);
                        }}
                        className="text-xs sm:text-sm hidden sm:inline-flex"
                      >
                        Detaylar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setAiOpen(false)}>
                        ✕
                      </Button>
                    </div>
                    <DialogDescription className="sr-only">Varlık için AI sohbet penceresi</DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <NexonoAIChat 
                      currentAsset={asset ? {
                        symbol: asset.symbol,
                        name: asset.name,
                        type: asset.type,
                        price: displayPrice,
                        changePercent24h: changePercent24h
                      } : undefined}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 pb-safe">
        <div className="max-w-6xl mx-auto space-y-3 sm:space-y-6 md:space-y-8">
          {/* Fiyat Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {asset.type === 'crypto' && cryptoTRY && (
                      <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
                        <Button
                          variant={showTRYPrice ? "default" : "ghost"}
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setShowTRYPrice(true)}
                        >
                          ₺
                        </Button>
                        <Button
                          variant={!showTRYPrice ? "default" : "ghost"}
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setShowTRYPrice(false)}
                        >
                          $
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="text-xl sm:text-3xl md:text-4xl font-bold break-words">
                    {formatPrice(displayPrice, asset.type, showTRYPrice)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">Güncel Fiyat</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl sm:text-2xl font-bold flex items-center justify-center space-x-1 ${
                    change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <TrendingUp className={`h-5 w-5 ${change24h < 0 ? 'rotate-180' : ''}`} />
                    <span>
                      {change24h >= 0 ? '+' : ''}{formatPrice(change24h, asset.type, showTRYPrice)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">24s Değişim</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl sm:text-2xl font-bold ${
                    changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {changePercent24h >= 0 ? '+' : ''}{changePercent24h.toFixed(2)}%
                  </div>
                  <div className="text-sm text-muted-foreground">24s Değişim (%)</div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Detaylı Bilgiler */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="flex w-full gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide relative z-10 bg-muted p-1 rounded-md">
                <TabsTrigger value="overview" className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm min-w-[84px] sm:min-w-0">Durum</TabsTrigger>
                <TabsTrigger value="chart" className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm min-w-[84px] sm:min-w-0">Grafik</TabsTrigger>
                <TabsTrigger value="details" className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm min-w-[84px] sm:min-w-0">Detaylar</TabsTrigger>
                <TabsTrigger value="portfolio" className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm min-w-[84px] sm:min-w-0">Portföyüm</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {asset.high24h && (
                    <Card className="p-4 sm:p-6">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {formatPrice(asset.high24h, asset.type, showTRYPrice)}
                          </div>
                          <div className="text-sm text-muted-foreground">24s En Yüksek</div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {asset.low24h && (
                    <Card className="p-4 sm:p-6">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-6 w-6 text-red-500 rotate-180" />
                        <div>
                          <div className="text-2xl font-bold">
                            {formatPrice(asset.low24h, asset.type, showTRYPrice)}
                          </div>
                          <div className="text-sm text-muted-foreground">24s En Düşük</div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {asset.volume24h && (
                    <Card className="p-4 sm:p-6">
                      <div className="flex items-center space-x-3">
                        <Volume2 className="h-6 w-6 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {formatLargeNumber(asset.volume24h)}
                          </div>
                          <div className="text-sm text-muted-foreground">24s Hacim</div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {asset.marketCap && (
                    <Card className="p-4 sm:p-6">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-6 w-6 text-purple-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            ${formatLargeNumber(asset.marketCap)}
                          </div>
                          <div className="text-sm text-muted-foreground">Piyasa Değeri</div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {asset.supply && (
                    <Card className="p-4 sm:p-6">
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="h-6 w-6 text-orange-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {formatLargeNumber(asset.supply)}
                          </div>
                          <div className="text-sm text-muted-foreground">Toplam Arz</div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="chart">
                <Card className="p-3 sm:p-6">
                  <div className="space-y-4">
                    {type === 'crypto' ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">TradingView Canlı Grafik</h3>
                        </div>
                        <div className="h-[300px] sm:h-[450px] md:h-[500px]">
                          <TradingViewEmbed 
                            symbol={`BINANCE:${(asset.symbol || symbol || '').toUpperCase()}USDT`}
                            interval="60"
                            theme="dark"
                            height={typeof window !== 'undefined' && window.innerWidth < 640 ? 300 : 500}
                          />
                        </div>
                      </>
                    ) : (
                      <PriceChart
                        data={chartData}
                        title={`${asset.name} (${asset.symbol})`}
                        timeframe="1D"
                        isPositive={changePercent24h >= 0}
                        currency="TRY"
                      />
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="mt-4 sm:mt-6">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Detaylı Bilgiler</h3>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm text-muted-foreground">Sembol</Label>
                        <p className="font-medium">{asset.symbol}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Ad</Label>
                        <p className="font-medium">{asset.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Tip</Label>
                        <Badge variant={asset.type === 'crypto' ? 'default' : 'secondary'}>
                          {asset.type === 'crypto' ? 'Kripto Para' : 'Hisse Senedi'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Güncel Fiyat</Label>
                        <p className="font-medium">{formatPrice(displayPrice, asset.type, showTRYPrice)}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-4 sm:mt-6">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Portföyümdeki {asset.symbol}</h3>
                    </div>
                    
                    {userAsset ? (
                      <div className="space-y-6">
                        {(() => {
                          const pnl = calculatePnL(userAsset.symbol, userAsset.quantity, userAsset.purchasePrice);
                          return (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                              <Card className="p-4">
                                <div className="space-y-2">
                                  <div className="text-sm text-muted-foreground">Miktar</div>
                                  <div className="text-2xl font-bold">{userAsset.quantity}</div>
                                </div>
                              </Card>
                              
                              <Card className="p-4">
                                <div className="space-y-2">
                                  <div className="text-sm text-muted-foreground">Alış Fiyatı</div>
                                  <div className="text-2xl font-bold">
                                    {formatPrice(userAsset.purchasePrice, userAsset.type, showTRYPrice)}
                                  </div>
                                </div>
                              </Card>
                              
                              {pnl && (
                                <Card className="p-4">
                                  <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Güncel Değer</div>
                                    <div className="text-2xl font-bold">
                                      {formatPrice(pnl.currentValue, userAsset.type, showTRYPrice)}
                                    </div>
                                  </div>
                                </Card>
                              )}
                              
                              {pnl && (
                                <Card className="p-4">
                                  <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Kar/Zarar</div>
                                    <div className={`text-2xl font-bold ${pnl.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                      {pnl.isProfit ? '+' : ''}{formatPrice(pnl.totalPnL, userAsset.type, showTRYPrice)}
                                    </div>
                                    <div className={`text-sm ${pnl.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                      {pnl.isProfit ? '+' : ''}{pnl.pnlPercent.toFixed(2)}%
                                    </div>
                                  </div>
                                </Card>
                              )}
                            </div>
                          );
                        })()}
                        
                        <Card className="p-4">
                          <div className="space-y-4">
                            <h4 className="font-semibold">Detaylı Bilgiler</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <div className="text-sm text-muted-foreground">Toplam Yatırım</div>
                                <div className="font-medium">
                                  {formatPrice(userAsset.quantity * userAsset.purchasePrice, userAsset.type, showTRYPrice)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Eklenme Tarihi</div>
                                <div className="font-medium">
                                  {userAsset.addedAt.toLocaleDateString('tr-TR')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <DollarSign className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h4 className="text-lg font-semibold mb-2">Bu varlığa sahip değilsiniz</h4>
                        <p className="text-muted-foreground mb-4">
                          Bu varlığı portföyünüze eklemek için varlık ekleme sayfasını ziyaret edin.
                        </p>
                        <Button onClick={() => navigate('/add-asset')}>
                          Varlık Ekle
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AssetDetail;