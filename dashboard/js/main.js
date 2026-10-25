/** LiquidGold · Lending — the dashboard's entry point.
 *
 *  Boot: read the mount's data attributes (the platform page sets the API base, a session token, the
 *  person's latest case, mock mode), merge the per-browser settings, pick the gate (LiquidGate over
 *  fetch, or MockGate over fixtures), build the one-screen layout, connect, poll. Every action goes
 *  through `actions` so panels stay dumb. Nothing here signs: the sign panel calls xrpl.js when the
 *  platform page loaded it, or takes a pasted blob. */
import { LiquidGate, LiquidGateError } from "./sdk.js";
import { MockGate, SCENARIOS } from "./mock.js";
import { Store, initial } from "./state.js";
import { h, toast } from "./ui.js";
import { mountHeader } from "./panels/header.js";
import { mountRail } from "./panels/rail.js";
import { mountStage } from "./panels/stage.js";
import { mountFacts } from "./panels/facts.js";
import { mountXray } from "./panels/xray.js";
import { mountTerminal } from "./panels/terminal.js";
import { mountAurum, mountBoard, mountVerify, mountProvenance, mountSettings, mountFooter } from "./panels/side.js";
import { mountLive } from "./panels/live.js";

const KEY = "liquidgate.settings.v1";
const root = document.getElementById("lq-root") || document.querySelector(".lq-app");
const ds = root.dataset;
const params = new URLSearchParams(location.search);

function loadSettings() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
function saveSettings(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private window: settings live for this load */ } }

const stored = loadSettings();
const onPlatform = !!ds.lgSessionUrl && ds.lgMock !== "1";
const settings = {
  base: ds.lgApi || stored.base || "/api/lg/v1",
  token: ds.lgToken || (onPlatform ? "" : stored.token || ""),
  team: stored.team || "",
  caseRef: params.get("case") || ds.lgCase || stored.caseRef || "",
  mock: ds.lgMock === "1" || params.get("mock") === "1" || (!onPlatform && !!stored.mock),
  scenario: SCENARIOS[params.get("scenario")] ? params.get("scenario") : (SCENARIOS[stored.scenario] ? stored.scenario : "today"),
};

const store = new Store({ ...initial, settings, mock: settings.mock, admin: ds.lgAdmin === "1", caseRef: settings.caseRef });
let gate = null, stopBoard = null, eventsTimer = null, lastSeq = 0;

// ── layout ───────────────────────────────────────────────────────────────────
root.querySelectorAll("[data-lq-boot]").forEach((el) => el.remove());
const left = h("div", { class: "lq-col lq-col-left" });
const centre = h("div", { class: "lq-col lq-col-centre" });
const right = h("div", { class: "lq-col lq-col-right" });
const main = h("main", { class: "lq-main" }, left, centre, right);

const actions = {
  selectBeat: (key) => store.set({ selectedBeat: key, prep: null }),
  reload: () => connect(),
  toggleSettings: () => store.set({ settingsOpen: !store.get("settingsOpen") }),
  applySettings: (patch) => {
    const next = { ...store.get("settings"), ...patch };
    store.set({ settings: next, mock: !!next.mock, caseRef: next.caseRef || "", settingsOpen: false });
    saveSettings({ base: next.base, token: onPlatform ? "" : next.token, team: next.team, caseRef: next.caseRef, mock: next.mock, scenario: next.scenario });
    connect();
  },
  openCase: () => guard(async () => { const r = await gate.open({ grams: "10000" }); store.set({ caseRef: r.case.ref }); toast(`Case ${r.case.ref} opened`, "ok"); await loadCase(); }),
  run: (action, data = {}) => guard(async () => {
    if (action === "reset" && !window.confirm("Reset the case? Its lines stay on the ledger; the platform forgets the case.")) return;
    const r = await gate.run(store.get("caseRef"), action, data);
    toast(r.message, "ok");
    store.set({ prep: null });
    await loadCase();
  }),
  prepare: (step) => guard(async () => {
    const r = await gate.prepare(store.get("caseRef"), step);
    const beat = (store.get("caseDoc").beats.find((b) => (b.actions || []).some((a) => a.step === step)) || {}).key;
    store.set({ prep: { ...r, beat, step } });
  }),
  submitDemo: (step) => actions.submit(step, { mode: "demo" }),
  submit: (step, data) => guard(async () => {
    const r = await gate.submit(store.get("caseRef"), step, data);
    toast(`${step}: ${r.kind.toUpperCase()} ${r.tx_type || ""} ${r.hash ? r.hash.slice(0, 12) + "…" : ""}`, "ok");
    store.set({ prep: null });
    await loadCase();
  }),
  discardPrep: () => store.set({ prep: null }),
  xray: () => guard(async () => {
    try { const r = await gate.xray(store.get("caseRef")); store.set({ xray: r.xray }); }
    catch (e) { if (e instanceof LiquidGateError && e.status === 501 && e.body && e.body.xray) store.set({ xray: e.body.xray }); else throw e; }
  }),
  verify: () => guard(async () => { const r = await gate.verify(store.get("caseRef"), true); store.set({ verifyResult: r }); toast(`${r.lines.length} read-back(s)`, "ok"); }),
  receipt: () => guard(async () => { const r = await gate.receipt(store.get("caseRef")); store.set({ receiptDoc: r }); }),
  tool: (name) => guard(async () => { const r = await gate.tool(name, { case_ref: store.get("caseRef") }); store.set({ toolResult: r }); }),
  note: (text) => guard(async () => { await gate.note(text, { case_ref: store.get("caseRef") || undefined }); }),
  openLink: (kind) => {
    const base = store.get("settings").base;
    const url = kind === "openapi" ? base + "/openapi.json" : kind === "env" ? base + "/env" : base + "/provenance.md";
    if (store.get("mock")) { toast("Mock mode — the links point at a platform's API", "err"); return; }
    window.open(url, "_blank", "noopener");
  },
};

mountHeader(root, store, actions);
root.appendChild(main);
mountRail(left, store, actions);
mountStage(centre, store, actions);
mountFacts(centre, store);
mountXray(centre, store, actions);
mountTerminal(centre, store);
mountLive(right, store);
mountAurum(right, store, actions);
mountBoard(right, store, actions);
mountVerify(right, store, actions);
mountProvenance(right, store);
mountFooter(root, store, actions);
mountSettings(root, store, actions);

// ── the gate ─────────────────────────────────────────────────────────────────
async function guard(fn) {
  if (store.get("busy")) return;
  store.set({ busy: true, lastError: null });
  try { await fn(); }
  catch (e) {
    const msg = e instanceof LiquidGateError ? `${e.message}${e.status === 402 ? " (x402: payment required)" : ""}` : (e && e.message) || String(e);
    store.set({ lastError: msg });
    toast(msg, "err");
    if (e instanceof LiquidGateError && e.status === 401) store.set({ connection: "auth" });
  } finally { store.set({ busy: false }); }
}

async function refreshSession() {
  if (!onPlatform) return false;
  try {
    const r = await fetch(ds.lgSessionUrl, { method: "POST", headers: { "X-CSRFToken": ds.lgCsrf || "", Accept: "application/json" }, credentials: "same-origin" });
    const j = await r.json();
    if (j.ok && j.token) { gate.token = j.token; store.set({ settings: { ...store.get("settings"), token: j.token } }); return true; }
  } catch (e) { /* the page's session is gone; the chip says so */ }
  return false;
}

function makeGate() {
  const s = store.get("settings");
  if (store.get("mock")) return new MockGate(s.scenario);
  const g = new LiquidGate({ base: s.base, token: s.token, consumer: "dashboard" });
  let refreshing = false;
  g.onAuthError = async () => { if (refreshing) return; refreshing = true; if (await refreshSession()) { connect(); } refreshing = false; };
  return g;
}

async function connect() {
  if (stopBoard) { stopBoard(); stopBoard = null; }
  if (eventsTimer) { clearInterval(eventsTimer); eventsTimer = null; }
  gate = makeGate();
  store.set({ connection: "connecting", env: null, me: null, caseDoc: null, events: [], board: [], boardLast: 0, counts: null, tools: null, xray: null, prep: null, verifyResult: null, receiptDoc: null, toolResult: null });
  lastSeq = 0;
  try {
    const env = await gate.env();
    store.set({ env, provenance: env.provenance });
    let me = null;
    if (gate.token || store.get("mock")) {
      try { me = await gate.me(); } catch (e) { if (e instanceof LiquidGateError && e.status === 401) { store.set({ connection: "auth" }); toast("Credential refused — open Settings", "err"); return; } throw e; }
    }
    store.set({ me, connection: "ok" });
    if (!me) { toast("Connected without a credential: /env is public; add a key or sign in for the rest", ""); return; }
    const scopes = me.principal.scopes;
    if (scopes.includes("read")) {
      if (!store.get("caseRef")) {
        const cs = await gate.cases();
        const mine = cs.cases.filter((c) => c.mine) ;
        const pick = mine.find((c) => c.state === "open") || mine[0] || cs.cases[0];
        if (pick) store.set({ caseRef: pick.ref });
      }
      await loadCase();
      stopBoard = gate.watchBoard((lines, last) => store.set({ board: [...store.get("board"), ...lines].slice(-300), boardLast: last }),
                                  { every: ((env.board && env.board.poll_s) || 3) * 1000, team: store.get("settings").team || null });
      gate.boardCounts(store.get("settings").team || null).then((r) => store.set({ counts: r.counts })).catch(() => {});
      eventsTimer = setInterval(pollEvents, 4000);
    }
    if (scopes.includes("agent")) gate.tools().then((t) => store.set({ tools: t })).catch(() => {});
    gate.descriptors().then((d) => store.set({ descriptors: d.descriptors })).catch(() => {});
  } catch (e) {
    store.set({ connection: "offline" });
    toast(e instanceof LiquidGateError ? e.message : "LiquidGate is not reachable — check the API base in Settings", "err");
  }
}

async function loadCase() {
  const ref = store.get("caseRef");
  if (!ref) { store.set({ caseDoc: null, events: [] }); return; }
  const r = await gate.case(ref);
  const doc = r.case;
  const current = (doc.beats || []).find((b) => b.state === "current");
  const sel = store.get("selectedBeat");
  const keep = sel && (doc.beats || []).some((b) => b.key === sel && b.state !== "done");
  store.set({ caseDoc: doc, selectedBeat: keep ? sel : (current ? current.key : (doc.beats[0] || {}).key) });
  const ev = await gate.events(ref, 0);
  lastSeq = ev.events.length ? ev.events[ev.events.length - 1].seq : 0;
  store.set({ events: ev.events });
  if (!store.get("xray")) actions.xray();
  gate.boardCounts(store.get("settings").team || null).then((x) => store.set({ counts: x.counts })).catch(() => {});
}

async function pollEvents() {
  const ref = store.get("caseRef");
  if (!ref || store.get("busy")) return;
  try {
    const ev = await gate.events(ref, lastSeq);
    if (ev.events.length) {
      lastSeq = ev.events[ev.events.length - 1].seq;
      store.set({ events: [...store.get("events"), ...ev.events] });
      const doc = store.get("caseDoc");
      if (doc && (doc.beat !== ev.beat || doc.state !== ev.state)) await loadCase();
    }
  } catch (e) { /* the next poll tries again */ }
}

connect();
