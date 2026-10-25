/**
 * Vault · Money · Activity — the three other places in the bar.
 *
 *   vault     the Au in the provider's vault, bar by bar: whose it is, free or locked to a loan
 *   money     what is in escrow, released and refunded; the loans; the desks on both networks (addresses,
 *             objects — anyone can check them on the explorers)
 *   activity  every step of every deal, newest first, filtered by what the ledger said
 */
import { h, I, btn, money, kg, n0, n2, pct, pill, stamp, tile, time, short, put, mark } from "./kit.js";
import { frame } from "./shell.js";

function head(title, sub, right = null) {
  return h("div", { class: "es-pagehead" }, h("div", {}, h("h1", {}, title), h("p", {}, sub)), right);
}
function figure(iconFn, tone, label, value, sub) {
  return h("div", { class: "es-card es-kpi" }, h("div", { class: "es-kpi-h" }, tile(iconFn, tone, "sm"), h("span", { class: "es-eyebrow" }, label)),
    h("div", { class: "es-kpi-v" }, value), h("div", { class: "es-kpi-s" }, typeof sub === "string" ? mark(sub) : sub));
}
const ext = (url) => (url ? { href: url, target: url.startsWith("http") ? "_blank" : null, rel: "noopener" } : null);

export const vault = {
  name: "vault", title: () => "Vault",
  async render(ctx) {
    const v = await ctx.deals.vault();
    const rows = v.bars.map((b) => h("tr", { class: "es-tr", onclick: () => ctx.navigate(`/deal/${b.ref}`) },
      h("td", {}, h("div", { class: "es-who" }, tile(I.bar, "gold", "sm"), h("div", {}, h("b", {}, b.serial), h("small", {}, `${b.form} · ${b.refiner}`)))),
      h("td", {}, b.owner), h("td", { class: "hide-sm es-mono" }, b.ref),
      h("td", { class: "r" }, `${n0(b.grams)} g · ${b.fineness}`),
      h("td", { class: "r" }, b.locked ? pill("LOCKED · LOAN", "own", { size: "sm" }) : pill("FREE", "ok", { size: "sm" }))));
    return frame(ctx, "vault", h("div", { class: "es-wrap" },
      head(`${v.vault.vault_line}`, `Every bar the ${v.vault.short} vault holds for a customer, in the customer's name. A bar locked to a loan is pledged on our XLS-66 devnet — the ledger refuses to release it until the loan is paid off.`),
      h("div", { class: "es-kpis" },
        figure(I.vault, "gold", "In the vault", kg(v.grams), mark(`Worth ${n0(v.value)} {RL} at ${n2(v.price)}/g`)),
        figure(I.lock, "purple", "Locked to loans", kg(v.locked_grams), "CollateralLock · own node"),
        figure(I.unlock, "green", "Free", kg(v.free_grams), "The customer can sell, ship or borrow"),
        figure(I.bar, "blue", "Bars", String(v.bars.length), `Vault ${v.vault.vault_id}`)),
      h("section", { class: "es-card es-deals" }, h("div", { class: "es-deals-h" }, h("h2", {}, "Bars")),
        h("table", { class: "es-table" }, h("thead", {}, h("tr", {}, h("th", {}, "Bar"), h("th", {}, "Owner"), h("th", { class: "hide-sm" }, "Deal"), h("th", { class: "r" }, "Weight"), h("th", { class: "r" }, "Status"))),
          h("tbody", {}, rows.length ? rows : h("tr", {}, h("td", { colspan: "5" }, h("div", { class: "es-empty" }, h("b", {}, "The vault is empty"), "Bars appear when a stored deal is signed for at the vault."))))))));
  },
};

export const moneyPage = {
  name: "money", title: () => "Money",
  async render(ctx) {
    const m = await ctx.deals.money();
    const legs = m.legs.map((l) => h("tr", { class: "es-tr", onclick: () => ctx.navigate(`/deal/${l.ref}`) },
      h("td", {}, h("div", { class: "es-who" }, tile(l.state === "released" ? I.unlock : I.lock, l.state === "released" ? "green" : l.state === "refunded" ? "blue" : "purple", "sm"),
        h("div", {}, h("b", {}, l.customer), h("small", {}, `${l.ref} · ${l.network === "xls66-devnet" ? "own node" : "XRPL Testnet"}`)))),
      h("td", {}, pill(l.state === "locked" ? "IN ESCROW" : l.state.toUpperCase(), l.state === "locked" ? "own" : l.state === "released" ? "ok" : "muted", { size: "sm" })),
      h("td", { class: "hide-sm" }, l.state === "locked" ? `Refund by ${l.refund_by}` : ""),
      h("td", { class: "r amt" }, money(l.amount, { dec: 2 })),
      h("td", { class: "r" }, l.url ? h("a", { ...ext(l.url), onclick: (e) => e.stopPropagation() }, "EscrowCreate ↗") : "", " ", l.finish_url ? h("a", { ...ext(l.finish_url), onclick: (e) => e.stopPropagation() }, "Finish ↗") : "")));
    const loans = m.loans.map((l) => h("tr", { class: "es-tr", onclick: () => ctx.navigate(`/deal/${l.ref}`) },
      h("td", {}, h("div", { class: "es-who" }, tile(I.coins, "purple", "sm"), h("div", {}, h("b", {}, l.customer), h("small", {}, l.ref)))),
      h("td", { class: "r amt" }, money(l.repaid ? 0 : l.outstanding)), h("td", { class: "r" }, l.repaid ? pill("REPAID", "ok", { size: "sm" }) : pill(`LTV ${pct(l.ltv)}`, l.ltv >= 75 ? "warn" : "ok", { size: "sm" })),
      h("td", { class: "r hide-sm" }, l.repaid ? "—" : `${n2(l.periodic)} / month`)));
    const desk = (net, label) => {
      const dk = m.desks[net];
      const roles = Object.entries(dk.roles || {});
      return h("section", { class: "es-card pad" }, h("div", { class: "es-card-h" }, h("h3", {}, label), dk.complete ? pill("READY", "ok", { size: "sm" }) : pill("BUILT WITH THE FIRST DEAL", "muted", { size: "sm" })),
        roles.length ? h("dl", { class: "es-rows tight" }, roles.map(([k, r]) => h("div", {}, h("dt", {}, r.label), h("dd", {}, h("a", { class: "es-addr", ...ext(net === "xls66-devnet" ? `/devnet/account/${r.address}` : `https://testnet.xrpl.org/accounts/${r.address}`) }, short(r.address, 6, 5))))),
          Object.entries(dk.objects || {}).map(([k, v]) => h("div", {}, h("dt", {}, k.replace(/_/g, " ")), h("dd", { class: "es-addr" }, short(String(v), 8, 6))))) : h("p", { class: "es-muted" }, "No desk on this network yet."));
    };
    return frame(ctx, "money", h("div", { class: "es-wrap" },
      head("Money", "Every payment leg the engine holds in escrow, releases or refunds — each one a transaction anyone can check — and the loans the lender's vault has out."),
      h("div", { class: "es-kpis" },
        figure(I.lock, "purple", "In escrow", money(m.escrow.locked), "Released only when the proof arrives"),
        figure(I.check, "green", "Released", money(m.escrow.released), "EscrowFinish by the settlement agent"),
        figure(I.back, "blue", "Refunded", money(m.escrow.refunded), "EscrowCancel after the refund date"),
        figure(I.coins, "gold", "Lent against Au", money(m.loans.filter((l) => !l.repaid).reduce((s, l) => s + l.outstanding, 0)), "XLS-66 · own node")),
      h("section", { class: "es-card es-deals" }, h("div", { class: "es-deals-h" }, h("h2", {}, "Payment legs")),
        h("table", { class: "es-table" }, h("thead", {}, h("tr", {}, h("th", {}, "Deal"), h("th", {}, "State"), h("th", { class: "hide-sm" }, "Refund date"), h("th", { class: "r" }, "Amount"), h("th", { class: "r" }, "Ledger"))),
          h("tbody", {}, legs.length ? legs : h("tr", {}, h("td", { colspan: "5" }, h("div", { class: "es-empty" }, "No payments yet.")))))),
      loans.length ? h("section", { class: "es-card es-deals" }, h("div", { class: "es-deals-h" }, h("h2", {}, "Loans")),
        h("table", { class: "es-table" }, h("thead", {}, h("tr", {}, h("th", {}, "Borrower"), h("th", { class: "r" }, "Outstanding"), h("th", { class: "r" }, "Health"), h("th", { class: "r hide-sm" }, "Instalment"))), h("tbody", {}, loans))) : null,
      h("div", { class: "es-grid2 es-gap" }, desk("testnet", "The desk · XRPL Testnet"), desk("xls66-devnet", "The desk · XLS-66 devnet (own node)"))));
  },
};

export const activity = {
  name: "activity", title: () => "Activity",
  async render(ctx, p) {
    const a = await ctx.deals.activity();
    let filter = p.f || "all";
    let shown = 50;
    const seg = h("div", { class: "es-seg", role: "group", "aria-label": "Filter" });
    const feed = h("div", { class: "es-feed" });
    const F = [["all", "All", a.items.length], ["LIVE", "Live", a.counts.live], ["OWN NODE", "Own node", a.counts.own_node], ["REFUSED", "Refused", a.counts.refused], ["NOTE", "Off the ledger", a.counts.notes]];
    const draw = () => {
      put(seg, ...F.map(([k, t, n]) => h("button", { type: "button", "aria-pressed": filter === k ? "true" : "false", onclick: () => { filter = k; shown = 50; draw(); } }, `${t} · ${n}`)));
      const items = a.items.filter((i) => filter === "all" || i.pill === filter || (filter === "NOTE" && i.pill === "SIMULATED"));
      const more = items.length > shown ? btn(`Show ${Math.min(50, items.length - shown)} more`, { kind: "link", onclick: () => { shown += 50; draw(); } }) : null;
      put(feed, more ? [] : null, ...items.slice(0, shown).map((i) => h("div", { class: "es-act" },
        h("span", {}, pill(i.pill)),
        h("a", { class: "ref", href: i.ref ? `#/deal/${i.ref}` : "#/money" }, i.ref || "desk"),
        h("div", {}, h("b", {}, i.tx_type || "Note"), h("span", { class: "d" }, mark(i.title)), h("div", { class: "es-muted" }, i.customer, " · ", mark(i.sentence)),
          h("small", {}, `${time.dayTime(i.at)}${i.hash ? " · " + short(i.hash, 8, 4) : ""}${i.ledger_index ? " · ledger " + i.ledger_index : ""} `, i.url ? h("a", ext(i.url), "explorer ↗") : "")),
        i.result ? stamp(i.result) : h("span"))), items.length ? null : h("div", { class: "es-empty" }, "Nothing here yet."), more);
    };
    draw();
    return frame(ctx, "activity", h("div", { class: "es-wrap" },
      head("Activity", "Every step of every deal, newest first: who acted, what it was for, and what the ledger answered. A refusal is a result too — it is recorded with its hash, because it is the proof."),
      h("div", { class: "es-filter" }, seg), feed));
  },
};

export { btn };
