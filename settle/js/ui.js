/**
 * LiquidSettle — the shared components (docs/settle-handoff/COMPONENTS.md), framework-free. Design v3 (Iteration 57) on v2.
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
/** Static markup the app itself wrote (an icon's paths, a diagram) — never data from a document. */
export function markup(el, staticHtml) { el.innerHTML = staticHtml; return el; }
export function replace(parent, ...children) { parent.replaceChildren(...children.flat(Infinity).filter(Boolean)); return parent; }
export function text(s) { return document.createTextNode(String(s)); }

// ── icons (inline SVG, from the handoff sources) ─────────────────────────────
function svg(inner, { size = 16, stroke = "currentColor", width = 2, fill = "none", viewBox = "0 0 24 24", cls = "" } = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  if (size) { el.setAttribute("width", size); el.setAttribute("height", size); }
  el.setAttribute("viewBox", viewBox);
  if (cls) el.setAttribute("class", cls);
  if (!size) el.setAttribute("preserveAspectRatio", "none");
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
  // v3: the status pill — a dot and a word. LIVE is solid and breathes; DEMO is dashed (simulated, sample).
  const live = value === "live";
  return status(live ? "live" : "demo", live ? (xs ? "Live" : "Live on the ledger") : (what ? `Demo · ${what}` : "Demo"), { sm: xs, onHero });
}
export function modeChip(label, { live = false, dark = false } = {}) {
  return status(live ? "live" : "demo", label, { onHero: dark });
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
/** What the mount hands the top bar (main.js fills it): the platform's logo, the way back, the network. */
export const chrome = { logo: "", exit: "", network: "", onPlatform: false };
/** The top bar (Iteration 58): the platform's own bar — ink, the logo, the network pill — for the settlement engine only.
 *  No navigation: the engine is one place. On the platform: the LiquidLabs logo, "Settlement engine", the provider, the
 *  network, the way back. Standalone: the LiquidSettle mark. `right` adds a screen's own items (the sample chip, an avatar). */
export function header(provider, { sub = "Settlement engine", right = [] } = {}) {
  const net = String(chrome.network || "").toLowerCase();
  const mark = chrome.logo
    ? h("img", { class: "ls-tb-logo", src: chrome.logo, alt: "LiquidLabs", width: "150", height: "31", decoding: "async" })
    : h("span", { class: "ls-brand-mark mint" }, icon.arrow({ stroke: "#0B1F1A" }));
  return h("header", { class: "ls-topbar" }, h("div", { class: "ls-topbar-in" },
    h("a", { class: "ls-tb-brand", href: "#/desk", "aria-label": `${sub} · ${provider.short || ""}` }, mark,
      chrome.logo ? null : h("span", { class: "ls-tb-name" }, "LiquidSettle"),
      h("span", { class: "ls-tb-sep", "aria-hidden": "true" }),
      h("span", { class: "ls-tb-sub" }, h("b", {}, sub), provider.short ? h("span", {}, provider.short) : null)),
    h("span", { class: "es-hack", title: "XRPL Commons Hackathon NYC 2026 — this is the entry to judge (see JUDGING.md)" }, "Hackathon"),
    net ? h("span", { class: "ls-tb-net " + (net === "mainnet" ? "main" : "test"), title: "XRP Ledger network in use" }, h("i"), net.toUpperCase()) : null,
    h("div", { class: "ls-tb-right" }, ...right, themeToggle({ dark: true }),
      chrome.exit ? h("a", { class: "ls-tb-back", href: chrome.exit }, icon.back({ size: 14 }), h("span", {}, "Platform")) : null)));
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
  // v3: numbered nodes — a done step shows its check, every other step its number, so the order reads without colour.
  return h("ol", { class: "ls-rail v3" + (compact ? " compact" : "") + (onCard ? " on-card" : ""), "aria-label": label }, steps.map((s, i) => h("li", { class: s.state === "done" ? "done" : s.state === "now" ? "now" : "next", "aria-current": s.state === "now" ? "step" : null },
    h("span", { class: "node", "aria-hidden": "true" }, s.state === "done" ? icon.check({ size: 11, stroke: onCard ? "#FFFFFF" : "#0B1F1A", width: 3.2 }) : String(i + 1)),
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
    h("span", { class: "ls-flex1" }, h("span", { class: "t" }, "Only a verified owner can hold it"),
      h("span", { class: "b" }, "If an unverified wallet tries to receive this passport, the XRP Ledger refuses the transfer. No one at the provider can override that.")),
    stamp("tecNO_AUTH"));
}

// ── loan health ──────────────────────────────────────────────────────────────
export function healthBar(ltv, { phone = false, you = false, ticks = !phone } = {}) {
  // v3: the rung meter (60 max · 70 notify · 75 top-up · 80 impair · 85 sale); the v2 bar below stays for older callers.
  return rungs(ltv, { phone, you, labels: ticks || phone });
}
export function healthBarV2(ltv, { phone = false, you = false, ticks = !phone } = {}) {
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

// ── Design v3 (Iteration 57): the component kit ──────────────────────────────
// The pairing rule: every state is an icon + a status pill + one plain sentence — never a colour alone.
/** A status pill: a dot and one word. kind: live | demo | pending | refused | own | testnet | mainnet | note | done */
export function status(kind, label, { sm = false, onHero = false } = {}) {
  return h("span", { class: `ls-st ${kind}${sm ? " sm" : ""}${onHero ? " onhero" : ""}` }, label);
}
/** What the ledger answered, in its own words: tesSUCCESS, tecNO_AUTH, tecPLEDGED, … */
export function stamp(code, { lg = false, fresh = false, caption = "ledger" } = {}) {
  const tone = code === "tecPLEDGED" ? "pledged" : code && code !== "tesSUCCESS" ? "refused" : "";
  return h("span", { class: `ls-stamp ${tone}${lg ? " lg" : ""}${fresh ? " in" : ""}`.trim() }, h("span", { class: "k" }, caption), code);
}
/** One row of the pairing rule. tone: ledger | refused | card | partner | note */
export function pair({ icon: ic = null, tone = "ledger", pill: p = null, title, result = "", meta = [], side = null }) {
  return h("div", { class: "ls-pair" }, h("span", { class: `ic ${tone}` }, ic || icon.lockSm()),
    h("div", { class: "top" }, p, h("span", { class: "t" }, title)), h("span", { class: "side" }, side),
    result ? h("div", { class: "res" }, result) : null, meta.length ? h("div", { class: "meta" }, meta) : null);
}
/** The LTV rung meter — the scale runs 40 → 100 %, so the rungs that matter (60 · 70 · 75 · 80 · 85) have room. */
export function rungs(ltv, { phone = false, you = false, labels = true, onHero = false } = {}) {
  const v = Number(ltv) || 0;
  const pos = (x) => Math.max(1.5, Math.min(98.5, ((x - 40) / 60) * 100));
  const marks = [[60, "max"], [70, "notify"], [75, "top-up"], [80, "impair"], [85, "sale"]];
  return h("div", { class: "ls-rungs" + (onHero ? " onhero" : "") + (phone ? " phone" : ""), role: "img", "aria-label": `Loan-to-value ${fmt.pct(v, v % 1 ? 1 : 0)}; rungs at 60, 70, 75, 80 and 85 percent` },
    h("div", { class: "you", style: `left:${pos(v)}%` }, h("b", {}, (you ? "You · " : "Now · ") + fmt.pct(v, v % 1 ? 1 : 0)), h("i")),
    h("div", { class: "track", "aria-hidden": "true" }, ["r0", "r1", "r2", "r3", "r4", "r5"].map((c) => h("i", { class: c }))),
    labels ? h("div", { class: "labels", "aria-hidden": "true" }, marks.map(([m]) => h("span", { class: v >= m ? "on" : "", style: `left:${pos(m)}%` }, h("b", {}, String(m))))) : null,
    labels ? h("div", { class: "legend" }, marks.map(([m, w]) => h("span", { class: v >= m ? "on" : "" }, h("b", {}, String(m)), w))) : null);
}
/** The deal stepper: steps [{label, state: done|now|running|failed|next, sub?, chapter?, end?}]. */
export function stepper(steps, { selected = null, onSelect = null, label = "The deal, step by step" } = {}) {
  const out = [];
  let chap = null;
  steps.forEach((s, i) => {
    if (s.chapter && s.chapter !== chap) { chap = s.chapter; out.push(h("div", { class: "chap" }, chap)); }
    out.push(h(onSelect ? "button" : "div", { type: onSelect ? "button" : null, class: `st ${s.state || "next"}${i === selected ? " sel" : ""}${i === steps.length - 1 ? " last" : ""}`,
      "aria-current": s.state === "now" ? "step" : null, onclick: onSelect ? () => onSelect(i) : null },
      h("span", { class: "num", "aria-hidden": "true" }, s.state === "done" ? icon.check({ size: 14, width: 3 }) : String(i + 1)),
      h("span", { class: "t" }, s.label), h("span", { class: "end" }, s.end || null),
      s.sub ? h("span", { class: "s" }, s.sub) : null));
  });
  return h("div", { class: "ls-stepper", role: "list", "aria-label": label }, out);
}
/** A notice in the page. kind: info | ok | warn | bad */
export function notice(kind, title, body) {
  return h("div", { class: `ls-notice ${kind}`, role: kind === "bad" ? "alert" : null }, kind === "ok" ? icon.check({ size: 16, stroke: "currentColor" }) : icon.shield({ size: 16, stroke: "currentColor" }),
    h("span", {}, h("span", { class: "t" }, title), body));
}
/** A segmented choice: options [{value, label}]. */
export function seg(options, { value = null, onChange = null, onHero = false, label = "Choose" } = {}) {
  return h("div", { class: "ls-seg" + (onHero ? " onhero" : ""), role: "group", "aria-label": label }, options.map((o) => h("button", { type: "button", "aria-pressed": o.value === value ? "true" : "false",
    onclick: () => onChange && onChange(o.value) }, o.label)));
}
/** A data card: a number, its source, and a sparkline or a progress bar. */
export function dataCard({ label, value, unit = "", src = "", spark: points = null, progress = null, progressMeta = null, dark = false, right = null }) {
  return h("div", { class: "ls-data" + (dark ? " dark" : "") }, h("div", { class: "k" }, h("span", {}, label), right),
    h("div", { class: "v" }, value, unit ? h("small", {}, unit) : null),
    points && points.length > 1 ? spark(points) : null,
    progress !== null ? h("div", { class: "ls-progress" }, h("i", { style: `width:${Math.max(0, Math.min(100, Number(progress)))}%` })) : null,
    progressMeta ? h("div", { class: "ls-progress-meta" }, progressMeta) : null,
    src ? h("div", { class: "src" }, src) : null);
}
export function spark(values, { w = 300, ht = 64 } = {}) {
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, ht - 6 - ((v - min) / span) * (ht - 12)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return svg(`<path class="area" d="${line} L${w} ${ht} L0 ${ht} Z"/><path class="line" d="${line}"/><circle class="dot" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4"/>`,
    { size: null, viewBox: `0 0 ${w} ${ht}`, cls: "ls-spark", stroke: "none" });
}
