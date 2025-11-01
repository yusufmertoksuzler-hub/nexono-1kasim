
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { CircleDot, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [activePage, setActivePage] = useState('features');
  const navigate = useNavigate();
  
  const handleNavClick = (page: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActivePage(page);
    const element = document.getElementById(page);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Tema anahtarı kaldırıldı; varsayılan koyu mod

  return (
    <div className="sticky top-0 z-50 pt-8 px-4">
      <header className="w-full max-w-7xl mx-auto py-3 px-6 md:px-8 flex items-center justify-between">
        <div className="p-3">
          <Logo />
        </div>
        
        {/* Mobile menu removed */}
        
        {/* Desktop navigation (toggle grubu kaldırıldı) */}
        <nav className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2">
          <div className="rounded-full px-1 py-1 backdrop-blur-md bg-background/80 border border-border shadow-lg">
            <button
              className={cn(
                "px-4 py-2 rounded-full transition-colors",
                activePage === 'features' ? 'text-accent-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              onClick={handleNavClick('features')}
            >
              <CircleDot size={16} className="inline-block mr-1.5" /> Özellikler
            </button>
            {/* Panel butonu kaldırıldı */}
            <button
              className={cn(
                "px-4 py-2 rounded-full transition-colors",
                activePage === 'pricing' ? 'text-accent-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              onClick={handleNavClick('pricing')}
            >
              <DollarSign size={16} className="inline-block mr-1.5" /> Fiyatlandırma
            </button>
          </div>
        </nav>
        
        {/* Mobile navigation removed */}
        
        <div className="hidden md:flex items-center gap-4">
          <div className="rounded-2xl">
            <Button variant="outline" className="mr-2" onClick={() => navigate('/login')}>Giriş</Button>
            <Button onClick={() => navigate('/register')}>Kayıt Ol</Button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
