(function () {
  const CODE = {
    n: 18,
    xChecks: [
      [0, 3, 9, 10],
      [1, 4, 10, 11],
      [2, 5, 9, 11],
      [3, 6, 12, 13],
      [4, 7, 13, 14],
      [5, 8, 12, 14],
      [0, 6, 15, 16],
      [1, 7, 16, 17],
    ],
    zChecks: [
      [0, 2, 9, 15],
      [0, 1, 10, 16],
      [1, 2, 11, 17],
      [3, 5, 9, 12],
      [3, 4, 10, 13],
      [4, 5, 11, 14],
      [6, 8, 12, 15],
      [6, 7, 13, 16],
    ],
    logicalX: [
      [0, 1, 2],
      [9, 12, 15],
    ],
    logicalZ: [
      [0, 3, 6],
      [9, 10, 11],
    ],
    qubits: [
      { id: 0, x1: 92, y1: 92, x2: 186, y2: 92 }, { id: 9, x1: 92, y1: 92, x2: 92, y2: 186 },
      { id: 1, x1: 186, y1: 92, x2: 280, y2: 92 }, { id: 10, x1: 186, y1: 92, x2: 186, y2: 186 },
      { id: 2, x1: 280, y1: 92, x2: 374, y2: 92 }, { id: 11, x1: 280, y1: 92, x2: 280, y2: 186 },
      { id: 3, x1: 92, y1: 186, x2: 186, y2: 186 }, { id: 12, x1: 92, y1: 186, x2: 92, y2: 280 },
      { id: 4, x1: 186, y1: 186, x2: 280, y2: 186 }, { id: 13, x1: 186, y1: 186, x2: 186, y2: 280 },
      { id: 5, x1: 280, y1: 186, x2: 374, y2: 186 }, { id: 14, x1: 280, y1: 186, x2: 280, y2: 280 },
      { id: 6, x1: 92, y1: 280, x2: 186, y2: 280 }, { id: 15, x1: 92, y1: 280, x2: 92, y2: 374 },
      { id: 7, x1: 186, y1: 280, x2: 280, y2: 280 }, { id: 16, x1: 186, y1: 280, x2: 186, y2: 374 },
      { id: 8, x1: 280, y1: 280, x2: 374, y2: 280 }, { id: 17, x1: 280, y1: 280, x2: 280, y2: 374 },
    ],
  };

  const PAULI_MUL = {
    II: "I", IX: "X", IY: "Y", IZ: "Z",
    XI: "X", XX: "I", XY: "Z", XZ: "Y",
    YI: "Y", YX: "Z", YY: "I", YZ: "X",
    ZI: "Z", ZX: "Y", ZY: "X", ZZ: "I",
  };

  const ALL_BITS = [];
  for (let mask = 0; mask < (1 << CODE.n); mask++) {
    const bits = Array.from({ length: CODE.n }, (_, i) => (mask >> i) & 1);
    const weight = bits.reduce((acc, bit) => acc + bit, 0);
    ALL_BITS.push({ bits, weight });
  }

  function qs(sel, root) {
    return root.querySelector(sel);
  }

  function parity(bits, support) {
    return support.reduce((acc, idx) => acc ^ bits[idx], 0);
  }

  function syndromeFor(bits, checks) {
    return checks.map((support) => parity(bits, support));
  }

  function key(arr) {
    return arr.join("");
  }

  function clone(arr) {
    return arr.slice();
  }

  function pauliToBits(pauli) {
    return {
      x: pauli === "X" || pauli === "Y" ? 1 : 0,
      z: pauli === "Z" || pauli === "Y" ? 1 : 0,
    };
  }

  function bitsToPauli(x, z) {
    if (x && z) return "Y";
    if (x) return "X";
    if (z) return "Z";
    return "I";
  }

  function composePauli(a, b) {
    return PAULI_MUL[a + b];
  }

  function qubitsToBits(qubits) {
    return {
      x: qubits.map((p) => pauliToBits(p).x),
      z: qubits.map((p) => pauliToBits(p).z),
    };
  }

  function buildDecoder(checks) {
    const table = new Map();
    for (const entry of ALL_BITS) {
      const syn = syndromeFor(entry.bits, checks);
      const k = key(syn);
      if (!table.has(k) || entry.weight < table.get(k).weight) {
        table.set(k, { bits: clone(entry.bits), weight: entry.weight });
      }
    }
    return table;
  }

  function buildSpan(rows) {
    const span = new Set();
    const total = 1 << rows.length;
    for (let mask = 0; mask < total; mask++) {
      const out = Array(CODE.n).fill(0);
      rows.forEach((row, idx) => {
        if ((mask >> idx) & 1) {
          row.forEach((qIdx) => {
            out[qIdx] ^= 1;
          });
        }
      });
      span.add(key(out));
    }
    return span;
  }

  const X_RECOVERY_TABLE = buildDecoder(CODE.zChecks);
  const Z_RECOVERY_TABLE = buildDecoder(CODE.xChecks);
  const X_STABILIZER_SPAN = buildSpan(CODE.xChecks);
  const Z_STABILIZER_SPAN = buildSpan(CODE.zChecks);

  function decodeSyndrome(syndrome) {
    return {
      x: clone(X_RECOVERY_TABLE.get(key(syndrome.zChecks)).bits),
      z: clone(Z_RECOVERY_TABLE.get(key(syndrome.xChecks)).bits),
    };
  }

  function recoveryList(recovery) {
    const ops = [];
    for (let i = 0; i < CODE.n; i++) {
      const p = bitsToPauli(recovery.x[i], recovery.z[i]);
      if (p !== "I") ops.push({ qubit: i + 1, op: p });
    }
    return ops;
  }

  function applyRecovery(qubits, recovery) {
    return qubits.map((p, i) => composePauli(p, bitsToPauli(recovery.x[i], recovery.z[i])));
  }

  function dot(bits, support) {
    return support.reduce((acc, idx) => acc ^ bits[idx], 0);
  }

  function evaluateResidual(qubits) {
    const bits = qubitsToBits(qubits);
    const xKey = key(bits.x);
    const zKey = key(bits.z);
    const sameLogicalClass = X_STABILIZER_SPAN.has(xKey) && Z_STABILIZER_SPAN.has(zKey);
    const logicalBits = {
      x1: dot(bits.x, CODE.logicalZ[0]),
      x2: dot(bits.x, CODE.logicalZ[1]),
      z1: dot(bits.z, CODE.logicalX[0]),
      z2: dot(bits.z, CODE.logicalX[1]),
    };
    const labels = [];
    if (logicalBits.x1) labels.push("X_L^(1)");
    if (logicalBits.x2) labels.push("X_L^(2)");
    if (logicalBits.z1) labels.push("Z_L^(1)");
    if (logicalBits.z2) labels.push("Z_L^(2)");
    return {
      sameLogicalClass,
      logicalBits,
      label: labels.length ? labels.join(" · ") : "trivial",
    };
  }

  function createSvg(tag, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, String(v)));
    return node;
  }

  function checkCenter(check) {
    const mids = check.map((idx) => {
      const q = CODE.qubits.find((qq) => qq.id === idx);
      return { x: (q.x1 + q.x2) / 2, y: (q.y1 + q.y2) / 2 };
    });
    return {
      x: mids.reduce((acc, p) => acc + p.x, 0) / mids.length,
      y: mids.reduce((acc, p) => acc + p.y, 0) / mids.length,
    };
  }

  const X_CENTERS = CODE.xChecks.map(checkCenter);
  const Z_CENTERS = CODE.zChecks.map(checkCenter);

  function drawBoundaryCues(svg) {
    svg.appendChild(createSvg("rect", {
      x: 70, y: 70, width: 306, height: 306,
      rx: 24, ry: 24,
      fill: "#fbfcfd",
      stroke: "#cfd7df",
      "stroke-width": 2,
      "stroke-dasharray": "12 10",
    }));
    [
      [392, 120, 430, 120], [54, 120, 16, 120],
      [120, 392, 120, 430], [120, 54, 120, 16],
    ].forEach(([x1, y1, x2, y2]) => {
      svg.appendChild(createSvg("line", {
        x1, y1, x2, y2,
        stroke: "#9aa3ad",
        "stroke-width": 3,
        "stroke-linecap": "round",
      }));
    });
    [
      "430,120 418,114 418,126",
      "16,120 28,114 28,126",
      "120,430 114,418 126,418",
      "120,16 114,28 126,28",
    ].forEach((points) => {
      svg.appendChild(createSvg("polygon", { points, fill: "#9aa3ad" }));
    });
    [
      ["identified edge", 223, 34],
      ["identified edge", 223, 420],
      ["wrap", 446, 125],
      ["wrap", 0, 125],
      ["wrap", 120, 447],
      ["wrap", 120, 8],
    ].forEach(([txt, x, y]) => {
      const t = createSvg("text", {
        x, y,
        "text-anchor": txt === "identified edge" ? "middle" : "start",
        "font-size": txt === "identified edge" ? 14 : 13,
        fill: txt === "identified edge" ? "#7b8794" : "#8a949e",
        "font-weight": txt === "identified edge" ? 600 : 500,
      });
      t.textContent = txt;
      svg.appendChild(t);
    });
  }

  function renderPatch(svg, qubits, syndrome, recoveryOps, isFinal) {
    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 466 466");

    drawBoundaryCues(svg);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        svg.appendChild(createSvg("circle", {
          cx: 92 + c * 94,
          cy: 92 + r * 94,
          r: 5,
          fill: "#6a7178",
        }));
      }
    }

    if (syndrome) {
      CODE.xChecks.forEach((check, idx) => {
        const c = X_CENTERS[idx];
        const violated = syndrome.xChecks[idx] === 1;
        svg.appendChild(createSvg("polygon", {
          points: `${c.x},${c.y - 36} ${c.x + 36},${c.y} ${c.x},${c.y + 36} ${c.x - 36},${c.y}`,
          fill: "#4f6fad",
          opacity: violated ? 0.24 : 0.10,
          stroke: "#4f6fad",
          "stroke-width": violated ? 4 : 2,
        }));
      });
      CODE.zChecks.forEach((check, idx) => {
        const c = Z_CENTERS[idx];
        const violated = syndrome.zChecks[idx] === 1;
        svg.appendChild(createSvg("polygon", {
          points: `${c.x},${c.y - 28} ${c.x + 28},${c.y} ${c.x},${c.y + 28} ${c.x - 28},${c.y}`,
          fill: "#BF5700",
          opacity: violated ? 0.20 : 0.08,
          stroke: "#BF5700",
          "stroke-width": violated ? 4 : 2,
        }));
      });
      CODE.xChecks.forEach((check, idx) => {
        const violated = syndrome.xChecks[idx] === 1;
        check.forEach((qIdx) => {
          const q = CODE.qubits.find((qq) => qq.id === qIdx);
          svg.appendChild(createSvg("line", {
            x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2,
            stroke: "#4f6fad",
            "stroke-width": violated ? 24 : 14,
            "stroke-linecap": "round",
            opacity: violated ? 0.5 : 0.18,
          }));
        });
      });
      CODE.zChecks.forEach((check, idx) => {
        const violated = syndrome.zChecks[idx] === 1;
        check.forEach((qIdx) => {
          const q = CODE.qubits.find((qq) => qq.id === qIdx);
          svg.appendChild(createSvg("line", {
            x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2,
            stroke: "#BF5700",
            "stroke-width": violated ? 16 : 9,
            "stroke-linecap": "round",
            opacity: violated ? 0.42 : 0.14,
          }));
        });
      });

      X_CENTERS.forEach((center, idx) => {
        const t = createSvg("text", {
          x: center.x, y: center.y + 5,
          "text-anchor": "middle",
          "font-size": 18,
          "font-weight": 700,
          fill: syndrome.xChecks[idx] ? "#173b72" : "#6d7e96",
        });
        t.textContent = String(syndrome.xChecks[idx]);
        svg.appendChild(t);
      });
      Z_CENTERS.forEach((center, idx) => {
        const t = createSvg("text", {
          x: center.x, y: center.y + 5,
          "text-anchor": "middle",
          "font-size": 18,
          "font-weight": 700,
          fill: syndrome.zChecks[idx] ? "#8a3b12" : "#a78a7a",
        });
        t.textContent = String(syndrome.zChecks[idx]);
        svg.appendChild(t);
      });
    }

    const loopColors = ["#243c5a", "#8a3b12"];
    CODE.logicalX.forEach((loop, idx) => {
      loop.forEach((qIdx) => {
        const q = CODE.qubits.find((qq) => qq.id === qIdx);
        svg.appendChild(createSvg("line", {
          x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2,
          stroke: loopColors[idx],
          "stroke-width": 12,
          "stroke-linecap": "round",
          opacity: 0.18,
        }));
      });
    });
    CODE.logicalZ.forEach((loop, idx) => {
      loop.forEach((qIdx) => {
        const q = CODE.qubits.find((qq) => qq.id === qIdx);
        svg.appendChild(createSvg("line", {
          x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2,
          stroke: loopColors[idx],
          "stroke-width": 9,
          "stroke-linecap": "round",
          "stroke-dasharray": "14 10",
          opacity: 0.16,
        }));
      });
    });

    CODE.qubits.forEach((q, idx) => {
      const touchedByRecovery = recoveryOps.some((op) => op.qubit === idx + 1);
      if (touchedByRecovery) {
        svg.appendChild(createSvg("line", {
          x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2,
          stroke: isFinal ? "#2f8f5b" : "#4f6fad",
          "stroke-width": 22,
          "stroke-linecap": "round",
          opacity: 0.18,
        }));
      }

      svg.appendChild(createSvg("line", {
        x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2,
        stroke: "#333",
        "stroke-width": 8,
        "stroke-linecap": "round",
      }));

      const midx = (q.x1 + q.x2) / 2;
      const midy = (q.y1 + q.y2) / 2;
      const pauli = qubits[idx];
      const text = createSvg("text", {
        x: midx,
        y: midy - 8,
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 700,
        fill: pauli === "I" ? "#9aa0a6" : pauli === "X" ? "#1f4fb2" : pauli === "Z" ? "#b45309" : "#7c3aed",
      });
      text.textContent = pauli;
      svg.appendChild(text);

      const qid = createSvg("text", {
        x: midx,
        y: midy + 18,
        "text-anchor": "middle",
        "font-size": 11,
        fill: "#6b7280",
      });
      qid.textContent = `Q${idx + 1}`;
      svg.appendChild(qid);
    });
  }

  function formatSyndrome(arr) {
    return `[${arr.join(", ")}]`;
  }

  function formatResidualOperator(qubits) {
    const ops = qubits
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p !== "I")
      .map(({ p, i }) => `Q${i + 1}:${p}`);
    return ops.length ? ops.join(", ") : "stabilizer-only / no visible residual";
  }

  function residualBadge(label, sameLogicalClass) {
    const cls = sameLogicalClass ? "qecc-badge qecc-badge-good" : "qecc-badge qecc-badge-bad";
    const text = sameLogicalClass ? "stabilizer-only" : label;
    return `<span class="${cls}">${text}</span>`;
  }

  function mount(root) {
    root.innerHTML = `
      <div class="qecc-sim-controls">
        <label>Error Type
          <select data-sim-error-type class="form-control form-control-sm">
            <option value="X">X</option>
            <option value="Z">Z</option>
          </select>
        </label>
        <label>Error Position
          <select data-sim-error-pos class="form-control form-control-sm">
            ${Array.from({ length: 18 }, (_, i) => `<option value="${i}">Q${i + 1}</option>`).join("")}
          </select>
        </label>
        <button type="button" class="btn btn-sm btn-dark" data-sim-apply>Inject Error</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-sim-reset>Reset</button>
      </div>
      <div class="qecc-sim-layout">
        <div class="qecc-sim-panel">
          <h4>Periodic qubits and syndrome extraction</h4>
          <svg class="qecc-sim-svg qecc-sim-svg-toric" data-sim-current aria-label="Errored toric code lattice"></svg>
          <p class="qecc-sim-caption mb-0">
            The short segments are edge qubits. The dashed frame and wrap arrows show that opposite boundaries are identified, so this flat picture represents a torus. Blue and orange regions indicate violated $X$ and $Z$ checks.
          </p>
        </div>
        <div class="qecc-sim-panel">
          <h4>Recovered toric lattice</h4>
          <svg class="qecc-sim-svg qecc-sim-svg-toric" data-sim-final aria-label="Recovered toric code lattice"></svg>
          <p class="qecc-sim-caption mb-0">
            Green highlights mark qubits touched by the predicted recovery. The faint dark-blue and dashed brown loops mark the two independent non-contractible logical directions.
          </p>
        </div>
      </div>
      <div class="qecc-sim-results">
        <div class="qecc-sim-box">
          <h5>Decoder input</h5>
          <div data-sim-syndrome></div>
        </div>
        <div class="qecc-sim-box">
          <h5>Predicted recovery operator</h5>
          <div data-sim-recovery></div>
        </div>
        <div class="qecc-sim-box">
          <h5>Logical recovery</h5>
          <div data-sim-equivalence></div>
        </div>
        <div class="qecc-sim-box">
          <h5>Residual operator</h5>
          <div data-sim-residual-operator></div>
        </div>
        <div class="qecc-sim-box">
          <h5>Residual logical content</h5>
          <div data-sim-residual-logical></div>
        </div>
      </div>
    `;

    const state = {
      qubits: Array(CODE.n).fill("I"),
    };

    function update() {
      const bits = qubitsToBits(state.qubits);
      const syndrome = {
        xChecks: syndromeFor(bits.z, CODE.xChecks),
        zChecks: syndromeFor(bits.x, CODE.zChecks),
      };
      const recovery = decodeSyndrome(syndrome);
      const recoveryOps = recoveryList(recovery);
      const finalQubits = applyRecovery(state.qubits, recovery);
      const residual = evaluateResidual(finalQubits);

      renderPatch(qs("[data-sim-current]", root), state.qubits, syndrome, [], false);
      renderPatch(qs("[data-sim-final]", root), finalQubits, null, recoveryOps, true);

      qs("[data-sim-syndrome]", root).innerHTML = `
        <p><strong>X-check syndromes</strong>: ${formatSyndrome(syndrome.xChecks)}</p>
        <p class="mb-0"><strong>Z-check syndromes</strong>: ${formatSyndrome(syndrome.zChecks)}</p>
      `;

      qs("[data-sim-recovery]", root).innerHTML = recoveryOps.length
        ? `<p>${recoveryOps.map((op) => `Q${op.qubit}:${op.op}`).join(", ")}</p>`
        : `<p>No recovery needed.</p>`;

      qs("[data-sim-equivalence]", root).innerHTML = `
        <p><strong>Same Logical Class</strong>: <span class="${residual.sameLogicalClass ? "qecc-ok" : "qecc-fail"}">${residual.sameLogicalClass ? "true" : "false"}</span></p>
        <p class="mb-0"><strong>Equivalence Check</strong>: <span class="${residual.sameLogicalClass ? "qecc-ok" : "qecc-fail"}">${residual.sameLogicalClass ? "OK" : "FAILED"}</span></p>
      `;

      qs("[data-sim-residual-operator]", root).innerHTML = `
        <p class="mb-0">${formatResidualOperator(finalQubits)}</p>
      `;

      qs("[data-sim-residual-logical]", root).innerHTML = `
        <p><strong>Status</strong>: ${residualBadge(residual.label, residual.sameLogicalClass)}</p>
        <p class="mb-0"><strong>Detected logical action</strong>: ${residual.sameLogicalClass ? "none" : residual.label}</p>
      `;
    }

    qs("[data-sim-apply]", root).addEventListener("click", () => {
      const type = qs("[data-sim-error-type]", root).value;
      const pos = Number(qs("[data-sim-error-pos]", root).value);
      state.qubits[pos] = composePauli(state.qubits[pos], type);
      update();
    });

    qs("[data-sim-reset]", root).addEventListener("click", () => {
      state.qubits = Array(CODE.n).fill("I");
      update();
    });

    update();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-toric-d3-sim]").forEach(mount);
  });
})();
