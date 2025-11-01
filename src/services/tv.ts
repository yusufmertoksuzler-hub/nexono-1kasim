export interface TVQuote {
  symbol: string;
  provider: 'tradingview' | 'yahoo' | string;
  price: number;
  changePercent24h: number;
  high24h?: number;
  low24h?: number;
  ts: number;
  isDelayed?: boolean; // true = gecikmeli, false/undefined = canlı
}

export async function fetchTVQuote(symbol: string, retryCount = 0): Promise<TVQuote | null> {
  const maxRetries = 2;
  const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 3000);

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(`/api/tv/${encodeURIComponent(symbol)}`, { 
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Rate limit - retry with backoff
    if (res.status === 429 && retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchTVQuote(symbol, retryCount + 1);
    }
    
    // Server error - retry once
    if (res.status >= 500 && retryCount < 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchTVQuote(symbol, retryCount + 1);
    }
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error: any) {
    // Network errors - retry once
    if (retryCount < 1 && (error.name === 'AbortError' || error.name === 'TimeoutError' || error.name === 'TypeError')) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchTVQuote(symbol, retryCount + 1);
    }
    // Silently fail - don't log to console
    return null;
  }
}


