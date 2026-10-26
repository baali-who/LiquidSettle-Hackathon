#!/usr/bin/env python3
"""Render LiquidSettle's two PDFs in docs/settlement-engine/ from the data below and the screenshots beside them.

    python3 docs/build/build_pdfs.py                 # needs Playwright's Chromium (pip install playwright; playwright install chromium)

    docs/settlement-engine/LiquidSettle_Ledger_Workflows.pdf   the workflows, step by step, and the hash register
    docs/settlement-engine/LiquidSettle_Test_Report.pdf        what was tested, how, and what was not

The hash register is read from docs/settlement-engine/hashes.json (docs/build/export_hashes.py writes it from a
platform's LiquidGate). An empty register prints as "pending": a hash is shown only when it was read from a ledger.
The HTML is written to docs/build/_out/ (ignored by git); only the PDFs are committed.
"""
from __future__ import annotations

import html
import json
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent
OUT = DOCS / "build" / "_out"
SE = DOCS / "settlement-engine"
FONTS = DOCS.parent / "settle" / "fonts"
DATE = "25 October 2026"

E = html.escape

CSS = """
@font-face { font-family: Montserrat; font-weight: 700; src: url('FONTS/montserrat-latin-700-normal.woff2') format('woff2'); }
@font-face { font-family: Montserrat; font-weight: 600; src: url('FONTS/montserrat-latin-600-normal.woff2') format('woff2'); }
@font-face { font-family: Plex; font-weight: 400; src: url('FONTS/ibm-plex-sans-latin-400-normal.woff2') format('woff2'); }
@font-face { font-family: Plex; font-weight: 600; src: url('FONTS/ibm-plex-sans-latin-600-normal.woff2') format('woff2'); }
@font-face { font-family: PlexMono; font-weight: 400; src: url('FONTS/ibm-plex-mono-latin-400-normal.woff2') format('woff2'); }
@page { size: 1200px 750px; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: Plex, sans-serif; color: #10231D; background: #FAFAF7; font-size: 13px; line-height: 1.45; }
.page { width: 1200px; height: 750px; padding: 34px 44px 30px; position: relative; overflow: hidden; page-break-after: always; background: #FAFAF7; }
.page.dark { background: #000F0C; color: #E9F2EE; }
.head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1.5px solid #10231D; padding-bottom: 12px; margin-bottom: 18px; }
.dark .head { border-color: #1F4D40; }
h1 { font-family: Montserrat; font-weight: 700; font-size: 27px; margin: 0; letter-spacing: -.01em; }
h2 { font-family: Montserrat; font-weight: 700; font-size: 15px; margin: 0 0 8px; }
.sub { color: #4C6159; margin: 5px 0 0; max-width: 820px; }
.dark .sub { color: #9DB5AC; }
.tags { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.tag { font-family: PlexMono; font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; padding: 3px 9px; border-radius: 5px; border: 1.2px solid; white-space: nowrap; }
.tag.hack { background: #01CB9A; border-color: #01CB9A; color: #00241B; font-weight: 600; }
.tag.demo { color: #A86A00; border-color: #D9A441; background: #FFF6E3; }
.tag.live { color: #0B7A55; border-color: #6CC9A5; }
.tag.own { color: #5B3FA8; border-color: #A894E0; }
.tag.sim { color: #2A5DB0; border-color: #8DB0E8; }
.tag.sample { color: #5E6B66; border-color: #B8C3BE; }
.pno { font-family: PlexMono; font-size: 11px; color: #6B7F78; }
.foot { position: absolute; left: 44px; right: 44px; bottom: 14px; border-top: 1px solid #DDE3E0; padding-top: 6px; font-family: PlexMono; font-size: 9.5px; color: #7A8C86; }
.dark .foot { border-color: #1F4D40; color: #6F8C83; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-family: PlexMono; font-weight: 400; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #5D706A; border-bottom: 1.2px solid #10231D; padding: 5px 6px; }
td { border-bottom: 1px solid #E2E7E4; padding: 6px 6px; vertical-align: top; font-size: 12px; }
td.mono, .mono { font-family: PlexMono; font-size: 11px; }
.res { font-family: PlexMono; font-size: 11px; font-weight: 600; }
.res.ok { color: #0B7A55; } .res.no { color: #C0392B; } .res.pl { color: #5B3FA8; }
.grid2 { display: grid; grid-template-columns: 1.25fr 1fr; gap: 22px; }
.grid2e { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.card { border: 1px solid #DDE3E0; border-radius: 10px; background: #fff; padding: 14px 16px; }
.dark .card { background: #06201A; border-color: #1F4D40; }
.shot { width: 100%; border: 1px solid #DDE3E0; border-radius: 8px; display: block; object-fit: cover; object-position: top; }
.cap { font-size: 10.5px; color: #5D706A; margin-top: 5px; }
.note { border-left: 3px solid #D9A441; padding: 6px 12px; color: #4C6159; margin-top: 12px; background: #FFFBF1; }
.note.mint { border-color: #01CB9A; background: #F0FBF6; }
.big { font-family: Montserrat; font-weight: 700; font-size: 54px; line-height: 1.03; letter-spacing: -.02em; margin: 0; }
.big em { font-style: normal; color: #01CB9A; }
.eyebrow { font-family: PlexMono; letter-spacing: .2em; font-size: 12px; color: #01CB9A; text-transform: uppercase; }
.stat b { display: block; font-family: Montserrat; font-size: 26px; }
.stat span { color: #5D706A; font-size: 11.5px; }
.dark .stat span { color: #9DB5AC; }
ul.tight { margin: 4px 0 0; padding-left: 18px; } ul.tight li { margin: 2px 0; }
.who { font-family: PlexMono; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #5D706A; }
.legend td { border: 0; padding: 4px 6px; }
.pill { display: inline-block; font-family: PlexMono; font-size: 10px; padding: 1px 7px; border-radius: 99px; border: 1px solid #B8C3BE; }
"""

LEGEND = [
    ("demo", "DEMO", "CollateralLock, our XLS-66 amendment, and its devnet: running on our own network, not on any public one."),
    ("live", "LIVE · XRPL TESTNET", "A transaction the engine submits to the public XRPL Testnet; its hash opens on any Testnet explorer."),
    ("own", "OWN NODE · DEVNET", "A transaction on our XLS-66 devnet (network_id 424). Part of the DEMO; hashes exist only there."),
    ("sim", "SIMULATED", "Off the ledger and labelled so on every screen: ACH and card payments."),
    ("sample", "SAMPLE", "The repository's sample data (?mock=1). Recorded on an in-memory ledger; its hashes are not proofs."),
]


def tag(kind: str, text: str) -> str:
    return f'<span class="tag {kind}">{E(text)}</span>'


def page(title: str, sub: str, body: str, *, tags=(), n: str = "", dark: bool = False, foot: str = "") -> str:
    t = "".join(tag(k, x) for k, x in tags)
    return (f'<section class="page{" dark" if dark else ""}"><div class="head"><div><h1>{E(title)}</h1>'
            f'<p class="sub">{sub}</p></div><div class="tags">{t}<span class="pno">{E(n)}</span></div></div>{body}'
            f'<div class="foot">{E(foot)}</div></section>')


def img(rel: str, h: int, cap: str = "") -> str:
    return f'<img class="shot" src="../../{rel}" alt="" height="{h}"/>' + (f'<div class="cap">{cap}</div>' if cap else "")


def res(code: str) -> str:
    cls = "ok" if code == "tesSUCCESS" else "pl" if code == "tecPLEDGED" else "no"
    return f'<span class="res {cls}">{E(code)}</span>'


def steps_table(rows) -> str:
    out = ['<table><tr><th>#</th><th>Who</th><th>Transaction</th><th>Ledger</th><th>What it does</th><th>Expected</th></tr>']
    for i, (who, tx, net, what, exp) in enumerate(rows, 1):
        out.append(f'<tr><td class="mono">{i}</td><td class="who">{E(who)}</td><td class="mono">{E(tx)}</td><td>{tag(net[0], net[1])}</td>'
                   f'<td>{what}</td><td>{res(exp) if exp else ""}</td></tr>')
    return "".join(out) + "</table>"


T = ("live", "Testnet")
D = ("own", "own node")
S = ("sim", "simulated")

# ── the workflows, as the engine runs them ─────────────────────────────────────────────────────────────────────────
DVP = [
    ("desk", "Payment (MPT)", T, "<b>Provider confirmed.</b> The issuer mints the bars to the desk's inventory; serials in the memo.", "tesSUCCESS"),
    ("customer", "— (price hold)", S, "<b>Terms agreed.</b> The Au price is held two minutes; the customer picks how to pay.", ""),
    ("desk", "EscrowCreate (MPT)", T, "<b>Title leg.</b> The Au token, desk → customer, PREIMAGE-SHA-256 condition, CancelAfter 12 days (XLS-85).", "tesSUCCESS"),
    ("customer", "EscrowCreate (IOU)", T, "<b>Payment leg.</b> RL USD, customer → desk, its own condition and the same refund date.", "tesSUCCESS"),
    ("USPS · by hand", "Payment (memo)", T, "<b>Picked up.</b> The scan is anchored by the logistics role (memo liquidsettle/usps).", "tesSUCCESS"),
    ("agent", "EscrowFinish", T, "<b>Payment released</b> to the desk on <i>picked up</i>. The fulfillment comes sealed from the platform; it is never shown.", "tesSUCCESS"),
    ("USPS · by hand", "Payment (memo)", T, "<b>Delivered</b> — signature at the verified address, anchored like every scan.", "tesSUCCESS"),
    ("agent", "EscrowFinish", T, "<b>Title released:</b> the Au token reaches the customer. The deal settles; the receipt lists every hash.", "tesSUCCESS"),
]
REFUSAL = [
    ("customer", "EscrowCreate (MPT → customer)", T, "The title leg to a wallet the issuer has not authorised. The token requires authorisation (RequireAuth).", "tecNO_AUTH"),
    ("engine", "— (state, not an error)", S, "The deal stops at step 4 as <b>refused</b>: the refusal card, the technical view with the hash. No money moved; only the fee.", ""),
    ("desk", "CredentialCreate", T, "<b>LiquidSettle.KYC</b> issued to the customer's wallet (XLS-70).", "tesSUCCESS"),
    ("customer", "CredentialAccept", T, "The customer accepts it: the credential is now on their account.", "tesSUCCESS"),
    ("desk", "MPTokenAuthorize (holder)", T, "The issuer reads the accepted credential and authorises the holder for the Au token.", "tesSUCCESS"),
    ("customer", "EscrowCreate × 2", T, "<b>Approve &amp; pay</b> again: both legs lock (the DvP above continues).", "tesSUCCESS"),
]
SCANS = [
    ("picked_up", "USPS took custody", "Delivery: releases the payment leg to the desk"),
    ("in_transit", "Moving through the network", "—"),
    ("out_for_delivery", "On the truck", "—"),
    ("delivered", "Signed for at the verified address", "Delivery: releases the title leg → settled"),
    ("vault_signed", "The vault signed for the parcel", "Store / store &amp; borrow: releases both legs (store → settled; loan → step 5)"),
    ("exception", "Damaged, held, returned", "Nothing releases; the refund date still protects both sides"),
]
STORE = [
    ("desk", "EscrowCreate × 2", T, "Buy &amp; store: the same two legs, the destination is the customer's vault position.", "tesSUCCESS"),
    ("vault · by hand", "Payment (memo)", T, "<b>Vault signed</b> — anchored (memo liquidsettle/vault).", "tesSUCCESS"),
    ("agent", "EscrowFinish × 2", T, "Both legs release at once; the bars are listed in the customer's name.", "tesSUCCESS"),
    ("agent", "EscrowCancel × 2", T, "<b>Refund</b> (LS-1037): nothing arrived by the refund date → both legs go back. Offered only after CancelAfter.", "tesSUCCESS"),
    ("customer", "— (ACH)", S, "<b>Bank transfer</b> (LS-1048): the price locks when it clears (1–3 days). Simulated and labelled.", ""),
]
LOAN = [
    ("customer", "EscrowCreate (LGAU)", D, "<b>The pledge.</b> 10,000 g into a token escrow, Account = Destination = the borrower.", "tesSUCCESS"),
    ("customer + lender", "LoanSet (two signatures)", D, "The loan with <b>CollateralID</b> = the pledge escrow; the borrower signs, the broker countersigns.", "tesSUCCESS"),
    ("ledger (probe)", "EscrowFinish", D, "The engine proves the lock: releasing the pledge while the loan is owed is refused.", "tecPLEDGED"),
    ("oracle", "OracleSet", T, "Au 100 → 80 per gram: the loan is re-measured, LTV 75 % → <b>top-up</b>.", "tesSUCCESS"),
    ("customer", "LoanPay (overpayment)", D, "<b>Ways out · pay down</b> 60,000: back under 70 %.", "tesSUCCESS"),
    ("customer", "EscrowCreate / Payment", D, "<b>Add Au</b> (a second pledge) or <b>buy more</b> (pay, then pledge).", "tesSUCCESS"),
    ("customer", "LoanPay (full)", D, "<b>Repay</b>: the loan is paid off.", "tesSUCCESS"),
    ("customer", "EscrowFinish", D, "The same release now succeeds: the pledge returns to the borrower.", "tesSUCCESS"),
]


def hashes() -> list[dict]:
    p = SE / "hashes.json"
    if not p.exists():
        return []
    try:
        doc = json.loads(p.read_text())
    except ValueError:
        return []
    return [x for x in doc.get("items", []) if x.get("hash")]


def legend_table() -> str:
    return '<table class="legend">' + "".join(f"<tr><td>{tag(k, t)}</td><td>{E(d)}</td></tr>" for k, t, d in LEGEND) + "</table>"


FOOT = f"LiquidSettle · ledger workflows · {DATE} · XRPL Commons Hackathon NYC"


def workflows() -> str:
    P = []
    P.append(f'''<section class="page dark"><div class="eyebrow">XRPL Commons Hackathon NYC · 24–25 Oct 2026</div>
      <div class="grid2" ><div><p class="big">Settle real assets.<br/><em>Pay only when the deal is done.</em></p>
      <p class="sub">LiquidSettle settles real assets on the XRP Ledger: two token escrows lock the money and the title,
      the real world (USPS, a vault) is anchored on the ledger, and each leg releases only on proof. Every step of every deal
      is a transaction or a labelled simulation. This document walks the five workflows, step by step.</p>
      </div>
      <div class="card"><h2>How to read the labels</h2>{legend_table()}</div></div>
      <div class="foot">{E(FOOT)}</div></section>''')
    P.append(page("What is in the repository", "Two apps on the XRP Ledger, and the amendment the loans run on.", f'''
      <table><tr><th>Part</th><th>Where</th><th>What it is</th></tr>
      <tr><td><b>LiquidSettle</b> (desk, deals, vault, money, activity, ways out, workflow console)</td><td class="mono">settle/</td><td>The six Figma frames, built and wired to the ledger.</td></tr>
      <tr><td><b>Deals API</b> (LiquidGate /api/lg/v1/deals…)</td><td class="mono">openapi/ · sdk/</td><td>The contract LiquidSettle speaks; the platform behind it stays private.</td></tr>
      <tr><td><b>LiquidLend</b> (the eleven beats of the gold case)</td><td class="mono">dashboard/</td><td>Pledge, loan, price, repay — prepare → sign → submit on one screen.</td></tr>
      <tr><td>CollateralLock (XLS-66 amendment) + own devnet {tag("demo", "DEMO")}</td><td class="mono">spec/ · docs/collateral-lock/</td><td>The loan workflow runs on it; its evidence and hash register are in docs/collateral-lock/.</td></tr>
      </table>
      <div class="grid2e"><div class="note mint"><b>Try it in one minute:</b> <span class="mono">scripts/serve.sh 8788 settle</span> → <span class="mono">http://localhost:8788/?mock=1</span>
      (sample data, labelled SAMPLE). Against a platform, the same screens run every step on the ledger.</div>
      <div class="note"><b>Honest scope:</b> LiquidSettle's transactions are built for the public XRPL Testnet; the hash register (p. 9) lists only hashes read back from a ledger.</div></div>''',
                  tags=[], n="02", foot=FOOT))
    P.append(page("A · Buy and deliver — delivery versus payment", "Two token escrows on the XRPL Testnet: the money and the title each wait for their own proof. Nobody can move either early; both refund after twelve days.",
                  f'<div class="grid2"><div>{steps_table(DVP)}</div><div>{img("settlement-engine/screens/05-with-usps.png", 470, "LS-1046 · with USPS (sample data)")}</div></div>',
                  tags=[("live", "XRPL TESTNET")], n="03", foot=FOOT))
    P.append(page("B · A refusal is a result: tecNO_AUTH → credential → pay", "The Au token requires authorisation. A wallet without the LiquidSettle credential is refused by the ledger itself — the engine records the refusal with its hash and offers the way through.",
                  f'<div class="grid2"><div>{steps_table(REFUSAL)}<div class="note">Not yet confirmed on the public Testnet from this build: that the token escrow to an unauthorised destination returns <b>tecNO_AUTH</b>. If the ledger accepts it, the deal proceeds and says so.</div></div>'
                  f'<div>{img("settlement-engine/screens/03-approve-pay-refused.png", 470, "LS-1045 · Approve &amp; pay, refused (sample data)")}</div></div>',
                  tags=[("live", "XRPL TESTNET")], n="04", foot=FOOT))
    scans = "".join(f'<tr><td class="mono">{c}</td><td>{w}</td><td>{r}</td></tr>' for c, w, r in SCANS)
    P.append(page("C · USPS by hand — every scan is a ledger entry", "We type the tracking scans ourselves (code · place · time). Each one is anchored by the logistics role as a memo Payment and drives the release rules. No call goes to the USPS API.",
                  f'<div class="grid2"><div><table><tr><th>Code</th><th>Meaning</th><th>What it releases</th></tr>{scans}</table>'
                  f'<div class="note mint">The anchor: <span class="mono">Payment</span> of 1 drop, logistics → desk, memo <span class="mono">liquidsettle/usps</span> {{deal, code, where, at, tracking}} — the timeline on the deal and the receipt carry its hash.</div></div>'
                  f'<div>{img("settlement-engine/screens/04-on-its-way.png", 470, "LS-1043 · Your Au is on its way (sample data)")}</div></div>',
                  tags=[("live", "XRPL TESTNET")], n="05", foot=FOOT))
    P.append(page("D · Store in the vault, refund, bank transfer", "The same escrows with another release rule: the vault's signature releases both legs. A refund needs nobody's consent after the date. A bank transfer is simulated and says so.",
                  f'<div class="grid2"><div>{steps_table(STORE)}</div><div>{img("settlement-engine/screens/09-vault.png", 470, "Vault (sample data)")}</div></div>',
                  tags=[("live", "XRPL TESTNET"), ("sim", "ACH SIMULATED")], n="06", foot=FOOT))
    P.append(page("E · Store and borrow — the loan workflow", "LiquidSettle's loan journey runs its ledger steps on our XLS-66 devnet with CollateralLock (DEMO): the pledged Au cannot leave while the loan is owed.",
                  f'<div class="grid2"><div>{steps_table(LOAN)}<div class="note">The devnet and the amendment are DEMO: not on any public network. Their evidence (patches, 7 cases / 687 checks, 23/23 two-validator agreement) is in <span class="mono">docs/collateral-lock/</span>.</div></div>'
                  f'<div>{img("settlement-engine/screens/06-loan-live.png", 470, "LS-1044 · the loan live (sample data)")}</div></div>',
                  tags=[("demo", "DEMO · network"), ("own", "OWN NODE")], n="07", foot=FOOT))
    P.append(page("The Au price moves — everything follows", "The AI price agent publishes OracleSet (XAU/USD). Drag the loan-health meter for a what-if: the rung, the ways out and the chart move; nothing is published until an operator says so.",
                  f'<div class="grid2"><div>{img("settlement-engine/screens/07-what-if-drag.png", 520, "What-if at 64.50 per gram: LTV 93 % · sale proposed — nothing published (sample data)")}</div>'
                  f'<div><div class="card"><h2>The ladder</h2><table><tr><th>LTV</th><th>Rung</th><th>What happens</th></tr>'
                  f'<tr><td class="mono">≤ 60 %</td><td>max</td><td>The most a new loan may be.</td></tr><tr><td class="mono">70 %</td><td>notify</td><td>The customer is told.</td></tr>'
                  f'<tr><td class="mono">75 %</td><td>top-up</td><td>Pick a way back under 70 %.</td></tr><tr><td class="mono">80 %</td><td>impair</td><td>The loan is flagged.</td></tr>'
                  f'<tr><td class="mono">85 %</td><td>sale</td><td>A sale is proposed — only with approval, can be partial.</td></tr></table></div>'
                  f'<div class="card"><h2>Ways back to safe</h2><ul class="tight"><li>Pay down — LoanPay (overpayment)</li><li>Add Au — a second pledge</li><li>Buy more — pay, then pledge</li><li>Repay in full — LoanPay, then the release</li></ul></div></div></div>',
                  tags=[("live", "ORACLESET · TESTNET")], n="08", foot=FOOT))
    hs = hashes()
    if hs:
        rows = "".join(f'<tr><td class="mono">{E(str(x.get("ref") or "desk"))}</td><td class="mono">{E(x.get("tx_type") or "")}</td><td>{res(x.get("result") or "")}</td>'
                       f'<td>{tag("live" if x.get("network") == "testnet" else "own", x.get("network_label") or x.get("network") or "")}</td><td class="mono">{E(x["hash"])}</td></tr>' for x in hs[:24])
        body = f'<table><tr><th>Deal</th><th>Type</th><th>Result</th><th>Ledger</th><th>Hash (full)</th></tr>{rows}</table>'
        if len(hs) > 24:
            body += f'<div class="note">{len(hs) - 24} more in docs/settlement-engine/hashes.json.</div>'
    else:
        body = ('<div class="card"><h2>Pending — no LiquidSettle hash is printed until it is read from a ledger</h2>'
                '<p>LiquidSettle was built and tested this weekend against an in-memory ledger; its sample data is labelled SAMPLE and links to no explorer. '
                'To fill this page: on a platform, press <b>W</b> → <b>Make the demo workspace</b> (about ten minutes of real Testnet and devnet transactions), then '
                '<span class="mono">python3 docs/build/export_hashes.py https://&lt;platform&gt;/api/lg/v1 &lt;session token&gt;</span> and rebuild this PDF.</p></div>'
                '<div class="note">The hash register that exists today is CollateralLock\'s (DEMO): source, test logs, own-node run and the two-validator crosscheck — '
                '<span class="mono">docs/collateral-lock/CollateralLock_Evidence_and_Hashes.pdf</span>, pages 3, 8, 9, 11, 14 and 15.</div>')
    P.append(page("Hash register · LiquidSettle", "Every row was read back from a ledger by export_hashes.py: Testnet rows open on any Testnet explorer; own-node rows exist only on our devnet (DEMO).", body,
                  tags=[], n="09", foot=FOOT))
    P.append(page("From the Figma frames to the engine", "The six frames were mapped one to one: the desk, the New deal modal, Approve &amp; pay refused, on its way, the live loan, ways out.",
                  f'<div class="grid2e"><div>{img("settlement-engine/design/03-approve-pay-refused.png", 250, "Figma · Approve &amp; pay")}{img("settlement-engine/design/05-loan-live.png", 250, "Figma · Loan live")}</div>'
                  f'<div>{img("settlement-engine/screens/03-approve-pay-refused.png", 250, "Engine · Approve &amp; pay")}{img("settlement-engine/screens/06-loan-live.png", 250, "Engine · Loan live")}</div></div>',
                  tags=[], n="10", foot=FOOT))
    P.append(page("What is real, what is simulated, what is not yet verified", "Said plainly, as on every screen.", f'''
      <div class="grid3"><div class="card"><h2>{tag("live", "On the ledger")}</h2><ul class="tight"><li>Both escrow legs, their finish and cancel</li><li>KYC credential: create, accept, authorise</li><li>Every USPS and vault scan (anchor)</li><li>The Au price (OracleSet)</li><li>Loan: pledge, LoanSet, probe, LoanPay, release — on our devnet (DEMO)</li></ul></div>
      <div class="card"><h2>{tag("sim", "Simulated, labelled")}</h2><ul class="tight"><li>ACH and card payments</li><li>USPS itself: scans are typed in by the desk</li><li>RL USD is the desk's own demo issuer on a test network</li><li>The repository's sample data (SAMPLE)</li></ul></div>
      <div class="card"><h2>{tag("demo", "Not yet verified")}</h2><ul class="tight"><li>tecNO_AUTH for a token escrow to an unauthorised wallet on the public Testnet</li><li>An RL USD vault on the devnet (falls back to XRP)</li><li>The LoanPay flags on our devnet build</li><li>The settlement-engine hash register (p. 9)</li></ul></div></div>
      <div class="note mint">Security: no seed, key or node URL is in this repository; the platform signs with custody-vault keys and refuses mainnet outside production. <span class="mono">scripts/check.py</span> enforces it on every push.</div>''',
                  tags=[], n="11", foot=FOOT))
    return "".join(P)


# ── the test report ────────────────────────────────────────────────────────────────────────────────────────────────
TESTS = json.loads((Path(__file__).resolve().parent / "test_results.json").read_text())


def test_report() -> str:
    t = TESTS
    F = f"LiquidSettle · test report · {DATE}"
    P = []
    P.append(f'''<section class="page dark"><div class="eyebrow">LiquidSettle · test report</div>
      <p class="big">Tested before it <em>touches a ledger.</em></p>
      <p class="sub">The platform's offline suite (an in-memory XRPL), the public repository's own checks, and a visual pass over every screen.
      What could not be tested from the build environment is listed on the last page.</p>
      <div class="grid3"><div class="card stat"><b>{E(t["suite"]["passed"])} passed</b><span>{E(t["suite"]["note"])}</span></div>
      <div class="card stat"><b>{E(t["focused"]["summary"])}</b><span>the deals engine, LiquidSettle, LiquidGate and the migration chain</span></div>
      <div class="card stat"><b>{E(t["public"]["check"])}</b><span>{E(t["public"]["node"])}</span></div></div>
      <div class="foot">{E(F)}</div></section>''')
    for group in t["focused"]["groups"]:
        rows = "".join(f'<tr><td class="mono">{E(n)}</td><td>{'<span class="res ok">PASSED</span>' if s == "PASSED" else tag("sample", s)}</td><td>{E(w)}</td></tr>' for n, s, w in group["tests"])
        P.append(page(group["title"], group["sub"], f'<table><tr><th>Test</th><th>Result</th><th>What it proves</th></tr>{rows}</table>',
                      tags=[], n="", foot=F))
    shots = t["visual"]["shots"]
    cells = "".join(f'<div>{img("settlement-engine/screens/" + s + ".png", 140, E(s))}</div>' for s in shots[:12])
    P.append(page("Visual pass", E(t["visual"]["sub"]), f'<div class="grid4">{cells}</div>', tags=[("sample", "SAMPLE DATA")], foot=F))
    P.append(page("Not covered here", "What the build environment could not test, and where CollateralLock (DEMO) is tested.", f'''
      <div class="grid2e"><div class="card"><h2>Not covered (LiquidSettle)</h2><ul class="tight">{"".join(f"<li>{E(x)}</li>" for x in t["gaps"])}</ul></div>
      <div class="card"><h2>{tag("demo", "DEMO")} CollateralLock — the team's own test logs</h2><table>
      {"".join(f'<tr><td>{E(a)}</td><td class="mono">{E(b)}</td></tr>' for a, b in t["collateral_lock"])}</table>
      <div class="cap">From docs/collateral-lock/CollateralLock_Evidence_and_Hashes.pdf, page 8 (run on the branch build collateral-lock @ 5df6bfbc9).</div></div></div>''',
                  tags=[("demo", "DEMO")], foot=F))
    return "".join(P)


def render(name: str, body: str, pdf: Path) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    css = CSS.replace("FONTS/", (FONTS.as_uri() + "/"))
    doc = f'<!doctype html><html><head><meta charset="utf-8"><title>{E(name)}</title><style>{css}</style></head><body>{body}</body></html>'
    src = OUT / f"{pdf.stem}.html"
    src.write_text(doc.replace('src="../../', f'src="{DOCS.as_uri()}/'))
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1200, "height": 750})
        pg.goto(src.as_uri())
        pg.wait_for_timeout(600)
        pg.pdf(path=str(pdf), width="1200px", height="750px", print_background=True)
        b.close()
    print(f"wrote {pdf.relative_to(DOCS.parent)}")


def main() -> int:
    render("LiquidSettle · ledger workflows", workflows(), SE / "LiquidSettle_Ledger_Workflows.pdf")
    render("LiquidSettle · test report", test_report(), SE / "LiquidSettle_Test_Report.pdf")
    return 0


if __name__ == "__main__":
    sys.exit(main())
