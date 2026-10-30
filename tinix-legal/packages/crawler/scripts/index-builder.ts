/**
 * Structured Legal Index Builder
 *
 * Parse markdown from LLM output → JSON tree (TOC) + inline TOC block.
 * Supports hierarchy: Phần → Chương → Mục → Điều → Khoản → Điểm
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TOCNode {
  level: number;
  type: 'part' | 'chapter' | 'section' | 'article' | 'clause' | 'point';
  label: string;
  title: string;
  anchor: string;
  children: TOCNode[];
}

export interface TOCResult {
  id: string;
  title: string;
  nodes: TOCNode[];
  flatList: string[];
}

function detectType(level: number, text: string): TOCNode['type'] {
  const upper = text.toUpperCase();
  if (upper.includes('PHẦN')) return 'part';
  if (upper.includes('CHƯƠNG')) return 'chapter';
  if (upper.includes('MỤC')) return 'section';
  if (/^(ĐIỀU|Điều)\s+\d+/.test(text)) return 'article';
  if (/^\d+[\.\)]/.test(text)) return 'clause';
  if (/^[a-z][\)\/]/.test(text)) return 'point';
  if (level <= 1) return 'part';
  if (level <= 2) return 'chapter';
  if (level <= 3) return 'section';
  return 'article';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60);
}

/**
 * Parse structured markdown → TOC tree
 */
export function parseTOC(id: string, markdown: string, title: string): TOCResult {
  const lines = markdown.split('\n');
  const nodes: TOCNode[] = [];
  const stack: { node: TOCNode; indent: number }[] = [];
  const flatList: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let level = 0;
    let label = '';
    let content = '';

    // Heading patterns
    const h2Match = trimmed.match(/^##\s+(.+)/);
    const h3Match = trimmed.match(/^###\s+(.+)/);
    const h4Match = trimmed.match(/^####\s+(.+)/);
    const boldArticleMatch = trimmed.match(/^\*\*(Điều\s+\d+[\.,:]?)\*\*(.*)/);
    const boldMatch = trimmed.match(/^\*\*([^*]+)\*\*/);

    if (h2Match) { level = 1; label = h2Match[1]; content = label; }
    else if (h3Match) { level = 2; label = h3Match[1]; content = label; }
    else if (h4Match) { level = 3; label = h4Match[1]; content = label; }
    else if (boldArticleMatch) { level = 4; label = boldArticleMatch[1]; content = (boldArticleMatch[1] + ' ' + boldArticleMatch[2]).trim(); }
    else if (boldMatch) {
      // Check if it looks like a heading (short, all caps or starts with CHỈ THỊ/NGHỊ ĐỊNH/etc)
      const t = boldMatch[1].trim();
      if (t.length < 80 && (t === t.toUpperCase() || /^(CHỈ|NGHỊ|QUYẾT|THÔNG|LUẬT|PHÁP)/.test(t))) {
        level = 1; label = t; content = t;
      }
    }

    if (level > 0 && label) {
      const anchor = slugify(label);
      const type = detectType(level, label);
      const node: TOCNode = { level, type, label: label.split(/[:.][\s]*/)[0], title: content, anchor, children: [] };

      // Find parent in stack
      while (stack.length > 0 && stack[stack.length - 1].indent >= level) {
        stack.pop();
      }
      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(node);
      } else {
        nodes.push(node);
      }
      stack.push({ node, indent: level });
      flatList.push(`- [${content}](#${anchor})`);
    }
  }

  return { id, title, nodes, flatList };
}

/**
 * Generate inline TOC block for markdown
 */
export function generateTOCBlock(toc: TOCResult): string {
  const lines = ['<!-- TOC -->'];
  for (const item of toc.flatList) {
    lines.push(item);
  }
  lines.push('<!-- /TOC -->');
  return lines.join('\n');
}

/**
 * Generate .toc.json content
 */
export function generateTOCJSON(toc: TOCResult): string {
  return JSON.stringify(toc, null, 2);
}

// CLI
const isMain = process.argv[1]?.endsWith('index-builder.ts') || process.argv[1]?.endsWith('index-builder.js');
if (isMain) {
  const markdownFile = process.argv[2];
  const id = process.argv[3] || 'unknown';
  if (!markdownFile) {
    console.error('Usage: npx tsx scripts/index-builder.ts <structured.md> [id]');
    process.exit(1);
  }
  const md = fs.readFileSync(markdownFile, 'utf-8');
  const toc = parseTOC(id, md, path.basename(markdownFile));
  console.log(generateTOCJSON(toc));
}
