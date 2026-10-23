import { h, replace, card, kv, money, grams, pct, short, tenthsBp, seconds, chip } from "../ui.js";

/** The deal and the case: collateral, loan terms, the LTV gauge and the ladder. */
export function mountFacts(root, store) {
  const facts = h("div", {});
  const gauge = h("div", {});
  root.appendChild(card("The deal", "ZRH-001 · numbers from the desk", facts, gauge));

  store.on(["env", "caseDoc", "ladder"], (s) => {
    const d = (s.env && s.env.deal) || {};
    const c = s.caseDoc;
    const col = s.env && s.env.collateral;
    replace(facts, kv([
      ["Collateral", c ? grams(c.collateral_grams) : grams(d.grams)],
      ["Valuation", c ? money(Number(c.collateral_grams) * Number(c.price_now)) : money(d.valuation_rlusd)],
      ["Principal", c && Number(c.loan.principal) > 0 ? money(c.loan.principal) : money(d.principal_rlusd) + (c ? " (planned)" : "")],
      ["Outstanding", c ? money(c.loan.outstanding) : "—"],
      ["Rate", `${tenthsBp(d.interest_rate)} · late ${tenthsBp(d.late_interest_rate)}`],
      ["Schedule", `${d.payment_total} × ${seconds(d.payment_interval_s)} · grace ${seconds(d.grace_period_s)}${s.env && s.env.network.stage_clock ? " (stage clock)" : ""}`],
      ["Payment", money(d.payment_rlusd)],
      ["Origination fee", money(d.origination_fee_rlusd)],
      ["Cover", `${pct(d.cover_pct)} · min ${tenthsBp(d.cover_rate_minimum)} of debt`],
      ["Price now", c ? `${c.price_now} RLUSD/g` : s.env && s.env.gold_environment ? `${s.env.gold_environment.price_rlusd_per_g} RLUSD/g` : "—"],
      ["Escrow", c && c.escrow.txid ? short(c.escrow.txid) : "not locked", "lq-mono"],
      ["Mandate", c && c.mandate.txid ? short(c.mandate.txid) : "not signed", "lq-mono"],
      col ? ["Collateral path", `${col.path} — ${col.path === "B" ? `${col.xls66c_field_name} ↔ ${col.escrow_field_name}` : "Loan.Data + watcher"}`] : null,
    ]));
    const ltv = c && c.ladder.ltv_pct !== null ? Number(c.ladder.ltv_pct) : null;
    const ladder = (s.env && s.env.ladder) || [];
    const rung = c ? c.ladder.rung : null;
    replace(gauge,
      h("div", { class: "lq-card-head" }, h("h2", {}, "Loan-to-value"), h("span", { class: "lq-hint" }, ltv === null ? (c && Number(c.loan.outstanding) > 0 ? "loan written — publish a price" : "no loan yet") : `${pct(ltv)} · rung ${rung}`),
        c && c.ladder.impaired ? chip("impaired", "warn") : null, c && c.ladder.sale_proposed ? chip("sale proposed", "err") : null),
      h("div", { class: "lq-gauge", role: "img", "aria-label": ltv === null ? "no loan" : `LTV ${pct(ltv)}` },
        h("div", { class: "lq-gauge-fill", style: null, dataset: { w: ltv === null ? 0 : Math.min(100, ltv) } }),
        ladder.map((r) => h("div", { class: "lq-gauge-mark", dataset: { x: r.ltv_pct } }))),
      h("ul", { class: "lq-rungs" }, ladder.map((r) => h("li", { class: `lq-rung ${ltv !== null && ltv >= r.ltv_pct ? "hit" : ""} ${rung === r.rung ? "now" : ""}`, title: r.text },
        h("b", {}, `${r.ltv_pct} %`), r.rung, s.ladder ? h("span", { class: "lq-faint" }, ` · ${(s.ladder.rungs.find((x) => x.rung === r.rung) || {}).price_at || ""}`) : null))));
    // Sizes go through the CSSOM (element.style.width), which a strict CSP permits — a style="" attribute in markup would not be.
    gauge.querySelectorAll(".lq-gauge-fill").forEach((el) => { el.style.width = clamp(el.dataset.w) + "%"; });
    gauge.querySelectorAll(".lq-gauge-mark").forEach((el) => { el.style.left = clamp(el.dataset.x) + "%"; });
  });
}

const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
