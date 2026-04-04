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
          <img src="{{ '/assets/images/etc/qecc/qec_schematic_figure.png' | relative_url }}" alt="Overview of physical qubits, syndrome extraction, decoder, and logical recovery." class="img-fluid rounded mb-3">
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
      <p>
        The two colored check families in the figure are exactly these parity constraints. An <em>$X$ check</em> is one row of $H_X$,
        and a <em>$Z$ check</em> is one row of $H_Z$. In the explorer, when a colored region or highlighted constraint touches a set of qubits,
        that is the support of one row of the corresponding parity-check matrix.
      </p>
      <p>
        This is also why the syndrome is so useful. It is a binary signature telling us which parity constraints were violated.
        The decoder does not directly observe the logical state or the full physical error pattern. It only sees which checks flipped,
        then uses that pattern of violated constraints to infer a recovery.
      </p>

      <h2>A concrete $d=3$ rotated surface code you can simulate</h2>
      <p>
        The rotated surface code with distance $d=3$ is the smallest example that already shows the main ingredients of the decoding problem clearly.
        It gives a $3 \times 3$ patch of data qubits, so there are exactly $N=9$ data qubits, $4$ $X$ checks,
        $4$ $Z$ checks, and one encoded logical qubit $(K=1)$.
      </p>
      <p>
        It is convenient to number the data qubits row by row, from $1$ through $9$:
      </p>
      $$
      \begin{matrix}
      1 & 2 & 3 \\
      4 & 5 & 6 \\
      7 & 8 & 9
      \end{matrix}
      $$
      <p>
        With that convention, the rotated surface code can be written as the following support lists.
        Each set below is one row of $H_X$ or $H_Z$, written as the collection of qubits touched by that parity check.
      </p>
      <ul>
        <li>$X$-check supports: $\{1,2,4,5\}$, $\{5,6,8,9\}$, $\{4,7\}$, $\{3,6\}$.</li>
        <li>$Z$-check supports: $\{2,3,5,6\}$, $\{4,5,7,8\}$, $\{1,2\}$, $\{8,9\}$.</li>
        <li>Logical $X$ support: $\{1,2,3\}$.</li>
        <li>Logical $Z$ support: $\{1,4,7\}$.</li>
      </ul>
      <p>
        In matrix language, that means $H_X$ has four rows and $H_Z$ has four rows. So when I write “$4$ $X$ checks” and “$4$ $Z$ checks,”
        I literally mean four parity constraints of each type.
      </p>

      <p>
        These support lists already determine the syndrome rules:
      </p>
      <ul>
        <li>the <em>$Z$ checks</em> detect the $X$ component of the error,</li>
        <li>the <em>$X$ checks</em> detect the $Z$ component of the error.</li>
      </ul>
      <p>
        If we write the current Pauli pattern as separate binary supports $e_X, e_Z \in \{0,1\}^9$, then the syndrome relations are
        written directly from the support lists above:
      </p>
      $$
      s_X = H_Z e_X \pmod 2,\qquad
      s_Z = H_X e_Z \pmod 2.
      $$
      <p>
        In practical terms, that means:
      </p>
      <ul>
        <li>an injected <code>X</code> or the <code>X</code> part of a <code>Y</code> error flips nearby <code>Z</code>-check syndrome bits,</li>
        <li>an injected <code>Z</code> or the <code>Z</code> part of a <code>Y</code> error flips nearby <code>X</code>-check syndrome bits.</li>
      </ul>
      <p>
        This representation is useful because it gives three things at once: the visual patch, the exact check geometry, and the algebraic objects the decoder uses.
      </p>
      <p>
        If the decoder predicts a recovery $R$, the important question is not whether it guessed the exact physical error pattern.
        What matters is what remains after the recovery is applied. If the combined effect $R E$ is just the identity, or differs from it only by a stabilizer,
        then the encoded information is still the same and the recovery counts as a success. If $R E$ contains a nontrivial logical operator, then the logical state
        has changed and the recovery has failed.
      </p>
      <p>
        That is what “same logical class” means in practice. We form the residual operator $R E$ and ask whether it is trivial up to stabilizers.
        If the residual is only a stabilizer, then it acts invisibly on the encoded qubit and the logical information is unchanged. If the residual still has
        a logical $X$, logical $Z$, or another nontrivial logical component, then the logical information has changed even if the physical qubit pattern may look locally similar.
      </p>

      <div class="card border-0 shadow-sm rounded-xl my-4">
        <div class="card-body p-4">
          <h3 class="h5 mb-3">Try the full loop on a $3 \times 3$ rotated surface code</h3>
          <p>
            This toy example follows the exact $d=3$ support lists above. You can inject physical Pauli errors, watch the syndrome bits flip,
            inspect the decoder input and predicted recovery, and then check whether the final state stays in the same logical class.
          </p>
          <div class="qecc-sim" data-surface-d3-sim></div>
        </div>
      </div>

      <h2>From surface codes to toric codes</h2>
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

      <div class="card border-0 shadow-sm rounded-xl my-4">
        <div class="card-body p-4">
          <h3 class="h5 mb-3">Try the full loop on a $d=3$ toric code</h3>
          <p>
            This small periodic lattice has $18$ edge qubits, $8$ $X$ checks, $8$ $Z$ checks, and two logical qubits.
            Just like in the surface-code example, the decoder only sees syndrome bits. The difference is that the logical recovery check now has to respect
            two independent non-contractible directions instead of one.
          </p>
          <div class="qecc-sim" data-toric-d3-sim></div>
        </div>
      </div>

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

      <h2>Noise models</h2>
      <p>
        Another important axis is the noise model itself. Changing the code family is one thing; changing the physical noise model can alter the decoding problem
        just as much. The two main examples here are depolarizing noise and independent $X/Z$ noise. Circuit-level noise is conceptually important as well, but it belongs to a more elaborate setting than the one discussed in this primer.
      </p>

      <div class="table-responsive my-4">
        <table class="table table-sm table-bordered bg-white shadow-sm rounded-xl overflow-hidden">
          <thead class="thead-light">
            <tr>
              <th>Noise model</th>
              <th>What it means</th>
              <th>Repo status</th>
              <th>Why it matters for decoding</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>depolarizing</code></td>
              <td>Each qubit independently gets a Pauli error, with the non-identity mass spread symmetrically across $X$, $Y$, and $Z$.</td>
              <td>Implemented and used directly.</td>
              <td>It is the clean symmetric baseline. Good for understanding how a decoder handles generic Pauli uncertainty.</td>
            </tr>
            <tr>
              <td><code>xz_independent</code></td>
              <td>$X$ and $Z$ faults are sampled independently, so $Y$ appears only when both happen simultaneously.</td>
              <td>Implemented and used directly.</td>
              <td>Useful when bit-flip and phase-flip structure are not symmetric. It stresses whether a decoder handles CSS separation well.</td>
            </tr>
            <tr>
              <td><code>circuit-level</code></td>
              <td>Noise is attached to the syndrome-extraction circuit itself, not just to a static physical Pauli pattern.</td>
              <td>Important conceptually, but beyond the simplified setup discussed here.</td>
              <td>This is the more realistic regime, because measurement errors and fault propagation become part of the decoding problem.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        In plain terms, depolarizing noise means that each qubit independently receives a random Pauli fault with total error rate $p$.
        Independent $X/Z$ noise means that bit-flip and phase-flip components are sampled separately, with rates $p_X$ and $p_Z$.
      </p>
      <p>
        The circuit-level setting is different because the syndrome-extraction circuit itself becomes noisy. So for the purposes of this post, the honest summary is:
      </p>
      <ul>
        <li><code>depolarizing</code> and <code>xz_independent</code> are the clean static-noise examples to keep in mind.</li>
        <li><code>circuit-level</code> belongs in the broader roadmap, but it is not the focus of this introductory discussion.</li>
      </ul>

      <h2>Why I still care about better decoders</h2>
      <p>
        A natural question comes up once you read the recent literature: if a baseline such as SAQ is already close to the
        maximum-likelihood (ML) threshold, is there really much room left for a new decoder to improve?
        The short answer is yes, but the room is subtler than “move the threshold dramatically upward.”
      </p>
      <p>
        In quantum error correction, the word <em>threshold</em> usually refers to a crossover in physical error rate.
        Roughly speaking, below that crossover, increasing the code size helps drive the logical error rate down; above it, making the code larger stops helping.
        That is different from the classical coding question “for this fixed channel, what is the best BER I can possibly achieve?”
        So when someone says a decoder is close to the ML threshold, they are usually saying it already gets close to the best known
        <em>crossover point</em>, not that every finite-size logical error curve is already optimal.
      </p>
      <p>
        That distinction matters. Even if two decoders have very similar thresholds, one of them can still have noticeably better logical error rates at a fixed
        code size and a fixed physical noise level. In practice, that is often the regime people care about most. Real devices do not operate at infinite code size.
        They operate at one concrete distance, under one concrete noise model, with one concrete latency budget.
      </p>
      <p>
        That is exactly where I think MDM-style decoders can still be interesting. A structured diffusion decoder is not trying to beat the laws of the code family.
        It is trying to use the syndrome geometry more effectively at finite size, especially in regimes where degeneracy, ambiguity, and global consistency all matter at once.
        In other words, even if SAQ is already near the ML threshold for some setting, there may still be room to improve the actual logical error rate for
        physical error rates below that threshold.
      </p>
      <p>
        So the question I care about is not only “can a new decoder shift the threshold?” but also:
        for a fixed physical error rate below threshold, can it produce a lower logical error rate, a more robust recovery, or a better tradeoff between quality and computation?
        For toric codes in particular, where logical ambiguity and periodic structure are both strong, that still seems like a very meaningful target.
      </p>

      <h2>SAQ in one page</h2>
      <p>
        One useful baseline is SAQ. At a high level, it takes the observed syndrome tensor $Y_{\mathrm{syn}} \in \mathbb{R}^{M \times 2}$,
        turns it into binary syndrome bits, embeds those syndrome checks as tokens, and simultaneously keeps a bank of logical-class tokens.
        The two streams then interact through shared attention blocks.
      </p>
      <p>
        At a high level, the flow looks like this:
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
        The final output is not taken directly from raw logits. A post-processing step, CPND, projects the symplectic prediction back toward parity and logical consistency.
        That extra step matters because it helps turn a soft prediction into a recovery that is more compatible with the code constraints.
      </p>

      <div class="card border-0 shadow-sm rounded-xl my-4">
        <div class="card-body p-4">
          <h3 class="h5 mb-3">The core SAQ idea</h3>
          <div class="row">
            <div class="col-md-7">
              <ol class="mb-0 pl-3">
                <li class="mb-2">Convert observed syndrome channels into binary syndrome bits and sign-valued syndrome tokens.</li>
                <li class="mb-2">Predict a logical prior over logical classes from the syndrome.</li>
                <li class="mb-2">Run shared attention blocks where syndrome tokens interact with one another, and logical tokens cross-attend to the syndrome stream.</li>
                <li class="mb-2">Aggregate syndrome information back to qubits and predict a binary symplectic error representation.</li>
                <li>Apply CPND projection so the final prediction better respects parity and logical consistency.</li>
              </ol>
            </div>
            <div class="col-md-5">
              <div class="card bg-light border-0 rounded-xl">
                <div class="card-body">
                  <p class="mb-2"><strong>Conceptual flow</strong></p>
                  <p class="mb-1">observed syndrome → syndrome bits</p>
                  <p class="mb-1">→ logical prior + syndrome tokens</p>
                  <p class="mb-1">→ shared attention</p>
                  <p class="mb-1">→ qubit logits</p>
                  <p class="mb-0">→ CPND projection</p>
                </div>
              </div>
            </div>
          </div>
          <p class="mb-0 text-muted mt-3">
            This is the high-level idea I want to emphasize here: what information SAQ uses, how that information is organized, and why a projection step matters at the end.
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

<script src="{{ '/assets/js/surface_d3_simulator.js' | relative_url }}"></script>
<script src="{{ '/assets/js/toric_d3_simulator.js' | relative_url }}"></script>
