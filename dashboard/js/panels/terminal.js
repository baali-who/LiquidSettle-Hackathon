import { h, replace, card, time, short } from "../ui.js";

/** The case's trace: every line the gold services wrote, LIVE/DEMO/refused/read, with the explorer link. */
export function mountTerminal(root, store) {
  const term = h("div", { class: "lq-term", role: "log", "aria-live": "polite" });
  const counts = h("span", { class: "lq-hint" });
  root.appendChild(card("Terminal", "", term));
  root.lastChild.querySelector(".lq-card-head").appendChild(counts);

  store.on(["events", "caseDoc"], (s) => {
    const c = s.caseDoc;
    counts.textContent = c ? `${c.counts.live} live · ${c.counts.demo} demo · ${c.counts.refused} refused · ${c.counts.reads} reads` : "";
    const atBottom = term.scrollHeight - term.scrollTop - term.clientHeight < 40;
    replace(term, s.events.length ? s.events.map((e) => h("div", { class: `l ${e.kind}` },
      h("span", { class: "k" }, String(e.seq).padStart(3, " ")), h("span", { class: "k" }, `${time(e.at)} ${e.kind.toUpperCase()}`),
      h("span", {}, `${e.beat} · ${e.actor}${e.tx_type ? " · " + e.tx_type : ""} — ${e.message} `,
        e.hash ? (e.explorer ? h("a", { href: e.explorer, target: "_blank", rel: "noopener" }, short(e.hash)) : h("code", {}, short(e.hash))) : null,
        e.result && e.result !== "tesSUCCESS" ? h("b", {}, ` ${e.result}`) : null)))
      : h("div", { class: "l" }, h("span", { class: "k" }, "—"), h("span", { class: "k" }, ""), h("span", {}, "no lines yet")));
    if (atBottom) term.scrollTop = term.scrollHeight;
  });
}
