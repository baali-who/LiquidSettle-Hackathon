/** Presenter — provider desk and the buyer's phone side by side, stepped through (source/Presenter.dc.html).
 *  Two scenarios × three steps. Every step says Live or Simulated; every ledger event has Verify ↗. */
import { h, icon, fmt, rl, rlMark, chip, liveChip, modeChip, brand, timeline, progress, healthBar, ledgerFoot, settledWith } from "../ui.js";

export const name = "presenter";
export const title = () => "Presenter";

const SCEN = [["delivery", "1 · Buy & deliver"], ["vault", "2 · Vault & borrow"]];
const LABELS = { delivery: ["Payment secured", "USPS takes custody", "Delivered & signed"], vault: ["Loan active", "Au drops to 80", "Buyer pays down"] };

export async function render(ctx, p) {
  const scenario = p.scenario === "vault" ? "vault" : "delivery";
  const step = Math.min(2, Math.max(0, Number(p.step) || 0));
  const vm = await ctx.source.presenter(scenario, step);
  const prov = ctx.provider;
  const go = (s, st) => ctx.href("/presenter", { scenario: s, step: st });
  const isD = scenario === "delivery";
  const d = vm.desk;
  const los = d.live_or_simulated || {};
  const simWhat = isD ? (los.usps === "live" ? "USPS scans live" : "USPS scan simulated") : (los.loan === "live" ? "loan live" : "loan simulated");
  const mode = modeChip((vm.sample ? "Sample data" : ctx.source.label) + " · " + simWhat, { live: !vm.sample, dark: true });

  const bar = h("div", { class: "ls-pbar" }, h("span", { class: "t" }, "Presenter"),
    h("div", { class: "sc", role: "tablist", "aria-label": "Scenario" }, SCEN.map(([k, l]) => h("a", { role: "tab", class: "ls-pbar-tab" + (k === scenario ? " on" : ""), "aria-selected": k === scenario ? "true" : "false", href: go(k, 0) }, l))),
    mode,
    h("ol", { "aria-label": "Demo steps" }, LABELS[scenario].map((l, i) => h("li", {}, h("a", { class: "ls-pbar-step" + (i === step ? " on" : i < step ? " done" : ""), href: go(scenario, i) }, `${i + 1} · ${l}`)))),
    h("a", { class: "next", href: step < 2 ? go(scenario, step + 1) : go(isD ? "vault" : "delivery", 0) }, step < 2 ? "Next step →" : "Next scenario →"),
    h("a", { class: "ls-pbar-exit", href: "#/" }, "Exit"));

  // ── the provider desk ──────────────────────────────────────────────────────
  let heroInner, rule;
  if (isD) {
    heroInner = [h("div", { class: "ls-hero-status" }, h("span", { class: "ls-dot" }), d.status_label, " ", liveChip(los.payment || "simulated", { onHero: true })),
      h("div", { class: "ls-hero-amount" }, rl(d.amount)), h("p", { class: "ls-hero-line" }, d.status_sentence), progress(d.steps, { compact: true })];
    rule = h("div", { class: "ls-rule" }, h("div", { class: "ls-eyebrow" }, "Release rule"),
      h("p", { class: "rule" }, "Pay ", chip("seller", prov.short), " when ", chip("carrier", "USPS"), " confirms custody of the insured package addressed to ", chip("buyer", "the buyer's"), " verified address. The passport moves on signature."));
  } else {
    heroInner = [h("div", { class: "ls-hero-status au" }, h("span", { class: "ls-dot" }), d.au_state, " ", liveChip(los.loan || "simulated", { onHero: true })),
      h("div", { class: "ls-hero-amount" }, rl(d.loan ? d.loan.amount : 0, { decimals: 0 }), h("span", { class: "unit" }, `loan · Au worth ${fmt.money0(d.value)}`)), h("p", { class: "ls-hero-line" }, d.status_sentence),
      healthBar(d.ltv, { ticks: true })];
    rule = h("div", { class: "ls-rule" }, h("div", { class: "ls-eyebrow" }, "Price source"),
      h("p", { class: "rule" }, "An ", chip("buyer", "AI price agent"), ` publishes Au at ${fmt.money2(d.oracle.price)} / g on the XRP Ledger (${d.oracle.time}). `, chip("seller", prov.short), " acts on the ladder: tell at 70, top-up at 75, flag at 80, propose a sale at 85 with the ", chip("buyer", "customer's"), " approval."));
  }
  const desk = h("section", { class: "ls-pdesk", "aria-label": "Provider desk" },
    h("div", { class: "ls-header-in" }, brand(prov.short, `Provider desk · ${d.case_id}`, { href: isD ? ctx.href("/case/" + d.case_id, { phase: step }) : ctx.href("/vault/" + d.case_id, { price: d.oracle ? d.oracle.price : 100 }) })),
    h("div", { class: "ls-pdesk-body" },
      h("div", { class: "ls-col" }, h("div", { class: "ls-hero" }, ...heroInner), rule),
      h("div", { class: "ls-card tight" }, h("div", { class: "ls-card-head" }, h("h2", { class: "sm" }, "Timeline"), h("span", { class: "ls-xs ls-muted" }, "newest first")), timeline(vm.timeline || [], { vault: !isD }))));

  // ── the buyer's phone ──────────────────────────────────────────────────────
  const ph = vm.phone;
  const cust = vm.customer;
  const phoneBody = [h("div", { class: "ls-phone-ey" }, ph.eyebrow), h("h3", { class: "ls-phone-h" }, ph.headline)];
  if (ph.passport) phoneBody.push(h("div", { class: "ls-passport" }, h("div", { class: "row", style: "display:flex;justify-content:space-between" }, h("span", { class: "lab" }, "Bar passport"), h("span", { class: "ls-authentic" }, "Authentic")),
    h("div", { class: "serial" }, ph.passport.serial), h("div", { class: "ls-strong" }, ph.passport.line), h("div", { class: "ls-small" }, "Owner · ", h("strong", {}, ph.passport.owner))));
  if (ph.money) phoneBody.push(h("div", { class: "ls-pmoney" }, h("div", { class: "st" }, ph.money.state), h("div", { class: "amt" }, rl(ph.money.amount)), h("div", { class: "ln" }, ph.money.line)));
  if (!isD && cust) {
    const ltv = cust.loan ? cust.loan.ltv : cust.ltv;
    phoneBody.push(h("div", { class: "ls-pcard" }, h("div", { class: "row", style: "display:flex;justify-content:space-between;gap:8px" }, h("strong", {}, "Loan health"), h("span", { class: "ls-small ls-muted" }, ltv < 70 ? "Safe" : ltv < 80 ? "Add more" : "At risk")),
      healthBar(ltv, { phone: true, you: true }), h("div", { class: "ls-xs ls-muted" }, `Au ${fmt.money2(cust.oracle_price)} / g · published on the XRP Ledger`)));
    if (step === 1) phoneBody.push(h("div", { class: "ls-ways" }, h("div", { class: "t" }, "Au fell. Pick one way to get back to safe."),
      cust.remedies.map((r, i) => i < 2 ? h("div", { class: "ls-way" }, h("span", {}, h("span", { class: "wt" }, r.title)), h("strong", {}, fmt.grams(r.amount)))
        : h("a", { class: "ls-way on", href: go(scenario, 2) }, h("span", {}, h("span", { class: "wt" }, r.title)), h("strong", {}, rl(r.amount, { decimals: 0 })))),
      h("div", { class: "foot" }, "Nothing is sold now. A sale is only proposed at 85%, and only with your approval.")));
  }
  phoneBody.push(h("div", { class: "ls-pcard" }, h("div", { class: "t" }, ph.note.title), h("div", { class: "s" }, ph.note.amount ? [h("strong", {}, rl(ph.note.amount, { decimals: Number(ph.note.amount) % 1 ? 2 : 0 })), " "] : null, ph.note.body)));
  const ledger = (vm.timeline || []).find((t) => t.explorer_url);
  phoneBody.push(ledgerFoot("Secured on the XRP Ledger", ledger ? ledger.explorer_url : ctx.explorer, { platformUrl: d.links && d.links.platform }));
  const phoneHref = isD ? (step === 2 ? ctx.href("/passport/" + d.asset.serial, { state: "delivered" }) : ctx.href("/pay/" + d.case_id, { state: step === 0 ? "request" : "done" }))
                        : ctx.href("/my/" + d.case_id, { state: step === 1 ? "action" : "active", price: d.oracle.price, loan: d.loan ? d.loan.amount : null });
  const phone = h("section", { class: "ls-phone", "aria-label": "Buyer phone" }, h("div", { class: "ls-phone-screen" },
    h("div", { class: "ls-phone-head" }, brand(prov.short, null, { href: phoneHref }), h("a", { class: "k", href: phoneHref, title: "Open the full phone screen" }, "Open ↗")),
    h("div", { class: "ls-phone-main" }, ...phoneBody, settledWith())));

  return h("div", { class: "ls-presenter" }, bar, h("div", { class: "ls-pstage" }, desk, phone));
}
