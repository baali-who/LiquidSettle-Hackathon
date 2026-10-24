/**
 * LiquidGate JS SDK — one ES module, zero dependencies, browser and Node ≥ 18 (global fetch).
 * (The copy LiquidSettle ships; the original is hackathon/dashboard/js/sdk.js — keep them identical
 * apart from the `settle()` method, which the test in tests/test_iteration51_settle.py checks.)
 *
 *   import { LiquidGate } from "./sdk.js";
 *   const lg = new LiquidGate({ base: "https://platform.example/api/lg/v1", token: "lg_test_…" });
 *   const env = await lg.env();                       // free
 *   const c = await lg.case("ZRH-001");              // scope read
 *   const prep = await lg.prepare("ZRH-001", "lock"); // scope case:prepare → unsigned tx + descriptor
 *   await lg.submit("ZRH-001", "lock", { mode: "browser", tx_blob }, { idempotencyKey: crypto.randomUUID() });
 *
 * Every write takes an Idempotency-Key (generated when you do not pass one). Errors are LiquidGateError
 * with `.status` and `.body` ({ ok:false, error, … }). 402 answers carry the x402 terms in `.body`.
 */
export class LiquidGateError extends Error {
  constructor(message, status, body) { super(message); this.name = "LiquidGateError"; this.status = status; this.body = body || null; }
}

function uuid() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "idem-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

export class LiquidGate {
  constructor({ base = "/api/lg/v1", token = "", fetchImpl = null, consumer = "dashboard" } = {}) {
    this.base = base.replace(/\/+$/, "");
    this.token = token;
    this.fetch = fetchImpl || ((...a) => globalThis.fetch(...a));
    this.consumer = consumer;
    this.onAuthError = null;      // (err) => {} — called on 401 so a page can refresh its session token
  }

  headers(extra = {}) {
    const h = { Accept: "application/json", "X-X402-Consumer": this.consumer, ...extra };
    if (this.token) h.Authorization = "Bearer " + this.token;
    return h;
  }

  async request(method, path, { params = null, body = null, idempotencyKey = null, headers = {} } = {}) {
    let url = this.base + path;
    if (params) {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
      const s = q.toString();
      if (s) url += (url.includes("?") ? "&" : "?") + s;
    }
    const init = { method, headers: this.headers(headers) };
    if (body !== null) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
    if (method !== "GET" && method !== "HEAD") init.headers["Idempotency-Key"] = idempotencyKey || uuid();
    const r = await this.fetch(url, init);
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { ok: false, error: text.slice(0, 200) }; }
    if (!r.ok) {
      const err = new LiquidGateError((data && data.error) || `HTTP ${r.status}`, r.status, data);
      if (r.status === 401 && this.onAuthError) this.onAuthError(err);
      throw err;
    }
    return data;
  }

  get(path, params) { return this.request("GET", path, { params }); }
  post(path, body, opts = {}) { return this.request("POST", path, { body: body || {}, ...opts }); }

  // ── free ───────────────────────────────────────────────────────────────────
  health() { return this.get("/health"); }
  env() { return this.get("/env"); }
  descriptors() { return this.get("/descriptors"); }
  descriptor(tx) { return this.get("/descriptors/" + encodeURIComponent(tx)); }
  provenance() { return this.get("/provenance"); }
  receipt(ref) { return this.get(`/cases/${encodeURIComponent(ref)}/receipt.json`); }
  verify(ref, run = false) { return this.get(`/cases/${encodeURIComponent(ref)}/verify`, run ? { run: 1 } : null); }

  // ── the credential ─────────────────────────────────────────────────────────
  me() { return this.get("/me"); }

  // ── cases ──────────────────────────────────────────────────────────────────
  cases() { return this.get("/cases"); }
  open(body = {}, opts) { return this.post("/cases", body, opts); }
  case(ref) { return this.get(`/cases/${encodeURIComponent(ref)}`); }
  beats(ref) { return this.get(`/cases/${encodeURIComponent(ref)}/beats`); }
  events(ref, since = 0) { return this.get(`/cases/${encodeURIComponent(ref)}/events`, { since }); }
  run(ref, action, data = {}, opts) { return this.post(`/cases/${encodeURIComponent(ref)}/run/${encodeURIComponent(action)}`, data, opts); }
  prepare(ref, step, opts) { return this.post(`/cases/${encodeURIComponent(ref)}/prepare/${encodeURIComponent(step)}`, {}, opts); }
  submit(ref, step, data, opts) { return this.post(`/cases/${encodeURIComponent(ref)}/submit/${encodeURIComponent(step)}`, data, opts); }
  xray(ref) { return this.get(`/cases/${encodeURIComponent(ref)}/xray`); }

  // ── the parcels (Iteration 50) ──────────────────────────────────────────────
  shipments(ref) { return this.get(`/cases/${encodeURIComponent(ref)}/shipments`); }
  trackingNumber(ref, sref, number, reuse = false, opts) {
    return this.post(`/cases/${encodeURIComponent(ref)}/shipments/${encodeURIComponent(sref)}/number`, { tracking_number: number, reuse }, opts);
  }
  feePrepare(ref, sref, opts) { return this.post(`/cases/${encodeURIComponent(ref)}/shipments/${encodeURIComponent(sref)}/fee/prepare`, {}, opts); }
  fee(ref, sref, data, opts) { return this.post(`/cases/${encodeURIComponent(ref)}/shipments/${encodeURIComponent(sref)}/fee`, data, opts); }
  simulate(ref, sref, action, data = {}, opts) {
    return this.post(`/cases/${encodeURIComponent(ref)}/shipments/${encodeURIComponent(sref)}/simulate/${encodeURIComponent(action)}`, data, opts);
  }

  // ── LiquidSettle view-models (Iteration 51) ────────────────────────────────
  //    GET /settle/desk · /settle/room/{ref} · /settle/pay/{ref} · /settle/passport/{serial}
  //    /settle/vault/{ref} · /settle/customer/{ref} · /settle/presenter/{scenario} · /settle/custody[/{ref}]  — scope read.
  //    Each answer is one screen's data, with `live_or_simulated` per step and `links` into the platform.
  settle(screen, id = null, params = null) {
    return this.get("/settle/" + encodeURIComponent(screen) + (id ? "/" + encodeURIComponent(id) : ""), params);
  }

  // ── x402 ───────────────────────────────────────────────────────────────────
  ladder(params = {}) { return this.get("/ladder", params); }

  // ── the board ──────────────────────────────────────────────────────────────
  board(since = 0, team = null, caseRef = null) { return this.get("/board", { since, team, case: caseRef }); }
  boardCounts(team = null) { return this.get("/board/counts", { team }); }
  note(message, extra = {}, opts) { return this.post("/board/notes", { message, ...extra }, opts); }
  commit(key, hash, message, opts) { return this.post("/board/commits", { key, hash, message }, opts); }

  // ── the agent ──────────────────────────────────────────────────────────────
  tools() { return this.get("/agent/tools"); }
  tool(name, args = {}, opts) { return this.post(`/agent/tools/${encodeURIComponent(name)}`, { args }, opts); }

  /** Poll the board (works with a bearer header, unlike EventSource). Returns a stop function. */
  watchBoard(onLines, { every = 3000, since = 0, team = null } = {}) {
    let last = since, timer = null, stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        const r = await this.board(last, team);
        if (r.lines && r.lines.length) { last = r.last; onLines(r.lines, last); }
      } catch (e) { /* the next tick tries again; the page shows the connection chip */ }
      if (!stopped) timer = setTimeout(tick, every);
    };
    tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }
}

export default LiquidGate;
