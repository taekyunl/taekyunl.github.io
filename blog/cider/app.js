"use strict";
const traceTruth = decodingTraces.truth.map(row => row.split(" "));
const shownSymbols = [...new Set(traceTruth.flat())].sort((a,b) => parseInt(a,16) - parseInt(b,16));
const uraColors = new Map(shownSymbols.map((symbol,index) => [symbol, `hsl(${Math.round(index * 360 / shownSymbols.length)} 72% ${index % 2 ? 76 : 66}%)`]));
document.querySelectorAll("[data-ura-row]").forEach(container => {
  const row = traceTruth[Number(container.dataset.uraRow)];
  container.innerHTML = row.map(symbol => `<span class="ura-symbol" style="background-color:${uraColors.get(symbol)}">${symbol}</span>`).join("");
});
document.querySelectorAll("[data-packet-row]").forEach(packet => {
  const row = traceTruth[Number(packet.dataset.packetRow)];
  const y = packet.dataset.packetRow === "0" ? 28 : 124;
  packet.innerHTML = row.map((symbol, slot) => `<rect x="${2 + slot * 4}" y="${y}" width="4" height="12" style="fill:${uraColors.get(symbol)}"/>`).join("");
});
const traceStateNames = {G:"Correct", R:"Incorrect", M:"Masked", B:"Ground truth"};
const traceStateClasses = {G:"correct", R:"incorrect", M:"masked", B:"reference"};
let traceIndex = 2;
let traceModel = "mdd";
let traceTimer = null;
let traceSelection = null;
const traceSlider = document.getElementById("trace-step");
const tracePlayButton = document.getElementById("trace-play");

function traceGrid(frame, model) {
  const modelName = model === "truth" ? "Ground truth" : model === "cider" ? "CIDER" : decodingTraces[model].name;
  const headings = `<div class="trace-slot-numbers"><span>Slot</span>${Array.from({length:12},(_,slot)=>`<span>${slot+1}</span>`).join("")}</div>`;
  return headings + frame.values.map((row,r) => `<div class="trace-row"><span class="trace-row-label">Row ${r+1}</span><div class="trace-cells">${row.split(" ").map((value,slot) => {
    const state = frame.states[r][slot];
    const label = `${modelName}, row ${r+1}, slot ${slot+1}: ${value === "--" ? "masked" : `${value}, ${traceStateNames[state].toLowerCase()}`}`;
    return `<button type="button" class="trace-cell trace-${traceStateClasses[state]}" data-trace-cell="${model}" data-row="${r}" data-slot="${slot}" aria-label="${label}" title="${label}" aria-pressed="false"><span>${value === "--" ? "·" : value}</span></button>`;
  }).join("")}</div></div>`).join("");
}

function traceStats(frame) {
  const states = frame.states.join("");
  const count = state => [...states].filter(value => value === state).length;
  return `<span>${count("G")} correct</span><span>${count("R")} incorrect</span><span>${count("M")} masked</span>`;
}

function stopTrace() {
  clearInterval(traceTimer);
  traceTimer = null;
  tracePlayButton.textContent = traceIndex === 4 ? "↺ Replay" : "▶ Play";
  tracePlayButton.setAttribute("aria-label",traceIndex === 4 ? "Replay recorded decoding" : "Play recorded decoding");
}

function inspectTrace() {
  document.querySelectorAll("[data-trace-cell]").forEach(cell => {
    const selected = traceSelection && Number(cell.dataset.slot) === traceSelection.slot;
    cell.classList.toggle("trace-selected-slot",Boolean(selected));
    cell.setAttribute("aria-pressed",String(Boolean(selected && Number(cell.dataset.row) === traceSelection.row && cell.dataset.traceCell === traceSelection.model)));
  });
  const inspector = document.getElementById("trace-inspector");
  if (!traceSelection) {
    inspector.hidden = true;
    inspector.textContent = "";
    return;
  }
  inspector.hidden = false;
  const {row,slot} = traceSelection;
  const model = traceSelection.model === "baseline" ? traceModel : traceSelection.model;
  const truth = traceTruth[row][slot];
  const otherTruth = traceTruth[1-row][slot];
  if (model === "truth") {
    inspector.textContent = `Row ${row+1}, slot ${slot+1}: the transmitted symbol is ${truth}. Both decoders must recover it from the shared detector evidence.`;
    return;
  }
  const frame = decodingTraces[model].frames[traceIndex];
  const value = frame.values[row].split(" ")[slot];
  const name = model === "cider" ? "CIDER" : decodingTraces[model].name;
  let detail = value === "--" ? `This position is still masked; the transmitted symbol is ${truth}.` : value === truth ? `${value} matches the transmitted symbol.` : `${value} is incorrect; the transmitted symbol is ${truth}.`;
  if (value !== "--" && value !== truth && value === otherTruth) detail += ` It belongs to the other message at this slot.`;
  inspector.textContent = `${name}, step ${decodingTraces.steps[traceIndex]}, row ${row+1}, slot ${slot+1}: ${detail}`;
}

function showTrace(index) {
  traceIndex = Math.max(0,Math.min(4,index));
  const step = decodingTraces.steps[traceIndex];
  const baseline = decodingTraces[traceModel];
  document.getElementById("trace-cider").innerHTML = traceGrid(decodingTraces.cider.frames[traceIndex],"cider");
  document.getElementById("trace-baseline").innerHTML = traceGrid(baseline.frames[traceIndex],traceModel);
  document.getElementById("trace-cider-stats").innerHTML = traceStats(decodingTraces.cider.frames[traceIndex]);
  document.getElementById("trace-baseline-stats").innerHTML = traceStats(baseline.frames[traceIndex]);
  document.getElementById("trace-baseline-heading").textContent = baseline.name;
  document.getElementById("trace-baseline-module").textContent = baseline.module;
  document.getElementById("trace-baseline").setAttribute("aria-label",`${baseline.name} decoded codewords at step ${step}`);
  document.getElementById("trace-cider").setAttribute("aria-label",`CIDER decoded codewords at step ${step}`);
  document.getElementById("trace-step-label").textContent = `${step} / 12`;
  traceSlider.value = traceIndex;
  traceSlider.setAttribute("aria-valuetext",`Refinement step ${step} of 12, recorded checkpoint ${traceIndex+1} of 5`);
  document.getElementById("trace-prev").disabled = traceIndex === 0;
  document.getElementById("trace-next").disabled = traceIndex === 4;
  document.querySelectorAll("[data-trace-step]").forEach(button=>button.setAttribute("aria-pressed",String(Number(button.dataset.traceStep) === traceIndex)));
  document.querySelectorAll("[data-trace-model]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.traceModel === traceModel)));
  const explanations = [
    "Everything starts masked. The decoder has the same shared evidence throughout; it has to work out which symbols belong together.",
    "CIDER anchors its second row with 13 at slot 10. That first revealed symbol becomes context for the next refinement.",
    "Five symbols have been revealed by CIDER, all correct. The competing decoder can already make mistakes that later steps keep.",
    "CIDER has recovered 15 of the 24 symbols. Both rows are taking shape, with nine positions still masked.",
    `CIDER recovers both complete messages in this example. ${baseline.summary}`
  ];
  document.getElementById("trace-explanation").textContent = explanations[traceIndex];
  inspectTrace();
  if (traceIndex === 4 || traceTimer === null) stopTrace();
}

document.getElementById("trace-truth").innerHTML = traceGrid({values:decodingTraces.truth,states:["BBBBBBBBBBBB","BBBBBBBBBBBB"]},"truth");
traceSlider.addEventListener("input",()=>{stopTrace();showTrace(Number(traceSlider.value));});
document.querySelectorAll("[data-trace-step]").forEach(button=>button.addEventListener("click",()=>{stopTrace();showTrace(Number(button.dataset.traceStep));}));
document.querySelectorAll("[data-trace-model]").forEach(button=>button.addEventListener("click",()=>{
  stopTrace();
  if (traceSelection && !["cider","truth"].includes(traceSelection.model)) traceSelection.model = button.dataset.traceModel;
  traceModel = button.dataset.traceModel;
  showTrace(traceIndex);
}));
document.getElementById("trace-prev").addEventListener("click",()=>{stopTrace();showTrace(traceIndex-1);});
document.getElementById("trace-next").addEventListener("click",()=>{stopTrace();showTrace(traceIndex+1);});
tracePlayButton.addEventListener("click",()=>{
  if (traceTimer !== null) {stopTrace();return;}
  if (traceIndex === 4) showTrace(0);
  tracePlayButton.textContent = "Ⅱ Pause";
  tracePlayButton.setAttribute("aria-label","Pause recorded decoding");
  traceTimer = setInterval(()=>showTrace(traceIndex+1),1500);
});
document.querySelector(".decoding").addEventListener("click",event=>{
  const cell = event.target.closest("[data-trace-cell]");
  if (!cell) return;
  traceSelection = {row:Number(cell.dataset.row),slot:Number(cell.dataset.slot),model:cell.dataset.traceCell};
  inspectTrace();
});
document.addEventListener("visibilitychange",()=>{if (document.hidden) stopTrace();});
const benchmarks={
  12:{cider:[2.15,.0073],sic:[7.29,.0078],fft:[12.38,.0078]},
  18:{cider:[4.77,.0013],sic:[14.95,.0081],fft:[27.18,.0081]},
  24:{cider:[6.71,.0053],sic:[89.81,.0076],fft:[162.83,.0076]},
  48:{cider:[18.31,.0270],sic:[914.15,.2680],fft:[1687.95,.2680]}
};
const methodNames={cider:"CIDER",sic:"SIC-BP",fft:"FFT-BP"};
function showBenchmark(length){
  const data=benchmarks[length];
  const max=Math.max(...Object.values(data).map(row=>row[0]));
  document.getElementById("latency-bars").innerHTML=Object.entries(data).map(([key,row])=>`<div class="latency-row"><div class="bar-label"><span>${methodNames[key]}</span><span>${row[0].toFixed(2)} ms</span></div><div class="bar-track"><div class="bar-fill ${key==="cider"?"teal":""}" style="width:${100*row[0]/max}%"></div></div></div>`).join("");
  document.getElementById("benchmark-table").innerHTML=Object.entries(data).map(([key,row])=>`<tr class="${key==="cider"?"highlight":""}"><th scope="row">${methodNames[key]}</th><td>${(100*row[1]).toFixed(2)}%</td><td>${row[0].toFixed(2)}</td></tr>`).join("");
  document.getElementById("speedup").textContent=`${(data.fft[0]/data.cider[0]).toFixed(1)}×`;
  document.getElementById("benchmark-summary").textContent=`lower latency than FFT-BP at L = ${length}, with ${(100*data.cider[1]).toFixed(2)}% CER for CIDER versus ${(100*data.fft[1]).toFixed(2)}% for FFT-BP.`;
  document.querySelectorAll("[data-length]").forEach(button=>button.setAttribute("aria-pressed",String(Number(button.dataset.length)===length)));
}
document.querySelectorAll("[data-length]").forEach(button=>button.addEventListener("click",()=>showBenchmark(Number(button.dataset.length))));
showTrace(2);
showBenchmark(12);

const uraFigure = document.getElementById("ura-figure");
const uraReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let uraTimers = [];
function playURA() {
  uraTimers.forEach(clearTimeout);
  uraTimers = [];
  if (uraReducedMotion.matches) {
    uraFigure.dataset.stage = "output";
    return;
  }
  uraFigure.dataset.stage = "idle";
  for (const [delay,stage] of [[120,"transmit"],[1550,"mixture"],[2750,"output"]]) {
    uraTimers.push(setTimeout(() => { uraFigure.dataset.stage = stage; }, delay));
  }
}
document.getElementById("ura-replay").addEventListener("click",playURA);
if (uraReducedMotion.matches) {
  uraFigure.dataset.stage = "output";
} else {
  uraFigure.dataset.stage = "idle";
  if ("IntersectionObserver" in window) {
    const uraObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        uraObserver.disconnect();
        playURA();
      }
    }, {threshold:.35});
    uraObserver.observe(uraFigure);
  } else {
    playURA();
  }
}
