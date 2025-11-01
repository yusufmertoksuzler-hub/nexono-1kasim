import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, TrendingUp, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FavoriteItem {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  image?: string;
  addedAt: Date;
}

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const favRef = collection(db, 'userFavorites');
        const q = query(favRef, where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const rows: FavoriteItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          rows.push({
            id: d.id,
            symbol: data.symbol,
            name: data.name,
            type: data.type,
            image: data.image,
            addedAt: data.addedAt?.toDate ? data.addedAt.toDate() : new Date()
          });
        });
        setItems(rows);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const removeFav = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'userFavorites', id));
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Favorilerim</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">İstediğiniz varlıkları takip edin (İsteğe bağlı portföy gibi kullanabilirsiniz)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-safe">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card key={it.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {it.image ? (
                  <img src={it.image} className="w-10 h-10 rounded-full object-cover" onError={(e) => ((e.currentTarget.style.display='none'))} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {it.type === 'crypto' ? <TrendingUp className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{it.symbol}</span>
                    <Badge variant={it.type === 'crypto' ? 'default' : 'secondary'}>{it.type === 'crypto' ? 'CRYPTO' : 'STOCK'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{it.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/${it.type}/${it.type==='stock'?it.symbol:it.symbol.toLowerCase()}`)}>
                  <Heart className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => removeFav(it.id)}>Kaldır</Button>
              </div>
            </Card>
          ))}
          {!loading && items.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">Henüz favoriniz yok.</Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Favorites;
