import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Shield, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!acceptedDisclaimer) {
      setError('Sorumluluk reddi beyanını kabul etmeniz gerekiyor');
      return;
    }
    
    setLoading(true);
    try {
      await register(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol panel - Form */}
        <Card className="p-6 bg-card/60 backdrop-blur order-1 md:order-none">
          <div className="space-y-1 text-center mb-4">
            <h1 className="text-2xl font-bold">Hesap oluştur</h1>
            <p className="text-sm text-muted-foreground">Ücretsiz başlayın, dilediğiniz zaman yükseltin.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">E-posta</label>
              <Input type="email" autoComplete="email" placeholder="ornek@eposta.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Şifre</label>
              <Input type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <p className="text-[11px] text-muted-foreground mt-1">En az 8 karakter olmasını öneririz.</p>
            </div>
            
            {/* Sorumluluk Reddi Beyanı */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <Collapsible open={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                  <h4 className="text-sm font-semibold">Sorumluluk Reddi Beyanı</h4>
                  {isDisclaimerOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                    <p>NEXONO'da sunulan kripto para ve hisse senedi verileri, üçüncü taraf bir kaynak olan Yahoo Finance üzerinden alınmakta olup yaklaşık 15 dakikalık gecikmeyle güncellenmektedir.</p>
                    <p>Bu veriler yalnızca bilgilendirme amacıyla sağlanmakta olup yatırım tavsiyesi niteliği taşımaz.</p>
                    <p>NEXONO, sağlanan bilgilerin doğruluğu, güncelliği veya eksiksizliğine dair hiçbir garanti vermez ve bu verilere dayanarak yapılan yatırım veya finansal işlemlerden kullanıcı sorumludur.</p>
                    <p>Kayıt işlemini tamamlayarak bu beyanı okuduğunuzu, anladığınızı ve kabul ettiğinizi onaylamış olursunuz.</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="disclaimer" 
                  checked={acceptedDisclaimer} 
                  onCheckedChange={(checked) => setAcceptedDisclaimer(checked as boolean)}
                />
                <label htmlFor="disclaimer" className="text-xs text-foreground leading-relaxed cursor-pointer">
                  Sorumluluk reddi beyanını okudum ve kabul ediyorum.
                </label>
              </div>
            </div>
            
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !acceptedDisclaimer}>
              {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </Button>
          </form>
          <div className="text-center mt-4 text-sm">
            Zaten hesabınız var mı? <Link to="/login" className="text-primary hover:underline">Giriş Yapın</Link>
          </div>
        </Card>

        {/* Sağ panel - Özellikler (mobilde gizli) */}
        <Card className="hidden md:flex p-6 bg-card/60 backdrop-blur flex-col justify-between order-2 md:order-none">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Hızlı Kurulum • Anında Başlangıç
            </div>
            <h2 className="text-2xl font-semibold">Veri odaklı finans analizi</h2>
            <p className="text-sm text-muted-foreground">Kripto ve BIST hisseleri için modern arayüz, gerçek zamanlı göstergeler ve akıllı sohbet.</p>
          </div>
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Check className="h-3.5 w-3.5" />
              </div>
              Gelişmiş fiyat grafikleri ve teknik indikatörler
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Check className="h-3.5 w-3.5" />
              </div>
              AI destekli hisse/kripto sohbeti
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Check className="h-3.5 w-3.5" />
              </div>
              Manuel portföy ekleme ve takip
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
            <Shield className="h-4 w-4" />
            Verileriniz güvenli ve gizli tutulur.
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;


