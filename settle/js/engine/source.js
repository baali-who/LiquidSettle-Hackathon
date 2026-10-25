/**
 * Where the settlement engine's documents come from (Iteration 59).
 *
 *   DealsApi     LiquidGate /api/lg/v1/deals… — the platform's deals, every step a real transaction
 *   DealsSample  engine/sample.json — the same documents, recorded from a run against the test ledger, for the
 *                public repository run without a platform (`?mock=1`). Never used on the platform; every screen
 *                says "Sample data" when it shows it, and the actions explain that they need a platform.
 */
export class DealsApi {
  constructor(gate) { this.gate = gate; this.kind = "api"; }
  home() { return this.gate.get("/deals/home"); }
  list(tab = "", q = "") { return this.gate.get("/deals", { tab, q }); }
  deal(ref) { return this.gate.get("/deals/" + encodeURIComponent(ref)).then((r) => r.deal); }
  whatIf(ref, price) { return this.gate.get(`/deals/${encodeURIComponent(ref)}/what-if`, { price }); }
  activity() { return this.gate.get("/deals/activity"); }
  vault() { return this.gate.get("/deals/vault"); }
  money() { return this.gate.get("/deals/money"); }
  catalog() { return this.gate.get("/deals/catalog"); }
  price() { return this.gate.get("/deals/price"); }
  customers(q = "") { return this.gate.get("/deals/customers", { q }).then((r) => r.customers); }
  invite(body) { return this.gate.post("/deals/customers", body).then((r) => r.customer); }
  create(body) { return this.gate.post("/deals", body).then((r) => r.deal); }
  action(ref, action, body = {}) { return this.gate.post(`/deals/${encodeURIComponent(ref)}/actions/${encodeURIComponent(action)}`, body).then((r) => r.deal); }
  publishPrice(body) { return this.gate.post("/deals/price", body).then((r) => r.price); }
  seed(body = {}) { return this.gate.post("/deals/seed", body).then((r) => r.seed); }
  seedStatus() { return this.gate.get("/deals/seed").then((r) => r.seed); }
}

const NEEDS_PLATFORM = "Sample data — this step runs on a platform (it signs real transactions).";

/**
 * The sample was recorded against an in-memory ledger: its hashes were never on any network. So the sample never
 * says LIVE (it says SAMPLE) and never links a hash to an explorer — the proofs live in docs/, not here.
 */
function sampleOnly(doc) {
  const walk = (x) => {
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (!x || typeof x !== "object") return;
    for (const [k, v] of Object.entries(x)) {
      if (k === "pill" && v === "LIVE") x[k] = "SAMPLE";
      else if ((k === "url" || k === "href") && typeof v === "string" && /\/(transactions|tx)\//.test(v)) x[k] = null;
      else walk(v);
    }
  };
  walk(doc);
  return doc;
}

export class DealsSample {
  constructor() { this.kind = "sample"; this._doc = null; }
  async _load() {
    if (!this._doc) {
      const r = await fetch(new URL("./sample.json", import.meta.url));
      this._doc = sampleOnly(await r.json());
    }
    return this._doc;
  }
  async home() { return (await this._load()).home; }
  async list(tab = "", q = "") {
    const rows = (await this._load()).home.deals.filter((r) => (!tab || (r.tabs || [r.tab]).includes(tab)) && (!q || (r.ref + " " + r.customer.name).toLowerCase().includes(q.toLowerCase())));
    return { deals: rows };
  }
  async deal(ref) { const d = (await this._load())[ref]; if (!d) throw new Error("There is no deal with this reference."); return d.deal; }
  async whatIf() { throw new Error(NEEDS_PLATFORM); }
  async activity() { return (await this._load()).activity; }
  async vault() { return (await this._load()).vault; }
  async money() { return (await this._load()).money; }
  async catalog() { return (await this._load()).catalog; }
  async price() { return (await this._load()).home.price; }
  async customers(q = "") {
    const seen = new Map();
    for (const r of (await this._load()).home.deals) seen.set(r.customer.name, { ...r.customer, kyc: "VERIFIED", verified: true, open_deals: 1 });
    return [...seen.values()].filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  }
  async invite() { throw new Error(NEEDS_PLATFORM); }
  async create() { throw new Error(NEEDS_PLATFORM); }
  async action() { throw new Error(NEEDS_PLATFORM); }
  async publishPrice() { throw new Error(NEEDS_PLATFORM); }
  async seed() { throw new Error(NEEDS_PLATFORM); }
  async seedStatus() { return (await this._load()).home.seed; }
}
