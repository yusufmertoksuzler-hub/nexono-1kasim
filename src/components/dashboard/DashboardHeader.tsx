import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Search, Settings, User, Plus, Sparkles, LogOut, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import NexonoAIChat from '@/components/ai/NexonoAIChat';
// Verileri çalışma anında public klasöründen oku

const DashboardHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const [dataset, setDataset] = useState<{ id: string; symbol: string; name: string; type: 'stock'|'crypto' }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [coinsRes, stocksRes] = await Promise.all([
          fetch('/coins.json', { cache: 'no-store' }),
          fetch('/hisseler.json', { cache: 'no-store' })
        ]);
        const coinsJson = coinsRes.ok ? await coinsRes.json() : { data: [] };
        const stocksJson = stocksRes.ok ? await stocksRes.json() : { data: {} };
        const coins = (coinsJson?.data || []).map((c: any) => ({ id: c.id, symbol: (c.symbol || '').toUpperCase(), name: c.name, type: 'crypto' as const }));
        const stocksData = stocksJson?.data || {};
        const stocks = Object.keys(stocksData).map((sym) => ({ id: sym.replace('.IS',''), symbol: sym.replace('.IS',''), name: sym.replace('.IS',''), type: 'stock' as const }));
        setDataset([...stocks, ...coins]);
      } catch {}
    };
    load();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [] as { id: string; symbol: string; name: string; type: 'stock'|'crypto' }[];
    const q = query.toLowerCase();
    return dataset.filter((item) => item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, dataset]);
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="relative">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">NEXONO</h1>
              <p className="text-sm text-muted-foreground">Financial Dashboard</p>
            </div>
          </div>

          {/* Search - Hidden on mobile */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Hisse veya kripto ara..."
                className="pl-10 bg-card border-border"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results[0]) {
                    const it = results[0];
                    navigate(`/${it.type}/${it.type === 'stock' ? it.symbol : it.symbol.toLowerCase()}`, { state: { asset: it } });
                    setQuery('');
                  }
                }}
              />
              {results.length > 0 && (
                <div className="absolute mt-2 w-full bg-card border border-border rounded-md shadow-lg z-50">
                  {results.map((it) => (
                    <button key={`${it.type}-${it.id}`} className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => {
                        navigate(`/${it.type}/${it.type === 'stock' ? it.symbol : it.symbol.toLowerCase()}`, { state: { asset: it } });
                        setQuery('');
                      }}>
                      <span className="text-muted-foreground mr-2">{it.type === 'stock' ? 'Hisse' : 'Kripto'}</span>
                      <span className="font-medium">{it.symbol}</span>
                      <span className="ml-2 text-muted-foreground">{it.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/favorites')} className="hidden md:flex">
              <Heart className="h-4 w-4" />
            </Button>
            {/* NEXONO AI Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm"
                  className="hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  NEXONO AI
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[100vw] h-[100vh] max-w-none max-h-none m-0 p-0 rounded-none border-none overflow-hidden flex flex-col" aria-describedby={undefined}>
                <DialogHeader className="px-2 sm:px-4 py-3 border-b flex items-center justify-between bg-background/95 backdrop-blur">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => (document as any).activeElement?.dispatchEvent(new Event('click'))}>
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <DialogTitle className="text-sm sm:text-base">NEXONO AI</DialogTitle>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => (document as any).activeElement?.dispatchEvent(new Event('click'))}>✕</Button>
                  </div>
                  <DialogDescription className="sr-only">NEXONO AI sohbet penceresi</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  <NexonoAIChat />
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="default" 
              size="sm" 
              onClick={() => navigate('/add-asset')}
              className="hidden md:flex"
            >
              <Plus className="h-4 w-4 mr-2" />
              Varlık Ekle
            </Button>
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden lg:inline">{user.email}</span>
                <Button variant="outline" size="sm" onClick={logout} className="hidden sm:flex">
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/add-asset')} className="sm:hidden">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/favorites')} className="sm:inline-flex">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={logout} className="sm:hidden">
                  <LogOut className="h-4 w-4" />
                </Button>
                {/* Mobile AI button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="icon" className="sm:hidden bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)]">
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-[95vw] sm:!w-[70vw] sm:!max-w-[800px] max-h-[90vh] sm:!max-h-[80vh] h-auto sm:!h-auto rounded-2xl sm:!rounded-3xl !p-0 !m-0 !border !border-border/50 !bg-background !overflow-hidden !flex !flex-col !left-[50%] sm:!left-[50%] !top-[50%] sm:!top-[50%] !bottom-auto sm:!bottom-auto !translate-x-[-50%] sm:!translate-x-[-50%] !translate-y-[-50%] sm:!translate-y-[-50%] !fixed !shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%] duration-300 [&>button:has(span.sr-only)]:hidden !gap-0" aria-describedby={undefined}>
                    <DialogHeader className="px-4 py-3 border-b">
                      <DialogTitle className="text-sm sm:text-base">NEXONO AI</DialogTitle>
                      <DialogDescription className="sr-only">NEXONO AI sohbet penceresi</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto">
                      <NexonoAIChat />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Guest AI button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="hidden sm:flex bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)]">
                      <Sparkles className="h-4 w-4 mr-2" /> NEXONO AI
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-[95vw] sm:!w-[70vw] sm:!max-w-[800px] max-h-[90vh] sm:!max-h-[80vh] h-auto sm:!h-auto rounded-2xl sm:!rounded-3xl !p-0 !m-0 !border !border-border/50 !bg-background !overflow-hidden !flex !flex-col !left-[50%] sm:!left-[50%] !top-[50%] sm:!top-[50%] !bottom-auto sm:!bottom-auto !translate-x-[-50%] sm:!translate-x-[-50%] !translate-y-[-50%] sm:!translate-y-[-50%] !fixed !shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%] duration-300 [&>button:has(span.sr-only)]:hidden !gap-0" aria-describedby={undefined}>
                    <DialogHeader className="px-4 py-3 border-b">
                      <DialogTitle className="text-sm sm:text-base">NEXONO AI</DialogTitle>
                      <DialogDescription className="sr-only">NEXONO AI sohbet penceresi</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto">
                      <NexonoAIChat />
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="hidden sm:flex">Giriş</Button>
                <Button size="sm" onClick={() => navigate('/register')} className="hidden sm:flex">Kayıt</Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('/login')} className="sm:hidden">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;