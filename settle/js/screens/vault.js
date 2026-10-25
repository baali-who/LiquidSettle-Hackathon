/** Vault & borrow — use case 2, the provider's view (source/Vault.dc.html).
 *  States: loan safe · Au at 80 (top-up needed) · no loan. The three ways out are NOT here (phone only).
 *  The hero carries the journey rail (booked → locked → loan → repaid) and the ledger's latest line. */
import { h, replace, icon, fmt, rl, rlMark, liveChip, stepMode, header, envBanner, avatar, hero, rail, latest, proofCard, healthBar, ladder, pill } from "../ui.js";

export const name = "vault";
export const title = (p) => `Vault · ${p.id}`;

function railSteps(vm) {
  const hasLoan = !!vm.loan;
  const booked = vm.au_state !== "Booking in";
  const atRisk = hasLoan && vm.ltv >= 70;
  return [
    { label: "Booked in", when: vm.vault && vm.vault.id ? vm.vault.id : "", state: booked ? "done" : "now" },
    { label: "Au tokens", when: "1 per gram", state: booked ? "done" : "next", mode: stepMode(vm, "mint") },
    { label: hasLoan ? "Locked · loan" : "Free to borrow", when: hasLoan ? `${vm.loan.rate_pct}% · ${vm.loan.term_months} mo` : "up to 60%", state: hasLoan ? "done" : (booked ? "now" : "next"), mode: hasLoan ? stepMode(vm, "loan") : null },
    { label: atRisk ? "Action needed" : "Loan healthy", when: hasLoan ? `${fmt.pct(vm.ltv, vm.ltv % 1 ? 1 : 0)} of value` : "", state: hasLoan ? "now" : "next" },
    { label: "Repaid · unlocked", when: hasLoan ? vm.loan.next_date : "", state: "next" },
  ];
}

export async function render(ctx, p) {
  const vm = await ctx.source.vault(p.id, { loan: p.loan, price: p.price });
  const prov = ctx.provider;
  const hasLoan = !!vm.loan;
  let allBars = false;
  const barsBox = h("div", { class: "ls-table" });
  const drawBars = () => replace(barsBox,
    h("div", { class: "ls-thead bars" }, h("span", {}, "Serial"), h("span", {}, "Refiner"), h("span", {}, "Fineness"), h("span", {}, "Weight"), h("span", {}, "Status")),
    (allBars ? vm.bars : vm.bars.slice(0, 3)).map((b) => h("div", { class: "ls-row bars" }, h("span", { class: "ls-mono" }, b.serial), h("span", {}, b.refiner), h("span", {}, b.fineness), h("span", {}, fmt.grams(b.weight_g)), h("span", {}, pill(hasLoan ? "held" : "done", b.status)))));
  drawBars();

  const heroEl = hero({
    status: vm.au_state, statusClass: "au", chipNode: liveChip(stepMode(vm, "lock"), { onHero: true, what: "the lock" }),
    amountNode: [fmt.grams(vm.grams).replace(" g", ""), " g", h("span", { class: "au" }, "Au")],
    line: ["Worth ", rl(vm.value, { decimals: 0 }), " today. ", vm.bought_line],
    side: [h("div", {}, "Au price"), h("div", { class: "big" }, rl(vm.oracle.price, { decimals: 2 }), h("span", { class: "unit" }, "/g")), h("div", {}, `${vm.oracle.source} · ${vm.oracle.published}`)],
    rail: rail(railSteps(vm), { label: "The vault case, step by step" }),
    facts: [["Bars", `${vm.bars_count} × 1 kg`], ["Fineness", "999.9"], ["Vault", `${vm.vault.city} · ${vm.vault.id}`], ["Insured", vm.insured]],
    foot: latest(vm.timeline, { platformUrl: vm.links && vm.links.platform }),
  });
  const loanCard = h("div", { class: "ls-rule" },
    h("div", { class: "ls-card-head" }, h("span", { class: "ls-eyebrow" }, "Loan against this Au"), h("span", { class: "ls-actions" }, liveChip(stepMode(vm, "loan"), { what: "loan" }), h("span", { class: "ls-pill pilot" }, "Pilot"))),
    hasLoan ? [h("div", { class: "ls-big" }, rl(vm.loan.amount, { decimals: 0 })),
      h("dl", { class: "ls-dl rows" }, h("div", {}, h("dt", {}, "Rate · term"), h("dd", {}, `${vm.loan.rate_pct}% · ${vm.loan.term_months} months`)), h("div", {}, h("dt", {}, "Next payment"), h("dd", {}, `${fmt.money2(vm.loan.next_payment)} · ${vm.loan.next_date}`)), h("div", {}, h("dt", {}, "Outstanding"), h("dd", {}, fmt.money2(vm.loan.outstanding)))),
      h("div", { class: "ls-inset" }, icon.lockSm(), h("span", {}, "The Au is locked until the loan is repaid. It can't be moved or sold without the customer's mandate."))]
    : [h("p", { class: "ls-muted" }, `${vm.customer.name} can borrow up to`), h("div", { class: "ls-big" }, rl(vm.can_borrow.amount, { decimals: 0 })),
      h("p", { class: "ls-small ls-muted" }, `60% of today's value · ${vm.can_borrow.rate_pct}% · up to ${vm.can_borrow.term_months} months. They keep the Au; it is locked while the loan is open.`),
      h("a", { class: "ls-btn primary ls-self-start", href: ctx.href("/my/" + vm.case_id, { state: "borrow", price: vm.oracle.price }) }, "Send loan offer")]);

  const health = hasLoan ? h("section", { class: "ls-card" },
    h("div", { class: "ls-card-head" }, h("h2", {}, "Loan health"), h("span", { class: "ls-status-line" }, h("strong", { class: statusClass(vm.ltv) }, vm.status), ` · loan is ${fmt.pct(vm.ltv, vm.ltv % 1 ? 1 : 0)} of the Au's value`)),
    healthBar(vm.ltv), ladder(vm.ladder, vm.ltv),
    ctx.demo ? h("div", { class: "ls-actions" }, vm.ltv < 70
      ? h("a", { class: "ls-btn demo amber", href: ctx.href("/vault/" + vm.case_id, { price: 80 }) }, "Demo: Au drops to 80.00 / g")
      : h("a", { class: "ls-btn demo", href: ctx.href("/my/" + vm.case_id, { state: "action", price: vm.oracle.price }) }, "Demo: the customer's three ways out →")) : null) : null;

  const proof = proofCard({ sub: "Each gram is a token in the customer's wallet.", explorerUrl: vm.proof.explorer_url, platformUrl: vm.links && vm.links.platform, verifyUrl: vm.proof.verify_url, modes: vm.modes || null,
    rows: [["Au token", vm.proof.token, false], ["Held by", vm.proof.held_by], ["Registry receipt", vm.proof.registry_receipt], ["Collateral lock", vm.proof.collateral_lock], ["Price source", vm.proof.price_source, false]] });
  const sampleNote = vm.sample && ctx.mode === "api" ? h("div", { class: "ls-empty" }, h("b", {}, "Sample data. "), `The platform has no vault case ${p.id}; this is the design's example.`) : null;

  return h("div", { class: "ls-page" }, header(prov, { right: [ctx.modeChip({ dark: true }), avatar(prov.initials, prov.user)] }), envBanner(ctx),
    h("main", { class: "ls-wrap" },
      h("a", { class: "ls-back", href: "#/desk" }, icon.back(), " All settlements"), sampleNote,
      h("div", { class: "ls-title" },
        h("div", { class: "ls-title-l" }, h("span", { class: "ls-tile lg au" }, icon.vault({ stroke: "currentColor" })), h("div", { class: "ls-min0" }, h("div", { class: "ls-kicker" }, `Vault · ${vm.case_id} · ${vm.customer.name}`), h("h1", {}, `${vm.bars_count} bars stored in ${vm.vault.city}`))),
        h("div", { class: "ls-actions" }, vm.links && vm.links.platform ? h("a", { class: "ls-btn sm", href: vm.links.platform, target: "_blank", rel: "noopener" }, "On the platform ↗") : null,
          h("a", { class: "ls-btn sm", href: ctx.href("/my/" + vm.case_id, { state: hasLoan ? (vm.ltv >= 70 ? "action" : "active") : "home", price: vm.oracle.price, loan: hasLoan ? vm.loan.amount : null }) }, icon.phone({ stroke: "currentColor" }), " The customer's phone"),
          h("button", { class: "ls-btn sm", type: "button", onclick: () => navigator.clipboard && navigator.clipboard.writeText(location.href).then(() => ctx.toast("Status link copied", "ok"), () => ctx.toast(location.href)) }, "Share status link"))),
      h("section", { class: "ls-grid-2" }, heroEl, loanCard),
      health,
      h("section", { class: "ls-grid-2" },
        h("div", { class: "ls-card table" }, h("div", { class: "ls-card-head" }, h("h2", {}, "Bars in the vault"), h("button", { class: "ls-btn text", type: "button", onclick: (e) => { allBars = !allBars; e.currentTarget.textContent = allBars ? "Show fewer" : `Show all ${vm.bars_count}`; drawBars(); } }, `Show all ${vm.bars_count}`)), barsBox),
        h("aside", { class: "ls-col" }, proof))));
}
function statusClass(ltv) { return ltv < 70 ? "ok" : ltv < 80 ? "warn" : "bad"; }
