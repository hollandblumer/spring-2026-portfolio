export const metadata = {
  title: "3D Motion Marbling | Holland Blumer",
  description:
    "A webcam-driven MANO hand experiment for pulling color through a digital marbling bath.",
};

export default function ThreeDMotionMarblingPage() {
  return (
    <main className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#f4ecd2] text-[#f4ecd2]">
      <iframe
        src="/3d-motion-marbling/finger_marble_mano.html?v=x-flip&api=https%3A%2F%2Fspring-2026-portfolio.onrender.com&fit=1"
        title="3D Motion Marbling"
        className="fixed inset-0 h-dvh w-screen border-0"
        allow="camera; fullscreen"
      />
    </main>
  );
}
