# Judging guide

**The entry is the LiquidSettle settlement engine — tagged `HACKATHON`.** Everything else in this repository is
tagged `DEMO`. It is shown for context and is not entered.

| Part | Where | Tag | In one line |
|---|---|---|---|
| **Settlement engine** — the desk, deals, vault, money, activity, ways out, the workflow console | `settle/` | **`HACKATHON`** | The six Figma frames, built and wired to the XRP Ledger. |
| **Deals API** — LiquidGate `/api/lg/v1/deals…` | `openapi/` · `sdk/` | **`HACKATHON`** | The contract the engine speaks. |
| Lending desk — the eleven beats of the gold case | `dashboard/` | `DEMO` | An earlier operator console. |
| CollateralLock — our XLS-66 amendment and its devnet | `spec/` · `docs/collateral-lock/` | `DEMO` | The loan workflow runs on it. Its evidence is attached as context. |

You can tell them apart in the app as well. The settlement engine's top bar carries a mint **HACKATHON** tag, and the
Lending desk's header says **Demo · not the hackathon entry**.

## Five minutes with the entry

```bash
scripts/serve.sh 8788 settle        # → http://localhost:8788/?mock=1   (sample data, labelled SAMPLE)
```

1. **Home.** Two deals need you. There are nine deals, and every step of each is a transaction or a labelled
   simulation.
2. **LS-1045 — Approve & pay, refused.** The ledger answers `tecNO_AUTH` because the wallet has no KYC credential. The
   way through is credential → accept → authorise → pay.
3. **LS-1043 and LS-1046 — on its way.** The USPS scans are typed in by hand. Each scan is anchored on the ledger and
   releases one escrow leg.
4. **LS-1044 — the loan.**
   - Drag the loan-health meter: at another Au price, the rung, the ways out and the chart all follow.
   - Nothing is published. An operator on a platform can then publish it as an OracleSet.
5. **Ways out → Activity → Architecture.** Every hash, and how the modules fit together.

## Evidence

| Document | Tag | What it shows |
|---|---|---|
| [`docs/settlement-engine/LiquidSettle_Ledger_Workflows.pdf`](docs/settlement-engine/LiquidSettle_Ledger_Workflows.pdf) | `HACKATHON` | The five workflows step by step: who signs, which transaction, which ledger, the expected result. Also the hash register. |
| [`docs/settlement-engine/LiquidSettle_Test_Report.pdf`](docs/settlement-engine/LiquidSettle_Test_Report.pdf) | `HACKATHON` | The tests behind it, the public checks, the visual pass, and what is not covered. |
| [`docs/settlement-engine/screens/`](docs/settlement-engine/screens/) · [`design/`](docs/settlement-engine/design/) | `HACKATHON` | Every screen of the engine, and the Figma frames it was built from. |
| [`docs/collateral-lock/CollateralLock_Evidence_and_Hashes.pdf`](docs/collateral-lock/CollateralLock_Evidence_and_Hashes.pdf) | `DEMO` | CollateralLock's source register, test logs, own-node run and two-validator crosscheck. Every hash is in full. |
| [`docs/collateral-lock/CollateralLock_Pitch_Deck.pdf`](docs/collateral-lock/CollateralLock_Pitch_Deck.pdf) | `DEMO` | The CollateralLock pitch. |

## Said plainly

- **On the ledger:**
  - both escrow legs, plus their finish and cancel;
  - the credential;
  - every scan anchor;
  - the price (OracleSet).
- **On our own devnet (`DEMO`):** the loan's steps.
- **Simulated and labelled:** ACH and card payments, and USPS itself.
- **The sample data** in this repository was recorded against an in-memory ledger. It says `SAMPLE` and links to no
  explorer, because its hashes are not proofs.
- **The hash register is still pending.** The settlement engine has not yet been run on the public XRPL Testnet from
  this build, so its hash register (in the workflows PDF) says *pending* until a run's hashes are read back with
  `docs/build/export_hashes.py`.
