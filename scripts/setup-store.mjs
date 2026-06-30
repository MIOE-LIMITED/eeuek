#!/usr/bin/env node
/**
 * Tek seferlik kurulum scripti.
 *
 *  1. Bir Gemini File Search Store oluşturur.
 *  2. /dokumanlar klasöründeki tüm PDF ve DOCX dosyalarını yükleyip indeksler.
 *  3. Store adını ekrana basar — bu satırı .env dosyanıza ekleyin.
 *
 * Çalıştırma:
 *   npm run setup-store
 * (Bu komut `node --env-file=.env scripts/setup-store.mjs` çalıştırır.)
 */
import { GoogleGenAI } from '@google/genai';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const STORE_DISPLAY_NAME = 'klimasun-dokumanlar';
const DOCS_DIR = path.resolve(process.cwd(), 'dokumanlar');
const ALLOWED_EXT = new Set(['.pdf', '.docx']);
const POLL_MS = 4000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('HATA: GEMINI_API_KEY tanımlı değil. .env dosyanızı kontrol edin.');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log('→ File Search Store oluşturuluyor…');
  const store = await ai.fileSearchStores.create({
    config: { displayName: STORE_DISPLAY_NAME },
  });
  console.log(`✓ Store oluşturuldu: ${store.name}`);

  let files = [];
  try {
    files = (await readdir(DOCS_DIR)).filter((f) =>
      ALLOWED_EXT.has(path.extname(f).toLowerCase())
    );
  } catch {
    console.warn(`! "${DOCS_DIR}" klasörü okunamadı. PDF/DOCX yüklemesi atlanıyor.`);
  }

  if (files.length === 0) {
    console.warn('! dokumanlar/ içinde PDF veya DOCX dosyası bulunamadı.');
    console.warn('  Dosyaları ekleyip scripti tekrar çalıştırabilir ya da');
    console.warn('  aşağıdaki store adını şimdiden .env dosyanıza ekleyebilirsiniz.');
  }

  for (const file of files) {
    const fullPath = path.join(DOCS_DIR, file);
    process.stdout.write(`→ Yükleniyor: ${file} `);
    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
      file: fullPath,
      fileSearchStoreName: store.name,
      config: { displayName: file },
    });

    while (!operation.done) {
      await sleep(POLL_MS);
      operation = await ai.operations.get({ operation });
      process.stdout.write('.');
    }
    if (operation.error) {
      console.log(` ✗ HATA: ${operation.error.message || JSON.stringify(operation.error)}`);
    } else {
      console.log(' ✓ indekslendi');
    }
  }

  console.log('\n========================================================');
  console.log('BİTTİ. Aşağıdaki satırı .env dosyanıza ekleyin:\n');
  console.log(`GEMINI_FILE_SEARCH_STORE=${store.name}`);
  console.log('\nVercel kullanıyorsanız aynı değeri Environment Variables');
  console.log('bölümüne de ekleyin.');
  console.log('========================================================');
}

main().catch((err) => {
  console.error('\nKurulum başarısız:', err?.message || err);
  process.exit(1);
});
