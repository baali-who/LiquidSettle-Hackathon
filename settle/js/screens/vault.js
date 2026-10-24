/** Vault & borrow — use case 2, the provider's view (source/Vault.dc.html).
 *  States: loan safe · Au at 80 (top-up needed) · no loan. The three ways out are NOT here (phone only). */
import { h, replace, icon, fmt, rl, rlMark, liveChip, header, avatar, hero, proofCard, timeline, healthBar, ladder, pill } from "../ui.js";

export const name = "vault";
export const title = (p) => `Vault · ${p.id}`;

export async function render(ctx, p) {
  const vm = await ctx.source.vault(p.id, { loan: p.loan, price: p.price });
  const prov = ctx.provider;
  const los = vm.live_or_simulated || {};
  const hasLoan = !!vm.loan;
  let allBars = false;
  const barsBox = h("div", { class: "ls-table" });
  const drawBars = () => replace(barsBox,
    h("div", { class: "ls-thead bars" }, h("span", {}, "Serial"), h("span", {}, "Refiner"), h("span", {}, "Fineness"), h("span", {}, "Weight"), h("span", {}, "Status")),
    (allBars ? vm.bars : vm.bars.slice(0, 3)).map((b) => h("div", { class: "ls-row bars" }, h("span", { class: "ls-mono" }, b.serial), h("span", {}, b.refiner), h("span", {}, b.fineness), h("span", {}, fmt.grams(b.weight_g)), h("span", {}, pill(hasLoan ? "held" : "done", b.status)))));
  drawBars();

  const heroEl = hero({
    status: vm.au_state, statusClass: "au", chipNode: liveChip(los.lock || "simulated", { onHero: true, what: "the lock" }),
    amountNode: [fmt.grams(vm.grams).replace(" g", ""), " g", h("span", { class: "au" }, "Au")],
    line: ["Worth ", rl(vm.value, { decimals: 0 }), " today. ", vm.bought_line],
    side: [h("div", {}, "Au price"), h("div", { class: "big" }, rl(vm.oracle.price, { decimals: 2 }), h("span", { class: "unit" }, "/g")), h("div", {}, `${vm.oracle.source} · ${vm.oracle.published}`)],
    facts: [["Bars", `${vm.bars_count} × 1 kg`], ["Fineness", "999.9"], ["Vault", `${vm.vault.city} · ${vm.vault.id}`], ["Insured", vm.insured]],
  });
  const loanCard = h("div", { class: "ls-rule" },
    h("div", { class: "ls-card-head" }, h("span", { class: "ls-eyebrow" }, "Loan against this Au"), h("span", { class: "ls-actions" }, liveChip(los.loan || "simulated", { what: "loan" }), h("span", { class: "ls-pill pilot" }, "Pilot"))),
    hasLoan ? [h("div", { class: "ls-big" }, rl(vm.loan.amount, { decimals: 0 })),
      h("dl", { class: "ls-dl rows" }, h("div", {}, h("dt", {}, "Rate · term"), h("dd", {}, `${vm.loan.rate_pct}% · ${vm.loan.term_months} months`)), h("div", {}, h("dt", {}, "Next payment"), h("dd", {}, `${fmt.money2(vm.loan.next_payment)} · ${vm.loan.next_date}`)), h("div", {}, h("dt", {}, "Outstanding"), h("dd", {}, fmt.money2(vm.loan.outstanding)))),
      h("div", { class: "ls-inset" }, icon.lockSm({ stroke: "#5B6B66" }), h("span", {}, "The Au is locked until the loan is repaid. It can't be moved or sold without the customer's mandate."))]
    : [h("p", { class: "ls-muted" }, `${vm.customer.name} can borrow up to`), h("div", { class: "ls-big" }, rl(vm.can_borrow.amount, { decimals: 0 })),
      h("p", { class: "ls-small ls-muted" }, `60% of today's value · ${vm.can_borrow.rate_pct}% · up to ${vm.can_borrow.term_months} months. They keep the Au; it is locked while the loan is open.`),
      h("a", { class: "ls-btn primary", href: ctx.href("/my/" + vm.case_id, { state: "borrow", price: vm.oracle.price }) }, "Send loan offer")]);

  const health = hasLoan ? h("section", { class: "ls-card" },
    h("div", { class: "ls-card-head" }, h("h2", {}, "Loan health"), h("span", { class: "ls-status-line" }, h("strong", { class: statusClass(vm.ltv) }, vm.status), ` · loan is ${fmt.pct(vm.ltv, vm.ltv % 1 ? 1 : 0)} of the Au's value`)),
    healthBar(vm.ltv), ladder(vm.ladder, vm.ltv),
    ctx.demo ? h("div", { class: "ls-actions" }, vm.ltv < 70
      ? h("a", { class: "ls-btn demo amber", href: ctx.href("/vault/" + vm.case_id, { price: 80 }) }, "Demo: Au drops to 80.00 / g")
      : h("a", { class: "ls-btn demo", href: ctx.href("/my/" + vm.case_id, { state: "action", price: vm.oracle.price }) }, "Demo: the customer's three ways out →")) : null) : null;

  const proof = proofCard({ sub: "Each gram is a token in the customer's wallet.", explorerUrl: vm.proof.explorer_url, platformUrl: vm.links && vm.links.platform, verifyUrl: vm.proof.verify_url,
    rows: [["Au token", vm.proof.token, false], ["Held by", vm.proof.held_by], ["Registry receipt", vm.proof.registry_receipt], ["Collateral lock", vm.proof.collateral_lock], ["Price source", vm.proof.price_source, false]] });
  const tl = h("div", { class: "ls-card" }, h("div", { class: "ls-card-head" }, h("h2", {}, "Timeline"), h("span", { class: "ls-xs ls-muted" }, "newest first")), timeline(vm.timeline || [], { vault: true, parties: ["seller", "buyer", "ledger"] }));
  const sampleNote = vm.sample && ctx.mode === "api" ? h("div", { class: "ls-empty" }, h("b", {}, "Sample data. "), `The platform has no vault case ${p.id}; this is the design's example.`) : null;

  return h("div", { class: "ls-page" }, header(prov, { right: [ctx.modeChip(), avatar(prov.initials, prov.user)] }),
    h("main", { class: "ls-wrap" },
      h("a", { class: "ls-back", href: "#/desk" }, icon.back(), " All settlements"), sampleNote,
      h("div", { class: "ls-title" },
        h("div", { class: "ls-title-l" }, h("span", { class: "ls-tile lg au" }, icon.vault({ stroke: "#7A5A10" })), h("div", {}, h("div", { class: "ls-kicker" }, `Vault · ${vm.case_id} · ${vm.customer.name}`), h("h1", {}, `${vm.bars_count} bars stored in ${vm.vault.city}`))),
        h("div", { class: "ls-actions" }, vm.links && vm.links.platform ? h("a", { class: "ls-btn sm", href: vm.links.platform, target: "_blank", rel: "noopener" }, "On the platform ↗") : null,
          h("a", { class: "ls-btn sm", href: ctx.href("/my/" + vm.case_id, { state: hasLoan ? (vm.ltv >= 70 ? "action" : "active") : "home", price: vm.oracle.price, loan: hasLoan ? vm.loan.amount : null }) }, icon.phone({ stroke: "#0B1F1A" }), " The customer's phone"),
          h("button", { class: "ls-btn sm", type: "button", onclick: () => navigator.clipboard && navigator.clipboard.writeText(location.href).then(() => ctx.toast("Status link copied", "ok"), () => ctx.toast(location.href)) }, "Share status link"))),
      h("section", { class: "ls-grid-2" }, heroEl, loanCard),
      health,
      h("section", { class: "ls-grid-2" },
        h("div", { class: "ls-card table" }, h("div", { class: "ls-card-head" }, h("h2", {}, "Bars in the vault"), h("button", { class: "ls-btn text", type: "button", onclick: (e) => { allBars = !allBars; e.currentTarget.textContent = allBars ? "Show fewer" : `Show all ${vm.bars_count}`; drawBars(); } }, `Show all ${vm.bars_count}`)), barsBox),
        h("aside", { class: "ls-col" }, proof, tl))));
}
function statusClass(ltv) { return ltv < 70 ? "ok" : ltv < 80 ? "warn" : "bad"; }
