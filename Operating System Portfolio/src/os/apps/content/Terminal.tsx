"use client";

import { useEffect, useRef, useState } from "react";
import { complete, runCommand } from "@/os/apps/terminal/commands";

interface Line {
  id: number;
  text: string;
  input?: boolean;
}

const PROMPT = "guest@kbos ~ %";

// F21: a working shell. Commands route to real apps and real content.
export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([{ id: 0, text: 'kbOS terminal. Type "help" to see what it can do.' }]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const nextId = useRef(1);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const submit = () => {
    const command = value;
    setValue("");
    setCursor(null);
    let cleared = false;
    const output = runCommand(command, { history, clear: () => (cleared = true) });
    const add = (text: string, isInput = false) => ({ id: nextId.current++, text, input: isInput });
    if (command.trim()) setHistory((h) => [...h, command]);
    setLines((prev) => (cleared ? [] : [...prev, add(command, true), ...output.map((t) => add(t))]));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
    else if (e.key === "Tab") {
      e.preventDefault();
      setValue((v) => complete(v));
    } else if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setValue(history[next]!);
    } else if (e.key === "ArrowDown" && cursor !== null) {
      e.preventDefault();
      const next = cursor + 1;
      setCursor(next >= history.length ? null : next);
      setValue(next >= history.length ? "" : history[next]!);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      className="min-h-full bg-[#0b0d10] p-4 font-mono text-[13px] leading-relaxed text-[#d7f5ec]"
      onClick={() => input.current?.focus()}
    >
      <div role="log" aria-live="polite" aria-label="Terminal output">
        {lines.map((line) => (
          <pre key={line.id} className="whitespace-pre-wrap break-words">
            {line.input ? (
              <>
                <span className="text-[#4cc2a8]">{PROMPT}</span> {line.text}
              </>
            ) : (
              line.text || " "
            )}
          </pre>
        ))}
      </div>
      <div className="flex gap-2" ref={end}>
        <label htmlFor="kb-terminal-input" className="shrink-0 text-[#4cc2a8]">
          {PROMPT}
        </label>
        <input
          id="kb-terminal-input"
          ref={input}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
      </div>
    </div>
  );
}
