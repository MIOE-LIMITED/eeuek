/* =====================================================================
 *  Soyağacım — UI / uygulama mantığı
 *  Veriye Data.* ve Auth.* üzerinden erişir (bkz. js/data.js).
 *  ===================================================================== */
const App = (() => {
  "use strict";

  let people = [];           // önbelleğe alınmış kişi listesi
  let rootId = null;
  let zoom = 1;
  let currentAlbum = null;

  /* ---------- Yardımcılar ---------- */
  const byId = (id) => people.find((p) => p.id === id);
  const fullName = (p) => [p.firstName, p.lastName].filter(Boolean).join(" ") || "İsimsiz";
  const year = (d) => (d ? String(d).slice(0, 4) : "");
  function lifeSpan(p) {
    const b = year(p.birthDate), d = year(p.deathDate);
    if (b && d) return `${b} – ${d}`;
    if (b) return p.living === "no" ? `${b} – ?` : `d. ${b}`;
    if (d) return `? – ${d}`;
    return "";
  }
  const genderIcon = (p) => (p.gender === "male" ? "👨" : p.gender === "female" ? "👩" : "🧑");
  const childrenOf = (id) => people.filter((p) => (p.parents || []).includes(id));
  const escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (id) => document.getElementById(id);

  function avatarHtml(p, cls = "avatar") {
    if (p.photo) {
      return `<img class="${cls}" src="${escapeHtml(p.photo)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${cls}',textContent:'${genderIcon(p)}'}))" />`;
    }
    return `<div class="${cls}">${genderIcon(p)}</div>`;
  }
  function personCard(p) {
    const gcls = p.gender === "male" ? "male" : p.gender === "female" ? "female" : "";
    const span = lifeSpan(p);
    return `<div class="card ${gcls}" data-id="${p.id}" onclick="App.showDetail('${p.id}')">
      ${avatarHtml(p)}<div class="name">${escapeHtml(fullName(p))}</div>
      ${span ? `<div class="dates">${escapeHtml(span)}</div>` : ""}
      ${p.living === "no" && !p.deathDate ? `<div class="deceased">✝ vefat etti</div>` : ""}
    </div>`;
  }

  /* ---------- Veri yükleme ---------- */
  async function reloadPeople() {
    try { people = await Data.listPeople(); }
    catch (e) { console.error(e); toast("Veri yüklenemedi: " + e.message); people = []; }
    if (!byId(rootId)) rootId = people[0] ? people[0].id : null;
  }

  /* ---------- Ağaç ---------- */
  function renderTree() {
    const canvas = $("treeCanvas"), empty = $("treeEmpty"), viewport = $("treeViewport");
    if (!people.length) { canvas.innerHTML = ""; empty.classList.remove("hidden"); viewport.classList.add("hidden"); return; }
    empty.classList.add("hidden"); viewport.classList.remove("hidden");
    let root = byId(rootId) || people[0];
    rootId = root.id;
    canvas.innerHTML = buildNode(root.id, new Set());
    applyZoom();
  }
  function buildNode(id, seen) {
    const p = byId(id);
    if (!p || seen.has(id)) return "";
    seen.add(id);
    let coupleHtml = personCard(p);
    const spouses = (p.spouses || []).map(byId).filter(Boolean);
    const partner = spouses.find((s) => !seen.has(s.id));
    if (partner) { seen.add(partner.id); coupleHtml = `<div class="couple">${personCard(p)}<div class="couple-link"></div>${personCard(partner)}</div>`; }
    const kidIds = new Set();
    childrenOf(p.id).forEach((c) => kidIds.add(c.id));
    if (partner) childrenOf(partner.id).forEach((c) => kidIds.add(c.id));
    const kids = [...kidIds].map(byId).filter((c) => c && !seen.has(c.id));
    let childrenHtml = "";
    if (kids.length) childrenHtml = `<div class="tree-children">${kids.map((c) => `<div class="tree-subtree">${buildNode(c.id, seen)}</div>`).join("")}</div>`;
    return `<div class="tree-node">${coupleHtml}${childrenHtml}</div>`;
  }
  function applyZoom() { $("treeCanvas").style.transform = `scale(${zoom})`; $("zoomLabel").textContent = Math.round(zoom * 100) + "%"; }
  function setZoom(d) { zoom = Math.min(2, Math.max(0.3, +(zoom + d).toFixed(2))); applyZoom(); }

  /* ---------- Liste ---------- */
  function renderList(filter = "") {
    const grid = $("personGrid"), f = filter.trim().toLowerCase();
    const list = people.filter((p) => fullName(p).toLowerCase().includes(f))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), "tr"));
    grid.innerHTML = list.length
      ? list.map((p) => `<div class="grid-card">${personCard(p)}</div>`).join("")
      : `<div class="empty"><p>Kişi bulunamadı.</p></div>`;
  }

  /* ---------- İstatistik ---------- */
  function renderStats() {
    const el = $("statsContent"), ppl = people;
    const boxes = [
      ["Toplam kişi", ppl.length],
      ["Erkek", ppl.filter((p) => p.gender === "male").length],
      ["Kadın", ppl.filter((p) => p.gender === "female").length],
      ["Yaşayan", ppl.filter((p) => p.living !== "no").length],
      ["Nesil sayısı", generations()],
      ["Fotoğraflı", ppl.filter((p) => p.photo).length],
    ];
    let html = boxes.map(([l, n]) => `<div class="stat-box"><div class="num">${n}</div><div class="label">${l}</div></div>`).join("");
    const oldest = ppl.filter((p) => p.birthDate).sort((a, b) => a.birthDate.localeCompare(b.birthDate))[0];
    if (oldest) html += `<div class="stat-box"><div class="num">${year(oldest.birthDate)}</div><div class="label">En eski doğum: ${escapeHtml(fullName(oldest))}</div></div>`;
    el.innerHTML = html || `<div class="empty"><p>Veri yok.</p></div>`;
  }
  function generations() {
    if (!people.length) return 0;
    let max = 0;
    const depth = (id, seen) => { if (seen.has(id)) return 0; seen.add(id); let d = 1; childrenOf(id).forEach((k) => { d = Math.max(d, 1 + depth(k.id, seen)); }); return d; };
    people.filter((p) => !(p.parents || []).length).forEach((r) => { max = Math.max(max, depth(r.id, new Set())); });
    return max || 1;
  }

  /* ---------- Kök seçici ---------- */
  function refreshRootSelect() {
    $("rootSelect").innerHTML = people.slice().sort((a, b) => fullName(a).localeCompare(fullName(b), "tr"))
      .map((p) => `<option value="${p.id}" ${p.id === rootId ? "selected" : ""}>${escapeHtml(fullName(p))}</option>`).join("");
  }

  /* ---------- Kişi formu ---------- */
  function fillRelationSelects(excludeId) {
    const opts = people.filter((p) => p.id !== excludeId)
      .sort((a, b) => fullName(a).localeCompare(fullName(b), "tr"))
      .map((p) => `<option value="${p.id}">${escapeHtml(fullName(p))}</option>`).join("");
    $("parentsSelect").innerHTML = opts; $("spousesSelect").innerHTML = opts;
  }
  function openPersonForm(id) {
    const form = $("personForm"); form.reset(); fillRelationSelects(id);
    const delBtn = $("deletePersonBtn");
    if (id) {
      const p = byId(id);
      $("personModalTitle").textContent = "Kişiyi düzenle";
      $("personId").value = p.id; $("firstName").value = p.firstName || ""; $("lastName").value = p.lastName || "";
      $("gender").value = p.gender || ""; $("living").value = p.living || "yes";
      $("birthDate").value = p.birthDate || ""; $("deathDate").value = p.deathDate || "";
      $("birthPlace").value = p.birthPlace || ""; $("photo").value = p.photo || ""; $("notes").value = p.notes || "";
      setMulti("parentsSelect", p.parents || []); setMulti("spousesSelect", p.spouses || []);
      delBtn.classList.remove("hidden");
    } else {
      $("personModalTitle").textContent = "Kişi ekle"; $("personId").value = ""; delBtn.classList.add("hidden");
    }
    $("personModal").classList.remove("hidden"); $("firstName").focus();
  }
  const setMulti = (id, vals) => [...$(id).options].forEach((o) => { o.selected = vals.includes(o.value); });
  const getMulti = (id) => [...$(id).selectedOptions].map((o) => o.value);

  async function submitPerson(e) {
    e.preventDefault();
    const person = {
      id: $("personId").value || undefined,
      firstName: $("firstName").value.trim(), lastName: $("lastName").value.trim(),
      gender: $("gender").value, living: $("living").value,
      birthDate: $("birthDate").value, deathDate: $("deathDate").value,
      birthPlace: $("birthPlace").value.trim(), photo: $("photo").value.trim(),
      notes: $("notes").value.trim(), parents: getMulti("parentsSelect"), spouses: getMulti("spousesSelect"),
    };
    try {
      const saved = await Data.savePerson(person);
      // Eş ilişkisini çift yönlü tut
      await syncSpouses(saved);
      if (!rootId) rootId = saved.id;
      await reloadPeople(); closeModals(); renderActive();
    } catch (err) { toast("Kaydedilemedi: " + err.message); }
  }
  async function syncSpouses(person) {
    const updates = [];
    for (const p of people) {
      if (p.id === person.id) continue;
      const sp = p.spouses || [];
      const should = (person.spouses || []).includes(p.id);
      const linked = sp.includes(person.id);
      if (should && !linked) updates.push(Data.savePerson({ ...p, spouses: [...sp, person.id] }));
      else if (!should && linked) updates.push(Data.savePerson({ ...p, spouses: sp.filter((x) => x !== person.id) }));
    }
    await Promise.all(updates);
  }
  async function deletePerson(id) {
    if (!confirm("Bu kişiyi silmek istediğinize emin misiniz?")) return;
    try {
      await Data.deletePerson(id);
      // İlişkilerden temizle
      const fixes = [];
      for (const p of people) {
        const np = (p.parents || []).filter((x) => x !== id);
        const ns = (p.spouses || []).filter((x) => x !== id);
        if (np.length !== (p.parents || []).length || ns.length !== (p.spouses || []).length)
          fixes.push(Data.savePerson({ ...p, parents: np, spouses: ns }));
      }
      await Promise.all(fixes);
      if (rootId === id) rootId = null;
      await reloadPeople(); closeModals(); renderActive();
    } catch (err) { toast("Silinemedi: " + err.message); }
  }

  /* ---------- Kişi detayı ---------- */
  function showDetail(id) {
    const p = byId(id); if (!p) return;
    const parents = (p.parents || []).map(byId).filter(Boolean);
    const spouses = (p.spouses || []).map(byId).filter(Boolean);
    const kids = childrenOf(id);
    const siblings = people.filter((s) => s.id !== id && (s.parents || []).some((pa) => (p.parents || []).includes(pa)));
    const chips = (arr) => arr.length
      ? `<div class="relation-chips">${arr.map((r) => `<span class="chip" onclick="App.showDetail('${r.id}')">${escapeHtml(fullName(r))}</span>`).join("")}</div>`
      : `<div class="detail-note" style="color:var(--neutral)">—</div>`;
    const meta = []; if (lifeSpan(p)) meta.push(lifeSpan(p)); if (p.birthPlace) meta.push("📍 " + escapeHtml(p.birthPlace));
    $("detailCard").innerHTML = `
      <div class="detail-head">${avatarHtml(p)}
        <div><h2>${escapeHtml(fullName(p))}</h2><div class="sub">${meta.join(" · ")}</div></div>
        <button class="modal-close" data-close style="margin-left:auto">×</button></div>
      <div class="detail-body">
        <div class="detail-section"><h3>Ebeveynler</h3>${chips(parents)}</div>
        <div class="detail-section"><h3>Eş(ler)</h3>${chips(spouses)}</div>
        <div class="detail-section"><h3>Çocuklar</h3>${chips(kids)}</div>
        <div class="detail-section"><h3>Kardeşler</h3>${chips(siblings)}</div>
        ${p.notes ? `<div class="detail-section"><h3>Notlar</h3><div class="detail-note">${escapeHtml(p.notes)}</div></div>` : ""}
      </div>
      <div class="detail-actions">
        <button class="btn btn-primary" onclick="App.openPersonForm('${p.id}')">Düzenle</button>
        <button class="btn btn-ghost" onclick="App.setRoot('${p.id}')">Ağacın kökü yap</button>
        <button class="btn btn-ghost" onclick="App.addChildTo('${p.id}')">Çocuk ekle</button>
      </div>`;
    $("detailModal").classList.remove("hidden");
  }
  function addChildTo(parentId) { closeModals(); openPersonForm(); setMulti("parentsSelect", [parentId]); }
  function setRoot(id) { rootId = id; closeModals(); switchView("tree"); }

  /* =====================  ALBÜMLER  ===================== */
  async function renderAlbums() {
    $("albumDetail").classList.add("hidden");
    const grid = $("albumsGrid"); grid.classList.remove("hidden");
    grid.innerHTML = `<div class="muted" style="padding:20px">Yükleniyor…</div>`;
    let albums = [];
    try { albums = await Data.listAlbums(); } catch (e) { grid.innerHTML = `<div class="empty"><p>Albümler yüklenemedi: ${escapeHtml(e.message)}</p></div>`; return; }
    if (!albums.length) { grid.innerHTML = `<div class="empty"><p>📷 Henüz albüm yok. İlk albümünüzü oluşturun.</p></div>`; return; }
    // Her albüm için kapak ve sayı
    const cards = await Promise.all(albums.map(async (a) => {
      let photos = []; try { photos = await Data.listPhotos(a.id); } catch {}
      const cover = photos[0];
      return `<div class="album-card" onclick="App.openAlbum('${a.id}')">
        <div class="album-cover">${cover ? `<img src="${escapeHtml(cover.url)}" alt="" />` : "📷"}</div>
        <div class="album-meta"><div class="album-name">${escapeHtml(a.title)}</div>
          <div class="muted">${photos.length} fotoğraf</div></div></div>`;
    }));
    grid.innerHTML = cards.join("");
  }
  async function openAlbum(id) {
    let albums = []; try { albums = await Data.listAlbums(); } catch {}
    const a = albums.find((x) => x.id === id); if (!a) return;
    currentAlbum = a;
    $("albumsGrid").classList.add("hidden");
    $("albumDetail").classList.remove("hidden");
    $("albumTitle").textContent = a.title;
    $("albumDesc").textContent = a.description || "";
    await renderPhotos();
  }
  async function renderPhotos() {
    const grid = $("photosGrid"); grid.innerHTML = `<div class="muted">Yükleniyor…</div>`;
    let photos = [];
    try { photos = await Data.listPhotos(currentAlbum.id); }
    catch (e) { grid.innerHTML = `<div class="empty"><p>${escapeHtml(e.message)}</p></div>`; return; }
    if (!photos.length) { grid.innerHTML = `<div class="empty"><p>Bu albümde henüz fotoğraf yok. “+ Fotoğraf yükle” ile ekleyin.</p></div>`; return; }
    grid.innerHTML = photos.map((p) => `<div class="photo-item">
      <img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption || "")}" onclick="App.lightbox('${escapeHtml(p.url)}','${escapeHtml(p.caption || "")}')" />
      <button class="photo-del" title="Sil" onclick="App.deletePhoto('${p.id}')">×</button>
      ${p.caption ? `<div class="photo-cap">${escapeHtml(p.caption)}</div>` : ""}
    </div>`).join("");
  }
  async function handlePhotoUpload(files) {
    if (!currentAlbum || !files.length) return;
    const status = $("uploadStatus");
    let done = 0;
    for (const file of files) {
      status.textContent = `Yükleniyor… (${done + 1}/${files.length})`;
      try { await Data.uploadPhoto(currentAlbum.id, file, ""); done++; }
      catch (e) { toast("Yüklenemedi: " + e.message); }
    }
    status.textContent = done ? `${done} fotoğraf yüklendi.` : "";
    setTimeout(() => (status.textContent = ""), 3000);
    await renderPhotos();
  }
  async function deletePhoto(id) {
    if (!confirm("Bu fotoğrafı sil?")) return;
    const photos = await Data.listPhotos(currentAlbum.id);
    const ph = photos.find((p) => p.id === id); if (!ph) return;
    try { await Data.deletePhoto(ph); await renderPhotos(); } catch (e) { toast("Silinemedi: " + e.message); }
  }
  async function createAlbum(e) {
    e.preventDefault();
    const title = $("albumTitleInput").value.trim(); if (!title) return;
    try {
      await Data.createAlbum(title, $("albumDescInput").value.trim());
      $("albumForm").reset(); closeModals(); await renderAlbums();
    } catch (err) { toast("Albüm oluşturulamadı: " + err.message); }
  }
  async function deleteCurrentAlbum() {
    if (!currentAlbum || !confirm(`“${currentAlbum.title}” albümü ve içindeki tüm fotoğraflar silinecek. Emin misiniz?`)) return;
    try { await Data.deleteAlbum(currentAlbum.id); currentAlbum = null; await renderAlbums(); }
    catch (e) { toast("Silinemedi: " + e.message); }
  }
  function lightbox(url, cap) {
    $("lightboxImg").src = url; $("lightboxCaption").textContent = cap || "";
    $("lightbox").classList.remove("hidden");
  }

  /* =====================  ÜYE YÖNETİMİ (yönetici)  ===================== */
  async function renderAdmin() {
    const el = $("adminContent");
    if (!Auth.cloud) { el.innerHTML = `<div class="empty"><p>Üye yönetimi yalnızca bulut modunda kullanılır (Supabase yapılandırın).</p></div>`; return; }
    el.innerHTML = `<div class="muted">Yükleniyor…</div>`;
    let profiles = [];
    try { profiles = await Auth.listProfiles(); } catch (e) { el.innerHTML = `<div class="empty"><p>${escapeHtml(e.message)}</p></div>`; return; }
    const pending = profiles.filter((p) => p.status === "pending");
    const others = profiles.filter((p) => p.status !== "pending");
    const row = (p) => `<tr>
      <td>${escapeHtml(p.full_name || "—")}</td>
      <td>${escapeHtml(p.email || "")}</td>
      <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
      <td>${p.role === "admin" ? "👑 Yönetici" : "Üye"}</td>
      <td class="admin-actions">
        ${p.status !== "approved" ? `<button class="btn btn-primary btn-sm" onclick="App.approve('${p.id}')">Onayla</button>` : ""}
        ${p.status !== "rejected" ? `<button class="btn btn-danger btn-sm" onclick="App.reject('${p.id}')">Reddet</button>` : ""}
      </td></tr>`;
    el.innerHTML = `
      ${pending.length ? `<h3 class="admin-sub">Onay bekleyenler (${pending.length})</h3>
        <table class="admin-table"><tbody>${pending.map(row).join("")}</tbody></table>` : `<p class="muted">Bekleyen üye yok.</p>`}
      <h3 class="admin-sub">Tüm üyeler (${others.length})</h3>
      <table class="admin-table">
        <thead><tr><th>Ad</th><th>E-posta</th><th>Durum</th><th>Rol</th><th></th></tr></thead>
        <tbody>${others.map(row).join("")}</tbody></table>`;
  }
  const statusLabel = (s) => ({ pending: "Bekliyor", approved: "Onaylı", rejected: "Reddedildi" }[s] || s);
  async function approve(id) { await Auth.setStatus(id, "approved"); toast("Üye onaylandı."); renderAdmin(); }
  async function reject(id) { if (confirm("Üyeyi reddet?")) { await Auth.setStatus(id, "rejected"); renderAdmin(); } }

  /* =====================  GÖRÜNÜM / GENEL  ===================== */
  function switchView(name) {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    renderActive(name);
  }
  function renderActive(name) {
    const active = name || (document.querySelector(".view.active") || {}).id?.replace("view-", "") || "tree";
    refreshRootSelect();
    if (active === "list") renderList($("searchInput").value);
    else if (active === "stats") renderStats();
    else if (active === "albums") renderAlbums();
    else if (active === "admin") renderAdmin();
    else renderTree();
  }
  function closeModals() { document.querySelectorAll(".modal, .lightbox").forEach((m) => m.classList.add("hidden")); }
  function toast(msg) { console.log(msg); alert(msg); }

  /* ---------- İçe/dışa aktar (yedek) ---------- */
  async function exportData() {
    const payload = Data.cloud ? { people } : Data.exportLocal();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "soyagacim.json"; a.click();
    URL.revokeObjectURL(a.href);
  }
  async function importData(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        const list = Array.isArray(data) ? data : data.people;
        if (!Array.isArray(list)) throw new Error("Geçersiz dosya");
        if (Data.cloud) { for (const p of list) await Data.savePerson({ ...p, id: undefined }); }
        else Data.importLocal(data.people ? data : { people: list });
        await reloadPeople(); renderActive(); toast("İçe aktarıldı: " + list.length + " kişi.");
      } catch (e) { toast("Dosya okunamadı: " + e.message); }
    };
    reader.readAsText(file);
  }
  async function clearAll() {
    if (!confirm("TÜM kişileriniz silinecek. Emin misiniz?")) return;
    if (Data.cloud) { for (const p of people) await Data.deletePerson(p.id); }
    else Data.importLocal({ people: [], albums: [], photos: [] });
    rootId = null; await reloadPeople(); renderActive();
  }

  /* ---------- Örnek aile ---------- */
  async function loadSample() {
    const mk = (firstName, lastName, gender, birthDate, extra = {}) =>
      ({ firstName, lastName, gender, birthDate, living: "yes", parents: [], spouses: [], ...extra });
    // Sırayla kaydet ki id'ler oluşsun, sonra ilişkileri bağla
    const dede = await Data.savePerson(mk("Ahmet", "Yılmaz", "male", "1940-03-12", { living: "no", deathDate: "2015-08-01", birthPlace: "Sivas" }));
    const nine = await Data.savePerson(mk("Fatma", "Yılmaz", "female", "1945-06-20", { living: "no", deathDate: "2018-11-10", birthPlace: "Sivas", spouses: [dede.id] }));
    await Data.savePerson({ ...dede, spouses: [nine.id] });
    const baba = await Data.savePerson(mk("Mehmet", "Yılmaz", "male", "1968-01-15", { parents: [dede.id, nine.id], birthPlace: "Ankara" }));
    const anne = await Data.savePerson(mk("Ayşe", "Yılmaz", "female", "1971-09-05", { birthPlace: "İstanbul", spouses: [baba.id] }));
    await Data.savePerson({ ...baba, spouses: [anne.id] });
    await Data.savePerson(mk("Zeynep", "Demir", "female", "1972-04-25", { parents: [dede.id, nine.id] }));
    await Data.savePerson(mk("Elif", "Yılmaz", "female", "1998-07-30", { parents: [baba.id, anne.id] }));
    await Data.savePerson(mk("Can", "Yılmaz", "male", "2001-12-11", { parents: [baba.id, anne.id] }));
    rootId = dede.id; await reloadPeople(); switchView("tree");
  }

  /* =====================  KİMLİK AKIŞI  ===================== */
  function showScreen(which) {
    $("authScreen").classList.toggle("hidden", which !== "auth");
    $("pendingScreen").classList.toggle("hidden", which !== "pending");
    $("appShell").classList.toggle("hidden", which !== "app");
  }
  async function onAuthChange(profile) {
    if (Auth.cloud && !profile) { showScreen("auth"); return; }
    if (Auth.cloud && profile && profile.status !== "approved") { showScreen("pending"); return; }
    // Onaylı (veya demo) → uygulamayı göster
    showScreen("app");
    document.querySelectorAll(".admin-only").forEach((e) => e.classList.toggle("hidden", !Auth.isAdmin()));
    document.querySelectorAll(".cloud-only").forEach((e) => e.classList.toggle("hidden", !Auth.cloud));
    $("modeBadge").textContent = Auth.cloud ? "" : "demo";
    $("menuUser").textContent = profile ? (profile.email || "") : "";
    $("footerNote").textContent = Auth.cloud
      ? "Soyağacım — verileriniz hesabınıza özeldir."
      : "Demo modu — veriler yalnız bu tarayıcıda saklanır. Bulut için Supabase yapılandırın.";
    await reloadPeople(); renderActive("tree");
  }

  function bindAuth() {
    document.querySelectorAll(".auth-tab").forEach((t) => t.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach((x) => x.classList.toggle("active", x === t));
      $("loginForm").classList.toggle("hidden", t.dataset.tab !== "login");
      $("registerForm").classList.toggle("hidden", t.dataset.tab !== "register");
      $("authMsg").textContent = "";
    }));
    $("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault(); $("authMsg").textContent = "Giriş yapılıyor…";
      try { await Auth.signIn($("loginEmail").value.trim(), $("loginPass").value); $("authMsg").textContent = ""; }
      catch (err) { $("authMsg").textContent = "Giriş başarısız: " + err.message; }
    });
    $("registerForm").addEventListener("submit", async (e) => {
      e.preventDefault(); $("authMsg").textContent = "Kayıt yapılıyor…";
      try {
        await Auth.signUp($("regEmail").value.trim(), $("regPass").value, $("regName").value.trim());
        $("authMsg").innerHTML = "<b>Kaydınız alındı.</b> Yönetici onayından sonra giriş yapabilirsiniz.";
        $("registerForm").reset();
      } catch (err) { $("authMsg").textContent = "Kayıt başarısız: " + err.message; }
    });
    $("pendingLogout").addEventListener("click", () => Auth.signOut());
  }

  /* ---------- Olay bağlama ---------- */
  function bind() {
    document.querySelectorAll(".nav-btn").forEach((b) => b.addEventListener("click", () => switchView(b.dataset.view)));
    $("addPersonBtn").addEventListener("click", () => openPersonForm());
    $("personForm").addEventListener("submit", submitPerson);
    $("deletePersonBtn").addEventListener("click", () => { const id = $("personId").value; if (id) deletePerson(id); });
    document.addEventListener("click", (e) => { if (e.target.matches("[data-close], .modal-backdrop")) closeModals(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });
    $("searchInput").addEventListener("input", (e) => { switchView("list"); renderList(e.target.value); });
    $("rootSelect").addEventListener("change", (e) => { rootId = e.target.value; renderTree(); });
    $("zoomIn").addEventListener("click", () => setZoom(0.1));
    $("zoomOut").addEventListener("click", () => setZoom(-0.1));
    $("zoomReset").addEventListener("click", () => { zoom = 1; applyZoom(); });

    const dropdown = $("menuDropdown");
    $("menuBtn").addEventListener("click", (e) => { e.stopPropagation(); dropdown.classList.toggle("hidden"); });
    document.addEventListener("click", () => dropdown.classList.add("hidden"));
    dropdown.addEventListener("click", (e) => e.stopPropagation());
    $("exportBtn").addEventListener("click", exportData);
    $("sampleBtn").addEventListener("click", loadSample);
    $("clearBtn").addEventListener("click", clearAll);
    $("logoutBtn").addEventListener("click", () => Auth.signOut());
    $("importBtn").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener("change", (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ""; });

    // Albümler
    $("addAlbumBtn").addEventListener("click", () => $("albumModal").classList.remove("hidden"));
    $("albumForm").addEventListener("submit", createAlbum);
    $("backToAlbums").addEventListener("click", renderAlbums);
    $("deleteAlbumBtn").addEventListener("click", deleteCurrentAlbum);
    $("photoInput").addEventListener("change", (e) => { handlePhotoUpload([...e.target.files]); e.target.value = ""; });
  }

  /* ---------- Başlat ---------- */
  async function init() {
    bind(); bindAuth();
    Auth.onChange(onAuthChange);
    await Auth.init();
  }

  return {
    init, openPersonForm, showDetail, setRoot, addChildTo, loadSample, deletePerson,
    openAlbum, deletePhoto, lightbox, approve, reject,
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
