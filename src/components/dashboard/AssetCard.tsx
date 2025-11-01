import React, { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

interface AssetCardProps {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  volumeTL?: number;
  image?: string;
  type: 'crypto' | 'stock';
  currency?: string;
  onClick: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({
  id,
  symbol,
  name,
  price,
  change,
  changePercent,
  volume,
  volumeTL,
  image,
  type,
  currency = 'USD',
  onClick
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const isPositive = change >= 0;

  useEffect(() => {
    if (user && symbol) {
      checkFavorite();
    }
  }, [user, symbol]);

  const checkFavorite = async () => {
    if (!user || !symbol) return;
    try {
      const favRef = collection(db, 'userFavorites');
      const q = query(favRef, where('userId', '==', user.uid), where('symbol', '==', symbol.toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setIsFavorite(true);
        setFavId(snap.docs[0].id);
      }
    } catch {}
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (isFavorite && favId) {
        await deleteDoc(doc(db, 'userFavorites', favId));
        setIsFavorite(false);
        setFavId(null);
      } else {
        const ref = await addDoc(collection(db, 'userFavorites'), {
          userId: user.uid,
          symbol: symbol.toUpperCase(),
          name,
          type,
          image: image || null,
          addedAt: new Date()
        });
        setIsFavorite(true);
        setFavId(ref.id);
      }
    } catch {}
  };
  const formatPrice = (price: number) => {
    if (currency === 'TRY') {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    }
    if (type === 'crypto' && price < 1) {
      return `$${price.toFixed(6)}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="p-4 cursor-pointer hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm min-w-[280px] touch-target"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3 relative">
          <div className="flex items-center space-x-3">
            {image && (
              <img 
                src={image} 
                alt={name}
                className="w-10 h-10 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-foreground">{symbol.toUpperCase()}</h3>
                <Badge variant={type === 'crypto' ? 'default' : 'secondary'} className="text-xs">
                  {type === 'crypto' ? 'CRYPTO' : 'STOCK'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate max-w-[150px]">{name}</p>
            </div>
          </div>
          
          {/* Heart icon for favorites - positioned absolutely */}
          <button 
            className="absolute top-0 right-0 p-1 hover:bg-muted rounded-full transition-colors z-10 focus:outline-none focus:ring-0 active:bg-muted"
            onClick={toggleFavorite}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground hover:text-red-500 fill-none'}`} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(price)}
            </span>
            <div className={`flex items-center space-x-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
              <span className="font-medium">
                {Math.abs(changePercent).toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className={`${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{currency === 'TRY' ? formatPrice(change) : `$${change.toFixed(2)}`}
            </span>
            {(volume || volumeTL) && (
              <span className="text-muted-foreground">
                Vol: {currency === 'TRY' && volumeTL ? `${formatVolume(volumeTL)} TL` : formatVolume(volume || 0)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default AssetCard;