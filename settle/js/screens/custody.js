/** Custody (Iteration 52) — the five ways to approve a step, explained, with each one's status on this platform.
 *  #/custody            the five, as the platform reports them (the sample's statuses in mock mode)
 *  #/custody?case=<ref> the same, plus which of the five holds that case's wallet */
import { h, replace, icon } from "../ui.js";
import { OPTIONS, statusChip } from "../custody.js";

export const name = "custody";
export const title = () => "Custody — five ways to approve";

const STEPS = {
  xaman: ["Approve & pay", "Borrow", "Pay part of the loan"],
  uphold: ["Approve & pay (from the Uphold balance)", "Pay part of the loan"],
  self: ["Approve & pay", "Borrow", "Pay part of the loan", "Lock the bar"],
  ledger: ["Approve & pay", "Borrow", "Pay part of the loan", "Lock the bar"],
  platform: ["Approve & pay", "Borrow", "Pay part of the loan", "Lock the bar", "Release to the seller"],
};
const NOTE = {
  xaman: "The key is born on the phone and never leaves it. Linking is a SignIn the app signs; later requests arrive as a push.",
  uphold: "Not a key at all: Uphold is a regulated custodian with its own controls. The platform mirrors the account and relays the quote.",
  self: "The most independent and the least forgiving: lose the seed and nobody, LiquidLabs included, can recover the wallet.",
  ledger: "A secure element signs; the browser is only the cable. The XRP app on the device knows the classic transaction types — a type it cannot display, it refuses.",
  platform: "For people who do not want to hold a key: the seed is sealed in the platform's vault, read just-in-time to sign, never logged, never shown.",
};

export async function render(ctx, p) {
  const page = h("div", { class: "ls-wrap ls-custody" });
  const vm = await ctx.source.custody(p.case || null);
  const options = (vm.options && vm.options.length ? vm.options : OPTIONS.map((o) => ({ ...o, status: "simulated" }))).map((o) => ({ ...OPTIONS.find((d) => d.id === o.id), ...o }));
  const holder = vm.holder;
  const head = h("div", { class: "top" },
    h("a", { class: "ls-brand", href: "#/" }, h("span", { class: "ls-brand-mark" }, icon.arrow({ stroke: "#0B1F1A" })), ctx.title),
    h("div", { class: "ls-nav-start" }, ctx.modeChip(), h("a", { href: "#/desk" }, "Provider desk →")));
  const intro = h("div", {},
    h("h1", {}, "Five ways to approve. One rule for all of them."),
    h("p", { class: "lede" }, "Every LiquidSettle step that moves value is approved by the person who holds the asset — never by the platform on its own. How they approve is their choice: a phone, a custodian, a seed, a hardware wallet, or the platform's vault. The chip on each is its status on ", h("b", {}, ctx.mode === "api" ? ctx.source.label : "the sample"), "; whether a given step is live or simulated is said on the step itself."));
  const holderCard = holder ? h("section", { class: "ls-cst-holder-card" },
    h("span", { class: "ls-tile" }, icon.shield()),
    h("div", {}, h("div", { class: "t" }, `This case's wallet: ${holder.name}`), h("div", { class: "ls-muted ls-small" }, `${holder.label} · `, h("code", {}, holder.address), holder.signs_in_browser ? " · signs in the browser, the platform relays" : " · signs where the custodian is")))
    : (p.case ? h("div", { class: "ls-empty" }, h("b", {}, "No wallet on this case. "), "The sample has no holder wallet; the platform's cases carry one.") : null);
  const cards = h("div", { class: "ls-cst-grid" }, ...options.map((o) => h("article", { class: "ls-cst-card" + (holder && holder.custody_type === o.id ? " mine" : "") },
    h("div", { class: "head" }, h("div", {}, h("h2", {}, o.name), h("div", { class: "ls-muted ls-small" }, o.tag)), statusChip(o.status, o.status_label)),
    h("p", {}, o.how),
    h("p", { class: "ls-small ls-muted" }, NOTE[o.id] || ""),
    o.reason ? h("p", { class: "ls-small" }, h("span", { class: "ls-muted" }, "Here: "), o.reason) : null,
    h("div", { class: "steps" }, h("span", { class: "k" }, "Signs"), ...(STEPS[o.id] || []).map((s) => h("span", { class: "ls-chip buyer" }, s))),
    o.platform_url ? h("a", { class: "ls-small ls-strong", href: o.platform_url, target: "_blank", rel: "noopener" }, (o.id === "ledger" ? "Connect a Ledger" : o.id === "xaman" ? "Link Xaman" : o.id === "uphold" ? "Uphold on the platform" : o.id === "self" ? "Create a self-custody wallet" : "Create a vault wallet") + " ↗") : null)));
  const legend = h("section", { class: "ls-cst-legend" },
    h("h2", { class: "sm" }, "What the chips mean"),
    h("div", { class: "rows" },
      h("div", {}, statusChip("live"), h("span", {}, "wired and signing on this platform's network")),
      h("div", {}, statusChip("sandbox"), h("span", {}, "wired against the provider's sandbox or mock rail — no real money")),
      h("div", {}, statusChip("simulated"), h("span", {}, "the flow is there, the credentials are not; the step is recorded, nothing signed")),
      h("div", {}, statusChip("pending"), h("span", {}, "written from the published protocol; the first run on a physical device is still to come")),
      h("div", {}, statusChip("off"), h("span", {}, "the administrators switched it off here"))),
    vm.wallets_url ? h("a", { class: "ls-btn", href: vm.wallets_url, target: "_blank", rel: "noopener" }, "Your wallets on the platform ↗") : null);
  replace(page, head, intro, holderCard, cards, legend, h("p", { class: "ls-small ls-muted" }, vm.note || ""));
  return page;
}
