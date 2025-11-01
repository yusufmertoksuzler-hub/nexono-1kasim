import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Lock, Shield, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Login: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError(null);
    setForgotPasswordSuccess(false);
    setForgotPasswordLoading(true);
    try {
      await resetPassword(forgotPasswordEmail);
      setForgotPasswordSuccess(true);
      setTimeout(() => {
        setForgotPasswordOpen(false);
        setForgotPasswordEmail('');
        setForgotPasswordSuccess(false);
      }, 3000);
    } catch (err: any) {
      setForgotPasswordError(err?.message || 'Şifre sıfırlama başarısız');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol panel - Form */}
        <Card className="p-6 bg-card/60 backdrop-blur order-1 md:order-none">
          <div className="space-y-1 text-center mb-4">
            <h1 className="text-2xl font-bold">Giriş Yap</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">E-posta</label>
              <Input type="email" autoComplete="email" placeholder="ornek@eposta.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">Şifre</label>
                <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setForgotPasswordOpen(true);
                      }}
                    >
                      Şifremi Unuttum
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Şifre Sıfırlama
                      </DialogTitle>
                      <DialogDescription>
                        E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">E-posta</label>
                        <Input
                          type="email"
                          placeholder="ornek@eposta.com"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          required
                        />
                      </div>
                      {forgotPasswordError && (
                        <p className="text-sm text-destructive">{forgotPasswordError}</p>
                      )}
                      {forgotPasswordSuccess && (
                        <p className="text-sm text-green-500">
                          Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.
                        </p>
                      )}
                      <Button type="submit" className="w-full" disabled={forgotPasswordLoading || forgotPasswordSuccess}>
                        {forgotPasswordLoading ? 'Gönderiliyor...' : forgotPasswordSuccess ? 'Gönderildi!' : 'Gönder'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</Button>
          </form>
          <div className="text-center mt-4 text-sm">
            Hesabınız yok mu? <Link to="/register" className="text-primary hover:underline">Kayıt Olun</Link>
          </div>
        </Card>

        {/* Sağ panel - Güven/özellikler (mobilde gizli) */}
        <Card className="hidden md:flex p-6 bg-card/60 backdrop-blur flex-col justify-between order-2 md:order-none">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Güvenli oturum açma
            </div>
            {/* Başlık mobilde kaldırıldı */}
          </div>
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Check className="h-3.5 w-3.5" />
              </div>
              Hızlı ve güvenilir kimlik doğrulama
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Check className="h-3.5 w-3.5" />
              </div>
              Çapraz cihaz desteği
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Check className="h-3.5 w-3.5" />
              </div>
              Karanlık arayüz ile konforlu kullanım
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
            <Shield className="h-4 w-4" />
            Giriş bilgileriniz şifrelenir ve korunur.
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;


