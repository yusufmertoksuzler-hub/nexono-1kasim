import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  isPublic: boolean;
  profileLink: string;
  createdAt: Date;
  lastLogin: Date;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Kullanıcı',
          photoURL: user.photoURL,
          bio: '',
          isPublic: false,
          profileLink: `${window.location.origin}/users/${user.uid}`,
          createdAt: new Date(),
          lastLogin: new Date()
        });
      }
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      toast.error('Profil yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      toast.error('Çıkış yapılırken bir hata oluştu');
    }
  };

  if (!user) {
    return null;
  }

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

  return (
    <div className="min-h-screen bg-background" ref={formRef}>
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Profil Ayarları</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Hesap bilgilerinizi yönetin</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-safe">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          {/* Profil Kartı */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-4 sm:p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 mx-auto sm:mx-0">
                  <AvatarImage src={profile?.photoURL} alt={profile?.displayName} />
                  <AvatarFallback className="text-2xl">
                    {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-3xl font-bold">{profile?.displayName}</h2>
                    </div>
                    <p className="text-muted-foreground">{profile?.bio || 'Henüz bir açıklama eklenmemiş'}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
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
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Hesap Bilgileri</h3>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">E-posta</Label>
                    <p className="font-medium">{profile?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Kullanıcı ID</Label>
                    <p className="font-medium text-xs text-muted-foreground">{profile?.uid}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;