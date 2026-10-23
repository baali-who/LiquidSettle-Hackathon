# XLS-66c — Collateralised loans: tying a token escrow to a loan on the ledger

*Draft amendment proposal from LiquidLabs for the XRPL Commons hackathon (NYC, Oct 24–25 2026), track Lending & Borrowing. Status: proposal · a prototype on a private xrpld 3.4.0 (node C) is built during the hackathon. Not on any public network.*

## 1. Motivation

XLS-65 (Single Asset Vault) and XLS-66 (Lending Protocol) write a loan between a vault's depositors and a borrower, with the broker's first-loss cover as the only on-ledger security. Collateral — an asset the borrower locks and loses on default — is left to the application layer: XLS-66's `Data` field can *describe* a pledge, but nothing on the ledger *enforces* it.

LiquidGold needs exactly that enforcement. The holder locks LGAU (an MPT, one gram of allocated gold each) in a token escrow (XLS-85) toward their own account, with a crypto-condition whose fulfillment the platform holds. Today (path A) the platform's watcher releases or withholds the fulfillment according to LoanPay / LoanManage; the ledger does not know the escrow and the loan belong together. The holder trusts the platform not to release early; the lender trusts the platform not to release late. Both trusts are unnecessary.

## 2. The change (path B)

Two optional fields and one rule.

| Object | Field | Type | sfield | Meaning |
|---|---|---|---|---|
| Loan (`LoanSet`) | `CollateralEscrowID` | UINT256 | 42 (proposed) | the Escrow ledger entry that secures this loan |
| Escrow (`EscrowCreate`) | `LoanID` | UINT256 | 43 (proposed) | the Loan ledger entry this escrow secures |

**Rule.** While a Loan whose `CollateralEscrowID` names an Escrow is open (not fully paid, not defaulted), `EscrowFinish` and `EscrowCancel` on that Escrow fail with `tecNO_PERMISSION` — for everyone, including the escrow's owner and the account named in its `Condition`. When the loan closes by full repayment (`LoanPay` reaching zero principal) the rule lifts. When the loan defaults (`LoanManage` with `tfLoanDefault`), the escrow's amount is seized into the broker's account as part of the same transaction and the Escrow entry is deleted.

**Invariants.** (1) An escrow names at most one loan and a loan at most one escrow. (2) `EscrowCreate` with `LoanID` succeeds only if the Loan exists, its `Borrower` is the escrow's `Account`, and the Loan's `CollateralEscrowID` is unset or equals the escrow's would-be index — so the two references are written in either order but always agree. (3) `LoanSet` with `CollateralEscrowID` succeeds only if the Escrow exists, its `Account` is the `Borrower`, its amount is an MPT or IOU (not XRP — XRP escrows stay as they are), and its `LoanID` is unset or equals the new Loan's index. (4) Seizure moves the full escrowed amount to the broker's account; if the broker is not authorised to hold the MPT (`RequireAuth`), the default fails with `tecNO_AUTH` — the broker must opt in before writing the loan, which the application checks at `LoanSet`.

**Feature.** `featureLendingCollateral`, default-vote no, requires `SingleAssetVault`, `LendingProtocol` and `TokenEscrow`.

## 3. Transaction flow for ZRH-001

```
holder    EscrowCreate   Amount = 10,000 LGAU (MPT 10000000 scale 3), Destination = holder, Condition = platform's, CancelAfter = term + grace
broker    LoanSet        PrincipalRequested 600,000 RLUSD · InterestRate 6500 · PaymentTotal 12 · PaymentInterval 180 (stage) · GracePeriod 600
                         CollateralEscrowID = <escrow index> · CounterpartySignature by the holder · Data = descriptor (JSON hex)
ledger    EscrowFinish   → tecNO_PERMISSION while the loan is open       (the platform's fulfillment is no longer enough)
holder    LoanPay ×12    → principal reaches zero → the rule lifts
platform  EscrowFinish   with the fulfillment → the LGAU returns to the holder → Payment (burn) → the bars leave the vault
   — or —
broker    LoanManage     tfLoanDefault after the grace period → the escrow's 10,000 LGAU move to the broker; the vault's LossUnrealized is settled by the cover
```

## 4. What the platform shows

The dashboard's beat **Lock the collateral** prints the escrow's `LoanID` once the loan exists; **The loan** prints the Loan's `CollateralEscrowID`; the X-ray reads both (`account_objects type=escrow`, `ledger_entry loan`) and shows the tie in one line. The clear-signing descriptor for `LoanSet` names the field so the holder's wallet shows *which* escrow secures the loan before they sign.

## 5. Path A (what runs without the amendment)

The same deal with `Data` carrying `{escrow: <index>, grams, ltv_max}` and the platform's watcher: every `path_a_watcher_s` seconds it reads the loan; on full repayment it releases the escrow with the fulfillment; on default it withholds the fulfillment until `CancelAfter`, then the holder's `EscrowCancel` returns the gold — which is the flaw path B closes: on path A the lender's recourse is the cover alone, never the gold.

## 6. Open questions for the proposal

* Should `LoanID` on an escrow be settable after creation (an `EscrowSet`)? We say no: a loan is written against an existing lock, the lock is never retrofitted.
* Partial seizure on partial default (impairment): we say no — impairment changes the vault's accounting, not the collateral; seizure is all-or-nothing at `tfLoanDefault`.
* Multiple escrows per loan (a top-up on the ladder's `topup` rung): we say one loan ↔ one escrow in this draft; a top-up is a second escrow tied to the same loan by a `LoanSet` update — left for XLS-66d.
