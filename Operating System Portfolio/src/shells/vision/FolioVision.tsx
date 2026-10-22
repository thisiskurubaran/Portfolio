"use client";

import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/design/AppIcon";
import { launchable } from "@/os/apps/registry";
import { formatTime, useClock } from "@/os/system/clock";
import { registerLauncher } from "@/os/system/launcher";
import { useReducedMotion } from "@/os/system/useSystemAttributes";
import { Spotlight } from "@/shells/shared/Spotlight";
import { useVision } from "./state";
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

// The room: soft drifting motes at different depths behind the panels.
function Room({ reduced }: { reduced: boolean }) {
  return (
    <>
      <Parallax reduced={reduced} />
      <Sparkles count={140} scale={[18, 10, 12]} position={[0, 0, -4]} size={3} speed={reduced ? 0 : 0.25} opacity={0.5} color="#bfe9df" />
      <Sparkles count={60} scale={[22, 12, 6]} position={[0, 0, -9]} size={6} speed={reduced ? 0 : 0.15} opacity={0.25} color="#a99cf5" />
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

function Ornament({ onSearch }: { onSearch: () => void }) {
  const { open, openApp, focused } = useVision();
  return (
    <nav aria-label="Apps" className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-2xl">
      {launchable.map((app) => (
        <button
          key={app.id}
          onClick={() => openApp(app.id)}
          aria-label={app.name}
          title={app.name}
          className={`relative flex flex-col items-center rounded-xl p-0.5 transition-transform hover:-translate-y-1 ${focused === app.id ? "-translate-y-1" : ""}`}
        >
          <AppIcon id={app.id} icon={app.icon} size={38} />
          {open.includes(app.id) && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-white" />}
        </button>
      ))}
      <button onClick={onSearch} aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/20">
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" strokeLinecap="round" />
        </svg>
      </button>
    </nav>
  );
}

// folioVision: a browser homage to spatial computing. Floating glass windows in
// faked depth, drawn with WebGL and CSS 3D. Not real AR, and it says so.
export default function FolioVision() {
  const reduced = useReducedMotion();
  const now = useClock();
  const [search, setSearch] = useState(false);
  const open = useVision((s) => s.open);
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
      if (typing) return;
      if (e.key === "ArrowRight") useVision.getState().step(1);
      else if (e.key === "ArrowLeft") useVision.getState().step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main
      className="relative h-full w-full overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #2a3a4a 0%, #141a24 45%, #07090c 100%)" }}
    >
      <Canvas className="!absolute inset-0" camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Room reduced={reduced} />
      </Canvas>
      <div className="absolute inset-0" style={{ perspective: "1400px" }}>
        <div ref={stage} className="folio-vision-stage absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {open.map((id, i) => (
            <VisionPanel key={id} id={id} index={i} center={center} />
          ))}
        </div>
      </div>
      <p className="absolute left-4 top-3 z-10 max-w-xs text-xs leading-relaxed text-white/70">
        folioVision is a browser homage to spatial computing. The depth is faked with WebGL and CSS 3D; this is not AR.
      </p>
      <p className="absolute right-4 top-3 z-10 text-sm tabular-nums text-white/80" suppressHydrationWarning>
        {now ? formatTime(now) : ""}
      </p>
      <p className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 text-xs text-white/50">Click a panel to bring it forward. Arrow keys move between panels.</p>
      <Ornament onSearch={() => setSearch(true)} />
      {search && <Spotlight onClose={() => setSearch(false)} />}
    </main>
  );
}
