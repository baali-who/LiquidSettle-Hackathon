import { h, replace, card, chip, btn, kv, money, seconds } from "../ui.js";

/** The X-ray: the vault, the broker and the loan as node C sees them. The plan renders today
 *  (dashed), the reads render live (solid) once the hackathon wires node C. */
export function mountXray(root, store, actions) {
  const body = h("div", {});
  const head = h("span", { class: "lq-hint" }, "vault · broker · loan on node C");
  root.appendChild(card("X-ray", "", body));
  root.lastChild.querySelector(".lq-card-head").appendChild(head);

  store.on(["xray", "caseDoc", "env"], (s) => {
    const x = s.xray;
    if (!x) { replace(body, h("p", { class: "lq-hint" }, s.caseDoc ? "Loading…" : "Open a case to see the reads."), btn("Read", { kind: "ghost", onclick: actions.xray, disabled: !s.caseDoc })); return; }
    const planned = !!x.planned;
    replace(head, planned ? chip("NEW · planned", "blue") : chip("live", "ok"), ` node C ${x.node_c && x.node_c.ready ? "ready" : x.node_c && x.node_c.configured ? "not ready" : "not configured"}`);
    replace(body,
      x.expected ? kv([["Principal", money(x.expected.principal)], ["Payment", `${money(x.expected.payment)} × ${x.expected.payments}`],
                       ["Interval", seconds(x.expected.interval_s)], ["Grace", seconds(x.expected.grace_s)], ["Cover", money(x.expected.cover)],
                       ["Debt maximum", money(x.expected.debt_maximum)], ["Collateral path", x.collateral_path]]) : null,
      h("ul", { class: "lq-reads" }, (x.reads || []).map((r) => h("li", { class: `lq-read ${planned ? "" : "live"}` },
        h("code", {}, r.rpc), h("span", {}, (r.yields || []).join(" · ")),
        h("span", { class: "lq-hint" }, "→ " + (r.derived || []).join(" · "))))),
      planned ? h("p", { class: "lq-hint" }, x.reason) : null,
      btn("Read again", { kind: "ghost", onclick: actions.xray }));
  });
}
