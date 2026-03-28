"use client";

import React, { useEffect, useState } from "react";

export default function ClientSketch(props) {
  const [Sketch, setSketch] = useState(null);

  useEffect(() => {
    let isMounted = true;

    import("react-p5").then((mod) => {
      if (isMounted) {
        setSketch(() => mod.default);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!Sketch) {
    return <div style={{ width: "100vw", height: "100vh", background: "#E33003" }} />;
  }

  return <Sketch {...props} />;
}
