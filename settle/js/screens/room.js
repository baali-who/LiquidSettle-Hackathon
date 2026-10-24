/** Delivery room — use case 1, the provider's view of one settlement (source/Room.dc.html).
 *  Money first (the hero with the journey rail), the rule beside it, then summary → details → proof (collapsed).
 *  One status sentence; one line for what the ledger did last; every receipt in the proof card.
 *  Three states: secured (phase 0) · with USPS (1) · delivered (2, with the settlement receipt). */
import { h, replace, icon, fmt, rl, rlMark, chip, liveChip, stepMode, header, envBanner, avatar, hero, rail, latest, ruleCard, proofCard, person, dot } from "../ui.js";

export const name = "room";
export const title = (p) => `Delivery · ${p.id}`;

/** The five rail steps carry the chip of the ledger step they stand for (Iteration 53). */
const RAIL_MODE = [null, "payment", "usps", "release", "passport"];

export async function render(ctx, p) {
  const vm = await ctx.source.room(p.id, { phase: p.phase });
  const prov = ctx.provider;
  const fired = vm.phase === 2;
  let showAsset = false;
  const assetBox = h("div", {});
  const drawAsset = () => replace(assetBox, showAsset ? h("dl", { class: "ls-dl" },
    h("div", {}, h("dt", {}, "Serial number"), h("dd", { class: "ls-mono" }, vm.asset.serial)),
    h("div", {}, h("dt", {}, "Refiner"), h("dd", {}, vm.asset.refiner)),
    h("div", {}, h("dt", {}, "Delivery address · from KYC"), h("dd", {}, vm.asset.address_masked)),
    h("div", {}, h("dt", {}, "Price agreed"), h("dd", {}, fmt.money2(vm.price_per_g), " ", ...rlMark(), ` per gram · locked ${fmt.dayTime(vm.price_locked_at)}`)),
    h("div", {}, h("dt", {}, "Documents"), h("dd", {}, (vm.asset.documents || []).length ? vm.asset.documents.flatMap((d, i) => [i ? " · " : null, h("a", { href: d.url || "#", target: d.url && d.url !== "#" ? "_blank" : null, rel: "noopener" }, d.name)]) : h("span", { class: "ls-muted" }, "None attached"))),
    h("div", {}, h("dt", {}, "Customer reference"), h("dd", {}, vm.asset.customer_ref || "—"))) : null);
  drawAsset();

  const steps = (vm.steps || []).map((s, i) => ({ ...s, mode: RAIL_MODE[i] ? stepMode(vm, RAIL_MODE[i]) : null }));
  const heroEl = hero({
    status: vm.status_label, chipNode: liveChip(stepMode(vm, "payment"), { onHero: true, what: "payment" }),
    amountNode: rl(vm.amount), line: vm.status_sentence,
    side: [h("div", {}, vm.expect_label), h("div", { class: "big" }, vm.expect_value)],
    rail: rail(steps, { label: "The settlement, step by step" }),
    facts: [["Paid with", vm.paid_with === "balance" ? [...rlMark(), " balance"] : "Bank transfer (ACH)"], ["Au price", `${fmt.money2(vm.price_per_g)} / g · locked`], ["Carrier", vm.carrier], ["Auto-refund", fmt.dayTime(vm.refund_after)]],
    foot: latest(vm.timeline, { platformUrl: vm.links && vm.links.platform }),
  });
  const rule = ruleCard("Release rule", ["Pay ", chip("seller", prov.short), " when ", chip("carrier", "USPS"), " confirms it has taken custody of the insured package addressed to ", chip("buyer", "the buyer's"), " verified address. The bar passport moves to the buyer when they sign for it."],
    { parties: ["seller", "carrier", "buyer"], note: ["If USPS hasn't accepted it by ", h("strong", {}, fmt.dayTime(vm.refund_after)), ", the customer gets the full amount back automatically."] });

  const receipt = fired && vm.receipt ? h("section", { class: "ls-card", "aria-label": "Settlement receipt" },
    h("div", { class: "ls-card-head" }, h("div", { class: "ls-proof-head" }, h("span", { class: "ls-tile tint" }, icon.receipt({ stroke: "#007A5C" })), h("div", {}, h("div", { class: "t" }, "Settlement receipt"), h("div", { class: "s" }, `${vm.case_id} · closed ${vm.receipt.closed_at}`))),
      h("div", { class: "ls-actions" }, vm.links && vm.links.receipt ? h("a", { class: "ls-btn sm", href: vm.links.receipt, target: "_blank", rel: "noopener" }, "Receipt on the platform ↗") : h("button", { class: "ls-btn sm", type: "button", onclick: () => copy(ctx, location.href, "Status link copied") }, "Share receipt"),
        h("a", { class: "ls-btn sm", href: vm.proof.verify_url || vm.proof.explorer_url, target: "_blank", rel: "noopener" }, "Verify on the ledger ↗"))),
    h("dl", { class: "ls-dl r4" },
      h("div", {}, h("dt", {}, "Seller"), h("dd", {}, dot("seller"), " ", vm.receipt.seller)), h("div", {}, h("dt", {}, "Buyer"), h("dd", {}, dot("buyer"), " ", vm.receipt.buyer)),
      h("div", {}, h("dt", {}, "Asset"), h("dd", {}, vm.receipt.asset)), h("div", {}, h("dt", {}, "Amount"), h("dd", {}, rl(vm.receipt.amount))),
      h("div", {}, h("dt", {}, "Condition met"), h("dd", {}, dot("carrier"), " ", vm.receipt.condition)), h("div", {}, h("dt", {}, "Payment receipt"), h("dd", { class: "ls-mono" }, vm.receipt.payment_receipt)),
      h("div", {}, h("dt", {}, "Release receipt"), h("dd", { class: "ls-mono" }, vm.receipt.release_receipt)), h("div", {}, h("dt", {}, "Passport transfer"), h("dd", { class: "ls-mono" }, vm.receipt.passport_receipt)))) : null;

  // the shipment
  const demoBtn = demoControl(ctx, vm);
  const shipment = h("div", { class: "ls-card" },
    h("div", { class: "ls-card-head" }, h("h2", {}, "Shipment ", liveChip(stepMode(vm, "usps"), { what: "USPS scans" })),
      vm.usps && vm.usps.tracking_number ? h("a", { class: "ls-track-link", href: vm.usps.url, target: "_blank", rel: "noopener" }, icon.truck({ stroke: "#007A5C" }), " Track with USPS · ", h("span", { class: "ls-mono" }, vm.usps.display || vm.usps.tracking_number), " ↗")
        : h("span", { class: "ls-muted ls-small" }, "No tracking number yet")),
    h("p", { class: "ls-muted" }, "USPS Registered Mail, insured, signature required, to the verified name and address. The USPS acceptance scan releases the payment. The buyer's signature on delivery moves the bar passport to them."),
    vm.usps && vm.usps.events && vm.usps.events.length ? h("ol", { class: "ls-track" }, vm.usps.events.map((e) => h("li", {},
      h("span", { class: "tdot" + (e.state === "next" ? " next" : "") }), h("span", { class: "ls-min0" }, h("span", { class: "ttl" + (e.state === "next" ? " next" : "") }, e.title), h("span", { class: "place" }, e.place)), h("span", { class: "when" }, e.when))))
      : h("div", { class: "ls-empty" }, h("b", {}, "No scans yet. "), "USPS events appear here as the carrier reports them."),
    vm.links && vm.links.shipment ? h("a", { class: "ls-small ls-strong", href: vm.links.shipment, target: "_blank", rel: "noopener" }, "The parcel on the platform ↗") : null,
    demoBtn);

  const asset = h("div", { class: "ls-card" },
    h("div", { class: "ls-card-head" }, h("h2", {}, "The asset"), h("button", { class: "ls-btn text", type: "button", "aria-expanded": "false", onclick: (e) => { showAsset = !showAsset; e.currentTarget.textContent = showAsset ? "Fewer details" : "All details"; e.currentTarget.setAttribute("aria-expanded", showAsset ? "true" : "false"); drawAsset(); } }, "All details")),
    h("div", { class: "ls-facts" }, h("div", {}, h("div", { class: "lbl" }, "Weight"), h("div", { class: "val" }, fmt.grams(vm.asset.weight_g))), h("div", {}, h("div", { class: "lbl" }, "Fineness"), h("div", { class: "val" }, vm.asset.fineness)), h("div", {}, h("div", { class: "lbl" }, "Delivers to"), h("div", { class: "val" }, vm.asset.delivers_to))),
    assetBox);

  const people = h("div", { class: "ls-card" }, h("h2", {}, "People"), (vm.people || []).map(person));
  const proof = proofCard({ sub: "No one can move these funds early.", explorerUrl: vm.proof.explorer_url, platformUrl: vm.links && vm.links.platform, verifyUrl: vm.proof.verify_url, modes: vm.modes || null,
    rows: [["Payment receipt", vm.proof.payment_receipt], ["Escrow", vm.proof.escrow_id], ["Release receipt", vm.proof.release_receipt], ["Passport transfer", vm.proof.passport_receipt], ["Auto-refund from", vm.proof.refund_from, false], ["Customer verified", vm.proof.customer_verified, false]] });

  const sampleNote = vm.sample && ctx.mode === "api" ? h("div", { class: "ls-empty" }, h("b", {}, "Sample data. "), `The platform has no settlement ${p.id}${vm._why ? " (" + vm._why + ")" : ""}; this is the design's example.`) : null;

  return h("div", { class: "ls-page" }, header(prov, { right: [ctx.modeChip(), avatar(prov.initials, prov.user)] }), envBanner(ctx),
    h("main", { class: "ls-wrap" },
      h("a", { class: "ls-back", href: "#/desk", "aria-label": "Back to all settlements" }, icon.back(), " All settlements"),
      sampleNote,
      h("div", { class: "ls-title" },
        h("div", { class: "ls-title-l" }, h("span", { class: "ls-tile lg au" }, "Au"), h("div", { class: "ls-min0" }, h("div", { class: "ls-kicker" }, `Au · ${vm.case_id} · for ${vm.buyer.name}`), h("h1", {}, vm.asset.title))),
        h("div", { class: "ls-actions" },
          vm.links && vm.links.platform ? h("a", { class: "ls-btn sm", href: vm.links.platform, target: "_blank", rel: "noopener" }, "On the platform ↗") : null,
          h("a", { class: "ls-btn sm", href: ctx.href("/pay/" + vm.case_id, { state: vm.phase >= 1 ? "done" : "request" }) }, icon.phone({ stroke: "currentColor" }), " The buyer's phone"),
          h("button", { class: "ls-btn sm", type: "button", onclick: () => copy(ctx, location.href, "Status link copied") }, "Share status link"))),
      h("section", { class: "ls-grid-2" }, heroEl, rule),
      receipt,
      h("section", { class: "ls-grid-2" }, h("div", { class: "ls-col" }, shipment), h("aside", { class: "ls-col" }, people, asset, proof))));
}

function demoControl(ctx, vm) {
  if (!ctx.demo) return null;
  if (vm.phase >= 2) return h("a", { class: "ls-btn demo", href: ctx.href("/passport/" + vm.asset.serial, { state: "delivered" }) }, "Demo: open the buyer's bar passport →");
  const label = vm.phase === 0 ? "Demo: USPS scans the package in" : "Demo: the buyer signs for the delivery";
  if (vm.simulate && vm.simulate.sref && ctx.mode === "api") {
    return h("button", { class: "ls-btn demo", type: "button", onclick: async (e) => {
      e.currentTarget.disabled = true;
      try { await ctx.source.simulate(vm.case_id, vm.simulate.sref, vm.phase === 0 ? "next" : "deliver"); ctx.toast("The simulator advanced the parcel", "ok"); ctx.rerender(); }
      catch (err) { ctx.toast(err.message || "The simulator refused", "err"); e.currentTarget.disabled = false; }
    } }, label + " (platform simulator)");
  }
  return h("a", { class: "ls-btn demo", href: ctx.href("/case/" + vm.case_id, { phase: vm.phase + 1 }) }, label);
}

function copy(ctx, text, msg) {
  const done = () => ctx.toast(msg, "ok");
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => ctx.toast(text, ""));
  else ctx.toast(text, "");
}
