import { useMemo } from 'react';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return <div className="markdown text-slate-300" dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderMarkdown(md: string): string {
  let html = md;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (triple backtick)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Tables
  html = renderTables(html);

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />');

  // Lists
  html = renderLists(html);

  // Paragraphs (lines not already wrapped)
  html = html
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (/^<(h[1-3]|ul|ol|pre|blockquote|hr|table|thead|tbody|tr|th|td)/.test(trimmed)) return line;
      if (trimmed.startsWith('<li>') || trimmed.startsWith('</')) return line;
      return `<p>${line}</p>`;
    })
    .join('\n');

  // Clean up extra newlines
  html = html.replace(/\n{2,}/g, '\n\n');

  return html;
}

function renderTables(html: string): string {
  const tableRegex = /(?:^\|.*\|\n)+/gm;
  return html.replace(tableRegex, (tableBlock) => {
    const lines = tableBlock.trim().split('\n');
    if (lines.length < 2) return tableBlock;

    const header = lines[0].split('|').map((c) => c.trim()).filter(Boolean);
    const separator = lines[1];
    if (!separator.includes('-')) return tableBlock;

    const rows = lines.slice(2).map((line) =>
      line.split('|').map((c) => c.trim()).filter(Boolean)
    );

    let table = '<table><thead><tr>';
    header.forEach((h) => { table += `<th>${h}</th>`; });
    table += '</tr></thead><tbody>';
    rows.forEach((row) => {
      table += '<tr>';
      row.forEach((cell) => { table += `<td>${cell}</td>`; });
      table += '</tr>';
    });
    table += '</tbody></table>';
    return table;
  });
}

function renderLists(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const ulMatch = line.match(/^- (.+)$/);
    const olMatch = line.match(/^\d+\. (.+)$/);

    if (ulMatch) {
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) { result.push('<ul>'); inUl = true; }
      result.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) { result.push('<ol>'); inOl = true; }
      result.push(`<li>${olMatch[1]}</li>`);
    } else {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(line);
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('\n');
}
