/**
 * LiquidSettle — the shared components (docs/settle-handoff/COMPONENTS.md), framework-free. Design v2 (Iteration 53).
 * The money hero with the journey rail; the release rule; the status pill; the ledger proof card (every receipt,
 * every step's requested vs effective mode); the passport card; the refusal card; loan health + ladder; the three
 * ways out; the wallet sheet; the Live / Simulated chip; the header with the theme toggle; the device frame for the
 * phone screens. The timeline list is gone: one rail says where the settlement is, one line says what the ledger
 * did last, and the proof card keeps every hash one click away. Copy says "Au", never the metal's name.
 */

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false || v === "") continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "style") el.style.cssText = v;       // the CSSOM, which a strict CSP permits — a style="" attribute would be dropped
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "hidden") el.hidden = !!v;
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  return el;
}
export function replace(parent, ...children) { parent.replaceChildren(...children.flat(Infinity).filter(Boolean)); return parent; }
export function text(s) { return document.createTextNode(String(s)); }

// ── icons (inline SVG, from the handoff sources) ─────────────────────────────
function svg(inner, { size = 16, stroke = "currentColor", width = 2, fill = "none" } = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  el.setAttribute("width", size); el.setAttribute("height", size); el.setAttribute("viewBox", "0 0 24 24");
  el.setAttribute("fill", fill); el.setAttribute("stroke", stroke); el.setAttribute("stroke-width", width);
  el.setAttribute("stroke-linecap", "round"); el.setAttribute("stroke-linejoin", "round"); el.setAttribute("aria-hidden", "true");
  el.innerHTML = inner;
  return el;
}
export const icon = {
  arrow: (o) => svg('<path d="M5 12h14M12 5l7 7-7 7"/>', { size: 14, stroke: "#01CB9A", width: 2.4, ...o }),
  back: (o) => svg('<path d="M15 6l-6 6 6 6"/>', o),
  truck: (o) => svg('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>', { width: 1.8, ...o }),
  lock: (o) => svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', { stroke: "#01CB9A", size: 18, ...o }),
  lockSm: (o) => svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', { size: 13, ...o }),
  refresh: (o) => svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', { size: 18, ...o }),
  receipt: (o) => svg('<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>', { size: 20, ...o }),
  check: (o) => svg('<path d="M5 12l5 5L20 7"/>', { size: 16, stroke: "#FFFFFF", width: 2.6, ...o }),
  shield: (o) => svg('<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>', { size: 18, stroke: "#01CB9A", ...o }),
  vault: (o) => svg('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5v1.2M12 14.3v1.2M8.5 12h1.2M14.3 12h1.2"/>', { width: 1.8, ...o }),
  phone: (o) => svg('<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18h2"/>', { size: 16, stroke: "#01CB9A", ...o }),
  chevron: (o) => svg('<path d="M6 9l6 6 6-6"/>', { size: 18, ...o }),
  sun: (o) => svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', { size: 16, ...o }),
  moon: (o) => svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', { size: 16, ...o }),
  au: () => h("span", { class: "ls-tile" }, "Au"),
};

// ── formatting ───────────────────────────────────────────────────────────────
export const fmt = {
  money2: (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  money0: (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 }),
  grams: (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 }) + " g",
  pct: (n, d = 0) => Number(n).toFixed(d) + "%",
  short: (hash) => (hash && hash.length > 12) ? hash.slice(0, 8) + "…" + hash.slice(-4) : (hash || ""),
  short8: (hash) => hash ? hash.slice(0, 8) : "",
  day: (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "",
  dayTime: (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) + ", " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) : "",
  weekday: (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : "",
  mmss: (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"),
  when: (w) => w && /^\d{4}-\d{2}-\d{2}/.test(w) ? fmt.dayTime(w) : (w || ""),
};
/** 100,000.00 <span class="ls-rl">RL</span>USD — the currency mark; never the eight-letter word in copy. */
export function rl(amount, { decimals = 2, tag = "span", cls = "" } = {}) {
  const n = decimals === 0 ? fmt.money0(amount) : fmt.money2(amount);
  return h(tag, { class: cls }, n + " ", h("span", { class: "ls-rl" }, "RL"), "USD");
}
export function rlMark() { return [h("span", { class: "ls-rl" }, "RL"), "USD"]; }
const EIGHT = "RL" + "USD";
/** Free text from the platform (an event message) with every currency word rendered as the mark. */
export function withMark(text) {
  const parts = String(text || "").split(EIGHT);
  return parts.flatMap((p, i) => (i ? [...rlMark(), p] : [p]));
}

// ── parties ──────────────────────────────────────────────────────────────────
export const PARTY_LABELS = { seller: "Seller", buyer: "Buyer", carrier: "Carrier", ledger: "Ledger", refiner: "Refiner" };
export const PARTY_LABELS_VAULT = { seller: "Provider", buyer: "Customer", carrier: "Carrier", ledger: "Ledger", refiner: "Refiner" };
export function dot(party, extra = "") { return h("span", { class: `ls-dot ${party} ${extra}`.trim() }); }
export function colourKey(parties, { vault = false, plain = false } = {}) {
  const labels = vault ? PARTY_LABELS_VAULT : PARTY_LABELS;
  return h("div", { class: "ls-key" + (plain ? " plain" : "") }, parties.map((p) => h("span", {}, dot(p), labels[p] || p)));
}
export function chip(party, label) { return h("span", { class: `ls-chip ${party}` }, label); }

// ── pills and chips ──────────────────────────────────────────────────────────
export function pill(tone, label) { return h("span", { class: `ls-pill ${tone}` }, label); }
/** The Live / Simulated chip: `value` is "live" | "simulated" | "sample". */
export function liveChip(value, { onHero = false, what = "", xs = false } = {}) {
  const live = value === "live";
  return h("span", { class: `ls-live ${live ? "live" : "sim"}${onHero ? " onhero" : ""}${xs ? " xs" : ""}` }, live ? (xs ? "Live" : "Live on the ledger") : (what ? `Simulated · ${what}` : "Simulated"));
}
export function modeChip(label, { live = false, dark = false } = {}) {
  return h("span", { class: "ls-mode" + (live ? " live" : "") + (dark ? " dark" : "") }, h("span", { class: "dot" }), label);
}
/** The mode of one step from the document's `modes` (Iteration 53) — or its `live_or_simulated` when the document is older. */
export function stepMode(vm, step) {
  const m = vm && vm.modes && vm.modes[step];
  if (m && m.effective) return m.effective;
  return (vm && vm.live_or_simulated && vm.live_or_simulated[step]) || "simulated";
}

// ── header, footer, theme ────────────────────────────────────────────────────
export function brand(short, sub, { href = "#/", mintMark = false } = {}) {
  return h("a", { class: "ls-brand", href }, h("span", { class: "ls-brand-mark" + (mintMark ? " mint" : "") }, icon.arrow({ stroke: mintMark ? "#0B1F1A" : "#01CB9A" })), short,
    sub ? h("span", { class: "ls-brand-sub" }, sub) : null);
}
/** The sun / moon button: light ↔ dark, remembered in this browser (theme.js). `dark` draws it on a dark surface. */
export function themeToggle({ dark = false } = {}) {
  const T = window.LiquidSettleTheme;
  const btn = h("button", { type: "button", class: "ls-theme" + (dark ? " dark" : ""), "aria-label": "Switch between light and dark", title: "Light / dark",
    onclick: () => { if (T) { const next = T.toggle(); btn.setAttribute("aria-pressed", next === "dark" ? "true" : "false"); } } },
    h("span", { class: "sun" }, icon.sun()), h("span", { class: "moon" }, icon.moon()));
  btn.setAttribute("aria-pressed", T && T.current() === "dark" ? "true" : "false");
  return btn;
}
export function header(provider, { sub = "Settlement desk", nav = null, right = [] } = {}) {
  return h("header", { class: "ls-header" }, h("div", { class: "ls-header-in" }, brand(provider.short, sub, { href: "#/desk" }), nav,
    h("div", { class: "ls-header-right" }, ...right, themeToggle())));
}
/** The environment's banner (staging, demo database, test account), in the app's own style — never the platform's bar. */
export function envBanner(ctx) {
  if (!ctx.banner) return null;
  return h("div", { class: "ls-env " + (ctx.bannerTone || ""), role: "status" }, ctx.banner, ctx.exit ? [" · ", h("a", { href: ctx.exit }, "Back to the platform")] : null);
}
export function avatar(initials, label) { return h("span", { class: "ls-avatar", "aria-label": label || initials }, initials); }
export function ledgerFoot(text, explorerUrl, { label = "View on ledger ↗", platformUrl = null } = {}) {
  return h("div", { class: "ls-pfoot" }, icon.lockSm(), h("span", {}, text + " · ", h("a", { href: explorerUrl, target: "_blank", rel: "noopener" }, label),
    platformUrl ? [" · ", h("a", { href: platformUrl, target: "_blank", rel: "noopener" }, "On the platform ↗")] : null));
}
export function settledWith() { return h("div", { class: "ls-settled" }, "Settled with LiquidSettle"); }

// ── the journey rail (one component, everywhere a timeline used to be) ───────
/** steps: [{label, when, state: done|now|next, mode?: live|simulated}]. `onCard` draws it on a light card; `chips`
 *  adds each step's Live / Simulated chip (off by default — the hero's chip and the proof card already say it). */
export function rail(steps, { compact = false, onCard = false, label = "Progress", chips = false } = {}) {
  return h("ol", { class: "ls-rail" + (compact ? " compact" : "") + (onCard ? " on-card" : ""), "aria-label": label }, steps.map((s) => h("li", { class: s.state === "done" ? "done" : s.state === "now" ? "now" : "next" },
    h("span", { class: "node", "aria-hidden": "true" }, s.state === "done" ? icon.check({ size: 9, stroke: "#0B1F1A", width: 3.2 }) : null),
    h("span", { class: "lbl" }, s.label),
    s.when ? h("span", { class: "when" }, s.when) : null,
    chips && s.mode && s.state !== "next" ? liveChip(s.mode, { onHero: !onCard, xs: true }) : null)));
}
/** The newest ledger event of a timeline, as one line: what, the receipt, Verify ↗ — the whole story stays in the proof card. */
export function latest(rows, { onCard = false, platformUrl = null } = {}) {
  const r = (rows || []).find((x) => x.party === "ledger") || (rows || [])[0];
  if (!r) return null;
  return h("div", { class: "ls-latest" + (onCard ? " on-card" : "") },
    h("span", { class: "k" }, icon.lockSm(), "Latest on the ledger"),
    h("span", { class: "ev" }, ...withMark(r.event)),
    r.when ? h("span", {}, fmt.when(r.when)) : null,
    r.receipt_hash ? h("span", { class: "ls-mono" }, fmt.short8(r.receipt_hash)) : null,
    r.simulated ? liveChip("simulated", { onHero: !onCard, xs: true }) : (r.receipt_hash ? liveChip("live", { onHero: !onCard, xs: true }) : null),
    r.explorer_url && !r.simulated ? h("a", { href: r.explorer_url, target: "_blank", rel: "noopener" }, "Verify ↗") : null,
    (r.platform_url || platformUrl) ? h("a", { href: r.platform_url || platformUrl, target: "_blank", rel: "noopener", title: "The platform's record of this step" }, "Platform ↗") : null);
}

// ── the money hero ───────────────────────────────────────────────────────────
export function hero({ status, statusClass = "", amount, amountNode = null, line, side = null, rail: railNode = null, facts = [], chipNode = null, extra = null, foot = null }) {
  return h("div", { class: "ls-hero" },
    h("div", { class: "ls-hero-top" },
      h("div", {}, h("div", { class: "ls-hero-status " + statusClass }, h("span", { class: "ls-dot" }), status, chipNode ? [" ", chipNode] : null),
        h("div", { class: "ls-hero-amount" }, amountNode || amount), h("p", { class: "ls-hero-line" }, line)),
      side ? h("div", { class: "ls-hero-side" }, side) : null),
    railNode, extra,
    facts.length ? h("dl", { class: "ls-hero-facts" }, facts.map(([k, v]) => h("div", {}, h("dt", {}, k), h("dd", {}, v)))) : null,
    foot);
}

// ── the release rule card ────────────────────────────────────────────────────
export function ruleCard(title, sentenceNodes, { parties = [], note = null, vault = false } = {}) {
  return h("div", { class: "ls-rule" }, h("div", { class: "ls-eyebrow" }, title), h("p", { class: "rule" }, ...sentenceNodes),
    parties.length ? colourKey(parties, { plain: true, vault }) : null,
    note ? h("div", { class: "ls-inset" }, icon.refresh(), h("span", {}, ...(Array.isArray(note) ? note : [note]))) : null);
}

// ── the ledger proof card ────────────────────────────────────────────────────
const STEP_LABEL = { kyc: "KYC credential", payment: "Payment secured", usps: "USPS scans", anchors: "Scan anchors", release: "Payment released", passport: "Bar passport", refusal: "Owner refusal",
                     oracle: "Au price", quote: "Price quote", lock: "Collateral lock", mandate: "Sale mandate", loan: "Loan", sale: "Sale", receipt: "Receipt", mint: "Au token", cases: "Cases" };
/** The rows are receipts; `modes` (Iteration 53) is the document's per-step {requested, effective, why} — shown under the receipts when the proof is open. */
export function proofCard({ title = "Secured on the XRP Ledger", sub, explorerUrl, platformUrl = null, rows = [], modes = null, open = false, onToggle = null, publicNote = "Check it yourself on a public explorer ↗", verifyUrl = null }) {
  const card = h("div", { class: "ls-card tight" });
  const steps = modes ? Object.entries(modes) : [];
  const render = () => replace(card,
    h("div", { class: "ls-proof-head" }, h("span", { class: "ls-tile" }, icon.lock()), h("div", {}, h("div", { class: "t" }, title), h("div", { class: "s" }, sub)),
      explorerUrl ? h("a", { class: "view", href: explorerUrl, target: "_blank", rel: "noopener" }, "View on ledger ↗") : null),
    platformUrl ? h("a", { href: platformUrl, target: "_blank", rel: "noopener", class: "ls-small ls-strong" }, "Open on the platform ↗") : null,
    h("button", { class: "ls-btn text", type: "button", "aria-expanded": open ? "true" : "false", onclick: () => { open = !open; render(); if (onToggle) onToggle(open); } }, open ? "Hide proof" : "View proof"),
    open ? [h("dl", { class: "ls-dl rows ls-proof-rows" }, rows.map(([k, v, mono]) => h("div", {}, h("dt", {}, k), h("dd", { class: mono === false ? "" : "ls-mono" }, v)))),
      steps.length ? h("div", { class: "ls-proof-modes" }, h("div", { class: "h" }, "Each step, as configured"), steps.map(([k, m]) => h("div", { class: "m" },
        h("span", { class: "k" }, STEP_LABEL[k] || k), liveChip(m.effective || m, { xs: true }),
        m.requested && m.requested !== m.effective ? h("span", { class: "ls-xs ls-muted" }, `requested ${m.requested}`) : null,
        m.why ? h("span", { class: "w" }, m.why) : null))) : null,
      h("a", { href: verifyUrl || explorerUrl || "#", target: "_blank", rel: "noopener", class: "ls-strong" }, publicNote)] : null);
  render();
  return card;
}

// ── the passport card ────────────────────────────────────────────────────────
export function passportCard(p) {
  return h("section", { class: "ls-passport", "aria-label": "Bar passport" },
    h("div", { class: "ls-row-sb" },
      h("div", { class: "ls-min0" }, h("div", { class: "lab" }, "Certificate of authenticity"), h("div", { class: "serial" }, p.serial)),
      h("span", { class: "ls-authentic" }, icon.check({ stroke: "#01CB9A", size: 13 }), "Authentic")),
    h("div", { class: "wt" }, fmt.grams(p.weight_g)),
    h("div", { class: "facts" }, [["Fineness", p.fineness], ["Refiner", p.refiner], ["Metal", "Au"]].map(([l, v]) => h("div", {}, h("div", { class: "l" }, l), h("div", { class: "v" }, v)))),
    h("div", { class: "ownrow" }, h("div", {}, h("div", { class: "l" }, "Owner"), h("div", { class: "v" }, p.owner)), h("div", { class: "ls-right" }, h("div", { class: "l" }, "Location"), h("div", { class: "v" }, p.location))));
}
export function refusalCard() {
  return h("section", { class: "ls-refusal", "aria-label": "Only verified owners" }, h("span", { class: "ls-tile" }, icon.shield()),
    h("span", {}, h("span", { class: "t" }, "Only a verified owner can hold it"),
      h("span", { class: "b" }, "If an unverified wallet tries to receive this passport, the XRP Ledger refuses the transfer. No one at the provider can override that.")));
}

// ── loan health ──────────────────────────────────────────────────────────────
export function healthBar(ltv, { phone = false, you = false, ticks = !phone } = {}) {
  const pos = Math.min(Number(ltv), phone ? 90 : 98);
  return h("div", { class: "ls-health" + (phone ? " phone" : "") },
    h("div", { class: "mark", style: `left:${pos}%` }, h("span", { class: "pill" }, (you ? "You · " : "Now ") + fmt.pct(ltv, Number(ltv) % 1 ? 1 : 0)), h("span", { class: "tick" })),
    h("div", { class: "bar" }),
    ticks ? h("div", { class: "ticks" }, phone ? null : h("span", { class: "edge-l", style: "left:0" }, "0%"),
      h("span", { style: "left:70%" }, "70"), h("span", { style: "left:75%" }, "75"), h("span", { style: "left:80%" }, "80"), h("span", { style: "left:85%" }, "85"),
      phone ? null : h("span", { class: "edge-r", style: "left:100%" }, "100%")) : null);
}
export function ladder(rows, ltv) {
  return h("div", { class: "ls-ladder" }, rows.map((l) => h("div", { class: Number(ltv) >= l.at ? `on-${l.at}` : "" },
    h("span", { class: "at" }, `At ${l.at}% · Au below ${fmt.money2(l.price)}`), h("span", { class: "what" }, l.what), h("span", { class: "drop" }, l.drop))));
}
export function healthStatus(ltv) {
  const v = Number(ltv);
  return v < 70 ? ["Safe", "ok"] : v < 75 ? ["Watch", "warn"] : v < 80 ? ["Top-up needed", "warn"] : v < 85 ? ["At risk", "bad"] : ["Sale proposed", "bad"];
}

// ── three ways out ───────────────────────────────────────────────────────────
export function threeWays(remedies, { onPick = null, picked = null, reason = "Each option brings the loan back under 70%." } = {}) {
  return h("div", { class: "ls-ways" }, h("div", { class: "t" }, "Au fell. Pick one way to get back to safe."), h("div", { class: "s" }, reason),
    remedies.map((r, i) => h("button", { type: "button", class: "ls-way" + (picked === i ? " on" : ""), "aria-pressed": picked === i ? "true" : "false", onclick: () => onPick && onPick(r, i) },
      h("span", {}, h("span", { class: "wt" }, r.title), h("span", { class: "we" }, r.effect)),
      h("span", { class: "wa" }, r.amount_kind === "usd" ? rl(r.amount, { decimals: 0 }) : fmt.grams(r.amount)))),
    h("div", { class: "foot" }, "Nothing is sold now. A sale is only proposed at 85%, and only with your approval. It can be partial."));
}

// ── the wallet sheet ─────────────────────────────────────────────────────────
export function sheet({ title = "Approve with your wallet", body, cta = "Open Xaman to approve", onApprove, onClose, inFrame = false }) {
  return h("div", { class: "ls-sheet-scrim", onclick: (e) => { if (e.target === e.currentTarget && onClose) onClose(); } },
    h("div", { class: "ls-sheet", role: "dialog", "aria-modal": "true", "aria-label": title }, h("span", { class: "grab" }), h("h2", {}, title), body,
      h("button", { type: "button", class: "ls-btn dark block", onclick: onApprove }, icon.phone(), cta),
      h("button", { type: "button", class: "ls-btn text ls-self-center", onclick: onClose }, "Not now")));
}

// ── the device frame (phone screens on a desk) ───────────────────────────────
/** On a desk the phone screen sits in a device; on a phone the frame disappears (settle.css ≤ 720px). */
export function device(page, { caption = null } = {}) {
  return h("div", { class: "ls-stage" }, h("div", { class: "ls-device" }, page), caption ? h("div", { class: "ls-stage-cap" }, ...(Array.isArray(caption) ? caption : [caption])) : null);
}

// ── small blocks ─────────────────────────────────────────────────────────────
export function person(p) {
  return h("div", { class: "ls-person" }, h("span", { class: `av ${p.party}` }, p.ini), h("span", { class: "who" }, h("span", { class: "nm" }, p.name), h("span", { class: "role" }, p.role)), h("span", { class: "ls-badge" }, p.badge));
}
export function empty(title, body) { return h("div", { class: "ls-empty" }, h("b", {}, title), " ", body); }
export function sectionHead(title, right = null, { sm = false } = {}) { return h("div", { class: "ls-card-head" }, h("h2", { class: sm ? "sm" : "" }, title), right); }
