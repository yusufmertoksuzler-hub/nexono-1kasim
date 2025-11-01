import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Building2, DollarSign, Plus, ArrowUpIcon, ArrowDownIcon, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

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

const MyPortfolio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalGain, setTotalGain] = useState(0);
  const [totalStockValueTRY, setTotalStockValueTRY] = useState(0);
  const [totalCryptoValueUSD, setTotalCryptoValueUSD] = useState(0);
  const { calculatePnL, refreshPrices, loading: priceLoading } = useRealTimePrices();

  useEffect(() => {
    if (user) {
      loadUserAssets();
    }
  }, [user]);

  // Gerçek zamanlı kar/zarar hesaplama
  useEffect(() => {
    if (userAssets.length > 0 && calculatePnL) {
      let totalCurrentValue = 0;
      let totalPurchaseValue = 0;
      let stockSumTRY = 0;
      let cryptoSumUSD = 0;

      userAssets.forEach(asset => {
        const pnl = calculatePnL(asset.symbol, asset.quantity, asset.purchasePrice);
        const currentValue = pnl ? pnl.currentValue : asset.quantity * asset.purchasePrice;
        totalCurrentValue += currentValue;
        totalPurchaseValue += asset.quantity * asset.purchasePrice;
        if (asset.type === 'stock') {
          stockSumTRY += currentValue;
        } else {
          cryptoSumUSD += currentValue;
        }
      });

      setTotalValue(totalCurrentValue || totalPurchaseValue);
      setTotalGain(totalCurrentValue - totalPurchaseValue);
      setTotalStockValueTRY(stockSumTRY);
      setTotalCryptoValueUSD(cryptoSumUSD);
    }
  }, [userAssets, calculatePnL]);

  const loadUserAssets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const assetsRef = collection(db, 'userAssets');
      const q = query(assetsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const assets: UserAsset[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        assets.push({
          id: doc.id,
          ...data,
          addedAt: data.addedAt.toDate()
        } as UserAsset);
      });
      
      setUserAssets(assets);
      
      // Toplam değer hesapla (örnek fiyatlarla)
      const total = assets.reduce((sum, asset) => {
        return sum + (asset.quantity * asset.purchasePrice);
      }, 0);
      setTotalValue(total);
      console.log('Firebase\'den varlıklar yüklendi:', assets.length, 'adet');
      
    } catch (error) {
      console.error('Kullanıcı varlıkları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string, assetName: string) => {
    if (!user) return;
    
    try {
      // Firebase'den sil
      await deleteDoc(doc(db, 'userAssets', assetId));
      
      // LocalStorage'dan da sil (fallback için)
      const localAssets = localStorage.getItem(`userAssets_${user.uid}`);
      if (localAssets) {
        const existingAssets = JSON.parse(localAssets);
        const updatedAssets = existingAssets.filter((asset: any) => asset.id !== assetId);
        localStorage.setItem(`userAssets_${user.uid}`, JSON.stringify(updatedAssets));
      }
      
      // State'i güncelle
      setUserAssets(prev => prev.filter(asset => asset.id !== assetId));
      
      toast.success(`${assetName} varlığı başarıyla kaldırıldı`);
    } catch (error) {
      console.error('Varlık silinirken hata:', error);
      toast.error('Varlık silinirken bir hata oluştu');
    }
  };

  const formatPrice = (price: number, type: 'crypto' | 'stock') => {
    if (type === 'stock') {
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

  const formatUSDShort = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatTRYShort = (num: number) => {
    // Kısa gösterim; büyük sayılar için K/M/B, TRY simgesiyle
    if (num >= 1e12) return `₺${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `₺${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `₺${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `₺${(num / 1e3).toFixed(1)}K`;
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  if (!user) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Portföyüm</h2>
          <Badge variant="outline" className="text-xs">
            {userAssets.length} Varlık
          </Badge>
          {priceLoading && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={refreshPrices}
            size="sm"
            variant="outline"
            className="hidden md:flex"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Fiyatları Güncelle
          </Button>
          <Button
            onClick={() => navigate('/add-asset')}
            size="sm"
            className="hidden md:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            Varlık Ekle
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="p-8 bg-card/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Portföy yükleniyor...</p>
          </div>
        </Card>
      ) : userAssets.length === 0 ? (
        <Card className="p-8 bg-card/50 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Portföyünüz boş</h3>
              <p className="text-muted-foreground mb-4">
                İlk varlığınızı ekleyerek portföyünüzü oluşturmaya başlayın
              </p>
              <Button onClick={() => navigate('/add-asset')}>
                <Plus className="h-4 w-4 mr-2" />
                Varlık Ekle
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Portföy Özeti */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{userAssets.length}</div>
                  <div className="text-sm text-muted-foreground">Toplam Varlık</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Toplam Hisse Değeri</div>
                  <div className="text-xl font-bold">{formatTRYShort(totalStockValueTRY)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Toplam Kripto Değeri</div>
                  <div className="text-xl font-bold">{formatUSDShort(totalCryptoValueUSD)}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {totalGain >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {totalGain >= 0 ? '+' : ''}{totalGain.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Toplam Kar/Zarar</div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Varlık Listesi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Varlıklarım</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userAssets.map((asset, index) => {
                    const pnl = calculatePnL(asset.symbol, asset.quantity, asset.purchasePrice);
                    return (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 rounded-lg border border-border bg-background/50 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                        onClick={() => navigate(`/${asset.type}/${asset.type === 'stock' ? asset.symbol : asset.symbol.toLowerCase()}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {asset.image && typeof asset.image === 'string' && asset.image.trim() !== '' && (
                              <img 
                                src={asset.image} 
                                alt={asset.name}
                                className="w-10 h-10 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-foreground">{asset.symbol}</h3>
                                <Badge variant={asset.type === 'crypto' ? 'default' : 'secondary'} className="text-xs">
                                  {asset.type === 'crypto' ? 'CRYPTO' : 'STOCK'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{asset.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {pnl && (
                              <div className="text-right">
                                <div className={`text-sm font-medium ${pnl.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                  {pnl.isProfit ? '+' : ''}{pnl.totalPnL.toFixed(2)}
                                </div>
                                <div className={`text-xs ${pnl.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                  {pnl.isProfit ? '+' : ''}{pnl.pnlPercent.toFixed(2)}%
                                </div>
                              </div>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Varlığı Kaldır</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <strong>{asset.symbol}</strong> varlığını portföyünüzden kaldırmak istediğinizden emin misiniz? 
                                    Bu işlem geri alınamaz.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAsset(asset.id, asset.symbol)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Varlığı Kaldır
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Miktar:</span>
                            <span className="font-medium">{asset.quantity}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Alış Fiyatı:</span>
                            <span className="font-medium">
                              {formatPrice(asset.purchasePrice, asset.type)}
                            </span>
                          </div>
                          {pnl && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Güncel Fiyat:</span>
                              <span className="font-medium">
                                {formatPrice(pnl.currentValue / asset.quantity, asset.type)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Güncel Değer:</span>
                            <span className="font-medium">
                              {pnl ? formatPrice(pnl.currentValue, asset.type) : formatPrice(asset.quantity * asset.purchasePrice, asset.type)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                            Eklenme: {asset.addedAt.toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </section>
  );
};

export default MyPortfolio;
