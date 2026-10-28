import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { api } from "./api.js";
import "./styles.css";

/* =========================================================
   UTILITIES & HELPERS
   ========================================================= */
const BLN = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
const fmtDate = (iso) => {
  if (!iso) return "-";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) {
    return `${+m[3]} ${BLN[+m[2] - 1]} ${m[1]}`;
  }
  return iso;
};

const clamp = (v) => Math.max(0, Math.min(100, Math.round((+v || 0) * 10) / 10));

/* Format Live Clock */
const formatClock = (date) => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  
  return {
    dateStr: `${dayName}, ${day} ${monthName} ${year}`,
    timeStr: `${hh}:${mm}:${ss} WIB`
  };
};

/* =========================================================
   SVG ICONS
   ========================================================= */
const Icons = {
  Ship: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 6"/>
      <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
      <path d="M12 10v4"/>
      <path d="M12 2v3"/>
    </svg>
  ),
  Chart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Drawing: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 22 1-1h3l9-9"/>
      <path d="M3 21v-3l9-9"/>
      <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9"/>
      <path d="m14.5 6.5 3 3"/>
    </svg>
  ),
  Clipboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="m9 14 2 2 4-4"/>
    </svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Pause: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>
  ),
  Prev: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Next: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Maximize: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    </svg>
  ),
  Minimize: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Alert: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Grid: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  List: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  TrendDown: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
};

/* =========================================================
   CUSTOM HOOK: API
   ========================================================= */
function useApi() {
  const [loaded, setLoaded] = useState(false);
  const [ok, setOk] = useState(false);
  const [projects, setProjects] = useState(null);
  const [draw, setDraw] = useState(null);
  const [hps, setHps] = useState(null);
  const [recap, setRecap] = useState(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const st = await api.state();
      if (!alive.current) return;
      setProjects(st.projects);
      setDraw(st.drawings);
      setHps(st.hps);
      setRecap(st.recap || null);
      setLastUpdate(st.last_update || "");
      setOk(true);
    } catch (e) {
      if (alive.current) setOk(false);
    } finally {
      if (alive.current) setLoaded(true);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    refresh();
    const t = setInterval(refresh, 5000);
    return () => {
      alive.current = false;
      clearInterval(t);
    };
  }, [refresh]);

  return { loaded, ok, projects, draw, hps, recap, lastUpdate, refresh };
}

/* =========================================================
   GENERIC MODAL COMPONENT
   ========================================================= */
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup modal">
            <Icons.Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN PROJECT FORM
   ========================================================= */
function ProjectForm({ item, onSave, onClose }) {
  const [n, setN] = useState(item ? item.n : "");
  const [k, setK] = useState(item ? item.k || "" : "");
  const [p, setP] = useState(item ? item.p : 0);
  const [r, setR] = useState(item ? item.r : 0);
  const [shipImg, setShipImg] = useState(item ? item.shipImg : "");
  const [shipPreview, setShipPreview] = useState(item && item.shipImg ? item.shipImg : "");

  const submit = (e) => {
    e.preventDefault();
    if (!n.trim()) return;
    onSave({ n: n.trim(), k: k.trim(), p: clamp(p), r: clamp(r), shipImg });
  };

  return (
    <Modal title={item ? "Ubah Data Proyek" : "Tambah Proyek Baru"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group">
          <label htmlFor="fn">Nama Proyek</label>
          <input id="fn" value={n} onChange={(e) => setN(e.target.value)} required autoFocus placeholder="Contoh: LPD UAE" />
        </div>
        <div className="form-group">
          <label htmlFor="fk">Kapal / Tipe / Kategori</label>
          <input id="fk" value={k} onChange={(e) => setK(e.target.value)} placeholder="Contoh: Landing Platform Dock" />
        </div>
        <div className="form-group">
          <label htmlFor="fship">Gambar Kapal (PNG transparan — opsional)</label>
          <input
            id="fship"
            type="file"
            accept="image/png,.png"
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              if (file.type !== "image/png" && !/\.png$/i.test(file.name)) {
                e.target.value = "";
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const value = String(reader.result || "");
                setShipImg(value);
                setShipPreview(value);
              };
              reader.readAsDataURL(file);
            }}
          />
          <small style={{ display: "block", marginTop: 6, color: "var(--text-muted)" }}>
            Pilih file PNG transparan. Kosongkan jika ingin memakai ikon kapal default.
          </small> 
          {shipImg && (
            <button type="button" className="btn" style={{ marginTop: 8 }} onClick={() => { setShipImg(""); setShipPreview(""); }}>
              Hapus gambar
            </button>
          )}
          {shipPreview && (
            <img src={shipPreview} alt="Preview kapal" style={{ width: 48, height: 48, objectFit: "contain", marginTop: 8, borderRadius: 8, border: "1px solid var(--border)" }} />
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="form-group">
            <label htmlFor="fp">Plan Progress (%)</label>
            <input id="fp" type="number" min="0" max="100" step="0.1" value={p} onChange={(e) => setP(e.target.value.replace(',', '.'))} />
          </div>
          <div className="form-group">
            <label htmlFor="fr">Realisasi Progress (%)</label>
            <input id="fr" type="number" min="0" max="100" step="0.1" value={r} onChange={(e) => setR(e.target.value.replace(',', '.'))} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>Batal</button>
          <button className="btn primary" type="submit">Simpan Proyek</button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================
   UPLOAD BUTTON (ADMIN)
   ========================================================= */
function UploadButton({ onFile, busy }) {
  const ref = useRef(null);
  return (
    <>
      <button className="btn primary" disabled={busy} onClick={() => ref.current.click()}>
        <Icons.Drawing />
        {busy ? "Menyimpan…" : "Unggah drawing_data.json"}
      </button>
      <input
        ref={ref}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
    </>
  );
}

/* =========================================================
   TAB 1: PROGRES PROYEK (MODERN & INTERAKTIF)
   ========================================================= */
function ProjectsView({ list, admin, ok, refresh, say, drawingsData, recap, onSelectProjectFilter, isKiosk = false }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'ahead' | 'behind' | 'ontrack'
  const [sortBy, setSortBy] = useState("default"); // 'default' | 'name' | 'gap-desc' | 'gap-asc' | 'real-desc'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [gridCols, setGridCols] = useState("3"); // '3' | '4' | 'auto'
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);

  const fail = (e) => say("Gagal menyimpan: " + (e && e.message ? e.message : "database menolak perubahan"), false);

  const saveForm = async (data) => {
    const item = form.item;
    setForm(null);
    try {
      if (item) await api.updateProject(item.id, data);
      else await api.addProject(data);
      say("Data proyek berhasil diperbarui.");
    } catch (e) {
      fail(e);
    }
    refresh();
  };

  const doDelete = async () => {
    const id = del.id;
    setDel(null);
    try {
      await api.deleteProject(id);
      say("Proyek berhasil dihapus.");
    } catch (e) {
      fail(e);
    }
    refresh();
  };

  const items = list || [];

  // KPI Calculations
  const totalProjects = items.length;
  const aheadCount = items.filter((x) => x.r > x.p).length;
  const behindCount = items.filter((x) => x.r < x.p).length;
  const onTrackCount = items.filter((x) => x.r === x.p).length;
  const avgPlan = totalProjects ? (items.reduce((s, x) => s + x.p, 0) / totalProjects).toFixed(1) : 0;
  const avgReal = totalProjects ? (items.reduce((s, x) => s + x.r, 0) / totalProjects).toFixed(1) : 0;

  // Filter & Search
  const filtered = useMemo(() => {
    return items.filter((x) => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || x.n.toLowerCase().includes(q) || (x.k && x.k.toLowerCase().includes(q));
      if (!matchSearch) return false;

      if (filterStatus === "ahead") return x.r > x.p;
      if (filterStatus === "behind") return x.r < x.p;
      if (filterStatus === "ontrack") return x.r === x.p;
      return true;
    }).sort((a, b) => {
      if (sortBy === "name") return a.n.localeCompare(b.n);
      if (sortBy === "gap-desc") return (b.r - b.p) - (a.r - a.p);
      if (sortBy === "gap-asc") return (a.r - a.p) - (b.r - b.p);
      if (sortBy === "real-desc") return b.r - a.r;
      return 0; // default order
    });
  }, [items, search, filterStatus, sortBy]);

  // Find related drawings for a project
  const getRelatedDrawings = (projName) => {
    if (!drawingsData || !drawingsData.rows) return [];
    return drawingsData.rows.filter((d) => d.p && d.p.toLowerCase() === projName.toLowerCase());
  };

  return (
    <>
      {isKiosk && (
        <div className="kiosk-head kiosk-head-slide">
          <div>
            <div className="kiosk-title">PROGRES PROYEK</div>
            <div className="kiosk-sub">Progress realisasi seluruh proyek aktif</div>
          </div>
          <div className="kiosk-chips">
            <span className="kiosk-chip page">{totalProjects} Proyek</span>
          </div>
        </div>
      )}

      {/* KPI METRICS BAR (COMPACT & HORIZONTAL FOR ZERO-SCROLL WIDESCREEN) */}
      {!isKiosk && (
      <div className="kpi-container compact-kpi">
        <div
          className={`kpi-card horizontal-card ${filterStatus === "all" ? "active-filter" : ""}`}
          style={{ "--accent-color": "var(--primary-glow)" }}
          onClick={() => setFilterStatus("all")}
          title="Klik untuk tampilkan semua proyek"
        >
          <div className="kpi-horiz-left">
            <span className="kpi-label">Total Proyek</span>
            <div className="kpi-subtext">Avg Real {avgReal}% vs {avgPlan}%</div>
          </div>
          <div className="kpi-horiz-right">
            <div className="kpi-value">{totalProjects}</div>
            <div className="kpi-icon"><Icons.Ship /></div>
          </div>
        </div>

        <div
          className={`kpi-card horizontal-card ${filterStatus === "ahead" ? "active-filter" : ""}`}
          style={{ "--accent-color": "var(--success-glow)" }}
          onClick={() => setFilterStatus(filterStatus === "ahead" ? "all" : "ahead")}
          title="Klik untuk menyaring proyek di depan plan"
        >
          <div className="kpi-horiz-left">
            <span className="kpi-label">Di Depan Plan</span>
            <div className="kpi-subtext">Melebihi target</div>
          </div>
          <div className="kpi-horiz-right">
            <div className="kpi-value" style={{ color: "var(--success-glow)" }}>
              {aheadCount}
              <span style={{ fontSize: "11px", fontWeight: "normal", color: "var(--text-muted)" }}>
                ({totalProjects ? Math.round((aheadCount / totalProjects) * 100) : 0}%)
              </span>
            </div>
            <div className="kpi-icon" style={{ color: "var(--success-glow)" }}><Icons.TrendUp /></div>
          </div>
        </div>

        <div
          className={`kpi-card horizontal-card ${filterStatus === "ontrack" ? "active-filter" : ""}`}
          style={{ "--accent-color": "var(--primary-glow)" }}
          onClick={() => setFilterStatus(filterStatus === "ontrack" ? "all" : "ontrack")}
          title="Klik untuk menyaring proyek tepat waktu"
        >
          <div className="kpi-horiz-left">
            <span className="kpi-label">Sesuai Plan</span>
            <div className="kpi-subtext">Tepat jadwal</div>
          </div>
          <div className="kpi-horiz-right">
            <div className="kpi-value" style={{ color: "var(--primary-glow)" }}>
              {onTrackCount}
            </div>
            <div className="kpi-icon" style={{ color: "var(--primary-glow)" }}><Icons.Check /></div>
          </div>
        </div>

        <div
          className={`kpi-card horizontal-card ${filterStatus === "behind" ? "active-filter" : ""}`}
          style={{ "--accent-color": "var(--danger-glow)" }}
          onClick={() => setFilterStatus(filterStatus === "behind" ? "all" : "behind")}
          title="Klik untuk menyaring proyek yang tertunda/terlambat"
        >
          <div className="kpi-horiz-left">
            <span className="kpi-label">Di Belakang Plan</span>
            <div className="kpi-subtext">Perlu akselerasi</div>
          </div>
          <div className="kpi-horiz-right">
            <div className="kpi-value" style={{ color: "var(--danger-glow)" }}>
              {behindCount}
              <span style={{ fontSize: "11px", fontWeight: "normal", color: "var(--text-muted)" }}>
                ({totalProjects ? Math.round((behindCount / totalProjects) * 100) : 0}%)
              </span>
            </div>
            <div className="kpi-icon" style={{ color: "var(--danger-glow)" }}><Icons.TrendDown /></div>
          </div>
        </div>
      </div>
      )}

      {/* INTERACTIVE TOOLBAR (disembunyikan saat mode kiosk) */}
      {!isKiosk && (
      <div className="view-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon"><Icons.Search /></span>
            <input
              className="search-input"
              type="text"
              placeholder="Cari nama proyek atau kapal…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter status proyek"
          >
            <option value="all">Semua Status ({totalProjects})</option>
            <option value="ahead">Di Depan Plan ({aheadCount})</option>
            <option value="ontrack">Sesuai Plan ({onTrackCount})</option>
            <option value="behind">Di Belakang Plan ({behindCount})</option>
          </select>

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Urutkan proyek"
          >
            <option value="default">Urutan Standar</option>
            <option value="name">Nama Proyek (A - Z)</option>
            <option value="gap-desc">Selisih Tertinggi (+)</option>
            <option value="gap-asc">Selisih Terendah (-)</option>
            <option value="real-desc">Realisasi Tertinggi</option>
          </select>

          {viewMode === "grid" && (
            <select
              className="filter-select"
              value={gridCols}
              onChange={(e) => setGridCols(e.target.value)}
              aria-label="Format Kolom Grid"
              title="Atur jumlah kolom kartu proyek"
            >
              <option value="3">3 Kolom</option>
              <option value="4">4 Kolom (Lebar)</option>
              <option value="5">5 Kolom (Sangat Lebar)</option>
              <option value="auto">Auto Responsif</option>
            </select>
          )}
        </div>

        <div className="toolbar-right">
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Tampilan Grid Kartu"
            >
              <Icons.Grid />
            </button>
            <button
              className={`view-mode-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Tampilan Tabel Matriks"
            >
              <Icons.List />
            </button>
          </div>

          {admin && ok && (
            <button className="btn primary" onClick={() => setForm({ item: null })} style={{ display: isKiosk ? "none" : "" }}>
              + Tambah Proyek
            </button>
          )}
        </div>
      </div>
      )}

      {/* CONTENT: GRID CARDS OR TABLE */}
      {list === null ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          Memuat data proyek…
        </div>
      ) : !filtered.length ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "16px", color: "var(--text-muted)" }}>
            {search || filterStatus !== "all" ? "Tidak ada proyek yang cocok dengan filter pencarian." : "Belum ada data proyek."}
          </p>
          {(search || filterStatus !== "all") && (
            <button className="btn" style={{ marginTop: "12px" }} onClick={() => { setSearch(""); setFilterStatus("all"); }}>
              Reset Filter
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className={`project-grid grid-cols-${gridCols}`} data-cols={gridCols}>
          {filtered.map((item) => {
            const gap = +(item.r - item.p).toFixed(1);
            const isAhead = gap > 0;
            const isBehind = gap < 0;
            const statusKey = isAhead ? "ahead" : isBehind ? "behind" : "ontrack";
            const relDrawings = getRelatedDrawings(item.n);
            const ipDrawings = relDrawings.filter((d) => d.s === "IP").length;
            const totalDwg = relDrawings.length;
            // Nilai dari sheet "Rekap" (Total Release / In Process). Jika tersedia, pakai itu.
            const recapAliases = {
              "LPD UAE": "LPD UAE 163 M",
              "FRIGATE 140 M": "FRIGATE MERAH PUTIH 140 M",
              "LD PN 124 M": "LD PHILLIPINE NAVY 124 M",
              "LCU LD PN 124 M": "LCU LD PHILLIPINE 124 M",
            };
            const recapKey = item.n?.toUpperCase?.() || "";
            const normalizeRecapKey = (value) => String(value || "")
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "");
            const recapData = Object.entries(recap || {}).reduce((found, [key, value]) => {
              if (found.release !== undefined || found.in_process !== undefined) return found;
              const normalizedKey = normalizeRecapKey(key);
              const normalizedItem = normalizeRecapKey(recapAliases[recapKey] || recapKey);
              return normalizedKey === normalizedItem ||
                normalizedKey.startsWith(normalizedItem) || normalizedItem.startsWith(normalizedKey)
                ? value : found;
            }, {});
            const recRelease = recapData.release ?? null;
            const recInProcess = recapData.in_process ?? null;
            const showRelease = recRelease !== null ? recRelease ?? "0" : (totalDwg || "0");
            const showInProcess = recInProcess !== null ? recInProcess ?? "0" : (ipDrawings || "0");

            return (
              <div
                className="project-card"
                key={item.id}
                onClick={() => setSelectedDetail({ project: item, related: relDrawings })}
              >
                <div>
                  <div className="project-card-header">
                    {/* Ikon kapal header: selalu gunakan ikon default SVG */}
                    <div className="ship-icon-default">
                      <Icons.Ship />
                    </div>

                    <div className="project-name-wrap">
                      <h3
                        className="project-title"
                        style={{
                          fontSize: "clamp(7px, 1.4vw, 14px)",
                          lineHeight: 1.25,
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflow: "visible",
                          textOverflow: "clip",
                        }}
                        title={item.n}
                      >
                        {item.n}
                      </h3>
                      <div className="project-type">
                        <span>{item.k || "Proyek Konstruksi"}</span>
                      </div>
                    </div>
                    <span className={`status-badge ${statusKey}`}>
                      {isAhead ? (
                        <><Icons.TrendUp /> Ahead</>
                      ) : isBehind ? (
                        <><Icons.Alert /> Delay</>
                      ) : (
                        <><Icons.Check /> On Plan</>
                      )}
                    </span>
                  </div>

                  <div className="progress-bars-container">
                    <div className="progress-row-item">
                      <div className="progress-row-header">
                        <span className="progress-row-label">Plan Target</span>
                        <span className="progress-row-percent">{item.p}%</span>
                      </div>
                      <div className="custom-progress-track">
                        <div className="custom-progress-fill plan" style={{ width: `${item.p}%` }} />
                      </div>
                    </div>

                    <div className="progress-row-item">
                      <div className="progress-row-header">
                        <span className="progress-row-label">Realisasi</span>
                        <span className="progress-row-percent" style={{ color: isBehind ? "var(--danger-glow)" : "var(--success-glow)" }}>
                          {item.r}%
                        </span>
                      </div>
                      <div className="custom-progress-track">
                        <div
                          className={`custom-progress-fill real ${isBehind ? "behind" : ""}`}
                          style={{ width: `${item.r}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER: Drawing info + vessel icon (matches reference design) */}{" "}
                <div className="project-card-footer">
                  <div className="card-footer-left">
                    {/* Gap selisih pill */}
                    <div className={`gap-pill ${statusKey}`}>
                      {isAhead ? <Icons.TrendUp /> : isBehind ? <Icons.TrendDown /> : <Icons.Check />}
                      <span>{gap > 0 ? `+${gap}` : gap}% {isAhead ? "Ahead" : isBehind ? "Behind" : "On Plan"}</span>
                    </div>
                    {/* Drawing stats: total outstanding + in progress */}
                    <div className="card-dwg-info">
                      <div className="card-dwg-row">
                        <span className="card-dwg-count">{showRelease}</span>
                        <span className="card-dwg-label">Drawing Release</span>
                      </div>
                      <div className="card-dwg-row">
                        <span className={`card-dwg-count ${showInProcess > 0 ? "inprogress" : ""}`}>{showInProcess}</span>
                        <span className="card-dwg-label">In Progress</span>
                      </div>
                    </div>
                  </div>

                  {/* Ship / vessel illustration — right side */}
                  <div className="card-vessel-icon" aria-hidden="true">
                    {item.shipImg ? (
                      <img src={item.shipImg} alt={`Kapal ${item.n}`} className="card-vessel-img" loading="lazy" />
                    ) : (
                    <svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 50 L20 62 L100 62 L114 50 Z" fill="rgba(56,189,248,0.35)" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5"/>
                      <rect x="35" y="33" width="40" height="17" rx="2" fill="rgba(37,99,235,0.45)" stroke="rgba(56,189,248,0.7)" strokeWidth="1.2"/>
                      <rect x="49" y="20" width="22" height="13" rx="2" fill="rgba(56,189,248,0.35)" stroke="rgba(56,189,248,0.55)" strokeWidth="1"/>
                      <line x1="60" y1="20" x2="60" y2="9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3"/>
                      <line x1="53" y1="13" x2="67" y2="13" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
                      <rect x="22" y="45" width="11" height="5" rx="1" fill="rgba(255,255,255,0.12)"/>
                      <rect x="87" y="45" width="13" height="5" rx="1" fill="rgba(255,255,255,0.12)"/>
                      <path d="M100 50 L114 50 L105 58 Z" fill="rgba(56,189,248,0.55)"/>
                      <path d="M5 65 Q30 62 60 65 Q90 68 118 65" stroke="rgba(56,189,248,0.3)" strokeWidth="1.5" fill="none"/>
                    </svg>
                    )}
                  </div>
                </div>

                {admin && ok && (
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px", paddingTop: "8px", borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn" style={{ flex: 1, padding: "4px 8px", fontSize: "11px" }} onClick={() => setForm({ item })}>Ubah</button>
                    <button className="btn danger" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setDel(item)}>Hapus</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-container">
          <div style={{ overflowX: "auto" }}>
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Nama Proyek</th>
                  <th>Kategori / Kapal</th>
                  <th style={{ width: "140px" }}>Plan Progress</th>
                  <th style={{ width: "140px" }}>Realisasi</th>
                  <th>Selisih (Gap)</th>
                  <th>Status</th>
                  <th>Drawing Release</th>
                  <th>In Progress</th>
                  {admin && ok && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const gap = +(item.r - item.p).toFixed(1);
                  const isAhead = gap > 0;
                  const isBehind = gap < 0;
                  const statusKey = isAhead ? "ahead" : isBehind ? "behind" : "ontrack";
                  const relDrawings = getRelatedDrawings(item.n);
                  const ipDrawings = relDrawings.filter((d) => d.s === "IP").length;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDetail({ project: item, related: relDrawings })}
                    >
                      <td style={{ fontWeight: "700", color: "#fff" }}>{item.n}</td>
                      <td style={{ color: "var(--text-muted)" }}>{item.k || "-"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ minWidth: "35px", fontWeight: "600" }}>{item.p}%</span>
                          <div className="custom-progress-track" style={{ flex: 1, height: "6px" }}>
                            <div className="custom-progress-fill plan" style={{ width: `${item.p}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ minWidth: "35px", fontWeight: "600", color: isBehind ? "var(--danger-glow)" : "var(--success-glow)" }}>
                            {item.r}%
                          </span>
                          <div className="custom-progress-track" style={{ flex: 1, height: "6px" }}>
                            <div className={`custom-progress-fill real ${isBehind ? "behind" : ""}`} style={{ width: `${item.r}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`gap-pill ${statusKey}`}>
                          {gap > 0 ? `+${gap}` : gap}%
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${statusKey}`}>
                          {isAhead ? "Ahead" : isBehind ? "Behind" : "On Track"}
                        </span>
                      </td>
                      <td>
                        {relDrawings.length > 0 ? (
                          <span className="biro-badge">{relDrawings.length} drawing</span>
                        ) : (
                          <span style={{ color: "var(--text-dim)" }}>-</span>
                        )}
                      </td>
                      <td>
                        {ipDrawings > 0 ? (
                          <span className="biro-badge" style={{ background: "rgba(250,204,21,0.12)", borderColor: "rgba(250,204,21,0.3)", color: "var(--warning-glow)" }}>
                            {ipDrawings} drawing
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-dim)" }}>-</span>
                        )}
                      </td>
                      {admin && ok && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button className="btn" style={{ padding: "3px 8px", fontSize: "11px" }} onClick={() => setForm({ item })}>Ubah</button>
                            <button className="btn danger" style={{ padding: "3px 8px", fontSize: "11px" }} onClick={() => setDel(item)}>Hapus</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL INTERAKTIF */}
      {selectedDetail && (
        <Modal
          title={`Detail Proyek: ${selectedDetail.project.n}`}
          onClose={() => setSelectedDetail(null)}
        >
          <div className="modal-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="detail-row">
                <span className="detail-label">Kategori / Kapal</span>
                <span className="detail-value">{selectedDetail.project.k || "Standard"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status Evaluasi</span>
                <div>
                  {selectedDetail.project.r > selectedDetail.project.p ? (
                    <span className="status-badge ahead"><Icons.TrendUp /> Di Depan Plan (+{(selectedDetail.project.r - selectedDetail.project.p).toFixed(1)}%)</span>
                  ) : selectedDetail.project.r < selectedDetail.project.p ? (
                    <span className="status-badge behind"><Icons.TrendDown /> Di Belakang Plan ({(selectedDetail.project.r - selectedDetail.project.p).toFixed(1)}%)</span>
                  ) : (
                    <span className="status-badge ontrack"><Icons.Check /> Sesuai Plan</span>
                  )}
                </div>
              </div>
            </div>

            <div className="progress-bars-container" style={{ margin: "10px 0" }}>
              <div className="progress-row-item">
                <div className="progress-row-header">
                  <span className="progress-row-label">Plan Progress</span>
                  <span className="progress-row-percent">{selectedDetail.project.p}%</span>
                </div>
                <div className="custom-progress-track">
                  <div className="custom-progress-fill plan" style={{ width: `${selectedDetail.project.p}%` }} />
                </div>
              </div>
              <div className="progress-row-item">
                <div className="progress-row-header">
                  <span className="progress-row-label">Realisasi Progress</span>
                  <span className="progress-row-percent">{selectedDetail.project.r}%</span>
                </div>
                <div className="custom-progress-track">
                  <div className="custom-progress-fill real" style={{ width: `${selectedDetail.project.r}%` }} />
                </div>
              </div>
            </div>

            {/* RELATED DRAWINGS SECTION */}
            <div style={{ marginTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span className="detail-label">
                  Outstanding Drawing Terkait ({selectedDetail.related.length})
                </span>
                {selectedDetail.related.length > 0 && onSelectProjectFilter && (
                  <button
                    className="btn"
                    style={{ fontSize: "11px", padding: "3px 8px" }}
                    onClick={() => {
                      onSelectProjectFilter(selectedDetail.project.n);
                      setSelectedDetail(null);
                    }}
                  >
                    Buka di Tab Drawing →
                  </button>
                )}
              </div>

              {!selectedDetail.related.length ? (
                <div style={{ padding: "14px", background: "rgba(15,23,42,0.5)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "13px" }}>
                  Tidak ada drawing outstanding untuk proyek ini.
                </div>
              ) : (
                <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                  <table className="custom-data-table" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>No DWG</th>
                        <th>Nama Drawing</th>
                        <th>Biro</th>
                        <th>Plan Finish</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.related.map((d, i) => (
                        <tr key={i}>
                          <td><span className="code-badge">{d.no}</span></td>
                          <td style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={d.nm}>
                            {d.nm}
                          </td>
                          <td><span className="biro-badge">{d.biro}</span></td>
                          <td>{fmtDate(d.fin)}</td>
                          <td>
                            <span className={`status-badge ${d.s === "OD" ? "behind" : "warning"}`}>
                              {d.s === "OD" ? "Overdue" : "In Progress"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn primary" onClick={() => setSelectedDetail(null)}>Tutup</button>
          </div>
        </Modal>
      )}

      {/* ADMIN ADD/EDIT FORM */}
      {form && <ProjectForm item={form.item} onSave={saveForm} onClose={() => setForm(null)} />}

      {/* ADMIN DELETE CONFIRMATION */}
      {del && (
        <Modal title="Konfirmasi Hapus Proyek" onClose={() => setDel(null)}>
          <div className="modal-body">
            <p>Apakah Anda yakin ingin menghapus proyek <b>{del.n}</b>?</p>
            <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>Tindakan ini akan menghapus data proyek ini dari server.</p>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setDel(null)}>Batal</button>
            <button className="btn danger" onClick={doDelete}>Hapus Sekarang</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* =========================================================
   TAB 2: OUTSTANDING DRAWING (MODERN & INTERAKTIF)
   ========================================================= */
function DrawView({ data, admin, upload, busy, externalProjectFilter, isKiosk = false, kioskRows = [], kioskPage = 1, kioskPageCount = 1, kioskWeeks = {}, kioskProjectGroups = {}, kioskProjectList = [], expandedProject = null, setExpandedProject }) {
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState(externalProjectFilter || "");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'OD' | 'IP'
  const [filterBiro, setFilterBiro] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedDrawing, setSelectedDrawing] = useState(null);

  useEffect(() => {
    if (externalProjectFilter) {
      setFilterProject(externalProjectFilter);
    }
  }, [externalProjectFilter]);

  // Menu Outstanding Drawing hanya menampilkan drawing yang belum selesai
  // (Overdue / In Progress). Drawing berstatus REL (Finish / released) hanya
  // dipakai untuk kartu "Drawing Release" di menu Progres Proyek.
  const rows = data ? (data.rows || []).filter((d) => d.s !== "REL") : [];
  const errs = data && data.errors ? data.errors : [];

  // Metadata Extraction for Filters
  const projects = useMemo(() => [...new Set(rows.map((d) => d.p))].filter(Boolean).sort(), [rows]);
  const biros = useMemo(() => [...new Set(rows.map((d) => d.biro))].filter(Boolean).sort(), [rows]);

  // KPI Metrics
  const totalDrawings = rows.length;
  const overdueCount = rows.filter((d) => d.s === "OD").length;
  const inProgressCount = rows.filter((d) => d.s === "IP").length;
  const impactedProjects = new Set(rows.map((d) => d.p)).size;

  // Filter & Search Logic
  const filtered = useMemo(() => {
    return rows.filter((d) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (d.no && d.no.toLowerCase().includes(q)) ||
        (d.nm && d.nm.toLowerCase().includes(q)) ||
        (d.p && d.p.toLowerCase().includes(q)) ||
        (d.pic && d.pic.toLowerCase().includes(q)) ||
        (d.biro && d.biro.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (filterProject && d.p !== filterProject) return false;
      if (filterStatus !== "all" && d.s !== filterStatus) return false;
      if (filterBiro !== "all" && d.biro !== filterBiro) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "date-asc") return (a.fin || "").localeCompare(b.fin || "");
      if (sortBy === "date-desc") return (b.fin || "").localeCompare(a.fin || "");
      if (sortBy === "no-asc") return (a.no || "").localeCompare(b.no || "");
      if (sortBy === "name-asc") return (a.nm || "").localeCompare(b.nm || "");
      if (sortBy === "pic-asc") return (a.pic || "").localeCompare(b.pic || "");
      return 0;
    });
  }, [rows, search, filterProject, filterStatus, filterBiro, sortBy]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [search, filterProject, filterStatus, filterBiro, sortBy]);

  // Pagination Slice
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    if (pageSize === 9999) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <>
      {/* KPI METRICS BAR */}
      {!isKiosk && (
      <div className="kpi-container">
        <div
          className={`kpi-card ${filterStatus === "all" && !filterProject && !filterBiro ? "active-filter" : ""}`}
          style={{ "--accent-color": "var(--primary-glow)" }}
          onClick={() => { setFilterStatus("all"); setFilterProject(""); setFilterBiro("all"); setSearch(""); }}
          title="Klik untuk tampilkan semua"
        >
          <div className="kpi-header">
            <span className="kpi-label">Total Outstanding</span>
            <div className="kpi-icon"><Icons.Drawing /></div>
          </div>
          <div className="kpi-value">{totalDrawings}</div>
          <div className="kpi-subtext">{impactedProjects} Proyek Terkait</div>
        </div>

        <div
          className={`kpi-card ${filterStatus === "OD" ? "active-filter" : ""}`}
          style={{ "--accent-color": "var(--danger-glow)" }}
          onClick={() => setFilterStatus(filterStatus === "OD" ? "all" : "OD")}
          title="Klik untuk menyaring Overdue"
        >
          <div className="kpi-header">
            <span className="kpi-label">Overdue</span>
            <div className="kpi-icon" style={{ color: "var(--danger-glow)" }}><Icons.Alert /></div>
          </div>
          <div className="kpi-value" style={{ color: "var(--danger-glow)" }}>
            {overdueCount}
          </div>
          <div className="kpi-subtext">Drawing melewati tanggal target penyelesaian</div>
        </div>

        <div
          className={`kpi-card ${filterStatus === "IP" ? "active-filter" : ""}`}
          style={{ "--accent-color": "var(--warning)" }}
          onClick={() => setFilterStatus(filterStatus === "IP" ? "all" : "IP")}
          title="Klik untuk menyaring In Progress"
        >
          <div className="kpi-header">
            <span className="kpi-label">In Progress</span>
            <div className="kpi-icon" style={{ color: "var(--warning)" }}><Icons.Calendar /></div>
          </div>
          <div className="kpi-value" style={{ color: "var(--warning)" }}>
            {inProgressCount}
          </div>
          <div className="kpi-subtext">Proses pengerjaan drawing berdasarkan finish plan</div>
        </div>

        <div className="kpi-card" style={{ "--accent-color": "var(--cyan-accent)" }}>
          <div className="kpi-header">
            <span className="kpi-label">Biro & Engineering</span>
            <div className="kpi-icon"><Icons.User /></div>
          </div>
          <div className="kpi-value">{biros.length}</div>
          <div className="kpi-subtext">Biro perancang aktif</div>
        </div>
      </div>
      )}

      {/* SYNCHRONIZATION WARNING IF ANY */}
      {!isKiosk && errs.length > 0 && (
        <div className="toast error" style={{ position: "static", marginBottom: "16px", display: "block" }}>
          <b>{errs.length} proyek gagal diambil saat sinkronisasi drawing:</b>
          <ul style={{ margin: "6px 0 0 20px" }}>
            {errs.map((e, i) => <li key={i}>{e.p}: {e.error}</li>)}
          </ul>
        </div>
      )}

      {/* KIOSK / AUTOPLAY MODE: tampilan penuh tanpa scroll, data per minggu kerja */}
      {isKiosk && (
        <div className="kiosk-panel">
          {(() => {
            const mon = new Date(`${kioskWeeks.curMon}T00:00:00`);
            const fri = new Date(`${kioskWeeks.curFri}T00:00:00`);
            const per = kioskRowsPerPage();
            const start = (kioskPage - 1) * per;
            const pageRows = kioskRows.slice(start, start + per);
            const odN = kioskRows.filter((d) => d.kioskGroup === "od").length;
            const ipN = kioskRows.filter((d) => d.kioskGroup === "ip").length;
            if (!pageRows.length) {
              return (
                <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "44px", marginBottom: "12px" }}><Icons.Drawing /></div>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>Tidak ada outstanding drawing</div>
                  <div style={{ fontSize: "13px", marginTop: "6px" }}>
                    Minggu {fmtDate(isoDate(mon))} - {fmtDate(isoDate(fri))}
                  </div>
                </div>
              );
            }
            return (
              <>
                <div className="kiosk-head">
                  <div>
                    <div className="kiosk-title">OUTSTANDING DRAWING</div>
                    <div className="kiosk-sub">
                      Overdue: {fmtDate(kioskWeeks.prevMon)} - {fmtDate(kioskWeeks.prevFri)} • In Progress: {fmtDate(kioskWeeks.curMon)} - {fmtDate(kioskWeeks.curFri)}
                    </div>
                  </div>
                  <div className="kiosk-chips">
                    <span className="kiosk-chip od"><Icons.Alert /> Overdue {odN}</span>
                    <span className="kiosk-chip ip"><Icons.Refresh /> In Progress {ipN}</span>
                    <span className="kiosk-chip page">Hal. {kioskPage} / {kioskPageCount}</span>
                  </div>
                </div>
                <div className="kiosk-table-wrap">
                  <table className="custom-data-table kiosk-table">
                    <thead>
                      <tr>
                        <th style={{ width: "60px", minWidth: "60px" }}>No</th>
                        <th style={{ width: "140px" }}>No DWG</th>
                        <th style={{ width: "30%" }}>Nama Drawing</th>
                        <th style={{ width: "11%" }}>Proyek</th>
                        <th style={{ width: "130px" }}>Plan Finish</th>
                        <th style={{ width: "110px" }}>Biro</th>
                        <th style={{ width: "110px" }}>Departemen</th>
                        <th style={{ width: "90px" }}>PIC</th>
                        <th style={{ width: "110px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((d, i) => (
                        <tr key={`${d.no}-${i}`}>
                          <td style={{ color: "var(--text-dim)" }}>{start + i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{d.no}</td>
                          <td>{d.nm || "-"}</td>
                          <td style={{ color: "var(--text-muted)" }}>{d.p}</td>
                          <td>{fmtDate(d.fin)}</td>
                          <td><span className="biro-badge">{d.biro || "-"}</span></td>
                          <td>{d.dept || "-"}</td>
                          <td>{d.pic || "-"}</td>
                          <td>
                            <span className={`status-badge ${d.kioskGroup === "od" ? "behind" : "warning"}`}>
                              {d.kioskGroup === "od" ? "Overdue" : "In Progress"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* INTERACTIVE TOOLBAR (disembunyikan saat mode kiosk) */}
      {!isKiosk && (
      <div className="view-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon"><Icons.Search /></span>
            <input
              className="search-input"
              type="text"
              placeholder="Cari No DWG, nama drawing, PIC, biro…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            aria-label="Filter berdasarkan proyek"
          >
            <option value="">Semua Proyek ({projects.length})</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter berdasarkan status"
          >
            <option value="all">Semua Status</option>
            <option value="OD">Overdue ({overdueCount})</option>
            <option value="IP">In Progress ({inProgressCount})</option>
          </select>

          <select
            className="filter-select"
            value={filterBiro}
            onChange={(e) => setFilterBiro(e.target.value)}
            aria-label="Filter berdasarkan biro"
          >
            <option value="all">Semua Biro ({biros.length})</option>
            {biros.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Urutkan drawing"
          >
            <option value="date-desc">Plan Finish (Terdekat)</option>
            <option value="date-asc">Plan Finish (Terlama)</option>
            <option value="no-asc">No DWG (A - Z)</option>
            <option value="name-asc">Nama Drawing (A - Z)</option>
            <option value="pic-asc">PIC (A - Z)</option>
          </select>
        </div>

        <div className="toolbar-right">
          {admin && <UploadButton onFile={upload} busy={busy} />}
        </div>
      </div>
      )}

      {/* DRAWINGS DATA TABLE (disembunyikan saat mode kiosk) */}
      {isKiosk ? null : !data ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "16px", color: "var(--text-muted)" }}>
             Belum ada data drawing tersimpan.
          </p>
          {admin ? (
            <div style={{ marginTop: "16px" }}>
              <UploadButton onFile={upload} busy={busy} />
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "6px" }}>
              Silakan hubungi admin untuk mengunggah file hasil sinkronisasi drawing.
            </p>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "16px", color: "var(--text-muted)" }}>
            Tidak ada drawing yang cocok dengan kriteria pencarian / filter.
          </p>
          <button
            className="btn"
            style={{ marginTop: "12px" }}
            onClick={() => {
              setSearch("");
              setFilterProject("");
              setFilterStatus("all");
              setFilterBiro("all");
            }}
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="table-container">
          {/* PROJECT ACCORDION - hanya di non-kiosk mode */}
          <div className="kiosk-project-accordion">
            {(() => {
              const groups = {};
              filtered.forEach((d) => {
                const key = d.p || "(tanpa proyek)";
                if (!groups[key]) groups[key] = [];
                groups[key].push(d);
              });
              const projList = Object.keys(groups);
              return projList.map((proyek) => {
                const rows = groups[proyek] || [];
                const odCount = rows.filter((d) => d.s === "OD").length;
                const ipCount = rows.filter((d) => d.s === "IP").length;
                const isOpen = expandedProject === proyek;
                return (
                  <div key={proyek} className="kiosk-project-item">
                    <div
                      className="kiosk-project-header"
                      onClick={() => setExpandedProject(isOpen ? null : proyek)}
                    >
                      <span className="kiosk-chevron">{isOpen ? "▼" : "▶"}</span>
                      <span className="kiosk-project-name">{proyek}</span>
                      <span className="kiosk-project-count">
                        <span className="kiosk-chip od" style={{ marginLeft: "auto" }}><Icons.Alert /> OD {odCount}</span>
                        <span className="kiosk-chip ip"><Icons.Refresh /> IP {ipCount}</span>
                        <span className="kiosk-total">({rows.length})</span>
                      </span>
                    </div>
                    {isOpen && (
                      <div className="kiosk-project-table-wrap">
                        <div style={{ overflowX: "auto" }}>
                          <table className="custom-data-table">
                            <thead>
                              <tr>
                                <th style={{ width: "60px" }}>No DWG</th>
                                <th style={{ width: "30%" }}>Nama Drawing</th>
                                <th style={{ width: "130px" }}>Plan Finish</th>
                                <th style={{ width: "110px" }}>PIC</th>
                                <th style={{ width: "90px" }}>Biro</th>
                                <th style={{ width: "90px" }}>Dept</th>
                                <th style={{ width: "110px" }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((d, i) => {
                                const isOD = d.s === "OD";
                                const picInitial = (d.pic || "P").slice(0, 1).toUpperCase();
                                return (
                                  <tr key={`${d.no}-${proyek}-${i}`} onClick={() => setSelectedDrawing(d)}>
                                    <td><span className="code-badge">{d.no || "-"}</span></td>
                                    <td style={{ maxWidth: "320px" }}>
                                      <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={d.nm}>
                                        {d.nm || "-"}
                                      </div>
                                    </td>
                                    <td>
                                      <span className={`date-pill ${isOD ? "overdue" : ""}`}>
                                        <Icons.Calendar />{fmtDate(d.fin)}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="user-tag">
                                        <div className="avatar-circle">{picInitial}</div>
                                        <span>{d.pic || "-"}</span>
                                      </div>
                                    </td>
                                    <td><span className="biro-badge">{d.biro || "-"}</span></td>
                                    <td>{d.dept || "-"}</td>
                                    <td>
                                      <span className={`status-badge ${isOD ? "behind" : "warning"}`}>
                                        {isOD ? "Overdue" : "In Progress"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="table-footer">
                          <div>
                            Total: {rows.length} drawing
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* DETAIL DRAWING MODAL (disabled di mode kiosk) */}
      {selectedDrawing && (
        <Modal
          title="Detail Outstanding Drawing"
          onClose={() => setSelectedDrawing(null)}
        >
          <div className="modal-body">
            <div className="detail-row">
              <span className="detail-label">No DWG</span>
              <span className="code-badge" style={{ display: "inline-block", width: "fit-content", fontSize: "14px" }}>
                {selectedDrawing.no}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Nama Drawing</span>
              <span className="detail-value" style={{ fontWeight: "600", fontSize: "16px" }}>
                {selectedDrawing.nm}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="detail-row">
                <span className="detail-label">Proyek</span>
                <span className="detail-value">{selectedDrawing.p}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Plan Finish</span>
                <span className="detail-value" style={{ color: selectedDrawing.s === "OD" ? "var(--danger-glow)" : "var(--text-main)" }}>
                  {fmtDate(selectedDrawing.fin)}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="detail-row">
                <span className="detail-label">PIC (Penanggung Jawab)</span>
                <span className="detail-value">{selectedDrawing.pic || "-"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Biro / Departemen</span>
                <span className="detail-value">
                  {selectedDrawing.biro} {selectedDrawing.dept ? `(${selectedDrawing.dept})` : ""}
                </span>
              </div>
            </div>

            <div className="detail-row">
              <span className="detail-label">Status</span>
              <div>
                <span className={`status-badge ${selectedDrawing.s === "OD" ? "behind" : "warning"}`} style={{ fontSize: "13px" }}>
                  {selectedDrawing.s === "OD" ? "Overdue (Melewati batas waktu)" : "In Progress (Dalam proses pengerjaan)"}
                </span>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn primary" onClick={() => setSelectedDrawing(null)}>Tutup</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* =========================================================
   TAB 3: OUTSTANDING HPS (MODERN & INTERAKTIF)
   ========================================================= */
function HpsView({ data, admin, upload, busy }) {
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterPic, setFilterPic] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [selectedHps, setSelectedHps] = useState(null);

  const rows = data ? data.rows || [] : [];
  const projects = useMemo(() => [...new Set(rows.map((r) => r.p))].filter(Boolean), [rows]);
  const pics = useMemo(() => [...new Set(rows.map((r) => r.pic))].filter(Boolean), [rows]);

  // Filter & Search
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (r.nm && r.nm.toLowerCase().includes(q)) ||
        (r.p && r.p.toLowerCase().includes(q)) ||
        (r.pic && r.pic.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (filterProject && r.p !== filterProject) return false;
      if (filterPic && r.pic !== filterPic) return false;

      return true;
    });
  }, [rows, search, filterProject, filterPic]);

  return (
    <>
      {/* KPI METRICS BAR */}
      <div className="kpi-container">
        <div
          className="kpi-card"
          style={{ "--accent-color": "var(--primary-glow)" }}
          onClick={() => { setSearch(""); setFilterProject(""); setFilterPic(""); }}
        >
          <div className="kpi-header">
            <span className="kpi-label">Total Outstanding HPS</span>
            <div className="kpi-icon"><Icons.Clipboard /></div>
          </div>
          <div className="kpi-value">{rows.length}</div>
          <div className="kpi-subtext"> </div>
        </div>

        <div className="kpi-card" style={{ "--accent-color": "var(--primary-glow)" }}>
          <div className="kpi-header">
            <span className="kpi-label">Proyek Terdampak</span>
            <div className="kpi-icon"><Icons.Ship /></div>
          </div>
          <div className="kpi-value">{projects.length}</div>
          <div className="kpi-subtext"> </div>
        </div>

        <div className="kpi-card" style={{ "--accent-color": "var(--warning)" }}>
          <div className="kpi-header">
            <span className="kpi-label">PIC PENGAMPU</span>
            <div className="kpi-icon"><Icons.User /></div>
          </div>
          <div className="kpi-value">{pics.length}</div>
          <div className="kpi-subtext"> </div>
        </div>
      </div>

      {/* INTERACTIVE TOOLBAR */}
      <div className="view-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon"><Icons.Search /></span>
            <input
              className="search-input"
              type="text"
              placeholder="Cari perihal HPS, proyek, atau PIC…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            aria-label="Filter berdasarkan proyek"
          >
            <option value="">Semua Proyek ({projects.length})</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterPic}
            onChange={(e) => setFilterPic(e.target.value)}
            aria-label="Filter berdasarkan PIC"
          >
            <option value="">Semua PIC ({pics.length})</option>
            {pics.map((pic) => (
              <option key={pic} value={pic}>{pic}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Tampilan Kartu"
            >
              <Icons.Grid />
            </button>
            <button
              className={`view-mode-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Tampilan Tabel"
            >
              <Icons.List />
            </button>
          </div>

          {admin && <UploadButton onFile={upload} busy={busy} />}
        </div>
      </div>

      {/* HPS CONTENT */}
      {!data ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "16px", color: "var(--text-muted)" }}>Belum ada data HPS tersimpan.</p>
          {admin && (
            <div style={{ marginTop: "16px" }}>
              <UploadButton onFile={upload} busy={busy} />
            </div>
          )}
        </div>
      ) : !filtered.length ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "16px", color: "var(--text-muted)" }}>Tidak ada data HPS yang cocok dengan filter.</p>
          <button className="btn" style={{ marginTop: "12px" }} onClick={() => { setSearch(""); setFilterProject(""); setFilterPic(""); }}>
            Reset Filter
          </button>
        </div>
      ) : viewMode === "cards" ? (
        <div className="hps-grid">
          {filtered.map((item, i) => (
            <div className="hps-card" key={i} onClick={() => setSelectedHps(item)}>
              <div>
                <div className="hps-card-header">
                  <span className="hps-project-tag">{item.p}</span>
                  <span className="status-badge warning">{item.s || "In Progress"}</span>
                </div>
                <div style={{ marginTop: "14px" }}>
                  <h4 className="hps-subject">{item.nm}</h4>
                </div>
              </div>

              <div className="hps-meta-row">
                <span className="date-pill" style={{ color: "var(--warning)" }}>
                  <Icons.Calendar />
                  Deadline: <b>{item.dl || fmtDate(item.iso)}</b>
                </span>
                <div className="user-tag">
                  <div className="avatar-circle">{(item.pic || "P").slice(0, 1).toUpperCase()}</div>
                  <span>{item.pic || "-"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <div style={{ overflowX: "auto" }}>
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Proyek</th>
                  <th>Perihal HPS</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>PIC</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={i} onClick={() => setSelectedHps(item)}>
                    <td><span className="hps-project-tag">{item.p}</span></td>
                    <td style={{ maxWidth: "420px" }}>
                      <div style={{ fontWeight: "600", color: "#fff" }}>{item.nm}</div>
                    </td>
                    <td>
                      <span className="date-pill" style={{ color: "var(--warning)" }}>
                        <Icons.Calendar />
                        {item.dl || fmtDate(item.iso)}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge warning">{item.s || "In Progress"}</span>
                    </td>
                    <td>
                      <div className="user-tag">
                        <div className="avatar-circle">{(item.pic || "P").slice(0, 1).toUpperCase()}</div>
                        <span>{item.pic || "-"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Total {filtered.length} data HPS berstatus open • Per {data.generated || "-"}</span>
          </div>
        </div>
      )}

      {/* DETAIL HPS MODAL */}
      {selectedHps && (
        <Modal
          title="Detail Outstanding HPS"
          onClose={() => setSelectedHps(null)}
        >
          <div className="modal-body">
            <div className="detail-row">
              <span className="detail-label">Proyek / Kode Anggaran</span>
              <span className="hps-project-tag" style={{ width: "fit-content", fontSize: "14px", padding: "4px 12px" }}>
                {selectedHps.p}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Perihal Pekerjaan</span>
              <span className="detail-value" style={{ fontWeight: "600", fontSize: "16px", lineHeight: "1.5" }}>
                {selectedHps.nm}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="detail-row">
                <span className="detail-label">Target Deadline</span>
                <span className="detail-value" style={{ color: "var(--warning)" }}>
                  {selectedHps.dl || fmtDate(selectedHps.iso)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Penanggung Jawab (PIC)</span>
                <span className="detail-value">{selectedHps.pic || "-"}</span>
              </div>
            </div>

            <div className="detail-row">
              <span className="detail-label">Status Pekerjaan</span>
              <div>
                <span className="status-badge warning" style={{ fontSize: "13px" }}>
                  {selectedHps.s || "In Progress"}
                </span>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn primary" onClick={() => setSelectedHps(null)}>Tutup</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* =========================================================
   MAIN APP COMPONENT
   ========================================================= */

// --- Util minggu kerja untuk mode Kiosk/Slideshow ---
// "Overdue" = Plan Finish sebelum Senin minggu ini (reset tiap Senin).
// "In Progress" = Plan Finish jatuh pada Senin-Jumat minggu ini.
const KIOSK_OD_ROW_H = 26;     // tinggi tiap baris drawing (px) saat dihitung untuk autosize
const KIOSK_OD_HEADER_H = 130; // header KPI + judul tabel (diperkirakan)
const KIOSK_OD_MAX_ROWS = 15;  // batas maksimal baris per halaman saat autoplay

// Jumlah baris per halaman mode kiosk: muat layar, maksimal 15 baris.
function kioskRowsPerPage() {
  const availH = window.innerHeight - KIOSK_OD_HEADER_H;
  return Math.max(4, Math.min(KIOSK_OD_MAX_ROWS, Math.floor(availH / KIOSK_OD_ROW_H)));
}

function getMonday(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Senin = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function isoDate(d) { return d.toISOString().slice(0, 10); }

function App() {
  const be = useApi();
  const [role, setRole] = useState("viewer"); // 'viewer' | 'admin'
  const [tab, setTab] = useState("proyek"); // 'proyek' | 'draw' | 'hps'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [crossFilterProject, setCrossFilterProject] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem("kioskZoom");
    const v = Math.min(2.0, Math.max(0.3, parseFloat(saved) || 1));
    return v;
  });

  // Kiosk / Autoplay State
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [autoplayDuration, setAutoplayDuration] = useState(12); // seconds per slide
  const [autoplayProgress, setAutoplayProgress] = useState(0); // 0 to 100%
  const [odPage, setOdPage] = useState(1);          // halaman Outstanding Drawing di mode kiosk
  const [odPageCount, setOdPageCount] = useState(1); // total halaman yang dihitung dari tinggi layar
  const [expandedProject, setExpandedProject] = useState(null); // proyek yang sedang terbuka di kiosk
  const kioskRowsRef = useRef([]);
  const odPageRef = useRef(1);
  const odPageCountRef = useRef(1);

  const kioskWeeks = useMemo(() => {
    const mondayDate = getMonday(new Date());
    const curMon = isoDate(mondayDate);
    const curFri = isoDate(new Date(mondayDate.getTime() + 5 * 86400000));
    const prevMon = isoDate(new Date(mondayDate.getTime() - 7 * 86400000));
    const prevFri = isoDate(new Date(mondayDate.getTime() - 2 * 86400000));
    return { curMon, curFri, prevMon, prevFri };
  }, []);

  // Data Outstanding Drawing untuk mode Kiosk: reset tiap Senin.
  // - Overdue  : Plan Finish Senin-Jumat MINGGU LALU
  // - In Progress: Plan Finish Senin-Jumat MINGGU INI
  const kioskODRows = useMemo(() => {
    if (!be.draw || !be.draw.rows) return [];
    const { curMon, curFri, prevMon, prevFri } = kioskWeeks;
    return be.draw.rows
      .filter((d) => d.s !== "REL" && d.fin)
      // Hanya dua minggu: overdue minggu lalu dan IP minggu berjalan.
      .filter((d) => (d.fin >= prevMon && d.fin <= prevFri) || (d.fin >= curMon && d.fin <= curFri))
      .map((d) => {
        const isOD = d.fin >= prevMon && d.fin <= prevFri;
        return {
          ...d,
          s: isOD ? "OD" : "IP",
          kioskGroup: isOD ? "od" : "ip",
        };
      })
      .sort((a, b) => (a.fin || "").localeCompare(b.fin || ""));
  }, [be.draw, kioskWeeks]);

  // Kelompokkan kiosk rows per proyek, urutkan OD dulu lalu IP
  const kioskProjectGroups = useMemo(() => {
    const groups = {};
    kioskODRows.forEach((d) => {
      const key = d.p || "(tanpa proyek)";
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    // Sorting: overdue first within each group
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => {
        const ga = a.kioskGroup === "od" ? 0 : 1;
        const gb = b.kioskGroup === "od" ? 0 : 1;
        if (ga !== gb) return ga - gb;
        return (a.fin || "").localeCompare(b.fin || "");
      });
    });
    return groups;
  }, [kioskODRows]);

  const kioskProjectList = useMemo(() => Object.keys(kioskProjectGroups), [kioskProjectGroups]);

  const say = (t, ok = true) => {
    setMsg({ t, ok });
    setTimeout(() => setMsg(null), 6000);
  };

  const admin = role === "admin";

  // State untuk modal login admin
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminMsg, setAdminMsg] = useState("");
  const [adminMsgOk, setAdminMsgOk] = useState(true);

  // switch-role-btn: buka modal login admin
  const openAdminLogin = () => {
    setAdminMsg("");
    setAdminPassword("");
    setAdminModalOpen(true);
  };

  // Proses login admin
  const doAdminLogin = async (e) => {
    e.preventDefault();
    setAdminMsg("");
    try {
      const res = await api.adminLogin(adminPassword);
      if (res && res.status === "ok") {
        setRole("admin");
        setAdminMsg("Login berhasil");
        setAdminMsgOk(true);
        setAdminModalOpen(false);
      } else {
        setAdminMsg((res && res.message) || "Password salah");
        setAdminMsgOk(false);
      }
    } catch (err) {
      setAdminMsg("Gagal login: endpoint tidak ditemukan atau tidak dapat dihubungi.");
      setAdminMsgOk(false);
    }
  };

  // Logout admin
  const logoutAdmin = async () => {
    try {
      await api.adminLogout();
    } catch (err) {
      // logout gagal di server tetap reset role client
    }
    setRole("viewer");
    setAdminModalOpen(false);
  };

  const toggleAdminMode = async () => {
    try {
      const check = await api.getAdminCheck();
      if (check && check.admin) {
        await api.adminLogout();
        setRole("viewer");
      } else {
        openAdminLogin();
      }
    } catch (err) {
      setAdminMsg("Endpoint admin belum tersedia. Upload folder api terbaru.");
      setAdminMsgOk(false);
      openAdminLogin();
    }
  };
  const tabsList = useMemo(() => [
    { key: "proyek", label: "Progres Proyek", icon: Icons.Chart },
    { key: "draw", label: "Outstanding Drawing", icon: Icons.Drawing },
    { key: "hps", label: "Outstanding HPS", icon: Icons.Clipboard }
  ], []);

  // Live Clock Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(formatClock(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hitung jumlah halaman Outstanding Drawing berdasarkan tinggi layar,
  // supaya satu halaman tidak butuh scroll (autosize), maksimal 15 baris.
  useEffect(() => {
    if (!isAutoplay) return;
    const compute = () => {
      const per = kioskRowsPerPage();
      const total = kioskODRows.length;
      const newCount = Math.max(1, Math.ceil(total / per));
      odPageCountRef.current = newCount;
      setOdPageCount(newCount);
      setOdPage((p) => (p > newCount ? newCount : p)); // koreksi saja jika melebihi total
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [isAutoplay]);

  // Sinkron ref halaman saat ini
  useEffect(() => { odPageRef.current = odPage; }, [odPage]);

  // Autoplay Slideshow Effect
  // Urutan slide: Progres Proyek -> Outstanding Drawing (per halaman) -> Outstanding HPS
  useEffect(() => {
    if (!isAutoplay || !role) {
      setAutoplayProgress(0);
      return;
    }

    const stepMs = 100;
    const totalSteps = (autoplayDuration * 1000) / stepMs;
    let stepCount = 0;

    const interval = setInterval(() => {
      stepCount += 1;
      const pct = Math.min(100, (stepCount / totalSteps) * 100);
      setAutoplayProgress(pct);

      if (stepCount >= totalSteps) {
        stepCount = 0;
        setAutoplayProgress(0);

        setTab((currTab) => {
          if (currTab === "proyek") {
            setOdPage(1);
            return "draw";
          }
          if (currTab === "draw") {
            if (odPageRef.current < odPageCountRef.current) {
              setOdPage(odPageRef.current + 1);
              return "draw";
            }
            setOdPage(1);
            return "hps";
          }
          return "proyek";
        });
      }
    }, stepMs);

    return () => clearInterval(interval);
  }, [isAutoplay, autoplayDuration, role]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Upload handler for admin
  const upload = async (file) => {
    setBusy(true);
    try {
      const j = JSON.parse(await file.text());
      if (!Array.isArray(j.rows)) throw new Error("File tidak valid. Gunakan drawing_data.json dari sync_drawing.py.");
      const res = await api.sync(j);
      await be.refresh();
      say("Data tersimpan: " + res.drawings + " drawing" + (res.hps === null ? "" : ", " + res.hps + " HPS outstanding") + ".");
    } catch (e) {
      say(e && e.message ? e.message : "Gagal menyimpan data.", false);
    }
    setBusy(false);
  };

  // Switch tab with manual control
  const handleTabChange = (targetTab) => {
    setTab(targetTab);
    setAutoplayProgress(0); // Reset progress timer on user interaction
  };

  const adjustZoom = (delta) => {
    setZoomLevel((prev) => {
      const v = Math.min(2.0, Math.max(0.3, +(prev + delta).toFixed(2)));
      localStorage.setItem("kioskZoom", String(v));
      return v;
    });
  };

  // Ctrl + Scroll = zoom in/out di autoplay mode (Smart TV & desktop)
  const handleWheel = (e) => {
    if (!isAutoplay || !e.ctrlKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    adjustZoom(delta);
  };

  const handleNextSlide = () => {
    setTab((curr) => {
      if (curr === "proyek") return "draw";
      if (curr === "draw") return "hps";
      return "proyek";
    });
    setAutoplayProgress(0);
  };

  const handlePrevSlide = () => {
    setTab((curr) => {
      if (curr === "hps") return "draw";
      if (curr === "draw") return "proyek";
      return "hps";
    });
    setAutoplayProgress(0);
  };

  // Cross tab filtering from Project -> Drawing
  const handleCrossFilterProject = (projectName) => {
    setCrossFilterProject(projectName);
    setTab("draw");
  };

  const handleAutoplayToggle = () => {
    const next = !isAutoplay;
    setIsAutoplay(next);
    if (next) {
      document.documentElement.style.zoom = String(zoomLevel);
      setOdPage(1);
      setTab("proyek");
      // masuk fullscreen otomatis saat autoplay dijalankan
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      }
    } else {
      document.documentElement.style.zoom = "";
    }
  };

  // When entering viewer mode, tampilan dashboard biasa tanpa autoplay otomatis
  const enterViewer = () => {
    setRole("viewer");
    setTab("proyek");
  };

  const enterAdmin = () => {
    setRole("admin");
    setTab("proyek");
    setIsAutoplay(false);
  };

  // Role selection screen removed — default to viewer
  const projectCount = be.projects ? be.projects.length : 0;
  // Badge tab Outstanding Drawing tidak menghitung drawing yang sudah release.
  const outstandingRows = be.draw ? (be.draw.rows || []).filter((d) => d.s !== "REL") : [];
  const drawingCount = outstandingRows.length;
  const drawingODCount = outstandingRows.filter((d) => d.s === "OD").length;
  const hpsCount = be.hps ? (be.hps.rows || []).length : 0;

  return (
    <div className={isAutoplay ? "app-shell kiosk-active" : "app-shell"} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", zoom: isAutoplay ? zoomLevel : 1, msZoom: isAutoplay ? zoomLevel : 1 }} onWheel={handleWheel}>
      {/* HEADER SECTION */}
      <header className="app-header">
        {/* Autoplay visual timer progress bar */}
        {isAutoplay && (
          <div className="kiosk-progress-container">
            <div className="kiosk-progress-bar" style={{ width: `${autoplayProgress}%` }} />
          </div>
        )}

        <div className="header-top">
          {/* BRANDING */}
          <div className="header-brand">
            <div className="brand-icon-box">
              <Icons.Ship />
            </div>
            <div className="brand-title">
              <h1>
                DESIGN DASHBOARD
                <span className="badge-pill-feature" style={{ fontSize: "10px", padding: "1px 7px" }}>
                  MONITORING
                </span>
              </h1>
              <div className="brand-subtitle">
                Progress Report • Engineering & Drawing Production Control
              </div>
            </div>
          </div>

          {/* CENTER: LIVE CLOCK & SERVER STATUS */}
          <div className="header-center-info">
            <div className="live-clock">
              <Icons.Calendar />
              <span>{clock.dateStr}</span>
              <span className="live-clock-time">{clock.timeStr}</span>
            </div>

            <div className="server-status" title="Status koneksi ke data/db.json">
              <span className={`status-dot ${be.ok ? "online" : "offline"}`} />
              <span style={{ color: be.ok ? "var(--success)" : "var(--danger)" }}>
                {be.ok ? "ONLINE" : "DISCONNECTED"}
              </span>
              {be.ok && be.lastUpdate && <span className="last-update">{be.lastUpdate}</span>}
            </div>
          </div>

          {/* ACTIONS: KIOSK AUTO-PLAY CONTROLS, FULLSCREEN, ROLE */}
          <div className="header-actions">
            {/* KIOSK / AUTOPLAY CONTROLS */}
            <div className="kiosk-controls" title="Mode otomatis berganti halaman (Kiosk/Slideshow)">
              <button
                className={`kiosk-btn ${isAutoplay ? "active" : ""}`}
                onClick={handleAutoplayToggle}
              >
                {isAutoplay ? <Icons.Pause /> : <Icons.Play />}
                <span>{isAutoplay ? "" : ""}</span>
              </button>

              <button className="kiosk-btn" style={{ padding: "5px" }} onClick={handlePrevSlide} title="Halaman sebelumnya">
                <Icons.Prev />
              </button>
              <button className="kiosk-btn" style={{ padding: "5px" }} onClick={handleNextSlide} title="Halaman berikutnya">
                <Icons.Next />
              </button>

              <select
                className="kiosk-timer-select"
                value={autoplayDuration}
                onChange={(e) => setAutoplayDuration(Number(e.target.value))}
                title="Durasi per halaman"
              >
                <option value={8}>8s</option>
                <option value={12}>12s</option>
                <option value={20}>20s</option>
                <option value={30}>30s</option>
              </select>
            </div>

            {/* KIOSK ZOOM CONTROLS */}
            {isAutoplay && (
              <div className="kiosk-controls" title="Atur zoom tampilan TV">
                <button className="kiosk-btn" style={{ padding: "5px 8px" }} onClick={() => adjustZoom(-0.05)} title="Zoom kecil (-5%)">−</button>
                <span className="kiosk-chip page" style={{ fontSize: "12px", minWidth: "28px", textAlign: "center", cursor: "default" }}></span>
                <button className="kiosk-btn" style={{ padding: "5px 8px" }} onClick={() => adjustZoom(0.05)} title="Zoom besar (+5%)">+</button>
              </div>
            )}

            {/* FULLSCREEN BUTTON */}
            <button className="icon-btn" onClick={toggleFullscreen} title={isFullscreen ? "Keluar layar penuh" : "Mode layar penuh (TV Display)"}>
              {isFullscreen ? <Icons.Minimize /> : <Icons.Maximize />}
            </button>


            {/* ROLE BADGE & SWITCH */}
            <span className={`role-badge ${admin ? "admin" : ""}`}>
              {admin ? "Admin" : "Viewer"}
            </span>

            <button className="switch-role-btn" onClick={toggleAdminMode}>
              {admin ? "Keluar Admin" : "Login as Admin"}
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS (hidden on mobile) */}
        {!isAutoplay && (
        <>
        <nav className="app-nav desktop-nav">
          {tabsList.map((t) => {
            const IconComp = t.icon;
            const isActive = tab === t.key;
            let badgeText = "";
            let isDanger = false;

            if (t.key === "proyek") badgeText = `${projectCount}`;
            if (t.key === "draw") {
              badgeText = drawingODCount > 0 ? `${drawingCount} (${drawingODCount} OD)` : `${drawingCount}`;
              isDanger = drawingODCount > 0;
            }
            if (t.key === "hps") badgeText = `${hpsCount}`;

            return (
              <button
                key={t.key}
                className={`nav-tab ${isActive ? "active" : ""}`}
                onClick={() => handleTabChange(t.key)}
              >
                <IconComp />
                <span>{t.label}</span>
                {badgeText && <span className={`nav-badge ${isDanger ? "danger" : ""}`}>{badgeText}</span>}
              </button>
            );
          })}
        </nav>
        <nav className="mobile-nav" aria-label="Pilih menu">
          <button
            type="button"
            className="hamburger-btn"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>
          {mobileMenuOpen && (
            <div className="mobile-nav-panel">
              {tabsList.map((t) => {
                const IconComp = t.icon;
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    className={`mobile-nav-tab ${isActive ? "active" : ""}`}
                    onClick={() => { setTab(t.key); setMobileMenuOpen(false); }}
                  >
                    <IconComp />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </nav>
        </>
        )}
      </header>

      {/* MAIN VIEW AREA */}
      <main className="main-content">
        {/* TOAST MESSAGE */}
        {msg && (
          <div className={`toast ${msg.ok ? "success" : "error"}`}>
            {msg.ok ? <Icons.Check /> : <Icons.Alert />}
            <span>{msg.t}</span>
          </div>
        )}

        {/* SERVER OFFLINE WARNING */}
        {be.loaded && !be.ok && (
          <div className="toast error" style={{ position: "static", marginBottom: "16px" }}>
            <Icons.Alert />
            <span>
              Server lokal tidak terjangkau. Pastikan terminal atau <code>npm run dev</code> masih berjalan di port 3000.
            </span>
          </div>
        )}

        {/* TAB 1: PROGRES PROYEK */}
        {tab === "proyek" && (
          <ProjectsView
            list={be.projects}
            admin={admin}
            ok={be.ok}
            refresh={be.refresh}
            say={say}
            drawingsData={be.draw}
            recap={be.recap}
            onSelectProjectFilter={handleCrossFilterProject}
            isKiosk={isAutoplay}
          />
        )}

        {/* TAB 2: OUTSTANDING DRAWING */}
        {tab === "draw" && (
          <DrawView
            data={be.draw}
            admin={admin && be.ok}
            upload={upload}
            busy={busy}
            externalProjectFilter={crossFilterProject}
            isKiosk={isAutoplay}
            kioskRows={kioskODRows}
            kioskPage={odPage}
            kioskPageCount={odPageCount}
            kioskWeeks={kioskWeeks}
            kioskProjectGroups={kioskProjectGroups}
            kioskProjectList={kioskProjectList}
            expandedProject={expandedProject}
            setExpandedProject={setExpandedProject}
          />
        )}

        {/* TAB 3: OUTSTANDING HPS */}
        {tab === "hps" && (
          <div className={isAutoplay ? "kiosk-hps-wrap" : ""}>
          {isAutoplay && (
            <div className="kiosk-head kiosk-head-slide">
              <div>
                <div className="kiosk-title">OUTSTANDING HPS</div>
                <div className="kiosk-sub">Daftar HPS berstatus open / in progress / warning</div>
              </div>
              <div className="kiosk-chips">
                <span className="kiosk-chip page">{hpsCount} HPS</span>
              </div>
            </div>
          )}
          <HpsView
            data={be.hps}
            admin={admin && be.ok}
            upload={upload}
            busy={busy}
          />
          </div>
        )}
      </main>

      {/* ADMIN LOGIN MODAL */}
      {adminModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "var(--card, #1e1e1e)",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "rgba(0, 0, 0, 0.4) 0px 8px 24px",
              color: "var(--foreground, #f0f0f0)",
              fontFamily: "inherit",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: "600" }}>
              Login sebagai Admin
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted-foreground, #94a3b8)", marginBottom: "16px" }}>
              Masukkan password :
            </p>

            {adminMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                  fontSize: "13px",
                  background: adminMsgOk ? "rgba(34, 197, 94, 0.15)" : "rgba(244, 63, 94, 0.15)",
                  color: adminMsgOk ? "rgb(188, 252, 200)" : "rgb(252, 165, 165)",
                }}
              >
                {adminMsg}
              </div>
            )}

            <form onSubmit={doAdminLogin}>
              <input
                type="password"
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  border: "1px solid var(--border, #333)",
                  borderRadius: "8px",
                  background: "var(--card-bg, #2a2a2a)",
                  color: "var(--foreground, #f0f0f0)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    background: "rgb(100, 116, 139)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    background: "var(--accent, #2563eb)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
