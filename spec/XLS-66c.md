# XLS-66 Collateral Lending: a token escrow pledged to a loan, enforced by the ledger

*LiquidLabs × LiquidAcre for the XRPL Commons hackathon (NYC, 24–25 Oct 2026), track Lending & Borrowing.*

**Status: built and running.** The amendment is `CollateralLock`, branch `collateral-lock` @ `5df6bfbc9`, on top of
XRPLF/rippled 3.4.1 (six commits; `xrpld/patches/` in the platform repository). It is enabled on our private
**XLS-66 Collateral Lending devnet** (`network_id` 424, two validators), where the whole lifecycle below has passed.
It is not on any public network. The file keeps its historical name (`XLS-66c`); the product name is
**XLS-66 Collateral Lending**.

## 1. Motivation

XLS-65 (Single Asset Vault) and XLS-66 (Lending Protocol) write a loan between a vault's depositors and a borrower. The
broker's first-loss cover is the only security the ledger enforces. Collateral — an asset the borrower locks and loses
on default — was left to the application: XLS-66's `Data` field can *describe* a pledge, but nothing *enforces* it.

LiquidGold needs that enforcement. The holder locks LGAU (an MPT for allocated gold) in a token escrow (XLS-85).
Without the amendment (path A) a platform watcher decides when the escrow may be released, and both sides have to
trust the platform. With the amendment (path B) the ledger itself ties the escrow to the loan.

## 2. The change, as shipped

| Where | Field | Type | sfield | Meaning |
|---|---|---|---|---|
| `LoanSet` (transaction) and `Loan` (ledger entry) | `CollateralID` | UINT256 (Hash256) | **43** | the Escrow that secures this loan |
| `Escrow` (ledger entry) | `LoanID` | UINT256 (Hash256) | 38 (existing field) | the Loan this escrow secures. Written by the ledger at `LoanSet`, never by `EscrowCreate`. |

| | |
|---|---|
| Amendment | `CollateralLock`. ID `11F0F3F9DA19280DD86EA640007510045DBB7E84D95962B9ADD14F1A12461F68`, `Supported::Yes`, `VoteBehavior::DefaultNo` |
| New result | **`tecPLEDGED` = 201**: *"The escrow is pledged as collateral for an unpaid loan."* |
| Requires | LendingProtocol, SingleAssetVault, TokenEscrow, MPTokensV1 (all enabled on the devnet). LendingProtocolV1_1 stays off. |

### 2.1 `LoanSet` with `CollateralID`

*Preflight*

- Without the amendment the field is refused with `temDISABLED`.
- A zero ID is refused with `temINVALID`.

*Preclaim*. The escrow must pass these checks, in this order:

| Check | Refusal |
|---|---|
| The escrow exists | `tecNO_ENTRY` |
| It holds a **token** (MPT or IOU), not XRP | `tecWRONG_ASSET` |
| Its `Account` **and** `Destination` are the **borrower**. After the payoff the collateral can only go back to the borrower. | `tecNO_PERMISSION` |
| It is not already pledged (it has no `LoanID`) | `tecDUPLICATE` |
| If it has a `CancelAfter`, that is not before the loan's maturity (start + interval × payments + grace) | `tecTOO_SOON` |
| The **broker owner can receive** the collateral: it holds the asset (MPToken / trust line), is authorised, nothing is frozen and the asset can be transferred | `tecNO_AUTH`, … |

The last check means a loan is never written against collateral that could not be seized.

*Apply.* The loan stores `CollateralID` and the escrow gets `LoanID`, so each points at the other.

### 2.2 The pledge

An escrow is pledged while its `LoanID` names a loan that still has `PaymentRemaining > 0`, or that has defaulted.
While it is pledged:

- `EscrowFinish` fails with **`tecPLEDGED`**, for everyone: the borrower, the broker owner, a condition holder.
- `EscrowCancel` also fails with **`tecPLEDGED`**.

After the last `LoanPay` (or a `LoanDelete` after the payoff) the escrow finishes to the borrower as usual.

### 2.3 Default

`LoanManage` with `tfLoanDefault` checks again that the collateral can be swept to the broker owner. If it can't (for
example the issuer froze it), the default fails and the pledge stays. Otherwise the ledger:

1. removes the escrow from the borrower's, the destination's and the issuer's directories;
2. delivers the amount to the **broker owner**, exactly as an `EscrowFinish` with the broker owner as destination would
   (transfer rate locked at creation);
3. deletes the escrow.

The vault's loss is settled by the cover as in XLS-66.

### 2.4 Invariants (`ValidCollateralLock`)

- An escrow's `LoanID` is only ever added by `LoanSet`, and never changed.
- A pledged escrow is only deleted once its loan is paid off or deleted, or by the default that sweeps it.
- A new loan's `CollateralID` names an escrow that is pledged to it.
- `Loan.CollateralID` is one of the loan fields that can't be modified.

### 2.5 Tests

`src/test/app/lending/CollateralLock_test.cpp` (jtx, 440 lines) covers the lifecycle, every refusal above, the default
sweep and the feature switched off. Run it with `./xrpld --unittest=xrpl.app.CollateralLock` (verify the name with
`--unittest-list`).

## 3. Transaction flow (as run on the devnet)

```
issuer    MPTokenIssuanceCreate  LGAU · tfMPTCanEscrow | tfMPTCanTransfer
borrower  MPTokenAuthorize       (and the broker owner — it must be able to receive a seized pledge)
issuer    Payment                LGAU → borrower
broker    VaultCreate (XRP) · VaultDeposit · LoanBrokerSet · LoanBrokerCoverDeposit
borrower  EscrowCreate           Amount = LGAU (MPT) · Destination = the borrower · FinishAfter = now + a few seconds
borrower  LoanSet                CollateralID = <escrow index> · Counterparty = broker owner (CounterpartySignature)
          → Loan.CollateralID = escrow · Escrow.LoanID = loan          (written by the ledger)
anyone    EscrowFinish / EscrowCancel  → tecPLEDGED while the loan is owed
borrower  LoanPay × n            → PaymentRemaining 0
borrower  EscrowFinish           → tesSUCCESS, the LGAU returns to the borrower
   — or —
broker    LoanManage tfLoanDefault after NextPaymentDueDate + GracePeriod → the escrowed LGAU moves to the broker owner
```

Harry's proof run (`xrpld/network/proof_run_net.py`) gave:

- LoanSet `tesSUCCESS`;
- 3 × `tecPLEDGED` (EscrowFinish by the borrower, EscrowFinish by the broker owner, EscrowCancel);
- 3 × LoanPay;
- payoff EscrowFinish `tesSUCCESS`;
- default sweep `tesSUCCESS`.

The platform repeats the same lifecycle with its own signer: Platform Studio › LiquidGate › **XLS-66 live**, or
`flask lending-live`. Every hash is shown in the platform's devnet explorer (`/devnet/`).

## 4. What the platform shows

- The **Lending desk** shows the latest live run on the devnet, with the three proofs:
  - the release is refused while the loan is open;
  - the pledge is released after the payoff;
  - the pledge is seized on default.
  It reads them from `GET /api/lg/v1/lending/live`.
- **The X-ray** reads `Loan.CollateralID` and `Escrow.LoanID`.
- The **clear-signing descriptor** for `LoanSet` names `CollateralID`, so a wallet shows *which* escrow secures the
  loan before anyone signs.
- **Signing it from Python**: xrpl-py 5.2 doesn't know `CollateralID`. The platform extends the codec at run time from
  the node's own `server_definitions` (`app/services/xrpl/definitions.py`). It only adds names xrpl-py lacks, and
  refuses any conflict, so no existing field's encoding can change.

## 5. Path A (without the amendment)

The same deal, but with `Data` carrying `{escrow, grams, ltv_max}` and a platform watcher that releases the
crypto-condition's fulfillment on repayment and withholds it on default. On path A the lender's only recourse is the
cover, never the gold. That is the gap path B closes.

## 6. Differences from the 19 October draft

| Draft | Shipped |
|---|---|
| Field `CollateralEscrowID`, code 42 | `CollateralID`, code 43 |
| Feature `featureLendingCollateral` | `CollateralLock` |
| Refusal `tecNO_PERMISSION` | a dedicated `tecPLEDGED` |
| `EscrowCreate` could carry `LoanID` | only `LoanSet` writes it |
| Escrow with a platform condition | must be payable back to the borrower |
| Broker must opt in to the MPT (application check) | the ledger checks it at `LoanSet` and again at the default |

## 7. Open questions for an XRPL-Standards proposal

* Multiple escrows per loan (a top-up on the LTV ladder): one loan ↔ one escrow today.
* Partial seizure on impairment: no. Seizure is all-or-nothing at `tfLoanDefault`.
* XRP collateral: refused (`tecWRONG_ASSET`). XRP already has the vault and the cover.
* The road to mainnet: a draft XLS, then discussion, then a rippled PR (`Supported::No`), then a release, then 80 % of
  validators for two weeks. Until then this lives on our devnet only.
