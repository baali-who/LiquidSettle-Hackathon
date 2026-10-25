# docs — the media for judges and reviewers

What to judge is in [`../JUDGING.md`](../JUDGING.md). This folder holds the material behind it.

```
docs/
├── settlement-engine/                     HACKATHON — the entry
│   ├── LiquidSettle_Ledger_Workflows.pdf   five workflows step by step + the hash register
│   ├── LiquidSettle_Test_Report.pdf        tests, public checks, visual pass, gaps
│   ├── screens/                            the engine at 1440 px (light, dark) and 390 px, sample data
│   └── design/                             the Figma frames it was built from
├── collateral-lock/                       DEMO — context, not entered
│   ├── CollateralLock_Evidence_and_Hashes.pdf
│   └── CollateralLock_Pitch_Deck.pdf
└── build/
    ├── build_pdfs.py                       renders the two settlement-engine PDFs (Playwright's Chromium)
    ├── test_results.json                   the test results the report prints
    └── export_hashes.py                    reads a platform's deal transactions → settlement-engine/hashes.json
```

## The labels

| Tag | Meaning |
|---|---|
| `HACKATHON` | The entry: the settlement engine and its deals API. |
| `DEMO` | Shown for context, not entered: the Lending desk and CollateralLock. |
| `LIVE · XRPL TESTNET` | A transaction on the public XRPL Testnet. Its hash opens on any Testnet explorer. |
| `OWN NODE` | A transaction on our XLS-66 devnet (network_id 424, `DEMO`). Its hash exists only there; the full JSON is in the CollateralLock evidence. |
| `SIMULATED` | Off the ledger, and labelled so on every screen: ACH, card, and USPS itself. |
| `SAMPLE` | The repository's sample data (`?mock=1`). It was recorded on an in-memory ledger, so it is not proof. |

## Rebuilding the PDFs

```bash
pip install playwright && playwright install chromium
python3 docs/build/export_hashes.py https://<platform>/api/lg/v1 <token>   # optional: fills the hash register
python3 docs/build/build_pdfs.py
```

- **Testnet hashes:** `export_hashes.py` keeps a Testnet hash only if a public Testnet node returns the same result
  for it.
- **Own-node hashes** are kept as the platform reports them and labelled `OWN NODE`.
- **The token** is never written to disk.

## What was checked before publishing

The attachments were reviewed for confidential data. None of them carries a seed, a private key, an API key, a node
URL or a private IP address. Every address and validator key in them is public, from test networks.

The browser screenshots taken during the event were left out, because their tab and bookmark bars showed unrelated
accounts. The engine's screens here were captured fresh from this repository.
