(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function elt(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  const stages = [
    {
      title: "Observed syndrome",
      caption: "SAQ starts from the observed syndrome tensor Y_syn. In the code, binary syndrome bits are extracted from the two-channel observation and converted into sign-valued syndrome tokens."
    },
    {
      title: "Logical prior",
      caption: "A logical-prior MLP maps syndrome bits to logits over logical classes. Those class logits seed the logical-token stream."
    },
    {
      title: "Shared attention",
      caption: "Syndrome tokens attend to each other through a Tanner-style mask, while logical tokens cross-attend to syndrome tokens through shared attention projections."
    },
    {
      title: "Qubit logits",
      caption: "The syndrome stream is aggregated back onto qubits through H^T-style pooling. SAQ predicts two logits per qubit in a binary symplectic representation."
    },
    {
      title: "CPND projection",
      caption: "The repo baseline does not stop at raw logits. It applies CPND projection-and-descent to enforce parity and logical consistency before converting back to Pauli labels."
    }
  ];

  function describe(stageIdx, toggles) {
    const parts = [];
    if (stageIdx === 0) {
      parts.push(stages[0].caption);
    } else if (stageIdx === 1) {
      parts.push(
        toggles.logical
          ? stages[1].caption
          : "The logical-prior branch is muted here. That means the model no longer injects class-conditioned logical tokens into the later stages."
      );
    } else if (stageIdx === 2) {
      parts.push(
        toggles.mask
          ? "Syndrome-to-syndrome attention uses a Tanner-style mask: two checks may attend if they share at least one qubit."
          : "Syndrome masking is disabled here, so the syndrome stream behaves like unrestricted self-attention instead of graph-aware attention."
      );
      parts.push(
        toggles.logical
          ? "Logical tokens are active, so cross-attention from logical classes into syndrome tokens remains visible."
          : "Logical tokens are disabled here, so the model relies only on the syndrome stream."
      );
    } else if (stageIdx === 3) {
      parts.push(stages[3].caption);
      parts.push(
        toggles.logical
          ? "Logical information can still influence the qubit logits indirectly through the earlier shared-attention layers."
          : "Without logical tokens, the qubit head only sees the syndrome stream."
      );
    } else if (stageIdx === 4) {
      parts.push(
        toggles.cpnd
          ? stages[4].caption
          : "CPND is disabled here, so the baseline would output thresholded raw logits without the final parity/logical consistency correction."
      );
    }
    return parts.join(" ");
  }

  function box(svg, x, y, w, h, title, sub, active, enabled, fill, stroke) {
    svg.appendChild(elt("rect", {
      x, y, width: w, height: h, rx: 22,
      fill: !enabled ? "#f7f8fa" : active ? fill : "#ffffff",
      stroke: !enabled ? "#d8dde3" : active ? stroke : "#d5dbe1",
      "stroke-width": active ? 4 : 2.5,
      opacity: enabled ? 1.0 : 0.58
    }));
    const t1 = elt("text", {
      x: x + w / 2, y: y + 40, "text-anchor": "middle",
      "font-family": "Lato, sans-serif", "font-size": 24, "font-weight": 700,
      fill: enabled ? (active ? "#222" : "#4b5560") : "#8b949d"
    });
    t1.textContent = title;
    svg.appendChild(t1);

    const lines = sub.split("\n");
    lines.forEach((line, idx) => {
      const t = elt("text", {
        x: x + w / 2, y: y + 82 + idx * 26, "text-anchor": "middle",
        "font-family": "Source Code Pro, monospace", "font-size": 18,
        fill: enabled ? (active ? "#333" : "#6a727a") : "#98a0a8"
      });
      t.textContent = line;
      svg.appendChild(t);
    });
  }

  function arrow(svg, x1, y1, x2, y2, active, enabled) {
    svg.appendChild(elt("line", {
      x1, y1, x2, y2,
      stroke: !enabled ? "#e0e4e8" : active ? "#5a6672" : "#c4cad1",
      "stroke-width": active ? 7 : 5, "stroke-linecap": "round"
    }));
    svg.appendChild(elt("polygon", {
      points: `${x2},${y2} ${x2 - 14},${y2 - 8} ${x2 - 14},${y2 + 8}`,
      fill: !enabled ? "#e0e4e8" : active ? "#5a6672" : "#c4cad1"
    }));
  }

  function draw(svg, stageIdx, toggles) {
    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 1160 360");

    const boxes = [
      { x: 20, y: 80, w: 180, h: 170, title: "Syndrome", sub: "Y_syn\nM x 2" , fill: "#fff4e8", stroke: "#BF5700", enabled: true},
      { x: 245, y: 80, w: 180, h: 170, title: "Logical prior", sub: toggles.logical ? "MLP(s)\nclass logits" : "muted\nlogical branch", fill: "#f7efe3", stroke: "#8c5a00", enabled: toggles.logical},
      { x: 470, y: 80, w: 220, h: 170, title: "Dual streams", sub: toggles.logical ? "syndrome tokens\nlogical tokens" : "syndrome tokens\n(no logical tokens)", fill: "#eef4ff", stroke: "#4f6fad", enabled: true},
      { x: 735, y: 80, w: 180, h: 170, title: "Qubit head", sub: "H^T pooling\n2N logits", fill: "#eef7f3", stroke: "#3c7d5d", enabled: true},
      { x: 960, y: 80, w: 180, h: 170, title: "CPND", sub: toggles.cpnd ? "parity + logical\nprojection" : "disabled\nraw logits only", fill: "#f5f3fb", stroke: "#6f55a5", enabled: toggles.cpnd}
    ];

    boxes.forEach((b, idx) => box(svg, b.x, b.y, b.w, b.h, b.title, b.sub, idx === stageIdx, b.enabled, b.fill, b.stroke));
    arrow(svg, 200, 165, 235, 165, stageIdx >= 1, true);
    arrow(svg, 425, 165, 460, 165, stageIdx >= 2, toggles.logical);
    arrow(svg, 690, 165, 725, 165, stageIdx >= 3, true);
    arrow(svg, 915, 165, 950, 165, stageIdx >= 4, toggles.cpnd);

    if (stageIdx >= 2 && toggles.logical) {
      svg.appendChild(elt("path", {
        d: "M 560 70 C 600 20, 700 20, 780 70",
        fill: "none", stroke: "#6f55a5", "stroke-width": 4, "stroke-dasharray": "8 8"
      }));
      const txt = elt("text", {
        x: 670, y: 34, "text-anchor": "middle",
        "font-family": "Lato, sans-serif", "font-size": 18, "font-weight": 700, fill: "#6f55a5"
      });
      txt.textContent = "shared attention / cross-attention";
      svg.appendChild(txt);
    }

    if (stageIdx >= 2) {
      const txt = elt("text", {
        x: 580, y: 300, "text-anchor": "middle",
        "font-family": "Lato, sans-serif", "font-size": 17, "font-weight": 700,
        fill: toggles.mask ? "#4f6fad" : "#a0a7af"
      });
      txt.textContent = toggles.mask ? "Tanner-style syndrome mask enabled" : "syndrome mask disabled";
      svg.appendChild(txt);
    }
  }

  function mount(root) {
    const svg = qs("svg", root);
    const caption = qs(".saq-caption", root);
    const buttons = root.querySelectorAll("[data-saq-stage]");
    const toggles = {
      mask: qs("[data-saq-toggle='mask']", root),
      logical: qs("[data-saq-toggle='logical']", root),
      cpnd: qs("[data-saq-toggle='cpnd']", root)
    };
    let stageIdx = 0;

    function render() {
      const state = {
        mask: toggles.mask.checked,
        logical: toggles.logical.checked,
        cpnd: toggles.cpnd.checked
      };
      draw(svg, stageIdx, state);
      caption.textContent = describe(stageIdx, state);
      buttons.forEach((btn) => {
        const active = Number(btn.dataset.saqStage) === stageIdx;
        btn.classList.toggle("btn-secondary", active);
        btn.classList.toggle("btn-outline-secondary", !active);
      });
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        stageIdx = Number(btn.dataset.saqStage);
        render();
      });
    });

    Object.values(toggles).forEach((cb) => cb.addEventListener("change", render));

    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-saq-flow]");
    if (root) mount(root);
  });
})();
