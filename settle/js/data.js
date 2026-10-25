/**
 * LiquidSettle — the data layer. One interface, two sources:
 *
 *   ApiSource   view-models from LiquidGate (`GET /api/lg/v1/settle/<screen>/<id>`), built by the platform
 *               from its own records (the Au case, its parcels, the oracle, the ledger receipts). Every
 *               step says whether it is live on the ledger or simulated, and links to the platform's page.
 *   MockSource  the handoff's sample data (mock.js) — what the design was drawn with. Used standalone
 *               (`?mock=1`, or no API reachable) and as the fallback when the platform has no such case,
 *               in which case the screen says "Sample data" so nobody mistakes it for a record.
 *
 * Screens never import mock.js or sdk.js directly: they ask `ctx.source` and render what comes back.
 */
import { LiquidGate, LiquidGateError } from "./sdk.js";
import * as mock from "./mock.js";

export class MockSource {
  constructor() { this.kind = "mock"; this.label = "Sample data"; }
  async desk() { return mock.desk(); }
  async room(id, { phase = 0 } = {}) { return mock.room(Number(phase) || 0); }
  async pay(id) { return mock.pay(); }
  async passport(serial, { state = "delivered" } = {}) { return mock.passport(state); }
  async vault(id, { loan = "active", price = 100 } = {}) { return mock.vault({ loan, price: Number(price) || 100 }); }
  async customer(id, { state = "home", price = 100, loan = null } = {}) { return mock.customer({ price: Number(price) || 100, loan: loan ? Number(loan) : null, state }); }
  async custody(caseRef = null) { return mock.custody(caseRef, caseRef === "LS-1044" ? "ledger" : "xaman"); }
  async simulate() { throw new Error("Sample data has no simulator — the phase is in the link (?phase=1)"); }
}

export class ApiSource {
  constructor({ base, token, onAuthError = null, consumer = "settle", strict = false }) {
    this.kind = "api"; this.label = "LiquidGate";
    this.strict = strict;            // Iteration 58: on the platform a missing case is an error, never the sample
    this.gate = new LiquidGate({ base, token, consumer });
    this.gate.onAuthError = onAuthError;
    this.fallback = new MockSource();
    this.env = null;
  }
  async connect() {
    this.env = await this.gate.env();
    const net = this.env.network && typeof this.env.network === "object" ? (this.env.network.mode || this.env.network.configured) : this.env.network;
    this.network = net || "testnet";
    this.explorer = this.env.network && this.env.network.explorer_base ? this.env.network.explorer_base.replace(/\/transactions\/?$/, "") : null;
    this.label = "LiquidGate · " + this.network;
    return this.env;
  }
  /** A 404 (the platform has no such case) falls back to the sample so the screen still tells the story — marked `sample: true`.
   *  Strict (the platform, live only): a 404 / 403 is said plainly instead. */
  async _vm(screen, id, params, fallback) {
    try {
      const vm = await this.gate.settle(screen, id, params);
      return { sample: false, ...vm, _source: "api" };
    } catch (e) {
      if (e instanceof LiquidGateError && (e.status === 404 || e.status === 403)) {
        if (this.strict) throw new Error(e.status === 403 ? "This settlement belongs to someone else." : "There is no settlement with this reference.");
        const vm = await fallback();
        return { ...vm, sample: true, _source: "mock", _why: e.status === 403 ? "not yours" : "no such case" };
      }
      throw e;
    }
  }
  desk() { return this._vm("desk", null, null, () => this.fallback.desk()); }
  room(id, { phase } = {}) { return this._vm("room", id, phase !== undefined ? { phase } : null, () => this.fallback.room(id, { phase })); }
  pay(id) { return this._vm("pay", id, null, () => this.fallback.pay(id)); }
  passport(serial, opts = {}) { return this._vm("passport", serial, null, () => this.fallback.passport(serial, opts)); }
  vault(id, opts = {}) { return this._vm("vault", id, null, () => this.fallback.vault(id, opts)); }
  customer(id, opts = {}) { return this._vm("customer", id, opts.state ? { state: opts.state } : null, () => this.fallback.customer(id, opts)); }
  /** Iteration 52 — the five custody options with their status on this platform; with a case, which one holds its wallet. */
  custody(caseRef = null) { return this._vm("custody", caseRef, null, () => this.fallback.custody(caseRef)); }
  /** The demo controls in API mode go through the platform's parcel simulator (operator scope). */
  simulate(ref, sref, action, data = {}) { return this.gate.simulate(ref, sref, action, data); }
}

/** Query-string helpers for the hash router: `#/case/LS-1042?phase=1` → { path: "/case/LS-1042", params }. */
export function parseHash(hash) {
  const raw = (hash || "").replace(/^#/, "") || "/";
  const [path, qs = ""] = raw.split("?");
  return { path: path.startsWith("/") ? path : "/" + path, params: Object.fromEntries(new URLSearchParams(qs)) };
}
export function href(path, params = null) {
  const q = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")).toString() : "";
  return "#" + path + (q ? "?" + q : "");
}
