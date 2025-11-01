import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  symbol: string; // e.g., BTCUSDT or BINANCE:BTCUSDT or BIST:ASELS
  interval?: string; // 60, 240, D
  theme?: 'dark' | 'light';
  height?: number;
}

// TradingView script'ini global olarak yükle (sadece bir kez)
let tvScriptLoaded = false;
let tvScriptLoading = false;
const tvScriptPromises: Array<() => void> = [];

const loadTradingViewScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (tvScriptLoaded) {
      resolve();
      return;
    }
    
    if (tvScriptLoading) {
      tvScriptPromises.push(() => resolve());
      return;
    }
    
    tvScriptLoading = true;
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/tv.js';
    s.async = true;
    s.onload = () => {
      tvScriptLoaded = true;
      tvScriptLoading = false;
      resolve();
      tvScriptPromises.forEach(fn => fn());
      tvScriptPromises.length = 0;
    };
    s.onerror = () => {
      tvScriptLoading = false;
      reject(new Error('TradingView script yüklenemedi'));
      tvScriptPromises.forEach(() => {});
      tvScriptPromises.length = 0;
    };
    document.head.appendChild(s);
  });
};

const TradingViewEmbed: React.FC<Props> = ({ symbol, interval = '60', theme = 'dark', height = 480 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const containerId = `tv_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    
    if (containerRef.current) {
      containerRef.current.id = containerId;
    }

    const initWidget = async () => {
      try {
        await loadTradingViewScript();
        
        if (!mounted || !containerRef.current) return;
        
        // @ts-ignore
        if (window.TradingView) {
          // Eski widget'ı temizle
          if (widgetRef.current) {
            try {
              widgetRef.current.remove();
            } catch {}
          }
          
          // @ts-ignore
          widgetRef.current = new window.TradingView.widget({
            autosize: true,
            symbol,
            interval,
            timezone: 'Etc/UTC',
            theme,
            style: '1',
            locale: 'tr',
            toolbar_bg: 'rgba(0, 0, 0, 0)',
            container_id: containerId,
            hide_top_toolbar: false,
            hide_legend: false,
            studies: [],
            withdateranges: true,
            allow_symbol_change: false,
            loading_screen: { backgroundColor: 'transparent' },
            overrides: {
              'paneProperties.background': theme === 'dark' ? '#000000' : '#ffffff',
            }
          });
          
          // Widget yüklendiğinde loading'i kapat
          setTimeout(() => {
            if (mounted) {
              setLoading(false);
            }
          }, 500);
        }
      } catch (err) {
        console.error('TradingView widget hatası:', err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    initWidget();

    return () => {
      mounted = false;
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch {}
      }
    };
  }, [symbol, interval, theme]);

  if (error) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="text-center text-muted-foreground">
          <p>Grafik yüklenemedi</p>
          <p className="text-sm">Lütfen sayfayı yenileyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Grafik yükleniyor...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default TradingViewEmbed;


