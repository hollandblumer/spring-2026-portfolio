"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./page.module.css";

const GATE_KEY = "goal-tracker-session";
const LEGACY_STORAGE_KEY = "work-goals-v1";
const PROFILES = [
  { id: "me", label: "Me", title: "My goal tracker", email: "hollandblumer6@icloud.com" },
  { id: "mom", label: "Mom", title: "Mom viewing My progress", email: "goal-tracker-mom@hollandblumer.com" },
  { id: "dad", label: "Dad", title: "Dad viewing My progress", email: "goal-tracker-dad@hollandblumer.com" },
];
const storageKeyFor = (profileId) => `work-goals-v1-${profileId}`;
const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function GoalTrackerShell() {
  const iframeRef = useRef(null);
  const saveTimerRef = useRef(null);
  const userIdRef = useRef(null);
  const profileRef = useRef(null);
  const applyingCloudStateRef = useRef(false);
  const [password, setPassword] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [familySignIns, setFamilySignIns] = useState({ mom: 0, dad: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [familyNotes, setFamilyNotes] = useState([]);
  const [noteCategory, setNoteCategory] = useState("Career");
  const [noteKind, setNoteKind] = useState("Note");
  const [noteMessage, setNoteMessage] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [noteComposerOpen, setNoteComposerOpen] = useState(false);

  const loadFamilySignIns = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("goal_tracker_sign_ins")
      .select("profile_id")
      .in("profile_id", ["mom", "dad"]);
    if (error) {
      setStatus(`Could not load sign-in counts: ${error.message}`);
      return;
    }
    setFamilySignIns({
      mom: data.filter((entry) => entry.profile_id === "mom").length,
      dad: data.filter((entry) => entry.profile_id === "dad").length,
    });
  }, []);

  const loadFamilyNotes = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("goal_tracker_family_notes")
      .select("id, author_profile, category, note_kind, message, note_date, created_at")
      .eq("note_date", localDate())
      .order("created_at", { ascending: false });
    if (error) {
      setStatus(`Could not load family notes: ${error.message}`);
      return;
    }
    setFamilyNotes(data);
  }, []);

  const saveToCloud = useCallback(async (rawState) => {
    if (!supabase || !userIdRef.current || profileRef.current !== "me" || !rawState || applyingCloudStateRef.current) return;
    let trackerState;
    try {
      trackerState = JSON.parse(rawState);
    } catch {
      setStatus("The local tracker data could not be read");
      return;
    }
    setStatus("Saving…");
    const { error } = await supabase.from("goal_tracker_data").upsert({
      user_id: userIdRef.current,
      profile_id: "me",
      tracker_state: trackerState,
      updated_at: new Date().toISOString(),
    });
    setStatus(error ? `Cloud save failed: ${error.message}` : "Saved to cloud");
  }, []);

  const loadCloudState = useCallback(async (userId, profileId, quiet = false) => {
    if (!supabase || !userId || !profileId) return;
    if (!quiet) setStatus(profileId === "me" ? "Loading cloud data…" : "Loading My progress…");
    let query = supabase
      .from("goal_tracker_data")
      .select("tracker_state");
    query = profileId === "me" ? query.eq("user_id", userId) : query.eq("profile_id", "me");
    const { data, error } = await query.maybeSingle();
    if (error) {
      setStatus(`Cloud load failed: ${error.message}`);
      return;
    }
    if (data?.tracker_state) {
      const nextState = JSON.stringify(data.tracker_state);
      const profileKey = storageKeyFor(profileId);
      if (localStorage.getItem(profileKey) === nextState) {
        if (!quiet) setStatus(profileId === "me" ? "Cloud data loaded" : "Viewing My progress — live read-only view");
        return;
      }
      applyingCloudStateRef.current = true;
      localStorage.setItem(profileKey, nextState);
      iframeRef.current?.contentWindow?.location.reload();
      window.setTimeout(() => {
        applyingCloudStateRef.current = false;
      }, 1000);
      setStatus(profileId === "me" ? "Cloud data loaded" : quiet ? "My progress updated just now" : "Viewing My progress — live read-only view");
      return;
    }
    if (profileId === "me") {
      const localState = localStorage.getItem(storageKeyFor(profileId));
      if (localState) await saveToCloud(localState);
      else setStatus("Unlocked — add a goal to start syncing");
    } else {
      setStatus("No progress has been saved yet");
    }
  }, [saveToCloud]);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      queueMicrotask(() => {
        if (active) {
          setStatus("Supabase is not configured");
          setCheckingSession(false);
        }
      });
      return () => { active = false; };
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      const storedProfileId = sessionStorage.getItem(GATE_KEY);
      const profile = PROFILES.find((item) => item.id === storedProfileId && item.email === user?.email)
        || PROFILES.find((item) => item.email === user?.email);
      if (profile) {
        userIdRef.current = user.id;
        profileRef.current = profile.id;
        setSelectedProfile(profile);
        sessionStorage.setItem(GATE_KEY, profile.id);
        const profileKey = storageKeyFor(profile.id);
        if (profile.id === "me" && !localStorage.getItem(profileKey)) {
          const legacyState = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacyState) localStorage.setItem(profileKey, legacyState);
        }
        setAuthenticated(true);
        loadCloudState(user.id, profile.id);
        if (profile.id === "me") loadFamilySignIns();
        loadFamilyNotes();
      }
      setCheckingSession(false);
    });
    return () => { active = false; };
  }, [loadCloudState, loadFamilyNotes, loadFamilySignIns]);

  useEffect(() => {
    if (!authenticated) return;
    const handleStorage = (event) => {
      if (profileRef.current !== "me") return;
      if (event.key !== storageKeyFor(profileRef.current) || !event.newValue) return;
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => saveToCloud(event.newValue), 700);
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.clearTimeout(saveTimerRef.current);
    };
  }, [authenticated, saveToCloud]);

  useEffect(() => {
    if (!authenticated || !["mom", "dad"].includes(selectedProfile?.id) || !userIdRef.current) return;
    const refreshProgress = () => loadCloudState(userIdRef.current, selectedProfile.id, true);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshProgress();
    };
    const intervalId = window.setInterval(refreshProgress, 5000);
    window.addEventListener("focus", refreshProgress);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshProgress);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [authenticated, loadCloudState, selectedProfile]);

  async function unlock(event) {
    event.preventDefault();
    if (!supabase || !selectedProfile) return;
    setSubmitting(true);
    setStatus("Checking password…");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: selectedProfile.email,
      password,
    });
    setSubmitting(false);
    if (error || !data.user) {
      setStatus(error?.message || "Could not unlock the tracker");
      return;
    }
    userIdRef.current = data.user.id;
    profileRef.current = selectedProfile.id;
    sessionStorage.setItem(GATE_KEY, selectedProfile.id);
    const profileKey = storageKeyFor(selectedProfile.id);
    if (selectedProfile.id === "me" && !localStorage.getItem(profileKey)) {
      const legacyState = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyState) localStorage.setItem(profileKey, legacyState);
    }
    setPassword("");
    setAuthenticated(true);
    const { error: signInLogError } = await supabase
      .from("goal_tracker_sign_ins")
      .insert({ user_id: data.user.id, profile_id: selectedProfile.id });
    if (signInLogError) {
      setStatus(`Unlocked, but sign-in was not recorded: ${signInLogError.message}`);
    }
    if (selectedProfile.id === "me") await loadFamilySignIns();
    await loadFamilyNotes();
    await loadCloudState(data.user.id, selectedProfile.id);
  }

  async function submitFamilyNote(event) {
    event.preventDefault();
    if (!supabase || !userIdRef.current || !["mom", "dad"].includes(selectedProfile?.id)) return;
    const message = noteMessage.trim();
    if (!message) return;
    setSendingNote(true);
    const { error } = await supabase.from("goal_tracker_family_notes").insert({
      author_user_id: userIdRef.current,
      author_profile: selectedProfile.id,
      category: noteCategory,
      note_kind: noteKind,
      message,
      note_date: localDate(),
    });
    setSendingNote(false);
    if (error) {
      setStatus(`Could not send note: ${error.message}`);
      return;
    }
    setNoteMessage("");
    setStatus("Note added");
    await loadFamilyNotes();
  }

  async function deleteFamilyNote(noteId) {
    if (!supabase) return;
    const { error } = await supabase
      .from("goal_tracker_family_notes")
      .delete()
      .eq("id", noteId);
    if (error) {
      setStatus(`Could not remove note: ${error.message}`);
      return;
    }
    setFamilyNotes((notes) => notes.filter((note) => note.id !== noteId));
  }

  async function lock() {
    await supabase?.auth.signOut();
    sessionStorage.removeItem(GATE_KEY);
    userIdRef.current = null;
    profileRef.current = null;
    setAuthenticated(false);
    setSelectedProfile(null);
    setShowSettings(false);
    setFamilyNotes([]);
    setNoteComposerOpen(false);
    setStatus("");
  }

  if (checkingSession) {
    return <main className={styles.gate}><p>Opening goal tracker…</p></main>;
  }

  if (!authenticated) {
    return (
      <main className={styles.gate}>
        <form className={styles.passwordCard} onSubmit={unlock}>
          <p className={styles.eyebrow}>Private page</p>
          <h1>Goal tracker</h1>
          <fieldset className={styles.profilePicker}>
            <legend>Who are you?</legend>
            <div>
              {PROFILES.map((profile) => (
                <button
                  type="button"
                  key={profile.id}
                  className={selectedProfile?.id === profile.id ? styles.selectedProfile : ""}
                  aria-pressed={selectedProfile?.id === profile.id}
                  onClick={() => {
                    setSelectedProfile(profile);
                    setStatus("");
                  }}
                >
                  {profile.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label htmlFor="tracker-password">Password</label>
          <input
            id="tracker-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          <button disabled={submitting || !supabase || !selectedProfile}>
            {submitting ? "Unlocking…" : "Unlock tracker"}
          </button>
          <p className={styles.signInNotice}>Successful profile sign-ins are recorded.</p>
          <p className={styles.gateStatus} role="status">{status}</p>
        </form>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.accountBar} aria-label="Goal tracker security">
        <strong>{selectedProfile?.title}</strong>
        <span className={styles.status} role="status">{status}</span>
        {selectedProfile?.id === "me" && (
          <button
            type="button"
            aria-expanded={showSettings}
            aria-controls="goal-tracker-settings"
            onClick={() => setShowSettings((visible) => !visible)}
          >
            Settings
          </button>
        )}
        <button type="button" onClick={lock}>Log out</button>
        {selectedProfile?.id === "me" && showSettings && (
          <aside id="goal-tracker-settings" className={styles.settingsPanel}>
            <h2>Settings</h2>
            <div className={styles.familyCounts}>
              <span>Mom sign-ins</span><strong>{familySignIns.mom}</strong>
              <span>Dad sign-ins</span><strong>{familySignIns.dad}</strong>
            </div>
          </aside>
        )}
      </section>
      <section
        className={`${styles.familyNotes} ${selectedProfile?.id !== "me" ? styles.familyNotesComposerDock : ""} ${noteComposerOpen ? styles.familyNotesComposerOpen : ""}`}
        aria-label="Family notes"
      >
        {selectedProfile?.id === "me" ? (
          <>
            <div className={styles.familyNotesHeading}>
              <div><span>From Mom & Dad</span><h2>Notes for today</h2></div>
              <span>{familyNotes.length} {familyNotes.length === 1 ? "message" : "messages"}</span>
            </div>
            <div className={styles.familyNoteList}>
              {familyNotes.length ? familyNotes.map((note) => (
                <article className={styles.familyNote} key={note.id}>
                  <div>
                    <span className={styles.noteKind}>{note.note_kind}</span>
                    <span className={styles.noteCategory}>{note.category}</span>
                    <span className={styles.noteAuthor}>From {note.author_profile === "mom" ? "Mom" : "Dad"}</span>
                  </div>
                  <p>{note.message}</p>
                  <button type="button" onClick={() => deleteFamilyNote(note.id)}>Remove</button>
                </article>
              )) : <p className={styles.noFamilyNotes}>No notes from Mom or Dad yet.</p>}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.noteComposerLauncher}
              aria-expanded={noteComposerOpen}
              aria-controls="family-note-composer"
              onClick={() => setNoteComposerOpen(true)}
            >
              Add a note / compliment
            </button>
            <form id="family-note-composer" className={styles.familyNoteComposer} onSubmit={submitFamilyNote}>
              <div className={styles.familyNotesHeading}>
                <div><span>Message for Me</span><h2>Add a note or compliment</h2></div>
                <button
                  type="button"
                  className={styles.noteComposerClose}
                  aria-label="Close note composer"
                  onClick={() => setNoteComposerOpen(false)}
                >×</button>
              </div>
              <div className={styles.noteOptions}>
                <label>
                  Category
                  <select value={noteCategory} onChange={(event) => setNoteCategory(event.target.value)}>
                    <option>Career</option>
                    <option>Health</option>
                    <option>Household chores</option>
                  </select>
                </label>
                <label>
                  Type
                  <select value={noteKind} onChange={(event) => setNoteKind(event.target.value)}>
                    <option>Note</option>
                    <option>Compliment</option>
                  </select>
                </label>
              </div>
              <label>
                Message
                <textarea
                  value={noteMessage}
                  onChange={(event) => setNoteMessage(event.target.value)}
                  placeholder="Write something helpful or encouraging…"
                  maxLength={1000}
                  rows={3}
                  required
                />
              </label>
              <button disabled={sendingNote}>{sendingNote ? "Adding…" : "Add to daily"}</button>
              {familyNotes.length > 0 && (
                <p className={styles.sentNoteCount}>{familyNotes.length} previously sent</p>
              )}
            </form>
          </>
        )}
      </section>
      <iframe
        ref={iframeRef}
        className={styles.tracker}
        src="/goal-tracker/tracker.html"
        title="Goal tracker"
      />
    </main>
  );
}
