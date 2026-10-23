/** Fixtures for mock mode: what LiquidGate answers for deal ZRH-001 on a testnet where every ENV
 *  amendment is on and node C is not yet wired. Shapes mirror the API exactly (see openapi/). */
const H = (s) => s.padEnd(64, "0").toUpperCase();

export const ENV = {
  ok: true,
  liquidgate: { version: "1.0", iteration: 49, api: "/api/lg/v1", docs: "/lending/", openapi: "/api/lg/v1/openapi.json" },
  network: { mode: "testnet", configured: "testnet", mainnet_refused: true, stage_clock: true, ledger_accept_s: 3,
             explorer_base: "https://testnet.xrpl.org/transactions/", public_node_url: "wss://s.altnet.rippletest.net:51233" },
  platform_node: { reachable: true, status: "ready", amendments_read_at: "2026-10-23T09:00:00+00:00",
                   amendments: { Batch: true, Credentials: true, LendingProtocol: false, MPTokensV1: true, PermissionDelegation: true,
                                 PermissionedDomains: true, PriceOracle: true, SingleAssetVault: false, TokenEscrow: true } },
  node_c: { label: "node C · xrpld 3.4.0", configured: false, reachable: false, version: null, ledger_index: null, probed: false,
            required: { SingleAssetVault: null, LendingProtocol: null }, optional: {}, ready: false, error: null, at: null },
  amendments: { required: ["SingleAssetVault", "LendingProtocol"], optional: ["Batch", "PermissionDelegation", "Credentials", "PermissionedDomains", "MPTokensV1", "TokenEscrow", "PriceOracle"] },
  collateral: { path: "B", xls66c_field_name: "CollateralEscrowID", xls66c_field_code: 42, escrow_field_name: "LoanID", refusal_code: "tecNO_PERMISSION",
                seizure: "LoanManage · tfLoanDefault", feature_name: "featureLendingCollateral", path_a_watcher_s: 30 },
  deal: { ref: "ZRH-001", grams: "10000", valuation_rlusd: "1000000", principal_rlusd: "600000", ltv_max_pct: "60", interest_rate: 6500, late_interest_rate: 12000,
          payment_total: 12, payment_interval_s: 180, grace_period_s: 600, payment_rlusd: "53250", origination_fee_rlusd: "3000", cover_pct: "10",
          cover_rate_minimum: 10000, cover_rate_liquidation: 100000, management_fee_rate: 1000, debt_maximum_rlusd: "5000000", asset: { currency: "RLUSD", issuer: "" } },
  ladder: [{ ltv_pct: 60, rung: "max", text: "Maximum at origination — the loan is sized at 60 % of the oracle value." },
           { ltv_pct: 70, rung: "notify", text: "The holder is notified; nothing moves." },
           { ltv_pct: 75, rung: "topup", text: "The agent prepares a top-up: more bars to the vault, more LGAU into a second escrow." },
           { ltv_pct: 80, rung: "impair", text: "The broker impairs the loan (LoanManage) — the vault's unrealised loss grows." },
           { ltv_pct: 85, rung: "sale", text: "The agent proposes the sale under the mandate; the holder decides, the ledger executes." }],
  beats: [
    { key: "deposit", label: "Bars arrive", source: "env", mode: "live", reason: "a platform record — no amendment needed", primitives: ["anchor"], actors: ["platform"], tx: ["Payment (memo) · EscrowCreate (delivery)"], amendments: [] },
    { key: "credential", label: "KYC credential", source: "env", mode: "live", reason: "every amendment this beat needs is enabled", primitives: ["credential", "domain"], actors: ["platform", "holder"], tx: ["CredentialCreate", "CredentialAccept"], amendments: ["Credentials", "PermissionedDomains"] },
    { key: "mint", label: "Mint LGAU", source: "env", mode: "live", reason: "every amendment this beat needs is enabled", primitives: ["mpt"], actors: ["holder", "custodian"], tx: ["MPTokenAuthorize", "Payment (MPT)"], amendments: ["MPTokensV1"] },
    { key: "refusal", label: "The outsider is refused", source: "env", mode: "live", reason: "every amendment this beat needs is enabled", primitives: ["domain", "credential"], actors: ["outsider"], tx: ["MPTokenAuthorize → tecNO_AUTH / tecNO_PERMISSION"], amendments: ["Credentials", "PermissionedDomains"] },
    { key: "lock", label: "Lock the collateral", source: "env", mode: "live", reason: "every amendment this beat needs is enabled", primitives: ["escrow", "delegation"], actors: ["holder"], tx: ["EscrowCreate (condition)", "DelegateSet"], amendments: ["PermissionDelegation", "TokenEscrow"] },
    { key: "vault", label: "Vault & broker", source: "new", mode: "planned", reason: "built during the hackathon on node C", primitives: ["lending"], actors: ["lender", "broker"], tx: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit"], amendments: ["LendingProtocol"] },
    { key: "loan", label: "The loan", source: "new", mode: "planned", reason: "built during the hackathon on node C", primitives: ["lending"], actors: ["broker", "holder"], tx: ["LoanSet + CounterpartySignature"], amendments: ["LendingProtocol"] },
    { key: "price", label: "Price moves", source: "env", mode: "live", reason: "every amendment this beat needs is enabled", primitives: ["oracle"], actors: ["platform", "agent"], tx: ["OracleSet", "LoanManage (impair) — NEW on node C"], amendments: ["PriceOracle"] },
    { key: "sale", label: "Sell & repay", source: "new", mode: "planned", reason: "built during the hackathon on node C", primitives: ["batch", "delegation", "escrow"], actors: ["agent"], tx: ["Batch: EscrowFinish + Payment (Delegate) + LoanPay"], amendments: ["Batch", "PermissionDelegation", "TokenEscrow"] },
    { key: "payoff", label: "Pay off", source: "env", mode: "live", reason: "every amendment this beat needs is enabled", primitives: ["escrow", "mpt"], actors: ["holder", "platform"], tx: ["LoanPay — NEW on node C", "EscrowFinish", "Payment (burn)"], amendments: ["MPTokensV1", "TokenEscrow"] },
    { key: "verify", label: "Receipt & verify", source: "env", mode: "live", reason: "a platform record — no amendment needed", primitives: [], actors: ["anyone"], tx: ["Payment (memo seal)"], amendments: [] },
  ],
  gold_environment: { status: "ready", issuance_id: "00000F3C" + "5E6A1B2C3D4E5F60718293A4B5C6D7E8", domain_id: H("D0A1"), vault_ref: null, price_rlusd_per_g: "100", term_minutes: 3, dev_mode: true },
  x402: { verifier: "self", facilitator_url: "https://xrpl-facilitator-testnet.t54.ai", pay_to: "rPLATFORMmockWallet000000000000000", asset: "XRP",
          prices_drops: { "market/gold": 10000, ladder: 10000, "steps/prepare": 0, "receipt.json": 0 }, invoice_ttl_s: 600 },
  mandate: { tx_types: ["Payment", "OfferCreate"], cap_xrp_per_run: "120", runs_per_month: 5 },
  agent: { brain: "rules", tools_env: ["case_status", "ladder_explain", "gold_price", "market_quote", "mandate_status", "shipment_status", "pay_for_data"],
           tools_new: ["loan_status", "vault_xray", "prepare_loan_payment", "prepare_impairment"], prepare_only: true },
  board: { enabled: true, poll_s: 2, backlog: 200, retention_days: 30, public_kinds: ["beat", "verify", "refusal", "note", "commit"] },
  dashboard: { title: "LiquidGold · Lending", team: "LiquidLabs", tagline: "Allocated gold, lent against on the XRP Ledger — every beat a hash.", accent: "#01CB9A", allow_mock: true },
  provenance: { freeze_hash: null, frozen: false, repo_url: null, event: "XRPL Commons · NYC · Oct 24–25 2026", track: "Lending & Borrowing",
                env: [{ what: "LGAU — the gram token (MPT, XLS-33)", where: "services/gold/environment.py", since: 39 },
                      { what: "KYC credential + permissioned domain, the outsider's refusal", where: "services/gold/cases.py", since: 39 },
                      { what: "Token escrow + the sale mandate", where: "services/gold/holder.py", since: 39 },
                      { what: "Oracle price + the LTV ladder", where: "services/gold/features.py", since: 39 },
                      { what: "The credit builders (Vault · LoanBroker · Loan)", where: "services/credit/ledger.py", since: 27 },
                      { what: "The receipt and the verify page", where: "services/gold/receipt.py", since: 42 },
                      { what: "x402 and Aurum", where: "services/x402.py · services/agent/", since: 40 },
                      { what: "LiquidGate — keys, scopes, the board, the config desk, this dashboard", where: "services/liquidgate/ · hackathon/", since: 49 }],
                planned: [{ key: "node-c", what: "Node C wired in", beats: ["vault", "loan", "sale"] }, { key: "vault", what: "Vault & broker on node C", beats: ["vault"] },
                          { key: "loan", what: "LoanSet + XLS-66c", beats: ["loan"] }, { key: "xray", what: "The X-ray reads", beats: ["loan", "price"] },
                          { key: "servicer", what: "Aurum's servicer tools", beats: ["price"] }, { key: "batch", what: "Sell & repay as one Batch", beats: ["sale"] },
                          { key: "watcher", what: "Path A watcher", beats: ["payoff", "sale"] }, { key: "verify", what: "Verify from a public node", beats: ["verify"] },
                          { key: "t54", what: "x402 via t54", beats: ["price"] }, { key: "descriptors", what: "The Ledger clear-signing screen", beats: ["lock", "loan"] }],
                built_during: [], rule: "Only what is built during the hackathon counts." },
};

export const HOLDER = "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH";

export const CASE = {
  ref: "ZRH-001", state: "open", beat: "lock", holder: HOLDER, grams: "10000", topup_grams: "0", kyc_path: "platform",
  ltv_pct: null, ladder_rung: null, loan_principal: "0", loan_outstanding: "0",
  hashes: { credential_txid: H("C1"), credential_accept_txid: H("C2"), optin_txid: H("A1"), authorize_txid: H("A2"), mint_txid: H("B1"), refusal_txid: H("E1") },
  network: "testnet", environment_status: "ready", current_step: "lock", deposited_at: "2026-10-23T09:12:00+00:00",
  bars: [{ serial: "ZRH-2026-0001", grams: "1000", fineness: "999.9" }, { serial: "ZRH-2026-0002", grams: "1000", fineness: "999.9" }],
  collateral_grams: "10000", price_at_lock: null, price_now: "100",
  loan: { ref: null, principal: "0", outstanding: "0", rate_pct: "6.5", term_months: 12, live: false,
          terms: { principal: "600000.00", apr_pct: "6.5", term_months: 12, collateral_value: "1000000", haircut: "0.40" } },
  ladder: { ltv_pct: null, rung: null, impaired: false, sale_proposed: false, presets: [] },
  escrow: { txid: null, sequence: null, condition: null, cancel_after: null, live: false },
  mandate: { txid: null, live: false },
  receipt: { sealed: false, version: 0, current: false, matches: null, can_seal: false, why: "The receipt is sealed when the case has ended — paid off and redeemed, or sold." },
  counts: { live: 6, demo: 0, refused: 1, reads: 0, notes: 3, total: 10 },
  explorer: {}, mine: true,
};

export const EVENTS = [
  { seq: 1, beat: "deposit", actor: "platform", kind: "note", tx_type: null, message: "Case ZRH-001 opened — 10,000 g, 10 bars, vault delivery", hash: null, result: null, at: "2026-10-23T09:12:00+00:00" },
  { seq: 2, beat: "credential", actor: "platform", kind: "live", tx_type: "CredentialCreate", message: "KYC credential issued to the holder", hash: H("C1"), result: "tesSUCCESS", at: "2026-10-23T09:13:00+00:00" },
  { seq: 3, beat: "credential", actor: "holder", kind: "live", tx_type: "CredentialAccept", message: "Credential accepted", hash: H("C2"), result: "tesSUCCESS", at: "2026-10-23T09:13:40+00:00" },
  { seq: 4, beat: "mint", actor: "holder", kind: "live", tx_type: "MPTokenAuthorize", message: "Opted in to hold LGAU", hash: H("A1"), result: "tesSUCCESS", at: "2026-10-23T09:14:10+00:00" },
  { seq: 5, beat: "mint", actor: "custodian", kind: "live", tx_type: "MPTokenAuthorize", message: "Holder authorized by the issuer", hash: H("A2"), result: "tesSUCCESS", at: "2026-10-23T09:14:30+00:00" },
  { seq: 6, beat: "mint", actor: "custodian", kind: "live", tx_type: "Payment", message: "10,000 LGAU minted to the holder (MPT 10000000, scale 3)", hash: H("B1"), result: "tesSUCCESS", at: "2026-10-23T09:15:00+00:00" },
  { seq: 7, beat: "refusal", actor: "outsider", kind: "refused", tx_type: "MPTokenAuthorize", message: "The outsider's opt-in is refused by the domain: tecNO_AUTH", hash: H("E1"), result: "tecNO_AUTH", at: "2026-10-23T09:16:00+00:00" },
  { seq: 8, beat: "lock", actor: "platform", kind: "note", tx_type: null, message: "Waiting for the holder: EscrowCreate with the platform's condition, then DelegateSet", hash: null, result: null, at: "2026-10-23T09:16:30+00:00" },
];

export const BOARD = [
  { id: 1, kind: "note", team: "LiquidLabs", case_ref: null, beat: null, message: "LiquidGate up — mock mode (fixtures, no platform)", at: "2026-10-23T09:00:00+00:00" },
  { id: 2, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "deposit", message: "ZRH-001: case opened — 10000 g", at: "2026-10-23T09:12:00+00:00" },
  { id: 3, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "credential", message: "ZRH-001: Credential issued — accept it with the wallet.", at: "2026-10-23T09:13:00+00:00" },
  { id: 4, kind: "beat", team: "LiquidLabs", case_ref: "ZRH-001", beat: "mint", message: "ZRH-001: optin — LIVE MPTokenAuthorize " + H("A1").slice(0, 16), at: "2026-10-23T09:14:10+00:00" },
  { id: 5, kind: "refusal", team: "LiquidLabs", case_ref: "ZRH-001", beat: "refusal", message: "ZRH-001: The ledger refused the outsider: tecNO_AUTH.", at: "2026-10-23T09:16:00+00:00" },
];

export const TOOLS = {
  ok: true, brain: "rules", prepare_only: true,
  tools: [
    { name: "case_status", status: "env", description: "The person's LiquidGold case: beat, LTV, loan, hashes, the next step.", schema: {} },
    { name: "ladder_explain", status: "env", description: "The loan-to-value ladder and the price at which each rung triggers for the person's case.", schema: {} },
    { name: "gold_price", status: "env", description: "The gold price per gram (and per troy ounce) in USD or EUR, with the platform's oracle beside it.", schema: {} },
    { name: "market_quote", status: "env", description: "The latest price of one pair.", schema: {} },
    { name: "mandate_status", status: "env", description: "The person's mandates and the last runs.", schema: {} },
    { name: "shipment_status", status: "env", description: "Where the person's gold shipments are.", schema: {} },
    { name: "pay_for_data", status: "env", description: "Pay for one call of the paid API from Aurum's own wallet (x402).", schema: {} },
    { name: "loan_status", status: "planned", description: "built on node C during the hackathon (servicer)", schema: {} },
    { name: "vault_xray", status: "planned", description: "built on node C during the hackathon (servicer)", schema: {} },
    { name: "prepare_loan_payment", status: "planned", description: "built on node C during the hackathon (servicer)", schema: {} },
    { name: "prepare_impairment", status: "planned", description: "built on node C during the hackathon (servicer)", schema: {} },
  ],
};

export const TOOL_RESULTS = {
  case_status: { ref: "ZRH-001", beat: "lock", state: "open", ltv_pct: null, loan: { principal: "0", outstanding: "0" }, next: "lock — EscrowCreate with the platform's condition" },
  ladder_explain: { rungs: [{ ltv: 60, rung: "max", price_at: "100.00" }, { ltv: 70, rung: "notify", price_at: "85.71" }, { ltv: 75, rung: "topup", price_at: "80.00" }, { ltv: 80, rung: "impair", price_at: "75.00" }, { ltv: 85, rung: "sale", price_at: "70.59" }], note: "prices per gram at which this case reaches each rung with a 600,000 RLUSD debt" },
  gold_price: { gram_usd: { price: "100.0000", source: "mock", demo: true }, ounce: { price: "3110.35", source: "mock", demo: true }, oracle: { price: "100", txid: H("0A") } },
  market_quote: { symbol: "XRP/USD", price: "2.4100", source: "mock", demo: true },
  mandate_status: { mandates: [{ kind: "sale", tx_types: ["Payment", "OfferCreate"], cap_xrp_per_run: "120", runs_per_month: 5, signed: false }] },
  shipment_status: { shipments: [] },
  pay_for_data: { paid: true, invoice: "inv_mock", data: { gram_usd: "100.0000" } },
};

export const DESCRIPTORS = {
  DelegateSet: { "$schema": "clear-signing-descriptor/xrpl/0.1", transaction_type: "DelegateSet", xls: "XLS-75", title: "Sale mandate for Aurum",
    intent: "You allow the agent's wallet to act for this account with exactly the listed permissions. You can revoke it with another DelegateSet carrying an empty Permissions list.",
    fields: [{ path: "Account", label: "Your account", format: "address" }, { path: "Authorize", label: "Delegate (Aurum's wallet)", format: "address", hint: "the platform's agent wallet — check it against the dashboard" },
             { path: "Permissions[].Permission.PermissionValue", label: "Allowed transactions", format: "permission_list", expected: ["Payment", "OfferCreate"] },
             { path: "Fee", label: "Network fee", format: "amount", unit: "drops" }, { path: "Sequence", label: "Sequence", format: "integer" }],
    constraints: { cap_xrp_per_run: "120", runs_per_month: 5 }, warnings: ["A delegate can move funds within the allowed transaction types until you revoke.", "Testnet only: LiquidGate refuses mainnet by construction."] },
  LoanSet: { "$schema": "clear-signing-descriptor/xrpl/0.1", transaction_type: "LoanSet", xls: "XLS-66", title: "Loan ZRH-001 — your counterparty signature",
    intent: "You agree to borrow the principal at these terms against the LGAU you locked. The broker submits the transaction; your signature covers the same fields.",
    fields: [{ path: "Account", label: "Broker (signs the LoanSet)", format: "address" }, { path: "LoanBrokerID", label: "Loan broker", format: "hash256" }, { path: "Borrower", label: "Borrower (you)", format: "address" },
             { path: "PrincipalRequested", label: "Principal", format: "amount", unit: "RLUSD", expected: "600000" }, { path: "InterestRate", label: "Interest rate", format: "rate_tenths_bp", expected: 6500, display: "6.5 % p.a." },
             { path: "LateInterestRate", label: "Late interest rate", format: "rate_tenths_bp", expected: 12000 }, { path: "PaymentTotal", label: "Payments", format: "integer", expected: 12 },
             { path: "PaymentInterval", label: "Payment interval", format: "duration_s", expected: 180 }, { path: "GracePeriod", label: "Grace period", format: "duration_s", expected: 600 },
             { path: "LoanOriginationFee", label: "Origination fee", format: "amount", unit: "RLUSD", expected: "3000" }, { path: "CounterpartySignature", label: "Your signature over these terms", format: "signature" },
             { path: "CollateralEscrowID", label: "Collateral escrow (XLS-66c)", format: "hash256", hint: "sfield 42 — the escrow the ledger refuses to release while this loan is open" },
             { path: "Data", label: "Collateral descriptor", format: "hex_json" }],
    constraints: { ltv_max_pct: "60", collateral_grams: "10000", collateral_path: "B" }, warnings: ["Missing a payment past the grace period raises the rate to the late rate.", "On default the collateral is seized (LoanManage · tfLoanDefault)."] },
};

export const UNSIGNED = {
  lock: { TransactionType: "EscrowCreate", Account: HOLDER, Destination: HOLDER, Amount: { mpt_issuance_id: ENV.gold_environment.issuance_id, value: "10000000" },
          Condition: "A0258020" + H("7A").slice(0, 64) + "810120", CancelAfter: 814000000, Fee: "12", Sequence: 1234567, LastLedgerSequence: 9876543 },
  mandate: { TransactionType: "DelegateSet", Account: HOLDER, Authorize: "rAURUMmockAgentWallet0000000000000",
             Permissions: [{ Permission: { PermissionValue: "Payment" } }, { Permission: { PermissionValue: "OfferCreate" } }], Fee: "12", Sequence: 1234568 },
  accept: { TransactionType: "CredentialAccept", Account: HOLDER, Issuer: "rPLATFORMmockWallet000000000000000", CredentialType: "4B5943", Fee: "12" },
  optin: { TransactionType: "MPTokenAuthorize", Account: HOLDER, MPTokenIssuanceID: ENV.gold_environment.issuance_id, Fee: "12" },
  topup: { TransactionType: "EscrowCreate", Account: HOLDER, Destination: HOLDER, Amount: { mpt_issuance_id: ENV.gold_environment.issuance_id, value: "1500000" }, Fee: "12" },
  burn: { TransactionType: "Payment", Account: HOLDER, Destination: "rCUSTODIANmockIssuer0000000000000", Amount: { mpt_issuance_id: ENV.gold_environment.issuance_id, value: "10000000" }, Fee: "12" },
};
