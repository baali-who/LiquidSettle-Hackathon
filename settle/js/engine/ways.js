/**
 * Ways out · back to safe (Figma: "LiquidSettle v3 / Ways out · back to safe — Desktop 1440"). Three ways back under
 * 70 % — buy more Au, add Au you own, pay down the loan — each with the result before you approve: the meter (solid
 * pin now, faded pin after), what changes, the ledger transaction it will be. Or close it completely: repay early and
 * the CollateralLock lets go. Every number recomputes as you type or drag; nothing moves until you approve.
 */
import { h, I, btn, busy as busyBtn, money, n0, n2, pct, pill, meter, overlay, toast, first, rl, rlt, stamp, put, mark } from "./kit.js";
import { frame } from "./shell.js";
import { runAction } from "./run.js";

export const name = "ways";
export const title = (p) => `Ways out · ${p.id}`;

export async function render(ctx, p) {
  const d = await ctx.deals.deal(p.id);
  const L = d.loan;
  if (!L || !L.live || L.repaid) { ctx.navigate(`/deal/${d.ref}`); return h("div"); }
  const c = first(d.customer.name);
  const ways = Object.fromEntries(L.ways.map((w) => [w.kind, w]));
  const st = { kind: p.way || "pay", pay: ways.pay ? Math.max(ways.pay.amount, Math.ceil(L.periodic)) : L.periodic, grams: ways.buy ? ways.buy.grams : 1000 };
  const minPay = Math.ceil(L.periodic), maxPay = Math.floor(L.total_outstanding || L.outstanding);
  const freeG = L.free_grams || 0;

  const seg = h("div", { class: "es-seg big", role: "group", "aria-label": "Choose how" });
  const big = h("div", { class: "es-ltv-row" });
  const safePill = h("span");
  const m = meter({ ltv: L.ltv, ghost: L.ltv });
  const amountBox = h("div");
  const changes = h("div");
  const ledgerNote = h("div");
  const go = btn("", { kind: "mint", size: "lg", iconRight: I.arrow });

  const after = () => {
    if (st.kind === "pay") return { ltv: ((L.outstanding - st.pay) / (L.grams * L.price)) * 100, loan: L.outstanding - st.pay, grams: L.grams, spend: st.pay };
    const g = st.grams;
    return { ltv: (L.outstanding / ((L.grams + g) * L.price)) * 100, loan: L.outstanding, grams: L.grams + g, spend: st.kind === "buy" ? g * L.price : 0 };
  };
  function drawSeg() {
    seg.style.setProperty("--n", "3");
    const opts = [["buy", I.bar, "Buy more Au", ways.buy ? ways.buy.sub : ""], ["add", I.plus, "Add Au you own", freeG ? `Lock metal you hold → up to ${n0(freeG)} g` : "No free Au in the wallet"],
      ["pay", I.bank, "Pay down loan", ways.pay ? mark(ways.pay.sub) : ""]];
    put(seg, ...opts.map(([k, ic, t, s]) => h("button", { type: "button", "aria-pressed": st.kind === k ? "true" : "false", disabled: k === "add" && !freeG,
      onclick: () => { st.kind = k; if (k === "add") st.grams = Math.min(freeG, ways.add ? ways.add.grams : freeG); if (k === "buy") st.grams = ways.buy ? ways.buy.grams : 1000; drawAll(); } },
    h("b", {}, ic({ size: 16 }), t), h("small", {}, s))));
  }
  function drawAmount() {
    if (st.kind === "pay") {
      const input = h("input", { inputmode: "decimal", value: n2(st.pay), "aria-label": "Amount to pay down" });
      const range = h("input", { class: "es-range", type: "range", min: String(minPay), max: String(maxPay), step: "1000", value: String(Math.round(st.pay)), "aria-label": "Amount to pay down" });
      input.addEventListener("change", () => { const v = Number(String(input.value).replace(/[^0-9.]/g, "")); st.pay = Math.max(minPay, Math.min(maxPay, v || minPay)); drawAll(false); });
      range.addEventListener("input", () => { st.pay = Number(range.value); input.value = n2(st.pay); drawNumbers(); });
      put(amountBox, h("div", { class: "es-eyebrow" }, "Amount to pay down"), h("div", { class: "es-amount" }, input, h("span", { class: "es-cur" }, h("span", { class: "es-rl" }, "RL"), "USD")), range,
        h("p", { class: "es-muted es-gap-s" }, `Loan becomes ${n0(L.outstanding - st.pay)} `, rlt(), ` · paid from ${c === "You" ? "your" : c + "'s"} `, rlt(), ` balance (${n2(L.balance)} available)${L.balance < st.pay ? " — the rest is topped up from the test-network demo issuer" : ""}`));
    } else {
      const max = st.kind === "add" ? freeG : 10000;
      const input = h("input", { inputmode: "numeric", value: n0(st.grams), "aria-label": "Grams" });
      const range = h("input", { class: "es-range", type: "range", min: "100", max: String(Math.max(100, max)), step: "100", value: String(st.grams), "aria-label": "Grams" });
      input.addEventListener("change", () => { st.grams = Math.max(100, Math.min(max, Number(String(input.value).replace(/[^0-9]/g, "")) || 100)); drawAll(false); });
      range.addEventListener("input", () => { st.grams = Number(range.value); input.value = n0(st.grams); drawNumbers(); });
      put(amountBox, h("div", { class: "es-eyebrow" }, st.kind === "buy" ? "Au to buy and lock" : "Au you own, to lock"), h("div", { class: "es-amount" }, input, h("span", { class: "es-cur" }, "g")), range,
        h("p", { class: "es-muted es-gap-s" }, st.kind === "buy" ? [`About ${n0(st.grams * L.price)} `, rlt(), ` at ${n2(L.price)}/g · the bars join the ${d.provider.vault}`] : `${n0(freeG)} g free in ${c}'s wallet`));
    }
  }
  function drawNumbers() {
    const a = after();
    const safe = a.ltv < 70;
    put(big, h("span", { class: "from es-num" }, pct(L.ltv)), I.arrow({ size: 22 }), h("span", { class: "es-ltv-big es-num" }, pct(a.ltv)));
    put(safePill, pill(safe ? "SAFE" : a.ltv < 75 ? "WATCH" : "STILL HIGH", safe ? "ok" : "warn"));
    m.set({ ltv: L.ltv, ghost: a.ltv });
    const row = (k, from, to, good = null) => h("div", { class: "es-change" }, h("span", { class: "k" }, k), h("span", { class: "from es-num" }, from), I.arrow({ size: 14 }),
      h("span", { class: `to es-num ${good === true ? "good" : good === false ? "bad" : ""}`.trim() }, to));
    const bal = L.balance - a.spend;
    put(changes, h("div", { class: "es-eyebrow" }, "What changes"),
      row("Loan", n0(L.outstanding), n0(a.loan)),
      row("Loan health", pct(L.ltv), pct(a.ltv), a.ltv < 70),
      row("Au in vault", `${n0(L.grams)} g`, `${n0(a.grams)} g`),
      row(["Your ", rlt()], n2(L.balance), n2(Math.max(0, bal))),
      h("div", { class: "es-change" }, h("span", { class: "k" }, "Next payment"), h("span"), h("span"), h("span", { class: "to es-num" }, `${n2(L.periodic)} · ${L.next_due || "next month"}`)));
    put(go, st.kind === "pay" ? ["Review and approve ", n0(st.pay), " ", rlt()] : st.kind === "buy" ? `Review and approve · buy ${n0(st.grams)} g` : `Review and approve · lock ${n0(st.grams)} g`, I.arrow({ size: 16 }));
    const tx = { pay: ["LoanPay", "Your payment is a LoanPay on the XRP Ledger. The CollateralLock keeps the Au pledged until the loan is paid off."],
      buy: ["Payment · Payment · EscrowCreate", "{RL} to the desk, LGAU to you, then a second escrow locks it to the loan. The ledger pledges one escrow per loan; the platform holds this one to it."],
      add: ["EscrowCreate", "Your Au goes into a second escrow locked to the loan. The ledger pledges one escrow per loan (CollateralLock); the platform holds this one to it."] }[st.kind];
    put(ledgerNote, h("div", { class: "es-notice ok" }, h("span", { class: "es-tile" }, I.check({ size: 16 })), h("div", {}, h("b", {}, "What the ledger does"), h("p", {}, mark(tx[1])), h("p", { class: "es-mono es-muted" }, tx[0] + " · own node"))));
  }
  function drawAll(amount = true) { drawSeg(); if (amount) drawAmount(); else drawAmount(); drawNumbers(); }

  function review() {
    const a = after();
    const action = st.kind === "pay" ? ["paydown", { amount: st.pay }] : st.kind === "buy" ? ["buy_more", { grams: st.grams }] : ["add_au", { grams: st.grams }];
    const ok = btn("Approve", { kind: "mint", iconRight: I.arrow });
    const panel = h("div", { class: "es-modal", role: "dialog", "aria-modal": "true", "aria-label": "Review" },
      h("div", { class: "es-modal-h" }, h("div", {}, h("h2", {}, "Review and approve"), h("p", {}, `${d.ref} · ${d.customer.name}`)), h("button", { type: "button", class: "es-iconbtn", "aria-label": "Close", onclick: () => close() }, I.x({ size: 18 }))),
      h("div", { class: "es-modal-b" }, h("div", { class: "es-modal-sec" },
        h("div", { class: "es-big" }, st.kind === "pay" ? money(st.pay, { dec: 2 }) : `${n0(st.grams)} g`),
        h("p", { class: "es-muted" }, st.kind === "pay" ? "paid to the lender's vault — LoanPay with the overpayment flag" : st.kind === "buy" ? `bought at ${n2(L.price)}/g and locked to the loan` : "locked to the loan from your own Au"),
        h("dl", { class: "es-rows" }, h("div", {}, h("dt", {}, "Loan health after"), h("dd", {}, pct(a.ltv), " ", pill(a.ltv < 70 ? "SAFE" : "WATCH", a.ltv < 70 ? "ok" : "warn", { size: "sm" }))),
          h("div", {}, h("dt", {}, "Network"), h("dd", {}, "XLS-66 Collateral Lending devnet · own node")),
          h("div", {}, h("dt", {}, "Signed by"), h("dd", {}, `${c}'s settlement wallet`))))),
      h("div", { class: "es-modal-f" }, h("span", { class: "es-sum" }, "Nothing moves until you approve."), btn("Cancel", { onclick: () => close() }), ok));
    ok.addEventListener("click", () => busyBtn(ok, async () => { await runAction(ctx, d.ref, action[0], action[1]); close(); ctx.navigate(`/deal/${d.ref}`); }));
    const close = overlay(panel);
  }
  go.addEventListener("click", review);

  const payoffBox = h("div");
  const repayBtn = btn("See payoff amount", { size: "sm", iconRight: I.arrow });
  repayBtn.addEventListener("click", () => {
    const ok = btn(["Repay ", n0(L.total_outstanding || L.outstanding), " ", rlt(), " and unlock"], { kind: "mint", size: "sm", iconRight: I.arrow });
    ok.addEventListener("click", () => busyBtn(ok, async () => { await runAction(ctx, d.ref, "repay", {}); ctx.navigate(`/deal/${d.ref}`); }));
    put(payoffBox, h("dl", { class: "es-rows tight" }, h("div", {}, h("dt", {}, "Payoff today"), h("dd", {}, money(L.total_outstanding || L.outstanding, { dec: 2 }))),
      h("div", {}, h("dt", {}, "Then"), h("dd", {}, "EscrowFinish → released"))), h("div", { class: "es-actions" }, ok));
    repayBtn.remove();
  });

  const header = h("section", { class: "es-head" }, h("div", { class: "es-wrap es-head-in" }, h("div", { class: "es-head-top" },
    h("div", {}, h("a", { class: "es-back", href: `#/deal/${d.ref}` }, I.back({ size: 15 }), `Back to ${d.ref} · ${d.customer.name}`),
      h("div", { class: "es-gap-s" }, pill(`LTV ${n0(L.ltv)}% · ${L.pill}`, L.rung === "safe" ? "ok" : "warn", { size: "sm" })),
      h("h1", {}, L.rung === "safe" ? "Safe. These are the ways to stay that way." : "Au fell. Pick one way back to safe."),
      h("p", { class: "es-muted" }, "Each option brings the loan back under 70%. Nothing moves until you approve.")),
    h("div", { class: "es-takes" }, h("div", { class: "es-eyebrow" }, "Takes about"), h("b", {}, "2 minutes")))));

  const left = [h("section", {}, h("h3", { class: "es-h3" }, "1 · Choose how"), seg),
    h("section", { class: "es-card pad", "aria-label": "See the result before you approve" },
      h("div", { class: "es-card-h" }, h("div", {}, h("h3", {}, "2 · See the result before you approve"), h("p", { class: "es-muted" }, "Solid pin = now · faded pin = after this payment")), h("div", { class: "es-ltv-row" }, big, safePill)),
      m, amountBox),
    h("div", { class: "es-notice" }, h("span", { class: "es-tile" }, I.info({ size: 16 })), h("div", {}, h("b", {}, "Nothing is sold now"), h("p", {}, "A sale is only proposed at 85%, and only with your approval. It can be partial."))),
    h("div", { class: "es-actions" }, go, btn("Cancel", { href: `#/deal/${d.ref}`, size: "lg" }))];
  const right = [h("section", { class: "es-card pad", "aria-label": "What changes" }, changes),
    h("section", { class: "es-card pad", "aria-label": "Or close it completely" }, h("div", { class: "es-eyebrow" }, "Or close it completely"),
      h("div", { class: "es-lock-h es-gap-s" }, tile2(I.unlock), h("div", {}, h("b", {}, "Repay early and unlock"), h("small", { class: "es-muted" }, ["Pay ", n0(L.total_outstanding || L.outstanding), " ", rlt(), "; the bars are released to you"]))),
      h("div", { class: "es-close-in" }, h("div", { class: "es-lock-h" }, tile2(I.unlock), h("div", {}, h("b", {}, "Released to customer", pill("OWN NODE", "own", { size: "sm" })),
        h("small", {}, `Escrow ${L.pledge_short || "—"} → `, stamp("tesSUCCESS")))),
      h("div", { class: "es-track" }, fullTrack()), h("div", { class: "es-track-l" }, h("span", {}, "Loan opened"), h("b", {}, `${L.months} of ${L.months} payments`), h("span", {}, "Paid off + released"))),
      h("div", { class: "es-actions es-gap-s" }, repayBtn), payoffBox),
    ledgerNote];
  drawAll();
  return frame(ctx, "deals", header, h("div", { class: "es-wrap" }, h("div", { class: "es-cols" }, h("div", { class: "es-col" }, left), h("div", { class: "es-col" }, right))));
}

function tile2(ic) { return h("span", { class: "es-tile green sm" }, ic({ size: 16 })); }
function fullTrack() { const i = h("i"); i.style.width = "100%"; return i; }
