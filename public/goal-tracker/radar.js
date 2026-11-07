state.radar = Array.isArray(state.radar) ? state.radar : [];

if (readOnlyProfile) {
  const mutationSelector = [
    ".plus", ".check", ".del", ".tiny", "[data-action]", "[data-optional]",
    "[data-food-edit]", "[data-food-delete]", "#foodsave", "#foodcancel",
    "[data-restaurant]", ".radar-check", ".radar-delete",
  ].join(",");
  document.addEventListener("click", (event) => {
    if (!event.target.closest(mutationSelector)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  document.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  if ($("feeling")) $("feeling").readOnly = true;
}

if (profileId === "me" && !state.radarSeeded) {
  const starterItems = [
    "Get paper towels",
    "Get underwear",
    "See how to fix Mimi's website",
  ];
  for (const text of starterItems) {
    if (!state.radar.some((item) => item.text.toLowerCase() === text.toLowerCase())) {
      state.radar.push({
        id: globalThis.crypto?.randomUUID?.() || `radar-${Date.now()}-${Math.random()}`,
        text,
        done: false,
      });
    }
  }
  state.radarSeeded = true;
  localStorage.setItem(key, JSON.stringify(state));
}

const baseApplyView = applyView;
applyView = function applyViewWithRadar() {
  baseApplyView();
  $("radarsection").hidden = activeView !== "radar";
  $("radartab").setAttribute("aria-pressed", String(activeView === "radar"));
};

function renderRadar() {
  const open = state.radar.filter((item) => !item.done);
  const complete = state.radar.filter((item) => item.done);
  const ordered = [...open, ...complete];
  $("radarlist").innerHTML = ordered.length
    ? ordered.map((item) => `
      <div class="radar-item ${item.done ? "done" : ""}">
        <button
          type="button"
          class="radar-check"
          data-radar-toggle="${esc(item.id)}"
          aria-label="${item.done ? "Reopen" : "Complete"} ${esc(item.text)}"
          aria-pressed="${item.done}"
        >${item.done ? "✓" : ""}</button>
        <span>${esc(item.text)}</span>
        <button
          type="button"
          class="radar-delete"
          data-radar-delete="${esc(item.id)}"
          aria-label="Delete ${esc(item.text)}"
        >×</button>
      </div>
    `).join("")
    : '<p class="radar-empty">Nothing on your radar right now.</p>';
}

$("radartab").onclick = () => {
  activeView = "radar";
  renderRadar();
  applyView();
};

$("radarform").onsubmit = (event) => {
  event.preventDefault();
  const text = $("radarinput").value.trim();
  if (!text) return;
  state.radar.push({
    id: globalThis.crypto?.randomUUID?.() || `radar-${Date.now()}-${Math.random()}`,
    text,
    done: false,
  });
  $("radarinput").value = "";
  save();
  renderRadar();
};

$("radarlist").onclick = (event) => {
  const toggle = event.target.closest("[data-radar-toggle]");
  const remove = event.target.closest("[data-radar-delete]");
  if (toggle) {
    const item = state.radar.find((entry) => entry.id === toggle.dataset.radarToggle);
    if (item) item.done = !item.done;
  }
  if (remove) {
    state.radar = state.radar.filter((entry) => entry.id !== remove.dataset.radarDelete);
  }
  if (toggle || remove) {
    save();
    renderRadar();
  }
};

renderRadar();
applyView();
