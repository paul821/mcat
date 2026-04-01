"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

// Convert plain-text math notation to KaTeX-rendered HTML
// Handles: Greek letters, superscripts, subscripts, scientific notation, common bio/chem terms

const GREEK_MAP: Record<string, string> = {
  alpha: "\\alpha",
  beta: "\\beta",
  gamma: "\\gamma",
  delta: "\\delta",
  epsilon: "\\epsilon",
  theta: "\\theta",
  lambda: "\\lambda",
  mu: "\\mu",
  sigma: "\\sigma",
  omega: "\\omega",
  pi: "\\pi",
  phi: "\\phi",
  psi: "\\psi",
  tau: "\\tau",
  rho: "\\rho",
  eta: "\\eta",
  kappa: "\\kappa",
  nu: "\\nu",
  chi: "\\chi",
  Delta: "\\Delta",
  Omega: "\\Omega",
  Sigma: "\\Sigma",
  Pi: "\\Pi",
  Phi: "\\Phi",
  Psi: "\\Psi",
  Gamma: "\\Gamma",
  Lambda: "\\Lambda",
  Theta: "\\Theta",
};

function renderKatex(latex: string): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
    });
  } catch {
    return latex;
  }
}

function processText(text: string): string {
  let result = text;

  // Handle explicit LaTeX delimiters if any: $...$
  result = result.replace(/\$([^$]+)\$/g, (_, expr) => {
    return renderKatex(expr);
  });

  // Scientific notation: 1.5 x 10^-3, 10^6, etc.
  result = result.replace(
    /(\d+\.?\d*)\s*[x×]\s*10\^([{(]?)(-?\d+)[})]?/g,
    (_, coeff, _br, exp) => {
      return renderKatex(`${coeff} \\times 10^{${exp}}`);
    }
  );
  result = result.replace(
    /10\^([{(]?)(-?\d+)[})]?/g,
    (_, _br, exp) => {
      return renderKatex(`10^{${exp}}`);
    }
  );

  // Superscripts: m/s^2, cm^3, x^2, etc. (but not inside already-rendered katex)
  result = result.replace(
    /(?<![a-zA-Z]|aria-)(\w+)\^([{(]?)(-?[\w.+\-]+)[})]?/g,
    (match, base, _br, exp) => {
      if (match.includes("katex") || match.includes("class=")) return match;
      return renderKatex(`\\text{${base}}^{${exp}}`);
    }
  );

  // Subscripts: v_0, F_net, V_max, K_m, etc.
  result = result.replace(
    /(\w+)_([{(]?)([\w.+\-]+)[})]?/g,
    (match, base, _br, sub) => {
      if (match.includes("katex") || match.includes("class=")) return match;
      // Common terms where subscript is part of the name
      return renderKatex(`\\text{${base}}_{\\text{${sub}}}`);
    }
  );

  // Greek letters as standalone words: "theta", "omega", etc.
  for (const [word, latex] of Object.entries(GREEK_MAP)) {
    // Match as whole word, not inside HTML tags
    const regex = new RegExp(`(?<![a-zA-Z/="])\\b${word}\\b(?![a-zA-Z"=>])`, "g");
    result = result.replace(regex, (match) => {
      // Don't replace inside HTML attributes
      return renderKatex(latex);
    });
  }

  // Common unit prefixes with Greek letters: uA → μA, uF → μF, etc.
  result = result.replace(/\b(\d+\.?\d*)\s*uA\b/g, (_, num) => `${num} ${renderKatex("\\mu\\text{A}")}`);
  result = result.replace(/\b(\d+\.?\d*)\s*uF\b/g, (_, num) => `${num} ${renderKatex("\\mu\\text{F}")}`);
  result = result.replace(/\b(\d+\.?\d*)\s*um\b/g, (_, num) => `${num} ${renderKatex("\\mu\\text{m}")}`);
  result = result.replace(/\b(\d+\.?\d*)\s*uL\b/g, (_, num) => `${num} ${renderKatex("\\mu\\text{L}")}`);
  result = result.replace(/\b(\d+\.?\d*)\s*uM\b/g, (_, num) => `${num} ${renderKatex("\\mu\\text{M}")}`);
  result = result.replace(/\buA\b/g, renderKatex("\\mu\\text{A}"));
  result = result.replace(/\buF\b/g, renderKatex("\\mu\\text{F}"));
  result = result.replace(/\bum\b/g, renderKatex("\\mu\\text{m}"));
  result = result.replace(/\buL\b/g, renderKatex("\\mu\\text{L}"));
  result = result.replace(/\buM\b/g, renderKatex("\\mu\\text{M}"));

  // Ohm symbol
  result = result.replace(/\b(\d+\.?\d*)\s*ohms?\b/gi, (_, num) => `${num} ${renderKatex("\\Omega")}`);

  // Degree symbol: "20 degrees" → "20°"
  result = result.replace(/\b(\d+\.?\d*)\s*degrees?\b/gi, (_, num) => `${num}${renderKatex("^{\\circ}")}`);

  // Common chemistry/bio terms that look better rendered
  result = result.replace(/\bpKa\b/g, renderKatex("\\text{p}K_a"));
  result = result.replace(/\bpKb\b/g, renderKatex("\\text{p}K_b"));
  result = result.replace(/\bpH\b/g, renderKatex("\\text{pH}"));
  result = result.replace(/\bKa\b(?!tex)/g, renderKatex("K_a"));
  result = result.replace(/\bKb\b/g, renderKatex("K_b"));
  result = result.replace(/\bKsp\b/g, renderKatex("K_{sp}"));
  result = result.replace(/\bKw\b/g, renderKatex("K_w"));
  result = result.replace(/\bVmax\b/g, renderKatex("V_{\\text{max}}"));
  result = result.replace(/\bKm\b/g, renderKatex("K_m"));
  result = result.replace(/\bDelta G\b/g, renderKatex("\\Delta G"));
  result = result.replace(/\bDelta H\b/g, renderKatex("\\Delta H"));
  result = result.replace(/\bDelta S\b/g, renderKatex("\\Delta S"));
  result = result.replace(/\bDelta T\b/g, renderKatex("\\Delta T"));

  return result;
}

export default function MathText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const html = processText(text);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// For rendering a full block of text (passages, explanations) with math
export function MathBlock({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const html = processText(text);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
