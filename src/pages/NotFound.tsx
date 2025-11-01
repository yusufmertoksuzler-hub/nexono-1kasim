import React from 'react';
import { Link } from 'react-router-dom';
import { Home, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-12 bg-card/50 backdrop-blur-sm border-border/50 text-center">
        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">NEXONO</h1>
          </div>
          
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Market Not Found</h2>
          <p className="text-muted-foreground">The financial data you're looking for has moved to a different market.</p>
          
          <Button asChild size="lg">
            <Link to="/">
              <Home className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </Card>
      <div className="fixed inset-0 -z-10 cosmic-grid opacity-10"></div>
    </div>
  );
};

export default NotFound;
