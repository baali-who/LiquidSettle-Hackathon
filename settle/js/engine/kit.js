/**
 * LiquidSettle's components (Iteration 59) — framework-free, CSP-clean (no inline style: sizes go through
 * the CSSOM with el.style.setProperty), every class `es-`. Drawn to the Figma frames "LiquidSettle v3 · Desktop 1440".
 *
 *   icons · money (the RL mark) · time · pills and stamps · buttons · the stepper · the progress strip · the LTV meter
 *   (interactive) · the price chart · toasts · the modal and the drawer frames · a poller
 */
import { h, markup } from "../ui.js";

export { h };

// ── icons ─────────────────────────────────────────────────────────────────────────
function svg(inner, { size = 18, width = 1.9, fill = "none", cls = "" } = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  el.setAttribute("width", size); el.setAttribute("height", size); el.setAttribute("viewBox", "0 0 24 24");
  el.setAttribute("fill", fill); el.setAttribute("stroke", "currentColor"); el.setAttribute("stroke-width", width);
  el.setAttribute("stroke-linecap", "round"); el.setAttribute("stroke-linejoin", "round"); el.setAttribute("aria-hidden", "true");
  if (cls) el.setAttribute("class", cls);
  markup(el, inner);
  return el;
}
export const I = {
  bar: (o) => svg('<path d="M4.5 17.5h15l-2.6-8.5H7.1z"/><path d="M8.6 9l1-3.2h4.8l1 3.2"/>', o),
  lock: (o) => svg('<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', o),
  unlock: (o) => svg('<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/>', o),
  truck: (o) => svg('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/>', o),
  check: (o) => svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', { width: 2.4, ...o }),
  bell: (o) => svg('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>', o),
  search: (o) => svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', o),
  chevron: (o) => svg('<path d="M6 9l6 6 6-6"/>', o),
  right: (o) => svg('<path d="M9 6l6 6-6 6"/>', o),
  arrow: (o) => svg('<path d="M5 12h14M13 6l6 6-6 6"/>', { width: 2.1, ...o }),
  back: (o) => svg('<path d="M19 12H5M11 6l-6 6 6 6"/>', { width: 2.1, ...o }),
  ext: (o) => svg('<path d="M14 5h5v5M19 5l-8 8"/><path d="M18 14v5H5V6h5"/>', o),
  info: (o) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', o),
  warn: (o) => svg('<path d="M12 3.8 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 17h.01"/>', o),
  ban: (o) => svg('<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>', { width: 2.2, ...o }),
  link: (o) => svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', o),
  list: (o) => svg('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>', o),
  plus: (o) => svg('<path d="M12 5v14M5 12h14"/>', { width: 2.2, ...o }),
  minus: (o) => svg('<path d="M5 12h14"/>', { width: 2.2, ...o }),
  x: (o) => svg('<path d="M6 6l12 12M18 6 6 18"/>', { width: 2, ...o }),
  wallet: (o) => svg('<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1z"/><path d="M4 7V6a2 2 0 0 1 2-2h10v3"/><path d="M16 13.5h.01"/>', o),
  bank: (o) => svg('<circle cx="12" cy="12" r="8.5"/><path d="M10 16V8h3a2 2 0 0 1 0 4h-3M13 12l2.5 4"/>', o),
  card: (o) => svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>', o),
  clock: (o) => svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', o),
  shield: (o) => svg('<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>', o),
  flow: (o) => svg('<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 6h7.6M18 8.2v7.6M7.6 7.6l8.8 8.8"/>', o),
  play: (o) => svg('<path d="M8 5.5v13l10.5-6.5z"/>', o),
  vault: (o) => svg('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="3.4"/><path d="M12 8.6v1.1M12 14.3v1.1M8.6 12h1.1M14.3 12h1.1"/>', o),
  coins: (o) => svg('<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7"/><path d="M9.5 16.3c.9.1 1.5.2 2.5.2 3 0 5.5-1.1 5.5-2.5v-4"/><path d="M14.5 9.7c1.7.3 3 1.1 3 2"/>', o),
  chart: (o) => svg('<path d="M4 19h16"/><path d="M5 15l4-4 3 3 6-7"/>', o),
  sun: (o) => svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', o),
  moon: (o) => svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', o),
  door: (o) => svg('<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>', o),
  compass: (o) => svg('<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>', o),
  layers: (o) => svg('<path d="M12 4 3 9l9 5 9-5z"/><path d="M3 14l9 5 9-5"/>', o),
  node: (o) => svg('<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M8 7h.01M8 17h.01"/>', o),
  scan: (o) => svg('<path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/><path d="M7 12h10"/>', o),
};

// ── money and numbers ────────────────────────────────────────────────────────────
const nf2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export const n2 = (v) => nf2.format(Number(v) || 0);
export const n0 = (v) => nf0.format(Math.round(Number(v) || 0));
export const grams = (v) => nf0.format(Number(v) || 0) + " g";
export const kg = (v) => (Number(v) / 1000).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";
export function rl(cls = "es-cur") { return h("span", { class: cls }, h("span", { class: "es-rl" }, "RL"), "USD"); }
/** The currency in running text: a small RL, USD at the text's own size. */
export function rlt() { return rl("es-cur t"); }
/** 600,000 + the currency with its small RL mark — the house style; the eight letters never stand alone. */
export function money(v, { dec = 0, cur = true, cls = "" } = {}) {
  return h("span", { class: ("es-num " + cls).trim() }, dec ? n2(v) : n0(v), cur ? rl() : null);
}
export function inlineMoney(v, dec = 0) { return h("span", { class: "es-num" }, (dec ? n2(v) : n0(v)) + " ", h("span", { class: "es-rl" }, "RL"), "USD"); }
export const pct = (v, d = 0) => (Number(v) || 0).toFixed(d) + "%";
export const short = (s, a = 4, b = 4) => (s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : s || "");

// ── time (the viewer's own clock) ───────────────────────────────────────────────
export const time = {
  hm: (iso) => (iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""),
  day: (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""),
  long: (d = new Date()) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
  dayTime: (iso) => (iso ? `${new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · ${time.hm(iso)}` : ""),
  /** Today → 14:05; earlier → 9 Oct. */
  updated(iso) {
    if (!iso) return "";
    const d = new Date(iso), now = new Date();
    return d.toDateString() === now.toDateString() ? time.hm(iso) : time.day(iso);
  },
  ago(iso) {
    if (!iso) return "";
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    return Math.floor(s / 86400) + " d ago";
  },
  mmss: (s) => Math.floor(s / 60) + ":" + String(Math.max(0, s) % 60).padStart(2, "0"),
};

// ── pills, stamps, tiles ─────────────────────────────────────────────────────────
const PILL_TONE = { LIVE: "ok", "OWN NODE": "own", REFUSED: "bad", NOTE: "muted", SIMULATED: "info", DONE: "ok", MISSING: "bad", LEFT: "info",
  "ACCEPT PENDING": "warn", SAFE: "ok", PLEDGED: "own", LOCKED: "own", RELEASED: "ok", REFUNDED: "muted", TESTNET: "info", SAMPLE: "muted" };
export function pill(label, tone = null, { size = "", live = false, cls = "" } = {}) {
  const t = tone || PILL_TONE[label] || "info";
  return h("span", { class: `es-pill ${t} ${size} ${live ? "live" : ""} ${cls}`.replace(/\s+/g, " ").trim() }, label);
}
export function stamp(code, { big = false } = {}) {
  const c = String(code || "");
  const tone = c === "tesSUCCESS" ? "ok" : c === "tecPLEDGED" ? "own" : "bad";
  return h("span", { class: `es-stamp ${tone} ${big ? "big" : ""}`.trim() },
    c === "tesSUCCESS" ? I.check({ size: 14 }) : c === "tecPLEDGED" ? I.link({ size: 14 }) : big ? null : I.ban({ size: 14 }), c);
}
export function tile(iconFn, tone = "green", size = "") { return h("span", { class: `es-tile ${tone} ${size}`.trim() }, iconFn({ size: size === "lg" ? 26 : size === "sm" ? 16 : 19 })); }

// ── buttons ──────────────────────────────────────────────────────────────────────
export function btn(label, { kind = "", onclick = null, href = null, icon = null, iconRight = null, size = "", attrs = {} } = {}) {
  const cls = `es-btn ${kind} ${size}`.replace(/\s+/g, " ").trim();
  const kids = [icon ? icon({ size: 16 }) : null, label, iconRight ? iconRight({ size: 16 }) : null];
  if (href) return h("a", { class: cls, href, ...attrs }, ...kids);
  return h("button", { type: "button", class: cls, onclick, ...attrs }, ...kids);
}
/** Run an async handler with the button busy; errors come back as a toast. */
export async function busy(el, fn) {
  el.classList.add("busy");
  try { return await fn(); } catch (e) { toast(String((e && e.message) || e), "bad"); return null; } finally { el.classList.remove("busy"); }
}

// ── the stepper and the progress strip ───────────────────────────────────────────
export function stepper(steps, { running = false } = {}) {
  const el = h("ol", { class: "es-stepper", "aria-label": "Where this deal is" },
    steps.map((s) => h("li", { class: `es-step ${s.state} ${running && (s.state === "now" || s.state === "failed") ? "running" : ""}`.trim(), "aria-current": s.state === "now" ? "step" : null },
      h("span", { class: "es-node" }, s.state === "done" ? I.check({ size: 15 }) : String(s.n)),
      h("b", {}, s.label), h("small", {}, s.who || ""))));
  el.style.setProperty("--n", String(steps.length));
  return el;
}
export function progress(states, { loan = false } = {}) {
  return h("span", { class: "es-prog" + (loan ? " lv" : ""), "aria-hidden": "true" }, states.map((s) => h("i", { class: s })));
}

// ── the LTV meter (40–100 % scale; rungs 60 max · 70 notify · 75 top-up · 80 impair · 85 sale) ──────────
const LO = 40, HI = 100;
export const meterPos = (ltv) => Math.max(0, Math.min(100, ((Number(ltv) - LO) / (HI - LO)) * 100));
const RUNGS = [[60, "max"], [70, "notify"], [75, "top-up"], [80, "impair"], [85, "sale"]];
/**
 * The meter: a solid pin at `ltv`, an optional faded pin at `ghost` (after a payment), an optional blue pin at
 * `whatIf`. `onPick(ltv)` makes it interactive: a click or a drag anywhere on the bar asks "what if the loan were at
 * this LTV?" (the caller turns it into a price). Keyboard: ← → move by one point.
 */
export function meter({ ltv, ghost = null, whatIf = null, onPick = null, label = "Loan-to-value" } = {}) {
  const pins = { now: h("span", { class: "es-pin" }), ghost: h("span", { class: "es-pin ghost" }), what: h("span", { class: "es-pin whatif" }) };
  const bar = h("div", { class: "es-meter", role: onPick ? "slider" : "img", "aria-label": label, tabindex: onPick ? "0" : null,
    "aria-valuemin": String(LO), "aria-valuemax": String(HI) },
  RUNGS.map(([v]) => { const t = h("span", { class: "es-tick" }); t.style.left = meterPos(v) + "%"; return t; }), pins.ghost, pins.what, pins.now);
  const ticks = h("div", { class: "es-meter-ticks", "aria-hidden": "true" }, RUNGS.map(([v]) => { const s = h("span", {}, String(v)); s.style.left = meterPos(v) + "%"; return s; }));
  const names = h("div", { class: "es-meter-names", "aria-hidden": "true" }, RUNGS.map(([v, n]) => { const s = h("span", {}, n); s.style.left = meterPos(v) + "%"; return s; }));
  const el = h("div", { class: "es-meter-wrap" }, ticks, bar, names);
  function set({ ltv: l = ltv, ghost: g = ghost, whatIf: w = whatIf } = {}) {
    ltv = l; ghost = g; whatIf = w;
    pins.now.style.left = meterPos(ltv) + "%";
    pins.ghost.hidden = ghost === null || ghost === undefined; if (!pins.ghost.hidden) pins.ghost.style.left = meterPos(ghost) + "%";
    pins.what.hidden = whatIf === null || whatIf === undefined; if (!pins.what.hidden) pins.what.style.left = meterPos(whatIf) + "%";
    bar.setAttribute("aria-valuenow", String(Math.round(whatIf ?? ltv)));
  }
  set();
  if (onPick) {
    const pick = (clientX) => { const r = bar.getBoundingClientRect(); const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width)); onPick(LO + p * (HI - LO)); };
    let drag = false;
    bar.addEventListener("pointerdown", (e) => { drag = true; bar.setPointerCapture(e.pointerId); pick(e.clientX); });
    bar.addEventListener("pointermove", (e) => { if (drag) pick(e.clientX); });
    bar.addEventListener("pointerup", () => { drag = false; });
    bar.addEventListener("keydown", (e) => {
      const cur = whatIf ?? ltv;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onPick(Math.min(HI, cur + 1)); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onPick(Math.max(LO, cur - 1)); }
    });
  }
  el.set = set;
  return el;
}

// ── the price chart (an inline SVG, no library) ─────────────────────────────────
export function chart(points, { base = null, whatIf = null, height = 160 } = {}) {
  const W = 880, H = height, P = 6;
  const ns = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(ns, "svg");
  el.setAttribute("viewBox", `0 0 ${W} ${H}`); el.setAttribute("preserveAspectRatio", "none"); el.setAttribute("class", "es-chart"); el.setAttribute("role", "img");
  const vals = points.map((p) => Number(p.price));
  if (base !== null) vals.push(Number(base));
  if (whatIf !== null) vals.push(Number(whatIf));
  const max = Math.max(...vals, 1) * 1.04, min = Math.min(...vals, max) * 0.94;
  const y = (v) => P + (H - 2 * P) * (1 - (v - min) / (max - min || 1));
  const n = Math.max(points.length, 2) + (whatIf !== null ? 1 : 0);   // a what-if sits one step to the right
  const x = (i) => P + ((W - 2 * P) * i) / (n - 1);
  const pts = points.length >= 2 ? points : [points[0] || { price: base || 0 }, points[0] || { price: base || 0 }];
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(Number(p.price)).toFixed(1)}`).join(" ");
  markup(el, `<defs><linearGradient id="es-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5CC898" stop-opacity=".28"/><stop offset="1" stop-color="#5CC898" stop-opacity="0"/></linearGradient></defs>`);
  const add = (tag, attrs) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); el.appendChild(e); return e; };
  if (base !== null) add("line", { class: "base", x1: P, x2: W - P, y1: y(base), y2: y(base) });
  add("path", { class: "area", d: `${d} L${x(pts.length - 1)},${H} L${x(0)},${H} Z` });
  add("path", { class: "line", d });
  const last = pts[pts.length - 1];
  add("circle", { class: "dot", cx: x(pts.length - 1), cy: y(Number(last.price)), r: 4.5 });
  if (whatIf !== null) {
    add("path", { class: "whatif", d: `M${x(pts.length - 1)},${y(Number(last.price))} L${W - P},${y(whatIf)}` });
    add("circle", { class: "wdot", cx: W - P, cy: y(whatIf), r: 4.5 });
  }
  el.setAttribute("aria-label", `Au price, ${pts.length} publications, last ${n2(last.price)}`);
  return el;
}

// ── toasts ───────────────────────────────────────────────────────────────────────
export function toast(title, tone = "", { sub = "", href = null, ms = 5200 } = {}) {
  let box = document.querySelector(".es-toasts");
  if (!box) { box = h("div", { class: "es-toasts", role: "status", "aria-live": "polite" }); document.body.appendChild(box); }
  const card = h("div", { class: `es-toast-card ${tone}`.trim() },
    h("span", { class: "es-ok-dot" }, tone === "bad" ? I.x({ size: 14 }) : I.check({ size: 14 })),
    h("div", {}, h("b", {}, typeof title === "string" ? mark(title) : title), sub ? h("small", {}, typeof sub === "string" ? mark(sub) : sub) : null),
    href ? h("a", { href, target: href.startsWith("http") ? "_blank" : null, rel: "noopener" }, "View") : h("span"));
  box.appendChild(card);
  setTimeout(() => card.remove(), ms);
  return card;
}

// ── modal and drawer frames ─────────────────────────────────────────────────────
export function overlay(panel, { onClose } = {}) {
  const scrim = h("div", { class: "es-scrim", onclick: () => close() });
  const prev = document.activeElement;
  function close() { scrim.remove(); panel.remove(); document.removeEventListener("keydown", esc); if (onClose) onClose(); if (prev && prev.focus) prev.focus(); }
  function esc(e) { if (e.key === "Escape") close(); }
  document.addEventListener("keydown", esc);
  document.body.append(scrim, panel);
  const first = panel.querySelector("input, button, [tabindex]");
  if (first) first.focus({ preventScroll: true });
  return close;
}

/** A poller the router stops when the screen changes. */
export function poll(fn, ms, leave) {
  let t = null, stopped = false;
  const tick = async () => { if (stopped) return; try { await fn(); } catch (e) { /* the next tick tries again */ } if (!stopped) t = setTimeout(tick, ms); };
  t = setTimeout(tick, ms);
  const stop = () => { stopped = true; clearTimeout(t); };
  if (leave) leave(stop);
  return stop;
}

/** replaceChildren that flattens arrays and drops null / false / undefined (a bare null would print "null"). */
export function put(el, ...kids) {
  el.replaceChildren(...kids.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false && k !== "")
    .map((k) => (typeof k === "string" || typeof k === "number" ? document.createTextNode(String(k)) : k)));
  return el;
}

const CUR = new RegExp("\\{RL\\}|RL" + "USD", "g");
/** Text with the currency as the mark: "{RL}" in the app's own copy, and the eight letters in a document's sentences. */
export function mark(text) {
  const parts = String(text ?? "").split(CUR);
  return parts.flatMap((p, i) => (i ? [rlt(), p] : [p])).filter((x) => x !== "");
}

/** "David" from "David Quartz". */
export const first = (name) => String(name || "").split(" ")[0] || "Customer";
