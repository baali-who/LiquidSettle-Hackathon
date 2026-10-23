/** Tiny DOM + formatting helpers. No innerHTML with data anywhere: text goes through textContent. */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "html") el.innerHTML = v;                  // only ever called with literal markup from this code base
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  return el;
}

export const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
export const replace = (el, ...kids) => {
  clear(el);
  for (const k of kids.flat()) {
    if (k === null || k === undefined || k === false) continue;
    el.appendChild(typeof k === "string" || typeof k === "number" ? document.createTextNode(String(k)) : k);
  }
  return el;
};

export function chip(text, kind = "") { return h("span", { class: "lq-chip " + kind }, text); }
export function dot(text, kind = "") { return h("span", { class: "lq-chip " + kind }, h("i", { class: "lq-dot", "aria-hidden": "true" }), text); }
export function btn(text, { kind = "", sm = true, onclick = null, disabled = false, title = "" } = {}) {
  return h("button", { type: "button", class: `lq-btn ${sm ? "sm" : ""} ${kind}`, onclick, disabled, title }, text);
}
export function kv(pairs) {
  return h("dl", { class: "lq-kv" }, pairs.filter(Boolean).map(([k, v, cls]) => h("div", {}, h("dt", {}, k), h("dd", { class: cls || "" }, v ?? "—"))));
}
export function card(title, hint, ...body) {
  return h("section", { class: "lq-card" }, h("div", { class: "lq-card-head" }, h("h2", {}, title), hint ? h("span", { class: "lq-hint" }, hint) : null), ...body);
}

const NF = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const NF4 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
export const num = (v, d = 2) => (v === null || v === undefined || v === "" || isNaN(Number(v))) ? "—" : (d > 2 ? NF4 : NF).format(Number(v));
export const money = (v, unit = "RLUSD") => num(v) === "—" ? "—" : `${num(v)} ${unit}`;
export const grams = (v) => num(v) === "—" ? "—" : `${num(v, 3)} g`;
export const short = (hash, n = 10) => hash ? `${hash.slice(0, n)}…${hash.slice(-4)}` : "—";
export const time = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toISOString().slice(11, 19); };
export const pct = (v) => num(v) === "—" ? "—" : `${num(v)} %`;
export const seconds = (s) => { s = Number(s); if (isNaN(s)) return "—"; if (s < 120) return `${s} s`; if (s < 7200) return `${Math.round(s / 60)} min`; if (s < 172800) return `${Math.round(s / 3600)} h`; return `${Math.round(s / 86400)} d`; };
export const tenthsBp = (v) => (v === null || v === undefined) ? "—" : `${(Number(v) / 1000).toFixed(2)} %`;

export function modeChip(mode) {
  return mode === "live" ? chip("LIVE", "ok") : mode === "demo" ? chip("DEMO", "warn") : mode === "planned" ? chip("NEW · planned", "blue") : chip(mode, "dim");
}

let toasts = null;
export function toast(text, kind = "") {
  if (!toasts) { toasts = h("div", { class: "lq-toasts", role: "status", "aria-live": "polite" }); document.body.appendChild(toasts); }
  const t = h("div", { class: "lq-toast " + kind }, text);
  toasts.appendChild(t);
  setTimeout(() => t.remove(), kind === "err" ? 7000 : 3600);
}

export function copyText(text) {
  try { return navigator.clipboard.writeText(text).then(() => toast("Copied", "ok"), () => toast("Could not copy — select the text instead", "err")); }
  catch (e) { toast("Could not copy — select the text instead", "err"); return Promise.resolve(); }
}

export function pre(obj) { return h("pre", { class: "lq-pre" }, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2)); }
