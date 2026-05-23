import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 8787;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',').map(s => s.trim());

if (!API_KEY) {
  console.warn('[hotel-finder] WARNING: GOOGLE_PLACES_API_KEY is not set — live endpoints will return 500');
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  }
}));

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const BAD_STATUSES = ['OVER_QUERY_LIMIT', 'REQUEST_DENIED', 'ZERO_RESULTS', 'INVALID_REQUEST'];

function requireKey(req, res, next) {
  if (!API_KEY) {
    return res.status(500).json({
      error: 'No API key configured',
      status: 'NO_KEY',
      message: 'Set GOOGLE_PLACES_API_KEY in backend/.env'
    });
  }
  next();
}

function handleGoogleStatus(res, data) {
  if (BAD_STATUSES.includes(data.status)) {
    res.status(400).json({
      error: data.error_message || data.status,
      status: data.status,
      message: `Google Places returned ${data.status}`
    });
    return true;
  }
  return false;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: !!API_KEY, service: 'hotel-finder-proxy' });
});

app.get('/api/places/search', requireKey, async (req, res) => {
  const { query = '', language = 'en' } = req.query;
  const url = `${PLACES_BASE}/textsearch/json?query=${encodeURIComponent(query)}&language=${language}&key=${API_KEY}`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    if (handleGoogleStatus(res, data)) return;
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get('/api/places/nearby', requireKey, async (req, res) => {
  const { lat, lng, radius = 2000, type = 'lodging', keyword = '', pageToken = '', language = 'en' } = req.query;
  let url;
  if (pageToken) {
    url = `${PLACES_BASE}/nearbysearch/json?pagetoken=${encodeURIComponent(pageToken)}&key=${API_KEY}`;
  } else {
    url = `${PLACES_BASE}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&keyword=${encodeURIComponent(keyword)}&language=${language}&key=${API_KEY}`;
  }
  try {
    const r = await fetch(url);
    const data = await r.json();
    if (handleGoogleStatus(res, data)) return;
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get('/api/places/details', requireKey, async (req, res) => {
  const { placeId, language = 'en' } = req.query;
  const fields = 'name,formatted_phone_number,international_phone_number,website,url,formatted_address,opening_hours,rating,user_ratings_total,geometry';
  const url = `${PLACES_BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&language=${language}&key=${API_KEY}`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    if (handleGoogleStatus(res, data)) return;
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Production: serve built frontend
// app.use(express.static('../frontend/dist'));
// app.get('*', (_req, res) => res.sendFile(new URL('../frontend/dist/index.html', import.meta.url).pathname));

app.listen(PORT, () => {
  console.log(`[hotel-finder] proxy listening on http://localhost:${PORT}`);
  if (!API_KEY) console.log('[hotel-finder] No Google Places API key — running in no-key mode');
});
