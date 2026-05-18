import Image from "next/image";
import type { DetectedElement } from "@/lib/posters";

export function ElementZoomPreview({
  src,
  target,
  zoom,
  onZoomIn,
  onZoomOut,
}: {
  src: string;
  target: DetectedElement;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const targetX = Number.parseFloat(target.x) * zoom;
  const targetY = Number.parseFloat(target.y) * zoom;
  const isBrowserImage = src.startsWith("blob:") || src.startsWith("data:");

  return (
    <div className="relative overflow-hidden px-0 pb-0 text-[#f6f7fd] md:px-6">
      <div className="relative z-10 mb-4 flex items-center justify-between gap-4">
        <header className="text-[18px] font-medium text-[#f6f7fd]">
          {target.label}
        </header>

        <div className="ml-auto flex items-center justify-end gap-1">
          <button
            className="flex h-7 w-4 items-center justify-center bg-transparent text-[16px] leading-none text-[#f6f7fd]/80 transition-colors hover:text-[#f6f7fd]"
            onClick={onZoomOut}
            aria-label="Zoom out"
          >
            -
          </button>
          <div className="w-10 text-center font-mono text-[12px]">
            {Math.round(zoom * 100)}%
          </div>
          <button
            className="flex h-7 w-4 items-center justify-center bg-transparent text-[16px] leading-none text-[#f6f7fd]/80 transition-colors hover:text-[#f6f7fd]"
            onClick={onZoomIn}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div className="relative z-10 aspect-square overflow-hidden">
        <div
          className="absolute z-10 aspect-[3/4] transition-all duration-700 ease-in-out"
          style={{
            width: `${zoom * 100}%`,
            left: `calc(50% - ${targetX}%)`,
            top: `calc(50% - ${targetY}%)`,
          }}
        >
          {isBrowserImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt="zoom-preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <Image
              src={src}
              alt="zoom-preview"
              fill
              className="object-contain"
              sizes="320px"
            />
          )}
        </div>
      </div>
    </div>
  );
}
