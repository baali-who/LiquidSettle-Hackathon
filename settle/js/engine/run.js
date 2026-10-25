/**
 * Running one step of a deal: POST the action (the platform runs it in the background — a testnet transaction takes
 * 3–5 s to validate), then follow it until it is done and say what the ledger answered.
 */
import { toast, short } from "./kit.js";

const LABEL = { confirm: "Provider confirmed", agree: "Terms agreed", requote: "Price held again", pay: "Approve & pay", ach_clear: "Bank transfer cleared",
  credential: "Credential request", accept: "Credential accepted", ship: "Packed and sealed", scan: "USPS scan anchored", refund: "Refund",
  loan_open: "Loan opened", paydown: "Loan paid down", add_au: "More Au locked", buy_more: "More Au bought", repay: "Repaid and released" };

/** Follow a deal until `busy` is gone; resolves with the finished deal. */
export async function follow(ctx, ref, { every = 1400, limit = 420 } = {}) {
  for (let i = 0; i < limit; i++) {
    const d = await ctx.deals.deal(ref);
    if (!d.busy) return d;
    if (ctx.onBusy) ctx.onBusy(d);
    await new Promise((r) => setTimeout(r, every));
  }
  throw new Error("The step is still running — it continues on the server; reload in a moment.");
}

export async function runAction(ctx, ref, action, body = {}, { quiet = false } = {}) {
  const before = await ctx.deals.action(ref, action, body);
  const d = before.busy ? await follow(ctx, ref) : before;
  if (d.error) { toast(d.error, "bad", { ms: 9000 }); return d; }
  if (!quiet) {
    const last = (d.activity || [])[0];
    const sub = last ? [last.tx_type, last.result, last.hash ? short(last.hash, 4, 4) : null].filter(Boolean).join(" · ") : "";
    toast(last ? last.title : (LABEL[action] || action), last && last.pill === "REFUSED" ? "bad" : "", { sub, href: last && last.url ? last.url : null });
  }
  return d;
}

export { LABEL };
