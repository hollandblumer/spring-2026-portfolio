const baseRenderRoutinesForStretch = renderRoutines;

renderRoutines = function renderRoutinesWithStretch() {
  baseRenderRoutinesForStretch();

  const stretch = routineEntry("stretch");
  const healthSection = [...document.querySelectorAll("#routines .daily-category")]
    .find((section) => section.querySelector("h3")?.textContent === "Health");
  if (!healthSection) return;

  const row = document.createElement("div");
  row.className = "routine-row";
  row.innerHTML = `<button type="button" id="stretchcheck" class="check" aria-label="Stretch completed" aria-pressed="${Boolean(stretch?.done)}">${stretch?.done ? "✓" : ""}</button><span>Stretch</span>`;

  const stepsForm = healthSection.querySelector("#stepsform");
  healthSection.insertBefore(row, stepsForm || null);

  $("stretchcheck").onclick = () => {
    const entry = routineEntry("stretch");
    if (entry) {
      entry.done = !entry.done;
    } else {
      state.daily.push({
        id: globalThis.crypto?.randomUUID?.() || `stretch-${Date.now()}`,
        text: "Stretch",
        date: $("day").value,
        done: true,
        routine: "stretch",
      });
    }
    save();
  };
};

const baseSummaryCategoryForStretch = summaryCategory;
summaryCategory = function summaryCategoryWithStretch(goal) {
  return goal.routine === "stretch" ? "Health" : baseSummaryCategoryForStretch(goal);
};

renderRoutines();
renderSummary();
