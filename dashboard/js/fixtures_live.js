/** The second mock scenario — "live": how the dashboard looks at the end of the hackathon, once
 *  the ten NEW commits have landed and node C enables the lending amendments. Every beat LIVE,
 *  the loan open on node C (4 of 12 payments made), the price moved to the `notify` rung, the
 *  X-ray reading real figures, the board full, the provenance frozen with every NEW item landed.
 *  Fixtures only: nothing here is a real hash; ?mock=1&scenario=live. */
import { ENV, DESCRIPTORS, HOLDER } from "./fixtures.js";

const clone = (o) => JSON.parse(JSON.stringify(o));
/** deterministic 64-hex from a label, so the same screen shows the same hashes every time */
const hx = (label) => { let h = 2166136261; const out = []; for (let i = 0; i < 64; i++) { h ^= label.charCodeAt(i % label.length) + i; h = Math.imul(h, 16777619) >>> 0; out.push("0123456789ABCDEF"[h & 15]); } return out.join(""); };
const t = (m) => new Date(Date.UTC(2026, 9, 25, 9, 0, 0) + m * 60000).toISOString();     // Oct 25 2026, 09:00 UTC + minutes
const WIRED = "node C enables the lending amendments and the beat is wired";

export const ENV_LIVE = (() => {
  const e = clone(ENV);
  e.node_c = { label: "node C · xrpld 3.4.0", configured: true, reachable: true, version: "3.4.0-liquidlabs+66c", ledger_index: 184233, complete_ledgers: "1-184233",
               probed: true, at: t(-20), required: { SingleAssetVault: true, LendingProtocol: true },
               optional: { Batch: true, PermissionDelegation: true, Credentials: true, PermissionedDomains: true, MPTokensV1: true, TokenEscrow: true, PriceOracle: true, CollateralLock: true },
               ready: true, error: null };
  e.platform_node.amendments = { ...e.platform_node.amendments, LendingProtocol: false, SingleAssetVault: false };
  for (const b of e.beats) {
    b.mode = "live";
    b.reason = b.source === "new" ? WIRED : "every amendment this beat needs is enabled";
  }
  e.gold_environment.vault_ref = hx("vault:ZRH-001");
  e.gold_environment.price_rlusd_per_g = "58";
  e.provenance.frozen = true;
  e.provenance.freeze_hash = "c53380b7e1a94d2f6c0b8e5a3d7f1c2b4e6a8d0f";
  e.provenance.repo_url = "https://github.com/liquid-labs/liquidgold-lending";
  e.provenance.built_during = [
    "node-c · XRPL_LENDING_NODE_URL set, probe ready: SingleAssetVault + LendingProtocol · a1f3c9d2e4b6",
    "vault · VaultCreate (tfVaultPrivate + DomainID) · VaultDeposit 2,000,000 RLUSD · LoanBrokerSet · cover 60,000 · b7e2d4c1a9f0",
    "loan · LoanSet 600,000 RLUSD with the holder's CounterpartySignature · CollateralID (path B) · c3d8a1f6e2b9",
    "xray · vault_info · loan_broker_info · ledger_entry loan · account_objects escrow · get_aggregate_price · d9b4e7c2a5f1",
    "servicer · loan_status · vault_xray · prepare_loan_payment · prepare_impairment · e5c1f8b3d7a2",
    "batch · EscrowFinish + Payment (Delegate) + LoanPay as one Batch (tfAllOrNothing) on node C · f2a7d3e9c4b8",
    "watcher · path A watcher behind a flag; path B needs none · 0b6e2c8f1d5a",
    "verify · the verify page reads seal, loan, escrow and credential from s.altnet.rippletest.net · 1c7f3d9a2e6b",
    "t54 · X402_VERIFIER=t54 for the ladder resource · 2d8a4e0b3f7c",
    "descriptors · the Ledger clear-signing screen compiled from spec/clear-signing · 3e9b5f1c4a8d",
  ];
  return e;
})();

export const NODE_C_IDS = { vault: hx("vault:ZRH-001"), broker: hx("broker:LiquidLabs"), loan: hx("loan:ZRH-001"), escrow: hx("escrow:ZRH-001:lock") };

export const CASE_LIVE = {
  ref: "ZRH-001", state: "open", beat: "price", holder: HOLDER, grams: "10000", topup_grams: "0", kyc_path: "platform",
  ltv_pct: "71.05", ladder_rung: "notify", loan_principal: "600000.00", loan_outstanding: "412087.50",
  hashes: { credential_txid: hx("CredentialCreate"), credential_accept_txid: hx("CredentialAccept"), optin_txid: hx("MPTokenAuthorize:holder"), authorize_txid: hx("MPTokenAuthorize:issuer"),
            mint_txid: hx("Payment:mint"), refusal_txid: hx("MPTokenAuthorize:outsider"), escrow_txid: hx("EscrowCreate:lock"), delegate_txid: hx("DelegateSet"),
            vault_create_txid: hx("VaultCreate"), vault_deposit_txid: hx("VaultDeposit"), broker_set_txid: hx("LoanBrokerSet"), cover_txid: hx("LoanBrokerCoverDeposit"),
            loan_set_txid: hx("LoanSet"), loan_pay_1: hx("LoanPay:1"), loan_pay_2: hx("LoanPay:2"), loan_pay_3: hx("LoanPay:3"), loan_pay_4: hx("LoanPay:4"), oracle_txid: hx("OracleSet:58") },
  network: "testnet", environment_status: "ready", current_step: null, deposited_at: t(-240),
  bars: Array.from({ length: 10 }, (_, i) => ({ serial: `ZRH-2026-00${String(i + 1).padStart(2, "0")}`, grams: "1000", fineness: "999.9" })),
  collateral_grams: "10000", price_at_lock: "100", price_now: "58",
  loan: { ref: "LOAN-ZRH-001", principal: "600000.00", outstanding: "412087.50", rate_pct: "6.5", term_months: 12, live: true, paid: 4, total: 12, next_due_s: 97,
          terms: { principal: "600000.00", apr_pct: "6.5", term_months: 12, collateral_value: "1000000", haircut: "0.40" } },
  ladder: { ltv_pct: "71.05", rung: "notify", impaired: false, sale_proposed: false,
            presets: [{ price: "58.87", label: "58.87 → LTV ≈ 70 % — notify", rung: "notify" }, { price: "53.52", label: "53.52 → LTV ≈ 77 % — prepare the top-up", rung: "topup" },
                      { price: "49.65", label: "49.65 → LTV ≈ 83 % — impair", rung: "impair" }, { price: "46.83", label: "46.83 → LTV ≈ 88 % — propose the sale", rung: "sale" },
                      { price: "100", label: "100.00 → back to the start — recover", rung: "safe" }] },
  escrow: { txid: hx("EscrowCreate:lock"), sequence: 1184203, condition: "A0258020" + hx("cond").slice(0, 64) + "810120", cancel_after: t(600), live: true, loan_id: NODE_C_IDS.loan },
  mandate: { txid: hx("DelegateSet"), live: true },
  node_c: { vault_id: NODE_C_IDS.vault, broker_id: NODE_C_IDS.broker, loan_id: NODE_C_IDS.loan, collateral_escrow_id: NODE_C_IDS.escrow, ledger_index: 184233 },
  receipt: { sealed: false, version: 0, current: false, matches: null, can_seal: false, why: "The receipt is sealed when the case has ended — paid off and redeemed, or sold." },
  counts: { live: 21, demo: 0, refused: 1, reads: 6, notes: 4, total: 32 },
  explorer: {}, mine: true,
};

const L = (seq, m, beat, actor, tx_type, message, label, result = "tesSUCCESS", kind = "live") => ({ seq, beat, actor, kind, tx_type, message, hash: label ? hx(label) : null, result: label ? result : null, at: t(m), explorer: label && kind === "live" ? "https://testnet.xrpl.org/transactions/" + hx(label) : null });

export const EVENTS_LIVE = [
  L(1, -240, "deposit", "platform", null, "Case ZRH-001 opened — 10,000 g, 10 bars, vault delivery; registered post anchored", null, null, "note"),
  L(2, -238, "deposit", "platform", "Payment", "Shipment anchor: USPS RR 9400 1118 9922 … delivered Zürich", "Payment:anchor"),
  L(3, -236, "credential", "platform", "CredentialCreate", "KYC credential issued to the holder", "CredentialCreate"),
  L(4, -235, "credential", "holder", "CredentialAccept", "Credential accepted", "CredentialAccept"),
  L(5, -233, "mint", "holder", "MPTokenAuthorize", "Opted in to hold LGAU", "MPTokenAuthorize:holder"),
  L(6, -232, "mint", "custodian", "MPTokenAuthorize", "Holder authorized by the issuer", "MPTokenAuthorize:issuer"),
  L(7, -231, "mint", "custodian", "Payment", "10,000 LGAU minted to the holder (MPT 10000000, scale 3)", "Payment:mint"),
  L(8, -229, "refusal", "outsider", "MPTokenAuthorize", "The outsider's opt-in is refused by the domain: tecNO_AUTH", "MPTokenAuthorize:outsider", "tecNO_AUTH", "refused"),
  L(9, -226, "lock", "holder", "EscrowCreate", "10,000 LGAU self-escrowed by the holder (payable back to the holder) — ready to pledge", "EscrowCreate:lock"),
  L(10, -225, "lock", "holder", "DelegateSet", "Sale mandate signed for Aurum: Payment · OfferCreate", "DelegateSet"),
  L(11, -220, "vault", "lender", "VaultCreate", "node C · private vault opened (tfVaultPrivate · DomainID = the KYC domain)", "VaultCreate"),
  L(12, -219, "vault", "lender", "VaultDeposit", "node C · 2,000,000 RLUSD deposited — 2,000,000 shares", "VaultDeposit"),
  L(13, -218, "vault", "broker", "LoanBrokerSet", "node C · broker registered: CoverRateMinimum 10000 · Liquidation 100000 · ManagementFee 1000 · DebtMaximum 5,000,000", "LoanBrokerSet"),
  L(14, -217, "vault", "broker", "LoanBrokerCoverDeposit", "node C · first-loss cover 60,000 RLUSD deposited", "LoanBrokerCoverDeposit"),
  L(15, -214, "loan", "broker", "LoanSet", "node C · loan written: 600,000 RLUSD · 6.5 % · 12 × 180 s · CounterpartySignature by the holder · CollateralID", "LoanSet"),
  L(16, -213, "loan", "ledger", null, "ledger_entry loan — PrincipalOutstanding 600,000 · PaymentRemaining 12 · CollateralID ↔ Escrow.LoanID (set by the ledger) ✓", "read:loan", "validated", "read"),
  L(17, -200, "price", "holder", "LoanPay", "node C · payment 1/12 — 53,250 RLUSD", "LoanPay:1"),
  L(18, -170, "price", "holder", "LoanPay", "node C · payment 2/12 — 53,250 RLUSD", "LoanPay:2"),
  L(19, -140, "price", "holder", "LoanPay", "node C · payment 3/12 — 53,250 RLUSD", "LoanPay:3"),
  L(20, -110, "price", "holder", "LoanPay", "node C · payment 4/12 — 53,250 RLUSD · outstanding 412,087.50", "LoanPay:4"),
  L(21, -60, "price", "platform", "OracleSet", "Price 58.00 RLUSD/g published — LTV 71.05 %, rung notify", "OracleSet:58"),
  L(22, -59, "price", "agent", null, "Aurum: LTV 71.05 % — the holder is notified; top-up prepared at 75 %, impairment at 80 %, sale at 85 %", null, null, "note"),
  L(23, -40, "verify", "ledger", null, "vault_info — AssetsTotal 2,000,000 · AssetsAvailable 1,400,000 · LossUnrealized 0 · NAV/share 1.0000", "read:vault", "validated", "read"),
  L(24, -39, "verify", "ledger", null, "loan_broker_info — DebtTotal 412,087.50 · CoverAvailable 60,000 (14.56 % ≥ 10 %)", "read:broker", "validated", "read"),
  L(25, -30, "verify", "ledger", null, "EscrowFinish attempted while the loan is open → tecPLEDGED (XLS-66 Collateral Lending holds)", "EscrowFinish:refused", "tecPLEDGSSION", "refused"),
];

export const BOARD_LIVE = [
  { id: 1, kind: "commit", team: "LiquidLabs", case_ref: null, beat: null, message: "FREEZE c53380b7e1a9 — the clock started", at: t(-1500) },
  { id: 2, kind: "commit", team: "LiquidLabs", case_ref: null, beat: null, message: "NEW node-c: XRPL_LENDING_NODE_URL set, probe ready (a1f3c9d2e4b6)", at: t(-1380) },
  { id: 3, kind: "commit", team: "LiquidLabs", case_ref: null, beat: null, message: "NEW vault: VaultCreate · VaultDeposit · LoanBrokerSet · cover on node C (b7e2d4c1a9f0)", at: t(-1100) },
  { id: 4, kind: "commit", team: "LiquidLabs", case_ref: null, beat: null, message: "NEW loan: LoanSet + CounterpartySignature + CollateralID (c3d8a1f6e2b9)", at: t(-900) },
  { id: 5, kind: "commit", team: "LiquidLabs", case_ref: null, beat: null, message: "NEW xray: the five reads (d9b4e7c2a5f1)", at: t(-760) },
  { id: 6, kind: "commit", team: "LiquidLabs", case_ref: null, beat: null, message: "NEW servicer: Aurum's four tools (e5c1f8b3d7a2)", at: t(-640) },
  { id: 7, kind: "commit", team: "LiquidLabs", case_ref: null, beat: null, message: "NEW batch: sell & repay as one Batch (f2a7d3e9c4b8)", at: t(-520) },
  { id: 8, kind: "commit", team: "LiquidLabs", case_ref: null, beat: null, message: "NEW watcher · verify · t54 · descriptors (0b6e2c8f · 1c7f3d9a · 2d8a4e0b · 3e9b5f1c)", at: t(-300) },
  { id: 9, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "deposit", message: "ZRH-001: case opened — 10000 g", at: t(-240) },
  { id: 10, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "credential", message: "ZRH-001: accept — LIVE CredentialAccept " + hx("CredentialAccept").slice(0, 16), at: t(-235) },
  { id: 11, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "mint", message: "ZRH-001: optin — LIVE MPTokenAuthorize " + hx("MPTokenAuthorize:holder").slice(0, 16), at: t(-233) },
  { id: 12, kind: "refusal", team: "LiquidLabs", case_ref: "ZRH-001", beat: "refusal", message: "ZRH-001: The ledger refused the outsider: tecNO_AUTH.", at: t(-229) },
  { id: 13, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "lock", message: "ZRH-001: lock — LIVE EscrowCreate " + hx("EscrowCreate:lock").slice(0, 16), at: t(-226) },
  { id: 14, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "lock", message: "ZRH-001: mandate — LIVE DelegateSet " + hx("DelegateSet").slice(0, 16), at: t(-225) },
  { id: 15, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "vault", message: "ZRH-001: vault — LIVE node C VaultCreate · VaultDeposit · LoanBrokerSet · cover", at: t(-217) },
  { id: 16, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "loan", message: "ZRH-001: loan — LIVE node C LoanSet " + hx("LoanSet").slice(0, 16) + " · 600,000 RLUSD", at: t(-214) },
  { id: 17, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "price", message: "ZRH-001: LoanPay 4/12 — outstanding 412,087.50", at: t(-110) },
  { id: 18, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "price", message: "ZRH-001: Price published — LTV 71.05 %, rung: notify.", at: t(-60) },
  { id: 19, kind: "verify", team: "Jury", case_ref: "ZRH-001", beat: "verify", message: "ZRH-001: 6 read-backs from s.altnet.rippletest.net", at: t(-40) },
  { id: 20, kind: "refusal", team: "Jury", case_ref: "ZRH-001", beat: "lock", message: "ZRH-001: EscrowFinish while the loan is open → tecPLEDGED (XLS-66 Collateral Lending)", at: t(-30) },
  { id: 21, kind: "note", team: "Jury", case_ref: null, beat: null, message: "Judges' round at 14:00 — the wall shows this board", at: t(-10) },
];

export const TOOLS_LIVE = {
  ok: true, brain: "bedrock", prepare_only: true,
  tools: [
    { name: "case_status", status: "env", description: "The person's LiquidGold case: beat, LTV, loan, hashes, the next step.", schema: {} },
    { name: "ladder_explain", status: "env", description: "The loan-to-value ladder and the price at which each rung triggers for the person's case.", schema: {} },
    { name: "gold_price", status: "env", description: "The gold price per gram (and per troy ounce), with the platform's oracle beside it.", schema: {} },
    { name: "loan_status", status: "env", description: "The loan on node C: outstanding, payments made and remaining, next due, late or impaired.", schema: {} },
    { name: "vault_xray", status: "env", description: "The vault and the broker on node C: NAV per share, utilisation, cover ratio, headroom.", schema: {} },
    { name: "prepare_loan_payment", status: "env", description: "Prepare the next LoanPay for the holder to sign (never signs itself).", schema: {} },
    { name: "prepare_impairment", status: "env", description: "Prepare LoanManage (impair) for the broker when the ladder reaches 80 %.", schema: {} },
    { name: "mandate_status", status: "env", description: "The person's mandates and the last runs.", schema: {} },
    { name: "pay_for_data", status: "env", description: "Pay for one call of the paid API from Aurum's own wallet (x402 via t54).", schema: {} },
  ],
};

export const TOOL_RESULTS_LIVE = {
  case_status: { ref: "ZRH-001", beat: "price", state: "open", ltv_pct: "71.05", rung: "notify", loan: { principal: "600000.00", outstanding: "412087.50", paid: 4, total: 12 }, next: "payment 5/12 due in 97 s — or let the price move" },
  ladder_explain: { rungs: [{ ltv: 60, rung: "max", price_at: "68.68" }, { ltv: 70, rung: "notify", price_at: "58.87" }, { ltv: 75, rung: "topup", price_at: "54.94" }, { ltv: 80, rung: "impair", price_at: "51.51" }, { ltv: 85, rung: "sale", price_at: "48.48" }], note: "prices per gram at which this case reaches each rung with 412,087.50 RLUSD outstanding" },
  gold_price: { gram_usd: { price: "58.0000", source: "twelvedata", demo: false }, ounce: { price: "1803.98", source: "twelvedata", demo: false }, oracle: { price: "58", txid: hx("OracleSet:58") } },
  loan_status: { loan_id: NODE_C_IDS.loan, principal_outstanding: "400000.00", debt_total: "412087.50", payments_made: 4, payments_remaining: 8, next_due_in_s: 97, late: false, impaired: false, collateral_escrow_id: NODE_C_IDS.escrow, tie: "escrow.LoanID == loan index ✓" },
  vault_xray: { vault_id: NODE_C_IDS.vault, assets_total: "2000000", assets_available: "1400000", loss_unrealized: "0", nav_per_share: "1.0000", utilisation_pct: "30.00", broker: { debt_total: "412087.50", cover_available: "60000", cover_ratio_pct: "14.56", cover_rate_minimum_pct: "10.00", headroom: "4587912.50" } },
  prepare_loan_payment: { tx: { TransactionType: "LoanPay", Account: HOLDER, LoanID: NODE_C_IDS.loan, Amount: { currency: "RLUSD", issuer: "rRLUSDtestnetIssuer00000000000000", value: "53250" }, Fee: "12" }, descriptor: "LoanPay — payment 5/12 · 53,250 RLUSD · due in 97 s", note: "prepare-only: the holder signs" },
  prepare_impairment: { tx: { TransactionType: "LoanManage", Account: "rBROKERliquidlabs0000000000000000", LoanID: NODE_C_IDS.loan, Flags: 65536 }, flag: "tfLoanImpair", when: "LTV ≥ 80 % — not yet (71.05 %)", note: "prepare-only: the broker signs" },
  mandate_status: { mandates: [{ kind: "sale", tx_types: ["Payment", "OfferCreate"], cap_xrp_per_run: "120", runs_per_month: 5, signed: true, txid: hx("DelegateSet"), runs: 0 }] },
  pay_for_data: { paid: true, verifier: "t54", invoice: "inv_7f3a", data: { gram_usd: "58.0000" } },
};

export const XRAY_LIVE = {
  planned: false, collateral_path: "B", stage_clock: true, node_c: ENV_LIVE.node_c, ledger_index: 184233, at: t(-1),
  expected: { principal: "600000", payment: "53250", payments: 12, interval_s: 180, grace_s: 600, cover: "60000.00", cover_rate_minimum: 10000, debt_maximum: "5000000" },
  reads: [
    { rpc: "vault_info", params: { vault_id: NODE_C_IDS.vault.slice(0, 12) + "…" },
      values: { AssetsTotal: "2,000,000 RLUSD", AssetsAvailable: "1,400,000 RLUSD", LossUnrealized: "0", "Shares outstanding": "2,000,000", Flags: "tfVaultPrivate", DomainID: hx("domain").slice(0, 12) + "…" },
      derived: ["NAV / share 1.0000", "utilisation 30.00 %"] },
    { rpc: "loan_broker_info", params: { loan_broker_id: NODE_C_IDS.broker.slice(0, 12) + "…" },
      values: { DebtTotal: "412,087.50 RLUSD", DebtMaximum: "5,000,000 RLUSD", CoverAvailable: "60,000 RLUSD", CoverRateMinimum: "10000 (10 %)", CoverRateLiquidation: "100000 (100 %)", ManagementFeeRate: "1000 (1 %)" },
      derived: ["cover ratio 14.56 % ≥ 10 % ✓", "headroom 4,587,912.50 RLUSD"] },
    { rpc: "ledger_entry loan", params: { loan: NODE_C_IDS.loan.slice(0, 12) + "…" },
      values: { PrincipalOutstanding: "400,000.00 RLUSD", InterestRate: "6500 (6.5 %)", PaymentTotal: "12", PaymentRemaining: "8", NextPaymentDueDate: "in 97 s", Flags: "— (current)", CollateralID: NODE_C_IDS.escrow.slice(0, 12) + "…" },
      derived: ["state: current", "LTV 71.05 % (412,087.50 ÷ 10,000 g × 58.00)"] },
    { rpc: "account_objects escrow", params: { account: HOLDER.slice(0, 10) + "…", type: "escrow" },
      values: { Amount: "10,000.000 LGAU (MPT 10000000)", Condition: "A0258020…810120", CancelAfter: "term + grace", LoanID: NODE_C_IDS.loan.slice(0, 12) + "…" },
      derived: ["the tie holds both ways ✓", "EscrowFinish → tecPLEDGED while open (tested at 09:30)"] },
    { rpc: "get_aggregate_price", params: { base_asset: "XAU", quote_asset: "USD" },
      values: { median: "1,803.98 USD / oz", "per gram": "58.00", time: t(-60).slice(11, 19) + " UTC", oracles: "1 (the platform's)" },
      derived: ["the ladder's input → rung notify"] },
  ],
  reason: null,
};

export const DESCRIPTORS_LIVE = DESCRIPTORS;
