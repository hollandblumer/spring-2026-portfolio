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
    </main>
  );
}
