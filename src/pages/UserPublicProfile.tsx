import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Building2, TrendingUp, Eye, EyeOff, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  isPublic: boolean;
  createdAt: Date;
  lastLogin: Date;
}

const UserPublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userDoc = await getDoc(doc(db, 'userProfiles', userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        if (data.isPublic) {
          setProfile({
            uid: userId,
            email: data.email || '',
            displayName: data.displayName || 'Kullanıcı',
            photoURL: data.photoURL,
            bio: data.bio || '',
            isPublic: data.isPublic,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLogin: data.lastLogin?.toDate() || new Date()
          });
        } else {
          setError('Bu profil herkese açık değil');
        }
      } else {
        setError('Kullanıcı bulunamadı');
      }
    } catch (err) {
      console.error('Profil yüklenirken hata:', err);
      setError('Profil yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Profil Bulunamadı</h1>
              <p className="text-sm text-muted-foreground">{error || 'Aradığınız profil bulunamadı'}</p>
            </div>
          </div>
          
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Profil Bulunamadı</h3>
                <p className="text-muted-foreground mb-4">
                  {error === 'Bu profil herkese açık değil' 
                    ? 'Bu kullanıcı profilini herkese açık yapmamış.'
                    : 'Aradığınız kullanıcı bulunamadı veya profil mevcut değil.'
                  }
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Dashboard'a Dön
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold">Kullanıcı Profili</h1>
                <p className="text-sm text-muted-foreground">{profile.displayName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Herkese Açık
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profil Kartı */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <div className="flex items-start space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                  <AvatarFallback className="text-2xl">
                    {profile.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-3xl font-bold">{profile.displayName}</h2>
                      <Badge variant="default" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Herkese Açık
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{profile.bio || 'Henüz bir açıklama eklenmemiş'}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Hesap Bilgileri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Hesap Bilgileri</h3>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground">E-posta</div>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Kullanıcı ID</div>
                    <p className="font-medium text-xs text-muted-foreground">{profile.uid}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Üyelik Tarihi</div>
                    <p className="font-medium">{profile.createdAt.toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Son Giriş</div>
                    <p className="font-medium">{profile.lastLogin.toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Bilgi Notu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Herkese Açık Profil</h4>
                  <p className="text-sm text-blue-700">
                    Bu kullanıcı profilini herkese açık yapmıştır. Bu sayede diğer kullanıcılar 
                    bu profili görüntüleyebilir ve hesap bilgilerini görebilir.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default UserPublicProfile;
