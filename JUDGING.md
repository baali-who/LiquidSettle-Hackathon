# Judging guide

This repository holds two apps on the XRP Ledger and the amendment the loans run on.

| Part | Where | In one line |
|---|---|---|
| **LiquidSettle** | `settle/` (+ the deals API in `openapi/`, `sdk/`) | Settle real assets: two escrows lock the money and the title, and each releases only on proof. |
| **LiquidLend** | `dashboard/` | The gold case beat by beat: the gold is pledged, the loan is opened, the price moves, the loan is repaid. |
| CollateralLock (XLS-66 amendment) + own devnet | `spec/` · `docs/collateral-lock/` | The loan cannot see its collateral today; one field makes the pledge a ledger fact. It is `DEMO`: it runs on our own devnet, not on any public network. |

## Five minutes with LiquidSettle

```bash
scripts/serve.sh 8788 settle        # → http://localhost:8788/?mock=1   (sample data, labelled SAMPLE)
```

1. **Home.** Two deals need you. There are nine deals, and every step of every deal is a transaction or a
   labelled simulation.
2. **LS-1045 — Approve & pay, refused.** The ledger answers `tecNO_AUTH`: the wallet has no KYC credential. The way
   through is credential → accept → authorise → pay.
3. **LS-1043 and LS-1046 — on their way.** The USPS scans are typed in by hand. Each one is anchored on the ledger and
   releases one escrow leg.
4. **LS-1044 — the loan.** Drag the loan-health meter to try another Au price. The rung, the ways out and the chart
   follow it, and nothing is published. On a platform, an operator can then publish the price as an OracleSet.
5. **Ways out → Activity → Architecture.** Every hash, and how the modules fit together.

## LiquidLend

```bash
scripts/serve.sh                    # → http://localhost:8787/?mock=1   (&scenario=live = the finished state)
```

The eleven beats of the gold case sit on one screen: prepare → sign → submit, the X-ray of the lending node, the
terminal and the board.

## Evidence

| Document | What it shows |
|---|---|
| [`docs/settlement-engine/LiquidSettle_Ledger_Workflows.pdf`](docs/settlement-engine/LiquidSettle_Ledger_Workflows.pdf) | LiquidSettle's five workflows, step by step: who signs, which transaction, which ledger and the expected result. It also holds the hash register. |
| [`docs/settlement-engine/LiquidSettle_Test_Report.pdf`](docs/settlement-engine/LiquidSettle_Test_Report.pdf) | The tests behind it, the public checks, the visual pass, and what is not covered. |
| [`docs/settlement-engine/screens/`](docs/settlement-engine/screens/) · [`design/`](docs/settlement-engine/design/) | Every screen, and the Figma frames it was built from. |
| [`docs/collateral-lock/XLS-CollateralLock.md`](docs/collateral-lock/XLS-CollateralLock.md) · [PDF](docs/collateral-lock/XLS-CollateralLock_Proposal.pdf) | `DEMO` — the amendment proposal in the XLS template. |
| [`docs/collateral-lock/CollateralLock_Evidence_and_Hashes.pdf`](docs/collateral-lock/CollateralLock_Evidence_and_Hashes.pdf) | `DEMO` — the source register, test logs, own-node run and two-validator crosscheck, with every hash in full. |
| [`docs/collateral-lock/CollateralLock_Pitch_Deck.pdf`](docs/collateral-lock/CollateralLock_Pitch_Deck.pdf) | `DEMO` — the CollateralLock pitch. |

## Said plainly

- **On the public XRPL Testnet:**
  - both escrow legs, with their finish and cancel;
  - the credential;
  - every scan anchor;
  - the price (OracleSet).
- **On our own devnet (`DEMO`):** the loan's steps.
- **Simulated and labelled:** ACH and card payments, and USPS itself.
- **The sample data** in this repository was recorded against an in-memory ledger. It says `SAMPLE` and links to no
  explorer: its hashes are not proofs.
- **The hash register is still pending.** LiquidSettle has not yet run on the public XRPL Testnet from this build, so
  its hash register in the workflows PDF says *pending*. It fills in once a run's hashes are read back with
  `docs/build/export_hashes.py`.
