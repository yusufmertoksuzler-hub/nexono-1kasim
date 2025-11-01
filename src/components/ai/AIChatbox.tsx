import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIChatboxProps {
  assetName: string;
  assetSymbol: string;
  assetType: 'crypto' | 'stock';
  assetData?: any;
  chartData?: { timestamp: number; price: number }[];
  timeframe?: string;
}

const AIChatbox: React.FC<AIChatboxProps> = ({ assetName, assetSymbol, assetType, assetData, chartData = [], timeframe = '1D' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      type: 'ai',
      content: `Efendim, ${assetName} (${assetSymbol}) hakkında kısa ve net analiz yapabilirim. Ne öğrenmek istersiniz?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [assetName, assetSymbol, assetType]);

  const generateAIResponse = async (userText: string) => {
    try {
      const latestPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : (assetData?.current_price || assetData?.price);
      const firstPrice = chartData.length > 0 ? chartData[0].price : undefined;
      const changeAbs = latestPrice !== undefined && firstPrice !== undefined ? latestPrice - firstPrice : (assetData?.price_change_24h || assetData?.change);
      const changePct = (() => {
        if (latestPrice !== undefined && firstPrice !== undefined && firstPrice !== 0) {
          return ((latestPrice - firstPrice) / firstPrice) * 100;
        }
        return assetData?.price_change_percentage_24h ?? assetData?.changePercent;
      })();

      const volume = assetType === 'crypto' ? (assetData?.total_volume) : (assetData?.volumeTL || assetData?.volume);
      const marketCap = assetData?.market_cap;
      const desc = assetData?.description ? String(assetData.description).split('.').slice(0, 2).join('. ') : '';

      const contextParts: string[] = [];
      contextParts.push(`=== GERÇEK VARLIK VERİSİ ===`);
      contextParts.push(`Ad: ${assetName}`);
      contextParts.push(`Sembol: ${assetSymbol?.toUpperCase()}`);
      contextParts.push(`Tür: ${assetType === 'crypto' ? 'Kripto Para' : 'Hisse Senedi'}`);
      contextParts.push('');
      
      if (latestPrice !== undefined) {
        const priceStr = assetType === 'crypto' 
          ? `$${latestPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
          : `₺${latestPrice.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        contextParts.push(`Güncel Fiyat: ${priceStr}`);
      }
      
      if (typeof changePct === 'number') {
        contextParts.push(`24s Değişim: ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`);
      }
      
      if (volume !== undefined) {
        const volStr = assetType === 'crypto'
          ? `$${(volume / 1e9).toFixed(2)}B`
          : `₺${(volume / 1e6).toFixed(1)}M`;
        contextParts.push(`24s Hacim: ${volStr}`);
      }
      
      if (marketCap !== undefined) {
        const mcStr = assetType === 'crypto'
          ? `$${(marketCap / 1e9).toFixed(2)}B`
          : `₺${(marketCap / 1e9).toFixed(2)}B`;
        contextParts.push(`Piyasa Değeri: ${mcStr}`);
      }
      
      if (assetData?.high_24h || assetData?.yuksek) {
        const high = assetData.high_24h || assetData.yuksek;
        contextParts.push(`24s En Yüksek: ${assetType === 'crypto' ? '$' : '₺'}${high.toFixed(2)}`);
      }
      
      if (assetData?.low_24h || assetData?.dusuk) {
        const low = assetData.low_24h || assetData.dusuk;
        contextParts.push(`24s En Düşük: ${assetType === 'crypto' ? '$' : '₺'}${low.toFixed(2)}`);
      }
      
      const context = contextParts.join('\n');

      const systemPrompt = `Sen NEXONO AI - profesyonel finansal danışman. Kullanıcıya "efendim" diye hitap et. 

KONUŞMA TARZI:
- DOĞAL VE SAMİMİ KONUŞ: Kopyala-yapıştır gibi yapay ve tekrarlayan cümleler kullanma. Her yanıtında farklı ifadeler kullan.
- AKICI VE SPONTANE OL: Sanki bir arkadaşınla konuşuyormuş gibi doğal akışta ilerle. Formülsel veya şablon gibi görünme.
- ÇEŞİTLİ İFADELER KULLAN: Aynı kelimeleri tekrar tekrar kullanma. Her seferinde farklı şekillerde anlat.
- PROFESYONEL AMA İÇTEN: Profesyonel kal ama soğuk ve robot gibi görünme. İnsan gibi düşünüp konuş.
- BELİRSİZ İFADELER KULLANMA: Kararlı ve net tavsiye ver. "Olabilir" yerine "olacaktır" kullan.
- DOĞRUDAN VE AKICI: Uyarı veya risk metni ekleme. Doğrudan analiz yap.

GERÇEK VARLIK VERİLERİ:
${context}`;

      const userInstruction = `EFENDİM İSTEMİ:
1) Doğrudan, doğal ve akıcı konuş - kopyala-yapıştır gibi görünme, her seferinde farklı ifadeler kullan.
2) Kesin ve kararlı tavsiye ver; belirsiz ifadeler kullanma.
3) Sayıları tam ver; yuvarlama yapma.
4) "efendim" diye hitap et.
5) Risk uyarısı veya uyarı metni ekleme.
6) Her yanıtında farklı bir yaklaşım kullan - tekrarlayan cümleler kullanma.

Görev: Yukarıdaki GERÇEK varlık verisine dayanarak kapsamlı analiz (trend, destek/direnç, momentum, senaryolar), net strateji ve aksiyon adımları ver. Sanki bir insan finansal danışmanla konuşuyormuş gibi doğal ve samimi ol. Kullanıcı metni: ${userText}`;

      const apiKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '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';
      const site = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      
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
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userInstruction
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!res.ok) throw new Error('OpenRouter request failed');
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content || 'Yanıt alınamadı.';
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
      return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    } catch (error) {
      console.error('AI Generation Error:', error);
      return 'Şu anda isteği işlerken sorun oluştu. Lütfen daha sonra tekrar deneyin veya sorunuzu yeniden ifade edin.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(inputMessage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm h-[500px] flex flex-col">
      <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-border">
        <Bot className="h-5 w-5 text-accent" />
        <div>
          <h3 className="font-semibold text-sm">AI Analyst</h3>
          <p className="text-xs text-muted-foreground">{assetName} Specialist</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-primary' : 'bg-accent'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className={`rounded-lg px-3 py-2 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {message.type === 'ai' ? (
                    <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.content }} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-secondary rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`${assetSymbol.toUpperCase()} hakkında sorular sorun, analiz isteyin veya sohbet edin...`}
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!inputMessage.trim() || isLoading}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default AIChatbox;