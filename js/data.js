/* =====================================================================
 *  Veri katmanı — bulut (Supabase) ve demo (localStorage) modlarını
 *  tek bir async arayüz altında birleştirir. Uygulama (app.js) yalnızca
 *  bu arayüzü kullanır; hangi modda olduğunu bilmez.
 *  ===================================================================== */
const Backend = (() => {
  "use strict";
  const cfg = window.SOYAGACIM_CONFIG || {};
  const cloud = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  let sb = null;
  if (cloud) {
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }
  return { cloud, sb, cfg };
})();

/* ---------------------- KİMLİK (Auth) ------------------------------- */
const Auth = (() => {
  "use strict";
  const { cloud, sb, cfg } = Backend;
  const listeners = [];
  let profile = null; // { id, email, full_name, role, status }

  function emit() { listeners.forEach((f) => f(profile)); }
  function onChange(fn) { listeners.push(fn); }

  /* ---- Demo modu: tek yerel kullanıcı, hep yönetici + onaylı ---- */
  function demoProfile() {
    return { id: "demo", email: cfg.ownerEmail || "demo@local", full_name: "Demo Kullanıcı", role: "admin", status: "approved", demo: true };
  }

  async function init() {
    if (!cloud) { profile = demoProfile(); emit(); return; }
    sb.auth.onAuthStateChange(async (_e, session) => {
      profile = session ? await loadProfile(session.user) : null;
      emit();
    });
    const { data } = await sb.auth.getSession();
    profile = data.session ? await loadProfile(data.session.user) : null;
    emit();
  }

  async function loadProfile(user) {
    const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
    return data || { id: user.id, email: user.email, role: "member", status: "pending" };
  }

  async function signUp(email, password, fullName) {
    if (!cloud) throw new Error("Demo modunda kayıt yok.");
    const { data, error } = await sb.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    // Yöneticiye bildirim e-postası (EmailJS varsa)
    notifyOwner(email, fullName).catch(() => {});
    return data;
  }

  async function signIn(email, password) {
    if (!cloud) throw new Error("Demo modunda giriş yok.");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    if (!cloud) return;
    await sb.auth.signOut();
  }

  function current() { return profile; }
  function isApproved() { return profile && profile.status === "approved"; }
  function isAdmin() { return profile && profile.role === "admin" && profile.status === "approved"; }

  /* ---- Yönetici: bekleyen üyeler ---- */
  async function listProfiles() {
    if (!cloud) return [];
    const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false });
    return data || [];
  }
  async function setStatus(id, status) {
    if (!cloud) return;
    await sb.from("profiles").update({ status }).eq("id", id);
    const p = (await listProfiles()).find((x) => x.id === id);
    if (status === "approved" && p) notifyUserApproved(p.email).catch(() => {});
  }
  async function setRole(id, role) {
    if (!cloud) return;
    await sb.from("profiles").update({ role }).eq("id", id);
  }

  /* ---- E-posta bildirimleri (EmailJS) ---- */
  async function notifyOwner(userEmail, userName) {
    const e = cfg.emailjs || {};
    if (!window.emailjs || !e.publicKey || !e.serviceId || !e.templateId) return;
    await window.emailjs.send(e.serviceId, e.templateId, {
      to_email: cfg.ownerEmail,
      user_email: userEmail,
      user_name: userName || userEmail,
      app_url: location.href,
      subject: "Soyağacım: yeni üyelik onayı bekliyor",
    }, { publicKey: e.publicKey });
  }
  async function notifyUserApproved(userEmail) {
    const e = cfg.emailjs || {};
    if (!window.emailjs || !e.publicKey || !e.serviceId || !e.templateId) return;
    await window.emailjs.send(e.serviceId, e.templateId, {
      to_email: userEmail,
      user_email: userEmail,
      user_name: userEmail,
      app_url: location.href,
      subject: "Soyağacım: üyeliğiniz onaylandı",
    }, { publicKey: e.publicKey });
  }

  return { init, onChange, signUp, signIn, signOut, current, isApproved, isAdmin,
           listProfiles, setStatus, setRole, cloud };
})();

/* ---------------------- VERİ (Data) -------------------------------- */
const Data = (() => {
  "use strict";
  const { cloud, sb } = Backend;
  const LS = "soyagacim_v2";

  /* ---- Demo deposu (localStorage) ---- */
  function lsGet() {
    try { return JSON.parse(localStorage.getItem(LS)) || {}; }
    catch { return {}; }
  }
  function lsSet(o) { localStorage.setItem(LS, JSON.stringify(o)); }
  function lsAll(key) { return lsGet()[key] || []; }
  function lsSave(key, arr) { const o = lsGet(); o[key] = arr; lsSet(o); }
  function uid() { return "x" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function ownerId() { const p = Auth.current(); return p ? p.id : "demo"; }

  /* ===== KİŞİLER ===== */
  async function listPeople() {
    if (!cloud) return lsAll("people");
    const { data, error } = await sb.from("people").select("*").order("created_at");
    if (error) throw error;
    return (data || []).map(fromRow);
  }
  async function savePerson(p) {
    if (!cloud) {
      const arr = lsAll("people");
      const i = arr.findIndex((x) => x.id === p.id);
      if (i >= 0) arr[i] = p; else { p.id = p.id || uid(); arr.push(p); }
      lsSave("people", arr); return p;
    }
    const row = toRow(p); row.owner = ownerId();
    if (p.id) {
      const { error } = await sb.from("people").update(row).eq("id", p.id);
      if (error) throw error; return p;
    }
    const { data, error } = await sb.from("people").insert(row).select().single();
    if (error) throw error; return fromRow(data);
  }
  async function deletePerson(id) {
    if (!cloud) { lsSave("people", lsAll("people").filter((x) => x.id !== id)); return; }
    const { error } = await sb.from("people").delete().eq("id", id);
    if (error) throw error;
  }

  // DB satırı <-> uygulama nesnesi (snake_case <-> camelCase)
  function toRow(p) {
    return {
      first_name: p.firstName || "", last_name: p.lastName || "", gender: p.gender || "",
      living: p.living || "yes", birth_date: p.birthDate || null, death_date: p.deathDate || null,
      birth_place: p.birthPlace || "", photo: p.photo || "", notes: p.notes || "",
      parents: p.parents || [], spouses: p.spouses || [],
    };
  }
  function fromRow(r) {
    return {
      id: r.id, firstName: r.first_name || "", lastName: r.last_name || "", gender: r.gender || "",
      living: r.living || "yes", birthDate: r.birth_date || "", deathDate: r.death_date || "",
      birthPlace: r.birth_place || "", photo: r.photo || "", notes: r.notes || "",
      parents: r.parents || [], spouses: r.spouses || [],
    };
  }

  /* ===== ALBÜMLER ===== */
  async function listAlbums() {
    if (!cloud) return lsAll("albums");
    const { data, error } = await sb.from("albums").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  async function createAlbum(title, description) {
    if (!cloud) {
      const arr = lsAll("albums");
      const a = { id: uid(), title, description: description || "", created_at: new Date().toISOString() };
      arr.unshift(a); lsSave("albums", arr); return a;
    }
    const { data, error } = await sb.from("albums")
      .insert({ owner: ownerId(), title, description: description || "" }).select().single();
    if (error) throw error; return data;
  }
  async function deleteAlbum(id) {
    if (!cloud) {
      lsSave("albums", lsAll("albums").filter((a) => a.id !== id));
      lsSave("photos", lsAll("photos").filter((p) => p.album_id !== id));
      return;
    }
    // İlişkili fotoğrafları depolamadan da sil
    const photos = await listPhotos(id);
    await Promise.all(photos.map((ph) => ph.storage_path
      ? sb.storage.from("photos").remove([ph.storage_path]) : Promise.resolve()));
    const { error } = await sb.from("albums").delete().eq("id", id);
    if (error) throw error;
  }

  /* ===== FOTOĞRAFLAR ===== */
  async function listPhotos(albumId) {
    if (!cloud) return lsAll("photos").filter((p) => p.album_id === albumId);
    const { data, error } = await sb.from("photos").select("*")
      .eq("album_id", albumId).order("created_at", { ascending: false });
    if (error) throw error; return data || [];
  }
  async function uploadPhoto(albumId, file, caption) {
    if (!cloud) {
      // Demo: resmi dataURL olarak sakla
      const url = await fileToDataURL(file);
      const arr = lsAll("photos");
      const p = { id: uid(), album_id: albumId, url, caption: caption || "", created_at: new Date().toISOString() };
      arr.unshift(p); lsSave("photos", arr); return p;
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${ownerId()}/${albumId}/${uid()}.${ext}`;
    const up = await sb.storage.from("photos").upload(path, file, { upsert: false });
    if (up.error) throw up.error;
    const { data: pub } = sb.storage.from("photos").getPublicUrl(path);
    const { data, error } = await sb.from("photos").insert({
      owner: ownerId(), album_id: albumId, url: pub.publicUrl, storage_path: path, caption: caption || "",
    }).select().single();
    if (error) throw error; return data;
  }
  async function deletePhoto(photo) {
    if (!cloud) { lsSave("photos", lsAll("photos").filter((p) => p.id !== photo.id)); return; }
    if (photo.storage_path) await sb.storage.from("photos").remove([photo.storage_path]);
    const { error } = await sb.from("photos").delete().eq("id", photo.id);
    if (error) throw error;
  }

  function fileToDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
    });
  }

  /* Demo verisini içe/dışa aktarma (yedek) */
  function exportLocal() { return lsGet(); }
  function importLocal(obj) { lsSet(obj); }

  return {
    cloud,
    listPeople, savePerson, deletePerson,
    listAlbums, createAlbum, deleteAlbum,
    listPhotos, uploadPhoto, deletePhoto,
    exportLocal, importLocal,
  };
})();
