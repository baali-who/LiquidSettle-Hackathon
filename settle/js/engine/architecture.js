/**
 * Architecture — how LiquidSettle is built, the modules, the flow, and our amendment next to the upstream
 * XLS-66 it extends (where they are the same, and where they are not). Usable live in a demo: the desks' real
 * addresses and objects on both networks come from the platform.
 */
import { h, I, pill, stamp, tile, short, mark } from "./kit.js";
import { markup } from "../ui.js";
import { frame } from "./shell.js";

export const name = "architecture";
export const title = () => "Architecture";

const SVGNS = "http://www.w3.org/2000/svg";
function diagram() {
  const el = document.createElementNS(SVGNS, "svg");
  el.setAttribute("viewBox", "0 0 1200 492");
  el.setAttribute("class", "es-diagram");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", "People use LiquidSettle; LiquidGate and the deals engine sign with custody-vault keys on two ledgers: the XRPL Testnet for purchases and our XLS-66 Collateral Lending devnet for loans.");
  const box = (x, y, w, hh, cls, title, lines = [], tag = "") => `
    <g class="dg ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="14"/>
    <text x="${x + 16}" y="${y + 28}" class="dg-t">${title}</text>${tag ? `<text x="${x + w - 14}" y="${y + 28}" class="dg-tag" text-anchor="end">${tag}</text>` : ""}
    ${lines.map((l, i) => `<text x="${x + 16}" y="${y + 52 + i * 19}" class="dg-l">${l.replace("{RL}", '<tspan class="dg-rl">RL</tspan>USD')}</text>`).join("")}</g>`;
  const arrow = (x1, y1, x2, y2, label = "", cls = "") => `<g class="dg-a ${cls}"><path d="M${x1},${y1} L${x2},${y2}" marker-end="url(#dg-head)"/>${label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle" class="dg-al">${label}</text>` : ""}</g>`;
  markup(el, `<defs><marker id="dg-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="dg-head"/></marker></defs>
  ${box(20, 20, 250, 92, "people", "Customer", ["Approves in the app; signs with", "the settlement wallet (custody vault)"])}
  ${box(20, 128, 250, 92, "people", "Provider desk · USRCX", ["Confirms bars, packs and seals,", "types in the USPS scans"])}
  ${box(20, 236, 250, 92, "people", "USPS · partner vault", ["Scans and the vault's signature —", "anchored on the ledger"])}
  ${box(20, 344, 250, 104, "people", "Validators", ["PC (Harry) · MacBook (Alexander)", "+ anyone: node.sh / node.ps1", "status: netcheck.py"])}
  ${box(330, 20, 400, 108, "platform", "LiquidSettle · /settle/", ["Home · Deals · Vault · Money · Activity", "the six steps · the ways out · the workflow", "ES modules, CSP-clean, self-hosted fonts"], "UI")}
  ${box(330, 148, 400, 92, "platform", "LiquidGate · /api/lg/v1/deals", ["session tokens, scopes (read · operator)", "idempotency keys · one line per call"], "API")}
  ${box(330, 260, 190, 188, "platform", "Deals engine", ["engine · kit", "price · views", "seed", "one action =", "real transactions", "in a worker"], "")}
  ${box(540, 260, 190, 88, "agent", "Settlement agent", ["holds the fulfillments", "(sealed) · Finish · Cancel"])}
  ${box(540, 360, 190, 88, "agent", "AI price agent", ["XAU/USD → OracleSet", "the ladder re-measured"])}
  ${box(790, 20, 390, 196, "ledger", "XRPL Testnet · purchases", ["Credentials (XLS-70) · KYC", "Permissioned domain (XLS-80)", "gAu — MPT, auth required (XLS-33)", "Token escrow, {RL} + gAu (XLS-85)", "Price oracle (XLS-47) · memo anchors", "explorer: testnet.xrpl.org"], "PUBLIC")}
  ${box(790, 236, 390, 212, "own", "XLS-66 devnet · loans (network 424)", ["Vault (XLS-65) · loan broker (XLS-66)", "LGAU — MPT, can escrow", "LoanSet + CollateralID → the pledge", "EscrowFinish → tecPLEDGED", "LoanPay · payoff → released", "explorer: /devnet/ on the platform"], "OWN NODE")}
  ${arrow(270, 66, 330, 66, "")}${arrow(270, 174, 330, 190, "")}${arrow(270, 282, 330, 300, "")}
  ${arrow(530, 128, 530, 148)}${arrow(530, 240, 530, 260)}
  ${arrow(730, 300, 790, 150)}${arrow(730, 320, 790, 330)}
  <text x="760" y="248" text-anchor="middle" class="dg-al">sign · submit</text>
  <g class="dg-a dashed"><path d="M145,448 L145,474 L985,474 L985,452" marker-end="url(#dg-head)"/><text x="565" y="488" text-anchor="middle" class="dg-al">the validators run the network the loans settle on</text></g>`);
  return el;
}

const MODULES = [
  [I.layers, "green", "LiquidSettle", "hackathon/settle/ · js/engine/", "The desk, the deals and every step's screen, the ways out with the result before you approve, the vault, the money, the activity, the workflow console. Framework-free ES modules under the platform's strict CSP; the same bytes run standalone on sample data.",
    ["Interactive loan health: tap the bar for any Au price", "Polls a running step until the ledger answers", "Light and dark, 1440 px down to a phone"]],
  [I.node, "blue", "LiquidGate", "blueprints/liquidgate/deals_api.py", "The API the engine (and any team's code) talks to. A one-hour session token minted by the platform page; scopes decide who runs what: the desk runs every step, a customer only their own.",
    ["GET /deals/home · /deals/<ref> · activity · vault · money", "POST /deals · /deals/<ref>/actions/<action>", "POST /deals/price · /deals/seed"]],
  [I.flow, "purple", "Deals engine", "services/deals/", "One action moves a deal one step with real transactions, in a worker thread, idempotent part by part — a stopped step is simply run again. Every step writes an event: who, what for, the transaction, its hash, the result it got and the one it expected.",
    ["engine.py · the actions", "kit.py · the desks per network", "views.py · the documents", "seed.py · the demo workspace"]],
  [I.shield, "green", "Custody", "signing.VaultKey · custody vault", "Every key — the desk's roles and each customer's settlement wallet — lives in the custody vault (AWS Secrets Manager in production) and is read just in time. The custody gate runs first; these keys never sign on mainnet. The database holds references, never a seed.",
    ["Fulfillments sealed with the treasury key", "Addresses and object ids are public; references are not"]],
  [I.lock, "purple", "Settlement agent", "engine._dvp · _finish · refund", "Delivery versus payment in two token escrows with PREIMAGE-SHA-256 conditions: the gold leg to the customer, the {RL} leg to the desk. The agent holds the fulfillments and submits EscrowFinish when the proof arrives; after the refund date anyone may cancel — the agent does.",
    ["Deliver: USPS acceptance pays the seller; the signature moves the gold", "Store: the vault's signature releases both"]],
  [I.chart, "gold", "AI price agent", "engine.publish_price · price.py", "Publishes XAU/USD with OracleSet on the XRPL Testnet — the market's price, or a demo price the desk sets, always labelled. Every open loan is measured again: 70 we tell you · 75 top-up · 80 at risk · 85 sale (only with approval).",
    ["Price lock: two minutes from the oracle", "The history draws the chart"]],
  [I.truck, "blue", "Logistics anchors", "engine.ship · engine.scan", "No USPS API: the desk types in the tracking number and each scan. Each one becomes a 1-drop memo Payment from the carrier's account (the vault's own account for its signature) — public, timestamped, checkable.",
    ["Packed and sealed · picked up · in transit", "Delivered or signed for at the vault"]],
  [I.check, "green", "Identity", "KYC desk → CredentialCreate", "The KYC desk approves; the issuer writes the LiquidSettle.KYC credential, the customer accepts it, the issuer reads it and only then authorises the wallet for gAu. Without it the ledger refuses the gold: tecNO_AUTH — no money moves.",
    ["Permissioned domain lists the accepted credential", "No personal data on the ledger"]],
  [I.coins, "purple", "Lending", "engine.loan_open · paydown · repay", "On our devnet: the lender's XLS-65 vault and XLS-66 loan broker with first-loss cover. The borrower escrows LGAU (Account = Destination = borrower), LoanSet names it in CollateralID, the borrower signs and the lender countersigns.",
    ["Early release → tecPLEDGED (the proof)", "LoanPay (overpayment) · full payoff → released"]],
  [I.node, "gold", "The devnet", "xrpld/ · node.sh · node.ps1 · netcheck.py", "xrpld 3.4.1 with the CollateralLock branch, network 424. Two validators today (Harry's PC, Alexander's MacBook); anyone can add a node with one script, and netcheck.py shows the whole network at a glance.",
    ["Admin RPC never leaves the container", "Seeds stay on each node; only public keys travel"]],
];

const COMPARE = [
  ["What secures a loan", "Nothing on the ledger: the broker's first-loss cover and off-ledger agreements.", "A token escrow, pledged by the loan. The ledger holds it until the loan is paid off.", true],
  ["LoanSet", "LoanBrokerID, Counterparty (countersigns), PrincipalRequested, rates, PaymentTotal · PaymentInterval · GracePeriod.", "The same, plus <code>CollateralID</code> (Hash256, field 43 — the codec learns it from the node's server_definitions).", true],
  ["An escrow during the loan", "Independent of any loan: its owner can finish or cancel it.", "Pledged: EscrowFinish and EscrowCancel answer <code>tecPLEDGED</code> while payments remain or the loan is in default.", true],
  ["Repayment", "LoanPay — periodic, overpayment (if the loan allows it), full early payment.", "The same. When nothing remains, the pledge lifts and the escrow finishes to its destination.", false],
  ["Default", "LoanManage(tfLoanDefault): the first-loss cover absorbs what it can; the vault takes the rest.", "The same, and the pledged asset is swept to the broker's owner; the escrow is deleted. The broker must be allowed to hold it (<code>tecNO_AUTH</code> otherwise).", true],
  ["What can be pledged", "—", "A token escrow (IOU or MPT) whose Account and Destination are the borrower, not pledged yet, with CancelAfter after the maturity. An XRP escrow: <code>tecWRONG_ASSET</code>; already pledged: <code>tecDUPLICATE</code>; too early: <code>tecTOO_SOON</code>.", true],
  ["Valuing the collateral (LTV)", "Off the ledger, by design.", "Off the ledger too: the AI price agent's OracleSet and the platform's ladder (60 · 70 · 75 · 80 · 85). The ledger enforces custody and seizure, not price.", false],
  ["Safety net", "The lending invariants.", "Plus <code>ValidCollateralLock</code>: the loan and its escrow reference each other, write-once, while the loan is open.", true],
  ["Where it runs", "rippled — the LendingProtocol amendment; on mainnet only after the validators' vote.", "Our devnet: xrpld 3.4.1 + the collateral-lock branch (5df6bfbc9), network 424, our validators. A draft, not mainnet.", true],
  ["Names: design → shipped", "—", "The XLS-66c design said featureLendingCollateral · CollateralEscrowID · tecNO_PERMISSION; the branch ships <code>CollateralLock</code> · <code>CollateralID</code> · <code>tecPLEDGED</code>. LiquidGate and the engine use the shipped names.", true],
];

const FLOW = [
  ["1", "Sale created", "note"], ["2", "Provider confirmed", "Payment gAu · issuer → desk · memo: serials"], ["3", "Terms agreed", "price lock · OracleSet read"],
  ["4", "Approve & pay", "EscrowCreate gAu → customer · EscrowCreate {RL} → desk (refused: tecNO_AUTH)"], ["5", "Delivering", "memo Payment per scan · EscrowFinish {RL} at acceptance"],
  ["6", "Delivered / in vault", "EscrowFinish gAu · or both at the vault's signature"],
];
const FLOW_LOAN = [
  ["1–3", "Created · confirmed · agreed", "as a purchase, on the devnet"], ["4", "Gold delivered", "scans · the vault signs"], ["5", "Paid", "both escrows, released at once"],
  ["6", "Loan live", "EscrowCreate LGAU (the pledge) · LoanSet + CollateralID · EscrowFinish → tecPLEDGED"], ["…", "Ways out", "LoanPay · EscrowCreate (more Au)"], ["end", "Repaid", "LoanPay full · EscrowFinish → tesSUCCESS"],
];

export async function render(ctx) {
  let desks = null;
  try { desks = (await ctx.deals.money()).desks; } catch (e) { desks = null; }
  const cmp = h("table", { class: "es-cmp" }, h("thead", {}, h("tr", {}, h("th", {}, ""), h("th", {}, "Upstream XLS-66 (Lending Protocol)"), h("th", {}, "Ours: XLS-66 + CollateralLock"))),
    h("tbody", {}, COMPARE.map(([k, up, ours, diff]) => h("tr", {}, h("td", {}, k), h("td", { html: up }), h("td", { class: diff ? "diff" : "", html: ours })))));
  const flow = (rows) => h("div", { class: "es-flow" }, rows.map(([n, t, s]) => h("div", {}, h("span", { class: "n" }, `STEP ${n}`), h("b", {}, t), h("small", {}, mark(s)))));
  const live = (net, label) => {
    const d = desks && desks[net];
    if (!d || !Object.keys(d.roles || {}).length) return h("div", { class: "es-card es-mod" }, h("div", { class: "es-mod-h" }, tile(I.node, net === "testnet" ? "blue" : "purple", "sm"), h("div", {}, h("b", {}, label), h("small", {}, "built with the first deal"))));
    return h("div", { class: "es-card es-mod" }, h("div", { class: "es-mod-h" }, tile(I.node, net === "testnet" ? "blue" : "purple", "sm"), h("div", {}, h("b", {}, label), h("small", {}, d.built_at ? "since " + d.built_at.slice(0, 10) : ""))),
      h("dl", { class: "es-rows tight" }, Object.entries(d.roles).map(([k, r]) => h("div", {}, h("dt", {}, r.label), h("dd", { class: "es-addr" }, short(r.address, 6, 5))))));
  };
  return frame(ctx, "", h("div", { class: "es-wrap" },
    h("div", { class: "es-pagehead" }, h("div", {}, h("h1", {}, "Architecture"), h("p", {}, "How LiquidSettle is built — the modules, the six steps with their transactions, and our amendment next to the XLS-66 it extends.")),
      h("div", { class: "es-actions" }, pill("NO CUSTOM SMART CONTRACTS", "ok"), pill("COLLATERALLOCK · OWN NODE", "own"))),
    h("section", { class: "es-arch-hero" }, h("h2", {}, "Native XRPL features only. Two ledgers, one engine, every step a hash."),
      h("p", {}, "Purchases settle on the public XRPL Testnet with credentials, a permissioned domain, an MPT for the gold and token escrows for delivery versus payment. Loans run on our own network — the XLS-66 Collateral Lending devnet — where our amendment, CollateralLock, makes the ledger itself hold the collateral until the loan is paid off."),
      diagram()),
    h("h2", { class: "es-h3 es-gap" }, "The modules"),
    h("div", { class: "es-grid3" }, MODULES.map(([ic, tone, t, path, p, li]) => h("div", { class: "es-card es-mod" }, h("div", { class: "es-mod-h" }, tile(ic, tone, "sm"), h("div", {}, h("b", {}, t), h("small", {}, path))),
      h("p", {}, mark(p)), h("ul", {}, li.map((x) => h("li", {}, mark(x))))))),
    h("section", { class: "es-card pad es-gap" }, h("div", { class: "es-card-h" }, h("h2", {}, "A purchase · XRPL Testnet"), pill("LIVE", "ok")), flow(FLOW)),
    h("section", { class: "es-card pad es-gap" }, h("div", { class: "es-card-h" }, h("h2", {}, "A loan · XLS-66 devnet"), pill("OWN NODE", "own")), flow(FLOW_LOAN)),
    h("section", { class: "es-card pad es-gap" }, h("div", { class: "es-card-h" }, h("h2", {}, "The amendment: CollateralLock"), h("div", { class: "es-actions" }, stamp("tecPLEDGED"), stamp("tesSUCCESS"))),
      h("p", { class: "es-muted" }, "XLS-66 lends from a vault through a broker, and by design it does not tie a loan to collateral. CollateralLock does: a borrower pledges a token escrow by naming it in LoanSet; while the loan is open the ledger refuses to release it; on payoff the pledge lifts; on default the asset goes to the lender. Four rules, one new field, one new result code, one invariant."),
      h("div", { class: "es-grid2 es-gap" },
        h("div", { class: "es-card es-mod" }, h("div", { class: "es-mod-h" }, tile(I.link, "purple", "sm"), h("div", {}, h("b", {}, "1 · Pledge"), h("small", {}, "LoanSet · CollateralID"))), h("p", {}, "The escrow must be a token escrow whose Account and Destination are the borrower, not pledged yet, CancelAfter after the maturity. The ledger writes the escrow's LoanID.")),
        h("div", { class: "es-card es-mod" }, h("div", { class: "es-mod-h" }, tile(I.lock, "purple", "sm"), h("div", {}, h("b", {}, "2 · Hold"), h("small", {}, "EscrowFinish · EscrowCancel"))), h("p", {}, "While payments remain (or in default) both answer tecPLEDGED — recorded with its hash on every loan this engine opens.")),
        h("div", { class: "es-card es-mod" }, h("div", { class: "es-mod-h" }, tile(I.unlock, "green", "sm"), h("div", {}, h("b", {}, "3 · Release"), h("small", {}, "LoanPay → EscrowFinish"))), h("p", {}, "When nothing remains, the escrow behaves like any other: it finishes to the borrower — tesSUCCESS.")),
        h("div", { class: "es-card es-mod" }, h("div", { class: "es-mod-h" }, tile(I.warn, "amber", "sm"), h("div", {}, h("b", {}, "4 · Seize"), h("small", {}, "LoanManage · tfLoanDefault"))), h("p", {}, "On default the pledged asset is swept to the broker's owner and the escrow is deleted. Invariant: ValidCollateralLock.")))),
    h("section", { class: "es-card pad es-gap" }, h("div", { class: "es-card-h" }, h("h2", {}, "Two work streams: upstream XLS-66 and ours"), h("span", { class: "es-muted" }, "Purple: where they are not the same")), cmp),
    h("section", { class: "es-card pad es-gap" }, h("div", { class: "es-card-h" }, h("h2", {}, "What runs where"), h("span", {})),
      h("table", { class: "es-cmp" }, h("thead", {}, h("tr", {}, h("th", {}, ""), h("th", {}, "XRPL Testnet"), h("th", {}, "XLS-66 devnet (own node)"))),
        h("tbody", {}, [["Credentials (XLS-70) · domain (XLS-80)", "Yes — the KYC credential and the domain", "Not enabled — KYC stays on the platform"], ["Au token", "gAu · authorisation required", "LGAU · can escrow"],
          ["Token escrow (XLS-85)", "Delivery versus payment", "The pledge and the purchase"], ["Price oracle (XLS-47)", "The AI price agent publishes here", "Not enabled — loans read the testnet price"],
          ["Lending (XLS-65 / XLS-66)", "—", "The lender's vault, the broker, the loans"], ["CollateralLock", "—", "Yes · network 424"], ["Explorer", "testnet.xrpl.org", "/devnet/ on the platform"]]
          .map(([a, b, c]) => h("tr", {}, h("td", {}, a), h("td", {}, b), h("td", {}, c)))))),
    h("h2", { class: "es-h3 es-gap" }, "Live on this platform"),
    h("div", { class: "es-grid2" }, live("testnet", "The desk on the XRPL Testnet"), live("xls66-devnet", "The desk on the XLS-66 devnet")),
    h("p", { class: "es-muted es-gap" }, "The full write-up is in the repository: docs/ARCHITECTURE_SETTLEMENT.md · docs/XLS66_DEVNET.md · hackathon/spec/XLS-66c.md.")));
}
