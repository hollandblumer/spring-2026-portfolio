"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { BlueprintCanvas } from "@/components/blueprint/BlueprintCanvas";
import { CrosshairPreloader } from "@/components/blueprint/CrosshairPreloader";
import { CrosshairColorReveal } from "@/components/blueprint/CrosshairColorReveal";
import { ElementZoomPreview } from "@/components/blueprint/ElementZoomPreview";
import { MicroGrain } from "@/components/blueprint/MicroGrain";
import { MovingCrosshair } from "@/components/blueprint/MovingCrosshair";
import { PosterCallouts } from "@/components/blueprint/PosterCallouts";
import { codeSamples, type CodeSampleId } from "@/lib/codeSamples";
import { posterArchive, type DetectedElement, type Poster } from "@/lib/posters";

const ANALYZE_ENDPOINT =
  process.env.NEXT_PUBLIC_POSTER_BLUEPRINT_API_URL ??
  "http://127.0.0.1:8000/analyze";

function getDefaultElement(poster: Poster) {
  return (
    poster.elements.find((element) => element.id === "edge-map") ??
    poster.elements[0]
  );
}

type AnalysisElement = {
  id?: string;
  label?: string;
  x?: string | number;
  y?: string | number;
  details?: {
    description?: string;
    samples?: {
      title?: string;
      sampleId?: string;
      tall?: boolean;
    }[];
  };
};

type AnalysisReading = {
  summary?: string;
  elements?: AnalysisElement[];
};

function isCodeSampleId(value: string | undefined): value is CodeSampleId {
  return Boolean(value && value in codeSamples);
}

function asPercent(value: string | number | undefined, fallback: string) {
  if (typeof value === "string") {
    return value.endsWith("%") ? value : `${value}%`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.min(100, Math.max(0, value)).toFixed(1)}%`;
  }

  return fallback;
}

function createUploadedPoster(
  file: File,
  src: string,
  reading: AnalysisReading,
): Poster {
  const elements =
    reading.elements
      ?.map((element, index) => {
        const samples =
          element.details?.samples
            ?.filter((sample) => isCodeSampleId(sample.sampleId))
            .map((sample) => ({
              title: sample.title ?? "HTML",
              sampleId: sample.sampleId,
              tall: sample.tall ?? true,
            })) ?? [];

        if (!samples.length) return null;

        return {
          id: element.id ?? `uploaded-element-${index + 1}`,
          label: element.label ?? `Element ${index + 1}`,
          x: asPercent(element.x, `${50 + index * 3}%`),
          y: asPercent(element.y, `${40 + index * 4}%`),
          details: {
            description:
              element.details?.description ??
              "Detected as a visual pattern similar to one of your reference techniques.",
            samples,
          },
        } satisfies DetectedElement;
      })
      .filter((element): element is DetectedElement => Boolean(element)) ?? [];

  return {
    src,
    artist: "Uploaded",
    year: "Analysis",
    sourceUrl: file.name,
    elements:
      elements.length > 0
        ? elements
        : [
            {
              id: "uploaded-image",
              label: "Uploaded Image",
              x: "50%",
              y: "50%",
              details: {
                description:
                  reading.summary ??
                  "No matching construction element was detected yet.",
                samples: [],
              },
            },
          ],
  };
}

export function PosterBlueprintApp() {
  const [selectedPosterIndex, setSelectedPosterIndex] = useState(0);
  const [uploadedPoster, setUploadedPoster] = useState<Poster | null>(null);
  const selectedPoster = uploadedPoster ?? posterArchive[selectedPosterIndex];
  const isSvgBlueprint = selectedPoster.src.endsWith(".svg");
  const [selectedElement, setSelectedElement] = useState(
    getDefaultElement(selectedPoster),
  );
  const [zoomLevel, setZoomLevel] = useState(2.6);
  const [copiedSample, setCopiedSample] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const notesPanelRef = useRef<HTMLDivElement | null>(null);
  const uploadedObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (uploadedObjectUrlRef.current) {
        URL.revokeObjectURL(uploadedObjectUrlRef.current);
      }
    };
  }, []);

  function selectPoster(index: number) {
    setUploadedPoster(null);
    setSelectedPosterIndex(index);
    selectElement(getDefaultElement(posterArchive[index]));
  }

  function selectElement(element: typeof selectedElement) {
    setSelectedElement(element);
    window.requestAnimationFrame(() => {
      notesPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function copyCodeSample(sample: string, id: string) {
    await navigator.clipboard.writeText(sample);
    setCopiedSample(id);
    window.setTimeout(() => setCopiedSample(null), 1600);
  }

  async function analyzeImage(file: File) {
    setIsAnalyzing(true);
    setAnalysisError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(ANALYZE_ENDPOINT, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;
        throw new Error(errorBody?.detail ?? "Image analysis failed");
      }

      const reading = (await response.json()) as AnalysisReading;
      if (uploadedObjectUrlRef.current) {
        URL.revokeObjectURL(uploadedObjectUrlRef.current);
      }

      const uploadedSrc = URL.createObjectURL(file);
      uploadedObjectUrlRef.current = uploadedSrc;
      const poster = createUploadedPoster(file, uploadedSrc, reading);
      setUploadedPoster(poster);
      setSelectedElement(getDefaultElement(poster));
      window.requestAnimationFrame(() => {
        notesPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch (error) {
      setAnalysisError(
        error instanceof DOMException && error.name === "AbortError"
          ? "Image analysis timed out"
          : error instanceof Error ? error.message : "Image analysis failed",
      );
    } finally {
      window.clearTimeout(timeout);
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden blue-grain text-[#f6f7fd] font-sans md:h-screen md:flex-row md:overflow-hidden">
      <CrosshairPreloader />
      <MicroGrain className="z-0" />

      <aside className="relative z-10 order-1 w-full p-8 md:w-[300px] md:p-8">
        <div className="flex min-h-full flex-col gap-6">
          <label className="flex w-full cursor-pointer items-center justify-between text-left text-[18px] font-medium text-[#f6f7fd] transition-opacity duration-300 hover:opacity-80">
            <span>{isAnalyzing ? "Reading..." : "Upload"}</span>
            <Upload size={16} strokeWidth={1.8} />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={isAnalyzing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) analyzeImage(file);
              }}
            />
          </label>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3">
              {posterArchive.map((poster, idx) => (
                <button
                  key={poster.src}
                  className={`aspect-[3/4] overflow-hidden cursor-pointer transition-all ${
                    selectedPosterIndex === idx
                      ? "opacity-100"
                      : "opacity-55 hover:opacity-80"
                  }`}
                  onClick={() => selectPoster(idx)}
                >
                  <Image
                    src={poster.thumbnailSrc ?? poster.src}
                    alt={`archive-${idx}`}
                    width={96}
                    height={128}
                    className="object-cover h-full w-full"
                  />
                </button>
              ))}

            </div>
          </div>
          <a
            href={selectedPoster.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-auto block max-w-full truncate pt-8 font-mono text-[11px] leading-none text-[#f6f7fd]/72 transition-opacity hover:opacity-85"
          >
            {selectedPoster.sourceUrl}
          </a>
        </div>
      </aside>

      <section className="relative z-10 order-2 flex flex-1 flex-col items-center justify-start bg-transparent px-8 pb-20 pt-12 md:justify-center md:px-6 md:pb-20 md:pt-12">
        <BlueprintGridField />

        <div
          className="relative z-10 w-full max-w-[700px] aspect-[3/4] overflow-visible md:max-w-[min(720px,calc((100vh-132px)*0.75))]"
          onPointerDown={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = Math.min(
              100,
              Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100),
            );
            const y = Math.min(
              100,
              Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100),
            );

            setSelectedElement((element) => ({
              ...element,
              x: `${x.toFixed(1)}%`,
              y: `${y.toFixed(1)}%`,
            }));
          }}
        >
          <div className="absolute inset-0 z-10 overflow-visible">
            {!isSvgBlueprint && (
              <CrosshairColorReveal
                src={selectedPoster.src}
                target={selectedElement}
              />
            )}
            {isSvgBlueprint ? (
              <Image
                src={selectedPoster.src}
                alt={`${selectedPoster.artist} blueprint`}
                fill
                className="pointer-events-none scale-[1.08] object-contain"
                priority
              />
            ) : (
              <BlueprintCanvas src={selectedPoster.src} />
            )}
            <MovingCrosshair
              target={selectedElement}
              onMove={(x, y) =>
                setSelectedElement((element) => ({ ...element, x, y }))
              }
            />
            <PosterCallouts
              elements={selectedPoster.elements}
              selectedElement={selectedElement}
              onSelect={selectElement}
            />
          </div>
        </div>
      </section>

      <aside className="relative z-10 order-3 flex w-full flex-col justify-start gap-0 bg-transparent p-8 md:h-screen md:w-[300px] md:overflow-hidden md:px-0 md:py-6">
        <ElementZoomPreview
          src={selectedPoster.thumbnailSrc ?? selectedPoster.src}
          target={selectedElement}
          zoom={zoomLevel}
          onZoomIn={() => setZoomLevel((zoom) => Math.min(6, zoom + 1))}
          onZoomOut={() => setZoomLevel((zoom) => Math.max(1, zoom - 1))}
        />

        <div
          ref={notesPanelRef}
          className="min-h-0 flex-1 overflow-y-auto px-0 pb-0 md:px-6"
        >
          {analysisError ? (
            <p className="mt-6 text-[14px] leading-relaxed text-[#f6f7fd]/75">
              {analysisError}. Image analysis is currently unavailable.
            </p>
          ) : null}

          {selectedElement.details ? (
            <>
              <p className="mt-6 text-[14px] leading-relaxed text-[#f6f7fd]">
                {selectedElement.details.description}
              </p>

              <CodeSampleTabs
                key={selectedElement.id}
                selectedElement={selectedElement}
                copiedSample={copiedSample}
                onCopy={copyCodeSample}
              />
            </>
          ) : (
            <p className="mt-6 text-[14px] leading-relaxed text-[#f6f7fd]/70">
              No construction notes for this selected feature yet.
            </p>
          )}
        </div>
      </aside>

    </main>
  );
}

function BlueprintGridField() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 hidden opacity-[0.3] md:block"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 16%, black 84%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 16%, black 84%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)",
        }}
      >
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(116,178,196,0.52)_1px,transparent_1px),linear-gradient(90deg,rgba(116,178,196,0.46)_1px,transparent_1px)] [background-size:120px_120px,120px_120px]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(116,178,196,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(116,178,196,0.26)_1px,transparent_1px)] [background-size:24px_24px,24px_24px]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(116,178,196,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(116,178,196,0.18)_1px,transparent_1px)] [background-position:12px_12px,12px_12px] [background-size:24px_24px,24px_24px]" />
      </div>
    </div>
  );
}

function CodeSampleTabs({
  selectedElement,
  copiedSample,
  onCopy,
}: {
  selectedElement: DetectedElement;
  copiedSample: string | null;
  onCopy: (sample: string, id: string) => void;
}) {
  const samples = selectedElement.details?.samples ?? [];
  const [activeSampleId, setActiveSampleId] = useState(samples[0]?.sampleId);
  const activeSample =
    samples.find((sample) => sample.sampleId === activeSampleId) ?? samples[0];

  if (!activeSample) return null;

  return (
    <div className="mt-6">
      {samples.length > 1 && (
        <div className="flex flex-wrap items-center gap-4 px-0 pb-2 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.08em]">
          {samples.map((sample) => (
            <button
              key={sample.sampleId}
              className={`bg-transparent transition-opacity ${
                activeSample.sampleId === sample.sampleId
                  ? "text-[#f6f7fd] opacity-100"
                  : "text-[#f6f7fd]/52 opacity-80 hover:opacity-100"
              }`}
              onClick={() => setActiveSampleId(sample.sampleId)}
            >
              {sample.title}
            </button>
          ))}
        </div>
      )}

      <CodeSamplePanel
        sample={codeSamples[activeSample.sampleId]}
        copyId={activeSample.sampleId}
        copiedSample={copiedSample}
        onCopy={onCopy}
        tall={activeSample.tall}
      />
    </div>
  );
}

function CodeSamplePanel({
  sample,
  copyId,
  copiedSample,
  onCopy,
  tall = false,
}: {
  sample: string;
  copyId: string;
  copiedSample: string | null;
  onCopy: (sample: string, id: string) => void;
  tall?: boolean;
}) {
  const isCopied = copiedSample === copyId;
  const codePadding = "py-3 pl-0 pr-20 pb-8";
  const copyButtonClass =
    "bg-transparent font-mono text-[12px] uppercase leading-none tracking-[0.1em] text-[#f6f7fd]/58 transition-opacity hover:opacity-75";

  return (
    <div className="mt-6 overflow-hidden bg-transparent">
      <div className="relative">
        <button
          className={`absolute right-0 top-3 z-10 ${copyButtonClass}`}
          onClick={() => onCopy(sample, copyId)}
        >
          {isCopied ? "Copied" : "Copy"}
        </button>
        <pre
          className={`overflow-auto ${codePadding} text-[12px] leading-relaxed text-[#f6f7fd] ${
            tall ? "max-h-[min(520px,calc(100vh-390px))]" : "max-h-[360px]"
          }`}
        >
          <code>{highlightCode(sample)}</code>
        </pre>
      </div>
    </div>
  );
}

function highlightCode(source: string) {
  const isMarkup = /<\/?[a-z][\s\S]*>/i.test(source);

  return source.split("\n").flatMap((line, lineIndex, lines) => {
    const tokens = isMarkup ? highlightMarkupLine(line) : highlightCodeLine(line);
    return lineIndex === lines.length - 1 ? tokens : [...tokens, "\n"];
  });
}

function highlightMarkupLine(line: string) {
  const segments = line.split(/(<!--[\s\S]*?-->|<\/?[^>]+>)/g);

  return segments.flatMap((segment, index) => {
    if (!segment) return [];

    if (segment.startsWith("<!--")) {
      return token(segment, "text-[#73787a]", index);
    }

    if (segment.startsWith("<")) {
      return segment
        .split(/("[^"]*"|'[^']*'|[=/<>]|\s+)/g)
        .filter(Boolean)
        .map((part, partIndex) => {
          const key = `${index}-${partIndex}`;

          if (/^["']/.test(part)) return token(part, "text-[#c8b483]", key);
          if (/^[=/<>]$/.test(part)) return token(part, "text-[#f6f7fd]/75", key);
          if (/^\s+$/.test(part)) return part;
          if (/^!DOCTYPE$/i.test(part) || /^\/?[a-z]/i.test(part)) {
            return token(part, "text-[#8ab0c6]", key);
          }

          return token(part, "text-[#b997c5]", key);
        });
    }

    return token(segment, "text-[#f6f7fd]", index);
  });
}

function highlightCodeLine(line: string) {
  return line
    .split(
      /(\/\/.*|\/\*.*?\*\/|`[^`]*`|"[^"]*"|'[^']*'|\b(?:const|let|function|return|if|else|for|while|float|void|vec[234]|int|bool|true|false|in|out)\b|\b\d+(?:\.\d+)?\b)/g,
    )
    .filter(Boolean)
    .map((part, index) => {
      if (/^\/\//.test(part) || /^\/\*/.test(part)) {
        return token(part, "text-[#73787a]", index);
      }

      if (/^["'`]/.test(part)) return token(part, "text-[#c8b483]", index);
      if (/^\d/.test(part)) return token(part, "text-[#d0a176]", index);

      if (
        /^(const|let|function|return|if|else|for|while|float|void|vec[234]|int|bool|true|false|in|out)$/.test(
          part,
        )
      ) {
        return token(part, "text-[#8ab0c6]", index);
      }

      return token(part, "text-[#f6f7fd]", index);
    });
}

function token(content: string, className: string, key: string | number) {
  return (
    <span className={className} key={key}>
      {content}
    </span>
  );
}
