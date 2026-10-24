"""Baca config_setting.xlsx:
  - sheet Proyek -> sheet 'drawing control' tiap proyek (Outstanding Drawing)
  - sheet HPS    -> URL rekap penerbitan HPS (tab HPS: baris berstatus Open)
lalu hasilkan drawing_data.json untuk diunggah admin di dashboard.
Jalankan: python sync_drawing.py [config_setting.xlsx] [hari_ke_depan=7] [--push http://localhost:3000] [--every 30]
Butuh: pip install pandas openpyxl"""
import sys, json, datetime as dt
import re
import pandas as pd

# Nama kolom status drawing. Tiap sheet punya DUA kolom "STATUS": satu catatan
# keterangan di awal (sebelum PLAN FINISH), satu status drawing di akhir
# (setelah REPLAN). Yang dipakai adalah yang muncul SETELAH REPLAN.
STATUS_HEADERS = ("STATUS DRAWING", "STATUS")

# Nama kolom nomor drawing. LCU LD PN 124 M memakai 'ATCH'.
NO_DWG_HEADERS = ("NO DWG", "DRAWING NO", "ATCH", "NO. DWG")

# Google Sheets mengekspor tanggal dengan nama bulan Indonesia (2026-Okt-14),
# yang tidak selalu dikenali pandas.
BULAN_ID = {"JAN": "Jan", "FEB": "Feb", "MAR": "Mar", "APR": "Apr", "MEI": "May", "JUN": "Jun",
            "JUL": "Jul", "AGU": "Aug", "SEP": "Sep", "OKT": "Oct", "NOV": "Nov", "DES": "Dec"}

def parse_plan_date(value):
    text = str(value).strip()
    m = re.match(r"^(\d{4})-([A-Za-z]+)-(\d{1,2})$", text)
    if m:
        month = BULAN_ID.get(m.group(2).upper()[:3])
        if month:
            text = f"{m.group(1)}-{month}-{m.group(3)}"
    return pd.to_datetime(text, dayfirst=True, errors="coerce")

def status_col_index(cols):
    """Cari index kolom status drawing: header STATUS/STATUS DRAWING setelah REPLAN.
    Tiap sheet punya dua kolom 'STATUS' (keterangan di awal, status drawing di akhir),
    jadi tidak bisa pakai index() yang hanya menemukan kemunculan pertama."""
    try:
        replan = cols.index("REPLAN")
    except ValueError:
        replan = -1
    cands = [i for i, c in enumerate(cols)
             if c in STATUS_HEADERS and i > replan]
    if not cands:
        raise ValueError("kolom status drawing tidak ditemukan")
    return cands[0]

def no_dwg_index(cols):
    for n in NO_DWG_HEADERS:
        if n in cols:
            return cols.index(n)
    raise ValueError("header nomor drawing (NO DWG / ATCH) tidak ditemukan")

def process(raw, proyek, days=7, today=None):
    today = today or dt.date.today()
    h = next((i for i in range(min(len(raw), 30))
              if any(str(c).strip().upper() in NO_DWG_HEADERS for c in raw.iloc[i])), None)
    if h is None:
        raise ValueError("header 'NO DWG' tidak ditemukan")
    cols = [str(c).strip().upper() for c in raw.iloc[h]]
    i_st = status_col_index(cols)
    i_no = no_dwg_index(cols)
    body = raw.iloc[h + 1:].reset_index(drop=True)
    out = []
    for _, r in body.iterrows():
        g = lambda name: str(r[cols.index(name)]).strip() if name in cols else ""
        no = str(r[i_no]).strip() if len(r) > i_no else ""
        if not no or no.lower() == "nan":
            continue
        st = str(r[i_st]).strip().lower() if len(r) > i_st else ""
        fin = parse_plan_date(g("PLAN FINISH"))
        fin_d = None if pd.isna(fin) else fin.date()
        # Simpan seluruh drawing proyek. Status IP tidak lagi dibatasi 7 hari;
        # semua drawing berstatus On Track/Warning dihitung sebagai In Progress.
        if "overdue" in st:
            s = "OD"
        elif "progress" in st or "on track" in st or "warning" in st:
            s = "IP"
        elif "finish" in st:
            s = "REL"
        else:
            continue
        out.append({"p": proyek, "no": no, "nm": g("DRAWING NAME"),
                    "fin": fin_d.isoformat() if fin_d else "", "pic": g("PIC"),
                    "biro": g("BIRO"), "dept": g("DEPARTEMEN"), "s": s})
    return out

# ---------------- HPS ----------------
import re

# singkatan PIC di rekap HPS -> nama yang ditampilkan di dashboard (tambahkan sesuai kebutuhan)
PIC_NAMA = {"DRH": "Dadang", "NZR": "Nizar", "KSA": "Kartika", "ARP": "Ari", "AKB": "Akbar"}
BULAN = {"JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MEI": 5, "MAY": 5, "JUN": 6, "JUL": 7,
         "AGU": 8, "AUG": 8, "AGT": 8, "SEP": 9, "OKT": 10, "OCT": 10, "NOV": 11, "NOP": 11, "DES": 12, "DEC": 12}
NAMA_BLN = ["", "JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"]

def fmt_deadline(txt):
    """'13 Okt 2026' -> ('13 OKT 26', '2026-10-13'); teks yang tak bisa dibaca dikembalikan apa adanya."""
    m = re.match(r"\s*(\d{1,2})[\s\-/]+([A-Za-z]+)[\s\-/]+(\d{2,4})", str(txt))
    if m and m.group(2)[:3].upper() in BULAN:
        d, mo, y = int(m.group(1)), BULAN[m.group(2)[:3].upper()], int(m.group(3))
        y = y + 2000 if y < 100 else y
        return f"{d} {NAMA_BLN[mo]} {str(y)[2:]}", f"{y:04d}-{mo:02d}-{d:02d}"
    return str(txt).strip(), ""

def process_hps(raw):
    """HPS outstanding = baris bernomor di rekap penerbitan HPS dengan Status Memo 'Open'.
    Mengembalikan daftar {p: proyek, nm: perihal, dl: deadline, iso: deadline ISO, s: status, pic}."""
    h = next((i for i in range(min(len(raw), 30))
              if any(str(c).strip().upper() == "STATUS MEMO" for c in raw.iloc[i])), None)
    if h is None:
        raise ValueError("header 'Status Memo' tidak ditemukan")
    cols = [str(c).strip().upper() for c in raw.iloc[h]]
    ix = lambda n: cols.index(n) if n in cols else None
    iNo, iSt, iPr, iPf, iDl, iPic = (ix(n) for n in ("NO.", "STATUS MEMO", "PROYEK", "PERIHAL", "DEADLINE", "PIC"))
    iTs = ix("TIME STATUS")  # kolom terakhir di rekap HPS: FINISH / ON PROGRESS / WARNING / CANCEL
    get = lambda r, i: str(r[i]).strip() if i is not None and i < len(r) else ""
    out = []
    for _, r in raw.iloc[h + 1:].iterrows():
        if not re.fullmatch(r"\d+", get(r, iNo)) or get(r, iSt).upper() != "OPEN":
            continue
        m = re.match(r"\s*([A-Za-z0-9]+)", get(r, iPr))
        dl, iso = fmt_deadline(get(r, iDl))
        pic = get(r, iPic)
        ts = get(r, iTs).upper()
        status = {"ON PROGRESS": "In Progress", "WARNING": "Warning",
                  "FINISH": "Finish", "CANCEL": "Cancel"}.get(ts, ts.title())
        out.append({"p": m.group(1).upper() if m else "-", "nm": re.sub(r"\s+", " ", get(r, iPf)),
                    "dl": dl, "iso": iso, "s": status, "pic": PIC_NAMA.get(pic.upper(), pic)})
    out.sort(key=lambda x: (x["iso"] or "9999", x["p"]))
    return out

def run_once(cfg, days, push):
    proj = pd.read_excel(cfg, sheet_name="Proyek")
    rows, errs, seen = [], [], {}
    for _, p in proj.iterrows():
        nama, url = str(p["Nama Proyek"]).strip(), str(p["URL"]).strip()
        if url in seen:
            print(f"PERINGATAN: {nama} memakai URL yang sama dengan {seen[url]}")
        seen[url] = nama
        try:
            rows += process(pd.read_csv(url, header=None, dtype=str).fillna(""), nama, days)
            print("OK  ", nama)
        except Exception as e:
            errs.append({"p": nama, "error": str(e)})
            print("GAGAL", nama, "-", e)
    hps = None
    try:
        hs = pd.read_excel(cfg, sheet_name="HPS")
        hurl = str(hs.iloc[:, 0].dropna().iloc[0]).strip()
        hps = process_hps(pd.read_csv(hurl, header=None, dtype=str).fillna(""))
        print("OK   HPS -", len(hps), "outstanding")
    except Exception as e:
        errs.append({"p": "HPS", "error": str(e)})
        print("GAGAL HPS -", e)
    wib_time = dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=7)
    payload = {"generated": wib_time.strftime("%Y-%m-%dT%H:%M"),
               "rows": rows, "errors": errs}
    if hps is not None:          # kalau HPS gagal diambil, data HPS lama di dashboard dibiarkan
        payload["hps"] = hps
    with open("drawing_data.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print(len(rows), "drawing +", len(hps or []), "HPS outstanding ditulis ke drawing_data.json")
    if push:
        import urllib.request
        req = urllib.request.Request(push.rstrip("/") + "/api/sync",
                                     data=json.dumps(payload).encode("utf-8"),
                                     headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=30) as r:
            print("Dikirim ke dashboard:", r.read().decode("utf-8"))

def main():
    import argparse, time
    ap = argparse.ArgumentParser(description="Sinkronisasi drawing & HPS ke dashboard")
    ap.add_argument("config", nargs="?", default="config_setting.xlsx")
    ap.add_argument("days", nargs="?", type=int, default=7, help="jatuh tempo In Progress dalam N hari (default 7)")
    ap.add_argument("--push", metavar="URL", help="kirim hasil ke dashboard, mis. http://localhost:3000")
    ap.add_argument("--every", type=float, metavar="MENIT", help="ulangi otomatis tiap N menit")
    a = ap.parse_args()
    while True:
        try:
            run_once(a.config, a.days, a.push)
        except Exception as e:
            print("GAGAL sinkronisasi:", e)
        if not a.every:
            break
        print(f"Menunggu {a.every:g} menit... (Ctrl+C untuk berhenti)")
        time.sleep(a.every * 60)

if __name__ == "__main__":
    main()
