/** Deals — every deal on one page, filtered by where it stands (the desk's table, without the limit). */
import { h, I, btn } from "./kit.js";
import { frame } from "./shell.js";
import { dealsTable, needsCard } from "./home.js";
import { openNewDeal } from "./newdeal.js";

export const name = "deals";
export const title = () => "Deals";

export async function render(ctx, p) {
  const home = await ctx.deals.home();
  ctx.cache.home = home;
  return frame(ctx, "deals", h("div", { class: "es-wrap" },
    h("div", { class: "es-pagehead" }, h("div", {}, h("h1", {}, "Deals"), h("p", {}, "Every deal the desk walks — a purchase in six steps on the XRPL Testnet, a loan on our XLS-66 Collateral Lending devnet. Open one to see each step's transaction.")),
      ctx.operator ? btn("New deal", { kind: "mint", icon: I.plus, onclick: () => openNewDeal(ctx) }) : null),
    home.needs.length ? needsCard(ctx, home) : null,
    dealsTable(ctx, home.deals, { limit: 0, tab: p.tab || "all", q: p.q || "", sample: ctx.sample, onState: ({ tab }) => history.replaceState(null, "", ctx.href("/deals", { tab })) })));
}
