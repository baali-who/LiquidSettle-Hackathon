"""LiquidGate Python SDK — one file, standard library only (urllib), Python ≥ 3.9.

    from liquidgate import LiquidGate
    lg = LiquidGate("https://platform.example/api/lg/v1", token="lg_test_…")
    env = lg.env()                                  # free
    case = lg.case("ZRH-001")["case"]               # scope read
    prep = lg.prepare("ZRH-001", "lock")            # scope case:prepare → {"tx": {...unsigned...}, "descriptor": {...}}
    # sign prep["tx"] with xrpl-py: Wallet.from_seed(seed) → sign(...) → tx_blob
    lg.submit("ZRH-001", "lock", mode="browser", tx_blob=tx_blob)
    lg.run("ZRH-001", "price", price="85.71")        # scope operator

Every write sends an Idempotency-Key (uuid4 unless you pass one). Errors raise LiquidGateError with
`.status` and `.body`. A 402 carries the x402 terms in `.body` — pay them on the XRPL and retry with
`x_payment=<header>`.
"""
from __future__ import annotations

import json
import uuid
from typing import Any
from urllib import error, parse, request

__all__ = ["LiquidGate", "LiquidGateError"]


class LiquidGateError(Exception):
    def __init__(self, message: str, status: int = 0, body: dict | None = None):
        super().__init__(message)
        self.status = status
        self.body = body or {}


class LiquidGate:
    def __init__(self, base: str = "/api/lg/v1", token: str = "", *, timeout: float = 20.0, consumer: str = "sdk-python"):
        self.base = base.rstrip("/")
        self.token = token
        self.timeout = timeout
        self.consumer = consumer

    # ── transport ──────────────────────────────────────────────────────────────
    def _call(self, method: str, path: str, *, params: dict | None = None, body: dict | None = None,
              idempotency_key: str | None = None, headers: dict | None = None) -> dict:
        url = self.base + path
        if params:
            q = {k: v for k, v in params.items() if v not in (None, "")}
            if q:
                url += ("&" if "?" in url else "?") + parse.urlencode(q)
        h = {"Accept": "application/json", "X-X402-Consumer": self.consumer}
        if self.token:
            h["Authorization"] = "Bearer " + self.token
        data = None
        if body is not None:
            h["Content-Type"] = "application/json"
            data = json.dumps(body).encode()
        if method != "GET":
            h["Idempotency-Key"] = idempotency_key or str(uuid.uuid4())
        h.update(headers or {})
        req = request.Request(url, data=data, method=method, headers=h)
        try:
            with request.urlopen(req, timeout=self.timeout) as r:
                return json.loads(r.read().decode() or "{}")
        except error.HTTPError as exc:
            raw = exc.read().decode(errors="replace")
            try:
                payload = json.loads(raw)
            except ValueError:
                payload = {"ok": False, "error": raw[:200]}
            raise LiquidGateError(payload.get("error") or f"HTTP {exc.code}", exc.code, payload) from None
        except error.URLError as exc:
            raise LiquidGateError(f"LiquidGate not reachable: {exc.reason}", 0) from None

    def get(self, path: str, **params: Any) -> dict:
        return self._call("GET", path, params=params)

    def post(self, path: str, body: dict | None = None, *, idempotency_key: str | None = None, **headers: str) -> dict:
        return self._call("POST", path, body=body or {}, idempotency_key=idempotency_key, headers=headers)

    # ── free ───────────────────────────────────────────────────────────────────
    def health(self) -> dict: return self.get("/health")
    def env(self) -> dict: return self.get("/env")
    def descriptors(self) -> dict: return self.get("/descriptors")
    def descriptor(self, tx_type: str) -> dict: return self.get(f"/descriptors/{parse.quote(tx_type)}")
    def provenance(self) -> dict: return self.get("/provenance")
    def receipt(self, ref: str) -> dict: return self.get(f"/cases/{parse.quote(ref)}/receipt.json")
    def verify(self, ref: str, run: bool = False) -> dict: return self.get(f"/cases/{parse.quote(ref)}/verify", run=1 if run else None)

    # ── the credential ─────────────────────────────────────────────────────────
    def me(self) -> dict: return self.get("/me")

    # ── cases ──────────────────────────────────────────────────────────────────
    def cases(self) -> dict: return self.get("/cases")
    def open(self, **body: Any) -> dict: return self.post("/cases", body)
    def case(self, ref: str) -> dict: return self.get(f"/cases/{parse.quote(ref)}")
    def beats(self, ref: str) -> dict: return self.get(f"/cases/{parse.quote(ref)}/beats")
    def events(self, ref: str, since: int = 0) -> dict: return self.get(f"/cases/{parse.quote(ref)}/events", since=since)
    def run(self, ref: str, action: str, *, idempotency_key: str | None = None, **data: Any) -> dict:
        return self.post(f"/cases/{parse.quote(ref)}/run/{parse.quote(action)}", data, idempotency_key=idempotency_key)
    def prepare(self, ref: str, step: str) -> dict: return self.post(f"/cases/{parse.quote(ref)}/prepare/{parse.quote(step)}")
    def submit(self, ref: str, step: str, *, mode: str = "browser", tx_blob: str | None = None, idempotency_key: str | None = None) -> dict:
        body = {"mode": mode}
        if tx_blob:
            body["tx_blob"] = tx_blob
        return self.post(f"/cases/{parse.quote(ref)}/submit/{parse.quote(step)}", body, idempotency_key=idempotency_key)
    def xray(self, ref: str) -> dict: return self.get(f"/cases/{parse.quote(ref)}/xray")

    # ── the parcels (Iteration 50) ─────────────────────────────────────────────
    def shipments(self, ref: str) -> dict: return self.get(f"/cases/{parse.quote(ref)}/shipments")
    def tracking_number(self, ref: str, sref: str, number: str, *, reuse: bool = False, idempotency_key: str | None = None) -> dict:
        return self.post(f"/cases/{parse.quote(ref)}/shipments/{parse.quote(sref)}/number", {"tracking_number": number, "reuse": reuse},
                         idempotency_key=idempotency_key)
    def fee_prepare(self, ref: str, sref: str) -> dict: return self.post(f"/cases/{parse.quote(ref)}/shipments/{parse.quote(sref)}/fee/prepare")
    def fee(self, ref: str, sref: str, *, mode: str = "browser", tx_blob: str | None = None, idempotency_key: str | None = None) -> dict:
        body = {"mode": mode}
        if tx_blob:
            body["tx_blob"] = tx_blob
        return self.post(f"/cases/{parse.quote(ref)}/shipments/{parse.quote(sref)}/fee", body, idempotency_key=idempotency_key)
    def simulate(self, ref: str, sref: str, action: str, **data: Any) -> dict:
        return self.post(f"/cases/{parse.quote(ref)}/shipments/{parse.quote(sref)}/simulate/{parse.quote(action)}", data or None)

    # ── LiquidSettle view-models (Iteration 51) ────────────────────────────────
    def settle(self, screen: str, ident: str | None = None, **params: Any) -> dict:
        """One screen's view-model: desk · room/<ref> · pay/<ref> · passport/<serial> · vault/<ref> · customer/<ref> · presenter/<scenario> · custody[/<ref>] (scope read)."""
        path = f"/settle/{parse.quote(screen)}" + (f"/{parse.quote(ident)}" if ident else "")
        return self._call("GET", path, params={k: v for k, v in params.items() if v is not None} or None)

    # ── x402 ───────────────────────────────────────────────────────────────────
    def ladder(self, *, price: str | None = None, grams: str | None = None, debt: str | None = None, x_payment: str | None = None) -> dict:
        return self._call("GET", "/ladder", params={"price": price, "grams": grams, "debt": debt},
                          headers={"X-PAYMENT": x_payment} if x_payment else None)

    # ── the board ──────────────────────────────────────────────────────────────
    def board(self, since: int = 0, team: str | None = None, case: str | None = None) -> dict:
        return self.get("/board", since=since, team=team, case=case)
    def board_counts(self, team: str | None = None) -> dict: return self.get("/board/counts", team=team)
    def note(self, message: str, **extra: Any) -> dict: return self.post("/board/notes", {"message": message, **extra})
    def commit(self, key: str, hash_: str, message: str) -> dict: return self.post("/board/commits", {"key": key, "hash": hash_, "message": message})

    # ── the agent ──────────────────────────────────────────────────────────────
    def tools(self) -> dict: return self.get("/agent/tools")
    def tool(self, name: str, **args: Any) -> dict: return self.post(f"/agent/tools/{parse.quote(name)}", {"args": args})


if __name__ == "__main__":          # python liquidgate.py https://host/api/lg/v1 [token]
    import sys
    lg = LiquidGate(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000/api/lg/v1", sys.argv[2] if len(sys.argv) > 2 else "")
    e = lg.env()
    print(f"LiquidGate {e['liquidgate']['version']} · {e['network']['mode']} · node C {'ready' if e['node_c'].get('ready') else 'not ready'}")
    for b in e["beats"]:
        print(f"  {b['key']:<11} {b['mode']:<8} {b['source']:<4} {b['label']}")
