# Security

This repository holds front ends, SDKs, a contract and specifications. It holds no key, no seed, no credential and no
address of a private node — `scripts/check.py` and the platform's own tests refuse a publish that would. If you find
one anyway, that is a finding: please report it.

## Reporting

Write to **info@liquid-labs.de** with "LiquidSettle-Hackathon security" in the subject. Say what you found, where
(file and line, or endpoint and request), and how to reproduce it. We answer within three working days and tell you
when it is fixed. Please give us that time before publishing.

## What is in scope

* These files: anything that would make a browser leak a seed, send a signed transaction somewhere else, fetch code
  from a third party, or show a *Live* label for something that was not validated on a node.
* The LiquidGate contract (`openapi/liquidgate.v1.json`): a documented endpoint whose fences (credential, scope, origin,
  rate limit, idempotency) could be bypassed as described.

## What is out of scope here

The platform that serves `/api/lg/v1` is private; its code, its infrastructure and its production domain are not in
this repository. Reports about them are still welcome at the same address — they just belong to the platform's own
security process, not to this folder.

## How signing works, for reviewers

The holder signs in their own browser (a seed with the platform's own copy of xrpl.js, or a Ledger device over WebHID)
or in the Xaman app; the server only prepares the unsigned transaction and relays the signed blob after checking it is
the transaction it expected from that wallet. Nothing in this repository can sign on anyone's behalf.
