import { h, replace, card, modeChip } from "../ui.js";

/** The eleven beats, top to bottom: state from the case, mode from the environment. */
export function mountRail(root, store, actions) {
  const list = h("div", { class: "lq-rail", role: "tablist", "aria-label": "Beats" });
  root.appendChild(card("The beats", "ENV on the platform · NEW on node C", list));

  store.on(["env", "caseDoc", "selectedBeat"], (s) => {
    const beats = (s.caseDoc && s.caseDoc.beats) || (s.env && s.env.beats.map((b) => ({ ...b, state: "later", actions: [] }))) || [];
    replace(list, beats.map((b, i) => {
      const on = s.selectedBeat === b.key;
      const sub = b.state === "planned" ? "built in the 36 h" : b.state === "done" ? "done" : b.state === "current" ? "now" : b.source === "new" ? "node C" : "later";
      return h("button", { type: "button", role: "tab", "aria-selected": on ? "true" : "false",
                           class: `lq-beat ${b.state} ${on ? "on" : ""}`, onclick: () => actions.selectBeat(b.key) },
        h("span", { class: "lq-beat-n" }, b.state === "done" ? "✓" : String(i + 1)),
        h("span", { class: "lq-beat-label" }, b.label, h("span", { class: "lq-beat-sub" }, sub)),
        modeChip(b.mode));
    }));
    const on = list.querySelector(".lq-beat.on");
    if (on && list.scrollWidth > list.clientWidth + 8) on.scrollIntoView({ block: "nearest", inline: "center" });   // the phone strip
  });
}
