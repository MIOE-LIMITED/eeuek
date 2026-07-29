#!/usr/bin/env python3
# Tek seferlik içe aktarma: EgemAmbalaj_Stok_ZohoGecmis.xlsx -> products.json
#
# Kurallar (kullanıcı talebi):
#  - Excel'deki stoklu ürünler katalogumuza eklenir; Kart Kodu eşleşirse güncellenir.
#  - Yalnızca "Zoho Liste Fiyatı" fiyat olarak kullanılır (EUR). Diğer sütunlar
#    (Teklif adet/aralık, Fatura adet/aralık, Alış aralığı, Son hareket) ASLA yazılmaz.
#  - Satış fiyatı = Zoho * 1.25 (%25 kâr). Üstü çizili liste = satış / 0.90 (müşteri
#    %10 indirim görür; kasaya giren yine satış = Zoho*1.25).
#  - Fiili stok > 0 olan ürünler "Stokta" işaretlenir.
#
# Kullanım:  python3 scripts/merge-egem-stock.py [XLSX_YOLU] [--dry]

import json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTS = os.path.join(ROOT, "klimasun-2026/data/products.json")
CATS = os.path.join(ROOT, "klimasun-2026/data/categories.json")
XLSX = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else \
    "/root/.claude/uploads/86b0abf9-ed65-5404-b3fd-967d3aea420c/b7458b36-EgemAmbalaj_Stok_ZohoGecmis.xlsx"
DRY = "--dry" in sys.argv

TR_MAP = str.maketrans({"ı": "i", "İ": "i", "ş": "s", "Ş": "s", "ğ": "g", "Ğ": "g",
                        "ü": "u", "Ü": "u", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c"})

def slugify(s):
    s = (s or "").translate(TR_MAP)
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)

# Excel markası -> katalog marka etiketi (bn)
BRAND_MAP = {
    "ECO": "eco", "RITTAL": "RITTAL", "FORM": "FORM", "MKS": "MKS Clima",
    "HIGHLY": "Highly", "EBM PAPST": "Ebm Papst", "GMC": "GMC", "COSMOTEC": "Cosmotec",
}
def map_brand(m):
    key = (m or "").strip().upper().translate(TR_MAP).upper()
    return BRAND_MAP.get(key, (m or "").strip() or "Muhtelif Markalar")

# Marka/açıklamaya göre makul kategori (pc = "ana--alt")
def pick_category(bn, name):
    n = (name or "").lower()
    if bn == "MKS Clima" or "pano" in n or "klima" in n:
        return "pano-iklimlendirme--pano-klimasi"
    if bn == "FORM" or "fes" in n or "sirkulasyon" in n or "şamandıra" in n.lower():
        return "evaporatif-sogutma--yedekparca-ve-bakim-urunleri"
    if bn == "eco" or any(w in n for w in ("temiz", "kireç", "kirec", "sıvı", "sivi", "tablet")):
        return "kimyasal-urunler--kimyasal-urunler"
    if bn == "RITTAL":
        return "rittal-yedek-parca--aktif-bilesenler"
    return "yedek-parca--yedek-parca"

def money(x):
    return round(float(x) + 1e-9, 2)

def read_rows(path):
    import openpyxl
    ws = openpyxl.load_workbook(path, data_only=True).active
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    return [r for r in rows if any(v is not None for v in r)]

def main():
    products = json.load(open(PRODUCTS, encoding="utf-8"))
    cat_slugs = {c["slug"] for c in json.load(open(CATS, encoding="utf-8"))["flat"]}
    by_code = {str(p["c"]).strip().lower(): p for p in products}
    slugs = {p["s"] for p in products}

    rows = read_rows(XLSX)
    updated = added = priced = stocked = 0
    new_products = []

    for r in rows:
        (marka, kart, aciklama, fiili, gercek, _sf, _dv, _zd, _zk, zad, zfiyat,
         *_gizli) = r  # _gizli: Teklif/Fatura/Alış/SonHareket -> KULLANILMAZ
        kart = None if kart is None else str(kart).strip()
        if not kart:
            continue
        name = (aciklama or zad or kart).strip()
        in_stock = (fiili or 0) > 0

        prc = None
        if zfiyat is not None:
            try:
                sale = money(float(zfiyat) * 1.25)
                lst = money(sale / 0.90)
                prc = {"cur": "EUR", "sale": sale, "list": lst, "disc": 10}
            except (TypeError, ValueError):
                prc = None

        key = kart.lower()
        if key in by_code:
            p = by_code[key]
            if in_stock:
                p["st"] = "Stokta"; stocked += 1
            if prc:
                p["prc"] = prc; priced += 1
            updated += 1
        else:
            bn = map_brand(marka)
            pc = pick_category(bn, name)
            if pc not in cat_slugs:
                pc = "yedek-parca--yedek-parca"
            dom = pc.split("--")[0]
            base = slugify(name)[:55] or slugify(kart)
            s = f"{base}-{slugify(kart)}"[:80].strip("-")
            i = 2
            while s in slugs:
                s = f"{base}-{slugify(kart)}-{i}"[:80].strip("-"); i += 1
            slugs.add(s)
            np = {
                "s": s, "n": name, "c": kart, "b": slugify(bn), "bn": bn,
                "img": "", "th": "", "cats": [pc], "sd": name, "ld": "",
                "kw": f"{name} {kart}".lower(), "st": "Stokta" if in_stock else "Stokta Yok",
                "pr": "", "tg": [], "dom": dom, "f": {}, "pc": pc,
            }
            if prc:
                np["prc"] = prc; priced += 1
            if in_stock:
                stocked += 1
            new_products.append(np)
            added += 1

    products.extend(new_products)

    print(f"Excel satırı: {len(rows)}")
    print(f"Güncellenen (mevcut): {updated} | Yeni eklenen: {added}")
    print(f"Stokta işaretlenen: {stocked} | Fiyat eklenen: {priced}")
    print(f"Yeni toplam ürün: {len(products)}")
    if DRY:
        print("[DRY] yazılmadı."); return
    json.dump(products, open(PRODUCTS, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("products.json yazıldı.")

if __name__ == "__main__":
    main()
