import { NextResponse } from 'next/server';
import { saveQuote, recentQuotes } from '@/lib/quotes';

export const runtime = 'nodejs';

const CONDS = ['Sıfır', '2.El', 'Takas', 'Tamir'];

const digits = (s) => (s || '').replace(/\D/g, '');
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhone = (s) => digits(s).length >= 10 && digits(s).length <= 15;
const hasLetter = (s) => /\p{L}/u.test(s || '');

// İstanbul saatiyle YYMMDD ve okunur tarih-saat.
function istanbulParts(date) {
  const fmt = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    yymmdd: `${p.year}${p.month}${p.day}`,
    display: `${p.day}.${p.month}.20${p.year} ${p.hour}:${p.minute}`,
  };
}

function makeRef(yymmdd) {
  const bytes = crypto.getRandomValues(new Uint8Array(3));
  const rand = Array.from(bytes, (b) => b.toString(36)).join('').toUpperCase().slice(0, 4).padEnd(4, '0');
  return `TK-${yymmdd}-${rand}`;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Geçersiz istek.' }, { status: 400 });
  }

  const name = (body?.name || '').toString().trim();
  const contact = (body?.contact || '').toString().trim();
  const note = (body?.note || '').toString().trim().slice(0, 1000);
  const rowsIn = Array.isArray(body?.rows) ? body.rows : [];

  // --- Doğrulama (sunucu tarafı — son söz) ---
  const errors = {};
  if (name.length < 2 || !hasLetter(name)) errors.name = 'Ad Soyad / Firma girin.';
  if (!contact) errors.contact = 'E-posta veya telefon girin.';
  else if (!isEmail(contact) && !isPhone(contact)) errors.contact = 'Geçerli bir e-posta veya telefon girin.';

  const rows = rowsIn
    .map((r) => ({
      code: (r?.code || '').toString().trim().slice(0, 120),
      qty: Math.max(1, Math.min(100000, parseInt(r?.qty, 10) || 1)),
      cond: CONDS.includes(r?.cond) ? r.cond : 'Sıfır',
    }))
    .filter((r) => r.code);
  if (rows.length === 0) errors.rows = 'En az bir ürün / parça kodu girin.';

  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  // --- Referans + zaman damgası (sunucu üretir) ---
  const now = new Date();
  const { yymmdd, display } = istanbulParts(now);
  let ref = makeRef(yymmdd);

  const record = {
    ref,
    ts: now.toISOString(),
    tsLocal: display, // İstanbul saati, gg.aa.yyyy ss:dd
    name,
    contact,
    contactType: isEmail(contact) ? 'email' : 'phone',
    note,
    rows,
    items: rows.length,
    ua: (req.headers.get('user-agent') || '').slice(0, 200),
    source: 'hizli-teklif',
  };

  try {
    await saveQuote(record);
  } catch {
    // Depoya yazılamasa bile kullanıcıya referans verilir; talep kaybolmasın diye
    // en azından sunucu loglarına düşer.
    console.error('Teklif kaydı yazılamadı:', ref);
  }

  return NextResponse.json({ ok: true, ref, tsLocal: display });
}

// Geçmişe dönük takip: token korumalı liste. QUOTE_ADMIN_TOKEN tanımlı değilse kapalı.
export async function GET(req) {
  const admin = process.env.QUOTE_ADMIN_TOKEN;
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Devre dışı.' }, { status: 404 });
  }
  const token = new URL(req.url).searchParams.get('token') || '';
  if (token !== admin) {
    return NextResponse.json({ ok: false, error: 'Yetkisiz.' }, { status: 401 });
  }
  const limit = Math.max(1, Math.min(500, parseInt(new URL(req.url).searchParams.get('limit'), 10) || 100));
  const list = await recentQuotes(limit);
  return NextResponse.json({ ok: true, count: list.length, quotes: list });
}
