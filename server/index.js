import fs from "fs";
import path from "path";
import axios from "axios";
import yahooFinance from "yahoo-finance2";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Popüler BIST hisseleri
const hisseler = [
	"ASELS.IS", "THYAO.IS", "GARAN.IS", "BIMAS.IS", "AKBNK.IS",
	"EREGL.IS", "SISE.IS", "PETKM.IS", "TUPRS.IS", "TAVHL.IS",
	"ISCTR.IS", "HALKB.IS", "VAKBN.IS", "YKBNK.IS", "TCELL.IS",
	"FROTO.IS", "TOASO.IS", "TSKB.IS", "TTRAK.IS", "MGROS.IS",
	"KCHOL.IS", "AKSUE.IS", "KRDMD.IS", "KOZAL.IS", "KOZAA.IS",
	"ARCLK.IS", "ENKAI.IS", "ISGYO.IS", "KAPLM.IS",
	"IHLGM.IS", "KORDS.IS", "KARSN.IS"
];

/**
 * In-memory cache
 * { [symbol]: { fiyat: number|null, tarih: string|null, error?: string } }
 */
let cacheData = {};
let lastUpdatedAt = null; // ISO string

// Coins cache
let coinsData = [];
let coinsUpdatedAt = null; // ISO string

async function fetchHisseler() {
	const result = {};
	for (const hisse of hisseler) {
		try {
			const quote = await yahooFinance.quote(hisse, { fields: [
				"regularMarketPrice",
				"regularMarketTime",
				"regularMarketChange",
				"regularMarketChangePercent",
				"regularMarketPreviousClose",
				"regularMarketOpen",
				"regularMarketDayHigh",
				"regularMarketDayLow",
				"regularMarketVolume",
				"averageDailyVolume3Month",
				"marketCap",
				"currency",
				"exchange",
				"shortName",
				"longName"
			] });
			if (quote && typeof quote.regularMarketPrice === "number") {
				const fiyat = Number(quote.regularMarketPrice);
				const tarih = new Date(quote.regularMarketTime || Date.now()).toISOString();
				result[hisse] = {
					// Geriye dönük uyum için temel alanlar
					fiyat,
					tarih,
					// Ek Yahoo alanları
					degisim: typeof quote.regularMarketChange === "number" ? Number(quote.regularMarketChange) : null,
					degisimYuzde: typeof quote.regularMarketChangePercent === "number" ? Number(quote.regularMarketChangePercent) : null,
					oncekiKapanis: typeof quote.regularMarketPreviousClose === "number" ? Number(quote.regularMarketPreviousClose) : null,
					acilis: typeof quote.regularMarketOpen === "number" ? Number(quote.regularMarketOpen) : null,
					yuksek: typeof quote.regularMarketDayHigh === "number" ? Number(quote.regularMarketDayHigh) : null,
					dusuk: typeof quote.regularMarketDayLow === "number" ? Number(quote.regularMarketDayLow) : null,
					hacim: typeof quote.regularMarketVolume === "number" ? Number(quote.regularMarketVolume) : null,
					ortalamaHacim3A: typeof quote.averageDailyVolume3Month === "number" ? Number(quote.averageDailyVolume3Month) : null,
					piyasaDegeri: typeof quote.marketCap === "number" ? Number(quote.marketCap) : null,
					paraBirimi: quote.currency || "TRY",
					borsa: quote.exchange || null,
					ad: quote.shortName || null,
					uzunAd: quote.longName || null
				};
			} else {
				result[hisse] = { fiyat: null, tarih: null, error: "Veri yok" };
			}
		} catch (e) {
			result[hisse] = { fiyat: null, tarih: null, error: e?.message || String(e) };
		}
	}
	return result;
}

async function updateCache() {
	try {
		console.log(`[${new Date().toISOString()}] Veriler güncelleniyor...`);
		cacheData = await fetchHisseler();
		lastUpdatedAt = new Date().toISOString();

		// Yazılacak dosya yolları
		const publicDir = path.resolve(__dirname, "../public");
		const jsonPath = path.join(publicDir, "hisseler.json");
		const txtPath = path.join(publicDir, "hisseler.txt");

		// public dizini mevcut değilse oluştur
		if (!fs.existsSync(publicDir)) {
			fs.mkdirSync(publicDir, { recursive: true });
		}

		// JSON yaz
		const jsonPayload = { updatedAt: lastUpdatedAt, data: cacheData };
		fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2), "utf8");

		// TXT yaz (TSV benzeri)
		const header = "SYMBOL\tFIYAT\tTARIH\tHATA";
		const lines = [header];
		for (const symbol of Object.keys(cacheData)) {
			const { fiyat, tarih, error } = cacheData[symbol];
			lines.push(`${symbol}\t${fiyat ?? ""}\t${tarih ?? ""}\t${error ?? ""}`);
		}
		fs.writeFileSync(txtPath, lines.join("\n"), "utf8");

		console.log(`[${lastUpdatedAt}] Güncelleme tamamlandı. Dosyalar yazıldı: public/hisseler.json, public/hisseler.txt`);
	} catch (e) {
		console.error("Güncelleme hatası:", e);
	} finally {
		// 15 dakika sonra tekrar
		setTimeout(updateCache, 15 * 60 * 1000);
	}
}

// İlk yükleme ve periyodik güncellemeyi başlat
updateCache();

// --- COINS via TradingView/Yahoo Finance: fetch ALL cryptos every 15 minutes ---
async function fetchAllCryptos(limitPerPage = 250, maxPages = 100) {
  const out = [];
  const seenSymbols = new Set();
  
  // First try TradingView for popular cryptos
  try {
    const TradingView = await import('@mathieuc/tradingview').catch(() => null);
    if (TradingView) {
      const client = new TradingView.TradingView();
      // TradingView'dan daha fazla popüler coin çek
      const popularSymbols = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT',
        'LINKUSDT', 'UNIUSDT', 'LTCUSDT', 'ATOMUSDT', 'ETCUSDT', 'XLMUSDT', 'NEARUSDT', 'APTUSDT', 'FILUSDT', 'HBARUSDT',
        'ARBUSDT', 'VETUSDT', 'ICPUSDT', 'THETAUSDT', 'ALGOUSDT', '1000SATSUSDT', 'NEWTUSDT', 'SYRUPUSDT', 'OPUSDT', 'ARBUSDT',
        'INJUSDT', 'SUIUSDT', 'TIAUSDT', 'SEIUSDT', 'ORDIUSDT', 'RENDERUSDT', 'TAOUSDT', 'WLDUSDT', 'FETUSDT', 'RUNEUSDT',
        'MANTAUSDT', 'ONDOUSDT', 'JTOUSDT', 'FTMUSDT', 'SANDUSDT', 'AXSUSDT', 'THETAUSDT', 'GALAUSDT', 'CHZUSDT', 'ENJUSDT',
        'ZILUSDT', 'IOTAUSDT', 'BATUSDT', 'ZRXUSDT', 'OMGUSDT', 'QTUMUSDT', 'ZECUSDT', 'DASHUSDT', 'XMRUSDT', 'EOSUSDT',
        'TRXUSDT', 'XLMUSDT', 'NEOUSDT', 'IOSTUSDT', 'ONTUSDT', 'HOTUSDT', 'WINUSDT', 'ZILUSDT', 'BTTUSDT', 'DENTUSDT',
        'HIVEUSDT', 'STMXUSDT', 'SNXUSDT', 'AAVEUSDT', 'COMPUSDT', 'MKRUSDT', 'SUSHIUSDT', 'YFIUSDT', 'SFPUSDT', 'DYDXUSDT',
        'CRVUSDT', '1INCHUSDT', 'ENSUSDT', 'IMXUSDT', 'LRCUSDT', 'GRTUSDT', 'SKLUSDT', 'MANAUSDT', 'SANDUSDT', 'AUDIOUSDT',
        'ANKRUSDT', 'CTSIUSDT', 'FLMUSDT', 'DEGOUSDT', 'ALICEUSDT', 'KLAYUSDT', 'CTKUSDT', 'CHRUSDT', 'ALPHAUSDT', 'ZENUSDT',
        'STORJUSDT', 'KSMUSDT', 'WAVESUSDT', 'ANKRUSDT', 'CRVUSDT', 'DASHUSDT', 'ZECUSDT', 'HBARUSDT', 'IOSTUSDT', 'OMGUSDT',
        'BANDUSDT', 'ONTUSDT', 'ZILUSDT', 'NEOUSDT', 'ICXUSDT', 'VTHOUSDT', 'SCUSDT', 'QTUMUSDT', 'GASUSDT', 'XMRUSDT'
      ];
      
      // TradingView'dan coinleri toplu çek (batch işleme ile hızlandır)
      const batchSize = 10;
      for (let i = 0; i < popularSymbols.length; i += batchSize) {
        const batch = popularSymbols.slice(i, i + batchSize);
        await Promise.all(batch.map(async (sym) => {
          try {
            const quote = await client.getQuote(`BINANCE:${sym}`);
            const symbol = sym.replace('USDT', '');
            if (!seenSymbols.has(symbol) && quote && (quote.lp || quote.price)) {
              out.push({
                id: symbol.toLowerCase(),
                symbol: symbol,
                name: quote.short_name || quote.description || symbol,
                current_price: Number(quote.lp ?? quote.price ?? 0),
                price_change_24h: Number((quote.chp ?? 0) / 100 * (quote.lp ?? quote.price ?? 0)),
                price_change_percentage_24h: Number(quote.chp ?? 0),
                high_24h: Number(quote.high ?? 0),
                low_24h: Number(quote.low ?? 0),
                total_volume: Number(quote.volume ?? 0),
                market_cap: Number(quote.market_cap_basic ?? 0),
                market_cap_rank: out.length + 1,
                image: `https://cryptoicons.org/api/icon/${symbol.toLowerCase()}/200`
              });
              seenSymbols.add(symbol);
            }
          } catch (e) {
            // Skip if TradingView fails for this symbol
          }
        }));
        // Rate limiting için kısa bir bekleme
        if (i + batchSize < popularSymbols.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  } catch (e) {
    // TradingView not available, continue with Yahoo
  }
  
  // Then Yahoo Finance for all others (daha fazla coin için maxPages artırıldı)
  for (let page = 0; page < maxPages; page++) {
    const offset = page * limitPerPage;
    try {
      const scr = await yahooFinance.screener(
        { scrIds: 'all_cryptocurrencies_us', count: limitPerPage, offset },
        { fields: [
          'symbol','shortName','regularMarketPrice','regularMarketChange','regularMarketChangePercent',
          'regularMarketDayHigh','regularMarketDayLow','regularMarketVolume','marketCap'
        ]}
      );
      const items = scr?.quotes || [];
      if (!items.length) break;
      for (const q of items) {
        const sym = String(q.symbol || '').toUpperCase().replace('-USD', '');
        if (!seenSymbols.has(sym) && Number(q.regularMarketPrice || 0) > 0) {
          out.push({
            id: sym.toLowerCase(),
            symbol: sym,
            name: q.shortName || sym,
            current_price: Number(q.regularMarketPrice || 0),
            price_change_24h: Number(q.regularMarketChange || 0),
            price_change_percentage_24h: Number(q.regularMarketChangePercent || 0),
            high_24h: Number(q.regularMarketDayHigh || 0),
            low_24h: Number(q.regularMarketDayLow || 0),
            total_volume: Number(q.regularMarketVolume || 0),
            market_cap: Number(q.marketCap || 0),
            market_cap_rank: out.length + 1
          });
          seenSymbols.add(sym);
        }
      }
      if (items.length < limitPerPage) break; // last page
    } catch (e) {
      console.error('Yahoo screener hata:', e?.message || e);
      break;
    }
  }
  
  // Sort by market cap
  return out.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
}

async function updateCoinsYahoo() {
  const publicDir = path.resolve(__dirname, "../public");
  const coinsJsonPath = path.join(publicDir, 'coins.json');
  
  // Mevcut JSON'u oku (fallback için)
  let existingData = null;
  try {
    if (fs.existsSync(coinsJsonPath)) {
      const existingContent = fs.readFileSync(coinsJsonPath, 'utf8');
      existingData = JSON.parse(existingContent);
      console.log(`Mevcut coins.json yüklendi: ${existingData?.data?.length || 0} adet coin`);
    }
  } catch (e) {
    console.warn('Mevcut coins.json okunamadı:', e.message);
  }
  
  try {
    console.log(`[${new Date().toISOString()}] TradingView/Yahoo tüm kripto verileri güncelleniyor...`);
    const data = await fetchAllCryptos();
    
    // Eğer veri başarıyla çekildiyse ve boş değilse güncelle
    if (data && data.length > 0) {
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      const payload = { updatedAt: new Date().toISOString(), data };
      fs.writeFileSync(coinsJsonPath, JSON.stringify(payload, null, 2), 'utf8');
      console.log(`✅ Tüm kripto dosyası yazıldı: public/coins.json (${data.length} adet kripto)`);
    } else {
      // Veri çekilemedi ama mevcut veri varsa onu koru
      if (existingData && existingData.data && existingData.data.length > 0) {
        console.warn('⚠️ Yeni veri çekilemedi, mevcut cache korunuyor:', existingData.data.length, 'adet coin');
        // Sadece updatedAt'i güncelle (opsiyonel)
        const payload = { ...existingData, lastAttemptAt: new Date().toISOString() };
        fs.writeFileSync(coinsJsonPath, JSON.stringify(payload, null, 2), 'utf8');
      } else {
        console.error('❌ Veri çekilemedi ve mevcut cache yok!');
      }
    }
  } catch (e) {
    console.error('❌ Kripto güncelleme hatası:', e.message || e);
    // Hata durumunda mevcut cache'i koru
    if (existingData && existingData.data && existingData.data.length > 0) {
      console.warn('⚠️ Hata nedeniyle mevcut cache korunuyor:', existingData.data.length, 'adet coin');
      try {
        const payload = { ...existingData, lastAttemptAt: new Date().toISOString(), error: e.message || 'Unknown error' };
        fs.writeFileSync(coinsJsonPath, JSON.stringify(payload, null, 2), 'utf8');
      } catch (writeErr) {
        console.error('Cache yazma hatası:', writeErr.message);
      }
    }
  } finally {
    setTimeout(updateCoinsYahoo, 15 * 60 * 1000);
  }
}

// İlk başlatmada coins.json kontrolü ve güncellemesi
(async () => {
  const publicDir = path.resolve(__dirname, "../public");
  const coinsJsonPath = path.join(publicDir, 'coins.json');
  
  // İlk başlatmada coins.json yoksa veya boşsa hemen güncelle
  try {
    if (!fs.existsSync(coinsJsonPath)) {
      console.log('⚠️ coins.json bulunamadı, ilk güncelleme başlatılıyor...');
      // updateCoinsYahoo zaten finally bloğunda periyodik güncellemeyi başlatacak
      updateCoinsYahoo();
      return;
    }
    
    const existingContent = fs.readFileSync(coinsJsonPath, 'utf8');
    const existingData = JSON.parse(existingContent);
    
    // Eğer dosya boşsa veya veri yoksa güncelle
    if (!existingData?.data || existingData.data.length === 0) {
      console.log('⚠️ coins.json boş, ilk güncelleme başlatılıyor...');
      // updateCoinsYahoo zaten finally bloğunda periyodik güncellemeyi başlatacak
      updateCoinsYahoo();
      return;
    }
    
    console.log(`✅ Mevcut coins.json yüklendi: ${existingData.data.length} adet coin`);
    
    // Periyodik güncellemeyi başlat (15 dakikada bir)
    setTimeout(updateCoinsYahoo, 15 * 60 * 1000);
  } catch (e) {
    console.error('İlk başlatmada coins.json kontrol hatası:', e.message);
    // Hata durumunda da güncellemeyi başlat (finally bloğu periyodik güncellemeyi başlatacak)
    updateCoinsYahoo();
  }
})();

// --- GLOBAL MARKET STATS: Fetch and cache every 15 minutes ---
async function fetchGlobalMarketStats() {
  try {
    console.log(`[${new Date().toISOString()}] Global market stats güncelleniyor...`);
    
    // CoinGecko Global API
    const globalResponse = await axios.get('https://api.coingecko.com/api/v3/global');
    const globalData = globalResponse.data.data;
    
    // USD/TRY kuru (TCMB veya basit bir API'den alınabilir, şimdilik sabit bir değer kullanabiliriz veya başka bir API)
    let usdTryRate = 32.5; // Varsayılan değer
    try {
      // TCMB API veya alternatif bir API'den USD/TRY alınabilir
      // Şimdilik CoinGecko'dan alabiliriz
      const tryResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=try');
      if (tryResponse.data && tryResponse.data['usd-coin']?.try) {
        usdTryRate = tryResponse.data['usd-coin'].try;
      }
    } catch (e) {
      console.warn('USD/TRY kuru alınamadı, varsayılan değer kullanılıyor:', e.message);
    }
    
    const marketStats = {
      updatedAt: new Date().toISOString(),
      usdTryRate: usdTryRate,
      data: {
        totalMarketCap: {
          usd: globalData.total_market_cap.usd,
          try: globalData.total_market_cap.usd * usdTryRate,
          change24h: globalData.market_cap_change_percentage_24h_usd || 0
        },
        totalVolume: {
          usd: globalData.total_volume.usd,
          try: globalData.total_volume.usd * usdTryRate,
          change24h: 0 // CoinGecko global API'de bu yok, hesaplanabilir
        },
        btcDominance: globalData.market_cap_percentage.btc || 0,
        activeCoins: globalData.active_cryptocurrencies || 0,
        fearGreedIndex: Math.floor(Math.random() * 100) // Mock - Fear & Greed API key gerekiyor
      }
    };
    
    const publicDir = path.resolve(__dirname, "../public");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(
      path.join(publicDir, 'market-stats.json'),
      JSON.stringify(marketStats, null, 2),
      'utf8'
    );
    console.log(`Global market stats yazıldı: public/market-stats.json`);
  } catch (e) {
    console.error('Global market stats güncelleme hatası:', e);
  } finally {
    // 15 dakika sonra tekrar güncelle
    setTimeout(fetchGlobalMarketStats, 15 * 60 * 1000);
  }
}

// İlk yükleme ve periyodik güncellemeyi başlat
fetchGlobalMarketStats();
async function fetchCoins(limit = 100) {
	const url = "https://api.coingecko.com/api/v3/coins/markets";
	const params = {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: 250,
    page: 1,
		sparkline: false,
		price_change_percentage: "24h"
	};
  const { data: page1 } = await axios.get(url, { params, headers: { "Accept": "application/json" } });
  const { data: page2 } = await axios.get(url, { params: { ...params, page: 2 }, headers: { "Accept": "application/json" } });
  return [...page1, ...page2];
}

async function updateCoins() {
	try {
		console.log(`[${new Date().toISOString()}] Coin verileri güncelleniyor...`);
    coinsData = await fetchCoins(500);
		coinsUpdatedAt = new Date().toISOString();

		const publicDir = path.resolve(__dirname, "../public");
		const jsonPath = path.join(publicDir, "coins.json");
		const txtPath = path.join(publicDir, "coins.txt");

		if (!fs.existsSync(publicDir)) {
			fs.mkdirSync(publicDir, { recursive: true });
		}

		// JSON: keep original CoinGecko structure array
		const jsonPayload = { updatedAt: coinsUpdatedAt, data: coinsData };
		fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2), "utf8");

		// TXT: id\tsymbol\tname\tprice\t24h%\tvolume
		const header = "ID\tSYMBOL\tNAME\tPRICE\tCHANGE_24H%\tVOLUME";
		const lines = [header];
		for (const c of coinsData) {
			lines.push(`${c.id}\t${c.symbol}\t${c.name}\t${c.current_price}\t${c.price_change_percentage_24h}\t${c.total_volume}`);
		}
		fs.writeFileSync(txtPath, lines.join("\n"), "utf8");

		console.log(`[${coinsUpdatedAt}] Coin dosyaları yazıldı: public/coins.json, public/coins.txt`);
	} catch (e) {
		console.error("Coin güncelleme hatası:", e);
	} finally {
		setTimeout(updateCoins, 5 * 60 * 1000); // 5 dakika
	}
}
// TRY paritesi yaz
async function fetchCoinsTRY() {
  const url = "https://api.coingecko.com/api/v3/coins/markets";
  const params = {
    vs_currency: "try",
    order: "market_cap_desc",
    per_page: 250,
    page: 1,
    sparkline: false,
    price_change_percentage: "24h"
  };
  const { data: page1 } = await axios.get(url, { params, headers: { "Accept": "application/json" } });
  const { data: page2 } = await axios.get(url, { params: { ...params, page: 2 }, headers: { "Accept": "application/json" } });
  return [...page1, ...page2];
}

async function updateCoinsTRY() {
  try {
    console.log(`[${new Date().toISOString()}] Coin TRY verileri güncelleniyor...`);
    const coinsTRY = await fetchCoinsTRY();
    const publicDir = path.resolve(__dirname, "../public");
    const jsonPath = path.join(publicDir, "coins_try.json");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify({ updatedAt: new Date().toISOString(), data: coinsTRY }, null, 2), "utf8");
    console.log(`Coin TRY dosyası yazıldı: public/coins_try.json`);
  } catch (e) {
    console.error("Coin TRY güncelleme hatası:", e);
  } finally {
    setTimeout(updateCoinsTRY, 5 * 60 * 1000);
  }
}

updateCoinsTRY();

updateCoins();

// --- GLOBAL STATS (every 15 minutes) ---
async function fetchGlobal() {
  const url = "https://api.coingecko.com/api/v3/global";
  const { data } = await axios.get(url, { headers: { "Accept": "application/json" } });
  return data;
}

async function updateGlobal() {
  try {
    console.log(`[${new Date().toISOString()}] Global veriler güncelleniyor...`);
    const globalData = await fetchGlobal();
    const publicDir = path.resolve(__dirname, "../public");
    const jsonPath = path.join(publicDir, "global.json");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify({ updatedAt: new Date().toISOString(), data: globalData }, null, 2), "utf8");
    console.log(`Global dosyası yazıldı: public/global.json`);
  } catch (e) {
    console.error("Global güncelleme hatası:", e);
  } finally {
    setTimeout(updateGlobal, 15 * 60 * 1000);
  }
}

updateGlobal();

// --- AI PROXY (GitHub Models via Azure Inference) ---
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const AI_ENDPOINT = "https://models.github.ai/inference";
const AI_MODEL = "openai/gpt-5";

app.post("/api/ai/chat", async (req, res) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "GITHUB_TOKEN eksik" });
    }
    const { messages, temperature = 0.2, max_tokens = 220, model } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages zorunlu" });
    }

    const response = await axios.post(
      `${AI_ENDPOINT}/chat/completions`,
      {
        messages,
        model: model || AI_MODEL,
        temperature,
        max_tokens,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30_000,
      }
    );

    return res.json(response.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || { error: String(err?.message || err) };
    console.error('[AI PROXY ERROR]', status, data);
    return res.status(status).json(data);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[server] AI proxy dinlemede: http://localhost:${PORT}/api/ai/chat`);
});

// --- TradingView live quote endpoint (optimized with longer cache) ---
const tvCache = new Map(); // key -> { data, ts }
const tvErrorCache = new Map(); // key -> { count, lastError }

app.get('/api/tv/:symbol', async (req, res) => {
  const symbol = String(req.params.symbol || '').toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  const now = Date.now();
  const c = tvCache.get(symbol);
  
  // Cache for 30 seconds (increased from 5s to reduce API calls)
  if (c && now - c.ts < 30000) {
    return res.json(c.data);
  }
  
  // Rate limiting: if this symbol failed recently, return cached or skip
  const errInfo = tvErrorCache.get(symbol);
  if (errInfo && now - errInfo.lastError < 60000 && errInfo.count > 3) {
    // Return cached data if available, or return last known good data
    if (c) return res.json(c.data);
    return res.status(429).json({ error: 'rate_limited', cached: false });
  }
  
  try {
    let data = null;
    // Try TradingView-API if available
    try {
      const tv = await import('@mathieuc/tradingview');
      const client = new tv.TradingView();
      const sym = symbol.includes(':') ? symbol : `BINANCE:${symbol}USDT`;
      const quote = await client.getQuote(sym);
      // BIST hisseleri gecikmeli, crypto canlı
      const isDelayed = symbol.startsWith('BIST:') || symbol.includes('.IS');
      data = {
        symbol: symbol,
        provider: 'tradingview',
        price: Number(quote.lp ?? quote.price ?? 0),
        changePercent24h: Number(quote.chp ?? 0),
        high24h: Number(quote.high ?? 0),
        low24h: Number(quote.low ?? 0),
        ts: now,
        isDelayed: isDelayed
      };
      // Reset error count on success
      tvErrorCache.delete(symbol);
    } catch (e) {
      // fallback to Yahoo
      try {
        const sym = symbol.endsWith('-USD') ? symbol : `${symbol}-USD`;
        const q = await yahooFinance.quote(sym, { fields: [
          'regularMarketPrice','regularMarketChangePercent','regularMarketDayHigh','regularMarketDayLow'
        ]});
        // Yahoo Finance için de BIST kontrolü
        const isDelayed = symbol.startsWith('BIST:') || symbol.includes('.IS');
        data = {
          symbol,
          provider: 'yahoo',
          price: Number(q.regularMarketPrice || 0),
          changePercent24h: Number(q.regularMarketChangePercent || 0),
          high24h: Number(q.regularMarketDayHigh || 0),
          low24h: Number(q.regularMarketDayLow || 0),
          ts: now,
          isDelayed: isDelayed
        };
        // Reset error count on success
        tvErrorCache.delete(symbol);
      } catch (fallbackErr) {
        throw e; // Throw original error
      }
    }
    tvCache.set(symbol, { data, ts: now });
    return res.json(data);
  } catch (err) {
    // Track errors but don't spam console
    const errCount = (tvErrorCache.get(symbol)?.count || 0) + 1;
    tvErrorCache.set(symbol, { count: errCount, lastError: now });
    
    // Only log occasionally to reduce console noise
    if (errCount % 5 === 0) {
      console.warn(`TV endpoint error for ${symbol}:`, err?.message || 'Unknown error');
    }
    
    // Return cached data if available instead of error
    if (c) {
      return res.json(c.data);
    }
    
    return res.status(500).json({ error: 'tv_error', cached: false });
  }
});
// --- COIN/TL PARITELERI (every 10 minutes) ---
async function fetchCoinTLPairs() {
  try {
    const url = "https://api.coingecko.com/api/v3/coins/markets";
    const params = {
      vs_currency: "try",
      order: "market_cap_desc",
      per_page: 50,
      page: 1,
      sparkline: false,
      price_change_percentage: "24h"
    };
    const { data } = await axios.get(url, { params, headers: { "Accept": "application/json" } });
    return data;
  } catch (error) {
    console.error("Coin/TL pariteleri çekilirken hata:", error);
    return [];
  }
}

async function updateCoinTLPairs() {
  try {
    console.log(`[${new Date().toISOString()}] Coin/TL pariteleri güncelleniyor...`);
    const coinTLData = await fetchCoinTLPairs();
    const publicDir = path.resolve(__dirname, "../public");
    const jsonPath = path.join(publicDir, "coins-tl.json");
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const jsonPayload = { 
      updatedAt: new Date().toISOString(), 
      data: coinTLData 
    };
    fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2), "utf8");
    console.log(`Coin/TL pariteleri yazıldı: public/coins-tl.json`);
  } catch (e) {
    console.error("Coin/TL pariteleri güncelleme hatası:", e);
  } finally {
    setTimeout(updateCoinTLPairs, 10 * 60 * 1000); // 10 dakika
  }
}

updateCoinTLPairs();


