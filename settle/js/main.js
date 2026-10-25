/**
 * LiquidSettle — the settlement engine's entry point: boot, the hash router, the one context every screen gets.
 *
 *  Mounts:  standalone  (hackathon/settle/index.html over any static server; `?mock=1` → sample data,
 *                        otherwise the API base + key from the data attributes or the per-browser settings)
 *           platform    (/settle/ — the platform's page sets data-ls-api, a short-lived session token and
 *                        data-ls-session-url to refresh it). Iteration 58: on the platform the app is LIVE ONLY —
 *                        no sample data, no "Demo:" controls; if LiquidGate cannot be reached it says so and retries.
 *  Routes (Iteration 59 — the settlement engine of the Figma frames):
 *           #/                       Home — the provider's desk
 *           #/deals[?tab=]           every deal
 *           #/deal/<ref>[?view=technical]   one deal at whatever step it is
 *           #/deal/<ref>/ways        the ways back to safe (a loan)
 *           #/vault · #/money · #/activity · #/architecture
 *        the Iteration 51–58 screens on the platform's Au cases stay reachable:
 *           #/start · #/desk · #/case/<ref> · #/pay/<ref> · #/passport/<serial> · #/vault/<ref> · #/my/<ref>
 *  Theme:   theme.js (a classic script, loaded first) applies light / dark before the first paint.
 *  No inline script, no inline style: the app runs under the platform's strict CSP.
 */
import { ApiSource, MockSource, parseHash, href } from "./data.js";
import { PROVIDER } from "./mock.js";
import { h, replace, modeChip, chrome, header } from "./ui.js";
import { DealsApi, DealsSample } from "./engine/source.js";
import { bindKeys } from "./engine/shell.js";
import * as home from "./engine/home.js";
import * as dealsPage from "./engine/deals.js";
import * as deal from "./engine/deal.js";
import * as ways from "./engine/ways.js";
import * as architecture from "./engine/architecture.js";
import { vault as vaultPage, moneyPage, activity } from "./engine/pages.js";
import * as start from "./screens/start.js";
import * as desk from "./screens/desk.js";
import * as room from "./screens/room.js";
import * as pay from "./screens/pay.js";
import * as passport from "./screens/passport.js";
import * as vault from "./screens/vault.js";
import * as customer from "./screens/customer.js";

const KEY = "liquidsettle.settings.v1";
const root = document.getElementById("ls-root") || document.querySelector(".ls-app");
const ds = root.dataset;
const params = new URLSearchParams(location.search);

function loadSettings() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
function saveSettings(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private window */ } }

const stored = loadSettings();
const onPlatform = !!ds.lsSessionUrl && ds.lsMock !== "1";
const settings = {
  base: ds.lsApi || stored.base || "/api/lg/v1",
  token: ds.lsToken || (onPlatform ? "" : stored.token || ""),
  // On the platform: never the sample. Standalone (the public repository): ?mock=1, or no API configured.
  mock: !onPlatform && (ds.lsMock === "1" || params.get("mock") === "1" || (!ds.lsApi && !stored.base)),
};

Object.assign(chrome, { logo: ds.lsLogo || "", exit: ds.lsExit || "", network: ds.lsNetwork || "", onPlatform });

async function refreshSession() {
  if (!ds.lsSessionUrl) return false;
  try {
    const r = await fetch(ds.lsSessionUrl, { method: "POST", headers: { "X-CSRFToken": ds.lsCsrf || "", Accept: "application/json" }, credentials: "same-origin" });
    if (!r.ok) return false;
    const j = await r.json();
    if (j.ok && j.token) { ctx.source.gate.token = j.token; return true; }
  } catch (e) { /* the next call says so */ }
  return false;
}

// ── the context every screen receives ────────────────────────────────────────
let leaving = [];
export const ctx = {
  source: null,
  deals: null,                                             // DealsApi | DealsSample (Iteration 59)
  cache: {},
  mode: settings.mock ? "mock" : "api",
  sample: false,
  demo: !onPlatform && (ds.lsDemo === "1" || settings.mock),   // the dashed "Demo: …" controls of the older screens — never on the platform
  operator: false,
  provider: { ...PROVIDER, ...(ds.lsProvider ? { short: ds.lsProvider } : {}) },
  network: ds.lsNetwork || "testnet",
  dealsNetwork: "testnet",
  platform: ds.lsPlatform || "",
  explorer: ds.lsExplorer || "https://testnet.xrpl.org",
  title: ds.lsTitle || "LiquidSettle",
  settleMode: ds.lsMode || (settings.mock ? "mock" : "live"),
  banner: ds.lsBanner || "", bannerTone: ds.lsBannerTone || "",
  exit: ds.lsExit || "",
  userName: "", userInitials: "",
  currentRef: null,
  navigate(path, p = null) { location.hash = href(path, p); },
  href,
  rerender() { route(); },
  leave(fn) { if (typeof fn === "function") leaving.push(fn); },
  toast,
  modeChip({ dark = false } = {}) {
    if (this.mode === "api") return null;
    return modeChip("Sample data", { live: false, dark });
  },
  settings, saveSettings,
};

let toastTimer = null;
function toast(msg, tone = "") {
  let el = document.querySelector(".ls-toast");
  if (!el) { el = h("div", { class: "ls-toast", role: "status", "aria-live": "polite" }); document.body.appendChild(el); }
  el.textContent = msg; el.className = "ls-toast on " + tone;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.className = "ls-toast"; }, 3200);
}

async function connect() {
  if (settings.mock) { ctx.source = new MockSource(); ctx.deals = new DealsSample(); ctx.mode = "mock"; ctx.sample = true; return; }
  const api = new ApiSource({ base: settings.base, token: settings.token, onAuthError: () => refreshSession(), strict: onPlatform });
  try {
    await api.connect();
    ctx.source = api; ctx.mode = "api";
    ctx.deals = new DealsApi(api.gate);
    ctx.network = api.network;
    if (api.explorer) ctx.explorer = api.explorer;
    try { const me = await api.gate.me(); ctx.operator = ((me.principal || {}).scopes || []).includes("operator"); } catch (e) { ctx.operator = false; }
  } catch (e) {
    if (onPlatform) {
      // Production never falls back to the sample: say what is wrong and offer to try again.
      ctx.source = null; ctx.mode = "offline"; ctx.offlineReason = String((e && e.message) || e);
      return;
    }
    ctx.source = new MockSource(); ctx.deals = new DealsSample(); ctx.mode = "mock"; ctx.sample = true; ctx.demo = true;
    toast("LiquidGate is not reachable — showing the sample data", "err");
  }
}

// ── the router ───────────────────────────────────────────────────────────────
const SCREENS = [
  [/^\/$/, home, () => ({})],
  [/^\/deals$/, dealsPage, () => ({})],
  [/^\/deal\/([^/]+)\/ways$/, ways, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/deal\/([^/]+)$/, deal, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/vault$/, vaultPage, () => ({})],
  [/^\/money$/, moneyPage, () => ({})],
  [/^\/activity$/, activity, () => ({})],
  [/^\/architecture$/, architecture, () => ({})],
  // the Iteration 51–58 screens on the platform's Au cases
  [/^\/start$/, start, () => ({})],
  [/^\/desk$/, desk, () => ({})],
  [/^\/case\/([^/]+)$/, room, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/pay\/([^/]+)$/, pay, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/passport\/([^/]+)$/, passport, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/vault\/([^/]+)$/, vault, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/my\/([^/]+)$/, customer, (m) => ({ id: decodeURIComponent(m[1]) })],
];
let seq = 0;

function offline() {
  const retry = h("button", { type: "button", class: "ls-btn primary", onclick: async () => { retry.disabled = true; await connect(); route(); } }, "Try again");
  return h("div", { class: "ls-page" }, header(ctx.provider), h("main", { class: "ls-wrap" },
    h("div", { class: "ls-notice bad" }, h("span", {}, h("span", { class: "t" }, "The settlement engine cannot reach LiquidGate right now."),
      "Nothing has moved and nothing is lost — your settlements are on the XRP Ledger. ", ctx.offlineReason ? h("span", { class: "ls-mono ls-xs" }, ctx.offlineReason) : null)),
    h("div", { class: "ls-actions" }, retry, ctx.exit ? h("a", { class: "ls-btn", href: ctx.exit }, "Back to the platform") : null)));
}

async function route() {
  const { path, params: q } = parseHash(location.hash);
  const my = ++seq;
  leaving.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* a poller that already stopped */ } });
  if (ctx.mode === "offline") { replace(root, offline()); return; }
  for (const [re, screen, pick] of SCREENS) {
    const m = path.match(re);
    if (!m) continue;
    const p = { ...q, ...pick(m) };
    ctx.currentRef = screen === deal || screen === ways ? p.id : null;
    root.dataset.lsScreen = screen.name;
    document.title = (screen.title ? screen.title(p) : screen.name) + " · " + ctx.title;
    try {
      const el = await screen.render(ctx, p);
      if (my !== seq) return;                      // a newer navigation won
      el.classList.add("ls-enter");
      replace(root, el);
      if (!q.keep) window.scrollTo(0, 0);
      const main = el.querySelector("main");
      if (main) { main.setAttribute("tabindex", "-1"); main.focus({ preventScroll: true }); }
    } catch (e) {
      if (my !== seq) return;
      console.error(e);
      replace(root, h("div", { class: "ls-page" }, header(ctx.provider), h("main", { class: "ls-wrap" }, h("div", { class: "ls-error" }, h("b", {}, "This screen could not load. "), String(e && e.message || e), " ", h("a", { href: "#/" }, "Back to the desk")))));
    }
    return;
  }
  location.hash = "#/";
}

// ── boot ─────────────────────────────────────────────────────────────────────
root.querySelectorAll("[data-ls-boot]").forEach((el) => el.remove());
root.classList.add("ls-app");
await connect();
if (ctx.deals) { try { const hdoc = await ctx.deals.home(); ctx.cache.home = hdoc; ctx.userName = hdoc.user; ctx.userInitials = hdoc.user_initials; } catch (e) { /* the screen says so */ } }
bindKeys(ctx);
window.addEventListener("hashchange", route);
route();
