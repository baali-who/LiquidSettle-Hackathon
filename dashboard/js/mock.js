/** MockGate — the SDK's interface over fixtures, with enough of a state machine that a judge can
 *  click through the beats without a platform. Every answer is labelled DEMO; nothing is signed. */
import { LiquidGateError } from "./sdk.js";
import * as F from "./fixtures.js";

const ORDER = ["deposit", "credential", "mint", "refusal", "lock", "price", "sale", "payoff", "verify"];
const STEP_BEAT = { accept: "credential", optin: "mint", lock: "lock", mandate: "lock", topup: "price", burn: "payoff" };
const STEP_TX = { accept: "CredentialAccept", optin: "MPTokenAuthorize", lock: "EscrowCreate", mandate: "DelegateSet", topup: "EscrowCreate", burn: "Payment" };
const clone = (o) => JSON.parse(JSON.stringify(o));
const now = () => new Date().toISOString();
const fakeHash = () => Array.from({ length: 64 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class MockGate {
  constructor() {
    this.mock = true;
    this.env_ = clone(F.ENV);
    this.case_ = clone(F.CASE);
    this.events_ = clone(F.EVENTS);
    this.board_ = clone(F.BOARD);
    this.token = "";
    this.onAuthError = null;
    this.latency = 180;
  }
  async _d(v) { await sleep(this.latency); return clone(v); }
  _line(kind, message, extra = {}) {
    const id = (this.board_[this.board_.length - 1]?.id || 0) + 1;
    const line = { id, kind, team: "LiquidLabs", case_ref: this.case_.ref, beat: this.case_.beat, message, at: now(), ...extra };
    this.board_.push(line);
    return line;
  }
  _event(beat, actor, kind, tx_type, message, hash = null, result = null) {
    const seq = (this.events_[this.events_.length - 1]?.seq || 0) + 1;
    const e = { seq, beat, actor, kind, tx_type, message, hash, result, at: now(), explorer: null };
    this.events_.push(e);
    this.case_.counts[kind === "live" ? "live" : kind === "demo" ? "demo" : kind === "refused" ? "refused" : "notes"] += 1;
    this.case_.counts.total += 1;
    return e;
  }
  _advance(beat) { const i = ORDER.indexOf(beat); if (i >= 0 && i + 1 < ORDER.length) this.case_.beat = ORDER[i + 1]; }
  _step() {
    const c = this.case_;
    if (c.state !== "open") return null;
    if (c.beat === "credential" && c.hashes.credential_txid && !c.hashes.credential_accept_txid) return "accept";
    if (c.beat === "mint" && !c.hashes.optin_txid) return "optin";
    if (c.beat === "lock" && !c.escrow.txid) return "lock";
    if (c.beat === "lock" && c.escrow.txid && !c.mandate.txid) return "mandate";
    if (c.beat === "price" && c.topup_pending && !c.hashes.topup_escrow_txid) return "topup";
    if (c.beat === "payoff" && c.hashes.finish_txid && !c.hashes.burn_txid) return "burn";
    return null;
  }
  _beats() {
    const c = this.case_;
    const idx = ORDER.indexOf(c.beat);
    const done = (k) => {
      if (k === "refusal") return !!c.hashes.refusal_txid;
      if (k === "price") return c.ladder.rung !== null;
      if (k === "sale") return !!c.hashes.sale_txid;
      if (k === "payoff") return !!c.hashes.burn_txid || c.state !== "open";
      if (k === "verify") return c.state !== "open";
      return ORDER.indexOf(k) < idx;
    };
    const step = this._step();
    return this.env_.beats.map((b) => {
      const state = ORDER.includes(b.key) ? (done(b.key) ? "done" : b.key === c.beat ? "current" : "later") : "planned";
      const actions = (ACTIONS[b.key] || []).map((a) => {
        a = { ...a };
        if (a.kind === "holder") { a.available = state === "current" && step === a.step; a.live = true; a.tx = STEP_TX[a.step]; a.current = step === a.step; }   // live in mock: the sign panel shows; every submit still records DEMO
        else if (a.kind === "operator") a.available = state === "current" && c.state === "open" && a.action !== "start";
        else a.available = false;
        return a;
      });
      return { ...b, state, actions };
    });
  }
  _doc() { return { ...clone(this.case_), beats: this._beats(), current_step: this._step() }; }

  // ── the interface ──────────────────────────────────────────────────────────
  health() { return this._d({ ok: true, liquidgate: "1.0", network: "testnet", board: true, x402: { configured: true }, mock: true }); }
  env() { return this._d(this.env_); }
  descriptors() { return this._d({ ok: true, schema: "clear-signing-descriptor/xrpl/0.1", descriptors: F.DESCRIPTORS }); }
  descriptor(tx) { return F.DESCRIPTORS[tx] ? this._d({ ok: true, descriptor: F.DESCRIPTORS[tx] }) : Promise.reject(new LiquidGateError("no descriptor", 404)); }
  provenance() { return this._d({ ok: true, ...this.env_.provenance }); }
  me() { return this._d({ ok: true, principal: { kind: "session", id: "session:mock", label: "mock", scopes: ["read", "case:prepare", "case:submit", "operator", "agent", "board"], team: "LiquidLabs", acts_for_user: true, rate_limit: "∞ (mock)" } }); }
  cases() { return this._d({ ok: true, cases: [{ ...this.case_, mine: true }] }); }
  case(ref) { return ref === this.case_.ref ? this._d({ ok: true, case: this._doc() }) : Promise.reject(new LiquidGateError("no such case for this credential", 404)); }
  beats(ref) { return this.case(ref).then((r) => ({ ok: true, ref, beat: r.case.beat, state: r.case.state, step: r.case.current_step, beats: r.case.beats })); }
  events(ref, since = 0) { return this._d({ ok: true, ref, events: this.events_.filter((e) => e.seq > since), beat: this.case_.beat, state: this.case_.state }); }
  xray() { return Promise.reject(new LiquidGateError("planned — the X-ray reads node C during the hackathon", 501, { ok: false, xray: XRAY_PLAN })); }
  ladder(p = {}) {
    const grams = Number(p.grams || 10000), debt = Number(p.debt || 600000), price = Number(p.price || 100);
    const value = grams * price, ltv = debt / value * 100;
    const rungs = this.env_.ladder.map((r) => ({ ...r, price_at: (debt / (grams * r.ltv_pct / 100)).toFixed(4) }));
    const rung = ltv >= 85 ? "sale" : ltv >= 80 ? "impair" : ltv >= 75 ? "topup" : ltv >= 70 ? "notify" : "safe";
    return this._d({ ok: true, price_per_g: String(price), grams: String(grams), debt: String(debt), value: String(value), ltv_pct: ltv.toFixed(2), rung, rungs, paid: false, mock: true });
  }
  receipt(ref) { return this._d({ ok: true, receipt: { case: ref, demo: true, note: "mock receipt — the real one is canonical JSON hashed with SHA-256" }, sha256: fakeHash().toLowerCase(), sealed: this.case_.receipt }); }
  verify(ref, run = false) {
    const lines = run ? this.events_.filter((e) => e.hash).map((e, i) => ({ seq: 100 + i, kind: "read", message: `tx — ${e.tx_type}: ${e.hash.slice(0, 16)}… (mock read)`, hash: e.hash, result: "validated" })) : [];
    if (run) this._line("verify", `${ref}: ${lines.length} read-backs (mock)`);
    return this._d({ ok: true, ref, counts: this.case_.counts, receipt: this.case_.receipt, lines, public_node_url: this.env_.network.public_node_url, note: "mock" });
  }
  board(since = 0) { const lines = this.board_.filter((l) => l.id > since); return this._d({ ok: true, lines, last: lines.length ? lines[lines.length - 1].id : since }); }
  boardCounts() { const c = { calls: 0, beats: 0, verifies: 0, refusals: 0, notes: 0, commits: 0, teams: { LiquidLabs: this.board_.length } }; for (const l of this.board_) c[{ beat: "beats", verify: "verifies", refusal: "refusals", note: "notes", commit: "commits" }[l.kind] || "calls"] += 1; return this._d({ ok: true, counts: c }); }
  note(message) { return this._d({ ok: true, line: this._line("note", message) }); }
  commit(key, hash, message) { this.env_.provenance.built_during.push(`${key} · ${message} · ${hash.slice(0, 12)}`); return this._d({ ok: true, line: this._line("commit", `NEW ${key}: ${message} (${hash.slice(0, 12)})`) }); }
  tools() { return this._d(F.TOOLS); }
  tool(name) {
    if (F.TOOLS.tools.find((t) => t.name === name)?.status === "planned") return Promise.reject(new LiquidGateError("planned — this servicer tool is built on node C during the hackathon", 501));
    return this._d({ ok: true, tool: name, result: F.TOOL_RESULTS[name] || { note: "no fixture" } });
  }
  watchBoard(onLines, { every = 2500, since = 0 } = {}) {
    let last = since, stopped = false;
    const tick = async () => { if (stopped) return; const r = await this.board(last); if (r.lines.length) { last = r.last; onLines(r.lines, last); } if (!stopped) setTimeout(tick, every); };
    tick();
    return () => { stopped = true; };
  }
  open(body = {}) { this.case_ = clone(F.CASE); this.case_.grams = String(body.grams || 10000); this.events_ = clone(F.EVENTS).slice(0, 1); this._line("beat", `${this.case_.ref}: case opened — ${this.case_.grams} g (mock)`); return this._d({ ok: true, case: this._doc() }); }

  async run(ref, action, data = {}) {
    await sleep(this.latency);
    const c = this.case_;
    if (ref !== c.ref) throw new LiquidGateError("no such case", 404);
    let message;
    if (action === "credential") { c.hashes.credential_txid = fakeHash(); this._event("credential", "platform", "demo", "CredentialCreate", "KYC credential issued (DEMO)", c.hashes.credential_txid, "tesSUCCESS"); message = "Credential issued — accept it with the wallet."; }
    else if (action === "refusal") { c.hashes.refusal_txid = fakeHash(); this._event("refusal", "outsider", "refused", "MPTokenAuthorize", "The outsider is refused: tecNO_AUTH", c.hashes.refusal_txid, "tecNO_AUTH"); this._advance("refusal"); message = "The ledger refused the outsider: tecNO_AUTH."; }
    else if (action === "skip_refusal") { this._advance("refusal"); message = "Refusal skipped."; }
    else if (action === "price") {
      const price = Number(data.market ? 98.5 : data.price || 100);
      c.price_now = String(price);
      const debt = Number(c.loan.outstanding || 0) || 600000;
      const ltv = debt / (Number(c.collateral_grams) * price) * 100;
      c.ltv_pct = ltv.toFixed(2); c.ladder.ltv_pct = c.ltv_pct;
      const rung = ltv >= 85 ? "sale" : ltv >= 80 ? "impair" : ltv >= 75 ? "topup" : ltv >= 70 ? "notify" : "safe";
      c.ladder.rung = rung; c.ladder_rung = rung; c.ladder.impaired = c.ladder.impaired || rung === "impair" || rung === "sale"; c.ladder.sale_proposed = rung === "sale";
      this._event("price", "platform", "demo", "OracleSet", `Price ${price} RLUSD/g published — LTV ${c.ltv_pct} %, rung ${rung} (DEMO)`, fakeHash(), "tesSUCCESS");
      if (rung === "topup") c.topup_pending = true;
      message = `Price published — LTV ${c.ltv_pct} %, rung: ${rung}.`;
    }
    else if (action === "topup") { c.hashes.topup_mint_txid = fakeHash(); c.topup_grams = "1500"; c.collateral_grams = String(Number(c.grams) + 1500); c.topup_pending = true; this._event("price", "custodian", "demo", "Payment", "1,500 LGAU top-up minted (DEMO)", c.hashes.topup_mint_txid, "tesSUCCESS"); message = "Top-up bars minted — lock them with the wallet."; }
    else if (action === "sell") { c.hashes.finish_txid = fakeHash(); c.hashes.sale_txid = fakeHash(); c.state = "sold"; c.loan.outstanding = "0"; c.loan_outstanding = "0"; this._event("sale", "agent", "demo", "Batch", "EscrowFinish + Payment (Delegate) + LoanPay — sold and repaid (DEMO)", c.hashes.sale_txid, "tesSUCCESS"); c.beat = "verify"; c.receipt.can_seal = true; c.receipt.why = ""; message = "Sold and repaid."; }
    else if (action === "payoff") { c.hashes.finish_txid = fakeHash(); c.loan.outstanding = "0"; c.loan_outstanding = "0"; c.beat = "payoff"; this._event("payoff", "platform", "demo", "EscrowFinish", "Loan paid off — escrow released with the fulfillment (DEMO)", c.hashes.finish_txid, "tesSUCCESS"); message = "Paid off and released — redeem (burn) with the wallet."; }
    else if (action === "reset") { this.case_ = clone(F.CASE); this.events_ = clone(F.EVENTS); message = "Case reset."; }
    else throw new LiquidGateError("unknown action", 404);
    this._line("beat", `${ref}: ${message}`);
    return { ok: true, message, beat: this.case_.beat, state: this.case_.state, step: this._step() };
  }

  async prepare(ref, step) {
    await sleep(this.latency);
    if (!STEP_BEAT[step]) throw new LiquidGateError("not a step", 404);
    return { ok: true, tx: clone(F.UNSIGNED[step]), address: F.HOLDER, step, label: LABELS[step], tx_type: STEP_TX[step], descriptor: F.DESCRIPTORS[STEP_TX[step]] || null, mock: true };
  }

  async submit(ref, step, data = {}) {
    await sleep(this.latency);
    const c = this.case_;
    if (this._step() !== step) throw new LiquidGateError("This step is not the one the case is waiting for.", 422);
    const h = fakeHash();
    const kind = data.mode === "demo" ? "demo" : "demo";          // mock never signs: every submit is a DEMO record
    if (step === "accept") { c.hashes.credential_accept_txid = h; this._advance("credential"); }
    else if (step === "optin") { c.hashes.optin_txid = h; c.hashes.authorize_txid = fakeHash(); c.hashes.mint_txid = fakeHash(); this._event("mint", "custodian", "demo", "Payment", "10,000 LGAU minted (DEMO)", c.hashes.mint_txid, "tesSUCCESS"); this._advance("mint"); }
    else if (step === "lock") { c.escrow = { txid: h, sequence: 1234567, condition: F.UNSIGNED.lock.Condition, cancel_after: new Date(Date.now() + 3 * 60000).toISOString(), live: false }; c.hashes.escrow_txid = h; c.price_at_lock = c.price_now; }
    else if (step === "mandate") { c.mandate = { txid: h, live: false }; c.hashes.delegate_txid = h; c.loan = { ...c.loan, ref: "LOAN-ZRH-001", principal: "600000.00", outstanding: "600000.00" }; c.loan_principal = "600000.00"; c.loan_outstanding = "600000.00"; this._event("lock", "broker", "demo", "LoanSet", "Loan written: 600,000 RLUSD at 6.5 % — simulated on the platform; LoanSet on node C is NEW", fakeHash(), "tesSUCCESS"); c.beat = "price"; c.ladder.presets = [{ price: "85.71", label: "85.71 → LTV ≈ 70 % — notify", rung: "notify" }, { price: "77.92", label: "77.92 → LTV ≈ 77 % — prepare the top-up", rung: "topup" }, { price: "72.29", label: "72.29 → LTV ≈ 83 % — impair", rung: "impair" }, { price: "68.18", label: "68.18 → LTV ≈ 88 % — propose the sale", rung: "sale" }, { price: "100", label: "100.00 → back to the start — recover", rung: "safe" }]; }
    else if (step === "topup") { c.hashes.topup_escrow_txid = h; c.topup_pending = false; }
    else if (step === "burn") { c.hashes.burn_txid = h; c.state = "closed"; c.beat = "verify"; c.receipt.can_seal = true; c.receipt.why = ""; }
    this._event(STEP_BEAT[step], "holder", kind, STEP_TX[step], `${LABELS[step]} (DEMO)`, h, "tesSUCCESS");
    this._line("beat", `${ref}: ${step} — DEMO ${STEP_TX[step]} ${h.slice(0, 16)}`);
    return { ok: true, kind, hash: h, result: "tesSUCCESS", tx_type: STEP_TX[step], explorer: null, beat: c.beat, state: c.state, step: this._step() };
  }
}

const LABELS = { accept: "Accept the credential", optin: "Opt in to hold LGAU", lock: "Lock the LGAU", mandate: "Sign the sale mandate", topup: "Lock the top-up", burn: "Redeem — burn the LGAU" };

const ACTIONS = {
  deposit: [{ kind: "operator", action: "start", label: "Open a case (bars arrive)", scope: "case:submit" }],
  credential: [{ kind: "operator", action: "credential", label: "Issue the KYC credential", scope: "operator" }, { kind: "holder", step: "accept", label: "Accept the credential", scope: "case:submit" }],
  mint: [{ kind: "holder", step: "optin", label: "Opt in to hold LGAU", scope: "case:submit" }],
  refusal: [{ kind: "operator", action: "refusal", label: "Let the outsider try", scope: "operator" }, { kind: "operator", action: "skip_refusal", label: "Skip", scope: "operator" }],
  lock: [{ kind: "holder", step: "lock", label: "Lock the LGAU (EscrowCreate)", scope: "case:submit" }, { kind: "holder", step: "mandate", label: "Sign the sale mandate (DelegateSet)", scope: "case:submit" }],
  vault: [{ kind: "planned", action: "vault", label: "VaultCreate · VaultDeposit · LoanBrokerSet · cover (node C)", scope: "operator" }],
  loan: [{ kind: "planned", action: "loan", label: "LoanSet with your counterparty signature (node C)", scope: "case:submit" }],
  price: [{ kind: "operator", action: "price", label: "Publish a price", scope: "operator" }, { kind: "operator", action: "topup", label: "Mint the top-up", scope: "operator" }, { kind: "holder", step: "topup", label: "Lock the top-up", scope: "case:submit" }],
  sale: [{ kind: "operator", action: "sell", label: "Sell & repay (platform path)", scope: "operator" }, { kind: "planned", action: "batch", label: "Batch: EscrowFinish + Payment + LoanPay (node C)", scope: "operator" }],
  payoff: [{ kind: "operator", action: "payoff", label: "Pay off & release", scope: "operator" }, { kind: "holder", step: "burn", label: "Redeem — burn the LGAU", scope: "case:submit" }],
  verify: [{ kind: "read", action: "receipt", label: "Receipt (JSON · PDF)", scope: "read" }, { kind: "read", action: "verify", label: "Read every hash back from a public node", scope: "read" }],
};

const XRAY_PLAN = {
  planned: true, collateral_path: "B", stage_clock: true, node_c: F.ENV.node_c,
  reads: [
    { rpc: "vault_info", params: { vault_id: "<Vault index>" }, yields: ["AssetsTotal", "AssetsAvailable", "LossUnrealized", "Share.OutstandingAmount", "Flags (tfVaultPrivate)", "DomainID"], derived: ["NAV per share", "utilisation"] },
    { rpc: "loan_broker_info", params: { loan_broker_id: "<LoanBroker index>" }, yields: ["DebtTotal", "DebtMaximum", "CoverAvailable", "CoverRateMinimum", "CoverRateLiquidation", "ManagementFeeRate"], derived: ["cover ratio vs CoverRateMinimum", "headroom"] },
    { rpc: "ledger_entry", params: { loan: "<Loan index>" }, yields: ["PrincipalOutstanding", "InterestRate", "PaymentRemaining", "NextPaymentDueDate", "Flags (impaired · defaulted)", "CollateralEscrowID (XLS-66c)"], derived: ["state", "next due in … s", "LTV"] },
    { rpc: "account_objects", params: { account: "<holder>", type: "escrow" }, yields: ["Amount (MPT)", "Condition", "CancelAfter", "LoanID (XLS-66c)"], derived: ["the collateral is tied both ways"] },
    { rpc: "get_aggregate_price", params: { base_asset: "XAU", quote_asset: "USD" }, yields: ["median", "time"], derived: ["the ladder's input"] },
  ],
  expected: { principal: "600000", payment: "53250", payments: 12, interval_s: 180, grace_s: 600, cover: "60000.00", cover_rate_minimum: 10000, debt_maximum: "5000000" },
  reason: "the X-ray reads node C — wired during the hackathon (NEW: xray)",
};
