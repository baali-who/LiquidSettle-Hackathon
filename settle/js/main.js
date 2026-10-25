/**
 * LiquidSettle — the entry point: boot, the hash router, the one context every screen gets.
 *
 *  Mounts:  standalone  (hackathon/settle/index.html over any static server; `?mock=1` → sample data,
 *                        otherwise the API base + key from the data attributes or the per-browser settings)
 *           platform    (/settle/ — the platform's page sets data-ls-api, a short-lived session token and
 *                        data-ls-session-url to refresh it). Iteration 58: on the platform the app is LIVE ONLY —
 *                        no sample data, no "Demo:" controls; if LiquidGate cannot be reached it says so and retries.
 *  Routes:  #/                       Start — choose the use case
 *           #/desk                   Provider desk
 *           #/case/<ref>?phase=0..2  Delivery room (use case 1, provider)
 *           #/pay/<ref>?state=…      Approve & pay (use case 1, buyer phone)
 *           #/passport/<serial>?state=delivered|vault
 *           #/vault/<ref>?loan=active|none&price=…   Vault & borrow (use case 2, provider)
 *           #/my/<ref>?state=home|borrow|active|action&price=…&loan=…   Vault & borrow (use case 2, customer phone)
 *  Theme:   theme.js (a classic script, loaded first) applies light / dark before the first paint; the header's toggle flips it.
 *  Modes:   data-ls-mode is the platform's SETTLE_MODE (live | mock, Iteration 53); every document carries `modes` per step.
 *  No inline script, no inline style: the app runs under the platform's strict CSP.
 */
import { ApiSource, MockSource, parseHash, href } from "./data.js";
import { PROVIDER } from "./mock.js";
import { h, replace, modeChip, chrome, header } from "./ui.js";
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

// The top bar (Iteration 58): the platform's bar, for the settlement engine only — the platform hands over its logo,
// the way back and the network; standalone it shows the LiquidSettle mark.
Object.assign(chrome, { logo: ds.lsLogo || "", exit: ds.lsExit || "", network: ds.lsNetwork || "", onPlatform });

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
  demo: !onPlatform && (ds.lsDemo === "1" || settings.mock),   // the dashed "Demo: …" controls — never on the platform
  provider: { ...PROVIDER, ...(ds.lsProvider ? { short: ds.lsProvider } : {}) },
  network: ds.lsNetwork || "testnet",
  platform: ds.lsPlatform || "",                          // the platform's origin for "On the platform ↗" (empty standalone)
  explorer: ds.lsExplorer || "https://testnet.xrpl.org",
  title: ds.lsTitle || "LiquidSettle",
  settleMode: ds.lsMode || (settings.mock ? "mock" : "live"),   // the platform's SETTLE_MODE (Iteration 53)
  banner: ds.lsBanner || "", bannerTone: ds.lsBannerTone || "", // the environment's banner, drawn by the app
  exit: ds.lsExit || "",                                       // the platform's page to go back to
  navigate(path, p = null) { location.hash = href(path, p); },
  href,
  rerender() { route(); },
  toast,
  modeChip({ dark = false } = {}) {
    // Live: the top bar's network pill already says where the data comes from. Only the sample needs a label.
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
  if (settings.mock) { ctx.source = new MockSource(); ctx.mode = "mock"; return; }
  const api = new ApiSource({ base: settings.base, token: settings.token, onAuthError: () => refreshSession(), strict: onPlatform });
  try {
    await api.connect();
    ctx.source = api; ctx.mode = "api";
    ctx.network = api.network;
    if (api.explorer) ctx.explorer = api.explorer;
  } catch (e) {
    if (onPlatform) {
      // Production never falls back to the sample: say what is wrong and offer to try again.
      ctx.source = null; ctx.mode = "offline"; ctx.offlineReason = String((e && e.message) || e);
      return;
    }
    // Standalone without a LiquidGate: run on the sample and say so — never a blank screen, never a fake record.
    ctx.source = new MockSource(); ctx.mode = "mock"; ctx.demo = true;
    toast("LiquidGate is not reachable — showing the sample data", "err");
  }
}

// ── the router ───────────────────────────────────────────────────────────────
const SCREENS = [
  [/^\/$/, start, () => ({})],
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
  if (ctx.mode === "offline") { replace(root, offline()); return; }
  for (const [re, screen, pick] of SCREENS) {
    const m = path.match(re);
    if (!m) continue;
    const p = { ...q, ...pick(m) };
    root.dataset.lsScreen = screen.name;
    document.title = (screen.title ? screen.title(p) : screen.name) + " · " + ctx.title;
    try {
      const el = await screen.render(ctx, p);
      if (my !== seq) return;                      // a newer navigation won
      el.classList.add("ls-enter");
      replace(root, el);
      window.scrollTo(0, 0);
      const main = el.querySelector("main");
      if (main) { main.setAttribute("tabindex", "-1"); main.focus({ preventScroll: true }); }
    } catch (e) {
      if (my !== seq) return;
      console.error(e);
      replace(root, h("div", { class: "ls-page" }, header(ctx.provider), h("main", { class: "ls-wrap" }, h("div", { class: "ls-error" }, h("b", {}, "This screen could not load. "), String(e && e.message || e), " ", h("a", { href: "#/desk" }, "Back to the desk")))));
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
