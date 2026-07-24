import Image from "next/image";
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Newsreader,
  Source_Serif_4,
} from "next/font/google";
import styles from "./moodboard.module.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

const imagePieces = [
  {
    title: "Poster Blueprint",
    src: "/poster-blueprint/snapshot.png",
    className: styles.posterBlueprint,
  },
  {
    title: "3D Motion Marbling",
    src: "/projects/3dmotionmarbling.png",
    className: styles.marbling,
  },
  {
    title: "Type Experiment",
    src: "/videos/filter-poster.jpg",
    className: styles.typeExperiment,
  },
  {
    title: "Canvas Particles",
    src: "/projects/canvas-particles.jpeg",
    className: styles.canvasParticles,
  },
  {
    title: "Templates",
    src: "/videos/templates-poster.jpg",
    className: styles.templates,
  },
  {
    title: "Checkerboard",
    src: "/projects/checkerboard3d.jpeg",
    className: styles.checkerboard,
  },
  {
    title: "Wes Wilson",
    src: "/poster-blueprint/wes-wilson-1.jpg",
    className: styles.wesWilson,
  },
  {
    title: "Design Splash",
    src: "/projects/design-splash.jpeg",
    className: styles.designSplash,
  },
];

const fontSpecimens = [
  {
    name: "Bricolage Grotesque",
    sample: "motion weave",
    className: styles.bricolageSample,
  },
  {
    name: "Newsreader",
    sample: "soft archive",
    className: styles.newsreaderSample,
  },
  {
    name: "Source Serif 4",
    sample: "material notes",
    className: styles.sourceSerifSample,
  },
  {
    name: "Geist Mono",
    sample: "code sample",
    className: styles.geistSample,
  },
];

const codePenLinks = [
  {
    title: "CodePen",
    href: "https://codepen.io/hollandblumer",
    label: "hollandblumer",
  },
  {
    title: "Public Pens",
    href: "https://codepen.io/hollandblumer/pens/public",
    label: "visual tests",
  },
  {
    title: "Picked Work",
    href: "https://codepen.io/hollandblumer",
    label: "creative code",
  },
];

const swatches = ["#28201b", "#c3c3c3", "#e35f2f", "#6f7f43", "#f2d35d"];

export const metadata = {
  title: "Moodboard | Holland Blumer",
  description: "A visual moodboard for starting portfolio and creative code ideas.",
};

export default function MoodboardPage() {
  return (
    <main
      className={[
        styles.page,
        bricolage.variable,
        newsreader.variable,
        sourceSerif.variable,
        plexMono.variable,
      ].join(" ")}
    >
      <section className={styles.board} aria-label="Moodboard">
        <div className={styles.titleBlock}>
          <p>creative planning table</p>
          <h1>Moodboard</h1>
        </div>

        <div className={styles.swatchStrip} aria-label="Color notes">
          {swatches.map((color) => (
            <span
              key={color}
              className={styles.swatch}
              style={{ "--swatch": color }}
            />
          ))}
        </div>

        <div className={styles.imageField}>
          {imagePieces.map((piece) => (
            <figure
              key={piece.title}
              className={`${styles.imagePiece} ${piece.className}`}
            >
              <Image
                src={piece.src}
                alt={piece.title}
                fill
                sizes="(max-width: 700px) 70vw, 30vw"
              />
              <figcaption>{piece.title}</figcaption>
            </figure>
          ))}
        </div>

        <section className={styles.fontPanel} aria-label="Font specimens">
          {fontSpecimens.map((font) => (
            <article key={font.name} className={styles.fontCard}>
              <span>{font.name}</span>
              <p className={font.className}>{font.sample}</p>
            </article>
          ))}
        </section>

        <section className={styles.codepenPanel} aria-label="CodePen links">
          {codePenLinks.map((pen) => (
            <a
              key={pen.title}
              className={styles.codepenCard}
              href={pen.href}
              target="_blank"
              rel="noreferrer"
            >
              <span>{pen.title}</span>
              <strong>{pen.label}</strong>
            </a>
          ))}
        </section>

        <div className={styles.noteOne}>
          <span>scheme</span>
          <p>type, texture, motion, dark walnut, chalky grey</p>
        </div>

        <div className={styles.noteTwo}>
          <span>samples</span>
          <p>poster scans, browser sketches, project stills, interface details</p>
        </div>
      </section>
    </main>
  );
}
