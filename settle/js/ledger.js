/* LedgerXRP (Iteration 52) — a Ledger hardware wallet over WebHID, speaking the XRP app's protocol.
 *
 * What this file is: the two commands of Ledger's XRP app (GET PUBLIC KEY, SIGN TRANSACTION), framed
 * the way the device expects over USB HID, in plain browser JavaScript served from this site — no npm,
 * no CDN, CSP `script-src 'self'`. It follows Ledger's published `@ledgerhq/hw-app-xrp` and
 * `@ledgerhq/hw-transport-webhid` byte for byte: 64-byte reports carrying channel · tag 0x05 ·
 * sequence index · (length on the first) · payload; APDU CLA 0xE0, INS 0x02 (address) / 0x04 (sign);
 * the BIP32 path as a count byte + uint32 big-endian segments; the serialised transaction streamed in
 * chunks of at most 150 bytes with P1 first/more and P2 curve | more.
 *
 * What it never does: see a key. The device answers with the public key and the address; the
 * signature is made inside the secure element after the person has read the fields on the device's
 * own screen and pressed both buttons. This site receives the DER signature and nothing else.
 *
 * Needs: Chrome, Edge or another Chromium browser (Safari and Firefox have no WebHID), a secure
 * context (https or localhost), the device unlocked with the XRP app open, and Ledger Live closed
 * (it holds the device otherwise).
 *
 * The first device run (24 Oct 2026, production, a Payment from wallet 25) found one defect: the page
 * streamed `encodeForSigning(tx)` — the serialisation WITH the 0x53545800 ("STX\0") signing prefix — but
 * the XRP app expects the plain serialisation, `encode(tx)` with `SigningPubKey` filled in, and adds the
 * prefix itself when it hashes (Ledger's own example in hw-app-xrp: `encode(transactionJSON)` → a blob that
 * starts with 120000…, and Ledger Live's coin-xrp `craftRawTransaction`: `encode(xrplTransaction)`). The
 * device parsed 0x53 as a field header, failed, and answered 0x6A80 before showing anything. Fixed on
 * 25 Oct 2026 (Iteration 54): `signFlow` hands the device `encode(...)`, and refuses a prefixed blob with
 * a sentence that says why. Confirmation on a physical device is the user's next step.
 */
(function () {
  "use strict";
  var VENDOR_ID = 0x2c97, LEDGER_USAGE_PAGE = 0xffa0, TAG = 0x05, PACKET = 64;
  var CLA = 0xe0, INS_ADDRESS = 0x02, INS_SIGN = 0x04;
  var CURVE_SECP256K1 = 0x40, CURVE_ED25519 = 0x80, P2_MORE = 0x80, FIRST_CHUNK = 150;
  var DEFAULT_PATH = "m/44'/144'/0'/0/0";
  var SIGN_TIMEOUT_MS = 300000, SIGNING_PREFIX = "53545800";      /* "STX\0" — the device adds it, the page must not */
  var STATUS = {
    0x9000: "ok",
    0x6985: "You rejected it on the device.",
    0x6a80: "The device could not parse this transaction — a field or a transaction type the XRP app on it does not know. Update the XRP app in Ledger Live, or sign this step another way.",
    0x6a81: "The device refused the data.",
    0x6a82: "The device refused the data.",
    0x6b00: "The device refused the parameters.",
    0x6d00: "The XRP app did not recognise the command — is the XRP app open on the device?",
    0x6d02: "The XRP app did not recognise the command — is the XRP app open on the device?",
    0x6e00: "That is not the XRP app — open XRP on the device and try again.",
    0x6e01: "That is not the XRP app — open XRP on the device and try again.",
    0x6511: "No app is open on the device — open XRP and try again.",
    0x6700: "The device refused the length of the data.",
    0x5515: "The device is locked — enter the PIN and try again.",
    0x6f00: "The device reported an internal error — unplug it, plug it in again, open XRP."
  };

  function LedgerError(message, code) { this.name = "LedgerError"; this.message = message; this.code = code; }
  LedgerError.prototype = Object.create(Error.prototype);

  /* ── bytes ─────────────────────────────────────────────────────────────────── */
  function hexToBytes(hex) {
    var h = String(hex || "").replace(/^0x/i, "");
    if (h.length % 2 || /[^0-9a-f]/i.test(h)) throw new LedgerError("Not hexadecimal.", "hex");
    var out = new Uint8Array(h.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
    return out;
  }
  function bytesToHex(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16);
    return s.toUpperCase();
  }
  function concat(parts) {
    var n = 0, i; for (i = 0; i < parts.length; i++) n += parts[i].length;
    var out = new Uint8Array(n), o = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
    return out;
  }
  function u16(v) { return new Uint8Array([(v >> 8) & 0xff, v & 0xff]); }
  function readU16(bytes, at) { return (bytes[at] << 8) | bytes[at + 1]; }

  /* "m/44'/144'/0'/0/0" → [0x8000002c, 0x80000090, 0x80000000, 0, 0] */
  function pathToArray(path) {
    var p = String(path || DEFAULT_PATH).trim();
    if (p.indexOf("m/") === 0) p = p.slice(2);
    var out = [];
    p.split("/").forEach(function (seg) {
      var m = /^(\d+)(['hH])?$/.exec(seg.trim());
      if (!m) throw new LedgerError("That derivation path is not valid: " + path, "path");
      var n = parseInt(m[1], 10);
      if (n > 0x7fffffff) throw new LedgerError("That derivation path is not valid: " + path, "path");
      out.push(m[2] ? (n + 0x80000000) >>> 0 : n);
    });
    if (!out.length || out.length > 10) throw new LedgerError("That derivation path is not valid: " + path, "path");
    return out;
  }
  function pathBytes(path) {
    var segs = pathToArray(path), out = new Uint8Array(1 + segs.length * 4);
    out[0] = segs.length;
    segs.forEach(function (s, i) { out[1 + i * 4] = (s >>> 24) & 0xff; out[2 + i * 4] = (s >>> 16) & 0xff; out[3 + i * 4] = (s >>> 8) & 0xff; out[4 + i * 4] = s & 0xff; });
    return out;
  }

  /* ── APDU & HID framing (hw-transport-webhid) ─────────────────────────────── */
  function apdu(ins, p1, p2, data) {
    data = data || new Uint8Array(0);
    if (data.length > 255) throw new LedgerError("APDU too long.", "apdu");
    return concat([new Uint8Array([CLA, ins, p1, p2, data.length]), data]);
  }
  /* One APDU → the 64-byte reports that carry it. */
  function frames(channel, apduBytes) {
    var data = concat([u16(apduBytes.length), apduBytes]);
    var blockSize = PACKET - 5, n = Math.ceil(data.length / blockSize);
    var padded = new Uint8Array(n * blockSize); padded.set(data);
    var out = [];
    for (var i = 0; i < n; i++) {
      var head = new Uint8Array([(channel >> 8) & 0xff, channel & 0xff, TAG, (i >> 8) & 0xff, i & 0xff]);
      out.push(concat([head, padded.subarray(i * blockSize, (i + 1) * blockSize)]));
    }
    return out;
  }
  /* The reports of one answer → the APDU response (data + 2 status bytes). */
  function Reassembler(channel) { this.channel = channel; this.data = null; this.length = 0; this.sequence = 0; }
  Reassembler.prototype.feed = function (chunk) {
    if (readU16(chunk, 0) !== this.channel) throw new LedgerError("The device answered on another channel.", "channel");
    if (chunk[2] !== TAG) throw new LedgerError("The device answered with an unexpected tag.", "tag");
    if (readU16(chunk, 3) !== this.sequence) throw new LedgerError("The device's answer arrived out of order.", "sequence");
    var body;
    if (this.data === null) { this.length = readU16(chunk, 5); this.data = new Uint8Array(0); body = chunk.subarray(7); }
    else body = chunk.subarray(5);
    this.sequence += 1;
    this.data = concat([this.data, body]);
    if (this.data.length >= this.length) return this.data.subarray(0, this.length);
    return null;
  };

  /* ── the transport ────────────────────────────────────────────────────────── */
  function Transport(device) {
    this.device = device;
    this.channel = (Math.floor(Math.random() * 0xfffe) + 1) & 0xffff;
    this.queue = Promise.resolve();
    this.pending = null;
    var self = this;
    this.onReport = function (e) {
      if (!self.pending) return;
      var chunk = new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength);
      try {
        var full = self.pending.reassembler.feed(chunk);
        if (full) { var p = self.pending; self.pending = null; p.resolve(full); }
      } catch (err) { var q = self.pending; self.pending = null; q.reject(err); }
    };
    device.addEventListener("inputreport", this.onReport);
  }
  /* `timeoutMs`: a GET PUBLIC KEY answers at once (30 s is generous); a SIGN waits for a person to read
   * every field on the device and press both buttons, so it gets five minutes — the same window the
   * prepared transaction's LastLedgerSequence leaves open for a Ledger wallet. */
  Transport.prototype.exchange = function (apduBytes, timeoutMs) {
    var self = this, wait = timeoutMs || 30000;
    var run = function () {
      return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () { if (self.pending) { self.pending = null; reject(new LedgerError("The device did not answer in time — is it unlocked, with the XRP app open? A transaction has to be approved on the device within five minutes.", "timeout")); } }, wait);
        self.pending = { reassembler: new Reassembler(self.channel),
                         resolve: function (d) { clearTimeout(timer); resolve(d); },
                         reject: function (e) { clearTimeout(timer); reject(e); } };
        var blocks = frames(self.channel, apduBytes), i = 0;
        var next = function () {
          if (i >= blocks.length) return;
          var b = blocks[i++];
          self.device.sendReport(0, b).then(next, function (e) { self.pending = null; clearTimeout(timer); reject(new LedgerError("Could not talk to the device: " + (e && e.message ? e.message : e), "usb")); });
        };
        next();
      });
    };
    var p = this.queue.then(run, run);
    this.queue = p.then(function () {}, function () {});
    return p;
  };
  Transport.prototype.close = function () {
    try { this.device.removeEventListener("inputreport", this.onReport); } catch (e) { /* already gone */ }
    return this.device.close ? this.device.close().catch(function () {}) : Promise.resolve();
  };

  /* Send one APDU, split the status word off, turn a refusal into a sentence. */
  function send(transport, ins, p1, p2, data) {
    return transport.exchange(apdu(ins, p1, p2, data), ins === INS_SIGN ? SIGN_TIMEOUT_MS : 30000).then(function (resp) {
      if (resp.length < 2) throw new LedgerError("The device answered with nothing.", "short");
      var sw = readU16(resp, resp.length - 2);
      if (sw !== 0x9000) throw new LedgerError(STATUS[sw] || ("The device refused (status 0x" + sw.toString(16) + ")."), "0x" + sw.toString(16));
      return resp.subarray(0, resp.length - 2);
    });
  }

  /* ── the XRP app's two commands ───────────────────────────────────────────── */
  function getAddress(transport, path, display, ed25519) {
    var p1 = display ? 0x01 : 0x00, p2 = ed25519 ? CURVE_ED25519 : CURVE_SECP256K1;
    return send(transport, INS_ADDRESS, p1, p2, pathBytes(path)).then(function (d) {
      var pkLen = d[0], pubkey = d.subarray(1, 1 + pkLen);
      var aLen = d[1 + pkLen], addr = d.subarray(2 + pkLen, 2 + pkLen + aLen);
      var address = ""; for (var i = 0; i < addr.length; i++) address += String.fromCharCode(addr[i]);
      return { publicKey: bytesToHex(pubkey), address: address, path: path || DEFAULT_PATH };
    });
  }
  /* The APDUs that stream a serialised transaction to the device: the PLAIN serialisation (xrpl.js
   * `encode(tx)`, `SigningPubKey` filled in) — never `encodeForSigning`, whose 53545800 prefix the device
   * adds itself before hashing. A prefixed blob is refused here, with the reason, before any APDU goes out:
   * the device would otherwise fail to parse it (0x6A80) and the page would blame the app's version. */
  function signApdus(path, rawTxHex, ed25519) {
    var pb = pathBytes(path), raw = hexToBytes(rawTxHex), curve = ed25519 ? CURVE_ED25519 : CURVE_SECP256K1;
    var out = [], offset = 0;
    if (!raw.length) throw new LedgerError("Nothing to sign.", "empty");
    if (String(rawTxHex).replace(/^0x/i, "").slice(0, 8).toUpperCase() === SIGNING_PREFIX) throw new LedgerError("This transaction carries the signing prefix (STX) — the device adds that itself and cannot read a blob that already has it. This is a bug in the page, not in the device; nothing was sent to it.", "prefix");
    while (offset < raw.length) {
      var max = offset === 0 ? FIRST_CHUNK - pb.length : FIRST_CHUNK;
      var size = Math.min(max, raw.length - offset), last = offset + size === raw.length;
      var chunk = raw.subarray(offset, offset + size);
      out.push({ p1: offset === 0 ? 0x00 : 0x01, p2: curve | (last ? 0x00 : P2_MORE), data: offset === 0 ? concat([pb, chunk]) : chunk });
      offset += size;
    }
    return out;
  }
  function signTransaction(transport, path, rawTxHex, ed25519) {
    var apdus = signApdus(path, rawTxHex, ed25519), i = 0, lastData = null;
    var step = function () {
      if (i >= apdus.length) return Promise.resolve(lastData);
      var a = apdus[i++];
      return send(transport, INS_SIGN, a.p1, a.p2, a.data).then(function (d) { lastData = d; return step(); });
    };
    return step().then(function (d) {
      if (!d || !d.length || (ed25519 ? d.length !== 64 : d[0] !== 0x30)) throw new LedgerError("The device did not return a signature.", "nosig");
      return bytesToHex(d);
    });
  }

  /* ── the public face ──────────────────────────────────────────────────────── */
  function supported() { return !!(navigator.hid && window.isSecureContext); }
  function why() {
    if (!window.isSecureContext) return "This page is not on https, so the browser will not open USB devices for it.";
    if (!navigator.hid) return "This browser has no WebHID — use Chrome, Edge or another Chromium browser on a computer. Safari and Firefox cannot talk to the device.";
    return "";
  }
  function isLedger(d) {
    return d.vendorId === VENDOR_ID && (!d.collections || !d.collections.length || d.collections.some(function (c) { return c.usagePage === LEDGER_USAGE_PAGE; }));
  }
  /* Ask for the device (a browser prompt the first time; remembered afterwards), open it. */
  function connect() {
    if (!supported()) return Promise.reject(new LedgerError(why(), "unsupported"));
    return navigator.hid.getDevices().then(function (known) {
      var have = known.filter(isLedger);
      if (have.length) return have;
      return navigator.hid.requestDevice({ filters: [{ vendorId: VENDOR_ID }] }).then(function (chosen) { return chosen.filter(isLedger); });
    }).then(function (devices) {
      if (!devices.length) throw new LedgerError("No Ledger was chosen. Plug it in, unlock it, open the XRP app, then try again.", "nodevice");
      var d = devices[0];
      return (d.opened ? Promise.resolve() : d.open()).then(function () { return new Transport(d); }, function (e) {
        throw new LedgerError("The device could not be opened" + (/busy|in use|failed to open/i.test(String(e && e.message)) ? " — close Ledger Live, it holds the device." : ": " + (e && e.message ? e.message : e)), "open");
      });
    });
  }
  function explain(err) {
    if (!err) return "Unknown error.";
    if (err.name === "LedgerError") return err.message;
    var m = String(err.message || err);
    if (/user cancelled|no device selected|must be handling a user gesture/i.test(m)) return "No device was chosen — plug the Ledger in and choose it in the browser's prompt.";
    if (/access denied|not allowed/i.test(m)) return "The browser refused access to the device — allow it in the prompt, and check that no other program holds it.";
    return m;
  }

  /* The whole signing step for the platform's pages: open the device FIRST (the browser's device prompt
   * needs the click that started this), then let the page prepare the transaction on the ledger, then
   * check the account, add the device's public key, sign on the device, rebuild the signed blob with
   * xrpl.js — the same `tx_blob` the seed path produces, relayed by the same submit route.
   *   xrpl     the xrpl.js bundle (encode)
   *   prepare  function () → Promise<tx>   the unsigned, autofilled transaction from the server
   *   opts     { address, path, publicKey, say(text), connect }
   *            publicKey: the key the wallet was linked with; one that starts with ED is an ed25519 key and
   *            selects that curve on the device (the link page reads secp256k1, so this is rare).
   * What goes to the device is `encode(tx + SigningPubKey)` — the plain serialisation. The device shows the
   * fields, hashes "STX\0" + those bytes itself and signs; the page never adds the prefix (see the file head). */
  function signFlow(xrpl, prepare, opts) {
    opts = opts || {}; var say = opts.say || function () {}; var path = opts.path || DEFAULT_PATH;
    var ed25519 = /^ED/i.test(String(opts.publicKey || ""));
    var open = opts.connect || connect;              /* a test hands in a fake device here */
    say("Connecting to the Ledger — choose it in the browser's prompt if asked…");
    return open().then(function (t) {
      var finish = function (blob) { return t.close().then(function () { return blob; }); };
      var bail = function (e) { return t.close().then(function () { throw e; }); };
      say("Reading the account from the device…");
      return getAddress(t, path, false, ed25519).then(function (a) {
        if (opts.address && a.address !== opts.address) throw new LedgerError("This device holds " + a.address + " on " + path + ", not this wallet (" + opts.address + "). Same device, same account?", "account");
        say("Preparing the transaction on the ledger…");
        return prepare().then(function (tx) {
          var signing = Object.assign({}, tx, { SigningPubKey: a.publicKey });
          delete signing.TxnSignature;
          delete signing.Signers;
          var raw = xrpl.encode(signing);
          say("Read the transaction on the device's screen and approve it there — you have five minutes…");
          return signTransaction(t, path, raw, ed25519).then(function (sig) {
            return xrpl.encode(Object.assign({}, signing, { TxnSignature: sig }));
          });
        });
      }).then(finish, bail);
    });
  }

  window.LedgerXRP = {
    DEFAULT_PATH: DEFAULT_PATH, VENDOR_ID: VENDOR_ID,
    supported: supported, why: why, connect: connect, explain: explain,
    address: getAddress, sign: signTransaction, signFlow: signFlow,
    close: function (t) { return t && t.close ? t.close() : Promise.resolve(); },
    /* for the offline self-check (tests/ledger_selfcheck.js) — pure functions, no device */
    _pathToArray: pathToArray, _pathBytes: pathBytes, _apdu: apdu, _frames: frames, _Reassembler: Reassembler, _signApdus: signApdus, _hex: bytesToHex, _Transport: Transport
  };
})();
