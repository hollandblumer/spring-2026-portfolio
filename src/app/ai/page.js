import Link from "next/link";
import Image from "next/image";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import {
  ArrowUpRight,
  BrainCircuit,
  Database,
  FolderGit2,
  MessageSquareQuote,
  Palette,
  ServerCog,
  Sparkles,
  Workflow,
} from "lucide-react";
import styles from "./ai.module.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "AI Design Intelligence | Holland Blumer",
  description:
    "A personal design intelligence trained around Holland Blumer's portfolio, process, and creative reasoning.",
};

const DATA_LAYERS = [
  {
    title: "Portfolio",
    text: "Finished websites, posters, motion studies, interactive tools, client systems, and coded visual experiments.",
    icon: Palette,
  },
  {
    title: "Process",
    text: "Iterations, discarded directions, sketches, references, parameter tests, and the messy middle of making.",
    icon: FolderGit2,
  },
  {
    title: "Reasoning",
    text: "The taste layer: why one direction wins, when to add motion, what to simplify, and what should stay strange.",
    icon: MessageSquareQuote,
  },
];

const SIGNALS = [
  "generative typography",
  "motion-led interfaces",
  "coded posters",
  "organic distortion",
  "interactive tools",
  "taste notes",
  "client constraints",
  "rejected concepts",
];

const PROJECT_ASSETS = [
  {
    src: "/poster-blueprint/snapshot.png",
    alt: "Poster Blueprint interface snapshot",
    label: "Poster Blueprint",
  },
  {
    src: "/projects/3dmotionmarbling.png",
    alt: "3D Motion Marbling project preview",
    label: "3D Motion Marbling",
  },
  {
    src: "/projects/design-splash.jpeg",
    alt: "Generative circle composition",
    label: "Design with a Splash of Code",
  },
  {
    src: "/projects/checkerboard3d.jpeg",
    alt: "Checkerboard in motion preview",
    label: "Checkerboard in Motion",
  },
];

const OUTPUTS = [
  "A visual concept with palette, movement, and interaction logic",
  "A code-ready direction instead of a generic moodboard",
  "A rationale that explains why the system made those choices",
];

const ARCHITECTURE_STEPS = [
  {
    title: "Frontend",
    label: "Next.js interface",
    text: "A visual workbench where someone uploads a poster, describes a mood, or opens a saved direction.",
  },
  {
    title: "GraphQL API",
    label: "Typed creative data",
    text: "One structured layer for posters, references, code samples, reasoning notes, and analysis history.",
  },
  {
    title: "Postgres",
    label: "Portfolio dataset",
    text: "A growing archive of finished work, process artifacts, detected elements, and taste decisions.",
  },
  {
    title: "Gemini Worker",
    label: "Multimodal reading",
    text: "A background analyzer that compares uploaded visuals against the dataset and returns a direction.",
  },
];

export default function AIPage() {
  return (
    <main className={`${styles.page} ${bricolage.className}`}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link href="/" className={styles.backLink}>
            Holland Blumer
          </Link>
          <p className={styles.kicker}>Personal Design Intelligence</p>
          <h1>AI trained on the way I make visuals.</h1>
          <p className={styles.lede}>
            A model shaped around my own code, portfolio, process, and design
            reasoning so someone can describe a feeling and get a visual
            direction that actually knows my creative language.
          </p>
          <div className={styles.heroActions}>
            <a href="mailto:hollandblumer6@icloud.com" className={styles.primaryAction}>
              Start a visual brief
              <ArrowUpRight aria-hidden="true" size={18} />
            </a>
            <Link href="/poster-blueprint/" className={styles.secondaryAction}>
              See the source logic
            </Link>
          </div>
        </div>

        <div className={styles.visualSystem} aria-label="Design intelligence system diagram">
          <div className={styles.orbit}>
            {PROJECT_ASSETS.map((asset, index) => (
              <figure
                className={`${styles.assetTile} ${styles[`assetTile${index + 1}`]}`}
                key={asset.src}
              >
                <div className={styles.assetImage}>
                  <Image
                    src={asset.src}
                    alt={asset.alt}
                    fill
                    sizes="(max-width: 560px) 40vw, 17vw"
                  />
                </div>
                <figcaption>{asset.label}</figcaption>
              </figure>
            ))}
          </div>
          <div className={styles.coreModel}>
            <BrainCircuit aria-hidden="true" size={42} />
            <span className={plexMono.className}>HB_AI_01</span>
            <strong>taste model</strong>
          </div>
        </div>
      </section>

      <section className={styles.layers} aria-labelledby="layers-title">
        <div>
          <p className={styles.kicker}>Dataset Layers</p>
          <h2 id="layers-title">Not just what I made. How I decided.</h2>
        </div>
        <div className={styles.layerGrid}>
          {DATA_LAYERS.map(({ title, text, icon: Icon }) => (
            <article className={styles.layerCard} key={title}>
              <Icon aria-hidden="true" size={24} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.lab}>
        <div className={styles.promptPanel}>
          <div className={styles.panelHeader}>
            <Sparkles aria-hidden="true" size={19} />
            <span className={plexMono.className}>visual_brief.input</span>
          </div>
          <p>
            “Make something for a music event that feels like pressure building
            inside a poster, with type that stays barely legible.”
          </p>
          <div className={styles.signalCloud}>
            {SIGNALS.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        </div>

        <div className={styles.flowColumn}>
          <Workflow aria-hidden="true" size={28} />
          <span className={plexMono.className}>portfolio + process + reasoning</span>
        </div>

        <div className={styles.outputPanel}>
          <div className={styles.panelHeader}>
            <Palette aria-hidden="true" size={19} />
            <span className={plexMono.className}>direction.output</span>
          </div>
          <ul>
            {OUTPUTS.map((output) => (
              <li key={output}>{output}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.architecture} aria-labelledby="architecture-title">
        <div className={styles.architectureCopy}>
          <p className={styles.kicker}>System Architecture</p>
          <h2 id="architecture-title">
            A real backend for a living creative dataset.
          </h2>
          <p>
            Poster Blueprint can evolve from a single analyzer into a saved,
            queryable knowledge base: frontend to GraphQL API to Postgres
            dataset, with a Gemini worker handling the visual interpretation.
          </p>
        </div>

        <div className={styles.architecturePanel}>
          <div className={styles.stackBadge}>
            <ServerCog aria-hidden="true" size={20} />
            <span className={plexMono.className}>frontend - GraphQL - Postgres - Gemini</span>
          </div>

          <div className={styles.systemPath}>
            {ARCHITECTURE_STEPS.map((step, index) => (
              <article className={styles.systemStep} key={step.title}>
                <span className={`${styles.stepIndex} ${plexMono.className}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <strong className={plexMono.className}>{step.label}</strong>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.databaseNote}>
            <Database aria-hidden="true" size={22} />
            <p>
              Saved analyses make the system smarter over time because each
              upload can become another labeled example of composition, code,
              visual effect, and design judgment.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.manifesto}>
        <p>
          The point is not to clone a style. It is to preserve a point of view:
          the pull toward motion, typography, generative systems, odd textures,
          and visual ideas that feel designed before they feel automated.
        </p>
      </section>
    </main>
  );
}
