const baseRenderRoutinesForStretch = renderRoutines;
const DUOLINGO_LANGUAGES = ["Chess", "French", "Italian", "Chinese"];

document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/goal-tracker/health-routines.css?v=2">');

function attachRoutineVideoLink(row, routine, text) {
  if (!row) return;
  const entry = routineEntry(routine);
  const url = safeLink(entry?.url) || "";
  const details = document.createElement("details");
  details.className = "routine-video-link";
  details.innerHTML = `<summary>${url ? "Video link saved" : "Add video link"}</summary><form class="routine-video-form"><input type="url" aria-label="${esc(text)} video link" placeholder="https://…" value="${esc(url)}"><button type="submit">Save link</button></form>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open saved video</a>` : ""}`;
  details.querySelector("form").onsubmit = (event) => {
    event.preventDefault();
    const input = details.querySelector("input");
    const nextUrl = input.value.trim();
    if (nextUrl && !safeLink(nextUrl)) {
      input.setCustomValidity("Enter a full http or https link.");
      input.reportValidity();
      return;
    }
    let savedEntry = routineEntry(routine);
    if (!savedEntry && nextUrl) {
      savedEntry = {
        id: globalThis.crypto?.randomUUID?.() || `${routine}-${Date.now()}`,
        text,
        date: $("day").value,
        done: false,
        routine,
      };
      state.daily.push(savedEntry);
    }
    if (savedEntry) savedEntry.url = nextUrl;
    save();
  };
  row.append(details);
}

renderRoutines = function renderRoutinesWithStretch() {
  baseRenderRoutinesForStretch();

  const stretch = routineEntry("stretch");
  const healthSection = [...document.querySelectorAll("#routines .daily-category")]
    .find((section) => section.querySelector("h3")?.textContent === "Health");
  if (!healthSection) return;

  const duolingo = routineEntry("duolingo");
  const duolingoRow = $("duocheck")?.closest(".routine-row");
  if (duolingoRow) {
    const duolingoLabel = duolingoRow.querySelector(":scope > span");
    if (duolingoLabel && duolingo?.languages?.length) {
      duolingoLabel.textContent = `Duolingo — ${duolingo.languages.join(", ")}`;
    }
    const languagePicker = document.createElement("fieldset");
    languagePicker.className = "duolingo-languages";
    languagePicker.innerHTML = `<legend>What did you study?</legend>${DUOLINGO_LANGUAGES.map((language) => `<label><input type="checkbox" value="${language}" ${(duolingo?.languages || []).includes(language) ? "checked" : ""}>${language}</label>`).join("")}`;
    languagePicker.onchange = () => {
      let entry = routineEntry("duolingo");
      if (!entry) {
        entry = {
          id: globalThis.crypto?.randomUUID?.() || `duolingo-${Date.now()}`,
          text: "Duolingo",
          date: $("day").value,
          done: false,
          routine: "duolingo",
        };
        state.daily.push(entry);
      }
      entry.languages = [...languagePicker.querySelectorAll("input:checked")].map((input) => input.value);
      entry.text = entry.languages.length ? `Duolingo — ${entry.languages.join(", ")}` : "Duolingo";
      save();
    };
    duolingoRow.append(languagePicker);
  }

  attachRoutineVideoLink($("armcheck")?.closest(".routine-row"), "arms", "10-minute arm workout");

  const row = document.createElement("div");
  row.className = "routine-row";
  row.innerHTML = `<button type="button" id="stretchcheck" class="check" aria-label="Stretch completed" aria-pressed="${Boolean(stretch?.done)}">${stretch?.done ? "✓" : ""}</button><span>Stretch</span>`;

  const stepsForm = healthSection.querySelector("#stepsform");
  healthSection.insertBefore(row, stepsForm || null);
  attachRoutineVideoLink(row, "stretch", "Stretch");

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
