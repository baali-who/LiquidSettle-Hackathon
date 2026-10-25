/**
 * One deal, whatever step it is at (Figma: "Approve & pay — refused", "Your gold is on its way", "Loan live — the price
 * moved"). The header and the six-step stepper; then the view of the step:
 *
 *   confirm     the bars to allocate · the provider confirms (gAu minted to the desk's inventory)
 *   terms       the oracle price · how to pay · (a loan: how much to borrow) · the customer agrees
 *   pay         YOU PAY · before money moves · how to pay · the refusal (tecNO_AUTH) and its technical view
 *   delivering  nothing for you to do · the shipment, scan by scan, each anchored · the escrow · in the parcel
 *   loan        the dark band · where this deal is (simple / technical) · loan health (tap the bar: what if Au
 *               were at another price?) · the Au price · what happened so far · the position · locked to the loan
 *   settled · refunded   the receipt: every hash
 *
 * A step runs on the server (runAction); while it runs the page follows it and the stepper spins.
 */
import { h, I, btn, busy as busyBtn, money, inlineMoney, n0, n2, pct, pill, stamp, tile, stepper, meter, chart, toast, overlay, poll, short, time, first, rl, rlt, put, mark } from "./kit.js";
import { frame } from "./shell.js";
import { runAction, follow, LABEL } from "./run.js";

export const name = "deal";
export const title = (p) => p.id;

const RUNG_TEXT = {
  safe: ["Safe", "The loan is within its limit."],
  notify: ["Watch", "We tell the customer; nothing else happens."],
  topup: ["top-up suggested", "Pick one way back under 70%. Nothing moves until {c} approves."],
  impair: ["at risk", "The loan is flagged at risk. A way back under 70% clears it."],
  sale: ["sale proposed", "A sale is proposed — only with {c}'s approval, and it can be partial."],
};
const RUNG_PILL = { safe: ["ok", "SAFE"], notify: ["info", "WATCH"], topup: ["warn", "TOP-UP"], impair: ["bad", "AT RISK"], sale: ["bad", "SALE PROPOSED"] };
function rungOf(ltv) { return ltv >= 85 ? "sale" : ltv >= 80 ? "impair" : ltv >= 75 ? "topup" : ltv >= 70 ? "notify" : "safe"; }

function act(d, key) { return (d.actions || []).find((a) => a.key === key && a.allowed); }

/** A button that runs one of the deal's actions (when this person may), then re-renders. */
function actBtn(ctx, d, key, label, { kind = "mint", body = () => ({}), icon = null, iconRight = I.arrow, size = "" } = {}) {
  const a = act(d, key);
  if (!a) return null;
  const b = btn(label || a.label, { kind, icon, iconRight, size, attrs: { "data-action": key, disabled: d.busy ? true : null } });
  b.addEventListener("click", () => busyBtn(b, async () => { await runAction(ctx, d.ref, key, body()); ctx.rerender(); }));
  return b;
}

// ── the header ─────────────────────────────────────────────────────────────────────
function head(ctx, d, { right = null, crumb = null } = {}) {
  return h("section", { class: "es-head" }, h("div", { class: "es-wrap es-head-in" },
    h("div", { class: "es-head-top" }, h("div", {},
      crumb || h("div", { class: "es-crumb" }, d.headline.eyebrow),
      h("h1", {}, d.headline.title)), right),
    stepper(d.steps, { running: !!d.busy })));
}

function runningNotice(d) {
  if (d.busy) {
    return h("div", { class: "es-busy", role: "status" }, `Running · ${LABEL[d.busy.action] || d.busy.action} — the ledger validates each transaction in 3–5 seconds. This page follows it.`);
  }
  if (d.error) return h("div", { class: "es-err", role: "alert" }, h("b", {}, "The last step stopped. "), d.error, " — run it again; whatever already succeeded is skipped.");
  return null;
}

// ── what happened so far ───────────────────────────────────────────────────────────
function activityCard(d, { limit = 0, technical = false } = {}) {
  const ledgerFirst = limit && !technical ? [...d.activity.filter((a) => a.hash), ...d.activity.filter((a) => !a.hash)] : d.activity;
  const rows = limit ? ledgerFirst.slice(0, limit) : d.activity;
  const list = h("div", { class: "es-act-list" }, rows.map((a) => h("div", { class: "es-act" },
    h("span", {}, pill(a.pill, null)),
    h("div", {}, h("b", {}, a.tx_type || (a.actor === "customer" ? first(d.customer.name) : a.actor === "agent" ? "Agent" : "Desk")), h("span", { class: "d" }, mark(a.title)),
      technical && a.sentence ? h("div", { class: "es-muted" }, mark(a.sentence)) : null,
      a.hash ? h("small", {}, `${a.hash.slice(0, 8)}… · ${a.network === "xls66-devnet" ? "own node" : time.hm(a.at)}${technical && a.ledger_index ? " · ledger " + a.ledger_index : ""} · `,
        a.url ? h("a", { href: a.url, target: a.url.startsWith("http") ? "_blank" : null, rel: "noopener" }, "explorer ↗") : "")
        : h("small", {}, `${time.dayTime(a.at)}${a.pill === "SIMULATED" ? " · off the ledger (simulated)" : " · off the ledger"}`)),
    a.result ? stamp(a.result) : h("span"))));
  const more = limit && d.activity.length > limit ? btn(`Show all ${d.activity.length}`, { kind: "link", onclick: () => { list.replaceWith(activityCard(d, { technical }).querySelector(".es-act-list")); more.remove(); } }) : null;
  return h("section", { class: "es-card pad", "aria-label": "What happened so far" },
    h("div", { class: "es-card-h" }, h("h2", {}, "What happened so far"), h("div", { class: "es-actions" },
      d.counts.live ? pill(`${d.counts.live} LIVE`, "ok", { size: "sm" }) : null, d.counts.refused ? pill(`${d.counts.refused} REFUSED`, "bad", { size: "sm" }) : null,
      d.counts.own_node ? pill(`${d.counts.own_node} OWN NODE`, "own", { size: "sm" }) : null)),
    list, more);
}

// ── the bar passport ───────────────────────────────────────────────────────────────
function passport(d) {
  const chain = d.activity.slice().reverse().filter((a) => /confirmed|Packed|Picked|transit|Out for|Delivered|Signed|released to|locked for/i.test(a.title));
  const panel = h("div", { class: "es-modal", role: "dialog", "aria-modal": "true", "aria-label": "Bar passport" },
    h("div", { class: "es-modal-h" }, h("div", {}, h("h2", {}, "Bar passport"), h("p", {}, `${d.bars.length} bar${d.bars.length === 1 ? "" : "s"} · ${n0(d.grams)} g · owner ${d.customer.name}`)),
      h("button", { type: "button", class: "es-iconbtn", "aria-label": "Close", onclick: () => close() }, I.x({ size: 18 }))),
    h("div", { class: "es-modal-b" },
      h("div", { class: "es-modal-sec" }, h("div", { class: "es-eyebrow" }, "The bars"),
        h("dl", { class: "es-rows tight" }, d.bars.slice(0, 12).map((b) => h("div", {}, h("dt", {}, `${b.serial} · ${b.refiner}`), h("dd", {}, `${n0(b.grams)} g · ${b.fineness}`))),
          d.bars.length > 12 ? h("div", {}, h("dt", {}, `+ ${d.bars.length - 12} more`), h("dd", {}, "")) : null)),
      h("div", { class: "es-modal-sec" }, h("div", { class: "es-eyebrow" }, "Chain of custody · every link on the ledger"),
        h("div", { class: "es-timeline" }, chain.map((a) => h("div", { class: "es-ev done" }, h("span", { class: "es-ev-dot" }, I.check({ size: 13 })),
          h("div", {}, h("b", {}, mark(a.title)), h("small", {}, [a.tx_type, a.network === "xls66-devnet" ? "own node" : "XRPL Testnet"].filter(Boolean).join(" · "))),
          h("span", { class: "es-ev-r" }, time.dayTime(a.at), a.url ? h("a", { href: a.url, target: a.url.startsWith("http") ? "_blank" : null, rel: "noopener" }, "↗") : null))))),
      h("div", { class: "es-modal-sec" }, h("p", { class: "es-muted" }, d.network === "xls66-devnet"
        ? "The token is LGAU — one per gram, issued on our XLS-66 devnet; the bars' serials are in the memos."
        : "The token is gAu — an MPT (XLS-33), one per gram, authorisation required: it only reaches wallets holding the LiquidSettle credential. The serials are in the memos."))));
  const close = overlay(panel);
}

// ── confirm and terms ──────────────────────────────────────────────────────────────
function summaryCard(d, { amountLabel = "Estimated at today's price" } = {}) {
  return h("section", { class: "es-card pad", "aria-label": "The deal" },
    h("div", { class: "es-eyebrow" }, d.kind === "loan" ? "The deal · buy, store and borrow" : "The deal"),
    h("div", { class: "es-big" }, money(d.amount, { dec: 2 })), h("div", { class: "es-muted" }, amountLabel),
    h("dl", { class: "es-rows", }, h("div", {}, h("dt", {}, "Customer"), h("dd", {}, d.customer.name)),
      h("div", {}, h("dt", {}, "Asset"), h("dd", {}, `${d.quantity} × ${d.product} · ${n0(d.grams)} g Au`)),
      h("div", {}, h("dt", {}, "Where it goes"), h("dd", {}, d.delivery.label)),
      h("div", {}, h("dt", {}, "Network"), h("dd", {}, d.network_label)),
      h("div", {}, h("dt", {}, "Identity"), h("dd", {}, pill(d.customer.kyc, d.customer.verified ? "ok" : "info", { size: "sm" })))));
}

function viewConfirm(ctx, d) {
  const left = h("section", { class: "es-card pad" },
    h("div", { class: "es-card-h" }, h("h2", {}, "Allocate the bars"), pill(`${d.bars.length} BAR${d.bars.length === 1 ? "" : "S"}`, "info")),
    h("p", { class: "es-muted" }, `Confirming takes ${n0(d.grams)} g out of ${d.provider.short}'s stock for ${d.customer.name} and mints them as ${d.network === "xls66-devnet" ? "LGAU" : "gAu"} to the desk's inventory — one Payment from the issuer, the serials in its memo.`),
    h("dl", { class: "es-rows tight" }, d.bars.slice(0, 6).map((b) => h("div", {}, h("dt", {}, `${b.serial}`), h("dd", {}, `${b.form} · ${b.refiner} · ${n0(b.grams)} g · ${b.fineness}`))),
      d.bars.length > 6 ? h("div", {}, h("dt", {}, `+ ${d.bars.length - 6} more`), h("dd")) : null),
    h("div", { class: "es-actions" }, actBtn(ctx, d, "confirm", "Confirm the bars")));
  return [left, summaryCard(d)];
}

function viewTerms(ctx, d) {
  let method = d.method || "rlusd";
  const seg = h("div", { class: "es-seg big", role: "group", "aria-label": "How to pay" });
  seg.style.setProperty("--n", "3");
  const opts = [["rlusd", I.wallet, [rlt(), " balance"], "Price locks when you approve"], ["ach", I.bank, "Bank transfer (ACH)", "Locks when it clears · 1–3 days"], ["card", I.card, ["Card → ", rlt()], "Tops up your balance, then pays"]];
  const drawSeg = () => put(seg, ...opts.map(([k, ic, t, s]) => h("button", { type: "button", "aria-pressed": method === k ? "true" : "false", onclick: () => { method = k; drawSeg(); } }, h("b", {}, ic({ size: 16 }), t), h("small", {}, s))));
  drawSeg();
  const value = d.grams * d.price.current_g;
  let loanAmt = Math.round(value * 0.6);
  const loanOut = h("div", { class: "es-ways-big" });
  const loanSub = h("p", { class: "es-muted" });
  const range = h("input", { class: "es-range", type: "range", min: String(Math.round(value * 0.1)), max: String(Math.round(value * 0.6)), step: "1000", value: String(loanAmt), "aria-label": "Loan amount" });
  const drawLoan = () => { loanAmt = Number(range.value); put(loanOut, money(loanAmt)); loanSub.textContent = `LTV ${pct(loanAmt / value * 100)} of ${n0(value)} · 6.5% for 12 months · about ${n2(loanAmt * 1.065 / 12)} a month`; };
  range.addEventListener("input", drawLoan); drawLoan();
  const left = h("section", { class: "es-card pad" },
    h("div", { class: "es-card-h" }, h("h2", {}, "The terms"), d.price_doc.url ? h("a", { class: "es-btn link", href: d.price_doc.url, target: "_blank", rel: "noopener" }, "Oracle ↗") : null),
    h("dl", { class: "es-rows" },
      h("div", {}, h("dt", {}, "Au price now"), h("dd", {}, inlineMoney(d.price.current_g, 2), " / g")),
      h("div", {}, h("dt", {}, "Source"), h("dd", {}, d.price_doc.source)),
      h("div", {}, h("dt", {}, `${n0(d.grams)} g Au`), h("dd", {}, inlineMoney(value, 2))),
      h("div", {}, h("dt", {}, "Once agreed"), h("dd", {}, "The price holds for two minutes"))),
    h("div", { class: "es-field" }, h("span", {}, "How to pay"), seg),
    d.kind === "loan" ? h("div", { class: "es-field" }, h("span", {}, "Borrow against it (XLS-66 · CollateralLock)"), loanOut, range, loanSub) : null,
    h("div", { class: "es-actions" }, actBtn(ctx, d, "agree", "Agree the terms", { body: () => (d.kind === "loan" ? { method, loan_amount: loanAmt } : { method }) })));
  return [left, summaryCard(d)];
}

// ── approve & pay ──────────────────────────────────────────────────────────────────
function holdPill(d) {
  const el = pill("PRICE HELD · " + time.mmss(d.price.hold_left), "info", { size: "lg" });
  let left = d.price.hold_left;
  const t = setInterval(() => {
    left -= 1;
    if (!el.isConnected) { clearInterval(t); return; }
    if (left <= 0) { el.textContent = "PRICE HOLD ENDED"; el.className = "es-pill muted lg"; clearInterval(t); return; }
    el.textContent = "PRICE HELD · " + time.mmss(left);
  }, 1000);
  if (left <= 0) { el.textContent = "PRICE HOLD ENDED"; el.className = "es-pill muted lg"; }
  return el;
}

function refusalCard(ctx, d) {
  const r = d.refusal;
  const tech = h("section", { class: "es-tech", "aria-label": "Technical view", hidden: true },
    h("div", { class: "es-tech-h" }, h("span", { class: "es-eyebrow" }, "Technical view"), pill("REFUSED", "bad", { size: "sm" })),
    h("pre", {}, `${r.tx_type} · ${r.asset} → ${r.to} · result ${r.result} (tec = recorded on ledger, fee claimed)${r.ledger_index ? " · ledger " + r.ledger_index : ""} · hash ${r.short_hash || ""}`),
    r.url ? h("a", { class: "es-btn link", href: r.url, target: "_blank", rel: "noopener" }, "View on XRPL explorer", I.ext({ size: 15 })) : null);
  const toggle = btn("Technical details", { kind: "link", iconRight: I.chevron, attrs: { "aria-expanded": "false" } });
  toggle.addEventListener("click", () => { tech.hidden = !tech.hidden; toggle.setAttribute("aria-expanded", String(!tech.hidden)); });
  tech.hidden = false; toggle.setAttribute("aria-expanded", "true");
  const card = h("section", { class: "es-card es-refusal", "aria-label": "Refused" },
    h("div", { class: "es-refusal-in" }, tile(I.ban, "red", "lg"),
      h("div", {}, pill("REFUSED", "bad"), h("h2", {}, r.title), h("p", {}, r.sentence),
        h("div", { class: "es-actions" },
          d.credential.applies && !d.credential.issued ? actBtn(ctx, d, "credential", `Send ${first(d.customer.name)} the credential request`) : null,
          d.credential.applies && d.credential.issued && !d.credential.accepted ? actBtn(ctx, d, "accept", `${first(d.customer.name)} accepts the credential`, { icon: I.shield }) : null,
          actBtn(ctx, d, "pay", "Try again", { kind: d.credential.accepted ? "mint" : "", iconRight: null }), toggle))),
    stamp(r.result, { big: true }));
  return [card, tech];
}

function howToPay(ctx, d, state) {
  const seg = h("div", { class: "es-seg big", role: "group", "aria-label": "How to pay" });
  seg.style.setProperty("--n", "3");
  const opts = [["rlusd", I.wallet, [rlt(), " balance"], "Price locks when you approve"], ["ach", I.bank, "Bank transfer (ACH)", "Locks when it clears · 1–3 days"],
    ["card", I.card, ["Card → ", rlt()], "Tops up your balance, then pays"]];
  const from = h("div", { class: "es-pay-box" });
  const note = h("p", { class: "es-muted" });
  const draw = () => {
    put(seg, ...opts.map(([k, ic, t, s]) => h("button", { type: "button", "aria-pressed": state.method === k ? "true" : "false", onclick: () => { state.method = k; draw(); } }, h("b", {}, ic({ size: 16 }), t), h("small", {}, s))));
    put(from, h("span", {}, `${d.customer.address_short || "Settlement wallet"} · `, rlt(), state.method === "rlusd" ? " balance" : state.method === "ach" ? " via ACH" : " via card"), h("small", {}, rlt()));
    note.textContent = state.method === "rlusd" ? "Enough balance for this payment" : state.method === "ach" ? "The bank leg is simulated on this test network; the escrows are made when it clears." : "The card leg is simulated (SumUp mock); the balance is topped up, then the escrows are made.";
  };
  draw();
  return h("section", { class: "es-card pad", "aria-label": "How to pay" }, h("h2", {}, "How to pay"),
    h("div", { class: "es-field" }, seg), h("div", { class: "es-pay-from" }, h("div", { class: "es-eyebrow" }, "Pay from"), from, note));
}

function payReady(ctx, d, state) {
  const ach = d.ach && d.ach.pending && !d.ach.cleared;
  return h("section", { class: "es-card pad", "aria-label": "Approve and pay" },
    h("div", { class: "es-card-h" }, h("h2", {}, ach ? "Waiting for the bank transfer" : "Delivery versus payment"), pill(ach ? "BANK TRANSFER" : "TWO ESCROWS", "info")),
    h("p", { class: "es-muted" }, ach ? `${first(d.customer.name)}'s ${n0(d.amount)} USD transfer is on its way (1–3 days). When it clears, the price locks and both escrows are made.`
      : mark(`Approving locks two legs on the ${d.network_label}, each with a condition only the settlement agent can fulfil: the gold (${n0(d.grams)} g ${d.network === "xls66-devnet" ? "LGAU" : "gAu"}) to ${first(d.customer.name)}, and ${n0(d.amount)} {RL} to ${d.provider.short}. Neither moves until the proof arrives; both come back after the refund date.`)),
    h("div", { class: "es-actions" },
      ach ? actBtn(ctx, d, "ach_clear", "The transfer cleared") : actBtn(ctx, d, "pay", null, { body: () => ({ method: state.method }) }),
      !ach ? actBtn(ctx, d, "requote", "Hold the price again", { kind: "", iconRight: null, icon: I.clock }) : null,
      d.credential.applies && !d.credential.authorised ? actBtn(ctx, d, "credential", `Send ${first(d.customer.name)} the credential request`, { kind: "", iconRight: null }) : null));
}

function youPay(d) {
  const store = d.delivery.mode === "store";
  return h("section", { class: "es-card pad", "aria-label": "You pay" }, h("div", { class: "es-eyebrow" }, "You pay"),
    h("div", { class: "es-big" }, money(d.amount, { dec: 2 })),
    h("dl", { class: "es-rows" },
      h("div", {}, h("dt", {}, `${n0(d.grams)} g Au`), h("dd", {}, `at ${n2(d.price_g)} / g`)),
      h("div", {}, h("dt", {}, "Fees"), h("dd", {}, "None for you")),
      h("div", {}, h("dt", {}, store ? "Stored at" : "Ships by"), h("dd", {}, store ? d.provider.vault_line : "Insured USPS")),
      h("div", {}, h("dt", {}, store ? "Held in" : "Delivered to"), h("dd", {}, store ? `${d.customer.name}'s name` : d.delivery.label))));
}

function beforeMoney(d) {
  const row = (b) => {
    let p;
    if (b.key === "price") {
      p = pill(b.seconds > 0 ? `${time.mmss(b.seconds)} LEFT` : "HOLD ENDED", b.seconds > 0 ? "info" : "muted", { size: "sm" });
      if (b.seconds > 0) { let s = b.seconds; const t = setInterval(() => { s -= 1; if (!p.isConnected || s <= 0) { clearInterval(t); if (p.isConnected) { p.textContent = "HOLD ENDED"; p.className = "es-pill muted sm"; } return; } p.textContent = `${time.mmss(s)} LEFT`; }, 1000); }
    } else p = pill(b.pill, b.state === "done" ? "ok" : b.pill === "ACCEPT PENDING" ? "warn" : b.state === "pending" ? "info" : "bad", { size: "sm" });
    const ok = b.state === "done" || (b.key === "price" && b.seconds > 0);
    return h("div", { class: "es-check" }, ok ? tile(I.check, "green", "sm") : b.state === "pending" ? tile(I.clock, "blue", "sm") : tile(I.ban, "red", "sm"), h("span", {}, b.label), p);
  };
  return h("section", { class: "es-card pad", "aria-label": "Before money moves" }, h("div", { class: "es-eyebrow" }, "Before money moves"), h("div", { class: "es-checks" }, d.before.map(row)));
}

function lastToast(d) {
  const a = d.activity[0];
  if (!a || a.tx_type !== "CredentialCreate") return null;
  return h("div", { class: "es-toast-card", role: "status" }, h("span", { class: "es-ok-dot" }, I.check({ size: 14 })),
    h("div", {}, h("b", {}, mark(a.title)), h("small", {}, `ledger ${a.ledger_index || "—"} · ${a.tx_type} · ${(a.hash || "").slice(0, 4)}…`)),
    a.url ? h("a", { href: a.url, target: "_blank", rel: "noopener" }, "View") : h("span"));
}

function viewPay(ctx, d) {
  const state = { method: d.method || "rlusd" };
  const left = d.refusal ? [...refusalCard(ctx, d), howToPay(ctx, d, state)] : [payReady(ctx, d, state), howToPay(ctx, d, state)];
  return [left, [youPay(d), beforeMoney(d), lastToast(d)]];
}

// ── delivering ─────────────────────────────────────────────────────────────────────
function scanForm(ctx, d) {
  const a = act(d, "scan");
  if (!a) return null;
  const f = a.form;
  const sel = h("select", { class: "es-input es-select", "aria-label": "Scan" }, f[0].options.map(([v, t]) => h("option", { value: v }, t)));
  const where = h("input", { class: "es-input", placeholder: "Where — e.g. Memphis, TN", "aria-label": "Where" });
  const go = btn("Anchor the scan", { kind: "mint", size: "sm", icon: I.scan });
  go.addEventListener("click", () => busyBtn(go, async () => { await runAction(ctx, d.ref, "scan", { code: sel.value, where: where.value }); ctx.rerender(); }));
  const box = h("div", { class: "es-wf-act" }, h("span", { class: "who" }, "USPS · typed in by the desk"), h("b", {}, "Record the next scan"),
    h("p", {}, "From USPS tracking. Each scan becomes a memo Payment from the carrier's account — anchored, public, checkable."),
    h("div", { class: "es-grid2" }, sel, where), h("div", { class: "es-actions" }, go));
  return box;
}
function shipForm(ctx, d) {
  const a = act(d, "ship");
  if (!a) return null;
  const tr = h("input", { class: "es-input", placeholder: "USPS tracking number — leave empty to generate one", "aria-label": "Tracking number" });
  const go = btn("Packed and sealed — anchor the label", { kind: "mint", icon: I.truck });
  go.addEventListener("click", () => busyBtn(go, async () => { await runAction(ctx, d.ref, "ship", { tracking: tr.value }); ctx.rerender(); }));
  return h("div", { class: "es-wf-act primary" }, h("span", { class: "who" }, `${d.provider.short} · the desk`), h("b", {}, "Pack, seal, hand to USPS"),
    h("p", {}, "The tracking number is entered by hand (no USPS API): the label is anchored on the ledger with the seal number, and every scan after it."), tr, h("div", { class: "es-actions" }, go));
}

function viewDelivering(ctx, d) {
  const sh = d.shipment;
  const store = d.delivery.mode === "store";
  const pay = d.escrows.payment || {};
  const released = pay.state === "released";
  const notice = !sh
    ? h("div", { class: "es-notice", role: "note" }, h("span", { class: "es-tile" }, I.info({ size: 16 })), h("div", {}, h("b", {}, "Ready for USPS"),
      h("p", {}, `The payment is secured. ${d.provider.short} packs and seals the bars; the tracking number goes in when USPS picks the parcel up.`)))
    : h("div", { class: "es-notice", role: "note" }, h("span", { class: "es-tile" }, I.info({ size: 16 })), h("div", {}, h("b", {}, "Nothing for you to do right now"),
      h("p", {}, store ? `USPS has the insured parcel. When the ${d.provider.vault} signs for it, the escrow releases payment to ${d.provider.short} and the bars appear in your vault. We'll notify you.`
        : released ? `USPS has the insured parcel and ${d.provider.short} has been paid — the escrow released the moment USPS accepted it. The gold token moves to you when you sign for the delivery.`
          : `The parcel is with ${d.provider.short}. The payment releases the moment USPS accepts the insured parcel; the gold token moves to you when you sign for it.`)));
  const events = sh ? [...sh.scans, ...sh.upcoming] : [];
  const ship = sh ? h("section", { class: "es-card pad", "aria-label": "Shipment" },
    h("div", { class: "es-card-h" }, h("h3", {}, "Shipment"), sh.track_url ? h("a", { class: "es-btn link", href: sh.track_url, target: "_blank", rel: "noopener" }, "Track on USPS", I.ext({ size: 15 })) : null),
    h("div", { class: "es-timeline" }, events.map((e) => h("div", { class: `es-ev ${e.state}` },
      h("span", { class: "es-ev-dot" }, e.state === "done" ? I.check({ size: 13 }) : e.state === "now" ? I.truck({ size: 14 }) : null),
      h("div", {}, h("b", {}, e.title + (e.state !== "next" && e.where && !e.title.includes(e.where) ? ` · ${e.where}` : "")),
        h("small", {}, e.state === "next" ? e.where : (e.hash ? "Anchored on the ledger" : e.where || ""))),
      h("span", { class: "es-ev-r" }, e.state === "now" ? pill("NOW", "info", { size: "sm" }) : null, e.at ? time.dayTime(e.at) : "",
        e.url ? h("a", { href: e.url, target: e.url.startsWith("http") ? "_blank" : null, rel: "noopener", title: "The anchor on the ledger" }, "↗") : null)))),
    scanForm(ctx, d)) : shipForm(ctx, d);
  const unit = d.network === "xls66-devnet" ? "LGAU" : "gAu";
  const escrow = h("section", { class: "es-card pad", "aria-label": "Escrow" },
    h("div", { class: "es-lock-h" }, tile(released ? I.unlock : I.lock, released ? "green" : "purple"),
      h("div", {}, h("b", {}, released ? [n0(Number(pay.amount || d.amount)), " ", rlt(), ` released to ${d.provider.short}`] : ["Your ", n0(Number(pay.amount || d.amount)), " ", rlt(), " is in escrow"]),
        h("small", { class: "es-muted" }, released ? "EscrowFinish by the settlement agent, with the fulfillment" : `Released to ${d.provider.short} only when ${store ? "the vault signs" : "USPS accepts the parcel"}`))),
    h("dl", { class: "es-rows tight" },
      h("div", {}, h("dt", {}, "Escrow"), h("dd", {}, pay.url ? h("a", { href: pay.url, target: pay.url.startsWith("http") ? "_blank" : null, rel: "noopener" }, `EscrowCreate · ${d.network_short}`) : `EscrowCreate · ${d.network_short}`)),
      h("div", {}, h("dt", {}, "Releases when"), h("dd", {}, d.release.payment)),
      h("div", {}, h("dt", {}, "Refund if"), h("dd", {}, `Not ${store ? "delivered" : "accepted"} by ${pay.refund_by || "—"}`)),
      h("div", {}, h("dt", {}, "Gold leg"), h("dd", {}, `${n0(d.grams)} g ${unit} · ${(d.escrows.title || {}).state === "released" ? "released" : "on " + d.release.title.toLowerCase()}`)),
      h("div", {}, h("dt", {}, "Result so far"), h("dd", {}, released ? pill("RELEASED", "ok", { size: "sm" }) : pill("LOCKED", "own", { size: "sm" })))));
  const b0 = d.bars[0] || {};
  const parcel = h("section", { class: "es-card pad", "aria-label": "In the parcel" }, h("div", { class: "es-eyebrow" }, "In the parcel"),
    h("dl", { class: "es-rows tight" },
      h("div", {}, h("dt", {}, "Bar"), h("dd", {}, `${b0.serial || "—"} · ${b0.refiner || ""}${d.bars.length > 1 ? ` (+${d.bars.length - 1})` : ""}`)),
      h("div", {}, h("dt", {}, "Weight · fineness"), h("dd", {}, `${n0(d.grams)} g · ${b0.fineness || "999.9"}`)),
      h("div", {}, h("dt", {}, "Insured"), h("dd", {}, "Full value")),
      h("div", {}, h("dt", {}, "Tracking"), h("dd", {}, sh && sh.tracking ? `${sh.tracking.slice(0, 4)} ${sh.tracking.slice(4, 8)} …${sh.tracking.slice(-4)}` : "Not yet"))),
    h("div", { class: "es-actions" }, btn("Open bar passport", { size: "sm", iconRight: I.arrow, onclick: () => passport(d) })));
  return [[notice, ship], [escrow, parcel, act(d, "refund") ? h("div", { class: "es-actions" }, actBtn(ctx, d, "refund", "Refund after the refund date", { kind: "danger", iconRight: null })) : null]];
}

// ── the loan ───────────────────────────────────────────────────────────────────────
function viewLoan(ctx, d, p) {
  const L = d.loan;
  const c = first(d.customer.name);
  const live = L && L.live;
  let what = null;                                   // a what-if Au price, or null
  let technical = p.view === "technical";
  const ltvAt = (price) => (L.outstanding / (L.grams * price)) * 100;
  const pay = live ? (L.ways.find((w) => w.kind === "pay") || null) : null;

  const band = h("section", { class: "es-band deal" }, h("div", { class: "es-wrap" }, h("div", { class: "es-band-in" },
    h("div", {}, h("div", { class: "es-crumbs" }, h("a", { href: "#/deals" }, "Deals"), "/", h("b", {}, `${d.ref} · ${d.customer.name}`)),
      h("div", { class: "es-band-pills" }, pill("COLLATERALLOCK · OWN NODE", "own", { cls: "dark" }), live && !L.repaid ? pill(`LTV ${n0(L.ltv)}% · ${L.pill}`, L.rung === "safe" ? "ok" : "warn", { cls: L.rung === "safe" ? "" : "dark" }) : null),
      h("h1", {}, d.headline.title, " ", h("em", {}, d.headline.accent || "")), h("p", { class: "es-sub" }, mark(d.headline.line || ""))),
    h("div", { class: "es-actions" },
      btn("Share status link", { kind: "ghost-band", icon: I.link, onclick: async () => { try { await navigator.clipboard.writeText(location.href); toast("Status link copied", "", { sub: location.href }); } catch (e) { toast(location.href); } } }),
      live && !L.repaid ? btn(L.rung === "safe" ? "Ways to stay safe" : "Choose a way back to safe", { kind: L.rung === "safe" ? "ghost-band" : "mint", iconRight: I.arrow, href: `#/deal/${d.ref}/ways` }) : null))));

  const viewSeg = h("div", { class: "es-seg", role: "group", "aria-label": "Simple or technical" });
  const stepBox = h("div");
  const drawWhere = () => {
    put(viewSeg, ...[["simple", "Simple"], ["technical", "Technical"]].map(([k, t]) => h("button", { type: "button", "aria-pressed": (technical ? "technical" : "simple") === k ? "true" : "false",
      onclick: () => { technical = k === "technical"; history.replaceState(null, "", ctx.href(`/deal/${d.ref}`, technical ? { view: "technical" } : null)); ctx.rerender(); } }, t)));
    const steps = technical ? d.steps.map((s, i) => ({ ...s, who: ["Note", "Payment · memo", "Price lock", "Payment ×3 · memos", "EscrowCreate ×2 · Finish ×2", "EscrowCreate · LoanSet"][i] || s.who })) : d.steps;
    put(stepBox, stepper(steps, { running: !!d.busy }));
  };
  drawWhere();
  const where = h("section", { class: "es-card es-where-card", "aria-label": "Where this deal is" },
    h("div", { class: "es-card-h" }, h("div", {}, h("div", { class: "es-eyebrow" }, "Where this deal is"),
      h("b", {}, live ? (L.repaid ? "Step 6 of 6 · repaid; the pledge is released" : `Step 6 of 6 · the loan is live; the next decision is ${c}'s`) : `Step ${Math.min(6, d.stage)} of 6 · ${d.steps[Math.min(5, d.stage - 1)].label.toLowerCase()}`)),
    viewSeg), stepBox);

  if (!live) {
    const open = h("section", { class: "es-card pad" }, h("div", { class: "es-card-h" }, h("h2", {}, "Open the loan"), pill("OWN NODE", "own")),
      h("p", { class: "es-muted" }, `${n0(d.grams)} g of LGAU go into an escrow whose Account and Destination are ${c}'s own wallet — then LoanSet names that escrow in its CollateralID field. From that moment the ledger itself refuses to release the escrow until the loan is paid off (tecPLEDGED). That is our amendment, CollateralLock.`),
      h("dl", { class: "es-rows tight" }, h("div", {}, h("dt", {}, "Loan"), h("dd", {}, inlineMoney(L ? L.principal : d.amount * 0.6))), h("div", {}, h("dt", {}, "Rate · term"), h("dd", {}, "6.5% · 12 months")),
        h("div", {}, h("dt", {}, "Lender"), h("dd", {}, "XLS-65 vault · XLS-66 loan broker"))),
      h("div", { class: "es-actions" }, actBtn(ctx, d, "loan_open", "Open the loan")));
    return { band, where, cols: [[open, activityCard(d, { limit: 6 })], [summaryCard(d, { amountLabel: "Bought and stored in the vault" })]] };
  }

  // what the meter, the numbers and the chart show — redrawn on every what-if
  const ltvBig = h("div", { class: "es-ltv-big es-num" });
  const ltvPill = h("span");
  const healthSentence = h("p", { class: "es-muted" });
  const hint = h("div", { class: "es-meter-hint" });
  const m = meter({ ltv: L.ltv, ghost: pay ? pay.ltv_after : null, onPick: (ltv) => setWhat(L.outstanding / (L.grams * (ltv / 100))) });
  const priceBig = h("div", { class: "es-price-big es-num" });
  const chg = h("div", { class: "es-chg" });
  const chartBox = h("div");
  const posPrice = h("dd");
  const posLtv = h("div", {});
  const noticeBox = h("div");
  const whatBar = h("div", { class: "es-actions" });

  function setWhat(price) {
    if (price === null) { what = null; draw(); return; }
    what = Math.max(10, Math.min(1000, Math.round(price * 2) / 2));          // half-dollar steps: a price a person would say
    draw();
  }
  function draw() {
    const price = what ?? L.price;
    const ltv = what === null ? L.ltv : ltvAt(price);
    const rung = what === null ? L.rung : rungOf(ltv);
    const [label, sentence] = RUNG_TEXT[rung];
    ltvBig.textContent = pct(ltv);
    put(ltvPill, pill(RUNG_PILL[rung][1], RUNG_PILL[rung][0]));
    put(healthSentence, what === null ? `Loan is ${pct(L.ltv)} of the Au's value${pay && L.rung !== "safe" ? ` · a top-up brings it to ${pct(pay.ltv_after)} (dashed)` : ""}`
      : `What if Au were at ${n2(price)}? The loan would be ${pct(ltv)} of the Au's value — ${label}.`);
    m.set({ ltv: L.ltv, ghost: pay && L.rung !== "safe" ? pay.ltv_after : null, whatIf: what === null ? null : ltv });
    put(hint, I.info({ size: 14 }), what === null ? "Tap the bar to try another gold price · 70 we tell you · 75 top-up · 80 at risk · 85 sale"
      : h("span", {}, mark(`What-if at ${n2(price)} {RL}/g — nothing is published. `)), what !== null ? btn("Back to the live price", { kind: "link", onclick: () => setWhat(null) }) : null);
    priceBig.textContent = n2(price);
    const ch = ((price - L.locked_price) / L.locked_price) * 100;
    chg.className = "es-chg " + (ch < 0 ? "down" : "up");
    chg.textContent = `${ch >= 0 ? "+" : "−"}${Math.abs(ch).toFixed(1)}% since price lock`;
    put(chartBox, chart(d.price_doc.history.length ? d.price_doc.history : [{ price: L.price }], { base: L.locked_price, whatIf: what }));
    put(posPrice, h("span", { class: rung === "safe" ? "" : "es-tone-bad" }, n2(price), " ", h("span", { class: "es-rl" }, "RL"), "USD/g"));
    put(posLtv, h("span", { class: rung === "safe" ? "es-tone-ok" : rung === "notify" || rung === "topup" ? "es-tone-warn" : "es-tone-bad" }, `LTV ${pct(ltv)} · ${label}`));
    put(noticeBox, rung === "safe" ? h("div", { class: "es-notice ok" }, h("span", { class: "es-tile" }, I.check({ size: 16 })),
      h("div", {}, h("b", {}, what === null ? `LTV ${pct(ltv)} · safe` : `At ${n2(price)}: LTV ${pct(ltv)} · safe`), h("p", {}, "Nothing to do. The CollateralLock keeps the Au pledged until the loan is paid off.")))
      : h("div", { class: "es-notice warn" }, h("span", { class: "es-tile" }, I.warn({ size: 16 })),
        h("div", {}, h("b", {}, `LTV ${pct(ltv)} · ${label}`), h("p", {}, `${what === null ? `Au fell to ${n2(price)} ` : `If Au were at ${n2(price)} `}`, rlt(), `/g, so the loan ${what === null ? "is" : "would be"} ${pct(ltv)} of the gold's value. ${sentence.replace("{c}", c)}`),
          what === null ? h("div", { class: "es-actions" }, btn("See the 3 ways out", { kind: "mint", size: "sm", iconRight: I.arrow, href: `#/deal/${d.ref}/ways` }),
            btn("Remind me tomorrow", { size: "sm", onclick: () => { toast("We'll remind you tomorrow", "", { sub: `${d.ref} · LTV ${pct(ltv)}` }); put(noticeBox); } })) : null)));
    put(whatBar, what !== null && ctx.operator ? btn(`Publish ${n2(what)} on the ledger`, { kind: "mint", size: "sm", icon: I.chart, onclick: async (e) => {
      const b = e.currentTarget;
      await busyBtn(b, async () => { await ctx.deals.publishPrice({ price: what }); toast(`Au price published · ${n2(what)}`, "", { sub: "OracleSet on the XRPL Testnet · every open loan re-measured" }); what = null; ctx.rerender(); });
    } }) : null);
  }
  draw();
  const health = h("section", { class: "es-card pad", "aria-label": "Loan health" },
    h("div", { class: "es-card-h" }, h("div", {}, h("div", { class: "es-eyebrow" }, "Loan health · loan-to-value"), healthSentence), h("div", { class: "es-ltv-row" }, ltvBig, ltvPill)),
    m, hint, whatBar);
  const priceCard = h("section", { class: "es-card pad", "aria-label": "Au price" },
    h("div", { class: "es-card-h" }, h("div", {}, h("div", { class: "es-eyebrow" }, "Au price · ", h("span", { class: "es-rl" }, "RL"), "USD per gram"),
      h("div", { class: "es-muted" }, h("span", { class: "es-livedot" }), `Updated ${time.hm(d.price_doc.at)} · ${time.ago(d.price_doc.at)}`)),
    h("div", {}, priceBig, chg, h("div", { class: "es-locked-at" }, `locked at ${n2(L.locked_price)}`))),
    chartBox,
    h("div", { class: "es-actions" }, (ctx.sample ? pill("SAMPLE", "muted", { size: "sm" }) : pill("LIVE", "ok", { size: "sm", live: true })), h("span", { class: "es-mono es-muted" }, `OracleSet · ${/AI price agent/.test(d.price_doc.source) ? "AI price agent" : d.price_doc.source} · XRP Ledger`),
      d.price_doc.url ? h("a", { class: "es-mono", href: d.price_doc.url, target: "_blank", rel: "noopener" }, short(d.price_doc.hash, 6, 4) + " ↗") : null));
  const position = h("section", { class: "es-card pad", "aria-label": "The position" }, h("div", { class: "es-eyebrow" }, "The position"),
    h("div", { class: "es-big" }, money(L.repaid ? 0 : L.outstanding)), posLtv,
    h("dl", { class: "es-rows" },
      h("div", {}, h("dt", {}, "Collateral"), h("dd", {}, `${n0(L.grams)} g Au · ${d.bars.length} bars${L.extra ? ` (+${n0(L.extra)} g)` : ""}`)),
      h("div", {}, h("dt", {}, "Vault"), h("dd", {}, `${d.provider.city} · insured`)),
      h("div", {}, h("dt", {}, "Rate · term"), h("dd", {}, `${L.rate_pct}% · ${L.months} months`)),
      h("div", {}, h("dt", {}, "Next payment"), h("dd", {}, L.repaid ? "—" : `${n2(L.periodic)} · ${L.next_due || "next month"}`)),
      h("div", {}, h("dt", {}, "Au price"), posPrice)));
  const track = h("i"); track.style.width = `${L.repaid ? 100 : Math.max(2, (L.payments_made / L.months) * 100)}%`;
  const lock = h("section", { class: "es-card es-lock", "aria-label": "Locked to the loan" },
    h("div", { class: "es-lock-h" }, tile(L.repaid ? I.unlock : I.lock, L.repaid ? "green" : "purple"),
      h("div", {}, h("b", {}, L.repaid ? "Released to customer" : "Locked to the loan", pill("OWN NODE", "own", { size: "sm" })),
        h("small", { class: "m" }, `Escrow ${L.pledge_short || "—"} → ${L.repaid ? "tesSUCCESS" : `release blocked (${(L.probe && L.probe.result) || "tecPLEDGED"})`}`))),
    h("div", { class: "es-track" }, track),
    h("div", { class: "es-track-l" }, h("span", {}, "Loan opened"), h("b", {}, L.repaid ? `${L.months} of ${L.months} payments` : `${L.payments_made} of ${L.months} payments`), h("span", {}, L.repaid ? "Paid off + released" : "Paid off → released")));
  const gold = h("section", { class: "es-card es-goldcard", "aria-label": "LiquidGold" },
    h("div", { class: "es-goldcard-h" }, h("span", { class: "es-tile white" }, I.bar({ size: 20 })), h("div", {}, h("b", {}, "LiquidGold"), h("small", {}, `${d.ref} · ${d.bars.length} × ${n0(d.bars[0] ? d.bars[0].grams / 1000 : 1)} kg`)),
      h("span", { class: "es-actions" }, (ctx.sample ? pill("SAMPLE", "muted", { size: "sm" }) : pill("LIVE", "ok", { size: "sm" })))),
    h("div", { class: "es-goldcard-b" }, h("dl", { class: "es-rows" },
      h("div", {}, h("dt", {}, "Fineness"), h("dd", {}, (d.bars[0] || {}).fineness || "999.9")),
      h("div", {}, h("dt", {}, "Refiners"), h("dd", {}, [...new Set(d.bars.map((b) => b.refiner))].join(" · "))),
      h("div", {}, h("dt", {}, "Token"), h("dd", {}, "LGAU · MPT"))),
    btn("Open bar passport", { size: "sm", iconRight: I.arrow, onclick: () => passport(d) })));
  const objects = technical ? h("section", { class: "es-card pad", "aria-label": "Ledger objects" }, h("div", { class: "es-eyebrow" }, "On our devnet"),
    h("dl", { class: "es-rows tight" },
      h("div", {}, h("dt", {}, "Loan"), h("dd", { class: "es-addr" }, L.loan_id || "—")),
      h("div", {}, h("dt", {}, `Escrow (${L.field})`), h("dd", { class: "es-addr" }, L.pledge_escrow || "—")),
      h("div", {}, h("dt", {}, "Early release"), h("dd", {}, L.probe ? stamp(L.probe.result) : "—")),
      h("div", {}, h("dt", {}, "Amendment"), h("dd", {}, "CollateralLock · network 424")))) : null;
  return { band, where, cols: [[noticeBox, health, priceCard, activityCard(d, { limit: technical ? 0 : 3, technical })], [position, lock, objects, gold]] };
}

// ── settled and refunded ───────────────────────────────────────────────────────────
function viewClosed(ctx, d) {
  const refunded = d.status_raw === "refunded";
  const r = d.receipt || {};
  const card = h("section", { class: "es-card pad", "aria-label": "Receipt" },
    h("div", { class: "es-card-h" }, h("h2", {}, refunded ? "Refunded — both legs went back" : (d.delivery.mode === "store" ? "In the vault · settled" : "Delivered · settled")), pill(refunded ? "REFUNDED" : "SETTLED", refunded ? "muted" : "ok")),
    h("p", { class: "es-muted" }, refunded ? mark(`No proof arrived by the refund date. EscrowCancel returned ${n0(d.amount)} {RL} to ${d.customer.name} and the gold to the desk — nobody had to agree.`)
      : `Both legs released on the ledger. ${d.provider.short} was paid; ${d.customer.name} holds ${n0(d.grams)} g ${d.network === "xls66-devnet" ? "LGAU" : "gAu"}${d.delivery.mode === "store" ? ` in the ${d.provider.vault}` : ""}.`),
    h("dl", { class: "es-rows" },
      h("div", {}, h("dt", {}, "Amount"), h("dd", {}, inlineMoney(d.amount, 2))),
      h("div", {}, h("dt", {}, "Price"), h("dd", {}, `${n2(d.price_g)} / g`)),
      h("div", {}, h("dt", {}, "Closed"), h("dd", {}, time.dayTime(r.closed_at))),
      h("div", {}, h("dt", {}, "Money leg"), h("dd", {}, (d.escrows.payment || {}).finish_url ? h("a", { href: d.escrows.payment.finish_url, target: "_blank", rel: "noopener" }, "EscrowFinish ↗") : refunded ? "EscrowCancel" : "—")),
      h("div", {}, h("dt", {}, "Gold leg"), h("dd", {}, (d.escrows.title || {}).finish_url ? h("a", { href: d.escrows.title.finish_url, target: "_blank", rel: "noopener" }, "EscrowFinish ↗") : refunded ? "EscrowCancel" : "—"))),
    h("div", { class: "es-actions" }, btn("Open bar passport", { size: "sm", iconRight: I.arrow, onclick: () => passport(d) }), btn("Print the receipt", { size: "sm", onclick: () => window.print() })));
  return [[card, activityCard(d)], [summaryCard(d, { amountLabel: refunded ? "Refunded in full" : "Settled" })]];
}

// ── the page ───────────────────────────────────────────────────────────────────────
export async function render(ctx, p) {
  const d = await ctx.deals.deal(p.id);
  if (d.busy) {
    ctx.leave(poll(async () => { const x = await ctx.deals.deal(p.id); if (!x.busy) { ctx.rerender(); const a = x.activity[0]; if (a) toast(a.title, a.pill === "REFUSED" ? "bad" : "", { sub: [a.tx_type, a.result].filter(Boolean).join(" · "), href: a.url }); } }, 1500));
  }
  const cols = (left, right, wide = false) => h("div", { class: `es-cols ${wide ? "wide-r" : ""}`.trim() }, h("div", { class: "es-col" }, left), h("div", { class: "es-col" }, right));
  if (d.view === "loan") {
    const v = viewLoan(ctx, d, p);
    return frame(ctx, "deals", v.band, h("div", { class: "es-wrap" }, v.where, runningNotice(d), cols(v.cols[0], v.cols[1], true)));
  }
  let right = null, body;
  if (d.view === "pay") {
    const [l, r] = viewPay(ctx, d);
    right = d.ach && d.ach.pending && !d.ach.cleared ? pill("BANK TRANSFER · PENDING", "info", { size: "lg" }) : holdPill(d);
    body = cols(l, r);
  } else if (d.view === "delivering") {
    const [l, r] = viewDelivering(ctx, d);
    right = pill(d.status.label.replace("USPS · ", "USPS · ARRIVES IN ").replace("ARRIVES IN TODAY", "ARRIVES TODAY").replace("PICKUP TODAY", "READY FOR USPS"), "info", { size: "lg" });
    body = cols(l, r);
  } else if (d.view === "confirm") {
    const [l, r] = viewConfirm(ctx, d);
    right = pill("PROVIDER CONFIRM", "info", { size: "lg" });
    body = cols([l], [r]);
  } else if (d.view === "terms") {
    const [l, r] = viewTerms(ctx, d);
    right = pill("TERMS", "info", { size: "lg" });
    body = cols([l], [r]);
  } else {
    const [l, r] = viewClosed(ctx, d);
    right = pill(d.status.label, d.status.tone, { size: "lg" });
    body = cols(l, r);
  }
  return frame(ctx, "deals", head(ctx, d, { right }), h("div", { class: "es-wrap" }, runningNotice(d) ? h("div", { class: "es-col es-gap" }, runningNotice(d)) : null, body));
}

export { follow };
