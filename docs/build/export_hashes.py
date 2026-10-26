#!/usr/bin/env python3
"""Read LiquidSettle's transactions back from a platform and write docs/settlement-engine/hashes.json.

    python3 docs/build/export_hashes.py https://<platform>/api/lg/v1 <session token or key with the read scope>

Only rows that carry a hash and a ledger result are kept (notes and simulated steps have none). Each Testnet hash is
then looked up on a public Testnet node (tx, binary=false) and kept only if the node returns the same result; own-node
rows (our devnet, DEMO) are kept as the platform reports them and labelled so. Standard library only; the token is
read from the argument and never written anywhere.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "settlement-engine" / "hashes.json"
PUBLIC_TESTNET = "https://s.altnet.rippletest.net:51234/"


def get(url: str, token: str) -> dict:
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:  # noqa: S310 — the operator names the platform
        return json.loads(r.read())


def on_testnet(h: str) -> str | None:
    body = json.dumps({"method": "tx", "params": [{"transaction": h, "binary": False}]}).encode()
    req = urllib.request.Request(PUBLIC_TESTNET, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:  # noqa: S310
            res = json.loads(r.read()).get("result", {})
    except OSError:
        return None
    return (res.get("meta") or {}).get("TransactionResult")


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    base, token = sys.argv[1].rstrip("/"), sys.argv[2]
    items = get(f"{base}/deals/activity", token).get("items", [])
    kept, dropped = [], 0
    for i in items:
        if not (i.get("hash") and i.get("result")):
            continue
        row = {k: i.get(k) for k in ("ref", "tx_type", "result", "hash", "ledger_index", "network", "network_label", "title", "at")}
        if i.get("network") == "testnet":
            seen = on_testnet(i["hash"])
            if seen != i["result"]:
                dropped += 1
                continue
            row["verified_on"] = PUBLIC_TESTNET
        kept.append(row)
    OUT.write_text(json.dumps({"source": base, "items": kept}, indent=1) + "\n")
    print(f"wrote {OUT} · {len(kept)} transaction(s) · {dropped} not confirmed by the public Testnet node (left out)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
