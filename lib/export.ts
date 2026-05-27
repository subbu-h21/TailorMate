import { TemplateLine } from '../types';

// 96 DPI: 1 cm = 37.795 px — so the SVG renders at true physical size when printed
const PRINT_CM_TO_PX = 37.795;

export function buildSVG(
  computed: Record<string, { x: number; y: number }>,
  lines: TemplateLine[],
  cmToPx: number = 10,
  title: string = 'Pattern',
  measurements: Record<string, number> = {},
): string {
  const entries = Object.values(computed);

  if (entries.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="white"/></svg>`;
  }

  const padding = 20;
  const xs = entries.map((p) => p.x * cmToPx);
  const ys = entries.map((p) => p.y * cmToPx);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const metaHeight = 56;
  const width = (maxX - minX) + padding * 2;
  const height = (maxY - minY) + padding * 2 + metaHeight;

  const lineElements = lines
    .map((line) => {
      const from = computed[line.from];
      const to = computed[line.to];
      if (!from || !to) return null;
      const x1 = ((from.x * cmToPx) - minX + padding).toFixed(2);
      const y1 = ((from.y * cmToPx) - minY + padding).toFixed(2);
      const x2 = ((to.x * cmToPx) - minX + padding).toFixed(2);
      const y2 = ((to.y * cmToPx) - minY + padding).toFixed(2);
      return `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>`;
    })
    .filter(Boolean)
    .join('\n');

  const w = width.toFixed(0);
  const h = height.toFixed(0);

  const scaleBarPx = (5 * cmToPx).toFixed(2);
  const barY = (height - metaHeight + 14).toFixed(2);
  const measureText = Object.entries(measurements)
    .map(([k, v]) => `${k}: ${v} cm`)
    .join('  |  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="white"/>
  <text x="${padding}" y="16" font-family="sans-serif" font-size="11" font-weight="bold" fill="#111">${title}</text>
${lineElements}
  <line x1="${padding}" y1="${barY}" x2="${padding + Number(scaleBarPx)}" y2="${barY}" stroke="#000" stroke-width="2"/>
  <line x1="${padding}" y1="${(Number(barY) - 5).toFixed(2)}" x2="${padding}" y2="${(Number(barY) + 5).toFixed(2)}" stroke="#000" stroke-width="1.5"/>
  <line x1="${padding + Number(scaleBarPx)}" y1="${(Number(barY) - 5).toFixed(2)}" x2="${padding + Number(scaleBarPx)}" y2="${(Number(barY) + 5).toFixed(2)}" stroke="#000" stroke-width="1.5"/>
  <text x="${(padding + Number(scaleBarPx) / 2).toFixed(2)}" y="${(Number(barY) - 8).toFixed(2)}" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#333">5 cm</text>
  <text x="${padding}" y="${(Number(barY) + 18).toFixed(2)}" font-family="sans-serif" font-size="8" fill="#555">Scale 1:1 — print at 100%, do not scale to fit</text>
  <text x="${padding}" y="${(Number(barY) + 34).toFixed(2)}" font-family="sans-serif" font-size="8" fill="#777">${measureText}</text>
</svg>`;
}

export function buildPrintHTML(
  computed: Record<string, { x: number; y: number }>,
  lines: TemplateLine[],
  title: string = 'Pattern',
  measurements: Record<string, number> = {},
): string {
  const svg = buildSVG(computed, lines, PRINT_CM_TO_PX, title, measurements);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    @page { margin: 0; }
    body { margin: 0; padding: 0; background: white; }
  </style>
</head>
<body>${svg}</body>
</html>`;
}
