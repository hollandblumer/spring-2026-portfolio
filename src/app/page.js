"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bricolage_Grotesque } from "next/font/google";
import Preloader from "../components/Preloader";
import Carousel from "../components/Carousel";
import ElasticMenu from "../components/ElasticMenu";

const INSTAGRAM_URL = "https://instagram.com/hollandblumer";
const LINKEDIN_URL = "https://linkedin.com/in/hollandblumer";
const PROJECTS = [
  {
    id: "countdown",
    title: "Countdown",
    type: "video",
    src: "/videos/first-project.webm",
    poster: "/videos/first-project-poster.jpg",
    blurb:
      "Inspired by that New Year's Eve countdown feeling where everything tightens right before midnight. I used Three.js to take 3, 2, 1 and let them build instead of just appear. The numbers kind of form out of these vertical ribbons that stretch, snap, and settle, almost like they're being pulled into place.\n\nIt's less about clearly reading the digits and more about that moment of anticipation. Each transition has a bit of randomness to it, so it never feels perfectly clean, more like that chaotic energy right before the drop. The forms push forward, collapse back, and then lock in just long enough before shifting again.",
  },
  {
    id: "type-lab",
    title: "Type Experiments",
    type: "video",
    src: "/videos/filter-optimized.mp4",
    poster: "/videos/filter-poster.jpg",
    blurb:
      "Lately I have been experimenting with type as something more fluid than fixed, stretching, blurring, contouring, and melting words until they start to feel almost alive. A lot of this came from building custom SVG filters and layering blur with thresholding to create those hollow, glowing contours, then pushing that into different directions. In some cases it turned into a drawing tool where shapes merge like metaballs, in others into these percentage counters where each number is constantly forming and breaking apart, and in others into words that feel like they're rising and pulling themselves out of a kind of molten base.\n\nI kept playing with timing, too, letting things pulse, stagger, or drift so nothing locks into a perfectly clean state. It was less about a final system and more about seeing how far I could push distortion, motion, and interaction while still keeping just enough of the original word there.",
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
    title: "ChargePoint",
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
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
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

const OLIVE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='5' fill='%23705208' fill-opacity='0.95'/%3E%3Ccircle cx='14' cy='14' r='10' fill='none' stroke='%23705208' stroke-opacity='0.45' stroke-width='2'/%3E%3C/svg%3E\") 14 14, auto";

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
        With a background in engineering, robotics, and full-stack
        development, her work focuses on making online experiences feel more
        intentional, visually distinct, and engaging.
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
        <ElasticMenu
          isOpen
          onClick={() => onClose()}
        />
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
  const [p5Ready, setP5Ready] = useState(false);
  const [images, setImages] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localTime, setLocalTime] = useState("");
  const [activeIndex, setActiveIndex] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(2);
  const [showAboutCard, setShowAboutCard] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setMounted(true);
    import("react-p5").then(() => {
      if (isMounted) {
        setP5Ready(true);
      }
    });

    const imageUrls = PROJECTS.filter((item) => item.type === "image").map(
      (item) => item.src,
    );

    Promise.all(
      imageUrls.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(src);
          img.onerror = reject;
        });
      }),
    ).then((loadedUrls) => {
      if (isMounted) {
        setImages(loadedUrls);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    const updateTime = () => {
      setLocalTime(formatter.format(new Date()));
    };

    updateTime();
    const intervalId = window.setInterval(updateTime, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleIndexChange = useCallback((slideNumber) => {
    setCurrentSlide(slideNumber);
    setActiveIndex(slideNumber - 1);
    setExpandedProjectId(null);
  }, []);

  if (!mounted) return null;

  const assetsReady =
    images.length === PROJECTS.filter((item) => item.type === "image").length &&
    p5Ready;
  const showPreloader = !preloaderAnimationDone || !assetsReady;
  const activeProject = PROJECTS[activeIndex];
  const isProjectExpanded = activeProject && expandedProjectId === activeProject.id;

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

  return (
    <main
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#E33003", cursor: !showPreloader ? OLIVE_CURSOR : "auto" }}
    >
      {assetsReady && (
        <div className="animate-in fade-in duration-500">
          <Carousel
            mediaItems={PROJECTS}
            onIndexChange={handleIndexChange}
            canPlayActiveMedia={!showPreloader}
            currentIndex={activeIndex}
          />
        </div>
      )}

      {!showPreloader && (
        <>
          {!showAboutCard && (
            <div className="fixed left-5 top-5 z-[1001] flex items-center gap-3 sm:left-6 sm:top-6">
              <div className="h-11 w-11">
                <ElasticMenu
                  isOpen={menuOpen}
                  onClick={() => setMenuOpen((prev) => !prev)}
                />
              </div>
            </div>
          )}

          <div className="absolute bottom-5 left-5 z-20 hidden text-[#cfcfcf] sm:block sm:bottom-6 sm:left-6">
            <div className="rounded-full border border-[rgba(207,207,207,0.3)] bg-[rgba(112,82,8,0.18)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] backdrop-blur-sm sm:text-xs">
              {localTime}
            </div>
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
                  href="/tile-lab"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(false);
                  }}
                >
                  Tile Lab
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

          <div className="absolute right-5 top-5 z-20 flex items-center gap-3 sm:right-6 sm:top-6">
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

          {!showAboutCard && activeProject && (
            <div className="pointer-events-none absolute inset-x-0 bottom-5 z-[14] flex justify-center px-5 sm:bottom-6">
              <div
                className={`pointer-events-auto rounded-[24px] border border-[rgba(207,207,207,0.22)] bg-[linear-gradient(135deg,rgba(207,207,207,0.2)_0%,rgba(255,255,255,0.1)_50%,rgba(112,82,8,0.14)_100%)] text-[#f1ece0] shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-[18px] transition-all duration-300 ${
                  isProjectExpanded
                    ? "w-full max-w-[720px] px-5 py-5 sm:px-6"
                    : "w-full max-w-[420px] px-4 py-3 sm:px-5"
                }`}
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
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
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
                      <p className={`truncate px-1 text-center text-sm uppercase tracking-[0.1em] text-[#f3efe7] sm:text-[15px] ${bricolage.className}`}>
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
                      {activeProject.href ? "open" : isProjectExpanded ? "close" : "open"}
                    </button>
                  </div>
                </div>
                {isProjectExpanded && activeProject.blurb && !activeProject.href && (
                  <p className={`mt-4 whitespace-pre-line text-sm leading-6 text-[rgba(241,236,224,0.92)] sm:text-[15px] sm:leading-7 ${bricolage.className}`}>
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
                    <p className={`text-xs uppercase tracking-[0.22em] text-[rgba(112,82,8,0.64)] ${bricolage.className}`}>
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
                          <p className={`text-sm uppercase tracking-[0.12em] text-[#705208] ${bricolage.className}`}>
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

          <div className="absolute bottom-5 right-5 z-20 hidden items-center gap-6 text-[#cfcfcf] sm:flex sm:bottom-6 sm:right-6">
            <div className="px-1 py-1 text-sm font-medium uppercase tracking-[0.16em] sm:text-base">
              <span className="text-[#705208]">
                {String(currentSlide).padStart(2, "0")}
              </span>{" "}
              / {String(PROJECTS.length).padStart(2, "0")}
            </div>
          </div>

          {showAboutCard && (
            <AboutOverlay onClose={() => setShowAboutCard(false)} />
          )}
        </>
      )}

      {showPreloader && (
        <div className="absolute inset-0 z-10">
          <Preloader
            canExit={assetsReady}
            onComplete={() => setPreloaderAnimationDone(true)}
          />
        </div>
      )}
    </main>
  );
}
