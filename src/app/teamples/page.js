"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Bricolage_Grotesque } from "next/font/google";
import ElasticMenu from "../../components/ElasticMenu";
import SmearEffect from "../../components/templates/SmearEffect";
import TemplatesHeader from "../../components/templates/TemplatesHeader";

const INSTAGRAM_URL = "https://instagram.com/hollandblumer";
const LINKEDIN_URL = "https://linkedin.com/in/hollandblumer";
const CODEPEN_URL = "https://codepen.io/hollandblumer";

const FILTERS = [
  { key: "smear-effect", label: "smear effect" },
  { key: "ikat-text", label: "ikat text" },
];

const IkatText = dynamic(() => import("../../components/templates/IkatText"), {
  ssr: false,
  loading: () => (
    <div className="rounded-[26px] border border-[rgba(112,82,8,0.14)] bg-[rgba(255,255,255,0.3)] px-6 py-16 text-center text-[rgba(112,82,8,0.8)] backdrop-blur-[8px]">
      Loading ikat text...
    </div>
  ),
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect
        x="3.25"
        y="3.25"
        width="17.5"
        height="17.5"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.32 8.3a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1ZM4.93 9.66h2.78V19H4.93V9.66Zm4.52 0h2.66v1.28h.04c.37-.7 1.28-1.44 2.63-1.44 2.8 0 3.32 1.84 3.32 4.23V19h-2.78v-4.66c0-1.11-.02-2.54-1.55-2.54-1.56 0-1.79 1.21-1.79 2.46V19H9.45V9.66Z" />
    </svg>
  );
}

function CodePenIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2.75 20 8v8l-8 5.25L4 16V8L12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 2.75V21.25M4 8l8 5 8-5M4 16l8-5 8 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TemplatesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("smear-effect");

  return (
    <main className="teamples-page">
      <div className="teamples-shell">
        <div className="fixed left-5 top-5 z-[1003] flex items-center gap-3 sm:left-6 sm:top-6">
          <div className="h-11 w-11">
            <ElasticMenu
              isOpen={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            />
          </div>
        </div>

        <div className="absolute right-5 top-5 z-20 flex items-center gap-3 sm:right-6 sm:top-6">
          <a
            href={CODEPEN_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="CodePen"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(207,207,207,0.45)] bg-[rgba(112,82,8,0.35)] text-[#cfcfcf] backdrop-blur-sm transition-transform duration-200 hover:scale-105"
          >
            <CodePenIcon className="h-5 w-5" />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(207,207,207,0.45)] bg-[rgba(112,82,8,0.35)] text-[#cfcfcf] backdrop-blur-sm transition-transform duration-200 hover:scale-105"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(207,207,207,0.45)] bg-[rgba(112,82,8,0.35)] text-[#cfcfcf] backdrop-blur-sm transition-transform duration-200 hover:scale-105"
          >
            <LinkedInIcon className="h-5 w-5" />
          </a>
        </div>

        {menuOpen && (
          <button
            type="button"
            className="slideout-backdrop"
            aria-label="Close menu"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setMenuOpen(false);
            }}
          />
        )}

        <nav
          className={`slideout-menu${menuOpen ? " open" : ""}`}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <ul>
            <li>
              <a href="/" onClick={() => setMenuOpen(false)}>
                Home
              </a>
            </li>
            <li>
              <a href="/tile-lab" onClick={() => setMenuOpen(false)}>
                Tile Lab
              </a>
            </li>
            <li>
              <a href="/templates" onClick={() => setMenuOpen(false)}>
                Templates
              </a>
            </li>
            <li>
              <a
                href="mailto:hollandblumer6@icloud.com"
                onClick={() => setMenuOpen(false)}
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>

        <div className="teamples-header">
          <div className={`templates-page-title ${bricolage.className}`}>
            <TemplatesHeader />
            <p>Pick a template, adjust the settings, and export something usable.</p>
          </div>

          <div className="teamples-filter-row">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`teamples-filter-button${
                  activeFilter === filter.key ? " is-active" : ""
                } ${bricolage.className}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="teamples-content">
          {activeFilter === "smear-effect" ? (
            <SmearEffect imageUrl="https://assets.codepen.io/9259849/Screenshot%202025-11-26%20at%202.51.05%E2%80%AFPM.png" />
          ) : (
            <IkatText />
          )}
        </div>
      </div>
    </main>
  );
}
