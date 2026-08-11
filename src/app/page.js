"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bricolage_Grotesque } from "next/font/google";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import Preloader from "../components/Preloader";
import Carousel from "../components/Carousel";
import ImageSpiralCarousel from "../components/ImageSpiralCarousel";
import ElasticMenu from "../components/ElasticMenu";
import ProjectPageTransition from "../components/ProjectPageTransition";

const INSTAGRAM_URL = "https://instagram.com/hollandblumer";
const LINKEDIN_URL = "https://linkedin.com/in/hollandblumer";
const PROJECT_FILTERS = [
  { value: "all", label: "All" },
  { value: "typography", label: "Typography" },
  { value: "grid-layouts", label: "Grid Layouts" },
  { value: "fullstack-projects", label: "Fullstack Projects" },
  { value: "cms-websites", label: "CMS Websites" },
];

const FILTER_PROJECT_INDICES = {
  all: Array.from({ length: 12 }, (_, index) => index),
  typography: [0, 2, 3, 6],
  "grid-layouts": [1, 5, 7, 9],
  "fullstack-projects": [1, 4, 10],
  "cms-websites": [5, 8, 11],
};
const PROJECTS = [
  {
    id: "spiral-experiment",
    title: "Spiral Experiment",
    type: "video",
    src: "/videos/spring.mp4",
    poster: "/videos/spring-poster.jpg",
  },
  {
    id: "poster-blueprint",
    title: "Poster Blueprint",
    type: "image",
    src: "/poster-blueprint/snapshot.png",
    poster: "/poster-blueprint/snapshot.png",
    href: "/poster-blueprint/",
    displayWidthMultiplier: 2.15,
  },
  {
    id: "type-lab",
    title: "Type Experiments",
    type: "video",
    src: "/videos/typeexperiments.mp4",
    poster: "/videos/typeexperiments-poster.jpg",
    spiralMobileTextureZoom: 1.85,
    blurb:
      "Lately I have been experimenting with type as something more fluid than fixed, stretching, blurring, contouring, and melting words until they start to feel almost alive. A lot of this came from building custom SVG filters and layering blur with thresholding to create those hollow, glowing contours, then pushing that into different directions. In some cases it turned into a drawing tool where shapes merge like metaballs, in others into these percentage counters where each number is constantly forming and breaking apart, and in others into words that feel like they're rising and pulling themselves out of a kind of molten base.\n\nI kept playing with timing, too, letting things pulse, stagger, or drift so nothing locks into a perfectly clean state. It was less about a final system and more about seeing how far I could push distortion, motion, and interaction while still keeping just enough of the original word there.",
  },
  {
    id: "countdown",
    title: "Countdown",
    type: "video",
    src: "/videos/count.mp4",
    poster: "/videos/count-poster.jpg",
    blurb:
      "Inspired by that New Year's Eve countdown feeling where everything tightens right before midnight. I used Three.js to take 3, 2, 1 and let them build instead of just appear. The numbers kind of form out of these vertical ribbons that stretch, snap, and settle, almost like they're being pulled into place.\n\nIt's less about clearly reading the digits and more about that moment of anticipation. Each transition has a bit of randomness to it, so it never feels perfectly clean, more like that chaotic energy right before the drop. The forms push forward, collapse back, and then lock in just long enough before shifting again.",
  },
  {
    id: "3d-motion-marbling",
    title: "3D Motion Marbling",
    type: "image",
    src: "/projects/3dmotionmarbling.png",
    poster: "/projects/3dmotionmarbling.png",
    href: "/3d-motion-marbling/",
  },
  {
    id: "templates",
    title: "Templates",
    type: "video",
    src: "/videos/templates-optimized.mp4",
    poster: "/videos/templates-poster.jpg",
    href: "/templates",
  },
  {
    id: "noony",
    title: "Noony",
    type: "video",
    src: "/videos/noony-optimized.mp4",
    poster: "/videos/noony-poster.jpg",
    blurb:
      "This animation was made for a friend's DJ set and built around the feeling of pressure building inside a poster. The stacked NOONY text pulls itself into place, then gets caught in a pulsing vortex that twists and distorts the center without ever fully breaking the composition apart.\n\nWhat I like about it is the tension between legibility and motion. The type stretches, settles, and then starts oscillating again, so it feels less like a static flyer and more like the set is already in motion before the music even starts. The grain, deep reds, and spiral distortion push it into something a little delirious, which felt right for the energy of the night.",
  },
  {
    id: "checkerboard-in-motion",
    title: "Checkerboard in Motion",
    type: "video",
    src: "https://assets.codepen.io/9259849/5cc44ca4-52f5-4d90-98a1-0d993bc4b837.mp4",
    poster: "/projects/checkerboard3d.jpeg",
    blurb:
      "Concept\nThis began as a quick hero experiment for a private equity client with a square logo. I wanted to explore something in 3D and tested a range of square-based motions as potential directions.\n\nExploration\nI originally planned to color each block individually, and even explored variations inspired by the logo itself. But the default checkered texture that came with Three.js held the composition together better than anything I designed on top of it, so I kept it.\n\nRefinement\nFrom there, I adjusted timing, speed, depth, and lighting so the motion felt slower and more intentional. I chose a warm, fall-inspired palette for my personal version and paired it with a St. Germain track so the grid felt like it moved with the music.",
  },
  {
    id: "canvas-particles",
    title: "Canvas Particles",
    type: "video",
    src: "https://cdn.dribbble.com/userupload/43826090/file/original-8a677209789bca38ccbf0b3c835cccc6.mp4",
    poster: "/projects/canvas-particles.jpeg",
    blurb:
      "Concept\nFor Katie, founder of Katherine Grover Fine Jewelry, I created a custom canvas particle animation using her own jewelry designs as the particles. She wanted an animation she could use across email marketing and Instagram ads that maintained a clean, elevated feel while introducing movement.\n\nApproach\nI designed the system so the particles form around the shape of Nantucket Island rather than filling it in. Katie's logo sits in the negative space at the center, giving the composition a clear focal point while keeping the overall layout minimal.\n\nImplementation\nThe animation is built with a custom canvas particle system adapted from an interactive logo tutorial. I reversed the particle coverage logic, used a base64 island image as a reference mask, and mapped high-resolution jewelry images across the canvas using getImageData(). The motion responds to mouse and touch, runs on GSAP's ticker for smooth performance, and stays sharp on retina displays.\n\nOutcome\nThe final animation gave Katie a flexible, high-impact visual she could use across marketing channels. She was thrilled with the result.",
  },
  {
    id: "design-with-a-splash-of-code",
    title: "Design with a Splash of Code",
    type: "image",
    src: "/projects/design-splash.jpeg",
    poster: "/projects/design-splash.jpeg",
    blurb:
      "Concept\nThis generative art project began as an exploration of circles within circles. While playing with the forms, I landed on a color palette that felt reminiscent of olives, which became the visual anchor for the piece. From there, the idea shifted toward creating a calm, design-led composition. I was inspired by Okazz and Andor Saga on OpenProcessing, especially their use of centrally clustered forms.\n\nExecution\nI introduced subtle motion using p5.js to bring variation and life into the composition, keeping the movement slow and controlled so the shapes and color relationships stayed front and center.\n\nOutcome\nThe project was featured on the official p5.js Instagram account through their Instagram stories and was later selected by CodePen and shared in a LinkedIn article reflecting on the intersection of visual design and creative coding.",
  },
  {
    id: "chargepoint",
    title: "Charge Point",
    type: "image",
    src: "/projects/chargepoint.png",
    poster: "/projects/chargepoint.png",
    blurb:
      "As part of ENGG 199 - Special Topics in Engineering Sciences, I worked on a full-stack development project focused on improving manufacturing quality assurance for ChargePoint. This course provided an opportunity to apply software development, cloud infrastructure, and computer vision techniques in a real-world setting. The goal was to automate defect detection for EV chargers using a React-based dashboard and AWS services.\n\nProblem\nManufacturing high-quality EV chargers requires rigorous quality control, but the existing process relied heavily on manual inspections, leading to delays, incomplete data, and inefficiencies. ChargePoint needed an automated system to capture defect data in real time, reduce inspection time per unit, and improve traceability for defect analysis.\n\nSolution\nI built a React-powered dashboard that integrates computer vision, cloud computing, and real-time analytics to monitor key production metrics, including first pass yield, retest and rework rates, final yield, cycle time, and takt time. The dashboard allows users to search and filter quality control data by serial number, factory location, and pass or fail status, providing engineers with instant access to critical insights.\n\nImpact\nThis project merged hardware, software, and cloud technologies, improving production efficiency, defect traceability, and real-time quality monitoring. By automating quality control processes, the system reduced inspection time per unit and provided engineers with actionable insights to improve manufacturing performance.",
  },
  {
    id: "american-seasons",
    title: "American Seasons",
    type: "video",
    src: "https://cdn.dribbble.com/userupload/43999509/file/original-cb29508e406a48e6a079f3f13d1283e3.mp4",
    poster: "/projects/american-seasons.png",
    blurb:
      "Neil, the owner and head chef of American Seasons, reached out looking for more dynamic Instagram content ahead of their seasonal opening on Nantucket.\n\nInspired by the bee in their logo, I created a custom SVG tracer animation using JavaScript to animate a curly pollen path. I pulled everything together in Canva to produce an Instagram reel that brings their logo to life.",
  },
];

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

function GridNineIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {[
        [6, 6],
        [12, 6],
        [18, 6],
        [6, 12],
        [12, 12],
        [18, 12],
        [6, 18],
        [12, 18],
        [18, 18],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" />
      ))}
    </svg>
  );
}

function WarpedGridIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3Q12 5 21 3Q19 12 21 21Q12 19 3 21Q5 12 3 3Z" opacity=".82" />
        <path d="M8.3 4Q9.7 12 8.3 20" opacity=".72" />
        <path d="M15.7 4Q14.3 12 15.7 20" opacity=".72" />
        <path d="M4 8.3Q12 9.7 20 8.3" opacity=".72" />
        <path d="M4 15.7Q12 14.3 20 15.7" opacity=".72" />
      </g>
    </svg>
  );
}

function HelixIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M18.7 3.3C12.3 3.15 5.7 6.2 4.85 9.45C4.25 11.75 6.55 13.35 11.6 13.35C17.75 13.35 20.95 11.15 18.95 9.45C16.45 7.33 6.05 8.35 3.85 12.7C2.35 15.67 5.65 17.8 11 17.65C16.45 17.5 19.7 15.55 18.1 14.45C15.95 12.98 8.65 14.25 7.55 18.15C6.95 20.25 8.85 21.85 12.45 22.35"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

const OLIVE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='5' fill='%23705208' fill-opacity='0.95'/%3E%3Ccircle cx='14' cy='14' r='10' fill='none' stroke='%23705208' stroke-opacity='0.45' stroke-width='2'/%3E%3C/svg%3E\") 14 14, auto";
const SHOW_WORK_CAROUSEL = false;
const PROJECT_POSTER_URLS = Array.from(
  new Set(PROJECTS.map((item) => item.poster || item.src).filter(Boolean)),
);

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

function AboutCard() {
  return (
    <div
      className={`mx-auto flex w-full max-w-[32rem] flex-col items-center text-center text-[#705208] ${bricolage.className}`}
    >
      <p className="max-w-[30rem] text-lg leading-8 text-[rgba(112,82,8,0.88)] sm:text-[1.45rem] sm:leading-10">
        Holland Blumer is a Brooklyn-based creative technologist and computer
        scientist who builds design-driven, interactive digital experiences.
        With a background in engineering, design, robotics, and full-stack
        development, she believes creativity will be needed more than ever in a
        world shaped by AI. She cares deeply about making creative expression on
        the internet more accessible and continues to build tools that make
        experimentation easier. Check out her Templates feature{" "}
        <a
          href="https://hollandblumer.com/templates"
          target="_blank"
          rel="noreferrer"
          className="about-inline-link underline underline-offset-4 transition-opacity hover:opacity-65"
        >
          here
        </a>
        .
      </p>
    </div>
  );
}

function AboutOverlay({ onClose }) {
  return (
    <>
      <button
        type="button"
        className="slideout-backdrop"
        aria-label="Close about"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
        style={{ zIndex: 1000 }}
      />
      <div className="fixed left-5 top-5 z-[1003] h-11 w-11 sm:left-6 sm:top-6">
        <ElasticMenu isOpen onClick={() => onClose()} />
      </div>
      <div
        className="slideout-menu open"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => event.stopPropagation()}
        style={{ zIndex: 1001 }}
      >
        <AboutCard />
      </div>
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const [preloaderAnimationDone, setPreloaderAnimationDone] = useState(false);
  const [images, setImages] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showAboutCard, setShowAboutCard] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [gridProjectIndex, setGridProjectIndex] = useState(null);
  const [displayMode, setDisplayMode] = useState("grid");
  const [preloaderExiting, setPreloaderExiting] = useState(false);
  const [spiralIntroReady, setSpiralIntroReady] = useState(false);
  const [projectFilter, setProjectFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const gridMorphEnabled = true;
  const [gridEffectStrength, setGridEffectStrength] = useState(1);
  const [glassButtonRects, setGlassButtonRects] = useState([]);
  const effectDemoRanRef = useRef(false);
  const filterRef = useRef(null);
  const [projectRevealDone, setProjectRevealDone] = useState(false);

  useEffect(() => {
    const closeFilter = (event) => {
      if (!filterRef.current?.contains(event.target)) setFilterOpen(false);
    };
    document.addEventListener("pointerdown", closeFilter);
    return () => document.removeEventListener("pointerdown", closeFilter);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const mountFrame = window.requestAnimationFrame(() => {
      if (isMounted) setMounted(true);
    });
    Promise.allSettled(
      PROJECT_POSTER_URLS.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(src);
          img.onerror = reject;
        });
      }),
    ).then(() => {
      if (isMounted) {
        setImages(PROJECT_POSTER_URLS);
      }
    });

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(mountFrame);
    };
  }, []);

  useEffect(() => {
    if (!preloaderExiting) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSpiralIntroReady(true);
    }, 420);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [preloaderExiting]);

  useEffect(() => {
    if (!preloaderAnimationDone || effectDemoRanRef.current) return undefined;
    effectDemoRanRef.current = true;
    const delay = window.setTimeout(() => {
      const targetStrength = window.matchMedia("(max-width: 640px)").matches ? 0.4 : 0.5;
      const startedAt = performance.now();
      const duration = 700;
      let frame;
      const animate = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setGridEffectStrength(1 - eased * (1 - targetStrength));
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }, 450);
    return () => clearTimeout(delay);
  }, [preloaderAnimationDone]);

  useEffect(() => {
    let frame;
    const updateGlassRects = () => {
      const rects = [...document.querySelectorAll("[data-grid-glass]")].map((element) => {
        const rect = element.getBoundingClientRect();
        return [rect.left / innerWidth, 1 - rect.bottom / innerHeight, rect.width / innerWidth, rect.height / innerHeight];
      });
      setGlassButtonRects(rects);
    };
    const scheduleGlassUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateGlassRects);
    };
    const resizeObserver = new ResizeObserver(scheduleGlassUpdate);
    document.querySelectorAll("[data-grid-glass]").forEach((element) => {
      resizeObserver.observe(element);
    });
    scheduleGlassUpdate();
    addEventListener("resize", scheduleGlassUpdate);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      removeEventListener("resize", scheduleGlassUpdate);
    };
  }, [gridProjectIndex, menuOpen, preloaderAnimationDone, images.length]);

  const handleIndexChange = useCallback((slideNumber) => {
    setCurrentSlide(slideNumber);
    setActiveIndex(slideNumber - 1);
    setExpandedProjectId(null);
  }, []);

  if (!mounted) return null;

  const assetsReady = images.length === PROJECT_POSTER_URLS.length;
  const showPreloader = !preloaderAnimationDone || !assetsReady;
  const activeProject = PROJECTS[activeIndex];
  const gridProject =
    gridProjectIndex === null ? null : PROJECTS[gridProjectIndex];
  const isProjectExpanded =
    activeProject && expandedProjectId === activeProject.id;
  const isSpiralMode = displayMode === "spiral";
  const isGridMode = displayMode === "grid";
  const showSpiralDuringPreloader =
    showPreloader && preloaderExiting && spiralIntroReady && isSpiralMode;

  const handleOpenProject = () => {
    if (!activeProject) return;
    if (activeProject.href) {
      router.push(activeProject.href);
      return;
    }
    setExpandedProjectId((prev) =>
      prev === activeProject.id ? null : activeProject.id,
    );
  };

  const handleSelectProject = (index) => {
    setShowProjectPicker(false);
    setExpandedProjectId(null);
    setActiveIndex(index);
    setCurrentSlide(index + 1);
  };

  const handleOpenGridProject = (index) => {
    const project = PROJECTS[index];
    if (!project) return;

    setActiveIndex(index);
    setCurrentSlide(index + 1);
    setProjectRevealDone(false);
    setGridProjectIndex(index);
  };

  const handleStepProject = (direction) => {
    const nextIndex =
      (activeIndex + direction + PROJECTS.length) % PROJECTS.length;

    setExpandedProjectId(null);
    setActiveIndex(nextIndex);
    setCurrentSlide(nextIndex + 1);
  };

  return (
    <main
      className="w-screen h-screen overflow-hidden relative"
      style={{
        // red background: "#E33003"
        background: "#ffffff",
        cursor: !showPreloader ? OLIVE_CURSOR : "auto",
      }}
    >
      {SHOW_WORK_CAROUSEL && assetsReady && displayMode === "work" && (
        <div className="hidden">
          <Carousel
            mediaItems={PROJECTS}
            onIndexChange={handleIndexChange}
            canPlayActiveMedia={!showPreloader}
            currentIndex={activeIndex}
          />
        </div>
      )}

      {assetsReady &&
        isSpiralMode &&
        (!showPreloader || showSpiralDuringPreloader) && (
          <div className="animate-in fade-in duration-500">
            <ImageSpiralCarousel
              mediaItems={PROJECTS}
              currentIndex={activeIndex}
              onIndexChange={handleIndexChange}
              className={showSpiralDuringPreloader ? "z-[30]" : "z-[8]"}
              particlesVisible={!showPreloader}
            />
          </div>
        )}

      {!showPreloader && (
        <>
          {!showAboutCard && !gridProject && (
            <div className="portfolio-header-controls fixed left-5 top-5 z-[1001] flex items-center gap-3 sm:left-6 sm:top-6">
              <div className="h-11 w-11">
                <ElasticMenu
                  isOpen={menuOpen}
                  onClick={() => setMenuOpen((prev) => !prev)}
                />
              </div>
              <div ref={filterRef} className="portfolio-filter" data-grid-glass>
                <button
                  type="button"
                  className="portfolio-filter__trigger"
                  onClick={() => setFilterOpen((open) => !open)}
                  aria-label="Sort projects by category"
                  aria-haspopup="listbox"
                  aria-expanded={filterOpen}
                >
                  <span className="portfolio-filter__prefix">Sort by</span>
                  <span>{PROJECT_FILTERS.find((filter) => filter.value === projectFilter)?.label}</span>
                  <ChevronDown className="portfolio-filter__chevron" aria-hidden="true" />
                </button>
                {filterOpen && (
                  <div className="portfolio-filter__menu" role="listbox" aria-label="Project category">
                    {PROJECT_FILTERS.map((filter) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={projectFilter === filter.value}
                        className="portfolio-filter__option"
                        key={filter.value}
                        onClick={() => {
                          setProjectFilter(filter.value);
                          setFilterOpen(false);
                        }}
                      >
                        <span className="portfolio-filter__option-content">
                          <Check className="portfolio-filter__check" aria-hidden="true" />
                          <span>{filter.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="portfolio-effect-control" data-grid-glass aria-label="Grid effect intensity">
                <WarpedGridIcon className="portfolio-effect-control__preview" />
                <span>{Math.round(gridEffectStrength * 100)}%</span>
                <div>
                  <button
                    type="button"
                    onClick={() => setGridEffectStrength((value) => Math.min(1.6, value + 0.1))}
                    aria-label="Increase grid effect"
                    title="Increase grid effect"
                  >
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridEffectStrength((value) => Math.max(0, value - 0.1))}
                    aria-label="Decrease grid effect"
                    title="Decrease grid effect"
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}

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
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(false);
                    setShowAboutCard(true);
                  }}
                  className={`text-inherit ${bricolage.className}`}
                >
                  About
                </button>
              </li>
              <li>
                <a
                  href="/ai"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(false);
                  }}
                >
                  AI
                </a>
              </li>
              <li>
                <a
                  href="/poster-blueprint/"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(false);
                  }}
                >
                  Poster Blueprint
                </a>
              </li>
              <li>
                <a
                  href="/templates"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(false);
                  }}
                >
                  Templates
                </a>
              </li>
              <li>
                <a
                  href="mailto:hollandblumer6@icloud.com"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(false);
                  }}
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          {!gridProject && <div className="portfolio-social-controls absolute right-5 top-5 z-20 flex items-center gap-3 sm:right-6 sm:top-6">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="portfolio-social-button"
              data-grid-glass
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="portfolio-social-button"
              data-grid-glass
            >
              <LinkedInIcon className="h-5 w-5" />
            </a>
          </div>}

          <div className="hidden" aria-hidden="true">
            <button
              type="button"
              onClick={() => setDisplayMode("grid")}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                isGridMode
                  ? "bg-[rgba(207,207,207,0.22)] text-[#f1ece0]"
                  : "text-[rgba(207,207,207,0.78)] hover:bg-[rgba(207,207,207,0.12)]"
              }`}
              aria-label="Show image grid"
              title="Image grid"
            >
              <GridNineIcon className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                setGridProjectIndex(null);
                setDisplayMode("spiral");
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                isSpiralMode
                  ? "bg-[rgba(207,207,207,0.22)] text-[#f1ece0]"
                  : "text-[rgba(207,207,207,0.78)] hover:bg-[rgba(207,207,207,0.12)]"
              }`}
              aria-label="Show image spiral carousel"
              title="Image spiral carousel"
            >
              <HelixIcon className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>

          {isGridMode && gridProject && (
            <article className={`project-page-reveal fixed inset-0 z-[1002] overflow-y-auto text-[#191919] [touch-action:pan-y]${projectRevealDone ? " is-ready" : ""}`}>
              {!projectRevealDone && (
                <ProjectPageTransition
                  project={gridProject}
                  onComplete={() => setProjectRevealDone(true)}
                />
              )}
              <div className="project-page-reveal__content">
              <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-black/15 bg-[rgba(238,234,224,0.82)] px-5 backdrop-blur-xl sm:h-24 sm:px-8">
                <p className={`text-xs uppercase tracking-[0.16em] ${bricolage.className}`}>
                  Selected work
                </p>
                <button
                  type="button"
                  onClick={() => setGridProjectIndex(null)}
                  className={`flex h-10 items-center rounded-full border border-black/20 px-4 text-xs uppercase tracking-[0.14em] transition hover:bg-black hover:text-white ${bricolage.className}`}
                  aria-label="Close project page"
                >
                  Close
                </button>
              </header>

              <div className="mx-auto w-full max-w-[1500px] px-5 pb-20 sm:px-8 sm:pb-28">
                <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center py-8 sm:min-h-[calc(100dvh-6rem)] sm:py-10">
                  <img
                    src={gridProject.poster}
                    alt={gridProject.title}
                    className="project-page-reveal__image block h-[calc(100dvh-9rem)] w-[calc(100vw-40px)] max-w-[1100px] bg-black/5 object-contain sm:h-[calc(100dvh-11rem)] sm:w-[calc(100vw-64px)]"
                  />
                </div>

                <div className="grid gap-8 border-y border-black/15 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end sm:py-14">
                  <h1 className={`max-w-5xl text-[clamp(3rem,9vw,9rem)] leading-[0.86] tracking-[-0.06em] ${bricolage.className}`}>
                    {gridProject.title}
                  </h1>
                  <p className={`pb-1 text-xs uppercase tracking-[0.16em] text-black/55 ${bricolage.className}`}>
                    {String(gridProjectIndex + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
                  </p>
                </div>

                <div className="grid gap-8 pt-10 md:grid-cols-[minmax(180px,0.32fr)_minmax(0,0.68fr)] sm:pt-14">
                  <p className={`text-xs uppercase tracking-[0.16em] text-black/50 ${bricolage.className}`}>
                    Project overview
                  </p>
                  <div>
                    {gridProject.blurb && (
                      <p className={`max-w-3xl whitespace-pre-line text-base leading-7 sm:text-lg sm:leading-8 ${bricolage.className}`}>
                        {gridProject.blurb}
                      </p>
                    )}
                    {gridProject.href && (
                      <button
                        type="button"
                        onClick={() => router.push(gridProject.href)}
                        className={`mt-10 rounded-full border border-black/25 px-6 py-3 text-xs uppercase tracking-[0.16em] transition hover:bg-black hover:text-white ${bricolage.className}`}
                      >
                        Open project
                      </button>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </article>
          )}

          {isSpiralMode && !showAboutCard && !showProjectPicker && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-[18] flex items-center justify-between px-4 sm:px-6">
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleStepProject(1);
                }}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(112,82,8,0.18)] bg-[rgba(247,243,232,0.42)] text-[#705208] shadow-[0_12px_28px_rgba(112,82,8,0.12)] backdrop-blur-md transition hover:bg-[rgba(247,243,232,0.7)] hover:scale-105 sm:h-14 sm:w-14"
                aria-label="Previous project"
                title="Previous project"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleStepProject(-1);
                }}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(112,82,8,0.18)] bg-[rgba(247,243,232,0.42)] text-[#705208] shadow-[0_12px_28px_rgba(112,82,8,0.12)] backdrop-blur-md transition hover:bg-[rgba(247,243,232,0.7)] hover:scale-105 sm:h-14 sm:w-14"
                aria-label="Next project"
                title="Next project"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          )}

          {isSpiralMode && !showAboutCard && activeProject && (
            <div
              className={`pointer-events-none absolute inset-x-0 z-[14] flex justify-center px-5 ${
                isProjectExpanded
                  ? "bottom-5 top-20 items-start sm:bottom-6 sm:top-24"
                  : "bottom-5 sm:bottom-6"
              }`}
            >
              <div
                className={`pointer-events-auto rounded-[24px] border border-[rgba(207,207,207,0.22)] bg-[linear-gradient(135deg,rgba(207,207,207,0.2)_0%,rgba(255,255,255,0.1)_50%,rgba(112,82,8,0.14)_100%)] text-[#f1ece0] shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-[18px] transition-all duration-300 ${
                  isProjectExpanded
                    ? "flex max-h-full w-full max-w-[720px] flex-col overflow-hidden px-5 py-5 sm:px-6"
                    : "w-full max-w-[420px] px-4 py-3 sm:px-5"
                }`}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                onTouchStart={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex shrink-0 items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[rgba(241,236,224,0.18)] bg-[rgba(255,255,255,0.08)]">
                      <button
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onTouchStart={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onClick={() => setShowProjectPicker(true)}
                        className="flex h-full w-full items-center justify-center"
                        aria-label="Open project picker"
                      >
                        <GridNineIcon className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1 text-center">
                      <p
                        className={`truncate px-1 text-center text-sm uppercase tracking-[0.1em] text-[#f3efe7] sm:text-[15px] ${bricolage.className}`}
                      >
                        {activeProject.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onTouchStart={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={handleOpenProject}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full border border-[rgba(241,236,224,0.16)] bg-[rgba(255,255,255,0.08)] px-3 text-[11px] uppercase tracking-[0.18em] text-[#f1ece0] transition hover:bg-[rgba(255,255,255,0.18)] ${bricolage.className}`}
                    >
                      {activeProject.href
                        ? "open"
                        : isProjectExpanded
                          ? "close"
                          : "open"}
                    </button>
                  </div>
                </div>
                {isProjectExpanded &&
                  activeProject.blurb &&
                  !activeProject.href && (
                    <p
                      className={`mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain whitespace-pre-line pr-2 text-sm leading-6 text-[rgba(241,236,224,0.92)] [touch-action:pan-y] sm:text-[15px] sm:leading-7 ${bricolage.className}`}
                    >
                      {activeProject.blurb}
                    </p>
                  )}
              </div>
            </div>
          )}

          {showProjectPicker && (
            <>
              <button
                type="button"
                className="slideout-backdrop"
                aria-label="Close project picker"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShowProjectPicker(false);
                }}
                style={{ zIndex: 1000 }}
              />
              <div className="pointer-events-none fixed inset-0 z-[1001] flex items-center justify-center p-5">
                <div
                  className="pointer-events-auto flex max-h-[min(82vh,900px)] w-full max-w-[860px] flex-col overflow-hidden rounded-[28px] border border-[rgba(207,207,207,0.24)] bg-[rgba(204,202,202,0.76)] p-5 text-[#705208] shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p
                      className={`text-xs uppercase tracking-[0.22em] text-[rgba(112,82,8,0.64)] ${bricolage.className}`}
                    >
                      choose project
                    </p>
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={() => setShowProjectPicker(false)}
                      className={`text-lg leading-none text-[rgba(112,82,8,0.72)] transition-opacity hover:opacity-60 ${bricolage.className}`}
                      aria-label="Close project picker"
                    >
                      x
                    </button>
                  </div>
                  <div className="mt-5 overflow-y-auto pr-1">
                    <div className="grid gap-4 sm:grid-cols-3">
                      {PROJECTS.map((project, index) => (
                        <button
                          key={project.id}
                          type="button"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={() => handleSelectProject(index)}
                          className="overflow-hidden rounded-[20px] border border-[rgba(112,82,8,0.16)] bg-[rgba(255,255,255,0.4)] text-left transition hover:bg-[rgba(255,255,255,0.6)]"
                        >
                          <div className="aspect-[1/1.3] w-full overflow-hidden bg-[rgba(112,82,8,0.08)]">
                            <img
                              src={project.poster}
                              alt={project.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="px-4 py-3">
                            <p
                              className={`text-sm uppercase tracking-[0.12em] text-[#705208] ${bricolage.className}`}
                            >
                              {project.title}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {showAboutCard && (
            <AboutOverlay onClose={() => setShowAboutCard(false)} />
          )}
        </>
      )}

      <div
        className={`absolute inset-0 ${
          isGridMode
            ? showPreloader
              ? preloaderExiting
                ? "z-[18]"
                : "z-[40]"
              : "z-[8]"
            : "invisible pointer-events-none z-0"
        }`}
      >
        <Preloader
          canExit={assetsReady}
          onExitStart={() => setPreloaderExiting(true)}
          onComplete={() => setPreloaderAnimationDone(true)}
          onSelectProject={handleOpenGridProject}
          projectIndices={FILTER_PROJECT_INDICES[projectFilter]}
          morphEnabled={gridMorphEnabled}
          effectStrength={gridEffectStrength}
          glassRects={glassButtonRects}
          projectOpen={Boolean(gridProject)}
        />
      </div>
    </main>
  );
}
