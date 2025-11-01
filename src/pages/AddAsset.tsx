import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Search, TrendingUp, Building2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface AssetData {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  price?: number;
  image?: string;
}

interface UserAsset {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  quantity: number;
  purchasePrice: number;
  addedAt: Date;
}

const AddAsset = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation() as any;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null);
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);

  // Kripto ve hisse verilerini yükle
  const [cryptoAssets, setCryptoAssets] = useState<AssetData[]>([]);
  const [stockAssets, setStockAssets] = useState<AssetData[]>([]);

  useEffect(() => {
    loadAssets();
    if (user) {
      loadUserAssets();
    }
  }, [user]);

  // Ön seçim ile gelindiyse diyalogu aç
  useEffect(() => {
    const pre = location?.state?.preselect;
    if (pre) {
      setSelectedAsset(pre);
      setIsDialogOpen(true);
    }
  }, [location?.state]);

  const loadAssets = async () => {
    try {
      // Kripto verilerini yükle
      const coinsRes = await fetch('/coins.json', { cache: 'no-store' });
      const coinsJson = coinsRes.ok ? await coinsRes.json() : { data: [] };
      const cryptos = (coinsJson?.data || []).map((c: any) => ({
        id: c.id,
        symbol: (c.symbol || '').toUpperCase(),
        name: c.name,
        type: 'crypto' as const,
        image: c.image?.large || c.image?.small
      }));
      setCryptoAssets(cryptos);

      // Hisse verilerini yükle
      const stocksRes = await fetch('/hisseler.json', { cache: 'no-store' });
      const stocksJson = stocksRes.ok ? await stocksRes.json() : { data: {} };
      const stocksData = stocksJson?.data || {};
      const stocks = Object.keys(stocksData).map((sym) => {
        const stockData = stocksData[sym];
        return {
          id: sym.replace('.IS', ''),
          symbol: sym.replace('.IS', ''),
          name: stockData?.ad || stockData?.uzunAd || sym.replace('.IS', ''),
          type: 'stock' as const,
          price: stockData?.fiyat
        };
      });
      setStockAssets(stocks);
    } catch (error) {
      console.error('Varlık verileri yüklenirken hata:', error);
    }
  };

  const loadUserAssets = async () => {
    if (!user) return;
    
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
    } catch (error) {
      console.error('Kullanıcı varlıkları yüklenirken hata:', error);
      // Firebase izin hatası durumunda localStorage'dan yükle (geçici çözüm)
      try {
        const localAssets = localStorage.getItem(`userAssets_${user.uid}`);
        if (localAssets) {
          const parsedAssets = JSON.parse(localAssets).map((asset: any) => ({
            ...asset,
            addedAt: new Date(asset.addedAt)
          }));
          setUserAssets(parsedAssets);
          console.log('LocalStorage\'dan varlıklar yüklendi:', parsedAssets.length, 'adet');
        } else {
          console.log('LocalStorage\'da varlık bulunamadı');
        }
      } catch (localError) {
        console.error('LocalStorage\'dan yüklenirken hata:', localError);
      }
    }
  };

  const allAssets = [...cryptoAssets, ...stockAssets];
  const filteredAssets = allAssets.filter(asset =>
    (asset.symbol && asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (asset.name && asset.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 20);

  const handleAssetSelect = (asset: AssetData) => {
    setSelectedAsset(asset);
    setIsDialogOpen(true);
    setSearchQuery('');
  };

  const handleAddAsset = async () => {
    if (!selectedAsset || !user) return;

    setIsLoading(true);
    
    // Girdi normalizasyonu (TR ondalık virgülü destekle)
    const hasQty = String(quantity).trim() !== '';
    const hasPrice = String(purchasePrice).trim() !== '';
    const normalizedQuantity = hasQty ? parseFloat(String(quantity).replace(',', '.')) : 0;
    const normalizedPurchase = hasPrice ? parseFloat(String(purchasePrice).replace(',', '.')) : 0;
    if (hasQty && (!isFinite(normalizedQuantity) || normalizedQuantity < 0)) {
      setIsLoading(false);
      toast.error('Geçerli bir miktar girin.');
      return;
    }
    if (hasPrice && (!isFinite(normalizedPurchase) || normalizedPurchase < 0)) {
      setIsLoading(false);
      toast.error('Geçerli bir alış fiyatı girin.');
      return;
    }

    // Asset data'yı önceden tanımla (güvenli tür dönüşümü)
    const safeSymbol = typeof selectedAsset.symbol === 'string' ? selectedAsset.symbol.toUpperCase() : String(selectedAsset.symbol || '').toUpperCase();
    const safeName = typeof selectedAsset.name === 'string' ? selectedAsset.name : safeSymbol;
    const safeType: 'crypto' | 'stock' = selectedAsset.type === 'stock' ? 'stock' : 'crypto';
    const safeImage = typeof selectedAsset.image === 'string' ? selectedAsset.image : null;

    const assetData = {
      userId: user.uid,
      symbol: safeSymbol,
      name: safeName,
      type: safeType,
      quantity: normalizedQuantity,
      purchasePrice: normalizedPurchase,
      watchOnly: !(hasQty && hasPrice),
      addedAt: new Date(),
      image: safeImage
    } as const;

    try {
      await addDoc(collection(db, 'userAssets'), assetData);
      
      toast.success('Varlık başarıyla eklendi!');
      setIsDialogOpen(false);
      setSelectedAsset(null);
      setQuantity('');
      setPurchasePrice('');
      loadUserAssets(); // Kullanıcı varlıklarını yeniden yükle
    } catch (error: any) {
      console.error('Varlık eklenirken hata:', error);
      const msg = error?.message ? String(error.message) : 'Varlık eklenemedi. Lütfen tekrar deneyin.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Varlık Ekle</h1>
                <p className="text-sm text-muted-foreground">Portföyünüze yeni varlık ekleyin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Arama Bölümü */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Varlık Ara</h2>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Hisse veya kripto sembolü/ismi ara..."
                    className="pl-10 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Arama Sonuçları */}
                <AnimatePresence>
                  {searchQuery && filteredAssets.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 max-h-96 overflow-y-auto"
                    >
                      <h3 className="text-sm font-medium text-muted-foreground">Sonuçlar:</h3>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAssets.map((asset) => (
                          <motion.div
                            key={`${asset.type}-${asset.id}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative p-4 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-md"
                            onClick={() => handleAssetSelect(asset)}
                          >
                            <div className="flex flex-col items-center text-center space-y-3">
                              {/* Logo/İkon */}
                            <div className="relative">
                              {asset.image && typeof asset.image === 'string' && asset.image.trim() !== '' ? (
                                <img 
                                  src={asset.image} 
                                  alt={typeof asset.name === 'string' ? asset.name : asset.symbol}
                                  className="w-12 h-12 rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${(asset.image && typeof asset.image === 'string' && asset.image.trim() !== '') ? 'hidden' : 'flex'} ${
                                  asset.type === 'crypto' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'bg-secondary/10 text-secondary'
                                }`}
                              >
                                {asset.type === 'crypto' ? (
                                  <TrendingUp className="h-6 w-6" />
                                ) : (
                                  <Building2 className="h-6 w-6" />
                                )}
                              </div>
                                <div className="absolute -top-1 -right-1">
                                  <Badge 
                                    variant={asset.type === 'crypto' ? 'default' : 'secondary'} 
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {asset.type === 'crypto' ? 'CRYPTO' : 'STOCK'}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Asset Bilgileri */}
                              <div className="space-y-1">
                                <div className="font-semibold text-lg">{asset.symbol}</div>
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                  {typeof asset.name === 'string' ? asset.name : asset.symbol}
                                </div>
                              </div>
                              
                              {/* Ekleme İkonu */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Plus className="h-4 w-4 text-primary" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {searchQuery && filteredAssets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Hiçbir varlık bulunamadı</p>
                    <p className="text-sm">Farklı bir arama terimi deneyin</p>
                  </div>
                )}

                {/* Popüler Varlıklar - Arama yapılmadığında göster */}
                {!searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-medium text-muted-foreground">Popüler Kripto Paralar</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      {cryptoAssets.slice(0, 8).map((asset) => (
                        <motion.div
                          key={`crypto-${asset.id}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-md"
                          onClick={() => handleAssetSelect(asset)}
                        >
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="relative">
                              {asset.image && typeof asset.image === 'string' && asset.image.trim() !== '' ? (
                                <img 
                                  src={asset.image} 
                                  alt={typeof asset.name === 'string' ? asset.name : asset.symbol}
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${(asset.image && typeof asset.image === 'string' && asset.image.trim() !== '') ? 'hidden' : 'flex'} bg-primary/10 text-primary`}
                              >
                                <TrendingUp className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-semibold text-sm">{asset.symbol}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {typeof asset.name === 'string' ? asset.name : asset.symbol}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 mt-6">
                      <Building2 className="h-4 w-4 text-secondary" />
                      <h3 className="text-sm font-medium text-muted-foreground">Popüler Hisse Senetleri</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      {stockAssets.slice(0, 8).map((asset) => (
                        <motion.div
                          key={`stock-${asset.id}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-md"
                          onClick={() => handleAssetSelect(asset)}
                        >
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary/10 text-secondary">
                                <Building2 className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-semibold text-sm">{asset.symbol}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {typeof asset.name === 'string' ? asset.name : asset.symbol}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Mevcut Varlıklar */}
          {userAssets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Portföyüm ({userAssets.length})</h2>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userAssets.map((asset) => (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-lg border border-border bg-background/50 hover:border-primary/50 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={asset.type === 'crypto' ? 'default' : 'secondary'} className="text-xs">
                              {asset.type === 'crypto' ? 'CRYPTO' : 'STOCK'}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">{asset.symbol}</div>
                          <div className="text-sm text-muted-foreground">{asset.name}</div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Miktar: </span>
                            <span className="font-medium">{asset.quantity}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Alış Fiyatı: </span>
                            <span className="font-medium">
                              {asset.type === 'stock' ? '₺' : '$'}{asset.purchasePrice.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {asset.addedAt.toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Varlık Ekleme Dialog'u */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Varlık Ekle</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Portföyünüze yeni varlık ekleyin
                </p>
              </DialogHeader>
              
              {selectedAsset && (
                <div className="space-y-6">
                  {/* Seçilen Varlık Bilgisi */}
                  <div className="p-4 rounded-lg border border-border bg-muted/50">
                    <div className="flex items-center space-x-3">
                      {selectedAsset.type === 'crypto' ? (
                        <TrendingUp className="h-5 w-5 text-primary" />
                      ) : (
                        <Building2 className="h-5 w-5 text-secondary" />
                      )}
                      <div>
                        <div className="font-medium">{selectedAsset.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {typeof selectedAsset.name === 'string' ? selectedAsset.name : selectedAsset.symbol}
                        </div>
                        <Badge variant={selectedAsset.type === 'crypto' ? 'default' : 'secondary'} className="text-xs mt-1">
                          {selectedAsset.type === 'crypto' ? 'CRYPTO' : 'STOCK'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Form Alanları */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Miktar</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="Örn: 1,5"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Alış Fiyatı ({selectedAsset.type === 'stock' ? '₺' : '$'})
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="Örn: 100,00"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Butonlar */}
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={handleAddAsset}
                      disabled={isLoading || !quantity || !purchasePrice}
                      className="flex-1"
                    >
                      {isLoading ? 'Ekleniyor...' : 'Ekle'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default AddAsset;
