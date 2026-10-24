/**
 * LiquidSettle — sample data (the handoff's renderVals, in the view-model shapes LiquidGate serves).
 * Every name, amount, date, hash and tracking number here is SAMPLE DATA; the Live/Simulated chip says so
 * on every screen that shows it. The one real testnet transaction the design carried (C20593A7…) is kept
 * as the sample receipt. The provider is USRCX — United States Rare Coin & Currency, Meridian, Mississippi.
 */

export const PROVIDER = { short: "USRCX", name: "United States Rare Coin & Currency", city: "Meridian, MS", vault: "USRCX vault · Meridian, MS", vault_short: "USRCX vault", vault_id: "MS-001",
                          user: "Juan O.", initials: "JO", address: "1305 22nd Avenue, Meridian, MS 39301" };
const X = "https://testnet.xrpl.org/transactions/C20593A72A259A202685BE64E38F6F43CA2BB0FEDABC174A45B83E7D48591479";
const EXPL = "https://testnet.xrpl.org/";
const H = (s) => s + "0000000000000000000000000000000000000000000000000000000000".slice(0, 64 - s.length);
const ev = (party, event, who, when, rcpt = null, extra = {}) => ({ party, event, who, when, receipt_hash: rcpt ? H(rcpt) : null, explorer_url: rcpt === "C20593A7" ? X : (rcpt ? EXPL : null), platform_url: null, ...extra });

// ── use case 1 · the delivery (LS-1042) ──────────────────────────────────────
export function room(phase = 0) {
  const fired = phase === 2;
  const stage = [2, 4, 5][phase];
  const raw = [["Agreed", "13 Oct"], ["Payment secured", "14 Oct"], ["With USPS", phase >= 1 ? "14 Oct" : "next"], ["Paid to you", phase >= 1 ? "14 Oct" : "at USPS scan"], ["Delivered · signed", phase >= 2 ? "16 Oct" : "due 16 Oct"]];
  const steps = raw.map(([label, when], i) => ({ label, when, state: i < stage ? "done" : i === stage ? "now" : "next" }));
  const events = phase === 0 ? [
    { title: "Accepted by USPS", place: "Acceptance scan releases the payment", when: "Next", state: "next" },
    { title: "Insured label created", place: "Registered Mail · signature required", when: "14 Oct, 12:40", state: "done" },
  ] : [
    phase === 2 ? { title: "Delivered · signed by the buyer", place: "Austin, TX · ID checked · passport moved to buyer", when: "16 Oct, 11:02", state: "done" }
                : { title: "Delivery · signature required", place: "The buyer's signature moves the bar passport", when: "Expected 16 Oct", state: "next" },
    { title: "In transit", place: "Dallas, TX distribution center", when: "15 Oct, 08:15", state: "done" },
    { title: "Accepted by USPS · custody confirmed", place: "Meridian, MS · payment released", when: "14 Oct, 13:22", state: "done" },
    { title: "Insured label created", place: "Registered Mail · signature required", when: "14 Oct, 12:40", state: "done" },
  ];
  const timeline = (phase === 2 ? [ev("ledger", "Bar passport moved to buyer", "XRP Ledger", "16 Oct 11:02", "28FBBB28", { simulated: true }), ev("carrier", "Delivered · signed by the buyer", "USPS", "16 Oct 11:02")] : [])
    .concat(phase >= 1 ? [ev("ledger", "Payment released to USRCX", "XRP Ledger", "14 Oct 13:22", "13A1B024", { simulated: true }), ev("carrier", "Accepted by USPS · custody confirmed", "USPS", "14 Oct 13:22")] : [])
    .concat([ev("seller", "Insured USPS label created", "USRCX", "14 Oct 12:40"), ev("ledger", "Payment locked · price 100.00 / g", "XRP Ledger", "14 Oct 10:05", "C20593A7"),
             ev("buyer", "Buyer approved from dollar balance", "Buyer", "14 Oct 10:04"), ev("buyer", "Buyer verified identity", "Buyer", "14 Oct 09:41")]);
  return {
    sample: true, demo: true, case_id: "LS-1042", phase,
    buyer: { name: "Brad Starlinghouse", city: "Austin, TX", kyc: true, ini: "BS" },
    asset: { title: "1 Au bar · 1,000 g · 999.9", bars: 1, weight_g: 1000, fineness: "999.9", serial: "ZRH-9130DE-001", refiner: "PAMP", delivers_to: "Verified address, Austin TX",
             address_masked: "Brad Starlinghouse · •••• Lavaca St, Austin, TX 78701", documents: [{ name: "Sale agreement", url: "#" }, { name: "Assay certificate", url: "#" }, { name: "Packing list", url: "#" }], customer_ref: "HFO-2026-118" },
    amount: "100000.00", price_per_g: "100.00", price_locked_at: "2026-10-14T10:05:00Z", paid_with: "balance", carrier: "USPS · connected",
    refund_after: "2026-10-24T10:05:00Z", expected_delivery: "2026-10-16", delivered_at: fired ? "2026-10-16T11:02:00Z" : null,
    status_label: ["Payment secured · ready for USPS", "Paid · in USPS custody", "Delivered · settled"][phase],
    status_sentence: ["Secured since 14 Oct. It is paid to USRCX the moment USPS scans the insured package into its custody.",
                      "Released to USRCX on 14 Oct, 13:22, when USPS accepted the insured package. The bar passport moves to the buyer when they sign for it.",
                      "Paid on 14 Oct at USPS acceptance. Delivered 16 Oct, 11:02. The buyer signed and the bar passport is now theirs."][phase],
    expect_label: fired ? "Delivered" : "Expected delivery", expect_value: "Fri, 16 Oct",
    steps,
    usps: { tracking_number: "RE482913557US", display: "RE 482 913 557 US", url: "https://tools.usps.com/go/TrackConfirmAction?tLabels=RE482913557US", events },
    people: [{ ini: "BS", name: "Brad Starlinghouse", role: "Buyer · ID and address checked", badge: "KYC", party: "buyer" },
             { ini: "UX", name: "USRCX", role: "You · receiving", badge: "Verified", party: "seller" },
             { ini: "PS", name: "USPS Registered Mail", role: "Carrier · confirms custody · insured", badge: "Connected", party: "carrier" }],
    proof: { payment_receipt: "C20593A7…5479", escrow_id: "#21255478", release_receipt: phase >= 1 ? "13A1B024…F22F" : "At USPS acceptance", passport_receipt: fired ? "28FBBB28…0A7A" : "On signed delivery",
             refund_from: "24 Oct 2026, 10:05 UTC", customer_verified: "KYC credential · 14 Oct", explorer_url: X, platform_url: null, verify_url: X },
    receipt: fired ? { closed_at: "16 Oct 2026, 11:02 UTC", seller: "USRCX", buyer: "Brad Starlinghouse", asset: "1 Au bar · ZRH-9130DE-001", amount: "100000.00",
                       condition: "USPS custody · then signed delivery", payment_receipt: "C20593A7…5479", release_receipt: "13A1B024…F22F", passport_receipt: "28FBBB28…0A7A" } : null,
    timeline,
    live_or_simulated: { payment: "simulated", usps: "simulated", release: "simulated", passport: "simulated", anchors: "simulated" },
    links: { platform: null, shipment: null, verify: null },
  };
}

export function pay() {
  return { sample: true, case_id: "LS-1042", asset_line: "1 Au bar · 1,000 g · 999.9 · LS-1042", amount: "100000.00", price_per_g: "100.00", refund_after: "2026-10-24T10:05:00Z", refund_label: "24 Oct, 10:05",
           kyc: { verified: true, city: "Austin TX" }, quote_ttl_s: 120, ach: { routing: "•••• 0210", account: "•••• 4417", reference: "LS-1042" }, receipt: "C20593A7…5479", explorer_url: X,
           passport_serial: "ZRH-9130DE-001", live_or_simulated: { payment: "simulated", kyc: "simulated" }, links: { platform: null } };
}

export function passport(state = "delivered") {
  const vault = state === "vault";
  const custody = [
    { party: "refiner", who: "PAMP · Switzerland", what: "Cast and assayed", when: "18 Sep" },
    { party: "seller", who: "USRCX", what: "Bought from refiner", when: "29 Sep" },
  ].concat(vault ? [{ party: "buyer", who: "Brad Starlinghouse", what: `Bought · stored in the ${PROVIDER.vault} in your name`, when: "2 Oct" }]
                 : [{ party: "carrier", who: "USPS Registered Mail", what: "Custody accepted · insured, signature required", when: "14 Oct" },
                    { party: "buyer", who: "Brad Starlinghouse", what: "Signed for by the verified owner · passport transferred", when: "16 Oct" }]).reverse();
  return { sample: true, serial: "ZRH-9130DE-001", weight_g: 1000, fineness: "999.9", refiner: "PAMP", owner: "Brad Starlinghouse",
           location: vault ? `${PROVIDER.vault_short} · ${PROVIDER.vault_id}` : "With owner · Austin, TX", state, delivered_at: vault ? null : "2026-10-16",
           delivered_note: vault ? null : "You signed for the delivery on 16 Oct, and your signature moved this passport to you. USRCX was paid earlier, when USPS took custody.",
           passport_id: "0148A32E…DD23", registry_leaf: "81C0236A…", updates: 4, last_update: "16 Oct", custody,
           documents: [{ name: "Assay certificate · PAMP", url: "#", kind: "PDF" }, { name: vault ? "Vault receipt" : "Delivery receipt · signed", url: "#", kind: "PDF" }, { name: "Insurance · " + (vault ? "in the vault" : "in transit"), url: "#", kind: "PDF" }],
           explorer_url: X, platform_url: null, refusal_enforced: true, live_or_simulated: { passport: "simulated" } };
}

// ── use case 2 · the vault (LS-1044) ─────────────────────────────────────────
const SERIALS = ["ZRH-A43B12-001", "ZRH-09C824-002", "ZRH-BD9215-003", "ZRH-0B1701-004", "ZRH-82508C-005", "ZRH-A2167C-006", "ZRH-4E80A4-007", "ZRH-765AD9-008", "ZRH-F48E53-009", "ZRH-076030-010"];
const REFINERS = ["PAMP", "Valcambi", "Argor-Heraeus", "Metalor"];
export function ladderFor(loan, grams) {
  const at = (pct) => loan / (grams * pct / 100);
  return [{ at: 70, price: at(70), what: "We tell the customer", drop: "Au down 14%" }, { at: 75, price: at(75), what: "We ask for a top-up", drop: "Au down 20%" },
          { at: 80, price: at(80), what: "Loan flagged at risk", drop: "Au down 25%" }, { at: 85, price: at(85), what: "We propose a sale", drop: "Customer decides · down 29%" }];
}
export function vault({ loan = "active", price = 100 } = {}) {
  const hasLoan = loan === "active";
  const grams = 10000, principal = 600000, value = grams * price;
  const ltv = hasLoan ? principal / value * 100 : 0;
  const bars = SERIALS.map((serial, i) => ({ serial, refiner: REFINERS[i % 4], fineness: "999.9", weight_g: 1000, status: hasLoan ? "Locked · loan" : "Free" }));
  const base = [ev("seller", `10 bars booked into the ${PROVIDER.vault}`, "USRCX", "2 Oct", "53922A00"), ev("ledger", "ACH cleared · price locked at 100.00/g", "XRP Ledger", "2 Oct", "CFD509BD", { simulated: true }), ev("buyer", "Customer verified identity", "David Quartz", "1 Oct")];
  const timeline = hasLoan ? [ev("ledger", "Loan of 600,000 paid to customer wallet", "XRP Ledger", "7 Oct", "7E247977", { simulated: true }), ev("ledger", "Au locked as collateral", "XRP Ledger", "7 Oct", "C20593A7"), ev("buyer", "Customer signed loan and mandate", "David Quartz", "7 Oct")].concat(base) : base;
  const st = ltv < 70 ? "Safe" : ltv < 75 ? "Watch" : ltv < 80 ? "Top-up needed" : ltv < 85 ? "At risk" : "Sale proposed";
  return {
    sample: true, demo: true, case_id: "LS-1044", customer: { name: "David Quartz", ini: "DQ" }, grams, bars_count: 10, bars, vault: { name: PROVIDER.vault, city: PROVIDER.city, id: PROVIDER.vault_id }, insured: "Full value",
    bought_line: `Bought 2 Oct by bank transfer; price locked when the funds cleared. Stored in David Quartz's name.`,
    value, oracle: { price, time: "14:05", source: "AI price agent", published: "published on the XRP Ledger 14:05" },
    loan: hasLoan ? { amount: principal, rate_pct: 6.5, term_months: 12, next_payment: 53250, next_date: "14 Nov", outstanding: principal } : null,
    can_borrow: hasLoan ? null : { amount: principal, rate_pct: 6.5, term_months: 12 },
    ltv, status: st, status_sentence: hasLoan ? `${st} · loan is ${Math.round(ltv)}% of the Au's value` : "In vault · free. David Quartz can borrow up to 600,000 against it.",
    au_state: hasLoan ? "In vault · used for a loan" : "In vault · free",
    ladder: ladderFor(principal, grams),
    proof: { token: "LGAU · 1 per gram", held_by: "rNgT4w…8kQe", registry_receipt: "53922A00…83FB", collateral_lock: "#21255478", price_source: "AI price agent · on-ledger feed", explorer_url: X, platform_url: null, verify_url: X },
    timeline, live_or_simulated: { loan: "simulated", oracle: "simulated", lock: "simulated" }, links: { platform: null, verify: null },
  };
}

export function customer({ price = 100, loan = null, state = "home" } = {}) {
  const grams = 10000, value = grams * price;
  const amt = loan || 600000;
  const ltv = amt / value * 100;
  const room = Math.round((1 - amt / (0.7 * value)) * 100);
  const pay = Math.max(0, Math.ceil((amt - 0.675 * value) / 1000) * 1000);
  const addG = Math.max(0, Math.ceil((amt / 0.675 - value) / price / 1000) * 1000);
  const remedies = [
    { kind: "buy", title: "Buy more Au", amount: addG, amount_kind: "g", effect: `About ${addG * price >= 1000 ? (addG * price).toLocaleString("en-US") : addG * price} USD · back to ${(amt / (value + addG * price) * 100).toFixed(0)}%`, effect_ltv: amt / (value + addG * price) * 100 },
    { kind: "collateral", title: "Add collateral", amount: addG, amount_kind: "g", effect: `Lock metal you already own · back to ${(amt / (value + addG * price) * 100).toFixed(0)}%`, effect_ltv: amt / (value + addG * price) * 100 },
    { kind: "pay", title: "Pay part of the loan", amount: pay, amount_kind: "usd", effect: `Loan becomes ${(amt - pay).toLocaleString("en-US")} · back to ${((amt - pay) / value * 100).toFixed(0)}%`, effect_ltv: (amt - pay) / value * 100 },
  ];
  return {
    sample: true, demo: true, case_id: "LS-1044", grams, bars_count: 10, vault: PROVIDER.vault, vault_short: PROVIDER.vault_short, first_serial: SERIALS[0], value, oracle_price: price, options: [200000, 400000, 600000], rate_pct: 6.5, term_months: 12, max_loan: 600000,
    loan: state === "active" || state === "action" ? { amount: amt, monthly: amt * 1.065 / 12, ltv, status: ltv < 70 ? "Safe" : ltv < 80 ? "Add more" : "At risk", next_payment: amt * 1.065 / 12, next_date: "14 Nov", paid_into: "Your wallet · today" } : null,
    ltv, room_to_fall: room, remedies, state,
    proof: { vault_receipt: "53922A00…83FB", explorer_url: X, platform_url: null }, live_or_simulated: { loan: "simulated" }, links: { platform: null },
  };
}

// ── the provider desk ────────────────────────────────────────────────────────
export function desk() {
  return {
    sample: true, provider: PROVIDER, today: "2026-10-14", greeting: "Good afternoon", status_sentence: "Nothing needs you today. Every settlement is moving on its own.",
    kpis: { secured_total: 600000, deliveries_count: 2, due_next: "1 due Friday", vault_grams: 10000, vault_value: 1000000, lent_total: 600000, in_progress: 2, in_progress_detail: "1 USPS pickup today · 1 transfer clearing",
            settled_month_total: 1388500, paid_count: 9, refunded_count: 1, month: "October" },
    cases: [
      { id: "LS-1042", kind: "dl", title: "1 bar · 1,000 g · 999.9", customer: "Brad Starlinghouse", amount: "100000.00", status: "Paid · with USPS", tone: "move", detail: "Released at USPS acceptance · passport moves on signature", next: "ETA 16 Oct", active: false, href: "#/case/LS-1042?phase=1" },
      { id: "LS-1044", kind: "vt", title: `10 bars · 10 kg · stored in ${PROVIDER.city}`, customer: "David Quartz", amount: "1000000.00", status: "In vault · loan open", tone: "held", detail: "600,000 borrowed · LTV 60%", next: "Pays 14 Nov", active: false, href: "#/vault/LS-1044" },
      { id: "LS-1040", kind: "dl", title: "5 bars · 5 × 1 kg · 999.9", customer: "Chris Carson", amount: "500000.00", status: "USPS pickup today", tone: "wait", detail: "Payment secured · label created automatically", next: "Pickup 14:00", active: true, href: "#/case/LS-1042?phase=0" },
      { id: "LS-1045", kind: "vt", title: `2 bars · 2 × 1 kg · stored in ${PROVIDER.city}`, customer: "Chris Carson", amount: "200000.00", status: "Bank transfer pending", tone: "wait", detail: "KYC done · price locks when ACH clears", next: "ETA 16 Oct", active: true, href: "#/vault/LS-1044?loan=none" },
      { id: "LS-1039", kind: "dl", title: "20 coins · 1 oz each", customer: "Brad Starlinghouse", amount: "62200.00", status: "Paid", tone: "done", detail: "Released 11 Oct on accepted delivery", next: "Receipt", active: false, href: "#/case/LS-1042?phase=2" },
      { id: "LS-1036", kind: "dl", title: "1 bar · 1,000 g · 999.9", customer: "David Quartz", amount: "100000.00", status: "Refunded", tone: "back", detail: "Not accepted within 10 days", next: "Receipt", active: false, href: "#/case/LS-1042?phase=2" },
    ],
    soon: ["Real estate", "Vehicles", "Commodities", "Art"],
  };
}

// ── the presenter (two scenarios × three steps, sample data) ─────────────────
export const PRESENTER = {
  delivery: { labels: ["Payment secured", "USPS takes custody", "Delivered & signed"], mode: "Sample data · USPS scan simulated" },
  vault: { labels: ["Loan active", "Au drops to 80", "Buyer pays down"], mode: "Sample data · loan simulated" },
};
export function presenterStep(scenario, step) {
  if (scenario === "delivery") {
    const r = room(step);
    return { scenario, step, desk: r, phone: { headline: ["Your payment is secured.", "Your bar is with USPS.", "Delivered. The bar is yours."][step], eyebrow: "1 Au bar · 1,000 g · 999.9",
             money: step < 2 ? { state: ["Secured · price locked", "Paid to USRCX · insured in transit"][step], amount: "100000.00", line: ["Released to USRCX only when USPS takes custody. Back to you on 24 Oct if not.", "Registered Mail, insured. Your signature on delivery moves the bar passport to you."][step] } : null,
             passport: step === 2 ? { serial: "ZRH-9130DE-001", line: "1,000 g · 999.9", owner: "Brad Starlinghouse" } : null,
             note: { title: ["What happens next", "Track with USPS ↗", "Passport moved to you"][step], body: ["We will message you when USPS has your bar.", "RE 482 913 557 US · signature required.", "Your signature on delivery moved this passport to you."][step] } },
             timeline: [[ev("buyer", "Buyer verified identity", "Buyer", "14 Oct 09:41"), ev("ledger", "Payment secured", "XRP Ledger", "14 Oct 10:05", "C20593A7", { amount: 100000 })],
                        [ev("seller", "Packed, insured, handed to USPS", "USRCX", "14 Oct 13:10"), ev("carrier", "Accepted by USPS · custody confirmed", "USPS", "14 Oct 13:22"), ev("ledger", "Payment released to USRCX", "XRP Ledger", "14 Oct 13:22", "13A1B024", { simulated: true })],
                        [ev("carrier", "Delivered · signed by the buyer", "USPS", "16 Oct 11:02"), ev("ledger", "Bar passport moved to buyer", "XRP Ledger", "16 Oct 11:02", "28FBBB28", { simulated: true })]].slice(0, step + 1).flat().reverse() };
  }
  const price = [100, 80, 80][step], loanAmt = [600000, 600000, 540000][step];
  const v = vault({ price });
  if (step === 2) { v.loan.amount = loanAmt; v.loan.outstanding = loanAmt; v.ltv = loanAmt / (10000 * price) * 100; v.status = "Safe"; }
  const c = customer({ price, loan: loanAmt, state: step === 1 ? "action" : "active" });
  const sentence = ["Loan is 60% of the Au value. Au can fall 14% before the customer is asked to act.", "Au fell to 80.00 / g. The loan is now 75% of the value. The customer has three ways out on their phone.", "The customer paid part of the loan from their phone. It is back to 67.5%. Nothing was sold."][step];
  v.status_sentence = sentence;
  return { scenario, step, desk: v, customer: c, phone: { headline: ["Your loan is healthy.", "Au fell. Let's keep you safe.", "You're back to safe."][step], eyebrow: `Your Au · ${PROVIDER.vault} · 10,000 g`,
           note: { title: ["Next payment", "We message you first", "Payment received"][step], amount: ["53250.00", null, "60000"][step], body: ["due on 14 Nov.", "Every time. Nothing is sold without your approval.", "applied. Your loan is now 540,000."][step] } },
           timeline: [[ev("ledger", "Loan paid out", "XRP Ledger", "7 Oct", "7E247977", { amount: 600000, simulated: true }), ev("buyer", "Buyer signed loan and mandate", "Buyer", "7 Oct")],
                      [ev("ledger", "AI price agent · Au 80.00 / g", "XRP Ledger", "15 Oct 14:05", "6D8020DF", { simulated: true }), ev("seller", "Buyer notified · three ways out", "USRCX", "15 Oct 14:05")],
                      [ev("buyer", "Buyer paid part of the loan", "Buyer", "15 Oct 14:22", "F8CFE5C6", { amount: 60000 }), ev("seller", "Loan back to safe · 67.5%", "USRCX", "15 Oct 14:22")]].slice(0, step + 1).flat().reverse() };
}
