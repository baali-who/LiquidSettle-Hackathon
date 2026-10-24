/* LiquidSettle — the theme, applied before the first paint (Iteration 53).
 *
 * A classic script on purpose (no module, no import): it runs while the document is still parsing, so a person
 * who chose dark never sees a light flash. The choice lives in this browser only (localStorage, key
 * liquidsettle.theme) and is "light", "dark" or absent — absent follows the system (prefers-color-scheme).
 * settle.css reads the result from data-theme on <html>; ui.js's themeToggle() writes it. CSP: an external
 * file under script-src 'self', nothing inline. */
(function () {
  var KEY = "liquidsettle.theme";
  var root = document.documentElement;
  function read() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function write(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) { /* private window */ } }
  function apply(v) {
    if (v === "dark" || v === "light") root.setAttribute("data-theme", v);
    else root.removeAttribute("data-theme");
    root.classList.add("ls-html");
  }
  function current() {
    var v = root.getAttribute("data-theme");
    if (v) return v;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  apply(read());
  window.LiquidSettleTheme = {
    key: KEY,
    get: read,                                  // "" | "light" | "dark" — the saved choice
    current: current,                           // what is on screen now
    set: function (v) { write(v); apply(v); document.dispatchEvent(new CustomEvent("ls:theme", { detail: current() })); },
    toggle: function () { var next = current() === "dark" ? "light" : "dark"; this.set(next); return next; },
  };
})();
