# LiquidSettle — the end-user front end

Settle real assets. Pay only when the deal is done. The buyer's payment is secured on the XRP Ledger and released only when
the agreed condition is met; nobody can move it early. This folder is the app the buyer, the seller and the provider's desk use —
white-labelled for the provider whose vault holds the Au (USRCX, Meridian MS, by default) — on **LiquidGate**, the platform's API.

```
settle/
├── index.html         the standalone mount; the platform mounts the same files at /settle/
├── settle.css         one token system, light + dark (design v2, Iteration 53) + the components, every class ls-; fonts self-hosted (fonts/, OFL)
└── js/
    ├── theme.js       a classic script, loaded first: applies the remembered light / dark choice before the first paint
    ├── main.js        boot · the hash router (#/ · #/desk · #/presenter · #/case/<ref> · #/pay/<ref> · #/passport/<serial> · #/vault/<ref> · #/my/<ref>)
    ├── data.js        ApiSource (view-models from GET /api/lg/v1/settle/<screen>/<id>) ↔ MockSource (the sample data); a 404 falls back to the sample, marked
    ├── sdk.js         the LiquidGate JS SDK (dashboard/js/sdk.js) + settle()
    ├── ui.js          the shared components: the money hero with the journey rail, the ledger's latest line, the release rule, the proof card, the passport, the health bar, the ladder, the sheet, the device frame, the theme toggle…
    ├── mock.js        the sample data — the design's renderVals, in the view-model shapes the API serves (names, amounts, hashes are placeholders)
    └── screens/       start · desk · presenter · room · pay · passport · vault · customer — one module per screen, every state
```

## Run it

* **On the sample data** — `hackathon/scripts/serve.sh 8788 settle` → `http://localhost:8788/?mock=1`. Every screen and state is reachable from
  the Start page; the dashed *Demo: …* buttons step the story (they only exist in sample / demo mode).
* **On the platform** — signed in at `/settle/` (module *LiquidSettle · hackathon* on): the page mints a session token, the screens read the
  person's own cases through the API, every step carries its **Live / Simulated** chip, every ledger event its **Verify ↗** (the explorer) and
  **Platform ↗** (the platform's own page for that record). `/settle/mock` is the sample without a login, for judges and screenshots.
* **Against any platform** — set `data-ls-api` and `data-ls-token` on `#ls-root` in `index.html` (a key with the `read` scope from the desk).

## Light, dark, and the rail (Iteration 53)

* The app follows the system's colour scheme and remembers a choice made with the sun / moon button in the header (`localStorage`,
  this browser only). Every colour is a token in `settle.css`; the money hero, the Start screen and the wallet buttons stay dark in both.
* There is no event list to read: the **journey rail** in the hero says where the settlement is (done · now · next), one line says what
  the ledger did last, and *View proof* opens every receipt with each step's **requested vs effective** mode — what the platform's
  environment asked for (`SETTLE_STEP_<KEY>`, `GET /api/lg/v1/settle/config`) against what the record is, and why they differ when they do.
* On a desk the phone screens sit in a device frame with a link back to the provider's view; on a phone they are full-bleed.

## Custody (Iteration 52)

The signing sheets open **Approve with…**: Xaman · Uphold · Self-custody · Ledger · LiquidLabs custody, each with its
status on the platform (`custody` on the pay and customer documents, or `GET …/settle/custody`), and `#/custody` explains
the five. `js/ledger.js` is the platform's own WebHID transport (identical copy) — choosing Ledger reads the account from a
real device in Chrome or Edge (its chip says *Device test pending* until a physical device has signed); the approval that
follows is the step's, simulated where the step is, and the sheet says so.

## The rules the design set, and how the code keeps them

* **Au, never the metal's name** in anything a screen shows — a test greps the package and every view-model (platform URLs excepted).
* The currency mark is `<span class="ls-rl">RL</span>USD` (`rl()` / `rlMark()` in ui.js), never the eight letters in copy.
* **Money first, the rule beside it, summary → details → proof** (proof collapsed). One status sentence per screen, from the view-model.
* One timeline component everywhere, with the colour key: seller `#C9A24C` · buyer `#007A5C` · carrier `#3B78C9` · ledger `#01CB9A` (halo).
* **Nothing faked.** A step the platform does not run is marked *Simulated*; an empty record says it is empty; the fallback to the sample
  says *Sample data*. The gaps and the mapping are in the platform's `docs/settle-handoff/SETTLE_GAPS.md`.
* No inline script, no inline style (the platform's CSP: `style-src 'self'`): sizes go through the CSSOM (`el.style.cssText`), never `style=""`.
* The buyer sees *No fees for you.*; the refusal card appears only when the ledger enforces it (the environment has a permissioned domain).
