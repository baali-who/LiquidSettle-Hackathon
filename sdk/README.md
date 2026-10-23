# SDKs

Two clients, both thin, both dependency-free. Every method maps to one endpoint of `openapi/liquidgate.v1.json`; every write sends an
`Idempotency-Key`; errors carry the status and the body (`402` → the x402 terms).

**JavaScript** — `dashboard/js/sdk.js` (ES module; browser and Node ≥ 18):

```js
import { LiquidGate } from "./dashboard/js/sdk.js";
const lg = new LiquidGate({ base: "https://platform/api/lg/v1", token: "lg_test_…" });
const { case: c } = await lg.case("ZRH-001");
const prep = await lg.prepare("ZRH-001", c.current_step);     // unsigned tx + descriptor
// sign prep.tx with xrpl.js: new xrpl.Wallet.fromSeed(seed).sign(prep.tx).tx_blob
await lg.submit("ZRH-001", c.current_step, { mode: "browser", tx_blob });
const stop = lg.watchBoard((lines) => console.log(lines));   // poll the board; stop() to end
```

**Python** — `sdk/python/liquidgate.py` (stdlib `urllib`; Python ≥ 3.9):

```python
from liquidgate import LiquidGate
lg = LiquidGate("https://platform/api/lg/v1", token="lg_test_…")
env = lg.env()
lg.run("ZRH-001", "price", price="85.71")                     # scope operator
prep = lg.prepare("ZRH-001", "lock")                           # scope case:prepare
# xrpl-py: from xrpl.wallet import Wallet; from xrpl.transaction import sign; blob = sign(Transaction.from_xrpl(prep["tx"]), Wallet.from_seed(seed)).blob()
lg.submit("ZRH-001", "lock", mode="browser", tx_blob=blob)
```

`python sdk/python/liquidgate.py https://platform/api/lg/v1` prints the environment and the beats.

The platform never sees a seed: `prepare` returns the unsigned transaction, you sign where the key lives, `submit` relays the blob
(or signs in the platform's vault for a platform wallet, or records a DEMO line where the amendment is off).
