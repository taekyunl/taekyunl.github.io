"use strict";
// Transcribed from the camera-ready appendix TikZ sources on September 28, 2026.
// Each row preserves both the original hexadecimal labels and the figure's colors.
// G = correct, R = incorrect, M = masked. Only the five published checkpoints exist.
const decodingTraces = {
  steps: [0, 1, 4, 7, 12],
  truth: ["3B 20 3D 23 14 3F 1E 36 18 6 3A 37", "1D 3F 17 14 F 36 23 F 2B 13 D 12"],
  cider: {
    source: "proposed_inference_v2_camera_ready.tikz",
    frames: [
      {values:["-- -- -- -- -- -- -- -- -- -- -- --","-- -- -- -- -- -- -- -- -- -- -- --"],states:["MMMMMMMMMMMM","MMMMMMMMMMMM"]},
      {values:["-- -- -- -- -- -- -- -- -- -- -- --","-- -- -- -- -- -- -- -- -- 13 -- --"],states:["MMMMMMMMMMMM","MMMMMMMMMGMM"]},
      {values:["-- -- -- -- 14 -- -- -- -- -- -- --","-- -- 17 -- -- -- -- -- 2B 13 D --"],states:["MMMMGMMMMMMM","MMGMMMMMGGGM"]},
      {values:["3B -- -- 23 14 -- -- 36 18 -- 3A 37","1D -- 17 -- F -- -- F 2B 13 D 12"],states:["GMMGGMMGGMGG","GMGMGMMGGGGG"]},
      {values:["3B 20 3D 23 14 3F 1E 36 18 6 3A 37","1D 3F 17 14 F 36 23 F 2B 13 D 12"],states:["GGGGGGGGGGGG","GGGGGGGGGGGG"]}
    ]
  },
  mdd: {
    source: "dit_inference_v2_camera_ready.tikz",
    name: "Generic masked diffusion", module: "DiT denoiser",
    summary: "The generic denoiser fills the grid, but many symbols end up in the wrong message.",
    frames: [
      {values:["-- -- -- -- -- -- -- -- -- -- -- --","-- -- -- -- -- -- -- -- -- -- -- --"],states:["MMMMMMMMMMMM","MMMMMMMMMMMM"]},
      {values:["-- -- -- -- -- 3F -- -- -- -- -- --","-- -- -- -- -- -- -- -- -- -- -- --"],states:["MMMMMGMMMMMM","MMMMMMMMMMMM"]},
      {values:["3B -- -- -- -- 3F -- -- -- -- -- 12","1D -- -- -- -- -- -- -- -- -- -- 37"],states:["GMMMMGMMMMMR","GMMMMMMMMMMR"]},
      {values:["3B 3F 3D 14 -- 3F -- -- 18 6 -- 12","1D -- 17 23 -- 36 -- -- 18 6 -- 37"],states:["GRGRMGMMGGMR","GMGRMGMMRRMR"]},
      {values:["3B 3F 3D 14 14 3F 23 F 18 6 D 12","1D 3F 17 23 14 36 1E 36 18 6 D 37"],states:["GRGRGGRRGGRR","GGGRRGRRRRGR"]}
    ]
  },
  noDemixing: {
    source: "no_slot_inference_v2_camera_ready.tikz",
    name: "Without demixing", module: "Module B only",
    summary: "Without row competition, both rows repeatedly claim the same slot symbols. The two final rows share 8 of their 12 symbols in this example.",
    frames: [
      {values:["-- -- -- -- -- -- -- -- -- -- -- --","-- -- -- -- -- -- -- -- -- -- -- --"],states:["MMMMMMMMMMMM","MMMMMMMMMMMM"]},
      {values:["-- -- -- -- -- -- -- -- -- -- -- --","-- -- -- -- -- -- -- -- -- 13 -- --"],states:["MMMMMMMMMMMM","MMMMMMMMMGMM"]},
      {values:["-- -- -- -- -- 3F -- -- -- 13 D --","-- -- -- -- -- -- -- -- -- 13 D --"],states:["MMMMMGMMMRRM","MMMMMMMMMGGM"]},
      {values:["3B 3F 3D 23 -- -- -- -- 18 13 D --","3B 3F 3D 14 -- 3F -- -- 18 13 D --"],states:["GRGGMMMMGRRM","RGRGMRMMRGGM"]},
      {values:["3B 3F 3D 23 14 36 23 36 18 13 D 37","3B 3F 3D 14 14 3F 35 F 18 13 D 37"],states:["GRGGGRRGGRRG","RGRGRRRGRGGR"]}
    ]
  },
  noParity: {
    source: "no_mp_inference_v2_camera_ready.tikz",
    name: "Without parity propagation", module: "Module A only",
    summary: "Row competition separates the candidates, but they are assembled inconsistently. At step 12, slots 2, 6, 7, 8, and 11 are swapped between the two messages.",
    frames: [
      {values:["-- -- -- -- -- -- -- -- -- -- -- --","-- -- -- -- -- -- -- -- -- -- -- --"],states:["MMMMMMMMMMMM","MMMMMMMMMMMM"]},
      {values:["-- -- -- -- -- -- -- -- -- 6 -- --","-- -- -- -- -- -- -- -- -- -- -- --"],states:["MMMMMMMMMGMM","MMMMMMMMMMMM"]},
      {values:["-- -- 3D -- -- -- -- -- -- 6 -- --","-- -- 17 -- -- 3F -- -- -- 13 -- --"],states:["MMGMMMMMMGMM","MMGMMRMMMGMM"]},
      {values:["-- 3F 3D -- 14 36 -- -- -- 6 D 37","1D -- 17 -- F 3F -- 36 -- 13 3A 12"],states:["MRGMGRMMMGRG","GMGMGRMRMGRG"]},
      {values:["3B 3F 3D 23 14 36 23 F 18 6 D 37","1D 20 17 14 F 3F 1E 36 2B 13 3A 12"],states:["GRGGGRRRGGRG","GRGGGRRRGGRG"]}
    ]
  }
};
