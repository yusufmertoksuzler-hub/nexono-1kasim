import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, User as UserIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import useRealTimePrices from '@/hooks/useRealTimePrices';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CryptoData {
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

interface StockData {
  [key: string]: {
    ad: string;
    fiyat: number;
    degisim: number;
    degisimYuzde: number;
    hacim: number;
    piyasaDegeri: number;
    yuksek: number;
    dusuk: number;
  };
}

interface MessageItem {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface UserAssetRow {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  quantity: number;
  purchasePrice: number;
}

interface CurrentAsset {
  symbol?: string;
  name?: string;
  type?: 'crypto' | 'stock';
  price?: number;
  changePercent24h?: number;
}

interface NexonoAIChatProps {
  currentAsset?: CurrentAsset; // Hangi varlık sayfasında olduğumuz
}

const NexonoAIChat: React.FC<NexonoAIChatProps> = ({ currentAsset }) => {
  const { user } = useAuth();
  const { prices } = useRealTimePrices();
  const [userAssets, setUserAssets] = useState<UserAssetRow[]>([]);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [stockData, setStockData] = useState<StockData>({});

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [vhReady, setVhReady] = useState(false);
  const [kbPad, setKbPad] = useState(0);
  const welcomeShownRef = useRef(false); // Welcome mesajının gösterilip gösterilmediğini takip et

  // Handle mobile viewport height (keyboard safe)
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setVhReady(true);
    };
    setVh();
    window.addEventListener('resize', setVh);
    // visualViewport (iOS/Android) keyboard resize
    const vv = (window as any).visualViewport;
    if (vv && typeof vv.addEventListener === 'function') {
      const onVv = () => {
        setVh();
        try {
          const kb = Math.max(0, window.innerHeight - vv.height);
          setKbPad(kb > 0 ? kb : 0);
          inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {}
      };
      vv.addEventListener('resize', onVv);
      vv.addEventListener('scroll', onVv);
    }
    return () => {
      window.removeEventListener('resize', setVh);
      if (vv && typeof vv.removeEventListener === 'function') {
        try { vv.removeEventListener('resize', setVh as any); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Welcome mesajını sadece ilk yüklemede göster (mesajlar yoksa veya sadece welcome varsa)
    // Eğer kullanıcı zaten mesaj göndermişse (messages.length > 1), welcome'ı tekrar gösterme
    if (welcomeShownRef.current && messages.length > 1) return;
    
    // Mesajlar varsa ve kullanıcı mesajları varsa hiçbir şey yapma (mesajları koru)
    const hasUserMessages = messages.some(m => m.role === 'user');
    if (hasUserMessages) return;
    
    let welcomeText = 'Merhaba efendim, ben NEXONO AI. Nasılsınız? Genel piyasa durumu hakkında konuşabiliriz veya belirli bir hisse/coin sorarsanız analiz yapabilirim.';
    
    // Eğer belirli bir varlık sayfasındaysak, o varlıkla ilgili konuşabileceğimizi belirt
    if (currentAsset?.symbol && currentAsset?.name) {
      const assetType = currentAsset.type === 'crypto' ? 'kripto para' : 'hisse';
      const priceInfo = currentAsset.price ? ` (Güncel fiyat: ${currentAsset.price.toLocaleString('tr-TR')} ${currentAsset.type === 'crypto' ? 'USD' : 'TRY'})` : '';
      welcomeText = `Merhaba efendim, ben NEXONO AI. Şu anda ${currentAsset.name} (${currentAsset.symbol}) ${assetType} sayfasındayız${priceInfo}. Nasılsınız? Bu ${assetType} hakkında konuşmak isterseniz yardımcı olabilirim, ama normal sohbet de edebiliriz.`;
    }
    
    const welcome: MessageItem = {
      id: 'welcome',
      role: 'ai',
      content: welcomeText,
      timestamp: new Date()
    };
    
    // Sadece welcome mesajı varsa güncelle, hiç mesaj yoksa yeni ekle
    setMessages([welcome]);
    welcomeShownRef.current = true;
  }, [currentAsset]);

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        // Kripto verilerini yükle
        const cryptoRes = await fetch('/coins.json');
        if (cryptoRes.ok) {
          const cryptoJson = await cryptoRes.json();
          setCryptoData(cryptoJson.data || []);
        }
        
        // Hisse verilerini yükle
        const stockRes = await fetch('/hisseler.json');
        if (stockRes.ok) {
          const stockJson = await stockRes.json();
          setStockData(stockJson.data || {});
        }
      } catch (e) {
        console.error('Piyasa verileri yüklenirken hata:', e);
      }
    };
    loadMarketData();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const assetsRef = collection(db, 'userAssets');
        const q = query(assetsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const rows: UserAssetRow[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as any;
          rows.push({
            id: doc.id,
            symbol: d.symbol,
            name: d.name,
            type: d.type,
            quantity: d.quantity,
            purchasePrice: d.purchasePrice,
          });
        });
        setUserAssets(rows);
      } catch (e) {
        console.error('Portföy yüklenirken hata', e);
      }
    };
    load();
  }, [user]);

  const marketContext = useMemo(() => {
    const lines: string[] = [];
    
    // Top 10 kripto - GERÇEK VERİLER
    if (cryptoData.length > 0) {
      lines.push('=== GERÇEK KRİPTO VERİLERİ (coins.json) ===');
      cryptoData.slice(0, 10).forEach((c) => {
        lines.push(`${c.name} (${c.symbol.toUpperCase()})`);
        lines.push(`  Fiyat: $${c.current_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        lines.push(`  24s Değişim: ${c.price_change_percentage_24h >= 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(2)}%`);
        lines.push(`  24s Hacim: $${(c.total_volume / 1e9).toFixed(2)}B`);
        lines.push(`  Piyasa Değeri: $${(c.market_cap / 1e9).toFixed(2)}B`);
        lines.push('');
      });
    }
    
    // Top 10 hisse - GERÇEK VERİLER
    const stockEntries = Object.entries(stockData).slice(0, 10);
    if (stockEntries.length > 0) {
      lines.push('=== GERÇEK HİSSE VERİLERİ (hisseler.json) ===');
      stockEntries.forEach(([symbol, data]) => {
        const cleanSymbol = symbol.replace('.IS', '');
        lines.push(`${data.ad} (${cleanSymbol})`);
        lines.push(`  Fiyat: ₺${data.fiyat.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        lines.push(`  Değişim: ${data.degisimYuzde >= 0 ? '+' : ''}${data.degisimYuzde.toFixed(2)}%`);
        lines.push(`  Hacim: ₺${(data.hacim / 1e6).toFixed(1)}M`);
        lines.push(`  Piyasa Değeri: ₺${(data.piyasaDegeri / 1e9).toFixed(2)}B`);
        lines.push('');
      });
    }
    
    return lines.join('\n');
  }, [cryptoData, stockData]);

  const portfolioContext = useMemo(() => {
    if (!userAssets.length) return 'Kullanıcının portföyünde varlık yok.';
    const lines: string[] = ['=== KULLANICI PORTFÖYÜ ==='];
    userAssets.forEach((a) => {
      const p = prices[a.symbol?.toUpperCase?.() ?? a.symbol];
      const current = p?.price;
      const ch = p?.changePercent24h;
      const profit = current ? ((current - a.purchasePrice) / a.purchasePrice * 100).toFixed(2) : 'N/A';
      lines.push(`${a.name} (${a.symbol}) | Adet: ${a.quantity} | Alış: ${a.purchasePrice} | Güncel: ${current ?? 'N/A'} | Kar/Zarar: ${profit}%`);
    });
    return lines.join('\n');
  }, [userAssets, prices]);

  const buildPayload = (userText: string, conversationHistory: MessageItem[] = []) => {
    // Mevcut varlık bilgisini context'e ekle
    let currentAssetContext = '';
    if (currentAsset?.symbol && currentAsset?.name) {
      const assetType = currentAsset.type === 'crypto' ? 'Kripto Para' : 'Hisse Senedi';
      const priceInfo = currentAsset.price ? `Güncel Fiyat: ${currentAsset.price.toLocaleString('tr-TR')} ${currentAsset.type === 'crypto' ? 'USD' : 'TRY'}` : '';
      const changeInfo = currentAsset.changePercent24h !== undefined ? `24s Değişim: ${currentAsset.changePercent24h >= 0 ? '+' : ''}${currentAsset.changePercent24h.toFixed(2)}%` : '';
      currentAssetContext = `
MEVCUT VARLIK (Kullanıcı bu varlık sayfasında):
- Sembol: ${currentAsset.symbol}
- Ad: ${currentAsset.name}
- Tip: ${assetType}
${priceInfo ? `- ${priceInfo}` : ''}
${changeInfo ? `- ${changeInfo}` : ''}

ÖNEMLİ: Kullanıcı şu anda ${currentAsset.name} (${currentAsset.symbol}) sayfasında. Ancak:
- Kullanıcı sadece selamlaşıyorsa veya normal sohbet ediyorsa (naber, nasılsın, teşekkürler vb.), finansal analiz yapmadan doğal şekilde cevap ver.
- Kullanıcı "${currentAsset.symbol}", "${currentAsset.name}", "bu coin", "bu hisse" gibi ifadeler kullandığında veya finansal soru sorduğunda, bu ${assetType.toLowerCase()} hakkında analiz yap.
- Her zaman analiz yapma, önce kullanıcının ne istediğini anla ve ona göre cevap ver.`;
    }
    
    const systemInstruction = `Sen NEXONO AI'sın - samimi ve yardımsever bir finansal asistan. Kullanıcıya "efendim" diye hitap et. 

KİŞİLİĞİN:
- Doğal ve samimi bir sohbet arkadaşısın, sadece finansal robot değilsin
- Kullanıcı selamlaştığında veya normal sohbet ettiğinde (naber, nasılsın, teşekkürler, günaydın vb.), doğal şekilde cevap ver, analiz yapmaya çalışma
- Kullanıcı finansal soru sorduğunda veya analiz istediğinde, detaylı ve profesyonel analiz yap

GÖREVİN:
1. NORMAL SOHBET: Kullanıcı selamlaşıyor, soru soruyor veya normal sohbet ediyorsa, doğal ve samimi şekilde cevap ver. Analiz yapmaya çalışma.
2. FİNANSAL SORULAR: Kullanıcı coin/hisse hakkında soru sorduğunda veya analiz istediğinde, aşağıdaki GERÇEK piyasa verilerini kullanarak derinlemesine analiz yap.
3. ANALİTİK YAKLAŞIM: Analiz yaparken trend analizi, teknik göstergeler, temel analiz, momentum değerlendirmesi ve risk-fırsat senaryoları sun.
4. DOĞAL CEVAPLAR: Hazır cevaplar verme. Kullanıcının ne istediğini anla, ona göre cevap ver.

STİL VE KONUŞMA TARZI:
- DOĞAL VE SPONTANE: Sanki gerçek bir insanla sohbet ediyormuş gibi konuş. Şablonlu cevaplar verme.
- BAĞLAMLI CEVAP: Kullanıcının sorusunu dikkate al. "Naber" sorusuna analiz yapma, sadece samimi cevap ver.
- ÇEŞİTLİ İFADELER: Her seferinde farklı şekillerde konuş, tekrarlama yapma.
- DENGE: Hem sohbet edebilmelisin hem de analiz yapabilmelisin. Kullanıcının ihtiyacına göre ayarla.

ÖNEMLİ KURALLAR: 
- Kullanıcı "naber", "nasılsın", "teşekkürler" gibi normal sohbet yapıyorsa, finansal analiz yapmadan doğal cevap ver
- Kullanıcı coin/hisse hakkında soru sorduğunda veya analiz istediğinde, detaylı analiz yap
- Her zaman analiz yapma, önce kullanıcının ne istediğini anla
${currentAssetContext}

PİYASA VERİLERİ (GERÇEK):
${marketContext}

KULLANICI PORTFÖYÜ (GERÇEK):
${portfolioContext}`;

    // Conversation history'yi ekle (son 10 mesaj - context limiti için)
    const historyMessages = conversationHistory
      .filter(m => m.id !== 'welcome') // Welcome mesajını history'den çıkar
      .slice(-10) // Son 10 mesajı al
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));
    
    return {
      messages: [
        {
          role: 'system',
          content: systemInstruction
        },
        ...historyMessages, // Conversation history
        {
          role: 'user',
          content: userText
        }
      ]
    };
  };

  const sendToModel = async (text: string, conversationHistory: MessageItem[] = [], retryCount = 0): Promise<string> => {
    const payload = buildPayload(text, conversationHistory);
    // OpenRouter API with Qwen model
    const apiKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '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';
    const site = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const maxRetries = 2;
    const retryDelay = Math.min(2000 * (retryCount + 1), 5000);

    if (!apiKey) {
      throw new Error('OpenRouter API Key eksik. Lütfen .env.local içine VITE_OPENROUTER_API_KEY ekleyin.');
    }

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': site,
          'X-Title': 'NEXONO',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen/qwen2.5-vl-32b-instruct:free',
          messages: payload.messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!res.ok) {
        let detail = '';
        try {
          const errorData = await res.json();
          detail = errorData.error?.message || JSON.stringify(errorData);
        } catch {
          detail = await res.text();
        }
        
        // Rate limit (429) - Retry with backoff
        if (res.status === 429 && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return sendToModel(text, conversationHistory, retryCount + 1);
        }
        
        // Quota exceeded - provide helpful fallback
        if (res.status === 429 || res.status === 403) {
          return `Efendim, şu anda sistem yoğun. Genel görünüm: ${marketContext.split('\n').slice(0, 5).join(' ')}. Portföyünüz: ${portfolioContext.split('\n').slice(0, 3).join(' ')}. Lütfen kısa süre sonra tekrar deneyin, daha detaylı analiz sunabilirim.`;
        }
        
        if (res.status === 401) {
          throw new Error('API anahtarı geçersiz veya yetkisiz.');
        }
        
        // For other errors, retry once
        if (retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return sendToModel(text, conversationHistory, retryCount + 1);
        }
        
        throw new Error(`Bağlantı hatası oluştu. Lütfen tekrar deneyin.`);
      }
      
      const data = await res.json();
      
      // OpenRouter API response format (OpenAI compatible)
      const choices = data.choices;
      if (!choices || choices.length === 0) {
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return sendToModel(text, conversationHistory, retryCount + 1);
        }
        throw new Error('Yanıt alınamadı.');
      }
      
      const message = choices[0].message;
      if (!message || !message.content) {
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return sendToModel(text, conversationHistory, retryCount + 1);
        }
        throw new Error('Yanıt içeriği bulunamadı.');
      }
      
      const responseText = message.content;
      if (typeof responseText === 'string') {
        return responseText.trim();
      }
      
      return 'Yanıt alınamadı.';
    } catch (error: any) {
      // Network errors - retry
      if ((error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed')) && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return sendToModel(text, conversationHistory, retryCount + 1);
      }
      
      // After all retries, provide helpful fallback
      if (retryCount >= maxRetries) {
        return `Efendim, şu anda bağlantı sorunu yaşıyoruz. Mevcut verilere göre: Piyasa durumu genel olarak stabil. Portföyünüzü gözden geçirmek için lütfen kısa süre sonra tekrar deneyin.`;
      }
      
      throw error;
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const text = inputMessage;
    const userMsg: MessageItem = { id: String(Date.now()), role: 'user', content: text, timestamp: new Date() };
    
    // Önce kullanıcı mesajını ekle ve conversation history'yi hazırla
    setMessages((prev) => {
      const updatedMessages = [...prev, userMsg];
      
      // AI yanıtını async olarak al
      setIsLoading(true);
      (async () => {
        try {
          // Conversation history'yi gönder (yeni user mesajı dahil)
          const aiText = await sendToModel(text, updatedMessages);
          const aiMsg: MessageItem = { id: String(Date.now() + 1), role: 'ai', content: aiText, timestamp: new Date() };
          setMessages((prevMsgs) => {
            // Eğer mesaj zaten eklenmişse tekrar ekleme
            if (prevMsgs.some(m => m.id === aiMsg.id)) return prevMsgs;
            return [...prevMsgs, aiMsg];
          });
        } catch (e: any) {
          const msg = e?.message ? String(e.message) : 'Şu anda yanıt veremiyorum. Lütfen tekrar deneyin.';
          const errMsg: MessageItem = { id: String(Date.now() + 1), role: 'ai', content: msg, timestamp: new Date() };
          setMessages((prevMsgs) => {
            if (prevMsgs.some(m => m.id === errMsg.id)) return prevMsgs;
            return [...prevMsgs, errMsg];
          });
        } finally {
          setIsLoading(false);
        }
      })();
      
      return updatedMessages;
    });
    
    setInputMessage('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-gradient-to-b from-background to-background/95 relative overflow-hidden">
      {/* Header - Modern ve şık */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-emerald-500/20 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">NEXONO AI</h3>
            <p className="text-xs text-muted-foreground">Profesyonel Finansal Analist</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-emerald-400 font-medium">Aktif</span>
        </div>
      </div>

      {/* Messages Area - Daha geniş ve okunabilir */}
      <div 
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 scrollbar-hide min-h-0"
        style={{ paddingBottom: kbPad ? kbPad + 100 : '80px' }}
      >
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group`}
            >
              <div className={`flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                    : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                }`}>
                  {m.role === 'user' ? (
                    <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col gap-1 ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-lg ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm'
                      : 'bg-gradient-to-br from-card to-card/80 border border-border/50 text-foreground rounded-tl-sm'
                  }`}>
                    {m.role === 'ai' ? (
                      <div
                        className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{ 
                          __html: m.content
                            .replace(/### (.*?)(\n|$)/g, '➤ <strong class="font-semibold text-primary">$1</strong><br>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                            .replace(/\n/g, '<br>')
                        }}
                      />
                    ) : (
                      <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs text-muted-foreground px-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {m.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start gap-3 max-w-[75%]">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Analiz ediliyor...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input Area - Sabit ve modern */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 px-3 sm:px-4 py-3 sm:py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
        style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
      >
        <div className="flex items-end gap-2 sm:gap-3">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => {
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
                }
              }, 300);
            }}
            placeholder="Finansal soru sorun veya analiz isteyin..."
            className="flex-1 text-sm sm:text-base h-11 sm:h-12 rounded-xl border-border/50 bg-muted/50 focus:bg-background focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!inputMessage.trim() || isLoading} 
            size="icon"
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NexonoAIChat;


