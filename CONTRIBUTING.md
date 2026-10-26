# Contributing

Thank you for looking. This repository is the public part of a larger platform; the rules below are what keep it
honest and safe to run anywhere. A pull request that keeps them is welcome.

## Run it

```bash
scripts/serve.sh 8788 settle      # LiquidSettle on sample data  → http://localhost:8788/?mock=1
scripts/serve.sh                  # LiquidLend on fixtures → http://localhost:8787/?mock=1[&scenario=live]
python3 scripts/check.py          # the hygiene check (CI runs the same on every push)
for f in $(git ls-files '*.js'); do node --check "$f"; done
```

No build step, no framework, no package to install: ES modules served by any static server. Against a platform, enter its
API base and a key in LiquidLend's *Settings*, or set the data attributes on `settle/index.html`.

## The rules the code keeps

1. **No inline script, no inline style, nothing from a CDN.** Both apps run under a strict Content Security Policy
   (`script-src 'self'`, `style-src 'self'`, `font-src 'self'`). Sizes and colours that vary go through the CSSOM
   (`el.style.cssText`), classes carry the rest; fonts are self-hosted under `settle/fonts/` with their licences.
2. **No secret, ever.** No seed, no API key, no node URL, no platform import in any file — `scripts/check.py` refuses
   them, and the platform's own test refuses them again before the folder is published.
3. **Honest labels.** A step is *Live* only when a node validated it; *DEMO* is a labelled record; *NEW · planned* is a
   dashed frame; *Simulated* is a flow without a record; *Sample data* is this browser's fixtures. Never promote one to
   another in copy or colour.
4. **LiquidSettle's copy says "Au"**, never the metal's name, in every string a screen can show (`check.py` greps the
   package; the platform greps every view-model). The stablecoin mark is `<span class="ls-rl">RL</span>USD` through
   `rl()` / `rlMark()` / `withMark()`, never the eight letters.
5. **Data, not markup.** `innerHTML` with data stays inside `ui.js`'s `h()`; screens build elements and text nodes.
6. **The SDKs stay thin and dependency-free**; every method maps to one endpoint of `openapi/liquidgate.v1.json`; every
   write carries an `Idempotency-Key`. `dashboard/js/sdk.js` and `settle/js/sdk.js` are the same file apart from the
   header comment (the check compares them).
7. **The derived files are rendered, not edited**: `PROVENANCE.md`, `config.example.json` and `spec/clear-signing/*.json`
   come from the platform (`tools/liquidgate/render.py` there). Change the source, re-render, commit both.
8. **One commit per NEW item** during the hackathon (`feat(new): <key> — …`), announced on the board so the provenance
   grows with hashes; see `BUILD-DAY.md`.

## Pull requests

Describe what the change does for a buyer, a provider or a judge, name the screen or endpoint, and paste the output of
`scripts/check.py`. Design changes to LiquidSettle follow the handoff's rules (the platform repository keeps the handoff
under `docs/settle-handoff/`): money first, the rule beside it, summary → details → proof, one status sentence per screen.

## Licence

MIT, © 2026 LiquidLabs. By contributing you agree your contribution is licensed the same way.
