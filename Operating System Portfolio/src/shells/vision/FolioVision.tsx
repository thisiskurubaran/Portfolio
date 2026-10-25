"use client";

import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/design/AppIcon";
import { Icon } from "@/design/icons";
import { launchable, pinned } from "@/os/apps/registry";
import { formatTime, useClock } from "@/os/system/clock";
import { registerLauncher } from "@/os/system/launcher";
import { useReducedMotion } from "@/os/system/useSystemAttributes";
import { Spotlight } from "@/shells/shared/Spotlight";
import { Environment } from "./Environment";
import { useVision } from "./state";
import { VisionHome } from "./VisionHome";
import { VisionPanel } from "./VisionPanel";

// The camera leans a little toward the pointer: the parallax that sells depth.
function Parallax({ reduced }: { reduced: boolean }) {
  useFrame(({ camera, pointer }, delta) => {
    const k = 1 - Math.exp(-delta * 3);
    const tx = reduced ? 0 : pointer.x * 0.6;
    const ty = reduced ? 0 : pointer.y * 0.35;
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Dust in the evening light, drifting at different depths behind the panels.
function Room({ reduced }: { reduced: boolean }) {
  return (
    <>
      <Parallax reduced={reduced} />
      <Sparkles count={90} scale={[18, 10, 12]} position={[0, 0, -4]} size={2.5} speed={reduced ? 0 : 0.2} opacity={0.55} color="#fff4dc" />
      <Sparkles count={40} scale={[22, 12, 6]} position={[0, 0, -9]} size={5} speed={reduced ? 0 : 0.12} opacity={0.3} color="#ffe2b8" />
    </>
  );
}

// Panels tilt a few degrees toward the pointer, matching the camera drift behind them.
function usePanelParallax(reduced: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (ref.current) ref.current.style.transform = `rotateY(${px * 6}deg) rotateX(${-py * 4}deg)`;
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);
  return ref;
}

function Ornament({ onSearch, onHome }: { onSearch: () => void; onHome: () => void }) {
  const { open, openApp, focused } = useVision();
  // Pinned apps, plus any open ones, keep the bar a comfortable width.
  const shown = launchable.filter((a) => pinned.includes(a.id) || open.includes(a.id));
  return (
    <nav aria-label="Apps" className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[rgb(40_40_48/0.45)] px-2.5 py-2 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_20px_50px_-20px_rgb(10_10_30/0.6)] backdrop-blur-2xl">
      <button onClick={onHome} aria-label="Home" title="Home" className="relative flex flex-col items-center rounded-full p-0.5 transition-transform hover:-translate-y-1">
        <AppIcon id="launcher" icon="launcher" size={44} round />
      </button>
      <span aria-hidden className="mx-0.5 w-px self-stretch bg-white/20" />
      {shown.map((app) => (
        <button
          key={app.id}
          onClick={() => openApp(app.id)}
          aria-label={app.name}
          title={app.name}
          className={`relative flex flex-col items-center rounded-full p-0.5 transition-transform hover:-translate-y-1 ${focused === app.id ? "-translate-y-1" : ""}`}
        >
          <AppIcon id={app.id} icon={app.icon} size={44} round />
          {open.includes(app.id) && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-white" />}
        </button>
      ))}
      <button onClick={onSearch} aria-label="Search" className="flex h-11 w-11 items-center justify-center self-center rounded-full hover:bg-white/20">
        <Icon name="search" size={20} />
      </button>
    </nav>
  );
}

// folioVision: a browser homage to spatial computing. Floating glass windows in
// faked depth, drawn with WebGL and CSS 3D. Not real AR; the welcome tip and
// the invite say so.
export default function FolioVision() {
  const reduced = useReducedMotion();
  const now = useClock();
  const [search, setSearch] = useState(false);
  const open = useVision((s) => s.open);
  const home = useVision((s) => s.home || s.open.length === 0);
  const focused = useVision((s) => s.focused);
  const center = focused && open.includes(focused) ? open.indexOf(focused) : (open.length - 1) / 2;
  const stage = usePanelParallax(reduced);

  useEffect(() => registerLauncher((id) => useVision.getState().openApp(id)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.code === "Space" || e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearch((v) => !v);
        return;
      }
      const typing = (e.target as HTMLElement).closest("input, textarea");
      if (typing || useVision.getState().home) return;
      if (e.key === "ArrowRight") useVision.getState().step(1);
      else if (e.key === "ArrowLeft") useVision.getState().step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="folio-dark relative h-full w-full overflow-hidden bg-[#2d3550]">
      <Environment reduced={reduced} />
      <Canvas className="!absolute inset-0" camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Room reduced={reduced} />
      </Canvas>
      <div className={`absolute inset-0 transition-[filter,opacity] duration-300 ${home ? "pointer-events-none opacity-40 blur-sm" : ""}`} style={{ perspective: "1400px" }} aria-hidden={home || undefined}>
        <div ref={stage} className="folio-vision-stage absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {open.map((id, i) => (
            <VisionPanel key={id} id={id} index={i} center={center} />
          ))}
        </div>
      </div>
      <p
        className="absolute right-4 top-3 z-30 rounded-full bg-[rgb(40_40_48/0.4)] px-3 py-1 text-[13px] font-semibold tabular-nums text-white backdrop-blur-2xl"
        suppressHydrationWarning
      >
        {now ? formatTime(now) : ""}
      </p>
      {home && <VisionHome onClose={() => open.length > 0 && useVision.getState().setHome(false)} />}
      <Ornament onSearch={() => setSearch(true)} onHome={() => useVision.getState().setHome(!useVision.getState().home)} />
      {search && <Spotlight onClose={() => setSearch(false)} />}
    </main>
  );
}
