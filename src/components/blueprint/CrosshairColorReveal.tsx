import type { DetectedElement } from "@/lib/posters";

export function CrosshairColorReveal({
  src,
  target,
}: {
  src: string;
  target: DetectedElement;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 transition-all duration-200 ease-out"
      style={{
        backgroundImage: `url(${src})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
        clipPath: `circle(48px at ${target.x} ${target.y})`,
      }}
    />
  );
}
