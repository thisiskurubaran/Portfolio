"use client";

import { useEffect, useRef, useState } from "react";
import { evaluate, formatNumber } from "@/os/system/calc";

const BASIC = ["C", "(", ")", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "⌫", "="];
const SCIENTIFIC = ["sin(", "cos(", "tan(", "sqrt(", "ln(", "log(", "^", "π"];

// F24: basic and scientific modes, typed or clicked. Uses its own parser, never eval.
export default function Calculator() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [scientific, setScientific] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const preview = expr ? evaluate(expr) : null;

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  const press = (key: string) => {
    if (key === "C") {
      setExpr("");
      setResult(null);
    } else if (key === "⌫") setExpr((e) => e.slice(0, -1));
    else if (key === "=") {
      const v = evaluate(expr);
      if (v === null) setResult("Not a valid sum");
      else {
        setResult(formatNumber(v));
        setExpr(formatNumber(v));
      }
    } else {
      setResult(null);
      setExpr((e) => (e + key).slice(0, 120));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, string> = { Enter: "=", "=": "=", Backspace: "⌫", Escape: "C", "*": "×", "/": "÷" };
    const key = map[e.key] ?? (/^[0-9+\-().^%]$/.test(e.key) ? e.key : null);
    if (key) {
      e.preventDefault();
      press(key);
    }
  };

  return (
    <div ref={ref} tabIndex={0} onKeyDown={onKeyDown} className="mx-auto flex h-full max-w-sm flex-col gap-3 p-5 outline-none">
      <div className="rounded-card border border-line bg-raised p-4 text-right shadow-1" aria-live="polite">
        <p className="min-h-5 break-all text-sm text-muted">{expr || "0"}</p>
        <p className="mt-1 break-all font-display text-4xl font-semibold tabular-nums">{result ?? (preview !== null ? formatNumber(preview) : expr ? "…" : "0")}</p>
      </div>
      <button onClick={() => setScientific((s) => !s)} aria-pressed={scientific} className="self-start rounded-full bg-glass px-3 py-1 text-xs font-medium ring-1 ring-line">
        {scientific ? "Basic" : "Scientific"}
      </button>
      {scientific && (
        <div className="grid grid-cols-4 gap-2">
          {SCIENTIFIC.map((k) => (
            <button key={k} onClick={() => press(k)} className="rounded-control bg-glass py-2 text-sm hover:bg-glass-strong">
              {k.replace("(", "")}
            </button>
          ))}
        </div>
      )}
      <div className="grid flex-1 grid-cols-4 gap-2">
        {BASIC.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            aria-label={k === "⌫" ? "Delete" : k === "C" ? "Clear" : k}
            className={`min-h-12 rounded-control text-lg font-medium transition-colors ${
              k === "=" ? "bg-accent text-on-accent hover:brightness-110" : "+-×÷".includes(k) ? "bg-accent/15 text-accent-fg hover:bg-accent/25" : "bg-raised ring-1 ring-line hover:bg-glass-strong"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-subtle">Type sums too. Trig functions use degrees.</p>
    </div>
  );
}
