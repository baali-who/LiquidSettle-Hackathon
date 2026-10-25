/**
 * The engine's frame (Iteration 59): the top bar of the Figma frames — the LiquidSettle mark, the five places
 * (Home · Deals · Vault · Money · Activity), the network pill, search, what needs you, the person — and the page.
 * The operator's Workflow drawer opens from the bar (W). The architecture, the tour, the theme and the way back to
 * the platform live in the person's menu.
 */
import { h, I, pill, overlay, first, put } from "./kit.js";
import { openWorkflow } from "./workflow.js";

export const NAV = [["home", "Home", "#/"], ["deals", "Deals", "#/deals"], ["vault", "Vault", "#/vault"], ["money", "Money", "#/money"], ["activity", "Activity", "#/activity"]];

function logo() {
  return h("a", { class: "es-logo", href: "#/", "aria-label": "LiquidSettle by LiquidLabs — home" },
    h("span", { class: "es-logo-mark" }, I.bar({ size: 20, width: 2 })),
    h("span", { class: "es-logo-t" }, h("b", {}, "LiquidSettle"), h("small", {}, "by LiquidLabs")));
}

function userMenu(ctx, anchor) {
  const close = () => { menu.remove(); document.removeEventListener("click", outside, true); };
  const outside = (e) => { if (!menu.contains(e.target) && !anchor.contains(e.target)) close(); };
  const T = window.LiquidSettleTheme;
  const tour = document.getElementById("ll-tour");
  const menu = h("div", { class: "es-menu", role: "menu" },
    h("div", { class: "es-menu-h" }, `${ctx.provider.short} · Settlement desk`),
    h("a", { href: "#/architecture", role: "menuitem", onclick: close }, I.layers({ size: 16 }), "Architecture & amendment"),
    ctx.operator ? h("button", { type: "button", role: "menuitem", onclick: () => { close(); openWorkflow(ctx); } }, I.flow({ size: 16 }), "Workflow & demo console") : null,
    tour ? h("button", { type: "button", role: "menuitem", "data-tour-start": "1", onclick: () => setTimeout(close) }, I.compass({ size: 16 }), "Take the tour") : null,
    T ? h("button", { type: "button", role: "menuitem", onclick: () => { T.toggle(); close(); } }, T.current() === "dark" ? I.sun({ size: 16 }) : I.moon({ size: 16 }), T.current() === "dark" ? "Light theme" : "Dark theme") : null,
    h("hr"),
    ctx.exit ? h("a", { href: ctx.exit, role: "menuitem" }, I.door({ size: 16 }), "Back to the platform") : null);
  document.body.querySelector(".es-top").appendChild(menu);
  setTimeout(() => document.addEventListener("click", outside, true));
}

function bellMenu(ctx, anchor) {
  const close = () => { menu.remove(); document.removeEventListener("click", outside, true); };
  const outside = (e) => { if (!menu.contains(e.target) && !anchor.contains(e.target)) close(); };
  const needs = (ctx.cache.home && ctx.cache.home.needs) || [];
  const menu = h("div", { class: "es-menu", role: "menu" },
    h("div", { class: "es-menu-h" }, needs.length ? `${needs.length} deal${needs.length === 1 ? "" : "s"} need${needs.length === 1 ? "s" : ""} you` : "Nothing needs you"),
    needs.map((n) => h("a", { href: n.action_key === "ways" ? `#/deal/${n.ref}/ways` : `#/deal/${n.ref}`, role: "menuitem", onclick: close },
      pill(n.pill.split(" · ").pop(), n.tone, { size: "sm" }), h("span", {}, n.title))));
  anchor.closest(".es-top").appendChild(menu);
  menu.style.right = "120px";
  setTimeout(() => document.addEventListener("click", outside, true));
}

function search(ctx) {
  const rows = (ctx.cache.home && ctx.cache.home.deals) || [];
  const list = h("div", {});
  const input = h("input", { class: "es-input", type: "search", placeholder: "A deal or a customer — LS-1044, David…", "aria-label": "Search deals" });
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const hits = rows.filter((r) => !q || (r.ref + " " + r.customer.name).toLowerCase().includes(q)).slice(0, 8);
    put(list, ...hits.map((r) => h("button", { type: "button", class: "es-picker-r", onclick: () => { close(); ctx.navigate(`/deal/${r.ref}`); } },
      h("span", { class: "es-tile gold sm" }, I.bar({ size: 16 })), h("span", {}, h("b", {}, r.customer.name), h("small", {}, r.subtitle)), pill(r.status.label, r.status.tone, { size: "sm" }), I.right({ size: 16 }))),
    hits.length ? null : h("div", { class: "es-empty" }, "No deal matches."));
  };
  input.addEventListener("input", draw);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { const b = list.querySelector("button"); if (b) b.click(); } });
  const panel = h("div", { class: "es-modal", role: "dialog", "aria-modal": "true", "aria-label": "Search" },
    h("div", { class: "es-modal-sec" }, h("div", { class: "es-search" }, I.search({ size: 16 }), input)), h("div", { class: "es-modal-b" }, list));
  const close = overlay(panel);
  draw();
}

export function topbar(ctx, active) {
  const userBtn = h("button", { type: "button", class: "es-user", "aria-haspopup": "menu", onclick: () => userMenu(ctx, userBtn) },
    h("span", { class: "es-avatar" }, ctx.userInitials || "LS"), h("span", { class: "n" }, ctx.userName || "Desk"), I.chevron({ size: 16 }));
  const bell = h("button", { type: "button", class: "es-iconbtn", "aria-label": "What needs you", onclick: () => bellMenu(ctx, bell) }, I.bell({ size: 19 }),
    ((ctx.cache.home && ctx.cache.home.needs) || []).length ? h("span", { class: "es-badge" }) : null);
  const net = ctx.sample ? pill("SAMPLE DATA", "muted") : pill(String(ctx.dealsNetwork || "testnet").toUpperCase(), "info");
  return h("header", { class: "es-top" }, h("div", { class: "es-top-in" },
    logo(),
    h("nav", { class: "es-nav", "aria-label": "The settlement engine" }, NAV.map(([key, label, href]) => h("a", { href, "aria-current": active === key ? "page" : null }, label))),
    h("div", { class: "es-top-r" }, net,
      ctx.operator ? h("button", { type: "button", class: "es-iconbtn", "aria-label": "Workflow and demo console (W)", title: "Workflow & demo console (W)", onclick: () => openWorkflow(ctx) }, I.flow({ size: 19 })) : null,
      h("button", { type: "button", class: "es-iconbtn", "aria-label": "Search (/)", title: "Search (/)", onclick: () => search(ctx) }, I.search({ size: 19 })),
      bell, userBtn)));
}

export function frame(ctx, active, ...content) {
  return h("div", { class: "es-page es-app" }, topbar(ctx, active), h("main", { class: "es-main", id: "es-main" }, ...content));
}

let keysBound = false;
export function bindKeys(ctx) {
  if (keysBound) return;
  keysBound = true;
  document.addEventListener("keydown", (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/") { e.preventDefault(); search(ctx); }
    if ((e.key === "w" || e.key === "W") && ctx.operator) { e.preventDefault(); openWorkflow(ctx); }
  });
}

export { first };
