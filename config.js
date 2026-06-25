/* =====================================================================
 *  Soyağacım — Yapılandırma
 *  Bu dosyayı doldurunca uygulama "bulut moduna" geçer (üyelik, giriş,
 *  resim yükleme, albümler paylaşımlı). Boş bırakırsanız uygulama
 *  "demo modunda" tek cihazda çalışır (veriler yalnız bu tarayıcıda).
 *  ===================================================================== */
window.SOYAGACIM_CONFIG = {
  /* --- Supabase (ücretsiz proje: https://supabase.com) ---
     Proje > Settings > API kısmından alın. */
  supabaseUrl: "",        // örn: "https://xxxx.supabase.co"
  supabaseAnonKey: "",    // "anon public" anahtarı

  /* --- Yöneticinin (sizin) e-posta adresiniz ---
     Yeni kayıt bildirimleri buraya gönderilir. İlk kaydolan kişi
     otomatik olarak yönetici + onaylı olur. */
  ownerEmail: "eeu@outlook.com.tr",

  /* --- EmailJS (ücretsiz: https://www.emailjs.com) ---
     Yeni üye kaydolunca size e-posta göndermek için. Boş bırakılırsa
     e-posta gönderilmez (onay panelini yine kullanabilirsiniz). */
  emailjs: {
    publicKey: "",   // EmailJS > Account > API Keys > Public Key
    serviceId: "",   // EmailJS > Email Services
    templateId: "",  // EmailJS > Email Templates (değişkenler: to_email, user_email, user_name, app_url)
  },
};
