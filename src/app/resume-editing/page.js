"use client";

import { useEffect, useMemo, useState } from "react";
import { Newsreader, Source_Serif_4 } from "next/font/google";
import styles from "./resume-editing.module.css";
import { ashbyApplication, ashbyFitRows } from "./ashbyApplication";
import { garminApplication, garminFitRows } from "./garminApplication";
import { stitchFixApplication, stitchFixFitRows } from "./stitchFixApplication";

const STORAGE_KEY = "hb-resume-editing-applications";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600", "700", "800"],
});

const emptyApplication = {
  id: "",
  role: "",
  company: "",
  postingUrl: "",
  location: "",
  status: "Applied",
  dateApplied: "",
  dateHeardBack: "",
  resumePdf: "",
  jobPosting: "",
  resumeSent: "",
  coverLetter: "",
  applicationAnswers: "",
  tailoringNotes: "",
  followUpNotes: "",
};

const starterApplication = {
  ...stitchFixApplication,
};

const seededApplications = [ashbyApplication, stitchFixApplication, garminApplication];
const fitRowsByApplicationId = {
  [ashbyApplication.id]: ashbyFitRows,
  [garminApplication.id]: garminFitRows,
  [stitchFixApplication.id]: stitchFixFitRows,
};

const contentTabs = [
  {
    id: "jobPosting",
    label: "Job Description",
    field: "jobPosting",
  },
  {
    id: "resumeSent",
    label: "Resume",
    field: "resumeSent",
  },
  {
    id: "coverLetter",
    label: "Cover Letter",
    field: "coverLetter",
  },
  {
    id: "followUpNotes",
    label: "Possible Reasons",
    field: "followUpNotes",
  },
  {
    id: "tailoringNotes",
    label: "Tailoring Notes",
    field: "tailoringNotes",
  },
  {
    id: "compare",
    label: "Compare",
    field: "compare",
  },
];

export default function ResumeEditingPage() {
  const [applications, setApplications] = useState(seededApplications);
  const [activeId, setActiveId] = useState(stitchFixApplication.id);
  const [activeContentTab, setActiveContentTab] = useState(contentTabs[0].id);
  const [leftCompareTab, setLeftCompareTab] = useState("jobPosting");
  const [rightCompareTab, setRightCompareTab] = useState("resumeSent");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedApplications = [...parsed];

          seededApplications
            .slice()
            .reverse()
            .forEach((seededApplication) => {
              const hasSeededApplication = savedApplications.some(
                (application) => application.id === seededApplication.id,
              );

              if (!hasSeededApplication) {
                savedApplications.unshift(seededApplication);
              }
            });

          const normalizedApplications = savedApplications.map((application) => {
            const seededApplication = seededApplications.find(
              (seed) => seed.id === application.id,
            );

            return seededApplication
              ? {
                  ...application,
                  status: seededApplication.status,
                  dateApplied: seededApplication.dateApplied,
                  dateHeardBack: seededApplication.dateHeardBack || "",
                  resumePdf: seededApplication.resumePdf || "",
                }
              : application;
          });

          setApplications(normalizedApplications);
          setActiveId(
            normalizedApplications.some(
              (application) => application.id === stitchFixApplication.id,
            )
              ? stitchFixApplication.id
              : normalizedApplications[0].id,
          );
        }
      }
    } catch {
      setApplications([starterApplication]);
      setActiveId("starter");
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications, hasLoaded]);

  const activeApplication = useMemo(
    () => applications.find((application) => application.id === activeId) || applications[0],
    [activeId, applications],
  );
  const activeTab = contentTabs.find((tab) => tab.id === activeContentTab) || contentTabs[0];
  const activeFitRows = fitRowsByApplicationId[activeApplication.id] || [];
  const formatDate = (value) => {
    if (!value) return "Not set";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${Number(month)}/${Number(day)}/${year}`;
  };

  const updateActive = (field, value) => {
    setApplications((current) =>
      current.map((application) =>
        application.id === activeApplication.id
          ? { ...application, [field]: value }
          : application,
      ),
    );
  };
  const compareTabs = contentTabs.filter((tab) => tab.id !== "compare");

  const renderMaterial = (tab, paneLabel) => {
    if (tab.field === "resumeSent" && activeApplication.resumePdf) {
      return (
        <div className={styles.comparePdfPanel}>
          <object
            data={activeApplication.resumePdf}
            type="application/pdf"
            className={styles.comparePdf}
            aria-label={`${activeApplication.company} resume PDF in ${paneLabel} pane`}
          >
            <p>PDF preview unavailable.</p>
          </object>
        </div>
      );
    }

    return (
      <textarea
        value={activeApplication[tab.field] || ""}
        onChange={(event) => updateActive(tab.field, event.target.value)}
      />
    );
  };

  return (
    <main
      className={`${styles.page} ${sourceSerif.variable} ${newsreader.variable} ${sourceSerif.className}`}
    >
      <section className={styles.workspace}>
        <aside className={styles.sidebar} aria-label="Applications">
          <div className={styles.applicationList}>
            {applications.map((application) => (
              <button
                type="button"
                key={application.id}
                onClick={() => setActiveId(application.id)}
                className={`${styles.applicationTab} ${
                  application.id === activeApplication.id ? styles.activeTab : ""
                }`}
              >
                <strong>{application.role || "Untitled role"}</strong>
                <span>{application.company || "Company"}</span>
              </button>
            ))}
          </div>
        </aside>

        <form className={styles.editor} onSubmit={(event) => event.preventDefault()}>
          <div className={styles.metaGrid}>
            <label>
              <span>Role</span>
              <input
                value={activeApplication.role}
                onChange={(event) => updateActive("role", event.target.value)}
              />
            </label>
            <label>
              <span>Company</span>
              <input
                value={activeApplication.company}
                onChange={(event) => updateActive("company", event.target.value)}
              />
            </label>
            <label>
              <span>Location</span>
              <input
                value={activeApplication.location}
                onChange={(event) => updateActive("location", event.target.value)}
              />
            </label>
            <label>
              <span>Date Applied</span>
              <p className={styles.fixedMetaValue}>
                {formatDate(activeApplication.dateApplied)}
              </p>
            </label>
            <label>
              <span>Date Heard Back</span>
              <p className={styles.fixedMetaValue}>
                {formatDate(activeApplication.dateHeardBack)}
              </p>
            </label>
            <label>
              <span>Status</span>
              <p className={styles.fixedMetaValue}>
                {activeApplication.status || "Denied"}
              </p>
            </label>
            <label>
              <span>Posting URL</span>
              <input
                value={activeApplication.postingUrl}
                onChange={(event) => updateActive("postingUrl", event.target.value)}
              />
            </label>
          </div>

          <div className={styles.contentTabs} role="tablist" aria-label="Application materials">
            {contentTabs.map(({ id, label }) => (
              <button
                type="button"
                key={id}
                role="tab"
                aria-selected={activeContentTab === id}
                onClick={() => setActiveContentTab(id)}
                className={`${styles.contentTab} ${
                  activeContentTab === id ? styles.activeContentTab : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab.id === "compare" ? (
            <div className={styles.compareGrid}>
              {[
                {
                  id: "left",
                  label: "Left",
                  selectedId: leftCompareTab,
                  setSelectedId: setLeftCompareTab,
                },
                {
                  id: "right",
                  label: "Right",
                  selectedId: rightCompareTab,
                  setSelectedId: setRightCompareTab,
                },
              ].map((pane) => {
                const selectedTab =
                  compareTabs.find((tab) => tab.id === pane.selectedId) || compareTabs[0];

                return (
                  <section className={styles.comparePane} key={pane.id}>
                    <div className={styles.comparePaneHeader}>
                      <span>{pane.label}</span>
                      <select
                        value={selectedTab.id}
                        onChange={(event) => pane.setSelectedId(event.target.value)}
                        aria-label={`${pane.label} comparison material`}
                      >
                        {compareTabs.map((tab) => (
                          <option key={tab.id} value={tab.id}>
                            {tab.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.compareContent}>
                      {renderMaterial(selectedTab, pane.label)}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : activeTab.field === "resumeSent" && activeApplication.resumePdf ? (
            <div className={styles.pdfPanel}>
              <object
                data={activeApplication.resumePdf}
                type="application/pdf"
                className={styles.resumePdf}
                aria-label={`${activeApplication.company} resume PDF`}
              >
                <p>PDF preview unavailable.</p>
              </object>
            </div>
          ) : (
            <label className={styles.tabPanel}>
              <textarea
                value={activeApplication[activeTab.field] || ""}
                onChange={(event) => updateActive(activeTab.field, event.target.value)}
              />
            </label>
          )}

          <div className={styles.editorFooter}>
            <p>saved in this browser</p>
          </div>
        </form>
      </section>

      {activeFitRows.length > 0 && (
        <section className={styles.fitReview} aria-label={`${activeApplication.company} fit review`}>
          <p className={styles.fitKicker}>{activeApplication.company} Fit Review</p>

          <div className={styles.fitTable}>
            <div className={styles.fitTableHead}>
              <span>Job Signal</span>
              <span>Resume / Cover Letter Evidence</span>
              <span>Selection Risk</span>
            </div>
            {activeFitRows.map((row) => (
              <article className={styles.fitRow} key={row.requirement}>
                <div>
                  <span>Job Signal</span>
                  <p>{row.requirement}</p>
                </div>
                <div>
                  <span>Evidence</span>
                  <p>{row.evidence}</p>
                </div>
                <div>
                  <span>Risk</span>
                  <p>{row.risk}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
