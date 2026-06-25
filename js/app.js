/* Soyağacım — tarayıcıda çalışan aile ağacı uygulaması
 * Veri localStorage'da saklanır; sunucu gerekmez. */
const App = (() => {
  "use strict";

  const STORAGE_KEY = "soyagacim_v1";
  let state = { people: [], rootId: null, zoom: 1 };

  /* ---------- Depolama ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (e) { console.warn("Veri yüklenemedi", e); }
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function uid() {
    return "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }

  /* ---------- Yardımcılar ---------- */
  const byId = (id) => state.people.find((p) => p.id === id);
  function fullName(p) {
    return [p.firstName, p.lastName].filter(Boolean).join(" ") || "İsimsiz";
  }
  function year(d) { return d ? String(d).slice(0, 4) : ""; }
  function lifeSpan(p) {
    const b = year(p.birthDate), d = year(p.deathDate);
    if (b && d) return `${b} – ${d}`;
    if (b) return p.living === "no" ? `${b} – ?` : `d. ${b}`;
    if (d) return `? – ${d}`;
    return "";
  }
  function genderIcon(p) {
    if (p.gender === "male") return "👨";
    if (p.gender === "female") return "👩";
    return "🧑";
  }
  function childrenOf(id) {
    return state.people.filter((p) => (p.parents || []).includes(id));
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Avatar ---------- */
  function avatarHtml(p, cls = "avatar") {
    if (p.photo) {
      return `<img class="${cls}" src="${escapeHtml(p.photo)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${cls}',textContent:'${genderIcon(p)}'}))" />`;
    }
    return `<div class="${cls}">${genderIcon(p)}</div>`;
  }

  /* ---------- Kişi kartı ---------- */
  function personCard(p) {
    const gcls = p.gender === "male" ? "male" : p.gender === "female" ? "female" : "";
    const span = lifeSpan(p);
    return `<div class="card ${gcls}" data-id="${p.id}" onclick="App.showDetail('${p.id}')">
      ${avatarHtml(p)}
      <div class="name">${escapeHtml(fullName(p))}</div>
      ${span ? `<div class="dates">${escapeHtml(span)}</div>` : ""}
      ${p.living === "no" && !p.deathDate ? `<div class="deceased">✝ vefat etti</div>` : ""}
    </div>`;
  }

  /* ---------- Ağaç oluşturma ---------- */
  function renderTree() {
    const canvas = document.getElementById("treeCanvas");
    const empty = document.getElementById("treeEmpty");
    const viewport = document.getElementById("treeViewport");
    if (!state.people.length) {
      canvas.innerHTML = ""; empty.classList.remove("hidden"); viewport.classList.add("hidden");
      return;
    }
    empty.classList.add("hidden"); viewport.classList.remove("hidden");

    let root = byId(state.rootId);
    if (!root) { root = state.people[0]; state.rootId = root.id; }

    const seen = new Set();
    canvas.innerHTML = buildNode(root.id, seen);
    applyZoom();
  }

  // Bir kişiyi ve altındaki çocukları (eşiyle birlikte) çizer.
  function buildNode(id, seen) {
    const p = byId(id);
    if (!p || seen.has(id)) return "";
    seen.add(id);

    // Eş(ler)den ağaçta zaten çizilmemiş olan ilkini partner olarak göster
    let coupleHtml = personCard(p);
    const spouses = (p.spouses || []).map(byId).filter(Boolean);
    const partner = spouses.find((s) => !seen.has(s.id));
    if (partner) {
      seen.add(partner.id);
      coupleHtml = `<div class="couple">${personCard(p)}<div class="couple-link"></div>${personCard(partner)}</div>`;
    }

    // Çocuklar: bu kişinin veya partnerin çocukları
    const kidIds = new Set();
    childrenOf(p.id).forEach((c) => kidIds.add(c.id));
    if (partner) childrenOf(partner.id).forEach((c) => kidIds.add(c.id));

    let childrenHtml = "";
    const kids = [...kidIds].map(byId).filter((c) => c && !seen.has(c.id));
    if (kids.length) {
      childrenHtml = `<div class="tree-children">${kids
        .map((c) => `<div class="tree-subtree">${buildNode(c.id, seen)}</div>`)
        .join("")}</div>`;
    }

    return `<div class="tree-node">${coupleHtml}${childrenHtml}</div>`;
  }

  /* ---------- Zoom ---------- */
  function applyZoom() {
    document.getElementById("treeCanvas").style.transform = `scale(${state.zoom})`;
    document.getElementById("zoomLabel").textContent = Math.round(state.zoom * 100) + "%";
  }
  function zoom(delta) {
    state.zoom = Math.min(2, Math.max(0.3, +(state.zoom + delta).toFixed(2)));
    save(); applyZoom();
  }

  /* ---------- Liste görünümü ---------- */
  function renderList(filter = "") {
    const grid = document.getElementById("personGrid");
    const f = filter.trim().toLowerCase();
    const list = state.people
      .filter((p) => fullName(p).toLowerCase().includes(f))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), "tr"));
    if (!list.length) {
      grid.innerHTML = `<div class="empty"><p>Kişi bulunamadı.</p></div>`;
      return;
    }
    grid.innerHTML = list.map((p) => `<div class="grid-card">${personCard(p)}</div>`).join("");
  }

  /* ---------- İstatistik ---------- */
  function renderStats() {
    const el = document.getElementById("statsContent");
    const ppl = state.people;
    const males = ppl.filter((p) => p.gender === "male").length;
    const females = ppl.filter((p) => p.gender === "female").length;
    const living = ppl.filter((p) => p.living !== "no").length;
    const withPhoto = ppl.filter((p) => p.photo).length;
    const gens = generations();
    const oldest = ppl.filter((p) => p.birthDate).sort((a, b) => a.birthDate.localeCompare(b.birthDate))[0];
    const boxes = [
      ["Toplam kişi", ppl.length],
      ["Erkek", males],
      ["Kadın", females],
      ["Yaşayan", living],
      ["Nesil sayısı", gens],
      ["Fotoğraflı", withPhoto],
    ];
    let html = boxes.map(([l, n]) => `<div class="stat-box"><div class="num">${n}</div><div class="label">${l}</div></div>`).join("");
    if (oldest) html += `<div class="stat-box"><div class="num">${year(oldest.birthDate)}</div><div class="label">En eski doğum: ${escapeHtml(fullName(oldest))}</div></div>`;
    el.innerHTML = html || `<div class="empty"><p>Veri yok.</p></div>`;
  }
  function generations() {
    if (!state.people.length) return 0;
    let max = 0;
    const depth = (id, seen) => {
      if (seen.has(id)) return 0;
      seen.add(id);
      const kids = childrenOf(id);
      let d = 1;
      kids.forEach((k) => { d = Math.max(d, 1 + depth(k.id, seen)); });
      return d;
    };
    state.people.filter((p) => !(p.parents || []).length).forEach((r) => {
      max = Math.max(max, depth(r.id, new Set()));
    });
    return max || 1;
  }

  /* ---------- Kök seçici ---------- */
  function refreshRootSelect() {
    const sel = document.getElementById("rootSelect");
    sel.innerHTML = state.people
      .slice().sort((a, b) => fullName(a).localeCompare(fullName(b), "tr"))
      .map((p) => `<option value="${p.id}" ${p.id === state.rootId ? "selected" : ""}>${escapeHtml(fullName(p))}</option>`)
      .join("");
  }

  /* ---------- Kişi formu ---------- */
  function fillRelationSelects(excludeId) {
    const parents = document.getElementById("parentsSelect");
    const spouses = document.getElementById("spousesSelect");
    const opts = state.people
      .filter((p) => p.id !== excludeId)
      .sort((a, b) => fullName(a).localeCompare(fullName(b), "tr"))
      .map((p) => `<option value="${p.id}">${escapeHtml(fullName(p))}</option>`)
      .join("");
    parents.innerHTML = opts;
    spouses.innerHTML = opts;
  }

  function openPersonForm(id) {
    const modal = document.getElementById("personModal");
    const form = document.getElementById("personForm");
    form.reset();
    fillRelationSelects(id);
    const title = document.getElementById("personModalTitle");
    const delBtn = document.getElementById("deletePersonBtn");

    if (id) {
      const p = byId(id);
      title.textContent = "Kişiyi düzenle";
      document.getElementById("personId").value = p.id;
      document.getElementById("firstName").value = p.firstName || "";
      document.getElementById("lastName").value = p.lastName || "";
      document.getElementById("gender").value = p.gender || "";
      document.getElementById("living").value = p.living || "yes";
      document.getElementById("birthDate").value = p.birthDate || "";
      document.getElementById("deathDate").value = p.deathDate || "";
      document.getElementById("birthPlace").value = p.birthPlace || "";
      document.getElementById("photo").value = p.photo || "";
      document.getElementById("notes").value = p.notes || "";
      setMulti("parentsSelect", p.parents || []);
      setMulti("spousesSelect", p.spouses || []);
      delBtn.classList.remove("hidden");
    } else {
      title.textContent = "Kişi ekle";
      document.getElementById("personId").value = "";
      delBtn.classList.add("hidden");
    }
    modal.classList.remove("hidden");
    document.getElementById("firstName").focus();
  }

  function setMulti(selId, values) {
    const sel = document.getElementById(selId);
    [...sel.options].forEach((o) => { o.selected = values.includes(o.value); });
  }
  function getMulti(selId) {
    return [...document.getElementById(selId).selectedOptions].map((o) => o.value);
  }

  function submitPerson(e) {
    e.preventDefault();
    const id = document.getElementById("personId").value || uid();
    const existing = byId(id);
    const person = {
      id,
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      gender: document.getElementById("gender").value,
      living: document.getElementById("living").value,
      birthDate: document.getElementById("birthDate").value,
      deathDate: document.getElementById("deathDate").value,
      birthPlace: document.getElementById("birthPlace").value.trim(),
      photo: document.getElementById("photo").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      parents: getMulti("parentsSelect"),
      spouses: getMulti("spousesSelect"),
    };
    if (existing) Object.assign(existing, person);
    else state.people.push(person);

    // Eş ilişkisini çift yönlü tut
    syncSpouses(person);
    if (!state.rootId) state.rootId = person.id;
    save();
    closeModals();
    renderAll();
  }

  function syncSpouses(person) {
    state.people.forEach((p) => {
      if (!p.spouses) p.spouses = [];
      const shouldLink = person.spouses.includes(p.id);
      const linked = p.spouses.includes(person.id);
      if (shouldLink && !linked) p.spouses.push(person.id);
      if (!shouldLink && linked && p.id !== person.id) p.spouses = p.spouses.filter((x) => x !== person.id);
    });
  }

  function deletePerson(id) {
    if (!confirm("Bu kişiyi silmek istediğinize emin misiniz?")) return;
    state.people = state.people.filter((p) => p.id !== id);
    // İlişkilerden temizle
    state.people.forEach((p) => {
      p.parents = (p.parents || []).filter((x) => x !== id);
      p.spouses = (p.spouses || []).filter((x) => x !== id);
    });
    if (state.rootId === id) state.rootId = state.people[0] ? state.people[0].id : null;
    save();
    closeModals();
    renderAll();
  }

  /* ---------- Detay görünümü ---------- */
  function showDetail(id) {
    const p = byId(id);
    if (!p) return;
    const parents = (p.parents || []).map(byId).filter(Boolean);
    const spouses = (p.spouses || []).map(byId).filter(Boolean);
    const kids = childrenOf(id);
    const siblings = state.people.filter((s) =>
      s.id !== id && (s.parents || []).some((pa) => (p.parents || []).includes(pa)));

    const chips = (arr) => arr.length
      ? `<div class="relation-chips">${arr.map((r) => `<span class="chip" onclick="App.showDetail('${r.id}')">${escapeHtml(fullName(r))}</span>`).join("")}</div>`
      : `<div class="detail-note" style="color:var(--neutral)">—</div>`;

    const meta = [];
    if (lifeSpan(p)) meta.push(lifeSpan(p));
    if (p.birthPlace) meta.push("📍 " + escapeHtml(p.birthPlace));

    document.getElementById("detailCard").innerHTML = `
      <div class="detail-head">
        ${avatarHtml(p)}
        <div>
          <h2>${escapeHtml(fullName(p))}</h2>
          <div class="sub">${meta.join(" · ")}</div>
        </div>
        <button class="modal-close" data-close style="margin-left:auto">×</button>
      </div>
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
    document.getElementById("detailModal").classList.remove("hidden");
  }

  function addChildTo(parentId) {
    closeModals();
    openPersonForm();
    setMulti("parentsSelect", [parentId]);
  }

  function setRoot(id) {
    state.rootId = id; save();
    closeModals();
    switchView("tree");
    renderAll();
  }

  /* ---------- Görünüm değiştirme ---------- */
  function switchView(name) {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    if (name === "list") renderList(document.getElementById("searchInput").value);
    if (name === "stats") renderStats();
    if (name === "tree") renderTree();
  }

  function closeModals() {
    document.querySelectorAll(".modal").forEach((m) => m.classList.add("hidden"));
  }

  function renderAll() {
    refreshRootSelect();
    const active = document.querySelector(".view.active");
    if (active && active.id === "view-list") renderList(document.getElementById("searchInput").value);
    else if (active && active.id === "view-stats") renderStats();
    else renderTree();
  }

  /* ---------- İçe / Dışa aktar ---------- */
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "soyagacim.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.people)) throw new Error("Geçersiz dosya");
        state = Object.assign({ people: [], rootId: null, zoom: 1 }, data);
        save(); renderAll();
        alert("İçe aktarma tamamlandı: " + state.people.length + " kişi.");
      } catch (e) { alert("Dosya okunamadı: " + e.message); }
    };
    reader.readAsText(file);
  }
  function clearAll() {
    if (!confirm("TÜM kişiler silinecek. Emin misiniz?")) return;
    state = { people: [], rootId: null, zoom: 1 };
    save(); renderAll();
  }

  /* ---------- Örnek aile ---------- */
  function loadSample() {
    const p = (firstName, lastName, gender, birthDate, extra = {}) =>
      Object.assign({ id: uid(), firstName, lastName, gender, birthDate, living: "yes", parents: [], spouses: [] }, extra);

    const dede = p("Ahmet", "Yılmaz", "male", "1940-03-12", { living: "no", deathDate: "2015-08-01", birthPlace: "Sivas" });
    const nine = p("Fatma", "Yılmaz", "female", "1945-06-20", { living: "no", deathDate: "2018-11-10", birthPlace: "Sivas" });
    dede.spouses = [nine.id]; nine.spouses = [dede.id];

    const baba = p("Mehmet", "Yılmaz", "male", "1968-01-15", { parents: [dede.id, nine.id], birthPlace: "Ankara" });
    const anne = p("Ayşe", "Yılmaz", "female", "1971-09-05", { birthPlace: "İstanbul" });
    baba.spouses = [anne.id]; anne.spouses = [baba.id];

    const hala = p("Zeynep", "Demir", "female", "1972-04-25", { parents: [dede.id, nine.id] });

    const cocuk1 = p("Elif", "Yılmaz", "female", "1998-07-30", { parents: [baba.id, anne.id] });
    const cocuk2 = p("Can", "Yılmaz", "male", "2001-12-11", { parents: [baba.id, anne.id] });

    state = {
      people: [dede, nine, baba, anne, hala, cocuk1, cocuk2],
      rootId: dede.id,
      zoom: 1,
    };
    save(); renderAll();
    switchView("tree");
  }

  /* ---------- Olaylar ---------- */
  function bind() {
    document.querySelectorAll(".nav-btn").forEach((b) =>
      b.addEventListener("click", () => switchView(b.dataset.view)));

    document.getElementById("addPersonBtn").addEventListener("click", () => openPersonForm());
    document.getElementById("personForm").addEventListener("submit", submitPerson);
    document.getElementById("deletePersonBtn").addEventListener("click", () => {
      const id = document.getElementById("personId").value;
      if (id) deletePerson(id);
    });

    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-close], .modal-backdrop")) closeModals();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

    document.getElementById("searchInput").addEventListener("input", (e) => {
      switchView("list");
      renderList(e.target.value);
    });

    document.getElementById("rootSelect").addEventListener("change", (e) => {
      state.rootId = e.target.value; save(); renderTree();
    });

    document.getElementById("zoomIn").addEventListener("click", () => zoom(0.1));
    document.getElementById("zoomOut").addEventListener("click", () => zoom(-0.1));
    document.getElementById("zoomReset").addEventListener("click", () => { state.zoom = 1; save(); applyZoom(); });

    // Menü
    const menuBtn = document.getElementById("menuBtn");
    const dropdown = document.getElementById("menuDropdown");
    menuBtn.addEventListener("click", (e) => { e.stopPropagation(); dropdown.classList.toggle("hidden"); });
    document.addEventListener("click", () => dropdown.classList.add("hidden"));
    dropdown.addEventListener("click", (e) => e.stopPropagation());

    document.getElementById("exportBtn").addEventListener("click", exportData);
    document.getElementById("sampleBtn").addEventListener("click", loadSample);
    document.getElementById("clearBtn").addEventListener("click", clearAll);
    document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
    document.getElementById("importFile").addEventListener("change", (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = "";
    });
  }

  /* ---------- Başlat ---------- */
  function init() {
    load();
    bind();
    renderAll();
  }

  return {
    init, openPersonForm, showDetail, setRoot, addChildTo, loadSample,
    deletePerson,
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
