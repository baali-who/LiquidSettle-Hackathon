#!/usr/bin/env python3
"""The hygiene check of this repository — run it before every push, and CI runs it on every push.

    python3 scripts/check.py

It is the public twin of the platform's own test: every JSON parses, the files the README promises exist,
no file carries a seed-like token or an API key, no HTML carries an inline style or script, no JavaScript
writes data through innerHTML outside ui.js, LiquidSettle never says the metal's name (the deals engine excepted: it
follows the Figma copy) or the eight letters of the stablecoin, and both scripts keep their shebang. Standard library only; exit code 1 on the first list of
findings, 0 when everything held.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = re.compile(r"\bs[A-Za-z0-9]{28}\b")                       # an XRPL family seed
KEY = re.compile("lg_(" + "test" + "|" + "live" + ")_[A-Za-z0-9_-]{16,}")   # a LiquidGate API key
# the platform's names, spelled in pieces so this file never carries them itself
PLATFORM = re.compile("|".join((r"\bfrom " + "app" + r"\.", r"\bimport " + "app" + r"\b", "app" + "/services", "OPS_" + "WALLET", "AWS_" + "SECRET")))
METAL = re.compile(r"gold", re.I)
MUST_EXIST = (
    "README.md", "JUDGING.md", "docs/README.md", "LICENSE", "PROVENANCE.md", "BUILD-DAY.md", "CONTRIBUTING.md", "SECURITY.md", "config.example.json",
    "openapi/liquidgate.v1.json", "spec/XLS-66c.md", "spec/clear-signing/DelegateSet.json", "spec/clear-signing/LoanSet.json",
    "sdk/python/liquidgate.py", "sdk/README.md", "scripts/serve.sh", "scripts/publish.sh",
    "dashboard/index.html", "dashboard/app.css", "dashboard/js/main.js", "dashboard/js/sdk.js", "dashboard/js/mock.js",
    "settle/index.html", "settle/settle.css", "settle/js/main.js", "settle/js/sdk.js", "settle/js/custody.js", "settle/js/ledger.js",
    "settle/fonts/LICENSE-IBMPlex.txt", "settle/fonts/LICENSE-Montserrat.txt",
)


def main() -> int:
    bad: list[str] = []
    for rel in MUST_EXIST:
        if not (ROOT / rel).exists():
            bad.append(f"missing: {rel}")
    files = [p for p in ROOT.rglob("*") if p.is_file() and ".git" not in p.parts and "vendor" not in p.parts and "node_modules" not in p.parts]
    for p in files:
        rel = p.relative_to(ROOT)
        if p.suffix in (".woff2", ".png", ".jpg", ".ico"):
            continue
        text = p.read_text(errors="replace")
        if p.suffix != ".md" and SEED.search(text):
            bad.append(f"{rel}: seed-like token")
        if KEY.search(text):
            bad.append(f"{rel}: an API key")
        if p.suffix in (".py", ".js", ".json", ".html", ".sh") and PLATFORM.search(text) and p.name != "check.py":
            bad.append(f"{rel}: platform import or variable")
        if p.suffix == ".html" and (re.search(r'style="', text) or re.search(r"<script>(?!\s*$)", text) or "javascript:" in text):
            bad.append(f"{rel}: inline style/script")
        if p.suffix == ".js" and re.search(r"\.innerHTML\s*=\s*[^\"']", text) and p.name != "ui.js":
            bad.append(f"{rel}: innerHTML with data")
        if p.suffix == ".json":
            try:
                json.loads(text)
            except ValueError as exc:
                bad.append(f"{rel}: not JSON ({exc})")
        # the deals engine (settle/js/engine/, engine.css) follows the Figma copy, which names the metal; the RL USD rule still holds
        engine = rel.parts[:3] == ("settle", "js", "engine") or rel.as_posix() == "settle/engine.css"
        if rel.parts[0] == "settle" and p.suffix in (".js", ".css", ".html") and engine and "RLUSD" in text:
            bad.append(f"{rel}: the mark is RL USD in two spans, never the eight letters")
        if rel.parts[0] == "settle" and p.suffix in (".js", ".css", ".html") and not engine:
            for m in METAL.finditer(text):
                line = text[:m.start()].count("\n") + 1
                bad.append(f"{rel}:{line}: LiquidSettle says the metal's name")
            if "RLUSD" in text:
                bad.append(f"{rel}: the mark is RL USD in two spans, never the eight letters")
    for s in ("scripts/serve.sh", "scripts/publish.sh"):
        if (ROOT / s).exists() and not (ROOT / s).read_text().startswith("#!/usr/bin/env bash\n"):
            bad.append(f"{s}: must start with its shebang")
    prov = (ROOT / "PROVENANCE.md").read_text().splitlines() if (ROOT / "PROVENANCE.md").exists() else []
    if not prov or not prov[0].startswith("FREEZE_HASH:"):
        bad.append("PROVENANCE.md: first line must be FREEZE_HASH: <hash>")
    spec = ROOT / "openapi" / "liquidgate.v1.json"
    if spec.exists():
        try:
            doc = json.loads(spec.read_text())
            if doc.get("info", {}).get("license", {}).get("name") != "MIT":
                bad.append("openapi: licence must be MIT")
            if "custody" not in doc["components"]["parameters"]["screen"]["schema"]["enum"]:
                bad.append("openapi: the settle screen enum lacks custody")
        except (ValueError, KeyError) as exc:
            bad.append(f"openapi: {exc}")
    for a, b in (("dashboard/js/sdk.js", "settle/js/sdk.js"),):
        pa, pb = ROOT / a, ROOT / b
        if pa.exists() and pb.exists():
            strip = lambda s: re.sub(r"/\*\*.*?\*/", "", s, count=1, flags=re.S).strip()  # noqa: E731 — the header comment differs
            if strip(pa.read_text()) != strip(pb.read_text()):
                bad.append(f"{a} and {b} differ beyond their header comment")
    if bad:
        print("\n".join(bad))
        print(f"\n{len(bad)} finding(s)")
        return 1
    print(f"all held: {len(files)} files checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
