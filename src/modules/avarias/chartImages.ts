// Helpers to render simple charts to PNG dataURLs for embedding in the PDF.
// Uses the HTML5 Canvas API directly to avoid extra dependencies.

import { formatCurrency } from "./utils";

export interface ChartDatum {
  name: string;
  valor: number;
  qtd?: number;
  color?: string;
}

const FONT = "12px Helvetica, Arial, sans-serif";
const TITLE_FONT = "bold 14px Helvetica, Arial, sans-serif";

function createCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = w * dpr;
  c.height = h * dpr;
  c.style.width = `${w}px`;
  c.style.height = `${h}px`;
  const ctx = c.getContext("2d")!;
  ctx.scale(dpr, dpr);
  return { canvas: c, ctx };
}

function shortMoney(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
}

export function renderBarChart(
  data: ChartDatum[],
  opts: { title?: string; width?: number; height?: number } = {},
): string {
  const W = opts.width ?? 900;
  const H = opts.height ?? 380;
  const { canvas, ctx } = createCanvas(W, H);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  if (opts.title) {
    ctx.fillStyle = "#1e293b";
    ctx.font = TITLE_FONT;
    ctx.textAlign = "left";
    ctx.fillText(opts.title, 16, 24);
  }

  const padding = { top: 40, right: 20, bottom: 80, left: 70 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;

  if (!data.length) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.fillText("Sem dados", W / 2, H / 2);
    return canvas.toDataURL("image/png");
  }

  const sorted = [...data].sort((a, b) => b.valor - a.valor).slice(0, 12);
  const max = Math.max(...sorted.map((d) => d.valor), 1);

  // Y axis grid + labels (4 lines)
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#64748b";
  ctx.font = "10px Helvetica, Arial, sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartH - (chartH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
    ctx.fillText(shortMoney((max * i) / 4), padding.left - 6, y + 3);
  }

  // Bars
  const gap = 8;
  const bw = (chartW - gap * (sorted.length - 1)) / sorted.length;
  sorted.forEach((d, i) => {
    const x = padding.left + i * (bw + gap);
    const h = (d.valor / max) * chartH;
    const y = padding.top + chartH - h;
    ctx.fillStyle = d.color || "#3b4ea8";
    ctx.fillRect(x, y, bw, h);

    // value above bar
    ctx.fillStyle = "#334155";
    ctx.font = "9px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(shortMoney(d.valor), x + bw / 2, y - 4);

    // x-axis label rotated
    ctx.save();
    ctx.translate(x + bw / 2, padding.top + chartH + 8);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = "#475569";
    ctx.font = "10px Helvetica, Arial, sans-serif";
    ctx.textAlign = "right";
    const label = d.name.length > 18 ? d.name.slice(0, 17) + "…" : d.name;
    ctx.fillText(label, 0, 4);
    ctx.restore();
  });

  return canvas.toDataURL("image/png");
}

export function renderPieChart(
  data: ChartDatum[],
  opts: { title?: string; width?: number; height?: number } = {},
): string {
  const W = opts.width ?? 900;
  const H = opts.height ?? 380;
  const { canvas, ctx } = createCanvas(W, H);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  if (opts.title) {
    ctx.fillStyle = "#1e293b";
    ctx.font = TITLE_FONT;
    ctx.textAlign = "left";
    ctx.fillText(opts.title, 16, 24);
  }

  if (!data.length) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.fillText("Sem dados", W / 2, H / 2);
    return canvas.toDataURL("image/png");
  }

  const total = data.reduce((s, d) => s + d.valor, 0) || 1;
  const cx = 200;
  const cy = H / 2 + 10;
  const radius = 130;
  const inner = 65;

  let start = -Math.PI / 2;
  data.forEach((d) => {
    const angle = (d.valor / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = d.color || "#94a3b8";
    ctx.fill();
    start += angle;
  });

  // donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Legend
  let ly = 60;
  ctx.textAlign = "left";
  ctx.font = FONT;
  data.forEach((d) => {
    const pct = ((d.valor / total) * 100).toFixed(1);
    ctx.fillStyle = d.color || "#94a3b8";
    ctx.fillRect(380, ly - 10, 14, 14);
    ctx.fillStyle = "#1e293b";
    ctx.fillText(`${d.name}`, 402, ly);
    ctx.fillStyle = "#64748b";
    ctx.fillText(`${formatCurrency(d.valor)} · ${pct}%`, 402, ly + 16);
    ly += 38;
  });

  return canvas.toDataURL("image/png");
}

export async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
