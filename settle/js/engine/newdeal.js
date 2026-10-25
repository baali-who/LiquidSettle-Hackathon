/**
 * New deal (Figma: "New deal · modal"). Who is on the other side (search the desk's customers, or invite one), the
 * metal (Au is open; the others say SOON until a provider lists them), the bar or coin with today's oracle price,
 * where it goes (delivered · stored in the vault · stored and borrowed against), the quantity. Continue opens the
 * deal at step 2 — the provider confirms the bars.
 */
import { h, I, btn, pill, n0, n2, rl, overlay, toast, first, rlt, put } from "./kit.js";

const KINDS = [["buy_deliver", "Deliver", "Ships to the customer"], ["buy_store", "Store in the vault", "Held in their name"], ["loan", "Store & borrow", "XLS-66 loan · own node"]];

export async function openNewDeal(ctx, { customer = null } = {}) {
  const cat = await ctx.deals.catalog();
  const state = { side: "sell", customer, q: "", metal: "Au", product: "kilo", qty: 1, kind: "buy_deliver", list: [] };
  const listBox = h("div", { role: "listbox", "aria-label": "Customers" });
  const qInput = h("input", { class: "es-input", type: "search", placeholder: "Search a customer by name", "aria-label": "Search a customer" });
  const info = h("p", { class: "es-faint" });
  const prodBox = h("div", {});
  const kindBox = h("div", { class: "es-seg big", role: "group", "aria-label": "Where it goes" });
  kindBox.style.setProperty("--n", "3");
  const sum = h("div", { class: "es-sum" });
  const qtyInput = h("input", { type: "number", min: "1", max: "500", value: "1", "aria-label": "Quantity" });
  const go = btn("Continue", { kind: "mint", iconRight: I.arrow });
  const sideBox = h("div", { class: "es-seg big", role: "group", "aria-label": "Who is on the other side" });
  sideBox.style.setProperty("--n", "2");
  sideBox.style.maxWidth = "320px";

  const product = () => cat.products.find((p) => p.key === state.product);
  const drawSide = () => put(sideBox, 
    h("button", { type: "button", "aria-pressed": "true" }, h("b", {}, I.arrow({ size: 15 }), "Sell to"), h("small", {}, "Customer buys gold")),
    h("button", { type: "button", "aria-pressed": "false", disabled: true, title: "Buying from a customer comes next" }, h("b", {}, I.back({ size: 15 }), "Buy from"), h("small", {}, "Customer sells gold · soon")));

  async function search() {
    try { state.list = await ctx.deals.customers(state.q); } catch (e) { state.list = []; }
    drawList();
  }
  function drawList() {
    const rows = state.list.map((c) => h("button", { type: "button", class: "es-picker-r", role: "option", "aria-selected": state.customer && state.customer.id === c.id ? "true" : "false",
      onclick: () => { state.customer = c; drawList(); drawSum(); } },
    h("span", { class: `es-avatar sm ${state.customer && state.customer.id === c.id ? "" : "light"}`.trim() }, c.initials),
    h("span", {}, h("b", {}, c.name), h("small", {}, [c.city, c.open_deals ? `${c.open_deals} open deal${c.open_deals === 1 ? "" : "s"}` : (c.last_deal ? `last deal ${c.last_deal}` : null),
      c.kyc === "ID PENDING" ? "ID check in progress" : (c.wallet ? `wallet ${c.wallet}` : null)].filter(Boolean).join(" · "))),
    pill(c.kyc, c.verified ? "ok" : (c.kyc === "ID PENDING" ? "info" : "muted"), { size: "sm" }),
    state.customer && state.customer.id === c.id ? I.check({ size: 18 }) : h("span")));
    put(listBox, ...rows, rows.length ? null : h("div", { class: "es-empty" }, state.q ? "No customer by that name — invite one below." : "No customers yet — invite one below."));
    const c = state.customer;
    put(info, I.info({ size: 14 }), " ", c ? `Selling: ${first(c.name)} pays in ` : "Selling: the customer pays in ", rlt(),
      `; the gold ships to ${c ? "them" : "them"} or goes to ${c ? "their" : "their"} vault. Only verified customers can pay.`);
  }
  function invite() {
    const nm = h("input", { class: "es-input", placeholder: "Full name", "aria-label": "Full name" });
    const city = h("input", { class: "es-input", placeholder: "City, state", "aria-label": "City" });
    const save = btn("Invite", { kind: "mint", size: "sm", onclick: async () => {
      save.classList.add("busy");
      try { const c = await ctx.deals.invite({ name: nm.value, city: city.value }); state.customer = c; state.q = c.name; qInput.value = c.name; await search(); toast(`${c.name} invited`, "", { sub: "ID check pending — the deal can be paid once the KYC desk approves." }); form.remove(); }
      catch (e) { toast(String(e.message || e), "bad"); } finally { save.classList.remove("busy"); }
    } });
    const form = h("div", { class: "es-picker-f" }, nm, city, save);
    foot.after(form);
    nm.focus();
  }
  const foot = h("div", { class: "es-picker-f" }, h("button", { type: "button", onclick: () => ctx.operator && invite() }, "+ Invite a new customer"), h("span", {}, "ID + wallet check before the deal can be paid"));
  function drawProducts() {
    put(prodBox, ...cat.products.map((p) => h("button", { type: "button", class: "es-prod", "aria-pressed": state.product === p.key ? "true" : "false",
      onclick: () => { state.product = p.key; if (p.vault_only && state.kind === "buy_deliver") state.kind = "buy_store"; drawProducts(); drawKinds(); drawSum(); } },
    h("span", { class: "es-radio" }), h("span", {}, h("b", {}, p.title, p.tag ? pill(p.tag, p.tag === "VAULT ONLY" ? "own" : "ok", { size: "sm" }) : null), h("small", {}, p.line)),
    h("span", { class: "p" }, (p.approx ? "≈ " : "") + n0(p.price), rl()))));
  }
  function drawKinds() {
    const vaultOnly = product().vault_only;
    put(kindBox, ...KINDS.map(([k, t, s]) => h("button", { type: "button", "aria-pressed": state.kind === k ? "true" : "false", disabled: vaultOnly && k === "buy_deliver",
      onclick: () => { state.kind = k; drawKinds(); drawSum(); } }, h("b", {}, t), h("small", {}, s))));
  }
  function drawSum() {
    const p = product();
    state.qty = Math.max(1, Math.min(500, parseInt(qtyInput.value || "1", 10) || 1));
    const total = p.price * state.qty;
    const who = state.customer ? state.customer.name : "…";
    put(sum, h("span", {}, `${state.kind === "loan" ? "Selling and lending against" : "Selling"} ${state.qty} × ${p.title.replace(" bar", "").replace(" coin", " coin")} to ${who}`),
      h("small", {}, `≈ ${n0(total)} `, rlt(), ` today · locks on approval${state.kind === "loan" ? ` · borrow up to ${n0(total * 0.6)}` : ""}`));
    go.disabled = !state.customer;
  }
  const metals = h("div", {}, cat.metals.map((m) => h("button", { type: "button", class: "es-opt", "aria-pressed": m.key === state.metal ? "true" : "false", disabled: !m.open },
    h("span", { class: "es-tile gold sm" }, I.bar({ size: 16 })), h("span", {}, h("b", {}, m.name), h("small", {}, `${m.key} · ${m.fineness}`)),
    m.open ? (m.key === state.metal ? I.check({ size: 18 }) : h("span")) : pill("SOON", "muted", { size: "sm" }))),
  h("p", { class: "es-faint" }, "More metals open when a provider lists them."));
  const minus = h("button", { type: "button", "aria-label": "One fewer", onclick: () => { qtyInput.value = String(Math.max(1, state.qty - 1)); drawSum(); } }, "−");
  const plus = h("button", { type: "button", "aria-label": "One more", onclick: () => { qtyInput.value = String(Math.min(500, state.qty + 1)); drawSum(); } }, "+");
  qtyInput.addEventListener("input", drawSum);
  let t = null;
  qInput.addEventListener("input", () => { state.q = qInput.value; clearTimeout(t); t = setTimeout(search, 180); });

  const panel = h("div", { class: "es-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "es-nd-t" },
    h("div", { class: "es-modal-h" }, h("div", {}, h("h2", { id: "es-nd-t" }, "New deal"), h("p", {}, "Pick the customer, the metal, then the bar or coin")),
      h("button", { type: "button", class: "es-iconbtn", "aria-label": "Close", onclick: () => close() }, I.x({ size: 18 }))),
    h("div", { class: "es-modal-b" },
      h("div", { class: "es-modal-sec" }, h("div", { class: "es-eyebrow" }, "1 · Who is on the other side"), sideBox,
        h("div", { class: "es-picker" }, h("div", { class: "es-search" }, I.search({ size: 16 }), qInput), listBox, foot), info),
      h("div", { class: "es-split" },
        h("div", {}, h("div", { class: "es-eyebrow" }, "2 · Metal"), metals),
        h("div", {}, h("div", { class: "es-eyebrow" }, h("span", {}, "3 · Gold · bar or coin"), h("span", { class: "es-muted" }, `Price ${n2(cat.price)} `, rlt(), "/g")), prodBox,
          h("div", { class: "es-eyebrow" }, "4 · Where it goes"), kindBox))),
    h("div", { class: "es-modal-f" }, h("span", { class: "es-muted" }, "Quantity"), h("span", { class: "es-qty" }, minus, qtyInput, plus), sum,
      btn("Cancel", { onclick: () => close() }), go));
  go.addEventListener("click", async () => {
    if (!state.customer) return;
    go.classList.add("busy");
    try {
      const d = await ctx.deals.create({ customer_id: state.customer.id, kind: state.kind, product: state.product, quantity: state.qty });
      close();
      toast(`${d.ref} · Sale created`, "", { sub: `${first(state.customer.name)} · next: the provider confirms the bars` });
      ctx.navigate(`/deal/${d.ref}`);
    } catch (e) { toast(String(e.message || e), "bad"); } finally { go.classList.remove("busy"); }
  });
  const close = overlay(panel);
  drawSide(); drawProducts(); drawKinds(); drawSum();
  await search();
  if (customer) { state.customer = customer; drawList(); drawSum(); }
  qInput.focus();
}
