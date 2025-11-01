import React, { useEffect, useState } from 'react';

interface Item { title: string; link: string; pubDate?: string }

const RSS_URLS = {
  crypto: 'https://www.borsagundem.com.tr/rss/kripto-piyasasi',
  stock: 'https://www.borsagundem.com.tr/rss/borsa-gundem'
};

const NewsList: React.FC<{ type: 'crypto' | 'stock' }> = ({ type }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRSS = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(RSS_URLS[type]);
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');
        const nodes = Array.from(xml.querySelectorAll('item'));
        const parsed: Item[] = nodes.slice(0, 10).map((n) => ({
          title: n.querySelector('title')?.textContent || 'Haber',
          link: n.querySelector('link')?.textContent || '#',
          pubDate: n.querySelector('pubDate')?.textContent || undefined
        }));
        setItems(parsed);
      } catch (e: any) {
        setError('Haberler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchRSS();
  }, [type]);

  if (loading) return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="text-sm">
          <a href={it.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {it.title}
          </a>
          {it.pubDate && <span className="ml-2 text-muted-foreground">{new Date(it.pubDate).toLocaleString('tr-TR')}</span>}
        </li>
      ))}
    </ul>
  );
};

export default NewsList;


