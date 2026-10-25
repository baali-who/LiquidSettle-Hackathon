/** Start — choose the use case (source/New.dc.html). Our own landing: brand LiquidSettle, dark. */
import { h, icon, rlMark, envBanner, header } from "../ui.js";

export const name = "start";
export const title = () => "Start";

const HOW = [
  ["1 · Verify", "Every party is known", "Buyer and seller pass KYC before any money moves. Delivery goes only to the verified name and address."],
  ["2 · Secure", "Payment is locked, not sent", "The buyer pays in regulated digital dollars, secured on the XRP Ledger. No one can open it early, not the seller and not us."],
  ["3 · Prove", "The real world confirms", "A carrier, vault, clearing house or inspector confirms the agreed condition was met. AI agents watch live market prices to keep every deal fair."],
  ["4 · Release", "Money and ownership move on proof", "The seller is paid once a trusted custodian has the asset. Its digital title passes to the buyer when they receive it. If the condition isn't met in time, the buyer is refunded automatically."],
];
const SOON = ["Real estate", "Vehicles", "Commodities", "Art & collectibles"];

export async function render(ctx) {
  // On the platform the two cards open the person's own cases (the first delivery, the first vault case the desk lists);
  // standalone they open the sample. A credential with no cases keeps the sample — the screen then says so.
  let uc1 = ctx.href("/case/LS-1042", { phase: 0 }), uc2 = ctx.href("/vault/LS-1044");
  let none1 = false, none2 = false;
  if (ctx.mode === "api") {
    // Live (Iteration 58): the person's own newest cases; without one, the card says so and opens the desk.
    uc1 = uc2 = "#/desk"; none1 = none2 = true;
    try {
      const d = await ctx.source.desk();
      const dl = (d.cases || []).find((c) => c.kind === "dl"), vt = (d.cases || []).find((c) => c.kind === "vt");
      if (dl) { uc1 = dl.href; none1 = false; }
      if (vt) { uc2 = vt.href; none2 = false; }
    } catch (e) { /* the desk says what is wrong */ }
  }
  const uc = (href, k, t, d, chips, { vault = false, none = false } = {}) => h("a", { class: "ls-uc" + (vault ? " vault" : ""), href },
    h("span", { class: "head" }, h("span", { class: "ls-tile" }, vault ? icon.vault({ stroke: "#D9B45A" }) : icon.truck({ stroke: "#01CB9A" })), h("span", { class: "k" }, k)),
    h("span", { class: "t" }, t), h("span", { class: "d" }, ...d),
    h("span", { class: "chips" }, chips.map((c) => h("span", {}, c))),
    h("span", { class: "go" }, none ? "None yet · open the desk →" : ctx.mode === "api" ? "Open the latest →" : "Open the sample →"));

  return h("div", { class: "ls-start" }, header(ctx.provider, { right: [ctx.modeChip({ dark: true })] }), h("div", { class: "ls-wrap" },
    envBanner(ctx),
    h("div", {}, h("h1", {}, "Settle real assets. Pay only when the deal is done."),
      h("p", { class: "lede" }, "The buyer's payment is secured in ", ...rlMark(), " on the XRP Ledger and released only when the agreed condition is met. Nobody can move it early.")),
    h("section", { class: "ls-how", "aria-label": "How it works" },
      h("div", { class: "lead" }, h("p", {}, h("strong", {}, "Today,"), " buying a real asset means trusting the other side. Buyers pay first and hope. Sellers deliver first and hope. Settlement drags through wires, intermediaries and paperwork."), h("span", { class: "with" }, "With LiquidSettle")),
      h("ol", {}, HOW.map(([n, t, d]) => h("li", {}, h("span", { class: "n" }, n), h("span", { class: "t" }, t), h("span", { class: "d" }, d)))),
      h("div", { class: "reg" }, h("span", { class: "ls-tile" }, icon.shield()),
        h("p", {}, h("strong", {}, "Settled in regulated digital dollars."), " Every payment moves in a compliant, US-regulated dollar stablecoin, backed 1:1 by US dollar deposits, short-term US Treasuries and cash equivalents, and redeemable for cash.")),
      h("p", { class: "result" }, "The result: settlement that compliance teams can approve and anyone can verify. Precious metals today, any real asset next, with the blockchain out of sight.")),
    h("div", {}, h("div", { class: "lab" }, "Asset"), h("div", { class: "ls-assets" }, h("span", { class: "on" }, "Precious metals"), SOON.map((s) => h("span", {}, s, h("span", { class: "k" }, "Soon"))))),
    h("div", {}, h("div", { class: "lab" }, "Choose the use case"), h("div", { class: "ls-usecases" },
      uc(uc1, "Use case 1", "Buy and deliver",
        ["The buyer's payment is secured on the ledger. The metal ships by insured USPS to their verified name and address. The seller is paid when USPS takes custody, and the buyer's signature on delivery moves the bar passport to them."],
        ["KYC first", "Payment secured", "Ship with tracking", "Release at USPS custody", "Refund after 10 days"], { none: none1 }),
      uc(uc2, "Use case 2", "Buy, keep in the vault, borrow",
        ["The metal stays in the provider's vault in the buyer's name. Whenever they want, they can borrow ", ...rlMark(), " against it without selling."],
        ["Payment secured", "Stored in your name", "Borrow up to 60%", "Repay, unlock"], { vault: true, none: none2 }))),
    h("div", { class: "foot" }, icon.lockSm(), `Running on the XRP Ledger ${ctx.network}`, ctx.mode === "api" ? null : [" · ", ctx.modeChip({ dark: true })],
      ctx.platform ? [" · ", h("a", { href: ctx.exit || ctx.platform + "/", target: "_blank", rel: "noopener" }, "The platform behind it ↗")] : null)));
}
