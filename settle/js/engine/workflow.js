/**
 * The Workflow drawer — the demo console for the desk's operators (W, or the flow icon in the bar).
 *
 *   This deal       its six steps and every action that can run now, whoever does it in real life (the desk, the
 *                   customer, USPS — typed in by hand, the lender), each with its inputs; one click runs it on the
 *                   ledger and the page follows it
 *   The Au price    the AI price agent: publish a price (OracleSet on the XRPL Testnet) or read the market
 *   Demo workspace  make the nine deals of the desk with real transactions (or continue, or reset and make again)
 *   The script      the order to show it in
 */
import { h, I, btn, busy as busyBtn, n2, pill, toast, put, mark } from "./kit.js";
import { runAction } from "./run.js";

let open = null;

const SCRIPT = [
  ["#/", "The desk", "Two deals need you; nine deals, every step a transaction"],
  ["#/deal/LS-1045", "LS-1045 · refused", "tecNO_AUTH: David's wallet has no credential → send it → he accepts → try again"],
  ["#/deal/LS-1043", "LS-1043 · on its way", "Record the vault's signature: both escrows release"],
  ["#/deal/LS-1046", "LS-1046 · with USPS", "Out for delivery → delivered: the gold token moves to Sara"],
  ["#/deal/LS-1044", "LS-1044 · the loan", "Tap the health bar: what if Au fell further? Then publish a price"],
  ["#/deal/LS-1044/ways", "Ways back to safe", "Pay down 60,000 — a LoanPay on our own node"],
  ["#/deal/LS-1047", "LS-1047 · a fresh deal", "Confirm → terms → approve & pay, live"],
  ["#/activity", "Activity", "Live · own node · refused — every hash"],
  ["#/architecture", "Architecture", "The modules, and XLS-66 next to our CollateralLock"],
];

function field(f, values) {
  if (f.type === "seg") {
    values[f.name] = f.value;
    const seg = h("div", { class: "es-seg", role: "group", "aria-label": f.name });
    const draw = () => put(seg, ...f.options.map(([v, t]) => h("button", { type: "button", "aria-pressed": values[f.name] === v ? "true" : "false", onclick: () => { values[f.name] = v; draw(); } }, t)));
    draw();
    return seg;
  }
  if (f.type === "select") {
    values[f.name] = f.value;
    const s = h("select", { class: "es-input es-select", "aria-label": f.name, onchange: (e) => { values[f.name] = e.target.value; } }, f.options.map(([v, t]) => h("option", { value: v, selected: v === f.value ? true : null }, t)));
    return s;
  }
  values[f.name] = f.value ?? "";
  const i = h("input", { class: "es-input", type: f.type === "number" ? "number" : "text", placeholder: f.placeholder || f.label || "", value: f.value ?? "", "aria-label": f.label || f.name,
    oninput: (e) => { values[f.name] = e.target.value; } });
  return h("label", { class: "es-field" }, f.label ? h("span", {}, f.label) : null, i);
}

async function dealSection(ctx, ref, rerenderDrawer) {
  const d = await ctx.deals.deal(ref);
  const steps = h("div", {}, d.steps.map((s) => h("div", { class: `es-wf-step ${s.state}` }, h("span", { class: "n" }, s.state === "done" ? "✓" : String(s.n)), h("span", {}, s.label, h("small", {}, s.who)))));
  const acts = (d.actions || []).filter((a) => a.allowed).map((a) => {
    const values = {};
    const inputs = (a.form || []).map((f) => field(f, values));
    const run = a.key === "ways" ? btn("Open the ways out", { kind: "mint", size: "sm", iconRight: I.arrow, href: `#/deal/${d.ref}/ways` })
      : btn(a.label, { kind: a.primary ? "mint" : "", size: "sm", icon: I.play, attrs: { disabled: d.busy ? true : null } });
    if (a.key !== "ways") {
      run.addEventListener("click", () => busyBtn(run, async () => { await runAction(ctx, d.ref, a.key, values); ctx.rerender(); rerenderDrawer(); }));
    }
    return h("div", { class: `es-wf-act ${a.primary ? "primary" : ""}`.trim() }, h("span", { class: "who" }, `as ${a.who}`), h("b", {}, a.label), a.note ? h("p", {}, a.note) : null, ...inputs, h("div", { class: "es-actions" }, run));
  });
  return h("section", { class: "es-dsec" }, h("h3", {}, `This deal · ${d.ref}`),
    h("p", { class: "es-muted" }, `${d.customer.name} · ${d.subtitle.split(" · ").slice(1).join(" · ")} · ${d.network_label}`),
    d.busy ? h("div", { class: "es-busy" }, "Running on the ledger…") : null, d.error ? h("div", { class: "es-err" }, d.error) : null,
    steps, acts.length ? acts : h("p", { class: "es-muted" }, d.status_raw === "settled" ? "Settled — nothing left to run." : "Nothing to run right now."));
}

function priceSection(ctx, rerenderDrawer) {
  const cur = (ctx.cache.home && ctx.cache.home.price) || null;
  const input = h("input", { class: "es-input", type: "number", step: "0.01", min: "1", value: cur ? String(cur.price) : "100", "aria-label": "Au price per gram" });
  const pub = btn("Publish", { kind: "mint", size: "sm", icon: I.chart });
  pub.addEventListener("click", () => busyBtn(pub, async () => {
    const p = await ctx.deals.publishPrice({ price: input.value });
    toast(`Au price published · ${n2(p.price)}`, "", { sub: "OracleSet on the XRPL Testnet · every open loan re-measured", href: p.url });
    ctx.rerender(); rerenderDrawer();
  }));
  const market = btn("Publish the market price", { size: "sm", icon: I.chart });
  market.addEventListener("click", () => busyBtn(market, async () => {
    const p = await ctx.deals.publishPrice({ market: true });
    toast(`AI price agent · ${n2(p.price)}`, "", { sub: p.source, href: p.url }); ctx.rerender(); rerenderDrawer();
  }));
  const presets = h("div", { class: "es-actions" }, [100, 90, 80, 76, 70].map((v) => btn(n2(v), { size: "sm", onclick: () => { input.value = String(v); } })));
  return h("section", { class: "es-dsec" }, h("h3", {}, "The Au price · AI price agent"),
    cur ? h("p", { class: "es-muted" }, mark(`Now ${n2(cur.price)} {RL}/g · ${cur.source}`), cur.url ? [" · ", h("a", { href: cur.url, target: "_blank", rel: "noopener" }, "OracleSet ↗")] : null) : null,
    presets, h("div", { class: "es-actions es-gap-s" }, input, pub), h("div", { class: "es-actions es-gap-s" }, market),
    h("p", { class: "es-muted es-gap-s" }, "A demo price is labelled as one everywhere it shows; the market price is the AI price agent's reading of XAU/USD."));
}

async function seedSection(ctx, rerenderDrawer) {
  let s = {};
  try { s = await ctx.deals.seedStatus(); } catch (e) { s = {}; }
  const done = Number(s.done || 0), total = Number(s.total || 0);
  const bar = h("i"); bar.style.width = total ? `${Math.round((done / total) * 100)}%` : "0%";
  const make = btn(s.state === "failed" ? "Continue where it stopped" : s.deals ? "Run it again (keeps what exists)" : "Make the demo workspace", { kind: "mint", size: "sm", icon: I.play, attrs: { disabled: s.running ? true : null } });
  make.addEventListener("click", () => busyBtn(make, async () => { await ctx.deals.seed({}); toast("The demo workspace is being made", "", { sub: "Real transactions — about ten minutes. You can keep working." }); rerenderDrawer(); }));
  let armed = false;
  const reset = btn("Reset and make it again", { size: "sm", kind: "danger", attrs: { disabled: s.running ? true : null } });
  reset.addEventListener("click", () => {
    if (!armed) { armed = true; reset.textContent = "Click again: remove the seeded deals and remake them"; setTimeout(() => { armed = false; reset.textContent = "Reset and make it again"; }, 5000); return; }
    busyBtn(reset, async () => { await ctx.deals.seed({ reset: true }); toast("Reset — the demo workspace is being made again"); ctx.rerender(); rerenderDrawer(); });
  });
  if (s.running) setTimeout(() => { if (open) rerenderDrawer(); }, 3000);
  return h("section", { class: "es-dsec" }, h("h3", {}, "Demo workspace"),
    h("p", { class: "es-muted" }, `${s.deals || 0} of ${s.total_deals || 9} seeded deals · `, s.state ? pill(String(s.state).toUpperCase(), s.state === "done" ? "ok" : s.state === "failed" ? "bad" : s.running ? "info" : "muted", { size: "sm", live: !!s.running }) : "not made yet"),
    total ? h("div", { class: "es-progressbar" }, bar) : null,
    s.step ? h("p", { class: "es-muted" }, s.running ? `Now: ${s.step}` : s.step) : null,
    s.error ? h("div", { class: "es-err" }, s.error) : null,
    h("div", { class: "es-actions es-gap-s" }, make, s.deals ? reset : null),
    h("p", { class: "es-muted es-gap-s" }, "The nine deals of the screenshots, made with real transactions: purchases on the XRPL Testnet, the loan on our XLS-66 devnet. A reset removes the seeded rows; what they did on the ledger stays there."));
}

export async function openWorkflow(ctx) {
  if (open) { open.remove(); open = null; return; }
  const body = h("div", { class: "es-drawer-b" });
  const panel = h("aside", { class: "es-drawer es-app", role: "dialog", "aria-label": "Workflow and demo console" },
    h("div", { class: "es-drawer-h" }, h("h2", {}, I.flow({ size: 18 }), "Workflow"), h("button", { type: "button", class: "es-iconbtn", "aria-label": "Close", onclick: () => { panel.remove(); open = null; } }, I.x({ size: 18 }))), body);
  open = panel;
  document.body.appendChild(panel);
  const esc = (e) => { if (e.key === "Escape" && open === panel) { panel.remove(); open = null; document.removeEventListener("keydown", esc); } };
  document.addEventListener("keydown", esc);
  const draw = async () => {
    if (open !== panel) return;
    const parts = [];
    if (ctx.currentRef) { try { parts.push(await dealSection(ctx, ctx.currentRef, draw)); } catch (e) { parts.push(h("div", { class: "es-err" }, String(e.message || e))); } }
    parts.push(priceSection(ctx, draw));
    parts.push(await seedSection(ctx, draw));
    parts.push(h("section", { class: "es-dsec" }, h("h3", {}, "The demo script"), h("div", { class: "es-script" },
      SCRIPT.map(([href, t, s]) => h("a", { href, onclick: () => setTimeout(draw, 300) }, h("span", {}, t, h("small", {}, s)))))));
    put(body, ...parts);
  };
  await draw();
  window.addEventListener("hashchange", () => setTimeout(draw, 400));
}
