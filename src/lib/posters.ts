import type { CodeSampleId } from "./codeSamples";

export type DetectedElement = {
  id: string;
  label: string;
  x: string;
  y: string;
  details?: {
    description: string;
    samples: {
      title: string;
      sampleId: CodeSampleId;
      tall?: boolean;
    }[];
  };
};

export type Poster = {
  src: string;
  thumbnailSrc?: string;
  artist: string;
  year: string;
  sourceUrl: string;
  elements: DetectedElement[];
};

export const posterArchive: Poster[] = [
  {
    src: "/poster-blueprint/weswilson-svg.svg",
    thumbnailSrc: "/poster-blueprint/wes-wilson-1.jpg",
    artist: "Wes Wilson",
    year: "1967",
    sourceUrl:
      "https://posterhouse.org/blog/wes-wilson-from-art-nouveau-to-psychedelic/",
    elements: [
      {
        id: "edge-map",
        label: "SVG Filter Text",
        x: "62%",
        y: "18%",
        details: {
          description:
            "Wes Wilson is known for his warped, liquid text. This can be recreated with SVG filters by applying turbulence and displacement maps to text.",
          samples: [
            {
              title: "HTML",
              sampleId: "svg",
              tall: true,
            },
          ],
        },
      },
      {
        id: "blueprint-grid",
        label: "Ink Bleed Wavy Lines",
        x: "33%",
        y: "72%",
        details: {
          description:
            "Wes Wilson, along with other counterculture artists like Stanley Mouse, Victor Moscoso, and Bonnie MacLean, was known for ink-bleeding wavy lines. These can be recreated two ways: with shader paths following layered sine waves, or with a metaball effect using blurred alpha shapes and contrast.",
          samples: [
            {
              title: "Ink Bleed Wavy Lines HTML",
              sampleId: "ink-bleed",
              tall: true,
            },
            {
              title: "Metaballs HTML",
              sampleId: "metaballs",
            },
          ],
        },
      },
    ],
  },
  {
    src: "/poster-blueprint/wes-wilson-2.jpg",
    artist: "Wes Wilson",
    year: "1986",
    sourceUrl: "https://trps.org/2016/01/22/trips-festival-1966-documentary/",
    elements: [
      {
        id: "logarithmic-spiral",
        label: "Logarithmic Spiral",
        x: "33%",
        y: "34%",
        details: {
          description:
            "Wes Wilson worked with what looks like a mathematical logarithmic spiral in this poster. This can be recreated with the following code below.",
          samples: [
            {
              title: "Logarithmic Spiral HTML",
              sampleId: "logarithmic-spiral",
              tall: true,
            },
          ],
        },
      },
      {
        id: "sine-envelope",
        label: "Envelope Sine",
        x: "64%",
        y: "52%",
        details: {
          description:
            "This feature follows a sine wave whose amplitude narrows and expands through an envelope function, creating a controlled wave band rather than a constant oscillation.",
          samples: [
            {
              title: "Envelope Sine Wave HTML",
              sampleId: "envelope-sine",
              tall: true,
            },
          ],
        },
      },
    ],
  },
  {
    src: "/poster-blueprint/wes-wilson-3.jpg",
    artist: "Wes Wilson",
    year: "1967",
    sourceUrl: "https://communedesign.tumblr.com/post/140752113640/wes-wilson",
    elements: [
      {
        id: "contour-lines-3",
        label: "Contour Lines",
        x: "68%",
        y: "25%",
        details: {
          description:
            "These nested bands can be generated as contour lines from a distance field. The reference builds a text mask, runs a distance transform, then assigns colors by band distance.",
          samples: [
            {
              title: "Contour Lines HTML",
              sampleId: "contour-lines",
              tall: true,
            },
          ],
        },
      },
      {
        id: "ink-bleed-wavy-lines-3",
        label: "Tetris Blobs",
        x: "44%",
        y: "68%",
        details: {
          description:
            "Layered flowing linework can be modeled with sine-wave paths or blurred metaball shapes that merge into soft ink-like bands.",
          samples: [
            {
              title: "Ink Bleed Wavy Lines HTML",
              sampleId: "ink-bleed",
              tall: true,
            },
            {
              title: "Metaballs HTML",
              sampleId: "metaballs",
            },
          ],
        },
      },
    ],
  },
  {
    src: "/poster-blueprint/wes-wilson-4.png",
    artist: "Wes Wilson",
    year: "1967",
    sourceUrl:
      "https://www.wolfgangs.com/posters-handbills-and-postcards/them/poster/BG020.html",
    elements: [
      {
        id: "spherical-3d-text-4",
        label: "Spherical 3D Text",
        x: "72%",
        y: "28%",
        details: {
          description:
            "This poster effect can be recreated as extruded 3D type bent over a spherical surface. A Three.js text geometry supplies the thick letterforms, then each vertex is remapped with spherical coordinates so the word feels inflated, curved, and dimensional.",
          samples: [
            {
              title: "Spherical 3D Text Three.js",
              sampleId: "spherical-3d-text",
            },
          ],
        },
      },
    ],
  },
  {
    src: "/poster-blueprint/wes-wilson-5.png",
    artist: "Wes Wilson",
    year: "1967",
    sourceUrl: "https://www.ebay.com/itm/286156517909",
    elements: [
      {
        id: "egg-form-5",
        label: "Egg Form",
        x: "57%",
        y: "45%",
        details: {
          description:
            "Eggs were a predominant motif during this era, alongside peace signs, butterflies, trees, and other organic symbols. This poster compresses the type into a large egg-like container that can be approached as warped text clipped into a soft oval field.",
          samples: [
            {
              title: "HTML",
              sampleId: "svg",
              tall: true,
            },
          ],
        },
      },
    ],
  },
  {
    src: "/poster-blueprint/wes-wilson-6.png",
    artist: "Wes Wilson",
    year: "1967",
    sourceUrl:
      "https://www.wolfgangs.com/posters-handbills-and-postcards/jefferson-airplane/poster/BG017.html",
    elements: [
      {
        id: "organic-text-fill-6",
        label: "Organic Text Fill",
        x: "54%",
        y: "48%",
        details: {
          description:
            "Wilson often made text behave like a fluid material, packing words tightly into organic containers rather than laying them on a neutral grid. The letterforms stretch to fill the available space, turning the shape itself into a typographic surface.",
          samples: [
            {
              title: "Organic Text Fill p5",
              sampleId: "organic-text-fill",
            },
          ],
        },
      },
    ],
  },
  {
    src: "/poster-blueprint/wes-wilson-7.png",
    artist: "Wes Wilson",
    year: "1967",
    sourceUrl:
      "https://posterhouse.org/blog/wes-wilson-from-art-nouveau-to-psychedelic/",
    elements: [
      {
        id: "eye-pattern-7",
        label: "Eye Pattern",
        x: "16%",
        y: "18%",
        details: {
          description:
            "The repeated eye motif works like circle packing: each packed circle becomes an offset olive-shaped eye with a colored core, creating a dense ornamental field around the figure.",
          samples: [
            {
              title: "Eye Circle Packing p5",
              sampleId: "eye-pattern",
            },
          ],
        },
      },
      {
        id: "fractal-trees-7",
        label: "Fractal Trees",
        x: "73%",
        y: "70%",
        details: {
          description:
            "The lower-right ornament behaves like a recursive tree or branching plant form. Repeated branch rotation, scaling, and curl strokes can generate this kind of psychedelic vegetal structure.",
          samples: [
            {
              title: "Fractal Trees JS",
              sampleId: "fractal-trees",
            },
          ],
        },
      },
    ],
  },
];
