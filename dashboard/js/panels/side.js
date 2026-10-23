import { h, replace, card, btn, chip, kv, pre, time, short, toast } from "../ui.js";

/** Aurum — the agent's tools through the API: ENV tools run; NEW servicer tools are declared. */
export function mountAurum(root, store, actions) {
  const list = h("ul", { class: "lq-tools" });
  const out = h("div", {});
  root.appendChild(card("Aurum · servicer", "prepare-only: the agent never holds a key", list, out));
  store.on(["tools", "toolResult", "busy", "me"], (s) => {
    const t = s.tools;
    if (!t) { replace(list, h("li", { class: "lq-hint" }, "needs scope agent")); return; }
    replace(list, t.tools.map((x) => h("li", { class: `lq-tool ${x.status}` }, h("b", {}, x.name),
      x.status === "planned" ? chip("NEW", "blue") : btn("Run", { kind: "ghost", disabled: s.busy, onclick: () => actions.tool(x.name) }),
      h("span", { class: "lq-hint" }, x.description))));
    replace(out, s.toolResult ? h("details", { open: true }, h("summary", { class: "lq-hint" }, `${s.toolResult.tool} →`), pre(s.toolResult.result)) : null);
  });
}

/** The board: the public lines, by team, polled. */
export function mountBoard(root, store, actions) {
  const counts = h("div", { class: "lq-counts" });
  const list = h("ul", { class: "lq-board" });
  const input = h("input", { class: "lq-input", placeholder: "post a note to the board", maxlength: "240", "aria-label": "Note" });
  const form = h("form", { class: "lq-note-form", onsubmit: (e) => { e.preventDefault(); if (input.value.trim()) { actions.note(input.value.trim()); input.value = ""; } } },
    input, h("button", { type: "submit", class: "lq-btn sm" }, "Post"));
  root.appendChild(card("The board", "what the judges watch", counts, list, form));
  store.on(["board", "counts", "me"], (s) => {
    const c = s.counts;
    replace(counts, c ? [["beats", c.beats], ["verifies", c.verifies], ["refusals", c.refusals], ["commits", c.commits], ["calls", c.calls]].map(([k, v]) =>
      h("span", { class: "lq-count" }, h("b", {}, String(v)), ` ${k}`)) : null);
    replace(list, s.board.slice(-60).map((l) => h("li", {}, h("time", {}, time(l.at)),
      h("span", { class: `k-${l.kind}` }, `${l.team ? l.team + " · " : ""}${l.message}`))));
    list.scrollTop = list.scrollHeight;
    form.hidden = !(s.me && s.me.principal.scopes.includes("board"));
  });
}

/** Verify: the counts, the receipt's state, the read-backs. */
export function mountVerify(root, store, actions) {
  const body = h("div", {});
  root.appendChild(card("Verify", "every hash, from a public node", body));
  store.on(["caseDoc", "verifyResult", "busy"], (s) => {
    const c = s.caseDoc;
    const v = s.verifyResult;
    replace(body,
      c ? kv([["On a ledger", `${c.counts.live} live · ${c.counts.demo} demo`], ["Refused", String(c.counts.refused)],
              ["Receipt", c.receipt.sealed ? `v${c.receipt.version} sealed${c.receipt.live ? " LIVE" : " DEMO"}` : "not sealed"],
              c.receipt.sealed ? ["SHA-256", short(c.receipt.sha256, 12), "lq-mono"] : null]) : h("p", { class: "lq-hint" }, "No case yet."),
      h("div", { class: "lq-inline" },
        btn("Run the read-backs", { kind: "ghost", disabled: !c || s.busy, onclick: actions.verify }),
        btn("Receipt JSON", { kind: "ghost", disabled: !c || s.busy, onclick: actions.receipt })),
      v ? h("div", {}, h("p", { class: "lq-hint" }, `${v.lines.length} read-back(s)${v.public_node_url ? " · public node " + v.public_node_url : ""}`),
                       v.lines.length ? pre(v.lines.map((l) => `${l.kind.toUpperCase().padEnd(7)} ${l.message}`).join("\n")) : null) : null,
      s.receiptDoc ? h("details", {}, h("summary", { class: "lq-hint" }, `receipt.json · sha256 ${short(s.receiptDoc.sha256, 12)}`), pre(s.receiptDoc.receipt)) : null);
  });
}

/** Provenance: frozen or not, ENV vs NEW, what landed. */
export function mountProvenance(root, store) {
  const body = h("div", { class: "lq-prov" });
  root.appendChild(card("Provenance", "only what is built during the hackathon counts", body));
  store.on(["provenance", "env"], (s) => {
    const p = s.provenance || (s.env && s.env.provenance);
    if (!p) { replace(body, h("span", { class: "lq-hint" }, "…")); return; }
    replace(body,
      h("div", {}, p.frozen ? chip("frozen", "ok") : chip("not frozen", "warn"), " ", h("code", { class: "lq-mono" }, p.freeze_hash || "FREEZE_HASH pending")),
      h("div", {}, `${p.event} · ${p.track}`),
      h("div", {}, h("b", {}, `${p.env.length} ENV`), " reused and declared · ", h("b", {}, `${p.planned.length} NEW`), " planned · ", h("b", {}, `${p.built_during.length}`), " landed"),
      p.built_during.length ? h("ul", { class: "lq-board" }, p.built_during.map((b) => h("li", {}, h("time", {}, "NEW"), h("span", { class: "k-commit" }, b)))) : null,
      p.repo_url ? h("a", { href: p.repo_url, target: "_blank", rel: "noopener" }, p.repo_url) : null);
  });
}

/** The settings drawer: API base, credential, team, mock. Stored per browser (localStorage) — never a key of the platform's. */
export function mountSettings(root, store, actions) {
  const base = h("input", { class: "lq-input lq-mono", placeholder: "/api/lg/v1", "aria-label": "API base" });
  const token = h("input", { class: "lq-input lq-mono", type: "password", placeholder: "lg_test_… or a session token", autocomplete: "off", "aria-label": "Credential" });
  const team = h("input", { class: "lq-input", placeholder: "team (board filter)", "aria-label": "Team" });
  const caseRef = h("input", { class: "lq-input lq-mono", placeholder: "case ref (empty = your latest)", "aria-label": "Case" });
  const mock = h("input", { type: "checkbox" });
  const scenario = h("select", { class: "lq-select", "aria-label": "Scenario" },
    h("option", { value: "today" }, "today — the framework, NEW beats planned"), h("option", { value: "live" }, "end of the hackathon — everything LIVE on node C"));
  const drawer = h("aside", { class: "lq-drawer", hidden: true, "aria-label": "Settings" },
    h("h2", {}, "Settings"),
    h("div", { class: "lq-field" }, h("label", {}, "API base"), base),
    h("div", { class: "lq-field" }, h("label", {}, "Credential (bearer)"), token, h("span", { class: "lq-hint" }, "On the platform page a one-hour session token is minted for you; a team's own code uses an API key from the desk. Stored in this browser only.")),
    h("div", { class: "lq-field" }, h("label", {}, "Team"), team),
    h("div", { class: "lq-field" }, h("label", {}, "Case"), caseRef),
    h("label", { class: "lq-inline" }, mock, " Mock mode — fixtures, no platform"),
    h("div", { class: "lq-field" }, h("label", {}, "Mock scenario"), scenario, h("span", { class: "lq-hint" }, "“today” is the framework as committed; “end of the hackathon” shows every beat LIVE with the loan open on node C — fixtures, not claims.")),
    h("div", { class: "lq-inline" }, btn("Apply & reconnect", { sm: false, onclick: () => { actions.applySettings({ base: base.value.trim(), token: token.value.trim(), team: team.value.trim(), caseRef: caseRef.value.trim(), mock: mock.checked, scenario: scenario.value }); } }),
                                    btn("Forget the credential", { kind: "danger", onclick: () => { token.value = ""; actions.applySettings({ token: "" }); } })),
    h("details", {}, h("summary", { class: "lq-hint" }, "Who am I"), h("div", { class: "lq-me" })),
    h("p", { class: "lq-hint" }, "Links: ", h("a", { href: "#", "data-link": "openapi" }, "OpenAPI"), " · ", h("a", { href: "#", "data-link": "env" }, "GET /env"), " · ", h("a", { href: "#", "data-link": "provenance" }, "PROVENANCE.md")));
  root.appendChild(drawer);
  drawer.querySelectorAll("[data-link]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); actions.openLink(a.dataset.link); }));
  store.on(["settingsOpen", "settings", "me"], (s) => {
    drawer.hidden = !s.settingsOpen;
    const st = s.settings || {};
    if (document.activeElement !== base) base.value = st.base || "";
    if (document.activeElement !== token) token.value = st.token || "";
    if (document.activeElement !== team) team.value = st.team || "";
    if (document.activeElement !== caseRef) caseRef.value = st.caseRef || "";
    mock.checked = !!st.mock;
    scenario.value = st.scenario || "today";
    replace(drawer.querySelector(".lq-me"), s.me ? pre(s.me.principal) : h("span", { class: "lq-hint" }, "not connected"));
  });
}

export function mountFooter(root, store, actions) {
  const left = h("span", {});
  const right = h("span", { class: "lq-spacer" });
  root.appendChild(h("footer", { class: "lq-foot" }, left, right));
  store.on(["env", "me", "mock"], (s) => {
    const e = s.env;
    left.textContent = e ? `LiquidGate ${e.liquidgate.version} · iteration ${e.liquidgate.iteration} · ${e.network.mode} · ${e.dashboard.team}` : "LiquidGate";
    replace(right, h("a", { href: "#", onclick: (ev) => { ev.preventDefault(); actions.openLink("openapi"); } }, "OpenAPI"), " · ",
      h("a", { href: "#", onclick: (ev) => { ev.preventDefault(); actions.openLink("provenance"); } }, "PROVENANCE.md"), " · ",
      h("a", { href: "#", onclick: (ev) => { ev.preventDefault(); copyLink(); } }, "copy this view"));
  });
  function copyLink() { try { navigator.clipboard.writeText(location.href); toast("Link copied", "ok"); } catch (e) { toast("Could not copy", "err"); } }
}
