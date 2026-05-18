import type { Poster } from "@/lib/posters";

export function PosterMetadataDimension({ poster }: { poster: Poster }) {
  return (
    <div className="absolute bottom-[-56px] left-0 grid h-10 w-full grid-cols-[auto_minmax(24px,1fr)_auto_minmax(24px,1fr)_auto] items-center font-mono text-[12px] font-semibold tracking-normal text-[#f6f7fd]/85">
      <span className="whitespace-nowrap italic leading-none">
        {poster.artist}
      </span>
      <span className="mx-1 h-0.5 bg-[#618ac0]/65 sm:mx-2" />
      <span className="whitespace-nowrap italic leading-none">{poster.year}</span>
      <span className="mx-1 h-0.5 bg-[#618ac0]/65 sm:mx-2" />
      <span className="whitespace-nowrap text-right italic leading-none">
        <a
          href={poster.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto transition-opacity hover:opacity-80"
        >
          Image Source
        </a>
      </span>
    </div>
  );
}
