/** Custody (Iteration 52) — the five ways a person can approve a LiquidSettle step, and the sheet that lets
 *  them choose: Xaman · Uphold · Self-custody · Ledger · LiquidLabs custody.
 *
 *  The list and each option's status come from the platform (`custody` on the pay and customer documents,
 *  or the `custody` screen); the sample data carries the design's own copy. The chip on an option is its
 *  status on THAT platform (Live · Sandbox · Simulated · Device test pending · Not offered). Whether the
 *  step being approved is live or simulated is said by the step itself — the sheet repeats it.
 *
 *  The Ledger option is real as far as the device goes: `ledger.js` (the platform's own WebHID transport,
 *  copied here byte for byte — tests keep the copies identical) reads the address from the device and shows
 *  it; the approval that follows is the step's — simulated where the step is. */
import "./ledger.js";
import { h, icon } from "./ui.js";

export const OPTIONS = [
  { id: "xaman", name: "Xaman", tag: "the app on your phone", cta: "Open Xaman to approve",
    how: "A push to the Xaman app; you check the amount and the address there and tap sign. The key never leaves the phone." },
  { id: "uphold", name: "Uphold", tag: "your Uphold account", cta: "Approve with Uphold",
    how: "Uphold holds the money and the keys. A quote with every fee, one confirmation; the ledger hash lands on the receipt." },
  { id: "self", name: "Self-custody", tag: "your seed or recovery words", cta: "Sign with my seed",
    how: "Typed into this browser and signed here with the platform's own copy of xrpl.js; nothing is sent to anyone." },
  { id: "ledger", name: "Ledger", tag: "a hardware wallet over USB", cta: "Approve on the Ledger",
    how: "Nano S Plus, Nano X, Flex or Stax with the XRP app, in Chrome or Edge. The device shows the transaction and signs on its own screen." },
  { id: "platform", name: "LiquidLabs custody", tag: "the platform's vault", cta: "Approve — the vault signs",
    how: "The platform's vault signs just-in-time from a sealed key, after the custody policy (limits, allowlist) has run." },
];
export const STATUS_LABEL = { live: "Live", sandbox: "Sandbox", simulated: "Simulated", pending: "Device test pending", off: "Not offered" };

/** The custody document a screen can rely on: the platform's when the document carries one, else the sample's. */
export function custodyOf(vm, fallback) {
  if (vm && vm.custody && Array.isArray(vm.custody.options) && vm.custody.options.length) return vm.custody;
  return fallback;
}

export function statusChip(status, label = null) {
  const s = STATUS_LABEL[status] ? status : "off";
  return h("span", { class: "ls-cst-chip " + s }, h("span", { class: "dot" }), label || STATUS_LABEL[s]);
}

function shortAddr(a) { return a && a.length > 14 ? a.slice(0, 7) + "…" + a.slice(-5) : (a || ""); }

/** The sheet. `custody` is the document (options + holder); `body` the step's own lines; `stepMode` "live" | "simulated". */
export function chooser({ ctx, custody, body, stepMode = "simulated", stepName = "this step", onApprove, onClose, title = "Approve with…" }) {
  const options = (custody && custody.options && custody.options.length ? custody.options : OPTIONS.map((o) => ({ ...o, status: "simulated" })))
    .map((o) => ({ ...OPTIONS.find((d) => d.id === o.id), ...o }));
  const holder = custody && custody.holder ? custody.holder.custody_type : null;
  let chosen = (options.find((o) => o.id === holder && o.status !== "off") || options.find((o) => o.status !== "off") || options[0]).id;
  let device = null, deviceErr = null, busy = false;
  const L = window.LedgerXRP;
  let root = null;

  const connectLedger = () => {
    if (!L) { deviceErr = "The Ledger transport did not load."; draw(); return; }
    if (!L.supported()) { deviceErr = L.why(); draw(); return; }
    busy = true; deviceErr = null; draw();
    L.connect().then((t) => L.address(t, L.DEFAULT_PATH, false).then((a) => L.close(t).then(() => a), (e) => L.close(t).then(() => { throw e; })))
      .then((a) => { device = a; })
      .catch((e) => { deviceErr = L.explain(e); })
      .then(() => { busy = false; draw(); });
  };

  const draw = () => {
    const opt = options.find((o) => o.id === chosen);
    const off = opt.status === "off";
    const list = h("div", { class: "ls-options ls-cst-options", role: "radiogroup", "aria-label": "Approve with" },
      ...options.map((o) => h("button", { type: "button", role: "radio", class: "ls-option" + (o.id === chosen ? " on" : "") + (o.status === "off" ? " off" : ""), "aria-checked": o.id === chosen ? "true" : "false",
        onclick: () => { chosen = o.id; device = null; deviceErr = null; draw(); } },
        h("span", { class: "ring" }),
        h("span", { class: "body" }, h("span", { class: "ot" }, o.name, custody && custody.holder && custody.holder.custody_type === o.id ? h("span", { class: "ls-cst-holder" }, "this case's wallet") : null), h("span", { class: "os" }, o.tag)),
        statusChip(o.status, o.status_label))));
    const how = h("p", { class: "ls-cst-how" }, opt.how, opt.reason ? h("span", { class: "ls-muted" }, " · ", opt.reason) : null);
    let ledgerBox = null;
    if (opt.id === "ledger") {
      ledgerBox = h("div", { class: "ls-cst-ledger" },
        device ? h("div", { class: "ls-cst-dev ok" }, icon.check({ stroke: "#007A5C", size: 14 }), " Device account ", h("code", {}, shortAddr(device.address)), " · ", h("code", {}, device.path))
               : h("div", { class: "ls-cst-dev" }, "Plug the Ledger in, unlock it, open the XRP app, close Ledger Live."),
        deviceErr ? h("div", { class: "ls-cst-err" }, deviceErr) : null,
        device ? null : h("button", { type: "button", class: "ls-btn block", disabled: busy ? "disabled" : null, onclick: connectLedger }, busy ? "Connecting…" : "Connect the Ledger and read the account"));
    }
    const simulated = stepMode !== "live";
    const foot = h("p", { class: "ls-cst-foot" }, simulated
      ? ["In LiquidSettle ", stepName, " is ", h("b", {}, "simulated"), ": approving records the step; nothing is signed. The chip on each option is its status on the platform, where the same choice signs for real."]
      : ["This step is ", h("b", {}, "live"), ": the platform's wallet signs it the way the chosen option does."]);
    const cta = opt.id === "ledger" && !device ? "Approve on the Ledger" : opt.cta;
    const approve = h("button", { type: "button", class: "ls-btn dark block", disabled: off || (opt.id === "ledger" && !device && !deviceErr) ? "disabled" : null, onclick: onApprove },
      opt.id === "xaman" ? icon.phone() : opt.id === "ledger" ? icon.lockSm({ stroke: "#FFFFFF" }) : opt.id === "platform" ? icon.vault({ stroke: "#FFFFFF", size: 16 }) : icon.shield({ stroke: "#FFFFFF", size: 16 }),
      off ? opt.name + " is not offered here" : (opt.id === "ledger" && !device && deviceErr ? "Approve anyway (simulated)" : cta));
    const sheet = h("div", { class: "ls-sheet ls-cst-sheet", role: "dialog", "aria-modal": "true", "aria-label": title }, h("span", { class: "grab" }), h("h2", {}, title), list, how, ledgerBox, ...(Array.isArray(body) ? body : [body]), approve, foot,
      h("a", { class: "ls-small ls-strong ls-cst-more", href: ctx.href("/custody", custody && custody.case_id ? { case: custody.case_id } : null) }, "The five ways, explained →"),
      h("button", { type: "button", class: "ls-btn text ls-self-center", onclick: onClose }, "Not now"));
    const scrim = h("div", { class: "ls-sheet-scrim", onclick: (e) => { if (e.target === e.currentTarget && onClose) onClose(); } }, sheet);
    if (root && root.parentNode) root.parentNode.replaceChild(scrim, root);
    root = scrim;
    return scrim;
  };
  return draw();
}
