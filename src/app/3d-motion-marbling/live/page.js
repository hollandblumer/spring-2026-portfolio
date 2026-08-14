export const metadata = {
  title: "Live 3D Motion Marbling | Holland Blumer",
  description:
    "Backend-powered MANO hand tracking mode for the 3D Motion Marbling experiment.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LiveThreeDMotionMarblingPage() {
  return (
    <main className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#f4ecd2] text-[#f4ecd2]">
      <iframe
        src="/3d-motion-marbling/finger_marble_mano.html?v=live-backend&api=https%3A%2F%2Fspring-2026-portfolio.onrender.com&fit=1"
        title="Live 3D Motion Marbling"
        className="fixed inset-0 h-dvh w-screen border-0"
        allow="camera; fullscreen"
      />
    </main>
  );
}
