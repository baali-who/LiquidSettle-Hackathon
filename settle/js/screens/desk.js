/** Provider desk — everything moving on its own (source/Main.dc.html). */
import { h, replace, icon, fmt, rl, pill, header, envBanner, avatar } from "../ui.js";

export const name = "desk";
export const title = () => "Settlement desk";

const TABS = [["all", "All"], ["dl", "Delivery"], ["vt", "Vault & loans"], ["active", "In progress"]];

export async function render(ctx, p) {
  const d = await ctx.source.desk();
  const prov = d.provider || ctx.provider;
  ctx.provider = { ...ctx.provider, ...prov };
  let tab = p.tab && TABS.some(([k]) => k === p.tab) ? p.tab : "all";

  const nav = h("nav", { class: "ls-nav", "aria-label": "Main" }, h("a", { href: "#/desk", class: "on" }, "Settlements"),
    ["Customers", "Release rules", "Statements"].map((l) => h("a", { href: "#/desk", class: "soon", title: "Not part of the demo", "aria-disabled": "true" }, l)));
  const right = [h("a", { class: "ls-btn sm", href: "#/", title: "The use cases" }, "+ New Au sale"), ctx.modeChip(), avatar(prov.initials || "JO", prov.user)];

  const kpi = d.kpis;
  const kpis = h("section", { class: "ls-kpis", "aria-label": "Summary" },
    h("div", { class: "ls-kpi dark" }, h("div", { class: "l" }, "Payments secured"), h("div", { class: "v" }, rl(kpi.secured_total, { decimals: 0 })), h("div", { class: "s" }, `${kpi.deliveries_count} deliveries · ${kpi.due_next}`)),
    h("div", { class: "ls-kpi" }, h("div", { class: "l" }, "Customer Au in your vault"), h("div", { class: "v" }, (kpi.vault_grams / 1000).toFixed(1) + " kg"), h("div", { class: "s" }, rl(kpi.vault_value, { decimals: 0 }), ` · ${fmt.money0(kpi.lent_total)} lent against it`)),
    h("div", { class: "ls-kpi" }, h("div", { class: "l" }, "In progress · automatic"), h("div", { class: "v" }, String(kpi.in_progress)), h("div", { class: "s" }, kpi.in_progress_detail)),
    h("div", { class: "ls-kpi" }, h("div", { class: "l" }, `Settled in ${kpi.month}`), h("div", { class: "v" }, fmt.money0(kpi.settled_month_total)), h("div", { class: "s" }, `${kpi.paid_count} paid · ${kpi.refunded_count} refunded`)));

  const rowsEl = h("div", { class: "ls-table" });
  const tabsEl = h("div", { class: "ls-tabs", role: "tablist", "aria-label": "Filter" });
  const draw = () => {
    replace(tabsEl, TABS.map(([k, l]) => h("button", { role: "tab", class: k === tab ? "on" : "", "aria-selected": k === tab ? "true" : "false", onclick: () => { tab = k; draw(); } }, l)));
    const rows = d.cases.filter((c) => tab === "all" || (tab === "active" ? c.active : c.kind === tab));
    replace(rowsEl,
      h("div", { class: "ls-thead" }, h("span", {}, "What"), h("span", {}, "Customer"), h("span", { class: "r" }, "Amount"), h("span", {}, "Status"), h("span", { class: "r" }, "Next")),
      rows.length ? rows.map((r) => h("a", { class: "ls-row", href: r.href },
        h("span", { class: "what" }, h("span", { class: "ic " + (r.tone === "done" || r.tone === "back" ? "done" : r.kind) }, r.kind === "dl" ? "Dl" : "Vt"),
          h("span", { class: "ls-min0" }, h("span", { class: "ttl" }, r.title), h("span", { class: "sub" }, (r.kind === "dl" ? "Delivery" : "Vault") + " · " + r.id))),
        h("span", {}, r.customer),
        h("span", { class: "amt" }, rl(r.amount)),
        h("span", { class: "ls-min0" }, pill(r.tone, r.status), h("span", { class: "detail" }, r.detail)),
        h("span", { class: "next" }, r.next)))
      : h("div", { class: "ls-empty" }, h("b", {}, "Nothing here. "), "No settlement matches this filter."));
  };
  draw();

  return h("div", { class: "ls-page" }, header(prov, { nav, right }), envBanner(ctx),
    h("main", { class: "ls-wrap" },
      h("div", {}, h("div", { class: "ls-kicker" }, fmt.weekday(d.today)), h("h1", { class: "ls-h1" }, `${d.greeting}, ${(prov.user || "").split(" ")[0]}.`), h("p", { class: "ls-lede" }, d.status_sentence)),
      kpis,
      h("section", { class: "ls-card table" }, h("div", { class: "ls-card-head" }, h("h2", {}, "Settlements"), tabsEl), rowsEl),
      h("section", { class: "ls-soon-strip" }, h("div", {}, h("div", { class: "t" }, "Au today. The same settlement for other assets next."), h("div", { class: "s" }, "Each asset gets its own release rule: delivery, closing sign-off or inspection.")),
        h("div", { class: "ls-assets-soon" }, (d.soon || []).map((s) => h("span", { class: "ls-soon" }, s, " · ", h("span", { class: "k" }, "soon"))))),
      h("div", { class: "ls-ledger-foot" }, icon.lockSm(), `Every settlement is held and released on the XRP Ledger. ${prov.short} never holds customer funds.`,
        ctx.platform ? h("a", { class: "ls-btn sm", href: ctx.platform + "/liquidgate/", target: "_blank", rel: "noopener" }, "The platform's audit view ↗") : h("button", { class: "ls-btn sm", type: "button", onclick: () => ctx.toast("Read-only audit links are issued by the platform (an API key with the read scope).") }, "Share read-only audit link"),
        d.sample ? h("span", { class: "ls-sample" }, ctx.settleMode === "mock" && ctx.platform ? "Sample data · SETTLE_MODE=mock" : "Sample data") : h("span", { class: "ls-sample" }, "Live from ", ctx.source.label))));
}
