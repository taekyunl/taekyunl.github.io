#!/usr/bin/env python3
"""Generate code-derived QECC blog assets from the actual QEC constructors."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path


BLOG_ROOT = Path("/home/tl29435/taekyunl.github.io")
QEC_ROOT = Path("/home/tl29435/MDM-QEC-exp-qdec-pos-embed")
OUT_DIR = BLOG_ROOT / "assets" / "data" / "qecc"
SVG_DIR = BLOG_ROOT / "assets" / "images" / "etc" / "qecc"


def import_codes():
    sys.path.insert(0, str(QEC_ROOT))
    from codes import SurfaceCode, ToricCode, get_surface_code, get_toric_code  # type: ignore

    return SurfaceCode, ToricCode, get_surface_code, get_toric_code


def row_supports(mat):
    return [[idx for idx, val in enumerate(row.tolist()) if val] for row in mat]


def surface_payload(d, get_surface_code):
    H_X, H_Z, L_X, L_Z, N, M_X, M_Z = get_surface_code(d)
    qubits = []
    step = 96
    margin = 80
    for r in range(d):
        for c in range(d):
            qubits.append(
                {
                    "id": r * d + c,
                    "r": r,
                    "c": c,
                    "x": margin + c * step,
                    "y": margin + r * step,
                }
            )

    return {
        "family": "surface",
        "d": d,
        "N": N,
        "M_X": M_X,
        "M_Z": M_Z,
        "K": 1,
        "qubits": qubits,
        "x_checks": row_supports(H_X),
        "z_checks": row_supports(H_Z),
        "logical_x": [idx for idx, val in enumerate(L_X.tolist()) if val],
        "logical_z": [idx for idx, val in enumerate(L_Z.tolist()) if val],
        "validation": {
            "hx_hz_commutes": int(((H_X @ H_Z.T) % 2).sum().item()) == 0,
            "expected_mx": M_X == (d * d - 1) // 2,
            "expected_mz": M_Z == (d * d - 1) // 2,
        },
    }


def toric_payload(d, get_toric_code):
    H_X, H_Z, L_X, L_Z, N, M_X, M_Z = get_toric_code(d)
    step = 94
    margin = 92
    qubits = []

    def h_idx(r, c):
        return r * d + c

    def v_idx(r, c):
        return d * d + r * d + c

    for r in range(d):
        for c in range(d):
            qubits.append(
                {
                    "id": h_idx(r, c),
                    "kind": "h",
                    "r": r,
                    "c": c,
                    "x1": margin + c * step,
                    "y1": margin + r * step,
                    "x2": margin + (c + 1) * step,
                    "y2": margin + r * step,
                }
            )
            qubits.append(
                {
                    "id": v_idx(r, c),
                    "kind": "v",
                    "r": r,
                    "c": c,
                    "x1": margin + c * step,
                    "y1": margin + r * step,
                    "x2": margin + c * step,
                    "y2": margin + (r + 1) * step,
                }
            )

    return {
        "family": "toric",
        "d": d,
        "N": N,
        "M_X": M_X,
        "M_Z": M_Z,
        "K": 2,
        "qubits": qubits,
        "x_checks": row_supports(H_X),
        "z_checks": row_supports(H_Z),
        "logical_x": [[idx for idx, val in enumerate(row.tolist()) if val] for row in L_X],
        "logical_z": [[idx for idx, val in enumerate(row.tolist()) if val] for row in L_Z],
        "validation": {
            "hx_hz_commutes": int(((H_X @ H_Z.T) % 2).sum().item()) == 0,
            "expected_mx": M_X == d * d - 1,
            "expected_mz": M_Z == d * d - 1,
        },
    }


def write_json(name: str, payload: dict):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{name}.json"
    path.write_text(json.dumps(payload, indent=2))
    return path


def write_overview_svg():
    SVG_DIR.mkdir(parents=True, exist_ok=True)
    svg = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520" role="img" aria-labelledby="title desc">
  <title id="title">Quantum error correction loop</title>
  <desc id="desc">Qubit arrows, syndrome extraction, decoder, and recovery loop for quantum error correction.</desc>
  <rect width="1200" height="520" fill="#f8f9fa"/>
  <g transform="translate(30,40)">
    <rect x="0" y="40" width="250" height="290" rx="26" fill="#ffffff" stroke="#d8dde3" stroke-width="3"/>
    <rect x="320" y="40" width="220" height="290" rx="26" fill="#fff8ee" stroke="#BF5700" stroke-width="3"/>
    <rect x="610" y="40" width="240" height="290" rx="26" fill="#eef4ff" stroke="#4c72b0" stroke-width="3"/>
    <rect x="920" y="40" width="220" height="290" rx="26" fill="#ffffff" stroke="#5f6b76" stroke-width="3"/>
    <text x="125" y="88" text-anchor="middle" font-family="Lato, sans-serif" font-size="28" font-weight="700" fill="#222">Physical qubits</text>
    <text x="430" y="88" text-anchor="middle" font-family="Lato, sans-serif" font-size="28" font-weight="700" fill="#8c3f00">Syndrome</text>
    <text x="730" y="88" text-anchor="middle" font-family="Lato, sans-serif" font-size="28" font-weight="700" fill="#2c4f8c">Decoder</text>
    <text x="1030" y="88" text-anchor="middle" font-family="Lato, sans-serif" font-size="28" font-weight="700" fill="#333">Recovery</text>

    <g stroke="#333F48" stroke-width="5" stroke-linecap="round">
      <line x1="70" y1="165" x2="105" y2="145"/><polygon points="105,145 94,145 100,156" fill="#333F48" stroke="none"/>
      <line x1="150" y1="165" x2="183" y2="186"/><polygon points="183,186 177,175 171,186" fill="#333F48" stroke="none"/>
      <line x1="115" y1="245" x2="143" y2="223"/><polygon points="143,223 132,224 138,233" fill="#333F48" stroke="none"/>
      <line x1="185" y1="255" x2="154" y2="281"/><polygon points="154,281 165,279 159,271" fill="#333F48" stroke="none"/>
    </g>
    <g fill="#BF5700">
      <circle cx="70" cy="165" r="13"/><circle cx="115" cy="245" r="13"/><circle cx="150" cy="165" r="13"/><circle cx="185" cy="255" r="13"/>
    </g>
    <text x="125" y="295" text-anchor="middle" font-family="Lato, sans-serif" font-size="21" fill="#444">many physical qubits</text>

    <text x="430" y="170" text-anchor="middle" font-family="Lato, sans-serif" font-size="24" font-weight="700" fill="#8c3f00">measure stabilizer checks</text>
    <text x="430" y="216" text-anchor="middle" font-family="Lato, sans-serif" font-size="22" fill="#555">extract syndrome bits</text>
    <text x="430" y="280" text-anchor="middle" font-family="Lato, sans-serif" font-size="22" fill="#555">do not read the logical state directly</text>

    <text x="730" y="168" text-anchor="middle" font-family="Lato, sans-serif" font-size="24" font-weight="700" fill="#2c4f8c">infer an equivalent recovery</text>
    <text x="730" y="222" text-anchor="middle" font-family="Lato, sans-serif" font-size="22" fill="#555">use local evidence</text>
    <text x="730" y="254" text-anchor="middle" font-family="Lato, sans-serif" font-size="22" fill="#555">and global structure</text>
    <text x="730" y="286" text-anchor="middle" font-family="Lato, sans-serif" font-size="22" fill="#555">to pick a correction</text>

    <text x="1030" y="182" text-anchor="middle" font-family="Lato, sans-serif" font-size="24" font-weight="700" fill="#333">same logical class</text>
    <text x="1030" y="236" text-anchor="middle" font-family="Lato, sans-serif" font-size="22" fill="#555">exact microscopic error</text>
    <text x="1030" y="268" text-anchor="middle" font-family="Lato, sans-serif" font-size="22" fill="#555">may remain ambiguous</text>

    <g stroke="#66707a" stroke-width="8" fill="none" stroke-linecap="round">
      <path d="M252 185 H308"/><path d="M542 185 H598"/><path d="M852 185 H908"/>
    </g>
    <g fill="#66707a">
      <polygon points="308,185 292,176 292,194"/>
      <polygon points="598,185 582,176 582,194"/>
      <polygon points="908,185 892,176 892,194"/>
    </g>
  </g>
</svg>
"""
    (SVG_DIR / "qecc-overview.svg").write_text(svg)


def main():
    SurfaceCode, ToricCode, get_surface_code, get_toric_code = import_codes()
    assert SurfaceCode(5).verify()
    assert ToricCode(6).verify()

    generated = []
    for d in [3, 5, 7]:
        generated.append(write_json(f"surface_d{d}", surface_payload(d, get_surface_code)))
    for d in [3, 4, 6]:
        generated.append(write_json(f"toric_d{d}", toric_payload(d, get_toric_code)))

    write_overview_svg()

    print("Generated QECC blog assets:")
    for path in generated:
        print(path)
    print(SVG_DIR / "qecc-overview.svg")


if __name__ == "__main__":
    main()
