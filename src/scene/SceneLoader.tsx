"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { useSceneStore } from "@/state/store";

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

  useEffect(() => {
    const store = useSceneStore.getState();
    if (!webgl) store.offerPlain("no-webgl");
    else if ((navigator.hardwareConcurrency ?? 8) <= 2) store.offerPlain("slow");
  }, [webgl]);

  return <div className="scene">{webgl && <Experience />}</div>;
}
