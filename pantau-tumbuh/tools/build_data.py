#!/usr/bin/env python3
"""Ubah tabel resmi WHO (.xlsx, versi z-score) menjadi data/who-lms.json.

Cara pakai:
    pip install openpyxl
    python3 tools/build_data.py FOLDER_BERISI_XLSX_WHO [-o data/who-lms.json]

Nama file yang dikenali (awalan boleh ada, mis. hash unggahan):
    lhfa_boys_0-to-2-years_zscores.xlsx    -> lfa  (panjang menurut umur, bulan)
    lhfa_boys_2-to-5-years_zscores.xlsx    -> hfa  (tinggi menurut umur, bulan)
    wfa_boys_0-to-5-years_zscores.xlsx     -> wfa  (berat menurut umur, bulan)
    wfl_boys_0-to-2-years_zscores.xlsx     -> wfl  (berat menurut panjang, cm)
    wfh_boys_2-to-5-years_zscores.xlsx     -> wfh  (berat menurut tinggi, cm)
dan versi girls-nya. File "weeks" (0-13 minggu) dilewati.

Setiap tabel diverifikasi: nilai SD yang dihitung ulang dari L, M, S harus sama dengan
kolom SD3neg..SD3 yang dicetak WHO di file yang sama (WHO membulatkan ke 1 desimal).
"""
import argparse
import json
import os
import re
import sys
from datetime import date

try:
    import openpyxl
except ImportError:  # pragma: no cover
    sys.exit("Butuh openpyxl: pip install openpyxl")

NAME_RE = re.compile(r"(lhfa|wfa|wfl|wfh)[-_](boys|girls)[-_](\d+)-to-(\d+)-(years|weeks)", re.IGNORECASE)
MAPPING = {
    ("lhfa", 0, 2): "lfa",
    ("lhfa", 2, 5): "hfa",
    ("wfa", 0, 5): "wfa",
    ("wfl", 0, 2): "wfl",
    ("wfh", 2, 5): "wfh",
}
REQUIRED = ("lfa", "hfa", "wfa", "wfl", "wfh")
SD_COLS = {"sd3neg": -3, "sd2neg": -2, "sd1neg": -1, "sd0": 0, "sd1": 1, "sd2": 2, "sd3": 3}
UNITS = {"month": "month", "day": "day", "length": "cm", "height": "cm"}
TOLERANCE = 0.0501  # WHO membulatkan kolom SD ke 1 desimal


def parse_name(path):
    m = NAME_RE.search(os.path.basename(path))
    if not m:
        return None, None, "nama tidak dikenali"
    ind, sex, a, b, span_unit = m.group(1).lower(), m.group(2).lower(), int(m.group(3)), int(m.group(4)), m.group(5).lower()
    if span_unit != "years":
        return None, None, "file minggu dilewati"
    key = MAPPING.get((ind, a, b))
    if not key:
        return None, None, f"kombinasi {ind} {a}-{b} tahun tidak dipakai"
    return key, "m" if sex == "boys" else "f", None


def lms_value(z, L, M, S):
    return M * (1 + L * S * z) ** (1 / L) if L != 0 else M * __import__("math").exp(S * z)


def read_table(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    rows = list(wb.worksheets[0].iter_rows(values_only=True))
    header = None
    names = []
    for i, row in enumerate(rows[:15]):
        cand = [str(c).strip().lower() if c is not None else "" for c in row]
        if "l" in cand and "m" in cand and "s" in cand:
            header, names = i, cand
            break
    if header is None:
        raise ValueError("kolom L, M, S tidak ditemukan")
    unit = UNITS.get(names[0])
    if unit is None:
        raise ValueError(f"satuan kolom pertama tidak dikenali: '{names[0]}'")
    ci = {"L": names.index("l"), "M": names.index("m"), "S": names.index("s")}
    sd_idx = {SD_COLS[n]: names.index(n) for n in SD_COLS if n in names}

    data, sd = [], {z: [] for z in sd_idx}
    for row in rows[header + 1:]:
        try:
            key, L, M, S = float(row[0]), float(row[ci["L"]]), float(row[ci["M"]]), float(row[ci["S"]])
        except (TypeError, ValueError):
            continue
        data.append((key, L, M, S))
        for z, idx in sd_idx.items():
            try:
                sd[z].append(float(row[idx]))
            except (TypeError, ValueError):
                sd[z].append(None)
    if len(data) < 2:
        raise ValueError("data kurang dari 2 baris")

    keys = [d[0] for d in data]
    step = round(keys[1] - keys[0], 6)
    for a, b in zip(keys, keys[1:]):
        if abs((b - a) - step) > 1e-6:
            raise ValueError(f"langkah kunci tidak seragam di sekitar {a}")
    table = {"unit": unit, "start": keys[0], "step": step, "rows": [[d[1], d[2], d[3]] for d in data]}
    return table, data, sd


def verify(data, sd):
    """Bandingkan nilai SD hasil hitung ulang dengan kolom SD dari WHO. Mengembalikan selisih terbesar."""
    worst = 0.0
    for z, col in sd.items():
        for (key, L, M, S), printed in zip(data, col):
            if printed is None:
                continue
            worst = max(worst, abs(lms_value(z, L, M, S) - printed))
    return worst


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", help="folder berisi file .xlsx dari WHO")
    ap.add_argument("-o", "--out", default="data/who-lms.json")
    args = ap.parse_args()

    tables, sources, bad = {}, [], False
    for fname in sorted(os.listdir(args.folder)):
        if not fname.lower().endswith(".xlsx"):
            continue
        key, sex, why = parse_name(fname)
        if not key:
            print(f"lewati  {fname}  ({why})")
            continue
        try:
            table, data, sd = read_table(os.path.join(args.folder, fname))
        except ValueError as e:
            print(f"GAGAL   {fname}: {e}")
            bad = True
            continue
        worst = verify(data, sd)
        flag = "OK " if worst <= TOLERANCE else "BEDA"
        bad |= worst > TOLERANCE
        end = table["start"] + table["step"] * (len(table["rows"]) - 1)
        print(f"{flag} {key:3s} {sex}  {table['unit']:5s} {table['start']:g}..{end:g}  {len(table['rows']):4d} baris  selisih maks vs kolom SD WHO = {worst:.3f}")
        tables.setdefault(key, {})[sex] = table
        sources.append(re.sub(r"^[0-9a-f]{8}-", "", fname))

    missing = [f"{k}/{s}" for k in REQUIRED for s in ("m", "f") if s not in tables.get(k, {})]
    if missing:
        print("BELUM ADA:", ", ".join(missing))

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(
            {"meta": {"source": "WHO Child Growth Standards (2006), z-score tables", "files": sources, "generated": date.today().isoformat()}, "tables": tables},
            fh,
            separators=(",", ":"),
        )
    print(f"Tersimpan: {args.out}")
    return 2 if bad else (1 if missing else 0)


if __name__ == "__main__":
    sys.exit(main())
