---
layout: default
title: "Quantum Error Correction, Surface Codes, and Toric Codes"
navbar_title: Blog
container_class: container-lg
permalink: /blog/quantum-ecc-primer/
summary: "A visual introduction to why quantum error correction matters, and how surface and toric codes organize qubits, stabilizers, and logical information."
date: 2026-04-03 12:00:00 -0500
---

<div class="row mt-2">
  <div class="col-lg-10 mx-auto">
    <div class="card border-0 shadow-sm rounded-xl qecc-blog-hero mb-4">
      <div class="card-body p-4 p-md-5">
        <p class="text-uppercase small mb-2 qecc-kicker">Quantum Error Correction</p>
        <h1 class="mb-3">Quantum error correction, without the mystery wall.</h1>
        <p class="lead mb-0">
          Quantum computers do not fail because one gate is slightly noisy. They fail because small errors keep accumulating.
          Quantum error correction is the idea of storing one fragile logical qubit inside a larger, redundant physical system,
          then repeatedly checking for error syndromes without directly measuring the logical state itself.
        </p>
      </div>
    </div>

    <div class="qecc-prose">
      <h2>The alphabet first: $I, X, Y, Z$</h2>
      <p>
        Before talking about codes, it helps to name the objects that errors are built from. A single-qubit Pauli error lives in the set
        $\{I, X, Y, Z\}$:
      </p>
      $$
      I=\begin{bmatrix}1&0\\0&1\end{bmatrix},\quad
      X=\begin{bmatrix}0&1\\1&0\end{bmatrix},\quad
      Y=\begin{bmatrix}0&-i\\i&0\end{bmatrix},\quad
      Z=\begin{bmatrix}1&0\\0&-1\end{bmatrix}.
      $$
      <p>
        On the Bloch sphere, $X$, $Y$, and $Z$ correspond to flips around different axes. In a many-qubit system, a physical error is a tensor product
        $E = E_1 \otimes \cdots \otimes E_N$ with each $E_j \in \{I,X,Y,Z\}$.
      </p>

      <p>
        Classical error correction works by adding redundancy to bits. Quantum error correction does something subtler:
        it spreads logical information across many physical qubits and uses carefully chosen parity-like measurements,
        called <em>stabilizer checks</em>, to detect where errors likely happened.
        Those stabilizer outcomes do not reveal the encoded quantum information, but they do reveal the <em>syndrome</em>,
        which is enough to guide a decoder.
      </p>

      <div class="card border-0 shadow-sm rounded-xl my-4">
        <div class="card-body p-4">
          <h2 class="h4 mb-3">The basic loop</h2>
          <img src="{{ '/assets/images/etc/qecc/qecc-overview.svg' | relative_url }}" alt="Overview of physical qubits, syndrome extraction, decoder, and logical recovery." class="img-fluid rounded mb-3">
          <p class="mb-0 text-muted">
            The decoder only sees syndrome information. Success means recovering the right logical state, not necessarily the exact microscopic error.
          </p>
        </div>
      </div>

      <h2>What counts as success?</h2>
      <p>
        A decoder does not need to guess the exact microscopic error pattern. In fact, many different physical errors are equivalent:
        they can have the same syndrome and act the same way on the encoded logical qubit. The real goal is to apply a correction that
        returns the system to the correct <em>logical</em> state. That is why quantum decoding is partly a pattern-recognition problem
        and partly a symmetry problem.
      </p>
      <p>
        In CSS codes, it is standard to split the error into bit-flip and phase-flip parts. If $e_X$ and $e_Z$ are the binary supports of $X$ and $Z$
        components, then syndrome extraction can be written as
      </p>
      $$
      s_X = H_Z e_X \pmod 2,\qquad
      s_Z = H_X e_Z \pmod 2.
      $$
      <p>
        This is why parity-check matrices appear so naturally in quantum decoding: they are the algebraic version of the stabilizer geometry.
      </p>

      <h2>Step 1: inspect an actual rotated surface code</h2>
      <p>
        The rotated surface code is the most common first example because its geometry is concrete. Physical qubits live on a square patch.
        Local check operators touch nearby qubits, and the boundary matters: the patch has edges, and those edges define which logical
        operators can run across the lattice. In practice, this locality is one of the reasons surface codes are so attractive.
      </p>
      <p>
        The figure below is not hand-drawn. It is generated from the same code constructors used in the decoder repository.
        The controls change the code family and distance, then redraw the qubits, stabilizers, and logical operators from actual parity-check data.
      </p>

      <div class="card border-0 shadow-sm rounded-xl my-4">
        <div class="card-body p-4">
          <h3 class="h5 mb-3">Interactive code explorer</h3>
          <div class="qecc-controls mb-3" data-qecc-explorer>
            <div class="qecc-control-row">
              <label>Family
                <select data-qecc-family class="form-control form-control-sm">
                  <option value="surface" selected>surface</option>
                  <option value="toric">toric</option>
                </select>
              </label>
              <label>Distance $d$
                <select data-qecc-distance class="form-control form-control-sm">
                  <option value="5" selected>5</option>
                </select>
              </label>
              <label class="qecc-check"><input type="checkbox" data-qecc-toggle="x" checked> show $X$ checks</label>
              <label class="qecc-check"><input type="checkbox" data-qecc-toggle="z" checked> show $Z$ checks</label>
              <label class="qecc-check"><input type="checkbox" data-qecc-toggle="logical" checked> show logicals</label>
              <label>Inspect constraint type
                <select data-qecc-check-kind class="form-control form-control-sm">
                  <option value="none" selected>none</option>
                  <option value="x">$X$ check</option>
                  <option value="z">$Z$ check</option>
                </select>
              </label>
              <label>Constraint index
                <input type="range" min="0" max="0" step="1" value="0" data-qecc-check-index class="custom-range qecc-range">
              </label>
            </div>
            <div class="qecc-meta mt-3">
              <span class="badge badge-light">family: <span data-qecc-meta="family"></span></span>
              <span class="badge badge-light">d: <span data-qecc-meta="d"></span></span>
              <span class="badge badge-light">N: <span data-qecc-meta="n"></span></span>
              <span class="badge badge-light">M<sub>X</sub>: <span data-qecc-meta="mx"></span></span>
              <span class="badge badge-light">M<sub>Z</sub>: <span data-qecc-meta="mz"></span></span>
              <span class="badge badge-light">K: <span data-qecc-meta="k"></span></span>
              <span class="badge badge-light">constructor check: <span data-qecc-meta="validation"></span></span>
              <span class="badge badge-light">selected constraint: <span data-qecc-meta="selected"></span></span>
            </div>
            <svg class="qecc-explorer-svg mt-3" aria-label="Interactive quantum code explorer"></svg>
          </div>
          <p class="mb-0 text-muted">
            For surface codes, $K=1$ and the boundaries define the logical directions. For toric codes, periodic wrap-around removes boundaries and gives $K=2$.
          </p>
          <p class="mb-0 text-muted mt-2">
            The constraint inspector highlights one actual row of $H_X$ or $H_Z$ at a time, so you can see which qubits participate in a specific stabilizer.
          </p>
        </div>
      </div>

      <h2>Step 2: compare with toric codes</h2>
      <p>
        The toric code takes the same stabilizer-code philosophy and wraps the lattice around periodic boundaries.
        Instead of a square patch with edges, imagine gluing opposite sides together until the lattice lives on a torus.
        That change removes physical boundaries and introduces two independent non-contractible directions. As a result,
        the toric code encodes two logical qubits instead of one.
      </p>
      <p>
        That extra symmetry is not just geometric decoration. It changes the decoding problem. Surface-code decoders can use the boundary structure directly.
        Toric-code decoders must respect periodicity and a larger logical space.
      </p>

      <h2>Why decoders are hard</h2>
      <p>
        Decoding is not just about local error detection. A good decoder has to reconcile local syndrome evidence with global structure.
        On small examples this can be done analytically or with combinatorial algorithms. On larger systems, or with more realistic noise,
        it becomes natural to ask whether learned decoders can discover useful structure automatically.
      </p>
      <p>
        That is the direction I am currently exploring: decoders that respect the Tanner-graph structure of quantum codes while still being flexible enough
        to model ambiguous, degenerate error patterns. This post is only a primer. I will write about the actual models, experiments, and tradeoffs later.
      </p>

      <h2>What comes next</h2>
      <p>
        The next posts will move from geometry to algorithms: syndrome extraction, logical equivalence classes, neural decoders,
        and the practical differences between surface-code and toric-code decoding.
      </p>

      <h2>SAQ in one page</h2>
      <p>
        One baseline I use is SAQ. In the current codebase, it takes the observed syndrome tensor $Y_{\mathrm{syn}} \in \mathbb{R}^{M \times 2}$,
        turns it into binary syndrome bits, embeds those syndrome checks as tokens, and simultaneously keeps a bank of logical-class tokens.
        The two streams then interact through shared attention blocks.
      </p>
      <p>
        The implementation is easiest to read as a sequence:
      </p>
      $$
      Y_{\mathrm{syn}}
      \;\rightarrow\;
      s \in \{0,1\}^M
      \;\rightarrow\;
      \text{syndrome tokens \& logical-class tokens}
      \;\rightarrow\;
      \text{attention blocks}
      \;\rightarrow\;
      \text{qubit logits}
      \;\rightarrow\;
      \text{CPND projection}.
      $$
      <p>
        The final output is not taken directly from raw logits. The implementation applies a post-processing step, CPND, that projects the symplectic
        prediction back toward parity and logical consistency. That post-processing step matters: it is part of the actual baseline behavior in the repo.
      </p>

      <div class="card border-0 shadow-sm rounded-xl my-4">
        <div class="card-body p-4">
          <h3 class="h5 mb-3">Interactive SAQ flow</h3>
          <div class="saq-flow" data-saq-flow>
            <div class="saq-stage-buttons mb-3">
              <button type="button" class="btn btn-sm btn-outline-secondary" data-saq-stage="0">1. Syndrome</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" data-saq-stage="1">2. Logical prior</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" data-saq-stage="2">3. Shared attention</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" data-saq-stage="3">4. Qubit logits</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" data-saq-stage="4">5. CPND</button>
            </div>
            <div class="saq-toggle-row mb-3">
              <label class="qecc-check"><input type="checkbox" data-saq-toggle="mask" checked> syndrome mask</label>
              <label class="qecc-check"><input type="checkbox" data-saq-toggle="logical" checked> logical tokens</label>
              <label class="qecc-check"><input type="checkbox" data-saq-toggle="cpnd" checked> CPND post-processing</label>
            </div>
            <svg class="saq-flow-svg" aria-label="Interactive SAQ principle diagram"></svg>
            <div class="saq-caption mt-3 text-muted"></div>
          </div>
          <p class="mb-0 text-muted mt-3">
            This is a principle view, not a claim that every training detail is shown. It follows the actual code path in
            <code>models/saq.py</code> and <code>saq_module.py</code>.
          </p>
        </div>
      </div>

      <h2>What I want to explain next</h2>
      <p>
        The natural follow-up is to compare why SAQ and diffusion-style decoders behave differently on surface and toric codes,
        especially when logical ambiguity and post-processing start to dominate.
      </p>

      <p class="text-muted mt-4 mb-0">
        Direct link: <code>/blog/quantum-ecc-primer/</code>
      </p>
    </div>
  </div>
</div>

<script src="{{ '/assets/js/qecc_visualizer.js' | relative_url }}"></script>
<script src="{{ '/assets/js/saq_visualizer.js' | relative_url }}"></script>
