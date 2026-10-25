# LiquidSettle-Hackathon

**Settle real assets on the XRP Ledger. Pay only when the deal is done.**

This is everything LiquidLabs publishes for the XRPL Commons Hackathon (New York, 24–25 October 2026, track
*Lending & Borrowing*, sponsored layers on top): the end-user app **LiquidSettle**, the one-screen **Lending desk**
that runs the whole gold case beat by beat, the two **SDKs**, the **LiquidGate** API contract, the **XLS-66 Collateral Lending**
amendment (built, live on our devnet), the Ledger **clear-signing descriptors**, and the **provenance** that says what was built before
the clock and what during the 36 hours. MIT licence.

Both apps run from this repository alone on sample data (`?mock=1`), or against a platform that exposes LiquidGate
(`/api/lg/v1`). The platform — the gold services, custody, KYC, the treasury, signing, the admin desks — stays
private; nothing here imports it and nothing here holds a key, a seed or a node URL (`scripts/check.py` and the
platform's own test enforce that before every publish).

## Quick start

```bash
git clone <this repository> && cd LiquidSettle-Hackathon
scripts/serve.sh 8788 settle      # LiquidSettle  → http://localhost:8788/?mock=1
scripts/serve.sh                  # Lending desk  → http://localhost:8787/?mock=1   (&scenario=live = the finished state)
python3 scripts/check.py          # the hygiene check: JSON valid, no secrets, no inline script/style, files present
```

Python 3.9+ and any static file server are all it needs (ES modules need `http://`, not `file://`). Node 18+ only for
`node --check` and the JS SDK outside a browser.

Against a platform: open the Lending desk, press *Settings*, enter the API base (`https://<platform>/api/lg/v1`) and a key
the operator created on the desk, *Apply & reconnect*. LiquidSettle reads the same base from its data attributes
(`index.html`) or the per-browser settings. The key's scopes decide what the screen offers; a browser call must come
from one of the key's allowlisted origins.

## What is here

```
LiquidSettle-Hackathon/
├── settle/                    LiquidSettle — the END-USER front end: the provider desk, the delivery room, the buyer's
│   │                          phone, the bar passport, the vault, the loan, and the five ways to approve (the
│   │                          Approve with… sheet); framework-free ES modules, white-labelled, every step Live / Simulated
│   ├── index.html             standalone mount (scripts/serve.sh 8788 settle); a platform mounts the same files at /settle/
│   ├── settle.css             the design handoff's tokens, every class prefixed ls-; fonts/ self-hosted (OFL)
│   └── js/                    main.js (router · context) · data.js (ApiSource ↔ MockSource) · sdk.js · ui.js (components)
│                              · custody.js (Approve with…) · ledger.js (a Ledger device over WebHID) · mock.js · screens/
├── dashboard/                 the Lending desk: the eleven beats of the gold case on one screen, prepare → sign → submit,
│   │                          the X-ray of node C, the terminal, Aurum, the board, provenance; CSP-clean, no framework
│   ├── index.html             standalone mount (scripts/serve.sh); a platform mounts the same files at /lending/
│   ├── app.css                LiquidLabs tokens, every class prefixed lq-
│   └── js/                    main.js · sdk.js (the JS SDK) · mock.js + fixtures.js + fixtures_live.js · ui.js · state.js · panels/
├── sdk/python/liquidgate.py   the Python SDK (stdlib only); the JS SDK is dashboard/js/sdk.js (settle/js/sdk.js = the same + settle())
├── openapi/liquidgate.v1.json the API contract (a platform serves it live at /api/lg/v1/openapi.json)
├── spec/XLS-66c.md            the amendment as shipped on our devnet: CollateralID ↔ LoanID, tecPLEDGED while the loan is owed,
│                              seizure on default
├── spec/clear-signing/        DelegateSet.json · LoanSet.json — clear-signing-descriptor/xrpl/0.1 for a Ledger device
├── config.example.json        the public configuration a platform exports (deal ZRH-001, network, beats, x402 prices …)
├── PROVENANCE.md              first line: the freeze hash · ENV (reused, declared) · NEW (built during the hackathon, one commit each)
├── BUILD-DAY.md               the runbook for the 36 hours: the morning checklist, the ten commits, the demo, the honesty rules
├── scripts/                   serve.sh · check.py · publish.sh (how this folder leaves the platform's repository)
├── .github/workflows/         check.yml — the same checks on every push
├── CONTRIBUTING.md · SECURITY.md · LICENSE (MIT)
```

## LiquidSettle — the end-user front end

`settle/` is what a buyer, a seller and a provider's desk see: no beats, no hashes up front — money first, the release
rule beside it, summary → details → proof. One **journey rail** says where a settlement is (done · now · next), one line
says what the ledger did last, and the proof card keeps every receipt one click away; there is no event list to read.
Light and dark (the system's choice, or the sun / moon in the header, remembered per browser). Two use cases:

* **Buy and deliver.** The buyer's payment is secured on the ledger. The metal ships by insured USPS Registered Mail to
  the buyer's verified name and address. The seller is paid when USPS takes custody; the buyer's signature on delivery
  moves the bar passport to them. Full refund after ten days if nothing ships.
* **Buy, keep in the vault, borrow.** The Au stays in the provider's vault in the buyer's name. They borrow against it
  in RL USD; the ladder at 70 / 75 / 80 / 85 % tells them first, asks for a top-up, flags the loan, proposes a sale —
  and nothing is sold without their approval.

Every signing sheet opens **Approve with…** — Xaman · Uphold · Self-custody · Ledger · LiquidLabs custody — each with
its status on the platform it talks to (Live · Sandbox · Simulated · Device test pending · Not offered). The Ledger option is real as far as the device goes: `settle/js/ledger.js` speaks the
XRP app's protocol over WebHID in Chrome or Edge and reads the account from a Nano S Plus / X / Flex / Stax; the
approval that follows is the step's — simulated where the step is, and the sheet says so.

Routes: `#/` · `#/desk` · `#/case/<ref>?phase=0..2` ·
`#/pay/<ref>` · `#/passport/<serial>` · `#/vault/<ref>` · `#/my/<ref>`. On a platform each
screen is one document, `GET /api/lg/v1/settle/<screen>[/<id>]`, built from the platform's own records with a
`live_or_simulated` verdict per step, a `modes` slot (what the environment asked for against what the record is, and
why) and a Verify ↗ link on every ledger event.

### Live or simulated — set in the environment

The platform that serves the API decides, step by step, what the demo really does on the ledger. Plain environment
variables, never secrets; `GET /api/lg/v1/settle/config` returns the resulting table and the platform's LiquidGate desk
shows the same.

| Variable | Values | What it does |
|---|---|---|
| `SETTLE_MODE` | `live` · `mock` | Reported on every document. On the LiquidLabs platform `/settle/` is live only (since Iteration 58); the sample data lives in this repository (`?mock=1`). |
| `SETTLE_STEPS` | `kyc=live,anchors=simulated,…` | One line for all the steps. |
| `SETTLE_STEP_<KEY>` | `live` · `simulated` | One step at a time; wins over the line. `live` = signed and submitted wherever the ledger can; `simulated` = the exact transaction is recorded, labelled DEMO, nothing is signed. |

Steps: `kyc` (CredentialCreate) · `payment` (the delivery escrow, EscrowCreate) · `anchors` (one Payment per USPS scan) ·
`release` (EscrowFinish) · `passport` (the Au token) · `refusal` (the permissioned domain) · `oracle` (OracleSet) ·
`lock` (the collateral escrow) · `mandate` (DelegateSet) · `loan` (DEMO until XLS-66 — the hackathon's NEW work) ·
`sale` · `receipt`. `usps` follows the platform's `USPS_MODE`. Standalone (`?mock=1`) nothing is signed and every chip
says *Sample data*: the sample never pretends.

## The Lending desk — the eleven beats

| # | Beat | Source | What happens |
|---|---|---|---|
| 1 | Bars arrive | ENV | the custodian's record opens the case; registered post is anchored on the ledger |
| 2 | KYC credential | ENV | CredentialCreate by the platform, CredentialAccept by the holder (XLS-70); the domain accepts exactly this credential (XLS-80) |
| 3 | Mint LGAU | ENV | MPTokenAuthorize (holder), MPTokenAuthorize (issuer), Payment — 10,000 LGAU = 10,000 g (XLS-33) |
| 4 | The outsider is refused | ENV | a juror's wallet without the credential tries the opt-in → tecNO_AUTH |
| 5 | Lock the collateral | ENV | EscrowCreate with the platform's condition (XLS-85), DelegateSet for Aurum (XLS-75) |
| 6 | Vault & broker | **NEW** | VaultCreate (private, DomainID) · VaultDeposit · LoanBrokerSet · LoanBrokerCoverDeposit on node C (XLS-65 · XLS-66) |
| 7 | The loan | **NEW** | LoanSet with the holder's CounterpartySignature; CollateralID on path B (XLS-66 Collateral Lending) |
| 8 | Price moves | ENV | OracleSet (XLS-47) → the ladder: 60 max · 70 notify · 75 top-up · 80 impair · 85 sale; LoanManage (impair) NEW |
| 9 | Sell & repay | **NEW** | one Batch (tfAllOrNothing): EscrowFinish + Payment (Delegate) + LoanPay (XLS-56) |
| 10 | Pay off | ENV | LoanPay (NEW) · EscrowFinish with the fulfillment · Payment (burn) |
| 11 | Receipt & verify | ENV | canonical JSON → SHA-256 → sealed as a memo Payment; every hash read back from a public node |

ENV beats run on the platform's testnet node — LIVE where the amendment is enabled, DEMO (recorded, labelled) where it
is not. NEW beats need node C (xrpld 3.4.0 with SingleAssetVault + LendingProtocol) and are built during the hackathon,
one commit per item; until then the API answers `501` with the plan and the dashboard draws the frame dashed.

Two fixtures: `?mock=1` (today — the framework, NEW beats planned, node C not configured) and `?mock=1&scenario=live`
(the end of the hackathon — every beat LIVE, the loan open on node C, the X-ray reading, the board full, the provenance
frozen). `BUILD-DAY.md` is the runbook that turns the first into the second.

## The API in one minute

```
GET  /env                              free    everything a client needs before its first call (network, beats, modes, prices)
GET  /cases/ZRH-001                    read    the case document: beats with actions, hashes, loan, ladder, escrow, receipt
POST /cases/ZRH-001/prepare/lock       case:prepare → the unsigned EscrowCreate + its clear-signing descriptor
POST /cases/ZRH-001/submit/lock        case:submit  ← {mode: browser, tx_blob} | {mode: vault} | {mode: demo}
POST /cases/ZRH-001/run/price          operator     {price: "85.71"} or {market: true}
GET  /cases/ZRH-001/xray               read    501 + the plan today; the vault/broker/loan reads when node C is wired
GET  /cases/ZRH-001/shipments          read    the registered parcel: number, carrier, fee escrow, every scan with its anchor
GET  /settle/<screen>[/<id>]           read    LiquidSettle's documents: desk · room · pay · passport · vault · customer · custody
GET  /ladder?price=85.71               x402    402 with XRPL terms when priced; the rungs and the price at which each triggers
GET  /board?since=0                    read    the public lines the judges watch (poll) · /board/stream for SSE
GET  /cases/ZRH-001/receipt.json       free once sealed · /verify for the read-backs
```

Scopes: `read` · `case:prepare` · `case:submit` · `operator` · `agent` · `board`. Every call passes the same fences in
order — credential, scope, origin (CORS per key), the key's rate limit, `Idempotency-Key` on writes (a retry answers
from the store; a reused key with a different body is refused). Full contract: `openapi/liquidgate.v1.json`; clients:
`sdk/README.md`.

## Provenance and honesty

Only what is built during the hackathon counts. `PROVENANCE.md` opens with the freeze hash (the platform branch's commit
when the clock started), lists everything reused (ENV, with the iteration that built it) and everything built (NEW, one
line per commit, appended by the desk as each lands).

**LIVE** = a transaction a public testnet node validated (hash, explorer link). **DEMO** = recorded by the platform
because the amendment is not enabled where it runs — labelled on every line, never counted as live. **NEW · planned** =
not built yet; the API says 501, the dashboard draws the frame dashed. **Simulated** (LiquidSettle) = the flow is there,
the record is not — the sale escrow, the ACH leg. **Mock** = fixtures in this browser, no platform at all.

## Working on it

`CONTRIBUTING.md` has the rules the code keeps (no inline script or style, nothing fetched from a CDN, "Au" never the
metal's name in LiquidSettle, the RL USD mark, no secrets anywhere) and how to run the checks. Security reports:
`SECURITY.md`. Licence: MIT (`LICENSE`), © 2026 LiquidLabs.
