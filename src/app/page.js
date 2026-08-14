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
  { value: "generative-art", label: "Generative Art" },
  { value: "grid-layouts", label: "Grid Layouts" },
  { value: "fullstack-projects", label: "Fullstack Projects" },
  { value: "cms-websites", label: "CMS Websites" },
];

const FILTER_PROJECT_INDICES = {
  all: [
    ...Array.from({ length: 19 }, (_, index) => index).filter(
      (index) => index !== 6 && index !== 11,
    ),
    11,
  ],
  typography: [0, 2, 10, 3, 6, 15],
  "generative-art": [7, 9],
  "grid-layouts": [13, 14],
  "fullstack-projects": [4, 11],
  "cms-websites": [5, 8, 12, 17],
};
const PROJECTS = [
  {
    id: "spiral-experiment",
    title: "Spiral Experiment",
    type: "video",
    src: "/videos/springcompilation.mp4",
    poster: "/videos/spring-poster.jpg",
    blurb:
      "Inspired by the way lemon peels curl into loose spirals, I started experimenting with forms that twist, overlap, and unfold through space. I wanted the movement to feel organic rather than mechanically perfect, as if each ribbon had been cut from the surface of a fruit and was slowly finding its own shape.\n\nThe piece became an exploration of repetition, depth, and rhythm. Each spiral bends and passes through the composition at a slightly different pace, creating moments where the forms gather into something dense before opening back up again. The bright color and continuous motion keep it playful, while the changing perspective turns a familiar everyday shape into something more abstract.",
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
    src: "/videos/katiegrover.mp4",
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
    id: "ccnyc-twist",
    title: "CCNYC Twist",
    type: "video",
    src: "/videos/ccnyc-twist.mp4",
    poster: "/videos/ccnyc-twist-poster.jpg",
  },
  {
    id: "chargepoint",
    title: "Automated Quality Assurance Dashboard for ChargePoint",
    type: "image",
    src: "/projects/chargepoint.png",
    poster: "/projects/chargepoint.png",
    gallery: [
      {
        src: "/photos/chargepoint/original-8f10aad278ebf69990949bc646b948a4.webp",
        alt: "ChargePoint quality assurance dashboard showing production metrics and recurring errors",
        afterHeading: "Dashboard and workflow",
      },
      {
        src: "/photos/chargepoint/original-c9980180dca46e3e7448f6690554d6f8.webp",
        alt: "ChargePoint dashboard showing recent capture data and a detailed charger inspection view",
        afterHeading: "Dashboard and workflow",
      },
    ],
    blurb:
      "Understanding the customer\nI approached this project from the manufacturing engineer's point of view. The team did not simply need another dashboard; they needed a faster way to understand what failed, where it failed, how often the same problem was happening, and which unit required attention next. Every extra manual step slowed the inspection process, while fragmented records made it harder to connect a defect to a charger, factory, image, or moment in production. The experience therefore had to make complex quality data feel immediate, trustworthy, and useful on a busy factory floor.\n\nProblem\nChargePoint's EV chargers require rigorous quality control, but a process dependent on manual inspection created delays, incomplete records, and limited visibility across production. Engineers needed real-time defect capture, reliable unit-level traceability, and a clear view of recurring issues without spending valuable time piecing information together across systems. The core challenge was reducing inspection time without losing the evidence and context required to make confident quality decisions.\n\nProduct approach\nAs part of ENGG 199 - Special Topics in Engineering Sciences, I helped create a full-stack quality-assurance system that connects inspection hardware, computer vision, cloud infrastructure, and a React dashboard. I organized the experience around the questions an engineer is most likely to ask: Is this unit passing? What caused the failure? Is this an isolated event or a pattern? How is the line performing overall? This kept the interface focused on decisions rather than simply displaying all of the available data.\n\nDashboard and workflow\nThe dashboard presents recent inspection captures alongside detailed charger records, allowing a user to move from a production overview to the evidence behind an individual result. Engineers can search and filter by serial number, factory location, and pass or fail status, making it easier to investigate a specific charger or compare patterns across the line. Inspection images and error details stay connected to each unit, preserving the traceability that a quality team needs when reviewing failures or planning rework.\n\nCloud infrastructure\nWe migrated the data layer from MongoDB to AWS Amplify and used Amazon Cognito for managed authentication. AWS AppSync provided a GraphQL interface for responsive access to inspection records, while Amazon S3 stored inspection images securely. This architecture reduced custom backend maintenance and gave the dashboard a dependable path to current production data.\n\nComputer vision\nThe inspection workflow captured barcode and component images so that every result could remain associated with the correct charger. Python-based image processing, including SIFT feature matching, helped identify component defects and automate checks that previously required more manual review. The goal was not to remove the engineer from the process, but to surface likely problems sooner and give the team better evidence for the final decision.\n\nMetrics and analysis\nThe interface tracks first pass yield, retest and rework rates, final yield, cycle time, takt time, and units per hour. First pass yield shows how many chargers succeed on their initial inspection, while retest and final-yield figures reveal the cost and effectiveness of rework. Cycle-time and throughput calculations use inspection timestamps to show production pace. Recharts visualizations make recurring error frequencies easy to compare, helping engineers distinguish one-off failures from systemic issues that deserve investigation.\n\nImpact\nThe completed system brought hardware, software, computer vision, and cloud services into one quality workflow. It reduced the time required to inspect and investigate a unit, improved defect traceability, and gave engineers a real-time view of both individual failures and broader manufacturing performance. Most importantly, it transformed raw inspection data into answers the team could act on.\n\nConfidentiality\nThis overview focuses on the product thinking, workflow, and technical architecture that can be shared publicly. Additional implementation details are available upon request where permitted by the project's confidentiality requirements.",
  },
  {
    id: "american-seasons",
    title: "American Seasons",
    type: "video",
    src: "/videos/seasons.mp4",
    poster: "/projects/american-seasons.png",
    blurb:
      "Neil, the owner and head chef of American Seasons, reached out looking for more dynamic Instagram content ahead of their seasonal opening on Nantucket.\n\nInspired by the bee in their logo, I created a custom SVG tracer animation using JavaScript to animate a curly pollen path. I pulled everything together in Canva to produce an Instagram reel that brings their logo to life.",
  },
  {
    id: "card-layout",
    title: "Card Layout",
    type: "video",
    src: "/videos/Card Layout.mp4",
    poster: "/videos/card-layout-poster.jpg",
  },
  {
    id: "slinky-grid",
    title: "Slinky Grid",
    type: "video",
    src: "/videos/slinkygrid.mp4",
    poster: "/videos/slinkygrid-poster.jpg",
  },
  {
    id: "rip-open",
    title: "Rip Open",
    type: "video",
    src: "/videos/Rip open.mp4?v=2",
    poster: "/videos/Rip open.png",
  },
  {
    id: "warping-stuff",
    title: "Warping Stuff",
    type: "video",
    src: "/videos/Sign warp.mp4",
    poster: "/videos/sign-warp-poster.jpg",
  },
  {
    id: "cheryl-fudge",
    title: "Cheryl Fudge",
    type: "video",
    src: "/videos/cherylfudge.mp4",
    poster: "/projects/cherylfudge.png",
    blurb:
      "Overview\nI designed a website that brings Cheryl Fudge's modern, dynamic artwork together with a clear sense of Nantucket and the coast. The goal was to create a digital home that could support the range of her practice without flattening its personality: expressive enough to feel like Cheryl, but calm enough to let the artwork lead.\n\nInspiration\nCheryl and I had our first website meeting on a beach in Nantucket, looking toward the harbor. When I asked what inspired her, she pointed directly to the water. That moment became the foundation for the site. I collected imagery connected to the places and textures that move her, then paired it with her artwork, interiors, and earlier work to build a visual direction rooted in fluidity, atmosphere, and the coast.\n\nVisual direction\nI knew early on that the palette should lean blue. I chose a muted, cool base that could balance the many colors in Cheryl's art rather than compete with them. The working palette combines #326696, #295279, #6898C1, #F1FBFD, #1A2B3B, and #9FC4DE. Smoky lines from Cheryl's paintings influenced the About page, while sand, water, and coastal movement shaped the broader system.\n\nCreative development\nWith those references in mind, I explored CodePen and Pinterest for interactions that felt fluid and coastal. Generative art experiments, sandy flow fields, and SVG filters became important references for backgrounds and transitions. These techniques helped the interface feel alive while remaining connected to the movement already present in Cheryl's work.\n\nPages and content\nThe site includes an interiors page for Cheryl's interior-design work, an About page inspired by the smoky lines she paints, and a home-page gallery that brings together work across disciplines. Each section uses the same visual language while giving its content enough room to establish a distinct rhythm.\n\nGallery approach\nI was inspired by gallery-wall layouts, particularly spatial compositions built with Three.js, but wanted Cheryl's gallery to feel softer and more like water. After testing several ways to present the work, I created the final composition with CSS. That choice preserved the fluid character of the layout while improving browser compatibility and keeping the experience easier to maintain.\n\nOutcome\nThe finished direction balances coastal calm with contemporary movement. It gives Cheryl a flexible framework for adding new work while translating the color, texture, and energy of her physical practice into an accessible web experience.",
  },
  {
    id: "meredith-norvell",
    title: "Meredith Norvell",
    type: "video",
    src: "/videos/meredith.mp4",
    poster: "/videos/meredith-poster.jpg",
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
    <div className="mx-auto flex w-full max-w-[32rem] flex-col items-center text-center text-[#705208]">
      <p className={`max-w-[30rem] text-lg leading-8 text-[rgba(112,82,8,0.88)] sm:text-[1.45rem] sm:leading-10 ${bricolage.className}`}>
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
  const [gridEffectStrength, setGridEffectStrength] = useState(1.3);
  const [gridVideosPaused, setGridVideosPaused] = useState(false);
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
      const startStrength = 1.3;
      const targetStrength = 0.4;
      const startedAt = performance.now();
      const duration = 700;
      let frame;
      const animate = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setGridEffectStrength(startStrength - eased * (startStrength - targetStrength));
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }, 450);
    return () => clearTimeout(delay);
  }, [preloaderAnimationDone]);

  useEffect(() => {
    let frame;
    const followupTimers = [];
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
    const resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(scheduleGlassUpdate)
      : null;
    const observeGlassControls = () => {
      document.querySelectorAll("[data-grid-glass]").forEach((element) => {
        resizeObserver?.observe(element);
      });
      scheduleGlassUpdate();
    };
    const mutationObserver = new MutationObserver(observeGlassControls);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    observeGlassControls();
    [120, 500, 1200].forEach((delay) => {
      followupTimers.push(window.setTimeout(scheduleGlassUpdate, delay));
    });
    addEventListener("resize", scheduleGlassUpdate);
    addEventListener("orientationchange", scheduleGlassUpdate);
    return () => {
      cancelAnimationFrame(frame);
      followupTimers.forEach((timer) => window.clearTimeout(timer));
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      removeEventListener("resize", scheduleGlassUpdate);
      removeEventListener("orientationchange", scheduleGlassUpdate);
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

    if (project.id === "templates") {
      router.push(project.href);
      return;
    }

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
                  {gridProject.type === "video" ? (
                    <video
                      src={gridProject.src}
                      poster={gridProject.poster}
                      aria-label={gridProject.title}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="project-page-reveal__image block h-[calc(100dvh-9rem)] w-[calc(100vw-40px)] max-w-[1100px] bg-black/5 object-contain sm:h-[calc(100dvh-11rem)] sm:w-[calc(100vw-64px)]"
                    />
                  ) : (
                    <img
                      src={gridProject.poster}
                      alt={gridProject.title}
                      className="project-page-reveal__image block h-[calc(100dvh-9rem)] w-[calc(100vw-40px)] max-w-[1100px] bg-black/5 object-contain sm:h-[calc(100dvh-11rem)] sm:w-[calc(100vw-64px)]"
                    />
                  )}
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
                    {gridProject.blurb && !gridProject.gallery?.length && (
                      <p className={`max-w-3xl whitespace-pre-line text-base leading-7 sm:text-lg sm:leading-8 ${bricolage.className}`}>
                        {gridProject.blurb}
                      </p>
                    )}
                    {gridProject.blurb && gridProject.gallery?.length > 0 && (
                      <div className={`grid gap-10 sm:gap-14 ${bricolage.className}`}>
                        {gridProject.blurb.split("\n\n").map((section) => {
                          const [heading, ...bodyLines] = section.split("\n");
                          const sectionImages = gridProject.gallery.filter(
                            (image) => image.afterHeading === heading,
                          );

                          return (
                            <section key={heading} className="grid gap-5">
                              <div className="max-w-3xl">
                                <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-black/50">
                                  {heading}
                                </h2>
                                <p className="text-base leading-7 sm:text-lg sm:leading-8">
                                  {bodyLines.join("\n")}
                                </p>
                              </div>
                              {sectionImages.map((image) => (
                                <figure
                                  key={image.src}
                                  className="mt-2 overflow-hidden border border-black/10 bg-white"
                                >
                                  <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="block h-auto w-full"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </figure>
                              ))}
                            </section>
                          );
                        })}
                      </div>
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

          {isGridMode && !gridProject && (
            <div className="fixed bottom-5 right-5 z-[1100] sm:bottom-6 sm:right-6">
              <button
                type="button"
                onClick={() => setGridVideosPaused((paused) => !paused)}
                className="portfolio-social-button"
                data-grid-glass
                aria-label={gridVideosPaused ? "Play grid videos" : "Pause grid videos"}
                aria-pressed={gridVideosPaused}
                title={gridVideosPaused ? "Play videos" : "Pause videos"}
              >
                {gridVideosPaused ? (
                  <span aria-hidden="true" className="ml-0.5 block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-current" />
                ) : (
                  <span aria-hidden="true" className="flex gap-1"><span className="h-4 w-[2px] bg-current" /><span className="h-4 w-[2px] bg-current" /></span>
                )}
              </button>
            </div>
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
          onExitStart={() => {
            setPreloaderExiting(true);
            setPreloaderAnimationDone(true);
          }}
          onComplete={() => setPreloaderAnimationDone(true)}
          onSelectProject={handleOpenGridProject}
          projectIndices={FILTER_PROJECT_INDICES[projectFilter]}
          morphEnabled={gridMorphEnabled}
          effectStrength={gridEffectStrength}
          glassRects={glassButtonRects}
          projectOpen={Boolean(gridProject)}
          videosPaused={gridVideosPaused}
        />
      </div>
    </main>
  );
}
