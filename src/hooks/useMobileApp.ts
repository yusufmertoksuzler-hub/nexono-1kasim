import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const useMobileApp = () => {
  useEffect(() => {
    const initMobileApp = async () => {
      if (Capacitor.isNativePlatform()) {
        // Hide splash screen
        await SplashScreen.hide();
        
        // Configure status bar
        await StatusBar.setStyle({ style: 'DARK' as any });
        await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
        
        // Prevent text selection on mobile for better app feel
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        
        // Add mobile-specific styles
        document.body.classList.add('mobile-app');
      }
    };

    initMobileApp();
  }, []);

  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform()
  };
};