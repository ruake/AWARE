import React from "react";

interface CodeHighlightProps {
  code: string;
  language: string;
}

const C = {
  keyword:  "#c678dd",
  string:   "#98c379",
  number:   "#d19a66",
  comment:  "#5c6370",
  function: "#61afef",
  type:     "#e5c07b",
  attr:     "#56b6c2",
  operator: "#abb2bf",
  tag:      "#e06c75",
  decorator:"#56b6c2",
  property: "#56b6c2",
  selector: "#e5c07b",
  value:    "#98c379",
  flag:     "#61afef",
  command:  "#98c379",
} as const;

interface Pattern {
  regex: RegExp;
  color: string;
}

const PATTERNS: Record<string, Pattern[]> = {
  javascript: [
    { regex: /\/\/[^\n]*/g, color: C.comment },
    { regex: /\/\*[\s\S]*?\*\//g, color: C.comment },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, color: C.string },
    { regex: /\b(const|let|var|function|return|import|export|if|else|for|while|class|interface|type|async|await|yield|throw|try|catch|finally|new|this|super|extends|implements|typeof|instanceof|of|in|from|as|switch|case|default|break|continue|do|void|delete)\b/g, color: C.keyword },
    { regex: /\b([a-zA-Z_$][\w$]*)(?=\s*\()/g, color: C.function },
    { regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, color: C.type },
    { regex: /\b(\d+\.?\d*)\b/g, color: C.number },
    { regex: /(===?|!==?|&&|\|\||[+\-*/%]=?|=>|<<|>>|[<>]=?|\+\+|--|\.\.\.)/g, color: C.operator },
  ],
  typescript: [
    { regex: /\/\/[^\n]*/g, color: C.comment },
    { regex: /\/\*[\s\S]*?\*\//g, color: C.comment },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, color: C.string },
    { regex: /\b(const|let|var|function|return|import|export|if|else|for|while|class|interface|type|async|await|yield|throw|try|catch|finally|new|this|super|extends|implements|typeof|instanceof|of|in|from|as|switch|case|default|break|continue|do|void|delete|abstract|private|protected|public|readonly|static|declare|enum|namespace|module|satisfies)\b/g, color: C.keyword },
    { regex: /\b([a-zA-Z_$][\w$]*)(?=\s*\()/g, color: C.function },
    { regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, color: C.type },
    { regex: /\b(\d+\.?\d*)\b/g, color: C.number },
    { regex: /(===?|!==?|&&|\|\||[+\-*/%]=?|=>|<<|>>|[<>]=?|\+\+|--|\.\.\.|&|\|)/g, color: C.operator },
  ],
  python: [
    { regex: /#[^\n]*/g, color: C.comment },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, color: C.string },
    { regex: /\b(def|class|return|import|from|if|elif|else|for|while|try|except|with|as|print|raise|yield|lambda|pass|break|continue|in|not|and|or|is|None|True|False|async|await|finally|global|nonlocal|del|assert|self)\b/g, color: C.keyword },
    { regex: /@[a-zA-Z_][\w.]*/g, color: C.decorator },
    { regex: /\b([a-zA-Z_][\w]*)(?=\s*\()/g, color: C.function },
    { regex: /\b(\d+\.?\d*)\b/g, color: C.number },
  ],
  json: [
    { regex: /"(?:[^"\\]|\\.)*"\s*:/g, color: C.attr },
    { regex: /"(?:[^"\\]|\\.)*"/g, color: C.string },
    { regex: /\b(\d+\.?\d*)\b/g, color: C.number },
    { regex: /\b(true|false)\b/g, color: C.value },
    { regex: /\bnull\b/g, color: C.comment },
  ],
  html: [
    { regex: /<!--[\s\S]*?-->/g, color: C.comment },
    { regex: /"(?:[^"\\]|\\.)*"/g, color: C.string },
    { regex: /'(?:[^'\\]|\\.)*'/g, color: C.string },
    { regex: /<\/?([a-zA-Z][a-zA-Z0-9]*)/g, color: C.tag },
    { regex: /\b([a-zA-Z-]+)(?=\s*=\s*["'])/g, color: C.attr },
    { regex: /\b(\d+\.?\d*)\b/g, color: C.number },
  ],
  yaml: [
    { regex: /#[^\n]*/g, color: C.comment },
    { regex: /"(?:[^"\\]|\\.)*"/g, color: C.string },
    { regex: /'(?:[^'\\]|\\.)*'/g, color: C.string },
    { regex: /^([a-zA-Z_][\w-]*)(?=\s*:)/gm, color: C.attr },
    { regex: /\b(true|false|yes|no|on|off)\b/g, color: C.value },
    { regex: /\b(\d+\.?\d*)\b/g, color: C.number },
  ],
  shell: [
    { regex: /#[^\n]*/g, color: C.comment },
    { regex: /"(?:[^"\\]|\\.)*"/g, color: C.string },
    { regex: /'(?:[^'\\]|\\.)*'/g, color: C.string },
    { regex: /^(-[a-zA-Z-]+)/gm, color: C.flag },
    { regex: /^([a-zA-Z][a-zA-Z0-9_-]*)/gm, color: C.command },
    { regex: /\b(\d+\.?\d*)\b/g, color: C.number },
  ],
  css: [
    { regex: /\/\*[\s\S]*?\*\//g, color: C.comment },
    { regex: /"(?:[^"\\]|\\.)*"/g, color: C.string },
    { regex: /([a-zA-Z-]+)(?=\s*:)/g, color: C.property },
    { regex: /\.[a-zA-Z-]+/g, color: C.selector },
    { regex: /#[a-zA-Z-]+/g, color: C.selector },
    { regex: /\b([a-zA-Z][a-zA-Z]*)(?=\s*\()/g, color: C.function },
    { regex: /\b(\d+\.?\d*)(px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|pt)?\b/g, color: C.number },
  ],
};

const ALIASES: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  py: "python",
  yml: "yaml",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  jsx: "html",
  tsx: "html",
  htm: "html",
  xhtml: "html",
  text: "",
  plain: "",
  txt: "",
};

function norm(language: string): string {
  const lower = language.toLowerCase().trim();
  return ALIASES[lower] ?? lower;
}

export function highlightCode(code: string, language: string): React.ReactNode[] {
  const lang = norm(language);
  if (!lang || !PATTERNS[lang]) {
    return [<React.Fragment key="0">{code}</React.Fragment>];
  }

  const patterns = PATTERNS[lang];
  const colorMap = new Map<number, string>();

  for (const { regex, color } of patterns) {
    const re = new RegExp(regex.source, regex.flags);
    let m;
    while ((m = re.exec(code)) !== null) {
      let overlap = false;
      for (let p = m.index, end = m.index + m[0].length; p < end; p++) {
        if (colorMap.has(p)) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        for (let p = m.index, end = m.index + m[0].length; p < end; p++) {
          colorMap.set(p, color);
        }
      }
    }
  }

  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < code.length) {
    const color = colorMap.get(i);
    let j = i + 1;
    while (j < code.length && colorMap.get(j) === color) j++;
    const text = code.slice(i, j);
    if (color !== undefined) {
      nodes.push(<span key={i} style={{ color }}>{text}</span>);
    } else {
      nodes.push(<span key={i}>{text}</span>);
    }
    i = j;
  }

  return nodes;
}

const CodeHighlight: React.FC<CodeHighlightProps> = ({ code, language }) => {
  const [copied, setCopied] = React.useState(false);

  const lines = React.useMemo(() => code.replace(/\r\n/g, "\n").split("\n"), [code]);
  const showLineNumbers = lines.length > 3;
  const langLabel = React.useMemo(() => {
    const n = norm(language);
    return n || "text";
  }, [language]);

  const highlightedLines = React.useMemo(
    () => lines.map((line) => highlightCode(line, language)),
    [lines, language]
  );

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div
      style={{
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 8,
        margin: "8px 0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          borderBottom: "1px solid var(--proof-border)",
          background: "var(--proof-bg-elevated)",
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            color: "var(--proof-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontFamily: "var(--font-sans)",
          }}
        >
          {langLabel}
        </span>
        <button
          onClick={handleCopy}
          title="Copy code"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 7px",
            borderRadius: 5,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-hover-light)",
            cursor: "pointer",
            color: copied ? "#34d399" : "var(--proof-text-muted)",
            fontSize: 10.5,
            transition: "all 0.15s",
            fontFamily: "var(--font-sans)",
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div
        style={{
          overflowX: "auto",
          padding: "12px 0",
        }}
      >
        <div style={{ display: "flex", minWidth: "max-content" }}>
          {showLineNumbers && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                padding: "0 10px 0 12px",
                color: "var(--proof-text-muted)",
                opacity: 0.5,
                userSelect: "none",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                lineHeight: 1.6,
                borderRight: "1px solid var(--proof-border)",
              }}
            >
              {lines.map((_, i) => (
                <div key={i} style={{ lineHeight: 1.6 }}>{i + 1}</div>
              ))}
            </div>
          )}

          <div
            style={{
              padding: "0 12px",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              lineHeight: 1.6,
              color: "var(--proof-text)",
            }}
          >
            {highlightedLines.map((tokens, i) => (
              <div key={i} style={{ whiteSpace: "pre", minHeight: "1em", lineHeight: 1.6 }}>
                {tokens}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { CodeHighlight };
export default CodeHighlight;
