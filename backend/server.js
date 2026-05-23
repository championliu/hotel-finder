import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const PORT = process.env.PORT || 8787;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',').map(s => s.trim());

if (!API_KEY) console.warn('[hotel-finder] WARNING: GOOGLE_PLACES_API_KEY not set');
if (!RAPIDAPI_KEY) console.warn('[hotel-finder] WARNING: RAPIDAPI_KEY not set — Booking.com live search disabled');
if (!ANTHROPIC_KEY) console.warn('[hotel-finder] WARNING: ANTHROPIC_API_KEY not set — web-search email fallback disabled');

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
  res.json({ ok: true, hasKey: !!API_KEY, hasRapidApiKey: !!RAPIDAPI_KEY, service: 'hotel-finder-proxy' });
});

const RAPIDAPI_HEADERS = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com',
};
const BOOKING_BASE = 'https://booking-com15.p.rapidapi.com/api/v1/hotels';

function requireRapidKey(req, res, next) {
  if (!RAPIDAPI_KEY) return res.status(500).json({ error: 'RAPIDAPI_KEY not configured' });
  next();
}

// Resolve landmark → dest_id
app.get('/api/booking/destination', requireRapidKey, async (req, res) => {
  const { query = '' } = req.query;
  try {
    const r = await fetch(`${BOOKING_BASE}/searchDestination?query=${encodeURIComponent(query)}`, { headers: RAPIDAPI_HEADERS });
    const data = await r.json();
    console.log('[booking/destination]', query, '->', JSON.stringify(data).slice(0, 300));
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Search hotels with real availability + prices
app.get('/api/booking/search', requireRapidKey, async (req, res) => {
  const {
    dest_id, search_type = 'CITY',
    checkin_date, checkout_date,
    adults_number = 2, children_number = 0,
    room_number = 1, currency_code = 'USD',
    page_number = 1,
  } = req.query;

  const params = new URLSearchParams({
    dest_id,
    search_type,
    arrival_date: checkin_date,
    departure_date: checkout_date,
    adults: adults_number,
    children_number,
    no_rooms: room_number,
    currency_code,
    locale: 'en-us',
    filter_by_currency: currency_code,
    order_by: 'popularity',
    units: 'metric',
  });

  try {
    const r = await fetch(`${BOOKING_BASE}/searchHotels?${params}`, { headers: RAPIDAPI_HEADERS });
    const data = await r.json();
    const hotels = data.data?.hotels || data.data?.result || [];
    if (hotels.length > 0) {
      const h0 = hotels[0];
      // Log full raw object so we can see every available field
      console.log('[booking/search] first hotel RAW ->', JSON.stringify(h0).slice(0, 1200));
    } else {
      console.log('[booking/search] full response ->', JSON.stringify(data).slice(0, 500));
    }
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
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

// Scrape hotel website for email addresses and booking page link
app.get('/api/hotel/website-info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ emails: [], bookingUrl: null });

  const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const EMAIL_IGNORE = ['example.com', 'sentry.io', 'schema.org', 'w3.org', 'wixpress.com',
    'amazonaws.com', 'cloudflare.com', '@2x', '.png', '.jpg', '.gif', '.svg', 'noreply', 'no-reply'];
  const BOOKING_KW = ['book', 'reserv', 'reserve', '予約', '訂房', '予約する', '空室'];

  async function fetchPage(fetchUrl) {
    try {
      const r = await fetch(fetchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' },
        signal: AbortSignal.timeout(7000),
        redirect: 'follow',
      });
      if (!r.ok) return null;
      return (await r.text()).slice(0, 300000);
    } catch { return null; }
  }

  function extractEmails(html) {
    const raw = html.match(EMAIL_RE) || [];
    return [...new Set(raw)].filter(e => !EMAIL_IGNORE.some(ig => e.toLowerCase().includes(ig)));
  }

  function extractBookingUrl(html, base) {
    // Look for <a href="..."> whose text or href contains booking keywords
    const linkRe = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = linkRe.exec(html)) !== null) {
      const href = m[1], text = m[2].replace(/<[^>]+>/g, '').trim().toLowerCase();
      const combined = (href + ' ' + text).toLowerCase();
      if (BOOKING_KW.some(kw => combined.includes(kw))) {
        try {
          return new URL(href, base).href;
        } catch { /* skip invalid */ }
      }
    }
    return null;
  }

  try {
    const baseUrl = new URL(url).origin;
    const contactPaths = [url, `${baseUrl}/contact`, `${baseUrl}/contact-us`, `${baseUrl}/en/contact`, `${baseUrl}/about`];

    let emails = [];
    let bookingUrl = null;

    for (const page of contactPaths) {
      const html = await fetchPage(page);
      if (!html) continue;
      const found = extractEmails(html);
      emails.push(...found);
      if (!bookingUrl) bookingUrl = extractBookingUrl(html, baseUrl);
      if (emails.length > 0 && bookingUrl) break;
    }

    res.json({ emails: [...new Set(emails)].slice(0, 5), bookingUrl });
  } catch (e) {
    res.json({ emails: [], bookingUrl: null, error: e.message });
  }
});

// ── Web-search fallback: find a hotel's official email from name + address ──
// Used when Google Places gives us no website, or website scraping found no
// email. Requires ANTHROPIC_API_KEY; returns { email, website } (either null).
const EMAIL_SEARCH_SYSTEM = [
  'You are a research assistant that finds the OFFICIAL contact email address of a hotel by searching the web.',
  "1. Find the hotel's own official website. Ignore online travel agencies (Booking.com, Agoda, Expedia, Trip.com, Hotels.com, TripAdvisor, etc.).",
  '2. Search specifically for the contact / reservations page. Run targeted queries such as "<hotel name> contact email" and "<hotel name> reservations email".',
  '3. Inspect the contact/reservations page for an email (including mailto: links such as reservations@, info@, contact@, stay@ on the hotel\'s own domain).',
  "Only return an email that belongs to the hotel's official domain — never an OTA, aggregator, or directory address.",
  'Respond with ONLY a JSON object, no markdown and no extra prose, in the exact form:',
  '{"email": "<address or null>", "website": "<official site URL or null>"}',
  'If you cannot confidently find an official email, set email to null. Do not guess or fabricate an address.',
].join('\n');

function parseEmailResult(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { email: null, website: null };
    const parsed = JSON.parse(match[0]);
    const email =
      typeof parsed.email === 'string' && /^\S+@\S+\.\S+$/.test(parsed.email.trim())
        ? parsed.email.trim()
        : null;
    const website =
      typeof parsed.website === 'string' && /^https?:\/\//.test(parsed.website.trim())
        ? parsed.website.trim()
        : null;
    return { email, website };
  } catch {
    return { email: null, website: null };
  }
}

app.get('/api/hotel/find-email', async (req, res) => {
  const { name = '', address = '' } = req.query;
  if (!name) return res.status(400).json({ email: null, website: null, error: 'name is required' });
  if (!anthropic) return res.json({ email: null, website: null, error: 'ANTHROPIC_API_KEY not configured' });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 8 }],
      system: EMAIL_SEARCH_SYSTEM,
      messages: [{
        role: 'user',
        content: `Find the official contact/reservations email for this hotel:\nName: ${name}\nAddress: ${address || '(address not provided)'}`,
      }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    const result = parseEmailResult(text);
    console.log('[hotel/find-email]', name, '->', JSON.stringify(result));
    res.json(result);
  } catch (e) {
    console.error('[hotel/find-email] error:', e.message);
    res.json({ email: null, website: null, error: e.message });
  }
});

// Production: serve built frontend
// app.use(express.static('../frontend/dist'));
// app.get('*', (_req, res) => res.sendFile(new URL('../frontend/dist/index.html', import.meta.url).pathname));

app.listen(PORT, () => {
  console.log(`[hotel-finder] proxy listening on http://localhost:${PORT}`);
  if (!API_KEY) console.log('[hotel-finder] No Google Places API key — running in no-key mode');
});
