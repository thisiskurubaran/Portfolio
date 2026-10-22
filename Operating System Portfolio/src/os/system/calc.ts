// A small arithmetic parser for the Calculator and spotlight. No eval: the
// CSP forbids it, and a recursive descent parser is safer anyway.
// Grammar: expr = term (("+" | "-") term)* ; term = power (("*" | "/" | "%") power)* ;
// power = unary ("^" power)? ; unary = "-" unary | call ; call = name "(" expr ")" | number | "(" expr ")"

const FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  sin: (x) => Math.sin((x * Math.PI) / 180),
  cos: (x) => Math.cos((x * Math.PI) / 180),
  tan: (x) => Math.tan((x * Math.PI) / 180),
  ln: Math.log,
  log: Math.log10,
  abs: Math.abs,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

export function evaluate(input: string): number | null {
  const src = input.replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/\s+/g, "").toLowerCase();
  if (!src || src.length > 200 || !/^[0-9+\-*/%^().a-z]+$/.test(src)) return null;
  let i = 0;
  const peek = () => src[i];
  const eat = (ch: string) => (src[i] === ch ? (i++, true) : false);

  function primary(): number {
    if (eat("(")) {
      const v = expr();
      if (!eat(")")) throw new Error("paren");
      return v;
    }
    const name = /^[a-z]+/.exec(src.slice(i))?.[0];
    if (name) {
      i += name.length;
      if (name in CONSTS) return CONSTS[name]!;
      const fn = FUNCS[name];
      if (!fn || !eat("(")) throw new Error("name");
      const v = expr();
      if (!eat(")")) throw new Error("paren");
      return fn(v);
    }
    const num = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i))?.[0];
    if (!num) throw new Error("number");
    i += num.length;
    return Number(num);
  }
  function unary(): number {
    if (eat("-")) return -unary();
    if (eat("+")) return unary();
    return primary();
  }
  function power(): number {
    const base = unary();
    return eat("^") ? base ** power() : base;
  }
  function term(): number {
    let v = power();
    for (;;) {
      if (eat("*")) v *= power();
      else if (eat("/")) v /= power();
      else if (eat("%")) v %= power();
      else return v;
    }
  }
  function expr(): number {
    let v = term();
    for (;;) {
      if (eat("+")) v += term();
      else if (eat("-")) v -= term();
      else return v;
    }
  }

  try {
    const v = expr();
    if (peek() !== undefined || !Number.isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}

// Rounds away floating point noise like 0.1 + 0.2 = 0.30000000000000004.
export const formatNumber = (v: number) => (Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-9 && v !== 0) ? v.toExponential(6) : String(Number(v.toPrecision(12))));
