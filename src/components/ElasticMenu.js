"use client";

import React from "react";

function springValues(y) {
  return [
    `M 30,${y} Q 50,${y} 70,${y}`,
    `M 30,${y} Q 50,${y + 10} 70,${y}`,
    `M 30,${y} Q 50,${y - 5} 70,${y}`,
    `M 30,${y} Q 50,${y + 5} 70,${y}`,
    `M 30,${y} Q 50,${y - 2} 70,${y}`,
    `M 30,${y} Q 50,${y + 2} 70,${y}`,
    `M 30,${y} Q 50,${y - 1} 70,${y}`,
    `M 30,${y} Q 50,${y + 1} 70,${y}`,
    `M 30,${y} Q 50,${y} 70,${y}`,
    `M 30,${y} Q 60,${y} 70,${y}`,
    `M 30,${y} Q 40,${y} 70,${y}`,
    `M 30,${y} Q 60,${y} 70,${y}`,
    `M 30,${y} Q 40,${y} 70,${y}`,
    `M 30,${y} Q 50,${y} 70,${y}`,
    `M 30,${y} Q 50,${y} 70,${y}`,
    `M 30,${y} Q 50,${y} 70,${y}`,
  ].join(";");
}

function SpringLine({ y, delay, position, isOpen }) {
  const values = springValues(y);
  const className = `elastic-line elastic-line-${position}${isOpen ? " is-open" : ""}`;

  return (
    <g className={className}>
      <path
        d={`M 30,${y} Q 50,${y} 70,${y}`}
        className="elastic-line__base"
        fill="none"
      >
        <animate attributeName="d" dur="4.5s" begin={delay} repeatCount="indefinite" values={values} />
      </path>
    </g>
  );
}

export default function ElasticMenu({ className, style, isOpen = false, onClick }) {
  const stopEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <button
      type="button"
      data-grid-glass
      onPointerDown={stopEvent}
      onMouseDown={stopEvent}
      onTouchStart={stopEvent}
      onClick={(event) => {
        stopEvent(event);
        onClick?.(event);
      }}
      className={className ? `elastic-menu-button ${className}` : "elastic-menu-button"}
      style={style}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <svg viewBox="25 25 50 50" width="100%" height="100%" aria-hidden="true">
        {isOpen ? (
          <g className="elastic-menu-close-x">
            <path d="M 35,35 L 65,65" />
            <path d="M 65,35 L 35,65" />
          </g>
        ) : (
          <>
            <SpringLine y={35} delay="1s" position="top" />
            <SpringLine y={50} delay="1.1s" position="middle" />
            <SpringLine y={65} delay="1.2s" position="bottom" />
          </>
        )}
      </svg>
    </button>
  );
}
