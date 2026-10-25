# Build day — the runbook for the 36 hours

*For the team at the table. The framework (Iteration 49, commit `c53380b`) is ENV; everything below is NEW and lands one commit at a time. Keep `hackathon/scripts/serve.sh` → `http://localhost:8787/?mock=1&scenario=live` open on a second screen: that is what the finished dashboard looks like — every commit below turns one dashed thing on it solid.*

## 08:00 — before the clock

1. **Freeze.** `hackathon/scripts/publish.sh` prints HEAD. Desk → *Provenance › Freeze*: paste the hash and the public repo URL, type `FREEZE`. `python tools/liquidgate/render.py` → PROVENANCE.md's first line is the hash. Commit that as the last ENV commit.
2. **Node C.** Set `XRPL_LENDING_NODE_URL` on the ECS task definition (the EC2 in the private subnet; `ledger_accept` cron every 3 s). Desk → *Node C › Probe* until it says **ready** (SingleAssetVault ✓ LendingProtocol ✓). Without it every NEW beat stays `planned` — the dashboard will say so; never fake it.
3. **Module + keys.** Journey Builder → `lending` on. Desk → *Keys*: one key per teammate (`read · case:prepare · case:submit · operator · agent · board`, acts for the holder account, origin `http://localhost:8787` for anyone running the dashboard from the repo), one key for the jury (`read · board`, origins the wall's host). Paste yours into the dashboard's *Settings*.
4. **The holder.** A testnet account with LGAU opted in, funded, and its seed on the laptop that will sign (the platform page loads xrpl.js; from the repo, drop `xrpl.min.js` into `dashboard/vendor/` or paste blobs).
5. **Smoke.** `/lending/` shows the case; `GET /api/lg/v1/env` shows `node_c.ready: true`; `pytest tests/test_iteration49_liquidgate.py` green; `ruff check app` clean.

## The ten commits, in order — each: build → test offline → flip → announce

Announce = `POST /api/lg/v1/board/commits {"key","hash","message"}` with a `board` key (or the desk's *A NEW commit landed* form). The board prints `NEW <key>: …`, PROVENANCE.md grows, the dashboard's provenance panel counts it.

| # | key | what lands | where | flip | acceptance on the dashboard |
|---|---|---|---|---|---|
| 1 | `node-c` | the variable + a green probe; `services/liquidgate/nodes.py` unchanged | task definition | — | header chip `node C · ready` |
| 2 | `vault` | `services/liquidgate/newbeats/vault.py`: `open_vault(env, case)` runs `XrplLendingBuilders.vault_create` (tfVaultPrivate + `DomainID` = the KYC domain) · `vault_deposit` (2,000,000 RLUSD from the lender wallet) · `loan_broker_set` (CoverRateMinimum 10000 · Liquidation 100000 · ManagementFee 1000 · DebtMaximum 5,000,000) · `cover_deposit` (60,000) through `XrplLendingLedger(signer_wallet, "testnet", enabled)` against node C; records `GoldEvent`s on beat `vault`; stores vault/broker ids on the case (`node_c_json`, one nullable column + migration `b9c0d1e2f3a4`); API action `run/vault` (operator) | `services/liquidgate/case.py` `ACTIONS += ("vault",)`; `env.NEW_WIRED["vault"] = True` | beat 6 LIVE · done; the terminal shows four node C hashes |
| 3 | `loan` | `newbeats/loan.py`: `write_loan(case, counterparty_sig)` → `loan_set` with `PrincipalRequested` 600,000 · 6500 · 12000 · 12 × 180 · 600 · fee 3,000 · `Data` = the collateral descriptor hex · on path B `CollateralID` = the escrow's index (and the ledger sets the escrow's `LoanID` at lock when the amendment is on); the holder signs the same fields through `prepare/loan_sign` → the dashboard's sign panel already renders the LoanSet descriptor | `NEW_WIRED["loan"] = True` | beat 7 LIVE; *The deal* shows outstanding + `Loan on node C` |
| 4 | `xray` | `xray.read(case)` performs `vault_info` · `loan_broker_info` · `ledger_entry loan` · `account_objects escrow` · `get_aggregate_price` on node C and returns `{planned: false, reads: [{rpc, values, derived}], ledger_index}` — the shape `fixtures_live.js` already draws | `xray.read` no longer raises | the X-ray panel turns solid with numbers |
| 5 | `servicer` | `services/agent/tools.py`: `loan_status` · `vault_xray` · `prepare_loan_payment` (LoanPay, prepare-only) · `prepare_impairment` (LoanManage tfLoanImpair, prepare-only, broker) | desk → *agent.tools_new* emptied (or leave; the API serves a tool the moment it exists) | the four tools show *Run* instead of *NEW* |
| 6 | `batch` | `newbeats/batch.py`: one `Batch` (tfAllOrNothing) = `EscrowFinish` (fulfillment) + `Payment` (Delegate = Aurum, under the mandate) + `LoanPay`; API action `run/batch` | `NEW_WIRED["sale"] = True` | beat 9 LIVE; one hash on the terminal, three inner transactions |
| 7 | `watcher` | path A only: `newbeats/watcher.py` every `collateral.path_a_watcher_s` reads the loan, releases on zero principal, withholds on default. Behind `collateral.path == "A"`. Path B needs none — the ledger refuses | — | the desk's *Collateral path* says which path runs |
| 8 | `verify` | the verify page reads seal · loan · escrow · credential from `network.public_node_url` (never ours) and posts a `verify` line; the QR on the receipt PDF links here | — | the board's *verifies* counter moves when a juror's phone reads |
| 9 | `t54` | `X402_VERIFIER=t54`: `x402.verify` asks `https://xrpl-facilitator-testnet.t54.ai` instead of reading the ledger; the `ladder` resource first | task definition | `pay_for_data` reports `verifier: t54` |
| 10 | `descriptors` | the Ledger clear-signing screen compiled from `spec/clear-signing/*.json` | — | the sign panel's descriptor matches the device's screen |

**Each commit's loop** (≈ 90 min for the big ones): write it against `tests/_fake_gold.py`'s fake ledger first (`Live()` in `tests/test_iteration39_gold.py`) → `pytest tests/test_iteration49_liquidgate.py tests/test_iteration39_gold.py -q` → `ruff check app` → try it on node C through the dashboard (`/lending/`, the real beat button) → commit (`git add -A -- . ':!claude-handover'`; message `feat(new): <key> — …`) → announce → `python tools/liquidgate/render.py` when PROVENANCE.md must be re-rendered → `hackathon/scripts/publish.sh split` at the end of the day.

## What stays honest, whatever happens

* A beat is **LIVE** only when a node validated it (hash, explorer link). **DEMO** is a labelled record where the amendment is off. **NEW · planned** is a dashed frame. The API answers 501, never a made-up number.
* If node C is not ready by noon: keep building against the fake ledger, demo with `?mock=1&scenario=live` *and say so* ("this is the fixture of the finished state"), ship the ENV beats LIVE on testnet. The judges' rule is *built during the hackathon* — the commits and the board prove that, not the colours.
* Nothing published holds a seed, a key, a node URL or a platform import — `pytest tests/test_iteration49_liquidgate.py -k hackathon_package` before every `publish.sh`.

## The five-minute demo (judges' round)

1. **The wall**: `/api/lg/v1/board/stream` on the big screen, the commits of the day at the top.
2. **The dashboard** at beat 5: lock the LGAU (EscrowCreate with `LoanID`), sign the mandate — the descriptor on screen, the seed never leaves the laptop.
3. **Node C**: vault → loan; the X-ray fills; *The deal* shows 600,000 outstanding.
4. **The price falls** to 58 → LTV 71 % → Aurum notifies; a juror tries `EscrowFinish` → `tecPLEDGED` (XLS-66 Collateral Lending holds — the refusal line on the board).
5. **Sell & repay** in one Batch, or pay off and burn; the receipt seals; a juror's phone reads every hash from a public node — the *verifies* counter moves.
6. **Provenance**: PROVENANCE.md's first line, the ten NEW commits with hashes.

## Roles for the day (fill in)

| Role | Owner | Owns |
|---|---|---|
| node C + AWS | | commit 1 · 9 · the task definition |
| ledger builders | | 2 · 3 · 6 · 7 (services/liquidgate/newbeats/) |
| reads + agent | | 4 · 5 · 8 |
| dashboard + descriptors + the wall | | 10 · the demo · the board |
| provenance + publishing | | freeze · announce · render · split |
