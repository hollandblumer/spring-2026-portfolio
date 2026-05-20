"use client";

import React from "react";
import type { DetectedElement } from "@/lib/posters";

export function PosterCallouts({
  elements,
  selectedElement,
  onSelect,
}: {
  elements: DetectedElement[];
  selectedElement: DetectedElement;
  onSelect: (element: DetectedElement) => void;
}) {
  const calloutElements = elements.filter((element) => element.details);

  if (calloutElements.length === 0) return null;

  return (
    <div className="poster-callouts pointer-events-none absolute inset-0 z-20 hidden xl:block">
      {calloutElements.map((element) => {
        const isSelected = selectedElement.id === element.id;
        const side = "right";
        const y = Number.parseFloat(element.y);
        const calloutY =
          element.id === "edge-map" ? Math.max(8, y - 18) : Math.min(92, y + 18);
        const connectorTop = `${Math.min(y, calloutY)}%`;
        const connectorHeight = `${Math.abs(y - calloutY)}%`;
        const pointY = y <= calloutY ? "0%" : "100%";
        const landingY = y <= calloutY ? "100%" : "0%";
        const calloutTop = `${calloutY}%`;
        const number = calloutElements.findIndex((item) => item.id === element.id) + 1;

        return (
          <React.Fragment key={element.id}>
            <svg
              className="absolute overflow-visible"
              style={
                side === "right"
                  ? {
                      left: element.x,
                      top: connectorTop,
                      width: `calc(100% - ${element.x} + 70px)`,
                      height: connectorHeight,
                    }
                  : {
                      left: "-70px",
                      top: connectorTop,
                      width: `calc(${element.x} + 70px)`,
                      height: connectorHeight,
                    }
              }
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <line
                x1={side === "right" ? "0%" : "100%"}
                y1={pointY}
                x2={side === "right" ? "calc(100% - 34px)" : "34px"}
                y2={landingY}
                stroke={
                  isSelected
                    ? "rgba(116,178,196,0.96)"
                    : "rgba(116,178,196,0.76)"
                }
                strokeWidth="1.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={side === "right" ? "calc(100% - 34px)" : "34px"}
                y1={landingY}
                x2={side === "right" ? "100%" : "0%"}
                y2={landingY}
                stroke={
                  isSelected
                    ? "rgba(116,178,196,0.96)"
                    : "rgba(116,178,196,0.76)"
                }
                strokeWidth="1.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <button
              className={`pointer-events-auto absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0f2f3] bg-[#f7f8f8] shadow-[0_0_10px_rgba(233,238,244,0.34)] transition-opacity duration-200 ${
                isSelected ? "opacity-100" : "opacity-85 hover:opacity-100"
              }`}
              style={{ left: element.x, top: element.y }}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(element);
              }}
              aria-label={`Select ${element.label}`}
            />
            <button
              className={`pointer-events-auto absolute left-[calc(100%+78px)] -translate-y-1/2 bg-transparent text-left font-mono text-[18px] font-semibold uppercase leading-none text-[#f6f7fd] transition-opacity duration-200 ${
                isSelected ? "opacity-100" : "opacity-68 hover:opacity-100"
              }`}
              style={{ top: calloutTop }}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(element);
              }}
            >
              {number}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
