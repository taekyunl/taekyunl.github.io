(function () {
  const CODE = {
    n: 9,
    xChecks: [
      [0, 1, 3, 4],
      [4, 5, 7, 8],
      [3, 6],
      [2, 5],
    ],
    zChecks: [
      [1, 2, 4, 5],
      [3, 4, 6, 7],
      [0, 1],
      [7, 8],
    ],
    logicalX: [0, 1, 2],
    logicalZ: [0, 3, 6],
  };

  const POSITIONS = [
    { x: 80, y: 80 },
    { x: 180, y: 80 },
    { x: 280, y: 80 },
    { x: 80, y: 180 },
    { x: 180, y: 180 },
    { x: 280, y: 180 },
    { x: 80, y: 280 },
    { x: 180, y: 280 },
    { x: 280, y: 280 },
  ];

  const X_CHECK_SHAPES = [
    "80,80 180,80 180,180 80,180",
    "180,180 280,180 280,280 180,280",
    "80,180 80,280 40,280 40,180",
    "280,80 320,80 320,180 280,180",
  ];

  const Z_CHECK_SHAPES = [
    "180,80 280,80 280,180 180,180",
    "80,180 180,180 180,280 80,280",
    "80,80 180,80 180,40 80,40",
    "180,280 280,280 280,320 180,320",
  ];

  const X_CHECK_CENTERS = [
    { x: 130, y: 130 },
    { x: 230, y: 230 },
    { x: 30, y: 230 },
    { x: 330, y: 130 },
  ];

  const Z_CHECK_CENTERS = [
    { x: 230, y: 130 },
    { x: 130, y: 230 },
    { x: 130, y: 20 },
    { x: 230, y: 340 },
  ];

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
      x: dot(bits.x, CODE.logicalZ),
      z: dot(bits.z, CODE.logicalX),
    };
    let label = "trivial";
    if (logicalBits.x || logicalBits.z) {
      label = logicalBits.x && logicalBits.z ? "Y_L" : logicalBits.x ? "X_L" : "Z_L";
    }
    return { sameLogicalClass, logicalBits, label };
  }

  function createSvg(tag, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, String(v)));
    return node;
  }

  function renderPatch(svg, qubits, syndrome, recoveryOps, isFinal) {
    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 360 360");

    X_CHECK_SHAPES.forEach((shape, idx) => {
      const violated = syndrome ? syndrome.xChecks[idx] === 1 : false;
      svg.appendChild(createSvg("polygon", {
        points: shape,
        fill: violated ? "#4f6fad" : "#dce8fb",
        opacity: violated ? 0.42 : 0.25,
        stroke: "#4f6fad",
        "stroke-width": violated ? 4 : 2,
      }));
    });

    Z_CHECK_SHAPES.forEach((shape, idx) => {
      const violated = syndrome ? syndrome.zChecks[idx] === 1 : false;
      svg.appendChild(createSvg("polygon", {
        points: shape,
        fill: violated ? "#BF5700" : "#fde3d0",
        opacity: violated ? 0.34 : 0.22,
        stroke: "#BF5700",
        "stroke-width": violated ? 4 : 2,
      }));
    });

    if (syndrome) {
      X_CHECK_CENTERS.forEach((center, idx) => {
        const text = createSvg("text", {
          x: center.x,
          y: center.y,
          "text-anchor": "middle",
          "font-size": 18,
          "font-weight": 700,
          fill: syndrome.xChecks[idx] ? "#173b72" : "#6d7e96",
        });
        text.textContent = String(syndrome.xChecks[idx]);
        svg.appendChild(text);
      });
      Z_CHECK_CENTERS.forEach((center, idx) => {
        const text = createSvg("text", {
          x: center.x,
          y: center.y,
          "text-anchor": "middle",
          "font-size": 18,
          "font-weight": 700,
          fill: syndrome.zChecks[idx] ? "#8a3b12" : "#a78a7a",
        });
        text.textContent = String(syndrome.zChecks[idx]);
        svg.appendChild(text);
      });
    }

    POSITIONS.forEach((pos, idx) => {
      const touchedByRecovery = recoveryOps.some((op) => op.qubit === idx + 1);
      if (touchedByRecovery) {
        svg.appendChild(createSvg("circle", {
          cx: pos.x,
          cy: pos.y,
          r: 24,
          fill: isFinal ? "#dff5e7" : "#eef5ff",
          stroke: isFinal ? "#2f8f5b" : "#4f6fad",
          "stroke-width": 2,
        }));
      }

      svg.appendChild(createSvg("circle", {
        cx: pos.x,
        cy: pos.y,
        r: 18,
        fill: "#f3f4f6",
        stroke: "#4b5563",
        "stroke-width": 2,
      }));

      const pauli = qubits[idx];
      const text = createSvg("text", {
        x: pos.x,
        y: pos.y + 5,
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 700,
        fill: pauli === "I" ? "#9aa0a6" : pauli === "X" ? "#1f4fb2" : pauli === "Z" ? "#b45309" : "#7c3aed",
      });
      text.textContent = pauli;
      svg.appendChild(text);

      const qid = createSvg("text", {
        x: pos.x,
        y: pos.y + 34,
        "text-anchor": "middle",
        "font-size": 12,
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
            ${Array.from({ length: 9 }, (_, i) => `<option value="${i}">Q${i + 1}</option>`).join("")}
          </select>
        </label>
        <button type="button" class="btn btn-sm btn-dark" data-sim-apply>Inject Error</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-sim-reset>Reset</button>
      </div>
      <div class="qecc-sim-layout">
        <div class="qecc-sim-panel">
          <h4>Physical qubits and syndrome extraction</h4>
          <svg class="qecc-sim-svg" data-sim-current aria-label="Errored surface code lattice"></svg>
          <p class="qecc-sim-caption mb-0">
            The grey circles are the nine data qubits. Blue regions are $X$ checks and orange regions are $Z$ checks.
            A check labeled <strong>1</strong> is violated, so that bit becomes part of the syndrome sent to the decoder.
          </p>
        </div>
        <div class="qecc-sim-panel">
          <h4>Recovered lattice</h4>
          <svg class="qecc-sim-svg" data-sim-final aria-label="Recovered surface code lattice"></svg>
          <p class="qecc-sim-caption mb-0">
            Green halos mark qubits touched by the predicted recovery. The symbols shown after recovery are the residual operator that remains.
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
    document.querySelectorAll("[data-surface-d3-sim]").forEach(mount);
  });
})();
