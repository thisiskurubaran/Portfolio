"use client";

import dynamic from "next/dynamic";
import { ShipLabels } from "@/ui/ShipLabels";

// three and R3F stay out of the server render and the first JS chunk.
const Experience = dynamic(() => import("./Experience"), { ssr: false });

export function SceneLoader() {
  return (
    <div className="scene">
      <Experience />
      <ShipLabels />
    </div>
  );
}
