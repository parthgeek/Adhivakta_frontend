"use client";

/**
 * Dependency-free markdown renderer for NyaAI answers.
 * Supports: headings, bold/italic, inline code, code blocks, bullet/numbered
 * lists, tables, blockquotes, horizontal rules, links.
 */

function renderInline(text, keyBase = "i") {
  const parts = [];
  // links, bold, italic, inline code
  const rx = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let last = 0;
  let m;
  let k = 0;
  while ((m = rx.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) {
      parts.push(
        <a
          key={`${keyBase}-${k++}`}
          href={m[3]}
          className="font-medium text-primary underline underline-offset-2"
          target={m[3].startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
        >
          {m[2]}
        </a>
      );
    } else if (m[4]) {
      parts.push(<strong key={`${keyBase}-${k++}`}>{m[5]}</strong>);
    } else if (m[6]) {
      parts.push(<em key={`${keyBase}-${k++}`}>{m[7]}</em>);
    } else if (m[8]) {
      parts.push(
        <code
          key={`${keyBase}-${k++}`}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        >
          {m[9]}
        </code>
      );
    }
    last = rx.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Table({ rows, keyBase }) {
  const [header, ...body] = rows;
  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {header.map((c, i) => (
              <th key={`${keyBase}-h-${i}`} className="px-3 py-2 text-left font-semibold">
                {renderInline(c, `${keyBase}-h-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={`${keyBase}-r-${ri}`} className="border-t border-border/50">
              {r.map((c, ci) => (
                <td key={`${keyBase}-r-${ri}-${ci}`} className="px-3 py-2 align-top">
                  {renderInline(c, `${keyBase}-r-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Markdown({ text = "" }) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (line.trimStart().startsWith("```")) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push(
        <pre
          key={`b-${key++}`}
          className="my-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed"
        >
          {code.join("\n")}
        </pre>
      );
      continue;
    }

    // table
    if (line.includes("|") && lines[i + 1] && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const rows = [];
      const parseRow = (l) =>
        l
          .replace(/^\s*\|/, "")
          .replace(/\|\s*$/, "")
          .split("|")
          .map((c) => c.trim());
      rows.push(parseRow(line));
      i += 2;
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push(<Table key={`b-${key++}`} rows={rows} keyBase={`t-${key}`} />);
      continue;
    }

    // list (bullet or numbered)
    const bullet = /^\s*[-*•]\s+(.*)/.exec(line);
    const numbered = /^\s*(\d+)[.)]\s+(.*)/.exec(line);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items = [];
      while (i < lines.length) {
        const b = /^\s*[-*•]\s+(.*)/.exec(lines[i]);
        const n = /^\s*(\d+)[.)]\s+(.*)/.exec(lines[i]);
        if (ordered && n) items.push(n[2]);
        else if (!ordered && b) items.push(b[1]);
        else break;
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List
          key={`b-${key++}`}
          className={
            ordered
              ? "my-1.5 list-decimal space-y-1 pl-5"
              : "my-1.5 list-disc space-y-1 pl-5"
          }
        >
          {items.map((it, ii) => (
            <li key={`li-${key}-${ii}`}>{renderInline(it, `li-${key}-${ii}`)}</li>
          ))}
        </List>
      );
      continue;
    }

    // heading
    const h = /^(#{1,4})\s+(.*)/.exec(line);
    if (h) {
      const level = h[1].length;
      const cls =
        level === 1
          ? "mb-1 mt-3 text-base font-bold"
          : level === 2
          ? "mb-1 mt-3 text-[0.95rem] font-bold"
          : "mb-0.5 mt-2.5 text-sm font-semibold";
      blocks.push(
        <p key={`b-${key++}`} className={cls}>
          {renderInline(h[2], `h-${key}`)}
        </p>
      );
      i++;
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={`b-${key++}`}
          className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground"
        >
          {renderInline(quote.join(" "), `q-${key}`)}
        </blockquote>
      );
      continue;
    }

    // horizontal rule
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      blocks.push(<hr key={`b-${key++}`} className="my-3 border-border/60" />);
      i++;
      continue;
    }

    // blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // paragraph (merge consecutive plain lines)
    const para = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*([-*•]|\d+[.)]|#{1,4}\s|>|```|---)/.test(lines[i]) &&
      !lines[i].includes("|")
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={`b-${key++}`} className="my-1.5">
        {renderInline(para.join(" "), `p-${key}`)}
      </p>
    );
  }

  return <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{blocks}</div>;
}
