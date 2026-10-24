# LiquidGold · Lending — the hackathon package

Allocated gold, lent against on the XRP Ledger — every beat a hash. This folder is everything LiquidLabs publishes for the
XRPL Commons hackathon (NYC, Oct 24–25 2026, track *Lending & Borrowing*): the dashboard that runs the whole case on one
screen, the SDKs it is built on, the API contract, the XLS-66c proposal, the clear-signing descriptors and the provenance.

It talks to **LiquidGate**, the platform's public API (`/api/lg/v1`). The platform itself — the gold services, the treasury,
signing, the admin desk — stays private; this folder never imports it and never holds a key, a seed or a node URL
(a test enforces that before every publish).

**What the hackathon builds is this API and this user interface** — the one everyone connects to through the platform:
a holder with a browser wallet, a partner with an API key, a judge with the free reads, Aurum with its tools. The vault,
the custody, the KYC, the treasury and the ledger plumbing behind it are the platform's and were there before the clock
started (`PROVENANCE.md` says exactly what). Example data for the whole workflow, parcel and tracking included:
the platform's `docs/EXAMPLE_DATA.md`.

```
hackathon/
├── dashboard/            the one-screen dashboard: framework-free ES modules + CSS, CSP-clean (no inline script/style)
│   ├── index.html        standalone mount (scripts/serve.sh); the platform mounts the same files at /lending/
│   ├── app.css           LiquidLabs tokens, every class prefixed lq-
│   └── js/               main.js (boot · actions · polling) · sdk.js (the JS SDK) · mock.js + fixtures.js + fixtures_live.js (?mock=1[&scenario=live]) · ui.js · state.js
│       └── panels/       header · rail (the eleven beats) · stage (the current beat, prepare → sign → submit) · facts (deal, LTV gauge, ladder)
│                         · xray (vault/broker/loan reads) · terminal · side (Aurum, the board, verify, provenance, settings, footer)
├── settle/               LiquidSettle — the END-USER front end (Iteration 51): the provider desk, the delivery room, the buyer's phone,
│   │                     the bar passport, the vault and the loan; framework-free ES modules, white-labelled, every step Live / Simulated
│   ├── index.html        standalone mount (scripts/serve.sh 8788 settle → ?mock=1); the platform mounts the same files at /settle/
│   ├── settle.css        the handoff's tokens (docs/settle-handoff/), every class prefixed ls-; fonts/ self-hosted (OFL)
│   └── js/               main.js (router · context) · data.js (ApiSource ↔ MockSource) · sdk.js · ui.js (the components) · mock.js (sample data) · screens/
├── sdk/python/liquidgate.py   the Python SDK (stdlib only); the JS SDK is dashboard/js/sdk.js (settle/js/sdk.js is the same file + settle())
├── openapi/liquidgate.v1.json the API contract (served live at /api/lg/v1/openapi.json)
├── spec/XLS-66c.md            the amendment proposal: CollateralEscrowID ↔ LoanID, tecNO_PERMISSION while open, seizure on default
├── spec/clear-signing/        DelegateSet.json · LoanSet.json (clear-signing-descriptor/xrpl/0.1)
├── config.example.json        the public configuration the platform exports (deal ZRH-001, network, beats, x402 prices …)
├── PROVENANCE.md              first line: the freeze hash · ENV (reused, declared) · NEW (built during the hackathon, one commit each)
├── BUILD-DAY.md               the runbook for the 36 hours: the morning checklist, the ten commits, the demo, the honesty rules
├── LICENSE                    MIT
└── scripts/                   serve.sh (the dashboard alone) · publish.sh (git subtree split of this folder)
```

## Run it

**On fixtures, no platform** — `hackathon/scripts/serve.sh` then open `http://localhost:8787/?mock=1`. Every beat clicks through on a
small state machine; every answer is labelled DEMO; nothing is signed. Two scenarios: `?mock=1` (today — the framework, NEW beats planned,
node C not configured) and `?mock=1&scenario=live` (the end of the hackathon — every beat LIVE, the loan open on node C, the X-ray reading,
the board full, the provenance frozen with the ten NEW commits landed). The second is what the build day aims at: `BUILD-DAY.md` is the runbook.

**Against a platform** — open the dashboard, press *Settings*, enter the API base (`https://<platform>/api/lg/v1`) and a key the
operator created on the desk (*Platform Studio → Operations → LiquidGate → Keys*), *Apply & reconnect*. The key's scopes decide what
the screen offers: `read` (cases, events, X-ray, board), `case:prepare` + `case:submit` (the holder's steps), `operator` (the server-side
beats), `agent` (Aurum's tools), `board` (notes and commits). A browser call must come from one of the key's allowlisted origins.

**On the platform** — signed in at `/lending/` the page mints a one-hour session token for you (no key to paste) and loads xrpl.js so
the sign panel takes a testnet seed that never leaves the tab.

## LiquidSettle — the end-user front end

`settle/` is what a buyer, a seller and a provider's desk see: no beats, no hashes up front — money first, the release rule
beside it, summary → details → proof. Two use cases on one timeline component: **buy and deliver** (the payment secured on the
ledger, insured USPS to the verified address, paid at the acceptance scan, the bar passport moved on the buyer's signature) and
**buy, keep in the vault, borrow** (the Au stays in the provider's vault in the buyer's name; borrow against it; the ladder at
70 / 75 / 80 / 85 with three ways out, nothing sold without approval). A Presenter steps both through side by side.

`scripts/serve.sh 8788 settle` → `http://localhost:8788/?mock=1` runs it on the sample data (the handoff's renderVals). On the
platform, `/settle/` runs it on `GET /api/lg/v1/settle/<screen>/<id>` — the view-models the platform builds from its own records,
each step with a Live / Simulated chip, each ledger event with Verify ↗ and a link to the platform's page. What is simulated and
why is in the platform's `docs/settle-handoff/SETTLE_GAPS.md`; the screens and components are the designer's handoff in
`docs/settle-handoff/`.

## The eleven beats

| # | Beat | Source | What happens |
|---|---|---|---|
| 1 | Bars arrive | ENV | the custodian's record opens the case; registered post is anchored on the ledger |
| 2 | KYC credential | ENV | CredentialCreate by the platform, CredentialAccept by the holder (XLS-70); the domain accepts exactly this credential (XLS-80) |
| 3 | Mint LGAU | ENV | MPTokenAuthorize (holder), MPTokenAuthorize (issuer), Payment — 10,000 LGAU = 10,000 g (XLS-33) |
| 4 | The outsider is refused | ENV | a juror's wallet without the credential tries the opt-in → tecNO_AUTH |
| 5 | Lock the collateral | ENV | EscrowCreate with the platform's condition (XLS-85), DelegateSet for Aurum (XLS-75) |
| 6 | Vault & broker | **NEW** | VaultCreate (private, DomainID) · VaultDeposit · LoanBrokerSet · LoanBrokerCoverDeposit on node C (XLS-65 · XLS-66) |
| 7 | The loan | **NEW** | LoanSet with the holder's CounterpartySignature; CollateralEscrowID on path B (XLS-66c) |
| 8 | Price moves | ENV | OracleSet (XLS-47) → the ladder: 60 max · 70 notify · 75 top-up · 80 impair · 85 sale; LoanManage (impair) NEW |
| 9 | Sell & repay | **NEW** | one Batch (tfAllOrNothing): EscrowFinish + Payment (Delegate) + LoanPay (XLS-56) |
| 10 | Pay off | ENV | LoanPay (NEW) · EscrowFinish with the fulfillment · Payment (burn) |
| 11 | Receipt & verify | ENV | canonical JSON → SHA-256 → sealed as a memo Payment; every hash read back from a public node |

ENV beats run on the platform's testnet node — LIVE where the amendment is enabled, DEMO (recorded, labelled) where it is not.
NEW beats need node C (xrpld 3.4.0 with SingleAssetVault + LendingProtocol) and are built during the hackathon, one commit per item;
until then the API answers `501` with the plan and the dashboard draws the frame.

## The API in one minute

```
GET  /env                              free    everything a dashboard needs before its first call
GET  /cases/ZRH-001                    read    the case document: beats with actions, hashes, loan, ladder, escrow, receipt, counts
POST /cases/ZRH-001/prepare/lock       case:prepare → the unsigned EscrowCreate + its clear-signing descriptor
POST /cases/ZRH-001/submit/lock        case:submit  ← {mode: browser, tx_blob} | {mode: vault} | {mode: demo}
POST /cases/ZRH-001/run/price          operator     {price: "85.71"} or {market: true}
GET  /cases/ZRH-001/xray               read    501 + the plan today; the vault/broker/loan reads when node C is wired
GET  /cases/ZRH-001/shipments          read    the registered parcel: number, carrier, fee escrow, every scan with its anchor
POST /cases/ZRH-001/shipments/SHP-…/number        case:submit  {tracking_number} — the receipt's S10 or USPS number
POST /cases/ZRH-001/shipments/SHP-…/fee           case:submit  {mode: vault | demo | browser} — the vaulting fee into escrow
POST /cases/ZRH-001/shipments/SHP-…/simulate/next operator     the simulator (mock) · /poll asks USPS (live)
GET  /ladder?price=85.71               x402    402 with XRPL terms when priced; the rungs and the price at which each triggers
GET  /board?since=0                    read    the public lines the judges watch (poll) · /board/stream for SSE
GET  /cases/ZRH-001/receipt.json       free once sealed · /verify for the read-backs
```

Writes carry an `Idempotency-Key` (the SDKs add one): a retry answers from the store, a reused key with a different body is refused.
Full contract: `openapi/liquidgate.v1.json`.

## Provenance

Only what is built during the hackathon counts. `PROVENANCE.md` opens with the freeze hash (the platform branch's commit when the
clock started), lists everything reused (ENV, with the iteration that built it) and everything built (NEW, one line per commit, appended
by the desk). `scripts/publish.sh` prints the hash and splits this folder into its own repository.

## Honesty labels

LIVE = a transaction a public testnet node validated (hash, explorer link). DEMO = recorded by the platform because the amendment is
not enabled where it runs — labelled on every line, never counted as live. NEW · planned = not built yet; the API says 501, the
dashboard draws the frame dashed. Mock = fixtures in this browser, no platform at all.
