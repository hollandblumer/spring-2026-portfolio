const JOB_STATUSES = ["Wishlist", "Application submitted", "Interviewing", "Offer", "Rejected", "Withdrawn"];
const MADI_POSTING_ID = "madi-creative-technologist-2026";
const MADI_DESCRIPTION = `About the job

Our client, a Fortune 100 company and the largest mutual life insurer in the U.S., is hiring a Creative Technologist for its Madi Design System team. In this role, you’ll work directly with product and design teams to build interactive prototypes and practical AI-assisted workflows, keep work aligned to Madi standards, and bring real-world insights back to help the system evolve. You’ll need to hit the ground running with hands-on experience using AI in real design and product environments, and you’ll help shape how teams choose tools and use AI responsibly.

Responsibilities

1. Prototyping & Team Partnership
• Build code-based and AI-assisted interactive prototypes on Madi to validate ideas and support user research
• Recommend the right prototyping approach and fidelity for each problem
• Ensure a clean handoff to engineering as prototypes move toward production
• Report recurring needs and gaps to the core team as candidates for new components or guidance

2. AI-Assisted Design Workflows
• Guide teams in using AI across ideation, content, prototyping, design-to-code, and documentation
• Design, pilot, and refine repeatable AI workflows
• Build reusable assets such as prompt libraries, templates, and agent configurations
• Evaluate AI outputs for accuracy, accessibility, brand alignment, and maintainability
• Apply AI guardrails, including data privacy and responsible use, for a regulated enterprise
• Monitor the AI tooling landscape and make actionable recommendations

3. Tooling Strategy & Integration
• Evaluate and recommend tools based on fit, cost, security, and integration
• Map and connect the design-to-development toolchain to reduce manual work
• Integrate documentation, design files, tokens, and code into AI workflows through APIs, integrations, and MCP
• Get more value from existing tools by assessing new features
• Lead tool pilots and document outcomes and recommendations for leadership

4. Collaboration & Enablement
• Bridge individual teams and the core Madi team, working alongside the senior creative technologist who owns components and standards
• Lead workshops, demos, and office hours on AI and prototyping
• Create guides and playbooks for Madi and AI tools
• Help teams apply Madi components, patterns, and guidance correctly

Requirements

Education: Bachelor’s degree in Computer Science, Engineering, or a related field, or equivalent experience

Experience
• 6–10+ years of front-end engineering experience with a strong UI focus
• Enterprise-scale design system experience
• Building and maintaining production React component libraries
• Supporting multiple platforms, products, and CMS ecosystems

Technical Skills
• Expert in React, JavaScript/TypeScript, HTML, and CSS
• Design tokens, theming, and scalable component architecture
• Figma integration and modern design handoff workflows
• Accessibility standards (WCAG, ADA)
• Storybook, Git, and CI/CD pipelines

AI Experience
• Hands-on use of AI tools in design or engineering workflows, or the ability to clearly explain how they apply and their trade-offs
• Knowing how to validate, test, and productionize AI-assisted outputs

Soft Skills
• Strong collaboration across design and engineering
• Clear communicator who can explain technical concepts to a range of stakeholders
• Self-starter who drives initiatives independently
• Strategic thinker who confidently influences direction

Requirements added by the job poster
• 4+ years of work experience with HTML/CSS Validation
• 4+ years of work experience with JavaScript
• 6+ years of work experience with Front End Engineering Design (FEED)`;

document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/goal-tracker/job-applications.css">');

const jobsTab = document.createElement("button");
jobsTab.type = "button";
jobsTab.id = "jobstab";
jobsTab.textContent = "Jobs";
jobsTab.setAttribute("aria-pressed", "false");
$("projectstab").after(jobsTab);

const jobsSection = document.createElement("section");
jobsSection.id = "jobssection";
jobsSection.className = "jobs-section";
jobsSection.hidden = true;
jobsSection.innerHTML = `<div class="jobs-heading"><div><h2>Job applications</h2><p>Keep each application, posting, and status in one place.</p></div><button type="button" class="jobs-add" id="jobsadd">+ Add job</button></div><div class="jobs-list" id="jobslist"></div>`;
document.querySelector("main").append(jobsSection);

const jobDialog = document.createElement("dialog");
jobDialog.className = "job-dialog";
jobDialog.innerHTML = `<form method="dialog" id="jobapplicationform"><h2 id="jobformtitle">Add job application</h2><div class="job-form-grid">
  <label>JOB TITLE<input id="jobapptitle" maxlength="300" required></label>
  <label>COMPANY<input id="jobappcompany" maxlength="300"></label>
  <label>STATUS<select id="jobappstatus">${JOB_STATUSES.map((status) => `<option>${status}</option>`).join("")}</select></label>
  <label>DATE<input id="jobappdate" type="date" required></label>
  <label class="job-wide">JOB LINK<input id="jobappurl" type="url" placeholder="https://…"></label>
  <label class="job-wide">JOB DESCRIPTION<textarea id="jobappdescription" placeholder="Paste the original job description and requirements…"></textarea></label>
  <label class="job-wide">APPLICATION QUESTION RESPONSES<textarea id="jobappresponses" placeholder="Paste the questions and the responses you submitted…"></textarea></label>
  </div><div class="job-form-actions"><button type="submit">Save application</button><button type="button" class="job-cancel" id="jobappcancel">Cancel</button></div></form>`;
document.body.append(jobDialog);

let editingJobApplicationId = null;
const jobApplications = () => state.daily.filter((entry) => entry.routine === "job-application" && (entry.jobApplication || entry.jobTitle || entry.contact));

function renderJobApplications() {
  const applications = jobApplications().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  $("jobslist").innerHTML = applications.length ? applications.map((job) => {
    const status = job.applicationStatus || (job.done ? "Application submitted" : "Wishlist");
    const link = safeLink(job.url);
    return `<article class="job-card"><div class="job-card-top"><div><h3>${esc(job.jobTitle || job.text || "Untitled role")}</h3><p class="job-company">${esc(job.contact || "Company not added")}</p></div><span class="job-status">${esc(status)}</span></div><div class="job-meta"><span>${esc(job.date || "No date")}</span></div><div class="job-content-grid"><section><h4>Job description</h4><div class="job-description">${job.jobDescription ? esc(job.jobDescription) : '<span class="job-box-empty">No job description added yet.</span>'}</div></section><section><h4>My application responses</h4><div class="job-description job-responses">${job.applicationResponses ? esc(job.applicationResponses) : '<span class="job-box-empty">No responses added yet. Select Edit to add them.</span>'}</div></section></div><div class="job-card-actions">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">Open job</a>` : ""}<button type="button" data-job-edit="${esc(job.id)}">Edit</button><button type="button" data-job-delete="${esc(job.id)}">Delete</button></div></article>`;
  }).join("") : '<p class="summary-empty">No job applications yet. Use + Add job to create one.</p>';
}

function openJobApplicationForm(job = null) {
  editingJobApplicationId = job?.id || null;
  $("jobformtitle").textContent = job ? "Edit job application" : "Add job application";
  $("jobapptitle").value = job?.jobTitle || "";
  $("jobappcompany").value = job?.contact || "";
  $("jobappstatus").value = job?.applicationStatus || "Application submitted";
  $("jobappdate").value = job?.date || $("day").value || localDay();
  $("jobappurl").value = safeLink(job?.url) || "";
  $("jobappdescription").value = job?.jobDescription || "";
  $("jobappresponses").value = job?.applicationResponses || job?.notes || "";
  jobDialog.showModal();
  $("jobapptitle").focus();
}

$("jobapplicationform").onsubmit = (event) => {
  event.preventDefault();
  const title = $("jobapptitle").value.trim();
  if (!title) return;
  const company = $("jobappcompany").value.trim();
  const status = $("jobappstatus").value;
  let job = state.daily.find((entry) => entry.id === editingJobApplicationId);
  if (!job) {
    job = { id: globalThis.crypto?.randomUUID?.() || `job-${Date.now()}`, routine: "job-application", jobApplication: true };
    state.daily.push(job);
  }
  Object.assign(job, {
    text: `Applied for ${title}${company ? ` at ${company}` : ""}`,
    jobTitle: title,
    contact: company,
    applicationStatus: status,
    date: $("jobappdate").value,
    url: $("jobappurl").value.trim(),
    jobDescription: $("jobappdescription").value.trim(),
    applicationResponses: $("jobappresponses").value.trim(),
    done: status !== "Wishlist",
    category: "Career",
  });
  jobDialog.close();
  save();
};

$("jobappcancel").onclick = () => jobDialog.close();
$("jobsadd").onclick = () => openJobApplicationForm();
$("jobslist").onclick = (event) => {
  const edit = event.target.closest("[data-job-edit]");
  const remove = event.target.closest("[data-job-delete]");
  if (edit) openJobApplicationForm(state.daily.find((entry) => entry.id === edit.dataset.jobEdit));
  if (remove) {
    state.daily = state.daily.filter((entry) => entry.id !== remove.dataset.jobDelete);
    save();
  }
};

const baseApplyViewForJobs = applyView;
applyView = function applyViewWithJobs() {
  baseApplyViewForJobs();
  jobsSection.hidden = activeView !== "jobs";
  jobsTab.setAttribute("aria-pressed", String(activeView === "jobs"));
};

jobsTab.onclick = () => {
  activeView = "jobs";
  applyView();
  renderJobApplications();
};

const baseRenderRoutinesForJobs = renderRoutines;
renderRoutines = function renderRoutinesWithJobAdd() {
  baseRenderRoutinesForJobs();
  const row = $("jobcheck")?.closest(".routine-row");
  if (!row || row.querySelector(".job-add-button")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "job-add-button";
  button.textContent = "+";
  button.setAttribute("aria-label", "Add an individual job application");
  button.onclick = () => openJobApplicationForm();
  row.append(button);

  const applicationsForDay = jobApplications().filter((job) => job.date === $("day").value);
  if (!applicationsForDay.length) return;
  const dailyList = document.createElement("div");
  dailyList.className = "daily-job-applications";
  dailyList.innerHTML = applicationsForDay.map((job) => `<article class="daily-job-card"><div class="daily-job-top"><div><strong>${esc(job.jobTitle || "Untitled role")}</strong><span>${esc(job.contact || "Company not added")}</span></div><b>${esc(job.applicationStatus || "Application submitted")}</b></div><div class="daily-job-boxes"><section><h4>Job description</h4><div>${job.jobDescription ? esc(job.jobDescription) : '<span class="job-box-empty">No description added.</span>'}</div></section><section><h4>My application responses</h4><div>${job.applicationResponses ? esc(job.applicationResponses) : '<span class="job-box-empty">No responses added yet.</span>'}</div></section></div><button type="button" class="daily-job-edit" data-daily-job-edit="${esc(job.id)}">Edit application</button></article>`).join("");
  dailyList.onclick = (event) => {
    const edit = event.target.closest("[data-daily-job-edit]");
    if (edit) openJobApplicationForm(state.daily.find((entry) => entry.id === edit.dataset.dailyJobEdit));
  };
  row.append(dailyList);
};

if (!Array.isArray(state.jobApplicationImports)) state.jobApplicationImports = [];
if (!state.jobApplicationImports.includes(MADI_POSTING_ID)) {
  state.daily.push({
    id: globalThis.crypto?.randomUUID?.() || `job-${Date.now()}`,
    routine: "job-application",
    jobApplication: true,
    jobPostingId: MADI_POSTING_ID,
    text: "Applied for Creative Technologist — Madi Design System",
    jobTitle: "Creative Technologist — Madi Design System",
    contact: "Fortune 100 mutual life insurer",
    applicationStatus: "Application submitted",
    date: localDay(),
    url: "",
    jobDescription: MADI_DESCRIPTION,
    done: true,
    category: "Career",
  });
  state.jobApplicationImports.push(MADI_POSTING_ID);
  save();
}

renderRoutines();
renderJobApplications();
applyView();
