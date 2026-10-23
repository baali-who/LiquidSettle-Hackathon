/** One store, one `set`, many subscribers. Panels re-render on the keys they care about. */
export class Store {
  constructor(initial = {}) { this.s = { ...initial }; this.subs = []; }
  get(k) { return k === undefined ? this.s : this.s[k]; }
  set(patch) {
    const changed = Object.keys(patch).filter((k) => this.s[k] !== patch[k]);
    if (!changed.length) return;
    Object.assign(this.s, patch);
    for (const [keys, fn] of this.subs) if (!keys.length || keys.some((k) => changed.includes(k))) { try { fn(this.s, changed); } catch (e) { console.error("panel", e); } }
  }
  on(keys, fn) {
    this.subs.push([Array.isArray(keys) ? keys : [keys], fn]);
    try { fn(this.s, []); } catch (e) { console.error("panel", e); }
    return () => { this.subs = this.subs.filter((x) => x[1] !== fn); };
  }
}

export const initial = {
  gate: null, mock: false, admin: false,
  connection: "idle",              // idle | connecting | ok | auth | offline
  me: null, env: null, caseRef: "", caseDoc: null, events: [], selectedBeat: null,
  board: [], boardLast: 0, counts: null, tools: null, provenance: null, descriptors: null,
  xray: null, ladder: null, busy: false, lastError: null, settingsOpen: false,
};
