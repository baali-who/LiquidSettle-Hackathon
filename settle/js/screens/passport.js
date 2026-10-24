/** Bar passport — the owner's phone (source/Passport.dc.html). States: delivered · vault. */
import { h, replace, icon, liveChip, brand, passportCard, refusalCard, dot, settledWith } from "../ui.js";

export const name = "passport";
export const title = (p) => `Bar passport · ${p.id}`;

export async function render(ctx, p) {
  const vm = await ctx.source.passport(p.id, { state: p.state });
  const prov = ctx.provider;
  let showProof = false;
  const proofBox = h("div", {});
  const drawProof = () => replace(proofBox, showProof ? h("div", { class: "ls-col", style: "gap:10px" },
    h("p", { class: "ls-small ls-muted" }, "This passport is a one-of-a-kind digital record tied to this bar's serial number. Every change of owner or location is added to it and can never be erased. Only verified people can hold it."),
    h("dl", { class: "ls-dl rows" }, h("div", {}, h("dt", {}, "Passport ID"), h("dd", { class: "ls-mono" }, vm.passport_id)), h("div", {}, h("dt", {}, "Registry leaf"), h("dd", { class: "ls-mono" }, vm.registry_leaf)), h("div", {}, h("dt", {}, "Updates"), h("dd", {}, `${vm.updates} · last ${vm.last_update}`)),
      vm.platform_url ? h("div", {}, h("dt", {}, "On the platform"), h("dd", {}, h("a", { href: vm.platform_url, target: "_blank", rel: "noopener" }, "Open ↗"))) : null),
    h("a", { class: "ls-strong ls-small", href: vm.explorer_url, target: "_blank", rel: "noopener" }, "Check it on a public explorer ↗")) : null);
  drawProof();

  return h("div", { class: "ls-phone-page" },
    h("div", { class: "ls-phone-head" }, brand(prov.short, null, { href: "#/desk" }), h("span", { class: "k" }, "Bar passport ", liveChip((vm.live_or_simulated || {}).passport || "simulated"))),
    h("main", { class: "ls-phone-main" },
      passportCard(vm),
      vm.delivered_note ? h("div", { class: "ls-note-ok" }, icon.check({ stroke: "#005C45", size: 16 }), h("span", {}, vm.delivered_note)) : null,
      vm.refusal_enforced ? refusalCard() : null,
      h("section", { class: "ls-pcard" }, h("h2", { class: "sm" }, "Chain of custody"), h("ol", { class: "ls-timeline" }, (vm.custody || []).map((c) => h("li", {}, dot(c.party), h("span", { style: "min-width:0" }, h("span", { class: "ev" }, c.who), h("span", { class: "meta" }, `${c.what} · ${c.when}`)))))),
      h("section", { class: "ls-pcard ls-docs" }, (vm.documents || []).map((d) => h("a", { href: d.url || "#", target: d.url && d.url !== "#" ? "_blank" : null, rel: "noopener" }, h("span", {}, d.name), h("span", { class: "k" }, d.kind || "PDF")))),
      h("div", { class: "ls-actions-3" },
        h("button", { class: "ls-btn", type: "button", onclick: () => share(ctx, vm) }, "Share proof"),
        h("a", { class: "ls-btn", href: ctx.href("/my/" + (vm.case_id || "LS-1044"), { state: "home" }) }, "Store or sell"),
        h("a", { class: "ls-btn outline-accent", href: ctx.href("/my/" + (vm.case_id || "LS-1044"), { state: "borrow" }) }, "Borrow")),
      h("section", { class: "ls-pcard" },
        h("button", { class: "ls-expander", type: "button", onclick: (e) => { showProof = !showProof; e.currentTarget.querySelector("svg").style.transform = showProof ? "rotate(180deg)" : ""; drawProof(); } },
          h("span", {}, h("span", { class: "t" }, "Why you can trust this"), h("span", { class: "s" }, "Secured on the XRP Ledger")), icon.chevron()),
        h("a", { class: "ls-small ls-strong", href: vm.explorer_url, target: "_blank", rel: "noopener" }, "View on the XRP Ledger ↗"),
        proofBox),
      settledWith()));
}

function share(ctx, vm) {
  const text = `Bar passport ${vm.serial} · ${vm.explorer_url}`;
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => ctx.toast("Proof link copied", "ok"), () => ctx.toast(text));
  else ctx.toast(text);
}
