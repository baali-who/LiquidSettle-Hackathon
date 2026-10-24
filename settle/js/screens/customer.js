/** Vault & borrow — use case 2, the customer's phone (source/CustomerVault.dc.html).
 *  States: home · borrow (+ the wallet sheet) · active (loan safe) · action (Au fell: the three ways out). */
import { h, replace, icon, fmt, rl, rlMark, liveChip, brand, healthBar, threeWays, sheet, settledWith } from "../ui.js";

export const name = "customer";
export const title = () => "Your Au";

export async function render(ctx, p) {
  const vm = await ctx.source.customer(p.id, { state: p.state, price: p.price, loan: p.loan });
  const prov = ctx.provider;
  const los = vm.live_or_simulated || {};
  let state = ["home", "borrow", "sign", "active", "action"].includes(p.state) ? p.state : (vm.state || "home");
  let amount = vm.loan ? vm.loan.amount : vm.options[vm.options.length - 1];
  let picked = null, showHow = false;
  const page = h("div", { class: "ls-phone-page" });
  const monthly = (a) => a * (1 + vm.rate_pct / 100) / vm.term_months;
  const ltvOf = (a) => a / vm.value * 100;

  const draw = () => {
    const inLoan = state === "active" || state === "action";
    const head = h("div", { class: "ls-phone-head" }, brand(prov.short, null, { href: "#/vault/" + vm.case_id }),
      state === "borrow" || state === "sign" ? h("button", { class: "ls-btn text", type: "button", onclick: () => { state = "home"; draw(); } }, "Cancel") : h("span", { class: "k" }, "Your Au"));
    const top = h("section", { class: "ls-pmoney" }, h("div", { class: "row" }, h("span", { class: "st au" }, `Your Au · ${vm.vault_short || vm.vault}`), h("span", { class: "r" }, inLoan ? "Locked for your loan" : "In the vault")),
      h("div", { class: "amt" }, fmt.grams(vm.grams)), h("div", { class: "ln" }, `${vm.bars_count} bar${vm.bars_count === 1 ? "" : "s"} · worth `, h("strong", {}, rl(vm.value, { decimals: 0 })), " today"));

    let body = [];
    if (state === "home") {
      body = [
        h("section", { class: "ls-pcard" }, h("h2", { class: "sm" }, "Need cash without selling?"), h("p", { class: "s" }, "Borrow up to ", h("strong", {}, rl(vm.max_loan, { decimals: 0 })), " against your Au. It stays in the vault in your name."),
          h("button", { class: "ls-btn dark block", type: "button", onclick: () => { state = "borrow"; draw(); } }, "Borrow against my Au")),
        h("section", { class: "ls-pcard ls-list" }, h("div", { class: "item", title: "Not part of the demo" }, h("span", {}, "Ask for delivery"), h("span", { class: "chev" }, "›")), h("div", { class: "item", title: "Not part of the demo" }, h("span", {}, "Sell some Au"), h("span", { class: "chev" }, "›")),
          h("a", { href: ctx.href("/passport/" + (vm.first_serial || "ZRH-A43B12-001"), { state: "vault" }) }, h("span", {}, `Bar passport${vm.bars_count === 1 ? "" : "s"} · ${vm.bars_count}`), h("span", { class: "chev" }, "›"))),
      ];
    } else if (state === "borrow" || state === "sign") {
      body = [
        h("section", { class: "ls-pcard" }, h("h2", { class: "sm" }, "How much do you need?"),
          h("div", { class: "ls-amounts", role: "radiogroup", "aria-label": "Loan amount" }, vm.options.map((o) => h("button", { type: "button", role: "radio", class: o === amount ? "on" : "", "aria-checked": o === amount ? "true" : "false", onclick: () => { amount = o; draw(); } }, fmt.money0(o / 1000) + "k"))),
          h("dl", { class: "ls-dl rows" }, h("div", {}, h("dt", {}, "You receive"), h("dd", { class: "ls-strong" }, rl(amount, { decimals: 0 }))), h("div", {}, h("dt", {}, "Rate · term"), h("dd", {}, `${vm.rate_pct}% · ${vm.term_months} months`)),
            h("div", {}, h("dt", {}, "Monthly payment"), h("dd", {}, rl(monthly(amount)))), h("div", {}, h("dt", {}, "Loan health"), h("dd", {}, `${fmt.pct(ltvOf(amount))} of your Au · `, h("strong", { class: "ls-ok" }, "Safe")))),
          h("p", { class: "s" }, "Your Au is locked until you repay. If Au falls a lot, we'll tell you early and you can add more. We never sell without asking you first."),
          h("p", { class: "s ls-strong" }, "No fees for you.")),
        h("button", { class: "ls-btn primary block", type: "button", onclick: () => { state = "sign"; draw(); } }, "Review and approve"),
      ];
    } else {
      const ltv = vm.loan ? vm.loan.ltv : ltvOf(amount);
      const needs = state === "action" || ltv >= 70;
      body = [
        h("section", { class: "ls-pcard" },
          h("div", { class: "ls-card-head" }, h("h2", { class: "sm" }, "Your loan"), h("span", { class: "ls-pill " + (needs ? "wait" : "held") }, needs ? "Add more" : "Safe"), liveChip(los.loan || "simulated")),
          h("div", { class: "ls-big" }, rl(vm.loan ? vm.loan.amount : amount, { decimals: 0 })),
          h("div", {}, h("div", { class: "row ls-small", style: "align-items:baseline" }, h("span", { class: "ls-strong" }, "Loan health"), h("span", { class: "ls-muted ls-xs", style: "text-align:right" }, `Au ${fmt.money2(vm.oracle_price)} / g · published on the XRP Ledger`)), healthBar(ltv, { phone: true, you: true })),
          h("div", { class: "ls-health-legend" }, h("span", { class: "g" }, h("strong", {}, "Safe"), "under 70%"), h("span", { class: "a" }, h("strong", {}, "Add more"), "75–80%"), h("span", { class: "r" }, h("strong", {}, "Sale offered"), "at 85%")),
          !needs ? [h("p", { class: "s" }, "Au can fall ", h("strong", {}, `${vm.room_to_fall}%`), " before we ask you to do anything. We'll message you first, every time."),
            h("p", { class: "s ls-muted" }, "If Au fell to 80.00 / g, you would get three ways out: buy more Au, add collateral, or pay part of the loan."),
            ctx.demo ? h("a", { class: "ls-btn demo amber", href: ctx.href("/my/" + vm.case_id, { state: "action", price: 80, loan: vm.loan ? vm.loan.amount : amount }) }, "Demo: Au drops to 80.00 / g") : null]
          : threeWays(vm.remedies, { picked, onPick: (r, i) => { picked = i; draw(); } }),
          needs && picked !== null ? h("button", { class: "ls-btn primary block", type: "button", onclick: () => { const r = vm.remedies[picked]; if (r.kind === "pay") { ctx.navigate("/my/" + vm.case_id, { state: "active", price: vm.oracle_price, loan: (vm.loan ? vm.loan.amount : amount) - r.amount }); } else { ctx.toast("Buying or adding Au is not part of the demo — paying down is.", ""); } } }, "Continue") : null,
          h("dl", { class: "ls-dl rows" }, h("div", {}, h("dt", {}, "Next payment"), h("dd", {}, `${fmt.money2(vm.loan ? vm.loan.next_payment : monthly(amount))} · ${vm.loan ? vm.loan.next_date : "14 Nov"}`)), h("div", {}, h("dt", {}, "Paid into"), h("dd", {}, vm.loan ? vm.loan.paid_into : "Your wallet · today"))),
          h("button", { class: "ls-btn", type: "button", onclick: () => ctx.toast("Repaying early is not part of the demo.") }, "Repay early and unlock")),
      ];
    }
    const howBox = h("section", { class: "ls-pcard" },
      h("button", { class: "ls-expander", type: "button", onclick: () => { showHow = !showHow; draw(); } }, h("span", {}, h("span", { class: "t" }, "Proof you own it"), h("span", { class: "s" }, "Secured on the XRP Ledger")), icon.chevron()),
      h("a", { class: "ls-small ls-strong", href: vm.proof.explorer_url, target: "_blank", rel: "noopener" }, "View on the XRP Ledger ↗"),
      showHow ? h("div", { class: "ls-col", style: "gap:8px" },
        h("p", { class: "ls-small ls-muted" }, "Every gram is recorded in your wallet as an Au token, matched to the serial numbers of your bars. Only verified customers can hold it."),
        h("p", { class: "ls-small ls-muted" }, "Loans are paid in ", ...rlMark(), ", a US dollar stablecoin issued by Ripple, redeemable 1:1 for USD."),
        h("div", { class: "row ls-small" }, h("span", { class: "ls-muted" }, "Vault receipt"), h("span", { class: "ls-mono" }, vm.proof.vault_receipt)),
        vm.proof.platform_url ? h("a", { class: "ls-small ls-strong", href: vm.proof.platform_url, target: "_blank", rel: "noopener" }, "On the platform ↗") : null,
        h("a", { class: "ls-small ls-strong", href: vm.proof.explorer_url, target: "_blank", rel: "noopener" }, "Check it on a public explorer ↗")) : null);
    const sheetEl = state === "sign" ? sheet({
      body: h("ol", { class: "cons" }, h("li", {}, `Lock your ${fmt.grams(vm.grams)} of Au while the loan is open.`), h("li", {}, "Receive ", h("strong", {}, rl(amount, { decimals: 0 })), " in your wallet."), h("li", {}, "Allow a sale only if Au falls past the limit and you agree.")),
      onApprove: () => ctx.navigate("/my/" + vm.case_id, { state: "active", price: vm.oracle_price, loan: amount }), onClose: () => { state = "borrow"; draw(); } }) : null;
    replace(page, head, h("main", { class: "ls-phone-main" }, top, ...body, howBox, settledWith()), sheetEl);
  };
  draw();
  return page;
}
