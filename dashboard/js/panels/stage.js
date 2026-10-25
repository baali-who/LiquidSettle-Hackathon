import { h, replace, btn, chip, modeChip, pre, toast, copyText, short } from "../ui.js";

const WHY = {
  deposit: "Ten bars reach the Zürich vault; the custodian's record opens the case. Registered post (USPS / S10) is anchored on the ledger when the bars travel.",
  credential: "The platform's credential wallet issues a KYC credential (XLS-70) to the holder; the holder accepts it. The permissioned domain (XLS-80) accepts exactly this credential.",
  mint: "The holder opts in to the LGAU issuance, the custodian authorizes and mints: 10,000 LGAU = 10,000 g (MPT value 10000000 at AssetScale 3).",
  refusal: "A juror's outsider wallet, with no credential, tries the same opt-in. The domain refuses it. The fence is the ledger's, not the platform's.",
  lock: "The holder locks the LGAU in a token escrow (XLS-85) whose condition the platform holds, and signs the sale mandate (DelegateSet, XLS-75) for Aurum.",
  vault: "NEW — on node C: the lender opens a private vault (VaultCreate · tfVaultPrivate · DomainID), deposits RLUSD, the broker registers (LoanBrokerSet) and deposits 10 % first-loss cover.",
  loan: "NEW — on node C: LoanSet writes 600,000 RLUSD at 6.5 % with the holder's counterparty signature; on path B the loan pledges the holder's self-escrow (CollateralID) and the ledger writes the loan into the escrow (LoanID): no release while the loan is owed (tecPLEDGED), the escrow to the broker on a default.",
  price: "The platform publishes the gold price in its oracle (XLS-47). The ladder reads it: 60 max · 70 notify · 75 top-up · 80 impair · 85 sale.",
  sale: "NEW — on node C: Aurum sells under the mandate and repays in one Batch (tfAllOrNothing): EscrowFinish + Payment (Delegate) + LoanPay. All or nothing.",
  payoff: "The holder pays the loan off (LoanPay — NEW on node C); the platform releases the escrow with the fulfillment; the holder burns the LGAU and the bars leave the vault.",
  verify: "The receipt is canonical JSON, hashed with SHA-256 and sealed on the ledger as a memo Payment. Anyone reads every hash back from a public node — never ours.",
};

export function mountStage(root, store, actions) {
  const head = h("div", { class: "lq-stage-title" });
  const why = h("p", { class: "lq-stage-why" });
  const tx = h("ul", { class: "lq-tx" });
  const acts = h("div", { class: "lq-actions" });
  const note = h("p", { class: "lq-hint lq-action-note" });
  const sign = h("div", {});
  root.appendChild(h("section", { class: "lq-card lq-stage" }, head, why, tx, acts, note, sign));

  store.on(["caseDoc", "selectedBeat", "env", "busy", "prep", "me"], (s) => {
    const beats = (s.caseDoc && s.caseDoc.beats) || (s.env && s.env.beats) || [];
    const b = beats.find((x) => x.key === s.selectedBeat) || beats.find((x) => x.state === "current") || beats[0];
    if (!b) { replace(head, h("h2", {}, "Connecting…")); return; }
    const scopes = (s.me && s.me.principal.scopes) || [];
    replace(head, h("h2", {}, b.label), modeChip(b.mode), b.source === "new" ? chip("node C", "blue") : chip("platform", "dim"),
            b.state ? chip(b.state, b.state === "current" ? "ok" : "dim") : null);
    why.textContent = WHY[b.key] || b.reason || "";
    replace(tx, (b.tx || []).map((t) => h("li", {}, t)));
    const items = [];
    const notes = [b.reason];
    for (const a of b.actions || []) {
      const may = scopes.includes(a.scope) || s.mock;
      if (a.kind === "operator") {
        if (a.action === "start") {
          if (!s.caseDoc) items.push(btn("Open a case (10,000 g)", { onclick: () => actions.openCase(), disabled: s.busy || !may }));
          continue;
        }
        if (a.action === "price") items.push(...priceControls(s, a, actions, may));
        else items.push(btn(a.label, { kind: a.action === "reset" ? "danger" : a.action === "sell" ? "amber" : "", disabled: s.busy || !a.available || !may,
                                       onclick: () => actions.run(a.action), title: may ? "" : `needs scope ${a.scope}` }));
      } else if (a.kind === "holder") {
        const mine = s.caseDoc && s.caseDoc.mine !== false;
        items.push(btn(a.live ? `Prepare · ${a.label}` : `Record (DEMO) · ${a.label}`,
                       { kind: a.live ? "" : "amber", disabled: s.busy || !a.available || !may || !mine,
                         onclick: () => (a.live ? actions.prepare(a.step) : actions.submitDemo(a.step)), title: may ? (mine ? "" : "not your case") : `needs scope ${a.scope}` }));
        if (a.current) notes.push(`${a.tx} is the step the case waits for${a.live ? " — LIVE: your wallet signs" : " — DEMO here: the platform records it"}.`);
      } else if (a.kind === "planned") {
        items.push(btn(a.label, { kind: "ghost", disabled: true, title: "built during the hackathon" }));
      } else if (a.kind === "read") {
        items.push(btn(a.label, { kind: "ghost", disabled: s.busy || !s.caseDoc, onclick: () => (a.action === "verify" ? actions.verify() : actions.receipt()) }));
      }
    }
    if (!s.caseDoc && b.key !== "deposit") notes.push("No case yet — open one at beat 1.");
    replace(acts, items);
    note.textContent = notes.filter(Boolean).map((n) => (/[.!?]$/.test(n) ? n : n + ".")).join(" ");
    replace(sign, s.prep && s.prep.beat === b.key ? signPanel(s, actions) : null);
  });
}

function priceControls(s, a, actions, may) {
  const presets = (s.caseDoc && s.caseDoc.ladder && s.caseDoc.ladder.presets) || [];
  const input = h("input", { class: "lq-input", type: "text", inputmode: "decimal", placeholder: "RLUSD per gram", value: s.caseDoc ? s.caseDoc.price_now : "100", "aria-label": "Price per gram" });
  const sel = h("select", { class: "lq-select", "aria-label": "Preset", onchange: () => { if (sel.value) input.value = sel.value; } },
    h("option", { value: "" }, presets.length ? "presets — one per rung" : "presets appear once the loan exists"),
    presets.map((p) => h("option", { value: p.price }, p.label)));
  const go = btn("Publish the price", { disabled: s.busy || !a.available || !may, onclick: () => actions.run("price", { price: input.value }) });
  const mkt = btn("Market price", { kind: "ghost", disabled: s.busy || !a.available || !may, onclick: () => actions.run("price", { market: 1 }) });
  return [h("div", { class: "lq-inline" }, input, sel, go, mkt)];
}

function signPanel(s, actions) {
  const p = s.prep;
  const modeBox = h("div", { class: "lq-modes" });
  const body = h("div", {});
  const hasXrpl = typeof window !== "undefined" && window.xrpl && window.xrpl.Wallet;
  const modes = [["browser", hasXrpl ? "Sign here (xrpl.js, seed never leaves this tab)" : "Paste a signed blob"], ["vault", "Sign in the platform vault"], ["demo", "Record as DEMO"]];
  let mode = p.defaultMode || (s.mock ? "demo" : "browser");
  const render = () => {
    replace(modeBox, modes.map(([k, label]) => h("label", {}, h("input", { type: "radio", name: "lq-mode", value: k, checked: mode === k, onchange: () => { mode = k; render(); } }), label)));
    const kids = [];
    if (mode === "browser") {
      if (hasXrpl) {
        const seed = h("input", { class: "lq-input lq-mono", type: "password", placeholder: "s… (testnet seed)", autocomplete: "off", "aria-label": "Seed" });
        kids.push(h("div", { class: "lq-inline" }, seed, btn("Sign & submit", { onclick: () => {
          let w;
          try { w = window.xrpl.Wallet.fromSeed(seed.value.trim()); } catch (e) { toast("That seed is not valid.", "err"); return; }
          if (w.classicAddress !== p.address) { toast(`That seed is ${w.classicAddress}, the case's holder is ${p.address}.`, "err"); return; }
          const signed = w.sign(p.tx); seed.value = ""; w = null;
          actions.submit(p.step, { mode: "browser", tx_blob: signed.tx_blob });
        } })));
        kids.push(h("p", { class: "lq-hint" }, "Testnet only. The seed is used once in this tab and wiped; the platform receives the signed blob, never the key."));
      } else {
        const blob = h("textarea", { class: "lq-input lq-mono", placeholder: "signed tx_blob (hex) from your wallet", "aria-label": "Signed blob" });
        kids.push(blob, h("div", { class: "lq-inline" }, btn("Submit the signed blob", { onclick: () => actions.submit(p.step, { mode: "browser", tx_blob: blob.value.trim() }) }),
                                                       btn("Copy the unsigned tx", { kind: "ghost", onclick: () => copyText(JSON.stringify(p.tx, null, 2)) })));
        kids.push(h("p", { class: "lq-hint" }, "Sign the JSON below with xrpl.js, Xaman or a hardware wallet and paste the blob. On the platform page xrpl.js is loaded and this becomes a seed box."));
      }
    } else if (mode === "vault") {
      kids.push(h("p", { class: "lq-hint" }, "The platform signs with the case's platform wallet (sealed key, KMS/treasury). Only for cases opened with a platform wallet."),
                btn("Sign in the vault", { onclick: () => actions.submit(p.step, { mode: "vault" }) }));
    } else {
      kids.push(h("p", { class: "lq-hint" }, "Records the step as a DEMO line (the platform refuses this where the step is LIVE, so a real transaction is never hidden)."),
                btn("Record (DEMO)", { kind: "amber", onclick: () => actions.submit(p.step, { mode: "demo" }) }));
    }
    replace(body, kids);
  };
  render();
  const d = p.descriptor;
  return h("div", { class: "lq-sign" },
    h("div", { class: "lq-sign-head" }, h("b", {}, `${p.label} — ${p.tx_type}`), chip(p.mock ? "mock" : "unsigned", p.mock ? "warn" : "dim"),
      btn("Discard", { kind: "ghost", onclick: actions.discardPrep })),
    d ? h("div", {}, h("p", { class: "lq-hint" }, d.title + " — " + d.intent),
                     h("ul", { class: "lq-desc" }, d.fields.map((f) => h("li", {}, h("span", {}, f.label),
                       h("code", {}, valueAt(p.tx, f.path, f)))))) : null,
    d && d.warnings ? h("p", { class: "lq-hint" }, d.warnings.join(" ")) : null,
    modeBox, body,
    h("details", {}, h("summary", { class: "lq-hint" }, "The unsigned transaction"), pre(p.tx)));
}

function valueAt(tx, path, f) {
  const root = path.split("[")[0].split(".")[0];
  let v = tx[root];
  if (v === undefined) return f.expected !== undefined ? `expected ${JSON.stringify(f.expected)}` : (f.hint || "—");
  if (Array.isArray(v)) return v.map((x) => (x.Permission && x.Permission.PermissionValue) || JSON.stringify(x)).join(", ");
  if (typeof v === "object") return v.value ? `${v.value} (MPT ${short(v.mpt_issuance_id, 8)})` : JSON.stringify(v);
  return typeof v === "string" && v.length > 40 ? short(v, 14) : String(v);
}
