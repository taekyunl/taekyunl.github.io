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
    svg = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="560" viewBox="0 0 1200 560" role="img" aria-labelledby="title desc">
  <title id="title">Quantum error correction loop</title>
  <desc id="desc">A patch of physical qubits produces syndrome bits through stabilizer checks, a decoder maps syndrome to a recovery, and the output aims to preserve the logical state.</desc>
  <rect width="1200" height="560" fill="#f8f9fa"/>
  <g transform="translate(24,36)">
    <rect x="0" y="40" width="260" height="330" rx="28" fill="#ffffff" stroke="#d8dde3" stroke-width="3"/>
    <rect x="300" y="40" width="250" height="330" rx="28" fill="#fff8ee" stroke="#BF5700" stroke-width="3"/>
    <rect x="590" y="40" width="260" height="330" rx="28" fill="#eef4ff" stroke="#4c72b0" stroke-width="3"/>
    <rect x="890" y="40" width="250" height="330" rx="28" fill="#ffffff" stroke="#5f6b76" stroke-width="3"/>

    <text x="130" y="86" text-anchor="middle" font-family="Lato, sans-serif" font-size="28" font-weight="700" fill="#222">Physical qubits</text>
    <text x="425" y="86" text-anchor="middle" font-family="Lato, sans-serif" font-size="28" font-weight="700" fill="#8c3f00">Syndrome extraction</text>
    <text x="720" y="86" text-anchor="middle" font-family="Lato, sans-serif" font-size="28" font-weight="700" fill="#2c4f8c">Decoder</text>
    <text x="1015" y="86" text-anchor="middle" font-family="Lato, sans-serif" font-size="28" font-weight="700" fill="#333">Output</text>

    <g fill="#BF5700">
      <circle cx="72" cy="170" r="12"/><circle cx="126" cy="150" r="12"/><circle cx="176" cy="185" r="12"/><circle cx="95" cy="245" r="12"/><circle cx="152" cy="252" r="12"/>
    </g>
    <g stroke="#333F48" stroke-width="5" stroke-linecap="round">
      <line x1="72" y1="170" x2="126" y2="150"/><line x1="126" y1="150" x2="176" y2="185"/><line x1="72" y1="170" x2="95" y2="245"/><line x1="95" y1="245" x2="152" y2="252"/>
    </g>
    <g stroke="#4f6fad" stroke-width="4" fill="#e8f0ff">
      <rect x="58" y="306" width="42" height="42" rx="10"/><rect x="110" y="306" width="42" height="42" rx="10"/><rect x="162" y="306" width="42" height="42" rx="10"/>
    </g>
    <text x="130" y="329" text-anchor="middle" font-family="Lato, sans-serif" font-size="17" font-weight="700" fill="#4f6fad">local check pattern</text>

    <g stroke="#BF5700" stroke-width="4" fill="#fff1d9">
      <rect x="350" y="138" width="54" height="54" rx="14"/><rect x="446" y="138" width="54" height="54" rx="14"/>
      <line x1="377" y1="192" x2="377" y2="252"/><line x1="473" y1="192" x2="473" y2="252"/>
    </g>
    <g fill="#333">
      <circle cx="329" cy="126" r="7"/><circle cx="377" cy="126" r="7"/><circle cx="425" cy="126" r="7"/><circle cx="473" cy="126" r="7"/><circle cx="521" cy="126" r="7"/>
      <circle cx="329" cy="224" r="7"/><circle cx="377" cy="224" r="7"/><circle cx="425" cy="224" r="7"/><circle cx="473" cy="224" r="7"/><circle cx="521" cy="224" r="7"/>
    </g>
    <g fill="#8c3f00" font-family="Source Code Pro, monospace" font-size="24" font-weight="700">
      <text x="377" y="295" text-anchor="middle">0</text>
      <text x="473" y="295" text-anchor="middle">1</text>
    </g>
    <text x="425" y="337" text-anchor="middle" font-family="Lato, sans-serif" font-size="19" fill="#555">which parity checks flipped?</text>

    <g fill="#eef4ff" stroke="#4c72b0" stroke-width="3">
      <rect x="664" y="128" width="112" height="112" rx="22"/>
    </g>
    <g stroke="#4c72b0" stroke-width="5" stroke-linecap="round">
      <line x1="690" y1="165" x2="750" y2="165"/>
      <line x1="690" y1="195" x2="728" y2="195"/>
      <line x1="690" y1="225" x2="738" y2="225"/>
    </g>
    <text x="720" y="290" text-anchor="middle" font-family="Lato, sans-serif" font-size="22" font-weight="700" fill="#2c4f8c">input: syndrome bits</text>
    <text x="720" y="324" text-anchor="middle" font-family="Lato, sans-serif" font-size="18" fill="#555">output: candidate recovery</text>

    <g fill="#BF5700">
      <circle cx="958" cy="170" r="12"/><circle cx="1012" cy="150" r="12"/><circle cx="1062" cy="185" r="12"/><circle cx="981" cy="245" r="12"/><circle cx="1038" cy="252" r="12"/>
    </g>
    <g stroke="#333F48" stroke-width="5" stroke-linecap="round">
      <line x1="958" y1="170" x2="1012" y2="150"/><line x1="1012" y1="150" x2="1062" y2="185"/><line x1="958" y1="170" x2="981" y2="245"/><line x1="981" y1="245" x2="1038" y2="252"/>
    </g>
    <g fill="#2c7a4b">
      <circle cx="1078" cy="230" r="15"/>
      <path d="M1070 230 l6 6 l12 -14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="1015" y="318" text-anchor="middle" font-family="Lato, sans-serif" font-size="22" font-weight="700" fill="#333">recovered logical state</text>
    <text x="1015" y="350" text-anchor="middle" font-family="Lato, sans-serif" font-size="18" fill="#555">same logical class, even if the microscopic error is ambiguous</text>

    <g stroke="#66707a" stroke-width="8" fill="none" stroke-linecap="round">
      <path d="M262 205 H288"/><path d="M552 205 H578"/><path d="M852 205 H878"/>
    </g>
    <g fill="#66707a">
      <polygon points="288,205 272,196 272,214"/>
      <polygon points="578,205 562,196 562,214"/>
      <polygon points="878,205 862,196 862,214"/>
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
