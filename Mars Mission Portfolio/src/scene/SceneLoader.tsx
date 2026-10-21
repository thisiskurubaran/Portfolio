"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// three and R3F stay out of the server render and the first JS chunk.
const Experience = dynamic(() => import("./Experience"), { ssr: false });

let webglSupport: boolean | null = null;

function hasWebGL2(): boolean {
  if (webglSupport === null) {
    try {
      const gl = document.createElement("canvas").getContext("webgl2");
      webglSupport = !!gl;
      // Free the probe context right away; browsers cap how many can exist.
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const noSubscribe = () => () => {};

export function SceneLoader() {
  // The server cannot know, so it assumes WebGL and the client corrects it.
  const webgl = useSyncExternalStore(noSubscribe, hasWebGL2, () => true);
  return <div className="scene">{webgl && <Experience />}</div>;
}
