"use client";

import { useEffect, useState } from "react";
import { MicroGrain } from "@/components/blueprint/MicroGrain";

export function CrosshairPreloader() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 3200;
    const startedAt = performance.now();
    let frame = 0;
    let exitTimer = 0;

    function tick(now: number) {
      const nextProgress = Math.min(100, ((now - startedAt) / duration) * 100);
      setProgress(Math.round(nextProgress));

      if (nextProgress < 100) {
        frame = window.requestAnimationFrame(tick);
      } else {
        exitTimer = window.setTimeout(() => setIsVisible(false), 520);
      }
    }

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(exitTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[var(--blueprint-paper)] text-[#f6f7fd] transition-opacity duration-500 ${
        progress >= 100 ? "opacity-0" : "opacity-100"
      }`}
    >
      <MicroGrain className="z-0 opacity-20" />

      <div className="preloader-frame relative z-10 h-[340px] w-[340px]">
        <div className="preloader-viewport absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="preloader-focal absolute inset-0 flex items-center justify-center">
            <div className="preloader-line-y preloader-line-top absolute bottom-[calc(50%+34px)] left-1/2 h-[1000px] w-px -translate-x-1/2 bg-[#74b2c4]/76 shadow-[0_0_8px_rgba(116,178,196,0.18)]" />
            <div className="preloader-line-y preloader-line-bottom absolute left-1/2 top-[calc(50%+34px)] h-[1000px] w-px -translate-x-1/2 bg-[#74b2c4]/76 shadow-[0_0_8px_rgba(116,178,196,0.18)]" />
            <div className="preloader-line-x preloader-line-left absolute right-[calc(50%+34px)] top-1/2 h-px w-[1000px] -translate-y-1/2 bg-[#74b2c4]/76 shadow-[0_0_8px_rgba(116,178,196,0.18)]" />
            <div className="preloader-line-x preloader-line-right absolute left-[calc(50%+34px)] top-1/2 h-px w-[1000px] -translate-y-1/2 bg-[#74b2c4]/76 shadow-[0_0_8px_rgba(116,178,196,0.18)]" />

            <div className="preloader-scope relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#74b2c4]/88 bg-transparent font-mono text-[12px] font-semibold leading-none text-[#f6f7fd] shadow-[inset_0_0_0_1px_rgba(27,28,33,0.9),0_0_14px_rgba(116,178,196,0.22)]">
              {progress}%
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .preloader-scope {
          animation: preloader-draw-circle 620ms ease-out 260ms both;
        }

        .preloader-line-y,
        .preloader-line-x {
          animation: preloader-expand-line 760ms ease-out 980ms forwards;
        }

        .preloader-line-y {
          transform: translateX(-50%) scaleY(0);
        }

        .preloader-line-x {
          transform: translateY(-50%) scaleX(0);
        }

        .preloader-line-top {
          transform-origin: bottom center;
        }

        .preloader-line-bottom {
          transform-origin: top center;
        }

        .preloader-line-left {
          transform-origin: right center;
        }

        .preloader-line-right {
          transform-origin: left center;
        }

        .preloader-focal {
          animation: preloader-slide-focal 5s cubic-bezier(0.45, 0, 0.55, 1)
            1.72s infinite;
        }

        @keyframes preloader-draw-circle {
          0% {
            border-color: rgba(116, 178, 196, 0);
            box-shadow: none;
          }
          100% {
            border-color: rgba(116, 178, 196, 0.9);
            box-shadow: 0 0 18px rgba(116, 178, 196, 0.18);
          }
        }

        @keyframes preloader-expand-line {
          100% {
            transform: translateX(-50%) scaleY(1);
          }
        }

        .preloader-line-x,
        .preloader-line-left,
        .preloader-line-right {
          animation-name: preloader-expand-line-x;
        }

        @keyframes preloader-expand-line-x {
          100% {
            transform: translateY(-50%) scaleX(1);
          }
        }

        @keyframes preloader-slide-focal {
          0% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(110px, -86px);
          }
          50% {
            transform: translate(-96px, 104px);
          }
          75% {
            transform: translate(88px, 112px);
          }
          100% {
            transform: translate(0, 0);
          }
        }

      `}</style>
    </div>
  );
}
