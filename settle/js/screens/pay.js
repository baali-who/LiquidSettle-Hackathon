/** Approve & pay — use case 1, the buyer's phone (source/Pay.dc.html).
 *  States: request → sign (the wallet sheet) → done; or request → ach (bank transfer) → done. The price quote is
 *  held for 120 s and refreshes itself. The buyer sees "No fees for you." */
import { h, replace, icon, fmt, rl, rlMark, liveChip, brand, ledgerFoot, sheet } from "../ui.js";

export const name = "pay";
export const title = (p) => `Approve and pay · ${p.id}`;

export async function render(ctx, p) {
  const vm = await ctx.source.pay(p.id);
  const prov = ctx.provider;
  const los = vm.live_or_simulated || {};
  let state = ["request", "sign", "ach", "done"].includes(p.state) ? p.state : "request";
  let method = "usd";
  let left = vm.quote_ttl_s || 120;
  const page = h("div", { class: "ls-phone-page" });
  const timerNodes = new Set();
  const tick = () => {
    if (!page.isConnected) { clearInterval(iv); return; }
    left -= 1;
    if (left <= 0) { left = vm.quote_ttl_s || 120; note.textContent = `Price refreshed. Held for another ${fmt.mmss(left)}.`; }
    timerNodes.forEach((n) => { n.textContent = fmt.mmss(left); });
    if (state === "request" && method === "usd" && !note.textContent.startsWith("Price refreshed")) note.textContent = `Price held for ${fmt.mmss(left)}. It refreshes automatically.`;
  };
  const iv = setInterval(tick, 1000);
  const note = h("div", { class: "ls-hint" });
  const timerPill = () => { const n = h("span", { class: "ls-timer", "aria-live": "polite" }, fmt.mmss(left)); timerNodes.add(n); return n; };

  const head = h("div", { class: "ls-phone-head" }, brand(prov.short, null, { href: "#/case/" + vm.case_id }), h("span", { class: "k" }, state === "done" ? "Receipt" : "Payment request"));
  const foot = ledgerFoot("Secured on the XRP Ledger", vm.explorer_url, { platformUrl: vm.links && vm.links.platform });

  const draw = () => {
    timerNodes.clear();
    let body;
    if (state === "request" || state === "sign") {
      note.textContent = method === "usd" ? `Price held for ${fmt.mmss(left)}. It refreshes automatically.` : "No charge until your transfer arrives.";
      body = [
        h("div", {}, h("div", { class: "ls-phone-ey" }, vm.asset_line), h("h1", { class: "ls-phone-h" }, "Approve and pay")),
        h("section", { class: "ls-pmoney" }, h("div", { class: "st muted" }, "You pay ", liveChip(los.payment || "simulated", { onHero: true })), h("div", { class: "amt" }, rl(vm.amount)),
          h("div", { class: "ln" }, "Secured on the ledger until USPS takes custody of your insured package. Full refund after 10 days if it isn't shipped."), h("div", { class: "ln ls-strong" }, "No fees for you.")),
        h("ol", { class: "ls-steps" },
          h("li", { class: "ls-step" }, h("span", { class: "n done" }, icon.check({ size: 14 })), h("span", {}, h("span", { class: "st" }, "Identity verified"), h("span", { class: "ss" }, `Ships by insured USPS only to your verified address, ${vm.kyc.city}`))),
          h("li", { class: "ls-step" }, h("span", { class: "n" }, "2"), h("span", { style: "flex:1 1 auto;min-width:0" }, h("span", { class: "st" }, "Choose how to pay"),
            h("div", { class: "ls-options", role: "radiogroup", "aria-label": "Payment method" },
              h("button", { type: "button", role: "radio", class: "ls-option" + (method === "usd" ? " on" : ""), "aria-checked": method === "usd" ? "true" : "false", onclick: () => { method = "usd"; draw(); } },
                h("span", { class: "ring" }), h("span", { class: "body" }, h("span", { class: "ot" }, ...rlMark(), " balance"), h("span", { class: "os" }, `Price locked at ${fmt.money2(vm.price_per_g)} / g when you approve`)), timerPill()),
              h("button", { type: "button", role: "radio", class: "ls-option" + (method === "ach" ? " on" : ""), "aria-checked": method === "ach" ? "true" : "false", onclick: () => { method = "ach"; draw(); } },
                h("span", { class: "ring" }), h("span", { class: "body" }, h("span", { class: "ot" }, "Bank transfer (ACH)"), h("span", { class: "os" }, "Price locks when your transfer clears · 1–3 days"))))))),
        h("button", { class: "ls-btn primary block", type: "button", onclick: () => { state = method === "usd" ? "sign" : "ach"; draw(); } }, method === "usd" ? "Approve payment" : "Get transfer details"),
        note,
      ];
    } else if (state === "ach") {
      body = [
        h("div", {}, h("div", { class: "ls-phone-ey" }, vm.case_id), h("h1", { class: "ls-phone-h" }, "Send your bank transfer")),
        h("section", { class: "ls-pcard" }, h("dl", { class: "ls-dl rows", style: "border-top:0;padding-top:0" },
          h("div", {}, h("dt", {}, "Amount"), h("dd", { class: "ls-strong" }, fmt.money2(vm.amount) + " USD")), h("div", {}, h("dt", {}, "Routing · Account"), h("dd", { class: "ls-mono" }, `${vm.ach.routing} · ${vm.ach.account}`)), h("div", {}, h("dt", {}, "Reference"), h("dd", { class: "ls-mono" }, vm.ach.reference))),
          h("p", { class: "s" }, "The price locks the moment your money arrives. If Au has moved more than 2% by then, we'll ask you to confirm first.")),
        ctx.demo ? h("button", { class: "ls-btn demo", type: "button", onclick: () => { state = "done"; draw(); } }, "Demo: transfer cleared, price locked") : h("div", { class: "ls-empty" }, h("b", {}, "Waiting for the bank. "), "The price locks when the transfer clears."),
        h("button", { class: "ls-btn text", type: "button", onclick: () => { state = "request"; draw(); } }, "Change payment method"),
      ];
    } else {
      body = [
        h("div", { class: "ls-done" }, h("span", { class: "ls-done-icon" }, icon.check({ stroke: "#007A5C", size: 26 })), h("h1", { class: "ls-phone-h" }, "Your payment is secured"),
          h("p", { class: "ls-muted" }, rl(vm.amount), ` secured at ${fmt.money2(vm.price_per_g)} / g. ${prov.short} is paid only when USPS takes custody of your insured bar. Your signature on delivery moves the bar passport to you.`)),
        h("section", { class: "ls-pcard" }, h("div", { class: "row" }, h("span", { class: "ls-muted" }, "Auto-refund if not delivered"), h("span", { class: "ls-strong" }, vm.refund_label)),
          h("div", { class: "row" }, h("span", { class: "ls-muted" }, "Receipt"), h("a", { class: "ls-mono", href: vm.explorer_url, target: "_blank", rel: "noopener" }, vm.receipt)),
          h("div", { class: "row" }, h("span", { class: "ls-muted" }, "Fees"), h("span", { class: "ls-strong" }, "None for you"))),
        h("a", { class: "ls-btn dark block", href: ctx.href("/passport/" + vm.passport_serial, { state: "delivered" }) }, "See your bar passport"),
        h("a", { class: "ls-btn text", style: "align-self:center", href: ctx.href("/case/" + vm.case_id, { phase: 0 }) }, "The provider's view"),
      ];
    }
    const sheetEl = state === "sign" ? sheet({
      body: [h("p", {}, "Secure ", h("strong", {}, rl(vm.amount)), ` for ${prov.short} at ${fmt.money2(vm.price_per_g)} / g. Released only when USPS takes custody of your insured package.`), h("div", { class: "ls-timer", style: "align-self:flex-start" }, "Price held for ", timerPill())],
      onApprove: () => { state = "done"; draw(); }, onClose: () => { state = "request"; draw(); } }) : null;
    replace(page, head, h("main", { class: "ls-phone-main" }, ...body, foot), sheetEl);
  };
  draw();
  return page;
}
