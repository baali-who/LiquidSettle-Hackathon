import { h, replace, card, chip, kv } from "../ui.js";
import { LIVE_LENDING } from "../fixtures.js";

/**
 * XLS-66 Collateral Lending — live on our devnet (Iteration 56; v3 pills and result stamps, Iteration 57).
 *
 * Reads GET <api>/lending/live (public: addresses and hashes only) every 10 s and shows the latest run of
 * the whole lifecycle the platform signed on the devnet: the pledge, the release the ledger refused
 * (tecPLEDGED), the payoff, the release, the default that seized the pledge. Every hash opens in the
 * platform's devnet explorer. In mock mode it shows a labelled sample.
 */
export function mountLive(root, store) {
  const head = h("div", { class: "lq-live-head" });
  const proof = h("div", { class: "lq-chips lq-live-proof" });
  const list = h("ul", { class: "lq-board lq-live" });
  root.appendChild(card("XLS-66 Collateral Lending · live", "our devnet · every step a hash", head, proof, list));
  let timer = null;

  function origin(base) {
    try { return new URL(base, location.href).origin; } catch (e) { return ""; }
  }

  function render(doc, sample) {
    const run = (doc.runs || [])[0];
    const explorer = doc.explorer ? origin(store.get("settings").base) + doc.explorer : "";
    replace(head, kv([
      ["Network", `${(doc.network || {}).name || "—"} · ${(doc.network || {}).network_id ?? "—"}`],
      ["Lending", (doc.network || {}).lending_on_devnet ? "on the devnet" : "not routed to the devnet"],
      ["Collateral field", doc.collateral_field || "—"],
      ["Run", run ? `${run.ref} · ${run.status}${sample ? " (sample)" : ""}` : "none yet"],
    ]));
    const p = (run && run.proof) || {};
    replace(proof,
      chip("own node · devnet", "own"), chip(sample ? "demo · sample" : "live", sample ? "demo" : "ok live"),
      chip(p.pledged_refused ? "release refused while open ✓" : "release refused while open", p.pledged_refused ? "ok" : "dim"),
      chip(p.released_after_payoff ? "released after payoff ✓" : "released after payoff", p.released_after_payoff ? "ok" : "dim"),
      chip(p.seized_on_default ? "seized on default ✓" : "seized on default", p.seized_on_default ? "ok" : "dim"));
    replace(list, run ? run.steps.map((s) => h("li", {},
      h("time", {}, s.phase || ""),
      h("span", { class: s.ok ? "k-beat" : "k-refusal" },
        `${s.label} `,
        h("span", { class: "lq-stamp" + (s.result === "tecPLEDGED" ? " pledged" : s.result && s.result !== "tesSUCCESS" ? " refused" : "") }, s.result || "…"), " ",
        s.hash && explorer && !sample
          ? h("a", { href: `${explorer}tx/${s.hash}`, target: "_blank", rel: "noopener" }, s.hash.slice(0, 10) + "…")
          : (s.hash ? h("code", {}, s.hash.slice(0, 10) + "…") : null)))) : [h("li", { class: "lq-hint" }, "No run yet — Platform Studio › LiquidGate › XLS-66 live.")]);
  }

  async function poll() {
    if (store.get("mock")) { render(LIVE_LENDING, true); return; }
    try {
      const r = await fetch(store.get("settings").base.replace(/\/$/, "") + "/lending/live", { headers: { Accept: "application/json" }, credentials: "same-origin" });
      if (r.ok) render(await r.json(), false);
    } catch (e) { /* offline: the next poll tries again */ }
  }

  store.on(["connection", "mock", "settings"], () => {
    if (timer) clearInterval(timer);
    poll();
    timer = setInterval(poll, 10000);
  });
}
