/**
 * LiquidSettle — the entry point: boot, the hash router, the one context every screen gets.
 *
 *  Mounts:  standalone  (hackathon/settle/index.html over any static server; `?mock=1` → sample data,
 *                        otherwise the API base + key from the data attributes or the per-browser settings)
 *           platform    (/settle/ — the platform's page sets data-ls-api, a short-lived session token and
 *                        data-ls-session-url to refresh it; data-ls-mock="1" on /settle/mock)
 *  Routes:  #/                       Start — choose the use case
 *           #/desk                   Provider desk
 *           #/presenter?scenario=delivery|vault&step=0..2
 *           #/case/<ref>?phase=0..2  Delivery room (use case 1, provider)
 *           #/pay/<ref>?state=…      Approve & pay (use case 1, buyer phone)
 *           #/passport/<serial>?state=delivered|vault
 *           #/vault/<ref>?loan=active|none&price=…   Vault & borrow (use case 2, provider)
 *           #/my/<ref>?state=home|borrow|active|action&price=…&loan=…   Vault & borrow (use case 2, customer phone)
 *           #/custody?case=<ref>     The five ways to approve — Xaman · Uphold · Self-custody · Ledger · LiquidLabs custody (Iteration 52)
 *  No inline script, no inline style: the app runs under the platform's strict CSP.
 */
import { ApiSource, MockSource, parseHash, href } from "./data.js";
import { PROVIDER } from "./mock.js";
import { h, replace, modeChip } from "./ui.js";
import * as start from "./screens/start.js";
import * as desk from "./screens/desk.js";
import * as presenter from "./screens/presenter.js";
import * as room from "./screens/room.js";
import * as pay from "./screens/pay.js";
import * as passport from "./screens/passport.js";
import * as vault from "./screens/vault.js";
import * as customer from "./screens/customer.js";
import * as custody from "./screens/custody.js";

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
  mock: ds.lsMock === "1" || params.get("mock") === "1" || (!onPlatform && !ds.lsApi && !stored.base),
};

async function refreshSession() {
  if (!ds.lsSessionUrl) return false;
  try {
    const r = await fetch(ds.lsSessionUrl, { method: "POST", headers: { "X-CSRFToken": ds.lsCsrf || "", Accept: "application/json" }, credentials: "same-origin" });
    if (!r.ok) return false;
    const j = await r.json();
    if (j.ok && j.token) { ctx.source.gate.token = j.token; return true; }
  } catch (e) { /* the page keeps the sample until the next load */ }
  return false;
}

// ── the context every screen receives ────────────────────────────────────────
export const ctx = {
  source: null,
  mode: settings.mock ? "mock" : "api",
  demo: ds.lsDemo === "1" || settings.mock,              // the dashed "Demo: …" controls
  provider: { ...PROVIDER, ...(ds.lsProvider ? { short: ds.lsProvider } : {}) },
  network: ds.lsNetwork || "testnet",
  platform: ds.lsPlatform || "",                          // the platform's origin for "On the platform ↗" (empty standalone)
  explorer: ds.lsExplorer || "https://testnet.xrpl.org",
  title: ds.lsTitle || "LiquidSettle",
  navigate(path, p = null) { location.hash = href(path, p); },
  href,
  rerender() { route(); },
  toast,
  modeChip({ dark = false } = {}) {
    const live = this.mode === "api";
    return modeChip(live ? this.source.label : "Sample data", { live, dark });
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
  if (settings.mock) { ctx.source = new MockSource(); ctx.mode = "mock"; return; }
  const api = new ApiSource({ base: settings.base, token: settings.token, onAuthError: () => refreshSession() });
  try {
    await api.connect();
    ctx.source = api; ctx.mode = "api";
    ctx.network = api.network;
    if (api.explorer) ctx.explorer = api.explorer;
  } catch (e) {
    // No LiquidGate here: run on the sample and say so — never a blank screen, never a fake record.
    ctx.source = new MockSource(); ctx.mode = "mock"; ctx.demo = true;
    toast("LiquidGate is not reachable — showing the sample data", "err");
  }
}

// ── the router ───────────────────────────────────────────────────────────────
const SCREENS = [
  [/^\/$/, start, () => ({})],
  [/^\/desk$/, desk, () => ({})],
  [/^\/presenter$/, presenter, () => ({})],
  [/^\/case\/([^/]+)$/, room, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/pay\/([^/]+)$/, pay, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/passport\/([^/]+)$/, passport, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/vault\/([^/]+)$/, vault, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/my\/([^/]+)$/, customer, (m) => ({ id: decodeURIComponent(m[1]) })],
  [/^\/custody$/, custody, () => ({})],
];
let seq = 0;

async function route() {
  const { path, params: q } = parseHash(location.hash);
  const my = ++seq;
  for (const [re, screen, pick] of SCREENS) {
    const m = path.match(re);
    if (!m) continue;
    const p = { ...q, ...pick(m) };
    root.dataset.lsScreen = screen.name;
    document.title = (screen.title ? screen.title(p) : screen.name) + " · " + ctx.title;
    try {
      const el = await screen.render(ctx, p);
      if (my !== seq) return;                      // a newer navigation won
      replace(root, el);
      window.scrollTo(0, 0);
    } catch (e) {
      if (my !== seq) return;
      console.error(e);
      replace(root, h("div", { class: "ls-wrap" }, h("div", { class: "ls-error" }, h("b", {}, "This screen could not load. "), String(e && e.message || e), " ", h("a", { href: "#/" }, "Back to start"))));
    }
    return;
  }
  location.hash = "#/";
}

// ── boot ─────────────────────────────────────────────────────────────────────
root.querySelectorAll("[data-ls-boot]").forEach((el) => el.remove());
root.classList.add("ls-app");
await connect();
window.addEventListener("hashchange", route);
route();
