"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import { ArrowUpRight, RotateCcw, Sparkles, Utensils } from "lucide-react";
import styles from "./reddit.module.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
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

export default function RedditIdeasPage() {
  const [feed, setFeed] = useState(
    SAMPLE_POSTS.map((post) => `${post.title}\n${post.text}`).join("\n\n"),
  );
  const words = useMemo(() => analyzeFeed(feed), [feed]);
  const topWords = words.slice(0, 8);

  return (
    <main className={`${styles.page} ${bricolage.className}`}>
      <section className={styles.hero}>
        <div className={styles.wordStage} aria-label="Ranked words floating upward">
          {words.map((item, index) => (
            <span
              className={styles.floatWord}
              data-type={item.type}
              key={item.word}
              style={{
                "--rank": index,
                "--heat": item.heat,
                "--x": `${8 + ((index * 17) % 78)}%`,
                "--delay": `${index * -0.28}s`,
                "--size": `${0.88 + Math.max(0, 1.2 - index * 0.05)}rem`,
              }}
            >
              {item.word}
            </span>
          ))}
        </div>

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
