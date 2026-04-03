(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function elt(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  function htmlEscape(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    }[c]));
  }

  function uniquePoints(points) {
    const seen = new Set();
    return points.filter((p) => {
      const key = `${p.x},${p.y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function orderPolygon(points) {
    const cx = points.reduce((a, p) => a + p.x, 0) / points.length;
    const cy = points.reduce((a, p) => a + p.y, 0) / points.length;
    return points
      .slice()
      .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  }

  function renderSurface(svg, data, opts) {
    const width = 900;
    const height = 900;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = "";
    const qubitById = new Map(data.qubits.map((q) => [q.id, q]));

    if (opts.showX) {
      data.x_checks.forEach((check, idx) => {
        const pts = uniquePoints(check.map((id) => qubitById.get(id)));
        const isSelected = opts.selectedKind === "x" && opts.selectedIndex === idx;
        if (pts.length === 2) {
          const line = elt("line", {
            x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y,
            stroke: "#4f6fad",
            "stroke-width": isSelected ? 28 : 18,
            "stroke-linecap": "round",
            opacity: isSelected ? 0.52 : 0.22
          });
          svg.appendChild(line);
        } else {
          const polyPts = orderPolygon(pts).map((p) => `${p.x},${p.y}`).join(" ");
          const poly = elt("polygon", {
            points: polyPts,
            fill: "#4f6fad",
            opacity: isSelected ? 0.34 : 0.18,
            stroke: "#4f6fad",
            "stroke-width": isSelected ? 8 : 4
          });
          svg.appendChild(poly);
        }
      });
    }

    if (opts.showZ) {
      data.z_checks.forEach((check, idx) => {
        const pts = uniquePoints(check.map((id) => qubitById.get(id)));
        const isSelected = opts.selectedKind === "z" && opts.selectedIndex === idx;
        if (pts.length === 2) {
          const line = elt("line", {
            x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y,
            stroke: "#BF5700",
            "stroke-width": isSelected ? 28 : 18,
            "stroke-linecap": "round",
            opacity: isSelected ? 0.5 : 0.22
          });
          svg.appendChild(line);
        } else {
          const polyPts = orderPolygon(pts).map((p) => `${p.x},${p.y}`).join(" ");
          const poly = elt("polygon", {
            points: polyPts,
            fill: "#BF5700",
            opacity: isSelected ? 0.3 : 0.16,
            stroke: "#BF5700",
            "stroke-width": isSelected ? 8 : 4
          });
          svg.appendChild(poly);
        }
      });
    }

    if (opts.showLogicals) {
      ["logical_x", "logical_z"].forEach((key, idx) => {
        const pts = data[key].map((id) => qubitById.get(id));
        const color = idx === 0 ? "#243c5a" : "#8a3b12";
        for (let i = 0; i < pts.length - 1; i++) {
          svg.appendChild(elt("line", {
            x1: pts[i].x, y1: pts[i].y, x2: pts[i + 1].x, y2: pts[i + 1].y,
            stroke: color, "stroke-width": 8, "stroke-linecap": "round", opacity: 0.85
          }));
        }
      });
    }

    const selectedSet = new Set(
      opts.selectedKind === "x"
        ? (data.x_checks[opts.selectedIndex] || [])
        : opts.selectedKind === "z"
          ? (data.z_checks[opts.selectedIndex] || [])
          : []
    );

    data.qubits.forEach((q) => {
      svg.appendChild(elt("circle", {
        cx: q.x, cy: q.y, r: selectedSet.has(q.id) ? 18 : 13, fill: selectedSet.has(q.id) ? "#111" : "#222"
      }));
    });
  }

  function renderToric(svg, data, opts) {
    const width = 900;
    const height = 900;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = "";
    const qubitById = new Map(data.qubits.map((q) => [q.id, q]));

    if (opts.showX) {
      data.x_checks.forEach((check, idx) => {
        const isSelected = opts.selectedKind === "x" && opts.selectedIndex === idx;
        check.forEach((id) => {
          const q = qubitById.get(id);
          svg.appendChild(elt("line", {
            x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2, stroke: "#4f6fad",
            "stroke-width": isSelected ? 24 : 14, "stroke-linecap": "round", opacity: isSelected ? 0.58 : 0.28
          }));
        });
      });
    }

    if (opts.showZ) {
      data.z_checks.forEach((check, idx) => {
        const isSelected = opts.selectedKind === "z" && opts.selectedIndex === idx;
        check.forEach((id) => {
          const q = qubitById.get(id);
          svg.appendChild(elt("line", {
            x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2, stroke: "#BF5700",
            "stroke-width": isSelected ? 16 : 9, "stroke-linecap": "round", opacity: isSelected ? 0.45 : 0.22
          }));
        });
      });
    }

    const selectedSet = new Set(
      opts.selectedKind === "x"
        ? (data.x_checks[opts.selectedIndex] || [])
        : opts.selectedKind === "z"
          ? (data.z_checks[opts.selectedIndex] || [])
          : []
    );

    data.qubits.forEach((q) => {
      svg.appendChild(elt("line", {
        x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2,
        stroke: selectedSet.has(q.id) ? "#111" : "#333",
        "stroke-width": selectedSet.has(q.id) ? 13 : 8,
        "stroke-linecap": "round"
      }));
    });

    const d = data.d;
    const step = 94;
    const margin = 92;
    for (let r = 0; r < d; r++) {
      for (let c = 0; c < d; c++) {
        const x = margin + c * step;
        const y = margin + r * step;
        svg.appendChild(elt("circle", { cx: x, cy: y, r: 4.5, fill: "#6a7178" }));
      }
    }

    if (opts.showLogicals) {
      const colors = ["#243c5a", "#8a3b12"];
      data.logical_x.forEach((loop, idx) => {
        loop.forEach((id) => {
          const q = qubitById.get(id);
          svg.appendChild(elt("line", {
            x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2,
            stroke: colors[idx], "stroke-width": 13, "stroke-linecap": "round", opacity: 0.88
          }));
        });
      });
    }
  }

  function updateMeta(root, data) {
    qs("[data-qecc-meta='family']", root).textContent = data.family;
    qs("[data-qecc-meta='d']", root).textContent = data.d;
    qs("[data-qecc-meta='n']", root).textContent = data.N;
    qs("[data-qecc-meta='mx']", root).textContent = data.M_X;
    qs("[data-qecc-meta='mz']", root).textContent = data.M_Z;
    qs("[data-qecc-meta='k']", root).textContent = data.K;
    qs("[data-qecc-meta='validation']", root).textContent =
      data.validation.hx_hz_commutes && data.validation.expected_mx && data.validation.expected_mz
        ? "validated"
        : "check failed";
  }

  function updateConstraintControls(root, data) {
    const kindSel = qs("[data-qecc-check-kind]", root);
    const range = qs("[data-qecc-check-index]", root);
    const selectedMeta = qs("[data-qecc-meta='selected']", root);
    const kind = kindSel.value;
    let count = 0;
    if (kind === "x") count = data.x_checks.length;
    if (kind === "z") count = data.z_checks.length;
    range.disabled = kind === "none";
    range.min = "0";
    range.max = String(Math.max(0, count - 1));
    if (kind === "none") {
      range.value = "0";
      selectedMeta.textContent = "none";
    } else {
      const idx = Math.min(Number(range.value || 0), Math.max(0, count - 1));
      range.value = String(idx);
      const support = kind === "x" ? data.x_checks[idx] : data.z_checks[idx];
      selectedMeta.textContent = `${kind.toUpperCase()}[${idx}] on ${support.length} qubits`;
    }
  }

  async function loadData(family, d) {
    const res = await fetch(`/assets/data/qecc/${family}_d${d}.json`);
    if (!res.ok) throw new Error(`Failed to load ${family}_d${d}.json`);
    return await res.json();
  }

  async function mount(root) {
    const familySel = qs("[data-qecc-family]", root);
    const distanceSel = qs("[data-qecc-distance]", root);
    const kindSel = qs("[data-qecc-check-kind]", root);
    const range = qs("[data-qecc-check-index]", root);
    const svg = qs("svg", root);
    let currentData = null;

    async function render() {
      const family = familySel.value;
      const d = distanceSel.value;
      const data = await loadData(family, d);
      currentData = data;
      updateMeta(root, data);
      updateConstraintControls(root, data);
      const opts = {
        showX: qs("[data-qecc-toggle='x']", root).checked,
        showZ: qs("[data-qecc-toggle='z']", root).checked,
        showLogicals: qs("[data-qecc-toggle='logical']", root).checked,
        selectedKind: kindSel.value,
        selectedIndex: Number(range.value || 0)
      };
      if (family === "surface") {
        renderSurface(svg, data, opts);
      } else {
        renderToric(svg, data, opts);
      }
    }

    function syncDistances() {
      const family = familySel.value;
      const options = family === "surface" ? ["3", "5", "7"] : ["3", "4", "6"];
      const current = distanceSel.value;
      distanceSel.innerHTML = options.map((v) => `<option value="${htmlEscape(v)}">${htmlEscape(v)}</option>`).join("");
      if (options.includes(current)) distanceSel.value = current;
    }

    familySel.addEventListener("change", async () => {
      syncDistances();
      await render();
    });
    distanceSel.addEventListener("change", render);
    kindSel.addEventListener("change", () => {
      if (currentData) updateConstraintControls(root, currentData);
      render();
    });
    range.addEventListener("input", () => {
      if (currentData) updateConstraintControls(root, currentData);
      render();
    });
    root.querySelectorAll("input[type='checkbox']").forEach((cb) => cb.addEventListener("change", render));

    syncDistances();
    await render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-qecc-explorer]");
    if (root) mount(root);
  });
})();
