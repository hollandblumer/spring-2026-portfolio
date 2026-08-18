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
  { value: "all", label: "Featured" },
  { value: "creative-coding", label: "Creative Coding" },
  { value: "fullstack-projects", label: "Fullstack Projects" },
  { value: "cms-websites", label: "CMS Websites" },
];

const FILTER_PROJECT_INDICES = {
  all: [
    2,
    0,
    3,
    10,
    13,
    ...Array.from({ length: 25 }, (_, index) => index).filter(
      (index) =>
        ![0, 2, 3, 4, 6, 10, 11, 13, 14, 17, 19, 20, 21, 23, 24].includes(
          index,
        ),
    ),
    11,
  ],
  "creative-coding": [0, 2, 13, 10, 3, 6, 15, 7, 9, 5],
  "fullstack-projects": [1, 4, 11, 22, 23],
  "cms-websites": [8, 18, 12, 17, 19, 20, 24, 21],
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
    blurb:
      "Reflecting on my talk with Brooklyn Web Workers about channeling pre-internet 60s/70s counterculture design through modern creative tools, I wanted to build something that extended those ideas beyond the presentation itself. After consolidating all the research from the talk, I started thinking about what it would look like if AI could actually help identify and recreate visual design elements from posters. I also wanted an excuse to revisit some of the image processing and ML concepts I worked with in grad school, especially things like edge detection and SIFT.\n\nThe project started as a monorepo with a React frontend and a FastAPI/Python backend. My original idea was to combine three things together: image analysis, my own design research archive, and LLM reasoning. I had accumulated a huge amount of references from the talk, including experiments, notes, shaders, equations, and creative coding studies, so I organized everything into a “blueprints” library that the backend could reference alongside uploaded images.\n\nFrom there, I built a pipeline where a user uploads a poster and the backend analyzes it while simultaneously feeding Gemini contextual information from my research library. The goal was not just “describe this image,” but rather: break down the visual language of the poster and suggest how it could be recreated today through code using tools like p5.js, Three.js, GLSL shaders, SVG filters, procedural geometry, or mathematical systems like logarithmic spirals and envelope functions.\n\nOne thing I kept revisiting was SIFT (Scale-Invariant Feature Transform). During grad school I used image processing mostly in technical contexts, but here I became interested in whether those same ideas could help identify recurring visual structures in counterculture posters. For example, could SIFT detect repeated spiral structures, warped lettering systems, radial compositions, or shared geometric motifs across different posters? Instead of simply asking an LLM to “describe” an image, I wanted to combine classical computer vision with generative reasoning. Edge detection and contour extraction became especially important because so many psychedelic posters rely on thick/thin boundaries, flowing contours, and nested shape relationships rather than isolated objects.\n\nThe backend evolved into a sort of hybrid system. When a user uploads an image, the server first validates and compresses it, then runs a local SIFT feature-matching pass against my reference image library. If SIFT finds a strong enough match, the app can return those results directly without calling Gemini. If the match is weaker, the backend sends Gemini the uploaded poster, local SIFT results, visual references, and the code/text references from my research library so Gemini can perform a more interpretive design breakdown.\n\nI also started exploring whether the backend could compare uploaded posters not only against code references but against visual references too. Instead of only storing snippets of shaders or sketches, I added categorized reference images and began building a system that lets the model match an uploaded poster against both visual examples and code experiments simultaneously. That turned the project into less of a “poster captioning” tool and more of a design blueprint engine.\n\nThere were a lot of technical issues along the way. Gemini’s SDK ended up being surprisingly strict about image formatting. Initially I tried sending images using a generic dictionary format, but the SDK rejected it because Gemini expects its own typed image objects. I eventually had to switch to the types.Part.from_bytes() approach and explicitly pass image bytes with MIME types.\n\nThen I ran into rate limiting and token issues. Large Retina-resolution screenshots consumed massive token budgets because Gemini breaks images into tiles internally. Some uploads were simply too large and triggered quota or timeout errors. At one point I kept getting 503 UNAVAILABLE responses, which essentially meant Gemini’s servers were overloaded during traffic spikes. To handle that, I added Pillow-based compression and resizing before uploads even reached the model.\n\nWhile waiting on backend fixes, I shifted focus toward the frontend experience and leaned heavily into the “forensic blueprint” aesthetic. I added grid systems, crosshair overlays, measurement lines, sidebars, and scanning-style UI elements to make the app feel less like a chatbot and more like a design analysis instrument. I also experimented with ideas around preprocessing passes before image analysis, including masking high-frequency text regions near poster edges so OCR-heavy areas would not dominate structural analysis.\n\nAnother big area became upload safety and moderation. Since the project revolves around user-uploaded images, I started implementing the kinds of precautions you normally see in production image pipelines. I added server-side MIME allowlists, file-size restrictions, image decoding verification, rejection of animated uploads, dimension checks, and frontend upload constraints. The system now treats uploads strictly as pixel data for analysis rather than executable content.\n\nI also spent time thinking about moderation more carefully because a blanket NSFW detector felt wrong for historical poster analysis. A lot of vintage counterculture artwork contains stylized or artistic nudity, and I didn’t want the app to incorrectly reject legitimate poster art. So instead of “nudity = blocked,” I started thinking in terms of contextual moderation: allowing artistic or illustrated nudity while rejecting explicit photographic sexual content or exploitative imagery.\n\nAt this point the project feels less like a standard AI image tool and more like an experiment in combining design history, creative coding, computer vision, and generative AI into a single workflow. The broader idea is not just “what does this poster look like,” but “how was this visual language constructed, and how could those systems be translated into modern computational design tools today?”",
  },
  {
    id: "type-lab",
    title: "Type Experiments",
    type: "video",
    src: "/videos/typeexperiments.mp4",
    poster: "/videos/typeexperiments-poster.jpg",
    spiralMobileTextureZoom: 1.85,
    gallery: [
      {
        type: "video",
        src: "/videos/Rip open.mp4?v=2",
        poster: "/videos/Rip open.png",
        alt: "Rip Open animated type experiment",
        afterHeading: "Rip Open",
      },
    ],
    blurb:
      "Type Experiments\nLately I have been experimenting with type as something more fluid than fixed, stretching, blurring, contouring, and melting words until they start to feel almost alive. A lot of this came from building custom SVG filters and layering blur with thresholding to create those hollow, glowing contours, then pushing that into different directions. In some cases it turned into a drawing tool where shapes merge like metaballs, in others into these percentage counters where each number is constantly forming and breaking apart, and in others into words that feel like they're rising and pulling themselves out of a kind of molten base.\n\nMotion and timing\nI kept playing with timing, too, letting things pulse, stagger, or drift so nothing locks into a perfectly clean state. It was less about a final system and more about seeing how far I could push distortion, motion, and interaction while still keeping just enough of the original word there.\n\nRip Open\nRip Open continues the same exploration through a more forceful, physical motion. The letterforms stretch apart and pull back together as if the type itself is being torn open, turning a short phrase into an animated material rather than a fixed piece of text.",
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
    blurb:
      "Water marbling... but make it digital. Another project I worked on toward the end of my program at the Recurse Center was inspired by water marbling, as I wanted to recreate those patterns without the mess. I also wanted my hand to become the comb instead, to form the pattern on the canvas.\n\nThe marbling itself is drawn on an HTML canvas, and the pigment is made from layers of color, noise, and displacement, so the hand pushes and stretches the pixels instead of just drawing flat lines. That's what gives it a more liquid, marbled feel, since the colors drag into each other and leave trails based on how the hand moves.\n\nTo make that work, I started with MediaPipe for real-time hand tracking. MediaPipe gave me 21 points for the wrist, knuckles, and fingertips, but on its own it felt more like a skeleton than a hand. I wanted the interaction to have more form and volume, so I began linking those MediaPipe points to the MANO hand model.\n\nA lot of the project became about getting those two systems to line up. MediaPipe and MANO do not naturally agree on orientation, handedness, depth, or how the fingers should bend, so I had to map the tracked points onto the MANO joints and keep tuning the alignment until the thumb, fingertips, and finger curl moved with my actual hand.\n\nThen I had to address backend bugs. I built a Python/FastAPI backend for the MANO fitting, since it was too heavy to run directly in the browser. The browser handles the webcam and MediaPipe tracking, sends the landmarks over, and the backend solves the pose and sends the fitted mesh back. I deployed that backend separately on Render so the public version could use the MANO model without committing those files directly into my portfolio repo.\n\nThe final piece is a mix of creative coding, computer vision, and 3D model fitting: a browser-based marbling tool where your hand becomes the rake moving through the pigment.",
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
    blurb:
      "CCNYC Twist is built around linear interpolation, using it to move each letter smoothly between positions and create the free-flowing quality I love. Rather than snapping from one state to another, the letterforms continuously ease, stretch, and twist into place, making the typography feel loose and alive.\n\nI also wanted the supporting event information to appear directly on the letters and travel with them. To keep that text readable, I deliberately separated its behavior from the deformation applied to the larger letterforms. The main type is free to stretch and distort, while the additional text moves with the letters without being pulled out of shape. That contrast lets the composition stay expressive without sacrificing the information it needs to communicate.",
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
    id: "grid-layouts",
    title: "Grid Layouts",
    type: "video",
    src: "/videos/Card Layout.mp4",
    poster: "/videos/card-layout-poster.jpg",
    blurb:
      "Card Layout\nAfter getting better at shuffling cards, I was inspired to turn that motion into a grid layout. I wanted the deck to reorganize itself into something structured while still feeling playful and physical.\n\nSlinky Layout\nThis layout was inspired by the slinkiness and twisting motion of a project I made recently. I wanted the grid to bend, stretch, and loop through space while keeping the cards usable.",
    gallery: [
      {
        type: "video",
        src: "/videos/slinkygrid.mp4",
        poster: "/videos/slinkygrid-poster.jpg",
        alt: "Slinky grid layout moving and twisting through space",
        afterHeading: "Slinky Layout",
      },
    ],
    links: [
      {
        label: "View GitHub",
        href: "https://lnkd.in/ghzYWwfK",
      },
    ],
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
    gallery: [
      {
        src: "/photos/meredith-norvell/book-cover.jpg",
        alt: "Listen for the Lie book feature created for Meredith Norvell",
        afterHeading: "Page-turning concept",
      },
      {
        src: "/photos/meredith-norvell/editorial-grid.jpg",
        alt: "Bright Silicon Stars editorial mood board on Meredith Norvell's website",
        afterHeading: "Editorial direction",
      },
      {
        src: "/photos/meredith-norvell/page-turn.jpg",
        alt: "Editorial content grid from the Meredith Norvell website",
        afterHeading: "Editorial direction",
      },
    ],
    blurb:
      "Page-turning concept\nMeredithnorvell.com is a page-turner. I designed the experience around the physical language of books, using movement and layered transitions to make each feature feel like the beginning of a new chapter rather than another static content page.\n\nEditorial direction\nThe site brings Meredith’s book recommendations, cultural references, and visual mood boards into one cohesive editorial system. Large book covers create strong focal points, while image-led grids give each story its own atmosphere. The muted palette of dusty pink, olive, warm gray, and deep green keeps the experience polished while leaving room for the color and personality of every featured title.\n\nMotion and experience\nThe page-turning interaction ties the whole project together. Content bends, slides, and reveals the next view with the rhythm of turning through a book, giving visitors an intuitive way to move between recommendations and visual stories. The final site feels playful and tactile while remaining focused on Meredith’s voice and content.",
  },
  {
    id: "kelsey-malone",
    title: "Kelsey Malone",
    type: "video",
    src: "/videos/kelsey.mp4",
    poster: "/videos/kelsey-poster.jpg",
    blurb:
      "Up in the clouds with bustedceramics.com. This Squarespace revamp was focused on featuring Kelsey’s work, especially her latest with additive color. As the process goes, we browsed what’s out there, pulling inspiration from sites like CodePen and Pinterest. One idea really stood out at first, but we kept our options open until something clicked. With Kelsey’s recent work with clouds, this dreamy cloud animation from websonik overlaying a color-shifting background came together so well for the home page, all done with CSS/HTML. Check it out at bustedceramics.com.",
  },
  {
    id: "aj-integrated",
    title: "AJ Integrated",
    type: "video",
    src: "/videos/aj-integrated.mp4",
    poster: "/videos/aj-integrated-poster.jpg",
    blurb:
      "Designing the logo, custom animations, and website for a sports marketing firm.\n\nThe client was looking for a professional logo and custom website to showcase their expertise in brand partnerships, highlighting past successes, core services, and case studies. They wanted something more engaging and compelling than standard templated websites, with a playful aspect inspired by their six-year-old daughter.\n\nBeginnings\nI started with a blank style guide I created from my work with clients. It helps get the ball rolling in the first meetings by visualizing the possibilities for the creative direction. I also organized a dedicated project folder and Pinterest board for the client.\n\nInspiration\nOnce the mood board was together, I began searching for logo inspiration. Nothing stood out until I came across a logo on Pinterest that became the starting point for the client’s identity. I ultimately decided to merge the form with a J and worked with a designer to perfect it.\n\nI wanted to make the branding more playful, so I returned to a website I had archived that used Matter.js in a clever way. Because the business is centered on sports, I found suitable balls that could move around the page and interact with the logo. The physics-based animation gave the identity energy while connecting directly to the client’s industry.\n\nIt’s all in the details\nThe split text in the hero section creates a sharp, dynamic feel. The background animation adds depth, and the callouts are positioned strategically. Every detail contributes to the flow, making the design feel intentional and connected.\n\nFinal thoughts\nThis project was about more than building a website. It was about crafting an experience. The physics-based animations and bold branding reinforce the idea of momentum, allowing the sports consulting platform to express its story through interaction as well as content.",
  },
  {
    id: "collwick-rotation",
    title: "Collwick Rotation",
    type: "video",
    src: "/videos/collwick rotation.mp4",
    poster: "/videos/collwick-rotation-poster.jpg",
  },
  {
    id: "ccnyc-gallery",
    title: "CCNYC Gallery",
    type: "video",
    src: "/videos/ccnyc-gallery-video.mp4",
    poster: "/videos/ccnyc-gallery-poster.jpg?v=05s",
    blurb:
      "Concept\nEvery week, a different artist or designer creates a poster for a Creative Coding NYC meetup. As a CCNYC organizer and officer, I saw an opportunity to make these posters a more memorable part of the organization’s website while building an evolving archive of the community’s creative work.\n\nExperience\nI wanted the transition into the gallery to feel just as expressive as the posters themselves. Rather than placing the work in a static grid, I designed the posters to drift, bend, and move as if they were floating in the wind. The motion turns browsing the archive into a playful, immersive experience while still allowing each artist’s work to take center stage.\n\nBuild\nI built the Creative Coding NYC Gallery with Next.js, TypeScript, Three.js, WebGL, and custom GLSL shaders. The result is a rotating digital showcase that celebrates the visual identity of each weekly meetup and gives CCNYC a living gallery that can continue to grow alongside its community.",
  },
  {
    id: "divot-promo",
    title: "Divot Promo",
    type: "image",
    src: "/videos/divot-logo.jpeg",
    poster: "/videos/divot-logo.jpeg",
    blurb:
      "A web app built with React and AWS (Amplify, Cognito, Lambda, DynamoDB) for people to help their favorite brands become more eco-friendly.\n\nDivot was created with a focus on sustainability, addressing the hesitations that surfaced with every purchase I made. When I seek answers about the impact of my purchases, the information can be overwhelming, superficial, and difficult to track. At the same time, some brands are making genuine efforts that often get overshadowed. This platform aims to bridge the gap between brands and consumers, fostering transparency and communication while also showcasing eco-friendly brand efforts.\n\nI first learned how to use AWS Amplify and React during a project at Dartmouth, and that experience sparked my interest in building something on my own. Post-graduation, I was eager to continue learning, so I made the difficult decision to tell the amazing team at Hyundai that I wasn’t coming back to work in automotive. Instead, I set out to build this app from scratch—not just as a personal project, but as a way to refine my skills and explore my passion for technology and sustainability.\n\nI developed Divot using React for the frontend and AWS Amplify for authentication and backend services, implementing role-based access to differentiate between brands and consumers. Users could create profiles, submit verified sustainability suggestions, and track their contributions over time. I personally reviewed and approved these suggestions to ensure accuracy, creating a system that rewarded engaged users with milestones while maintaining transparency.\n\nThis project was a deep dive into GraphQL, AWS Lambda, IAM roles, and state management, pushing me to problem-solve across different aspects of full-stack development. More than just a technical exercise, building Divot reinforced my commitment to creating technology that makes information more accessible and actionable—especially in a space as crucial as sustainability.",
    links: [
      {
        label: "View GitHub",
        href: "https://github.com/hollandblumer6/version4/blob/main/divot/src/components/follower/SuggestionSupporterBrand.jsx",
      },
    ],
  },
  {
    id: "floating-books",
    title: "Floating Books",
    type: "video",
    src: "/videos/floating-books-optimized.mp4",
    poster: "/videos/floating-books-poster.jpg",
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
  const regularGridEffectStrengthRef = useRef(1.3);
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
    const selectedProject = PROJECTS[index];
    const resolvedIndex =
      selectedProject?.id === "rip-open"
        ? PROJECTS.findIndex((project) => project.id === "type-lab")
        : index;
    const project = PROJECTS[resolvedIndex];
    if (!project) return;

    if (project.id === "templates") {
      router.push(project.href);
      return;
    }

    setActiveIndex(resolvedIndex);
    setCurrentSlide(resolvedIndex + 1);
    setProjectRevealDone(false);
    setGridProjectIndex(resolvedIndex);
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
                          const currentIsCategory = projectFilter !== "all";
                          const nextIsCategory = filter.value !== "all";
                          if (!currentIsCategory && nextIsCategory) {
                            regularGridEffectStrengthRef.current = gridEffectStrength;
                            setGridEffectStrength(0.1);
                          } else if (currentIsCategory && !nextIsCategory) {
                            setGridEffectStrength(regularGridEffectStrengthRef.current);
                          }
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
              <header className="sticky top-0 z-10 border-b border-black/10 bg-[rgba(250,249,246,0.9)] backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5 sm:h-20 sm:px-8">
                  <p className={`text-sm font-semibold tracking-[-0.02em] ${bricolage.className}`}>
                    Holland Blumer
                  </p>
                  <button
                    type="button"
                    onClick={() => setGridProjectIndex(null)}
                    className={`flex h-10 items-center rounded-full bg-black px-5 text-xs font-semibold text-white transition hover:bg-black/75 ${bricolage.className}`}
                    aria-label="Close project page"
                  >
                    Close
                  </button>
                </div>
              </header>

              <div className="mx-auto w-full max-w-[1240px] px-5 pb-20 pt-9 sm:px-8 sm:pb-28 sm:pt-12">
                <div className="mb-7 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <h1 className={`max-w-4xl text-[clamp(2.25rem,5vw,4.75rem)] font-semibold leading-[0.96] tracking-[-0.055em] ${bricolage.className}`}>
                    {gridProject.title}
                  </h1>
                  <p className={`text-xs uppercase tracking-[0.14em] text-black/45 ${bricolage.className}`}>
                    {String(gridProjectIndex + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
                  </p>
                </div>

                <div className="flex min-h-[52dvh] items-center justify-center overflow-hidden rounded-[1.35rem] bg-[#e9e7e1] p-3 sm:min-h-[65dvh] sm:rounded-[1.75rem] sm:p-5">
                  {gridProject.type === "video" ? (
                    <video
                      src={gridProject.src}
                      poster={gridProject.poster}
                      aria-label={gridProject.title}
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      className="project-page-reveal__image block max-h-[78dvh] w-full rounded-xl object-contain sm:rounded-2xl"
                    />
                  ) : (
                    <img
                      src={gridProject.poster}
                      alt={gridProject.title}
                      className="project-page-reveal__image block max-h-[78dvh] w-full rounded-xl object-contain sm:rounded-2xl"
                    />
                  )}
                </div>

                <div className="mx-auto grid max-w-[980px] gap-8 border-t border-black/10 pt-10 mt-12 md:grid-cols-[180px_minmax(0,1fr)] sm:mt-16 sm:pt-14">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-black/45 ${bricolage.className}`}>About the project</p>
                    <p className="mt-3 text-xs leading-5 text-black/45">Design, development<br />and motion</p>
                  </div>
                  <div className="min-w-0">
                    {gridProject.blurb && !gridProject.gallery?.length && (
                      <p className="max-w-3xl whitespace-pre-line text-lg leading-8 sm:text-xl sm:leading-9">
                        {gridProject.blurb}
                      </p>
                    )}
                    {gridProject.blurb && gridProject.gallery?.length > 0 && (
                      <div className="grid gap-10 sm:gap-14">
                        {gridProject.blurb.split("\n\n").map((section) => {
                          const [heading, ...bodyLines] = section.split("\n");
                          const sectionImages = gridProject.gallery.filter(
                            (image) => image.afterHeading === heading,
                          );

                          return (
                            <section key={heading} className="grid gap-5">
                              <div className="max-w-3xl">
                                <h2 className={`mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/45 ${bricolage.className}`}>
                                  {heading}
                                </h2>
                                <p className="text-base leading-7 sm:text-lg sm:leading-8">
                                  {bodyLines.join("\n")}
                                </p>
                              </div>
                              {sectionImages.map((image) => (
                                <figure
                                  key={image.src}
                                  className="mt-2 overflow-hidden rounded-2xl bg-white"
                                >
                                  {image.type === "video" ? (
                                    <video
                                      src={image.src}
                                      poster={image.poster}
                                      aria-label={image.alt}
                                      autoPlay
                                      muted
                                      loop
                                      playsInline
                                      controls
                                      className="block h-auto w-full"
                                    />
                                  ) : (
                                    <img
                                      src={image.src}
                                      alt={image.alt}
                                      className="block h-auto w-full"
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  )}
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
                        className={`mt-10 rounded-full bg-black px-7 py-3.5 text-xs font-semibold text-white transition hover:bg-black/75 ${bricolage.className}`}
                      >
                        Open project
                      </button>
                    )}
                    {gridProject.links?.length > 0 && (
                      <div className="mt-10 flex flex-wrap gap-3">
                        {gridProject.links.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className={`rounded-full bg-black px-7 py-3.5 text-xs font-semibold text-white transition hover:bg-black/75 ${bricolage.className}`}
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
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
          projectFilter={projectFilter}
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
