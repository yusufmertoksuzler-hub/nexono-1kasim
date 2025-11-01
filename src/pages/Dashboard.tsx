import React from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MarketOverview from '@/components/dashboard/MarketOverview';
import CryptoSection from '@/components/dashboard/CryptoSection';
import StockSection from '@/components/dashboard/StockSection';
import MyPortfolio from '@/components/dashboard/MyPortfolio';
import { motion } from 'framer-motion';
import { useMobileApp } from '@/hooks/useMobileApp';

const Dashboard = () => {
  const { isNative } = useMobileApp();
  
  return (
    <div className={`min-h-screen bg-background ${isNative ? 'native-app' : ''}`}>
      <DashboardHeader />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MyPortfolio />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MarketOverview />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CryptoSection />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StockSection />
        </motion.div>
      </main>
      
      {/* Background Grid Effect */}
      <div className="fixed inset-0 -z-10 cosmic-grid opacity-20"></div>
    </div>
  );
};

export default Dashboard;