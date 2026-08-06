#!/usr/bin/env python3
# Tek seferlik: APEX-EK gaz algılama ürün ailesini kataloğa ekler.
#  - Otomasyon altına "Gaz Algılama & Kaçak Tespit" alt kategorisi (intro ile)
#  - APEX-EK markası (markalar beyaz listesine)
#  - APEX-EK-RV-00 (zengin içerikli ana ürün) + 7 sistem bileşeni
# Idempotent: var olan kod/slug tekrar eklenmez.
#
# Kullanım: python3 scripts/add-apex-ek.py [--dry]

import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, "klimasun-2026/data/products.json")
C = os.path.join(ROOT, "klimasun-2026/data/categories.json")
VB = os.path.join(ROOT, "lib/visible-brands.json")
DRY = "--dry" in sys.argv

SUB_SLUG = "otomasyon--gaz-algilama-kacak-tespit"
SUB_NAME = "Gaz Algılama & Kaçak Tespit"
SUB_INTRO = (
    "Endüstriyel soğutma tesislerinde soğutkan kaçağı, fark edilene kadar hem enerji hem "
    "soğutkan kaybettirir. Bu kategoride makine daireleri, soğuk hava depoları ve proses "
    "soğutma hatları için sabit gaz algılama ürünleri yer alır: Modbus RTU çıkışlı dedektörler, "
    "çok kanallı gaz kontrol panelleri, EN 54-4 güç kaynakları, akü grupları ve EN 54-3 / "
    "EN 54-23 sertifikalı sirenler. F-Gaz Yönetmeliği kapsamında 500 ton CO₂ eşdeğeri ve üzeri "
    "florlu sera gazı içeren ekipmanlarda sabit sızıntı tespit sistemi kurulumu zorunludur; "
    "sabit sistem bulunan tesislerde periyodik manuel kaçak kontrol aralıkları iki katına çıkar. "
    "Doğru sistemi kurgulamak için soğutkan envanteri, hacim ölçüleri ve mevcut otomasyon "
    "altyapısı birlikte değerlendirilir — hızlı teklif formundan bu bilgileri iletmeniz yeterlidir."
)
BRAND = "APEX-EK"
BSLUG = "apex-ek"
MFR = {"name": "Erdinç Klima Endüstri Ürünleri San. Tic. Ltd. Şti.", "url": "https://www.erdincklima.com/"}
DS = "https://www.erdincklima.com/apex-ek-rv-00-sogutucu-gaz-algilama-sensoru-modbus-rtu/"

def base(slug, name, code, ld, sd, kw, f, st, rich=None, mt=None, md=None):
    p = {
        "s": slug, "n": name, "c": code, "b": BSLUG, "bn": BRAND,
        "img": "", "th": "", "cats": [SUB_SLUG], "sd": sd, "ld": ld,
        "kw": kw, "st": st, "pr": "", "tg": [], "dom": "otomasyon", "f": f,
        "pc": SUB_SLUG,
    }
    if rich: p["rich"] = rich
    if mt: p["mt"] = mt
    if md: p["md"] = md
    return p

RV_RICH = {
    "badges": ["0–2000 ppm", "Modbus RTU / RS-485", "24 V DC", "IP54", "Tek hatta 32 dedektör"],
    "highlights": [
        {"icon": "🔌", "title": "Ek donanım yok", "text": "Standart Modbus RTU slave — dönüştürücü, ağ geçidi veya lisans gerektirmez."},
        {"icon": "🧵", "title": "Tek kablo güzergâhı", "text": "Çok-noktalı RS-485 hattında 32 dedektöre kadar; nokta başına ayrı kablo çekilmez."},
        {"icon": "🩺", "title": "Kendi kendini raporlar", "text": "Sensör direnci, ham ADC ve hat hata sayacı register'lardan okunur — arıza teşhisi panel başında."},
        {"icon": "📋", "title": "F-Gaz uyumu", "text": "500 tCO₂e ve üzeri sistemlerde zorunlu sabit kaçak tespit sisteminin (LDS) algılama katmanı."},
    ],
    "system": [
        {"name": "APEX-EK-RV-00", "note": "Sahadaki algılama noktası sayısı kadar dedektör"},
        {"name": "APEX-EK-PNL", "note": "Gaz kontrol paneli — 32 dedektör + 6 analog giriş, 3 alarm + 1 hata rölesi"},
        {"name": "APEX-EK-PS + APEX-EK-AKU-K", "note": "24 V DC güç kaynağı (EN 54-4) + akü grubu"},
        {"name": "APEX-EK-SRN-K / -B", "note": "Flaşörlü siren (oda içi ve kapı üstü)"},
        {"name": "APEX-EK-PP", "note": "Panel koruma panosu"},
        {"name": "APEX-EK-SRVS", "note": "Devreye alma, fonksiyon testi ve kullanıcı eğitimi"},
    ],
    "install": [
        "Yükseklik: HFC/HCFC gazlar havadan ağır → zeminden 30–45 cm",
        "Mesafe: Kaçak kaynağına (kompresör, flanş, rakor) maks. 6 m yarıçap",
        "Ölü bölgeler: Pit, kablo kanalı, merdiven boşluğu ayrıca izlenir",
        "Hat: Ekranlı burgulu çift kablo, her iki uçta 120 Ω sonlandırma, ekran tek noktadan topraklı",
    ],
    "apps": [
        "Chiller makine daireleri", "Soğuk hava depoları ve şoklama",
        "Gıda / ilaç / kimya proses soğutma", "Enjeksiyon ve kalıp soğutma",
        "Süpermarket soğutma hatları", "Veri merkezi teknik hacimleri",
    ],
    "links": [
        {"label": "Teknik derinlik ve register haritası (erdincklima.com)", "href": DS},
        {"label": "F-Gaz Sabit Kaçak Tespit Rehberi", "href": "https://www.erdincklima.com/f-gaz-sabit-kacak-tespit-sistemleri-apex-ek26-makine-dairesi-uygulamasi-rehberi/"},
        {"label": "Makine dairesinde kaçak tespiti — blog", "href": "https://www.erdincklima.com/makine-dairesinde-sogutucu-gaz-kacagi-tespiti-modbus-dedektor/"},
    ],
    "faq": [
        {"q": "APEX-EK-RV-00 mevcut SCADA sistemine bağlanır mı?", "a": "Modbus RTU destekleyen tüm PLC, SCADA ve BMS sistemlerine ek donanım olmadan bağlanır. Ana cihazın holding register'ları okuması yeterlidir; ağ geçidi veya lisans gerekmez."},
        {"q": "Bir makine dairesi için kaç dedektör gerekir?", "a": "Dedektör sayısı hacme, ekipman yerleşimine ve pit ile kanal gibi ölü bölgelere göre belirlenir. Makine dairesi ölçüleri ile chiller ve kompresör sayısı iletildiğinde yerleşim önerisiyle birlikte teklif hazırlanır."},
        {"q": "Kurulum ve devreye alma hizmeti veriliyor mu?", "a": "Keşif, yerleşim projelendirmesi, montaj, kalibre gaz ile fonksiyon testi, BMS entegrasyonu ve kullanıcı eğitimi anahtar teslim verilir. Türkiye geneli hizmet sağlanır."},
        {"q": "Fiyatı ne kadar?", "a": "Fiyat dedektör sayısı, panel konfigürasyonu ve devreye alma kapsamına göre değişir. Hızlı teklif formunu doldurun; aynı iş günü içinde kalem bazlı fiyat listesi gönderelim."},
        {"q": "Sertifikalı ekip mi çalışıyor?", "a": "F-Gaz kapsamındaki sızıntı kontrolü, gaz geri kazanımı ve kayıt işlemleri sertifikalı personel tarafından yürütülür."},
    ],
    "cta": {
        "title": "Makine dairenizi tek hattan izleyin",
        "text": "Dedektör sayısı, panel konfigürasyonu ve devreye alma dâhil kalem bazlı teklif — aynı iş günü.",
    },
    "mfr": MFR,
    "datasheet": DS,
}

RV = base(
    "apex-ek-rv-00-sogutucu-gaz-algilama-sensoru",
    "APEX-EK-RV-00 Soğutucu Gaz Algılama Sensörü (Modbus RTU / RS-485)",
    "APEX-EK-RV-00",
    ("Makine dairesindeki kaçağı, personel fark etmeden hattınız fark etsin. Modbus RTU çıkışlı "
     "bağımsız dedektör; ayrı ağ geçidi olmadan mevcut PLC, SCADA veya BMS sisteminize bağlanır. "
     "0–2000 ppm ölçüm, IP54 saha muhafazası ve tek RS-485 hattında 32 dedektöre kadar izleme."),
    "0–2000 ppm soğutucu gaz dedektörü. Modbus RTU ile doğrudan PLC/SCADA bağlantısı. F-Gaz uyumlu sabit kaçak tespiti.",
    "apex-ek-rv-00 soğutucu gaz dedektörü modbus rtu rs-485 makine dairesi kaçak tespit sensörü f-gaz ppm apex ek",
    {
        "Sensör": "Kalay-dioksit (SnO₂) yarı iletken, difüzyon tipi",
        "Hedef gazlar": "R-134a, R-404A, R-407C, R-410A, R-22",
        "Ölçüm aralığı": "0–2000 ppm",
        "Haberleşme": "Modbus RTU slave · 2 telli RS-485 · 115200 8-E-1",
        "Adresleme": "DIP ile 1–31 · yazılım adresiyle 1–247",
        "Besleme": "24 V DC · ters polarite korumalı · 5,08 mm klemens",
        "Muhafaza": "IP54 saha tipi · −10 °C … +60 °C",
        "Göstergeler": "2 × durum LED · yazılımsal tanımlama modu",
        "Ürün ailesi": "Panel, güç kaynağı, akü, siren ve devreye alma ile komple sistem",
    },
    "Stokta",
    rich=RV_RICH,
    mt="APEX-EK-RV-00 Soğutucu Gaz Dedektörü Modbus RTU | Klimasun",
    md="Makine dairesi ve soğuk depo için soğutucu gaz dedektörü: 0–2000 ppm, RS-485 Modbus RTU, IP54, tek hatta 32 dedektör. Aynı gün hızlı teklif.",
)

COMPONENTS = [
    base("apex-ek-pnl-gaz-kontrol-paneli", "APEX-EK-PNL Gaz Kontrol Paneli", "APEX-EK-PNL",
         "APEX-EK gaz algılama sisteminin merkezi kontrol paneli. 32 dedektöre kadar Modbus RTU dedektör ve 6 analog girişi izler; 3 alarm ve 1 hata rölesi ile siren, damper ve BMS tetikler.",
         "32 dedektör + 6 analog giriş, 3 alarm + 1 hata rölesi gaz kontrol paneli.",
         "apex-ek-pnl gaz kontrol paneli modbus 32 dedektör alarm rölesi",
         {"Kapasite": "32 Modbus dedektör + 6 analog giriş", "Röleler": "3 alarm + 1 hata", "Haberleşme": "Modbus RTU / RS-485", "Besleme": "24 V DC"},
         "Stokta Yok"),
    base("apex-ek-ps-24v-dc-guc-kaynagi", "APEX-EK-PS 24 V DC Güç Kaynağı (EN 54-4)", "APEX-EK-PS",
         "Gaz algılama paneli ve dedektör hattı için EN 54-4 uyumlu 24 V DC güç kaynağı. Akü grubu (APEX-EK-AKU-K) ile kesintisiz besleme sağlar.",
         "EN 54-4 uyumlu 24 V DC güç kaynağı.",
         "apex-ek-ps 24v dc güç kaynağı en 54-4",
         {"Tip": "24 V DC güç kaynağı", "Standart": "EN 54-4", "Koruma": "Ters polarite / kısa devre"},
         "Stokta Yok"),
    base("apex-ek-aku-k-aku-grubu", "APEX-EK-AKU-K Akü Grubu", "APEX-EK-AKU-K",
         "APEX-EK-PS güç kaynağıyla çalışan yedek akü grubu; şebeke kesintisinde gaz algılama sisteminin çalışmasını sürdürür.",
         "Yedek besleme akü grubu (EN 54-4 güç kaynağı ile).",
         "apex-ek-aku-k akü grubu yedek besleme en 54-4",
         {"Tip": "Yedek besleme akü grubu", "Uyum": "APEX-EK-PS / EN 54-4"},
         "Stokta Yok"),
    base("apex-ek-srn-k-flasorlu-siren-oda-ici", "APEX-EK-SRN-K Flaşörlü Siren (Oda İçi)", "APEX-EK-SRN-K",
         "Oda içi montaj için flaşörlü sesli-ışıklı siren. Gaz alarmında personeli sesli ve görsel olarak uyarır. EN 54-3 / EN 54-23 uyumlu.",
         "Oda içi flaşörlü sesli-ışıklı siren (EN 54-3 / EN 54-23).",
         "apex-ek-srn-k flaşörlü siren oda içi alarm en 54-3 en 54-23",
         {"Tip": "Flaşörlü sesli-ışıklı siren", "Montaj": "Oda içi", "Uyum": "EN 54-3 / EN 54-23"},
         "Stokta Yok"),
    base("apex-ek-srn-b-flasorlu-siren-kapi-ustu", "APEX-EK-SRN-B Flaşörlü Siren (Kapı Üstü)", "APEX-EK-SRN-B",
         "Kapı üstü / girişte montaj için flaşörlü sesli-ışıklı siren. Alan dışındaki personeli içeri girmeden uyarır. EN 54-3 / EN 54-23 uyumlu.",
         "Kapı üstü flaşörlü sesli-ışıklı siren (EN 54-3 / EN 54-23).",
         "apex-ek-srn-b flaşörlü siren kapı üstü alarm en 54-3 en 54-23",
         {"Tip": "Flaşörlü sesli-ışıklı siren", "Montaj": "Kapı üstü / dış", "Uyum": "EN 54-3 / EN 54-23"},
         "Stokta Yok"),
    base("apex-ek-pp-panel-koruma-panosu", "APEX-EK-PP Panel Koruma Panosu", "APEX-EK-PP",
         "Gaz kontrol panelini saha koşullarına karşı koruyan pano. Kablo girişleri ve montaj plakası ile hazır.",
         "Gaz kontrol paneli için koruma panosu.",
         "apex-ek-pp panel koruma panosu",
         {"Tip": "Panel koruma panosu"},
         "Stokta Yok"),
    base("apex-ek-srvs-devreye-alma-egitim", "APEX-EK-SRVS Devreye Alma ve Kullanıcı Eğitimi", "APEX-EK-SRVS",
         "Anahtar teslim devreye alma hizmeti: keşif, yerleşim projelendirmesi, montaj, kalibre gaz ile fonksiyon testi, BMS entegrasyonu ve kullanıcı eğitimi. Türkiye geneli.",
         "Anahtar teslim devreye alma, fonksiyon testi ve kullanıcı eğitimi.",
         "apex-ek-srvs devreye alma fonksiyon testi bms entegrasyonu eğitim",
         {"Kapsam": "Keşif · montaj · kalibre gaz testi · BMS entegrasyonu · eğitim", "Bölge": "Türkiye geneli"},
         "Stokta Yok"),
]

def main():
    products = json.load(open(P, encoding="utf-8"))
    cats = json.load(open(C, encoding="utf-8"))
    try:
        vb = json.load(open(VB, encoding="utf-8"))
    except FileNotFoundError:
        vb = []

    existing = {str(p["c"]).strip().lower() for p in products}
    existing_slugs = {p["s"] for p in products}

    # 1) Alt kategori (flat + tree/otomasyon)
    flat_slugs = {c["slug"] for c in cats["flat"]}
    if SUB_SLUG not in flat_slugs:
        cats["flat"].append({"slug": SUB_SLUG, "name": SUB_NAME, "count": 0, "intro": SUB_INTRO})
    for top in cats["tree"]:
        if top["slug"] == "otomasyon":
            if not any(ch["slug"] == SUB_SLUG for ch in top.get("children", [])):
                top.setdefault("children", []).insert(0, {"slug": SUB_SLUG, "name": SUB_NAME, "count": 0, "intro": SUB_INTRO})

    # 2) Marka beyaz listesi
    if BRAND not in vb:
        vb.append(BRAND)

    # 3) Ürünler
    added = 0
    for np in [RV] + COMPONENTS:
        if np["c"].strip().lower() in existing or np["s"] in existing_slugs:
            print("  atlandı (var):", np["c"]); continue
        products.append(np); added += 1

    print(f"Eklenen ürün: {added} | toplam: {len(products)}")
    print("Alt kategori:", SUB_SLUG, "| marka:", BRAND, "beyaz listede")
    if DRY:
        print("[DRY] yazılmadı."); return
    json.dump(products, open(P, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump(cats, open(C, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump(vb, open(VB, "w", encoding="utf-8"), ensure_ascii=False)
    print("Yazıldı: products.json, categories.json, visible-brands.json")

if __name__ == "__main__":
    main()
