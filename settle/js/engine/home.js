/**
 * Home — the provider's settlement desk (Figma: "Desk · Desktop 1440"). The greeting band, the four figures, what
 * needs you (sorted by urgency, each with its one action), and every deal with where it is on its six steps.
 * Refreshes itself every 15 s; a row opens the deal.
 */
import { h, I, btn, money, kg, inlineMoney, pill, progress, time, tile, poll, toast, put, mark } from "./kit.js";
import { frame } from "./shell.js";
import { openNewDeal } from "./newdeal.js";

export const name = "home";
export const title = () => "Desk";

export function kpis(home) {
  const k = home.kpis;
  const card = (iconFn, tone, label, value, sub) => h("div", { class: "es-card es-kpi" },
    h("div", { class: "es-kpi-h" }, tile(iconFn, tone, "sm"), h("span", { class: "es-eyebrow" }, label)),
    h("div", { class: "es-kpi-v" }, value), h("div", { class: "es-kpi-s" }, mark(sub)));
  return h("section", { class: "es-kpis", "aria-label": "Today in figures" },
    card(I.lock, "purple", "Payments secured", money(k.secured.value), k.secured.sub),
    card(I.bar, "gold", "Customer Au in your vault", kg(k.vault.grams), k.vault.sub),
    card(I.truck, "blue", "In progress", `${k.progress.count} deal${k.progress.count === 1 ? "" : "s"}`, k.progress.sub),
    card(I.check, "green", `Settled in ${k.settled.month}`, money(k.settled.value), k.settled.sub));
}

export function needsCard(ctx, home) {
  if (!home.needs.length) {
    return h("section", { class: "es-card es-needs", "aria-label": "Needs you" },
      h("div", { class: "es-needs-h" }, h("h2", {}, tile(I.bell, "green", "sm"), "Nothing needs you"), h("span", { class: "es-faint" }, "Everything runs on its own")));
  }
  return h("section", { class: "es-card es-needs", "aria-label": "Needs you" },
    h("div", { class: "es-needs-h" }, h("h2", {}, tile(I.bell, "amber", "sm"), `Needs you · ${home.needs.length}`), h("span", { class: "es-faint" }, "Sorted by urgency")),
    h("div", { class: "es-needs-list" }, home.needs.map((n) => h("div", { class: "es-need" },
      h("span", {}, pill(n.pill, n.tone)),
      h("div", {}, h("b", {}, n.title), h("p", {}, mark(n.sentence))),
      n.action_key === "credential"
        ? btn(n.action, { iconRight: I.arrow, onclick: async (e) => {
          const b = e.currentTarget; b.classList.add("busy");
          try { await ctx.deals.action(n.ref, "credential"); toast(`Credential request sent · ${n.ref}`, "", { sub: "CredentialCreate on the XRPL Testnet" }); ctx.navigate(`/deal/${n.ref}`); }
          catch (err) { toast(String(err.message || err), "bad"); } finally { b.classList.remove("busy"); }
        } })
        : btn(n.action, { kind: n.primary ? "mint" : "", iconRight: I.arrow, href: n.action_key === "ways" ? `#/deal/${n.ref}/ways` : `#/deal/${n.ref}` })))));
}

export const TABS = [["all", "All"], ["needs", "Needs you"], ["progress", "In progress"], ["vault", "Vault & loans"], ["settled", "Settled"]];

export function dealsTable(ctx, rows, { limit = 7, tab = "all", q = "", onState = null, footer = true, sample = false } = {}) {
  const counts = { all: rows.length };
  for (const r of rows) for (const t of r.tabs || [r.tab]) counts[t] = (counts[t] || 0) + 1;
  const body = h("tbody");
  const shownLine = h("span");
  const search = h("input", { class: "es-input", type: "search", placeholder: "Search customer or deal", value: q, "aria-label": "Search customer or deal" });
  const seg = h("div", { class: "es-seg", role: "group", "aria-label": "Filter deals" });
  const draw = () => {
    const ql = search.value.trim().toLowerCase();
    const list = rows.filter((r) => (tab === "all" || (r.tabs || [r.tab]).includes(tab)) && (!ql || (r.ref + " " + r.customer.name).toLowerCase().includes(ql)));
    const show = limit ? list.slice(0, limit) : list;
    put(seg, ...TABS.map(([k, label]) => h("button", { type: "button", "aria-pressed": tab === k ? "true" : "false", onclick: () => { tab = k; draw(); if (onState) onState({ tab }); } }, `${label} · ${counts[k] || 0}`)));
    put(body, ...show.map((r) => {
      const tr = h("tr", { class: `es-tr ${r.needs_you ? "hot" : ""}`.trim(), tabindex: "0", onclick: () => ctx.navigate(`/deal/${r.ref}`),
        onkeydown: (e) => { if (e.key === "Enter") ctx.navigate(`/deal/${r.ref}`); } },
      h("td", {}, h("div", { class: "es-who" }, tile(I.bar, "gold", "sm"), h("div", {}, h("b", {}, r.customer.name), h("small", {}, mark(r.subtitle))))),
      h("td", {}, progress(r.progress, { loan: r.kind === "loan" }), h("div", { class: `es-where ${r.where_tone}`.trim() }, r.where)),
      h("td", { class: "hide-sm" }, r.busy ? pill("RUNNING", "info", { live: true }) : pill(r.status.label, r.status.tone)),
      h("td", { class: "r amt" }, money(r.amount)),
      h("td", { class: "hide-md" }, r.loan_health ? health(r.loan_health) : h("span", { class: "es-faint" }, "—")),
      h("td", { class: "r es-muted hide-sm" }, time.updated(r.updated)),
      h("td", { class: "r es-faint" }, I.right({ size: 16 })));
      return tr;
    }), list.length ? null : h("tr", {}, h("td", { colspan: "7" }, h("div", { class: "es-empty" }, h("b", {}, rows.length ? "No deal matches" : "No deals yet"),
      rows.length ? "Try another filter." : (ctx.operator ? "Start one with New deal — or make the demo workspace from the Workflow console (W)." : "Your deals appear here.")))));
    shownLine.textContent = `Showing ${show.length} of ${list.length} deal${list.length === 1 ? "" : "s"}${sample ? " · sample data" : ""}`;
  };
  search.addEventListener("input", draw);
  draw();
  return h("section", { class: "es-card es-deals", "aria-label": "All deals" },
    h("div", { class: "es-deals-h" }, h("h2", {}, "All deals"), seg, h("div", { class: "es-search" }, I.search({ size: 16 }), search)),
    h("table", { class: "es-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Deal"), h("th", {}, "Where it is"), h("th", { class: "hide-sm" }, "Status"), h("th", { class: "r" }, "Amount"),
        h("th", { class: "r hide-md" }, "Loan health"), h("th", { class: "r hide-sm" }, "Updated"), h("th", {}, h("span", { class: "es-sr" }, "Open")))), body),
    footer ? h("div", { class: "es-table-f" }, shownLine, limit ? h("a", { href: "#/deals", class: "es-btn link" }, `View all ${rows.length}`, I.arrow({ size: 15 })) : h("span")) : null);
}

function health(lh) {
  const safe = lh.ltv < 70;
  const bar = h("i", { class: safe ? "safe" : "" });
  bar.style.width = Math.min(100, Math.max(4, ((lh.ltv - 40) / 60) * 100)) + "%";
  return h("div", { class: "es-health" }, h("b", { class: safe ? "safe" : "" }, lh.ltv.toFixed(0) + "%"), h("span", { class: "es-bar" }, bar));
}

export async function render(ctx) {
  const home = await ctx.deals.home();
  ctx.cache.home = home;
  if (home.user) { ctx.userName = home.user; ctx.userInitials = home.user_initials; }
  const s = home.summary;
  const band = h("section", { class: "es-band" }, h("div", { class: "es-wrap" }, h("div", { class: "es-band-in" },
    h("div", {}, h("div", { class: "es-eyebrow-band" }, `${home.provider.short} · Settlement desk · ${time.long()}`),
      h("h1", {}, `${home.greeting}, ${home.user}${String(home.user || "").endsWith(".") ? "" : "."}`),
      h("p", { class: "es-sub" }, s.needs ? h("b", {}, `${s.needs} deal${s.needs === 1 ? "" : "s"} need${s.needs === 1 ? "s" : ""} you`) : "Nothing needs you",
        ` · ${s.in_progress} in progress · everything else runs on its own`)),
    h("div", { class: "es-actions" },
      btn("Statements", { kind: "ghost-band", icon: I.list, href: "#/money" }),
      ctx.operator ? btn("New deal", { kind: "mint", icon: I.plus, onclick: () => openNewDeal(ctx) }) : null))));
  const page = frame(ctx, "home", band, h("div", { class: "es-wrap" },
    kpis(home), needsCard(ctx, home),
    dealsTable(ctx, home.deals, { limit: 7, sample: ctx.sample }),
    ctx.operator && !home.deals.length ? h("div", { class: "es-notice ok", role: "note" }, h("span", { class: "es-tile" }, I.play({ size: 16 })),
      h("div", {}, h("b", {}, "Make the demo workspace"), h("p", {}, "The Workflow console (W) creates the nine deals of the desk with real transactions on the XRPL Testnet and our XLS-66 devnet — about ten minutes, in the background."))) : null));
  ctx.leave(poll(async () => {
    const fresh = await ctx.deals.home();
    if (JSON.stringify(fresh.deals.map((d) => [d.ref, d.updated, d.status.label])) !== JSON.stringify(home.deals.map((d) => [d.ref, d.updated, d.status.label])) || fresh.needs.length !== home.needs.length) ctx.rerender();
  }, 15000));
  return page;
}

export { inlineMoney };
