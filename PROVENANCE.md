FREEZE_HASH: <set on the desk when the clock starts>

# Provenance — LiquidGold · Lending (LiquidLabs)

Event: XRPL Commons · NYC · Oct 24–25 2026 · Track: Lending & Borrowing

Rule: only what is built during the hackathon counts. Everything below ENV existed before the freeze and is reused as-is (the platform's own iterations, with the number that built it). Everything under NEW is built during the 36 hours, one commit per item, hash appended.

## ENV — reused, declared

| What | Where | Iteration |
|---|---|---|
| LGAU — the gram token (MPT, XLS-33) with the registry root in its metadata | `services/gold/environment.py · cases.py` | 39 |
| KYC credential + permissioned domain (XLS-70 · XLS-80), the outsider's refusal | `services/gold/cases.py · holder.py` | 39 |
| Token escrow with the platform's condition, the sale mandate (DelegateSet) | `services/gold/holder.py` | 39 |
| Oracle price + the LTV ladder (60 · 70 · 75 · 80 · 85) | `services/gold/features.py · cases.py` | 39 |
| Simulated XLS-66 loan on the platform (loan_terms / loan / payoff / sell) | `services/gold/cases.py` | 39 |
| The credit builders: VaultCreate · VaultDeposit · LoanBrokerSet · LoanBrokerCoverDeposit · LoanSet · LoanPay · LoanManage | `services/credit/ledger.py` | 27 |
| The receipt (canonical JSON, SHA-256, sealed as a memo Payment) and the verify page | `services/gold/receipt.py · verify.py` | 42 |
| Shipping anchors and the delivery escrow (USPS / S10) | `services/shipping/` | 41 |
| x402 — HTTP 402 with XRPL terms, the platform as its own facilitator | `services/x402.py` | 40 |
| Aurum — the agent, its tools, mandates and runs | `services/agent/` | 40 |
| LiquidGate — keys, session tokens, scopes, origins, rate limits, idempotency, the board, the config desk, the dashboard shell | `services/liquidgate/ · blueprints/liquidgate/ · hackathon/` | 49 |

## NEW — planned for the 36 hours

- **node-c** — Node C wired in: XRPL_LENDING_NODE_URL, the feature probe gating every NEW beat (beats: vault, loan, sale)
- **vault** — VaultCreate (tfVaultPrivate + DomainID) · VaultDeposit · LoanBrokerSet · LoanBrokerCoverDeposit on node C (beats: vault)
- **loan** — LoanSet with CounterpartySignature and the Data descriptor; XLS-66c CollateralEscrowID on path B (beats: loan)
- **xray** — The X-ray: vault_info, loan_broker_info, ledger_entry reads — NAV/share, AssetsAvailable, LossUnrealized, cover vs DebtTotal (beats: loan, price)
- **servicer** — Aurum's servicer tools: loan_status · vault_xray · prepare_loan_payment · prepare_impairment (beats: price)
- **batch** — Sell & repay as one Batch (tfAllOrNothing): EscrowFinish + Payment (Delegate) + LoanPay (beats: sale)
- **watcher** — Path A watcher (LoanPay / LoanManage → release or seize the escrow); path B needs none (beats: payoff, sale)
- **verify** — The verify page reading seal, loan, escrow and credential from a public node — never ours (beats: verify)
- **t54** — x402 through t54's facilitator (X402_VERIFIER=t54) for the ladder resource (beats: price)
- **descriptors** — The Ledger clear-signing screen compiled from the descriptors (beats: lock, loan)

## NEW — built (appended by the desk after each commit)

- (nothing yet)
