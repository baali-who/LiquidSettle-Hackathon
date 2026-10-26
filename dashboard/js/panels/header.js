import { h, replace, chip, dot, btn } from "../ui.js";

export function mountHeader(root, store, actions) {
  const title = h("h1", { class: "lq-brand-title" });
  const sub = h("p", { class: "lq-brand-sub" });
  const chips = h("div", { class: "lq-chips" });
  const el = h("header", { class: "lq-head" }, h("div", { class: "lq-brand" }, title, sub), chips);
  root.appendChild(el);

  store.on(["env", "connection", "me", "mock", "caseDoc", "settingsOpen"], (s) => {
    const d = (s.env && s.env.dashboard) || {};
    const words = (d.title || root.dataset.lgTitle || "LiquidLend").split(" · ");
    replace(title, h("span", {}, words[0]), words[1] ? h("span", { class: "lq-s" }, words[1]) : null);
    sub.textContent = d.tagline || root.dataset.lgTagline || "";
    const net = s.env ? s.env.network.mode : "…";
    const node = s.env ? s.env.node_c : null;
    const conn = s.connection;
    replace(chips,
      s.mock ? chip(s.settings && s.settings.scenario === "live" ? "mock · end of the hackathon" : "mock · fixtures", "warn") : null,
      dot(conn === "ok" ? "connected" : conn === "connecting" ? "connecting" : conn === "auth" ? "credential" : conn === "offline" ? "offline" : "idle",
          conn === "ok" ? "ok" : conn === "connecting" ? "dim" : "err"),
      chip(net, net === "testnet" ? "dim" : "err"),
      s.env ? chip(`node C · ${node.ready ? "ready" : node.reachable ? "reachable" : node.configured ? "unreachable" : "not configured"}`, node.ready ? "ok" : node.configured ? "warn" : "dim") : null,
      s.env ? chip(`collateral path ${s.env.collateral.path}`, "blue") : null,
      s.me ? chip(`${s.me.principal.kind} · ${s.me.principal.scopes.length} scopes`, "dim") : null,
      s.caseDoc ? chip(`case ${s.caseDoc.ref} · ${s.caseDoc.state}`, s.caseDoc.state === "open" ? "ok" : "dim") : null,
      btn("Reload", { kind: "ghost", onclick: actions.reload }),
      btn(s.settingsOpen ? "Close" : "Settings", { kind: "ghost", onclick: actions.toggleSettings }));
  });
}
