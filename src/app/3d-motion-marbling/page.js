import Link from "next/link";

export const metadata = {
  title: "3D Motion Marbling | Holland Blumer",
  description:
    "A webcam-driven MANO hand experiment for pulling color through a digital marbling bath.",
};

export default function ThreeDMotionMarblingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4ecd2] text-[#f4ecd2]">
      <iframe
        src="/3d-motion-marbling/finger_marble_mano.html"
        title="3D Motion Marbling"
        className="absolute inset-0 h-full w-full border-0"
        allow="camera; fullscreen"
      />

      <div className="pointer-events-none fixed left-4 right-4 top-4 z-40 flex items-center justify-between gap-4 sm:left-5 sm:right-5">
        <Link
          href="/"
          className="pointer-events-auto rounded-full border border-[rgba(255,255,255,0.28)] bg-[rgba(37,40,21,0.46)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#fff8e9] backdrop-blur-md transition hover:bg-[rgba(37,40,21,0.68)]"
        >
          Back
        </Link>
        <h1 className="max-w-[15rem] text-right text-xs font-bold uppercase tracking-[0.2em] text-[#fff8e9] drop-shadow-[0_2px_10px_rgba(37,40,21,0.5)] sm:max-w-none">
          3D Motion Marbling
        </h1>
      </div>
    </main>
  );
}
