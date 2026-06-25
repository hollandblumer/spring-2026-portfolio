"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bricolage_Grotesque,
  Monoton,
  Over_the_Rainbow,
} from "next/font/google";
import { ArrowUpRight, RotateCcw, Sparkles, Utensils } from "lucide-react";
import styles from "./reddit.module.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const monoton = Monoton({
  subsets: ["latin"],
  weight: "400",
});

const rainbow = Over_the_Rainbow({
  subsets: ["latin"],
  weight: "400",
});

const SAMPLE_POSTS = [
  {
    subreddit: "r/FoodNYC",
    title: "Best rainy-night bowl near Chinatown?",
    text: "Looking for hand-pulled noodles, chili oil, broth that feels huge, and somewhere cozy enough to linger after a movie.",
  },
  {
    subreddit: "r/AskNYC",
    title: "Tiny celebration dinner that is not boring",
    text: "Need a place with martinis, seafood tower energy, crispy potatoes, candlelight, and something a little theatrical without being impossible to book.",
  },
  {
    subreddit: "r/Brooklyn",
    title: "Greenpoint lunch crawl",
    text: "Pierogi, smoked fish, pickle plate, soft serve, espresso tonic, and a waterfront walk. Bonus for places with counter seats.",
  },
  {
    subreddit: "r/FoodLosAngeles",
    title: "Worth crossing town for?",
    text: "I will sit in traffic for great katsu, charcoal chicken, breakfast burrito, salsa bar, or a perfect bakery line experience.",
  },
  {
    subreddit: "r/Cooking",
    title: "Dinner party dish that sounds fancy but forgives mistakes",
    text: "Thinking braised short ribs, anchovy butter, citrus salad, roast chicken, crispy rice, or a big tiramisu scoop moment.",
  },
  {
    subreddit: "r/Travel",
    title: "One meal that made the whole trip click",
    text: "Mine was grilled sardines by the harbor, cold white wine, tomato bread, and the walk back through a night market.",
  },
];

const BOOST_WORDS = new Set([
  "noodles",
  "chili",
  "oil",
  "broth",
  "martinis",
  "seafood",
  "tower",
  "crispy",
  "potatoes",
  "pierogi",
  "smoked",
  "fish",
  "pickle",
  "soft",
  "serve",
  "katsu",
  "charcoal",
  "chicken",
  "burrito",
  "salsa",
  "bakery",
  "ribs",
  "anchovy",
  "butter",
  "citrus",
  "rice",
  "tiramisu",
  "sardines",
  "wine",
  "tomato",
  "bread",
  "market",
]);

const STOP_WORDS = new Set([
  "about",
  "after",
  "being",
  "bonus",
  "boring",
  "click",
  "cozy",
  "dinner",
  "enough",
  "experience",
  "fancy",
  "feels",
  "great",
  "huge",
  "looking",
  "made",
  "mine",
  "moment",
  "near",
  "night",
  "place",
  "places",
  "really",
  "somewhere",
  "sounds",
  "that",
  "their",
  "there",
  "thinking",
  "through",
  "traffic",
  "walk",
  "with",
  "without",
  "worth",
  "would",
]);

const PHRASES = [
  "hand pulled noodles",
  "chili oil",
  "seafood tower",
  "crispy potatoes",
  "smoked fish",
  "soft serve",
  "espresso tonic",
  "charcoal chicken",
  "breakfast burrito",
  "salsa bar",
  "braised short ribs",
  "anchovy butter",
  "citrus salad",
  "crispy rice",
  "tomato bread",
  "night market",
];

const FONT_CLASSES = [monoton.className, rainbow.className, bricolage.className];

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^-|-$/g, ""))
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function analyzeFeed(feedText) {
  const normalized = feedText.toLowerCase().replace(/-/g, " ");
  const scores = new Map();

  tokenize(feedText).forEach((word) => {
    const bonus = BOOST_WORDS.has(word) ? 5 : 1;
    scores.set(word, (scores.get(word) || 0) + bonus);
  });

  PHRASES.forEach((phrase) => {
    const matches = normalized.match(new RegExp(`\\b${phrase}\\b`, "g"));
    if (matches?.length) {
      scores.set(phrase, (scores.get(phrase) || 0) + matches.length * 9);
    }
  });

  return [...scores.entries()]
    .map(([word, score]) => ({
      word,
      score,
      heat: Math.min(1, score / 14),
      type: PHRASES.includes(word) ? "dish" : BOOST_WORDS.has(word) ? "ingredient" : "texture",
    }))
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
    .slice(0, 22);
}

function PhysicsWords({ words }) {
  const stageRef = useRef(null);
  const wordRefs = useRef(new Map());
  const bodiesRef = useRef([]);
  const dragRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    let disposed = false;

    const buildBodies = () => {
      const rect = stage.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      bodiesRef.current = words.map((item, index) => {
        const elem = wordRefs.current.get(item.word);
        const box = elem?.getBoundingClientRect();
        const bodyWidth = box?.width || 120;
        const bodyHeight = box?.height || 44;

        return {
          id: item.word,
          x: width * (0.18 + ((index * 0.137) % 0.64)),
          y: height - 26 - (index % 6) * 18,
          vx: ((index % 5) - 2) * 18,
          vy: -1 - (index % 4) * 0.35,
          angle: ((index % 7) - 3) * 0.04,
          spin: ((index % 5) - 2) * 0.004,
          width: bodyWidth,
          height: bodyHeight,
        };
      });
    };

    const renderBodies = () => {
      bodiesRef.current.forEach((body) => {
        const elem = wordRefs.current.get(body.id);
        if (!elem) return;

        elem.style.transform = `translate3d(${body.x - body.width / 2}px, ${
          body.y - body.height / 2
        }px, 0) rotate(${body.angle}rad)`;
      });
    };

    const step = () => {
      if (disposed) return;

      const rect = stage.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const bodies = bodiesRef.current;

      bodies.forEach((body) => {
        if (dragRef.current?.id === body.id) return;

        body.vy -= 0.34;
        body.vx *= 0.995;
        body.vy *= 0.996;
        body.x += body.vx;
        body.y += body.vy;
        body.angle += body.spin;

        const halfW = body.width / 2;
        const halfH = body.height / 2;

        if (body.x < halfW) {
          body.x = halfW;
          body.vx = Math.abs(body.vx) * 0.42;
          body.spin *= -0.8;
        }

        if (body.x > width - halfW) {
          body.x = width - halfW;
          body.vx = -Math.abs(body.vx) * 0.42;
          body.spin *= -0.8;
        }

        if (body.y < halfH) {
          body.y = halfH;
          body.vy = Math.abs(body.vy) * 0.28;
          body.vx *= 0.9;
          body.spin *= 0.82;
        }

        if (body.y > height - halfH) {
          body.y = height - halfH;
          body.vy = -Math.abs(body.vy) * 0.42;
          body.vx *= 0.86;
        }
      });

      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) {
          const a = bodies[i];
          const b = bodies[j];
          const overlapX = (a.width + b.width) / 2 - Math.abs(a.x - b.x);
          const overlapY = (a.height + b.height) / 2 - Math.abs(a.y - b.y);

          if (overlapX <= 0 || overlapY <= 0) continue;

          if (overlapX < overlapY) {
            const direction = a.x < b.x ? -1 : 1;
            a.x += (overlapX / 2) * direction;
            b.x -= (overlapX / 2) * direction;
            a.vx += direction * 0.18;
            b.vx -= direction * 0.18;
          } else {
            const direction = a.y < b.y ? -1 : 1;
            a.y += (overlapY / 2) * direction;
            b.y -= (overlapY / 2) * direction;
            a.vy += direction * 0.12;
            b.vy -= direction * 0.12;
          }
        }
      }

      renderBodies();
      frameRef.current = requestAnimationFrame(step);
    };

    const start = () => {
      buildBodies();
      renderBodies();
      frameRef.current = requestAnimationFrame(step);
    };

    const handleResize = () => {
      buildBodies();
      renderBodies();
    };

    const timeoutId = window.setTimeout(start, 80);
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [words]);

  const handlePointerDown = (event, word) => {
    const body = bodiesRef.current.find((item) => item.id === word);
    const stage = stageRef.current;
    if (!body || !stage) return;

    const rect = stage.getBoundingClientRect();
    dragRef.current = {
      id: word,
      offsetX: event.clientX - rect.left - body.x,
      offsetY: event.clientY - rect.top - body.y,
      previousX: event.clientX,
      previousY: event.clientY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;

    const body = bodiesRef.current.find((item) => item.id === drag.id);
    if (!body) return;

    const rect = stage.getBoundingClientRect();
    const nextX = event.clientX - rect.left - drag.offsetX;
    const nextY = event.clientY - rect.top - drag.offsetY;

    body.vx = event.clientX - drag.previousX;
    body.vy = event.clientY - drag.previousY;
    body.x = nextX;
    body.y = nextY;
    body.spin = body.vx * 0.002;
    drag.previousX = event.clientX;
    drag.previousY = event.clientY;
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className={styles.physicsStage} ref={stageRef} aria-label="Falling idea words">
      {words.map((item, index) => (
        <button
          className={`${styles.physicsWord} ${FONT_CLASSES[index % FONT_CLASSES.length]}`}
          data-type={item.type}
          data-highlighted={index < 7 ? "true" : "false"}
          key={item.word}
          ref={(node) => {
            if (node) {
              wordRefs.current.set(item.word, node);
            } else {
              wordRefs.current.delete(item.word);
            }
          }}
          style={{ "--heat": item.heat }}
          type="button"
          onPointerDown={(event) => handlePointerDown(event, item.word)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {item.word}
        </button>
      ))}
    </div>
  );
}

function LoaderLine({ value, suffix = "" }) {
  const chars = `${value}${suffix}`.split("");
  const fontSeed = Math.round(Number.parseFloat(value) * 10) || 0;

  return (
    <div className={styles.loaderLine}>
      {chars.map((char, index) => (
        <span
          className={`${styles.loaderChar} ${
            FONT_CLASSES[(fontSeed + index) % FONT_CLASSES.length]
          }`}
          key={`${char}-${index}`}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

function RedditLoader({ value, exiting }) {
  const degrees = Math.round(value * 3.6);
  const seconds = (value * 0.065).toFixed(1);

  return (
    <div
      className={`${styles.loaderOverlay} ${exiting ? styles.loaderOverlayExit : ""}`}
      aria-label={`Loading Reddit ideas ${value}%`}
    >
      <div className={styles.loaderStack}>
        <LoaderLine value={value} suffix="%" />
        <LoaderLine value={degrees} suffix="°" />
        <LoaderLine value={seconds} suffix="s" />
      </div>
    </div>
  );
}

export default function RedditIdeasPage() {
  const [feed, setFeed] = useState(
    SAMPLE_POSTS.map((post) => `${post.title}\n${post.text}`).join("\n\n"),
  );
  const [loaderValue, setLoaderValue] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const [loaderExiting, setLoaderExiting] = useState(false);
  const words = useMemo(() => analyzeFeed(feed), [feed]);
  const topWords = words.slice(0, 8);

  useEffect(() => {
    if (!showLoader) return undefined;

    let value = 0;
    let timeoutId;

    const tick = () => {
      value += 1;
      setLoaderValue(value);

      if (value < 100) {
        timeoutId = window.setTimeout(tick, 32);
        return;
      }

      setLoaderExiting(true);
      timeoutId = window.setTimeout(() => {
        setShowLoader(false);
      }, 520);
    };

    timeoutId = window.setTimeout(tick, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showLoader]);

  return (
    <main className={`${styles.page} ${bricolage.className}`}>
      {showLoader && (
        <RedditLoader value={loaderValue} exiting={loaderExiting} />
      )}
      <section className={styles.hero}>
        <PhysicsWords words={words} />

        <div className={styles.heroCopy}>
          <Link className={styles.homeLink} href="/">
            Holland Blumer <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <p className={styles.eyebrow}>/reddit idea board</p>
          <h1>pull the good words out of the scroll</h1>
          <p className={styles.deck}>
            A sample Reddit feed gets skimmed for dishes, cravings, tiny rituals,
            and texture words. The stronger signals rise to the top so the page
            starts to feel like a menu for what people actually want.
          </p>
        </div>
      </section>

      <section className={styles.workspace} aria-label="Reddit feed analyzer">
        <div className={styles.feedPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.kicker}>sample feed</p>
              <h2>posts I would mine</h2>
            </div>
            <button
              className={styles.iconButton}
              type="button"
              onClick={() =>
                setFeed(SAMPLE_POSTS.map((post) => `${post.title}\n${post.text}`).join("\n\n"))
              }
              aria-label="Reset sample feed"
              title="Reset sample feed"
            >
              <RotateCcw size={18} aria-hidden="true" />
            </button>
          </div>

          <textarea
            className={styles.feedInput}
            value={feed}
            onChange={(event) => setFeed(event.target.value)}
            aria-label="Editable sample Reddit feed"
            spellCheck="false"
          />
        </div>

        <div className={styles.resultsPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.kicker}>best words</p>
              <h2>floating up</h2>
            </div>
            <Utensils size={22} aria-hidden="true" />
          </div>

          <div className={styles.topGrid}>
            {topWords.map((item, index) => (
              <div className={styles.wordCard} key={item.word}>
                <span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.word}</strong>
                <span>{item.type} signal</span>
              </div>
            ))}
          </div>

          <div className={styles.ideaStrip}>
            <Sparkles size={18} aria-hidden="true" />
            <p>
              Turn these into searchable clusters: dishes people chase,
              restaurants that become rituals, and experiences worth crossing
              town for.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
